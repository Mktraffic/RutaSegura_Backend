import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  AlertQueryDto,
  CreateDocumentTypeDto,
  CreatePersonDocumentDto,
  CreateVehicleDocumentDto,
  UpdateDocumentTypeDto,
  UpdatePersonDocumentDto,
  UpdateVehicleDocumentDto,
} from "./dto/document-management.dto";
import { DocumentManagementService } from "./document-management.service";

@Controller("documents")
@Roles("admin", "coordinator", "coordinador")
export class DocumentManagementController {
  constructor(private readonly documentService: DocumentManagementService) {}

  @Get("catalog/person-document-types")
  async findDocumentTypes(@Query("q") q?: string) {
    const data = await this.documentService.findDocumentTypes(q?.trim());
    return {
      success: true,
      message: "Listado de tipos de documento",
      data,
    };
  }

  @Post("catalog/person-document-types")
  @HttpCode(HttpStatus.CREATED)
  async createDocumentType(@Body() dto: CreateDocumentTypeDto) {
    const data = await this.documentService.createDocumentType(dto);
    return {
      success: true,
      message: "Tipo de documento creado correctamente",
      data,
    };
  }

  @Patch("catalog/person-document-types/:id")
  async updateDocumentType(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentTypeDto,
  ) {
    const data = await this.documentService.updateDocumentType(id, dto);
    return {
      success: true,
      message: "Tipo de documento actualizado correctamente",
      data,
    };
  }

  @Post("person")
  @HttpCode(HttpStatus.CREATED)
  async createPersonDocument(@Body() dto: CreatePersonDocumentDto) {
    const data = await this.documentService.createPersonDocument(dto);
    return {
      success: true,
      message: "Documento de persona creado correctamente",
      data,
    };
  }

  @Get("person")
  async findPersonDocuments(@Query("q") q?: string) {
    const data = await this.documentService.findPersonDocuments(q?.trim());
    return {
      success: true,
      message: "Listado de documentos de persona",
      data,
    };
  }

  @Patch("person/:id")
  async updatePersonDocument(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDocumentDto,
  ) {
    const data = await this.documentService.updatePersonDocument(id, dto);
    return {
      success: true,
      message: "Documento de persona actualizado correctamente",
      data,
    };
  }

  @Delete("person/:id")
  async inactivatePersonDocument(@Param("id", ParseIntPipe) id: number) {
    const data = await this.documentService.inactivatePersonDocument(id);
    return {
      success: true,
      message: "Documento de persona inactivado correctamente",
      data,
    };
  }

  @Post("vehicle")
  @HttpCode(HttpStatus.CREATED)
  async createVehicleDocument(@Body() dto: CreateVehicleDocumentDto) {
    const data = await this.documentService.createVehicleDocument(dto);
    return {
      success: true,
      message: "Documento de vehiculo creado correctamente",
      data,
    };
  }

  @Get("vehicle")
  async findVehicleDocuments(@Query("q") q?: string) {
    const data = await this.documentService.findVehicleDocuments(q?.trim());
    return {
      success: true,
      message: "Listado de documentos de vehiculo",
      data,
    };
  }

  @Patch("vehicle/:id")
  async updateVehicleDocument(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDocumentDto,
  ) {
    const data = await this.documentService.updateVehicleDocument(id, dto);
    return {
      success: true,
      message: "Documento de vehiculo actualizado correctamente",
      data,
    };
  }

  @Delete("vehicle/:id")
  async inactivateVehicleDocument(@Param("id", ParseIntPipe) id: number) {
    const data = await this.documentService.inactivateVehicleDocument(id);
    return {
      success: true,
      message: "Documento de vehiculo inactivado correctamente",
      data,
    };
  }

  @Post("alerts/generate-expiry")
  async generateExpiryAlerts(@Query("daysAhead") daysAhead?: string) {
    const parsed = daysAhead ? Number(daysAhead) : undefined;
    const data = await this.documentService.generateExpiryAlerts(
      Number.isFinite(parsed) && parsed! > 0 ? parsed : 30,
    );
    return {
      success: true,
      message: "Alertas de vencimiento generadas correctamente",
      data,
    };
  }

  @Get("alerts")
  async findAlerts(@Query() query: AlertQueryDto) {
    const data = await this.documentService.findAlerts(query);
    return {
      success: true,
      message: "Listado de alertas documentales",
      data,
    };
  }

  @Patch("alerts/:id/read")
  async markAlertAsRead(@Param("id", ParseIntPipe) id: number) {
    const data = await this.documentService.markAlertAsRead(id);
    return {
      success: true,
      message: "Alerta marcada como leida",
      data,
    };
  }
}
