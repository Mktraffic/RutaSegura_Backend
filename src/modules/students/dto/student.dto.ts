import {
  ArrayMinSize,
  IsBoolean,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class StudentDocumentDto {
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
  @IsBoolean()
  createPersonDocumentLink?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentRole?: string;
}

class StudentAddressDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address!: string;

  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  longitude!: number;
}

export class CreateStudentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guardianId!: number;

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

  @ValidateNested()
  @Type(() => StudentDocumentDto)
  document!: StudentDocumentDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAddressDto)
  addresses!: StudentAddressDto[];
}

export class UpdateStudentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guardianId?: number;

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
  @Type(() => StudentDocumentDto)
  document?: StudentDocumentDto;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAddressDto)
  addresses?: StudentAddressDto[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}