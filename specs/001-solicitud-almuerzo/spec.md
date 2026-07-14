# Feature Specification: Sistema de Solicitud de Almuerzo

**Feature Branch**: `001-solicitud-almuerzo`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "@PRD-Sistema-Solicitud-Almuerzo.md"

## Clarifications

### Session 2026-07-10

- Q: ¿Cómo se representa el "acompañamiento" de un plato que lo requiere? → A: Texto libre que
  escribe el empleado (no una lista de opciones predefinidas).
- Q: ¿El corte de las 13:00 también bloquea la baja de pedidos por parte de la Secretaría (RF-25)? → A:
  No; el corte aplica solo a las acciones del empleado sobre su propio pedido. La Secretaría puede seguir
  dando de baja pedidos no enviados y enviar después de las 13:00.
- Q: ¿Cuál es el identificador de login del usuario? → A: El email corporativo, único por usuario.
- Q: ¿Se requiere el menú de ambos proveedores para habilitar el pedido, o alcanza con uno? → A: Alcanza
  con que al menos un proveedor tenga menú cargado; el empleado elige entre los platos disponibles. Si
  ningún proveedor tiene menú, no se puede pedir.
- Q: ¿Cómo se definen "envío principal/adicional" y "pedidos nuevos desde el último envío"? → A: Se rastrea
  por proveedor: cada envío a un proveedor incluye sus pedidos pendientes (no enviados); el primer envío a
  ese proveedor es "principal" y los siguientes "adicional".
- Q: ¿Qué reglas de validación tiene el acompañamiento (texto libre)? → A: Recortar espacios (trim),
  rechazar vacío y solo-espacios, y limitar a un máximo de 100 caracteres.
- Q: ¿La unicidad del email de login distingue mayúsculas/minúsculas? → A: No; el email es único sin
  distinguir mayúsculas/minúsculas (se normaliza a minúsculas y se recorta al guardar y al comparar).
- Q: ¿Qué cuenta como "actividad" que reinicia el temporizador de 15 minutos de inactividad? → A: Cualquier
  request autenticado al backend (expiración deslizante del lado del servidor); la interacción en el front
  sin request no mantiene viva la sesión.
- Q: ¿La cantidad de proveedores es fija (dos) o la determina el Administrador? → A: La determina el
  Administrador: crea, edita y elimina proveedores (uno o más). Ya no se asume una cantidad fija. Se necesita
  al menos un proveedor con menú para poder pedir.
- Q: ¿Qué "día" delimita la regla de un pedido por empleado por día? → A: El día calendario en GMT-3.
- Q: ¿Cómo se establece/restablece la contraseña de un usuario? → A: El Administrador define la contraseña
  inicial al crear y puede restablecerla al editar el usuario. No hay política de complejidad/reuso/expiración
  (solo mínimo 6 + hash); el bloqueo por intentos fallidos queda fuera de alcance del MVP.
- Q: ¿Cómo responde un login fallido? → A: Con un mensaje genérico que no revela si el email existe
  (anti-enumeración).
- Q: ¿Qué contenido lleva el correo al proveedor y dónde va la marca de adicional? → A: Por cada pedido:
  nombre del empleado, plato y acompañamiento; encabezado con proveedor y fecha; los envíos adicionales se
  marcan como "PEDIDO ADICIONAL" en el asunto.
- Q: ¿Cómo se maneja el éxito parcial del envío (un proveedor OK, otro falla)? → A: Cada envío por proveedor
  es independiente y atómico; el fallo de uno no afecta al otro ni marca sus pedidos como enviados.
- Q: ¿Qué pasa con las sesiones activas al desactivar/eliminar/cambiar rol o restablecer la contraseña de un
  usuario? → A: Revocación inmediata: sus sesiones activas se invalidan del lado del servidor al instante.
- Q: ¿Cómo se protegen los campos de texto libre (acompañamiento, descripción de plato) contra inyección en
  UI y correo? → A: Codificación de salida (escape) en todos los puntos de render —UI y correo— tratando el
  texto como dato, y neutralización de saltos de línea/caracteres de control en los campos que van al correo
  (anti header injection). El valor se almacena tal cual.
- Q: ¿Qué protección anti-CSRF se exige? → A: Token anti-CSRF en todas las operaciones que cambian estado,
  con la cookie `SameSite=Lax` como capa complementaria (no como única barrera).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El empleado presente registra su pedido del día (Priority: P1)

Un empleado que asistió a la Oficina Central inicia sesión, ve los menús del día de los proveedores
con menú cargado, identificados por proveedor, elige un plato (indicando el acompañamiento cuando el
plato lo requiere) y confirma su único pedido del día. Si el plato elegido no tiene acompañamiento,
lo confirma directamente. El registro del pedido constituye su declaración de presencia; no existe
un padrón previo.

**Why this priority**: Es el corazón del beneficio y la causa directa del problema actual (empleados
presentes que se quedan sin almuerzo). Sin esta capacidad no hay producto. Entrega valor por sí sola:
recoge de forma confiable qué quiere comer cada persona presente.

**Independent Test**: Con al menos un menú cargado, un usuario activo inicia sesión, selecciona un
plato de cualquiera de los proveedores con menú, completa el acompañamiento cuando corresponde y confirma;
el sistema guarda exactamente un pedido para ese día y ese usuario.

**Acceptance Scenarios**:

1. **Given** hay menús cargados de al menos un proveedor y el usuario está activo y autenticado, **When** el
   empleado ingresa a pedir, **Then** ve los platos de los proveedores con menú, identificados por proveedor.
2. **Given** un plato marcado como "lleva acompañamiento", **When** el empleado lo elige, **Then** el
   sistema le solicita el acompañamiento y no permite confirmar hasta que lo indique.
3. **Given** un plato sin acompañamiento, **When** el empleado lo confirma, **Then** el pedido queda
   registrado sin pedir acompañamiento.
4. **Given** un empleado que ya registró su pedido del día, **When** intenta cargar otro, **Then** el
   sistema lo impide y le ofrece editar o anular el existente.
5. **Given** un empleado con un pedido aún no enviado, **When** lo edita, **Then** el cambio se guarda.
6. **Given** un empleado con un pedido ya enviado al proveedor, **When** intenta editarlo, **Then** el
   sistema no lo permite.

---

### User Story 2 - La Secretaría consolida y envía los pedidos a cada proveedor (Priority: P1)

La Secretaría ve el consolidado de pedidos agrupado por proveedor (nombre del empleado, plato y
acompañamiento) y envía a cada proveedor, por correo, únicamente sus propios pedidos a su correo de
destino configurado. Al enviar, los pedidos incluidos quedan marcados como enviados con fecha y hora.
La pantalla confirma el envío y, si falla, muestra el error y permite reintentar.

**Why this priority**: Es la otra mitad del reemplazo del proceso manual (Outlook + Excel). Sin el
envío consolidado, los pedidos recogidos no llegan al restaurante y no se elimina la transcripción
manual. Es P1 porque el objetivo de negocio (0 pedidos perdidos, −50% de tiempo operativo) depende
de esta historia tanto como de la carga.

**Independent Test**: Con pedidos cargados para distintos proveedores, la Secretaría ejecuta el envío;
cada proveedor recibe solo sus pedidos a su correo configurado y esos pedidos quedan marcados como
enviados con fecha y hora. El tipado del envío por proveedor (primer envío = principal) se valida aquí; la
identificación "PEDIDO ADICIONAL" en el asunto se cubre en US3.

**Acceptance Scenarios**:

1. **Given** pedidos de distintos proveedores, **When** la Secretaría abre el consolidado, **Then** los ve
   agrupados por proveedor con nombre del empleado, plato y acompañamiento.
2. **Given** pedidos pendientes de distintos proveedores, **When** la Secretaría envía, **Then** cada
   proveedor recibe por correo únicamente sus pedidos a su correo de destino configurado.
3. **Given** un envío realizado, **When** se completa, **Then** los pedidos incluidos quedan marcados
   como enviados con fecha y hora.
4. **Given** un envío que falla hacia un proveedor, **When** ocurre el error, **Then** el sistema lo
   muestra y permite reintentar sin marcar como enviado.

---

### User Story 3 - Manejo de pedidos tardíos, corte y envíos adicionales (Priority: P2)

Después del envío principal, empleados que llegaron tarde pueden registrar su pedido hasta las 13:00 hs.
A partir de las 13:00 hs el sistema cierra la carga, edición y baja de pedidos (incluidos los tardíos)
e informa que el horario cerró, pero la Secretaría todavía puede enviar. La Secretaría realiza envíos
adicionales que contienen solo los pedidos nuevos desde el último envío, identificados como
"PEDIDO ADICIONAL".

**Why this priority**: Estandariza los casos borde que hoy se resuelven ad-hoc y da trazabilidad a los
tardíos, pero el MVP de captura + envío ya entrega valor sin esto. Es P2.

**Independent Test**: Tras un envío principal, se registra un pedido tardío antes de las 13:00 y la
Secretaría envía adicionales; el correo contiene solo el pedido nuevo y se identifica como
"PEDIDO ADICIONAL". A las 13:00 hs, un intento de cargar/editar/anular se rechaza con mensaje de cierre.

**Acceptance Scenarios**:

1. **Given** la Secretaría ya realizó el envío principal y son antes de las 13:00 hs, **When** un
   empleado que llegó tarde registra su pedido, **Then** el sistema lo acepta y queda pendiente de envío.
2. **Given** son las 13:00 hs o una hora posterior, **When** un empleado intenta cargar, editar o anular
   un pedido, **Then** el sistema lo impide e informa que el horario de pedidos cerró.
3. **Given** son las 13:00 hs o posterior y hay pedidos pendientes, **When** la Secretaría los envía,
   **Then** el sistema lo permite (el corte no aplica al envío).
4. **Given** ya hubo envío principal y luego pedidos tardíos, **When** la Secretaría envía adicionales,
   **Then** el correo contiene solo los pedidos nuevos y se identifica como "PEDIDO ADICIONAL".

---

### User Story 4 - Gestión de menús del día por la Secretaría (Priority: P2)

La Secretaría carga el menú del día indicando a qué proveedor corresponde cada plato, con varias
opciones por proveedor, marcando en cada plato si lleva acompañamiento. Puede editar o eliminar una
opción de plato mientras no comprometa pedidos ya realizados sobre ella.

**Why this priority**: Es prerrequisito operativo de la carga de pedidos (US1), pero se especifica como
historia propia porque la habilita y tiene sus propias reglas de integridad. P2 porque puede sembrarse
manualmente para probar US1, aunque en producción es diaria.

**Independent Test**: La Secretaría carga varias opciones de plato para un proveedor con su marca de
acompañamiento; quedan visibles para los empleados y solo pueden editarse/eliminarse mientras no tengan
pedidos asociados.

**Acceptance Scenarios**:

1. **Given** la Secretaría carga varias opciones de plato indicando el proveedor, **When** guarda,
   **Then** quedan asociadas a ese proveedor y visibles para los empleados.
2. **Given** una opción de plato sin pedidos asociados, **When** la Secretaría la edita o elimina,
   **Then** el cambio o la baja se aplica.
3. **Given** una opción de plato con pedidos asociados, **When** la Secretaría intenta editarla o
   eliminarla, **Then** el sistema no lo permite.

---

### User Story 5 - Baja de pedidos por la Secretaría (Priority: P2)

La Secretaría elimina el pedido de un empleado mientras no haya sido enviado al proveedor, lo que
habilita a ese empleado a registrar uno nuevo. Una vez enviado, el pedido no puede darse de baja, para
preservar la trazabilidad de lo enviado.

**Why this priority**: Mitiga el riesgo de almuerzos sin destinatario (empleado que se retira) y sostiene
el esquema de confianza de la presencia autodeclarada. P2: mejora el control, no bloquea el flujo central.

**Independent Test**: Con un pedido no enviado, la Secretaría lo elimina y el empleado vuelve a poder
registrar; con un pedido ya enviado, el intento de baja se rechaza con el motivo.

**Acceptance Scenarios**:

1. **Given** un pedido cargado y aún no enviado, **When** la Secretaría lo elimina, **Then** el pedido se
   borra y el empleado vuelve a poder registrar uno.
2. **Given** un pedido ya enviado al proveedor, **When** la Secretaría intenta darlo de baja, **Then** el
   sistema lo impide e informa que no puede eliminarse un pedido enviado.

---

### User Story 6 - Administración de usuarios, roles y proveedores (Priority: P2)

El Administrador crea, edita, activa/desactiva y elimina usuarios asignándoles exactamente un rol
(Administrador, Secretaría o Empleado), y gestiona los proveedores —crea, edita y elimina— definiendo el
nombre y el correo de destino de cada uno. El Administrador determina cuántos proveedores existen. El
Administrador no puede desactivarse, eliminarse ni quitarse el rol de Administrador a sí mismo.

**Why this priority**: Habilita el acceso de todos los demás actores y la configuración de destinos de
envío. Necesaria para operar, pero puede sembrarse inicialmente; el valor de negocio se materializa a
través de las historias P1. P2.

**Independent Test**: El Administrador crea un usuario con un rol y credenciales; ese usuario inicia
sesión y opera con su rol. El Administrador cambia el correo de un proveedor y los envíos posteriores
van al nuevo correo. Un autoborrado/autodesactivación del Administrador se rechaza.

**Acceptance Scenarios**:

1. **Given** el Administrador, **When** crea un usuario con rol y credenciales iniciales, **Then** ese
   usuario queda dado de alta y puede iniciar sesión con exactamente ese rol.
2. **Given** el Administrador, **When** desactiva a un usuario, **Then** ese usuario no puede iniciar
   sesión; al reactivarlo, vuelve a poder.
3. **Given** el Administrador autenticado, **When** intenta desactivarse, eliminarse o quitarse el rol de
   Administrador a sí mismo, **Then** el sistema lo impide e informa el motivo.
4. **Given** el Administrador, **When** modifica el correo de destino de un proveedor, **Then** los
   envíos posteriores se dirigen a ese nuevo correo.
5. **Given** el Administrador, **When** agrega un nuevo proveedor o elimina uno sin menús ni pedidos del
   día asociados, **Then** el cambio se aplica y se refleja en la carga de menús y en los envíos.

---

### User Story 7 - Seguridad de acceso y sesión (Priority: P1)

Todo acceso requiere login con usuario y contraseña. El sistema restringe funciones y datos según el rol
del usuario autenticado, validado en el servidor. La sesión se cierra automáticamente tras 15 minutos de
inactividad y el usuario puede cerrarla manualmente. Un empleado solo puede ver y operar su propio pedido.

**Why this priority**: Es transversal y condición de confianza del sistema (datos de personas, envíos a
terceros). Sin control de acceso correcto, ninguna otra historia es segura de operar. P1.

**Independent Test**: Un usuario no autenticado es redirigido al login sin ver datos. Un empleado no puede
acceder a funciones/endpoints de Secretaría o Administrador ni al pedido de otro empleado. Tras 15 minutos
de inactividad, la sesión expira.

**Acceptance Scenarios**:

1. **Given** un usuario no autenticado, **When** intenta acceder a cualquier pantalla, **Then** es
   redirigido al login y no se muestran datos.
2. **Given** un usuario con rol Empleado, **When** intenta acceder a una función o endpoint de Secretaría
   o Administrador, **Then** el sistema deniega el acceso.
3. **Given** un empleado autenticado, **When** intenta ver o editar el pedido de otro empleado, **Then**
   el sistema lo deniega y solo le permite operar su propio pedido.
4. **Given** un usuario con sesión iniciada, **When** transcurren 15 minutos sin actividad, **Then** la
   sesión expira y se solicita un nuevo login.
5. **Given** un usuario autenticado, **When** elige cerrar sesión, **Then** la sesión se cierra y se
   requiere un nuevo login.

---

### User Story 8 - Depuración diaria de menús y pedidos (Priority: P1)

Todos los días a las 15:00 hs el sistema elimina automáticamente toda la información de pedidos y menús
del día (y de días anteriores no depurados), registrando cada ejecución. El Administrador puede ejecutar
la depuración manualmente como respaldo ante un fallo, y consultar el historial de ejecuciones con su
resultado.

**Why this priority**: Es una obligación irreversible del diseño (privacidad y modelo de datos efímero) y
la única forma de mantener el sistema consistente día a día. P1 porque su ausencia o mal funcionamiento
corrompe la operación y viola la especificación.

**Independent Test**: Con menús y pedidos cargados, al llegar las 15:00 hs el sistema elimina toda la
información del día y registra la ejecución. El Administrador dispara la depuración manual y aparece en el
historial identificada como manual; un no-Administrador no puede dispararla.

**Acceptance Scenarios**:

1. **Given** hay menús y pedidos cargados, **When** son las 15:00 hs, **Then** el sistema elimina toda la
   información de pedidos y menús del día y registra la ejecución.
2. **Given** el Administrador, **When** ejecuta la depuración manual, **Then** el sistema elimina menús y
   pedidos y registra la ejecución identificada como manual.
3. **Given** un usuario que no es Administrador, **When** intenta ejecutar la depuración manual, **Then**
   el sistema deniega el acceso.
4. **Given** el Administrador, **When** consulta el historial de depuraciones, **Then** ve cada ejecución
   (automática o manual) con su resultado (éxito o fallo).

---

### Edge Cases

- **Fin de semana**: sábados y domingos el sistema impide la carga de pedidos e informa el motivo.
- **Corte de las 13:00 hs**: exactamente a las 13:00 hs y después, se rechaza que el empleado cargue,
  edite o anule su propio pedido (incluidos tardíos); la Secretaría conserva la baja de pedidos no
  enviados y el envío a proveedores después del corte.
- **Sin menús cargados**: si ningún proveedor tiene menú del día, el empleado no puede pedir y el sistema
  informa que no hay menú disponible; si solo un proveedor cargó menú, el pedido se habilita con los platos
  de ese proveedor.
- **Acompañamiento faltante**: no se puede confirmar un plato que lo requiere sin indicarlo.
- **Doble pedido**: un empleado con pedido del día no puede crear otro; se lo dirige a editar o anular.
- **Editar/eliminar plato con pedidos asociados**: bloqueado para no comprometer pedidos existentes.
- **Baja de pedido ya enviado**: bloqueada; solo se pueden dar de baja pedidos no enviados.
- **Fallo del envío por correo**: cada envío por proveedor es independiente; se muestra el error y se
  permite reintentar. Los pedidos de un proveedor no se marcan como enviados si su envío no se completó, y
  el fallo de un proveedor no afecta a los demás. El reintento no debe generar correos duplicados de
  pedidos ya enviados (el mecanismo de idempotencia se define en el plan).
- **Eliminar proveedor con datos del día**: no se puede eliminar un proveedor que tenga menús o pedidos del
  día asociados; primero deben resolverse esos datos (o esperar a la depuración).
- **Fallo de la depuración automática**: se reintenta (al menos 3 veces) y se registra el fallo; el
  Administrador puede ejecutar la depuración manual de respaldo.
- **Envío adicional sin nuevos pedidos**: un envío adicional solo debe incluir pedidos nuevos desde el
  último envío; si no hay nuevos, es un no-op: no se envía correo ni se crea un `Envio`, y se informa que
  no hay pedidos pendientes para ese proveedor.
- **Auto-bloqueo del Administrador**: no puede desactivarse, eliminarse ni quitarse el rol a sí mismo.
- **Revocación de sesión**: si un usuario con sesión activa es desactivado, eliminado, cambiado de rol o se
  le restablece la contraseña, su siguiente request es rechazado (sesión invalidada) y debe volver a
  autenticarse.
- **Texto libre con caracteres especiales**: un acompañamiento o descripción con caracteres tipo HTML,
  comillas o saltos de línea se muestra literal (escapado) en la UI y en el correo, sin ejecutar ni alterar
  el encabezado del correo.
- **Zona horaria**: los cortes de 13:00 y 15:00 y la expiración de sesión se evalúan en la zona horaria
  de referencia GMT-3.

## Requirements *(mandatory)*

### Functional Requirements

**Acceso, roles y sesión**

- **FR-001**: El sistema MUST requerir login con email corporativo (identificador único, tratado sin
  distinguir mayúsculas/minúsculas) y contraseña para todo acceso, redirigiendo al login a los usuarios no
  autenticados sin mostrar datos. Ante un login fallido, el sistema MUST responder con un mensaje genérico
  que no revele si el email existe (anti-enumeración).
- **FR-002**: El sistema MUST soportar tres roles —Administrador, Secretaría y Empleado— y asignar a cada
  usuario exactamente un rol.
- **FR-003**: El sistema MUST restringir el acceso a cada funcionalidad y a cada dato según el rol del
  usuario autenticado, verificándolo del lado del servidor en todos los puntos de acceso.
- **FR-004**: El sistema MUST permitir que un empleado vea y opere únicamente su propio pedido.
- **FR-005**: El sistema MUST cerrar la sesión automáticamente tras 15 minutos de inactividad y MUST
  permitir al usuario cerrarla manualmente. La actividad que reinicia el temporizador MUST medirse como
  cualquier request autenticado al backend (expiración deslizante del lado del servidor); la interacción en
  la interfaz que no genera request no mantiene viva la sesión.

**Administración de usuarios y proveedores**

- **FR-006**: El sistema MUST permitir al Administrador crear, editar, activar/desactivar y eliminar
  usuarios, definiendo su rol, estableciendo la contraseña inicial al crear y pudiendo restablecerla al
  editar el usuario.
- **FR-007**: El sistema MUST impedir que el Administrador se desactive, se elimine o se quite el rol de
  Administrador a sí mismo, informando el motivo.
- **FR-008**: El sistema MUST impedir el inicio de sesión de un usuario desactivado y MUST permitirlo
  nuevamente al reactivarlo. Al desactivar, eliminar o cambiar el rol de un usuario, o al restablecer su
  contraseña, el sistema MUST revocar de inmediato sus sesiones activas del lado del servidor (el cambio no
  espera a la expiración por inactividad).
- **FR-009**: El sistema MUST permitir al Administrador gestionar los proveedores —crear, editar y
  eliminar— definiendo el nombre y el correo de destino de cada uno y aplicando el correo vigente a los
  envíos posteriores. La cantidad de proveedores la determina el Administrador (uno o más); el sistema NO
  MUST asumir un número fijo. El sistema MUST impedir eliminar un proveedor que tenga menús o pedidos del
  día asociados.

**Menú del día**

- **FR-010**: El sistema MUST permitir a la Secretaría cargar el menú del día indicando el proveedor de
  cada plato, admitiendo varias opciones de plato por proveedor.
- **FR-011**: El sistema MUST permitir marcar en cada plato si lleva acompañamiento (sí/no).
- **FR-012**: El sistema MUST permitir a la Secretaría editar o eliminar una opción de plato del menú del
  día únicamente mientras no comprometa pedidos ya realizados sobre ella.
- **FR-013**: El sistema MUST mostrar al empleado los platos disponibles de los proveedores que tengan
  menú cargado ese día, identificando claramente a qué proveedor pertenece cada plato. La carga de pedidos
  se habilita con al menos un proveedor con menú; si ninguno tiene menú cargado, el sistema MUST impedir el
  pedido e informar que no hay menú disponible.

**Pedido del empleado**

- **FR-014**: El sistema MUST habilitar a cualquier usuario activo (Empleado, Secretaría o Administrador) a
  registrar su propio pedido del día sin requerir padrón previo; el registro constituye la declaración de
  presencia autodeclarada y no altera las demás funciones del rol.
- **FR-015**: El sistema MUST permitir al empleado seleccionar libremente un plato de cualquiera de los
  proveedores que tengan menú cargado ese día.
- **FR-016**: El sistema MUST solicitar el acompañamiento como texto libre ingresado por el empleado
  cuando el plato elegido lo requiere. El sistema MUST recortar espacios (trim), rechazar el valor vacío o
  compuesto solo por espacios, y limitarlo a un máximo de 100 caracteres; MUST impedir la confirmación si
  no cumple estas reglas.
- **FR-017**: El sistema MUST impedir que un empleado registre un nuevo pedido si ya tiene un pedido para
  el día, ofreciéndole editar o anular el existente.
- **FR-018**: El sistema MUST permitir al empleado editar su propio pedido solo mientras no haya sido
  enviado al proveedor.
- **FR-019**: El sistema MUST impedir que el empleado cargue, edite o anule su pedido los sábados y
  domingos (GMT-3), informando el motivo.

**Consolidación y envío**

- **FR-020**: El sistema MUST mostrar a la Secretaría el listado de pedidos agrupado por proveedor, con
  nombre del empleado, plato y acompañamiento.
- **FR-021**: El sistema MUST permitir a la Secretaría enviar por correo a cada proveedor únicamente sus
  pedidos, a su correo de destino configurado. El correo MUST incluir, por cada pedido, el nombre del
  empleado, el plato y el acompañamiento, con un encabezado que identifique al proveedor y la fecha.
- **FR-022**: El sistema MUST marcar como enviados los pedidos incluidos en un envío, registrando fecha y
  hora. Cada envío a un proveedor MUST ser independiente y atómico: si el envío a un proveedor no se
  completó, sus pedidos NO MUST marcarse como enviados, y el fallo de un proveedor NO MUST afectar a los
  envíos de los demás.
- **FR-023**: El sistema MUST permitir a la Secretaría eliminar el pedido de un empleado mientras no haya
  sido enviado (habilitándolo a registrar de nuevo) y MUST impedir la baja de un pedido ya enviado.
- **FR-024**: El sistema MUST permitir registrar pedidos tardíos después del envío principal hasta las
  13:00 hs.
- **FR-025**: El sistema MUST impedir que un empleado cargue, edite o anule su propio pedido (incluidos
  tardíos) a partir de las 13:00 hs, informando que el horario cerró. Después del corte, la Secretaría MUST
  poder seguir dando de baja pedidos no enviados (FR-023) y enviando a proveedores (FR-021).
- **FR-026**: El sistema MUST rastrear los envíos por proveedor: cada envío a un proveedor incluye
  únicamente sus pedidos pendientes (aún no enviados). El primer envío a un proveedor es el "envío
  principal"; cada envío posterior a ese mismo proveedor es un envío "adicional" e MUST identificarse como
  "PEDIDO ADICIONAL" en el asunto del correo. Un envío adicional MUST no reincluir pedidos ya enviados.

**Depuración diaria**

- **FR-027**: El sistema MUST eliminar automáticamente toda la información del día —opciones de menú,
  pedidos y sus envíos— a las 15:00 hs, incluyendo datos de días anteriores no depurados, de forma
  irreversible. NO se eliminan usuarios, proveedores, el registro de depuración ni las sesiones.
- **FR-028**: El sistema MUST reintentar la depuración automática ante fallo (al menos 3 veces) y MUST
  registrar cada ejecución (exitosa o fallida).
- **FR-029**: El sistema MUST permitir al Administrador ejecutar la depuración manualmente como respaldo,
  registrando la ejecución identificada como manual, y MUST permitirle consultar el historial de
  ejecuciones con su resultado.

**Requisitos de calidad exigidos por el negocio**

- **FR-030**: El sistema MUST almacenar las contraseñas con hash seguro (no reversible), exigiendo una
  longitud mínima de 6 caracteres, y nunca en texto plano.
- **FR-031**: El sistema MUST usar transporte cifrado para el acceso a la aplicación y para el envío de
  correo.
- **FR-032**: El sistema MUST evaluar los cortes horarios (13:00 y 15:00) y la expiración de sesión en la
  zona horaria de referencia GMT-3. Asimismo, el "día" de la regla de un pedido por empleado por día (FR-017)
  es el día calendario en GMT-3.
- **FR-033**: El sistema MUST notificar exclusivamente por correo; NO debe usar ningún otro canal ni
  procesar pagos, delivery, control de asistencia externo ni stock. *(Restricción arquitectónica: se
  satisface por ausencia de integración de otros canales; verificable revisando que no existan
  configuración ni endpoints de SMS/push/WhatsApp, no con un test funcional de rechazo.)*
- **FR-034**: El sistema MUST tratar como dato los campos de texto libre provistos por el usuario
  (acompañamiento, descripción de plato) aplicando codificación de salida (escape) en todos los puntos de
  render —interfaz y correo— para prevenir inyección/XSS. El valor se almacena tal cual (sin alterar). En los
  campos que se incorporan al correo, el sistema MUST neutralizar saltos de línea y caracteres de control
  para prevenir la inyección de encabezados/contenido de correo. Esta neutralización MUST aplicarse a
  **todos** los campos que se renderizan en el correo (incluidos nombre del empleado y descripción de
  plato), no solo al acompañamiento.
- **FR-035**: El sistema MUST exigir un token anti-CSRF en todas las operaciones que cambian estado,
  manteniendo la cookie de sesión con `SameSite=Lax` como capa complementaria (no como única barrera).

### Key Entities *(include if feature involves data)*

- **Usuario**: persona que accede al sistema. Atributos: email corporativo (identificador de login, único
  por usuario sin distinguir mayúsculas/minúsculas; se normaliza a minúsculas y se recorta al guardar y al
  comparar), nombre, contraseña (almacenada de forma no reversible), rol único
  (Administrador/Secretaría/Empleado), estado (activo/inactivo).
- **Proveedor**: restaurante gestionado por el Administrador. Atributos: nombre, correo de destino para el
  envío. El Administrador determina cuántos proveedores existen (los crea, edita y elimina); no hay un
  número fijo. Se necesita al menos un proveedor con menú cargado para habilitar los pedidos del día.
- **Menú del día**: conjunto de opciones de plato cargadas para la fecha, asociadas a un proveedor.
- **Opción de plato**: ítem elegible del menú. Atributos: descripción, proveedor asociado, indicador de si
  lleva acompañamiento (sí/no). El indicador determina si al elegir el plato se pide el acompañamiento;
  no define opciones predefinidas de acompañamiento.
- **Pedido**: elección de un usuario para el día. Atributos: usuario, plato elegido (y su proveedor),
  acompañamiento como texto libre (solo cuando el plato lo requiere), estado (pendiente/enviado), marca
  temporal de envío. Único por usuario y día.
- **Envío**: acción de la Secretaría de mandar a un proveedor sus pedidos pendientes. Atributos: proveedor,
  fecha y hora, tipo (principal = primer envío a ese proveedor / adicional = envíos posteriores a ese
  proveedor), pedidos incluidos. El tipo se determina por proveedor, no globalmente.
- **Registro de depuración**: constancia de cada ejecución de borrado. Atributos: fecha y hora, tipo
  (automática/manual), resultado (éxito/fallo).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 pedidos perdidos por día: el 100% de los pedidos registrados a tiempo por empleados
  presentes queda incluido en un envío a su proveedor.
- **SC-002**: El tiempo operativo diario de la Secretaría en el proceso se reduce en ≥ 50% respecto del
  proceso manual con Outlook + Excel (eliminando la transcripción).
- **SC-003**: Trazabilidad completa: para cualquier día operativo, se puede determinar qué pidió cada
  empleado y qué se envió a cada proveedor (incluidos los tardíos) antes de la depuración de las 15:00 hs.
- **SC-004**: Las operaciones de carga de menú y de pedido responden en menos de 3 segundos en el
  percentil 95, con hasta 50 usuarios registrando su pedido en simultáneo.
- **SC-005**: Disponibilidad ≥ 99% durante la franja horaria hábil (mañana a mediodía). *(Objetivo
  operativo/infra: se sostiene con despliegue y monitoreo; el sistema expone un endpoint de salud
  (`GET /health`) para medirlo. No es una regla de negocio con test funcional.)*
- **SC-006**: El 100% de los intentos de operación fuera de las reglas (fin de semana, después de las
  13:00 hs, segundo pedido del día, acompañamiento faltante, acceso a datos de otro rol/empleado) es
  rechazado con un mensaje claro del motivo.
- **SC-007**: La depuración de las 15:00 hs se completa con éxito dentro de los 15 minutos posteriores en
  el 100% de los días operativos (contando reintentos y/o ejecución manual de respaldo), sin conservar
  datos del día.
- **SC-008**: Un empleado presente puede registrar su pedido del día en menos de 2 minutos desde el login.

## Assumptions

- **Zona horaria**: todas las reglas horarias (corte 13:00, depuración 15:00, expiración de sesión) se
  evalúan en GMT-3, según lo indicado en las dependencias del PRD.
- **Usuarios locales**: la autenticación usa usuarios locales del sistema; no hay integración con SSO ni
  Active Directory.
- **Presencia autodeclarada**: el registro del pedido es la declaración de presencia; el sistema no la
  verifica contra fichaje, molinetes ni RRHH.
- **Cantidad de proveedores variable**: el Administrador determina cuántos proveedores hay (uno o más),
  creándolos, editándolos o eliminándolos; el sistema no asume un número fijo. Para operar el pedido del día
  se necesita al menos un proveedor con menú cargado.
- **Política de contraseñas acotada (MVP)**: solo se exige longitud mínima de 6 caracteres + hash (RNF-01);
  complejidad, reuso, expiración y bloqueo por intentos fallidos de login quedan fuera de alcance del MVP.
- **Medición de objetivos de negocio**: la línea base del −50% (SC-002) se mide una sola vez sobre el
  proceso manual actual (Outlook + Excel), fuera del sistema; el "0 pedidos perdidos" (SC-001) se evidencia
  con las confirmaciones de envío registradas antes de la depuración de las 15:00 hs.
- **Alcance web responsive**: la solución es una app web responsive (360 px a 1920 px, últimas 2 versiones
  de Chrome, Edge y Firefox); no hay app móvil nativa.
- **Correo como único canal**: la notificación a proveedores es exclusivamente por correo; no hay SMS,
  push ni WhatsApp.
- **Fuera de alcance**: pagos, delivery/logística, control de asistencia externo, integración SSO/AD,
  reportería histórica de largo plazo y gestión de stock quedan fuera del alcance.
- **Infraestructura de correo disponible**: existe un servidor de correo corporativo con un buzón dedicado
  y credenciales seguras, y los correos de destino de todos los proveedores están correctamente
  configurados.
- **Datos efímeros**: no se conserva información del día pasadas las 15:00 hs, por lo que no hay analítica
  histórica de largo plazo sobre pedidos.
