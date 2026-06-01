import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { VehiclesModule } from "../vehicles/vehicles.module";
import { DriverRoutesController } from "./driver-routes.controller";
import { GuardianRoutesController } from "./guardian-routes.controller";
import { RoutesController } from "./routes.controller";
import { RoutesService } from "./routes.service";

@Module({
  imports: [PrismaModule, VehiclesModule],
  controllers: [
    RoutesController,
    DriverRoutesController,
    GuardianRoutesController,
  ],
  providers: [RoutesService],
})
export class RoutesModule {}
