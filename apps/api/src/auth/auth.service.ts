import { Injectable, Logger } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { verifyPassword } from '../common/crypto/password.util';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Security');

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  /** Devuelve el id de sesión y el usuario si las credenciales son válidas; null en cualquier fallo. */
  async login(email: string, password: string): Promise<{ sid: string; user: Usuario } | null> {
    const normalized = normalizeEmail(email);
    const user = await this.prisma.usuario.findUnique({ where: { email: normalized } });
    // Anti-enumeración (FR-001): mismo resultado si no existe, está inactivo o la clave es incorrecta.
    if (!user || !user.activo || !(await verifyPassword(user.passwordHash, password))) {
      this.logger.warn(`Login fallido para ${normalized}`); // evento de seguridad (T075)
      return null;
    }
    const sid = await this.sessions.create(user.id);
    this.logger.log(`Login exitoso: ${normalized} (${user.rol})`);
    return { sid, user };
  }
}
