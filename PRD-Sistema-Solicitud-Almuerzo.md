# PRD-001: Sistema de Solicitud de Almuerzo — App web para pedir, consolidar y enviar los almuerzos diarios a los proveedores.

## Contexto y Problema

Los empleados que asisten a la Oficina Central tienen como beneficio el almuerzo pago, eligiendo entre el menú del día de **los proveedores habilitados** (la cantidad la determina el Administrador). La empresa también ofrece **home office**, por lo que **quiénes asisten a la oficina cambia todos los días**: algunos van 1 vez por semana, otros 2, 3, 4 o toda la semana. No existe un padrón fijo de presentes. Hoy el proceso es manual y depende de mails de Outlook y una planilla Excel: la Secretaría reenvía los menús, cada empleado responde por mail lo que quiere comer, la Secretaría transcribe todo a un Excel y lo envía a cada restaurante. Al ser manual y sin trazabilidad, **empleados presentes se quedan sin almuerzo** pese a haberlo solicitado, y la Secretaría carga con un trabajo repetitivo y propenso a error que se repite todos los días hábiles porque el menú cambia a diario.

**Personas:**
- **Secretaría (carga y control de menú):** necesita cargar los menús del día por proveedor, controlar los pedidos y enviarlos a cada restaurante sin transcribir manualmente ni perder pedidos.
- **Empleado (carga de pedidos):** asiste a la oficina un número variable de días por semana; cuando está en la Oficina Central necesita ver los menús del día de los proveedores con menú cargado y registrar su pedido (plato y acompañamiento cuando corresponde) de forma simple y confiable.
- **Administrador:** necesita crear y gestionar los usuarios del sistema y sus roles, y los datos de los proveedores.

## Objetivos

- **Eliminar los almuerzos no entregados** a empleados presentes que pidieron a tiempo: meta de **0 pedidos perdidos por día**.
- **Reducir el tiempo operativo de la Secretaría** en el proceso diario en **≥ 50%** respecto del proceso manual actual, eliminando la transcripción a Excel.
- **Dar trazabilidad y control** sobre qué pidió cada empleado y qué se envió a cada proveedor, incluyendo los pedidos tardíos.
- **Estandarizar el manejo de casos borde** (pedidos tardíos, bajas, correcciones) que hoy se resuelven de forma ad-hoc.

## Requerimientos Funcionales

- RF-01: El sistema debe requerir login con usuario y contraseña para todo acceso.
- RF-02: El sistema debe soportar tres roles: Administrador, Secretaría y Empleado.
- RF-03: El sistema debe asignar a cada usuario exactamente un rol.
- RF-04: El sistema debe restringir el acceso a cada funcionalidad y a los datos según el rol del usuario autenticado.
- RF-05: El sistema debe permitir al Administrador crear un usuario, definiendo su rol.
- RF-06: El sistema debe permitir al Administrador editar los datos de un usuario.
- RF-07: El sistema debe permitir al Administrador activar o desactivar un usuario. El Administrador no puede desactivarse a sí mismo.
- RF-08: El sistema debe permitir al Administrador eliminar un usuario. El Administrador no puede eliminarse a sí mismo ni quitarse el rol de Administrador (para no bloquear el acceso administrativo del sistema).
- RF-09: El sistema debe permitir al Administrador gestionar los proveedores (crear, editar y eliminar), incluyendo el nombre y el correo de destino de cada uno. La cantidad de proveedores la determina el Administrador (uno o más); el sistema no asume un número fijo. No se puede eliminar un proveedor con menús o pedidos del día asociados.
- RF-10: El sistema debe permitir a la Secretaría cargar el menú del día indicando a qué proveedor corresponde, admitiendo varias opciones de plato por proveedor.
- RF-11: El sistema debe permitir a la Secretaría marcar, en cada plato, si lleva acompañamiento (sí/no).
- RF-12: El sistema debe permitir a la Secretaría editar una opción de plato del menú del día mientras no comprometa pedidos ya realizados.
- RF-13: El sistema debe permitir a la Secretaría eliminar una opción de plato del menú del día mientras no comprometa pedidos ya realizados.
- RF-14: El sistema debe habilitar a cualquier usuario activo (Empleado, Secretaría o Administrador) a registrar su propio pedido del día sin requerir un padrón previo de asistencia; el registro del pedido constituye la declaración de que asistió a la Oficina Central (presencia autodeclarada). Registrar el pedido es transversal a los roles y no altera las demás funciones de cada uno.
- RF-15: El sistema debe mostrar al empleado los menús del día de los proveedores que tengan menú cargado, identificando claramente a qué proveedor pertenece cada plato. Se habilita la carga con al menos un proveedor con menú.
- RF-16: El sistema debe permitir al empleado seleccionar un plato de cualquiera de los proveedores con menú cargado (elección libre).
- RF-17: El sistema debe solicitar al empleado el acompañamiento cuando el plato elegido está marcado como "lleva acompañamiento".
- RF-18: El sistema debe impedir la confirmación del pedido si falta el acompañamiento requerido.
- RF-19: El sistema debe impedir que un empleado registre un nuevo pedido si ya cuenta con una carga de menú para el día.
- RF-20: El sistema debe permitir al empleado editar únicamente su propio pedido, y solo mientras no haya sido enviado al proveedor.
- RF-21: El sistema debe impedir la carga de pedidos los sábados y domingos.
- RF-22: El sistema debe mostrar a la Secretaría el listado de pedidos agrupado por proveedor, con nombre del empleado, plato y acompañamiento.
- RF-23: El sistema debe permitir a la Secretaría enviar por correo (SMTP) a cada proveedor únicamente sus pedidos, a su correo de destino configurado.
- RF-24: El sistema debe marcar como enviados los pedidos incluidos en un envío, registrando su fecha y hora.
- RF-25: El sistema debe permitir a la Secretaría eliminar el pedido de un empleado mientras no haya sido enviado al proveedor, habilitándolo nuevamente para registrar uno. Una vez enviado, el pedido no puede darse de baja (se preserva la trazabilidad de lo enviado).
- RF-26: El sistema debe permitir registrar pedidos tardíos después del envío principal, hasta la hora de corte de las 13:00 hs.
- RF-27: El sistema debe impedir la carga, edición o baja de pedidos (incluidos los tardíos) a partir de las 13:00 hs, mostrando un mensaje de que el horario de pedidos cerró. El envío a proveedores por parte de la Secretaría sigue disponible después del corte.
- RF-28: El sistema debe permitir a la Secretaría realizar envíos adicionales que incluyan solo los pedidos nuevos desde el último envío, identificados como "PEDIDO ADICIONAL".
- RF-29: El sistema debe eliminar automáticamente toda la información de pedidos del día y de los menús cargados a las 15:00 hs. La depuración también elimina datos de días anteriores que no hayan sido depurados.
- RF-30: El sistema debe cerrar la sesión automáticamente tras 15 minutos de inactividad.
- RF-31: El sistema debe permitir al usuario cerrar su sesión manualmente.
- RF-32: El sistema debe permitir al Administrador ejecutar manualmente la depuración (borrado de menús y pedidos del día y de días anteriores) como mecanismo de recuperación ante un fallo de la depuración automática, registrando la ejecución igual que la automática.

## Requerimientos No Funcionales

- RNF-01: El sistema debe almacenar las contraseñas con hash seguro (bcrypt o argon2), nunca en texto plano ni con hashes reversibles/débiles, y exigir una longitud mínima de 6 caracteres al definirlas.
- RNF-02: El sistema debe expirar la sesión tras 15 minutos de inactividad.
- RNF-03: El sistema debe responder en < 3 s p95 en las operaciones de carga de menú y pedido.
- RNF-04: El sistema debe tener una disponibilidad ≥ 99% en la franja horaria hábil (mañana a mediodía).
- RNF-05: El sistema debe soportar hasta 50 usuarios concurrentes registrando su pedido en la franja de llegada sin degradación por encima del objetivo de RNF-03.
- RNF-06: El sistema debe ejecutar el borrado automático de las 15:00 hs todos los días, completándolo dentro de los 15 minutos posteriores, con al menos 3 reintentos ante fallo y registro de cada ejecución (exitosa o fallida).
- RNF-07: El sistema debe usar transporte cifrado (HTTPS en la aplicación y TLS en el envío SMTP).
- RNF-08: El sistema debe validar la autorización por rol en el backend en el 100% de los endpoints, no solo en la interfaz.
- RNF-09: El sistema debe funcionar en las últimas 2 versiones de Chrome, Edge y Firefox, y ser responsive en anchos de pantalla desde 360 px (móvil) hasta 1920 px (escritorio).

## Criterios de Aceptación

- AC-01 (RF-01): Dado un usuario no autenticado, cuando intenta acceder a cualquier pantalla del sistema, entonces es redirigido al login y no se muestran datos.
- AC-02 (RF-02): Dado el Administrador creando o editando un usuario, cuando abre el selector de rol, entonces las únicas opciones disponibles son Administrador, Secretaría y Empleado.
- AC-03 (RF-03): Dado que el Administrador crea un usuario, cuando le asigna un rol, entonces el usuario queda con exactamente un rol y opera con él al iniciar sesión.
- AC-04 (RF-04/RNF-08): Dado un usuario con rol Empleado, cuando intenta acceder a una función o endpoint propio de Secretaría o Administrador, entonces el sistema deniega el acceso.
- AC-05 (RF-04/RF-20): Dado un empleado autenticado, cuando intenta ver o editar el pedido de otro empleado, entonces el sistema lo deniega y solo le permite operar su propio pedido.
- AC-06 (RF-05): Dado el Administrador, cuando crea un usuario con un rol y credenciales iniciales, entonces ese usuario queda dado de alta y puede iniciar sesión.
- AC-07 (RF-06): Dado el Administrador, cuando edita los datos de un usuario, entonces los cambios quedan persistidos y visibles.
- AC-08 (RF-07): Dado el Administrador, cuando desactiva a un usuario, entonces ese usuario no puede iniciar sesión.
- AC-09 (RF-07): Dado un usuario desactivado, cuando el Administrador lo reactiva, entonces ese usuario vuelve a poder iniciar sesión.
- AC-10 (RF-08): Dado el Administrador, cuando elimina a un usuario, entonces ese usuario deja de existir y no puede iniciar sesión.
- AC-10b (RF-07/RF-08): Dado el Administrador autenticado, cuando intenta desactivarse, eliminarse o quitarse el rol de Administrador a sí mismo, entonces el sistema lo impide e informa el motivo.
- AC-11 (RF-09): Dado el Administrador, cuando modifica el correo de destino de un proveedor, entonces los envíos posteriores se dirigen a ese nuevo correo.
- AC-12 (RF-10): Dado la Secretaría, cuando carga varias opciones de plato indicando el proveedor, entonces quedan asociadas a ese proveedor y visibles para los empleados.
- AC-13 (RF-11): Dado un plato que la Secretaría marca como "lleva acompañamiento", cuando el empleado lo elige, entonces se le solicita el acompañamiento.
- AC-14 (RF-11): Dado un plato que la Secretaría no marca como "lleva acompañamiento", cuando el empleado lo elige, entonces no se le solicita acompañamiento.
- AC-15 (RF-12): Dado una opción de plato sin pedidos asociados, cuando la Secretaría la edita, entonces se guardan los cambios.
- AC-16 (RF-12): Dado una opción de plato con pedidos asociados, cuando la Secretaría intenta editarla, entonces el sistema no lo permite.
- AC-17 (RF-13): Dado una opción de plato sin pedidos asociados, cuando la Secretaría la elimina, entonces se quita del menú.
- AC-18 (RF-13): Dado una opción de plato con pedidos asociados, cuando la Secretaría intenta eliminarla, entonces el sistema no lo permite.
- AC-19 (RF-14): Dado un usuario activo (de cualquier rol) que asistió a la oficina, cuando ingresa al sistema, entonces puede registrar su propio pedido del día sin figurar en un padrón previo.
- AC-20 (RF-15): Dado que hay menús cargados de al menos un proveedor, cuando el empleado ingresa a pedir, entonces ve los platos de los proveedores con menú identificados por proveedor.
- AC-21 (RF-16): Dado que hay menús de uno o más proveedores, cuando el empleado selecciona, entonces puede elegir cualquier plato de cualquiera de los proveedores con menú.
- AC-22 (RF-17): Dado un plato marcado como "lleva acompañamiento", cuando el empleado lo elige, entonces el sistema le presenta el campo para indicar el acompañamiento.
- AC-23 (RF-18): Dado un plato que lleva acompañamiento, cuando el empleado intenta confirmar sin indicarlo, entonces el sistema no permite confirmar e indica el motivo.
- AC-24 (RF-19): Dado un empleado que ya registró su pedido del día, cuando intenta cargar otro, entonces el sistema lo impide y le ofrece editar o anular el existente.
- AC-25 (RF-20): Dado un empleado con un pedido aún no enviado, cuando lo edita, entonces el cambio se guarda.
- AC-26 (RF-20): Dado un empleado con un pedido ya enviado, cuando intenta editarlo, entonces el sistema no lo permite.
- AC-27 (RF-21): Dado que es sábado o domingo, cuando un empleado intenta cargar un pedido, entonces el sistema lo impide e informa el motivo.
- AC-28 (RF-22): Dado pedidos de distintos proveedores, cuando la Secretaría abre el consolidado, entonces los ve agrupados por proveedor con nombre del empleado, plato y acompañamiento.
- AC-29 (RF-23): Dado pedidos pendientes de distintos proveedores, cuando la Secretaría envía, entonces cada proveedor recibe por correo únicamente sus pedidos a su correo de destino configurado.
- AC-30 (RF-24): Dado un envío realizado, cuando se completa, entonces los pedidos incluidos quedan marcados como "enviados" con fecha y hora.
- AC-31 (RF-25): Dado un pedido cargado y aún no enviado, cuando la Secretaría lo elimina, entonces el pedido se borra y el empleado vuelve a poder registrar uno.
- AC-31b (RF-25): Dado un pedido ya enviado al proveedor, cuando la Secretaría intenta darlo de baja, entonces el sistema lo impide e informa que no puede eliminarse un pedido enviado.
- AC-32 (RF-26): Dado que la Secretaría ya realizó el envío principal y son antes de las 13:00 hs, cuando un empleado que llegó tarde registra su pedido, entonces el sistema lo acepta y queda pendiente de envío.
- AC-33 (RF-27): Dado que son las 13:00 hs o una hora posterior, cuando un empleado intenta cargar, editar o anular un pedido, entonces el sistema lo impide e informa que el horario de pedidos cerró.
- AC-33b (RF-27): Dado que son las 13:00 hs o una hora posterior y hay pedidos pendientes de envío, cuando la Secretaría los envía a los proveedores, entonces el sistema lo permite (el corte no aplica al envío).
- AC-34 (RF-28): Dado que ya se realizó el envío principal y luego se cargaron pedidos tardíos, cuando la Secretaría envía adicionales, entonces el correo contiene solo los pedidos nuevos y se identifica como "PEDIDO ADICIONAL".
- AC-35 (RF-29): Dado que hay menús y pedidos cargados, cuando son las 15:00 hs, entonces el sistema elimina toda la información de pedidos y menús del día.
- AC-36 (RF-30/RNF-02): Dado un usuario con sesión iniciada, cuando transcurren 15 minutos sin actividad, entonces la sesión expira y se solicita un nuevo login.
- AC-37 (RF-31): Dado un usuario autenticado, cuando elige cerrar sesión, entonces la sesión se cierra y se requiere un nuevo login para volver a operar.
- AC-38 (RNF-01): Dado que se crea o actualiza un usuario, cuando se guarda su contraseña, entonces se almacena como hash bcrypt/argon2 y nunca en texto plano.
- AC-39 (RNF-03/RNF-05): Dado 50 usuarios concurrentes en la franja de llegada, cuando registran su pedido, entonces las operaciones responden en < 3 s p95.
- AC-40 (RF-32): Dado el Administrador, cuando ejecuta la depuración manual, entonces el sistema elimina los menús y pedidos y registra la ejecución identificada como manual.
- AC-41 (RF-32/RF-04): Dado un usuario que no es Administrador, cuando intenta ejecutar la depuración manual, entonces el sistema deniega el acceso.
- AC-42 (RF-32/RNF-06): Dado el Administrador, cuando consulta el historial de depuraciones, entonces ve cada ejecución (automática o manual) con su resultado (éxito o fallo).

## Fuera de Alcance

- Gestión de pagos de cualquier tipo (el almuerzo es un beneficio ya pago).
- Delivery o logística de entrega de los almuerzos.
- Notificaciones por cualquier canal que no sea correo (Outlook/SMTP): sin SMS, push, WhatsApp ni avisos a proveedores por otro medio.
- Validación o control de asistencia real (fichaje, molinetes, RRHH): la presencia es autodeclarada y el sistema no la verifica contra un sistema externo.
- Integración con SSO / Active Directory: se usan usuarios locales del sistema.
- Aplicación móvil nativa (el alcance es una app web responsive).
- Reportería o analítica histórica de largo plazo, dado que la información del día se depura a las 15:00 hs.
- Gestión de stock o inventario de los proveedores.

## Riesgos y Dependencias

- Riesgo: el borrado automático de las 15:00 hs falla o no se ejecuta → mitigación: job programado con reintento, monitoreo y registro de ejecución (RNF-06), más ejecución manual de respaldo por parte del Administrador (RF-32).
- Riesgo: el envío por correo a un proveedor falla y la Secretaría no se entera → mitigación: confirmación de envío en pantalla y manejo de error visible que permita reintentar.
- Riesgo: se envían pedidos duplicados o se omiten tardíos → mitigación: marcado de pedidos enviados y envíos adicionales que incluyen solo lo nuevo (RF-24, RF-28).
- Riesgo: al ser presencia autodeclarada, un empleado registra un pedido sin estar realmente en la oficina → mitigación: esquema basado en confianza y posibilidad de la Secretaría de dar de baja el pedido (RF-25).
- Riesgo: pérdida de datos al depurar si un empleado aún no fue atendido → mitigación: la depuración es a las 15:00 hs, posterior a la franja de almuerzo y a la hora de corte de pedidos (13:00 hs).
- Riesgo: un empleado pide y luego se retira, generando un almuerzo sin destinatario → mitigación: baja de pedido por parte de la Secretaría (RF-25).
- Dependencia: disponibilidad de un servidor SMTP corporativo y un buzón dedicado con credenciales seguras.
- Dependencia: correos de destino de todos los proveedores correctamente configurados por el Administrador.
- Dependencia: los proveedores envían su menú del día a tiempo para que la Secretaría pueda cargarlo.
- Dependencia: definición de zona horaria de referencia (GMT-3) para el corte de pedidos (13:00 hs), la depuración (15:00 hs) y la expiración de sesión.
