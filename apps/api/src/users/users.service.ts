import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../auth/session.service';
import { normalizeEmail } from '../auth/auth.service';
import { hashPassword } from '../common/crypto/password.util';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

export interface PublicUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  findAll(): Promise<PublicUser[]> {
    return this.prisma.usuario.findMany({
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const email = normalizeEmail(dto.email);
    const exists = await this.prisma.usuario.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Ya existe un usuario con ese email');
    const passwordHash = await hashPassword(dto.password);
    const u = await this.prisma.usuario.create({
      data: { email, nombre: dto.nombre, rol: dto.rol, passwordHash },
    });
    return this.toPublic(u);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<PublicUser> {
    const target = await this.getOr404(id);

    // Auto-bloqueo: el Administrador no puede quitarse el rol de Administrador a sí mismo (FR-007).
    if (id === actorId && dto.rol && dto.rol !== 'ADMIN' && target.rol === 'ADMIN') {
      throw new ForbiddenException('No podés quitarte el rol de Administrador a vos mismo');
    }

    const data: Prisma.UsuarioUpdateInput = {};
    let revoke = false;
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.rol !== undefined && dto.rol !== target.rol) {
      data.rol = dto.rol;
      revoke = true;
    }
    if (dto.password) {
      data.passwordHash = await hashPassword(dto.password);
      revoke = true; // restablecer contraseña revoca sesiones (FR-008)
    }

    const u = await this.prisma.usuario.update({ where: { id }, data });
    if (revoke) await this.sessions.revokeAllForUser(id);
    return this.toPublic(u);
  }

  async setActive(id: string, activo: boolean, actorId: string): Promise<PublicUser> {
    if (id === actorId && !activo) {
      throw new ForbiddenException('No podés desactivarte a vos mismo');
    }
    const u = await this.prisma.usuario.update({ where: { id }, data: { activo } });
    if (!activo) await this.sessions.revokeAllForUser(id); // revocación inmediata (FR-008)
    return this.toPublic(u);
  }

  async remove(id: string, actorId: string): Promise<{ ok: true }> {
    if (id === actorId) {
      throw new ForbiddenException('No podés eliminarte a vos mismo');
    }
    await this.getOr404(id);
    await this.sessions.revokeAllForUser(id);
    await this.prisma.usuario.delete({ where: { id } });
    return { ok: true };
  }

  private async getOr404(id: string): Promise<PublicUser> {
    const u = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });
    if (!u) throw new NotFoundException('El usuario no existe');
    return u;
  }

  private toPublic(u: {
    id: string;
    email: string;
    nombre: string;
    rol: Rol;
    activo: boolean;
  }): PublicUser {
    return { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol, activo: u.activo };
  }
}
