import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { PresignUploadDto } from "./dto/storage.dto";
import { StorageService } from "./storage.service";

// Carga/descarga de archivos a R2 mediante URLs prefirmadas.
// Disponible para los roles que adjuntan archivos: gestores y conductores.
@Controller("files")
@Roles("admin", "coordinator", "coordinador", "driver", "conductor")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("presign-upload")
  @HttpCode(HttpStatus.OK)
  async presignUpload(@Body() dto: PresignUploadDto) {
    const data = await this.storageService.createUploadUrl(dto);
    return {
      success: true,
      message: "URL de carga generada",
      data,
    };
  }

  @Get("presign-download")
  async presignDownload(@Query("key") key?: string) {
    if (!key) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo acceder al archivo",
        errors: ["Debes indicar la referencia (key) del archivo"],
      });
    }
    const data = await this.storageService.createDownloadUrl(key);
    return {
      success: true,
      message: "URL de descarga generada",
      data,
    };
  }
}
