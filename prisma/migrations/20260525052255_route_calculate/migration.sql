-- AlterTable
ALTER TABLE "ROUTE" ADD COLUMN     "route_calculated_at" TIMESTAMP(3),
ADD COLUMN     "route_distance" DOUBLE PRECISION,
ADD COLUMN     "route_duration" INTEGER,
ADD COLUMN     "route_geometry" JSONB,
ADD COLUMN     "route_waypoints" JSONB;
