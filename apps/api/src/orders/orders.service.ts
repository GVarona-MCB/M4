import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Pedido } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { businessDayDate, isAfterCutoff, isWeekend } from '../common/time/tz.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ventana en la que el empleado puede cargar/editar/anular su propio pedido (FR-019, FR-024, FR-025). */
  private assertEmployeeWindow(): void {
    if (isWeekend()) {
      throw new ConflictException('No se pueden cargar pedidos los sábados ni domingos');
    }
    if (isAfterCutoff()) {
      throw new ConflictException('El horario de pedidos cerró (13:00 hs)');
    }
  }

  /** Valida el acompañamiento según si el plato lo requiere (FR-016). */
  private resolveAcompanamiento(requiere: boolean, value?: string): string | null {
    if (!requiere) return null;
    const v = (value ?? '').trim();
    if (!v) {
      throw new UnprocessableEntityException('Este plato requiere indicar el acompañamiento');
    }
    return v;
  }

  async getMine(usuarioId: string): Promise<Pedido | null> {
    const fecha = businessDayDate();
    return this.prisma.pedido.findUnique({
      where: { usuarioId_fecha: { usuarioId, fecha } },
      include: { opcionPlato: true, proveedor: true },
    });
  }

  async create(usuarioId: string, dto: CreateOrderDto): Promise<Pedido> {
    this.assertEmployeeWindow();
    const fecha = businessDayDate();

    const existente = await this.prisma.pedido.findUnique({
      where: { usuarioId_fecha: { usuarioId, fecha } },
    });
    if (existente) {
      throw new ConflictException('Ya tenés un pedido para hoy; editalo o anulalo');
    }

    const opcion = await this.prisma.opcionPlato.findFirst({
      where: { id: dto.opcionPlatoId, fecha },
    });
    if (!opcion) {
      throw new NotFoundException('La opción de plato no existe en el menú de hoy');
    }

    const acompanamiento = this.resolveAcompanamiento(opcion.llevaAcompanamiento, dto.acompanamiento);

    return this.prisma.pedido.create({
      data: {
        usuarioId,
        opcionPlatoId: opcion.id,
        proveedorId: opcion.proveedorId,
        acompanamiento,
        fecha,
      },
    });
  }

  async update(usuarioId: string, dto: UpdateOrderDto): Promise<Pedido> {
    this.assertEmployeeWindow();
    const fecha = businessDayDate();

    const pedido = await this.prisma.pedido.findUnique({
      where: { usuarioId_fecha: { usuarioId, fecha } },
    });
    if (!pedido) throw new NotFoundException('No tenés un pedido para hoy');
    if (pedido.estado === 'ENVIADO') {
      throw new ConflictException('El pedido ya fue enviado y no puede editarse');
    }

    const opcion = await this.prisma.opcionPlato.findFirst({
      where: { id: dto.opcionPlatoId, fecha },
    });
    if (!opcion) {
      throw new NotFoundException('La opción de plato no existe en el menú de hoy');
    }

    const acompanamiento = this.resolveAcompanamiento(opcion.llevaAcompanamiento, dto.acompanamiento);

    return this.prisma.pedido.update({
      where: { id: pedido.id },
      data: { opcionPlatoId: opcion.id, proveedorId: opcion.proveedorId, acompanamiento },
    });
  }

  async remove(usuarioId: string): Promise<{ ok: true }> {
    this.assertEmployeeWindow();
    const fecha = businessDayDate();

    const pedido = await this.prisma.pedido.findUnique({
      where: { usuarioId_fecha: { usuarioId, fecha } },
    });
    if (!pedido) throw new NotFoundException('No tenés un pedido para hoy');
    if (pedido.estado === 'ENVIADO') {
      throw new ConflictException('El pedido ya fue enviado y no puede anularse');
    }

    await this.prisma.pedido.delete({ where: { id: pedido.id } });
    return { ok: true };
  }
}
