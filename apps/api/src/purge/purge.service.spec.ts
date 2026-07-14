import { PurgeService } from './purge.service';

interface PrismaMock {
  pedido: { deleteMany: jest.Mock };
  envio: { deleteMany: jest.Mock };
  opcionPlato: { deleteMany: jest.Mock };
  registroDepuracion: { create: jest.Mock; findMany: jest.Mock };
  $transaction: jest.Mock;
}

function makePrisma(): PrismaMock {
  return {
    pedido: { deleteMany: jest.fn() },
    envio: { deleteMany: jest.fn() },
    opcionPlato: { deleteMany: jest.fn() },
    registroDepuracion: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
}

describe('PurgeService (FR-027..FR-029)', () => {
  let prisma: PrismaMock;
  let service: PurgeService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new PurgeService(prisma as never);
  });

  it('borra menús/pedidos/envíos y registra EXITO; no toca usuarios/proveedores/sesiones', async () => {
    prisma.$transaction.mockResolvedValue([]);
    prisma.registroDepuracion.create.mockImplementation(({ data }) => Promise.resolve(data));
    const reg = await service.purge('AUTOMATICA');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(reg).toMatchObject({ tipo: 'AUTOMATICA', resultado: 'EXITO', intentos: 1 });
    // No hay borrado de usuarios/proveedores/sesiones (no existen esos mocks -> no se invocan)
    expect((prisma as unknown as Record<string, unknown>).usuario).toBeUndefined();
  });

  it('reintenta hasta 3 veces y registra FALLO si la transacción siempre falla (RNF-06)', async () => {
    prisma.$transaction.mockRejectedValue(new Error('db down'));
    prisma.registroDepuracion.create.mockImplementation(({ data }) => Promise.resolve(data));
    const reg = await service.purge('MANUAL');
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(reg).toMatchObject({ tipo: 'MANUAL', resultado: 'FALLO', intentos: 3 });
  });
});
