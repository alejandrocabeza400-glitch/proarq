# ProArq Backend V4 — Codebase Research Document

**Date:** 2026-05-23  
**Author:** Technical Research Specialist  
**Status:** RESEARCH_COMPLETE: Backend V4 Codebase Analysis

---

## 1. Pattern Reference (Per Layer)

### 1.1 Domain Entities (`packages/core/src/domain/entities/`)

**Pattern:** Pure TypeScript `interface` — no classes, no decorators, no framework imports.

```typescript
/** Pure domain entity — zero framework dependencies. */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}
```

**Conventions:**
- File: `*.entity.ts` (e.g., `user.entity.ts`, `insumo.entity.ts`)
- Named export of the interface
- Date fields use native `Date` type
- No Zod, no validation here — entities are structural contracts only
- UUID fields use `string` type (since UUIDs come as strings from DB)

**Where new files go:** `packages/core/src/domain/entities/`

**V4 entities to create:** `insumo.entity.ts`, `apu.entity.ts`, `apu-insumo.entity.ts`, `cotizacion.entity.ts`, `cotizacion-item.entity.ts`, `audit-log.entity.ts`

---

### 1.2 Inbound Ports (Input Validation) (`packages/core/src/application/ports/in/`)

**Pattern:** Zod schema + inferred type — single file exports both.

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

**Conventions:**
- File: `*.input.ts` (e.g., `create-user.input.ts`, `auth.input.ts`)
- Named export of the Zod schema (camelCase)
- Named export of the inferred type (PascalCase)
- Import `z` from `'zod'` (dependency on `zod` package)
- Only field-level validation, no business logic

**Where new files go:** `packages/core/src/application/ports/in/`

**V4 inputs to create:** `auth.input.ts`, `insumo.input.ts`, `apu.input.ts`, `cotizacion.input.ts`, `audit-log.input.ts`, `sync.input.ts`

---

### 1.3 Outbound Ports (Repository Interfaces) (`packages/core/src/application/ports/out/`)

**Pattern:** TypeScript `interface` with async methods.

```typescript
import type { User } from '../../../domain/entities/user.entity';

/** Output port (Driven Port): what the application needs from the outside world. */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: { name: string; email: string }): Promise<User>;
}
```

**Conventions:**
- File: `*.port.ts` (e.g., `user-repository.port.ts`)
- Named export of the interface
- Methods return `Promise<T>` (always async)
- Return `null` for "not found" cases, not `undefined`
- Parameters use primitive types or inline object types — not DTOs from inbound ports
- Entity import uses relative paths (e.g., `../../../domain/entities/`)

**Where new files go:** `packages/core/src/application/ports/out/`

**V4 ports to create:** `insumo-repository.port.ts`, `apu-repository.port.ts`, `cotizacion-repository.port.ts`, `audit-repository.port.ts`

---

### 1.4 Use Cases (`packages/core/src/application/use-cases/`)

**Pattern:** Class with constructor dependency injection — single public `execute()` method.

```typescript
import type { UserRepository } from '../ports/out/user-repository.port';
import type { CreateUserInput } from '../ports/in/create-user.input';
import type { User } from '../../domain/entities/user.entity';
import { AppError } from '../../errors/app.error';

export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }
    return this.userRepo.create(input);
  }
}
```

**Conventions:**
- File: `*.use-case.ts` (e.g., `create-user.use-case.ts`)
- **Class** (not function) with constructor injection
- Repository port injected as `private readonly` parameter
- Single public method named `execute()`
- Returns `Promise<T>` with domain entity type
- Business logic errors thrown as `AppError` (or subclass)
- Pure application logic — no HTTP, no DB, no framework
- Imports use `type` keyword for interfaces/types
- Relative imports only (never barrel imports from `@proarq/core`)

**Where new files go:** `packages/core/src/application/use-cases/`

**V4 use cases to create:**
- `auth-login.use-case.ts`
- `auth-forgot-password.use-case.ts`
- `auth-reset-password.use-case.ts`
- `manage-insumo.use-case.ts`
- `manage-apu.use-case.ts`
- `manage-cotizacion.use-case.ts`
- `branch-cotizacion.use-case.ts`
- `calculation.use-case.ts`
- `audit.use-case.ts`
- `sync.use-case.ts`

---

### 1.5 Controllers (`apps/api/src/infra/adapters/driving/controllers/`)

**Pattern:** Factory function that returns an Express request handler.

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import type { CreateUserInput } from '@proarq/core/application/ports/in/create-user.input';

/** Factory that creates an Express handler for POST /users */
export function createUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.body was already validated by the validate() middleware
      const user = await useCase.execute(req.body as CreateUserInput);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  };
}
```

**Conventions:**
- File: `*.controller.ts` (e.g., `user.controller.ts`, `insumo.controller.ts`)
- **Factory function** (not a class) — takes use case instance, returns handler
- Handler signature: `async (req, res, next) => { ... }`
- Response wrapped in `{ data: ... }` envelope
- Errors forwarded via `next(err)` (never caught in controller)
- Imports use `@proarq/core/...` sub-path exports (NOT barrel import `@proarq/core`)
- Use case type imported with `type` keyword
- `req.body` cast to input type (already validated by middleware)

**Where new files go:** `apps/api/src/infra/adapters/driving/controllers/`

**V4 controllers to create:**
- `auth.controller.ts`
- `insumo.controller.ts`
- `apu.controller.ts`
- `cotizacion.controller.ts`
- `audit.controller.ts`
- `sync.controller.ts`

---

### 1.6 Routes — Composition Root (`apps/api/src/infra/adapters/driving/routes/`)

**Pattern:** Instantiate use case with repository, wire middleware chain, export router.

```typescript
import { Router } from 'express';
import { createUserController } from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import { createUserSchema } from '@proarq/core/application/ports/in/create-user.input';
import { postgresUserRepo } from '../../driven/repositories/postgres-user.repository';

// Composition Root: wire use case → repository
const createUser = new CreateUserUseCase(postgresUserRepo);

export const router = Router();
router.post('/', validate(createUserSchema), createUserController(createUser));
```

**Conventions:**
- File: `*.routes.ts` (e.g., `user.routes.ts`, `insumo.routes.ts`)
- Composition root lives **in the routes file** — use case instantiated at module scope
- Repository imported directly from driven layer
- Middleware chain: `[auth?, checkRole?, validate?, controller]`
- Named export `router` (not default)
- Sub-path imports from `@proarq/core/...`

**Route index file** (`routes/index.ts`) — creates API version prefix:

```typescript
import { Router } from 'express';
import { router as healthRouter } from './health.routes';
import { router as userRouter } from './user.routes';

const router = Router();
const api = Router();

api.use('/health', healthRouter);
api.use('/users', userRouter);

router.use('/api/v1', api);

export { router };
```

**Where new files go:** `apps/api/src/infra/adapters/driving/routes/`

**V4 routes to create:** `auth.routes.ts`, `insumo.routes.ts`, `apu.routes.ts`, `cotizacion.routes.ts`, `audit.routes.ts`, `sync.routes.ts`

---

### 1.7 Middleware (`apps/api/src/infra/adapters/driving/middleware/`)

**Pattern A — Validation middleware (higher-order function):**

```typescript
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@proarq/core';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError(err.issues));
      } else {
        next(err);
      }
    }
  };
}
```

**Pattern B — Error handler (4-param Express middleware):**

```typescript
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@proarq/core';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.statusCode === 400 && 'details' in err ? { details: (err as any).details } : {}),
    });
    return;
  }
  console.error('[UNEXPECTED ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', ...(process.env.NODE_ENV === 'development' && { message: err.message }) });
}
```

**Conventions:**
- File: `*.middleware.ts` (e.g., `validate.middleware.ts`)
- Named export of the middleware function
- Error handler catches `AppError` subclasses and formats JSON response
- Unknown errors → 500 with optional dev message
- Validation middleware mutates `req.body` after successful parse

**Where new files go:** `apps/api/src/infra/adapters/driving/middleware/`

**V4 middleware to create:** `auth.middleware.ts`, `financial.middleware.ts`, `upload.middleware.ts`

---

### 1.8 Drizzle Schema (`apps/api/src/infra/adapters/driven/database/schema/`)

**Pattern:** `pgTable` with explicit column definitions.

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Conventions:**
- File: `*.schema.ts` (e.g., `user.schema.ts`, `insumo.schema.ts`)
- Named export of the table (plural lowercase, e.g., `users`, `insumosMaestro`)
- Column names: TS camelCase → DB snake_case (mapped via first arg)
- UUID columns: `uuid('id').defaultRandom().primaryKey()`
- Decimal columns: `numeric('cost_base', { precision: 12, scale: 2 }).notNull()`
- Timestamps: `timestamp('created_at').defaultNow().notNull()`
- Foreign keys: use `references()` on column definition
- Unique: use `.unique()` modifier
- CHECK constraints: use `.check()` or custom SQL via `pgEnum`
- Schema index file re-exports all schemas

**IMPORTANT — Drizzle UUID pattern for V4:**
```typescript
import { pgTable, uuid, text, varchar, timestamp, numeric, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const insumosMaestro = pgTable('insumos_maestro', {
  id: uuid('id').defaultRandom().primaryKey(),
  codigo: varchar('codigo', { length: 20 }).unique().notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  unidad: varchar('unidad', { length: 5 }).notNull(),
  costBase: numeric('cost_base', { precision: 12, scale: 2 }).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  unidadCheck: check('unidad_check', sql`${table.unidad} IN ('M3','KG','UND','GL')`),
}));
```

**Where new files go:** `apps/api/src/infra/adapters/driven/database/schema/`

**V4 schemas to create:**
- `insumo.schema.ts`
- `apu.schema.ts`
- `apu-insumo.schema.ts`
- `cotizacion.schema.ts`
- `cotizacion-item.schema.ts`
- `audit-log.schema.ts`

---

### 1.9 Repositories (`apps/api/src/infra/adapters/driven/repositories/`)

**Pattern:** Object literal implementing the port interface.

```typescript
import { db } from '../database/connection';
import { users } from '../database/schema/user.schema';
import { eq } from 'drizzle-orm';
import type { UserRepository } from '@proarq/core/application/ports/out/user-repository.port';
import type { User } from '@proarq/core/domain/entities/user.entity';

/** Postgres adapter that implements the UserRepository port. */
export const postgresUserRepo: UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  },

  async create(data: CreateUserInput): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },
};
```

**Conventions:**
- File: `*-<db>.repository.ts` (e.g., `postgres-user.repository.ts`)
- **Object literal** implementing the port interface (not a class)
- Named export with camelCase prefixed by db name: e.g., `postgresUserRepo`
- Uses `db` from `../database/connection`
- Implements ALL methods from the port interface
- Drizzle queries: `db.select()`, `db.insert()`, `db.update()`, `db.delete()`
- Single record: use `.limit(1)` + `result[0] ?? null`
- Insert with return: `db.insert(table).values(data).returning()`
- Import `eq`, `and`, `or`, `like`, `ilike`, `sql` from `drizzle-orm`

**Where new files go:** `apps/api/src/infra/adapters/driven/repositories/`

**V4 repositories to create:**
- `postgres-insumo.repository.ts`
- `postgres-apu.repository.ts`
- `postgres-cotizacion.repository.ts`
- `postgres-audit.repository.ts`

---

### 1.10 Errors (`packages/core/src/errors/`)

**Pattern:** Class extending `AppError` base class.

```typescript
// Base
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation
export class ValidationError extends AppError {
  public readonly details: ZodError['issues'];
  constructor(details: ZodError['issues']) {
    super('Validation failed', 400);
    this.details = details;
  }
}

// Not Found
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}
```

**Conventions:**
- File: `*.error.ts` (e.g., `app.error.ts`, `not-found.error.ts`)
- All extend `AppError`
- Set prototype chain: `Object.setPrototypeOf(this, new.target.prototype)`
- Error index file (`index.ts`) re-exports all errors with `export *`

**V4 error to create:** `forbidden.error.ts` (status 403)

---

## 2. Dependency Injection Flow (Composition Root)

The **route file** is the composition root. Here's the complete flow:

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/api/src/infra/adapters/driving/routes/user.routes.ts       │
│                                                                  │
│  1. Repository imported:                                         │
│     import { postgresUserRepo } from '../../driven/repositories/ │
│                         postgres-user.repository';               │
│                                                                  │
│  2. Use case instantiated:                                       │
│     const createUser = new CreateUserUseCase(postgresUserRepo);  │
│                                                                  │
│  3. Controller factory:                                          │
│     import { createUserController } from '../controllers/        │
│                                            user.controller';     │
│     router.post('/', validate(schema), createUserController(uc));│
│                                                                  │
│  4. Route registered in index.ts:                                │
│     api.use('/users', userRouter);                               │
│     router.use('/api/v1', api);                                  │
│                                                                  │
│  5. App.ts mounts router:                                        │
│     app.use(router);                                             │
│     app.use(errorHandler);                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Key points:**
- DI is manual (no container) — pure constructor injection
- Instances are singletons at module scope (created once when routes file is imported)
- Routes file acts as the "composition root" for its domain
- Schemas are imported directly (not instantiated)
- Audit repository will be injected into `ManageInsumoUseCase` constructor alongside `InsumoRepository`

---

## 3. Error Handling Chain

Complete flow of an error from use case → controller → middleware:

```
1. Use Case throws:
   throw new AppError('Email already in use', 409);

2. Controller catches and forwards:
   try {
     const user = await useCase.execute(req.body as CreateUserInput);
     res.status(201).json({ data: user });
   } catch (err) {
     next(err);   // ← Express calls next(err), skipping to error handler
   }

3. Error handler middleware formats response:
   if (err instanceof AppError) {
     res.status(err.statusCode).json({
       error: err.message,
       ...(err.statusCode === 400 && 'details' in err
         ? { details: (err as any).details }
         : {}),
     });
     return;
   }
   // Unknown errors → 500
   res.status(500).json({ error: 'Internal Server Error', ... });
```

**Error routing in Express:**
- The error handler is mounted LAST in `app.ts`: `app.use(errorHandler)`
- It has 4 parameters `(err, req, res, next)` — Express recognizes this as error middleware
- Middleware that throws (like `validate`) also forwards via `next(err)`

**Error hierarchy:**
```
Error
 └── AppError (statusCode, isOperational)
      ├── ValidationError (status 400, details[])
      ├── NotFoundError (status 404, resource name)
      └── ForbiddenError (status 403)  ★ NEW for V4
```

---

## 4. Test Patterns

### Existing Test (`apps/api/src/__test__/health.test.ts`)

```typescript
import { describe, expect, it } from 'bun:test';
import request from 'supertest';
import { app } from '../app';

describe('Health endpoint', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

**Key observations:**
- **Test runner:** `bun:test` (Bun's built-in test runner)
- **HTTP assertions:** `supertest` with the Express `app` (no server.listen needed)
- **Test file location:** `apps/api/src/__test__/` for integration tests
- **No unit tests exist yet** for `packages/core`

### V4 Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  UNIT TESTS (packages/core)                                     │
│  ├── Location: packages/core/src/application/use-cases/__test__/│
│  ├── Runner: bun:test                                           │
│  ├── Approach: Mock repository interfaces, test use cases       │
│  └── Pattern:                                                   │
│        const mockRepo: UserRepository = {                        │
│          findByEmail: async () => null,                          │
│          create: async (data) => ({ id: 'uuid', ...data }),     │
│        };                                                        │
│        const uc = new CreateUserUseCase(mockRepo);               │
│        const result = await uc.execute(input);                   │
│        expect(result.email).toBe(input.email);                   │
│                                                                  │
│  INTEGRATION TESTS (apps/api)                                    │
│  ├── Location: apps/api/src/__test__/                            │
│  ├── Runner: bun:test + supertest                                │
│  ├── Approach: Real Express app, test database connection        │
│  └── Pattern:                                                    │
│        const res = await request(app).post('/api/v1/users')      │
│          .set('Authorization', `Bearer ${adminToken}`)           │
│          .send({ name: 'Test', email: 'test@test.com' });       │
│        expect(res.status).toBe(201);                             │
└─────────────────────────────────────────────────────────────────┘
```

**Test dependencies (already in package.json):** `supertest`, `@types/supertest`

---

## 5. Key Constraints Discovered

### 5.1 Drizzle UUID Handling
- Use `uuid()` from `drizzle-orm/pg-core`, NOT `serial()`
- Pattern: `uuid('id').defaultRandom().primaryKey()` — uses PostgreSQL's `gen_random_uuid()`
- Foreign keys: `uuid('created_by').references(() => users.id)`

### 5.2 postgres.js Connection Pooling
- Connection is created once: `postgres(env.DATABASE_URL)` — module-level singleton
- No pool configuration (uses defaults — max 10 connections)
- `drizzle(queryClient, { schema })` wraps the postgres.js client
- The `db` singleton is exported and used by all repositories
- For transactions: Drizzle exposes `db.transaction()` which maps to postgres.js `BEGIN/COMMIT/ROLLBACK`

### 5.3 Drizzle Kit Config
- Schema path: `./src/infra/adapters/driven/database/schema/index.ts`
- Output: `./migrations`
- Dialect: `postgresql`
- Uses env vars loaded at runtime (`bun --env-file=../../.env`)

### 5.4 Import Pattern — Sub-path Exports
- `@proarq/core` package.json uses sub-path exports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./domain/*": "./src/domain/*.ts",
    "./application/*": "./src/application/*.ts",
    "./errors": "./src/errors/index.ts"
  }
}
```

- Controllers import via sub-paths (e.g., `@proarq/core/application/use-cases/create-user.use-case`)
- The barrel `index.ts` is used sparingly — only for errors currently

### 5.5 Express Server Bootstrap
- `index.ts` imports `app` from `app.ts` and calls `app.listen(env.PORT)`
- `app.ts` creates the Express instance, adds global middleware (json, cors, router, error handler)
- This means `app.ts` can be imported by tests without starting the server

### 5.6 Package Version Strategy
- All external packages use `"latest"` version in package.json (not pinned)
- TypeScript is a peer dependency at root (`"typescript": "5"`)
- Biome v2.4.15 at root for linting + formatting
- Bun types at workspace root

### 5.7 CORS Configuration
- CORS origin configurable via `env.CORS_ORIGIN` (defaults to `'*'`)

### 5.8 Existing Directory Structure (for reference)

```
apps/api/src/
├── __test__/
│   └── health.test.ts
├── app.ts                              ← Express app factory
├── index.ts                            ← Server bootstrap
└── infra/
    ├── config/
    │   └── env.ts                      ← Zod-validated env vars
    └── adapters/
        ├── driving/                    ← Inbound adapters
        │   ├── controllers/
        │   │   ├── health.controller.ts
        │   │   └── user.controller.ts
        │   ├── middleware/
        │   │   ├── error-handler.middleware.ts
        │   │   └── validate.middleware.ts
        │   └── routes/
        │       ├── health.routes.ts
        │       ├── index.ts
        │       └── user.routes.ts
        └── driven/                     ← Outbound adapters
            ├── database/
            │   ├── connection.ts
            │   └── schema/
            │       ├── index.ts
            │       └── user.schema.ts
            └── repositories/
                └── postgres-user.repository.ts

packages/core/src/
├── index.ts
├── domain/
│   └── entities/
│       └── user.entity.ts
├── application/
│   ├── ports/
│   │   ├── in/
│   │   │   └── create-user.input.ts
│   │   └── out/
│   │       └── user-repository.port.ts
│   └── use-cases/
│       └── create-user.use-case.ts
└── errors/
    ├── app.error.ts
    ├── index.ts
    ├── not-found.error.ts
    └── validation.error.ts
```

---

## 6. Naming Convention Summary

| Layer | File Pattern | Export Style | Example |
|-------|-------------|-------------|---------|
| Entity | `*.entity.ts` | Named `interface` | `user.entity.ts` → `interface User` |
| Input Port | `*.input.ts` | Named schema + type | `create-user.input.ts` → `createUserSchema`, `CreateUserInput` |
| Output Port | `*.port.ts` | Named `interface` | `user-repository.port.ts` → `interface UserRepository` |
| Use Case | `*.use-case.ts` | Named `class` | `create-user.use-case.ts` → `class CreateUserUseCase` |
| Controller | `*.controller.ts` | Factory function named | `user.controller.ts` → `createUserController` |
| Route | `*.routes.ts` | Named `const router` | `user.routes.ts` → `router` |
| Middleware | `*.middleware.ts` | Named `function` | `validate.middleware.ts` → `function validate` |
| Schema | `*.schema.ts` | Named `const` table | `user.schema.ts` → `users` |
| Repository | `*-<db>.repository.ts` | Named `const` literal | `postgres-user.repository.ts` → `postgresUserRepo` |
| Error | `*.error.ts` | Named `class` | `app.error.ts` → `class AppError` |

---

## 7. Dependencies Master List

### Root (`package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| `@biomejs/biome` | 2.4.15 | Linting + formatting |
| `@types/bun` | latest | Bun type definitions |
| `typescript` | 5 (peer) | TypeScript compiler |

### Core (`packages/core/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | latest | Runtime schema validation |
| `decimal.js` | ★ NEW | Financial math (V4) |

### API (`apps/api/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| `@proarq/core` | workspace:* | Domain + application layer |
| `cors` | latest | CORS middleware |
| `drizzle-orm` | latest | ORM / Query builder |
| `express` | latest | HTTP framework |
| `postgres` | latest | PostgreSQL client |
| `zod` | latest | Runtime validation |
| `decimal.js` | ★ NEW | Financial math |
| `jsonwebtoken` | ★ NEW | JWT sign & verify |
| `csv-parse` | ★ NEW | CSV parsing |
| `pdfkit` | ★ NEW | PDF generation |
| `multer` | ★ NEW | File upload |
| `deep-diff` | ★ NEW | JSON diff for audit |
| `supertest` | dev | HTTP test assertions |
| `drizzle-kit` | dev | Migration generation |

---

**RESEARCH_COMPLETE: Backend V4 Codebase Analysis**
