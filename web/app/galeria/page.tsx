'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loading, Reveal, Shell, content, useSite } from '@/components/site';

function SectionTitle({ jp, title, center = false }: { jp?: string; title: string; center?: boolean }) {
  return (
    <Reveal className={`relative mb-10 ${center ? 'text-center' : ''}`}>
      {jp && (
        <span
          className={`absolute -top-7 ${
            center ? 'left-1/2 -translate-x-1/2' : 'left-0'
          } font-jp text-4xl text-brand-muted/15 font-black tracking-widest select-none pointer-events-none`}
        >
          {jp}
        </span>
      )}
      <div className={`flex items-center gap-4 ${center ? 'justify-center' : ''}`}>
        <h2
          className={`text-2xl md:text-3xl font-oswald uppercase tracking-widest text-brand-text relative z-10 ${
            center ? '' : 'border-l-2 border-brand-red pl-4'
          }`}
        >
          {title}
        </h2>
        {!center && <div className="h-px bg-brand-border flex-1 rounded-full hidden sm:block" />}
      </div>
    </Reveal>
  );
}

interface GalleryItem {
  id: string;
  title: string;
  alt?: string;
  categoryId: string;
  media: {
    url: string;
    alt?: string;
  };
}

interface GalleryCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder?: number;
}

export default function GalleryPage() {
  const { data, loading, error } = useSite();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const site = content(data);
  const copy = site.galleryHeader ?? {};
  const brand = site.brand ?? {};

  const categories: GalleryCategory[] = data?.galleryCategories ?? [];
  const rawItems: GalleryItem[] = data?.galleryItems ?? [];

  // Mapa de categorías para búsqueda rápida de nombres
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // Filtrado de items según la categoría activa
  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) return rawItems;
    return rawItems.filter((item) => item.categoryId === selectedCategoryId);
  }, [rawItems, selectedCategoryId]);

  // Item actualmente abierto en Lightbox
  const activeLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  // Manejo de teclado para Lightbox (Escape para cerrar, flechas para navegar)
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, filteredItems]);

  if (loading || error) return <Loading error={error} />;

  return (
    <Shell data={data}>
      {/* HERO SECTION DE GALERÍA */}
      <header className="relative min-h-[50vh] md:min-h-[55vh] flex items-center justify-center text-center px-6 pt-12 pb-16 overflow-hidden bg-[#0a0a0a] border-b border-brand-border/40">
        {/* Imagen de fondo sutil con gradiente */}
        <div
          className="absolute inset-0 bg-cover bg-center filter grayscale opacity-20 pointer-events-none"
          style={{ backgroundImage: `url('/images/hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/95 pointer-events-none" />

        {/* Kanji decorativo de gran tamaño */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 font-jp font-black text-8xl md:text-[14rem] pointer-events-none select-none">
          {copy.watermark || brand.heroJapanese || '作品'}
        </div>

        {/* Marca de agua vertical japonesa */}
        <div className="jp-bg-text font-jp hidden lg:block">
          {brand.heroJapanese || '己を磨け'}
        </div>

        {/* Contenido del Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand-surface border border-brand-border text-brand-red font-oswald tracking-widest text-xs mb-6 shadow-sm">
            PORTAFOLIO DE AUTOR · PRECISION CUTS
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-oswald uppercase tracking-tight text-white mb-6 leading-none">
            {copy.title || 'Galería de Trabajos'}
          </h1>

          <p className="text-brand-muted max-w-2xl text-sm sm:text-base md:text-lg font-light leading-relaxed mb-8">
            {copy.description ||
              'Precisión quirúrgica en cada línea. Cada corte es una declaración de disciplina, técnica e identidad urbana.'}
          </p>

          {/* KPI Bar Compacto estilo UI Kit */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="bg-[#141414] border border-[#222] rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-sm font-bold">
                <i className="fa-solid fa-camera" />
              </div>
              <div className="text-left">
                <div className="text-lg font-oswald font-bold leading-none text-white">{rawItems.length}</div>
                <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">Trabajos</div>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-sm font-bold">
                <i className="fa-solid fa-layer-group" />
              </div>
              <div className="text-left">
                <div className="text-lg font-oswald font-bold leading-none text-white">{categories.length}</div>
                <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">Categorías</div>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-sm font-bold">
                <i className="fa-solid fa-certificate" />
              </div>
              <div className="text-left">
                <div className="text-lg font-oswald font-bold leading-none text-brand-red">100%</div>
                <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">Artesanal</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 py-14 space-y-16">
        <section id="galeria-grid" className="scroll-mt-24">
          <SectionTitle
            center
            jp="作品一覧"
            title="EXPLORA NUESTRO CATÁLOGO DE ESTILOS"
          />

          {/* FILTROS POR CATEGORÍA ESTILO UI KIT */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
            <button
              onClick={() => setSelectedCategoryId(undefined)}
              className={`font-oswald uppercase tracking-widest text-xs py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                !selectedCategoryId
                  ? 'bg-brand-red text-white border border-brand-red shadow-[0_4px_14px_rgba(217,30,24,0.3)]'
                  : 'bg-[#141414] border border-[#2a2a2a] text-brand-muted hover:border-[#3f3f3f] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-bold">
                {rawItems.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = rawItems.filter((item) => item.categoryId === cat.id).length;
              const isActive = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`font-oswald uppercase tracking-widest text-xs py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'bg-brand-red text-white border border-brand-red shadow-[0_4px_14px_rgba(217,30,24,0.3)]'
                      : 'bg-[#141414] border border-[#2a2a2a] text-brand-muted hover:border-[#3f3f3f] hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* GRILLA DE FOTOGRAFÍAS */}
          {filteredItems.length === 0 ? (
            <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-12 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-4 text-xl">
                <i className="fa-solid fa-camera-retro" />
              </div>
              <h3 className="font-oswald uppercase text-lg text-white mb-2 tracking-wide">
                Sin trabajos en esta categoría
              </h3>
              <p className="text-brand-muted text-xs font-light mb-6">
                Pronto agregaremos nuevas fotografías de esta especialidad.
              </p>
              <button
                onClick={() => setSelectedCategoryId(undefined)}
                className="bg-brand-red hover:bg-brand-redHover text-white text-xs font-oswald uppercase tracking-widest px-6 py-2.5 rounded-lg transition-colors"
              >
                Ver todos los trabajos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredItems.map((item, index) => {
                const categoryName = categoryMap.get(item.categoryId) || 'Corte';

                return (
                  <Reveal key={item.id} delay={index * 40}>
                    <article
                      onClick={() => setLightboxIndex(index)}
                      className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden group card-hover shadow-lg flex flex-col cursor-pointer transition-all duration-300"
                    >
                      {/* Contenedor de Imagen */}
                      <div className="relative aspect-square overflow-hidden bg-[#111]">
                        <img
                          src={item.media.url}
                          alt={item.alt || item.title}
                          className="w-full h-full object-cover filter grayscale contrast-110 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          loading="lazy"
                        />

                        {/* Degradado inferior */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />

                        {/* Badge de Categoría superior izquierdo */}
                        <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 text-brand-text text-[9px] font-oswald uppercase tracking-widest px-2.5 py-1 rounded shadow">
                          {categoryName}
                        </span>

                        {/* Botón flotante de zoom superior derecho */}
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 group-hover:border-brand-red/50 group-hover:text-brand-red transition-all duration-300">
                          <i className="fa-solid fa-expand" />
                        </div>
                      </div>

                      {/* Pie de Tarjeta */}
                      <div className="p-4 bg-[#111] border-t border-[#2a2a2a] flex items-center justify-between gap-3">
                        <div className="overflow-hidden">
                          <h4 className="font-oswald uppercase tracking-wide text-xs sm:text-sm font-semibold text-brand-text truncate group-hover:text-white transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-brand-muted uppercase tracking-wider block truncate mt-0.5 font-light">
                            {categoryName}
                          </span>
                        </div>

                        <span className="text-[10px] font-oswald uppercase tracking-widest text-brand-red flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                          Ver
                          <i className="fa-solid fa-chevron-right text-[8px]" />
                        </span>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        {/* BANNER CTA DE CIERRE (CANÓNICO UI KIT) */}
        <section className="relative overflow-hidden bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 md:p-12 text-center shadow-xl">
          {/* Kanji de fondo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 font-jp font-black text-8xl md:text-[12rem] pointer-events-none select-none">
            {brand.japaneseMark || '予約'}
          </div>

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span className="inline-block px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-oswald uppercase tracking-widest rounded-md mb-4">
              STREET CODE · TU IMAGEN HABLA ANTES QUE TÚ
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-oswald uppercase tracking-wide text-brand-text mb-4">
              ¿Listo para tu próximo corte?
            </h3>

            <p className="text-brand-muted text-xs sm:text-sm md:text-base font-light leading-relaxed mb-8">
              Agenda tu hora online con ManuBarber. Cortes precisos, perfilado al detalle y la mejor experiencia de la ciudad.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#reserva"
                className="bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-8 text-xs sm:text-sm transition-all duration-300 transform hover:scale-[1.02] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center gap-2"
              >
                <i className="fa-solid fa-calendar-check" />
                Reservar Cita Ahora
              </Link>

              <Link
                href="/#servicios"
                className="bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3.5 px-8 text-xs sm:text-sm transition-all duration-300 rounded-lg"
              >
                Ver Servicios & Tarifas
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* LIGHTBOX MODAL DE ALTA DEFINICIÓN */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Botón de Cierre */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Cerrar vista previa"
            className="absolute top-4 right-4 z-50 w-11 h-11 rounded-lg bg-[#141414] border border-[#333] hover:border-brand-red hover:text-brand-red text-white flex items-center justify-center transition-all shadow-xl"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>

          {/* Botón Anterior */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
            }}
            aria-label="Trabajo anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-lg bg-black/75 hover:bg-brand-red hover:border-brand-red border border-[#333] text-white flex items-center justify-center transition-all shadow-xl hidden sm:flex"
          >
            <i className="fa-solid fa-chevron-left text-base" />
          </button>

          {/* Botón Siguiente */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
            }}
            aria-label="Siguiente trabajo"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-lg bg-black/75 hover:bg-brand-red hover:border-brand-red border border-[#333] text-white flex items-center justify-center transition-all shadow-xl hidden sm:flex"
          >
            <i className="fa-solid fa-chevron-right text-base" />
          </button>

          {/* Contenedor Modal */}
          <div
            className="relative z-30 max-w-4xl w-full bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Vista de Imagen */}
            <div className="relative flex-1 bg-black flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-[280px] sm:min-h-[400px]">
              <img
                src={activeLightboxItem.media.url}
                alt={activeLightboxItem.alt || activeLightboxItem.title}
                className="max-w-full max-h-[50vh] md:max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />

              {/* Indicador de posición */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-oswald tracking-widest text-brand-muted border border-white/10 uppercase">
                {lightboxIndex + 1} / {filteredItems.length}
              </div>
            </div>

            {/* Panel Lateral de Información */}
            <div className="w-full md:w-80 bg-[#141414] border-t md:border-t-0 md:border-l border-[#2a2a2a] p-6 flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-1 rounded bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-oswald uppercase tracking-widest mb-3">
                  {categoryMap.get(activeLightboxItem.categoryId) || 'Corte de Autor'}
                </span>

                <h3 className="text-xl font-oswald uppercase tracking-wide text-brand-text mb-2">
                  {activeLightboxItem.title}
                </h3>

                <p className="text-xs text-brand-muted font-light leading-relaxed mb-6">
                  {activeLightboxItem.alt ||
                    'Trabajo profesional realizado en ManuBarber con navaja, degradado milimétrico y productos de máxima fijación.'}
                </p>

                <div className="p-3.5 bg-[#111] border border-[#222] rounded-xl flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-xs">
                    <i className="fa-solid fa-scissors" />
                  </div>
                  <div>
                    <div className="text-xs font-oswald font-bold text-white uppercase tracking-wider">
                      ManuBarber Studio
                    </div>
                    <div className="text-[10px] text-brand-muted">
                      Street Craft · Japanese Discipline
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-3 pt-4 border-t border-brand-border/40">
                <Link
                  href="/#reserva"
                  onClick={() => setLightboxIndex(null)}
                  className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3 px-4 rounded-lg text-xs transition-all shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-calendar-check" />
                  Reservar este Estilo
                </Link>

                <button
                  onClick={() => setLightboxIndex(null)}
                  className="w-full bg-transparent hover:bg-[#1f1f1f] border border-[#333] text-brand-muted hover:text-white font-oswald uppercase tracking-widest py-2.5 px-4 rounded-lg text-xs transition-all"
                >
                  Volver a la Galería
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
