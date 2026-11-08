import { BadRequestException, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

const serverBase = process.cwd().endsWith('/server') ? process.cwd() : join(process.cwd(), 'server');
const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : join(serverBase, 'uploads'));
try {
  mkdirSync(uploadDir, { recursive: true });
} catch {
  // safe fallback for read-only serverless filesystems
}
const allowed = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'],
  ['image/avif', '.avif'], ['image/gif', '.gif'],
]);

@Controller('uploads')
export class UploadController {
  constructor(private auth: AuthService, private prisma: PrismaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${allowed.get(file.mimetype) ?? extname(file.originalname)}`),
    }),
    limits: { fileSize: 15 * 1024 * 1024, files: 1 },
    fileFilter: (_request, file, callback) => allowed.has(file.mimetype)
      ? callback(null, true)
      : callback(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP, AVIF o GIF'), false),
  }))
  async upload(@UploadedFile() file: any, @Req() request: any) {
    try { await this.auth.requireAdmin(request.headers.authorization); }
    catch (error) { if (file?.path) unlinkSync(file.path); throw error; }
    if (!file) throw new BadRequestException('Archivo requerido');
    const base = (process.env.API_PUBLIC_URL?.replace(/\/$/, '')) || `${request.protocol}://${request.get('host')}`;
    const alt = String(request.body?.alt ?? '').trim() || file.originalname;
    const title = String(request.body?.title ?? '').trim() || null;
    return this.prisma.mediaAsset.create({
      data: { url: `${base}/uploads/${file.filename}`, alt, title, mimeType: file.mimetype },
    });
  }
}
