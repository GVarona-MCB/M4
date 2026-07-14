<!--
Sync Impact Report
==================
Version change: (template, unversioned) → 1.0.0 → 1.0.1
Bump rationale:
  1.0.0 — First concrete ratification of the constitution from the template
    (MAJOR baseline because principles are defined for the first time).
  1.0.1 (2026-07-14, PATCH) — Aclaración del Principio III: el corte de las 13:00 sobre la "baja"
    de pedidos aplica solo a las acciones del EMPLEADO; la Secretaría conserva la baja de pedidos
    no enviados y el envío tras el corte (alinea con FR-023/FR-024/FR-025 y la clarificación del
    spec). Se agrega nota de trazabilidad RF→FR en Governance. Sin cambios de comportamiento en el
    spec (que ya reflejaba la intención).

Principles defined (10):
  I.   Autenticación y sesión endurecidas
  II.  Autorización por rol en el backend (defensa real)
  III. Reglas de negocio validadas en el servidor
  IV.  Depuración diaria obligatoria e irreversible
  V.   Correo/SMTP como único canal; alcance cerrado
  VI.  Tipado estricto y modelo de datos único (Prisma)
  VII. Manejo explícito de errores y estados de borde
  VIII.Límites del monorepo y separación de responsabilidades
  IX.  Configuración por entorno, secretos fuera del repo
  X.   Cada regla del PRD tiene test (camino feliz y triste)

Added sections:
  - Restricciones Técnicas y de Seguridad (Section 2)
  - Flujo de Desarrollo y Puertas de Calidad (Section 3)
  - Governance

Removed sections: none (template placeholders replaced).

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ compatible (generic "Constitution Check" gate reads this file)
  - .specify/templates/spec-template.md ✅ no constitution coupling
  - .specify/templates/tasks-template.md ✅ no constitution coupling

Follow-up TODOs:
  - RATIFICATION_DATE set to first concrete ratification date (2026-07-10). Adjust if an
    earlier adoption date is confirmed.
-->

# Vianda Constitution

## Core Principles

### I. Autenticación y sesión endurecidas (NON-NEGOTIABLE)
Todo acceso al sistema MUST requerir login (RF-01). La sesión MUST viajar siempre en cookie
`HttpOnly` con `SameSite=Lax` y `secure=true` en producción (HTTPS); NUNCA en `localStorage`
ni en cookies sin `HttpOnly`. La sesión MUST expirar tras 15 minutos de inactividad (RF-30,
RNF-02) y MUST poder cerrarse manualmente (RF-31). Las contraseñas MUST almacenarse con hash
seguro (bcrypt o argon2), nunca en texto plano ni con hashes reversibles, con longitud mínima
de 6 caracteres (RNF-01).
**Rationale**: La cookie `HttpOnly` evita el robo de sesión por XSS; el hash fuerte y la
expiración limitan el daño ante fugas o dispositivos desatendidos.

### II. Autorización por rol en el backend (NON-NEGOTIABLE)
La autorización por rol (Administrador, Secretaría, Empleado) MUST validarse en el backend en
el 100% de los endpoints, no solo en la interfaz (RF-04, RNF-08). Cada usuario tiene
exactamente un rol (RF-03). Un empleado MUST poder ver y operar únicamente su propio pedido
(RF-20, AC-05). El front puede ocultar acciones por UX, pero esa ocultación NUNCA sustituye la
verificación del servidor.
**Rationale**: Un control que vive solo en el cliente es evadible; la fuente de verdad de los
permisos es la API.

### III. Reglas de negocio validadas en el servidor (NON-NEGOTIABLE)
El backend es la fuente de verdad de las reglas del PRD y MUST rechazar toda operación que las
viole, aunque el front ya las muestre: un único pedido por empleado por día (RF-19); nada de
pedidos sábados ni domingos (RF-21); tras el corte de las 13:00 hs el **empleado** no puede cargar,
editar ni anular su propio pedido, mientras la Secretaría conserva la baja de pedidos no enviados y el
envío a proveedores después del corte (RF-27, acotado en FR-023/FR-024/FR-025); no editar/eliminar
platos que comprometan pedidos existentes (RF-12, RF-13);
no dar de baja pedidos ya enviados (RF-25). El acompañamiento requerido MUST bloquear la
confirmación si falta (RF-18).
**Rationale**: Las reglas de horario, unicidad y trazabilidad definen el producto; validarlas
en el servidor garantiza que se cumplan sin importar el cliente.

### IV. Depuración diaria obligatoria e irreversible (NON-NEGOTIABLE)
Toda la información de pedidos y menús del día MUST eliminarse automáticamente a las 15:00 hs,
incluyendo datos de días anteriores no depurados (RF-29). El borrado MUST completarse dentro de
los 15 minutos, con al menos 3 reintentos ante fallo y registro de cada ejecución (RNF-06). El
Administrador MUST poder ejecutar la depuración manualmente como recuperación, registrándola
igual (RF-32). Ninguna feature, caché ni respaldo puede conservar esos datos pasada la hora de
corte.
**Rationale**: La depuración es parte del contrato de privacidad y diseño del sistema; "guardar
por las dudas" viola la especificación.

### V. Correo/SMTP como único canal y alcance cerrado
La única notificación permitida es correo por SMTP con TLS (RF-23, RNF-07); NINGÚN otro canal
(SMS, push, webhooks) es admisible. Cada proveedor MUST recibir únicamente sus propios pedidos,
a su correo de destino configurado. El sistema NO procesa pagos ni delivery ni ninguna función
fuera del PRD.
**Rationale**: Mantener un solo canal y un alcance cerrado reduce superficie de error, fuga de
datos y desviación del producto.

### VI. Tipado estricto y modelo de datos único
TypeScript MUST usarse en modo `strict`; el uso de `any` para silenciar errores está prohibido.
El modelo de datos tiene una única fuente: los tipos derivados de Prisma. Toda entrada de la API
MUST validarse con DTOs (class-validator) antes de tocar la lógica de dominio.
**Rationale**: El tipado de extremo a extremo convierte errores de contrato en fallos de
compilación, no en incidentes en producción.

### VII. Manejo explícito de errores y estados de borde
Toda operación que pueda fallar (SMTP caído, pedido duplicado, fuera de horario, sesión
expirada) MUST manejarse de forma explícita: mensaje claro al usuario, sin filtrar detalles
internos, y sin dejar el sistema en estado inconsistente. Los mensajes de cierre de horario y
denegación MUST ser comprensibles (RF-27, AC-04).
**Rationale**: Los caminos de error son parte del comportamiento del producto, no una
ocurrencia tardía.

### VIII. Límites del monorepo y separación de responsabilidades
`apps/web` (Next.js) y `apps/api` (NestJS) MUST comunicarse solo por HTTP mediante contratos;
NUNCA importando código interno cruzado. La lógica de dominio vive en la API y NO se duplica en
el front. Los puertos fijos (API 3001 · Web 3002 · PostgreSQL host 5433) MUST respetarse para no
chocar con otros servicios.
**Rationale**: Fronteras claras permiten evolucionar cada app y testear el dominio de forma
aislada.

### IX. Configuración por entorno, secretos fuera del repo
Toda configuración sensible (credenciales SMTP y de base de datos, puertos, flags) MUST leerse
del entorno (`.env`) y NUNCA hardcodearse ni commitearse. El `.env` se lee al arrancar: tras
cambiarlo, la API MUST reiniciarse.
**Rationale**: Separar configuración de código evita fugas de secretos y permite promover el
mismo binario entre entornos.

### X. Cada regla del PRD tiene test (camino feliz y triste)
Cada regla de negocio y criterio de aceptación del PRD MUST cubrirse con tests automatizados que
verifiquen tanto que se permite lo válido como que se RECHAZA lo inválido: fin de semana (RF-21),
13:01 hs (RF-27), segundo pedido del día (RF-19), acompañamiento faltante (RF-18), acceso cruzado
entre roles (RF-04/RF-20), y depuración a las 15:00 (RF-29). Un test que solo cubre el camino
feliz NO protege una regla de negocio.
**Rationale**: Las restricciones críticas se rompen en los bordes; probar el rechazo es lo que
las hace confiables.

## Restricciones Técnicas y de Seguridad

- **Stack fijo**: Node.js 22 LTS · pnpm 11 · TypeScript 5 · Next.js 15 · NestJS 11 ·
  PostgreSQL 16 con Prisma. Monorepo pnpm con `apps/web` y `apps/api`.
- **Transporte cifrado**: HTTPS en la aplicación y TLS en el envío SMTP son obligatorios
  (RNF-07).
- **Rendimiento y capacidad**: operaciones de carga de menú y pedido en < 3 s p95 (RNF-03),
  soportando hasta 50 usuarios concurrentes (RNF-05) y disponibilidad ≥ 99% en franja hábil
  (RNF-04).
- **Compatibilidad**: últimas 2 versiones de Chrome, Edge y Firefox; responsive de 360 px a
  1920 px (RNF-09).
- **Trazabilidad**: los envíos a proveedores marcan los pedidos como enviados con fecha y hora
  (RF-24) y preservan lo enviado (RF-25); los envíos adicionales se identifican como
  "PEDIDO ADICIONAL" (RF-28).

## Flujo de Desarrollo y Puertas de Calidad

- **Puerta de tipos y lint**: el código MUST compilar en modo `strict` sin `any` de conveniencia
  antes de integrarse.
- **Puerta de tests**: `pnpm -r test` MUST pasar; toda regla del PRD tocada MUST llegar con sus
  tests de camino feliz y triste (Principio X).
- **Revisión**: toda contribución MUST verificar el cumplimiento de esta constitución;
  cualquier desviación MUST justificarse explícitamente en la descripción del cambio.
- **Migraciones**: los cambios de esquema pasan por Prisma migrate; el modelo de datos no se
  edita a mano por fuera de las migraciones.
- **Setup reproducible**: `docker compose up -d`, `prisma migrate dev` y `db:seed` MUST dejar un
  entorno local funcional según `AGENTS.md`.

## Governance

Esta constitución PREVALECE sobre cualquier otra práctica del proyecto. Ante conflicto entre una
conveniencia de implementación y un principio, gana el principio.

- **Enmiendas**: se documentan en este archivo, requieren justificación y, cuando cambien un
  comportamiento existente, un plan de migración.
- **Versionado (semántico)**: MAJOR para remociones o redefiniciones incompatibles de
  principios/gobernanza; MINOR para nuevos principios o guía materialmente ampliada; PATCH para
  aclaraciones y correcciones no semánticas.
- **Cumplimiento**: toda PR/revisión MUST verificar conformidad con los principios; la
  complejidad añadida MUST justificarse. La guía operativa de desarrollo (stack, cómo correr, qué
  NO hacer) vive en `AGENTS.md` y `CLAUDE.md`; la especificación funcional completa, en
  `PRD-Sistema-Solicitud-Almuerzo.md`.
- **Trazabilidad de identificadores**: los principios citan los identificadores originales del PRD
  (`RF-xx`, `RNF-xx`, `AC-xx`). La especificación los re-expresa como `FR-###` y `SC-###`; la
  correspondencia y el detalle vigente viven en `specs/001-solicitud-almuerzo/spec.md` (sección
  Requirements y Clarifications), que es la fuente autoritativa cuando un gate de la constitución
  necesita resolverse a un requisito concreto.

**Version**: 1.0.1 | **Ratified**: 2026-07-10 | **Last Amended**: 2026-07-14
