import { IsBoolean, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMenuOptionDto {
  @IsUUID()
  proveedorId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descripcion!: string;

  @IsBoolean()
  llevaAcompanamiento!: boolean;
}

export class UpdateMenuOptionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descripcion!: string;

  @IsBoolean()
  llevaAcompanamiento!: boolean;
}
