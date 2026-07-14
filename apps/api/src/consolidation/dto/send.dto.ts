import { IsUUID } from 'class-validator';

export class SendDto {
  @IsUUID()
  proveedorId!: string;
}
