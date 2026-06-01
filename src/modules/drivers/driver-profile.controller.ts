import { Body, Controller, Get, Patch } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import { DriverLicenseDto } from "./dto/driver.dto";
import { DriversService } from "./drivers.service";

// Portal del conductor: gestiona su propio perfil y su licencia.
// El conductor solo puede ver/editar SUS propios datos (derivados del token).
@Controller("driver/profile")
@Roles("driver", "conductor")
export class DriverProfileController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  async getMyProfile(@CurrentUser() user: RequestUser) {
    const driver = await this.driversService.findOne(user.personId);
    return {
      success: true,
      message: "Tu perfil de conductor",
      data: driver,
    };
  }

  @Patch("license")
  async upsertMyLicense(
    @CurrentUser() user: RequestUser,
    @Body() dto: DriverLicenseDto,
  ) {
    const driver = await this.driversService.upsertLicense(user.personId, dto);
    return {
      success: true,
      message: "Tu licencia se guardo correctamente",
      data: driver,
    };
  }
}
