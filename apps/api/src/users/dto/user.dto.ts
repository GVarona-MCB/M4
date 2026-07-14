import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsEnum(Rol)
  rol!: Rol;

  @IsString()
  @MinLength(6) // longitud mínima de contraseña (FR-030)
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class SetActiveDto {
  @IsBoolean()
  activo!: boolean;
}
