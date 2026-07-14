import { BadGatewayException, Injectable } from '@nestjs/common';
import type { TipoEnvio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { businessDay, businessDayDate } from '../common/time/tz.util';

export interface ConsolidationLine {
  pedidoId: string;
  empleado: string;
  plato: string;
  acompanamiento: string | null;
  estado: string;
}
export interface ConsolidationGroup {
  proveedorId: string;
  proveedorNombre: string;
  pedidos: ConsolidationLine[];
}

export interface SendResult {
  enviados: number;
  tipo: TipoEnvio | null;
  mensaje: string;
}

@Injectable()
export class ConsolidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Consolidado del día agrupado por proveedor (FR-020). */
  async getConsolidation(fecha: Date = businessDayDate()): Promise<ConsolidationGroup[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: { fecha },
      include: { usuario: true, opcionPlato: true, proveedor: true },
      orderBy: [{ proveedorId: 'asc' }, { createdAt: 'asc' }],
    });

    const groups = new Map<string, ConsolidationGroup>();
    for (const p of pedidos) {
      let g = groups.get(p.proveedorId);
      if (!g) {
        g = { proveedorId: p.proveedorId, proveedorNombre: p.proveedor.nombre, pedidos: [] };
        groups.set(p.proveedorId, g);
      }
      g.pedidos.push({
        pedidoId: p.id,
        empleado: p.usuario.nombre,
        plato: p.opcionPlato.descripcion,
        acompanamiento: p.acompanamiento,
        estado: p.estado,
      });
    }
    return [...groups.values()];
  }

  /**
   * Envía por correo a un proveedor sus pedidos PENDIENTE (FR-021..FR-026).
   * - Tipo por proveedor: primer envío = PRINCIPAL, siguientes = ADICIONAL.
   * - No-op si no hay pendientes (sin correo ni Envio).
   * - Si el SMTP falla: 502 y no se marca nada (aislamiento por proveedor).
   */
  async send(proveedorId: string): Promise<SendResult> {
    const fecha = businessDayDate();

    const pendientes = await this.prisma.pedido.findMany({
      where: { proveedorId, fecha, estado: 'PENDIENTE' },
      include: { usuario: true, opcionPlato: true },
    });

    if (pendientes.length === 0) {
      return { enviados: 0, tipo: null, mensaje: 'No hay pedidos pendientes para este proveedor' };
    }

    const proveedor = await this.prisma.proveedor.findUniqueOrThrow({ where: { id: proveedorId } });
    const previos = await this.prisma.envio.count({ where: { proveedorId } });
    const tipo: TipoEnvio = previos === 0 ? 'PRINCIPAL' : 'ADICIONAL';

    try {
      await this.mail.send({
        proveedorNombre: proveedor.nombre,
        correoDestino: proveedor.correoDestino,
        fecha: businessDay(),
        adicional: tipo === 'ADICIONAL',
        pedidos: pendientes.map((p) => ({
          empleado: p.usuario.nombre,
          plato: p.opcionPlato.descripcion,
          acompanamiento: p.acompanamiento,
        })),
      });
    } catch {
      throw new BadGatewayException(
        'No se pudo enviar el correo al proveedor; reintentá (no se marcó ningún pedido)',
      );
    }

    // Solo tras el envío exitoso: crear Envio y marcar los pedidos, atómicamente.
    await this.prisma.$transaction(async (tx) => {
      const envio = await tx.envio.create({ data: { proveedorId, tipo } });
      await tx.pedido.updateMany({
        where: { id: { in: pendientes.map((p) => p.id) } },
        data: { estado: 'ENVIADO', enviadoAt: new Date(), envioId: envio.id },
      });
    });

    return {
      enviados: pendientes.length,
      tipo,
      mensaje: tipo === 'ADICIONAL' ? 'Enviado como PEDIDO ADICIONAL' : 'Envío principal realizado',
    };
  }
}
