import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';

interface Service {
  id: string;
  durationMinutes?: number | null;
  price: number;
  name: string;
  status: string;
  [key: string]: any;
}

type CheckoutInput = { serviceId: string; name: string; phone: string; email: string; date: string; time: string; notes?: string };
type FlowStatus = { commerceOrder: string; flowOrder: number; status: number; amount: number; currency: string };
type Tx = PrismaService | any;
const LOCK = 6139271;
const HOLD_MS = 15 * 60 * 1000;

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}
  private get zone() { return process.env.BOOKING_TIMEZONE || 'America/Santiago'; }
  private get durationDefault() { const n = Number(process.env.BOOKING_DEFAULT_DURATION_MINUTES || 60); if (!Number.isInteger(n) || n < 1 || n > 480) throw new ServiceUnavailableException('Duración de servicio no configurada'); return n; }
  private get interval() { const n = Number(process.env.BOOKING_SLOT_INTERVAL_MINUTES || 30); if (!Number.isInteger(n) || n < 5 || n > 120) throw new ServiceUnavailableException('Intervalo de agenda no configurado'); return n; }
  private duration(service: Pick<Service, 'durationMinutes'>) { const n = service.durationMinutes ?? this.durationDefault; if (!Number.isInteger(n) || n < 1 || n > 480) throw new ServiceUnavailableException('Duración de servicio inválida'); return n; }
  private async lock(tx: Tx) { await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK})`; }
  private parseDay(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Fecha inválida');
    const day = DateTime.fromISO(date, { zone: this.zone }).startOf('day');
    if (!day.isValid || day.toISODate() !== date) throw new BadRequestException('Fecha inválida');
    return day;
  }
  private async service(id: string, tx: Tx | PrismaService = this.prisma) {
    const service = await tx.service.findFirst({ where: { id, status: 'PUBLISHED' } });
    if (!service || service.price <= 0) throw new BadRequestException('Servicio no disponible');
    return service;
  }
  private async slots(service: Service, date: string, tx: Tx | PrismaService = this.prisma) {
    const day = this.parseDay(date);
    const hours = await tx.businessHour.findUnique({ where: { dayOfWeek: day.weekday } });
    if (!hours || hours.isClosed || !/^\d{2}:\d{2}$/.test(hours.opensAt) || !/^\d{2}:\d{2}$/.test(hours.closesAt)) return [];
    const opening = DateTime.fromISO(`${date}T${hours.opensAt}`, { zone: this.zone });
    const closing = DateTime.fromISO(`${date}T${hours.closesAt}`, { zone: this.zone });
    if (!opening.isValid || !closing.isValid || opening.toFormat('HH:mm') !== hours.opensAt || closing.toFormat('HH:mm') !== hours.closesAt || closing <= opening) return [];
    const now = new Date();
    // Legacy bookings without an end use their service duration. Limit lookback to a full day.
    const bookings = await tx.booking.findMany({ where: { scheduledAt: { gte: day.minus({ days: 1 }).toJSDate(), lt: day.plus({ days: 1 }).toJSDate() }, OR: [{ status: { in: ['CONFIRMED', 'COMPLETED', 'NO_SHOW'] } }, { status: 'PENDING', OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now }, paymentStatus: { in: ['CREATING', 'PENDING'] } }] }] }, include: { service: true } });
    const occupied = bookings.map((b: any) => ({ start: b.scheduledAt!.getTime(), end: b.endsAt?.getTime() ?? b.scheduledAt!.getTime() + this.duration(b.service) * 60000 }));
    const result: { time: string; available: boolean }[] = [];
    for (let start = opening; start.plus({ minutes: this.duration(service) }) <= closing; start = start.plus({ minutes: this.interval })) {
      const ms = start.toMillis(); const end = ms + this.duration(service) * 60000;
      result.push({ time: start.toFormat('HH:mm'), available: ms > now.getTime() && !occupied.some((b: any) => ms < b.end && end > b.start) });
    }
    return result;
  }
  async availability(serviceId: string, date: string) { return this.slots(await this.service(serviceId), date); }
  private flowConfig() {
    const apiKey = process.env.FLOW_API_KEY; const secret = process.env.FLOW_SECRET_KEY;
    const apiOrigin = process.env.API_PUBLIC_URL; const webOrigin = process.env.WEB_PUBLIC_URL;
    const base = process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api';
    if (!apiKey || !secret || !apiOrigin || !webOrigin || !['https://sandbox.flow.cl/api', 'https://www.flow.cl/api'].includes(base)) throw new ServiceUnavailableException('Pago con Flow no está configurado');
    const callback = new URL('/payments/flow/confirmation', apiOrigin); const returnUrl = new URL('/payments/flow/return', apiOrigin);
    if (callback.protocol !== 'https:' || returnUrl.protocol !== 'https:') throw new ServiceUnavailableException('Flow requiere una URL pública HTTPS');
    return { apiKey, secret, base, callback: callback.toString(), returnUrl: returnUrl.toString() };
  }
  private signature(params: Record<string, string>, secret: string) { const value = Object.keys(params).sort().map(key => key + params[key]).join(''); return createHmac('sha256', secret).update(value).digest('hex'); }
  private async flowRequest<T>(path: string, values: Record<string, string>, method: 'GET' | 'POST'): Promise<T> {
    const config = this.flowConfig(); const params = { apiKey: config.apiKey, ...values }; const body = new URLSearchParams({ ...params, s: this.signature(params, config.secret) });
    const url = `${config.base}${path}${method === 'GET' ? `?${body}` : ''}`;
    let response: Response;
    try { response = await fetch(url, { method, ...(method === 'POST' ? { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body } : {}), signal: AbortSignal.timeout(15000) }); }
    catch { throw new ServiceUnavailableException('No fue posible conectar con Flow'); }
    if (!response.ok) throw new ServiceUnavailableException('Flow no pudo procesar la solicitud');
    return await response.json() as T;
  }
  async checkout(input: CheckoutInput) {
    const config = this.flowConfig();
    if (!input.name?.trim() || input.name.length > 120 || !input.phone?.trim() || input.phone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254 || (input.notes?.length ?? 0) > 1000 || !/^\d{2}:\d{2}$/.test(input.time || '')) throw new BadRequestException('Revisa tus datos');
    const day = this.parseDay(input.date);
    const scheduled = DateTime.fromISO(`${input.date}T${input.time}`, { zone: this.zone });
    if (!scheduled.isValid || scheduled.toISODate() !== input.date || scheduled.toFormat('HH:mm') !== input.time || day < DateTime.now().setZone(this.zone).startOf('day')) throw new BadRequestException('Fecha u hora inválida');
    const booking = await this.prisma.$transaction(async tx => {
      await this.lock(tx);
      const service = await this.service(input.serviceId, tx);
      const slot = (await this.slots(service, input.date, tx)).find(s => s.time === input.time && s.available);
      if (!slot) throw new ConflictException('Esta hora ya no está disponible. Elige otra.');
      const customer = await tx.customer.create({ data: { name: input.name.trim(), phone: input.phone.trim(), email: input.email.trim() } });
      return tx.booking.create({ data: { customerId: customer.id, serviceId: service.id, scheduledAt: scheduled.toJSDate(), endsAt: scheduled.plus({ minutes: this.duration(service) }).toJSDate(), holdExpiresAt: new Date(Date.now() + HOLD_MS), depositAmount: Math.ceil(service.price / 2), paymentStatus: 'CREATING', notes: input.notes?.trim() }, include: { service: true } });
    });
    // Flow's expiry is shorter than the hold, including a safety margin for network latency.
    const seconds = Math.floor((booking.holdExpiresAt!.getTime() - Date.now()) / 1000) - 45;
    if (seconds < 60) throw new ServiceUnavailableException('No se pudo iniciar el pago a tiempo');
    const order = await this.flowRequest<{ url: string; token: string; flowOrder: number }>('/payment/create', { commerceOrder: booking.id, subject: `Reserva ManuBarber: ${booking.service.name}`, currency: 'CLP', amount: String(booking.depositAmount), email: input.email.trim(), urlConfirmation: config.callback, urlReturn: config.returnUrl, timeout: String(seconds) }, 'POST');
    const target = new URL(order.url);
    if (target.protocol !== 'https:' || !['www.flow.cl', 'flow.cl', 'sandbox.flow.cl'].includes(target.hostname) || !order.token) throw new ServiceUnavailableException('Respuesta de Flow inválida');
    await this.prisma.booking.updateMany({ where: { id: booking.id, paymentStatus: 'CREATING' }, data: { flowToken: order.token, flowOrder: String(order.flowOrder), paymentStatus: 'PENDING' } });
    target.searchParams.set('token', order.token);
    return { checkoutUrl: target.toString(), expiresAt: booking.holdExpiresAt! };
  }
  async processFlow(token: string) {
    if (!token || token.length > 512) throw new BadRequestException('Token inválido');
    const status = await this.flowRequest<FlowStatus>('/payment/getStatus', { token }, 'GET');
    if (!status.commerceOrder || ![1, 2, 3, 4].includes(status.status)) throw new BadRequestException('Respuesta de Flow inválida');
    return this.prisma.$transaction(async tx => {
      await this.lock(tx);
      const booking = await tx.booking.findUnique({ where: { id: status.commerceOrder } });
      if (!booking || (booking.flowToken && booking.flowToken !== token) || booking.depositAmount !== Number(status.amount) || status.currency !== 'CLP') throw new BadRequestException('La orden no coincide');
      if (booking.paymentStatus === 'PAID' || booking.paymentStatus === 'REVIEW') return booking;
      if (status.status === 1) return booking;
      if (status.status !== 2) return tx.booking.update({ where: { id: booking.id }, data: { paymentStatus: status.status === 3 ? 'FAILED' : 'CANCELLED', flowToken: token, flowOrder: String(status.flowOrder) } });
      const start = booking.scheduledAt!; const end = booking.endsAt!;
      const others = await tx.booking.findMany({ where: { id: { not: booking.id }, scheduledAt: { gte: new Date(start.getTime() - 86400000), lt: end }, OR: [{ status: { in: ['CONFIRMED', 'COMPLETED', 'NO_SHOW'] } }, { status: 'PENDING', OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: new Date() }, paymentStatus: { in: ['CREATING', 'PENDING'] } }] }] }, include: { service: true } });
      const conflict = others.some((other: any) => (other.endsAt?.getTime() ?? other.scheduledAt!.getTime() + this.duration(other.service) * 60000) > start.getTime());
      const review = conflict || start <= new Date() || booking.status === 'CANCELLED';
      return tx.booking.update({ where: { id: booking.id }, data: { flowToken: token, flowOrder: String(status.flowOrder), paymentStatus: review ? 'REVIEW' : 'PAID', ...(review ? {} : { status: 'CONFIRMED' }) } });
    });
  }
  async publicStatus(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Reserva inválida');
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || !booking.paymentStatus) throw new BadRequestException('Reserva no encontrada');
    const expired = booking.holdExpiresAt && booking.holdExpiresAt <= new Date() && ['CREATING', 'PENDING'].includes(booking.paymentStatus);
    return { status: expired ? 'EXPIRED' : booking.paymentStatus, bookingStatus: booking.status };
  }
  async findByToken(token: string) {
    if (!token || token.length > 512) return null;
    return this.prisma.booking.findUnique({ where: { flowToken: token }, select: { id: true } });
  }
  async adminStatus(id: string, status: 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') {
    return this.prisma.$transaction(async tx => {
      await this.lock(tx);
      const booking = await tx.booking.findUniqueOrThrow({ where: { id } });
      if (status !== 'CANCELLED' && booking.status !== 'CONFIRMED') throw new BadRequestException('Solo puedes finalizar una reserva confirmada');
      return tx.booking.update({ where: { id }, data: { status } });
    });
  }
}
