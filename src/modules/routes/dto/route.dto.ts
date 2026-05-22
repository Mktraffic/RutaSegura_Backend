import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;

class RouteStopDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stopOrder!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;

  @Type(() => Number)
  @Min(-90)
  latitude!: number;

  @Type(() => Number)
  @Min(-180)
  longitude!: number;

  @IsString()
  @Matches(timeFormat)
  estimatedTime!: string;
}

class CreateRouteAssignmentInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  personAddressId!: number;
}

class RoutePointDto {
  @Type(() => Number)
  @Min(-90)
  latitude!: number;

  @Type(() => Number)
  @Min(-180)
  longitude!: number;
}

export class CreateRouteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(["PICKUP", "DROPOFF"])
  routeType!: "PICKUP" | "DROPOFF";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  zoneId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  destinationId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  originDescription?: string;

  @IsString()
  @Matches(timeFormat)
  startTime!: string;

  @IsString()
  @MaxLength(20)
  vehiclePlate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  driverPersonId!: number;

  @IsOptional()
  @IsString()
  @Matches(timeFormat)
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops?: RouteStopDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRouteAssignmentInputDto)
  assignments?: CreateRouteAssignmentInputDto[];
}

export class CalculateRouteDto {
  @ValidateNested()
  @Type(() => RoutePointDto)
  start!: RoutePointDto;

  @ValidateNested()
  @Type(() => RoutePointDto)
  end!: RoutePointDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  stops?: RoutePointDto[];
}

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(["PICKUP", "DROPOFF"])
  routeType?: "PICKUP" | "DROPOFF";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zoneId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  destinationId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  originDescription?: string;

  @IsOptional()
  @IsString()
  @Matches(timeFormat)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(timeFormat)
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops?: RouteStopDto[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  driverPersonId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}

export class CreateRouteAssignmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  personAddressId!: number;
}

export class UpdateRouteAssignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
