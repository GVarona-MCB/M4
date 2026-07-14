import { Injectable } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { verifyPassword } from '../common/crypto/password.util';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  /** Devuelve el id de sesión y el usuario si las credenciales son válidas; null en cualquier fallo. */
  async login(email: string, password: string): Promise<{ sid: string; user: Usuario } | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizeEmail(email) },
    });
    // Anti-enumeración (FR-001): mismo resultado si no existe, está inactivo o la clave es incorrecta.
    if (!user || !user.activo) return null;
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) return null;
    const sid = await this.sessions.create(user.id);
    return { sid, user };
  }
}
