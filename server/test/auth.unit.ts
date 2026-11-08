// UNIT: production authentication with an in-memory user lookup and real JWT/argon2.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const password = 'test-password';
  const user = { id: '11111111-1111-1111-1111-111111111111', email: 'admin@example.com', role: 'ADMIN', isActive: true, passwordHash: await argon2.hash(password) };
  const prisma = { user: { findUnique: async ({ where }: { where: { email?: string; id?: string } }) => (where.email === user.email || where.id === user.id) ? user : null } } as unknown as PrismaService;
  const jwt = new JwtService({ secret: 'isolated-unit-test-secret' });
  const auth = new AuthService(prisma, jwt);

  await assert.rejects(auth.login('missing@example.com', password));
  await assert.rejects(auth.login(user.email, 'wrong-password'));
  user.isActive = false;
  await assert.rejects(auth.login(user.email, password));
  user.isActive = true;
  const result = await auth.login(user.email, password);
  assert.equal(await auth.requireAdmin(`Bearer ${result.accessToken}`), user.id);
  await assert.rejects(auth.requireAdmin());
  await assert.rejects(auth.requireAdmin(result.accessToken));
  await assert.rejects(auth.requireAdmin('Bearer invalid-token'));
  const nonAdmin = await jwt.signAsync({ sub: user.id, role: 'USER' });
  await assert.rejects(auth.requireAdmin(`Bearer ${nonAdmin}`));
  const expired = await jwt.signAsync({ sub: user.id, role: 'ADMIN', exp: 1 });
  await assert.rejects(auth.requireAdmin(`Bearer ${expired}`));
  console.log('PASS: login and admin token checks');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
