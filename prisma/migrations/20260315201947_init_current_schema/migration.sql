-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "PERSON_DOCUMENT" (
    "id" SERIAL NOT NULL,
    "document_number" VARCHAR(20) NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "issue_date" DATE,
    "expiry_date" DATE,
    "file_url" VARCHAR(200),
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PERSON_DOCUMENT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PERSON_DOCUMENT_LINK" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "person_document_id" INTEGER NOT NULL,
    "document_role" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PERSON_DOCUMENT_LINK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GUARDIAN" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "middle_name" VARCHAR(50),
    "first_lastname" VARCHAR(50) NOT NULL,
    "second_lastname" VARCHAR(50),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GUARDIAN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PERSON" (
    "id" SERIAL NOT NULL,
    "guardian_id" INTEGER,
    "first_name" VARCHAR(50) NOT NULL,
    "middle_name" VARCHAR(50),
    "first_lastname" VARCHAR(50) NOT NULL,
    "second_lastname" VARCHAR(50),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PERSON_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROLE" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "ROLE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "USER" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "person_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "status" VARCHAR(20),
    "pickup_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USER_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ADDRESS" (
    "id" SERIAL NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ADDRESS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PERSON_ADDRESS" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "address_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PERSON_ADDRESS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HEADQUARTERS" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address_id" INTEGER NOT NULL,
    "description" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HEADQUARTERS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VEHICLE_DOCUMENT" (
    "id" SERIAL NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_number" VARCHAR(100) NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "file_url" VARCHAR(200),
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VEHICLE_DOCUMENT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VEHICLE" (
    "plate" VARCHAR(20) NOT NULL,
    "passenger_capacity" INTEGER NOT NULL,
    "brand" VARCHAR(50),
    "model" VARCHAR(50),
    "year" INTEGER,
    "status" VARCHAR(20),
    "soat_id" INTEGER,
    "technical_inspection_id" INTEGER,
    "insurance_id" INTEGER,
    "property_card_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VEHICLE_pkey" PRIMARY KEY ("plate")
);

-- CreateTable
CREATE TABLE "ROUTE" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" VARCHAR(20),
    "vehicle_plate" VARCHAR(20),
    "driver_person_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROUTE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STOP" (
    "id" SERIAL NOT NULL,
    "route_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "description" VARCHAR(150),
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "estimated_time" TIME(6) NOT NULL,

    CONSTRAINT "STOP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROUTE_ASSIGNMENT" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "route_id" INTEGER NOT NULL,
    "stop_id" INTEGER NOT NULL,
    "person_address_id" INTEGER NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROUTE_ASSIGNMENT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROUTE_ASSIGNMENT_HEADQUARTERS" (
    "id" SERIAL NOT NULL,
    "route_assignment_id" INTEGER NOT NULL,
    "headquarters_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROUTE_ASSIGNMENT_HEADQUARTERS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TRIP" (
    "id" SERIAL NOT NULL,
    "route_id" INTEGER NOT NULL,
    "vehicle_plate" VARCHAR(20) NOT NULL,
    "driver_person_id" INTEGER NOT NULL,
    "trip_date" DATE NOT NULL,
    "status" VARCHAR(20),
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TRIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CHECKLIST" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "vehicle_plate" VARCHAR(20) NOT NULL,
    "reviewed_by_user_id" INTEGER NOT NULL,
    "status" VARCHAR(20),
    "general_observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CHECKLIST_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CHECKLIST_ITEM" (
    "id" SERIAL NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "observations" TEXT,

    CONSTRAINT "CHECKLIST_ITEM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DOCUMENT_ALERT" (
    "id" SERIAL NOT NULL,
    "vehicle_document_id" INTEGER,
    "vehicle_plate" VARCHAR(20),
    "person_document_id" INTEGER,
    "person_id" INTEGER,
    "alert_type" VARCHAR(50),
    "message" TEXT,
    "document_expiry_date" DATE,
    "days_remaining" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "DOCUMENT_ALERT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VEHICLE_STATUS_HISTORY" (
    "id" SERIAL NOT NULL,
    "vehicle_plate" VARCHAR(20) NOT NULL,
    "previous_status" VARCHAR(20),
    "new_status" VARCHAR(20),
    "reason" TEXT,
    "responsible_user" VARCHAR(100),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VEHICLE_STATUS_HISTORY_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PERSON_DOCUMENT_LINK_person_id_idx" ON "PERSON_DOCUMENT_LINK"("person_id");

-- CreateIndex
CREATE INDEX "PERSON_DOCUMENT_LINK_person_document_id_idx" ON "PERSON_DOCUMENT_LINK"("person_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "PERSON_DOCUMENT_LINK_person_id_person_document_id_key" ON "PERSON_DOCUMENT_LINK"("person_id", "person_document_id");

-- CreateIndex
CREATE INDEX "GUARDIAN_document_id_idx" ON "GUARDIAN"("document_id");

-- CreateIndex
CREATE INDEX "PERSON_guardian_id_idx" ON "PERSON"("guardian_id");

-- CreateIndex
CREATE INDEX "USER_person_id_idx" ON "USER"("person_id");

-- CreateIndex
CREATE INDEX "USER_role_id_idx" ON "USER"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- CreateIndex
CREATE INDEX "PERSON_ADDRESS_person_id_idx" ON "PERSON_ADDRESS"("person_id");

-- CreateIndex
CREATE INDEX "PERSON_ADDRESS_address_id_idx" ON "PERSON_ADDRESS"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "PERSON_ADDRESS_person_id_address_id_key" ON "PERSON_ADDRESS"("person_id", "address_id");

-- CreateIndex
CREATE UNIQUE INDEX "HEADQUARTERS_address_id_key" ON "HEADQUARTERS"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "VEHICLE_soat_id_key" ON "VEHICLE"("soat_id");

-- CreateIndex
CREATE UNIQUE INDEX "VEHICLE_technical_inspection_id_key" ON "VEHICLE"("technical_inspection_id");

-- CreateIndex
CREATE UNIQUE INDEX "VEHICLE_insurance_id_key" ON "VEHICLE"("insurance_id");

-- CreateIndex
CREATE UNIQUE INDEX "VEHICLE_property_card_id_key" ON "VEHICLE"("property_card_id");

-- CreateIndex
CREATE INDEX "ROUTE_vehicle_plate_idx" ON "ROUTE"("vehicle_plate");

-- CreateIndex
CREATE INDEX "ROUTE_driver_person_id_idx" ON "ROUTE"("driver_person_id");

-- CreateIndex
CREATE INDEX "STOP_route_id_idx" ON "STOP"("route_id");

-- CreateIndex
CREATE INDEX "ROUTE_ASSIGNMENT_person_id_idx" ON "ROUTE_ASSIGNMENT"("person_id");

-- CreateIndex
CREATE INDEX "ROUTE_ASSIGNMENT_route_id_idx" ON "ROUTE_ASSIGNMENT"("route_id");

-- CreateIndex
CREATE INDEX "ROUTE_ASSIGNMENT_stop_id_idx" ON "ROUTE_ASSIGNMENT"("stop_id");

-- CreateIndex
CREATE INDEX "ROUTE_ASSIGNMENT_person_address_id_idx" ON "ROUTE_ASSIGNMENT"("person_address_id");

-- CreateIndex
CREATE INDEX "ROUTE_ASSIGNMENT_HEADQUARTERS_route_assignment_id_idx" ON "ROUTE_ASSIGNMENT_HEADQUARTERS"("route_assignment_id");

-- CreateIndex
CREATE INDEX "ROUTE_ASSIGNMENT_HEADQUARTERS_headquarters_id_idx" ON "ROUTE_ASSIGNMENT_HEADQUARTERS"("headquarters_id");

-- CreateIndex
CREATE UNIQUE INDEX "ROUTE_ASSIGNMENT_HEADQUARTERS_route_assignment_id_headquart_key" ON "ROUTE_ASSIGNMENT_HEADQUARTERS"("route_assignment_id", "headquarters_id");

-- CreateIndex
CREATE INDEX "TRIP_route_id_idx" ON "TRIP"("route_id");

-- CreateIndex
CREATE INDEX "TRIP_vehicle_plate_idx" ON "TRIP"("vehicle_plate");

-- CreateIndex
CREATE INDEX "TRIP_driver_person_id_idx" ON "TRIP"("driver_person_id");

-- CreateIndex
CREATE UNIQUE INDEX "CHECKLIST_trip_id_key" ON "CHECKLIST"("trip_id");

-- CreateIndex
CREATE INDEX "CHECKLIST_vehicle_plate_idx" ON "CHECKLIST"("vehicle_plate");

-- CreateIndex
CREATE INDEX "CHECKLIST_reviewed_by_user_id_idx" ON "CHECKLIST"("reviewed_by_user_id");

-- CreateIndex
CREATE INDEX "CHECKLIST_ITEM_checklist_id_idx" ON "CHECKLIST_ITEM"("checklist_id");

-- CreateIndex
CREATE INDEX "DOCUMENT_ALERT_vehicle_document_id_idx" ON "DOCUMENT_ALERT"("vehicle_document_id");

-- CreateIndex
CREATE INDEX "DOCUMENT_ALERT_vehicle_plate_idx" ON "DOCUMENT_ALERT"("vehicle_plate");

-- CreateIndex
CREATE INDEX "DOCUMENT_ALERT_person_document_id_idx" ON "DOCUMENT_ALERT"("person_document_id");

-- CreateIndex
CREATE INDEX "DOCUMENT_ALERT_person_id_idx" ON "DOCUMENT_ALERT"("person_id");

-- CreateIndex
CREATE INDEX "VEHICLE_STATUS_HISTORY_vehicle_plate_idx" ON "VEHICLE_STATUS_HISTORY"("vehicle_plate");

-- AddForeignKey
ALTER TABLE "PERSON_DOCUMENT_LINK" ADD CONSTRAINT "PERSON_DOCUMENT_LINK_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "PERSON"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PERSON_DOCUMENT_LINK" ADD CONSTRAINT "PERSON_DOCUMENT_LINK_person_document_id_fkey" FOREIGN KEY ("person_document_id") REFERENCES "PERSON_DOCUMENT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GUARDIAN" ADD CONSTRAINT "GUARDIAN_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "PERSON_DOCUMENT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PERSON" ADD CONSTRAINT "PERSON_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "GUARDIAN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USER" ADD CONSTRAINT "USER_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "PERSON"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USER" ADD CONSTRAINT "USER_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ROLE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PERSON_ADDRESS" ADD CONSTRAINT "PERSON_ADDRESS_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "PERSON"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PERSON_ADDRESS" ADD CONSTRAINT "PERSON_ADDRESS_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "ADDRESS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HEADQUARTERS" ADD CONSTRAINT "HEADQUARTERS_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "ADDRESS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VEHICLE" ADD CONSTRAINT "VEHICLE_soat_id_fkey" FOREIGN KEY ("soat_id") REFERENCES "VEHICLE_DOCUMENT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VEHICLE" ADD CONSTRAINT "VEHICLE_technical_inspection_id_fkey" FOREIGN KEY ("technical_inspection_id") REFERENCES "VEHICLE_DOCUMENT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VEHICLE" ADD CONSTRAINT "VEHICLE_insurance_id_fkey" FOREIGN KEY ("insurance_id") REFERENCES "VEHICLE_DOCUMENT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VEHICLE" ADD CONSTRAINT "VEHICLE_property_card_id_fkey" FOREIGN KEY ("property_card_id") REFERENCES "VEHICLE_DOCUMENT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE" ADD CONSTRAINT "ROUTE_vehicle_plate_fkey" FOREIGN KEY ("vehicle_plate") REFERENCES "VEHICLE"("plate") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE" ADD CONSTRAINT "ROUTE_driver_person_id_fkey" FOREIGN KEY ("driver_person_id") REFERENCES "PERSON"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STOP" ADD CONSTRAINT "STOP_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "ROUTE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE_ASSIGNMENT" ADD CONSTRAINT "ROUTE_ASSIGNMENT_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "PERSON"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE_ASSIGNMENT" ADD CONSTRAINT "ROUTE_ASSIGNMENT_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "ROUTE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE_ASSIGNMENT" ADD CONSTRAINT "ROUTE_ASSIGNMENT_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "STOP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE_ASSIGNMENT" ADD CONSTRAINT "ROUTE_ASSIGNMENT_person_address_id_fkey" FOREIGN KEY ("person_address_id") REFERENCES "PERSON_ADDRESS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE_ASSIGNMENT_HEADQUARTERS" ADD CONSTRAINT "ROUTE_ASSIGNMENT_HEADQUARTERS_route_assignment_id_fkey" FOREIGN KEY ("route_assignment_id") REFERENCES "ROUTE_ASSIGNMENT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROUTE_ASSIGNMENT_HEADQUARTERS" ADD CONSTRAINT "ROUTE_ASSIGNMENT_HEADQUARTERS_headquarters_id_fkey" FOREIGN KEY ("headquarters_id") REFERENCES "HEADQUARTERS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRIP" ADD CONSTRAINT "TRIP_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "ROUTE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRIP" ADD CONSTRAINT "TRIP_vehicle_plate_fkey" FOREIGN KEY ("vehicle_plate") REFERENCES "VEHICLE"("plate") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRIP" ADD CONSTRAINT "TRIP_driver_person_id_fkey" FOREIGN KEY ("driver_person_id") REFERENCES "PERSON"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHECKLIST" ADD CONSTRAINT "CHECKLIST_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "TRIP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHECKLIST" ADD CONSTRAINT "CHECKLIST_vehicle_plate_fkey" FOREIGN KEY ("vehicle_plate") REFERENCES "VEHICLE"("plate") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHECKLIST" ADD CONSTRAINT "CHECKLIST_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "USER"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHECKLIST_ITEM" ADD CONSTRAINT "CHECKLIST_ITEM_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "CHECKLIST"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DOCUMENT_ALERT" ADD CONSTRAINT "DOCUMENT_ALERT_vehicle_document_id_fkey" FOREIGN KEY ("vehicle_document_id") REFERENCES "VEHICLE_DOCUMENT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DOCUMENT_ALERT" ADD CONSTRAINT "DOCUMENT_ALERT_vehicle_plate_fkey" FOREIGN KEY ("vehicle_plate") REFERENCES "VEHICLE"("plate") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DOCUMENT_ALERT" ADD CONSTRAINT "DOCUMENT_ALERT_person_document_id_fkey" FOREIGN KEY ("person_document_id") REFERENCES "PERSON_DOCUMENT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DOCUMENT_ALERT" ADD CONSTRAINT "DOCUMENT_ALERT_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "PERSON"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VEHICLE_STATUS_HISTORY" ADD CONSTRAINT "VEHICLE_STATUS_HISTORY_vehicle_plate_fkey" FOREIGN KEY ("vehicle_plate") REFERENCES "VEHICLE"("plate") ON DELETE RESTRICT ON UPDATE CASCADE;

