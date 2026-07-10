---
name: conventional-commit
description: >-
  Se usa al crear un commit o cuando el usuario pide un mensaje de commit.
  Genera mensajes siguiendo Conventional Commits: `tipo(scope): descripción`,
  con la descripción en imperativo, en minúscula, sin punto final y de como
  máximo 72 caracteres en la primera línea.
---

# Conventional Commit

Generás mensajes de commit que cumplen **Conventional Commits**. El objetivo es
una primera línea corta, consistente y en imperativo que describa el cambio.

## Formato

```
tipo(scope): descripción
```

- **tipo**: obligatorio. Uno de los tipos permitidos (ver abajo).
- **(scope)**: opcional. Área afectada entre paréntesis (`api`, `web`, `db`,
  `auth`, `menu`, `pedidos`, `deps`, …). Si no aporta claridad, omitilo.
- **descripción**: obligatoria, después de `: ` (dos puntos + un espacio).

## Reglas de la descripción (obligatorias)

1. En **imperativo**: "agrega", "corrige", "elimina" — no "agregado",
   "agregando" ni "agrega X y ademas Y".
2. Todo en **minúscula** (salvo nombres propios/siglas que lo exijan, p. ej.
   `SMTP`, `Prisma`).
3. **Sin punto final.**
4. La primera línea (`tipo(scope): descripción`) **no supera 72 caracteres**.
   Si no entra, acortá la descripción o llevá el detalle al cuerpo.

## Tipos permitidos

- **feat**: nueva funcionalidad.
- **fix**: corrección de un bug.
- **docs**: solo documentación.
- **style**: formato/estilo sin cambio de lógica (espacios, comas, etc.).
- **refactor**: reestructura el código sin cambiar comportamiento.
- **perf**: mejora de rendimiento.
- **test**: agrega o corrige tests.
- **build**: sistema de build o dependencias (pnpm, Prisma, Docker).
- **ci**: configuración de integración continua.
- **chore**: tareas varias que no tocan código de producción ni tests.
- **revert**: revierte un commit anterior.

## Cuerpo y pie (opcionales)

- Si el cambio necesita contexto, dejá **una línea en blanco** tras la primera
  línea y explicá el **qué y por qué** en el cuerpo (líneas ≤ 72 caracteres).
- **Breaking change**: agregá `!` antes de los dos puntos (`feat(api)!: ...`) y/o
  una línea `BREAKING CHANGE: <descripción>` en el pie.

## Flujo

1. Mirá el cambio real (diff o descripción del usuario) para elegir el **tipo**
   correcto y el **scope**.
2. Redactá la primera línea respetando las 4 reglas de la descripción.
3. Verificá el largo (≤ 72) y el imperativo antes de entregar.
4. Si el cambio mezcla varios propósitos, avisá que convendría separarlo en
   varios commits en lugar de forzar un mensaje genérico.

## Ejemplos

```
feat(pedidos): impide un segundo pedido por empleado en el día
fix(auth): expira la sesión tras 15 minutos de inactividad
docs: alinea CLAUDE.md con el nuevo AGENTS.md
build(deps): actualiza prisma a la ultima version estable
refactor(api): extrae la logica de envio SMTP a un servicio
chore: agrega .gitignore para node_modules y .env
```
