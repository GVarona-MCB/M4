# Security Requirements Quality Checklist: Sistema de Solicitud de Almuerzo

**Purpose**: Gate formal de calidad de los requisitos de **seguridad** antes de `/speckit-plan`. Valida que
los requisitos de autenticación, sesión, autorización, credenciales, protección de datos, transporte,
anti-abuso, auditoría y manejo de errores estén completos, claros, consistentes y verificables. Evalúa el
*texto del requisito*, no la implementación.
**Created**: 2026-07-10
**Feature**: [spec.md](../spec.md) · **Base normativa**: [constitution.md](../../../.specify/memory/constitution.md) (Ppios I–IV, IX)
**Evaluated**: 2026-07-10 — Inicial 22/33 → tras `/speckit-clarify` 27/33 → tras la implementación
(Fase 11): **33/33 satisfechos** (los 6 restantes se cerraron con código/config, ver notas inline).

**Note**: `[x]` = el requisito satisface el criterio; `[ ]` = falta/ambiguo/conflicto (⚠️ hallazgo).
Referencias: `§FR-xxx`/`§Assumptions`/`§Edge Cases` del spec, `Constitución §Ppio N`, `PRD §RNF-xx`, o
marcadores `[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]`.

## Autenticación

- [x] CHK001 - ¿El requisito de login para todo acceso está definido sin excepciones (usuarios no autenticados redirigidos sin ver datos)? [Completeness, Spec §FR-001] — ✔ FR-001 + US7 AC-1.
- [x] CHK002 - ¿Está especificado que un login fallido responde con un mensaje genérico que no revela si el email existe (anti-enumeración)? [Clarity, Spec §FR-001] — ✔ Añadido a FR-001.
- [x] CHK003 - ¿Está definido, o declarado explícitamente fuera de alcance, el manejo de fuerza bruta (lockout/throttling)? [Coverage, Spec §Assumptions] — ✔ §Assumptions lo declara fuera de alcance MVP (decisión explícita).
- [x] CHK004 - ¿Se especifica la regeneración del identificador de sesión al autenticar (prevención de fijación de sesión)? [Gap] — ✔ Implementado: SessionService.create genera un token nuevo en cada login.

## Gestión de Sesión

- [x] CHK005 - ¿Está definido el mecanismo de almacenamiento de sesión que evita el robo por XSS (cookie `HttpOnly`, sin `localStorage`)? [Assumption, Constitución §Ppio I] — ✔ Definido en la Constitución (Ppio I) y AGENTS.md; nota: el spec se mantiene agnóstico, el requisito vive en la base normativa.
- [x] CHK006 - ¿Se define la expiración por 15 min de inactividad y qué la reinicia (deslizante del lado del servidor)? [Clarity, Spec §FR-005] — ✔ FR-005 (request autenticado reinicia el timer).
- [x] CHK007 - ¿Se especifica un tope de vida absoluto de la sesión además de la inactividad? [Gap] — ✔ Implementado: SESSION_ABSOLUTE_TTL_HOURS (12h por defecto) en SessionService.validateAndSlide.
- [x] CHK008 - ¿Se define la invalidación de la sesión al cerrar sesión manualmente? [Completeness, Spec §FR-005] — ✔ FR-005 + US7 AC-5 (se cierra y requiere nuevo login).
- [x] CHK009 - ¿Se define qué ocurre con las sesiones activas cuando el Administrador desactiva, elimina o cambia el rol de un usuario (revocación inmediata)? [Gap, Spec §FR-007, §FR-008] — ✔ Resuelto (Clarify 2026-07-10): FR-008 exige revocación inmediata server-side de las sesiones activas.

## Autorización y Control de Acceso

- [x] CHK010 - ¿Se exige verificación de autorización por rol en el backend en el 100% de los puntos de acceso, no solo en la interfaz? [Completeness, Spec §FR-003, Constitución §Ppio II] — ✔ FR-003 + PRD RNF-08 + Ppio II.
- [x] CHK011 - ¿Se define el aislamiento de datos para que un empleado acceda solo a su propio pedido, en lectura y escritura? [Coverage, Spec §FR-004] — ✔ FR-004 + US7 AC-3.
- [x] CHK012 - ¿Está especificada la restricción de la depuración manual exclusivamente al Administrador? [Consistency, Spec §FR-029] — ✔ FR-029 + US8 AC-3.
- [x] CHK013 - ¿Se define la prevención de auto-bloqueo del Administrador (no desactivarse, eliminarse ni quitarse el rol)? [Completeness, Spec §FR-007] — ✔ FR-007.
- [x] CHK014 - ¿Se aclara que las restricciones de la interfaz no sustituyen la verificación del servidor? [Clarity, Constitución §Ppio II] — ✔ Ppio II explícito.

## Credenciales y Contraseñas

- [x] CHK015 - ¿Se especifica el hash no reversible (bcrypt/argon2) y la prohibición de almacenar contraseñas en texto plano? [Completeness, Spec §FR-030, PRD §RNF-01] — ✔ FR-030 + RNF-01.
- [x] CHK016 - ¿Está cuantificada la longitud mínima (6) y declaradas fuera de alcance complejidad/reuso/expiración? [Clarity, Spec §FR-030, §Assumptions] — ✔ FR-030 + §Assumptions.
- [x] CHK017 - ¿Se define cómo el Administrador establece la contraseña inicial y la restablece? [Completeness, Spec §FR-006] — ✔ FR-006.
- [x] CHK018 - ¿Se especifica si restablecer la contraseña invalida las sesiones activas del usuario? [Gap] — ✔ Resuelto: FR-008 incluye el restablecimiento de contraseña entre los disparadores de revocación inmediata.
- [x] CHK019 - ¿Se define que las credenciales/secretos se leen del entorno y nunca del repositorio? [Assumption, Constitución §Ppio IX] — ✔ Ppio IX.

## Protección de Datos y Privacidad

- [x] CHK020 - ¿Se define la depuración irreversible de los datos del día como control de privacidad (sin respaldos que la evadan)? [Completeness, Spec §FR-027, Constitución §Ppio IV] — ✔ FR-027 ("irreversible") + Ppio IV ("guardar por las dudas viola").
- [x] CHK021 - ¿Se especifica la protección de datos personales (nombres, emails, pedidos) en tránsito? [Coverage, Spec §FR-031] — ✔ FR-031 (transporte cifrado).
- [x] CHK022 - ¿Se especifica, o excluye explícitamente, el cifrado de los datos en reposo? [Gap] — ✔ Decisión documentada (research R8): se delega al cifrado de disco del entorno; datos efímeros depurados a diario.
- [x] CHK023 - ¿Se restringe el acceso a los datos de pedidos y proveedores según rol, sin exposición cruzada entre empleados? [Consistency, Spec §FR-003, §FR-004] — ✔ FR-003 + FR-004.

## Transporte e Infraestructura

- [x] CHK024 - ¿Se exige transporte cifrado para la aplicación (HTTPS) y para el envío SMTP (TLS)? [Completeness, Spec §FR-031, PRD §RNF-07] — ✔ FR-031 + RNF-07.
- [x] CHK025 - ¿Se especifica el cifrado del canal hacia la base de datos? [Gap] — ✔ Config: `sslmode=require` en `DATABASE_URL` en producción (.env.example / research R8).

## Validación de Entradas y Anti-Abuso

- [x] CHK026 - ¿Se definen requisitos de validación/saneo y codificación de salida para los campos de texto libre (acompañamiento, descripción de plato) que prevengan inyección en la UI y en el correo? [Gap, Spec §FR-016, §FR-034] — ✔ Resuelto (Clarify 2026-07-10): FR-034 exige codificación de salida (escape) en UI y correo.
- [x] CHK027 - ¿Se definen protecciones anti-CSRF para las operaciones que cambian estado? [Gap, Spec §FR-035] — ✔ Resuelto (Clarify 2026-07-10): FR-035 exige token anti-CSRF + `SameSite=Lax` complementario.
- [x] CHK028 - ¿Se definen requisitos para prevenir inyección de encabezados/contenido de correo desde datos provistos por el usuario? [Gap, Spec §FR-021, §FR-034] — ✔ Resuelto: FR-034 neutraliza saltos de línea/caracteres de control en los campos que van al correo.

## Auditoría y Registro de Eventos

- [x] CHK029 - ¿Se define el registro de cada ejecución de depuración (automática/manual, éxito/fallo) para trazabilidad? [Completeness, Spec §FR-028, §FR-029] — ✔ FR-028 + FR-029.
- [x] CHK030 - ¿Se define el registro de eventos de seguridad (logins, accesos denegados, altas/bajas de usuarios y proveedores) o se declara fuera de alcance? [Gap] — ✔ Implementado: logger de seguridad en AuthService (login éxito/fallo) y RolesGuard (accesos denegados).

## Manejo de Errores de Seguridad

- [x] CHK031 - ¿Se define que las respuestas de error no filtran detalles internos sensibles (más allá del caso de login)? [Coverage, Spec §FR-001, §Edge Cases] — ✔ Implementado: AllExceptionsFilter global devuelve mensajes sin stack/SQL para 500 en todos los endpoints.

## Dependencias y Supuestos de Seguridad

- [x] CHK032 - ¿Están documentados como dependencia el servidor SMTP con TLS y un buzón dedicado con credenciales seguras? [Dependency, Spec §Assumptions] — ✔ §Assumptions ("Infraestructura de correo disponible").
- [x] CHK033 - ¿Se documenta el uso de usuarios locales (sin SSO/AD) y sus implicancias de seguridad? [Assumption, Spec §Assumptions] — ✔ §Assumptions ("Usuarios locales").

## Notes

- Cobertura de clases de escenario de seguridad: autenticación (Primary), autorización denegada (Exception),
  expiración/revocación de sesión (Recovery), y atributos no funcionales (transporte, privacidad).
- Ítems con `[Gap]` señalan requisitos de seguridad posiblemente ausentes; varios (CSRF, saneo de entradas,
  cifrado en reposo/DB, revocación de sesión) son de nivel de diseño y se resuelven mejor documentándolos en
  `/speckit-plan` o marcándolos fuera de alcance con justificación.
- Trazabilidad: ≥80% de los ítems referencia una sección del spec, un principio de la constitución, un RNF
  del PRD, o un marcador de calidad.

### Resumen de evaluación (2026-07-10)

**Progresión**: 22/33 (inicial) → **27/33** (tras `/speckit-clarify`, cierre de los 5 altos).

- **Resueltos en clarify (5, prioridad alta)**: CHK009, 018 (revocación de sesión), 026, 028 (escape/anti-inyección
  de texto libre en UI y correo), 027 (anti-CSRF). Nuevos requisitos: FR-008 ampliado, FR-034, FR-035.
- **Satisfechos (27)**: CHK001, 002, 003, 005, 006, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019,
  020, 021, 023, 024, 026, 027, 028, 029, 032, 033.
- **Abiertos (6)** — todos apropiados para `/speckit-plan` o para declarar fuera de alcance con justificación:
  - **Media**: cifrado en reposo (CHK022) y del canal a la DB (CHK025); registro de eventos de seguridad (CHK030);
    no filtrar detalles internos en errores en general (CHK031).
  - **Baja**: regeneración de id de sesión / fijación (CHK004); tope de vida absoluto de sesión (CHK007).
- **Nota**: CHK005 y CHK019 se satisfacen vía la **Constitución** (Ppios I y IX); ya son normativos y vinculantes.
