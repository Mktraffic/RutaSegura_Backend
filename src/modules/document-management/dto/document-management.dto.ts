import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateDocumentTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;
}

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;
}

export class CreatePersonDocumentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  documentType!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  documentNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentRole?: string;
}

export class UpdatePersonDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}

export class CreateVehicleDocumentDto {
  @IsString()
  @MaxLength(20)
  vehiclePlate!: string;

  @IsString()
  @IsIn(["SOAT", "TECHNICAL_INSPECTION", "INSURANCE", "PROPERTY_CARD"])
  documentType!: "SOAT" | "TECHNICAL_INSPECTION" | "INSURANCE" | "PROPERTY_CARD";

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

export class UpdateVehicleDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  documentNumber?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}

export class AlertQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  daysAhead?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;
}
