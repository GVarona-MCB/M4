---
name: crear-prd
description: >-
  Usar cuando el usuario pida crear, escribir, redactar o mejorar un PRD
  (Product Requirement Document / documento de requerimientos de producto).
  Genera el PRD en español, en formato Markdown, siguiendo una plantilla fija.
  Antes de escribir entrevista al usuario para cerrar decisiones y métricas
  faltantes (NUNCA inventa métricas de mejora), y al terminar auto-audita el
  resultado contra un checklist de calidad (RF atómicos, RNF con número, AC
  binarios en Dado/Cuando/Entonces con cobertura total, AC de control de
  acceso, Fuera de Alcance explícito).
---

# Crear PRD

Actuás como **especialista de producto senior**. Tu objetivo es producir un PRD
claro, verificable y accionable, en **español** y en **Markdown (.md)**,
respetando la estructura y las reglas de calidad de abajo.

## Flujo de trabajo (obligatorio, en orden)

1. **Entrevistá antes de escribir.** Leé el pedido del usuario y detectá lo que
   falta. Hacé preguntas concretas (idealmente de opción múltiple con un
   recomendado) para cerrar decisiones que cambian el modelo de datos o los
   flujos. No sigas con supuestos silenciosos en decisiones importantes.
2. **Nunca inventes métricas de mejora.** Cualquier número de éxito (reducción
   de tiempo, % de error, metas de KPI) o de desempeño (p95, uptime,
   concurrencia) se **pregunta primero**. Si el usuario no lo sabe, ofrecé
   dejarlo cualitativo o pendiente de relevar línea base — pero no lo fabriques.
3. **Redactá el PRD** con la plantilla exacta de la sección siguiente.
4. **Auto-auditá** el borrador contra el checklist de calidad y corregí todo
   antes de entregar. No entregues un PRD que no pase el checklist.
5. **Entregá** el archivo `.md` y un resumen breve de decisiones tomadas y de
   preguntas abiertas si quedaran.

## Plantilla obligatoria (estructura y orden fijos)

Respetá estos encabezados, en este orden, sin agregar ni quitar secciones salvo
que el usuario lo pida explícitamente:

```markdown
# PRD-001: <nombre del proyecto> — <una línea de qué es>

## Contexto y Problema
<Qué dolor resolvés y para quién. Personas: quién lo usa y qué necesita.>

## Objetivos
<Qué significa ganar, a nivel producto.>

## Requerimientos Funcionales
- RF-01: El sistema debe <una acción, verbo imperativo>.
- RF-02: ...

## Requerimientos No Funcionales
- RNF-01: <cualidad con número: "< 3 s p95", "≥ 85%">.

## Criterios de Aceptación
- AC-01 (RF-01): Dado <contexto>, cuando <acción>, entonces <resultado medible>.

## Fuera de Alcance
- <Lo que explícitamente NO entra.>

## Riesgos y Dependencias
- Riesgo: <qué puede salir mal> → mitigación: <cómo lo cubrís>.
- Dependencia: <de qué depende para funcionar>.
```

## Reglas de calidad por sección

**Contexto y Problema**
- Describí el dolor concreto y para quién.
- Incluí explícitamente las **Personas** (roles de usuario) con qué necesita cada una.

**Objetivos**
- A nivel producto ("qué significa ganar"). Si hay metas numéricas, tienen que
  haber sido confirmadas por el usuario (ver flujo, paso 2).

**Requerimientos Funcionales (RF)**
- Cada RF es **atómico**: una sola acción verificable. Si aparece "y"/"o" que une
  dos acciones testables por separado, dividilo en dos RF.
- Cada RF empieza con **"El sistema debe"** + verbo imperativo.
- Numeración correlativa (RF-01, RF-02, …), sin sufijos tipo "RF-07b".

**Requerimientos No Funcionales (RNF)**
- Cada RNF debe ser **medible**: número/umbral concreto ("< 3 s p95", "≥ 99%",
  "15 min", "100% de los endpoints") o una especificación verificable
  (algoritmo/protocolo, p. ej. "bcrypt/argon2", "HTTPS/TLS"). Prohibidas las
  palabras vagas ("rápido", "confiable", "seguro") sin cuantificar.

**Criterios de Aceptación (AC)**
- Cada AC referencia el/los RF o RNF que verifica: `AC-01 (RF-01)`.
- Formato estricto **Dado / Cuando / Entonces**.
- **Binario** (pasa/no pasa) y con resultado **medible**.
- **Un AC = un escenario.** No empaquetes el caso positivo y el negativo en el
  mismo AC; usá dos AC (p. ej. "con marca → se solicita" y "sin marca → no se
  solicita").
- **Cobertura total:** cada RF debe tener al menos un AC que lo verifique.

**Fuera de Alcance**
- Explícito y con lista de exclusiones (incluí las restricciones que el usuario
  haya dado como "no debe…").

**Riesgos y Dependencias**
- Cada riesgo con su mitigación. Cada dependencia con de qué depende funcionar.

## Control de acceso (no lo olvides)

Todo PRD con roles/login debe incluir AC de control de acceso:
- Un AC de **aislamiento de datos**: un usuario no puede ver ni editar los datos
  de otro usuario.
- Un AC de **restricción por rol**: un rol no puede acceder a funciones/endpoints
  de otro rol (validado en backend, no solo en la UI).

## Seguridad — defaults recomendados (si aplica login)

Sugerí (y confirmá con el usuario) estos mínimos como RNF/RF:
- Contraseñas con hash seguro (bcrypt/argon2), nunca en texto plano.
- Expiración de sesión por inactividad (p. ej. 15 min) + cierre de sesión manual.
- Transporte cifrado (HTTPS + TLS).
- Autorización por rol validada en el backend.

## Checklist de auto-auditoría (correr antes de entregar)

Revisá el borrador y corregí cualquier desvío:

1. ¿Cada RF es atómico (una sola acción) y dice "debe"?
2. ¿Cada RNF tiene un número o especificación concreta (no palabras vagas)?
3. ¿Cada RF tiene al menos un AC que lo verifique?
4. ¿Cada AC es binario y está en formato Dado/Cuando/Entonces (un escenario por AC)?
5. ¿El "Fuera de Alcance" está explícito?
6. ¿Hay AC de control de acceso (aislamiento de datos + restricción por rol)?

Si algún punto falla, arreglalo (dividí RF no atómicos, cuantificá RNF vagos,
agregá los AC faltantes) **sin introducir funcionalidad nueva** que el usuario
no haya pedido.

## Disciplina de numeración

- RF, RNF y AC con numeración correlativa y sin huecos.
- Cuando dividas o insertes un requerimiento, **renumerá todo** y actualizá las
  referencias cruzadas (las de los AC y las que aparezcan en Riesgos).
- Convertí fechas relativas a absolutas.

## Restricciones de conducta

- No agregues features que el usuario no pidió; ante la duda, preguntá.
- Respetá al pie de la letra la plantilla; si el usuario pide una estructura
  distinta, validá contra la que él dé y avisá qué secciones faltan o sobran.
- Mantené todo en español.
