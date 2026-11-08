import { gql } from '@apollo/client';

const PAGE_HERO = `pageKey eyebrow title description imageUrl ctaLabel ctaHref`;
const SITE_CONTENT_SELECTION = `
  profile { name tagline timezone currency logoUrl }
  contact { address city instagramUrl whatsappPhone mapEmbedUrl }
  brand { japaneseMark eyebrow heroSideText heroJapanese accentColors { hexColor sortOrder } }
  homeHero { ${PAGE_HERO} }
  storeHero { ${PAGE_HERO} }
  vipHero { ${PAGE_HERO} }
  galleryHeader { title description watermark }
  courseCta { title description label href }
  vipBanner { title description ctaLabel href }
  vipComparison { visits individualPrice vipPrice standardTotal savings }
  philosophy { japaneseTitle title kicker quote imageUrl imageAlt paragraphs { id text sortOrder } pillars { id label description sortOrder } }
  experience { id title description icon sortOrder isVisible }
  valueProps { id icon title description sortOrder isVisible }
  testimonials { id author service text sortOrder isVisible }
  pageSections { id pageKey sectionKey japaneseLabel title subtitle sortOrder isVisible }
`;

// Public contract: every dynamic public page consumes this query.
export const PUBLIC_SITE = gql`
  query PublicSite {
    siteContent { ${SITE_CONTENT_SELECTION} }
    navigation(position: "HEADER") { id label href sortOrder }
    businessHours { dayOfWeek opensAt closesAt isClosed }
    services { id slug name description price durationMinutes icon badge isFeatured }
    products { id slug name description badge stockQuantity image { url alt } variants { id label price stockQuantity } }
    membershipPlans { id slug name description monthlyPrice compareAtPrice badge isFeatured benefits { id text icon sortOrder } }
    courses { id slug title subtitle description pricePerClass whatsappPhone heroImage { url alt } modules { id title description icon sortOrder } }
    galleryCategories { id slug name sortOrder }
    galleryItems { id title alt categoryId media { url alt } }
  }`;

export const GET_MEDIA_ASSETS = gql`
  query GetMediaAssets {
    media {
      id
      url
      alt
      title
      mimeType
    }
  }
`;

export const ADMIN_SITE_CONTENT = gql`query AdminSiteContent { adminSiteContent { ${SITE_CONTENT_SELECTION} } }`;
export const ADMIN_CATALOG = gql`query AdminCatalog {
  adminCatalog {
    navigation { id label href position sortOrder isVisible }
    hours { id dayOfWeek opensAt closesAt isClosed }
    media { id url alt title mimeType }
    services { id slug name description price durationMinutes icon badge isFeatured status sortOrder }
    products { id slug name description badge status stockQuantity imageId variants { id label price stockQuantity sku } image { url alt } }
    plans { id slug name description monthlyPrice compareAtPrice badge isFeatured status benefits { id text icon sortOrder } }
    courses { id slug title subtitle description pricePerClass whatsappPhone heroImageId status modules { id title description icon sortOrder } heroImage { url alt } }
    categories { id slug name sortOrder }
    gallery { id title alt status sortOrder mediaId categoryId media { url alt } }
    productLeads { id status createdAt customerName phone email notes productName }
    membershipLeads { id status createdAt customerName phone email notes planName }
    courseLeads { id status createdAt customerName phone email notes courseName }
  }
}`;
export const ADMIN_AUDIT = gql`query AdminAudit($take: Int) { adminAudit(take: $take) { id action entity entityId actorName createdAt changes { field valueType oldValue newValue } } }`;
export const ADMIN_LEGACY_KEYS = gql`query LegacySettingKeys { legacySettingKeys }`;

export const AVAILABLE_SLOTS = gql`query AvailableSlots($serviceId: String!, $date: String!) { availableSlots(serviceId: $serviceId, date: $date) { time available } }`;
export const CREATE_BOOKING_CHECKOUT = gql`mutation CreateBookingCheckout($input: CheckoutInput!) { createBookingCheckout(input: $input) { checkoutUrl expiresAt } }`;
export const BOOKING_PAYMENT_STATUS = gql`query BookingPaymentStatus($id: String!) { bookingPaymentStatus(id: $id) { status bookingStatus } }`;
export const CREATE_PRODUCT_RESERVATION = gql`mutation CreateProductReservation($input: ProductReservationInput!) { createProductReservation(input: $input) { id status } }`;
export const CREATE_MEMBERSHIP_LEAD = gql`mutation CreateMembershipLead($input: MembershipLeadInput!) { createMembershipLead(input: $input) { id status } }`;
export const CREATE_COURSE_LEAD = gql`mutation CreateCourseLead($input: CourseLeadInput!) { createCourseLead(input: $input) { id status } }`;
export const ADMIN_LOGIN = gql`mutation AdminLogin($email: String!, $password: String!) { adminLogin(email: $email, password: $password) { accessToken user { id email displayName role } } }`;
export const ADMIN_BOOKINGS = gql`query AdminBookings { bookings { id status scheduledAt paymentStatus depositAmount customerName customerPhone customerEmail serviceName } }`;
export const UPDATE_LEAD_STATUS = gql`mutation UpdateLeadStatus($kind: String!, $id: String!, $status: String!) { updateLeadStatus(kind: $kind, id: $id, status: $status) { id status } }`;
export const UPDATE_BOOKING_STATUS = gql`mutation UpdateBookingStatus($id: String!, $status: String!) { updateBookingStatus(id: $id, status: $status) { id status } }`;

// Admin operations follow the exact server contract and are consumed by the admin client.
export const ADMIN_OPERATIONS = {
  createService: gql`mutation($input: ServiceInput!) { createService(input: $input) { id name } }`,
  updateService: gql`mutation($id: String!, $input: ServiceInput!) { updateService(id: $id, input: $input) { id name } }`,
  updateServiceDuration: gql`mutation($id: String!, $minutes: Int!) { updateServiceDuration(id: $id, minutes: $minutes) { id durationMinutes } }`,
  deleteService: gql`mutation($id: String!) { deleteService(id: $id) }`,
  createProduct: gql`mutation($input: ProductInput!) { createProduct(input: $input) { id name } }`,
  updateProduct: gql`mutation($id: String!, $input: ProductInput!) { updateProduct(id: $id, input: $input) { id name } }`,
  deleteProduct: gql`mutation($id: String!) { deleteProduct(id: $id) }`,
  createMembershipPlan: gql`mutation($input: MembershipPlanInput!) { createMembershipPlan(input: $input) { id name } }`,
  updateMembershipPlan: gql`mutation($id: String!, $input: MembershipPlanInput!) { updateMembershipPlan(id: $id, input: $input) { id name } }`,
  deleteMembershipPlan: gql`mutation($id: String!) { deleteMembershipPlan(id: $id) }`,
  createCourse: gql`mutation($input: CourseInput!) { createCourse(input: $input) { id title } }`,
  updateCourse: gql`mutation($id: String!, $input: CourseInput!) { updateCourse(id: $id, input: $input) { id title } }`,
  deleteCourse: gql`mutation($id: String!) { deleteCourse(id: $id) }`,
  createGalleryCategory: gql`mutation($input: GalleryCategoryInput!) { createGalleryCategory(input: $input) { id name } }`,
  updateGalleryCategory: gql`mutation($id: String!, $input: GalleryCategoryInput!) { updateGalleryCategory(id: $id, input: $input) { id name } }`,
  deleteGalleryCategory: gql`mutation($id: String!) { deleteGalleryCategory(id: $id) }`,
  createGalleryItem: gql`mutation($input: GalleryItemInput!) { createGalleryItem(input: $input) { id title } }`,
  updateGalleryItem: gql`mutation($id: String!, $input: GalleryItemInput!) { updateGalleryItem(id: $id, input: $input) { id title } }`,
  deleteGalleryItem: gql`mutation($id: String!) { deleteGalleryItem(id: $id) }`,
  createNavigationItem: gql`mutation($input: NavigationInput!) { createNavigationItem(input: $input) { id label } }`,
  updateNavigationItem: gql`mutation($id: String!, $input: NavigationInput!) { updateNavigationItem(id: $id, input: $input) { id label } }`,
  deleteNavigationItem: gql`mutation($id: String!) { deleteNavigationItem(id: $id) }`,
  upsertBusinessHour: gql`mutation($input: BusinessHourInput!) { upsertBusinessHour(input: $input) { id dayOfWeek } }`,
  createMediaAsset: gql`mutation($input: MediaInput!) { createMediaAsset(input: $input) { id url } }`,
  updateMediaAsset: gql`mutation($id: String!, $input: MediaInput!) { updateMediaAsset(id: $id, input: $input) { id url } }`,
  deleteMediaAsset: gql`mutation($id: String!) { deleteMediaAsset(id: $id) }`,
  upsertProfile: gql`mutation($input: ProfileInput!) { upsertProfile(input: $input) { name } }`,
  upsertContact: gql`mutation($input: ContactInput!) { upsertContact(input: $input) { address } }`,
  upsertBrand: gql`mutation($input: BrandInput!) { upsertBrand(input: $input) { japaneseMark } }`,
  upsertPageHero: gql`mutation($input: PageHeroInput!) { upsertPageHero(input: $input) { pageKey title } }`,
  upsertGalleryHeader: gql`mutation($input: GalleryHeaderInput!) { upsertGalleryHeader(input: $input) { title } }`,
  upsertCourseCta: gql`mutation($input: CourseCtaInput!) { upsertCourseCta(input: $input) { title } }`,
  upsertVipBanner: gql`mutation($input: VipBannerInput!) { upsertVipBanner(input: $input) { title } }`,
  upsertVipComparison: gql`mutation($input: VipComparisonInput!) { upsertVipComparison(input: $input) { visits individualPrice vipPrice standardTotal savings } }`,
  upsertPhilosophy: gql`mutation($input: PhilosophyInput!) { upsertPhilosophy(input: $input) { title } }`,
  createExperienceItem: gql`mutation($input: ExperienceInput!) { createExperienceItem(input: $input) { id title } }`,
  updateExperienceItem: gql`mutation($id: String!, $input: ExperienceInput!) { updateExperienceItem(id: $id, input: $input) { id title } }`,
  deleteExperienceItem: gql`mutation($id: String!) { deleteExperienceItem(id: $id) }`,
  createValueProposition: gql`mutation($input: ValuePropositionInput!) { createValueProposition(input: $input) { id title } }`,
  updateValueProposition: gql`mutation($id: String!, $input: ValuePropositionInput!) { updateValueProposition(id: $id, input: $input) { id title } }`,
  deleteValueProposition: gql`mutation($id: String!) { deleteValueProposition(id: $id) }`,
  createTestimonial: gql`mutation($input: TestimonialInput!) { createTestimonial(input: $input) { id author } }`,
  updateTestimonial: gql`mutation($id: String!, $input: TestimonialInput!) { updateTestimonial(id: $id, input: $input) { id author } }`,
  deleteTestimonial: gql`mutation($id: String!) { deleteTestimonial(id: $id) }`,
  createPageSection: gql`mutation($input: PageSectionInput!) { createPageSection(input: $input) { id title } }`,
  updatePageSection: gql`mutation($id: String!, $input: PageSectionInput!) { updatePageSection(id: $id, input: $input) { id title } }`,
  deletePageSection: gql`mutation($id: String!) { deletePageSection(id: $id) }`,
};
