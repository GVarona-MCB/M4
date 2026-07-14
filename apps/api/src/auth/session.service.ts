import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TTL_MINUTES = Number(process.env.SESSION_TTL_MINUTES ?? 15);
const ABSOLUTE_TTL_HOURS = Number(process.env.SESSION_ABSOLUTE_TTL_HOURS ?? 12);

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  private newToken(): string {
    return randomBytes(32).toString('hex');
  }

  private expiry(): Date {
    return new Date(Date.now() + TTL_MINUTES * 60_000);
  }

  /** Crea una sesión nueva (id regenerado en cada login → anti-fijación, CHK004). */
  async create(usuarioId: string): Promise<string> {
    const id = this.newToken();
    await this.prisma.session.create({
      data: { id, usuarioId, expiresAt: this.expiry() },
    });
    return id;
  }

  /** Valida la sesión y desliza la expiración (15 min de inactividad, FR-005). */
  async validateAndSlide(id: string): Promise<Usuario | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { usuario: true },
    });
    if (!session) return null;
    const absoluteDeadline = session.createdAt.getTime() + ABSOLUTE_TTL_HOURS * 3_600_000;
    // Expiración por inactividad o por tope de vida absoluto (CHK007).
    if (session.expiresAt.getTime() < Date.now() || absoluteDeadline < Date.now()) {
      await this.prisma.session.deleteMany({ where: { id } });
      return null;
    }
    if (!session.usuario.activo) {
      await this.prisma.session.deleteMany({ where: { id } });
      return null;
    }
    await this.prisma.session.update({
      where: { id },
      data: { lastActivityAt: new Date(), expiresAt: this.expiry() },
    });
    return session.usuario;
  }

  async destroy(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }

  /** Revocación inmediata de todas las sesiones de un usuario (FR-008). */
  async revokeAllForUser(usuarioId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { usuarioId } });
  }
}
