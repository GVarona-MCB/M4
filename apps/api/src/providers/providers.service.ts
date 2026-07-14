import { ConflictException, Injectable } from '@nestjs/common';
import type { Proveedor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Proveedor[]> {
    return this.prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
  }

  create(dto: CreateProviderDto): Promise<Proveedor> {
    return this.prisma.proveedor.create({
      data: { nombre: dto.nombre, correoDestino: dto.correoDestino },
    });
  }

  update(id: string, dto: UpdateProviderDto): Promise<Proveedor> {
    return this.prisma.proveedor.update({
      where: { id },
      data: { nombre: dto.nombre, correoDestino: dto.correoDestino },
    });
  }

  /** No se puede eliminar un proveedor con menús o pedidos del día asociados (FR-009). */
  async remove(id: string): Promise<{ ok: true }> {
    const [menus, pedidos] = await Promise.all([
      this.prisma.opcionPlato.count({ where: { proveedorId: id } }),
      this.prisma.pedido.count({ where: { proveedorId: id } }),
    ]);
    if (menus > 0 || pedidos > 0) {
      throw new ConflictException(
        'No se puede eliminar un proveedor con menús o pedidos del día asociados',
      );
    }
    await this.prisma.proveedor.delete({ where: { id } });
    return { ok: true };
  }
}
