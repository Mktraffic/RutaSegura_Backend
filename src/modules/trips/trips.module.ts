import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../storage/storage.module";
import { VehiclesModule } from "../vehicles/vehicles.module";
import { ChecklistTemplateController } from "./checklist-template.controller";
import { DriverTripsController } from "./driver-trips.controller";
import { GuardianTripsController } from "./guardian-trips.controller";
import { TripsController } from "./trips.controller";
import { TripsService } from "./trips.service";

@Module({
  imports: [VehiclesModule, StorageModule, NotificationsModule],
  controllers: [
    TripsController,
    DriverTripsController,
    GuardianTripsController,
    ChecklistTemplateController,
  ],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
