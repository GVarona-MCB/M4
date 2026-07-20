# Contrato REST — API Vianda (`apps/api`, puerto 3001)

**Fase 1** · Fecha: 2026-07-14 · Trazabilidad a FR del [spec.md](../spec.md).

## Convenciones

- Base URL: `http://localhost:3001` (dev). HTTPS en prod.
- **Sesión**: cookie `HttpOnly` `SameSite=Lax` (`secure` en prod). El navegador la envía automáticamente;
  el cliente usa `credentials: 'include'`.
- **CSRF** (FR-035): toda operación que cambia estado (`POST`/`PUT`/`PATCH`/`DELETE`) exige header
  `x-csrf-token`. Token obtenido de `GET /auth/csrf`.
- **Autorización** (FR-003, RNF-08): verificada en el backend por rol en el 100 % de los endpoints (guards).
- **Errores**: JSON `{ "error": { "code": string, "message": string } }`, sin filtrar detalles internos
  (R9). Códigos: `401` no autenticado · `403` sin permiso/regla de negocio de acceso · `404` no existe ·
  `409` conflicto de regla de negocio (fin de semana, corte 13:00, 2º pedido, plato con pedidos, proveedor
  con datos, pedido ya enviado) · `422` validación de campos · `502` fallo aguas arriba (SMTP).
- Roles: `ADMIN`, `SECRETARIA`, `EMPLEADO`. "Autenticado" = cualquiera de los tres.

## Auth

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| GET | `/auth/csrf` | público | Devuelve token CSRF. | FR-035 |
| POST | `/auth/login` | público | `{ email, password }` → crea sesión (cookie). Error genérico sin revelar si el email existe. | FR-001 |
| POST | `/auth/logout` | autenticado | Invalida la sesión actual. | FR-005 |
| GET | `/auth/me` | autenticado | Datos del usuario en sesión (id, nombre, rol). | FR-003 |

## Usuarios (Administrador)

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| GET | `/users` | ADMIN | Lista usuarios. | FR-006 |
| POST | `/users` | ADMIN | Crea usuario `{ email, nombre, rol, password }` (contraseña inicial, mín. 6). | FR-006, FR-030 |
| PATCH | `/users/:id` | ADMIN | Edita datos/rol; opcional `password` (reset). No self-lock. Revoca sesiones activas del usuario afectado. | FR-006, FR-007, FR-008 |
| PATCH | `/users/:id/estado` | ADMIN | Activa/desactiva. No auto-desactivarse. Revoca sesiones si desactiva. | FR-007, FR-008 |
| DELETE | `/users/:id` | ADMIN | Elimina. No auto-eliminarse ni quitarse el rol Admin. Revoca sesiones. | FR-007, FR-008 |

## Proveedores (Administrador)

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| GET | `/providers` | ADMIN, SECRETARIA | Lista proveedores. | FR-009 |
| POST | `/providers` | ADMIN | Crea `{ nombre, correoDestino }`. | FR-009 |
| PATCH | `/providers/:id` | ADMIN | Edita nombre/correo. | FR-009 |
| DELETE | `/providers/:id` | ADMIN | Elimina; `409` si tiene menús o pedidos del día asociados. | FR-009 |

## Menú del día (Secretaría)

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| GET | `/menu?fecha=YYYY-MM-DD` | autenticado | Opciones del día agrupadas por proveedor (solo proveedores con menú). | FR-013, FR-015 |
| POST | `/menu/options` | SECRETARIA | Crea opción `{ proveedorId, descripcion, llevaAcompanamiento }` para hoy. | FR-010, FR-011 |
| PATCH | `/menu/options/:id` | SECRETARIA | Edita opción; `409` si tiene pedidos asociados. | FR-012 |
| DELETE | `/menu/options/:id` | SECRETARIA | Elimina opción; `409` si tiene pedidos asociados. | FR-012 |

## Pedido del empleado (cualquier usuario activo)

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| GET | `/orders/me` | autenticado | Pedido propio del día (o **200 con cuerpo vacío** si aún no pidió). | FR-004 |
| POST | `/orders/me` | autenticado | Crea `{ opcionPlatoId, acompanamiento? }`. `409` si: fin de semana (FR-019/-021 negocio), ≥13:00, ya tiene pedido, sin menú; `422` si falta acompañamiento requerido. | FR-014..FR-019, FR-024 |
| PATCH | `/orders/me` | autenticado | Edita el propio pedido solo si `PENDIENTE` y <13:00. | FR-018, FR-025 |
| DELETE | `/orders/me` | autenticado | Anula el propio pedido solo si `PENDIENTE` y <13:00. | FR-025 |

> El sistema evalúa fin de semana / corte 13:00 / "día" en GMT-3 (FR-032). Un `EMPLEADO` solo opera su
> propio pedido; ver/editar otro → `403` (FR-004).

## Consolidación y envío (Secretaría)

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| GET | `/consolidation?fecha=YYYY-MM-DD` | SECRETARIA | Pedidos del día agrupados por proveedor (empleado, plato, acompañamiento, estado). | FR-020 |
| POST | `/consolidation/send` | SECRETARIA | `{ proveedorId }` → envía por SMTP los `PENDIENTE` de ese proveedor; marca `ENVIADO`; crea `Envio` (`PRINCIPAL`/`ADICIONAL`). Disponible tras 13:00. Correo con "PEDIDO ADICIONAL" en el asunto si adicional. Si el proveedor **no tiene pedidos `PENDIENTE`**, es **no-op**: no envía correo ni crea `Envio`, y responde `200` indicando que no hay pedidos nuevos. `502` si SMTP falla (sin marcar). | FR-021..FR-026 |
| DELETE | `/consolidation/orders/:id` | SECRETARIA | Da de baja el pedido de un empleado si `PENDIENTE` (disponible tras 13:00); `409` si ya `ENVIADO`. | FR-023, FR-025 |

## Depuración (Administrador / sistema)

| Método | Ruta | Rol | Descripción | FR |
|---|---|---|---|---|
| POST | `/purge` | ADMIN | Ejecuta la depuración manual (borra menús/pedidos/envíos; registra `MANUAL`). | FR-029, FR-032 |
| GET | `/purge/history` | ADMIN | Historial de ejecuciones (automáticas y manuales) con resultado. | FR-029 |

> La depuración automática de las 15:00 (GMT-3) corre como **job programado** interno (no es un endpoint
> público), con ≥3 reintentos y registro (FR-027, FR-028, RNF-06).

## Salud

| Método | Ruta | Rol | Descripción | Ref |
|---|---|---|---|---|
| GET | `/health` | público | Chequeo de salud/liveness para medir disponibilidad (sin datos sensibles). | SC-005 |

## Notas de contrato

- Todas las respuestas excluyen `passwordHash` y cualquier dato de otro usuario fuera del alcance del rol.
- Los campos de texto libre se devuelven tal cual; el **escape** ocurre en el punto de render (UI/correo),
  no en la API (FR-034).
- Paginación no requerida a esta escala (≤50 usuarios, datos del día).
