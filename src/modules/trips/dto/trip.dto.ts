import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

// El coordinador programa el viaje. Conductor/vehículo se heredan de la ruta
// si no se especifican.
export class CreateTripDto {
  @IsInt()
  @IsPositive()
  routeId!: number;

  @IsDateString()
  tripDate!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  driverPersonId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}

class ChecklistItemInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  itemName!: string;

  @IsBoolean()
  passed!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;

  // Key del objeto en R2 (foto de evidencia). Obligatoria cuando passed = false.
  @IsOptional()
  @IsString()
  @MaxLength(300)
  fileKey?: string;
}

export class SubmitChecklistDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemInputDto)
  items!: ChecklistItemInputDto[];

  // Foto general del vehículo con la placa visible (evidencia de presencia).
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  vehiclePhotoKey!: string;

  // Firma digital del conductor (imagen).
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  signatureKey!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  generalObservations?: string;
}

export class ReviewTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}

export class FinishTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}

export class CancelTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
