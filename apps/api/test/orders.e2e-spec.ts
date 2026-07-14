// E2E de US1 (T025): auth + CSRF + reglas de pedido, contra la app real y la DB.
// Se mockea el reloj (tz.util) para determinismo; el resto es end-to-end real.
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
import { hashPassword } from '../src/common/crypto/password.util';
import * as tz from '../src/common/time/tz.util';

describe('Orders (e2e) — US1', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const agent = () => request.agent(app.getHttpServer());

  let usuarioId: string;
  let proveedorId: string;
  let opcionId: string;
  const email = `e2e-orders-${Date.now()}@t.local`;

  let logged: ReturnType<typeof agent>;
  let csrf = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const passwordHash = await hashPassword('secret123');
    const u = await prisma.usuario.create({
      data: { email, nombre: 'E2E Empleado', passwordHash, rol: 'EMPLEADO' },
    });
    usuarioId = u.id;
    const p = await prisma.proveedor.create({
      data: { nombre: 'E2E Prov', correoDestino: 'e2e@prov.local' },
    });
    proveedorId = p.id;
    const o = await prisma.opcionPlato.create({
      data: { proveedorId, fecha: FIXED_DATE, descripcion: 'E2E plato', llevaAcompanamiento: false },
    });
    opcionId = o.id;

    logged = agent();
    const res = await logged.get('/auth/csrf');
    csrf = res.body.csrfToken as string;
    await logged.post('/auth/login').send({ email, password: 'secret123' }).expect(201);
  });

  afterAll(async () => {
    await prisma.pedido.deleteMany({ where: { usuarioId } });
    await prisma.opcionPlato.deleteMany({ where: { proveedorId } });
    await prisma.pedido.deleteMany({ where: { proveedorId } });
    await prisma.proveedor.deleteMany({ where: { id: proveedorId } });
    await prisma.usuario.deleteMany({ where: { id: usuarioId } });
    await prisma.$disconnect();
    await app.close();
  });

  it('sin sesión → 401', async () => {
    await request(app.getHttpServer()).get('/orders/me').expect(401);
  });

  it('POST sin token CSRF → 403', async () => {
    await logged.post('/orders/me').send({ opcionPlatoId: opcionId }).expect(403);
  });

  it('crea el pedido (camino feliz) → 201', async () => {
    await logged
      .post('/orders/me')
      .set('x-csrf-token', csrf)
      .send({ opcionPlatoId: opcionId })
      .expect(201);
  });

  it('segundo pedido del día → 409', async () => {
    await logged
      .post('/orders/me')
      .set('x-csrf-token', csrf)
      .send({ opcionPlatoId: opcionId })
      .expect(409);
  });

  it('GET /orders/me devuelve el pedido propio', async () => {
    const res = await logged.get('/orders/me').expect(200);
    expect(res.body.opcionPlatoId).toBe(opcionId);
    expect(res.body.estado).toBe('PENDIENTE');
  });

  it('anula el pedido (ventana abierta) → 200 y luego queda vacío', async () => {
    await logged.delete('/orders/me').set('x-csrf-token', csrf).expect(200);
    const res = await logged.get('/orders/me').expect(200);
    expect(res.body).toEqual({});
  });

  it('a partir de las 13:00 la carga se rechaza → 409', async () => {
    (tz.isAfterCutoff as jest.Mock).mockReturnValue(true);
    await logged
      .post('/orders/me')
      .set('x-csrf-token', csrf)
      .send({ opcionPlatoId: opcionId })
      .expect(409);
    (tz.isAfterCutoff as jest.Mock).mockReturnValue(false);
  });
});
