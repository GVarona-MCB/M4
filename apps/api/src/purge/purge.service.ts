import { Injectable, Logger } from '@nestjs/common';
import type { RegistroDepuracion, TipoDepuracion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MAX_RETRIES = 3;

@Injectable()
export class PurgeService {
  private readonly logger = new Logger('Purge');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Depuración irreversible (FR-027..FR-029, RNF-06): borra menús/pedidos/envíos del día
   * y de días anteriores no depurados. NO toca usuarios, proveedores, sesiones ni el registro.
   * Reintenta hasta 3 veces y registra cada ejecución (éxito o fallo).
   */
  async purge(tipo: TipoDepuracion): Promise<RegistroDepuracion> {
    let intentos = 0;
    let lastError: unknown;

    while (intentos < MAX_RETRIES) {
      intentos++;
      try {
        await this.prisma.$transaction([
          this.prisma.pedido.deleteMany({}), // primero: FK a opción/proveedor/envío
          this.prisma.envio.deleteMany({}),
          this.prisma.opcionPlato.deleteMany({}),
        ]);
        this.logger.log(`Depuración ${tipo} exitosa (intento ${intentos})`);
        return this.prisma.registroDepuracion.create({
          data: { tipo, resultado: 'EXITO', intentos },
        });
      } catch (error) {
        lastError = error;
        this.logger.error(`Depuración ${tipo}: intento ${intentos} falló`);
      }
    }

    this.logger.error(`Depuración ${tipo} falló tras ${MAX_RETRIES} intentos`);
    return this.prisma.registroDepuracion.create({
      data: {
        tipo,
        resultado: 'FALLO',
        intentos,
        detalle: lastError instanceof Error ? lastError.message : String(lastError),
      },
    });
  }

  history(): Promise<RegistroDepuracion[]> {
    return this.prisma.registroDepuracion.findMany({ orderBy: { ejecutadoAt: 'desc' } });
  }
}
