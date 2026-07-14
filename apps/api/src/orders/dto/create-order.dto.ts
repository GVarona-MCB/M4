import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrderDto {
  @IsUUID()
  opcionPlatoId!: string;

  // Acompañamiento: texto libre, trim, ≤100. La obligatoriedad (si el plato lo requiere)
  // se valida en el servicio (FR-016).
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  acompanamiento?: string;
}
