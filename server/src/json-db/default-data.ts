import { randomUUID } from 'node:crypto';

export interface DatabaseSchema {
  users: any[];
  businessProfiles: any[];
  businessContacts: any[];
  brandAesthetics: any[];
  brandAccentColors: any[];
  pageHeroes: any[];
  galleryHeaders: any[];
  courseCtas: any[];
  vipBanners: any[];
  vipComparisons: any[];
  philosophies: any[];
  philosophyParagraphs: any[];
  philosophyPillars: any[];
  experienceItems: any[];
  valuePropositions: any[];
  testimonials: any[];
  pageSections: any[];
  navigationItems: any[];
  businessHours: any[];
  mediaAssets: any[];
  services: any[];
  galleryCategories: any[];
  galleryItems: any[];
  products: any[];
  productVariants: any[];
  membershipPlans: any[];
  membershipBenefits: any[];
  courses: any[];
  courseModules: any[];
  customers: any[];
  bookings: any[];
  productReservations: any[];
  membershipLeads: any[];
  courseLeads: any[];
  auditLogs: any[];
  auditChanges: any[];
  legacySettings: any[];
  legacySettingNodes: any[];
}

export function createDefaultData(passwordHash: string, adminEmail = 'admin@manubarber.cl'): DatabaseSchema {
  const now = new Date();

  // Media assets
  const mediaList = [
    { url: '/images/manu-logo.png', alt: 'ManuBarber Logo', title: 'Logo' },
    { url: '/images/hero.jpg', alt: 'Hero Barbero', title: 'Hero' },
    { url: '/images/image.png', alt: 'Barbero trabajando con precisión y estilo urbano', title: 'Filosofía' },
    { url: '/images/perfumes/LOGOCURSED.jpeg', alt: 'Tienda Oficial Fragancias', title: 'Tienda' },
    { url: '/images/cut-1.png', alt: 'MID FADE EN V CON DISEÑO', title: 'MID FADE EN V CON DISEÑO' },
    { url: '/images/cut-2.png', alt: 'LOW FADE TEXTURIZADO', title: 'LOW FADE TEXTURIZADO' },
    { url: '/images/cut-3.png', alt: 'DISEÑO VERSACE PREMIUM', title: 'DISEÑO VERSACE PREMIUM' },
    { url: '/images/cut-4.png', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/cut-5.jpg', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/normal-1.jpg', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/normal-2.jpg', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/normal-3.jpg', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/normal-4.jpg', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/normal-5.jpg', alt: 'BURST FADE', title: 'BURST FADE' },
    { url: '/images/perfumes/PROMO.png', alt: 'Promo Cursed Smells', title: 'Promo Cursed Smells' },
    { url: '/images/perfumes/ASAD.png', alt: 'Perfume ASAD', title: 'Perfume ASAD' },
    { url: '/images/perfumes/SALVANG.png', alt: 'SALVANG Pour Home', title: 'SALVANG Pour Home' },
    { url: '/images/perfumes/VIGOROUS.png', alt: 'VIGOROUS', title: 'VIGOROUS' },
    { url: '/images/perfumes/PERFUME.png', alt: 'Perfume', title: 'Perfume' },
    { url: '/images/perfumes/PERFUMES.png', alt: 'Perfumes', title: 'Perfumes' },
  ];

  const mediaAssets = mediaList.map((m) => ({
    id: randomUUID(),
    url: m.url,
    alt: m.alt,
    title: m.title,
    mimeType: m.url.endsWith('.png') ? 'image/png' : 'image/jpeg',
    createdAt: now,
    updatedAt: now,
  }));

  const getMediaId = (url: string) => mediaAssets.find((m) => m.url === url)?.id || null;

  // Admin user
  const users = [
    {
      id: randomUUID(),
      email: adminEmail,
      displayName: 'Administrador',
      role: 'ADMIN',
      isActive: true,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Business profile
  const businessProfiles = [
    {
      id: randomUUID(),
      key: 'default',
      name: 'ManuBarber',
      tagline: 'Estilo, precisión y calle',
      timezone: 'America/Santiago',
      currency: 'CLP',
      logoUrl: '/images/manu-logo.png',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Business contact
  const businessContacts = [
    {
      id: randomUUID(),
      key: 'default',
      address: 'Andrés Bello con General Mackenna',
      city: 'Temuco',
      instagramUrl: 'https://instagram.com/manu_barbeer',
      whatsappPhone: '56936355068',
      mapEmbedUrl: 'https://maps.google.com/maps?q=Andres%20Bello%20con%20General%20Mackenna,%20Temuco&t=m&z=16&ie=UTF8&iwloc=&output=embed',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Brand aesthetic
  const brandAestheticId = randomUUID();
  const brandAesthetics = [
    {
      id: brandAestheticId,
      key: 'default',
      japaneseMark: '磨',
      eyebrow: 'MANUBARBER STREET CLUB',
      heroSideText: 'CALLE • CÓDIGO • PRECISIÓN',
      heroJapanese: '己を磨け',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const brandAccentColors = ['#D10B20', '#7C3AED', '#00E5FF'].map((hexColor, sortOrder) => ({
    id: randomUUID(),
    brandId: brandAestheticId,
    hexColor,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  }));

  // Page heroes
  const pageHeroes = [
    {
      id: randomUUID(),
      pageKey: 'HOME',
      eyebrow: null,
      title: 'ESTILO, PRECISIÓN Y CALLE',
      description: 'No es solo un corte, es identidad. Elevamos tu imagen con técnicas premium y esencia urbana.',
      imageUrl: '/images/hero.jpg',
      ctaLabel: 'Reservar Hora',
      ctaHref: '#reserva',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      pageKey: 'STORE',
      eyebrow: null,
      title: 'TIENDA OFICIAL',
      description: 'Mantén tu aroma impecable todos los días. Fragancias seleccionadas para tu estilo y personalidad. Resérvalas fácilmente y retíralas en tienda.',
      imageUrl: '/images/perfumes/LOGOCURSED.jpeg',
      ctaLabel: null,
      ctaHref: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      pageKey: 'VIP',
      eyebrow: 'Membresía Exclusiva',
      title: 'CLIENTES VIP',
      description: 'Cortes asegurados todo el mes. Mantén tu imagen intacta pagando menos. Exclusividad, ahorro y el mejor estilo de la calle.',
      imageUrl: '/images/hero.jpg',
      ctaLabel: null,
      ctaHref: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Gallery header
  const galleryHeaders = [
    {
      id: randomUUID(),
      key: 'default',
      title: 'MI TRABAJO',
      description: 'Precisión quirúrgica en cada línea.',
      watermark: 'PORTAFOLIO',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Course CTA
  const courseCtas = [
    {
      id: randomUUID(),
      key: 'default',
      title: 'TU FUTURO EMPIEZA HOY',
      description: 'No dejes pasar la oportunidad de aprender un oficio rentable con alta demanda. Los cupos se llenan rápido.',
      label: 'Quiero mi Cupo',
      href: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // VIP banner & comparison
  const vipBanners = [
    {
      id: randomUUID(),
      key: 'default',
      title: '¿Quieres ser Cliente VIP?',
      description: 'Asegura tu estilo todo el mes. Accede a cortes periódicos, agendamiento prioritario y beneficios exclusivos.',
      ctaLabel: 'Ver Membresías',
      href: '/vip',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const vipComparisons = [
    {
      id: randomUUID(),
      key: 'default',
      visits: 4,
      individualPrice: 10000,
      vipPrice: 35000,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Philosophy
  const philosophyId = randomUUID();
  const philosophies = [
    {
      id: philosophyId,
      key: 'default',
      japaneseTitle: '哲学',
      title: 'CALLE EN EL ALMA. PRECISIÓN EN CADA DETALLE.',
      kicker: 'Street craft · Japanese discipline',
      quote: 'EL FLOW SE SIENTE. LA TÉCNICA SE NOTA.',
      imageUrl: '/images/image.png',
      imageAlt: 'Barbero trabajando con precisión y estilo urbano',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const philosophyParagraphs = [
    {
      id: randomUUID(),
      philosophyId,
      text: 'ManuBarber nace en la calle: identidad propia, actitud sin disfraz y respeto por el proceso. Tomamos esa energía urbana y la llevamos a una experiencia de barbería con estándar profesional.',
      sortOrder: 0,
    },
    {
      id: randomUUID(),
      philosophyId,
      text: 'Nos inspira la disciplina japonesa: manos firmes, herramientas impecables y técnica repetida hasta dominarla. Cada fade, perfilado y textura se trabaja con intención; no improvisamos tu estilo, lo construimos contigo.',
      sortOrder: 1,
    },
  ];

  const philosophyPillars = [
    {
      id: randomUUID(),
      philosophyId,
      label: 'CALLE',
      description: 'Tu historia, tu flow y una estética sin copias.',
      sortOrder: 0,
    },
    {
      id: randomUUID(),
      philosophyId,
      label: 'CÓDIGO',
      description: 'Respeto, puntualidad y compromiso con cada cliente.',
      sortOrder: 1,
    },
    {
      id: randomUUID(),
      philosophyId,
      label: 'TÉCNICA',
      description: 'Precisión profesional desde la consulta hasta el último detalle.',
      sortOrder: 2,
    },
  ];

  // Experience Items
  const experienceItems = [
    { id: randomUUID(), title: 'PRECISIÓN', description: 'Técnicas depuradas y herramientas de alta gama para acabados perfectos.', sortOrder: 0, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), title: 'EXPERIENCIA', description: 'Un barbero enfocado en perfeccionar su arte en cada sesión.', sortOrder: 1, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), title: 'EXCLUSIVIDAD', description: 'Un ambiente cómodo y diseñado para tu desconexión.', sortOrder: 2, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), title: 'PUNTUALIDAD', description: 'Tu tiempo vale. Respetamos rigurosamente cada bloque agendado.', sortOrder: 3, isVisible: true, createdAt: now, updatedAt: now },
  ];

  // Value propositions
  const valuePropositions = [
    { id: randomUUID(), icon: '★', title: 'Experiencia', description: 'Años perfeccionando la técnica. Manejo impecable de tijeras, navaja y máquina para resultados consistentes y de primer nivel.', sortOrder: 0, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), icon: '♨', title: 'Estilo Personalizado', description: 'Analizamos tus facciones y tu vibra. Cada fade, textura y diseño está pensado exclusivamente para potenciar tu imagen.', sortOrder: 1, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), icon: '✦', title: 'Atención Profesional', description: 'Un ambiente premium donde el respeto y la puntualidad son ley. Relájate y deja que el experto haga su trabajo.', sortOrder: 2, isVisible: true, createdAt: now, updatedAt: now },
  ];

  // Testimonials
  const testimonials = [
    { id: randomUUID(), author: 'CLIENTE MANUBARBER', service: 'CORTE SIGNATURE', text: 'La atención al detalle es increíble. No es solo un corte, es una asesoría completa.', sortOrder: 0, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), author: 'CLIENTE VIP', service: 'FULL EXPERIENCE', text: 'El mejor fade que me han hecho. La precisión justifica totalmente ser miembro.', sortOrder: 1, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), author: 'CLIENTE FRECUENTE', service: 'BEARD DESIGN', text: 'Desde que entras hasta que sales, el servicio es impecable.', sortOrder: 2, isVisible: true, createdAt: now, updatedAt: now },
  ];

  // Page sections
  const pageSections = [
    { id: randomUUID(), pageKey: 'home', sectionKey: 'philosophy', japaneseLabel: '哲学', title: 'FILOSOFÍA DE MARCA', subtitle: null, sortOrder: 0, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'services', japaneseLabel: 'サービス', title: 'SERVICIOS SIGNATURE', subtitle: null, sortOrder: 1, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'booking', japaneseLabel: '予約', title: 'RESERVA TU EXPERIENCIA', subtitle: null, sortOrder: 2, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'gallery', japaneseLabel: '作品', title: 'GALERÍA DE TRABAJOS', subtitle: null, sortOrder: 3, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'memberships', japaneseLabel: 'メンバーシップ', title: 'MEMBRESÍAS', subtitle: null, sortOrder: 4, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'products', japaneseLabel: '商品', title: 'CUIDADO PREMIUM', subtitle: null, sortOrder: 5, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'experience', japaneseLabel: '体験', title: 'EL ESTÁNDAR MANUBARBER', subtitle: null, sortOrder: 6, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'testimonials', japaneseLabel: 'お客様の声', title: 'LA VOZ DEL CLUB', subtitle: null, sortOrder: 7, isVisible: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), pageKey: 'home', sectionKey: 'contact', japaneseLabel: '場所', title: 'UBICACIÓN Y CONTACTO', subtitle: 'Visítanos. Espacios diseñados para el confort, el detalle y la estética masculina.', sortOrder: 8, isVisible: true, createdAt: now, updatedAt: now },
  ];

  // Navigation
  const navDefs = [['Tienda', '/tienda'], ['Mi Trabajo', '/galeria'], ['Servicios', '/#servicios'], ['VIP', '/vip'], ['Cursos', '/capacitacion']];
  const navigationItems = navDefs.map(([label, href], sortOrder) => ({
    id: randomUUID(),
    label,
    href,
    position: 'HEADER',
    sortOrder,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  }));

  // Business hours
  const businessHours = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
    id: randomUUID(),
    dayOfWeek,
    opensAt: '12:30',
    closesAt: '21:30',
    isClosed: false,
    createdAt: now,
    updatedAt: now,
  }));

  // Services
  const servicesDefs = [
    { slug: 'corte-cejas', name: 'Corte + Cejas', description: 'Corte a elección con perfilado de cejas preciso.', price: 10000, durationMinutes: 60, status: 'PUBLISHED', isFeatured: false, sortOrder: 0 },
    { slug: 'corte-barba', name: 'Corte + Barba', description: 'Corte premium + perfilado de barba.', price: 16000, durationMinutes: 60, status: 'PUBLISHED', isFeatured: true, sortOrder: 1 },
    { slug: 'corte-diseno', name: 'Corte con Diseño', description: 'Corte fade con diseño freestyle o a elección.', price: 12000, durationMinutes: 60, status: 'PUBLISHED', isFeatured: false, sortOrder: 2 },
  ];
  const services = servicesDefs.map((s) => ({
    id: randomUUID(),
    ...s,
    icon: null,
    badge: null,
    createdAt: now,
    updatedAt: now,
  }));

  // Gallery categories
  const designCatId = randomUUID();
  const normalCatId = randomUUID();
  const galleryCategories = [
    { id: designCatId, slug: 'design', name: 'Corte con Diseño', sortOrder: 0, createdAt: now, updatedAt: now },
    { id: normalCatId, slug: 'normal', name: 'Corte Normal', sortOrder: 1, createdAt: now, updatedAt: now },
  ];

  // Gallery items
  const galleryDefs = [
    ['/images/cut-1.png', 'MID FADE EN V CON DISEÑO', designCatId],
    ['/images/cut-2.png', 'LOW FADE TEXTURIZADO', designCatId],
    ['/images/cut-3.png', 'DISEÑO VERSACE PREMIUM', designCatId],
    ['/images/cut-4.png', 'BURST FADE', designCatId],
    ['/images/cut-5.jpg', 'BURST FADE', designCatId],
    ['/images/normal-1.jpg', 'BURST FADE', normalCatId],
    ['/images/normal-2.jpg', 'BURST FADE', normalCatId],
    ['/images/normal-3.jpg', 'BURST FADE', normalCatId],
    ['/images/normal-4.jpg', 'BURST FADE', normalCatId],
    ['/images/normal-5.jpg', 'BURST FADE', normalCatId],
  ] as const;

  const galleryItems = galleryDefs.map(([url, title, categoryId], sortOrder) => ({
    id: randomUUID(),
    title,
    alt: title,
    mediaId: getMediaId(url)!,
    categoryId,
    status: 'PUBLISHED',
    sortOrder,
    createdAt: now,
    updatedAt: now,
  }));

  // Products and variants
  const productVariants: any[] = [];
  const productDefs = [
    ['promo-cursed-smells', 'Promo Cursed Smells', '/images/perfumes/PROMO.png', 'Más Vendido', [['100ml', 12000], ['30ml', 6000]]],
    ['perfume-asad', 'Perfume ASAD', '/images/perfumes/ASAD.png', null, [['30ml', 6000]]],
    ['salvang-pour-home', 'SALVANG Pour Home', '/images/perfumes/SALVANG.png', null, [['30ml', 6000]]],
    ['vigorous', 'VIGOROUS', '/images/perfumes/VIGOROUS.png', null, [['100ml', 12000]]],
    ['perfume', 'Perfume', '/images/perfumes/PERFUME.png', null, [['30ml', 6000]]],
    ['perfumes', 'Perfumes', '/images/perfumes/PERFUMES.png', null, [['30ml', 6000]]],
  ] as const;

  const products = productDefs.map(([slug, name, url, badge, variants], sortOrder) => {
    const productId = randomUUID();
    for (const [label, price] of variants as unknown as [string, number][]) {
      productVariants.push({
        id: randomUUID(),
        productId,
        label,
        price,
        stockQuantity: 10,
        sku: null,
      });
    }
    return {
      id: productId,
      slug,
      name,
      description: null,
      imageId: getMediaId(url),
      badge,
      status: 'PUBLISHED',
      isFeatured: sortOrder === 0,
      stockQuantity: 10,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };
  });

  // Membership plans and benefits
  const membershipBenefits: any[] = [];
  const planDefs = [
    ['vip-solo-corte', 'Solo Corte', 'Ideal para mantener tu degradado y estilo fresco todas las semanas.', 35000, 40000, 'Plan Básico VIP', ['4 Cortes de cabello al mes', 'Agendamiento prioritario', 'Tarjeta de Cliente VIP física']],
    ['vip-corte-barba', 'Corte + Barba', 'El servicio completo. Corte y perfilado de barba para una imagen impecable.', 50000, 60000, 'Más Popular', ['4 Cortes de cabello al mes', '4 Perfilados de barba completos', 'Agendamiento prioritario', 'Tarjeta de Cliente VIP física']],
  ] as const;

  const membershipPlans = planDefs.map(([slug, name, description, monthlyPrice, compareAtPrice, badge, benefits], sortOrder) => {
    const planId = randomUUID();
    (benefits as unknown as string[]).forEach((text, index) => {
      membershipBenefits.push({
        id: randomUUID(),
        planId,
        text,
        icon: null,
        sortOrder: index,
      });
    });
    return {
      id: planId,
      slug,
      name,
      description,
      monthlyPrice,
      compareAtPrice,
      badge,
      status: 'PUBLISHED',
      isFeatured: sortOrder === 1,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };
  });

  // Course and modules
  const courseId = randomUUID();
  const courseModuleDefs = [
    ['Aprende desde cero', 'No necesitas experiencia previa. Te enseñaremos el manejo de herramientas y teoría fundamental paso a paso.'],
    ['Degradados (Fade)', 'Aprende a borrar líneas perfectamente para crear transiciones suaves y profesionales.'],
    ['Cortes Formales', 'Estructura a tijera, divisiones y técnicas clásicas.'],
    ['Diseños Modernos', 'Líneas, figuras y freestyle urbano con navaja y trimmer.'],
    ['Barbas Perfectas', 'Perfilado simétrico y técnicas para esculpir barbas.'],
    ['Peinados Profesionales', 'Polvos, ceras y secador para volumen y textura.'],
  ];

  const courseModules = courseModuleDefs.map(([title, description], sortOrder) => ({
    id: randomUUID(),
    courseId,
    title,
    description,
    icon: null,
    sortOrder,
  }));

  const courses = [
    {
      id: courseId,
      slug: 'barberia-basico',
      title: 'CURSO DE BARBERÍA',
      subtitle: 'Básico',
      description: '¿Quieres aprender a cortar cabello y generar ingresos? Este curso es para ti.',
      pricePerClass: 35000,
      whatsappPhone: '56971405996',
      heroImageId: null,
      status: 'PUBLISHED',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    users,
    businessProfiles,
    businessContacts,
    brandAesthetics,
    brandAccentColors,
    pageHeroes,
    galleryHeaders,
    courseCtas,
    vipBanners,
    vipComparisons,
    philosophies,
    philosophyParagraphs,
    philosophyPillars,
    experienceItems,
    valuePropositions,
    testimonials,
    pageSections,
    navigationItems,
    businessHours,
    mediaAssets,
    services,
    galleryCategories,
    galleryItems,
    products,
    productVariants,
    membershipPlans,
    membershipBenefits,
    courses,
    courseModules,
    customers: [],
    bookings: [],
    productReservations: [],
    membershipLeads: [],
    courseLeads: [],
    auditLogs: [],
    auditChanges: [],
    legacySettings: [],
    legacySettingNodes: [],
  };
}
