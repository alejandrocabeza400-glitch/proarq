---
title: Drizzle ORM Schema Modularization
description: Reglas para organizar esquemas de Drizzle en archivos modulares con barrel export
agents: [build, devops, plan, spec]
---

# Drizzle ORM Schema Modularization — Constitución de esquemas

Este archivo define **cómo se organizan los esquemas de Drizzle ORM** en `apps/api/src/db/schema/`. Léelo antes de crear, modificar o eliminar cualquier tabla.

---

## 1. One file per entity (Single Responsibility)

Cada tabla de base de datos tiene su propio archivo `*.schema.ts` dentro de `apps/api/src/db/schema/`.

- **Name pattern:** `kebab-case.entity.schema.ts`
- **Ejemplos:** `user.schema.ts`, `post.schema.ts`, `refresh-token.schema.ts`

```
apps/api/src/db/
├── schema/
│   ├── index.ts              → Barrel: re-exporta todos los schemas
│   ├── user.schema.ts        → Tabla users
│   ├── post.schema.ts        → Tabla posts
│   ├── refresh-token.schema.ts → Tabla refresh_tokens
│   └── ...
├── connection.ts             → Crea la instancia db con drizzle()
└── migrations/               → Generado por drizzle-kit
```

> **⚠️ No agrupes múltiples tablas en un mismo archivo.** Cada entidad tiene su propio schema file. Esto mantiene el código predecible, facilita el code review y evita conflictos de merge.

---

## 2. Barrel pattern (`index.ts`)

El archivo `apps/api/src/db/schema/index.ts` es un **barrel file** que re-exporta todos los schemas:

```ts
export * from './user.schema'
export * from './post.schema'
export * from './refresh-token.schema'
```

Esto permite que `connection.ts` consuma todos los schemas con un solo import:

```ts
import * as schema from './schema'

export const db = drizzle(queryClient, {schema})
```

### Reglas del barrel:

- **Solo re-exporta.** `index.ts` no debe definir tablas, tipos ni lógica — únicamente `export * from './...'`.
- **Una línea por schema.** Cada nueva tabla añade su línea al barrel.
- **Mantén el orden alfabético** de las líneas para facilitar la lectura.

---

## 3. Named exports (NO default exports)

Cada schema file debe usar **named export** (`export const`), nunca `export default`.

```ts
// ✅ CORRECTO
export const users = pgTable('users', { ... });

// ❌ INCORRECTO
export default pgTable('users', { ... }); // No usar default export
// ❌ export default users;
```

**Razón:** `import * as schema` + `drizzle(queryClient, {schema})` necesita que Drizzle pueda leer los nombres exportados como claves del objeto `schema`. Los default exports rompen este mecanismo.

---

## 4. Table naming convention

| Ámbito             | Convención       | Ejemplo DB           | Ejemplo TS            |
|--------------------|------------------|----------------------|-----------------------|
| Nombre de tabla    | `snake_case` plural | `'users'`           | `users` (camelCase)   |
| Nombre de columna  | `snake_case`     | `'created_at'`       | `createdAt` (camelCase) |
| Variable de tabla  | `camelCase` plural | —                   | `users`, `refreshTokens` |

**Ejemplo concreto:**

```ts
export const refreshTokens = pgTable('refresh_tokens', {
    id: serial('id').primaryKey(),
    token: text('token').notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
})
```

> Drizzle ORM mapea automáticamente `snake_case` en DB a `camelCase` en TypeScript. La convención es usar el nombre DB en el primer argumento del column builder y el nombre TS en la clave de la propiedad.

---

## 5. Relations between tables

Cuando una tabla referencia a otra (clave foránea), importa la tabla destino directamente:

```ts
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: integer('author_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
})
```

### ⚠️ Circular dependencies

Si dos tablas se referencian mutuamente, puedes obtener un error de circular dependency. Para evitarlo:

- **Usa Drizzle Relations** con `lazy` import en lugar de referencias circulares directas.
- Si necesitas `references()` en ambos sentidos, extrae la relación a un archivo de `relations` separado usando `import type` + lazy import:

```ts
// En un archivo de relations separado (ej. user.relations.ts)
import { relations } from 'drizzle-orm'
import { posts } from './post.schema'

export const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts)
}))
```

---

## 6. Ejemplo: añadir una nueva tabla (`posts`)

### Paso 1: Crear `apps/api/src/db/schema/post.schema.ts`

```ts
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: integer('author_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
})
```

### Paso 2: Registrar en `apps/api/src/db/schema/index.ts`

```ts
export * from './post.schema'
export * from './user.schema'
```

> **⚠️** Añadir línea **después** de `export * from './user.schema'` si `post.schema` importa desde `user.schema` (el orden en barrel no afecta la ejecución, pero conviene mantener orden alfabético).

### Paso 3: Usar en queries

```ts
import { db } from '../db/connection'

const allPosts = await db.query.posts.findMany({
    with: { author: true }
})
```

---

## 7. Drizzle Kit (migrations) compatibility

El barrel pattern es **totalmente compatible** con `drizzle-kit`:

```bash
# Generar migraciones
bunx drizzle-kit generate

# Pushear schema a DB (dev)
bunx drizzle-kit push

# Abrir Drizzle Studio
bunx drizzle-kit studio
```

### Cómo funciona:

- `drizzle-kit` lee el objeto `schema` que se pasa a `drizzle(queryClient, {schema})`, no la estructura de archivos.
- El barrel `schema/index.ts` + `connection.ts` ya expone todas las tablas en el formato que Drizzle Kit espera.
- **No se necesita configuración adicional** en `drizzle.config.ts` más allá de apuntar a `connection.ts` o al barrel.

**Ejemplo de `drizzle.config.ts`:**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './apps/api/src/db/schema/index.ts',
    out: './apps/api/src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL! }
})
```

> **⚠️** Si usas `push` en producción, revisa siempre las migraciones generadas antes de aplicarlas. Prefiere `generate` + revisión manual sobre `push` directo.

---

## 8. Resumen rápido (30 segundos)

```
┌──────────────────────────────────────────────────────────────────┐
│  ¿Nueva tabla?                                                   │
│                                                                  │
│  1. Crear:  apps/api/src/db/schema/<entity>.schema.ts           │
│  2. Export: export const camelCaseName = pgTable('snake_name', { │
│  3. Barrel: export * from './<entity>.schema' en index.ts        │
│  4. Migrate: bunx drizzle-kit generate                           │
│                                                                  │
│  Reglas clave:                                                   │
│  - Un archivo por entidad                                        │
│  - Named exports (nunca default)                                 │
│  - camelCase TS / snake_case DB                                  │
│  - Índice solo re-exporta (no definir tablas ahí)                │
│  - Import directo entre schemas para references()                │
│  - Evitar circular dependencies                                  │
└──────────────────────────────────────────────────────────────────┘
```
