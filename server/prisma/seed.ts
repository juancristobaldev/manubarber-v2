import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// This seed only creates missing records. It never overwrites content edited in
// the admin panel. Schema/data migrations are separate, versioned operations.
async function main() {
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: {},
    create: { email: process.env.ADMIN_EMAIL, displayName: 'Administrador', role: 'ADMIN', passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD) },
  });

  await prisma.businessProfile.upsert({
    where: { key: 'default' }, update: {},
    create: { name: 'ManuBarber', tagline: 'Estilo, precisión y calle', timezone: 'America/Santiago', currency: 'CLP', logoUrl: '/images/manu-logo.png' },
  });
  await prisma.businessContact.upsert({
    where: { key: 'default' }, update: {},
    create: { address: 'Andrés Bello con General Mackenna', city: 'Temuco', instagramUrl: 'https://instagram.com/manu_barbeer', whatsappPhone: '56936355068', mapEmbedUrl: 'https://maps.google.com/maps?q=Andres%20Bello%20con%20General%20Mackenna,%20Temuco&t=m&z=16&ie=UTF8&iwloc=&output=embed' },
  });
  await prisma.brandAesthetic.upsert({
    where: { key: 'default' }, update: {},
    create: { japaneseMark: '磨', eyebrow: 'MANUBARBER STREET CLUB', heroSideText: 'CALLE • CÓDIGO • PRECISIÓN', heroJapanese: '己を磨け', accentColors: { create: ['#D10B20', '#7C3AED', '#00E5FF'].map((hexColor, sortOrder) => ({ hexColor, sortOrder })) } },
  });

  const heroes = [
    { pageKey: 'HOME', eyebrow: null, title: 'ESTILO, PRECISIÓN Y CALLE', description: 'No es solo un corte, es identidad. Elevamos tu imagen con técnicas premium y esencia urbana.', imageUrl: '/images/hero.jpg', ctaLabel: 'Reservar Hora', ctaHref: '#reserva' },
    { pageKey: 'STORE', eyebrow: null, title: 'TIENDA OFICIAL', description: 'Mantén tu aroma impecable todos los días. Fragancias seleccionadas para tu estilo y personalidad. Resérvalas fácilmente y retíralas en tienda.', imageUrl: '/images/perfumes/PERFUMES.png', ctaLabel: null, ctaHref: null },
    { pageKey: 'VIP', eyebrow: 'Membresía Exclusiva', title: 'CLIENTES VIP', description: 'Cortes asegurados todo el mes. Mantén tu imagen intacta pagando menos. Exclusividad, ahorro y el mejor estilo de la calle.', imageUrl: '/images/hero.jpg', ctaLabel: null, ctaHref: null },
  ];
  for (const hero of heroes) await prisma.pageHero.upsert({ where: { pageKey: hero.pageKey }, update: {}, create: hero });

  await prisma.galleryHeader.upsert({ where: { key: 'default' }, update: {}, create: { title: 'MI TRABAJO', description: 'Precisión quirúrgica en cada línea.', watermark: 'PORTAFOLIO' } });
  await prisma.courseCta.upsert({ where: { key: 'default' }, update: {}, create: { title: 'TU FUTURO EMPIEZA HOY', description: 'No dejes pasar la oportunidad de aprender un oficio rentable con alta demanda. Los cupos se llenan rápido.', label: 'Quiero mi Cupo' } });
  await prisma.vipBanner.upsert({ where: { key: 'default' }, update: {}, create: { title: '¿Quieres ser Cliente VIP?', description: 'Asegura tu estilo todo el mes. Accede a cortes periódicos, agendamiento prioritario y beneficios exclusivos.', ctaLabel: 'Ver Membresías', href: '/vip' } });
  await prisma.vipComparison.upsert({ where: { key: 'default' }, update: {}, create: { visits: 4, individualPrice: 10000, vipPrice: 35000 } });

  const philosophy = await prisma.philosophy.findUnique({ where: { key: 'default' } });
  if (!philosophy) await prisma.philosophy.create({
    data: {
      japaneseTitle: '哲学', title: 'CALLE EN EL ALMA. PRECISIÓN EN CADA DETALLE.', kicker: 'Street craft · Japanese discipline',
      quote: 'EL FLOW SE SIENTE. LA TÉCNICA SE NOTA.', imageUrl: '/images/image.png', imageAlt: 'Barbero trabajando con precisión y estilo urbano',
      paragraphs: { create: [
        { text: 'ManuBarber nace en la calle: identidad propia, actitud sin disfraz y respeto por el proceso. Tomamos esa energía urbana y la llevamos a una experiencia de barbería con estándar profesional.', sortOrder: 0 },
        { text: 'Nos inspira la disciplina japonesa: manos firmes, herramientas impecables y técnica repetida hasta dominarla. Cada fade, perfilado y textura se trabaja con intención; no improvisamos tu estilo, lo construimos contigo.', sortOrder: 1 },
      ] },
      pillars: { create: [
        { label: 'CALLE', description: 'Tu historia, tu flow y una estética sin copias.', sortOrder: 0 },
        { label: 'CÓDIGO', description: 'Respeto, puntualidad y compromiso con cada cliente.', sortOrder: 1 },
        { label: 'TÉCNICA', description: 'Precisión profesional desde la consulta hasta el último detalle.', sortOrder: 2 },
      ] },
    },
  });

  if (await prisma.experienceItem.count() === 0) await prisma.experienceItem.createMany({ data: [
    { title: 'PRECISIÓN', description: 'Técnicas depuradas y herramientas de alta gama para acabados perfectos.', sortOrder: 0 },
    { title: 'EXPERIENCIA', description: 'Un barbero enfocado en perfeccionar su arte en cada sesión.', sortOrder: 1 },
    { title: 'EXCLUSIVIDAD', description: 'Un ambiente cómodo y diseñado para tu desconexión.', sortOrder: 2 },
    { title: 'PUNTUALIDAD', description: 'Tu tiempo vale. Respetamos rigurosamente cada bloque agendado.', sortOrder: 3 },
  ] });
  if (await prisma.valueProposition.count() === 0) await prisma.valueProposition.createMany({ data: [
    { icon: '★', title: 'Experiencia', description: 'Años perfeccionando la técnica. Manejo impecable de tijeras, navaja y máquina para resultados consistentes y de primer nivel.', sortOrder: 0 },
    { icon: '♨', title: 'Estilo Personalizado', description: 'Analizamos tus facciones y tu vibra. Cada fade, textura y diseño está pensado exclusivamente para potenciar tu imagen.', sortOrder: 1 },
    { icon: '✦', title: 'Atención Profesional', description: 'Un ambiente premium donde el respeto y la puntualidad son ley. Relájate y deja que el experto haga su trabajo.', sortOrder: 2 },
  ] });
  if (await prisma.testimonial.count() === 0) await prisma.testimonial.createMany({ data: [
    { author: 'CLIENTE MANUBARBER', service: 'CORTE SIGNATURE', text: 'La atención al detalle es increíble. No es solo un corte, es una asesoría completa.', sortOrder: 0 },
    { author: 'CLIENTE VIP', service: 'FULL EXPERIENCE', text: 'El mejor fade que me han hecho. La precisión justifica totalmente ser miembro.', sortOrder: 1 },
    { author: 'CLIENTE FRECUENTE', service: 'BEARD DESIGN', text: 'Desde que entras hasta que sales, el servicio es impecable.', sortOrder: 2 },
  ] });

  await prisma.pageSection.createMany({ skipDuplicates: true, data: [
    { pageKey: 'home', sectionKey: 'philosophy', japaneseLabel: '哲学', title: 'FILOSOFÍA DE MARCA', sortOrder: 0 },
    { pageKey: 'home', sectionKey: 'services', japaneseLabel: 'サービス', title: 'SERVICIOS SIGNATURE', sortOrder: 1 },
    { pageKey: 'home', sectionKey: 'booking', japaneseLabel: '予約', title: 'RESERVA TU EXPERIENCIA', sortOrder: 2 },
    { pageKey: 'home', sectionKey: 'gallery', japaneseLabel: '作品', title: 'GALERÍA DE TRABAJOS', sortOrder: 3 },
    { pageKey: 'home', sectionKey: 'memberships', japaneseLabel: 'メンバーシップ', title: 'MEMBRESÍAS', sortOrder: 4 },
    { pageKey: 'home', sectionKey: 'products', japaneseLabel: '商品', title: 'CUIDADO PREMIUM', sortOrder: 5 },
    { pageKey: 'home', sectionKey: 'experience', japaneseLabel: '体験', title: 'EL ESTÁNDAR MANUBARBER', sortOrder: 6 },
    { pageKey: 'home', sectionKey: 'testimonials', japaneseLabel: 'お客様の声', title: 'LA VOZ DEL CLUB', sortOrder: 7 },
    { pageKey: 'home', sectionKey: 'contact', japaneseLabel: '場所', title: 'UBICACIÓN Y CONTACTO', subtitle: 'Visítanos. Espacios diseñados para el confort, el detalle y la estética masculina.', sortOrder: 8 },
  ] });

  for (const [sortOrder, [label, href]] of [['Tienda', '/tienda'], ['Mi Trabajo', '/galeria'], ['Servicios', '/#servicios'], ['VIP', '/vip'], ['Cursos', '/capacitacion']].entries()) {
    const current = await prisma.navigationItem.findFirst({ where: { href, position: 'HEADER' } });
    if (!current) await prisma.navigationItem.create({ data: { label, href, position: 'HEADER', sortOrder } });
  }
  for (const dayOfWeek of [1, 2, 3, 4, 5, 6, 7]) {
    const current = await prisma.businessHour.findUnique({ where: { dayOfWeek } });
    if (!current) await prisma.businessHour.create({ data: { dayOfWeek, opensAt: '12:30', closesAt: '21:30' } });
  }

  const services = [['corte-cejas', 'Corte + Cejas', 'Corte a elección con perfilado de cejas preciso.', 10000], ['corte-barba', 'Corte + Barba', 'Corte premium + perfilado de barba.', 16000], ['corte-diseno', 'Corte con Diseño', 'Corte fade con diseño freestyle o a elección.', 12000]] as const;
  for (const [sortOrder, [slug, name, description, price]] of services.entries()) {
    const current = await prisma.service.findUnique({ where: { slug } });
    if (!current) await prisma.service.create({ data: { slug, name, description, price, status: 'PUBLISHED', sortOrder } });
  }

  const media = async (url: string, alt: string) => {
    const current = await prisma.mediaAsset.findUnique({ where: { url } });
    return current ?? prisma.mediaAsset.create({ data: { url, alt } });
  };
  const category = async (slug: string, name: string, sortOrder: number) => {
    const current = await prisma.galleryCategory.findUnique({ where: { slug } });
    return current ?? prisma.galleryCategory.create({ data: { slug, name, sortOrder } });
  };
  const design = await category('design', 'Corte con Diseño', 0);
  const normal = await category('normal', 'Corte Normal', 1);
  const gallery = [['/images/cut-1.png', 'MID FADE EN V CON DISEÑO', design], ['/images/cut-2.png', 'LOW FADE TEXTURIZADO', design], ['/images/cut-3.png', 'DISEÑO VERSACE PREMIUM', design], ['/images/cut-4.png', 'BURST FADE', design], ['/images/cut-5.jpg', 'BURST FADE', design], ['/images/normal-1.jpg', 'BURST FADE', normal], ['/images/normal-2.jpg', 'BURST FADE', normal], ['/images/normal-3.jpg', 'BURST FADE', normal], ['/images/normal-4.jpg', 'BURST FADE', normal], ['/images/normal-5.jpg', 'BURST FADE', normal]] as const;
  for (const [sortOrder, [url, title, cat]] of gallery.entries()) {
    const asset = await media(url, title);
    const existing = await prisma.galleryItem.findFirst({ where: { mediaId: asset.id } });
    if (!existing) await prisma.galleryItem.create({ data: { title, alt: title, mediaId: asset.id, categoryId: cat.id, status: 'PUBLISHED', sortOrder } });
  }

  const products = [['promo-cursed-smells', 'Promo Cursed Smells', '/images/perfumes/PROMO.png', 'Más Vendido', [['100ml', 12000], ['30ml', 6000]]], ['perfume-asad', 'Perfume ASAD', '/images/perfumes/ASAD.png', null, [['30ml', 6000]]], ['salvang-pour-home', 'SALVANG Pour Home', '/images/perfumes/SALVANG.png', null, [['30ml', 6000]]], ['vigorous', 'VIGOROUS', '/images/perfumes/VIGOROUS.png', null, [['100ml', 12000]]], ['perfume', 'Perfume', '/images/perfumes/PERFUME.png', null, [['30ml', 6000]]], ['perfumes', 'Perfumes', '/images/perfumes/PERFUMES.png', null, [['30ml', 6000]]]] as const;
  for (const [sortOrder, [slug, name, url, badge, variants]] of products.entries()) {
    const asset = await media(url, name);
    let stored = await prisma.product.findUnique({ where: { slug } });
    if (!stored) stored = await prisma.product.create({ data: { slug, name, imageId: asset.id, badge, status: 'PUBLISHED', sortOrder } });
    for (const [label, price] of variants) {
      const variant = await prisma.productVariant.findUnique({ where: { productId_label: { productId: stored.id, label } } });
      if (!variant) await prisma.productVariant.create({ data: { productId: stored.id, label, price } });
    }
  }

  const plans = [['vip-solo-corte', 'Solo Corte', 'Ideal para mantener tu degradado y estilo fresco todas las semanas.', 35000, 40000, 'Plan Básico VIP', ['4 Cortes de cabello al mes', 'Agendamiento prioritario', 'Tarjeta de Cliente VIP física']], ['vip-corte-barba', 'Corte + Barba', 'El servicio completo. Corte y perfilado de barba para una imagen impecable.', 50000, 60000, 'Más Popular', ['4 Cortes de cabello al mes', '4 Perfilados de barba completos', 'Agendamiento prioritario', 'Tarjeta de Cliente VIP física']]] as const;
  for (const [sortOrder, [slug, name, description, monthlyPrice, compareAtPrice, badge, benefits]] of plans.entries()) {
    const current = await prisma.membershipPlan.findUnique({ where: { slug } });
    if (!current) await prisma.membershipPlan.create({ data: { slug, name, description, monthlyPrice, compareAtPrice, badge, status: 'PUBLISHED', isFeatured: sortOrder === 1, sortOrder, benefits: { create: benefits.map((text, index) => ({ text, sortOrder: index })) } } });
  }

  let course = await prisma.course.findUnique({ where: { slug: 'barberia-basico' } });
  if (!course) course = await prisma.course.create({ data: { slug: 'barberia-basico', title: 'CURSO DE BARBERÍA', subtitle: 'Básico', description: '¿Quieres aprender a cortar cabello y generar ingresos? Este curso es para ti.', pricePerClass: 35000, whatsappPhone: '56971405996', status: 'PUBLISHED' } });
  if (await prisma.courseModule.count({ where: { courseId: course.id } }) === 0) {
    const modules = [['Aprende desde cero', 'No necesitas experiencia previa. Te enseñaremos el manejo de herramientas y teoría fundamental paso a paso.'], ['Degradados (Fade)', 'Aprende a borrar líneas perfectamente para crear transiciones suaves y profesionales.'], ['Cortes Formales', 'Estructura a tijera, divisiones y técnicas clásicas.'], ['Diseños Modernos', 'Líneas, figuras y freestyle urbano con navaja y trimmer.'], ['Barbas Perfectas', 'Perfilado simétrico y técnicas para esculpir barbas.'], ['Peinados Profesionales', 'Polvos, ceras y secador para volumen y textura.']] as const;
    await prisma.courseModule.createMany({ data: modules.map(([title, description], sortOrder) => ({ courseId: course!.id, title, description, sortOrder })) });
  }
}

main().finally(() => prisma.$disconnect());
