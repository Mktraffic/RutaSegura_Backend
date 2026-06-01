-- Ubicación en vivo del bus durante el viaje (rastreo para acudientes).
ALTER TABLE "TRIP" ADD COLUMN "current_latitude" DECIMAL(10,7);
ALTER TABLE "TRIP" ADD COLUMN "current_longitude" DECIMAL(10,7);
ALTER TABLE "TRIP" ADD COLUMN "location_updated_at" TIMESTAMP(3);
