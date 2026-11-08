import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentResolver } from './content.resolver';
@Module({ imports: [AuthModule], providers: [ContentResolver] }) export class ContentModule {}
