import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { businessDayDate } from '../common/time/tz.util';

export interface MenuOptionView {
  id: string;
  descripcion: string;
  llevaAcompanamiento: boolean;
}

export interface MenuProviderGroup {
  proveedorId: string;
  proveedorNombre: string;
  opciones: MenuOptionView[];
}

@Injectable()
export class MenuReadService {
  constructor(private readonly prisma: PrismaService) {}

  /** Menú del día agrupado por proveedor; solo proveedores con al menos una opción (FR-013). */
  async getMenuByDay(fecha: Date = businessDayDate()): Promise<MenuProviderGroup[]> {
    const opciones = await this.prisma.opcionPlato.findMany({
      where: { fecha },
      include: { proveedor: true },
      orderBy: [{ proveedorId: 'asc' }, { descripcion: 'asc' }],
    });

    const groups = new Map<string, MenuProviderGroup>();
    for (const op of opciones) {
      let group = groups.get(op.proveedorId);
      if (!group) {
        group = {
          proveedorId: op.proveedorId,
          proveedorNombre: op.proveedor.nombre,
          opciones: [],
        };
        groups.set(op.proveedorId, group);
      }
      group.opciones.push({
        id: op.id,
        descripcion: op.descripcion,
        llevaAcompanamiento: op.llevaAcompanamiento,
      });
    }
    return [...groups.values()];
  }
}
