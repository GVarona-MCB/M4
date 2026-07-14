import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import * as tz from '../common/time/tz.util';

jest.mock('../common/time/tz.util', () => ({
  businessDayDate: jest.fn(() => new Date('2026-07-14T00:00:00.000Z')), // martes
  isWeekend: jest.fn(() => false),
  isAfterCutoff: jest.fn(() => false),
}));

const mockedTz = tz as jest.Mocked<typeof tz>;

interface PrismaMock {
  pedido: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  opcionPlato: { findFirst: jest.Mock };
}

function makePrisma(): PrismaMock {
  return {
    pedido: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    opcionPlato: { findFirst: jest.fn() },
  };
}

describe('OrdersService (reglas de negocio US1)', () => {
  let prisma: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrdersService(prisma as never);
    mockedTz.isWeekend.mockReturnValue(false);
    mockedTz.isAfterCutoff.mockReturnValue(false);
  });

  it('rechaza la carga los fines de semana (FR-019)', async () => {
    mockedTz.isWeekend.mockReturnValue(true);
    await expect(service.create('u1', { opcionPlatoId: 'o1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza la carga a partir de las 13:00 (FR-024)', async () => {
    mockedTz.isAfterCutoff.mockReturnValue(true);
    await expect(service.create('u1', { opcionPlatoId: 'o1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza un segundo pedido del día (FR-017)', async () => {
    prisma.pedido.findUnique.mockResolvedValue({ id: 'p1' });
    await expect(service.create('u1', { opcionPlatoId: 'o1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza sin acompañamiento cuando el plato lo requiere (FR-016)', async () => {
    prisma.pedido.findUnique.mockResolvedValue(null);
    prisma.opcionPlato.findFirst.mockResolvedValue({
      id: 'o1',
      proveedorId: 'pr1',
      llevaAcompanamiento: true,
    });
    await expect(service.create('u1', { opcionPlatoId: 'o1' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('rechaza si la opción no está en el menú de hoy (sin menú, FR-013)', async () => {
    prisma.pedido.findUnique.mockResolvedValue(null);
    prisma.opcionPlato.findFirst.mockResolvedValue(null);
    await expect(service.create('u1', { opcionPlatoId: 'o1' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('crea el pedido en el camino feliz', async () => {
    prisma.pedido.findUnique.mockResolvedValue(null);
    prisma.opcionPlato.findFirst.mockResolvedValue({
      id: 'o1',
      proveedorId: 'pr1',
      llevaAcompanamiento: false,
    });
    prisma.pedido.create.mockResolvedValue({ id: 'p1', estado: 'PENDIENTE' });
    const result = await service.create('u1', { opcionPlatoId: 'o1' });
    expect(result).toEqual({ id: 'p1', estado: 'PENDIENTE' });
    expect(prisma.pedido.create).toHaveBeenCalledTimes(1);
  });

  it('rechaza editar un pedido ya ENVIADO (FR-018)', async () => {
    prisma.pedido.findUnique.mockResolvedValue({ id: 'p1', estado: 'ENVIADO' });
    await expect(service.update('u1', { opcionPlatoId: 'o1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza anular un pedido ya ENVIADO (FR-018)', async () => {
    prisma.pedido.findUnique.mockResolvedValue({ id: 'p1', estado: 'ENVIADO' });
    await expect(service.remove('u1')).rejects.toBeInstanceOf(ConflictException);
  });
});
