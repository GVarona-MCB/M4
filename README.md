# Vianda

App web interna de pedido de almuerzo. La Secretaría carga el menú diario de los
proveedores (la cantidad la fija el Administrador), cada empleado presente elige
su plato, y la Secretaría consolida y envía los pedidos a cada proveedor por
correo. Reemplaza el proceso manual de Outlook + Excel.

> **Todo el proyecto corre en Docker.** No necesitás instalar Node, pnpm ni
> PostgreSQL: `docker compose` levanta la base de datos, la API y la Web juntas.

## Arranque rápido

Requisito único: **Docker** (con Docker Compose v2).

```bash
docker compose up -d --build
```

Esto levanta cuatro contenedores:

| Servicio | Contenedor       | URL / puerto              |
| -------- | ---------------- | ------------------------- |
| Web      | `vianda-web`     | http://localhost:3002     |
| API      | `vianda-api`     | http://localhost:3001     |
| DB       | `vianda-db`      | PostgreSQL en host `5433` |
| MailHog  | `vianda-mailhog` | http://localhost:8025     |

Al arrancar, la API aplica las migraciones y siembra datos de prueba de forma
idempotente. Entrá por **http://localhost:3002/login**.

Usuarios sembrados (contraseña `secret123`):

- `admin@empresa.local` — Administrador
- `secretaria@empresa.local` — Secretaría
- `empleado@empresa.local` — Empleado

Para bajar todo:

```bash
docker compose down       # detiene y elimina los contenedores
docker compose down -v    # además borra el volumen de la base de datos
```

> Los puertos (API `3001`, Web `3002`, DB host `5433`) están fijados a propósito
> para no chocar con n8n (`5678` / `3000` / `5432`).

## Correo (SMTP)

El correo es el **único** canal de notificación. Por defecto el stack incluye
**MailHog**, un servidor SMTP de prueba que **captura** los correos en vez de
enviarlos de verdad: no requiere credenciales y evita filtrar cuentas reales.
Los correos que la Secretaría envía a los proveedores quedan visibles en
**http://localhost:8025**.

Para enviar a buzones reales (Gmail, Microsoft 365, etc.), apuntá las variables
`SMTP_*` del servicio `api` a tu servidor y agregá `SMTP_USER` / `SMTP_PASS`.
Nunca pongas la contraseña en `docker-compose.yml` (se versiona en el repo):
usá un `.env` local (ya ignorado por git) y leelo con `${SMTP_PASS}`.

## Stack

- Node.js 22 LTS · pnpm 11 · TypeScript 5
- Front: **Next.js 15** (React) — `apps/web`
- Back: **NestJS 11** — `apps/api`
- Base de datos: **PostgreSQL 16** con **Prisma** (ORM)
- Sesión: cookie `HttpOnly` (SameSite=Lax), expira a los 15 min de inactividad;
  `secure=true` en producción (HTTPS)
- Monorepo pnpm

## Desarrollo con hot-reload (opcional)

Solo si vas a editar código con recarga en caliente. Requiere **Node 22** y
**pnpm 11** locales; la base de datos sigue en Docker:

```bash
pnpm install                              # dependencias
docker compose up -d db                   # solo la base
pnpm --filter api prisma migrate dev      # migraciones + Prisma Client
pnpm --filter api db:seed                 # datos de prueba
pnpm --filter api start:dev               # API (NestJS)
pnpm --filter web dev                     # Web (Next.js)
```

El `.env` se lee al arrancar: tras cambiarlo, reiniciá la API. Partí de
`.env.example` como plantilla.

## Tests

```bash
pnpm -r test                # unit (todos los paquetes)
pnpm --filter api test:e2e  # e2e de la API (Supertest)
```

## Documentación

- Guía para agentes / convenciones: [`AGENTS.md`](./AGENTS.md)
- Especificación funcional: [`PRD-Sistema-Solicitud-Almuerzo.md`](./PRD-Sistema-Solicitud-Almuerzo.md)
- Diseño y artefactos (Spec Kit): [`specs/001-solicitud-almuerzo/`](./specs/001-solicitud-almuerzo/)
