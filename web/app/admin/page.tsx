'use client';
import { FormEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADMIN_LOGIN } from '@/lib/operations';
import { AdminBookings } from '@/components/admin-bookings';
import { AdminContent } from '@/components/admin-content';
import { AdminSiteContent } from '@/components/admin-site-content';
import { AdminAudit } from '@/components/admin-audit';

const TABS = [
  ['agenda', '📅 Agenda y citas'],
  ['contenido', '🎨 Contenido del sitio'],
  ['catalogo', '✂️ Catálogo y Negocio'],
  ['auditoria', '🛡️ Auditoría'],
] as const;

export default function Admin() {
  const [login, { loading }] = useMutation(ADMIN_LOGIN);
  const [token, setToken] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manubarber_admin_token') || undefined;
    }
    return undefined;
  });
  const [tab, setTab] = useState<string>('contenido');
  const [message, setMessage] = useState('');

  const updateToken = (newToken?: string) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      if (newToken) sessionStorage.setItem('manubarber_admin_token', newToken);
      else sessionStorage.removeItem('manubarber_admin_token');
    }
  };

  async function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const result = await login({ variables: { email: form.get('email'), password: form.get('password') } });
      updateToken(result.data.adminLogin.accessToken);
      setMessage('');
    } catch {
      setMessage('No fue posible iniciar sesión. Revisa tus credenciales y la conexión.');
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/images/manu-logo.png" alt="ManuBarber Logo" className="admin-brand-logo" />
          <div className="admin-brand-info">
            <h1>ManuBarber Admin</h1>
            <p>Street & Premium Console</p>
          </div>
        </div>

        {token && (
          <nav aria-label="Áreas de administración" className="admin-topbar-nav">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`admin-nav-btn ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}

        <div className="admin-user-actions">
          {token && (
            <>
              <div className="admin-user-pill">
                <span className="admin-user-dot" />
                <span>Sesión activa</span>
              </div>
              <button type="button" className="btn-logout" onClick={() => updateToken(undefined)}>
                <i className="fa-solid fa-arrow-right-from-bracket" /> Cerrar sesión
              </button>
            </>
          )}
        </div>
      </header>

      <main className="admin-view-body">
        {!token ? (
          <form className="admin-editor admin-login" onSubmit={authenticate}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img src="/images/manu-logo.png" alt="Logo" style={{ height: '60px', margin: '0 auto' }} />
              <h2 style={{ marginTop: '0.75rem', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Ingreso Administrador</h2>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Gestión de contenidos, agenda y catálogo (Base de datos JSON)</p>
            </div>
            <label>
              Email
              <input name="email" type="email" autoComplete="username" required defaultValue="admin@manubarber.cl" placeholder="admin@manubarber.cl" />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
            </label>
            <button disabled={loading} style={{ background: '#d10b20', border: 'none', color: '#fff', fontWeight: 'bold' }}>
              {loading ? 'Ingresando…' : 'Ingresar al Panel'}
            </button>
            <div style={{ margin: '0.75rem 0 0', padding: '0.5rem', background: '#1c1c1c', borderRadius: '6px', border: '1px solid #333', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#aaa', display: 'block' }}>
                Acceso por defecto: <strong>admin@manubarber.cl</strong>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#888', display: 'block', marginTop: '0.2rem' }}>
                Clave: <code style={{ color: '#d91e18' }}>admin123</code> o <code style={{ color: '#d91e18' }}>use-a-unique-long-password</code>
              </span>
            </div>
            {message && <p role="alert" className="error" style={{ margin: '0.5rem 0 0' }}>{message}</p>}
          </form>
        ) : (
          <>
            {tab === 'agenda' && <AdminBookings token={token} />}
            {tab === 'contenido' && (
              <AdminSiteContent
                token={token}
                onNavigateTab={setTab}
                onAuthError={() => {
                  updateToken(undefined);
                  setMessage('Tu sesión anterior caducó o es inválida tras el cambio a JSON. Ingresa nuevamente.');
                }}
              />
            )}
            {tab === 'catalogo' && (
              <AdminContent
                token={token}
                onAuthError={() => {
                  updateToken(undefined);
                  setMessage('Tu sesión anterior caducó o es inválida tras el cambio a JSON. Ingresa nuevamente.');
                }}
              />
            )}
            {tab === 'auditoria' && <AdminAudit token={token} />}
          </>
        )}
      </main>
    </div>
  );
}
