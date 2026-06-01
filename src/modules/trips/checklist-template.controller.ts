import { Controller, Get } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { TripsService } from "./trips.service";

// Catálogo de ítems del preoperacional. Lo usan el conductor (al llenar) y los
// gestores (al revisar). Ruta separada para no chocar con /trips/:id.
@Controller("checklist")
@Roles("admin", "coordinator", "coordinador", "driver", "conductor")
export class ChecklistTemplateController {
  constructor(private readonly tripsService: TripsService) {}

  @Get("template")
  async getTemplate() {
    const data = await this.tripsService.getChecklistTemplate();
    return {
      success: true,
      message: "Ítems del checklist preoperacional",
      data,
    };
  }
}
