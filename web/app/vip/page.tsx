'use client';

import { useState } from 'react';
import {
  LeadForm,
  Loading,
  Modal,
  Reveal,
  Shell,
  clp,
  content,
  useSite,
} from '@/components/site';

function SectionTitle({
  jp,
  title,
  center = false,
}: {
  jp?: string;
  title: string;
  center?: boolean;
}) {
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-center justify-between gap-4 font-oswald text-sm md:text-base tracking-wide uppercase text-brand-text hover:text-white transition-colors"
      >
        <span>{question}</span>
        <i
          className={`fa-solid fa-chevron-down text-brand-muted text-xs transition-transform duration-300 ${
            open ? 'rotate-180 text-brand-red' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-brand-muted font-light font-sans leading-relaxed border-t border-[#222]">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Vip() {
  const { data, loading, error } = useSite();
  const [plan, setPlan] = useState<any>();

  if (loading || error) return <Loading error={error} />;

  const site = content(data);
  const brand = site.brand ?? {};
  const hero = site.vipHero ?? {};
  const comparison = site.vipComparison ?? {};
  const plans = data?.membershipPlans ?? [];

  return (
    <Shell data={data} tone="gold">
      {/* HERO SECTION DE ALTO IMPACTO */}
      <header className="relative min-h-[85vh] flex items-center justify-center text-center px-6 py-24 overflow-hidden bg-[#0a0a0a]">
        {/* Imagen de fondo con gradientes oscuros */}
        <div
          className="absolute inset-0 bg-cover bg-center filter grayscale opacity-25 transform scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${hero.imageUrl || '/images/hero.jpg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/75 to-[#0a0a0a]/90 pointer-events-none" />

        {/* Kanji decorativo central */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 font-jp font-black text-9xl md:text-[14rem] pointer-events-none select-none">
          {brand.heroJapanese || '会員'}
        </div>

        {/* Marca de agua vertical japonesa */}
        <div className="jp-bg-text">会員</div>

        {/* Contenido del Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface border border-brand-border text-brand-red font-oswald tracking-widest text-xs uppercase mb-6 shadow-sm">
            <i className="fa-solid fa-crown text-[10px]" />
            <span>{hero.eyebrow || 'Membresía Exclusiva · Tarjeta VIP'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-oswald uppercase tracking-tight text-white mb-6 leading-none">
            {hero.title || 'CLIENTES VIP'}
          </h1>

          <p className="text-brand-muted max-w-2xl text-base md:text-lg font-light font-sans leading-relaxed mb-10">
            {hero.description ||
              'Cortes asegurados todo el mes. Mantén tu imagen intacta pagando menos. Exclusividad, agendamiento prioritario y el estándar de precisión ManuBarber.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#planes"
              className="bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-8 text-sm transition-all duration-300 transform hover:scale-[1.02] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center gap-2"
            >
              <i className="fa-solid fa-crown text-xs" />
              <span>Ver Planes de Membresía</span>
            </a>

            <a
              href="#comparacion"
              className="bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3.5 px-8 text-sm transition-all duration-300 rounded-lg flex items-center gap-2"
            >
              ¿Cómo Funciona?
            </a>
          </div>
        </div>

        {/* Indicador de Scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-oswald tracking-widest text-brand-muted uppercase">
          <span>SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-brand-red to-transparent animate-pulse" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-28">
        {/* PILARES / PRIVILEGIOS VIP (ESTILO KPI CANÓNICO UI KIT) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal delay={0}>
            <div className="bg-[#141414] border border-[#222] rounded-xl p-5 flex items-center gap-4 card-hover shadow-md h-full">
              <div className="w-12 h-12 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-calendar-check" />
              </div>
              <div>
                <h3 className="text-base font-oswald uppercase font-bold tracking-wide text-brand-text mb-1">
                  Agenda Prioritaria
                </h3>
                <p className="text-xs text-brand-muted font-light font-sans leading-relaxed">
                  Acceso exclusivo a horarios punta antes que se abran al público general.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-[#141414] border border-[#222] rounded-xl p-5 flex items-center gap-4 card-hover shadow-md h-full">
              <div className="w-12 h-12 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <div>
                <h3 className="text-base font-oswald uppercase font-bold tracking-wide text-brand-text mb-1">
                  Tarifa Congelada
                </h3>
                <p className="text-xs text-brand-muted font-light font-sans leading-relaxed">
                  Garantiza tus cortes mensuales a un valor fijo sin variaciones de precio.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="bg-[#141414] border border-[#222] rounded-xl p-5 flex items-center gap-4 card-hover shadow-md h-full">
              <div className="w-12 h-12 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-id-card" />
              </div>
              <div>
                <h3 className="text-base font-oswald uppercase font-bold tracking-wide text-brand-text mb-1">
                  Tarjeta VIP Física
                </h3>
                <p className="text-xs text-brand-muted font-light font-sans leading-relaxed">
                  Credencial oficial de socio para atención inmediata y descuentos en tienda.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* SECCIÓN 1: COMPARATIVA FINANCIERA */}
        <section id="comparacion" className="scroll-mt-24">
          <SectionTitle jp="比較" title="¿CÓMO SER UN CLIENTE VIP?" center={true} />

          <p className="text-center text-brand-muted font-light font-sans max-w-2xl mx-auto -mt-6 mb-12 text-sm md:text-base leading-relaxed">
            Compara el gasto recurrente de un cliente estándar frente a la membresía mensual VIP. Menos coste, cero complicaciones y tu corte siempre impecable.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Sin Membresía */}
            <Reveal delay={50}>
              <article className="bg-[#141414] border border-[#2a2a2a] p-8 rounded-2xl flex flex-col justify-between card-hover relative h-full">
                <div>
                  <span className="text-[10px] font-oswald tracking-widest uppercase px-3.5 py-1 rounded-full bg-[#1c1c1c] text-brand-muted border border-brand-border inline-block w-fit mb-6">
                    Cliente Ocasional
                  </span>

                  <h3 className="text-2xl font-oswald uppercase tracking-wide text-brand-text mb-4">
                    Sin Membresía
                  </h3>

                  <ul className="space-y-4 text-sm text-brand-muted font-light font-sans mb-8">
                    <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                      <span className="text-brand-muted text-xs mt-0.5">•</span>
                      <span>Por lo general te cortas <b>{comparison.visits || 4} veces al mes</b>.</span>
                    </li>
                    <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                      <span className="text-brand-muted text-xs mt-0.5">•</span>
                      <span>Pagas <b>{clp(comparison.individualPrice || 10000)}</b> por cada corte individual.</span>
                    </li>
                    <li className="flex items-start gap-3 pb-3">
                      <span className="text-brand-muted text-xs mt-0.5">•</span>
                      <span>Sujeto a disponibilidad de agenda y alzas de tarifa sin aviso previo.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-brand-border/40">
                  <span className="block text-[10px] font-oswald uppercase tracking-widest text-brand-muted mb-1">
                    Gasto Mensual Estimado:
                  </span>
                  <strong className="text-3xl md:text-4xl font-oswald font-bold text-brand-muted line-through block">
                    {clp(comparison.standardTotal || 40000)}
                  </strong>
                </div>
              </article>
            </Reveal>

            {/* Con Tarjeta VIP (Winner) */}
            <Reveal delay={150}>
              <article className="bg-[#111] border-2 border-brand-red p-8 rounded-2xl flex flex-col justify-between relative shadow-[0_0_30px_rgba(217,30,24,0.18)] card-hover transform md:scale-[1.02] h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-red/10 via-transparent to-transparent pointer-events-none rounded-2xl" />

                <div className="relative z-10">
                  <span className="text-[10px] font-oswald tracking-widest uppercase px-4 py-1.5 rounded-full bg-brand-red text-white shadow-md inline-flex items-center gap-1.5 mb-6 font-bold">
                    <i className="fa-solid fa-crown text-[9px]" /> Membresía Activa
                  </span>

                  <h3 className="text-2xl font-oswald uppercase tracking-wide text-white mb-4">
                    Con Tarjeta VIP
                  </h3>

                  <ul className="space-y-4 text-sm text-brand-text/90 font-light font-sans mb-8">
                    <li className="flex items-start gap-3 border-b border-brand-border/40 pb-3">
                      <span className="text-brand-red text-xs mt-0.5">✓</span>
                      <span>Tienes tus <b>{comparison.visits || 4} cortes asegurados</b> del mes.</span>
                    </li>
                    <li className="flex items-start gap-3 border-b border-brand-border/40 pb-3">
                      <span className="text-brand-red text-xs mt-0.5">✓</span>
                      <span>Congelas tu precio mensual sin sufrir alzas de tarifa.</span>
                    </li>
                    <li className="flex items-start gap-3 pb-3">
                      <span className="text-brand-red text-xs mt-0.5">✓</span>
                      <span>Agendamiento prioritario directo vía WhatsApp y tarjeta física oficial.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-brand-border/40 relative z-10">
                  <span className="block text-[10px] font-oswald uppercase tracking-widest text-brand-red mb-1 font-bold">
                    Pagas Únicamente:
                  </span>
                  <div className="flex items-baseline gap-2 mb-3">
                    <strong className="text-4xl md:text-5xl font-oswald font-bold text-brand-red drop-shadow-md">
                      {clp(comparison.vipPrice || 35000)}
                    </strong>
                    <span className="text-brand-muted text-sm font-light">/ mes</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-brand-red/15 border border-brand-red/40 px-3.5 py-1.5 rounded-lg text-white font-oswald text-xs uppercase tracking-wider font-bold">
                    <i className="fa-solid fa-bolt text-brand-red" />
                    <span>¡Ahorras {clp(comparison.savings || 5000)} cada mes!</span>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        {/* SECCIÓN 2: PLANES DE MEMBRESÍA (CANÓNICO UI KIT) */}
        <section id="planes" className="scroll-mt-24">
          <SectionTitle jp="会員" title="ELIGE TU PLAN" center={true} />

          <p className="text-center text-brand-muted font-light font-sans max-w-2xl mx-auto -mt-6 mb-14 text-sm md:text-base leading-relaxed">
            Planes diseñados a la medida de tu rutina. Cada membresía incluye 4 citas mensuales programadas con el más alto estándar de barbería japonesa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch max-w-6xl mx-auto">
            {plans.map((item: any, index: number) => {
              const isFeatured = item.isFeatured;

              if (isFeatured) {
                return (
                  <Reveal delay={index * 120} key={item.id} className="h-full">
                    {/* Plan Premium (Destacado Canónico UI Kit) */}
                    <article className="bg-[#111] border border-brand-red/80 p-8 text-center flex flex-col relative transform md:scale-105 shadow-[0_0_30px_rgba(217,30,24,0.15)] z-10 rounded-2xl h-full">
                      <div className="absolute inset-0 bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none rounded-2xl" />

                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red text-[10px] font-oswald tracking-widest uppercase px-5 py-1.5 rounded-full text-white shadow-lg shadow-brand-red/30 border border-brand-redHover font-bold">
                        {item.badge || 'Más Popular'}
                      </span>

                      <h4 className="text-xl font-oswald uppercase tracking-widest text-brand-text mt-4 mb-2 relative z-10">
                        {item.name}
                      </h4>

                      <p className="text-xs text-brand-muted font-light font-sans mb-6 min-h-[32px] relative z-10">
                        {item.description}
                      </p>

                      <div className="mb-8 flex flex-col items-center justify-center relative z-10">
                        {item.compareAtPrice && (
                          <del className="text-xs text-brand-muted/70 font-oswald line-through mb-1">
                            {clp(item.compareAtPrice)}
                          </del>
                        )}
                        <div className="flex items-end justify-center gap-1">
                          <span className="text-4xl font-oswald font-bold text-brand-red drop-shadow-md">
                            {clp(item.monthlyPrice)}
                          </span>
                          <span className="text-brand-muted text-sm font-light mb-1">/ mes</span>
                        </div>
                      </div>

                      <ul className="text-sm text-brand-text/90 font-light font-sans space-y-4 mb-10 flex-grow text-left relative z-10">
                        {item.benefits.map((benefit: any) => (
                          <li
                            key={benefit.id}
                            className="flex items-center gap-3 border-b border-brand-border/50 pb-3"
                          >
                            <span className="text-brand-red text-xs">✓</span>
                            <span>{benefit.text}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => setPlan(item)}
                        className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 text-xs transition-all rounded-lg relative z-10 shadow-[0_4px_15px_rgba(217,30,24,0.4)] flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                      >
                        <i className="fa-solid fa-crown text-[11px]" />
                        <span>Adquirir Plan</span>
                      </button>
                    </article>
                  </Reveal>
                );
              }

              return (
                <Reveal delay={index * 120} key={item.id} className="h-full">
                  {/* Plan Estándar Canónico UI Kit */}
                  <article className="bg-brand-surface border border-brand-border p-8 text-center flex flex-col relative card-hover rounded-2xl h-full">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-[10px] font-oswald tracking-widest uppercase px-4 py-1.5 rounded-full text-brand-text border border-brand-border shadow-sm">
                      {item.badge || 'Plan Básico VIP'}
                    </span>

                    <h4 className="text-xl font-oswald uppercase tracking-widest text-brand-text mt-4 mb-2">
                      {item.name}
                    </h4>

                    <p className="text-xs text-brand-muted font-light font-sans mb-6 min-h-[32px]">
                      {item.description}
                    </p>

                    <div className="mb-8 flex flex-col items-center justify-center">
                      {item.compareAtPrice && (
                        <del className="text-xs text-brand-muted/70 font-oswald line-through mb-1">
                          {clp(item.compareAtPrice)}
                        </del>
                      )}
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-4xl font-oswald font-bold text-brand-red">
                          {clp(item.monthlyPrice)}
                        </span>
                        <span className="text-brand-muted text-sm font-light mb-1">/ mes</span>
                      </div>
                    </div>

                    <ul className="text-sm text-brand-text/80 font-light font-sans space-y-4 mb-10 flex-grow text-left">
                      {item.benefits.map((benefit: any) => (
                        <li
                          key={benefit.id}
                          className="flex items-center gap-3 border-b border-brand-border/30 pb-3"
                        >
                          <span className="text-brand-red text-xs">✓</span>
                          <span>{benefit.text}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setPlan(item)}
                      className="w-full bg-transparent border border-[#333] text-brand-text hover:border-brand-red hover:text-brand-red font-oswald uppercase tracking-widest py-3.5 text-xs transition-colors rounded-lg flex items-center justify-center gap-2"
                    >
                      <span>Adquirir Plan</span>
                    </button>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 3: SHOWCASE DE LA TARJETA FÍSICA VIP */}
        <section className="bg-[#111] border border-[#2a2a2a] rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-2xl">
          <div className="jp-bg-text">特権</div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-red/10 border border-brand-red/30 text-brand-red font-oswald text-[11px] uppercase tracking-widest font-semibold">
                <i className="fa-solid fa-id-badge text-xs" />
                <span>Credencial Física de Socio</span>
              </div>

              <h3 className="text-3xl md:text-4xl font-oswald uppercase tracking-tight text-white leading-tight">
                La Llave a tu Estilo Siempre al Día
              </h3>

              <p className="text-brand-muted font-light font-sans text-sm md:text-base leading-relaxed">
                Al suscribirte a cualquier membresía recibes tu <b>Tarjeta VIP física personalizada</b>. Preséntala en el estudio para agendamientos inmediatos, atención de sillón prioritaria y promociones especiales exclusivas para miembros.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs md:text-sm text-brand-text">
                  <div className="w-5 h-5 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center text-[10px] shrink-0 font-bold">
                    ✓
                  </div>
                  <span>Identificación rápida y registro digital de sesiones mensuales.</span>
                </div>
                <div className="flex items-center gap-3 text-xs md:text-sm text-brand-text">
                  <div className="w-5 h-5 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center text-[10px] shrink-0 font-bold">
                    ✓
                  </div>
                  <span>Acceso directo a la línea de productos de cuidado con descuento.</span>
                </div>
                <div className="flex items-center gap-3 text-xs md:text-sm text-brand-text">
                  <div className="w-5 h-5 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center text-[10px] shrink-0 font-bold">
                    ✓
                  </div>
                  <span>Renovación mensual automática sin trámites engorrosos.</span>
                </div>
              </div>
            </div>

            {/* MOCKUP VISUAL DE LA TARJETA VIP */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm aspect-[1.586/1] bg-gradient-to-br from-[#1c1c1c] via-[#141414] to-[#0a0a0a] rounded-2xl p-6 border border-brand-border/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden card-hover">
                {/* Glow decorativo sutil */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-brand-red/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-red/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-brand-red/60 bg-black shadow-md flex-shrink-0">
                        <img src="/images/manu-logo.png" alt="ManuBarber VIP" className="w-full h-full object-contain p-0.5" />
                      </div>
                      <div>
                        <span className="font-oswald text-xs uppercase tracking-widest text-white font-bold block leading-none">
                          MANUBARBER
                        </span>
                        <span className="text-[8px] font-oswald tracking-widest text-brand-muted uppercase block mt-0.5">
                          VIP MEMBER CLUB
                        </span>
                      </div>
                    </div>
                    {/* Chip EMV Simulado */}
                    <div className="w-9 h-7 rounded bg-[#2a2a2a] border border-[#3f3f3f] flex items-center justify-center shadow-inner">
                      <div className="w-6 h-4 border border-[#555] rounded-xs opacity-60 grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="bg-[#444] rounded-xs" />
                        <div className="bg-[#444] rounded-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="my-2">
                    <div className="font-mono text-xs md:text-sm tracking-[0.25em] text-white/90 font-medium">
                      •••• · •••• · •••• · 2026
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-[#2a2a2a] pt-3">
                    <div>
                      <div className="text-[7px] font-oswald uppercase tracking-widest text-brand-muted">
                        SOCIO EXCLUSIVO
                      </div>
                      <div className="font-oswald text-xs uppercase tracking-wider text-white">
                        SOCIO VIP CLUB
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] font-oswald uppercase tracking-widest text-brand-muted">
                        DISCIPLINA
                      </div>
                      <div className="font-jp text-[10px] text-brand-red font-bold">
                        己を磨け
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: PREGUNTAS FRECUENTES (FAQ) */}
        <section className="scroll-mt-24 max-w-4xl mx-auto">
          <SectionTitle jp="質問" title="PREGUNTAS FRECUENTES" center={true} />

          <div className="space-y-4">
            <FaqItem
              question="¿Cómo se efectúa el pago de la membresía?"
              answer="El pago se coordina mensualmente de forma fija mediante transferencia bancaria o tarjeta. Al unirte, acordamos la fecha de tu ciclo mensual para que tus citas queden agendadas con total comodidad."
            />
            <FaqItem
              question="¿Qué ocurre si no alcanzo a usar todos mis cortes en el mes?"
              answer="Cada membresía está pensada para cubrir tu frecuencia de cuidado mensual (4 visitas recomendadas cada 7-10 días). Los cortes corresponden al ciclo mensual activo para mantener siempre la frescura de tu estilo."
            />
            <FaqItem
              question="¿Cómo agendo mis citas siendo socio VIP?"
              answer="Cuentas con agendamiento prioritario directo por WhatsApp. Solo nos indicas tu horario de preferencia y se te reserva el sillón con antelación, sin tener que esperar turnos generales."
            />
            <FaqItem
              question="¿Puedo transferir o compartir mi membresía?"
              answer="La Tarjeta VIP es personal e intransferible. Esto garantiza que el barbero reserve el tiempo necesario y exclusivo para tu perfil y estilo."
            />
            <FaqItem
              question="¿Puedo pausar o cancelar mi plan cuando quiera?"
              answer="Sí, no existen contratos forzosos. Puedes avisarnos con al menos 5 días de anticipación al término de tu ciclo para pausar o no renovar tu membresía sin penalizaciones."
            />
          </div>
        </section>
      </main>

      {/* MODAL CANÓNICO DE SOLICITUD DE PLAN */}
      {plan && (
        <Modal
          title="Únete al Club VIP"
          onClose={() => setPlan(undefined)}
          tone="red"
        >
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <div className="font-oswald uppercase tracking-wider text-white text-sm font-bold">
                {plan.name}
              </div>
              <div className="text-xs text-brand-muted font-light font-sans">
                {plan.description}
              </div>
            </div>
            <div className="text-right">
              <div className="font-oswald text-brand-red font-bold text-lg">
                {clp(plan.monthlyPrice)}
              </div>
              <div className="text-[10px] text-brand-muted uppercase font-oswald">
                mensual
              </div>
            </div>
          </div>
          <LeadForm
            kind="membership"
            id={plan.id}
            label="Solicitar Tarjeta VIP"
            onDone={() => setPlan(undefined)}
          />
        </Modal>
      )}
    </Shell>
  );
}
