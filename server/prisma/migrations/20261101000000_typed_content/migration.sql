-- Replace JSON content documents with typed tables and typed audit changes.
-- The migration is additive until the very end: legacy settings are copied to
-- typed domain tables (and unknown keys to typed quarantine nodes) before the
-- JSON columns are removed.

CREATE TYPE "AuditValueType" AS ENUM ('STRING', 'UUID', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'TIMESTAMP');

CREATE TABLE "BusinessProfile" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "name" TEXT NOT NULL,
  "tagline" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "logoUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessProfile_key_key" ON "BusinessProfile"("key");

CREATE TABLE "BusinessContact" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "instagramUrl" TEXT NOT NULL,
  "whatsappPhone" TEXT NOT NULL,
  "mapEmbedUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessContact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessContact_key_key" ON "BusinessContact"("key");

CREATE TABLE "BrandAesthetic" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "japaneseMark" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL,
  "heroSideText" TEXT NOT NULL,
  "heroJapanese" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BrandAesthetic_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BrandAesthetic_key_key" ON "BrandAesthetic"("key");

CREATE TABLE "BrandAccentColor" (
  "id" UUID NOT NULL,
  "brandId" UUID NOT NULL,
  "hexColor" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BrandAccentColor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BrandAccentColor_brandId_sortOrder_idx" ON "BrandAccentColor"("brandId", "sortOrder");
ALTER TABLE "BrandAccentColor" ADD CONSTRAINT "BrandAccentColor_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandAesthetic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PageHero" (
  "id" UUID NOT NULL,
  "pageKey" TEXT NOT NULL,
  "eyebrow" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT,
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PageHero_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PageHero_pageKey_key" ON "PageHero"("pageKey");

CREATE TABLE "GalleryHeader" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "watermark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GalleryHeader_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GalleryHeader_key_key" ON "GalleryHeader"("key");

CREATE TABLE "CourseCta" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "href" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseCta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CourseCta_key_key" ON "CourseCta"("key");

CREATE TABLE "VipBanner" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ctaLabel" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VipBanner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VipBanner_key_key" ON "VipBanner"("key");

CREATE TABLE "VipComparison" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "visits" INTEGER NOT NULL,
  "individualPrice" INTEGER NOT NULL,
  "vipPrice" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VipComparison_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VipComparison_key_key" ON "VipComparison"("key");

CREATE TABLE "Philosophy" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "japaneseTitle" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "kicker" TEXT NOT NULL,
  "quote" TEXT NOT NULL,
  "imageUrl" TEXT,
  "imageAlt" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Philosophy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Philosophy_key_key" ON "Philosophy"("key");

CREATE TABLE "PhilosophyParagraph" (
  "id" UUID NOT NULL,
  "philosophyId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PhilosophyParagraph_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PhilosophyParagraph_philosophyId_sortOrder_idx" ON "PhilosophyParagraph"("philosophyId", "sortOrder");
ALTER TABLE "PhilosophyParagraph" ADD CONSTRAINT "PhilosophyParagraph_philosophyId_fkey" FOREIGN KEY ("philosophyId") REFERENCES "Philosophy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PhilosophyPillar" (
  "id" UUID NOT NULL,
  "philosophyId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PhilosophyPillar_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PhilosophyPillar_philosophyId_sortOrder_idx" ON "PhilosophyPillar"("philosophyId", "sortOrder");
ALTER TABLE "PhilosophyPillar" ADD CONSTRAINT "PhilosophyPillar_philosophyId_fkey" FOREIGN KEY ("philosophyId") REFERENCES "Philosophy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ExperienceItem" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExperienceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExperienceItem_isVisible_sortOrder_idx" ON "ExperienceItem"("isVisible", "sortOrder");

CREATE TABLE "ValueProposition" (
  "id" UUID NOT NULL,
  "icon" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ValueProposition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ValueProposition_isVisible_sortOrder_idx" ON "ValueProposition"("isVisible", "sortOrder");

CREATE TABLE "Testimonial" (
  "id" UUID NOT NULL,
  "author" TEXT NOT NULL,
  "service" TEXT,
  "text" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Testimonial_isVisible_sortOrder_idx" ON "Testimonial"("isVisible", "sortOrder");

CREATE TABLE "PageSection" (
  "id" UUID NOT NULL,
  "pageKey" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL,
  "japaneseLabel" TEXT,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PageSection_pageKey_sectionKey_key" ON "PageSection"("pageKey", "sectionKey");
CREATE INDEX "PageSection_pageKey_isVisible_sortOrder_idx" ON "PageSection"("pageKey", "isVisible", "sortOrder");

CREATE TABLE "LegacySetting" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegacySetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LegacySetting_key_key" ON "LegacySetting"("key");

CREATE TABLE "LegacySettingNode" (
  "id" UUID NOT NULL,
  "settingId" UUID NOT NULL,
  "path" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "type" "SettingNodeType" NOT NULL,
  "stringValue" TEXT,
  "numberValue" DECIMAL,
  "booleanValue" BOOLEAN,
  CONSTRAINT "LegacySettingNode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LegacySettingNode_settingId_idx" ON "LegacySettingNode"("settingId");
ALTER TABLE "LegacySettingNode" ADD CONSTRAINT "LegacySettingNode_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "LegacySetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AuditChange" (
  "id" UUID NOT NULL,
  "auditLogId" UUID NOT NULL,
  "field" TEXT NOT NULL,
  "valueType" "AuditValueType" NOT NULL,
  "oldString" TEXT,
  "newString" TEXT,
  "oldInteger" BIGINT,
  "newInteger" BIGINT,
  "oldDecimal" DECIMAL(65,30),
  "newDecimal" DECIMAL(65,30),
  "oldBoolean" BOOLEAN,
  "newBoolean" BOOLEAN,
  "oldTimestamp" TIMESTAMP(3),
  "newTimestamp" TIMESTAMP(3),
  CONSTRAINT "AuditChange_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditChange_auditLogId_idx" ON "AuditChange"("auditLogId");
ALTER TABLE "AuditChange" ADD CONSTRAINT "AuditChange_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Backfill typed domain content from the legacy JSON settings.
-- ---------------------------------------------------------------------------

INSERT INTO "BusinessProfile" ("id", "key", "name", "tagline", "timezone", "currency", "logoUrl", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default',
  COALESCE(s."value"->>'name', ''), COALESCE(s."value"->>'tagline', ''),
  COALESCE(s."value"->>'timezone', 'America/Santiago'), COALESCE(s."value"->>'currency', 'CLP'),
  COALESCE(s."value"->>'logoUrl', ''), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'business.profile';

INSERT INTO "BusinessContact" ("id", "key", "address", "city", "instagramUrl", "whatsappPhone", "mapEmbedUrl", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default',
  COALESCE(s."value"->>'address', ''), COALESCE(s."value"->>'city', ''),
  COALESCE(s."value"->>'instagram', ''), COALESCE(s."value"->>'whatsapp', ''),
  COALESCE(s."value"->>'mapEmbedUrl', ''), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'business.contact';

INSERT INTO "BrandAesthetic" ("id", "key", "japaneseMark", "eyebrow", "heroSideText", "heroJapanese", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default',
  COALESCE(s."value"->>'japaneseMark', ''), COALESCE(s."value"->>'eyebrow', ''),
  COALESCE(s."value"->>'heroSideText', ''), COALESCE(s."value"->>'heroJapanese', ''), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'brand.aesthetic';

INSERT INTO "BrandAccentColor" ("id", "brandId", "hexColor", "sortOrder")
SELECT gen_random_uuid(), b."id", color, (ordinality - 1)::int
FROM "BrandAesthetic" b
CROSS JOIN "SiteSetting" s
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(s."value"->'accentColors') = 'array' THEN s."value"->'accentColors' ELSE '[]'::jsonb END
) WITH ORDINALITY AS t(color, ordinality)
WHERE s."key" = 'brand.aesthetic';

INSERT INTO "PageHero" ("id", "pageKey", "eyebrow", "title", "description", "imageUrl", "ctaLabel", "ctaHref", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'HOME', NULL, COALESCE(s."value"->>'title', ''), COALESCE(s."value"->>'description', ''),
  NULLIF(s."value"->>'imageUrl', ''), NULLIF(s."value"->>'ctaLabel', ''), COALESCE(NULLIF(s."value"->>'ctaHref', ''), '#reserva'), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'home.hero';

INSERT INTO "PageHero" ("id", "pageKey", "eyebrow", "title", "description", "imageUrl", "ctaLabel", "ctaHref", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'STORE', NULL, COALESCE(s."value"->>'title', ''), COALESCE(s."value"->>'description', ''),
  NULLIF(s."value"->>'imageUrl', ''), NULL, NULL, now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'store.hero';

INSERT INTO "PageHero" ("id", "pageKey", "eyebrow", "title", "description", "imageUrl", "ctaLabel", "ctaHref", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'VIP', NULLIF(s."value"->>'eyebrow', ''), COALESCE(s."value"->>'title', ''), COALESCE(s."value"->>'description', ''),
  NULLIF(s."value"->>'imageUrl', ''), NULL, NULL, now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'vip.hero';

INSERT INTO "GalleryHeader" ("id", "key", "title", "description", "watermark", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default', COALESCE(s."value"->>'title', ''), COALESCE(s."value"->>'description', ''),
  NULLIF(s."value"->>'watermark', ''), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'gallery.pageHeader';

INSERT INTO "CourseCta" ("id", "key", "title", "description", "label", "href", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default', COALESCE(s."value"->>'title', ''), COALESCE(s."value"->>'description', ''),
  COALESCE(s."value"->>'label', ''), NULLIF(s."value"->>'href', ''), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'course.finalCta';

INSERT INTO "VipBanner" ("id", "key", "title", "description", "ctaLabel", "href", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default', COALESCE(s."value"->>'title', ''), COALESCE(s."value"->>'description', ''),
  COALESCE(s."value"->>'ctaLabel', ''), COALESCE(s."value"->>'href', '/vip'), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'home.vipBanner';

INSERT INTO "VipComparison" ("id", "key", "visits", "individualPrice", "vipPrice", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default',
  GREATEST(COALESCE((s."value"->>'visits')::int, 0), 0),
  GREATEST(COALESCE((s."value"->>'individualPrice')::int, 0), 0),
  GREATEST(COALESCE((s."value"->>'vipPrice')::int, 0), 0), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'vip.comparison';

INSERT INTO "Philosophy" ("id", "key", "japaneseTitle", "title", "kicker", "quote", "imageUrl", "imageAlt", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'default', COALESCE(s."value"->>'japaneseTitle', ''), COALESCE(s."value"->>'title', ''),
  COALESCE(s."value"->>'kicker', ''), COALESCE(s."value"->>'quote', ''),
  NULLIF(s."value"->>'imageUrl', ''), NULLIF(s."value"->>'imageAlt', ''), now(), s."updatedAt"
FROM "SiteSetting" s WHERE s."key" = 'home.philosophy';

INSERT INTO "PhilosophyParagraph" ("id", "philosophyId", "text", "sortOrder")
SELECT gen_random_uuid(), p."id", text, (ordinality - 1)::int
FROM "Philosophy" p
CROSS JOIN "SiteSetting" s
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(s."value"->'paragraphs') = 'array' THEN s."value"->'paragraphs' ELSE '[]'::jsonb END
) WITH ORDINALITY AS t(text, ordinality)
WHERE s."key" = 'home.philosophy';

INSERT INTO "PhilosophyPillar" ("id", "philosophyId", "label", "description", "sortOrder")
SELECT gen_random_uuid(), p."id", COALESCE(item->>'label', ''), COALESCE(item->>'description', ''), (ordinality - 1)::int
FROM "Philosophy" p
CROSS JOIN "SiteSetting" s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s."value"->'pillars') = 'array' THEN s."value"->'pillars' ELSE '[]'::jsonb END
) WITH ORDINALITY AS t(item, ordinality)
WHERE s."key" = 'home.philosophy';

INSERT INTO "ExperienceItem" ("id", "title", "description", "icon", "sortOrder", "isVisible", "createdAt", "updatedAt")
SELECT gen_random_uuid(), COALESCE(item->>'title', ''), COALESCE(item->>'description', ''), NULLIF(item->>'icon', ''),
  (ordinality - 1)::int, true, now(), s."updatedAt"
FROM "SiteSetting" s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s."value") = 'array' THEN s."value" ELSE '[]'::jsonb END
) WITH ORDINALITY AS t(item, ordinality)
WHERE s."key" = 'home.experience';

INSERT INTO "ValueProposition" ("id", "icon", "title", "description", "sortOrder", "isVisible", "createdAt", "updatedAt")
SELECT gen_random_uuid(), NULLIF(item->>'icon', ''), COALESCE(item->>'title', ''), COALESCE(item->>'description', ''),
  (ordinality - 1)::int, true, now(), s."updatedAt"
FROM "SiteSetting" s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s."value") = 'array' THEN s."value" ELSE '[]'::jsonb END
) WITH ORDINALITY AS t(item, ordinality)
WHERE s."key" = 'home.valueProps';

INSERT INTO "Testimonial" ("id", "author", "service", "text", "sortOrder", "isVisible", "createdAt", "updatedAt")
SELECT gen_random_uuid(), COALESCE(item->>'author', ''), NULLIF(item->>'service', ''), COALESCE(item->>'text', ''),
  (ordinality - 1)::int, true, now(), s."updatedAt"
FROM "SiteSetting" s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s."value") = 'array' THEN s."value" ELSE '[]'::jsonb END
) WITH ORDINALITY AS t(item, ordinality)
WHERE s."key" = 'home.testimonials';

-- Section headings that were hardcoded in the pages become editable records.
INSERT INTO "PageSection" ("id", "pageKey", "sectionKey", "japaneseLabel", "title", "subtitle", "sortOrder", "isVisible", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'home', 'philosophy', '哲学', 'FILOSOFÍA DE MARCA', NULL, 0, true, now(), now()),
  (gen_random_uuid(), 'home', 'services', 'サービス', 'SERVICIOS SIGNATURE', NULL, 1, true, now(), now()),
  (gen_random_uuid(), 'home', 'booking', '予約', 'RESERVA TU EXPERIENCIA', NULL, 2, true, now(), now()),
  (gen_random_uuid(), 'home', 'gallery', '作品', 'GALERÍA DE TRABAJOS', NULL, 3, true, now(), now()),
  (gen_random_uuid(), 'home', 'memberships', 'メンバーシップ', 'MEMBRESÍAS', NULL, 4, true, now(), now()),
  (gen_random_uuid(), 'home', 'products', '商品', 'CUIDADO PREMIUM', NULL, 5, true, now(), now()),
  (gen_random_uuid(), 'home', 'experience', '体験', 'EL ESTÁNDAR MANUBARBER', NULL, 6, true, now(), now()),
  (gen_random_uuid(), 'home', 'testimonials', 'お客様の声', 'LA VOZ DEL CLUB', NULL, 7, true, now(), now()),
  (gen_random_uuid(), 'home', 'contact', '場所', 'UBICACIÓN Y CONTACTO', 'Visítanos. Espacios diseñados para el confort, el detalle y la estética masculina.', 8, true, now(), now())
ON CONFLICT ("pageKey", "sectionKey") DO NOTHING;

-- Preserve unmapped settings as typed nodes (no JSON document remains).
INSERT INTO "LegacySetting" ("id", "key", "isPublic", "createdAt")
SELECT gen_random_uuid(), s."key", s."isPublic", now()
FROM "SiteSetting" s
WHERE s."key" NOT IN (
  'business.profile', 'business.contact', 'home.hero', 'home.valueProps', 'home.vipBanner',
  'store.hero', 'vip.hero', 'vip.comparison', 'course.finalCta', 'gallery.pageHeader',
  'brand.aesthetic', 'home.philosophy', 'home.experience', 'home.testimonials'
);

INSERT INTO "LegacySettingNode" ("id", "settingId", "path", "type", "stringValue", "numberValue", "booleanValue")
WITH RECURSIVE nodes(setting_id, path, value) AS (
  SELECT l."id", ARRAY[]::text[], s."value"
  FROM "LegacySetting" l JOIN "SiteSetting" s ON s."key" = l."key"
  UNION ALL
  SELECT n.setting_id, n.path || child.segment, child.value
  FROM nodes n
  CROSS JOIN LATERAL (
    SELECT key AS segment, value FROM jsonb_each(CASE WHEN jsonb_typeof(n.value) = 'object' THEN n.value ELSE '{}'::jsonb END)
    UNION ALL
    SELECT (ordinality - 1)::text, value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(n.value) = 'array' THEN n.value ELSE '[]'::jsonb END) WITH ORDINALITY
  ) child
  WHERE jsonb_typeof(n.value) IN ('object', 'array')
)
SELECT gen_random_uuid(), setting_id, path, upper(jsonb_typeof(value))::"SettingNodeType",
  CASE WHEN jsonb_typeof(value) = 'string' THEN value #>> '{}' END,
  CASE WHEN jsonb_typeof(value) = 'number' THEN (value #>> '{}')::numeric END,
  CASE WHEN jsonb_typeof(value) = 'boolean' THEN (value #>> '{}')::boolean END
FROM nodes;

-- Convert legacy audit snapshots into typed per-field changes.
WITH RECURSIVE leaves AS (
  SELECT a."id" AS log_id, 'old'::text AS side, ARRAY[]::text[] AS path, a."before" AS value
  FROM "AuditLog" a WHERE a."before" IS NOT NULL
  UNION ALL
  SELECT a."id", 'new', ARRAY[]::text[], a."after"
  FROM "AuditLog" a WHERE a."after" IS NOT NULL
  UNION ALL
  SELECT l.log_id, l.side, l.path || child.segment, child.value
  FROM leaves l
  CROSS JOIN LATERAL (
    SELECT key AS segment, value FROM jsonb_each(CASE WHEN jsonb_typeof(l.value) = 'object' THEN l.value ELSE '{}'::jsonb END)
    UNION ALL
    SELECT (ordinality - 1)::text, value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(l.value) = 'array' THEN l.value ELSE '[]'::jsonb END) WITH ORDINALITY
  ) child
  WHERE jsonb_typeof(l.value) IN ('object', 'array')
), flat AS (
  SELECT log_id, side, array_to_string(path, '.') AS field, value, jsonb_typeof(value) AS kind
  FROM leaves
  WHERE jsonb_typeof(value) NOT IN ('object', 'array')
), pairs AS (
  SELECT COALESCE(o.log_id, n.log_id) AS log_id, COALESCE(o.field, n.field) AS field,
    o.value AS old_value, n.value AS new_value, o.kind AS old_kind, n.kind AS new_kind
  FROM (SELECT * FROM flat WHERE side = 'old') o
  FULL OUTER JOIN (SELECT * FROM flat WHERE side = 'new') n ON o.log_id = n.log_id AND o.field = n.field
)
INSERT INTO "AuditChange" ("id", "auditLogId", "field", "valueType", "oldString", "newString", "oldInteger", "newInteger", "oldDecimal", "newDecimal", "oldBoolean", "newBoolean")
SELECT gen_random_uuid(), log_id, field,
  (CASE
    WHEN old_kind IS DISTINCT FROM new_kind THEN 'STRING'
    WHEN COALESCE(new_kind, old_kind) = 'number' AND (COALESCE(new_value, old_value) #>> '{}') ~ '^-?\d+$' THEN 'INTEGER'
    WHEN COALESCE(new_kind, old_kind) = 'number' THEN 'DECIMAL'
    WHEN COALESCE(new_kind, old_kind) = 'boolean' THEN 'BOOLEAN'
    ELSE 'STRING'
  END)::"AuditValueType",
  CASE WHEN old_kind IS DISTINCT FROM new_kind OR old_kind = 'string' THEN old_value #>> '{}' END,
  CASE WHEN old_kind IS DISTINCT FROM new_kind OR new_kind = 'string' THEN new_value #>> '{}' END,
  CASE WHEN old_kind = new_kind AND old_kind = 'number' AND (old_value #>> '{}') ~ '^-?\d+$' THEN (old_value #>> '{}')::bigint END,
  CASE WHEN old_kind = new_kind AND new_kind = 'number' AND (new_value #>> '{}') ~ '^-?\d+$' THEN (new_value #>> '{}')::bigint END,
  CASE WHEN old_kind = new_kind AND old_kind = 'number' AND (old_value #>> '{}') !~ '^-?\d+$' THEN (old_value #>> '{}')::decimal END,
  CASE WHEN old_kind = new_kind AND new_kind = 'number' AND (new_value #>> '{}') !~ '^-?\d+$' THEN (new_value #>> '{}')::decimal END,
  CASE WHEN old_kind = new_kind AND old_kind = 'boolean' THEN (old_value #>> '{}')::boolean END,
  CASE WHEN old_kind = new_kind AND new_kind = 'boolean' THEN (new_value #>> '{}')::boolean END
FROM pairs
WHERE old_value IS DISTINCT FROM new_value;

ALTER TABLE "AuditLog" DROP COLUMN "before", DROP COLUMN "after";

DROP TRIGGER IF EXISTS "SiteSetting_syncNodes" ON "SiteSetting";
DROP FUNCTION IF EXISTS "syncSiteSettingNodes"();
DROP TABLE "SiteSettingNode";
DROP TABLE "SiteSetting";
