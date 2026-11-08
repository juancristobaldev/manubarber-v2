import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { existsSync, mkdirSync } from 'node:fs';
import { AppModule } from '../src/app.module';
import { auditContext } from '../src/common/audit-context';

let server: Express;
let appPromise: Promise<Express> | null = null;

async function bootstrapServer(): Promise<Express> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter);

  app.use((_request: unknown, _response: unknown, next: () => void) => auditContext.run({}, next));

  const allowedOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
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

  const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
  try {
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  } catch {
    // safe fallback
  }

  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
    immutable: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.init();
  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  if (!server) {
    if (!appPromise) {
      appPromise = bootstrapServer();
    }
    server = await appPromise;
  }
  return server(req, res);
}
