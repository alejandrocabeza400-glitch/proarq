---
title: Monorepo Architecture
description: Reglas de organización packages/ vs apps/ para el monorepo TypeScript + Bun
agents: [build, devops, plan, spec]
---

# Monorepo Architecture — Constitución del proyecto

Este archivo define **cómo se organiza el código** en `proarq/`. Léelo antes de crear, mover o modificar cualquier módulo.

---

## 1. Estructura del monorepo

```
proarq/
├── packages/          → Código REUTILIZABLE (se importa como dependencia)
│   └── core/          → @proarq/core — tipos, interfaces, schemas compartidos
├── apps/              → Código EJECUTABLE (puntos de entrada, se despliegan)
│   └── (api/, cli/, worker/, web/, etc.)
├── package.json       → Workspace root (workspaces: ["packages/*", "apps/*"])
├── tsconfig.json      → Base config (puede ser tsconfig.base.json)
├── bun.lock
└── .agents/
    └── rules/         ← Reglas para agentes
```

> **⚠️ Nota:** El `package.json` raíz actualmente tiene un typo: `"appgs/*"` debe ser `"apps/*"`. Corregir si ves errores de resolución.

---

## 2. Regla de oro — Dirección de dependencias

```
  apps/ ──importa──> packages/   ✅ Permitido
  packages/ ──importa──> apps/   ❌ PROHIBIDO
```

- `apps/` **IMPORTA** desde `packages/`. Jamás al revés.
- `packages/` **NO SABE NADA** de `apps/`. Un package debe poder existir sin ninguna app.
- Si un `package/` necesita algo de una `app/`, ese código **está mal ubicado**: debe promoverse a `packages/`.
- Los packages se importan con el alias `@proarq/<name>`. Bun workspaces resuelve la ruta local automáticamente.

**Ejemplo correcto:**
```ts
// apps/api/src/routes/user.ts
import { User } from "@proarq/core";
```

**Ejemplo incorrecto (NUNCA):**
```ts
// packages/core/src/types.ts
import { apiConfig } from "@proarq/api"; // ❌ package no puede importar app
```

---

## 3. Propósito de cada carpeta

### 📦 `packages/` — Código reutilizable

Va aquí todo lo que **se comparte entre múltiples aplicaciones** o que **tiene sentido como unidad independiente**:

- Tipos e interfaces compartidas (`@proarq/core`)
- Utilidades y helpers
- Clientes de base de datos / modelos
- Validadores y schemas (Zod, etc.)
- Componentes UI compartidos
- Configuración reutilizable
- Middlewares comunes
- Loggers, metrics, telemetry

**Regla:** Si dos o más apps lo necesitan, es un package. Si una sola app lo necesita pero podría servir a otra en el futuro, también es un package.

### 🚀 `apps/` — Código ejecutable/desplegable

Va aquí todo lo que **se ejecuta o despliega como una unidad independiente**:

- Servidores HTTP (API, BFF)
- CLIs
- Workers / Colas / Background jobs
- Frontends (web, mobile)
- Cron jobs
- Webhooks

**Regla:** Cada app tiene su propio `package.json`, su propio `tsconfig`, y es un punto de entrada independiente. Las apps pueden depender de packages, pero **nunca** entre sí directamente.

---

## 4. Instrucciones específicas para el agente Build

Al crear un nuevo módulo, pregúntate:

> **"¿Esto es reutilizable (package) o es un punto de entrada ejecutable (app)?"**

| Si es...                    | Ubícalo en       |
|-----------------------------|-------------------|
| Reutilizable, compartible   | `packages/<name>/` |
| Ejecutable, desplegable     | `apps/<name>/`     |

### Comandos para dependencias internas

```bash
# Añadir dependencia interna correctamente
bun add @proarq/core@workspace:*

# Añadir dependencia externa en un package/app específico
cd packages/core && bun add zod
```

### DevDependencies compartidas

Las siguientes **devDependencies** van en el `package.json` RAÍZ, no en los packages/apps individuales:

- `typescript`
- `@types/bun`
- `biome` / `eslint` / `prettier`
- `husky` / `lint-staged`
- Cualquier herramienta de build/lint global

### Scripts del workspace

```bash
bun run --filter '*' dev       # Ejecuta dev en todos los workspaces
bun run --filter '@proarq/api' build   # Build solo de api
bun test --filter '@proarq/core'       # Test solo de core
```

---

## 5. Resumen rápido (30 segundos)

```
┌─────────────────────────────────────────────────────────────┐
│  ¿Nuevo módulo?                                             │
│                                                             │
│  ¿Es reutilizable/compartible?  ──>  packages/<name>/      │
│  ¿Es ejecutable/desplegable?    ──>  apps/<name>/          │
│                                                             │
│  apps importa packages ✅                                   │
│  packages importa apps   ❌                                 │
│                                                             │
│  Import alias: @proarq/<name>                               │
│  Dep interna:  bun add @proarq/<name>@workspace:*           │
│  DevDeps globales: en package.json raíz                     │
└─────────────────────────────────────────────────────────────┘

---

## 6. Herramientas — Biome

Biome es el linter y formatter oficial del proyecto. Reemplaza ESLint + Prettier.

- Configuración: `biome.json` en la raíz
- Formatear: `bun run format`
- Verificar formato: `bun run format:check`
- Lint + auto-fix: `bun run lint`
- Lint estricto (CI): `bun run lint:ci`

Reglas:
- `noExplicitAny` es warn (se permite con justificación)
- `noConsole` es warn (preferir logger dedicado)
- Indentación: 2 espacios, sin tabs
- Comillas simples en JS/TS
- Punto y coma obligatorio
- Ancho máximo de línea: 100
