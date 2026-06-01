import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { DriverProfileController } from "./driver-profile.controller";
import { DriversController } from "./drivers.controller";
import { DriversService } from "./drivers.service";

@Module({
  imports: [StorageModule],
  controllers: [DriversController, DriverProfileController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
