/*
  Warnings:

  - Added the required column `person_type` to the `PERSON` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ADDRESS" ADD COLUMN     "zone_id" INTEGER;

-- AlterTable
ALTER TABLE "PERSON" ADD COLUMN     "person_type" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "PERSON_ADDRESS" ADD COLUMN     "address_type" VARCHAR(20),
ADD COLUMN     "valid_days" VARCHAR(50);

-- AlterTable
ALTER TABLE "ROUTE" ADD COLUMN     "destination_id" INTEGER,
ADD COLUMN     "origin_description" VARCHAR(200),
ADD COLUMN     "zone_id" INTEGER;

-- CreateTable
CREATE TABLE "ZONE" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZONE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CHECKLIST_TEMPLATE" (
    "id" SERIAL NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20),

    CONSTRAINT "CHECKLIST_TEMPLATE_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ADDRESS_zone_id_idx" ON "ADDRESS"("zone_id");

-- CreateIndex
CREATE INDEX "PERSON_person_type_idx" ON "PERSON"("person_type");

-- CreateIndex
CREATE INDEX "ROUTE_zone_id_idx" ON "ROUTE"("zone_id");

-- CreateIndex
CREATE INDEX "ROUTE_destination_id_idx" ON "ROUTE"("destination_id");

-- AddForeignKey
ALTER TABLE "ADDRESS" ADD CONSTRAINT "ADDRESS_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "ZONE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE" ADD CONSTRAINT "ROUTE_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "ZONE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE" ADD CONSTRAINT "ROUTE_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "HEADQUARTERS"("id") ON DELETE SET NULL ON UPDATE CASCADE;
