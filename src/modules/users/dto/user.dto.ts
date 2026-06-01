import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateUserDto {
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password!: string;

  // Para conductor/coordinador/admin se envía la persona existente.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId?: number;

  // Para el rol acudiente se envía el acudiente (Guardian); el backend crea/
  // enlaza su persona de login automáticamente.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guardianId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;

  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId?: number;

  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
