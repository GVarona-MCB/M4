import { ConflictException } from '@nestjs/common';
import { ProvidersService } from './providers.service';

interface PrismaMock {
  proveedor: { delete: jest.Mock };
  opcionPlato: { count: jest.Mock };
  pedido: { count: jest.Mock };
}

function makePrisma(): PrismaMock {
  return {
    proveedor: { delete: jest.fn() },
    opcionPlato: { count: jest.fn() },
    pedido: { count: jest.fn() },
  };
}

describe('ProvidersService.remove (FR-009)', () => {
  let prisma: PrismaMock;
  let service: ProvidersService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProvidersService(prisma as never);
  });

  it('elimina un proveedor sin menús ni pedidos', async () => {
    prisma.opcionPlato.count.mockResolvedValue(0);
    prisma.pedido.count.mockResolvedValue(0);
    prisma.proveedor.delete.mockResolvedValue({});
    await expect(service.remove('pr1')).resolves.toEqual({ ok: true });
  });

  it('rechaza eliminar un proveedor con menús asociados', async () => {
    prisma.opcionPlato.count.mockResolvedValue(2);
    prisma.pedido.count.mockResolvedValue(0);
    await expect(service.remove('pr1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.proveedor.delete).not.toHaveBeenCalled();
  });

  it('rechaza eliminar un proveedor con pedidos asociados', async () => {
    prisma.opcionPlato.count.mockResolvedValue(0);
    prisma.pedido.count.mockResolvedValue(1);
    await expect(service.remove('pr1')).rejects.toBeInstanceOf(ConflictException);
  });
});
