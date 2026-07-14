import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';

interface PrismaMock {
  usuario: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
}
interface SessionsMock {
  revokeAllForUser: jest.Mock;
}

function makeMocks(): { prisma: PrismaMock; sessions: SessionsMock } {
  return {
    prisma: {
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({
          id: 'u2',
          email: 'a@b.c',
          nombre: 'X',
          rol: 'EMPLEADO',
          activo: true,
        }),
        delete: jest.fn(),
      },
    },
    sessions: { revokeAllForUser: jest.fn() },
  };
}

describe('UsersService (FR-006/007/008)', () => {
  let prisma: PrismaMock;
  let sessions: SessionsMock;
  let service: UsersService;

  beforeEach(() => {
    const m = makeMocks();
    prisma = m.prisma;
    sessions = m.sessions;
    service = new UsersService(prisma as never, sessions as never);
  });

  it('rechaza crear un usuario con email ya existente (409)', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.create({ email: 'A@B.c', nombre: 'X', rol: 'EMPLEADO', password: 'secret1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('impide que el Admin se quite el rol de Administrador a sí mismo (FR-007)', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 'admin', rol: 'ADMIN' });
    await expect(
      service.update('admin', { rol: 'EMPLEADO' }, 'admin'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('restablecer contraseña revoca las sesiones activas (FR-008)', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 'u2', rol: 'EMPLEADO' });
    await service.update('u2', { password: 'nuevaClave' }, 'admin');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u2');
  });

  it('impide que el Admin se desactive a sí mismo (FR-007)', async () => {
    await expect(service.setActive('admin', false, 'admin')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('desactivar a otro usuario revoca sus sesiones (FR-008)', async () => {
    await service.setActive('u2', false, 'admin');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u2');
  });

  it('impide que el Admin se elimine a sí mismo (FR-008)', async () => {
    await expect(service.remove('admin', 'admin')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
