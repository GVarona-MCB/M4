import { SessionService } from './session.service';

interface PrismaMock {
  session: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
}

function makePrisma(): PrismaMock {
  return {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

describe('SessionService', () => {
  let prisma: PrismaMock;
  let service: SessionService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new SessionService(prisma as never);
  });

  it('crea una sesión con token e id de alta entropía (anti-fijación)', async () => {
    prisma.session.create.mockResolvedValue({});
    const id = await service.create('u1');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(32);
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it('devuelve null si la sesión no existe', async () => {
    prisma.session.findUnique.mockResolvedValue(null);
    expect(await service.validateAndSlide('x')).toBeNull();
  });

  it('devuelve null y borra la sesión si expiró', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      expiresAt: new Date(Date.now() - 1000),
      usuario: { activo: true },
    });
    expect(await service.validateAndSlide('s1')).toBeNull();
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('devuelve null si el usuario está inactivo', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      expiresAt: new Date(Date.now() + 60_000),
      usuario: { activo: false },
    });
    expect(await service.validateAndSlide('s1')).toBeNull();
  });

  it('desliza la expiración y devuelve el usuario si es válida', async () => {
    const usuario = { id: 'u1', activo: true, rol: 'EMPLEADO' };
    prisma.session.findUnique.mockResolvedValue({
      id: 's1',
      expiresAt: new Date(Date.now() + 60_000),
      usuario,
    });
    prisma.session.update.mockResolvedValue({});
    const result = await service.validateAndSlide('s1');
    expect(result).toBe(usuario);
    expect(prisma.session.update).toHaveBeenCalled();
  });

  it('revoca todas las sesiones de un usuario (FR-008)', async () => {
    prisma.session.deleteMany.mockResolvedValue({ count: 2 });
    await service.revokeAllForUser('u1');
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { usuarioId: 'u1' } });
  });
});
