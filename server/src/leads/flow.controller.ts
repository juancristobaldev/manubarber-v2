import { Body, Controller, HttpCode, Post, Redirect } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('payments/flow')
export class FlowController {
  constructor(private readonly bookings: BookingService) {}
  @Post('confirmation')
  @HttpCode(200)
  async confirmation(@Body('token') token: string) {
    await this.bookings.processFlow(token);
    return 'OK';
  }
  @Post('return')
  @Redirect()
  async returnFromFlow(@Body('token') token: string) {
    const url = new URL('/reserva/resultado', process.env.WEB_PUBLIC_URL || 'http://localhost:3001');
    try { const booking = await this.bookings.processFlow(token); url.searchParams.set('id', booking.id); }
    catch { const booking = await this.bookings.findByToken(token); if (booking) url.searchParams.set('id', booking.id); else url.searchParams.set('error', '1'); }
    return { url: url.toString() };
  }
}
