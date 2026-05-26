import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateTripDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  routeId!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  vehiclePlate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  driverPersonId!: number;

  @IsDateString()
  tripDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;
}
