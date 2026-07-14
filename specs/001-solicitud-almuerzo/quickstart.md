# Quickstart & Validación — Sistema de Solicitud de Almuerzo

**Fase 1** · Fecha: 2026-07-14 · Guía para levantar el entorno y validar la feature de punta a punta.
Detalles del modelo en [data-model.md](./data-model.md) y de los endpoints en
[contracts/rest-api.md](./contracts/rest-api.md).

## Prerrequisitos

- Node.js 22 LTS · pnpm 11 · Docker (para PostgreSQL 16).
- `.env` a partir de `.env.example` (credenciales de DB y SMTP; TZ de referencia GMT-3).

## Setup

```bash
pnpm install
docker compose up -d                              # PostgreSQL 16 en host 5433
pnpm --filter api prisma migrate dev              # migraciones + Prisma Client
pnpm --filter api db:seed                         # usuarios (admin/secretaría/empleado) + proveedores
pnpm --filter api start:dev                       # API en http://localhost:3001
pnpm --filter web dev                             # Web en http://localhost:3002
```

Tras cambiar `.env`, **reiniciar la API** (se lee al arrancar).

## Ejecutar tests

```bash
pnpm -r test
```

La suite DEBE cubrir el "camino feliz" y el "camino triste" de cada regla (Principio X): ver escenarios
abajo.

## Escenarios de validación (mapeados a los Acceptance Scenarios del spec)

> Cada escenario indica el resultado esperado. Los que dependen de la hora/día se prueban fijando la fecha
> de referencia (reloj inyectable en la API, en GMT-3).

### 1. Autenticación y sesión (US7)
- Sin sesión → cualquier ruta redirige a login; la API responde `401`. **(FR-001)**
- Login fallido → mensaje genérico (no revela si el email existe). **(FR-001)**
- Tras 15 min de inactividad → el siguiente request devuelve `401` (sesión expirada). **(FR-005)**
- Admin desactiva a un usuario con sesión activa → su siguiente request devuelve `401` (revocada). **(FR-008)**

### 2. Carga de menú (US4, Secretaría)
- Crear varias opciones por proveedor con/sin acompañamiento → visibles para empleados. **(FR-010, FR-011)**
- Editar/eliminar una opción **con** pedidos asociados → `409`. **(FR-012)**

### 3. Pedido del empleado (US1)
- Con ≥1 proveedor con menú, elegir plato y confirmar → 1 pedido `PENDIENTE`. **(FR-014..FR-017)**
- Plato que lleva acompañamiento sin indicarlo → `422` (no confirma). **(FR-016, FR-018)**
- Segundo pedido del día → `409` (ofrece editar/anular). **(FR-017)**
- Editar/anular pedido `ENVIADO` → rechazado. **(FR-018)**
- Sin ningún menú cargado → no puede pedir, mensaje "no hay menú". **(FR-013)**

### 4. Reglas horarias (US3)
- Sábado/domingo (GMT-3) → carga rechazada con motivo. **(FR-019)**
- A las 13:00 o después → carga/edición/baja del empleado rechazada; el envío de la Secretaría sigue
  disponible. **(FR-024, FR-025)**

### 5. Consolidación y envío (US2, US3)
- Enviar a un proveedor → recibe solo sus pedidos a su correo; quedan `ENVIADO` con fecha/hora. **(FR-021, FR-022)**
- Fallo de SMTP en un proveedor → error visible, no marca `ENVIADO`, no afecta a otros proveedores. **(FR-022)**
- Segundo envío al mismo proveedor con pedidos nuevos → correo con solo los nuevos y "PEDIDO ADICIONAL" en
  el asunto. **(FR-026)**
- Secretaría da de baja un `PENDIENTE` (incluso tras 13:00) → se borra y el empleado puede recrear; baja de
  `ENVIADO` → `409`. **(FR-023, FR-025)**

### 6. Depuración (US8)
- A las 15:00 (GMT-3) → se eliminan menús/pedidos/envíos del día; se registra la ejecución. **(FR-027, FR-028)**
- Admin ejecuta `POST /purge` → borra y registra como `MANUAL`; un no-Admin → `403`. **(FR-029)**
- `GET /purge/history` (Admin) → lista ejecuciones automáticas y manuales con resultado. **(FR-029)**

### 7. Seguridad (transversal)
- Empleado intenta endpoint de Secretaría/Admin → `403`. **(FR-003)**
- Operación que cambia estado sin header `x-csrf-token` → rechazada. **(FR-035)**
- Acompañamiento con `<script>`/comillas/saltos de línea → se muestra literal (escapado) en UI y correo, sin
  ejecutar ni alterar encabezados del correo. **(FR-034)**

## Criterios de aceptación del entorno

- `docker compose up -d`, `prisma migrate dev` y `db:seed` dejan un entorno local funcional (AGENTS.md).
- API en `3001`, Web en `3002`, PostgreSQL en `5433` (sin choques con n8n).
- `pnpm -r test` en verde, con cobertura de los caminos tristes listados.
