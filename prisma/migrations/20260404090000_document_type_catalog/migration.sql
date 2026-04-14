-- CreateTable
CREATE TABLE "DOCUMENT_TYPE" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "DOCUMENT_TYPE_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DOCUMENT_TYPE_name_key" ON "DOCUMENT_TYPE"("name");

-- Seed base catalog values
INSERT INTO "DOCUMENT_TYPE" ("name") VALUES
  ('Licencia de conduccion'),
  ('Tarjeta de identidad'),
  ('Cedula de ciudadania'),
  ('Pasaporte'),
  ('Cedula de extranjeria')
ON CONFLICT ("name") DO NOTHING;

-- Add new FK column to person documents
ALTER TABLE "PERSON_DOCUMENT"
ADD COLUMN "document_type_id" INTEGER;

-- Add legacy values to catalog (for existing records) before mapping
INSERT INTO "DOCUMENT_TYPE" ("name")
SELECT DISTINCT
  CASE
    WHEN UPPER(TRIM("document_type")) IN ('CC', 'CEDULA', 'CEDULA_DE_CIUDADANIA', 'CEDULA DE CIUDADANIA')
      THEN 'Cedula de ciudadania'
    WHEN UPPER(TRIM("document_type")) IN ('TI', 'TARJETA_IDENTIDAD', 'TARJETA DE IDENTIDAD')
      THEN 'Tarjeta de identidad'
    WHEN UPPER(TRIM("document_type")) IN ('LICENCIA', 'LICENCIA_CONDUCCION', 'LICENCIA DE CONDUCCION')
      THEN 'Licencia de conduccion'
    WHEN UPPER(TRIM("document_type")) IN ('CE', 'CEDULA_EXTRANJERIA', 'CEDULA DE EXTRANJERIA')
      THEN 'Cedula de extranjeria'
    WHEN UPPER(TRIM("document_type")) IN ('PASAPORTE')
      THEN 'Pasaporte'
    ELSE INITCAP(REPLACE(LOWER(TRIM("document_type")), '_', ' '))
  END AS normalized_name
FROM "PERSON_DOCUMENT"
ON CONFLICT ("name") DO NOTHING;

-- Backfill FK values
UPDATE "PERSON_DOCUMENT" pd
SET "document_type_id" = dt."id"
FROM "DOCUMENT_TYPE" dt
WHERE dt."name" = CASE
  WHEN UPPER(TRIM(pd."document_type")) IN ('CC', 'CEDULA', 'CEDULA_DE_CIUDADANIA', 'CEDULA DE CIUDADANIA')
    THEN 'Cedula de ciudadania'
  WHEN UPPER(TRIM(pd."document_type")) IN ('TI', 'TARJETA_IDENTIDAD', 'TARJETA DE IDENTIDAD')
    THEN 'Tarjeta de identidad'
  WHEN UPPER(TRIM(pd."document_type")) IN ('LICENCIA', 'LICENCIA_CONDUCCION', 'LICENCIA DE CONDUCCION')
    THEN 'Licencia de conduccion'
  WHEN UPPER(TRIM(pd."document_type")) IN ('CE', 'CEDULA_EXTRANJERIA', 'CEDULA DE EXTRANJERIA')
    THEN 'Cedula de extranjeria'
  WHEN UPPER(TRIM(pd."document_type")) IN ('PASAPORTE')
    THEN 'Pasaporte'
  ELSE INITCAP(REPLACE(LOWER(TRIM(pd."document_type")), '_', ' '))
END;

-- Enforce integrity
ALTER TABLE "PERSON_DOCUMENT"
ALTER COLUMN "document_type_id" SET NOT NULL;

CREATE INDEX "PERSON_DOCUMENT_document_type_id_idx" ON "PERSON_DOCUMENT"("document_type_id");

ALTER TABLE "PERSON_DOCUMENT"
ADD CONSTRAINT "PERSON_DOCUMENT_document_type_id_fkey"
FOREIGN KEY ("document_type_id") REFERENCES "DOCUMENT_TYPE"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop deprecated column
ALTER TABLE "PERSON_DOCUMENT" DROP COLUMN "document_type";
