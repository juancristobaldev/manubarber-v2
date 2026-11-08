// INTEGRATION: HTTP -> real Nest GraphQL, auth, JsonDatabaseService (Prisma deprecated).
import 'reflect-metadata';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { print } from 'graphql';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module';
import { PrismaService } from '../dist/prisma/prisma.service';
import { ADMIN_AUDIT, ADMIN_CATALOG, ADMIN_LOGIN, ADMIN_OPERATIONS, ADMIN_SITE_CONTENT, CREATE_BOOKING_CHECKOUT, UPDATE_LEAD_STATUS } from '../../web/lib/operations';

async function main() {
  const testDb = join(process.cwd(), 'data', 'test-admin.json');
  if (existsSync(testDb)) unlinkSync(testDb);
  process.env.JSON_DB_PATH = testDb;

  let app: any;
  let url = process.env.TEST_GRAPHQL_URL;
  let prisma: PrismaService;

  if (!url) {
    app = await NestFactory.create(AppModule, { logger: false });
    const { auditContext } = await import('../dist/common/audit-context');
    app.use((_req: any, _res: any, next: any) => auditContext.run({}, next));
    await app.listen(0);
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address.port;
    url = `http://127.0.0.1:${port}/graphql`;
    prisma = app.get(PrismaService);
  } else {
    prisma = new PrismaService();
  }

  const email = `admin-${randomUUID()}@example.com`;
  const password = randomUUID();
  const request = async (query: string, variables: object = {}, token?: string) => {
    const response = await fetch(url!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ query, variables }),
    });
    return response.json() as Promise<{ data?: Record<string, any>; errors?: Array<{ message: string }> }>;
  };

  try {
    await prisma.user.create({ data: { email, displayName: 'Test', role: 'ADMIN', passwordHash: await argon2.hash(password) } });
    const forbidden = await request(print(ADMIN_CATALOG)); assert.ok(forbidden.errors, 'admin data requires authorization');
    assert.ok((await request(print(ADMIN_SITE_CONTENT))).errors, 'site content editing requires authorization');
    const login = await request(print(ADMIN_LOGIN), { email, password }); assert.ok(login.data?.adminLogin.accessToken, 'admin can authenticate');
    const token = login.data!.adminLogin.accessToken as string;
    const slug = `test-${randomUUID()}`;
    const input = { slug, name: 'Prueba admin', description: 'Descripción', price: 12345, durationMinutes: 60, status: 'DRAFT', isFeatured: false, sortOrder: 0 };
    const created = await request(print(ADMIN_OPERATIONS.createService), { input }, token); assert.ok(created.data?.createService.id, JSON.stringify(created.errors));
    const id = created.data!.createService.id;
    const snapshot = await request(print(ADMIN_CATALOG), {}, token); assert.ok(snapshot.data?.adminCatalog.services.some((s: { id: string; status: string }) => s.id === id && s.status === 'DRAFT'), 'admin sees draft');
    const publicData = await request('query { services { id } }'); assert.ok(!publicData.data?.services.some((s: { id: string }) => s.id === id), 'draft stays private');
    const changed = await request(print(ADMIN_OPERATIONS.updateService), { id, input: { ...input, status: 'PUBLISHED', price: 15000 } }, token); assert.ok(changed.data?.updateService, JSON.stringify(changed.errors));
    const checkout = await request(print(CREATE_BOOKING_CHECKOUT), { input: { serviceId: id, name: 'Test', phone: '123456789', email: 'test@example.com', date: '2030-01-01', time: '10:00' } });
    assert.ok(checkout.errors?.some(e => e.message.includes('Flow no está configurado')), 'checkout fields must pass validation and fail closed without Flow configuration');
    const published = await request('query { services { id price } }'); assert.ok(published.data?.services.some((s: { id: string; price: number }) => s.id === id && s.price === 15000));
    const productInput = { slug: `test-${randomUUID()}`, name: 'Producto formulario', status: 'DRAFT', stockQuantity: 5, variants: [{ label: '30ml', price: 6000, stockQuantity: 5 }], isFeatured: false, sortOrder: 0 };
    const createdProduct = await request(print(ADMIN_OPERATIONS.createProduct), { input: productInput }, token); assert.ok(createdProduct.data?.createProduct.id, JSON.stringify(createdProduct.errors));
    const productId = createdProduct.data!.createProduct.id;
    const changedProduct = await request(print(ADMIN_OPERATIONS.updateProduct), { id: productId, input: { ...productInput, variants: [{ label: '100ml', price: 12000, stockQuantity: 2 }] } }, token); assert.ok(changedProduct.data?.updateProduct, JSON.stringify(changedProduct.errors));
    const variant = await prisma.productVariant.findFirst({ where: { productId } }); assert.equal(variant.label, '100ml'); assert.equal(variant.price, 12000);

    // Typed editorial content replaces the removed JSON settings editor.
    const hero = await request(print(ADMIN_OPERATIONS.upsertPageHero), { input: { pageKey: 'HOME', title: 'Título tipado', description: 'Descripción tipada', imageUrl: '/images/hero.jpg', ctaLabel: 'Reservar', ctaHref: '#reserva' } }, token);
    assert.ok(hero.data?.upsertPageHero, JSON.stringify(hero.errors));
    const comparison = await request(print(ADMIN_OPERATIONS.upsertVipComparison), { input: { visits: 4, individualPrice: 10000, vipPrice: 35000 } }, token);
    assert.equal(comparison.data?.upsertVipComparison.standardTotal, 40000); assert.equal(comparison.data?.upsertVipComparison.savings, 5000);
    const content = await request(print(ADMIN_SITE_CONTENT), {}, token);
    assert.equal(content.data?.adminSiteContent.homeHero.title, 'Título tipado', 'typed content is persisted');
    assert.equal(content.data?.adminSiteContent.vipComparison.visits, 4);
    assert.ok(content.data?.adminSiteContent.profile.name, 'non-destructive content is still available');
    const publicContent = await request('query { siteContent { homeHero { title } profile { name } } }');
    assert.equal(publicContent.data?.siteContent.homeHero.title, 'Título tipado', 'public pages read the typed content');
    const invalidHero = await request(print(ADMIN_OPERATIONS.upsertPageHero), { input: { pageKey: 'OTHER', title: 'X', description: 'Y' } }, token);
    assert.ok(invalidHero.errors, 'unknown page keys are rejected');

    const invalidHours = await request(print(ADMIN_OPERATIONS.upsertBusinessHour), { input: { dayOfWeek: 1, opensAt: '21:00', closesAt: '10:00', isClosed: false } }, token); assert.ok(invalidHours.errors, 'invalid hours rejected');
    const product = await prisma.product.create({ data: { slug: `test-${randomUUID()}`, name: 'Producto test' } });
    const lead = await prisma.productReservation.create({ data: { productId: product.id, customerName: 'Cliente test', phone: '123' } });
    const update = await request(print(UPDATE_LEAD_STATUS), { kind: 'product', id: lead.id, status: 'CONTACTED' }, token); assert.equal(update.data?.updateLeadStatus.status, 'CONTACTED');
    const wrong = await request(print(UPDATE_LEAD_STATUS), { kind: 'product', id: lead.id, status: 'anything' }, token); assert.ok(wrong.errors, 'unknown status rejected');
    const audit = await request(print(ADMIN_AUDIT), { take: 50 }, token);
    assert.ok(audit.data?.adminAudit.some((entry: { entity: string }) => entry.entity === 'Service'), 'changes are stored as typed audit entries');
    assert.ok(audit.data.adminAudit.every((entry: { changes: Array<{ field: string }> }) => entry.changes.every(change => typeof change.field === 'string')), 'audit entries expose typed field changes');
    await prisma.user.update({ where: { email }, data: { isActive: false } });
    assert.ok((await request(print(ADMIN_CATALOG), {}, token)).errors, 'deactivated admin token is rejected');
    await prisma.user.update({ where: { email }, data: { isActive: true, role: 'EDITOR' } });
    assert.ok((await request(print(ADMIN_CATALOG), {}, token)).errors, 'demoted admin token is rejected');
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    assert.ok((await request(print(ADMIN_CATALOG), {}, token)).data?.adminCatalog, 'active admin token remains valid');
    console.log('PASS: authorization, typed content, drafts, publish/update, audit and lead status via real GraphQL & JsonDatabaseService');
  } finally {
    if (app) await app.close();
    if (existsSync(testDb)) unlinkSync(testDb);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
