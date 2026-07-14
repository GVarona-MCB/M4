// E2E de US2 (T034): consolidación y envío por proveedor, con MailService stub
// (no hay SMTP real). Reloj mockeado para determinismo.
const FIXED_DATE = new Date('2026-07-14T00:00:00.000Z');

jest.mock('../src/common/time/tz.util', () => ({
  APP_TZ: 'America/Argentina/Buenos_Aires',
  businessDay: () => '2026-07-14',
  businessDayDate: () => FIXED_DATE,
  isWeekend: jest.fn(() => false),
  isAfterCutoff: jest.fn(() => false),
}));

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';
import { hashPassword } from '../src/common/crypto/password.util';

describe('Consolidation (e2e) — US2', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const mailStub = { send: jest.fn().mockResolvedValue(undefined) };

  let proveedorId: string;
  let opcionId: string;
  const ids: { usuarios: string[] } = { usuarios: [] };
  const suffix = Date.now();

  const secre = () => request.agent(app.getHttpServer());
  let secreAgent: ReturnType<typeof secre>;
  let secreCsrf = '';
  let empAgent: ReturnType<typeof secre>;

  async function crearEmpleadoConPedido(nombre: string): Promise<string> {
    const passwordHash = await hashPassword('secret123');
    const u = await prisma.usuario.create({
      data: { email: `e2e-${nombre}-${suffix}@t.local`, nombre, passwordHash, rol: 'EMPLEADO' },
    });
    ids.usuarios.push(u.id);
    await prisma.pedido.create({
      data: { usuarioId: u.id, opcionPlatoId: opcionId, proveedorId, fecha: FIXED_DATE },
    });
    return u.id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mailStub)
      .compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const passwordHash = await hashPassword('secret123');
    const sec = await prisma.usuario.create({
      data: { email: `e2e-sec-${suffix}@t.local`, nombre: 'E2E Sec', passwordHash, rol: 'SECRETARIA' },
    });
    ids.usuarios.push(sec.id);
    const prov = await prisma.proveedor.create({
      data: { nombre: 'E2E Prov', correoDestino: 'e2e@prov.local' },
    });
    proveedorId = prov.id;
    const op = await prisma.opcionPlato.create({
      data: { proveedorId, fecha: FIXED_DATE, descripcion: 'E2E plato', llevaAcompanamiento: false },
    });
    opcionId = op.id;

    await crearEmpleadoConPedido('emp1'); // pedido PENDIENTE #1

    secreAgent = secre();
    secreCsrf = (await secreAgent.get('/auth/csrf')).body.csrfToken as string;
    await secreAgent.post('/auth/login').send({ email: sec.email, password: 'secret123' }).expect(201);

    const empPass = await prisma.usuario.findFirst({ where: { rol: 'EMPLEADO' } });
    empAgent = secre();
    await empAgent.get('/auth/csrf');
    await empAgent
      .post('/auth/login')
      .send({ email: empPass?.email, password: 'secret123' })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.pedido.deleteMany({ where: { proveedorId } });
    await prisma.envio.deleteMany({ where: { proveedorId } });
    await prisma.opcionPlato.deleteMany({ where: { proveedorId } });
    await prisma.proveedor.deleteMany({ where: { id: proveedorId } });
    await prisma.usuario.deleteMany({ where: { id: { in: ids.usuarios } } });
    await prisma.$disconnect();
    await app.close();
  });

  it('un EMPLEADO no puede ver el consolidado → 403', async () => {
    await empAgent.get('/consolidation').expect(403);
  });

  it('la Secretaría ve el consolidado agrupado por proveedor', async () => {
    const res = await secreAgent.get('/consolidation').expect(200);
    const grupo = res.body.find((g: { proveedorId: string }) => g.proveedorId === proveedorId);
    expect(grupo).toBeDefined();
    expect(grupo.pedidos.length).toBeGreaterThanOrEqual(1);
  });

  it('primer envío al proveedor → PRINCIPAL, marca ENVIADO', async () => {
    const res = await secreAgent
      .post('/consolidation/send')
      .set('x-csrf-token', secreCsrf)
      .send({ proveedorId })
      .expect(201);
    expect(res.body.tipo).toBe('PRINCIPAL');
    expect(mailStub.send).toHaveBeenCalledTimes(1);
    const pendientes = await prisma.pedido.count({
      where: { proveedorId, estado: 'PENDIENTE' },
    });
    expect(pendientes).toBe(0);
  });

  it('segundo envío sin pendientes → no-op (enviados 0, sin correo)', async () => {
    mailStub.send.mockClear();
    const res = await secreAgent
      .post('/consolidation/send')
      .set('x-csrf-token', secreCsrf)
      .send({ proveedorId })
      .expect(201);
    expect(res.body.enviados).toBe(0);
    expect(res.body.tipo).toBeNull();
    expect(mailStub.send).not.toHaveBeenCalled();
  });

  it('si el SMTP falla → 502 y el pedido queda PENDIENTE', async () => {
    const nuevoEmpId = await crearEmpleadoConPedido('emp2'); // nuevo PENDIENTE
    mailStub.send.mockRejectedValueOnce(new Error('smtp down'));
    await secreAgent
      .post('/consolidation/send')
      .set('x-csrf-token', secreCsrf)
      .send({ proveedorId })
      .expect(502);
    const pedido = await prisma.pedido.findUnique({
      where: { usuarioId_fecha: { usuarioId: nuevoEmpId, fecha: FIXED_DATE } },
    });
    expect(pedido?.estado).toBe('PENDIENTE');
  });
});
