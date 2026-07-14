---
description: "Task list for Sistema de Solicitud de Almuerzo"
---

# Tasks: Sistema de Solicitud de Almuerzo

**Input**: Design documents from `/specs/001-solicitud-almuerzo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rest-api.md, quickstart.md

**Tests**: INCLUIDOS. El Principio X de la constitución exige tests (camino feliz y triste) para cada regla
del PRD, por lo que cada historia incluye tareas de test.

**Organization**: Tareas agrupadas por historia de usuario para implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia a la que pertenece (US1..US8)
- Rutas de archivo exactas incluidas en cada tarea

## Path Conventions

Monorepo pnpm: API en `apps/api/`, Web en `apps/web/`. Tests de API en `apps/api/test/` (e2e) y junto al
código (`*.spec.ts`). Prisma en `apps/api/prisma/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del monorepo y estructura base.

- [X] T001 Crear estructura del monorepo pnpm (`pnpm-workspace.yaml`, `apps/web`, `apps/api`) en la raíz
- [X] T002 [P] Inicializar `apps/api` con NestJS 11 y `tsconfig` en modo strict en `apps/api/`
- [X] T003 [P] Inicializar `apps/web` con Next.js 15 (App Router) y `tsconfig` strict en `apps/web/`
- [X] T004 [P] Crear `docker-compose.yml` con PostgreSQL 16 en host `5433` en la raíz
- [X] T005 [P] Configurar ESLint + Prettier + TS strict en todo el workspace
- [X] T006 [P] Crear `.env.example` (DATABASE_URL con `sslmode`, SMTP TLS, SESSION, TZ GMT-3, puertos 3001/3002/5433) en la raíz
- [X] T007 [P] Fijar puertos (API 3001, Web 3002) en la config de cada app
- [X] T008 [P] Configurar runners de test: Jest+Supertest en `apps/api`, Vitest+RTL en `apps/web`, y `pnpm -r test` en la raíz
- [X] T009 Instalar dependencias core (`prisma`, `@prisma/client`, `argon2`, `nodemailer`, `@nestjs/schedule`, `@nestjs/config`, `class-validator`, lib CSRF) en `apps/api`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura que TODAS las historias necesitan.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase.

- [X] T010 Definir el esquema Prisma completo (entidades + enums de data-model.md) en `apps/api/prisma/schema.prisma`
- [X] T011 Crear la migración inicial y generar Prisma Client (`prisma migrate dev`) en `apps/api/prisma/migrations/`
- [X] T012 [P] Crear módulo/servicio Prisma (wrapper de conexión) en `apps/api/src/prisma/prisma.service.ts`
- [X] T013 Crear seed (`db:seed`): Admin, Secretaría, Empleado, N proveedores y un menú del día de ejemplo en `apps/api/prisma/seed.ts`
- [X] T014 [P] Módulo de configuración (`@nestjs/config`) con validación de entorno en `apps/api/src/config/`
- [X] T015 [P] Utilidad de zona horaria GMT-3 (`isFinDeSemana`, `esDespuesDeCorte(13:00)`, `diaOperativo`) en `apps/api/src/common/time/tz.util.ts`
- [X] T016 [P] Filtro global de excepciones (sin filtrar detalles internos) + logger de seguridad en `apps/api/src/common/filters/`
- [X] T017 [P] Utilidad de hash de contraseñas (argon2, mín. 6) en `apps/api/src/common/crypto/password.util.ts`
- [X] T018 Servicio de sesión (crear/regenerar id/validar/deslizar/revocar) sobre tabla `Session` en `apps/api/src/auth/session.service.ts`
- [X] T019 Guard de autenticación (cookie de sesión → usuario, expiración deslizante 15 min) en `apps/api/src/auth/auth.guard.ts`
- [X] T020 [P] Guard de roles + decorador `@Roles()` en `apps/api/src/auth/roles.guard.ts`
- [X] T021 [P] Middleware/guard CSRF (token, header `x-csrf-token`) en `apps/api/src/auth/csrf.guard.ts`
- [X] T022 Endpoints de auth: `GET /auth/csrf`, `POST /auth/login` (error genérico anti-enumeración), `POST /auth/logout`, `GET /auth/me` en `apps/api/src/auth/auth.controller.ts`
- [X] T023 [P] Cliente HTTP web con `credentials: 'include'` + header CSRF + contexto de auth en `apps/web/src/lib/api-client.ts`
- [X] T024 [P] Layout base + página de login + protección de rutas en `apps/web/src/app/(auth)/`

**Checkpoint**: Fundación lista — se puede empezar cualquier historia (con datos del seed).

---

## Phase 3: User Story 1 - Pedido del empleado (Priority: P1) 🎯 MVP

**Goal**: Un usuario activo ve el menú del día y registra su único pedido (plato + acompañamiento cuando
corresponde), con todas las reglas validadas en el backend.

**Independent Test**: Con menú sembrado, iniciar sesión, elegir plato, completar acompañamiento si aplica y
confirmar → 1 pedido `PENDIENTE`; segundo intento, fin de semana, 13:00 y acompañamiento faltante → rechazo.

### Tests for User Story 1

- [ ] T025 [P] [US1] e2e de `POST/PATCH/DELETE /orders/me`: feliz + triste (fin de semana, ≥13:00, 2º pedido, acompañamiento faltante, sin menú, **editar/anular pedido `ENVIADO` rechazado** [FR-018]) en `apps/api/test/orders.e2e-spec.ts`
- [X] T026 [P] [US1] unit de reglas de `OrdersService` (unicidad, corte, acompañamiento, ≥1 menú) en `apps/api/src/orders/orders.service.spec.ts`

### Implementation for User Story 1

- [X] T027 [US1] Lado lectura del menú: `GET /menu?fecha=` agrupado por proveedor (solo con menú) en `apps/api/src/menu/menu.controller.ts` + `menu.read.service.ts`
- [X] T028 [P] [US1] DTOs de pedido con validación (acompañamiento trim/no-vacío/≤100) en `apps/api/src/orders/dto/`
- [X] T029 [US1] `OrdersService` con reglas (índice único `(usuarioId, fecha)`, fin de semana, corte 13:00, acompañamiento requerido, ≥1 menú, transacción) en `apps/api/src/orders/orders.service.ts`
- [X] T030 [US1] Endpoints `GET/POST/PATCH/DELETE /orders/me` en `apps/api/src/orders/orders.controller.ts`
- [X] T031 [P] [US1] Web: página `pedir` (menú por proveedor, selección, acompañamiento, confirmar) en `apps/web/src/app/pedir/page.tsx`
- [X] T032 [P] [US1] Web: editar/anular el propio pedido `PENDIENTE` en `apps/web/src/app/pedir/`
- [X] T033 [US1] Conectar mensajes de error (409/422) a la UI de pedido

**Checkpoint**: US1 funcional y testeable de forma independiente (MVP).

---

## Phase 4: User Story 2 - Consolidar y enviar a cada proveedor (Priority: P1)

**Goal**: La Secretaría ve el consolidado por proveedor y envía por correo a cada uno solo sus pedidos,
marcándolos como enviados.

**Independent Test**: Con pedidos sembrados, enviar a un proveedor → recibe solo sus pedidos, quedan
`ENVIADO`; fallo SMTP → error visible sin marcar, sin afectar a otros proveedores.

### Tests for User Story 2

- [ ] T034 [P] [US2] e2e de consolidación y envío (por proveedor, marca `ENVIADO`, fallo SMTP sin marcar, aislamiento, **envío sin pendientes = no-op: sin correo ni `Envio`**) en `apps/api/test/consolidation.e2e-spec.ts`
- [X] T035 [P] [US2] unit de `MailService` (contenido: empleado/plato/acompañamiento; escape HTML; neutralización CRLF en **todos** los campos del correo, incluido el nombre del empleado) en `apps/api/src/mail/mail.service.spec.ts`

### Implementation for User Story 2

- [X] T036 [US2] Módulo de correo (`nodemailer` SMTP con TLS, plantilla con escape + neutralización CRLF) en `apps/api/src/mail/mail.service.ts`
- [X] T037 [US2] `GET /consolidation?fecha=` agrupado por proveedor (empleado, plato, acompañamiento, estado) en `apps/api/src/consolidation/consolidation.controller.ts`
- [X] T038 [US2] `POST /consolidation/send` transaccional: envía `PENDIENTE` del proveedor, marca `ENVIADO`+`enviadoAt`, crea `Envio` determinando el tipo **por proveedor** (primer envío = `PRINCIPAL`; los siguientes = `ADICIONAL`) en `apps/api/src/consolidation/consolidation.service.ts`
- [X] T039 [US2] Manejo de fallo SMTP (`502`, sin marcar, aislamiento por proveedor) en `apps/api/src/consolidation/consolidation.service.ts`
- [X] T040 [P] [US2] Web: página consolidado de Secretaría + botón enviar + confirmación/error en `apps/web/src/app/secretaria/consolidado/page.tsx`

**Checkpoint**: US1 + US2 funcionan de forma independiente (captura + envío).

---

## Phase 5: User Story 7 - Seguridad de acceso y sesión (Priority: P1)

**Goal**: Todo acceso autenticado y autorizado por rol en el backend; sesión con expiración deslizante,
revocación inmediata, anti-enumeración y CSRF.

**Independent Test**: Sin sesión → `401`; empleado a endpoint de otro rol → `403`; tras 15 min → `401`;
usuario desactivado con sesión activa → `401` inmediato; operación mutante sin CSRF → rechazada.

### Tests for User Story 7

- [ ] T041 [P] [US7] e2e de seguridad: `401` sin sesión, `403` cruce de rol, aislamiento de pedido propio, expiración 15 min, revocación, CSRF requerido, anti-enumeración en `apps/api/test/security.e2e-spec.ts`

### Implementation for User Story 7

- [ ] T042 [US7] Aplicar guard de auth global y proteger todas las rutas (excepto login/csrf) en `apps/api/src/app.module.ts`
- [ ] T043 [US7] Expiración deslizante (15 min de inactividad) en `apps/api/src/auth/session.service.ts`
- [ ] T044 [US7] Verificar respuesta de login genérica (anti-enumeración) y filtro de errores sin fugas en `apps/api/src/auth/auth.controller.ts`
- [ ] T045 [US7] Aplicar CSRF a todos los endpoints que cambian estado en `apps/api/src/auth/csrf.guard.ts`
- [ ] T046 [P] [US7] Web: manejo de expiración (redirigir a login ante `401`) + botón cerrar sesión en `apps/web/src/lib/api-client.ts`

**Checkpoint**: Postura de seguridad verificable de forma independiente.

---

## Phase 6: User Story 8 - Depuración diaria (Priority: P1)

**Goal**: Borrado automático de menús/pedidos/envíos a las 15:00 (GMT-3) con reintentos y registro; y
ejecución manual del Administrador con historial.

**Independent Test**: Con datos cargados, disparar la depuración → se eliminan menús/pedidos/envíos y se
registra; `POST /purge` solo Admin (no-Admin `403`); `GET /purge/history` lista ejecuciones.

### Tests for User Story 8

- [ ] T047 [P] [US8] e2e de depuración (borrado del día + previos, manual solo Admin `403`, historial, reintentos/registro, y **aserción de que completa dentro de los 15 min** — SC-007/RNF-06) en `apps/api/test/purge.e2e-spec.ts`

### Implementation for User Story 8

- [ ] T048 [US8] `PurgeService` transaccional: borra `OpcionPlato`/`Pedido`/`Envio` del día y previos no depurados; crea `RegistroDepuracion` en `apps/api/src/purge/purge.service.ts`
- [ ] T049 [US8] Cron 15:00 GMT-3 con ≥3 reintentos + registro en `apps/api/src/purge/purge.scheduler.ts`
- [ ] T050 [US8] `POST /purge` (manual, ADMIN) + `GET /purge/history` en `apps/api/src/purge/purge.controller.ts`
- [ ] T051 [P] [US8] Web: historial de depuraciones + disparo manual (Admin) en `apps/web/src/app/admin/depuracion/page.tsx`
- [ ] T052 [US8] Verificar que `RegistroDepuracion` y `Session` sobreviven a la depuración (test) en `apps/api/test/purge.e2e-spec.ts`

**Checkpoint**: Las 4 historias P1 (US1, US2, US7, US8) funcionan de forma independiente.

---

## Phase 7: User Story 3 - Tardíos, corte y envíos adicionales (Priority: P2)

**Goal**: Pedidos tardíos hasta las 13:00, corte que congela solo acciones del empleado, y envíos
adicionales identificados como "PEDIDO ADICIONAL".

**Independent Test**: Tras envío principal y antes de 13:00, registrar tardío → aceptado; a las 13:00,
carga/edición/baja del empleado → rechazada, envío de Secretaría sigue disponible; envío adicional → solo
nuevos, "PEDIDO ADICIONAL" en el asunto.

### Tests for User Story 3

- [ ] T053 [P] [US3] e2e de tardíos (<13:00), corte 13:00 (solo empleado), y adicional (solo nuevos + asunto) en `apps/api/test/late-orders.e2e-spec.ts`

### Implementation for User Story 3

- [ ] T054 [US3] Reforzar corte 13:00 para acciones del empleado, dejando envío/baja de Secretaría disponibles en `apps/api/src/orders/orders.service.ts`
- [ ] T055 [US3] Marcado "PEDIDO ADICIONAL" en el asunto del correo cuando el `Envio` es `ADICIONAL` (la detección principal/adicional ya vive en T038) en `apps/api/src/consolidation/consolidation.service.ts` y `apps/api/src/mail/mail.service.ts`
- [ ] T056 [P] [US3] Web: mensajes de cierre de horario + acción de envío adicional en `apps/web/src/app/secretaria/consolidado/`

**Checkpoint**: US3 funcional sobre US1/US2 sin romperlas.

---

## Phase 8: User Story 4 - Gestión de menús del día (Priority: P2)

**Goal**: La Secretaría carga/edita/elimina opciones de plato por proveedor con marca de acompañamiento,
respetando la integridad ante pedidos asociados.

**Independent Test**: Crear varias opciones → visibles; editar/eliminar opción con pedidos asociados →
`409`.

### Tests for User Story 4

- [ ] T057 [P] [US4] e2e de menú (crear/editar/eliminar; bloqueo con pedidos asociados) en `apps/api/test/menu.e2e-spec.ts`

### Implementation for User Story 4

- [ ] T058 [US4] DTOs + `MenuService` (crear opción, `llevaAcompanamiento`, escape de descripción) en `apps/api/src/menu/menu.service.ts`
- [ ] T059 [US4] `POST/PATCH/DELETE /menu/options` (bloquear edición/borrado si hay pedidos asociados) en `apps/api/src/menu/menu.controller.ts`
- [ ] T060 [P] [US4] Web: página de carga/edición de menú de Secretaría en `apps/web/src/app/secretaria/menu/page.tsx`

**Checkpoint**: US4 funcional; la carga de menú deja de depender del seed.

---

## Phase 9: User Story 5 - Baja de pedidos por la Secretaría (Priority: P2)

**Goal**: La Secretaría elimina pedidos `PENDIENTE` (incluso tras 13:00), rehabilitando al empleado; los
`ENVIADO` no se dan de baja.

**Independent Test**: Baja de `PENDIENTE` → borrado y el empleado puede recrear; baja de `ENVIADO` → `409`.

### Tests for User Story 5

- [ ] T061 [P] [US5] e2e de baja por Secretaría (pendiente → rehabilita; enviado → `409`; disponible tras 13:00) en `apps/api/test/order-removal.e2e-spec.ts`

### Implementation for User Story 5

- [ ] T062 [US5] `DELETE /consolidation/orders/:id` (solo `PENDIENTE`, disponible tras el corte) en `apps/api/src/consolidation/consolidation.controller.ts`
- [ ] T063 [P] [US5] Web: control de baja de pedido en la página consolidado en `apps/web/src/app/secretaria/consolidado/`

**Checkpoint**: US5 funcional sin afectar el envío.

---

## Phase 10: User Story 6 - Administración de usuarios, roles y proveedores (Priority: P2)

**Goal**: El Administrador gestiona usuarios (rol, activación, contraseña) sin auto-bloqueo, y proveedores
(cantidad determinada por él), con revocación de sesión al cambiar usuarios.

**Independent Test**: Crear usuario y loguear; desactivar → no puede entrar; auto-desactivarse/eliminarse →
rechazado; cambiar correo de proveedor → afecta envíos; eliminar proveedor con datos → `409`.

### Tests for User Story 6

- [ ] T064 [P] [US6] e2e de usuarios (CRUD, anti auto-bloqueo, revocación, **rechazo de contraseña < 6** [FR-030], **unicidad de email case-insensitive** [FR-001/D1]) y proveedores (CRUD, bloqueo de borrado con datos) en `apps/api/test/admin.e2e-spec.ts`

### Implementation for User Story 6

- [ ] T065 [US6] Módulo Usuarios: CRUD + rol + activar/desactivar + guarda anti auto-bloqueo + fijar/restablecer contraseña en `apps/api/src/users/users.service.ts`
- [ ] T066 [US6] Wiring de revocación de sesión (desactivar/eliminar/cambio de rol/reset) → `session.service.revoke()` en `apps/api/src/users/users.service.ts`
- [ ] T067 [US6] Endpoints de usuarios (`/users`) con guards ADMIN en `apps/api/src/users/users.controller.ts`
- [ ] T068 [US6] Módulo Proveedores: CRUD + bloqueo de borrado si hay menús/pedidos asociados en `apps/api/src/providers/providers.service.ts`
- [ ] T069 [US6] Endpoints de proveedores (`/providers`) con guards ADMIN en `apps/api/src/providers/providers.controller.ts`
- [ ] T070 [US6] Normalización/unicidad case-insensitive del email + mín. 6 en DTOs en `apps/api/src/users/dto/`
- [ ] T071 [P] [US6] Web: página admin de usuarios en `apps/web/src/app/admin/usuarios/page.tsx`
- [ ] T072 [P] [US6] Web: página admin de proveedores en `apps/web/src/app/admin/proveedores/page.tsx`

**Checkpoint**: Todas las historias (US1–US8) funcionan de forma independiente.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Endurecimiento y cierre transversal.

- [ ] T073 [P] Hardening: verificar HTTPS/TLS SMTP/`sslmode` DB y cookie `secure` en prod en `apps/api/src/config/`
- [ ] T074 [P] Chequeo de rendimiento: < 3 s p95 en menú/pedido con 50 usuarios concurrentes (prueba de carga)
- [ ] T075 [P] Cobertura de logging de eventos de seguridad (logins, denegaciones, cambios de admin) en `apps/api/src/common/`
- [ ] T076 [P] Actualizar docs/validación en `specs/001-solicitud-almuerzo/quickstart.md`
- [ ] T077 Ejecutar todos los escenarios de `quickstart.md` (validación end-to-end)
- [ ] T078 [P] Tests unitarios extra de bordes (límites de zona horaria GMT-3, escape/CRLF) en `apps/api/src/common/`
- [ ] T079 Limpieza/refactor + garantizar TS strict sin `any`
- [ ] T080 Verificar `pnpm -r test` en verde con cobertura de caminos tristes
- [ ] T081 [P] Endpoint de salud `GET /health` y guía de monitoreo de disponibilidad (SC-005, objetivo de infra) en `apps/api/src/health/health.controller.ts`
- [ ] T082 [P] Test de escape de render en la UI para texto libre (acompañamiento/descripción con HTML/comillas) — cierra la mitad de UI de FR-034 en `apps/web/tests/escape.test.tsx`
- [ ] T083 Verificación de restricción "solo correo" (FR-033): confirmar que no existen configuración ni endpoints de otros canales (SMS/push/WhatsApp) — restricción arquitectónica, no test funcional

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias.
- **Historias P1 (Phases 3–6: US1, US2, US7, US8)**: dependen de Foundational; testeables con datos del seed.
- **Historias P2 (Phases 7–10: US3, US4, US5, US6)**: dependen de Foundational.
- **Polish (Phase 11)**: depende de las historias deseadas completas.

### User Story Dependencies (lógicas; el seed permite probar cada una aislada)

- **US1 (P1)**: solo Foundational.
- **US2 (P1)**: usa pedidos (seed o US1) para probar el envío.
- **US7 (P1)**: refuerza infraestructura de auth de Foundational; transversal.
- **US8 (P1)**: solo Foundational.
- **US3 (P2)**: extiende US1 (corte) y US2 (adicionales).
- **US4 (P2)**: independiente (reemplaza el menú sembrado por carga real).
- **US5 (P2)**: usa pedidos (seed o US1).
- **US6 (P2)**: independiente; su wiring de revocación es verificado por US7.

### Within Each User Story

- Tests primero (deben fallar antes de implementar) → Modelos → Servicios → Endpoints → UI/Integración.

### Parallel Opportunities

- Setup: T002–T008 marcados [P] en paralelo.
- Foundational: T012, T014, T015, T016, T017, T020, T021, T023, T024 en paralelo (archivos distintos).
- Con Foundational lista, las 4 historias P1 pueden encararse en paralelo por distintas personas.
- Dentro de una historia, tests [P] y páginas web [P] en paralelo con la lógica de API.

---

## Parallel Example: User Story 1

```bash
# Tests de US1 en paralelo:
Task: "T025 e2e de /orders en apps/api/test/orders.e2e-spec.ts"
Task: "T026 unit de OrdersService en apps/api/src/orders/orders.service.spec.ts"

# UI de US1 en paralelo con la lógica de API:
Task: "T031 Web página pedir en apps/web/src/app/pedir/page.tsx"
Task: "T028 DTOs de pedido en apps/api/src/orders/dto/"
```

---

## Implementation Strategy

### MVP First (solo User Story 1)

1. Completar Fase 1 (Setup) y Fase 2 (Foundational — crítica).
2. Completar Fase 3 (US1: pedido del empleado).
3. **PARAR y VALIDAR**: probar US1 de forma independiente con el seed.
4. Demo del MVP (captura confiable de pedidos).

### Incremental Delivery

1. Setup + Foundational → base lista.
2. + US1 (MVP) → captura de pedidos.
3. + US2 → envío consolidado por proveedor.
4. + US7 → postura de seguridad verificada.
5. + US8 → depuración diaria y respaldo manual.
6. + US3, US4, US5, US6 → tardíos/adicionales, gestión de menú, baja por Secretaría, administración.
7. Cada historia agrega valor sin romper las previas.

### Parallel Team Strategy

Con Foundational lista: Dev A → US1, Dev B → US2, Dev C → US7, Dev D → US8; luego P2 en paralelo.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- [Story] mapea la tarea a su historia para trazabilidad.
- Los tests deben fallar antes de implementar (Principio X).
- Commit tras cada tarea o grupo lógico; parar en cada checkpoint para validar la historia.
- Evitar: tareas vagas, conflictos en el mismo archivo, dependencias cruzadas que rompan la independencia.
