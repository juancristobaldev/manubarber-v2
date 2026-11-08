import { Args, Context, Field, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
@ObjectType() class Booking { @Field() id!: string; @Field() status!: string; @Field() customerId!: string; @Field() serviceId!: string; @Field({ nullable: true }) scheduledAt?: Date; @Field({ nullable: true }) paymentStatus?: string; @Field({ nullable: true }) customerName?: string; @Field({ nullable: true }) customerPhone?: string; @Field({ nullable: true }) customerEmail?: string; @Field({ nullable: true }) serviceName?: string; @Field(() => Number, { nullable: true }) depositAmount?: number; }
@InputType() class CheckoutInput { @Field() name!: string; @Field() serviceId!: string; @Field() phone!: string; @Field() email!: string; @Field() date!: string; @Field() time!: string; @Field({ nullable: true }) notes?: string; }
@ObjectType() class Slot { @Field() time!: string; @Field() available!: boolean; }
@ObjectType() class Checkout { @Field() checkoutUrl!: string; @Field() expiresAt!: Date; }
@ObjectType() class PaymentResult { @Field() status!: string; @Field() bookingStatus!: string; }
@InputType() class ProductReservationInput { @Field() productId!: string; @Field() customerName!: string; @Field({ nullable: true }) phone?: string; @Field({ nullable: true }) notes?: string; }
@InputType() class MembershipLeadInput { @Field() planId!: string; @Field() name!: string; @Field({ nullable: true }) phone?: string; @Field({ nullable: true }) email?: string; }
@InputType() class CourseLeadInput { @Field() courseId!: string; @Field() name!: string; @Field({ nullable: true }) phone?: string; @Field({ nullable: true }) email?: string; }
@ObjectType() class Lead { @Field() id!: string; @Field() status!: string; @Field() createdAt!: Date; @Field({ nullable: true }) customerName?: string; @Field({ nullable: true }) phone?: string; @Field({ nullable: true }) email?: string; @Field({ nullable: true }) notes?: string; @Field({ nullable: true }) productName?: string; @Field({ nullable: true }) planName?: string; @Field({ nullable: true }) courseName?: string; }
@Resolver()
export class LeadsResolver {
  constructor(private prisma: PrismaService, private auth: AuthService, private bookingService: BookingService) {}
  private admin(ctx: any) { return this.auth.requireAdmin(ctx.req.headers.authorization); }
  @Query(() => [Slot]) availableSlots(@Args('serviceId') serviceId: string, @Args('date') date: string) { return this.bookingService.availability(serviceId, date); }
  @Query(() => PaymentResult) bookingPaymentStatus(@Args('id') id: string) { return this.bookingService.publicStatus(id); }
  @Mutation(() => Checkout) createBookingCheckout(@Args('input') input: CheckoutInput) { return this.bookingService.checkout(input); }
  @Mutation(() => Lead) createProductReservation(@Args('input') input: ProductReservationInput) { return this.prisma.productReservation.create({ data: input }); }
  @Mutation(() => Lead) async createMembershipLead(@Args('input') input: MembershipLeadInput) {
    const res = await this.prisma.membershipLead.create({ data: input });
    return { ...res, customerName: res.name };
  }
  @Mutation(() => Lead) async createCourseLead(@Args('input') input: CourseLeadInput) {
    const res = await this.prisma.courseLead.create({ data: input });
    return { ...res, customerName: res.name };
  }
  @Query(() => [Booking]) async bookings(@Context() ctx: any) {
    await this.admin(ctx);
    const bookings = await this.prisma.booking.findMany({ include: { customer: true, service: true }, orderBy: { createdAt: 'desc' }, take: 200 });
    return bookings.map(b => ({
      ...b,
      customerName: b.customer?.name || 'Cliente desconocido',
      customerPhone: b.customer?.phone,
      customerEmail: b.customer?.email,
      serviceName: b.service?.name || 'Servicio no disponible',
    }));
  }
  @Query(() => [Lead]) async productReservations(@Context() ctx: any) {
    await this.admin(ctx);
    const rows = await this.prisma.productReservation.findMany({ include: { product: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    return rows.map(row => ({ ...row, productName: row.product?.name || 'Producto no disponible' }));
  }
  @Query(() => [Lead]) async membershipLeads(@Context() ctx: any) {
    await this.admin(ctx);
    const rows = await this.prisma.membershipLead.findMany({ include: { plan: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    return rows.map(row => ({ ...row, customerName: row.name, planName: row.plan?.name || 'Plan no disponible' }));
  }
  @Query(() => [Lead]) async courseLeads(@Context() ctx: any) {
    await this.admin(ctx);
    const rows = await this.prisma.courseLead.findMany({ include: { course: { select: { title: true } } }, orderBy: { createdAt: 'desc' } });
    return rows.map(row => ({ ...row, customerName: row.name, courseName: row.course?.title || 'Curso no disponible' }));
  }
  @Mutation(() => Booking) async updateBookingStatus(@Args('id') id: string, @Args('status') status: string, @Context() ctx: any) {
    await this.admin(ctx);
    if (!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) throw new BadRequestException('Estado no permitido');
    return this.bookingService.adminStatus(id, status as 'COMPLETED' | 'CANCELLED' | 'NO_SHOW');
  }
  @Mutation(() => Lead) async updateLeadStatus(@Args('kind') kind: string, @Args('id') id: string, @Args('status') status: string, @Context() ctx: any) {
    await this.admin(ctx);
    if (!['NEW', 'CONTACTED', 'CONFIRMED', 'CLOSED', 'CANCELLED'].includes(status)) throw new BadRequestException('Estado no permitido');
    const value = status as 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED';
    if (kind === 'product') return this.prisma.productReservation.update({ where: { id }, data: { status: value } });
    if (kind === 'membership') {
      const row = await this.prisma.membershipLead.update({ where: { id }, data: { status: value } });
      return { ...row, customerName: row.name };
    }
    if (kind === 'course') {
      const row = await this.prisma.courseLead.update({ where: { id }, data: { status: value } });
      return { ...row, customerName: row.name };
    }
    throw new BadRequestException('Tipo de solicitud inválido');
  }
}
