import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ChecklistItemInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  itemName!: string;

  @IsBoolean()
  passed!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;
}

export class CreateChecklistDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tripId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemInputDto)
  items!: ChecklistItemInputDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  generalObservations?: string;
}
