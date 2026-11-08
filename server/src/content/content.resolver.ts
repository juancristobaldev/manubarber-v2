import { Args, Context, Field, InputType, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Course, GalleryCategory, GalleryItem, MembershipPlan, Product, Service } from '../catalog/catalog.resolver';

// ---------------------------------------------------------------------------
// Object types
// ---------------------------------------------------------------------------

@ObjectType() class BusinessProfile {
  @Field() name!: string;
  @Field() tagline!: string;
  @Field() timezone!: string;
  @Field() currency!: string;
  @Field() logoUrl!: string;
}
@ObjectType() class BusinessContact {
  @Field() address!: string;
  @Field() city!: string;
  @Field() instagramUrl!: string;
  @Field() whatsappPhone!: string;
  @Field() mapEmbedUrl!: string;
}
@ObjectType() class BrandAccentColor { @Field() hexColor!: string; @Field(() => Int) sortOrder!: number; }
@ObjectType() class BrandAesthetic {
  @Field() japaneseMark!: string;
  @Field() eyebrow!: string;
  @Field() heroSideText!: string;
  @Field() heroJapanese!: string;
  @Field(() => [BrandAccentColor]) accentColors!: BrandAccentColor[];
}
@ObjectType() export class Navigation { @Field() id!: string; @Field() label!: string; @Field() href!: string; @Field() position!: string; @Field(() => Int) sortOrder!: number; @Field() isVisible!: boolean; }
@InputType() class NavigationInput { @Field() label!: string; @Field() href!: string; @Field({ defaultValue: 'HEADER' }) position!: string; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; @Field({ defaultValue: true }) isVisible!: boolean; }
@ObjectType() export class BusinessHour { @Field() id!: string; @Field(() => Int) dayOfWeek!: number; @Field() opensAt!: string; @Field() closesAt!: string; @Field() isClosed!: boolean; }
@InputType() class BusinessHourInput { @Field(() => Int) dayOfWeek!: number; @Field() opensAt!: string; @Field() closesAt!: string; @Field({ defaultValue: false }) isClosed!: boolean; }
@ObjectType() export class Media { @Field() id!: string; @Field() url!: string; @Field() alt!: string; @Field(() => String, { nullable: true }) title?: string | null; @Field(() => String, { nullable: true }) mimeType?: string | null; }
@InputType() class MediaInput { @Field() url!: string; @Field() alt!: string; @Field({ nullable: true }) title?: string; @Field({ nullable: true }) mimeType?: string; @Field(() => Int, { nullable: true }) width?: number; @Field(() => Int, { nullable: true }) height?: number; }
@ObjectType() class PageHero {
  @Field() pageKey!: string;
  @Field(() => String, { nullable: true }) eyebrow?: string | null;
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field(() => String, { nullable: true }) ctaLabel?: string | null;
  @Field(() => String, { nullable: true }) ctaHref?: string | null;
}
@ObjectType() class GalleryHeader {
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => String, { nullable: true }) watermark?: string | null;
}
@ObjectType() class CourseCta {
  @Field() title!: string;
  @Field() description!: string;
  @Field() label!: string;
  @Field(() => String, { nullable: true }) href?: string | null;
}
@ObjectType() class VipBanner {
  @Field() title!: string;
  @Field() description!: string;
  @Field() ctaLabel!: string;
  @Field() href!: string;
}
@ObjectType() class VipComparison {
  @Field(() => Int) visits!: number;
  @Field(() => Int) individualPrice!: number;
  @Field(() => Int) vipPrice!: number;
  @Field(() => Int) standardTotal!: number;
  @Field(() => Int) savings!: number;
}
@ObjectType() class PhilosophyParagraph { @Field() id!: string; @Field() text!: string; @Field(() => Int) sortOrder!: number; }
@ObjectType() class PhilosophyPillar { @Field() id!: string; @Field() label!: string; @Field() description!: string; @Field(() => Int) sortOrder!: number; }
@ObjectType() class Philosophy {
  @Field() japaneseTitle!: string;
  @Field() title!: string;
  @Field() kicker!: string;
  @Field() quote!: string;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field(() => String, { nullable: true }) imageAlt?: string | null;
  @Field(() => [PhilosophyParagraph]) paragraphs!: PhilosophyParagraph[];
  @Field(() => [PhilosophyPillar]) pillars!: PhilosophyPillar[];
}
@ObjectType() class ExperienceItem {
  @Field() id!: string;
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => String, { nullable: true }) icon?: string | null;
  @Field(() => Int) sortOrder!: number;
  @Field() isVisible!: boolean;
}
@ObjectType() class ValueProposition {
  @Field() id!: string;
  @Field(() => String, { nullable: true }) icon?: string | null;
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => Int) sortOrder!: number;
  @Field() isVisible!: boolean;
}
@ObjectType() class Testimonial {
  @Field() id!: string;
  @Field() author!: string;
  @Field(() => String, { nullable: true }) service?: string | null;
  @Field() text!: string;
  @Field(() => Int) sortOrder!: number;
  @Field() isVisible!: boolean;
}
@ObjectType() class PageSection {
  @Field() id!: string;
  @Field() pageKey!: string;
  @Field() sectionKey!: string;
  @Field(() => String, { nullable: true }) japaneseLabel?: string | null;
  @Field() title!: string;
  @Field(() => String, { nullable: true }) subtitle?: string | null;
  @Field(() => Int) sortOrder!: number;
  @Field() isVisible!: boolean;
}
@ObjectType() class SiteContent {
  @Field(() => BusinessProfile, { nullable: true }) profile?: BusinessProfile;
  @Field(() => BusinessContact, { nullable: true }) contact?: BusinessContact;
  @Field(() => BrandAesthetic, { nullable: true }) brand?: BrandAesthetic;
  @Field(() => PageHero, { nullable: true }) homeHero?: PageHero;
  @Field(() => PageHero, { nullable: true }) storeHero?: PageHero;
  @Field(() => PageHero, { nullable: true }) vipHero?: PageHero;
  @Field(() => GalleryHeader, { nullable: true }) galleryHeader?: GalleryHeader;
  @Field(() => CourseCta, { nullable: true }) courseCta?: CourseCta;
  @Field(() => VipBanner, { nullable: true }) vipBanner?: VipBanner;
  @Field(() => VipComparison, { nullable: true }) vipComparison?: VipComparison;
  @Field(() => Philosophy, { nullable: true }) philosophy?: Philosophy;
  @Field(() => [ExperienceItem]) experience!: ExperienceItem[];
  @Field(() => [ValueProposition]) valueProps!: ValueProposition[];
  @Field(() => [Testimonial]) testimonials!: Testimonial[];
  @Field(() => [PageSection]) pageSections!: PageSection[];
}
@ObjectType() class AuditChangeView {
  @Field() field!: string;
  @Field() valueType!: string;
  @Field({ nullable: true }) oldValue?: string;
  @Field({ nullable: true }) newValue?: string;
}
@ObjectType() class AdminLead {
  @Field() id!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
  @Field(() => String, { nullable: true }) customerName?: string | null;
  @Field(() => String, { nullable: true }) phone?: string | null;
  @Field(() => String, { nullable: true }) email?: string | null;
  @Field(() => String, { nullable: true }) notes?: string | null;
  @Field(() => String, { nullable: true }) productName?: string | null;
  @Field(() => String, { nullable: true }) planName?: string | null;
  @Field(() => String, { nullable: true }) courseName?: string | null;
}
@ObjectType() class AdminCatalog {
  @Field(() => [Navigation]) navigation!: Navigation[];
  @Field(() => [BusinessHour]) hours!: BusinessHour[];
  @Field(() => [Media]) media!: Media[];
  @Field(() => [Service]) services!: Service[];
  @Field(() => [Product]) products!: Product[];
  @Field(() => [MembershipPlan]) plans!: MembershipPlan[];
  @Field(() => [Course]) courses!: Course[];
  @Field(() => [GalleryCategory]) categories!: GalleryCategory[];
  @Field(() => [GalleryItem]) gallery!: GalleryItem[];
  @Field(() => [AdminLead]) productLeads!: AdminLead[];
  @Field(() => [AdminLead]) membershipLeads!: AdminLead[];
  @Field(() => [AdminLead]) courseLeads!: AdminLead[];
}
@ObjectType() class AuditEntry {
  @Field() id!: string;
  @Field() action!: string;
  @Field() entity!: string;
  @Field() entityId!: string;
  @Field({ nullable: true }) actorName?: string;
  @Field() createdAt!: Date;
  @Field(() => [AuditChangeView]) changes!: AuditChangeView[];
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

@InputType() class ProfileInput {
  @Field() name!: string;
  @Field() tagline!: string;
  @Field() timezone!: string;
  @Field() currency!: string;
  @Field() logoUrl!: string;
}
@InputType() class ContactInput {
  @Field() address!: string;
  @Field() city!: string;
  @Field() instagramUrl!: string;
  @Field() whatsappPhone!: string;
  @Field() mapEmbedUrl!: string;
}
@InputType() class BrandInput {
  @Field() japaneseMark!: string;
  @Field() eyebrow!: string;
  @Field() heroSideText!: string;
  @Field() heroJapanese!: string;
  @Field(() => [String]) accentColors!: string[];
}
@InputType() class PageHeroInput {
  @Field() pageKey!: string;
  @Field(() => String, { nullable: true }) eyebrow?: string | null;
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field(() => String, { nullable: true }) ctaLabel?: string | null;
  @Field(() => String, { nullable: true }) ctaHref?: string | null;
}
@InputType() class GalleryHeaderInput {
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => String, { nullable: true }) watermark?: string | null;
}
@InputType() class CourseCtaInput {
  @Field() title!: string;
  @Field() description!: string;
  @Field() label!: string;
  @Field(() => String, { nullable: true }) href?: string | null;
}
@InputType() class VipBannerInput {
  @Field() title!: string;
  @Field() description!: string;
  @Field() ctaLabel!: string;
  @Field() href!: string;
}
@InputType() class VipComparisonInput {
  @Field(() => Int) visits!: number;
  @Field(() => Int) individualPrice!: number;
  @Field(() => Int) vipPrice!: number;
}
@InputType() class PhilosophyPillarInput {
  @Field() label!: string;
  @Field() description!: string;
}
@InputType() class PhilosophyInput {
  @Field() japaneseTitle!: string;
  @Field() title!: string;
  @Field() kicker!: string;
  @Field() quote!: string;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field(() => String, { nullable: true }) imageAlt?: string | null;
  @Field(() => [String]) paragraphs!: string[];
  @Field(() => [PhilosophyPillarInput]) pillars!: PhilosophyPillarInput[];
}
@InputType() class ExperienceInput {
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => String, { nullable: true }) icon?: string | null;
  @Field(() => Int, { defaultValue: 0 }) sortOrder!: number;
  @Field({ defaultValue: true }) isVisible!: boolean;
}
@InputType() class ValuePropositionInput {
  @Field(() => String, { nullable: true }) icon?: string | null;
  @Field() title!: string;
  @Field() description!: string;
  @Field(() => Int, { defaultValue: 0 }) sortOrder!: number;
  @Field({ defaultValue: true }) isVisible!: boolean;
}
@InputType() class TestimonialInput {
  @Field() author!: string;
  @Field(() => String, { nullable: true }) service?: string | null;
  @Field() text!: string;
  @Field(() => Int, { defaultValue: 0 }) sortOrder!: number;
  @Field({ defaultValue: true }) isVisible!: boolean;
}
@InputType() class PageSectionInput {
  @Field() pageKey!: string;
  @Field() sectionKey!: string;
  @Field(() => String, { nullable: true }) japaneseLabel?: string | null;
  @Field() title!: string;
  @Field(() => String, { nullable: true }) subtitle?: string | null;
  @Field(() => Int, { defaultValue: 0 }) sortOrder!: number;
  @Field({ defaultValue: true }) isVisible!: boolean;
}

const PAGE_KEYS = ['HOME', 'STORE', 'VIP'];
const HEX = /^#[0-9a-f]{6}$/i;
const URL_LIKE = /^(https?:\/\/|\/|#)[^\s]+$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

@Resolver()
export class ContentResolver {
  constructor(private prisma: PrismaService, private auth: AuthService) {}
  private admin(context: { req: { headers: { authorization?: string } } }) { return this.auth.requireAdmin(context.req.headers.authorization); }

  private required(value: string | null | undefined, label: string, max = 5000) {
    if (!value?.trim()) throw new BadRequestException(`${label} es obligatorio`);
    if (value.length > max) throw new BadRequestException(`${label} es demasiado largo`);
    return value.trim();
  }
  private optionalUrl(value: string | null | undefined, label: string) {
    if (value != null && value !== '' && !URL_LIKE.test(value)) throw new BadRequestException(`${label} debe ser una URL o una ruta que empiece con /`);
    return value || null;
  }
  private optionalText(value: string | null | undefined, max = 5000) {
    if (value != null && value.length > max) throw new BadRequestException('Texto demasiado largo');
    return value?.trim() || null;
  }
  private nonNegative(value: number, label: string) {
    if (!Number.isInteger(value) || value < 0) throw new BadRequestException(`${label} debe ser un entero no negativo`);
    return value;
  }
  private validateProfile(input: ProfileInput) {
    this.required(input.name, 'Nombre', 120); this.required(input.tagline, 'Lema', 240);
    if (!/^[A-Z]{3}$/.test(input.currency)) throw new BadRequestException('La moneda debe tener tres letras, por ejemplo CLP');
    try { new Intl.DateTimeFormat('es-CL', { timeZone: input.timezone }); } catch { throw new BadRequestException('Zona horaria inválida'); }
    this.optionalUrl(input.logoUrl, 'Logo');
  }
  private validatePhilosophy(input: PhilosophyInput) {
    this.required(input.japaneseTitle, 'Título japonés', 120); this.required(input.title, 'Título', 240);
    this.required(input.kicker, 'Kicker', 240); this.required(input.quote, 'Cita', 240);
    this.optionalUrl(input.imageUrl, 'Imagen');
    input.paragraphs.forEach((text, index) => this.required(text, `Párrafo ${index + 1}`));
    input.pillars.forEach((pillar, index) => { this.required(pillar.label, `Pilar ${index + 1}`); this.required(pillar.description, `Descripción del pilar ${index + 1}`); });
  }

  @Query(() => [Navigation]) navigation(@Args('position', { nullable: true }) position?: string) { return this.prisma.navigationItem.findMany({ where: { isVisible: true, ...(position ? { position } : {}) }, orderBy: { sortOrder: 'asc' } }); }
  @Query(() => [BusinessHour]) businessHours() { return this.prisma.businessHour.findMany({ orderBy: { dayOfWeek: 'asc' } }); }
  @Query(() => [Media]) media() { return this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } }); }

  @Query(() => [Navigation]) async adminNavigation(@Context() ctx: any) { await this.admin(ctx); return this.prisma.navigationItem.findMany({ orderBy: { sortOrder: 'asc' } }); }
  @Mutation(() => Navigation) async createNavigationItem(@Args('input') input: NavigationInput, @Context() ctx: any) { await this.admin(ctx); if (!['HEADER', 'FOOTER'].includes(input.position)) throw new BadRequestException('Posición inválida'); return this.prisma.navigationItem.create({ data: input }); }
  @Mutation(() => Navigation) async updateNavigationItem(@Args('id') id: string, @Args('input') input: NavigationInput, @Context() ctx: any) { await this.admin(ctx); if (!['HEADER', 'FOOTER'].includes(input.position)) throw new BadRequestException('Posición inválida'); return this.prisma.navigationItem.update({ where: { id }, data: input }); }
  @Mutation(() => Boolean) async deleteNavigationItem(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.navigationItem.delete({ where: { id } }); return true; }
  @Mutation(() => BusinessHour) async upsertBusinessHour(@Args('input') input: BusinessHourInput, @Context() ctx: any) {
    await this.admin(ctx);
    if (input.dayOfWeek < 1 || input.dayOfWeek > 7 || !TIME.test(input.opensAt) || !TIME.test(input.closesAt) || (!input.isClosed && input.opensAt >= input.closesAt)) throw new BadRequestException('Horario inválido');
    return this.prisma.businessHour.upsert({ where: { dayOfWeek: input.dayOfWeek }, create: input, update: input });
  }
  @Mutation(() => Media) async createMediaAsset(@Args('input') input: MediaInput, @Context() ctx: any) { await this.admin(ctx); this.optionalUrl(input.url, 'URL'); return this.prisma.mediaAsset.create({ data: input }); }
  @Mutation(() => Media) async updateMediaAsset(@Args('id') id: string, @Args('input') input: MediaInput, @Context() ctx: any) { await this.admin(ctx); this.optionalUrl(input.url, 'URL'); return this.prisma.mediaAsset.update({ where: { id }, data: input }); }
  @Mutation(() => Boolean) async deleteMediaAsset(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.mediaAsset.delete({ where: { id } }); return true; }

  @Query(() => AdminCatalog)
  async adminCatalog(@Context() ctx: any): Promise<AdminCatalog> {
    await this.admin(ctx);
    const [navigation, hours, media, services, products, plans, courses, categories, gallery, productLeads, membershipLeads, courseLeads] = await Promise.all([
      this.prisma.navigationItem.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.businessHour.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.service.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.product.findMany({ include: { variants: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.membershipPlan.findMany({ include: { benefits: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.course.findMany({ include: { modules: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.galleryCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.galleryItem.findMany({ include: { media: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.productReservation.findMany({ include: { product: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
      this.prisma.membershipLead.findMany({ include: { plan: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
      this.prisma.courseLead.findMany({ include: { course: { select: { title: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    ]);
    return {
      navigation, hours, media, services, products, plans, courses, categories, gallery,
      productLeads: productLeads.map(row => ({ ...row, productName: row.product?.name || 'Producto no disponible' })),
      membershipLeads: membershipLeads.map(row => ({ ...row, customerName: row.name, planName: row.plan?.name || 'Plan no disponible' })),
      courseLeads: courseLeads.map(row => ({ ...row, customerName: row.name, courseName: row.course?.title || 'Curso no disponible' })),
    };
  }

  @Query(() => SiteContent)
  async siteContent(): Promise<SiteContent> { return this.readContent(true); }

  @Query(() => SiteContent)
  async adminSiteContent(@Context() ctx: any): Promise<SiteContent> { await this.admin(ctx); return this.readContent(false); }

  @Query(() => [String])
  async legacySettingKeys(@Context() ctx: any): Promise<string[]> {
    await this.admin(ctx);
    return (await this.prisma.legacySetting.findMany({ orderBy: { key: 'asc' }, select: { key: true } })).map(item => item.key);
  }

  private async readContent(publicOnly: boolean): Promise<SiteContent> {
    const visible = publicOnly ? { isVisible: true } : {};
    const [profile, contact, brand, heroes, galleryHeader, courseCta, vipBanner, comparison, philosophy, experience, valueProps, testimonials, pageSections] = await Promise.all([
      this.prisma.businessProfile.findUnique({ where: { key: 'default' } }),
      this.prisma.businessContact.findUnique({ where: { key: 'default' } }),
      this.prisma.brandAesthetic.findUnique({ where: { key: 'default' }, include: { accentColors: { orderBy: { sortOrder: 'asc' } } } }),
      this.prisma.pageHero.findMany(),
      this.prisma.galleryHeader.findUnique({ where: { key: 'default' } }),
      this.prisma.courseCta.findUnique({ where: { key: 'default' } }),
      this.prisma.vipBanner.findUnique({ where: { key: 'default' } }),
      this.prisma.vipComparison.findUnique({ where: { key: 'default' } }),
      this.prisma.philosophy.findUnique({ where: { key: 'default' }, include: { paragraphs: { orderBy: { sortOrder: 'asc' } }, pillars: { orderBy: { sortOrder: 'asc' } } } }),
      this.prisma.experienceItem.findMany({ where: visible, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
      this.prisma.valueProposition.findMany({ where: visible, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
      this.prisma.testimonial.findMany({ where: visible, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
      this.prisma.pageSection.findMany({ where: visible, orderBy: [{ pageKey: 'asc' }, { sortOrder: 'asc' }] }),
    ]);
    const hero = (key: string) => heroes.find(item => item.pageKey === key);
    return {
      profile: profile ?? undefined, contact: contact ?? undefined, brand: brand ?? undefined,
      homeHero: hero('HOME'), storeHero: hero('STORE'), vipHero: hero('VIP'),
      galleryHeader: galleryHeader ?? undefined, courseCta: courseCta ?? undefined,
      vipBanner: vipBanner ?? undefined,
      vipComparison: comparison ? { ...comparison, standardTotal: comparison.visits * comparison.individualPrice, savings: comparison.visits * comparison.individualPrice - comparison.vipPrice } : undefined,
      philosophy: philosophy ?? undefined, experience, valueProps, testimonials, pageSections,
    };
  }

  @Mutation(() => BusinessProfile)
  async upsertProfile(@Args('input') input: ProfileInput, @Context() ctx: any) {
    await this.admin(ctx); this.validateProfile(input);
    const data = { ...input, logoUrl: input.logoUrl || '' };
    return this.prisma.businessProfile.upsert({ where: { key: 'default' }, create: data, update: data });
  }

  @Mutation(() => BusinessContact)
  async upsertContact(@Args('input') input: ContactInput, @Context() ctx: any) {
    await this.admin(ctx);
    this.required(input.address, 'Dirección', 240); this.required(input.city, 'Ciudad', 120);
    this.required(input.instagramUrl, 'Instagram', 500); this.required(input.whatsappPhone, 'WhatsApp', 40);
    this.required(input.mapEmbedUrl, 'Mapa', 2000);
    if (!/^[0-9+\s()-]{6,40}$/.test(input.whatsappPhone)) throw new BadRequestException('WhatsApp inválido');
    this.optionalUrl(input.instagramUrl, 'Instagram'); this.optionalUrl(input.mapEmbedUrl, 'Mapa');
    return this.prisma.businessContact.upsert({ where: { key: 'default' }, create: input, update: input });
  }

  @Mutation(() => BrandAesthetic)
  async upsertBrand(@Args('input') input: BrandInput, @Context() ctx: any) {
    await this.admin(ctx);
    this.required(input.japaneseMark, 'Marca japonesa', 20); this.required(input.eyebrow, 'Eyebrow', 120);
    this.required(input.heroSideText, 'Texto lateral', 240); this.required(input.heroJapanese, 'Texto japonés', 120);
    if (input.accentColors.length > 8 || input.accentColors.some(color => !HEX.test(color))) throw new BadRequestException('Los colores deben tener formato #RRGGBB (máximo 8)');
    const { accentColors, ...brandData } = input;
    const brand = await this.prisma.brandAesthetic.upsert({
      where: { key: 'default' }, create: { ...brandData, accentColors: { create: accentColors.map((hexColor, sortOrder) => ({ hexColor, sortOrder })) } },
      update: brandData,
    });
    await this.prisma.brandAccentColor.deleteMany({ where: { brandId: brand.id } });
    await this.prisma.brandAccentColor.createMany({ data: input.accentColors.map((hexColor, sortOrder) => ({ brandId: brand.id, hexColor, sortOrder })) });
    return this.prisma.brandAesthetic.findUniqueOrThrow({ where: { id: brand.id }, include: { accentColors: { orderBy: { sortOrder: 'asc' } } } });
  }

  @Mutation(() => PageHero)
  async upsertPageHero(@Args('input') input: PageHeroInput, @Context() ctx: any) {
    await this.admin(ctx);
    if (!PAGE_KEYS.includes(input.pageKey)) throw new BadRequestException('Página inválida');
    this.required(input.title, 'Título', 240); this.required(input.description, 'Descripción', 2000);
    this.optionalUrl(input.imageUrl, 'Imagen'); this.optionalUrl(input.ctaHref, 'Enlace del botón');
    const data = { ...input, eyebrow: this.optionalText(input.eyebrow, 120), imageUrl: input.imageUrl || null, ctaLabel: this.optionalText(input.ctaLabel, 80), ctaHref: input.ctaHref || null };
    return this.prisma.pageHero.upsert({ where: { pageKey: input.pageKey }, create: data, update: data });
  }

  @Mutation(() => GalleryHeader)
  async upsertGalleryHeader(@Args('input') input: GalleryHeaderInput, @Context() ctx: any) {
    await this.admin(ctx); this.required(input.title, 'Título', 240); this.required(input.description, 'Descripción', 2000);
    const data = { ...input, watermark: this.optionalText(input.watermark, 80) };
    return this.prisma.galleryHeader.upsert({ where: { key: 'default' }, create: data, update: data });
  }

  @Mutation(() => CourseCta)
  async upsertCourseCta(@Args('input') input: CourseCtaInput, @Context() ctx: any) {
    await this.admin(ctx); this.required(input.title, 'Título', 240); this.required(input.description, 'Descripción', 2000); this.required(input.label, 'Texto del botón', 80);
    this.optionalUrl(input.href, 'Enlace');
    const data = { ...input, href: input.href || null };
    return this.prisma.courseCta.upsert({ where: { key: 'default' }, create: data, update: data });
  }

  @Mutation(() => VipBanner)
  async upsertVipBanner(@Args('input') input: VipBannerInput, @Context() ctx: any) {
    await this.admin(ctx); this.required(input.title, 'Título', 240); this.required(input.description, 'Descripción', 2000); this.required(input.ctaLabel, 'Texto del botón', 80);
    this.optionalUrl(input.href, 'Enlace');
    return this.prisma.vipBanner.upsert({ where: { key: 'default' }, create: input, update: input });
  }

  @Mutation(() => VipComparison)
  async upsertVipComparison(@Args('input') input: VipComparisonInput, @Context() ctx: any) {
    await this.admin(ctx);
    const visits = this.nonNegative(input.visits, 'Visitas'); const individualPrice = this.nonNegative(input.individualPrice, 'Precio individual');
    const vipPrice = this.nonNegative(input.vipPrice, 'Precio VIP');
    if (visits === 0) throw new BadRequestException('Las visitas deben ser mayores a cero');
    if (vipPrice > visits * individualPrice) throw new BadRequestException('El precio VIP no puede superar el total sin membresía');
    const comparison = await this.prisma.vipComparison.upsert({ where: { key: 'default' }, create: { visits, individualPrice, vipPrice }, update: { visits, individualPrice, vipPrice } });
    return { ...comparison, standardTotal: visits * individualPrice, savings: visits * individualPrice - vipPrice };
  }

  @Mutation(() => Philosophy)
  async upsertPhilosophy(@Args('input') input: PhilosophyInput, @Context() ctx: any) {
    await this.admin(ctx); this.validatePhilosophy(input);
    const data = { japaneseTitle: input.japaneseTitle, title: input.title, kicker: input.kicker, quote: input.quote, imageUrl: input.imageUrl || null, imageAlt: this.optionalText(input.imageAlt, 240) };
    const philosophy = await this.prisma.philosophy.upsert({ where: { key: 'default' }, create: data, update: data });
    await this.prisma.$transaction([
      this.prisma.philosophyParagraph.deleteMany({ where: { philosophyId: philosophy.id } }),
      this.prisma.philosophyPillar.deleteMany({ where: { philosophyId: philosophy.id } }),
      this.prisma.philosophyParagraph.createMany({ data: input.paragraphs.map((text, sortOrder) => ({ philosophyId: philosophy.id, text, sortOrder })) }),
      this.prisma.philosophyPillar.createMany({ data: input.pillars.map((pillar, sortOrder) => ({ philosophyId: philosophy.id, label: pillar.label, description: pillar.description, sortOrder })) }),
    ]);
    return this.prisma.philosophy.findUniqueOrThrow({ where: { id: philosophy.id }, include: { paragraphs: { orderBy: { sortOrder: 'asc' } }, pillars: { orderBy: { sortOrder: 'asc' } } } });
  }

  private validateExperience(input: ExperienceInput) { this.required(input.title, 'Título', 120); this.required(input.description, 'Descripción', 1000); this.nonNegative(input.sortOrder, 'Orden'); }
  private validateValue(input: ValuePropositionInput) { this.required(input.title, 'Título', 120); this.required(input.description, 'Descripción', 1000); this.nonNegative(input.sortOrder, 'Orden'); }
  private validateTestimonial(input: TestimonialInput) { this.required(input.author, 'Autor', 120); this.required(input.text, 'Testimonio', 2000); this.nonNegative(input.sortOrder, 'Orden'); }
  private validateSection(input: PageSectionInput) { this.required(input.pageKey, 'Página', 60); this.required(input.sectionKey, 'Sección', 60); this.required(input.title, 'Título', 240); this.nonNegative(input.sortOrder, 'Orden'); }

  @Mutation(() => ExperienceItem) async createExperienceItem(@Args('input') input: ExperienceInput, @Context() ctx: any) { await this.admin(ctx); this.validateExperience(input); return this.prisma.experienceItem.create({ data: { ...input, icon: this.optionalText(input.icon, 20) } }); }
  @Mutation(() => ExperienceItem) async updateExperienceItem(@Args('id') id: string, @Args('input') input: ExperienceInput, @Context() ctx: any) { await this.admin(ctx); this.validateExperience(input); return this.prisma.experienceItem.update({ where: { id }, data: { ...input, icon: this.optionalText(input.icon, 20) } }); }
  @Mutation(() => Boolean) async deleteExperienceItem(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.experienceItem.delete({ where: { id } }); return true; }

  @Mutation(() => ValueProposition) async createValueProposition(@Args('input') input: ValuePropositionInput, @Context() ctx: any) { await this.admin(ctx); this.validateValue(input); return this.prisma.valueProposition.create({ data: { ...input, icon: this.optionalText(input.icon, 20) } }); }
  @Mutation(() => ValueProposition) async updateValueProposition(@Args('id') id: string, @Args('input') input: ValuePropositionInput, @Context() ctx: any) { await this.admin(ctx); this.validateValue(input); return this.prisma.valueProposition.update({ where: { id }, data: { ...input, icon: this.optionalText(input.icon, 20) } }); }
  @Mutation(() => Boolean) async deleteValueProposition(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.valueProposition.delete({ where: { id } }); return true; }

  @Mutation(() => Testimonial) async createTestimonial(@Args('input') input: TestimonialInput, @Context() ctx: any) { await this.admin(ctx); this.validateTestimonial(input); return this.prisma.testimonial.create({ data: { ...input, service: this.optionalText(input.service, 120) } }); }
  @Mutation(() => Testimonial) async updateTestimonial(@Args('id') id: string, @Args('input') input: TestimonialInput, @Context() ctx: any) { await this.admin(ctx); this.validateTestimonial(input); return this.prisma.testimonial.update({ where: { id }, data: { ...input, service: this.optionalText(input.service, 120) } }); }
  @Mutation(() => Boolean) async deleteTestimonial(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.testimonial.delete({ where: { id } }); return true; }

  @Mutation(() => PageSection) async createPageSection(@Args('input') input: PageSectionInput, @Context() ctx: any) { await this.admin(ctx); this.validateSection(input); return this.prisma.pageSection.create({ data: { ...input, japaneseLabel: this.optionalText(input.japaneseLabel, 120), subtitle: this.optionalText(input.subtitle, 2000) } }); }
  @Mutation(() => PageSection) async updatePageSection(@Args('id') id: string, @Args('input') input: PageSectionInput, @Context() ctx: any) { await this.admin(ctx); this.validateSection(input); return this.prisma.pageSection.update({ where: { id }, data: { ...input, japaneseLabel: this.optionalText(input.japaneseLabel, 120), subtitle: this.optionalText(input.subtitle, 2000) } }); }
  @Mutation(() => Boolean) async deletePageSection(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.pageSection.delete({ where: { id } }); return true; }

  @Query(() => [AuditEntry])
  async adminAudit(@Args('take', { type: () => Int, defaultValue: 100 }) take: number, @Context() ctx: any): Promise<AuditEntry[]> {
    await this.admin(ctx);
    if (take < 1 || take > 500) throw new BadRequestException('Cantidad inválida');
    const logs = await this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take, include: { actor: { select: { displayName: true } }, changes: true } });
    return logs.map(log => ({
      id: log.id, action: log.action, entity: log.entity, entityId: log.entityId,
      actorName: log.actor?.displayName, createdAt: log.createdAt,
      changes: (log.changes || []).map((change: any) => ({
        field: change.field, valueType: change.valueType,
        oldValue: change.oldString ?? change.oldInteger?.toString() ?? change.oldDecimal?.toString() ?? (change.oldBoolean == null ? undefined : String(change.oldBoolean)) ?? change.oldTimestamp?.toISOString(),
        newValue: change.newString ?? change.newInteger?.toString() ?? change.newDecimal?.toString() ?? (change.newBoolean == null ? undefined : String(change.newBoolean)) ?? change.newTimestamp?.toISOString(),
      })),
    }));
  }
}
