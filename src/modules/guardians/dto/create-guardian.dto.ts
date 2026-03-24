import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class CreateGuardianDocumentDto {
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
}

export class CreateGuardianDto {
  @ValidateNested()
  @Type(() => CreateGuardianDocumentDto)
  document!: CreateGuardianDocumentDto;

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

  @IsEmail()
  @MaxLength(100)
  email!: string;
}