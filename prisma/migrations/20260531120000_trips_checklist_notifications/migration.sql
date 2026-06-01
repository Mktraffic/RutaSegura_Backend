-- Viajes (Trip): estado de revision mas largo + quien programo el viaje.
ALTER TABLE "TRIP" ADD COLUMN "created_by_user_id" INTEGER;
ALTER TABLE "TRIP" ALTER COLUMN "status" TYPE VARCHAR(30);

-- Checklist preoperacional: el revisor pasa a ser opcional (se asigna al aprobar/rechazar)
-- y se agregan evidencias (foto general del vehiculo, firma digital), geolocalizacion,
-- notas de revision y marcas de tiempo de envio/revision.
ALTER TABLE "CHECKLIST" ALTER COLUMN "reviewed_by_user_id" DROP NOT NULL;
ALTER TABLE "CHECKLIST" ADD COLUMN "review_notes" TEXT;
ALTER TABLE "CHECKLIST" ADD COLUMN "vehicle_photo_key" VARCHAR(300);
ALTER TABLE "CHECKLIST" ADD COLUMN "signature_key" VARCHAR(300);
ALTER TABLE "CHECKLIST" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "CHECKLIST" ADD COLUMN "longitude" DECIMAL(10,7);
ALTER TABLE "CHECKLIST" ADD COLUMN "submitted_at" TIMESTAMP(3);
ALTER TABLE "CHECKLIST" ADD COLUMN "reviewed_at" TIMESTAMP(3);

-- Item del checklist: foto de evidencia (obligatoria cuando el item no pasa).
ALTER TABLE "CHECKLIST_ITEM" ADD COLUMN "file_url" VARCHAR(300);

-- Centro de notificaciones in-app.
CREATE TABLE "NOTIFICATION" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50),
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT,
    "trip_id" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    CONSTRAINT "NOTIFICATION_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NOTIFICATION_user_id_idx" ON "NOTIFICATION"("user_id");
CREATE INDEX "NOTIFICATION_trip_id_idx" ON "NOTIFICATION"("trip_id");

ALTER TABLE "NOTIFICATION" ADD CONSTRAINT "NOTIFICATION_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NOTIFICATION" ADD CONSTRAINT "NOTIFICATION_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "TRIP"("id") ON DELETE SET NULL ON UPDATE CASCADE;
