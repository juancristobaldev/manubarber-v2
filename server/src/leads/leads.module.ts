import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadsResolver } from './leads.resolver';
import { BookingService } from './booking.service';
import { FlowController } from './flow.controller';
@Module({ imports: [AuthModule], providers: [LeadsResolver, BookingService], controllers: [FlowController] }) export class LeadsModule {}
