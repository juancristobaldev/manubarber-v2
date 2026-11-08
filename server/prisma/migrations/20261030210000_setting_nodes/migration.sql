-- Expand only: legacy values remain authoritative until all writers migrate.
CREATE TYPE "SettingNodeType" AS ENUM ('OBJECT', 'ARRAY', 'STRING', 'NUMBER', 'BOOLEAN', 'NULL');

CREATE TABLE "SiteSettingNode" (
  "settingId" UUID NOT NULL,
  "path" TEXT[] NOT NULL,
  "type" "SettingNodeType" NOT NULL,
  "stringValue" TEXT,
  "numberValue" DECIMAL,
  "booleanValue" BOOLEAN,
  CONSTRAINT "SiteSettingNode_pkey" PRIMARY KEY ("settingId", "path"),
  CONSTRAINT "SiteSettingNode_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "SiteSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteSettingNode_value_check" CHECK (
    ("type" = 'STRING' AND "stringValue" IS NOT NULL AND "numberValue" IS NULL AND "booleanValue" IS NULL) OR
    ("type" = 'NUMBER' AND "stringValue" IS NULL AND "numberValue" IS NOT NULL AND "booleanValue" IS NULL) OR
    ("type" = 'BOOLEAN' AND "stringValue" IS NULL AND "numberValue" IS NULL AND "booleanValue" IS NOT NULL) OR
    ("type" IN ('OBJECT', 'ARRAY', 'NULL') AND "stringValue" IS NULL AND "numberValue" IS NULL AND "booleanValue" IS NULL)
  )
);

CREATE FUNCTION "syncSiteSettingNodes"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM "SiteSettingNode" WHERE "settingId" = NEW.id;
  INSERT INTO "SiteSettingNode" ("settingId", "path", "type", "stringValue", "numberValue", "booleanValue")
  WITH RECURSIVE nodes(path, value) AS (
    SELECT ARRAY[]::text[], NEW.value
    UNION ALL
    SELECT nodes.path || child.segment, child.value
    FROM nodes
    CROSS JOIN LATERAL (
      SELECT key AS segment, value FROM jsonb_each(CASE WHEN jsonb_typeof(nodes.value) = 'object' THEN nodes.value ELSE '{}'::jsonb END)
      UNION ALL
      SELECT (ordinality - 1)::text, value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(nodes.value) = 'array' THEN nodes.value ELSE '[]'::jsonb END) WITH ORDINALITY
    ) child
  )
  SELECT NEW.id, path, upper(jsonb_typeof(value))::"SettingNodeType",
    CASE WHEN jsonb_typeof(value) = 'string' THEN value #>> '{}' END,
    CASE WHEN jsonb_typeof(value) = 'number' THEN (value #>> '{}')::numeric END,
    CASE WHEN jsonb_typeof(value) = 'boolean' THEN (value #>> '{}')::boolean END
  FROM nodes;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "SiteSetting_syncNodes" AFTER INSERT OR UPDATE OF value ON "SiteSetting"
FOR EACH ROW EXECUTE FUNCTION "syncSiteSettingNodes"();

-- Trigger backfills every existing row in the same migration transaction.
UPDATE "SiteSetting" SET value = value;
