'use client';
import { useQuery } from '@apollo/client';
import { ADMIN_AUDIT, ADMIN_LEGACY_KEYS } from '@/lib/operations';

type Change = { field: string; valueType: string; oldValue?: string; newValue?: string };
type Entry = { id: string; action: string; entity: string; entityId: string; actorName?: string; createdAt: string; changes: Change[] };

export function AdminAudit({ token }: { token: string }) {
  const context = { headers: { authorization: `Bearer ${token}` } };
  const audit = useQuery<{ adminAudit: Entry[] }>(ADMIN_AUDIT, { context, variables: { take: 100 }, fetchPolicy: 'network-only' });
  const legacy = useQuery<{ legacySettingKeys: string[] }>(ADMIN_LEGACY_KEYS, { context, fetchPolicy: 'network-only' });
  return <section className="admin-audit"><div className="admin-section-heading"><div><h2>Auditoría</h2><p>Últimos 100 cambios administrativos, con valor anterior y nuevo por campo.</p></div><button onClick={() => audit.refetch()}>Actualizar</button></div>
    {audit.loading && <p role="status">Cargando auditoría…</p>}{audit.error && <p role="alert">No se pudo cargar la auditoría.</p>}
    <div className="admin-list">{audit.data?.adminAudit.map(entry => <article key={entry.id}><div><strong>{entry.entity} · {entry.action}</strong><p>{entry.actorName ?? 'Sistema'} · {new Date(entry.createdAt).toLocaleString('es-CL')} · Referencia: {entry.entityId}</p>{entry.changes.map(change => <p key={change.field}><code>{change.field}</code>: {change.oldValue ?? '—'} → {change.newValue ?? '—'} <small>({change.valueType})</small></p>)}</div></article>)}{!audit.data?.adminAudit.length && <p>Sin cambios registrados.</p>}</div>
    <h3>Claves heredadas en cuarentena</h3>{legacy.error && <p role="alert">No se pudieron cargar las claves heredadas.</p>}<div className="admin-list">{legacy.data?.legacySettingKeys.map(key => <article key={key}><div><strong>{key}</strong><p>Se conserva como nodos tipados para revisión manual; no se edita como JSON.</p></div></article>)}{legacy.data && !legacy.data.legacySettingKeys.length && <p>No hay claves heredadas pendientes.</p>}</div>
  </section>;
}
