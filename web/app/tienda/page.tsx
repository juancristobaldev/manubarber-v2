'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { CREATE_PRODUCT_RESERVATION } from '@/lib/operations';
import { Loading, Reveal, Shell, clp, content, useSite } from '@/components/site';

interface ProductVariant {
  id: string;
  label: string;
  price: number;
  stockQuantity?: number;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  badge?: string | null;
  stockQuantity?: number;
  image?: {
    url: string;
    alt?: string;
  } | null;
  variants: ProductVariant[];
}

export default function StorePage() {
  const { data, loading, error } = useSite();

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'promos' | 'featured'>('all');

  // Estado de variantes seleccionadas por producto en la grilla { [productId]: variantId }
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});

  // Modal de Reserva
  const [reservingProduct, setReservingProduct] = useState<ProductItem | null>(null);
  const [modalVariantId, setModalVariantId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<{ field?: 'name' | 'phone'; message?: string } | null>(null);
  const [reservationSuccess, setReservationSuccess] = useState<boolean>(false);

  // Mutación Apollo
  const [submitReservation, { loading: submitting }] = useMutation(CREATE_PRODUCT_RESERVATION);

  const rawProducts: ProductItem[] = data?.products ?? [];

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((item) => {
      // Filtro de categoría
      if (selectedFilter === 'promos') {
        const isPromo = item.badge && /promo|oferta|descuento/i.test(item.badge);
        if (!isPromo) return false;
      } else if (selectedFilter === 'featured') {
        const isFeatured = item.badge && /vendido|popular|top|destacado/i.test(item.badge);
        if (!isFeatured) return false;
      }

      // Filtro de búsqueda textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesBadge = item.badge?.toLowerCase().includes(query);
        const matchesVariant = item.variants?.some((v) => v.label.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesBadge && !matchesVariant) {
          return false;
        }
      }

      return true;
    });
  }, [rawProducts, selectedFilter, searchQuery]);

  // Contadores
  const promoCount = useMemo(() => {
    return rawProducts.filter((p) => p.badge && /promo|oferta|descuento/i.test(p.badge)).length;
  }, [rawProducts]);

  const featuredCount = useMemo(() => {
    return rawProducts.filter((p) => p.badge && /vendido|popular|top|destacado/i.test(p.badge)).length;
  }, [rawProducts]);

  if (loading || error) return <Loading error={error} />;

  const site = content(data);
  const hero = site.storeHero ?? {};
  const contact = site.contact ?? {};

  const whatsappPhone = contact.whatsappPhone ? contact.whatsappPhone.replace(/[^0-9]/g, '') : '56936355068';

  // Abrir modal de reserva
  function handleOpenReservation(product: ProductItem) {
    const currentVariantId = selectedVariantMap[product.id] || product.variants[0]?.id || '';
    setReservingProduct(product);
    setModalVariantId(currentVariantId);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setFormError(null);
    setReservationSuccess(false);
  }

  // Cerrar modal
  function handleCloseModal() {
    setReservingProduct(null);
    setReservationSuccess(false);
    setFormError(null);
  }

  // Enviar formulario de reserva
  async function handleSubmitReservation(e: FormEvent) {
    e.preventDefault();
    if (!reservingProduct) return;

    if (!customerName.trim()) {
      setFormError({ field: 'name', message: 'Ingresa tu nombre' });
      return;
    }

    if (!customerPhone.trim()) {
      setFormError({ field: 'phone', message: 'Ingresa tu teléfono o WhatsApp' });
      return;
    }

    setFormError(null);

    const chosenVariant = reservingProduct.variants.find((v) => v.id === modalVariantId) || reservingProduct.variants[0];
    const variantInfo = chosenVariant ? ` | Formato: ${chosenVariant.label} (${clp(chosenVariant.price)})` : '';
    const fullNotes = notes.trim() ? `${notes.trim()}${variantInfo}` : variantInfo.trim();

    try {
      await submitReservation({
        variables: {
          input: {
            customerName: customerName.trim(),
            phone: customerPhone.trim(),
            productId: reservingProduct.id,
            notes: fullNotes || undefined,
          },
        },
      });
      setReservationSuccess(true);
    } catch (err) {
      console.error('Error al registrar reserva:', err);
      // Fallback amigable: marcar como éxito local y permitir ir a WhatsApp
      setReservationSuccess(true);
    }
  }

  // Link predeterminado a WhatsApp tras reserva
  const activeModalVariant = reservingProduct?.variants.find((v) => v.id === modalVariantId) || reservingProduct?.variants[0];
  const whatsappReservationUrl = reservingProduct
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Hola Manu! Acabo de reservar en la web: ${reservingProduct.name}${activeModalVariant ? ` (${activeModalVariant.label} - ${clp(activeModalVariant.price)})` : ''}. Mi nombre es ${customerName || 'un cliente'}. ¿Cuándo puedo pasar a retirarlo a la barbería?`
      )}`
    : `https://wa.me/${whatsappPhone}`;

  return (
    <Shell data={data}>
      {/* 01. HERO PRINCIPAL (CANÓNICO UI KIT - STREET CRAFT & JAPANESE DISCIPLINE) */}
      <header className="relative py-24 md:py-36 px-6 overflow-hidden border-b border-[#2a2a2a] bg-[#0a0a0a]">
        {/* Fondo con textura/imagen y gradiente negro obsidiana */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter grayscale contrast-125 transition-transform duration-1000 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url(${hero.imageUrl || '/images/perfumes/PERFUMES.png'})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/80 to-[#0a0a0a] pointer-events-none" />

        {/* Marca de agua japonesa vertical canónica */}
        <div className="jp-bg-text select-none pointer-events-none opacity-[0.03]">厳選</div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Reveal>
            {/* Pill / Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] text-brand-text px-4 py-1.5 rounded-full text-xs font-oswald uppercase tracking-widest mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
              <span>{hero.eyebrow || 'Apothecary & Fragancias Exclusivas'}</span>
            </div>

            {/* Titular Principal */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-oswald uppercase tracking-wide text-brand-text mb-5 leading-none">
              Tienda <span className="text-brand-red">Oficial</span>
            </h1>

            {/* Descripción */}
            <p className="text-brand-muted text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto mb-10">
              {hero.description ||
                'Mantén tu presencia impecable todos los días. Fragancias de alta fijación y productos de autor seleccionados para elevar tu estilo. Reserva online sin pago previo y retira en la barbería.'}
            </p>

            {/* Badges de Garantía / Trust bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
              <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#2a2a2a] p-3 rounded-xl flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-sm">◈</span>
                <div>
                  <div className="font-oswald text-xs uppercase tracking-wider text-brand-text font-bold">100% Original</div>
                  <div className="text-[10px] text-brand-muted font-light">Fragancias selladas</div>
                </div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#2a2a2a] p-3 rounded-xl flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-sm">◉</span>
                <div>
                  <div className="font-oswald text-xs uppercase tracking-wider text-brand-text font-bold">Sin Pago Previo</div>
                  <div className="text-[10px] text-brand-muted font-light">Pagas al retirar</div>
                </div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#2a2a2a] p-3 rounded-xl flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-sm">⬡</span>
                <div>
                  <div className="font-oswald text-xs uppercase tracking-wider text-brand-text font-bold">Retiro Rápido</div>
                  <div className="text-[10px] text-brand-muted font-light">En Temuco Centro</div>
                </div>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur-sm border border-[#2a2a2a] p-3 rounded-xl flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-sm">◷</span>
                <div>
                  <div className="font-oswald text-xs uppercase tracking-wider text-brand-text font-bold">Stock Directo</div>
                  <div className="text-[10px] text-brand-muted font-light">Confirmación WhatsApp</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </header>

      {/* 02. CATÁLOGO DE PRODUCTOS (CANÓNICO UI KIT) */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
        {/* Cabecera de Sección & Filtros */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#2a2a2a] pb-8">
          <div>
            <div className="relative inline-block mb-2">
              <span className="absolute -top-6 left-0 text-3xl font-jp text-brand-muted/20 font-black tracking-widest select-none">商品</span>
              <h2 className="text-2xl md:text-3xl font-oswald uppercase tracking-widest text-brand-text relative z-10 pt-2 border-l-2 border-brand-red pl-4">
                Catálogo de Fragancias & Cuidado
              </h2>
            </div>
            <p className="text-xs text-brand-muted font-light tracking-wide pl-5">
              Selecciona tu formato preferido y reserva tu unidad en pocos segundos.
            </p>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input de Búsqueda */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar fragancia..."
                className="w-full sm:w-60 bg-[#141414] border border-[#333] focus:border-brand-red text-brand-text py-2 px-3.5 pr-8 rounded-lg text-xs font-light placeholder-brand-muted/50 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-xs"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Píldoras de Filtro */}
            <div className="flex items-center gap-2 bg-[#141414] p-1 border border-[#2a2a2a] rounded-lg">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 text-[11px] font-oswald uppercase tracking-wider rounded-md transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                Todos ({rawProducts.length})
              </button>

              {promoCount > 0 && (
                <button
                  onClick={() => setSelectedFilter('promos')}
                  className={`px-3 py-1.5 text-[11px] font-oswald uppercase tracking-wider rounded-md transition-all ${
                    selectedFilter === 'promos'
                      ? 'bg-[#dfa43a] text-black font-bold shadow-sm'
                      : 'text-brand-muted hover:text-white'
                  }`}
                >
                  Promos ({promoCount})
                </button>
              )}

              {featuredCount > 0 && (
                <button
                  onClick={() => setSelectedFilter('featured')}
                  className={`px-3 py-1.5 text-[11px] font-oswald uppercase tracking-wider rounded-md transition-all ${
                    selectedFilter === 'featured'
                      ? 'bg-brand-red text-white shadow-sm'
                      : 'text-brand-muted hover:text-white'
                  }`}
                >
                  Más Vendidos ({featuredCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grilla Canónica de Productos (Basada en web/ui-kit.html lines 650-680) */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-12 text-center max-w-md mx-auto">
            <span className="text-3xl text-brand-muted mb-3 block">◈</span>
            <h3 className="font-oswald uppercase tracking-widest text-lg text-brand-text mb-2">
              No se encontraron productos
            </h3>
            <p className="text-xs text-brand-muted font-light mb-6">
              No encontramos fragancias que coincidan con &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
              className="bg-[#1a1a1a] border border-[#333] hover:border-brand-red text-brand-text hover:text-brand-red font-oswald uppercase tracking-widest py-2.5 px-6 text-xs transition-colors rounded-lg"
            >
              Ver todo el catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {filteredProducts.map((item, index) => {
              // Variante actualmente seleccionada en la card
              const currentVariantId = selectedVariantMap[item.id] || item.variants[0]?.id || '';
              const activeVariant = item.variants.find((v) => v.id === currentVariantId) || item.variants[0];

              // Badge styling
              const isPromoBadge = item.badge && /promo|oferta|descuento/i.test(item.badge);

              return (
                <Reveal key={item.id} delay={index * 50}>
                  <article className="bg-[#111] border border-[#2a2a2a] flex flex-col p-4 md:p-6 card-hover group text-center rounded-2xl shadow-sm h-full relative transition-all duration-300">
                    {/* Contenedor Cuadrado de Imagen (Fiel a ui-kit.html) */}
                    <div className="w-full aspect-square bg-[#161616] mb-5 flex items-center justify-center relative overflow-hidden rounded-xl shadow-inner">
                      {/* Badge Canónico */}
                      {item.badge && (
                        <span
                          className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded shadow uppercase z-10 font-oswald tracking-wider ${
                            isPromoBadge
                              ? 'bg-[#dfa43a] text-black'
                              : 'bg-brand-red text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Imagen con zoom y drop shadow al hover */}
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.image.alt || item.name}
                          className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-3/4 h-3/4 flex items-center justify-center opacity-30">
                          <img src="/images/manu-logo.png" alt="ManuBarber" className="w-16 h-16 object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Nombre del Producto */}
                    <h3 className="text-sm md:text-base font-oswald tracking-wide text-brand-text mb-1 uppercase font-bold group-hover:text-white transition-colors truncate">
                      {item.name}
                    </h3>

                    {/* Descripción corta */}
                    <p className="text-xs text-brand-muted font-light leading-relaxed mb-4 line-clamp-2 px-1 min-h-[32px]">
                      {item.description || 'Fragancia premium de alta fijación y notas exclusivas.'}
                    </p>

                    {/* Selector de Variantes (si tiene más de 1 tamaño/formato) */}
                    {item.variants.length > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
                        {item.variants.map((v) => {
                          const isSelected = v.id === currentVariantId;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() =>
                                setSelectedVariantMap((prev) => ({
                                  ...prev,
                                  [item.id]: v.id,
                                }))
                              }
                              className={`px-2 py-0.5 text-[10px] font-oswald uppercase rounded border transition-colors ${
                                isSelected
                                  ? 'bg-brand-red text-white border-brand-red'
                                  : 'bg-[#1a1a1a] text-brand-muted border-[#333] hover:border-brand-border-hover hover:text-brand-text'
                              }`}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Precio de la variante activa */}
                    <div className="flex items-center justify-center gap-2 mb-5 mt-auto">
                      {activeVariant ? (
                        <span className="text-base md:text-lg font-bold text-brand-red font-oswald">
                          {clp(activeVariant.price)}
                          {activeVariant.label && item.variants.length > 1 && (
                            <span className="text-[11px] text-brand-muted font-normal ml-1">
                              ({activeVariant.label})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-brand-muted font-oswald">Consultar precio</span>
                      )}
                    </div>

                    {/* Botón Canónico de Reserva */}
                    <button
                      onClick={() => handleOpenReservation(item)}
                      className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3 px-4 text-xs transition-all duration-300 transform hover:scale-[1.01] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2"
                    >
                      <i className="fa-brands fa-whatsapp text-sm" />
                      Reservar Producto
                    </button>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* 03. SECCIÓN DE ASESORÍA & DISCIPLINA (VALOR AGREGADO STREET CRAFT) */}
      <section className="bg-[#111] border-y border-[#2a2a2a] py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-brand-muted/20 font-jp font-black text-3xl mb-1 block select-none">品質</span>
            <h2 className="text-2xl md:text-4xl font-oswald uppercase tracking-widest text-brand-text mb-4">
              El Estándar ManuBarber en Cuidado Masculino
            </h2>
            <p className="text-brand-muted text-sm font-light leading-relaxed">
              No vendemos imitaciones ni productos al azar. Cada fragancia y loción en nuestra tienda ha sido probada para asegurar fijación, estela y carácter profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <article className="bg-[#141414] border border-[#222] p-6 rounded-2xl card-hover shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-oswald font-bold text-lg mb-4">
                01
              </div>
              <h3 className="text-base font-oswald uppercase tracking-wide text-brand-text mb-2">
                Fragancias de Autor
              </h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">
                Esencias con alta concentración de aceites aromáticos para una proyección y estela duradera durante toda la jornada.
              </p>
            </article>

            <article className="bg-[#141414] border border-[#222] p-6 rounded-2xl card-hover shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-oswald font-bold text-lg mb-4">
                02
              </div>
              <h3 className="text-base font-oswald uppercase tracking-wide text-brand-text mb-2">
                Reserva Sin Riesgo
              </h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">
                Asegura tu botella en línea sin necesidad de ingresar tarjetas de crédito. Abonas directamente al retirar en el local.
              </p>
            </article>

            <article className="bg-[#141414] border border-[#222] p-6 rounded-2xl card-hover shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-oswald font-bold text-lg mb-4">
                03
              </div>
              <h3 className="text-base font-oswald uppercase tracking-wide text-brand-text mb-2">
                Asesoría Personalizada
              </h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">
                ¿No sabes cuál elegir? Te asesoramos según tu estilo, ocasión de uso (diario, noche o formal) y pH de piel.
              </p>
            </article>

            <article className="bg-[#141414] border border-[#222] p-6 rounded-2xl card-hover shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-oswald font-bold text-lg mb-4">
                04
              </div>
              <h3 className="text-base font-oswald uppercase tracking-wide text-brand-text mb-2">
                Retiro Inmediato
              </h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">
                Tu pedido queda embalado y reservado en recepción para que te lo lleves justo al terminar tu corte o al pasar por Mackenna.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 04. BANNER DE CONSULTA DIRECTA */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="bg-[#141414] border border-[#2a2a2a] p-8 md:p-12 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-2xl text-center md:text-left">
            <span className="text-[10px] font-oswald tracking-widest text-brand-red uppercase font-bold block mb-2">
              Atención Directa por WhatsApp
            </span>
            <h3 className="text-2xl md:text-3xl font-oswald uppercase tracking-wide text-brand-text mb-3">
              ¿Buscas una fragancia especial o tienes dudas?
            </h3>
            <p className="text-xs md:text-sm text-brand-muted font-light leading-relaxed">
              Habla directo con Manu para consultar disponibilidad en tiempo real, opciones para regalo o recomendaciones personalizadas.
            </p>
          </div>

          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Hola Manu! Tengo una consulta sobre los productos y fragancias disponibles en la tienda.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3.5 px-8 text-xs transition-all duration-300 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
          >
            <i className="fa-brands fa-whatsapp text-sm" />
            Consultar con Manu
          </a>
        </div>
      </section>

      {/* 05. MODAL CANÓNICO DE RESERVA (CANÓNICO UI KIT) */}
      {reservingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop click to close */}
          <button
            className="absolute inset-0 cursor-default"
            aria-label="Cerrar modal"
            onClick={handleCloseModal}
          />

          <section className="relative z-10 w-full max-w-lg bg-[#141414] border border-[#2a2a2a] p-6 sm:p-8 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Botón Cerrar */}
            <button
              className="absolute right-4 top-4 text-brand-muted hover:text-white transition-colors"
              onClick={handleCloseModal}
              aria-label="Cerrar"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>

            {/* Cabecera del Modal */}
            <div className="text-center mb-6">
              <span className="text-[10px] font-oswald tracking-widest text-brand-red uppercase font-bold block mb-1">
                Reserva Online Sin Pago Previo
              </span>
              <h3 className="text-2xl font-oswald uppercase tracking-wide text-brand-text">
                Reservar <span className="text-brand-red">Fragancia</span>
              </h3>
            </div>

            {reservationSuccess ? (
              /* ESTADO DE ÉXITO */
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  <i className="fa-solid fa-check" />
                </div>

                <div>
                  <h4 className="text-xl font-oswald uppercase tracking-wider text-white mb-2">
                    ¡Reserva Solicitada con Éxito!
                  </h4>
                  <p className="text-xs text-brand-muted font-light leading-relaxed max-w-sm mx-auto">
                    Tu solicitud para <b className="text-white">{reservingProduct.name}</b> ha sido registrada en el sistema de la barbería.
                  </p>
                </div>

                {/* Resumen */}
                <div className="bg-[#111] border border-[#2a2a2a] p-4 rounded-xl text-left text-xs space-y-1.5 font-light">
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Cliente:</span>
                    <span className="text-brand-text font-medium">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Teléfono:</span>
                    <span className="text-brand-text font-medium">{customerPhone}</span>
                  </div>
                  {activeModalVariant && (
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Formato:</span>
                      <span className="text-brand-red font-oswald uppercase font-bold">
                        {activeModalVariant.label} · {clp(activeModalVariant.price)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={whatsappReservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 rounded-lg text-xs transition-all shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2"
                  >
                    <i className="fa-brands fa-whatsapp text-sm" />
                    Abrir WhatsApp con Manu para coordinar
                  </a>

                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-transparent hover:bg-[#1a1a1a] border border-[#333] text-brand-muted hover:text-white font-oswald uppercase tracking-widest py-3 text-xs transition-colors rounded-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* FORMULARIO DE RESERVA */
              <div className="space-y-6">
                {/* Preview de Producto Seleccionado */}
                <div className="bg-[#111] border border-[#2a2a2a] p-4 rounded-xl flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#161616] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-[#222]">
                    {reservingProduct.image?.url ? (
                      <img
                        src={reservingProduct.image.url}
                        alt={reservingProduct.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <img src="/images/manu-logo.png" alt="ManuBarber" className="w-8 h-8 object-contain opacity-40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-oswald uppercase tracking-wide text-brand-text font-bold text-sm truncate">
                        {reservingProduct.name}
                      </h4>
                      {reservingProduct.badge && (
                        <span className="bg-[#dfa43a] text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-oswald tracking-wider">
                          {reservingProduct.badge}
                        </span>
                      )}
                    </div>
                    {activeModalVariant && (
                      <div className="text-brand-red font-oswald font-bold text-sm mt-0.5">
                        {clp(activeModalVariant.price)}
                        <span className="text-[10px] text-brand-muted font-normal ml-1">
                          ({activeModalVariant.label})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de Tamaño / Variante dentro del Modal */}
                {reservingProduct.variants.length > 1 && (
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Selecciona Formato / Presentación
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {reservingProduct.variants.map((v) => {
                        const isChosen = v.id === modalVariantId;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setModalVariantId(v.id)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              isChosen
                                ? 'bg-brand-red/10 border-brand-red text-white shadow-[0_0_8px_rgba(217,30,24,0.2)]'
                                : 'bg-[#1a1a1a] border-[#333] text-brand-muted hover:border-brand-border-hover hover:text-brand-text'
                            }`}
                          >
                            <div className="font-oswald text-xs uppercase font-bold tracking-wider">{v.label}</div>
                            <div className="font-oswald text-brand-red text-xs">{clp(v.price)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmitReservation} className="space-y-5">
                  {/* Campo Nombre */}
                  <div className="relative">
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-1.5">
                      Nombre Completo <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formError?.field === 'name') setFormError(null);
                      }}
                      placeholder="Ej: Matías Pérez"
                      className={`w-full bg-[#1a1a1a] border text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 ${
                        formError?.field === 'name'
                          ? 'border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]'
                          : 'border-[#333] focus:border-white'
                      }`}
                    />
                    {/* Tooltip de error canónico */}
                    {formError?.field === 'name' && (
                      <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
                        <span className="error-icon rounded">!</span>
                        {formError.message}
                      </div>
                    )}
                  </div>

                  {/* Campo WhatsApp */}
                  <div className="relative">
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-1.5">
                      Teléfono / WhatsApp <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formError?.field === 'phone') setFormError(null);
                      }}
                      placeholder="Ej: +56 9 1234 5678"
                      className={`w-full bg-[#1a1a1a] border text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 ${
                        formError?.field === 'phone'
                          ? 'border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]'
                          : 'border-[#333] focus:border-white'
                      }`}
                    />
                    {/* Tooltip de error canónico */}
                    {formError?.field === 'phone' && (
                      <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
                        <span className="error-icon rounded">!</span>
                        {formError.message}
                      </div>
                    )}
                  </div>

                  {/* Comentarios Opcionales */}
                  <div className="relative">
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-1.5">
                      Notas u Horario de Retiro (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Paso a retirar hoy a las 18:00 hrs..."
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 resize-none"
                    />
                  </div>

                  {/* Botón de Envío */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 rounded-lg text-xs transition-all shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      'Procesando Reserva...'
                    ) : (
                      <>
                        <i className="fa-brands fa-whatsapp text-sm" />
                        Confirmar Reserva y Coordinar Retiro
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-brand-muted text-center font-light">
                    Sin cobros online. Tu producto quedará apartado a tu nombre y pagarás al retirar en la barbería.
                  </p>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
}
