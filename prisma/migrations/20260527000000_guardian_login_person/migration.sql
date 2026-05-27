-- Vincula un acudiente (GUARDIAN) con la persona de login (personType = GUARDIAN)
-- cuando tiene acceso al sistema. Null si es solo un dato de contacto.

-- AlterTable
ALTER TABLE "GUARDIAN" ADD COLUMN "person_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "GUARDIAN_person_id_key" ON "GUARDIAN"("person_id");

-- AddForeignKey
ALTER TABLE "GUARDIAN" ADD CONSTRAINT "GUARDIAN_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "PERSON"("id") ON DELETE SET NULL ON UPDATE CASCADE;
