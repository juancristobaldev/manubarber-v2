'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loading, Reveal, Shell, clp, content, section, useSite } from '@/components/site';
import { BookingCalendar } from '@/components/booking-calendar';

export default function Home() {
  const { data, loading, error } = useSite();
  const [service, setService] = useState<any>();

  if (loading || error) return <Loading error={error} />;

  const site = content(data);
  const hero = site.homeHero ?? {};
  const brand = site.brand ?? {};
  const philosophy = site.philosophy ?? fallbackPhilosophy;
  const experience = site.experience ?? [];
  const testimonials = site.testimonials ?? [];
  const contact = site.contact ?? {};

  const title = (key: string, fallbackJp: string, fallbackTitle: string) => {
    const value = section(data, key);
    return {
      jp: value?.japaneseLabel ?? fallbackJp,
      title: value?.title || fallbackTitle,
    };
  };

  return (
    <Shell data={data}>
      {/* HERO SECTION */}
      <header className="relative min-h-[85vh] flex items-center justify-center text-center px-6 py-20 overflow-hidden bg-[#0a0a0a]">
        {/* Imagen de fondo con gradientes oscuros */}
        <div
          className="absolute inset-0 bg-cover bg-center filter grayscale opacity-30 transform scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${hero.imageUrl || '/images/hero.jpg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/90 pointer-events-none" />

        {/* Kanji decorativo central */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 font-jp font-black text-9xl md:text-[14rem] pointer-events-none select-none">
          {brand.heroJapanese || '己を磨け'}
        </div>

        {/* Contenido del Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand-surface border border-brand-border text-brand-red font-oswald tracking-widest text-xs mb-6 shadow-sm">
            STREET CRAFT · JAPANESE DISCIPLINE
          </span>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-oswald uppercase tracking-tight text-white mb-6 leading-none">
            {hero.title || 'Estilo, Precisión y Calle'}
          </h1>

          <p className="text-brand-muted max-w-2xl text-base md:text-lg font-light leading-relaxed mb-10">
            {hero.description ||
              'Barbería de autor inspirada en la disciplina japonesa y la autenticidad urbana. Cortes precisos, perfilado al detalle y una experiencia de alto nivel.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              className="bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-8 text-sm transition-all duration-300 transform hover:scale-[1.02] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center gap-2"
              href={hero.ctaHref || '#reserva'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {hero.ctaLabel || 'Reservar Hora'}
            </a>

            <a
              className="bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3.5 px-8 text-sm transition-all duration-300 rounded-lg"
              href="#servicios"
            >
              Explorar Servicios
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-oswald tracking-widest text-brand-muted uppercase">
          <span>SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-brand-red to-transparent animate-pulse" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-28">
        {/* SECCIÓN 1: FILOSOFÍA DE MARCA */}
        <section id="filosofia" className="scroll-mt-24">
          <SectionTitle
            jp={title('philosophy', '哲学', 'FILOSOFÍA DE MARCA').jp}
            title={title('philosophy', '哲学', 'FILOSOFÍA DE MARCA').title}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red text-[11px] font-oswald uppercase tracking-widest rounded-md">
                {philosophy.kicker || 'MANUBARBER · STREET CODE'}
              </span>

              <h3 className="text-3xl md:text-4xl font-oswald uppercase tracking-wide text-brand-text">
                {philosophy.title}
              </h3>

              <div className="space-y-4 text-brand-muted text-sm md:text-base font-light leading-relaxed">
                {philosophy.paragraphs?.map((paragraph: any, i: number) => (
                  <p key={paragraph.id ?? i}>{paragraph.text ?? paragraph}</p>
                ))}
              </div>

              {/* Pilares */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                {philosophy.pillars?.map((pillar: any, i: number) => (
                  <article
                    key={pillar.id ?? i}
                    className="p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl border-t-2 border-t-brand-red shadow-sm"
                  >
                    <strong className="block text-brand-text font-oswald uppercase tracking-wider text-sm mb-1">
                      {pillar.label}
                    </strong>
                    <span className="block text-brand-muted text-xs font-light">{pillar.description}</span>
                  </article>
                ))}
              </div>

              <blockquote className="border-l-2 border-brand-red pl-4 text-lg md:text-xl font-oswald tracking-wide text-white uppercase mt-6">
                “{philosophy.quote}”
              </blockquote>
            </div>

            {/* Fotografía de Filosofía */}
            <div className="relative group">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-brand-border bg-[#141414] shadow-2xl relative">
                <img
                  src={philosophy.imageUrl || '/images/image.png'}
                  alt={philosophy.imageAlt ?? 'Barbero ManuBarber'}
                  className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl bg-brand-red text-white flex items-center justify-center font-jp font-black text-2xl shadow-xl">
                {brand.japaneseMark || '磨'}
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: SERVICIOS SIGNATURE */}
        <section id="servicios" className="scroll-mt-24">
          <SectionTitle
            center
            jp={title('services', 'サービス', 'SERVICIOS SIGNATURE').jp}
            title={title('services', 'サービス', 'SERVICIOS SIGNATURE').title}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.services.map((item: any) => (
              <Reveal key={item.id}>
                <article className="bg-[#111] border border-[#2a2a2a] p-5 flex flex-col h-full card-hover rounded-2xl shadow-lg">
                  <div className="w-full aspect-video bg-[#1a1a1a] mb-5 overflow-hidden rounded-xl relative group">
                    <img
                      src={item.image?.url ?? '/images/hero.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover filter grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-60" />
                  </div>

                  <h4 className="text-xl font-oswald uppercase text-brand-text mb-2 tracking-wide font-semibold">
                    {item.name}
                  </h4>
                  <p className="text-sm text-brand-muted font-light leading-relaxed mb-6 flex-grow">
                    {item.description || 'Corte a elección con perfilado de precisión y acabado profesional.'}
                  </p>

                  <div className="flex items-center justify-between mb-5 border-t border-brand-border/50 pt-4">
                    <span className="text-xs font-oswald tracking-widest text-brand-muted uppercase">
                      {item.durationMinutes ? `${item.durationMinutes} MIN` : 'CONSULTAR'}
                    </span>
                    <span className="text-xl font-oswald text-brand-red font-bold">{clp(item.price)}</span>
                  </div>

                  <button
                    onClick={() => {
                      setService(item);
                      document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3 text-sm transition-colors rounded-lg shadow-md"
                  >
                    Reservar
                  </button>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* SECCIÓN 3: RESERVA TU EXPERIENCIA (WIZARD CANÓNICO) */}
        <section id="reserva" className="scroll-mt-24">
          <SectionTitle
            center
            jp={title('booking', '予約', 'RESERVA TU EXPERIENCIA').jp}
            title={title('booking', '予約', 'RESERVA TU EXPERIENCIA').title}
          />
          <BookingCalendar
            services={data.services}
            hours={data.businessHours}
            selected={service}
            onSelect={setService}
          />
        </section>

        {/* SECCIÓN 4: GALERÍA DE TRABAJOS */}
        <section id="obras" className="scroll-mt-24">
          <SectionTitle
            center
            jp={title('gallery', '作品', 'GALERÍA DE TRABAJOS').jp}
            title={title('gallery', '作品', 'GALERÍA DE TRABAJOS').title}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.galleryItems.map((item: any) => (
              <figure
                key={item.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-brand-border group card-hover bg-[#141414] shadow-md"
              >
                <img
                  src={item.media.url}
                  alt={item.alt || item.title}
                  className="w-full h-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <figcaption className="text-white font-oswald text-xs uppercase tracking-wider font-semibold">
                    {item.title}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/galeria"
              className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3 px-8 text-xs rounded-lg transition-all"
            >
              Ver Galería Completa
            </Link>
          </div>
        </section>

        {/* SECCIÓN 5: MEMBRESÍAS VIP */}
        <section id="membresias" className="scroll-mt-24">
          <SectionTitle
            center
            jp={title('memberships', '会員', 'MEMBRESÍAS').jp}
            title={title('memberships', '会員', 'MEMBRESÍAS').title}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {data.membershipPlans.map((plan: any) => {
              const isPopular = plan.isFeatured || plan.name?.toLowerCase().includes('barba');
              return (
                <article
                  key={plan.id}
                  className={`relative p-8 rounded-2xl flex flex-col card-hover transition-all duration-300 ${
                    isPopular
                      ? 'bg-[#111] border border-brand-red/80 shadow-[0_0_30px_rgba(217,30,24,0.15)] transform md:scale-105 z-10'
                      : 'bg-brand-surface border border-brand-border text-center shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red text-[10px] font-oswald tracking-widest uppercase px-5 py-1.5 rounded-full text-white shadow-lg shadow-brand-red/30">
                      {plan.badge || 'Más Popular'}
                    </span>
                  )}

                  <h4 className="text-xl font-oswald uppercase tracking-widest text-brand-text mt-2 mb-4 text-center">
                    {plan.name}
                  </h4>

                  <div className="mb-6 flex items-end justify-center gap-1">
                    <span className="text-4xl font-oswald font-bold text-brand-red">
                      {clp(plan.monthlyPrice)}
                    </span>
                    <span className="text-brand-muted text-sm font-light mb-1">/ mes</span>
                  </div>

                  <ul className="text-sm text-brand-text/90 font-light space-y-3 mb-8 flex-grow">
                    {plan.benefits.map((benefit: any) => (
                      <li key={benefit.id} className="flex items-center gap-3 border-b border-brand-border/30 pb-2.5">
                        <span className="text-brand-red text-xs font-bold">✓</span>
                        {benefit.text}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/vip"
                    className={`w-full py-3.5 text-xs font-oswald uppercase tracking-widest transition-colors rounded-lg text-center ${
                      isPopular
                        ? 'bg-brand-red hover:bg-brand-redHover text-white shadow-[0_4px_15px_rgba(217,30,24,0.4)]'
                        : 'bg-transparent border border-[#333] text-brand-text hover:border-brand-red hover:text-brand-red'
                    }`}
                  >
                    Conocer Plan VIP
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 6: CUIDADO Y PRODUCTOS PREMIUM */}
        <section id="productos" className="scroll-mt-24">
          <SectionTitle
            center
            jp={title('products', '商品', 'CUIDADO PREMIUM').jp}
            title={title('products', '商品', 'CUIDADO PREMIUM').title}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {data.products.map((product: any) => (
              <article
                key={product.id}
                className="bg-[#111] border border-[#2a2a2a] flex flex-col p-4 md:p-6 card-hover group text-center rounded-2xl shadow-sm"
              >
                <div className="w-full aspect-square bg-[#161616] mb-5 flex items-center justify-center relative overflow-hidden rounded-xl shadow-inner">
                  {product.badge && (
                    <span className="absolute top-2 right-2 bg-[#dfa43a] text-black text-[9px] font-bold px-2 py-1 rounded shadow uppercase z-10">
                      {product.badge}
                    </span>
                  )}
                  {product.image && (
                    <img
                      src={product.image.url}
                      alt={product.image.alt || product.name}
                      className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                    />
                  )}
                </div>

                <h4 className="text-sm font-oswald tracking-wide text-brand-text mb-2 uppercase">
                  {product.name}
                </h4>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm font-bold text-brand-red font-oswald">
                    {product.variants.map((v: any) => clp(v.price)).join(' · ')}
                  </span>
                </div>

                <Link
                  href="/tienda"
                  className="w-full mt-auto bg-transparent border border-[#333] text-brand-text group-hover:border-brand-red group-hover:text-brand-red font-oswald uppercase tracking-widest py-2.5 text-[10px] transition-colors rounded-lg"
                >
                  Ver Producto
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* SECCIÓN 7: EL ESTÁNDAR MANUBARBER */}
        <section className="scroll-mt-24">
          <SectionTitle
            center
            jp={title('experience', '体験', 'EL ESTÁNDAR MANUBARBER').jp}
            title={title('experience', '体験', 'EL ESTÁNDAR MANUBARBER').title}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {experience.map((item: any, index: number) => (
              <Reveal key={item.id ?? item.title} delay={index * 100}>
                <article className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl text-center card-hover shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center text-2xl mx-auto mb-4 border border-brand-red/20">
                    {item.icon || ['◈', '◉', '⬡', '◷'][index % 4]}
                  </div>
                  <h3 className="font-oswald uppercase tracking-wider text-sm font-bold mb-2 text-brand-text">
                    {item.title}
                  </h3>
                  <p className="text-xs text-brand-muted font-light leading-relaxed">{item.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* SECCIÓN 8: UBICACIÓN Y CONTACTO */}
        <section id="contacto" className="scroll-mt-24">
          <SectionTitle
            jp={title('contact', '場所', 'UBICACIÓN Y CONTACTO').jp}
            title={title('contact', '場所', 'UBICACIÓN Y CONTACTO').title}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <article className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl shadow-lg space-y-6">
              <p className="text-sm text-brand-muted font-light leading-relaxed">
                {section(data, 'contact')?.subtitle ||
                  'Visítanos. Espacio diseñado para el confort, el detalle y la estética masculina de precisión.'}
              </p>

              <div>
                <h4 className="text-xs font-oswald tracking-widest text-brand-red uppercase mb-1">Dirección</h4>
                <p className="text-brand-text font-light text-sm">
                  {contact.address}, {contact.city}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-oswald tracking-widest text-brand-red uppercase mb-2">Horarios</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-brand-muted font-light">
                  {data.businessHours?.map((hours: any) => (
                    <div key={hours.dayOfWeek} className="flex justify-between border-b border-brand-border/30 pb-1">
                      <span>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][hours.dayOfWeek - 1]}:</span>
                      <span className="text-brand-text font-medium">
                        {hours.isClosed ? 'Cerrado' : `${hours.opensAt} – ${hours.closesAt}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 rounded-lg text-sm text-center block shadow-[0_4px_14px_rgba(217,30,24,0.3)] transition-colors mt-6"
                href="#reserva"
              >
                Reservar Mi Hora
              </a>
            </article>

            {/* Iframe Mapa con bordes suavizados */}
            <div className="rounded-2xl border border-[#2a2a2a] overflow-hidden shadow-lg h-[380px] bg-[#141414]">
              <iframe
                src={contact.mapEmbedUrl}
                loading="lazy"
                title="Ubicación ManuBarber"
                className="w-full h-full border-0 filter grayscale contrast-125"
              />
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}

function SectionTitle({ jp, title, center = false }: { jp?: string; title: string; center?: boolean }) {
  return (
    <Reveal className={`relative mb-12 ${center ? 'text-center' : ''}`}>
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

const fallbackPhilosophy = {
  japaneseTitle: 'ESTILO',
  kicker: 'MANUBARBER · STREET CODE',
  title: 'CALLE EN EL ALMA. TÉCNICA EN CADA DETALLE.',
  paragraphs: [
    {
      text: 'ManuBarber nace en la calle: identidad propia, actitud real y respeto por tu imagen. No copiamos estilos; le damos forma al tuyo.',
    },
    {
      text: 'Trabajamos cada corte con técnica profesional, herramientas impecables y atención obsesiva al detalle. Porque el flow se siente, pero la precisión se nota.',
    },
  ],
  pillars: [
    { label: 'CALLE', description: 'Identidad, actitud y estilo sin copias.' },
    { label: 'RESPETO', description: 'Puntualidad y atención profesional.' },
    { label: 'TÉCNICA', description: 'Fade, textura y perfilado con precisión.' },
  ],
  quote: 'TU IMAGEN HABLA ANTES QUE TÚ.',
  imageUrl: '/images/image.png',
  imageAlt: 'Barbero trabajando con precisión y estilo urbano',
};
