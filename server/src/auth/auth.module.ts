import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'manubarber-default-jwt-secret-key-super-secure', signOptions: { expiresIn: '8h' } })], providers: [AuthService, AuthResolver], exports: [AuthService] })
export class AuthModule {}
