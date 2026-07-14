# Research & Decisiones de Diseño — Sistema de Solicitud de Almuerzo

**Fase 0** · Fecha: 2026-07-14 · Resuelve los ítems "Deferred" de los checklists y fija best practices
del stack. No quedan `NEEDS CLARIFICATION`: el stack está dado y el spec está clarificado (17 decisiones).

## R1 — Modelo de sesión y revocación inmediata (FR-005, FR-008; CHK004, CHK007, CHK009)

- **Decisión**: Sesión **opaca del lado del servidor**: id aleatorio de alta entropía en cookie `HttpOnly`
  `SameSite=Lax` (`secure` en prod), y una tabla `Session` en Postgres con `userId`, `createdAt`,
  `lastActivityAt`, `expiresAt`. Expiración **deslizante**: cada request autenticado actualiza
  `lastActivityAt` y corre `expiresAt` a +15 min. Se **regenera el id** de sesión al autenticar
  (anti-fijación). Revocación inmediata = borrar/invalidar las filas de sesión del usuario al
  desactivar/eliminar/cambiar rol o restablecer contraseña.
- **Rationale**: Cumple Ppio I y FR-008 (la revocación es imposible con JWT autocontenido sin denylist);
  Postgres ya está en el stack, evita sumar Redis. Fija además CHK004 (regeneración) y da base para un tope
  absoluto opcional (`createdAt + N h`).
- **Alternativas**: JWT stateless (descartado: no permite revocación inmediata) · Redis para sesiones
  (descartado: infra extra innecesaria para ~50 usuarios).

## R2 — Concurrencia y unicidad del pedido (FR-017, FR-018, FR-023)

- **Decisión**: **Índice único** `(userId, fecha)` sobre `Pedido` para garantizar un pedido por día
  (la fecha es el día calendario GMT-3). Escrituras dentro de **transacción**; edición/baja verifican el
  estado `PENDIENTE` (no se edita/borra `ENVIADO`). Conflicto Secretaría-baja vs empleado-edición:
  **last-write-wins con guarda de estado** — la operación relee el estado en la transacción y falla si el
  pedido ya fue enviado o eliminado.
- **Rationale**: El índice único es la defensa atómica contra doble-submit; la guarda de estado evita
  editar algo ya enviado. Simple y suficiente para la escala.
- **Alternativas**: Bloqueo pesimista (descartado: innecesario a esta escala) · columna `version`
  (optimista) — se puede sumar si aparece contención real; hoy la guarda de estado alcanza.

## R3 — Envío por proveedor e idempotencia (FR-021, FR-022, FR-026; CHK023)

- **Decisión**: El envío a un proveedor toma sus pedidos `PENDIENTE`, arma el correo y, ante respuesta SMTP
  exitosa, marca esos pedidos como `ENVIADO` con `enviadoAt` **en la misma transacción**. El flag `ENVIADO`
  impide reenviarlos; un envío "adicional" solo toma los `PENDIENTE` nuevos. Se registra cada `Envio`
  (proveedor, tipo principal/adicional, timestamp, ids incluidos).
- **Ventana residual** (SMTP OK pero caída antes de marcar): se documenta como riesgo aceptado del MVP; se
  mitiga con confirmación en pantalla y la posibilidad de la Secretaría de verificar antes de reenviar. Un
  estado intermedio `ENVIANDO` con conciliación queda como mejora futura, no MVP.
- **Rationale**: Evita duplicados en el caso normal con el flag + transacción; la ventana de fallo es
  estrecha y de bajo impacto operativo (la Secretaría ve la confirmación).
- **Alternativas**: Cola con outbox transaccional (descartado para MVP: complejidad) · two-phase con
  `ENVIANDO` (diferido).

## R4 — Job de depuración 15:00 (FR-027, FR-028, FR-029; RNF-06)

- **Decisión**: `@nestjs/schedule` con `@Cron('0 15 * * *', { timeZone: 'America/Argentina/Buenos_Aires' })`.
  La depuración borra menús/opciones/pedidos/envíos del día y de días anteriores no depurados en una
  transacción idempotente, con **hasta 3 reintentos** (backoff) y un registro `RegistroDepuracion`
  (tipo automática/manual, resultado, timestamp). Endpoint manual `POST /purge` restringido a Admin (mismo
  código, `tipo=manual`). El `RegistroDepuracion` **no** se borra (sobrevive a la depuración).
- **Rationale**: `timeZone` en el cron evita cálculos manuales de GMT-3; el log fuera del alcance de borrado
  permite el historial (FR-029).
- **Alternativas**: cron del SO / n8n (descartado: acopla infra externa; el PRD exige registro y respaldo
  manual dentro de la app).

## R5 — Hash de contraseñas (FR-030, RNF-01)

- **Decisión**: **argon2id** (`argon2`) con parámetros por defecto seguros; longitud mínima 6 validada en el
  DTO. Nunca texto plano; el hash nunca se devuelve en respuestas.
- **Rationale**: argon2id es la recomendación actual (OWASP) por resistencia a GPU; bcrypt sería aceptable
  como alternativa.
- **Alternativas**: bcrypt (aceptable, RNF-01 lo permite) · scrypt (menos difundido en el ecosistema Nest).

## R6 — Anti-CSRF (FR-035)

- **Decisión**: **Token sincronizador / double-submit** (`csrf-csrf`) exigido en todas las operaciones que
  cambian estado (POST/PUT/PATCH/DELETE), enviado por header (`x-csrf-token`). La cookie de sesión
  `SameSite=Lax` es capa complementaria. El front (`apps/web`) obtiene el token y lo adjunta.
- **Rationale**: Defensa en profundidad para sesiones basadas en cookie; `SameSite=Lax` no cubre todos los
  casos.
- **Alternativas**: Solo `SameSite=Strict` (descartado: rompe navegación legítima y no es defensa
  completa).

## R7 — Escape / anti-inyección de texto libre (FR-034)

- **Decisión**: Almacenar el texto tal cual; **escapar en salida**: React escapa por defecto en la UI; para
  el correo, construir el cuerpo con plantilla que **escapa HTML** y **neutraliza CR/LF y caracteres de
  control** en los campos provistos por el usuario (acompañamiento, descripción de plato) para evitar
  inyección de encabezados/contenido.
- **Rationale**: El escape contextual en salida es la defensa robusta contra XSS/inyección sin perder datos.
- **Alternativas**: Saneo en entrada con lista de bloqueo (descartado: frágil y con pérdida de datos).

## R8 — Cifrado en tránsito y en reposo (FR-031; CHK022, CHK025)

- **Decisión**: **En tránsito**: HTTPS en la app (terminación TLS en el reverse proxy en prod) y TLS en
  SMTP (`nodemailer` `secure`/`requireTLS`); conexión a Postgres con `sslmode=require` en prod
  (`DATABASE_URL`). **En reposo**: se delega al cifrado de disco/volumen del entorno de despliegue
  (fuera del alcance de la app, dado el modelo de datos efímero depurado a las 15:00); se documenta como
  decisión, no se implementa cifrado a nivel de columna.
- **Rationale**: Datos efímeros + app interna: el cifrado de disco del host es proporcional; el cifrado por
  columna agregaría complejidad sin beneficio claro para datos que se borran a diario.
- **Alternativas**: Cifrado por columna (descartado por proporcionalidad).

## R9 — Registro de eventos de seguridad (CHK030, CHK031)

- **Decisión**: Logger estructurado de la app (Nest `Logger`) para eventos de seguridad: login
  exitoso/fallido, accesos denegados (403), y altas/bajas/cambios de usuarios y proveedores. Los logs van a
  stdout/archivo del servidor (no a las tablas efímeras). **Manejo de errores**: filtro de excepción global
  que devuelve mensajes claros **sin** filtrar detalles internos (stack traces, SQL), en todos los
  endpoints (no solo login).
- **Rationale**: Trazabilidad de seguridad mínima sin violar el modelo efímero; el filtro global cierra
  CHK031 de forma transversal.
- **Alternativas**: Auditoría persistida en DB (descartado: chocaría con la depuración y el alcance
  "sin reportería histórica").

## R10 — Zona horaria (FR-032)

- **Decisión**: Persistir timestamps en **UTC**; evaluar todas las reglas horarias (fin de semana, corte
  13:00, depuración 15:00, "día" del pedido) en `America/Argentina/Buenos_Aires` (GMT-3, sin DST) mediante
  utilidad central. El cron usa `timeZone`.
- **Rationale**: Evita ambigüedad y errores de borde; centraliza la conversión en un solo módulo testeable.
- **Alternativas**: Server en TZ Argentina (descartado: frágil, acopla despliegue).

## R11 — Testing (Principio X)

- **Decisión**: `apps/api`: Jest (unit de servicios/reglas) + Supertest (e2e de endpoints y autorización),
  con base Postgres de test (contenedor). `apps/web`: Vitest + React Testing Library. Cobertura obligatoria
  de "camino triste": fin de semana, 13:01, 2º pedido, acompañamiento faltante, acceso cruzado por rol,
  revocación de sesión y depuración 15:00. `pnpm -r test` corre todo.
- **Rationale**: Alinea con el stack (Jest es el default de Nest) y el Principio X.
- **Alternativas**: Playwright e2e de UI (útil pero opcional para el MVP; se puede sumar).
