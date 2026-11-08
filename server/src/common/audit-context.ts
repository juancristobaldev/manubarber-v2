import { AsyncLocalStorage } from 'node:async_hooks';

export type AuditContext = { actorId?: string; auditing?: boolean };

// The actor is set by AuthService.requireAdmin and is used by the Prisma audit
// middleware. Storing it per async request avoids passing it through every
// resolver call.
export const auditContext = new AsyncLocalStorage<AuditContext>();

export function currentAuditContext() {
  return auditContext.getStore();
}
