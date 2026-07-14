import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsEmail()
  correoDestino!: string;
}

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsEmail()
  correoDestino?: string;
}
