# UI Design — Sistema de Solicitud de Almuerzo (Vianda)

Guía de diseño del front (`apps/web`). Fija el lenguaje visual y los patrones de
componente para que todas las pantallas se vean como un mismo sistema. El
approach técnico es **Tailwind CSS** (ver decisión R12 en `research.md`).

> **Principio rector:** es una herramienta **interna** de uso diario. Prioridad:
> claridad, rapidez de lectura y bajo esfuerzo, por encima de lo decorativo.
> Nada de la seguridad ni de las reglas de negocio vive en la UI (Ppio II): el
> front solo aplica estilo y oculta por UX.

## Principios

1. **Funcional antes que decorativo.** Formularios, listas y tablas legibles de un vistazo.
2. **Un solo sistema.** Mismos colores, spacing y componentes en todas las pantallas.
3. **Accesible.** HTML semántico (`label`, `fieldset`/`legend`, `table`), foco visible, contraste AA.
4. **Responsive 360–1920 px** (ya fijado en `plan.md`). Mobile-first: se diseña angosto y se ensancha.
5. **Estados explícitos.** Cargando, vacío, error, deshabilitado y "enviado/solo lectura" siempre visibles.

## Tokens

Se usan como base los nombres de la paleta por defecto de Tailwind (facilita la
implementación); se centralizan en `tailwind.config` si hace falta renombrarlos.

### Color

| Rol | Token (Tailwind) | Uso |
| --- | --- | --- |
| Marca / acción primaria | `blue-600` (hover `blue-700`) | Botón principal, links activos, acento |
| Texto principal | `slate-900` | Títulos y cuerpo |
| Texto secundario | `slate-600` | Descripciones, ayudas, metadatos |
| Bordes / separadores | `slate-200` | Inputs, tarjetas, filas de tabla |
| Fondo página | `white` / `slate-50` | Fondo base y zonas sutiles |
| Éxito | `green-600` (texto `green-700`) | Mensaje "Pedido guardado" |
| Error | `red-600` | Mensajes de error (reemplaza el `crimson` actual) |
| Aviso | `amber-600` | Advertencias (ej. corte 13:00 próximo) |

Azul corporativo como color de marca: sobrio y neutro, el registro esperado de
una herramienta interna. Tema claro únicamente (el modo oscuro queda fuera de
alcance; ver más abajo).

Contraste mínimo AA (texto normal ≥ 4.5:1). Nunca comunicar solo por color:
acompañar con texto o ícono.

### Tipografía

- Familia: stack de sistema (`system-ui, -apple-system, Segoe UI, Roboto, sans-serif`) — ya en uso, sin fuentes externas.
- Escala (Tailwind): `text-2xl`/`font-bold` títulos de página · `text-lg`/`font-semibold` subtítulos · `text-base` cuerpo · `text-sm` ayudas y metadatos.

### Spacing, radios y sombra

- Espaciado: escala de 4 px de Tailwind (`gap-2`, `p-3`, `mb-4`, …).
- Radio: `rounded-md` (6 px) — coincide con el borde actual de las tarjetas.
- Sombra: **ninguna**. Diseño plano (tono minimalista utilitario); la separación se logra con bordes `slate-200`, no con sombras.

## Layout

- **Shell de página:** contenedor centrado `max-w-xl` (~576 px, cercano al 560 actual), con padding lateral (`px-4`) y vertical (`py-8`). Reemplaza el `style={{ maxWidth: 560, margin: '2rem auto' }}` repetido en cada pantalla.
- **Header:** título de la página a la izquierda; a la derecha, acciones de sesión (`Inicio` + `Cerrar sesión`, el `LogoutButton`). Se factoriza en un componente de layout para no repetirlo.
- **Home por rol:** tarjetas de navegación apiladas (una por acción disponible según el rol), con título + descripción corta. Es el patrón ya introducido en `app/page.tsx`.

## Componentes base

| Componente | Pauta |
| --- | --- |
| **Botón primario** | Fondo `blue-600`, texto blanco, `rounded-md`, `px-4 py-2`; hover `blue-700`; `disabled` atenuado + `cursor-not-allowed`. Acción principal de la pantalla (Confirmar pedido, Enviar). |
| **Botón secundario** | Borde `slate-300`, texto `slate-900`, fondo transparente. Acciones alternativas (Actualizar, volver). |
| **Botón destructivo** | Texto/borde `red-600`. Anular/eliminar pedido. Confirmación cuando la acción no es reversible. |
| **Input / select** | Borde `slate-300`, `rounded-md`, `px-3 py-2`, ancho completo; `focus` con anillo `blue`. Siempre con `label` asociado. |
| **Fieldset de menú** | `legend` con el nombre del proveedor en `font-semibold`; opciones como `radio` + `label` en bloque. |
| **Tabla (consolidado/usuarios)** | Encabezado `slate-600 text-sm`, filas separadas por borde `slate-200`, scroll horizontal en contenedor propio si desborda en móvil. |
| **Banner de mensaje** | Éxito: texto `green-700`. Error: texto `red-600`. Aparece cerca de la acción que lo generó. |
| **Tarjeta de navegación** | Bloque `border border-slate-200 rounded-md p-3` (plano, sin sombra), título + descripción; toda la tarjeta es clickeable (`Link`), con `hover:bg-slate-50`. |

## Estados

- **Cargando:** texto simple "Cargando…" (patrón ya usado en la home). No hace falta spinner para esta escala.
- **Vacío:** mensaje claro y accionable, ej. "No hay menú disponible para hoy."
- **Error:** banner `red-600` con el mensaje de la API; no romper la pantalla.
- **Deshabilitado / solo lectura:** cuando el pedido está `ENVIADO`, inputs `disabled` + nota "Tu pedido ya fue enviado y no puede modificarse".
- **Corte 13:00:** cuando la API responde el cierre horario, mostrarlo como aviso, no como error de sistema.

## Accesibilidad (checklist)

- Todo input con `label`; grupos con `fieldset`/`legend`.
- Foco visible (`focus-visible` con anillo) en botones, links e inputs.
- Contraste AA en texto y controles.
- Orden de tabulación lógico; la app es operable con teclado.
- No comunicar estado solo por color.

## Fuera de alcance (por ahora)

Modo oscuro, animaciones, librería de componentes externa e íconos custom no son
parte del MVP visual. Se pueden sumar después sin romper estos tokens.
