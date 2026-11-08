// INTEGRATION: real PostgreSQL/Prisma and production booking service; Flow is the external fake.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { PrismaService } from '../src/prisma/prisma.service';
import { BookingService } from '../src/leads/booking.service';

import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const database = process.env.TEST_DATABASE_URL;
  if (database && new URL(database).pathname.includes('_test_')) {
    process.env.DATABASE_URL = database;
  } else {
    const testDb = join(process.cwd(), 'data', 'test-booking.json');
    if (existsSync(testDb)) unlinkSync(testDb);
    process.env.JSON_DB_PATH = testDb;
  }
  process.env.FLOW_API_KEY = 'test-key'; process.env.FLOW_SECRET_KEY = 'test-secret';
  process.env.FLOW_API_URL = 'https://sandbox.flow.cl/api'; process.env.API_PUBLIC_URL = 'https://api.example.com'; process.env.WEB_PUBLIC_URL = 'https://web.example.com';
  const prisma = new PrismaService(); const service = new BookingService(prisma);
  const orders = new Map<string, { commerceOrder: string; amount: number; currency: string; status: number; flowOrder: number }>();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/payment/create')) {
      const body = new URLSearchParams(String(init?.body));
      const signature = body.get('s'); body.delete('s');
      const signed = [...body.keys()].sort().map(key => `${key}${body.get(key)}`).join('');
      assert.equal(signature, createHmac('sha256', 'test-secret').update(signed).digest('hex'));
      assert.equal(body.get('currency'), 'CLP'); assert.equal(body.get('amount'), '5001');
      assert.ok(Number(body.get('timeout')) <= 855); assert.equal(body.get('urlConfirmation'), 'https://api.example.com/payments/flow/confirmation');
      const order = body.get('commerceOrder')!; const token = `token-${order}`;
      orders.set(token, { commerceOrder: order, amount: 5001, currency: 'CLP', status: 1, flowOrder: orders.size + 1 });
      return Response.json({ url: 'https://sandbox.flow.cl/pay', token, flowOrder: orders.size });
    }
    const order = orders.get(url.searchParams.get('token')!);
    return order ? Response.json(order) : new Response('not found', { status: 404 });
  };
  try {
    const day = DateTime.now().setZone('America/Santiago').plus({ days: 20 + Math.floor(Math.random() * 3000) }).startOf('day');
    await prisma.businessHour.upsert({ where: { dayOfWeek: day.weekday }, update: { opensAt: '10:00', closesAt: '20:00', isClosed: false }, create: { dayOfWeek: day.weekday, opensAt: '10:00', closesAt: '20:00' } });
    const item = await prisma.service.create({ data: { slug: `test-${randomUUID()}`, name: 'Test', description: 'Test', price: 10001, durationMinutes: 60, status: 'PUBLISHED' } });
    const date = day.toISODate()!;
    const input = { serviceId: item.id, date, time: '10:00', name: 'Cliente', phone: '123456789', email: 'test@example.com' };
    assert.equal((await service.availability(item.id, date)).find(s => s.time === '10:00')?.available, true);
    const concurrent = await Promise.allSettled([service.checkout(input), service.checkout(input)]);
    assert.equal(concurrent.filter(x => x.status === 'fulfilled').length, 1, 'only one simultaneous hold');
    assert.equal(concurrent.filter(x => x.status === 'rejected').length, 1);
    assert.equal((await service.availability(item.id, date)).find(s => s.time === '10:30')?.available, false, 'overlapping duration blocked');
    const first = [...orders.entries()][0]; first[1].status = 2; first[1].amount = 1;
    await assert.rejects(service.processFlow(first[0]), 'mismatched amount must not confirm');
    first[1].amount = 5001;
    const paid = await service.processFlow(first[0]); assert.equal(paid.status, 'CONFIRMED'); assert.equal(paid.paymentStatus, 'PAID');
    assert.equal((await service.processFlow(first[0])).status, 'CONFIRMED', 'callback is idempotent');
    const next = await service.checkout({ ...input, time: '11:00' }); assert.ok(next.checkoutUrl.startsWith('https://sandbox.flow.cl/'));
    const second = [...orders.entries()][1];
    await prisma.booking.update({ where: { id: second[1].commerceOrder }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    await service.checkout({ ...input, time: '11:00' });
    second[1].status = 2;
    const late = await service.processFlow(second[0]); assert.equal(late.paymentStatus, 'REVIEW'); assert.notEqual(late.status, 'CONFIRMED', 'late payment must not double-book');
    const third = [...orders.entries()][2]; third[1].status = 3;
    await service.processFlow(third[0]);
    assert.equal((await service.availability(item.id, date)).find(s => s.time === '11:00')?.available, true, 'rejected payment releases hold');
    console.log('PASS: concurrency, overlap, deposit, paid callback, idempotency, expiry, late payment and rejection');
  } finally { globalThis.fetch = originalFetch; await prisma.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
