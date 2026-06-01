import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// Licencia de conduccion del conductor. Documento independiente de la cedula:
// tiene numero, fecha de vencimiento y foto (key del objeto en R2).
export class DriverLicenseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  documentNumber!: string;

  // Fecha de expedición. El vencimiento se calcula a +3 años (servicio público).
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  // Solo se usa como respaldo si no se envía issueDate.
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  fileKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

class DriverDocumentDto {
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
  @IsString()
  @MaxLength(50)
  documentRole?: string;
}

class UpdateDriverDocumentDto {
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
  @IsString()
  @MaxLength(50)
  documentRole?: string;
}

export class CreateDriverDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstLastname!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondLastname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ValidateNested()
  @Type(() => DriverDocumentDto)
  document!: DriverDocumentDto;

  // Licencia de conduccion (opcional al crear; se puede subir luego).
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverLicenseDto)
  license?: DriverLicenseDto;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstLastname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondLastname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDriverDocumentDto)
  document?: UpdateDriverDocumentDto;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
