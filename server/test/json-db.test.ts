import 'reflect-metadata';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JsonDatabaseService } from '../src/json-db/json-db.service';
import { auditContext } from '../src/common/audit-context';

async function main() {
  const testDbPath = join(process.cwd(), 'data', 'test-db.json');
  if (existsSync(testDbPath)) unlinkSync(testDbPath);
  process.env.JSON_DB_PATH = testDbPath;

  console.log('1. Testing initialization and auto-seeding...');
  const db = new JsonDatabaseService();
  assert.ok(existsSync(testDbPath), 'test-db.json should be created');
  assert.ok(db.data.users.length > 0, 'Admin user should be seeded');
  assert.ok(db.data.pageHeroes.length === 3, '3 page heroes should be seeded');
  assert.ok(db.data.services.length === 3, '3 services should be seeded');
  assert.ok(db.data.mediaAssets.length > 0, 'Media assets with image paths should be seeded');
  console.log('✓ Auto-seeding verified');

  console.log('2. Testing image paths in JSON database...');
  const hero = await db.pageHero.findUnique({ where: { pageKey: 'HOME' } });
  assert.ok(hero, 'HOME hero should exist');
  assert.equal(hero.imageUrl, '/images/hero.jpg', 'Hero image URL should be stored in JSON');

  const newMedia = await db.mediaAsset.create({
    data: {
      url: '/uploads/custom-fade-123.jpg',
      alt: 'Fade Personalizado',
      title: 'Fade',
      mimeType: 'image/jpeg',
    },
  });
  assert.ok(newMedia.id, 'New media asset should have an id');
  assert.equal(newMedia.url, '/uploads/custom-fade-123.jpg');

  // Verify it is written to disk in JSON
  const fileContents = JSON.parse(readFileSync(testDbPath, 'utf8'));
  const foundInFile = fileContents.mediaAssets.find((m: any) => m.url === '/uploads/custom-fade-123.jpg');
  assert.ok(foundInFile, 'New media asset must be persisted in JSON file');
  console.log('✓ Image paths and uploads stored directly in JSON file');

  console.log('3. Testing queries, where, and orderBy...');
  const services = await db.service.findMany({ where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } });
  assert.equal(services.length, 3);
  assert.equal(services[0].sortOrder, 0);

  const singleService = await db.service.findUnique({ where: { slug: 'corte-barba' } });
  assert.equal(singleService.name, 'Corte + Barba');

  console.log('4. Testing relations and include...');
  const products = await db.product.findMany({ include: { variants: true } });
  assert.ok(products.length > 0);
  assert.ok(Array.isArray(products[0].variants), 'Product should have variants array');
  assert.ok(products[0].variants.length > 0, 'Variants should be populated');

  const galleryItems = await db.galleryItem.findMany({ include: { media: true, category: true } });
  assert.ok(galleryItems.length > 0);
  assert.ok(galleryItems[0].media?.url, 'GalleryItem should include media URL');
  assert.ok(galleryItems[0].category?.slug, 'GalleryItem should include category slug');

  console.log('5. Testing nested creates...');
  const createdProduct = await db.product.create({
    data: {
      slug: 'test-product',
      name: 'Test Product',
      price: 15000,
      variants: {
        create: [
          { label: '50ml', price: 15000, stockQuantity: 5 },
          { label: '100ml', price: 25000, stockQuantity: 3 },
        ],
      },
    },
    include: { variants: true },
  });
  assert.equal(createdProduct.variants.length, 2);

  console.log('6. Testing update and upsert...');
  const updatedHero = await db.pageHero.update({
    where: { pageKey: 'HOME' },
    data: { title: 'ESTILO ACTUALIZADO' },
  });
  assert.equal(updatedHero.title, 'ESTILO ACTUALIZADO');

  const upserted = await db.businessHour.upsert({
    where: { dayOfWeek: 1 },
    create: { dayOfWeek: 1, opensAt: '09:00', closesAt: '20:00', isClosed: false },
    update: { opensAt: '10:00', closesAt: '22:00' },
  });
  assert.equal(upserted.opensAt, '10:00');

  console.log('7. Testing transactions...');
  await db.$transaction(async (tx) => {
    await tx.service.create({
      data: { slug: 'tx-service', name: 'TX Service', description: 'desc', price: 5000, status: 'PUBLISHED' },
    });
  });
  const txFound = await db.service.findUnique({ where: { slug: 'tx-service' } });
  assert.ok(txFound);

  console.log('8. Testing audit logging...');
  const adminUser = db.data.users[0];
  await auditContext.run({ actorId: adminUser.id }, async () => {
    await db.service.update({
      where: { slug: 'tx-service' },
      data: { price: 6000 },
    });
  });
  assert.ok(db.data.auditLogs.length > 0, 'Audit log should be recorded');
  assert.ok(db.data.auditChanges.length > 0, 'Audit change should be recorded');

  console.log('9. Testing disk reload persistence...');
  const db2 = new JsonDatabaseService();
  const reloadedHero = await db2.pageHero.findUnique({ where: { pageKey: 'HOME' } });
  assert.equal(reloadedHero.title, 'ESTILO ACTUALIZADO', 'Modifications must persist across instances');

  // Clean up test file
  if (existsSync(testDbPath)) unlinkSync(testDbPath);
  delete process.env.JSON_DB_PATH;

  console.log('\n🎉 ALL JSON DATABASE TESTS PASSED WITH 100% SUCCESS!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
