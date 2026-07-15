# Vianda — AGENTS.md

## Propósito
App web interna de pedido de almuerzo: la Secretaría carga el menú diario de los
proveedores (la cantidad la determina el Administrador), cada empleado presente
elige su plato y la Secretaría consolida y envía los pedidos a cada proveedor por
correo. Reemplaza el proceso manual de Outlook + Excel.

## Stack
- Node.js 22 LTS · pnpm 11 · TypeScript 5
- Front: Next.js 15 (React)
- Back: NestJS 11
- Base de datos: PostgreSQL 16 con Prisma (ORM)
- Sesión: cookie `HttpOnly` (SameSite=Lax) que expira a los 15 min de
  inactividad (RNF-02); `secure=true` en producción (HTTPS).
- Correo: SMTP con TLS (único canal de notificación)
- Estructura: monorepo pnpm con `apps/web` (front) y `apps/api` (back)
- Puertos fijos (elegidos para no chocar con n8n → 5678/3000/5432):
  API `3001` · Web `3002` · PostgreSQL host `5433`

## Cómo correr

### Opción A — Todo en Docker (recomendada para levantar rápido)
- `docker compose up -d --build` → levanta **db + api + web**. La API aplica
  migraciones y siembra datos de prueba al arrancar.
- Entrar a la Web: http://localhost:3002/login
- Bajar todo: `docker compose down` (agregar `-v` para borrar también la base).

### Opción B — Híbrido (mejor para desarrollar, con hot-reload)
- Instalar dependencias: `pnpm install`
- Levantar solo la base: `docker compose up -d db`
- Migraciones + Prisma Client: `pnpm --filter api prisma migrate dev`
- Datos de prueba (usuarios + proveedores): `pnpm --filter api db:seed`
- Back en dev (NestJS): `pnpm --filter api start:dev`
- Front en dev (Next.js): `pnpm --filter web dev`
- El `.env` se lee al arrancar: tras cambiarlo, reiniciar la API.

Tests: `pnpm -r test` (unit) · `pnpm --filter api test:e2e` (e2e).
Usuarios sembrados (contraseña `secret123`): `admin@`, `secretaria@`, `empleado@empresa.local`.

## Qué NO hacer
- No aceptar pedidos fuera de las reglas del PRD: nada sábados ni domingos, nada
  a partir de las 13:00 hs, y un único pedido por empleado por día
  (RF-19, RF-21, RF-27).
- No conservar menús ni pedidos del día pasadas las 15:00 hs: la depuración
  automática es obligatoria e irreversible (RF-29).
- No notificar por ningún canal que no sea correo/SMTP, ni procesar pagos o
  delivery (fuera de alcance del PRD).
- No guardar la sesión ni tokens en `localStorage` ni en cookies sin `HttpOnly`:
  la sesión va siempre en cookie `HttpOnly` (evita robo por XSS).
