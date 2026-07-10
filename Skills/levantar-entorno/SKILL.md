---
name: levantar-entorno
description: >-
  Se usa cuando hay que arrancar la app Vianda en desarrollo (base de datos +
  API + front), correr migraciones/seed, o diagnosticar por qué no levanta.
  Documenta los puertos fijos, cómo iniciar PostgreSQL en Docker aislado de n8n,
  los comandos de dev, y los tropiezos propios de WSL (arranque lento, pnpm en
  ~/.local/bin, permisos de Docker).
---

# Levantar el entorno (Vianda)

Guía para poner la app a andar en desarrollo y resolver los problemas conocidos.
El stack y las reglas duras están en `AGENTS.md`.

## Puertos fijos

| Servicio | Puerto | Nota |
|----------|--------|------|
| API (NestJS) | `3001` | |
| Web (Next.js) | `3002` | fijado con `next dev -p 3002` |
| PostgreSQL (host) | `5433` | contenedor `vianda-postgres` |

Elegidos para **no chocar con n8n**, que usa `5678` (web), `3000` (html-renderer)
y `5432` (su Postgres interno). Nunca reutilizar esos puertos.

## Orden de arranque

1. **Base de datos** (Docker):
   ```bash
   docker compose up -d          # levanta solo vianda-postgres
   ```
2. **Migraciones + cliente Prisma** (primera vez o tras cambiar el schema):
   ```bash
   pnpm --filter api prisma migrate dev
   ```
3. **Usuarios de prueba** (seed, primera vez):
   ```bash
   pnpm --filter api db:seed
   ```
4. **API** y **Web** (cada uno en su terminal):
   ```bash
   pnpm --filter api start:dev   # http://localhost:3001
   pnpm --filter web dev         # http://localhost:3002
   ```

Entrar por `http://localhost:3002` → redirige a `/login` si no hay sesión.

## Usuarios de prueba (seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@vianda.local` | `admin123` |
| Secretaría | `secretaria@vianda.local` | `secre123` |
| Empleado | `empleado@vianda.local` | `empleado123` |

Son solo para desarrollo. No usar estas credenciales en producción.

## Variables de entorno y correo

Viven en `apps/api/.env` (no versionado; ver `.env.example`). Se leen **al
arrancar**: tras cambiarlas hay que **reiniciar la API**.

- `DATABASE_URL` — conexión a la base (puerto 5433).
- `SESSION_SECRET` — firma de la cookie de sesión.
- `PEDIDOS_CORTE_HORA` — hora de corte de pedidos en GMT-3 (default 13). Subila
  (p. ej. 23) para poder cargar pedidos fuera de horario en desarrollo.
- `SMTP_*` — si están vacías, el correo usa **Ethereal** (cuenta de prueba: no
  envía nada real, devuelve un link de vista previa). Con SMTP real, se usa ese.

## Aislamiento de n8n (regla dura)

El usuario corre n8n en el mismo Docker. **Nunca** tocar sus contenedores,
volúmenes ni puertos. Operar únicamente el proyecto compose `vianda`:
- `docker compose up -d` / `docker compose stop` (solo `vianda-postgres`).
- Prohibido `docker compose down -v` global o cualquier comando que apunte a n8n.
- Para inspeccionar sin riesgo: `docker ps` (solo lista, no modifica).

## Tropiezos conocidos de WSL

- **Docker sin permiso** (`permission denied` en `/var/run/docker.sock`): el
  usuario está en el grupo `docker` pero la sesión no lo tomó. Ejecutar con el
  grupo activo: `sg docker -c 'docker ...'`. No requiere sudo.
- **Docker no aparece en WSL**: falta activar Docker Desktop → Settings →
  Resources → WSL Integration → la distro. Es acción del usuario (GUI).
- **pnpm no encontrado**: está instalado en `~/.local/bin` (vía corepack sin
  sudo). Asegurar el PATH: `export PATH="$HOME/.local/bin:$PATH"`.
- **La API/Web tarda en levantar**: leer desde `/mnt/c` (disco de Windows) es
  lento; el proceso puede quedar en estado `D` unos segundos. Esperar y
  reintentar el health check en vez de asumir que falló.
- **Matar servidores**: no usar `pkill -f 'node dist/main.js'` (el patrón también
  coincide con el shell que lo ejecuta y lo mata). Lo más confiable es matar por
  puerto: `kill $(ss -ltnp | grep ':3001' | grep -oP 'pid=\K[0-9]+')`.
- **Cambié el `.env` y no tuvo efecto**: la API lee el `.env` solo al arrancar;
  hay que **reiniciarla** para que tome el nuevo valor (p. ej. `PEDIDOS_CORTE_HORA`).

## Verificación rápida

```bash
curl -s http://localhost:3001/health         # {"status":"ok",...}
curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/login   # 200
```
