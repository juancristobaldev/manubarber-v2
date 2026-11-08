import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { auditContext } from './common/audit-context';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Every HTTP request gets a fresh, mutable audit store. AuthService fills the
  // actor on authorized requests and Prisma reads it for typed audit records.
  app.use((_request: unknown, _response: unknown, next: () => void) => auditContext.run({}, next));
  const allowedOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permite peticiones sin origin (curl, server-to-server, scripts)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // En desarrollo, permitir cualquier origen localhost / 127.0.0.1
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Permitir dominios de despliegue y preview en Vercel (*.vercel.app)
      if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origen ${origin} bloqueado por política de CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Apollo-Require-Preflight',
      'X-Requested-With',
      'Accept',
    ],
  });
  const serverBase = process.cwd().endsWith('/server') ? process.cwd() : join(process.cwd(), 'server');
  const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : join(serverBase, 'uploads'));
  try {
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  } catch {
    // safe fallback for read-only serverless filesystems
  }
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días de caché HTTP para imágenes inmutables
    immutable: true,
  });
  // GraphQL validates input fields against its schema; these code-first input classes
  // do not have class-validator decorators, so whitelist would reject every field.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(Number(process.env.PORT ?? 4000));
}
void bootstrap();
