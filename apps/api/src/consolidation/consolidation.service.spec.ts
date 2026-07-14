import { BadGatewayException } from '@nestjs/common';
import { ConsolidationService } from './consolidation.service';

interface PrismaMock {
  pedido: { findMany: jest.Mock };
  proveedor: { findUniqueOrThrow: jest.Mock };
  envio: { count: jest.Mock };
  $transaction: jest.Mock;
}
interface MailMock {
  send: jest.Mock;
}

function makeMocks(): { prisma: PrismaMock; mail: MailMock } {
  return {
    prisma: {
      pedido: { findMany: jest.fn() },
      proveedor: { findUniqueOrThrow: jest.fn() },
      envio: { count: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    },
    mail: { send: jest.fn().mockResolvedValue(undefined) },
  };
}

const unPendiente = [
  {
    id: 'p1',
    usuario: { nombre: 'Ana' },
    opcionPlato: { descripcion: 'Milanesa' },
    acompanamiento: 'puré',
  },
];

describe('ConsolidationService.send (FR-021..FR-026)', () => {
  let prisma: PrismaMock;
  let mail: MailMock;
  let service: ConsolidationService;

  beforeEach(() => {
    const m = makeMocks();
    prisma = m.prisma;
    mail = m.mail;
    service = new ConsolidationService(prisma as never, mail as never);
    prisma.proveedor.findUniqueOrThrow.mockResolvedValue({
      id: 'pr1',
      nombre: 'La Tablita',
      correoDestino: 'x@y.z',
    });
  });

  it('no-op si el proveedor no tiene pendientes (sin correo ni Envio)', async () => {
    prisma.pedido.findMany.mockResolvedValue([]);
    const r = await service.send('pr1');
    expect(r.enviados).toBe(0);
    expect(r.tipo).toBeNull();
    expect(mail.send).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('primer envío al proveedor = PRINCIPAL', async () => {
    prisma.pedido.findMany.mockResolvedValue(unPendiente);
    prisma.envio.count.mockResolvedValue(0);
    const r = await service.send('pr1');
    expect(r.tipo).toBe('PRINCIPAL');
    expect(r.enviados).toBe(1);
    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('envío posterior al mismo proveedor = ADICIONAL (FR-026)', async () => {
    prisma.pedido.findMany.mockResolvedValue(unPendiente);
    prisma.envio.count.mockResolvedValue(1);
    const r = await service.send('pr1');
    expect(r.tipo).toBe('ADICIONAL');
    expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ adicional: true }));
  });

  it('si el SMTP falla: 502 y no marca nada (FR-022)', async () => {
    prisma.pedido.findMany.mockResolvedValue(unPendiente);
    prisma.envio.count.mockResolvedValue(0);
    mail.send.mockRejectedValue(new Error('smtp down'));
    await expect(service.send('pr1')).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
