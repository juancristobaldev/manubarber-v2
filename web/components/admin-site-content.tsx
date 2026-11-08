'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { ADMIN_SITE_CONTENT, ADMIN_OPERATIONS, PUBLIC_SITE, GET_MEDIA_ASSETS } from '@/lib/operations';
import { clp } from '@/components/site';
import { SiteImagePicker } from '@/components/admin-common';

const PAGE_ROUTES: Record<'home' | 'store' | 'vip' | 'courses', { path: string; label: string }> = {
  home: { path: '/', label: 'Inicio' },
  store: { path: '/tienda', label: 'Tienda' },
  vip: { path: '/vip', label: 'VIP' },
  courses: { path: '/capacitacion', label: 'Academia' },
};

function getApiOrigin(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const gql = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (gql) {
    try {
      return new URL(gql).origin;
    } catch {
      // relative or invalid URL
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

const API_ORIGIN = getApiOrigin();

type Value = Record<string, any>;

interface AdminSiteContentProps {
  token: string;
  onNavigateTab?: (tab: string) => void;
  onAuthError?: () => void;
}

const PRESET_IMAGES = [
  { label: 'Hero Principal', url: '/images/hero.jpg' },
  { label: 'Barbero Precisión', url: '/images/image.png' },
  { label: 'Corte Fade 1', url: '/images/cut-1.png' },
  { label: 'Corte Fade 2', url: '/images/cut-2.png' },
  { label: 'Corte Textura 3', url: '/images/cut-3.png' },
  { label: 'Perfilado 4', url: '/images/cut-4.png' },
  { label: 'Street Cut 5', url: '/images/cut-5.jpg' },
  { label: 'Salón Urbano 1', url: '/images/normal-1.jpg' },
  { label: 'Salón Urbano 2', url: '/images/normal-2.jpg' },
];

export function AdminSiteContent({ token, onNavigateTab, onAuthError }: AdminSiteContentProps) {
  const client = useApolloClient();
  const context = { headers: { authorization: `Bearer ${token}` } };

  // Datos de contenido administrable
  const { data, loading, error, refetch } = useQuery<{ adminSiteContent: Value }>(ADMIN_SITE_CONTENT, {
    context,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (error) {
      const isAuth =
        error.message?.toLowerCase().includes('unauthorized') ||
        error.graphQLErrors?.some(
          (e) => e.message?.toLowerCase().includes('unauthorized') || e.extensions?.code === 'UNAUTHENTICATED'
        );
      if (isAuth && onAuthError) {
        onAuthError();
      }
    }
  }, [error, onAuthError]);

  // Datos públicos para renderizar secciones dinámicas de fondo (Servicios, Planes, etc.)
  const { data: publicData } = useQuery(PUBLIC_SITE);

  // Galería y biblioteca de assets multimedia
  const { data: mediaData } = useQuery<{ media: any[] }>(GET_MEDIA_ASSETS, {
    context,
    fetchPolicy: 'cache-and-network',
  });
  const mediaAssets = mediaData?.media || [];

  // Estados del visual editor
  const [draft, setDraft] = useState<Value | null>(null);
  const [activePage, setActivePage] = useState<'home' | 'store' | 'vip' | 'courses'>('home');
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'visual' | 'forms'>('visual');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sincronizar draft cuando llegan datos del servidor
  useEffect(() => {
    if (data?.adminSiteContent) {
      setDraft(JSON.parse(JSON.stringify(data.adminSiteContent)));
    }
  }, [data]);

  // Enviar cambios en vivo (draft) hacia el iframe cuando se tipea en los campos
  useEffect(() => {
    if (iframeRef.current?.contentWindow && draft && typeof window !== 'undefined') {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: 'MB_PREVIEW_DATA', siteContent: draft },
          window.location.origin
        );
      } catch {
        // ignore cross-origin safely
      }
    }
  }, [draft]);

  // Escuchar mensajes provenientes del iframe (cuando está listo o al hacer clic en secciones)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'MB_PREVIEW_READY') {
        if (iframeRef.current?.contentWindow && draft) {
          try {
            iframeRef.current.contentWindow.postMessage(
              { type: 'MB_PREVIEW_DATA', siteContent: draft },
              window.location.origin
            );
          } catch {
            // ignore
          }
        }
      } else if (e.data?.type === 'MB_SELECT_SECTION' && e.data?.section) {
        setActiveSection(e.data.section);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [draft]);

  const notifyIframeRefetch = () => {
    if (iframeRef.current?.contentWindow && typeof window !== 'undefined') {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: 'MB_PREVIEW_REFETCH' },
          window.location.origin
        );
      } catch {
        // ignore
      }
    }
  };

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `${PAGE_ROUTES[activePage].path}?preview=admin&t=${Date.now()}`;
    }
  };

  const showToast = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading && !draft) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#d10b20', marginBottom: '1rem' }} />
        <p>Cargando editor de contenido en vivo…</p>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div style={{ background: '#261012', border: '1px solid #d10b20', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ color: '#ff7c8c', margin: 0 }}>No se pudo cargar el contenido del sitio</h3>
        <p style={{ color: '#aaa', margin: '0.5rem 0 1rem' }}>Verifica tu sesión o conexión con el servidor.</p>
        <button onClick={() => refetch()} style={{ background: '#d10b20', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }

  const content = draft || {};
  const currentHero = activePage === 'home' ? (content.homeHero || {}) : activePage === 'store' ? (content.storeHero || {}) : (content.vipHero || {});
  const brand = content.brand || {};
  const philosophy = content.philosophy || {};
  const contact = content.contact || {};
  const experienceList: any[] = content.experience || [];
  const testimonialsList: any[] = content.testimonials || [];
  const vipComparison = content.vipComparison || {};
  const courseCta = content.courseCta || {};

  // Actualizador universal para el draft local
  const updateDraft = (sectionKey: string, field: string, value: any) => {
    setDraft((prev: any) => {
      const next = { ...prev };
      next[sectionKey] = { ...(next[sectionKey] || {}), [field]: value };
      return next;
    });
  };

  // Guardar Hero activo
  const saveHero = async () => {
    setBusy(true);
    try {
      const heroKey = activePage === 'home' ? 'homeHero' : activePage === 'store' ? 'storeHero' : 'vipHero';
      const pageKey = activePage === 'home' ? 'HOME' : activePage === 'store' ? 'STORE' : 'VIP';
      const heroData = content[heroKey] || {};

      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertPageHero,
        variables: {
          input: {
            pageKey,
            eyebrow: heroData.eyebrow || null,
            title: heroData.title || '',
            description: heroData.description || '',
            imageUrl: heroData.imageUrl || null,
            ctaLabel: heroData.ctaLabel || null,
            ctaHref: heroData.ctaHref || null,
          },
        },
        context,
      });

      // Si es home, también persistir textos de marca asociados (kanji, texto lateral)
      if (activePage === 'home') {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.upsertBrand,
          variables: {
            input: {
              japaneseMark: brand.japaneseMark || '',
              eyebrow: brand.eyebrow || '',
              heroSideText: brand.heroSideText || '',
              heroJapanese: brand.heroJapanese || '',
              accentColors: (brand.accentColors || []).map((c: any) => (typeof c === 'string' ? c : c.hexColor)),
            },
          },
          context,
        });
      }

      await refetch();
      notifyIframeRefetch();
      showToast(`✅ Hero de ${PAGE_ROUTES[activePage].label.toUpperCase()} guardado en la base de datos.`);
    } catch (e: any) {
      showToast(`Error al guardar Hero: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  // Guardar Filosofía de Marca
  const savePhilosophy = async () => {
    setBusy(true);
    try {
      const paragraphs = (philosophy.paragraphs || []).map((p: any) => (typeof p === 'string' ? p : p.text));
      const pillars = (philosophy.pillars || []).map((pi: any) => ({ label: pi.label, description: pi.description }));

      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertPhilosophy,
        variables: {
          input: {
            japaneseTitle: philosophy.japaneseTitle || '哲学',
            kicker: philosophy.kicker || '',
            title: philosophy.title || '',
            quote: philosophy.quote || '',
            imageUrl: philosophy.imageUrl || null,
            imageAlt: philosophy.imageAlt || null,
            paragraphs,
            pillars,
          },
        },
        context,
      });

      await refetch();
      notifyIframeRefetch();
      showToast('✅ Filosofía de marca guardada en la base de datos.');
    } catch (e: any) {
      showToast(`Error al guardar filosofía: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  // Guardar Contacto
  const saveContact = async () => {
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertContact,
        variables: {
          input: {
            address: contact.address || '',
            city: contact.city || '',
            instagramUrl: contact.instagramUrl || '',
            whatsappPhone: contact.whatsappPhone || '',
            mapEmbedUrl: contact.mapEmbedUrl || '',
          },
        },
        context,
      });

      await refetch();
      notifyIframeRefetch();
      showToast('✅ Información de contacto guardada en la base de datos.');
    } catch (e: any) {
      showToast(`Error al guardar contacto: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  // Guardar Comparativa VIP
  const saveVipComparison = async () => {
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertVipComparison,
        variables: {
          input: {
            visits: Number(vipComparison.visits || 4),
            individualPrice: Number(vipComparison.individualPrice || 15000),
            vipPrice: Number(vipComparison.vipPrice || 35000),
          },
        },
        context,
      });

      await refetch();
      notifyIframeRefetch();
      showToast('✅ Comparativa VIP guardada en la base de datos.');
    } catch (e: any) {
      showToast(`Error al guardar comparativa VIP: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  // Guardar CTA de Cursos
  const saveCourseCta = async () => {
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertCourseCta,
        variables: {
          input: {
            title: courseCta.title || '',
            description: courseCta.description || '',
            label: courseCta.label || '',
            href: courseCta.href || '',
          },
        },
        context,
      });

      await refetch();
      notifyIframeRefetch();
      showToast('✅ Llamado de cursos guardado en la base de datos.');
    } catch (e: any) {
      showToast(`Error al guardar llamado de cursos: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  // Helper para restaurar draft desde la base de datos
  const resetDraft = () => {
    if (data?.adminSiteContent) {
      setDraft(JSON.parse(JSON.stringify(data.adminSiteContent)));
      showToast('Cambios revertidos al estado publicado.');
    }
  };

  return (
    <div className="live-editor-container">
      {/* 1. BARRA SUPERIOR DE HERRAMIENTAS */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <div className="editor-title-block">
            <h2>
              <i className="fa-solid fa-paintbrush" style={{ color: '#d10b20' }} />
              Editor de Contenido en Vivo
            </h2>
            <p>Edición visual en tiempo real de textos e imágenes de fondo no dinámicas</p>
          </div>

          {/* Selector de página activa */}
          <div className="editor-page-selector" role="tablist" aria-label="Páginas del sitio">
            <button
              type="button"
              className={`page-tab-btn ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => { setActivePage('home'); setActiveSection('hero'); }}
            >
              <i className="fa-solid fa-house" /> Inicio
            </button>
            <button
              type="button"
              className={`page-tab-btn ${activePage === 'store' ? 'active' : ''}`}
              onClick={() => { setActivePage('store'); setActiveSection('hero'); }}
            >
              <i className="fa-solid fa-bag-shopping" /> Tienda
            </button>
            <button
              type="button"
              className={`page-tab-btn ${activePage === 'vip' ? 'active' : ''}`}
              onClick={() => { setActivePage('vip'); setActiveSection('hero'); }}
            >
              <i className="fa-solid fa-crown" /> VIP
            </button>
            <button
              type="button"
              className={`page-tab-btn ${activePage === 'courses' ? 'active' : ''}`}
              onClick={() => { setActivePage('courses'); setActiveSection('hero'); }}
            >
              <i className="fa-solid fa-graduation-cap" /> Capacitación
            </button>
          </div>
        </div>

        <div className="editor-toolbar-right">
          {/* Conmutador de Dispositivo (Desktop / Mobile) */}
          <div className="device-viewport-toggle" title="Previsualizar dispositivo">
            <button
              type="button"
              className={`device-btn ${viewport === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewport('desktop')}
              title="Vista de escritorio"
            >
              <i className="fa-solid fa-desktop" />
            </button>
            <button
              type="button"
              className={`device-btn ${viewport === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewport('mobile')}
              title="Vista móvil"
            >
              <i className="fa-solid fa-mobile-screen" />
            </button>
          </div>

          {/* Alternador de Modo: Visual vs Formulario Clásico */}
          <button
            type="button"
            className="mode-switch-btn"
            onClick={() => setViewMode(viewMode === 'visual' ? 'forms' : 'visual')}
          >
            <i className={`fa-solid ${viewMode === 'visual' ? 'fa-table-list' : 'fa-eye'}`} />
            {viewMode === 'visual' ? 'Modo Formularios' : 'Modo Visual en Vivo'}
          </button>
        </div>
      </div>

      {/* 2. BANNER DE DELIMITACIÓN ESTRICTA (ELEMENTOS NO DINÁMICOS) */}
      <div className="editor-scope-banner">
        <div>
          <strong>Alcance de esta sección:</strong> Estás editando exclusivamente textos editoriales, imágenes de fondo y estructura no dinámica.
        </div>
        <div className="scope-pills">
          <span className="scope-pill-protected" title="Gestionado en Catálogo">
            <i className="fa-solid fa-lock" /> Servicios protegidos
          </span>
          <span className="scope-pill-protected" title="Gestionado en Catálogo">
            <i className="fa-solid fa-lock" /> Cuidado Premium protegido
          </span>
          <span className="scope-pill-protected" title="Gestionado en Catálogo">
            <i className="fa-solid fa-lock" /> Membresías protegidas
          </span>
          <span className="scope-pill-protected" title="Gestionado en Catálogo">
            <i className="fa-solid fa-lock" /> Galería protegida
          </span>
          <span className="scope-pill-protected" title="Gestionado en Agenda">
            <i className="fa-solid fa-lock" /> Agenda protegida
          </span>
        </div>
      </div>

      {/* 3. MODO VISUAL SPLIT SCREEN */}
      {viewMode === 'visual' ? (
        <div className="editor-workspace">
          {/* 3A. CANVAS DE PREVISUALIZACIÓN EN VIVO (IZQUIERDA) */}
          <div className={`editor-canvas-stage ${viewport === 'mobile' ? 'mobile-view' : ''}`}>
            <div className="mobile-notch" />

            {/* VISTA REAL EN VIVO MEDIANTE BRIDGE (Tailwind, componentes y diseño real) */}
            <div className="editor-preview-container">
              <div className="editor-preview-bar">
                <div className="editor-preview-status">
                  <span className="editor-preview-status-dot" />
                  <span>
                    Diseño en vivo · {PAGE_ROUTES[activePage].label} ({viewport === "mobile" ? "Móvil 375px" : "Escritorio"})
                  </span>
                </div>
                <div className="editor-preview-actions">
                  <button
                    type="button"
                    className="editor-preview-btn"
                    title="Recargar vista previa del código"
                    onClick={reloadPreview}
                  >
                    <i className="fa-solid fa-rotate-right" /> Recargar vista
                  </button>
                  <a
                    href={PAGE_ROUTES[activePage].path}
                    target="_blank"
                    rel="noreferrer"
                    className="editor-preview-btn"
                    title="Abrir página pública real en pestaña nueva"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" /> Ver web pública
                  </a>
                </div>
              </div>

              <iframe
                ref={iframeRef}
                key={`${activePage}-${viewport}`}
                src={`${PAGE_ROUTES[activePage].path}?preview=admin`}
                className="editor-preview-iframe"
                title={`Previsualización en vivo de ${PAGE_ROUTES[activePage].label}`}
              />
            </div>
          </div>

          {/* 3B. INSPECTOR CONTEXTUAL (DERECHA) */}
          <aside className="editor-inspector">
            <div className="inspector-header">
              <div className="inspector-header-info">
                <span className="inspector-section-tag">
                  {activeSection.toUpperCase()} · {activePage.toUpperCase()}
                </span>
                <h3>Inspector de Contenido</h3>
              </div>
            </div>

            {/* Selector de sub-sección para edición directa */}
            <div className="inspector-nav-tabs">
              <button
                type="button"
                className={`inspector-tab-pill ${activeSection === 'hero' ? 'active' : ''}`}
                onClick={() => setActiveSection('hero')}
              >
                Hero &amp; Fondos
              </button>
              {activePage === 'home' && (
                <>
                  <button
                    type="button"
                    className={`inspector-tab-pill ${activeSection === 'philosophy' ? 'active' : ''}`}
                    onClick={() => setActiveSection('philosophy')}
                  >
                    Filosofía
                  </button>
                  <button
                    type="button"
                    className={`inspector-tab-pill ${activeSection === 'experience' ? 'active' : ''}`}
                    onClick={() => setActiveSection('experience')}
                  >
                    Estándar
                  </button>
                  <button
                    type="button"
                    className={`inspector-tab-pill ${activeSection === 'testimonials' ? 'active' : ''}`}
                    onClick={() => setActiveSection('testimonials')}
                  >
                    Testimonios
                  </button>
                  <button
                    type="button"
                    className={`inspector-tab-pill ${activeSection === 'contact' ? 'active' : ''}`}
                    onClick={() => setActiveSection('contact')}
                  >
                    Contacto
                  </button>
                </>
              )}
              {activePage === 'vip' && (
                <button
                  type="button"
                  className={`inspector-tab-pill ${activeSection === 'vipComparison' ? 'active' : ''}`}
                  onClick={() => setActiveSection('vipComparison')}
                >
                  Comparativa
                </button>
              )}
              {activePage === 'courses' && (
                <button
                  type="button"
                  className={`inspector-tab-pill ${activeSection === 'courseCta' ? 'active' : ''}`}
                  onClick={() => setActiveSection('courseCta')}
                >
                  Llamado final
                </button>
              )}
            </div>

            <div className="inspector-body">
              {/* === PANEL DE EDICIÓN DEL HERO ACTIVO === */}
              {activeSection === 'hero' && (
                <>
                  <div className="inspector-field-group">
                    <SiteImagePicker
                      label="Imagen de fondo (Hero)"
                      helper="Se recomienda fotografía panorámica oscura (1920x1080)"
                      value={currentHero.imageUrl || ''}
                      onChange={(newUrl) => {
                        const heroKey = activePage === 'home' ? 'homeHero' : activePage === 'store' ? 'storeHero' : 'vipHero';
                        updateDraft(heroKey, 'imageUrl', newUrl);
                      }}
                      mediaAssets={mediaAssets}
                      apiOrigin={API_ORIGIN}
                      token={token}
                      presets={PRESET_IMAGES}
                      hint="JPG, PNG o WEBP de alta resolución hasta 5 MB"
                    />
                  </div>

                  {activePage === 'home' && (
                    <div className="inspector-field-group">
                      <label>Texto Japonés (Kanjis de fondo)</label>
                      <input
                        type="text"
                        value={brand.heroJapanese || ''}
                        placeholder="Ej: 侍の精神"
                        onChange={(e) => updateDraft('brand', 'heroJapanese', e.target.value)}
                      />
                    </div>
                  )}

                  {activePage !== 'store' && (
                    <div className="inspector-field-group">
                      <label>Eyebrow / Kicker Superior</label>
                      <input
                        type="text"
                        value={currentHero.eyebrow || ''}
                        placeholder="Ej: MANUBARBER · STREET PRECISION"
                        onChange={(e) => {
                          const heroKey = activePage === 'home' ? 'homeHero' : 'vipHero';
                          updateDraft(heroKey, 'eyebrow', e.target.value);
                        }}
                      />
                    </div>
                  )}

                  <div className="inspector-field-group">
                    <label>Título Principal</label>
                    <textarea
                      rows={2}
                      value={currentHero.title || ''}
                      placeholder="Título llamativo..."
                      onChange={(e) => {
                        const heroKey = activePage === 'home' ? 'homeHero' : activePage === 'store' ? 'storeHero' : 'vipHero';
                        updateDraft(heroKey, 'title', e.target.value);
                      }}
                    />
                  </div>

                  <div className="inspector-field-group">
                    <label>Descripción / Bajada</label>
                    <textarea
                      rows={3}
                      value={currentHero.description || ''}
                      placeholder="Texto descriptivo de la sección..."
                      onChange={(e) => {
                        const heroKey = activePage === 'home' ? 'homeHero' : activePage === 'store' ? 'storeHero' : 'vipHero';
                        updateDraft(heroKey, 'description', e.target.value);
                      }}
                    />
                  </div>

                  {activePage === 'home' && (
                    <>
                      <div className="inspector-field-group">
                        <label>Texto del Botón Principal</label>
                        <input
                          type="text"
                          value={currentHero.ctaLabel || ''}
                          placeholder="Reservar Hora"
                          onChange={(e) => updateDraft('homeHero', 'ctaLabel', e.target.value)}
                        />
                      </div>
                      <div className="inspector-field-group">
                        <label>Enlace del Botón</label>
                        <input
                          type="text"
                          value={currentHero.ctaHref || ''}
                          placeholder="#reserva o /reserva"
                          onChange={(e) => updateDraft('homeHero', 'ctaHref', e.target.value)}
                        />
                      </div>
                      <div className="inspector-field-group">
                        <label>Texto Lateral Rotado</label>
                        <input
                          type="text"
                          value={brand.heroSideText || ''}
                          placeholder="STREET PRECISION"
                          onChange={(e) => updateDraft('brand', 'heroSideText', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* === PANEL DE EDICIÓN: FILOSOFÍA === */}
              {activeSection === 'philosophy' && (
                <>
                  <div className="inspector-field-group">
                    <label>Kicker Superior</label>
                    <input
                      type="text"
                      value={philosophy.kicker || ''}
                      onChange={(e) => updateDraft('philosophy', 'kicker', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Título de Filosofía</label>
                    <textarea
                      rows={2}
                      value={philosophy.title || ''}
                      onChange={(e) => updateDraft('philosophy', 'title', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Cita Destacada</label>
                    <textarea
                      rows={2}
                      value={philosophy.quote || ''}
                      onChange={(e) => updateDraft('philosophy', 'quote', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <SiteImagePicker
                      label="Imagen Lateral de Filosofía"
                      helper="Foto del barbero o taller en alta resolución"
                      value={philosophy.imageUrl || ''}
                      onChange={(newUrl) => updateDraft('philosophy', 'imageUrl', newUrl)}
                      mediaAssets={mediaAssets}
                      apiOrigin={API_ORIGIN}
                      token={token}
                      presets={PRESET_IMAGES}
                      hint="JPG, PNG o WEBP vertical o cuadrada hasta 5 MB"
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Texto Alternativo de la Imagen (SEO / Accesibilidad)</label>
                    <input
                      type="text"
                      placeholder="Ej: Maestro barbero trabajando con navaja de precisión"
                      value={philosophy.imageAlt || ''}
                      onChange={(e) => updateDraft('philosophy', 'imageAlt', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Sello Kanji Japonés</label>
                    <input
                      type="text"
                      value={brand.japaneseMark || ''}
                      maxLength={4}
                      onChange={(e) => updateDraft('brand', 'japaneseMark', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* === PANEL DE EDICIÓN: ESTÁNDAR / EXPERIENCIA === */}
              {activeSection === 'experience' && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                    Modifica los pilares de valor del cliente:
                  </p>
                  {experienceList.map((item: any, idx: number) => (
                    <div key={item.id || idx} style={{ background: '#1c1c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          style={{ width: '45px', textAlign: 'center' }}
                          value={item.icon || '◈'}
                          onChange={(e) => {
                            const next = [...experienceList];
                            next[idx] = { ...next[idx], icon: e.target.value };
                            setDraft((prev: any) => ({ ...prev, experience: next }));
                          }}
                        />
                        <input
                          type="text"
                          value={item.title || ''}
                          style={{ flex: 1 }}
                          onChange={(e) => {
                            const next = [...experienceList];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setDraft((prev: any) => ({ ...prev, experience: next }));
                          }}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={item.description || ''}
                        onChange={(e) => {
                          const next = [...experienceList];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setDraft((prev: any) => ({ ...prev, experience: next }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* === PANEL DE EDICIÓN: TESTIMONIOS === */}
              {activeSection === 'testimonials' && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                    La voz de tus clientes destacados:
                  </p>
                  {testimonialsList.map((t: any, idx: number) => (
                    <div key={t.id || idx} style={{ background: '#1c1c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        value={t.author || ''}
                        placeholder="Nombre cliente"
                        style={{ marginBottom: '0.4rem' }}
                        onChange={(e) => {
                          const next = [...testimonialsList];
                          next[idx] = { ...next[idx], author: e.target.value };
                          setDraft((prev: any) => ({ ...prev, testimonials: next }));
                        }}
                      />
                      <input
                        type="text"
                        value={t.service || ''}
                        placeholder="Servicio realizado"
                        style={{ marginBottom: '0.4rem' }}
                        onChange={(e) => {
                          const next = [...testimonialsList];
                          next[idx] = { ...next[idx], service: e.target.value };
                          setDraft((prev: any) => ({ ...prev, testimonials: next }));
                        }}
                      />
                      <textarea
                        rows={2}
                        value={t.text || ''}
                        placeholder="Comentario del cliente..."
                        onChange={(e) => {
                          const next = [...testimonialsList];
                          next[idx] = { ...next[idx], text: e.target.value };
                          setDraft((prev: any) => ({ ...prev, testimonials: next }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* === PANEL DE EDICIÓN: CONTACTO === */}
              {activeSection === 'contact' && (
                <>
                  <div className="inspector-field-group">
                    <label>Dirección</label>
                    <input
                      type="text"
                      value={contact.address || ''}
                      onChange={(e) => updateDraft('contact', 'address', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={contact.city || ''}
                      onChange={(e) => updateDraft('contact', 'city', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>WhatsApp</label>
                    <input
                      type="text"
                      value={contact.whatsappPhone || ''}
                      onChange={(e) => updateDraft('contact', 'whatsappPhone', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Instagram URL</label>
                    <input
                      type="text"
                      value={contact.instagramUrl || ''}
                      onChange={(e) => updateDraft('contact', 'instagramUrl', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Google Maps Embed URL</label>
                    <input
                      type="text"
                      value={contact.mapEmbedUrl || ''}
                      onChange={(e) => updateDraft('contact', 'mapEmbedUrl', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* === PANEL DE EDICIÓN: COMPARATIVA VIP === */}
              {activeSection === 'vipComparison' && (
                <>
                  <div className="inspector-field-group">
                    <label>Visitas calculadas al mes</label>
                    <input
                      type="number"
                      value={vipComparison.visits || 4}
                      onChange={(e) => updateDraft('vipComparison', 'visits', Number(e.target.value))}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Precio por corte individual (CLP)</label>
                    <input
                      type="number"
                      value={vipComparison.individualPrice || 15000}
                      onChange={(e) => updateDraft('vipComparison', 'individualPrice', Number(e.target.value))}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Precio del Plan VIP mensual (CLP)</label>
                    <input
                      type="number"
                      value={vipComparison.vipPrice || 35000}
                      onChange={(e) => updateDraft('vipComparison', 'vipPrice', Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              {/* === PANEL DE EDICIÓN: CTA DE CURSOS === */}
              {activeSection === 'courseCta' && (
                <>
                  <div className="inspector-field-group">
                    <label>Título del Banner</label>
                    <input
                      type="text"
                      value={courseCta.title || ''}
                      onChange={(e) => updateDraft('courseCta', 'title', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Descripción del Banner</label>
                    <textarea
                      rows={2}
                      value={courseCta.description || ''}
                      onChange={(e) => updateDraft('courseCta', 'description', e.target.value)}
                    />
                  </div>
                  <div className="inspector-field-group">
                    <label>Texto del Botón</label>
                    <input
                      type="text"
                      value={courseCta.label || ''}
                      onChange={(e) => updateDraft('courseCta', 'label', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* FOOTER DEL INSPECTOR: GUARDAR Y DESHACER */}
            <div className="inspector-footer">
              <button
                type="button"
                className="btn-save-section"
                disabled={busy}
                onClick={() => {
                  if (activeSection === 'hero') saveHero();
                  else if (activeSection === 'philosophy') savePhilosophy();
                  else if (activeSection === 'contact') saveContact();
                  else if (activeSection === 'vipComparison') saveVipComparison();
                  else if (activeSection === 'courseCta') saveCourseCta();
                  else showToast('✅ Cambios aplicados localmente.');
                }}
              >
                {busy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Guardando…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" /> Guardar {activeSection.toUpperCase()}
                  </>
                )}
              </button>
              <button type="button" className="btn-reset-section" onClick={resetDraft}>
                <i className="fa-solid fa-rotate-left" /> Deshacer cambios no guardados
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* 4. MODO FORMULARIO / VISTA CLÁSICA RESPALDADA */
        <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Oswald, sans-serif' }}>Modo Formulario de Campos</h3>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
            Puedes usar el conmutador superior &quot;Modo Visual en Vivo&quot; para editar con vista previa interactiva.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#1c1c1c', padding: '1rem', borderRadius: '6px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem' }}>Hero de Inicio</h4>
              <p style={{ color: '#888', fontSize: '0.8rem' }}>Título: {content.homeHero?.title}</p>
              <button type="button" className="dynamic-shield-btn" onClick={() => { setViewMode('visual'); setActivePage('home'); setActiveSection('hero'); }}>
                Editar en modo visual
              </button>
            </div>
            <div style={{ background: '#1c1c1c', padding: '1rem', borderRadius: '6px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem' }}>Filosofía de Marca</h4>
              <p style={{ color: '#888', fontSize: '0.8rem' }}>Título: {content.philosophy?.title}</p>
              <button type="button" className="dynamic-shield-btn" onClick={() => { setViewMode('visual'); setActivePage('home'); setActiveSection('philosophy'); }}>
                Editar en modo visual
              </button>
            </div>
            <div style={{ background: '#1c1c1c', padding: '1rem', borderRadius: '6px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem' }}>Ubicación y Contacto</h4>
              <p style={{ color: '#888', fontSize: '0.8rem' }}>{content.contact?.address}, {content.contact?.city}</p>
              <button type="button" className="dynamic-shield-btn" onClick={() => { setViewMode('visual'); setActivePage('home'); setActiveSection('contact'); }}>
                Editar en modo visual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLOTANTE DE NOTIFICACIÓN */}
      {toast && (
        <div className={`editor-toast ${toast.error ? 'error' : ''}`} role="status">
          <i className={`fa-solid ${toast.error ? 'fa-circle-exclamation' : 'fa-circle-check'}`} />
          <span>{toast.text}</span>
          {!toast.error && (
            <a
              href={PAGE_ROUTES[activePage].path}
              target="_blank"
              rel="noreferrer"
              style={{
                marginLeft: '0.75rem',
                color: '#fff',
                textDecoration: 'underline',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Comprobar en sitio público ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
