import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { STORAGE_FOLDERS } from "../storage.service";

export class PresignUploadDto {
  @IsString()
  @IsIn(STORAGE_FOLDERS as unknown as string[])
  folder!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  filename!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  contentType!: string;
}
