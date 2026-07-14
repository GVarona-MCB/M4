# Data Model — Sistema de Solicitud de Almuerzo

**Fase 1** · Fecha: 2026-07-14 · Fuente: [spec.md](./spec.md) (Key Entities + FR) y [research.md](./research.md).
Prisma es la **fuente única** del modelo (Principio VI). Timestamps en UTC; reglas horarias en GMT-3.

## Entidades

### Usuario
Persona que accede al sistema.

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | uuid (PK) | |
| email | string, **único (case-insensitive)** | login; se normaliza a minúsculas + trim (FR-001, FR-034 no aplica) |
| nombre | string | |
| passwordHash | string | argon2id; nunca se expone (FR-030) |
| rol | enum `ADMIN` \| `SECRETARIA` \| `EMPLEADO` | exactamente uno (FR-002) |
| activo | boolean (default true) | inactivo no puede iniciar sesión (FR-008) |
| createdAt / updatedAt | datetime | |

Reglas: no se puede desactivar/eliminar/quitar rol al **propio** Administrador (FR-007). Cambios de estado,
rol o contraseña **revocan sesiones activas** (FR-008 → borrar filas `Session` del usuario).

### Proveedor
Restaurante gestionado por el Administrador (cantidad determinada por él, N ≥ 0; se necesita ≥ 1 con menú
para pedir).

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | uuid (PK) | |
| nombre | string | |
| correoDestino | string (email) | destino del envío (FR-009) |
| createdAt / updatedAt | datetime | |

Reglas: **no eliminable** si tiene `OpcionPlato` o `Pedido` del día asociados (FR-009).

### OpcionPlato  *(el "Menú del día" es el conjunto de opciones de un proveedor para una fecha)*

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | uuid (PK) | |
| proveedorId | uuid (FK → Proveedor) | |
| fecha | date | día GMT-3 al que pertenece el menú |
| descripcion | string | texto libre; escape en salida (FR-034) |
| llevaAcompanamiento | boolean | si true, el pedido exige acompañamiento (FR-011, FR-016) |
| createdAt / updatedAt | datetime | |

Reglas: editar/eliminar solo si **no** hay `Pedido` asociado a esa opción (FR-012). Índice
`(proveedorId, fecha)`.

### Pedido
Elección de un usuario para el día. Único por usuario y día.

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | uuid (PK) | |
| usuarioId | uuid (FK → Usuario) | |
| opcionPlatoId | uuid (FK → OpcionPlato) | |
| proveedorId | uuid (FK → Proveedor) | denormalizado para agrupar/consolidar (FR-020) |
| acompanamiento | string(100), nullable | requerido solo si la opción lleva acompañamiento; trim, no vacío/solo-espacios, ≤100 (FR-016) |
| fecha | date | día GMT-3 |
| estado | enum `PENDIENTE` \| `ENVIADO` | transición ver abajo |
| enviadoAt | datetime, nullable | fecha/hora de envío (FR-022, FR-024) |
| envioId | uuid (FK → Envio), nullable | envío que lo incluyó |
| createdAt / updatedAt | datetime | |

Reglas: **índice único `(usuarioId, fecha)`** (un pedido por día, FR-017). Editar/anular por el empleado
solo si `PENDIENTE` y antes de las 13:00 (FR-018, FR-025). La Secretaría puede dar de baja `PENDIENTE`
incluso tras 13:00 (FR-023, FR-025). No se dan de baja los `ENVIADO`.

### Envio
Acción de la Secretaría de mandar a un proveedor sus pedidos pendientes.

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | uuid (PK) | |
| proveedorId | uuid (FK → Proveedor) | |
| tipo | enum `PRINCIPAL` \| `ADICIONAL` | `PRINCIPAL` = primer envío a ese proveedor; resto `ADICIONAL` (FR-026) |
| enviadoAt | datetime | |
| createdAt | datetime | |

Reglas: incluye solo pedidos `PENDIENTE` de ese proveedor al momento del envío; los `ADICIONAL` no
reincluyen enviados. Relación 1—N con `Pedido` (vía `Pedido.envioId`).

### RegistroDepuracion
Constancia de cada ejecución de borrado (FR-028, FR-029). **No se depura** (sobrevive al borrado).

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | uuid (PK) | |
| tipo | enum `AUTOMATICA` \| `MANUAL` | |
| resultado | enum `EXITO` \| `FALLO` | |
| intentos | int | nº de reintentos usados (RNF-06) |
| detalle | string, nullable | mensaje de error si `FALLO` |
| ejecutadoAt | datetime | |

### Session
Sesión opaca del lado del servidor (R1). **No se depura**.

| Campo | Tipo | Reglas / Notas |
|---|---|---|
| id | string (PK) | token aleatorio de alta entropía; va en cookie `HttpOnly` |
| usuarioId | uuid (FK → Usuario) | |
| createdAt | datetime | |
| lastActivityAt | datetime | se actualiza en cada request autenticado |
| expiresAt | datetime | `lastActivityAt` + 15 min (deslizante, FR-005) |

Reglas: se regenera el `id` al autenticar (anti-fijación, CHK004). Revocación = borrar filas del usuario
(FR-008).

## Relaciones (resumen)

```text
Usuario 1─N Pedido        Usuario 1─N Session
Proveedor 1─N OpcionPlato  Proveedor 1─N Pedido   Proveedor 1─N Envio
OpcionPlato 1─N Pedido     Envio 1─N Pedido
```

## Transiciones de estado

**Pedido**: `(no existe)` → **PENDIENTE** (crear, empleado, día hábil, < 13:00, ≥1 menú) →
**ENVIADO** (Secretaría envía al proveedor). `PENDIENTE` puede eliminarse (vuelve a "no existe", habilita
recrear). `ENVIADO` es **terminal** (no editable, no dable de baja). Todo se elimina en la depuración 15:00.

**Envio**: primer envío a un proveedor = **PRINCIPAL**; siguientes = **ADICIONAL**. Inmutable tras crearse.

## Alcance de la depuración de las 15:00 (FR-027)

- **Se elimina**: `OpcionPlato`, `Pedido`, `Envio` (del día y de días anteriores no depurados).
- **Se conserva**: `Usuario`, `Proveedor`, `RegistroDepuracion`, `Session`.

## Boceto Prisma (referencia; el esquema definitivo se genera en implementación)

```prisma
enum Rol { ADMIN SECRETARIA EMPLEADO }
enum EstadoPedido { PENDIENTE ENVIADO }
enum TipoEnvio { PRINCIPAL ADICIONAL }
enum TipoDepuracion { AUTOMATICA MANUAL }
enum ResultadoDepuracion { EXITO FALLO }

model Usuario {
  id           String   @id @default(uuid())
  email        String   @unique            // normalizado a minúsculas en la app
  nombre       String
  passwordHash String
  rol          Rol
  activo       Boolean  @default(true)
  pedidos      Pedido[]
  sesiones     Session[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Proveedor {
  id            String        @id @default(uuid())
  nombre        String
  correoDestino String
  opciones      OpcionPlato[]
  pedidos       Pedido[]
  envios        Envio[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model OpcionPlato {
  id                  String    @id @default(uuid())
  proveedor           Proveedor @relation(fields: [proveedorId], references: [id])
  proveedorId         String
  fecha               DateTime  @db.Date
  descripcion         String
  llevaAcompanamiento Boolean
  pedidos             Pedido[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  @@index([proveedorId, fecha])
}

model Pedido {
  id             String       @id @default(uuid())
  usuario        Usuario      @relation(fields: [usuarioId], references: [id])
  usuarioId      String
  opcionPlato    OpcionPlato  @relation(fields: [opcionPlatoId], references: [id])
  opcionPlatoId  String
  proveedor      Proveedor    @relation(fields: [proveedorId], references: [id])
  proveedorId    String
  acompanamiento String?      @db.VarChar(100)
  fecha          DateTime     @db.Date
  estado         EstadoPedido @default(PENDIENTE)
  enviadoAt      DateTime?
  envio          Envio?       @relation(fields: [envioId], references: [id])
  envioId        String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@unique([usuarioId, fecha])           // un pedido por usuario por día (FR-017)
  @@index([proveedorId, fecha, estado])
}

model Envio {
  id          String    @id @default(uuid())
  proveedor   Proveedor @relation(fields: [proveedorId], references: [id])
  proveedorId String
  tipo        TipoEnvio
  enviadoAt   DateTime  @default(now())
  pedidos     Pedido[]
  createdAt   DateTime  @default(now())
}

model RegistroDepuracion {
  id          String              @id @default(uuid())
  tipo        TipoDepuracion
  resultado   ResultadoDepuracion
  intentos    Int                 @default(1)
  detalle     String?
  ejecutadoAt DateTime            @default(now())
}

model Session {
  id             String   @id                 // token opaco en cookie HttpOnly
  usuario        Usuario  @relation(fields: [usuarioId], references: [id])
  usuarioId      String
  createdAt      DateTime @default(now())
  lastActivityAt DateTime @default(now())
  expiresAt      DateTime
  @@index([usuarioId])
}
```
