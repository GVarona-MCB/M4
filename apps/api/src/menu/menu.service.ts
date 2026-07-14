import { ConflictException, Injectable } from '@nestjs/common';
import type { OpcionPlato } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { businessDayDate } from '../common/time/tz.util';
import { CreateMenuOptionDto, UpdateMenuOptionDto } from './dto/menu-option.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  createOption(dto: CreateMenuOptionDto): Promise<OpcionPlato> {
    return this.prisma.opcionPlato.create({
      data: {
        proveedorId: dto.proveedorId,
        fecha: businessDayDate(),
        descripcion: dto.descripcion,
        llevaAcompanamiento: dto.llevaAcompanamiento,
      },
    });
  }

  async updateOption(id: string, dto: UpdateMenuOptionDto): Promise<OpcionPlato> {
    await this.assertSinPedidos(id);
    return this.prisma.opcionPlato.update({
      where: { id },
      data: { descripcion: dto.descripcion, llevaAcompanamiento: dto.llevaAcompanamiento },
    });
  }

  async deleteOption(id: string): Promise<{ ok: true }> {
    await this.assertSinPedidos(id);
    await this.prisma.opcionPlato.delete({ where: { id } });
    return { ok: true };
  }

  /** Bloquea editar/eliminar una opción con pedidos asociados (FR-012). */
  private async assertSinPedidos(opcionPlatoId: string): Promise<void> {
    const count = await this.prisma.pedido.count({ where: { opcionPlatoId } });
    if (count > 0) {
      throw new ConflictException(
        'No se puede modificar ni eliminar una opción con pedidos asociados',
      );
    }
  }
}
