import { Injectable, OnModuleDestroy, OnModuleInit, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as argon2 from 'argon2';
import { auditContext } from '../common/audit-context';
import { DatabaseSchema, createDefaultData } from './default-data';

const SKIPPED_MODELS = new Set(['auditLog', 'auditChange', 'legacySetting', 'legacySettingNode']);
const SKIPPED_FIELDS = new Set(['passwordHash', 'flowToken']);

const MODEL_DEFAULTS: Record<string, Record<string, any>> = {
  Booking: { status: 'PENDING', source: 'WEB' },
  Service: { status: 'DRAFT', isFeatured: false, sortOrder: 0, durationMinutes: 60 },
  Product: { status: 'DRAFT', stockQuantity: 0, isFeatured: false, sortOrder: 0 },
  ProductVariant: { stockQuantity: 0 },
  MembershipPlan: { status: 'DRAFT', isFeatured: false, sortOrder: 0 },
  MembershipBenefit: { sortOrder: 0 },
  Course: { status: 'DRAFT', sortOrder: 0 },
  CourseModule: { sortOrder: 0 },
  NavigationItem: { position: 'HEADER', sortOrder: 0, isVisible: true },
  BusinessHour: { isClosed: false },
  ProductReservation: { quantity: 1, status: 'NEW' },
  MembershipLead: { status: 'NEW' },
  CourseLead: { status: 'NEW' },
  User: { role: 'EDITOR', isActive: true },
  ExperienceItem: { sortOrder: 0, isVisible: true },
  ValueProposition: { sortOrder: 0, isVisible: true },
  Testimonial: { sortOrder: 0, isVisible: true },
  PageSection: { sortOrder: 0, isVisible: true },
  GalleryItem: { status: 'DRAFT', sortOrder: 0 },
  GalleryCategory: { sortOrder: 0 },
};

// Helper to deeply clone and convert date strings back to Date objects
function cloneAndRevive<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map((item) => cloneAndRevive(item)) as unknown as T;
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (
        (k.endsWith('At') || k === 'scheduledAt' || k === 'endsAt' || k === 'holdExpiresAt' || k === 'createdAt' || k === 'updatedAt') &&
        typeof v === 'string' &&
        /^\d{4}-\d{2}-\d{2}T/.test(v)
      ) {
        res[k] = new Date(v);
      } else {
        res[k] = cloneAndRevive(v);
      }
    }
    return res as unknown as T;
  }
  return obj;
}

export interface CollectionConfig {
  keyField?: string;
  compoundKeys?: string[][];
  hasTimestamps?: boolean;
}

export class JsonCollection<T extends Record<string, any>> {
  constructor(
    private readonly db: JsonDatabaseService,
    private readonly collectionName: keyof DatabaseSchema,
    private readonly modelName: string,
    private readonly config: CollectionConfig = { keyField: 'id', hasTimestamps: true },
  ) {}

  private get items(): T[] {
    return this.db.data[this.collectionName] as T[];
  }

  private save() {
    this.db.persist();
  }

  private matchCondition(val: any, cond: any, key: string): boolean {
    if (cond === undefined) return true;
    if (cond === null) return val === null;

    if (key.toLowerCase() === 'email' && typeof val === 'string' && typeof cond === 'string') {
      return val.toLowerCase() === cond.toLowerCase();
    }

    if (typeof cond === 'object' && !(cond instanceof Date)) {
      if ('not' in cond) {
        if (this.matchCondition(val, cond.not, key)) return false;
      }
      if ('in' in cond && Array.isArray(cond.in)) {
        if (!cond.in.includes(val)) return false;
      }
      if ('notIn' in cond && Array.isArray(cond.notIn)) {
        if (cond.notIn.includes(val)) return false;
      }
      if ('gt' in cond) {
        const cVal = cond.gt instanceof Date ? cond.gt.getTime() : cond.gt;
        const iVal = val instanceof Date ? val.getTime() : (typeof val === 'string' ? new Date(val).getTime() : val);
        if (!(iVal > cVal)) return false;
      }
      if ('gte' in cond) {
        const cVal = cond.gte instanceof Date ? cond.gte.getTime() : cond.gte;
        const iVal = val instanceof Date ? val.getTime() : (typeof val === 'string' ? new Date(val).getTime() : val);
        if (!(iVal >= cVal)) return false;
      }
      if ('lt' in cond) {
        const cVal = cond.lt instanceof Date ? cond.lt.getTime() : cond.lt;
        const iVal = val instanceof Date ? val.getTime() : (typeof val === 'string' ? new Date(val).getTime() : val);
        if (!(iVal < cVal)) return false;
      }
      if ('lte' in cond) {
        const cVal = cond.lte instanceof Date ? cond.lte.getTime() : cond.lte;
        const iVal = val instanceof Date ? val.getTime() : (typeof val === 'string' ? new Date(val).getTime() : val);
        if (!(iVal <= cVal)) return false;
      }
      return true;
    }

    if (val instanceof Date && cond instanceof Date) {
      return val.getTime() === cond.getTime();
    }
    if (val instanceof Date && typeof cond === 'string') {
      return val.getTime() === new Date(cond).getTime();
    }

    return val === cond;
  }

  private matches(item: T, where: Record<string, any>): boolean {
    if (!where || Object.keys(where).length === 0) return true;

    for (const [key, value] of Object.entries(where)) {
      if (key === 'OR' && Array.isArray(value)) {
        if (!value.some((clause) => this.matches(item, clause))) return false;
        continue;
      }
      if (key === 'AND' && Array.isArray(value)) {
        if (!value.every((clause) => this.matches(item, clause))) return false;
        continue;
      }
      if (key === 'NOT') {
        if (this.matches(item, value)) return false;
        continue;
      }

      // Compound keys support, e.g. productId_label: { productId, label }
      if (key === 'productId_label' && typeof value === 'object') {
        if (item.productId !== value.productId || item.label !== value.label) return false;
        continue;
      }
      if (key === 'pageKey_sectionKey' && typeof value === 'object') {
        if (item.pageKey !== value.pageKey || item.sectionKey !== value.sectionKey) return false;
        continue;
      }

      // Relation filter: category: { slug: categorySlug }
      if (key === 'category' && typeof value === 'object' && 'slug' in value) {
        const cat = this.db.data.galleryCategories.find((c: any) => c.id === (item as any).categoryId);
        if (!cat || cat.slug !== value.slug) return false;
        continue;
      }

      if (!this.matchCondition(item[key], value, key)) return false;
    }
    return true;
  }

  private sort(items: T[], orderBy: any): T[] {
    if (!orderBy) return items;
    const orders = Array.isArray(orderBy) ? orderBy : [orderBy];

    return [...items].sort((a, b) => {
      for (const order of orders) {
        const field = Object.keys(order)[0];
        const dir = order[field] === 'desc' ? -1 : 1;
        let va = a[field];
        let vb = b[field];

        if (va instanceof Date) va = va.getTime();
        if (vb instanceof Date) vb = vb.getTime();

        if (va === vb) continue;
        if (va === undefined || va === null) return 1 * dir;
        if (vb === undefined || vb === null) return -1 * dir;

        if (typeof va === 'string' && typeof vb === 'string') {
          const comp = va.localeCompare(vb);
          if (comp !== 0) return comp * dir;
        } else {
          if (va < vb) return -1 * dir;
          if (va > vb) return 1 * dir;
        }
      }
      return 0;
    });
  }

  private applySelect(item: any, select?: Record<string, boolean>) {
    if (!select || !item) return item;
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(select)) {
      if (v) res[k] = item[k];
    }
    return res;
  }

  private applyInclude(item: any, include?: Record<string, any>) {
    if (!include || !item) return item;
    const populated = { ...item };

    for (const [relation, config] of Object.entries(include)) {
      if (!config) continue;
      const opts = typeof config === 'object' ? config : {};

      switch (`${this.modelName.toLowerCase()}.${relation.toLowerCase()}`) {
        case 'brandaesthetic.accentcolors': {
          let list = this.db.data.brandAccentColors.filter((c: any) => c.brandId === item.id);
          if (opts.orderBy) list = this.db.brandAccentColor.sort(list, opts.orderBy);
          populated.accentColors = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'philosophy.paragraphs': {
          let list = this.db.data.philosophyParagraphs.filter((p: any) => p.philosophyId === item.id);
          if (opts.orderBy) list = this.db.philosophyParagraph.sort(list, opts.orderBy);
          populated.paragraphs = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'philosophy.pillars': {
          let list = this.db.data.philosophyPillars.filter((p: any) => p.philosophyId === item.id);
          if (opts.orderBy) list = this.db.philosophyPillar.sort(list, opts.orderBy);
          populated.pillars = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'product.variants': {
          let list = this.db.data.productVariants.filter((v: any) => v.productId === item.id);
          if (opts.orderBy) list = this.db.productVariant.sort(list, opts.orderBy);
          populated.variants = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'product.image': {
          const m = item.imageId ? this.db.data.mediaAssets.find((a: any) => a.id === item.imageId) : null;
          populated.image = m ? cloneAndRevive(m) : null;
          break;
        }
        case 'membershipplan.benefits': {
          let list = this.db.data.membershipBenefits.filter((b: any) => b.planId === item.id);
          if (opts.orderBy) list = this.db.membershipBenefit.sort(list, opts.orderBy);
          populated.benefits = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'membershipplan.leads': {
          let list = this.db.data.membershipLeads.filter((l: any) => l.planId === item.id);
          populated.leads = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'course.modules': {
          let list = this.db.data.courseModules.filter((m: any) => m.courseId === item.id);
          if (opts.orderBy) list = this.db.courseModule.sort(list, opts.orderBy);
          populated.modules = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'course.heroimage': {
          const m = item.heroImageId ? this.db.data.mediaAssets.find((a: any) => a.id === item.heroImageId) : null;
          populated.heroImage = m ? cloneAndRevive(m) : null;
          break;
        }
        case 'course.leads': {
          let list = this.db.data.courseLeads.filter((l: any) => l.courseId === item.id);
          populated.leads = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        case 'galleryitem.media': {
          const m = item.mediaId ? this.db.data.mediaAssets.find((a: any) => a.id === item.mediaId) : null;
          populated.media = m ? cloneAndRevive(m) : null;
          break;
        }
        case 'galleryitem.category': {
          const c = item.categoryId ? this.db.data.galleryCategories.find((a: any) => a.id === item.categoryId) : null;
          populated.category = c ? cloneAndRevive(c) : null;
          break;
        }
        case 'booking.customer': {
          const c = item.customerId ? this.db.data.customers.find((a: any) => a.id === item.customerId) : null;
          populated.customer = c ? cloneAndRevive(c) : null;
          break;
        }
        case 'booking.service': {
          const s = item.serviceId ? this.db.data.services.find((a: any) => a.id === item.serviceId) : null;
          populated.service = s ? cloneAndRevive(s) : null;
          break;
        }
        case 'productreservation.product': {
          const p = item.productId ? this.db.data.products.find((a: any) => a.id === item.productId) : null;
          populated.product = p ? (opts.select ? this.applySelect(p, opts.select) : cloneAndRevive(p)) : null;
          break;
        }
        case 'membershiplead.plan': {
          const p = item.planId ? this.db.data.membershipPlans.find((a: any) => a.id === item.planId) : null;
          populated.plan = p ? (opts.select ? this.applySelect(p, opts.select) : cloneAndRevive(p)) : null;
          break;
        }
        case 'courselead.course': {
          const c = item.courseId ? this.db.data.courses.find((a: any) => a.id === item.courseId) : null;
          populated.course = c ? (opts.select ? this.applySelect(c, opts.select) : cloneAndRevive(c)) : null;
          break;
        }
        case 'auditlog.actor': {
          const u = item.actorId ? this.db.data.users.find((a: any) => a.id === item.actorId) : null;
          populated.actor = u ? (opts.select ? this.applySelect(u, opts.select) : cloneAndRevive(u)) : null;
          break;
        }
        case 'auditlog.changes': {
          const list = this.db.data.auditChanges.filter((c: any) => c.auditLogId === item.id);
          populated.changes = list.map((x: any) => cloneAndRevive(x));
          break;
        }
        default:
          break;
      }
    }
    return populated;
  }

  async findFirst(args: { where?: any; include?: any; select?: any; orderBy?: any } = {}): Promise<any | null> {
    const list = this.sort(this.items.filter((item) => this.matches(item, args.where || {})), args.orderBy);
    const first = list[0];
    if (!first) return null;
    let res = cloneAndRevive(first);
    if (args.include) res = this.applyInclude(res, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return res;
  }

  async findUnique(args: { where: any; include?: any; select?: any }): Promise<any | null> {
    return this.findFirst({ where: args.where, include: args.include, select: args.select });
  }

  async findUniqueOrThrow(args: { where: any; include?: any; select?: any }): Promise<any> {
    const res = await this.findUnique(args);
    if (!res) throw new NotFoundException(`${this.modelName} no encontrado`);
    return res;
  }

  async findMany(args: { where?: any; include?: any; select?: any; orderBy?: any; take?: number; skip?: number } = {}): Promise<any[]> {
    let list = this.items.filter((item) => this.matches(item, args.where || {}));
    if (args.orderBy) list = this.sort(list, args.orderBy);
    if (typeof args.skip === 'number') list = list.slice(args.skip);
    if (typeof args.take === 'number') list = list.slice(0, args.take);

    return list.map((item) => {
      let res = cloneAndRevive(item);
      if (args.include) res = this.applyInclude(res, args.include);
      if (args.select) res = this.applySelect(res, args.select);
      return res;
    });
  }

  async count(args: { where?: any } = {}): Promise<number> {
    return this.items.filter((item) => this.matches(item, args.where || {})).length;
  }

  async create(args: { data: any; include?: any; select?: any }): Promise<any> {
    const now = new Date();
    const { data } = args;
    const id = data.id || randomUUID();

    // Extract nested creates if any
    const nestedOps: { collection: string; foreignKey: string; items: any[] }[] = [];
    const cleanData: Record<string, any> = { ...data };

    if (this.modelName === 'BrandAesthetic' && data.accentColors?.create) {
      nestedOps.push({ collection: 'brandAccentColors', foreignKey: 'brandId', items: data.accentColors.create });
      delete cleanData.accentColors;
    }
    if (this.modelName === 'Philosophy') {
      if (data.paragraphs?.create) {
        nestedOps.push({ collection: 'philosophyParagraphs', foreignKey: 'philosophyId', items: data.paragraphs.create });
        delete cleanData.paragraphs;
      }
      if (data.pillars?.create) {
        nestedOps.push({ collection: 'philosophyPillars', foreignKey: 'philosophyId', items: data.pillars.create });
        delete cleanData.pillars;
      }
    }
    if (this.modelName === 'Product' && data.variants?.create) {
      nestedOps.push({ collection: 'productVariants', foreignKey: 'productId', items: data.variants.create });
      delete cleanData.variants;
    }
    if (this.modelName === 'MembershipPlan' && data.benefits?.create) {
      nestedOps.push({ collection: 'membershipBenefits', foreignKey: 'planId', items: data.benefits.create });
      delete cleanData.benefits;
    }
    if (this.modelName === 'Course' && data.modules?.create) {
      nestedOps.push({ collection: 'courseModules', foreignKey: 'courseId', items: data.modules.create });
      delete cleanData.modules;
    }

    const defaults = MODEL_DEFAULTS[this.modelName] || {};
    const record: any = {
      ...defaults,
      ...cleanData,
      id,
      createdAt: cleanData.createdAt ? new Date(cleanData.createdAt) : now,
      updatedAt: cleanData.updatedAt ? new Date(cleanData.updatedAt) : now,
    };

    this.items.push(record);

    for (const op of nestedOps) {
      const targetList = this.db.data[op.collection as keyof DatabaseSchema] as any[];
      for (const item of op.items) {
        targetList.push({
          ...item,
          id: item.id || randomUUID(),
          [op.foreignKey]: id,
        });
      }
    }

    this.save();
    this.db.recordAudit('CREATE', this.modelName, id, undefined, record);

    let res = cloneAndRevive(record);
    if (args.include) res = this.applyInclude(res, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return res;
  }

  async createMany(args: { data: any[]; skipDuplicates?: boolean }): Promise<{ count: number }> {
    const now = new Date();
    let count = 0;

    for (const d of args.data) {
      if (args.skipDuplicates) {
        const exists = this.items.some((item) => {
          if (this.config.compoundKeys) {
            for (const cKey of this.config.compoundKeys) {
              const allMatch = cKey.every((k) => d[k] !== undefined && item[k] === d[k]);
              if (allMatch) return true;
            }
          }
          if (d.id && item.id === d.id) return true;
          return false;
        });
        if (exists) continue;
      }

      const defaults = MODEL_DEFAULTS[this.modelName] || {};
      const rec: any = {
        ...defaults,
        ...d,
        id: d.id || randomUUID(),
        createdAt: d.createdAt ? new Date(d.createdAt) : now,
        updatedAt: d.updatedAt ? new Date(d.updatedAt) : now,
      };
      this.items.push(rec);
      count++;
    }

    this.save();
    return { count };
  }

  async update(args: { where: any; data: any; include?: any; select?: any }): Promise<any> {
    const index = this.items.findIndex((item) => this.matches(item, args.where));
    if (index === -1) throw new NotFoundException(`${this.modelName} no encontrado`);

    const existing = this.items[index];
    const before = cloneAndRevive(existing);
    const { data } = args;

    // Handle nested creates during update
    const cleanData: Record<string, any> = { ...data };
    if (this.modelName === 'Product' && data.variants?.create) {
      const vList = this.db.data.productVariants;
      for (const v of data.variants.create) {
        vList.push({ ...v, id: v.id || randomUUID(), productId: existing.id });
      }
      delete cleanData.variants;
    }
    if (this.modelName === 'MembershipPlan' && data.benefits?.create) {
      const bList = this.db.data.membershipBenefits;
      for (const b of data.benefits.create) {
        bList.push({ ...b, id: b.id || randomUUID(), planId: existing.id });
      }
      delete cleanData.benefits;
    }
    if (this.modelName === 'Course' && data.modules?.create) {
      const mList = this.db.data.courseModules;
      for (const m of data.modules.create) {
        mList.push({ ...m, id: m.id || randomUUID(), courseId: existing.id });
      }
      delete cleanData.modules;
    }

    const updated: any = {
      ...existing,
      ...cleanData,
      updatedAt: new Date(),
    };

    this.items[index] = updated;
    this.save();
    this.db.recordAudit('UPDATE', this.modelName, existing.id, before, updated);

    let res = cloneAndRevive(updated);
    if (args.include) res = this.applyInclude(res, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return res;
  }

  async updateMany(args: { where: any; data: any }): Promise<{ count: number }> {
    let count = 0;
    for (let i = 0; i < this.items.length; i++) {
      if (this.matches(this.items[i], args.where)) {
        this.items[i] = {
          ...this.items[i],
          ...args.data,
          updatedAt: new Date(),
        };
        count++;
      }
    }
    if (count > 0) this.save();
    return { count };
  }

  async delete(args: { where: any; include?: any; select?: any }): Promise<any> {
    const index = this.items.findIndex((item) => this.matches(item, args.where));
    if (index === -1) throw new NotFoundException(`${this.modelName} no encontrado`);

    const [removed] = this.items.splice(index, 1);
    this.save();
    this.db.recordAudit('DELETE', this.modelName, removed.id, removed, undefined);

    let res = cloneAndRevive(removed);
    if (args.include) res = this.applyInclude(res, args.include);
    if (args.select) res = this.applySelect(res, args.select);
    return res;
  }

  async deleteMany(args: { where?: any } = {}): Promise<{ count: number }> {
    const initial = this.items.length;
    const remaining = this.items.filter((item) => !this.matches(item, args.where || {}));
    const count = initial - remaining.length;
    (this.db.data as any)[this.collectionName] = remaining;
    if (count > 0) this.save();
    return { count };
  }

  async upsert(args: { where: any; create: any; update: any; include?: any; select?: any }): Promise<any> {
    const existing = await this.findFirst({ where: args.where });
    if (existing) {
      return this.update({ where: args.where, data: args.update, include: args.include, select: args.select });
    } else {
      return this.create({ data: { ...args.where, ...args.create }, include: args.include, select: args.select });
    }
  }
}

@Injectable()
export class JsonDatabaseService implements OnModuleInit, OnModuleDestroy {
  public data!: DatabaseSchema;
  private filePath!: string;

  public user!: JsonCollection<any>;
  public businessProfile!: JsonCollection<any>;
  public businessContact!: JsonCollection<any>;
  public brandAesthetic!: JsonCollection<any>;
  public brandAccentColor!: JsonCollection<any>;
  public pageHero!: JsonCollection<any>;
  public galleryHeader!: JsonCollection<any>;
  public courseCta!: JsonCollection<any>;
  public vipBanner!: JsonCollection<any>;
  public vipComparison!: JsonCollection<any>;
  public philosophy!: JsonCollection<any>;
  public philosophyParagraph!: JsonCollection<any>;
  public philosophyPillar!: JsonCollection<any>;
  public experienceItem!: JsonCollection<any>;
  public valueProposition!: JsonCollection<any>;
  public testimonial!: JsonCollection<any>;
  public pageSection!: JsonCollection<any>;
  public navigationItem!: JsonCollection<any>;
  public businessHour!: JsonCollection<any>;
  public mediaAsset!: JsonCollection<any>;
  public service!: JsonCollection<any>;
  public galleryCategory!: JsonCollection<any>;
  public galleryItem!: JsonCollection<any>;
  public product!: JsonCollection<any>;
  public productVariant!: JsonCollection<any>;
  public membershipPlan!: JsonCollection<any>;
  public membershipBenefit!: JsonCollection<any>;
  public course!: JsonCollection<any>;
  public courseModule!: JsonCollection<any>;
  public customer!: JsonCollection<any>;
  public booking!: JsonCollection<any>;
  public productReservation!: JsonCollection<any>;
  public membershipLead!: JsonCollection<any>;
  public courseLead!: JsonCollection<any>;
  public auditLog!: JsonCollection<any>;
  public auditChange!: JsonCollection<any>;
  public legacySetting!: JsonCollection<any>;
  public legacySettingNode!: JsonCollection<any>;

  constructor() {
    this.initCollections();
    this.loadOrSeed();
  }

  private initCollections() {
    this.user = new JsonCollection(this, 'users', 'User');
    this.businessProfile = new JsonCollection(this, 'businessProfiles', 'BusinessProfile');
    this.businessContact = new JsonCollection(this, 'businessContacts', 'BusinessContact');
    this.brandAesthetic = new JsonCollection(this, 'brandAesthetics', 'BrandAesthetic');
    this.brandAccentColor = new JsonCollection(this, 'brandAccentColors', 'BrandAccentColor', { hasTimestamps: false });
    this.pageHero = new JsonCollection(this, 'pageHeroes', 'PageHero');
    this.galleryHeader = new JsonCollection(this, 'galleryHeaders', 'GalleryHeader');
    this.courseCta = new JsonCollection(this, 'courseCtas', 'CourseCta');
    this.vipBanner = new JsonCollection(this, 'vipBanners', 'VipBanner');
    this.vipComparison = new JsonCollection(this, 'vipComparisons', 'VipComparison');
    this.philosophy = new JsonCollection(this, 'philosophies', 'Philosophy');
    this.philosophyParagraph = new JsonCollection(this, 'philosophyParagraphs', 'PhilosophyParagraph', { hasTimestamps: false });
    this.philosophyPillar = new JsonCollection(this, 'philosophyPillars', 'PhilosophyPillar', { hasTimestamps: false });
    this.experienceItem = new JsonCollection(this, 'experienceItems', 'ExperienceItem');
    this.valueProposition = new JsonCollection(this, 'valuePropositions', 'ValueProposition');
    this.testimonial = new JsonCollection(this, 'testimonials', 'Testimonial');
    this.pageSection = new JsonCollection(this, 'pageSections', 'PageSection', { compoundKeys: [['pageKey', 'sectionKey']] });
    this.navigationItem = new JsonCollection(this, 'navigationItems', 'NavigationItem');
    this.businessHour = new JsonCollection(this, 'businessHours', 'BusinessHour');
    this.mediaAsset = new JsonCollection(this, 'mediaAssets', 'MediaAsset');
    this.service = new JsonCollection(this, 'services', 'Service');
    this.galleryCategory = new JsonCollection(this, 'galleryCategories', 'GalleryCategory');
    this.galleryItem = new JsonCollection(this, 'galleryItems', 'GalleryItem');
    this.product = new JsonCollection(this, 'products', 'Product');
    this.productVariant = new JsonCollection(this, 'productVariants', 'ProductVariant', { compoundKeys: [['productId', 'label']], hasTimestamps: false });
    this.membershipPlan = new JsonCollection(this, 'membershipPlans', 'MembershipPlan');
    this.membershipBenefit = new JsonCollection(this, 'membershipBenefits', 'MembershipBenefit', { hasTimestamps: false });
    this.course = new JsonCollection(this, 'courses', 'Course');
    this.courseModule = new JsonCollection(this, 'courseModules', 'CourseModule', { hasTimestamps: false });
    this.customer = new JsonCollection(this, 'customers', 'Customer');
    this.booking = new JsonCollection(this, 'bookings', 'Booking');
    this.productReservation = new JsonCollection(this, 'productReservations', 'ProductReservation');
    this.membershipLead = new JsonCollection(this, 'membershipLeads', 'MembershipLead');
    this.courseLead = new JsonCollection(this, 'courseLeads', 'CourseLead');
    this.auditLog = new JsonCollection(this, 'auditLogs', 'AuditLog', { hasTimestamps: false });
    this.auditChange = new JsonCollection(this, 'auditChanges', 'AuditChange', { hasTimestamps: false });
    this.legacySetting = new JsonCollection(this, 'legacySettings', 'LegacySetting');
    this.legacySettingNode = new JsonCollection(this, 'legacySettingNodes', 'LegacySettingNode');
  }

  public getDatabasePath(): string {
    if (process.env.JSON_DB_PATH) return process.env.JSON_DB_PATH;
    if (process.env.VERCEL) {
      const tmpPath = '/tmp/db.json';
      if (!existsSync(tmpPath)) {
        try {
          const base = process.cwd().endsWith('/server') ? process.cwd() : join(process.cwd(), 'server');
          const bundled = join(base, 'data', 'db.json');
          if (existsSync(bundled)) {
            const raw = readFileSync(bundled, 'utf8');
            writeFileSync(tmpPath, raw, 'utf8');
          }
        } catch (e) {
          console.warn('No se pudo inicializar /tmp/db.json desde db.json empaquetado:', (e as Error).message);
        }
      }
      return tmpPath;
    }
    const base = process.cwd().endsWith('/server') ? process.cwd() : join(process.cwd(), 'server');
    return join(base, 'data', 'db.json');
  }

  public loadOrSeed() {
    this.filePath = this.getDatabasePath();
    const dir = dirname(this.filePath);
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    } catch {
      // safe fallback for read-only environments
    }

    if (existsSync(this.filePath)) {
      try {
        const raw = readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
        this.ensureCollections();
        return;
      } catch (err) {
        console.warn(`Error al leer ${this.filePath}, regenerando base de datos inicial:`, (err as Error).message);
      }
    }

    // Default password hash: use-a-unique-long-password
    const defaultHash = '$argon2id$v=19$m=65536,t=3,p=4$J8T/uRDGBCpH33Qc2ZDxrQ$fmr4n+2gZRpSztCwzpvYoMiuvt/w2XB/EI5HWiGbuaU';
    const email = process.env.ADMIN_EMAIL || 'admin@manubarber.cl';
    this.data = createDefaultData(defaultHash, email);
    this.persist();
  }

  private ensureCollections() {
    const empty = createDefaultData('', '');
    for (const key of Object.keys(empty) as (keyof DatabaseSchema)[]) {
      if (!this.data[key]) {
        (this.data as any)[key] = [];
      }
    }
  }

  public persist() {
    try {
      const json = JSON.stringify(this.data, null, 2);
      writeFileSync(this.filePath, json, 'utf8');
    } catch (err) {
      console.error(`Error persistiendo base de datos JSON en ${this.filePath}:`, err);
    }
  }

  public recordAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, entityId: string, before?: any, after?: any) {
    const store = auditContext.getStore();
    if (!store?.actorId || SKIPPED_MODELS.has(entity)) return;

    const auditLogId = randomUUID();
    const changes: any[] = [];

    const buildChange = (field: string, oldVal: any, newVal: any) => {
      if (SKIPPED_FIELDS.has(field) || field === 'id' || field === 'updatedAt' || field === 'createdAt') return;
      if (oldVal === undefined && newVal === undefined) return;
      if (oldVal !== undefined && newVal !== undefined && String(oldVal) === String(newVal)) return;

      const change: any = { id: randomUUID(), auditLogId, field };
      const val = newVal !== undefined ? newVal : oldVal;

      if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))) {
        change.valueType = 'TIMESTAMP';
        change.oldTimestamp = oldVal ? new Date(oldVal) : null;
        change.newTimestamp = newVal ? new Date(newVal) : null;
      } else if (typeof val === 'boolean') {
        change.valueType = 'BOOLEAN';
        change.oldBoolean = typeof oldVal === 'boolean' ? oldVal : null;
        change.newBoolean = typeof newVal === 'boolean' ? newVal : null;
      } else if (typeof val === 'number') {
        change.valueType = 'INTEGER';
        change.oldInteger = typeof oldVal === 'number' ? oldVal : null;
        change.newInteger = typeof newVal === 'number' ? newVal : null;
      } else {
        change.valueType = 'STRING';
        change.oldString = oldVal !== undefined && oldVal !== null ? String(oldVal) : null;
        change.newString = newVal !== undefined && newVal !== null ? String(newVal) : null;
      }
      changes.push(change);
    };

    if (before && after) {
      const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
      for (const k of keys) buildChange(k, before[k], after[k]);
    } else if (after) {
      for (const [k, v] of Object.entries(after)) buildChange(k, undefined, v);
    } else if (before) {
      for (const [k, v] of Object.entries(before)) buildChange(k, v, undefined);
    }

    if (changes.length > 0) {
      this.data.auditLogs.push({
        id: auditLogId,
        actorId: store.actorId,
        action,
        entity,
        entityId: String(entityId),
        createdAt: new Date(),
      });
      for (const c of changes) this.data.auditChanges.push(c);
      this.persist();
    }
  }

  private txQueue: Promise<any> = Promise.resolve();

  async $transaction<R>(fnOrArray: ((tx: any) => Promise<R>) | Promise<any>[]): Promise<any> {
    if (typeof fnOrArray === 'function') {
      const run = async () => fnOrArray(this);
      const result = this.txQueue.then(run, run);
      this.txQueue = result.catch(() => {});
      return result;
    }
    return Promise.all(fnOrArray);
  }

  async $executeRaw(..._args: any[]): Promise<number> {
    return 1;
  }

  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}
  async onModuleInit(): Promise<void> {}
  async onModuleDestroy(): Promise<void> {}
}
