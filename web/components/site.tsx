'use client';
import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_COURSE_LEAD, CREATE_MEMBERSHIP_LEAD, CREATE_PRODUCT_RESERVATION, PUBLIC_SITE } from '@/lib/operations';
import { SiteLoader } from './site-loader';

export type SiteData = any;

// Bandera a nivel de módulo: asegura que la demora de 2s solo ocurra en la carga inicial de la web
let hasCompletedInitialWebLoad = false;

export function useSite() {
  const queryResult = useQuery<SiteData>(PUBLIC_SITE, {
    fetchPolicy: 'cache-and-network',
  });
  const [livePreviewContent, setLivePreviewContent] = useState<any>(null);
  const [minTimeElapsed, setMinTimeElapsed] = useState(() => hasCompletedInitialWebLoad);

  useEffect(() => {
    // Si ya completó la carga inicial o estamos en el iframe admin, no demorar
    if (hasCompletedInitialWebLoad || (typeof window !== 'undefined' && window.self !== window.top)) {
      setMinTimeElapsed(true);
      hasCompletedInitialWebLoad = true;
      return;
    }

    // Primera vez que se abre la web: mantener mínimo 2 segundos
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
      hasCompletedInitialWebLoad = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top) {
      return;
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'MB_PREVIEW_DATA' && e.data?.siteContent) {
        setLivePreviewContent(e.data.siteContent);
      } else if (e.data?.type === 'MB_PREVIEW_REFETCH') {
        queryResult.refetch();
      }
    };

    window.addEventListener('message', handleMessage);

    try {
      window.parent.postMessage({ type: 'MB_PREVIEW_READY' }, window.location.origin);
    } catch {
      // ignore
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [queryResult]);

  const data = useMemo(() => {
    if (!queryResult.data) return queryResult.data;
    if (!livePreviewContent) return queryResult.data;
    return {
      ...queryResult.data,
      siteContent: {
        ...queryResult.data.siteContent,
        ...livePreviewContent,
      },
    };
  }, [queryResult.data, livePreviewContent]);

  return {
    ...queryResult,
    // Si hay queries pendientes se muestra igual; los 2s mínimos aplican solo en la primera carga
    loading: hasCompletedInitialWebLoad
      ? queryResult.loading
      : (queryResult.loading || !minTimeElapsed) && !queryResult.error,
    data,
  };
}

export const clp = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
export function content(data: SiteData | undefined) { return data?.siteContent ?? {}; }
export function section(data: SiteData | undefined, sectionKey: string) { return content(data).pageSections?.find((item: any) => item.pageKey === 'home' && item.sectionKey === sectionKey); }
export function Loading({ error }: { error?: Error }) { return <SiteLoader error={error} minDurationMs={2000} />; }

export function Shell({ data, children, tone = 'red' }: { data?: SiteData; children: ReactNode; tone?: 'red' | 'gold' }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsInIframe(true);
    }
    const listener = () => setScrolled(window.scrollY > 30);
    listener();
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const sectionEl = target.closest('[id], header, section, footer');
      if (sectionEl) {
        const id = sectionEl.id;
        const tagName = sectionEl.tagName.toLowerCase();
        let sectionKey = '';
        if (tagName === 'header' || id === 'hero') sectionKey = 'hero';
        else if (id === 'filosofia') sectionKey = 'philosophy';
        else if (id === 'experiencia' || id === 'estandar') sectionKey = 'experience';
        else if (id === 'testimonios') sectionKey = 'testimonials';
        else if (id === 'contacto' || tagName === 'footer') sectionKey = 'contact';
        else if (id === 'comparativa') sectionKey = 'vipComparison';
        else if (id === 'cta-final') sectionKey = 'courseCta';

        if (sectionKey) {
          window.parent.postMessage({ type: 'MB_SELECT_SECTION', section: sectionKey }, window.location.origin);
        }
      }
    };

    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, []);

  const links = data?.navigation ?? [];
  const profile = content(data).profile ?? {};
  const contact = content(data).contact ?? {};
  const logoSrc = profile.logoUrl || '/images/manu-logo.png';

  return (
    <>
      {/* Header Canónico UI Kit */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-dark/95 backdrop-blur-md border-b border-brand-border h-16 shadow-lg'
            : 'bg-brand-dark/80 backdrop-blur-sm border-b border-brand-border/40 h-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-brand-border bg-[#0a0a0a] shadow-sm group-hover:border-brand-red transition-all duration-300">
              <img
                src={logoSrc}
                alt={profile.name ?? 'ManuBarber'}
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-oswald uppercase tracking-widest text-sm font-bold block leading-none">
                {profile.name ?? 'MANUBARBER'}
              </span>
              <span className="text-[9px] font-oswald tracking-widest text-brand-muted uppercase block mt-0.5">
                Street Craft · Precision
              </span>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-oswald tracking-widest text-brand-muted uppercase">
            {links.map((item: any) => {
              const targetHref = item.href === '/capacitacion' ? '/academia' : item.href;
              return (
                <Link
                  key={item.id}
                  href={targetHref}
                  className="hover:text-brand-red transition-colors duration-200"
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href="#reserva"
              className="bg-brand-red hover:bg-brand-redHover text-white text-[11px] font-oswald uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm transition-all transform hover:scale-[1.02]"
            >
              Reservar
            </a>
          </nav>

          {/* Menú Toggle Mobile */}
          <button
            className="md:hidden w-9 h-9 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text focus:outline-none"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-sm`} />
          </button>
        </div>

        {/* Menú Desplegable Mobile */}
        {open && (
          <div className="md:hidden bg-brand-dark/98 border-b border-brand-border px-6 py-6 space-y-4 shadow-2xl backdrop-blur-xl animate-fadeIn">
            {links.map((item: any) => {
              const targetHref = item.href === '/capacitacion' ? '/academia' : item.href;
              return (
                <Link
                  key={item.id}
                  href={targetHref}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-oswald uppercase tracking-widest text-brand-text hover:text-brand-red py-2 border-b border-brand-border/30"
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href="#reserva"
              onClick={() => setOpen(false)}
              className="block text-center bg-brand-red text-white text-xs font-oswald uppercase tracking-widest py-3 rounded-lg shadow-md"
            >
              Reservar Hora
            </a>
          </div>
        )}
      </header>

      <main className="pt-20">{children}</main>

      {/* Footer Canónico UI Kit */}
      <footer className="relative py-16 px-6 bg-[#0a0a0a] border-t border-brand-border text-center overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border border-brand-border bg-[#0a0a0a] mx-auto mb-6 shadow-md hover:border-brand-red transition-colors duration-300">
            <img
              src={logoSrc}
              alt={profile.name ?? 'ManuBarber'}
              className="w-full h-full object-contain p-1"
            />
          </div>

          <p className="text-xs font-oswald tracking-widest text-brand-red uppercase mb-4">
            Street Craft · Japanese Discipline
          </p>

          <div className="flex justify-center gap-4 my-6">
            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted hover:text-white hover:bg-brand-red hover:border-brand-red transition-all duration-300 shadow-sm"
              >
                <i className="fa-brands fa-instagram" />
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted hover:text-white hover:bg-brand-red hover:border-brand-red transition-all duration-300 shadow-sm"
              >
                <i className="fa-brands fa-whatsapp" />
              </a>
            )}
          </div>

          <p className="text-xs text-brand-muted font-light font-sans tracking-wide">
            © 2026 {profile.name ?? 'ManuBarber'} · Todos los derechos reservados.
          </p>
        </div>

        {/* Marca de agua decorativa */}
        <span className="absolute left-0 right-0 -bottom-8 text-brand-red/[0.03] font-oswald font-bold text-[18vw] leading-none select-none pointer-events-none uppercase">
          {tone === 'gold' ? 'ELITE' : 'STREET'}
        </span>
      </footer>

      {isInIframe && (
        <div className="fixed bottom-3 right-3 z-50 bg-[#141414]/90 border border-emerald-500/40 text-emerald-400 text-[10px] font-oswald uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg pointer-events-none backdrop-blur-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Vista previa en vivo (Admin)
        </div>
      )}
    </>
  );
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const [active, setActive] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      className={`reveal ${active ? 'active' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Modal({ title, children, onClose, tone = 'red' }: { title: string; children: ReactNode; onClose: () => void; tone?: 'red' | 'gold' }) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', listener);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', listener);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="Cerrar modal" onClick={onClose} />
      <section className="relative z-10 w-full max-w-md bg-[#141414] border border-[#2a2a2a] p-8 rounded-2xl shadow-2xl">
        <button
          className="absolute right-4 top-4 text-brand-muted hover:text-white transition-colors"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
        <h3
          className="text-2xl font-oswald uppercase tracking-wide text-center mb-6 text-brand-text"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {children}
      </section>
    </div>
  );
}

export function LeadForm({ kind, id, label, onDone }: { kind: 'product' | 'membership' | 'course'; id: string; label: string; onDone?: () => void }) {
  const document = kind === 'product' ? CREATE_PRODUCT_RESERVATION : kind === 'membership' ? CREATE_MEMBERSHIP_LEAD : CREATE_COURSE_LEAD;
  const [send, { loading, error, data }] = useMutation(document);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = kind === 'product' ? { customerName: name, phone, productId: id } : kind === 'membership' ? { name, phone, planId: id } : { name, phone, courseId: id };
    await send({ variables: { input } });
    if (onDone) setTimeout(onDone, 900);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="relative">
        <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-1.5">
          Tu Nombre
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Matías"
          className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50"
        />
      </div>

      <div className="relative">
        <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-1.5">
          WhatsApp
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="+56 9 1234 5678"
          className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50"
        />
      </div>

      <button
        disabled={loading}
        className="w-full mt-4 bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 rounded-lg text-sm transition-all shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? 'Enviando…' : label} <i className="fa-brands fa-whatsapp text-sm" />
      </button>

      {data && <p className="text-xs text-green-400 font-oswald uppercase tracking-wide text-center mt-2">✓ Solicitud recibida. Te contactaremos pronto.</p>}
      {error && <p className="text-xs text-brand-red font-oswald uppercase tracking-wide text-center mt-2">No se pudo enviar. Intenta nuevamente.</p>}
    </form>
  );
}
