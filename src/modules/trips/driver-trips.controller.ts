import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import {
  FinishTripDto,
  SubmitChecklistDto,
} from "./dto/trip.dto";
import { TripsService } from "./trips.service";

// Portal del conductor: ve sus viajes, envía el preoperacional e inicia/finaliza.
@Controller("driver/trips")
@Roles("driver", "conductor")
export class DriverTripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findMine(
    @CurrentUser() user: RequestUser,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const trips = await this.tripsService.findMine(user.personId, {
      status: status?.trim() || undefined,
      from: from?.trim() || undefined,
      to: to?.trim() || undefined,
    });
    return {
      success: true,
      message: "Tus viajes",
      data: trips,
    };
  }

  @Get(":id")
  async findOne(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const trip = await this.tripsService.findOneForDriver(id, user.personId);
    return {
      success: true,
      message: "Detalle del viaje",
      data: trip,
    };
  }

  @Post(":id/checklist")
  @HttpCode(HttpStatus.OK)
  async submitChecklist(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SubmitChecklistDto,
  ) {
    const trip = await this.tripsService.submitChecklist(
      id,
      user.personId,
      dto,
    );
    return {
      success: true,
      message: "Preoperacional enviado para revisión",
      data: trip,
    };
  }

  @Patch(":id/start")
  async start(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const trip = await this.tripsService.start(id, user.personId);
    return {
      success: true,
      message: "Viaje iniciado",
      data: trip,
    };
  }

  @Patch(":id/finish")
  async finish(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinishTripDto,
  ) {
    const trip = await this.tripsService.finish(id, user.personId, dto);
    return {
      success: true,
      message: "Viaje finalizado",
      data: trip,
    };
  }
}
