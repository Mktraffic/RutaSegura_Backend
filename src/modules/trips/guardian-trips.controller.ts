import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import { TripsService } from "./trips.service";

// Portal del acudiente: rastreo en vivo del bus de sus hijos.
@Controller("guardian/trips")
@Roles("guardian", "acudiente")
export class GuardianTripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get("active")
  async findActive(@CurrentUser() user: RequestUser) {
    const data = await this.tripsService.findActiveTripsForGuardian(
      user.personId,
    );
    return {
      success: true,
      message: "Viajes en curso de tus hijos",
      data,
    };
  }
}
