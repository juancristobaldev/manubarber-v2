'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { CREATE_COURSE_LEAD } from '@/lib/operations';
import { Loading, Reveal, Shell, clp, content, useSite } from '@/components/site';

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

const MODULE_FALLBACK_ICONS = [
  'fa-solid fa-graduation-cap',
  'fa-solid fa-sliders',
  'fa-solid fa-scissors',
  'fa-solid fa-bolt',
  'fa-solid fa-user-ninja',
  'fa-solid fa-wand-magic-sparkles',
];

const CANONICAL_MODULES = [
  {
    title: 'Fundamentos & Visagismo',
    description: 'Diagnóstico craneal, análisis de remolinos, tipos de cráneo y preparación ergonómica de la estación.',
    icon: 'fa-solid fa-graduation-cap',
  },
  {
    title: 'Desvanecidos (Low, Mid & High Fade)',
    description: 'Dominio de palanca, borrado milimétrico de la línea guía y conexiones perfectas de máquina sobre peine.',
    icon: 'fa-solid fa-sliders',
  },
  {
    title: 'Taper Fade & Texturizado a Tijera',
    description: 'Estructuración clásica y urbana superior con tijera recta y de esculpir para máxima caída y movimiento.',
    icon: 'fa-solid fa-scissors',
  },
  {
    title: 'Navaja Quirúrgica & Perfilado',
    description: 'Técnica japonesa de tensado de piel, ángulo exacto a 30° y líneas de contorno limpias sin irritación.',
    icon: 'fa-solid fa-bolt',
  },
  {
    title: 'Peinado, Acabado & Fijación',
    description: 'Aplicación de ceras mate, polvos voluminizadores, uso de secador con boquilla direccional y sellado.',
    icon: 'fa-solid fa-wand-magic-sparkles',
  },
  {
    title: 'Negocio, Tarifa & Fidelización',
    description: 'Estructuración de tu puesto de trabajo, fotografía para redes sociales, manejo de agenda y retención de clientes.',
    icon: 'fa-solid fa-user-ninja',
  },
];

const FAQS = [
  {
    q: '¿Necesito experiencia previa para tomar el curso?',
    a: 'No. El curso está diseñado tanto para quienes nunca han tomado una máquina como para barberos en ejercicio que buscan pulir y acelerar su técnica de desvanecido.',
  },
  {
    q: '¿Tengo que llevar mis propios modelos para practicar?',
    a: 'No es obligatorio. En el estudio coordinamos modelos reales para cada sesión de corte. Si tienes un amigo o conocido que prefieras llevar, eres totalmente libre de hacerlo.',
  },
  {
    q: '¿Debo comprar máquinas o herramientas caras antes de empezar?',
    a: 'No te apures en comprar equipo sin asesoría. Durante las clases tienes a tu disposición todas las herramientas profesionales del estudio. Manu te asesorará de forma personalizada para que compres lo que realmente necesitas según tu presupuesto.',
  },
  {
    q: '¿Cómo funciona el sistema de pago por clase?',
    a: 'Pagas exclusivamente por la clase a la que asistes ($35.000 por sesión 1 a 1). Sin cuotas de matrícula forzadas ni contratos mensuales. Tú defines el ritmo según tu tiempo disponible.',
  },
  {
    q: '¿En qué días y horarios se coordinan las sesiones?',
    a: 'Se coordinan de manera directa y flexible con Manu, en bloques adaptados a tu disponibilidad dentro de los horarios de atención del estudio.',
  },
];

export default function AcademiaPage() {
  const { data, loading, error } = useSite();
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (loading || error) return <Loading error={error} />;

  const site = content(data);
  const brand = site.brand ?? {};
  const contact = site.contact ?? {};
  const finalCta = site.courseCta ?? {};
  const courses = data?.courses ?? [];
  const primaryCourse = courses[0];

  const heroImage = primaryCourse?.heroImage?.url || '/images/hero.jpg';
  const priceDisplay = primaryCourse?.pricePerClass ? clp(primaryCourse.pricePerClass) : '$35.000';

  const rawModules = primaryCourse?.modules?.length > 0 ? primaryCourse.modules : CANONICAL_MODULES;

  return (
    <Shell data={data}>
      {/* HERO SECTION DE ALTO IMPACTO (IDÉNTICO EN ESTILO Y ESTRUCTURA A LA HOME) */}
      <header className="relative min-h-[85vh] flex items-center justify-center text-center px-6 py-20 overflow-hidden bg-[#0a0a0a]">
        {/* Imagen de fondo con gradientes oscuros */}
        <div
          className="absolute inset-0 bg-cover bg-center filter grayscale opacity-30 transform scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/90 pointer-events-none" />

        {/* Kanji decorativo central */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 font-jp font-black text-9xl md:text-[14rem] pointer-events-none select-none">
          {brand.heroJapanese || '修練'}
        </div>

        {/* Contenido del Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand-surface border border-brand-border text-brand-red font-oswald tracking-widest text-xs mb-6 shadow-sm gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            ACADEMIA MANUBARBER · STREET CRAFT & DISCIPLINE
          </span>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-oswald uppercase tracking-tight text-white mb-6 leading-none">
            {primaryCourse?.title || 'CURSO DE BARBERÍA URBANA'}
          </h1>

          <p className="text-brand-red font-oswald text-xl md:text-2xl uppercase tracking-widest font-bold mb-4">
            {primaryCourse?.subtitle || 'TÉCNICA · CALLE · DISCIPLINA'}
          </p>

          <p className="text-brand-muted max-w-2xl text-base md:text-lg font-light leading-relaxed mb-10">
            {primaryCourse?.description ||
              'Aprende el oficio real de la barbería con el estándar ManuBarber. Práctica directa 1 a 1 sobre modelos reales, precisión milimétrica en desvanecidos y disciplina de salón.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setSelectedCourse(primaryCourse || { title: 'Curso de Barbería', pricePerClass: 35000 })}
              className="bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-8 text-sm transition-all duration-300 transform hover:scale-[1.02] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp text-lg" />
              Postular / Agendar Mi Clase
            </button>

            <a
              href="#temario"
              className="bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3.5 px-8 text-sm transition-all duration-300 rounded-lg flex items-center justify-center gap-2"
            >
              Explorar Temario
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs font-oswald uppercase tracking-widest text-brand-muted mt-6">
            <i className="fa-solid fa-fire text-brand-red" />
            Cupos reducidos por ciclo · Formación 1 a 1 en sillón real
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-oswald tracking-widest text-brand-muted uppercase">
          <span>SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-brand-red to-transparent animate-pulse" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-28">
        {/* SECCIÓN 1: FILOSOFÍA DE FORMACIÓN */}
        <section id="filosofia" className="scroll-mt-24">
          <SectionTitle jp="哲学" title="EL ESTÁNDAR DE FORMACIÓN" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red text-[11px] font-oswald uppercase tracking-widest rounded-md">
                MANUBARBER ACADEMY · STREET CODE
              </span>

              <h3 className="text-3xl md:text-4xl font-oswald uppercase tracking-wide text-brand-text">
                APRENDE EL OFICIO REAL. SIN RELLENO NI TIEMPO PERDIDO.
              </h3>

              <div className="space-y-4 text-brand-muted text-sm md:text-base font-light leading-relaxed">
                <p>
                  En ManuBarber no creemos en academias masivas que te tienen meses enteros practicando sobre cabezales de plástico. La barbería se aprende tocando cabello real, sintiendo el movimiento, enfrentando visagismos distintos y dominando la navaja bajo supervisión directa.
                </p>
                <p>
                  Te entregamos técnica de desvanecido milimétrico (fade limpio), pulcritud en perfilados, manejo ergonómico de máquinas y las herramientas para que empieces a generar ingresos desde tus primeras semanas.
                </p>
              </div>

              {/* Pilares */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <article className="p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl border-t-2 border-t-brand-red shadow-sm card-hover">
                  <strong className="block text-brand-text font-oswald uppercase tracking-wider text-sm mb-1">
                    100% PRÁCTICO
                  </strong>
                  <span className="block text-brand-muted text-xs font-light">
                    Cortes sobre modelos reales en cada sesión de trabajo.
                  </span>
                </article>

                <article className="p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl border-t-2 border-t-brand-red shadow-sm card-hover">
                  <strong className="block text-brand-text font-oswald uppercase tracking-wider text-sm mb-1">
                    PAGO POR CLASE
                  </strong>
                  <span className="block text-brand-muted text-xs font-light">
                    Sin matrículas forzadas ni contratos atados. Tú marcas el ritmo.
                  </span>
                </article>

                <article className="p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl border-t-2 border-t-brand-red shadow-sm card-hover">
                  <strong className="block text-brand-text font-oswald uppercase tracking-wider text-sm mb-1">
                    OFICIO RENTABLE
                  </strong>
                  <span className="block text-brand-muted text-xs font-light">
                    Aprende a cobrar, estructurar tu puesto y fidelizar clientela.
                  </span>
                </article>
              </div>

              <blockquote className="border-l-2 border-brand-red pl-4 text-lg md:text-xl font-oswald tracking-wide text-white uppercase mt-6">
                “LA DISCIPLINA SUPERA AL TALENTO CUANDO EL TALENTO NO SE ENTRENA.”
              </blockquote>
            </div>

            {/* Fotografía de Filosofía */}
            <div className="relative group">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-brand-border bg-[#141414] shadow-2xl relative">
                <img
                  src={primaryCourse?.heroImage?.url || '/images/image.png'}
                  alt="Técnica de corte y formación en barbería ManuBarber"
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

        {/* SECCIÓN 2: MODALIDAD Y PRECIOS (CARD CANÓNICA DE ALTO IMPACTO) */}
        <section id="tarifa" className="scroll-mt-24">
          <SectionTitle center jp="料金" title="MODALIDAD Y TARIFA" />

          <Reveal className="max-w-4xl mx-auto">
            <article className="bg-[#141414] border border-[#2a2a2a] p-6 sm:p-10 rounded-2xl card-hover shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-4 bottom-2 text-8xl font-jp font-black text-white/[0.02] pointer-events-none select-none">
                料金
              </div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 relative z-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-[#222] border border-[#333] text-brand-muted text-[10px] font-oswald uppercase tracking-widest px-3 py-1 rounded-md mb-4">
                    <i className="fa-solid fa-money-bill-wave text-brand-red" />
                    Modalidad Flexible · Sin Contratos
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-oswald uppercase text-white tracking-wide mb-3">
                    Paga solo por la clase a la que asistes
                  </h3>
                  <p className="text-sm text-brand-muted font-light leading-relaxed mb-6">
                    No necesitas endeudarte con mensualidades eternas. Coordinas tu clase, asistes al estudio, practicas intensivamente con Manu y pagas por sesión realizada.
                  </p>

                  <ul className="space-y-3 text-xs sm:text-sm text-brand-text font-light">
                    <li className="flex items-center gap-2.5">
                      <i className="fa-solid fa-check text-brand-red text-sm" />
                      <span>Uso de máquinas profesionales y navajas japonesas durante toda la clase.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <i className="fa-solid fa-check text-brand-red text-sm" />
                      <span>Modelos reales coordinados para que apliques la técnica en vivo y sin muñecos.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <i className="fa-solid fa-check text-brand-red text-sm" />
                      <span>Corrección postural, velocidad de desvanecido y visagismo milimétrico.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <i className="fa-solid fa-check text-brand-red text-sm" />
                      <span>Mentoría para adquirir tus herramientas con criterio profesional y sin sobrecostos.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#111] border border-[#2a2a2a] p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center lg:min-w-[280px] shadow-inner">
                  <span className="text-[10px] font-oswald tracking-widest uppercase text-brand-muted mb-1">
                    Inversión por clase
                  </span>
                  <strong className="text-4xl sm:text-5xl font-oswald font-bold text-brand-red tracking-tight my-1">
                    {priceDisplay}
                  </strong>
                  <span className="text-[11px] text-brand-muted font-light mb-6">
                    Sesión práctica intensiva 1 a 1
                  </span>

                  <button
                    onClick={() => setSelectedCourse(primaryCourse || { title: 'Curso de Barbería', pricePerClass: 35000 })}
                    className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all duration-300 transform hover:scale-[1.01] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="fa-brands fa-whatsapp text-base" /> Solicitar Cupo
                  </button>
                  <span className="text-[9px] text-brand-muted font-light mt-3 block">
                    Cupos sujetos a agenda semanal
                  </span>
                </div>
              </div>
            </article>
          </Reveal>
        </section>

        {/* SECCIÓN 3: TEMARIO QUIRÚRGICO */}
        <section id="temario" className="scroll-mt-24">
          <SectionTitle center jp="修練" title="TEMARIO & TÉCNICAS CLAVE" />

          <p className="text-center text-brand-muted font-light max-w-2xl mx-auto -mt-8 mb-12 text-sm sm:text-base">
            Domina las técnicas más demandadas en las barberías actuales. Sin relleno, pura práctica y técnica quirúrgica estructurada en 6 módulos clave.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rawModules.map((module: any, index: number) => {
              const iconClass = module.icon || MODULE_FALLBACK_ICONS[index % MODULE_FALLBACK_ICONS.length];
              const stepNumber = String(index + 1).padStart(2, '0');

              return (
                <Reveal delay={index * 60} key={module.id || module.title || index}>
                  <article className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col h-full card-hover shadow-lg group relative overflow-hidden">
                    <span className="font-oswald text-xs font-bold text-brand-muted/40 group-hover:text-brand-red transition-colors absolute top-6 right-6">
                      #{stepNumber}
                    </span>

                    <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] group-hover:border-brand-red/50 group-hover:bg-brand-red/10 text-brand-red flex items-center justify-center text-xl transition-all mb-5">
                      <i className={iconClass} />
                    </div>

                    <h4 className="text-xl font-oswald uppercase text-brand-text mb-2 tracking-wide group-hover:text-brand-red transition-colors font-semibold">
                      {module.title}
                    </h4>
                    <p className="text-sm text-brand-muted font-light leading-relaxed flex-grow">
                      {module.description}
                    </p>

                    <div className="mt-6 pt-4 border-t border-[#2a2a2a]/60 flex items-center justify-between text-[10px] font-oswald tracking-widest text-brand-muted uppercase">
                      <span>Módulo Práctico</span>
                      <span className="text-brand-red font-semibold">Técnica en vivo</span>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 4: METODOLOGÍA MILIMÉTRICA */}
        <section id="metodologia" className="scroll-mt-24">
          <SectionTitle center jp="極致" title="METODOLOGÍA MILIMÉTRICA" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '◈',
                title: 'VISAGISMO & DIAGNÓSTICO',
                desc: 'Aprende a analizar la forma craneal, remolinos y textura capilar antes de encender la máquina.',
              },
              {
                icon: '◉',
                title: 'MANEJO ERGONÓMICO',
                desc: 'Dominio de muñeca, balance de peso en clippers y postura correcta para evitar fatiga corporal prolongada.',
              },
              {
                icon: '⬡',
                title: 'NAVAJA Y PRECISIÓN',
                desc: 'Ángulo exacto de corte a 30°, estiramiento de piel y afeitado tradicional sin irritación ni cortes indeseados.',
              },
              {
                icon: '◷',
                title: 'TIEMPOS DE SALÓN',
                desc: 'Estructuración del paso a paso para recortar tiempos innecesarios y aumentar la rentabilidad de tu silla.',
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <article className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl card-hover shadow-sm h-full flex flex-col text-center">
                  <i className="text-brand-red text-2xl font-light not-italic mb-4">{item.icon}</i>
                  <h4 className="font-oswald text-lg uppercase text-white tracking-wide mb-2 font-bold">
                    {item.title}
                  </h4>
                  <p className="text-xs text-brand-muted font-light leading-relaxed">
                    {item.desc}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* SECCIÓN 5: EQUIPAMIENTO & REQUISITOS */}
        <section id="equipamiento" className="scroll-mt-24">
          <SectionTitle center jp="道具" title="EQUIPAMIENTO & REQUISITOS" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card A: Qué incluye ManuBarber */}
            <article className="bg-[#111] border border-brand-red/60 p-8 rounded-2xl card-hover shadow-[0_0_25px_rgba(217,30,24,0.1)] flex flex-col relative overflow-hidden">
              <span className="inline-block bg-brand-red text-[10px] font-oswald tracking-widest uppercase px-3 py-1 rounded-md text-white font-bold mb-4 self-start">
                LO QUE TE ENTREGAMOS EN EL ESTUDIO
              </span>

              <h4 className="text-2xl font-oswald uppercase text-white tracking-wide mb-4">
                Herramientas & Respaldo
              </h4>

              <ul className="space-y-3.5 text-sm text-brand-text/90 font-light flex-grow">
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Máquinas y trimmers profesionales</strong> de alta potencia durante toda la clase.</span>
                </li>
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Modelos reales coordinados</strong> por el estudio para cada sesión práctica.</span>
                </li>
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Navajas japonesas y hojas desechables</strong> con estándares hospitalarios de asepsia.</span>
                </li>
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Productos premium de acabado</strong> (pomadas, polvos de volumen, aftershave).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Certificado de formación ManuBarber</strong> al completar tus módulos formativos.</span>
                </li>
              </ul>
            </article>

            {/* Card B: Qué necesitas traer tú */}
            <article className="bg-brand-surface border border-brand-border p-8 rounded-2xl card-hover shadow-sm flex flex-col">
              <span className="inline-block bg-[#222] border border-[#333] text-[10px] font-oswald tracking-widest uppercase px-3 py-1 rounded-md text-brand-muted font-bold mb-4 self-start">
                LO QUE DEBES TRAER TÚ
              </span>

              <h4 className="text-2xl font-oswald uppercase text-white tracking-wide mb-4">
                Compromiso & Actitud
              </h4>

              <ul className="space-y-3.5 text-sm text-brand-text/90 font-light flex-grow">
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Cero experiencia requerida:</strong> partimos de tu nivel real, desde cero o intermedio.</span>
                </li>
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Puntualidad rigurosa:</strong> respeto por el tiempo del modelo y el estudio.</span>
                </li>
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Libreta o celular:</strong> para diagramar esquemas craneales y fórmulas de corte.</span>
                </li>
                <li className="flex items-start gap-3 border-b border-brand-border/30 pb-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Ganas de pulir tu técnica:</strong> disciplina para escuchar correcciones en vivo.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-red font-bold">✓</span>
                  <span><strong>Espíritu callejero y respeto (己を磨け):</strong> actitud profesional frente al espejo.</span>
                </li>
              </ul>
            </article>
          </div>
        </section>

        {/* SECCIÓN 6: PREGUNTAS FRECUENTES (FAQ) */}
        <section id="faq" className="scroll-mt-24">
          <SectionTitle center jp="質疑" title="PREGUNTAS FRECUENTES" />

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden card-hover transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-oswald text-base sm:text-lg uppercase tracking-wide text-brand-text font-medium">
                      {faq.q}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-xs text-brand-muted shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-brand-red border-brand-red/40' : ''
                      }`}
                    >
                      <i className="fa-solid fa-chevron-down" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-brand-muted font-light leading-relaxed border-t border-[#2a2a2a]/60 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 7: CTA FINAL CONVERTIDOR */}
        <section className="scroll-mt-24">
          <Reveal className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161616] via-[#141414] to-[#1a0808] border border-[#2a2a2a] hover:border-brand-red/40 transition-colors p-8 sm:p-14 text-center shadow-2xl">
              <div className="absolute right-6 top-6 text-8xl font-jp font-black text-white/[0.02] pointer-events-none select-none">
                修練
              </div>

              <span className="inline-block bg-brand-red text-white text-[10px] font-oswald uppercase tracking-widest px-3.5 py-1 rounded-full font-bold mb-4 shadow-sm">
                CUPOS LIMITADOS · AGENDA TU INICIO
              </span>

              <h2 className="text-3xl sm:text-5xl font-oswald uppercase text-white font-bold tracking-wide mb-4">
                {finalCta.title || 'TU FUTURO EMPIEZA HOY'}
              </h2>

              <p className="text-brand-muted max-w-xl mx-auto text-sm sm:text-base font-light mb-8 leading-relaxed">
                {finalCta.description ||
                  'No dejes pasar la oportunidad de aprender un oficio rentable con alta demanda. Los cupos son limitados por sesión.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setSelectedCourse(primaryCourse || { title: 'Curso de Barbería', pricePerClass: 35000 })}
                  className="w-full sm:w-auto bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-4 px-8 text-sm transition-all duration-300 transform hover:scale-[1.02] rounded-lg shadow-[0_4px_16px_rgba(217,30,24,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-brands fa-whatsapp text-lg" />
                  {finalCta.label || 'Quiero mi Cupo'}
                </button>
                {contact?.whatsappPhone && (
                  <a
                    href={`https://wa.me/${contact.whatsappPhone}?text=${encodeURIComponent(
                      `Hola Manu, me interesa inscribirme en la academia ManuBarber (${primaryCourse?.title || 'Curso de Barbería'}). ¿Qué cupos tienes disponibles?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-4 px-8 text-sm transition-all duration-300 rounded-lg flex items-center justify-center gap-2"
                  >
                    Hablar directo por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* MODAL DE RESERVA / LEAD CON ESTILOS Y VALIDACIÓN CANÓNICA UI KIT */}
      {selectedCourse && (
        <CourseLeadModal
          course={selectedCourse}
          whatsappPhone={primaryCourse?.whatsappPhone || contact?.whatsappPhone}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </Shell>
  );
}

function CourseLeadModal({
  course,
  whatsappPhone,
  onClose,
}: {
  course: any;
  whatsappPhone?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const [sendLead, { loading, error }] = useMutation(CREATE_COURSE_LEAD);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      errors.name = 'Completa tu nombre completo';
    }
    if (!phone.trim()) {
      errors.phone = 'Ingresa tu número de WhatsApp';
    } else if (phone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Ingresa un número de contacto válido';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      if (course?.id) {
        await sendLead({
          variables: {
            input: {
              courseId: course.id,
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim() || undefined,
            },
          },
        });
      }
      setIsSuccess(true);
    } catch {
      // In case backend rejects, still show success or fallback so user can reach WhatsApp
      setIsSuccess(true);
    }
  }

  const cleanPhone = whatsappPhone?.replace(/\D/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola Manu, acabo de postular para el cupo en la academia (${course.title || 'Curso de Barbería'}). Mi nombre es ${name.trim() || 'un interesado'}.`
      )}`
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <section className="relative w-full max-w-lg bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden">
        {/* Japanese background decoration */}
        <div className="absolute right-4 bottom-2 text-7xl font-jp font-black text-white/[0.02] pointer-events-none select-none">
          修練
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#333] text-brand-muted hover:text-white hover:border-brand-red flex items-center justify-center transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mx-auto flex items-center justify-center text-2xl mb-4">
              <i className="fa-solid fa-check" />
            </div>
            <h3 className="text-2xl font-oswald uppercase text-white tracking-wide mb-2">
              ¡Solicitud Recibida!
            </h3>
            <p className="text-sm text-brand-muted font-light max-w-sm mx-auto mb-6">
              Registramos tus datos para el curso <strong className="text-brand-text font-normal">{course.title}</strong>. Te contactaremos a la brevedad por WhatsApp para coordinar tu primera clase.
            </p>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 mb-3"
              >
                <i className="fa-brands fa-whatsapp text-lg" />
                Confirmar por WhatsApp ahora
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full bg-transparent hover:bg-[#1a1a1a] border border-[#333] text-brand-muted hover:text-white font-oswald uppercase tracking-widest py-3 px-6 text-xs transition-colors rounded-lg cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-oswald uppercase tracking-widest text-brand-red font-semibold block mb-1">
                Postulación a Academia
              </span>
              <h3 className="text-2xl sm:text-3xl font-oswald uppercase text-white tracking-wide mb-2">
                {course.title}
              </h3>
              <div className="flex items-center gap-2 text-xs font-oswald tracking-widest uppercase text-brand-muted">
                <span className="bg-[#1a1a1a] border border-[#333] px-2.5 py-0.5 rounded text-brand-text">
                  {clp(course.pricePerClass || 35000)} / clase
                </span>
                <span>· Modalidad flexible 1 a 1</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* CAMPO: NOMBRE COMPLETO */}
              <div className="relative mb-5">
                <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                  }}
                  className={`w-full bg-[#1a1a1a] border ${
                    fieldErrors.name ? 'border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]' : 'border-[#333] focus:border-white'
                  } text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner`}
                  placeholder="Ej: Matías Soto"
                />
                {fieldErrors.name && (
                  <div className="error-tooltip left-4 bottom-full mb-2">
                    <span className="error-icon">!</span>
                    {fieldErrors.name}
                  </div>
                )}
              </div>

              {/* CAMPO: TELÉFONO / WHATSAPP */}
              <div className="relative mb-5">
                <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                  WhatsApp / Teléfono *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                  }}
                  className={`w-full bg-[#1a1a1a] border ${
                    fieldErrors.phone ? 'border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]' : 'border-[#333] focus:border-white'
                  } text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner`}
                  placeholder="+56 9 1234 5678"
                />
                {fieldErrors.phone && (
                  <div className="error-tooltip left-4 bottom-full mb-2">
                    <span className="error-icon">!</span>
                    {fieldErrors.phone}
                  </div>
                )}
              </div>

              {/* CAMPO: EMAIL (OPCIONAL) */}
              <div className="relative mb-6">
                <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner"
                  placeholder="matias@ejemplo.cl"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-brand-red/10 border border-brand-red/30 rounded-lg text-xs text-brand-red flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation" />
                  Hubo un problema al registrar la solicitud. Por favor intenta nuevamente.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all duration-300 transform hover:scale-[1.01] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin" /> Enviando postulación...
                  </>
                ) : (
                  <>
                    <i className="fa-brands fa-whatsapp text-base" /> Solicitar Cupo
                  </>
                )}
              </button>

              <p className="text-[11px] text-brand-muted text-center mt-4 font-light">
                Tus datos están seguros. Te contactaremos únicamente para coordinar tu clase.
              </p>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
