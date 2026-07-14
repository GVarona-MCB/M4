import { ConflictException } from '@nestjs/common';
import { MenuService } from './menu.service';

interface PrismaMock {
  opcionPlato: { create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  pedido: { count: jest.Mock };
}

function makePrisma(): PrismaMock {
  return {
    opcionPlato: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    pedido: { count: jest.fn() },
  };
}

describe('MenuService (integridad FR-012)', () => {
  let prisma: PrismaMock;
  let service: MenuService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new MenuService(prisma as never);
  });

  it('crea una opción de plato', async () => {
    prisma.opcionPlato.create.mockResolvedValue({ id: 'o1' });
    await service.createOption({ proveedorId: 'pr1', descripcion: 'Pizza', llevaAcompanamiento: false });
    expect(prisma.opcionPlato.create).toHaveBeenCalled();
  });

  it('edita una opción SIN pedidos asociados', async () => {
    prisma.pedido.count.mockResolvedValue(0);
    prisma.opcionPlato.update.mockResolvedValue({ id: 'o1' });
    await service.updateOption('o1', { descripcion: 'Pizza 2', llevaAcompanamiento: true });
    expect(prisma.opcionPlato.update).toHaveBeenCalled();
  });

  it('rechaza editar una opción CON pedidos asociados', async () => {
    prisma.pedido.count.mockResolvedValue(2);
    await expect(
      service.updateOption('o1', { descripcion: 'x', llevaAcompanamiento: false }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.opcionPlato.update).not.toHaveBeenCalled();
  });

  it('rechaza eliminar una opción CON pedidos asociados', async () => {
    prisma.pedido.count.mockResolvedValue(1);
    await expect(service.deleteOption('o1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.opcionPlato.delete).not.toHaveBeenCalled();
  });
});
