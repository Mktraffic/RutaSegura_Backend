import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class VehicleDocumentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  documentNumber!: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileUrl?: string;
}

class CreateVehicleDocumentsDto {
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  soat!: VehicleDocumentDto;

  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  technicalInspection!: VehicleDocumentDto;

  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  insurance!: VehicleDocumentDto;

  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  propertyCard!: VehicleDocumentDto;
}

class UpdateVehicleDocumentsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  soat?: VehicleDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  technicalInspection?: VehicleDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  insurance?: VehicleDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDocumentDto)
  propertyCard?: VehicleDocumentDto;
}

export class CreateVehicleDto {
  @IsString()
  @MaxLength(20)
  plate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengerCapacity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year?: number;

  @ValidateNested()
  @Type(() => CreateVehicleDocumentsDto)
  documents!: CreateVehicleDocumentsDto;
}

export class UpdateVehicleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengerCapacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVehicleDocumentsDto)
  documents?: UpdateVehicleDocumentsDto;
}