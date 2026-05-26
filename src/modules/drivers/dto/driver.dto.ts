import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

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

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => DriverDocumentDto)
  documents!: DriverDocumentDto[];
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
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateDriverDocumentDto)
  documents?: UpdateDriverDocumentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
