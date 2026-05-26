import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentManagementModule } from "./modules/document-management/document-management.module";
import { DriversModule } from "./modules/drivers/drivers.module";
import { GuardiansModule } from "./modules/guardians/guardians.module";
import { RoutesModule } from "./modules/routes/routes.module";
import { StudentsModule } from "./modules/students/students.module";
import { UsersModule } from "./modules/users/users.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DocumentManagementModule,
    DriversModule,
    GuardiansModule,
    RoutesModule,
    StudentsModule,
    UsersModule,
    VehiclesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
