# Implementation Plan: Sistema de Solicitud de Almuerzo

**Branch**: `001-solicitud-almuerzo` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-solicitud-almuerzo/spec.md`

## Summary

App web interna para pedir el almuerzo diario: la Secretaría carga el menú de los proveedores (cantidad
determinada por el Administrador), cada usuario presente registra su único pedido del día (plato +
acompañamiento cuando corresponde) y la Secretaría consolida y envía por correo a cada proveedor solo sus
pedidos. Reglas de negocio estrictas: nada de fines de semana, corte de pedidos a las 13:00 y depuración
irreversible de menús y pedidos a las 15:00 (GMT-3). Enfoque técnico: monorepo pnpm con **Next.js 15**
(`apps/web`) y **NestJS 11** (`apps/api`), **PostgreSQL 16 + Prisma**, sesión en cookie `HttpOnly` con
almacenamiento de sesión del lado del servidor (revocable), envío por **SMTP con TLS**, y un **job
programado** para la depuración de las 15:00 con reintentos y registro.

## Technical Context

**Language/Version**: TypeScript 5 sobre Node.js 22 LTS · pnpm 11

**Primary Dependencies**:
- Front: Next.js 15 (React), App Router.
- Back: NestJS 11 (`@nestjs/schedule` para el cron de depuración, `@nestjs/config`).
- ORM: Prisma (PostgreSQL 16).
- Correo: `nodemailer` (SMTP con TLS).
- Seguridad: `argon2` (hash de contraseñas), `csrf-csrf`/token sincronizador (anti-CSRF), sesión propia en
  tabla (opaca en cookie `HttpOnly`).
- Validación: `class-validator` + `class-transformer` (DTOs de NestJS).

**Storage**: PostgreSQL 16 (host `5433`) vía Prisma. Sesiones persistidas en tabla para permitir
revocación inmediata (FR-008). Datos del día (menús/pedidos) efímeros: depuración a las 15:00.

**Testing**: Jest + Supertest en `apps/api` (unit + e2e de reglas de negocio y autorización); Vitest +
React Testing Library en `apps/web`; ejecución conjunta con `pnpm -r test`.

**Target Platform**: Servidor Linux (contenedores Docker); navegadores Chrome/Edge/Firefox (últimas 2
versiones), responsive 360–1920 px.

**Project Type**: Aplicación web (monorepo: `apps/web` + `apps/api`).

**Performance Goals**: Operaciones de carga de menú y pedido < 3 s p95 (SC-004) con 50 usuarios
concurrentes (RNF-05); disponibilidad ≥ 99 % en franja hábil (SC-005).

**Constraints**:
- Puertos fijos: API `3001` · Web `3002` · PostgreSQL host `5433`.
- Sesión: cookie `HttpOnly`, `SameSite=Lax`, `secure=true` en producción; expiración deslizante server-side
  a los 15 min de inactividad (cualquier request autenticado reinicia el timer).
- Zona horaria de reglas de negocio: `America/Argentina/Buenos_Aires` (GMT-3, sin DST). Timestamps en UTC.
- Depuración 15:00: completar dentro de 15 min, ≥ 3 reintentos, registro de cada ejecución (RNF-06).
- Transporte cifrado: HTTPS (app) y TLS (SMTP y conexión a la DB).
- Único canal de notificación: correo. Sin pagos/delivery/asistencia/stock.

**Scale/Scope**: ~50 usuarios concurrentes en la franja pico; app interna pequeña; ~8 entidades; N
proveedores gestionados por el Administrador; ~10 pantallas.

## Constitution Check

*GATE: Debe pasar antes de la investigación de Fase 0. Re-evaluar tras el diseño de Fase 1.*

| Principio | Cómo lo satisface el diseño | Gate |
|---|---|---|
| I. Autenticación y sesión endurecidas | Cookie `HttpOnly`+`SameSite=Lax`+`secure` (prod); sesión opaca en tabla, expiración deslizante 15 min, hash `argon2` (mín. 6), logout y revocación inmediata. | ✅ |
| II. Autorización por rol en backend | Guards de NestJS por rol en el 100 % de endpoints; front solo oculta por UX. Aislamiento por dueño del pedido. | ✅ |
| III. Reglas de negocio validadas en el servidor | Validación de corte 13:00, fin de semana, unicidad diaria, acompañamiento, integridad de platos/pedidos en la API (DTOs + servicios), no solo en el front. | ✅ |
| IV. Depuración diaria obligatoria e irreversible | Cron `@nestjs/schedule` 15:00 GMT-3, ≥3 reintentos, `DepuracionLog`; ejecución manual del Admin; sin respaldos que la evadan. | ✅ |
| V. Correo/SMTP único canal, alcance cerrado | `nodemailer` con TLS; por proveedor; sin otros canales; sin pagos/delivery/stock. | ✅ |
| VI. Tipado estricto y modelo único (Prisma) | TS `strict`; tipos derivados de Prisma; DTOs validados con `class-validator`. | ✅ |
| VII. Manejo explícito de errores y bordes | Filtro de excepciones de NestJS, mensajes claros sin filtrar internos; manejo de fallo SMTP con reintento visible. | ✅ |
| VIII. Límites del monorepo | `apps/web` y `apps/api` se comunican solo por HTTP; dominio en la API; puertos fijos 3001/3002/5433. | ✅ |
| IX. Configuración por entorno, secretos fuera del repo | `@nestjs/config` + `.env` (git-ignored); `.env.example` versionado. | ✅ |
| X. Cada regla del PRD con test (feliz y triste) | Suite Jest/e2e que cubre rechazo de fin de semana, 13:01, 2º pedido, acompañamiento faltante, acceso cruzado, y depuración 15:00. | ✅ |

**Resultado**: PASS. Sin violaciones; no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-solicitud-almuerzo/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Fase 0 (/speckit-plan)
├── data-model.md        # Fase 1 (/speckit-plan)
├── quickstart.md        # Fase 1 (/speckit-plan)
├── contracts/           # Fase 1 (/speckit-plan)
│   └── rest-api.md
├── checklists/
│   ├── requirements.md
│   ├── requirements-quality.md
│   └── security.md
└── tasks.md             # Fase 2 (/speckit-tasks - NO lo crea /speckit-plan)
```

### Source Code (repository root)

```text
apps/
├── api/                         # NestJS 11 (puerto 3001)
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo único de datos
│   │   ├── migrations/
│   │   └── seed.ts              # db:seed (usuarios + proveedores de prueba)
│   ├── src/
│   │   ├── auth/                # login/logout, sesión, guards, CSRF
│   │   ├── users/              # CRUD usuarios (Admin), roles, activación
│   │   ├── providers/          # CRUD proveedores (Admin)
│   │   ├── menu/               # carga/edición de menú del día y opciones de plato
│   │   ├── orders/             # pedido del empleado (crear/editar/anular), reglas de corte
│   │   ├── consolidation/      # consolidado + envío por proveedor (SMTP), envíos adicionales
│   │   ├── purge/              # job 15:00 + ejecución manual + historial
│   │   ├── common/             # guards de rol, filtros de excepción, pipes, util de zona horaria
│   │   └── main.ts
│   └── test/                   # e2e (Supertest) de reglas y autorización
└── web/                        # Next.js 15 (puerto 3002)
    ├── src/
    │   ├── app/                # App Router: login, pedir, secretaría (menú/consolidado), admin
    │   ├── components/
    │   └── lib/                # cliente HTTP (con credenciales + header CSRF)
    └── tests/

docker-compose.yml               # PostgreSQL 16 (host 5433)
pnpm-workspace.yaml
.env.example
```

**Structure Decision**: Aplicación web en monorepo pnpm con dos apps desplegables (`apps/web`,
`apps/api`) que se comunican solo por HTTP (Principio VIII). La lógica de dominio y todas las reglas del PRD
viven en `apps/api`; `apps/web` es cliente. Prisma como fuente única del modelo de datos.

## Complexity Tracking

> No aplica: el Constitution Check pasa sin violaciones, no se requiere justificar complejidad adicional.
