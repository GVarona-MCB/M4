# Requirements Quality Checklist: Sistema de Solicitud de Almuerzo

**Purpose**: Gate formal de calidad de requisitos antes de `/speckit-plan`. Valida que los requisitos
del spec (no la implementación) sean completos, claros, consistentes y medibles en cuatro dominios:
reglas de negocio y bordes, seguridad y sesión, envío por correo (SMTP) y datos/ciclo de vida.
**Created**: 2026-07-10
**Feature**: [spec.md](../spec.md)
**Evaluated**: 2026-07-10 — Resultado inicial: 17/37. Tras `/speckit-clarify`: 24/37. Tras triage y
resolución de los 13 restantes (edición de spec + PRD + AGENTS.md): **37/37 satisfechos**.

**Note**: Cada ítem es un "unit test" del texto del requisito: pregunta si algo está bien especificado,
no si el sistema funciona. `[x]` = el spec satisface el criterio; `[ ]` = falta, es ambiguo o hay
conflicto (hallazgo anotado con ⚠️).

## Reglas de Negocio & Bordes — Completeness

- [x] CHK001 - ¿Está definida la semántica de frontera del corte de las 13:00 hs (inclusividad exacta de 13:00:00 y granularidad de segundos)? [Clarity, Spec §FR-025, §Edge Cases] — ✔ §Edge Cases: "exactamente a las 13:00 hs y después, se rechaza" → 13:00 inclusivo.
- [x] CHK002 - ¿Se define qué envío constituye el "envío principal" frente al "adicional" (p. ej., el primer envío a cada proveedor)? [Ambiguity, Spec §FR-026] — ✔ Resuelto (Clarify 2026-07-10): FR-026 define principal = primer envío a ese proveedor; adicionales = posteriores.
- [x] CHK003 - ¿Está precisado el alcance de "pedidos nuevos desde el último envío" (por proveedor y desde el último envío a ese proveedor)? [Clarity, Spec §FR-026] — ✔ Resuelto: cada envío incluye los pendientes de ESE proveedor; los adicionales no reincluyen enviados.
- [x] CHK004 - ¿Se especifica qué "día" delimita la regla de un pedido por empleado por día (día calendario GMT-3)? [Completeness, Spec §FR-017, §FR-032] — ✔ Resuelto: FR-032 ata el "día" de la unicidad al día calendario GMT-3.
- [x] CHK005 - ¿Están definidos los requisitos cuando aún no hay menús cargados y un empleado intenta pedir? [Gap, Edge Case] — ✔ Resuelto: §Edge Cases "Sin menús cargados" + FR-013 (impide pedir e informa que no hay menú).
- [x] CHK006 - ¿Se define si ambos proveedores deben tener menú cargado para habilitar el pedido, o alcanza con uno? [Ambiguity, Spec §FR-013] — ✔ Resuelto (Clarify 2026-07-10): alcanza con al menos un proveedor con menú; contradicción con US1 eliminada.
- [x] CHK007 - ¿Los requisitos de depuración de las 15:00 precisan qué datos se eliminan y cuáles se conservan (p. ej., el registro de depuración)? [Completeness, Spec §FR-027, §FR-028] — ✔ Borra pedidos+menús (incl. días previos); FR-029 (historial) implica que el registro de depuración se conserva. Menor: conservación explícita del log no está redactada.
- [x] CHK008 - ¿Se especifica que la depuración NO elimina usuarios ni proveedores, solo menús y pedidos? [Clarity, Spec §FR-027] — ✔ El alcance de FR-027 se limita a "pedidos del día y menús".
- [x] CHK009 - ¿FR-025 (corte al empleado) y FR-023 (baja de la Secretaría tras el corte) quedan alineados sin conflicto luego de la clarificación? [Consistency, Spec §Clarifications, §FR-023, §FR-025] — ✔ Resuelto en §Clarifications (corte solo al empleado).

## Reglas de Negocio & Bordes — Consistency & Coverage

- [x] CHK010 - ¿Se cubre el escenario de un envío adicional cuando no hay pedidos nuevos (no debe reenviar los ya enviados)? [Coverage, Edge Case, Spec §FR-026] — ✔ §Edge Cases lo cubre explícitamente.
- [x] CHK011 - ¿Está definido el comportamiento del fin de semana de forma consistente entre user stories y FRs (solo carga bloqueada, o también envío)? [Consistency, Spec §FR-019] — ✔ Consistente: solo se bloquea la carga (FR-019, AC-27); el envío en fin de semana es moot (no hay pedidos).
- [x] CHK012 - ¿Se especifica qué ocurre con pedidos pendientes de días anteriores no depurados al ejecutarse la depuración? [Coverage, Spec §FR-027] — ✔ FR-027: "elimina datos de días anteriores que no hayan sido depurados".
- [x] CHK013 - ¿Los requisitos de autorización por rol cubren toda operación restringida, o solo enumeran ejemplos? [Completeness, Spec §FR-003, §FR-004] — ✔ FR-003 es universal ("cada funcionalidad y cada dato"), reforzado por RNF-08 (100% endpoints).

## Seguridad & Sesión — Completeness & Clarity

- [x] CHK014 - ¿Se define qué cuenta como "actividad" que reinicia el temporizador de inactividad de 15 minutos? [Ambiguity, Spec §FR-005] — ✔ Resuelto (Clarify 2026-07-10): cualquier request autenticado al backend (expiración deslizante del lado del servidor).
- [x] CHK015 - ¿Los requisitos de contraseña van más allá de la longitud mínima (política de reset, reuso, complejidad) o se declara explícitamente que no aplican? [Completeness, Spec §FR-030] — ✔ Resuelto: §Assumptions declara fuera de alcance MVP complejidad/reuso/expiración/bloqueo (solo mínimo 6 + hash).
- [x] CHK016 - ¿Existe un requisito sobre cómo el Administrador establece o restablece la contraseña de un usuario? [Gap, Spec §FR-006] — ✔ Resuelto: FR-006 incluye establecer la contraseña inicial y restablecerla al editar.
- [x] CHK017 - ¿Se especifica el manejo de intentos de login fallidos (bloqueo, throttling) o se declara fuera de alcance? [Gap] — ✔ Resuelto: FR-001 exige mensaje genérico (anti-enumeración); lockout/throttling declarado fuera de alcance MVP (§Assumptions).
- [x] CHK018 - ¿El aislamiento de datos entre empleados está definido tanto para lectura como para escritura del propio pedido? [Coverage, Spec §FR-004, §US7] — ✔ FR-004 "ver y operar únicamente su propio pedido"; US7 escenario 3 cubre ver y editar.
- [x] CHK019 - ¿Es medible/verificable el requisito de "denegar acceso" a funciones de otro rol sin ambigüedad de alcance? [Measurability, Spec §FR-003] — ✔ Verificable con AC-04/AC-05 concretos.

## Envío por Correo (SMTP) — Completeness & Clarity

- [x] CHK020 - ¿Se definen los requisitos del contenido/formato del correo al proveedor (qué campos incluye: empleado, plato, acompañamiento)? [Gap, Spec §FR-020, §FR-021] — ✔ Resuelto: FR-021 define el contenido del correo (por pedido: empleado, plato, acompañamiento; encabezado con proveedor y fecha).
- [x] CHK021 - ¿Se especifica el manejo de fallo por proveedor cuando un envío tiene éxito para uno y falla para el otro (éxito parcial)? [Completeness, Spec §FR-022] — ✔ Resuelto: FR-022 + §Edge Cases definen envío por proveedor independiente; el fallo de uno no afecta a los demás.
- [x] CHK022 - ¿Es preciso el requisito de "no marcar como enviado si el envío no se completó" respecto de la atomicidad (por proveedor vs por pedido)? [Clarity, Spec §FR-022] — ✔ Resuelto: FR-022 fija atomicidad por proveedor (lote de ese proveedor).
- [x] CHK023 - ¿Hay requisitos de reintento/idempotencia para evitar correos duplicados tras un fallo? [Gap, Spec §FR-022] — ✔ Requisito establecido en §Edge Cases (el reintento no debe duplicar pedidos ya enviados); el mecanismo concreto se define en el plan.
- [x] CHK024 - ¿Se especifica dónde aparece la marca "PEDIDO ADICIONAL" (asunto y/o cuerpo)? [Ambiguity, Spec §FR-026] — ✔ Resuelto: FR-026 la ubica en el asunto del correo.
- [x] CHK025 - ¿Es consistente en todo el spec que solo la Secretaría puede disparar envíos? [Consistency, Spec §FR-021] — ✔ FR-021, US2 y FR-025 coinciden en la Secretaría.

## Datos & Ciclo de Vida — Completeness & Consistency

- [x] CHK026 - ¿Están enumerados exhaustivamente los estados del pedido (pendiente/enviado) y todas sus transiciones permitidas? [Completeness, Spec §Key Entities] — ✔ Estados pendiente/enviado; transiciones definidas: crear→pendiente, pendiente→enviado (FR-022), pendiente editable/baja, enviado terminal (FR-018/FR-023).
- [x] CHK027 - ¿La unicidad "un pedido por usuario y día" queda consistente tras la baja por la Secretaría que rehabilita al empleado? [Consistency, Spec §FR-017, §FR-023] — ✔ FR-023 rehabilita explícitamente; sin conflicto con FR-017.
- [x] CHK028 - ¿El requisito de acompañamiento como texto libre define límites (longitud máxima, rechazo de solo-espacios además de vacío)? [Clarity, Spec §FR-016] — ✔ Resuelto (Clarify 2026-07-10): trim, rechazar vacío y solo-espacios, máximo 100 caracteres.
- [x] CHK029 - ¿Se define el alcance de unicidad del email como identificador de login (p. ej., sensibilidad a mayúsculas)? [Ambiguity, Spec §Key Entities, §FR-001] — ✔ Resuelto (Clarify 2026-07-10): único sin distinguir mayúsculas; normalizado a minúsculas + trim.
- [x] CHK030 - ¿Está precisado qué cuenta como "pedidos asociados" que bloquean editar/eliminar una opción de plato? [Clarity, Spec §FR-012] — ✔ "mientras no comprometa pedidos ya realizados" sobre esa opción; AC-15/16/17/18 lo concretan. (Menor: no distingue enviado vs pendiente.)
- [x] CHK031 - ¿Se define el atributo tipo del Envío (principal/adicional) y su relación con los pedidos incluidos? [Completeness, Spec §Key Entities, §FR-026] — ✔ La entidad Envío define tipo y "pedidos incluidos". (La definición de "principal" en sí queda en CHK002.)

## Acceptance Criteria & Success Criteria — Measurability

- [x] CHK032 - ¿Cada criterio SC-001..SC-008 es medible sin conocer la implementación? [Measurability, Spec §Success Criteria] — ✔ Resuelto: §Assumptions documenta el método de medición de SC-001 y SC-002; el resto ya era medible.
- [x] CHK033 - ¿SC-002 (−50% de tiempo operativo) es verificable dado que no se cuantifica la línea base del proceso manual? [Ambiguity, Spec §SC-002] — ✔ Resuelto: §Assumptions fija que la línea base se mide una vez sobre el proceso manual actual.
- [x] CHK034 - ¿SC-001 (0 pedidos perdidos) es objetivamente comprobable considerando que los datos se depuran a las 15:00? [Measurability, Spec §SC-001, §FR-027] — ✔ Resuelto: §Assumptions define la evidencia por confirmaciones de envío registradas antes de la depuración.

## Dependencias, Supuestos & Ambigüedades

- [x] CHK035 - ¿El supuesto de zona horaria GMT-3 está elevado a requisito firme (FR-032) y es consistente en corte, depuración y sesión? [Consistency, Spec §FR-032, §Assumptions] — ✔ FR-032 lo hace requisito y abarca los tres usos.
- [x] CHK036 - ¿Están documentadas como dependencias la disponibilidad del SMTP y la configuración de correos de proveedor, con comportamiento ante indisponibilidad? [Dependency, Spec §Assumptions, §FR-021] — ✔ §Assumptions lista SMTP y correos; §Edge Cases define el fallo de envío (mostrar error + reintentar).
- [x] CHK037 - ¿La cantidad de proveedores está respaldada por un requisito claro? [Assumption, Spec §Assumptions, §FR-009] — ✔ Resuelto (decisión 2026-07-10): la cantidad la determina el Administrador (crea/edita/elimina, uno o más); FR-009 y §Assumptions lo fijan como requisito. Actualizado también en PRD (RF-09) y AGENTS.md.

## Notes

- Marcar `[x]` cuando el requisito satisface el criterio; dejar `[ ]` si falta/ambiguo/conflicto y anotar el hallazgo.
- Ítems con `[Gap]` señalan requisitos posiblemente ausentes; resolverlos con `/speckit-clarify` o documentándolos en el spec/plan antes de implementar.
- Trazabilidad: la mayoría de los ítems referencia una sección del spec (`§FR-xxx`, `§SC-xxx`, `§Key Entities`, etc.) o un marcador de calidad (`[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]`).

### Resumen de evaluación (2026-07-10)

**Progresión**: 17/37 (inicial) → 24/37 (tras `/speckit-clarify`) → **37/37** (tras triage y resolución
de los 13 restantes).

- **Resueltos en clarify (7)**: CHK002, 003, 005, 006, 014, 028, 029.
- **Resueltos en triage 2026-07-10 (13)**: CHK004, 015, 016, 017, 020, 021, 022, 023, 024, 032, 033, 034, 037.
- **Notas de implementación (a materializar en el plan, no bloquean)**:
  - CHK023: el requisito "el reintento no duplica correos" está fijado; el **mecanismo de idempotencia**
    se diseña en `/speckit-plan`.
  - CHK033/034: la medición de SC-002 (línea base) y SC-001 (confirmaciones de envío) es **operativa**,
    documentada en §Assumptions.
- **Cambio de alcance registrado**: la cantidad de proveedores la determina el Administrador (antes se
  asumían dos). Propagado a `spec.md`, `PRD-Sistema-Solicitud-Almuerzo.md` (RF-09, RF-15, RF-16, AC-20/21/28/29)
  y `AGENTS.md`. La constitución ya era agnóstica a la cantidad.
