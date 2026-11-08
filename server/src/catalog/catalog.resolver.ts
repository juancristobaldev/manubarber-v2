import { Args, Context, Field, InputType, Int, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

@ObjectType() export class Service { @Field() id!: string; @Field() slug!: string; @Field() name!: string; @Field() description!: string; @Field(() => Int) price!: number; @Field(() => Int, { nullable: true }) durationMinutes?: number | null; @Field(() => String, { nullable: true }) icon?: string | null; @Field(() => String, { nullable: true }) badge?: string | null; @Field() isFeatured!: boolean; @Field() status!: string; @Field(() => Int) sortOrder!: number; }
@InputType() class ServiceInput { @Field() slug!: string; @Field() name!: string; @Field() description!: string; @Field(() => Int) price!: number; @Field(() => Int, { nullable: true }) durationMinutes?: number; @Field(() => String, { nullable: true }) icon?: string | null; @Field(() => String, { nullable: true }) badge?: string | null; @Field(() => Boolean, { defaultValue: false }) isFeatured!: boolean; @Field({ defaultValue: 'DRAFT' }) status!: string; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; }
@ObjectType() export class ProductVariant { @Field() id!: string; @Field() label!: string; @Field(() => Int) price!: number; @Field(() => Int) stockQuantity!: number; @Field(() => String, { nullable: true }) sku?: string | null; }
@InputType() class ProductVariantInput { @Field() label!: string; @Field(() => Int) price!: number; @Field(() => Int, { defaultValue: 0 }) stockQuantity!: number; @Field({ nullable: true }) sku?: string; }
@ObjectType() class CatalogMedia { @Field() id!: string; @Field() url!: string; @Field() alt!: string; }
@ObjectType() export class Product { @Field() id!: string; @Field() slug!: string; @Field() name!: string; @Field(() => String, { nullable: true }) description?: string | null; @Field(() => String, { nullable: true }) badge?: string | null; @Field() status!: string; @Field(() => Int) stockQuantity!: number; @Field(() => [ProductVariant]) variants!: ProductVariant[]; @Field(() => String, { nullable: true }) imageId?: string | null; @Field(() => CatalogMedia, { nullable: true }) image?: CatalogMedia; }
@InputType() class ProductInput { @Field() slug!: string; @Field() name!: string; @Field({ nullable: true }) description?: string; @Field(() => String, { nullable: true }) badge?: string | null; @Field({ defaultValue: 'DRAFT' }) status!: string; @Field(() => Int, { defaultValue: 0 }) stockQuantity!: number; @Field(() => Boolean, { defaultValue: false }) isFeatured!: boolean; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; @Field({ nullable: true }) imageId?: string; @Field(() => [ProductVariantInput]) variants!: ProductVariantInput[]; }
@ObjectType() export class MembershipBenefit { @Field() id!: string; @Field() text!: string; @Field(() => String, { nullable: true }) icon?: string | null; @Field(() => Int) sortOrder!: number; }
@InputType() class MembershipBenefitInput { @Field() text!: string; @Field(() => String, { nullable: true }) icon?: string | null; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; }
@ObjectType() export class MembershipPlan { @Field() id!: string; @Field() slug!: string; @Field() name!: string; @Field() description!: string; @Field(() => Int) monthlyPrice!: number; @Field(() => Int, { nullable: true }) compareAtPrice?: number | null; @Field(() => String, { nullable: true }) badge?: string | null; @Field() isFeatured!: boolean; @Field() status!: string; @Field(() => [MembershipBenefit]) benefits!: MembershipBenefit[]; }
@InputType() class MembershipPlanInput { @Field() slug!: string; @Field() name!: string; @Field() description!: string; @Field(() => Int) monthlyPrice!: number; @Field(() => Int, { nullable: true }) compareAtPrice?: number; @Field(() => String, { nullable: true }) badge?: string | null; @Field(() => Boolean, { defaultValue: false }) isFeatured!: boolean; @Field({ defaultValue: 'DRAFT' }) status!: string; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; @Field(() => [MembershipBenefitInput]) benefits!: MembershipBenefitInput[]; }
@ObjectType() export class CourseModule { @Field() id!: string; @Field() title!: string; @Field() description!: string; @Field(() => String, { nullable: true }) icon?: string | null; @Field(() => Int) sortOrder!: number; }
@InputType() class CourseModuleInput { @Field() title!: string; @Field() description!: string; @Field(() => String, { nullable: true }) icon?: string | null; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; }
@ObjectType() export class Course { @Field() id!: string; @Field() slug!: string; @Field() title!: string; @Field(() => String, { nullable: true }) subtitle?: string | null; @Field() description!: string; @Field(() => Int) pricePerClass!: number; @Field(() => String, { nullable: true }) whatsappPhone?: string | null; @Field(() => String, { nullable: true }) heroImageId?: string | null; @Field(() => CatalogMedia, { nullable: true }) heroImage?: CatalogMedia; @Field() status!: string; @Field(() => [CourseModule]) modules!: CourseModule[]; }
@InputType() class CourseInput { @Field() slug!: string; @Field() title!: string; @Field({ nullable: true }) subtitle?: string; @Field() description!: string; @Field(() => Int) pricePerClass!: number; @Field({ nullable: true }) whatsappPhone?: string; @Field({ nullable: true }) heroImageId?: string; @Field({ defaultValue: 'DRAFT' }) status!: string; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; @Field(() => [CourseModuleInput]) modules!: CourseModuleInput[]; }
@ObjectType() export class GalleryCategory { @Field() id!: string; @Field() slug!: string; @Field() name!: string; @Field(() => Int) sortOrder!: number; }
@ObjectType() export class GalleryItem { @Field() id!: string; @Field() title!: string; @Field() alt!: string; @Field() status!: string; @Field(() => Int) sortOrder!: number; @Field() mediaId!: string; @Field() categoryId!: string; @Field(() => CatalogMedia) media!: CatalogMedia; }
@InputType() class GalleryCategoryInput { @Field() slug!: string; @Field() name!: string; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; }
@InputType() class GalleryItemInput { @Field() title!: string; @Field() alt!: string; @Field() mediaId!: string; @Field() categoryId!: string; @Field({ defaultValue: 'DRAFT' }) status!: string; @Field(() => Int, { defaultValue: 0 }) sortOrder!: number; }

@Resolver()
export class CatalogResolver {
  constructor(private prisma: PrismaService, private auth: AuthService) {}
  private admin(ctx: any) { return this.auth.requireAdmin(ctx.req.headers.authorization); }
  private validateService(input: ServiceInput) { if (!input.name.trim() || !input.slug.trim() || input.price <= 0 || (input.durationMinutes != null && (input.durationMinutes < 1 || input.durationMinutes > 480))) throw new BadRequestException('Precio, nombre o duración de servicio inválidos'); }
  @Query(() => [Service]) services() { return this.prisma.service.findMany({ where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } }); }
  @Query(() => [Product]) products() { return this.prisma.product.findMany({ where: { status: 'PUBLISHED' }, include: { variants: true }, orderBy: { sortOrder: 'asc' } }); }
  @Query(() => [MembershipPlan]) membershipPlans() { return this.prisma.membershipPlan.findMany({ where: { status: 'PUBLISHED' }, include: { benefits: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } }); }
  @Query(() => [Course]) courses() { return this.prisma.course.findMany({ where: { status: 'PUBLISHED' }, include: { modules: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } }); }
  @Query(() => [GalleryCategory]) galleryCategories() { return this.prisma.galleryCategory.findMany({ orderBy: { sortOrder: 'asc' } }); }
  @Query(() => [GalleryItem]) galleryItems(@Args('categorySlug', { nullable: true }) categorySlug?: string) { return this.prisma.galleryItem.findMany({ where: { status: 'PUBLISHED', ...(categorySlug ? { category: { slug: categorySlug } } : {}) }, orderBy: { sortOrder: 'asc' } }); }
  @Mutation(() => Service) async createService(@Args('input') input: ServiceInput, @Context() ctx: any) { await this.admin(ctx); this.validateService(input); return this.prisma.service.create({ data: input as never }); }
  @Mutation(() => Service) async updateService(@Args('id') id: string, @Args('input') input: ServiceInput, @Context() ctx: any) { await this.admin(ctx); this.validateService(input); return this.prisma.service.update({ where: { id }, data: input as never }); }
  @Mutation(() => Service) async updateServiceDuration(@Args('id') id: string, @Args('minutes', { type: () => Int }) minutes: number, @Context() ctx: any) { await this.admin(ctx); if (minutes < 1 || minutes > 480) throw new BadRequestException('Duración inválida'); return this.prisma.service.update({ where: { id }, data: { durationMinutes: minutes } }); }
  @Mutation(() => Boolean) async deleteService(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.service.delete({ where: { id } }); return true; }
  @Mutation(() => Product) async createProduct(@Args('input') input: ProductInput, @Context() ctx: any) { await this.admin(ctx); const { variants, ...data } = input; return this.prisma.product.create({ data: { ...data, variants: { create: variants } } as never, include: { variants: true } }); }
  @Mutation(() => Product) async updateProduct(@Args('id') id: string, @Args('input') input: ProductInput, @Context() ctx: any) { await this.admin(ctx); const { variants, ...data } = input; return this.prisma.$transaction(async tx => { await tx.productVariant.deleteMany({ where: { productId: id } }); return tx.product.update({ where: { id }, data: { ...data, variants: { create: variants } } as never, include: { variants: true } }); }); }
  @Mutation(() => Boolean) async deleteProduct(@Args('id') id: string, @Context() ctx: any) {
    await this.admin(ctx);
    await this.prisma.$transaction(async tx => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
    return true;
  }
  @Mutation(() => MembershipPlan) async createMembershipPlan(@Args('input') input: MembershipPlanInput, @Context() ctx: any) { await this.admin(ctx); const { benefits, ...data } = input; return this.prisma.membershipPlan.create({ data: { ...data, benefits: { create: benefits } } as never, include: { benefits: true } }); }
  @Mutation(() => MembershipPlan) async updateMembershipPlan(@Args('id') id: string, @Args('input') input: MembershipPlanInput, @Context() ctx: any) { await this.admin(ctx); const { benefits, ...data } = input; return this.prisma.$transaction(async tx => { await tx.membershipBenefit.deleteMany({ where: { planId: id } }); return tx.membershipPlan.update({ where: { id }, data: { ...data, benefits: { create: benefits } } as never, include: { benefits: true } }); }); }
  @Mutation(() => Boolean) async deleteMembershipPlan(@Args('id') id: string, @Context() ctx: any) {
    await this.admin(ctx);
    await this.prisma.$transaction(async tx => {
      await tx.membershipBenefit.deleteMany({ where: { planId: id } });
      await tx.membershipPlan.delete({ where: { id } });
    });
    return true;
  }
  @Mutation(() => Course) async createCourse(@Args('input') input: CourseInput, @Context() ctx: any) { await this.admin(ctx); const { modules, ...data } = input; return this.prisma.course.create({ data: { ...data, modules: { create: modules } } as never, include: { modules: true } }); }
  @Mutation(() => Course) async updateCourse(@Args('id') id: string, @Args('input') input: CourseInput, @Context() ctx: any) { await this.admin(ctx); const { modules, ...data } = input; return this.prisma.$transaction(async tx => { await tx.courseModule.deleteMany({ where: { courseId: id } }); return tx.course.update({ where: { id }, data: { ...data, modules: { create: modules } } as never, include: { modules: true } }); }); }
  @Mutation(() => Boolean) async deleteCourse(@Args('id') id: string, @Context() ctx: any) {
    await this.admin(ctx);
    await this.prisma.$transaction(async tx => {
      await tx.courseModule.deleteMany({ where: { courseId: id } });
      await tx.course.delete({ where: { id } });
    });
    return true;
  }
  @Mutation(() => GalleryCategory) async createGalleryCategory(@Args('input') input: GalleryCategoryInput, @Context() ctx: any) { await this.admin(ctx); return this.prisma.galleryCategory.create({ data: input }); }
  @Mutation(() => GalleryCategory) async updateGalleryCategory(@Args('id') id: string, @Args('input') input: GalleryCategoryInput, @Context() ctx: any) { await this.admin(ctx); return this.prisma.galleryCategory.update({ where: { id }, data: input }); }
  @Mutation(() => Boolean) async deleteGalleryCategory(@Args('id') id: string, @Context() ctx: any) {
    await this.admin(ctx);
    const count = await this.prisma.galleryItem.count({ where: { categoryId: id } });
    if (count > 0) throw new BadRequestException('No se puede eliminar una categoría con trabajos asociados');
    await this.prisma.galleryCategory.delete({ where: { id } });
    return true;
  }
  @Mutation(() => GalleryItem) async createGalleryItem(@Args('input') input: GalleryItemInput, @Context() ctx: any) { await this.admin(ctx); return this.prisma.galleryItem.create({ data: input as never }); }
  @Mutation(() => GalleryItem) async updateGalleryItem(@Args('id') id: string, @Args('input') input: GalleryItemInput, @Context() ctx: any) { await this.admin(ctx); return this.prisma.galleryItem.update({ where: { id }, data: input as never }); }
  @Mutation(() => Boolean) async deleteGalleryItem(@Args('id') id: string, @Context() ctx: any) { await this.admin(ctx); await this.prisma.galleryItem.delete({ where: { id } }); return true; }
}

@Resolver(() => Product)
export class ProductFieldsResolver { constructor(private prisma: PrismaService) {} @ResolveField(() => CatalogMedia, { nullable: true }) image(@Parent() product: Product) { return product.imageId ? this.prisma.mediaAsset.findUnique({ where: { id: product.imageId } }) : null; } }
@Resolver(() => Course)
export class CourseFieldsResolver { constructor(private prisma: PrismaService) {} @ResolveField(() => CatalogMedia, { nullable: true }) heroImage(@Parent() course: Course) { return course.heroImageId ? this.prisma.mediaAsset.findUnique({ where: { id: course.heroImageId } }) : null; } }
@Resolver(() => GalleryItem)
export class GalleryFieldsResolver {
  constructor(private prisma: PrismaService) {}
  @ResolveField(() => CatalogMedia)
  async media(@Parent() item: GalleryItem) {
    const asset = item.mediaId ? await this.prisma.mediaAsset.findUnique({ where: { id: item.mediaId } }) : null;
    return asset || { id: item.mediaId, url: '/images/hero.jpg', alt: item.alt || item.title || 'Galería' };
  }
}
