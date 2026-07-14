import { PrismaClient, Rol } from '@prisma/client';
import { hashPassword } from '../src/common/crypto/password.util';
import { businessDayDate } from '../src/common/time/tz.util';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await hashPassword('secret123');

  // Usuarios de prueba (contraseña: secret123)
  await prisma.usuario.upsert({
    where: { email: 'admin@empresa.local' },
    update: {},
    create: { email: 'admin@empresa.local', nombre: 'Admin', passwordHash, rol: Rol.ADMIN },
  });
  await prisma.usuario.upsert({
    where: { email: 'secretaria@empresa.local' },
    update: {},
    create: {
      email: 'secretaria@empresa.local',
      nombre: 'Secretaría',
      passwordHash,
      rol: Rol.SECRETARIA,
    },
  });
  await prisma.usuario.upsert({
    where: { email: 'empleado@empresa.local' },
    update: {},
    create: {
      email: 'empleado@empresa.local',
      nombre: 'Empleado Uno',
      passwordHash,
      rol: Rol.EMPLEADO,
    },
  });

  // Proveedores (la cantidad la determina el Administrador; sembramos 2 de ejemplo)
  let proveedores = await prisma.proveedor.findMany();
  if (proveedores.length === 0) {
    await prisma.proveedor.create({
      data: { nombre: 'La Tablita', correoDestino: 'latablita@proveedor.local' },
    });
    await prisma.proveedor.create({
      data: { nombre: 'Verde Menú', correoDestino: 'verde@proveedor.local' },
    });
    proveedores = await prisma.proveedor.findMany();
  }

  // Menú del día (fecha operativa GMT-3)
  const fecha = businessDayDate();
  const yaHayMenu = await prisma.opcionPlato.count({ where: { fecha } });
  if (yaHayMenu === 0) {
    await prisma.opcionPlato.createMany({
      data: [
        {
          proveedorId: proveedores[0].id,
          fecha,
          descripcion: 'Milanesa con puré',
          llevaAcompanamiento: true,
        },
        {
          proveedorId: proveedores[0].id,
          fecha,
          descripcion: 'Tarta de verdura',
          llevaAcompanamiento: false,
        },
        {
          proveedorId: proveedores[1].id,
          fecha,
          descripcion: 'Bowl vegetariano',
          llevaAcompanamiento: true,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed completado: usuarios, proveedores y menú del día.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
