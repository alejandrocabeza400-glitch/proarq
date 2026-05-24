# @proarq/api — Infrastructure Layer

This package is the **Infrastructure Layer** of the ProArq application. It implements the driving (inbound) and driven (outbound) adapters for the Clean Architecture + Hexagonal pattern defined in `packages/core`.

---

## Table of Contents

- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Directory Structure](#directory-structure)
  - [Controllers (Driving)](#controllers-driving)
  - [Middleware (Driving)](#middleware-driving)
  - [Routes (Driving)](#routes-driving)
  - [Database Schema (Driven)](#database-schema-driven)
  - [Repositories (Driven)](#repositories-driven)
- [Request Flow](#request-flow)
- [Testing](#testing)
- [Migrations](#migrations)

---

## Available Scripts

```bash
# Development
bun --env-file=../../.env --watch src/index.ts

# Production
bun build ./src/index.ts --outdir ./dist --target bun
bun run dist/index.js

# Database
bun --env-file=../../.env drizzle-kit generate   # Generate migration
bun --env-file=../../.env drizzle-kit migrate     # Run migrations
bun --env-file=../../.env drizzle-kit push        # Push schema (dev only)
bun --env-file=../../.env drizzle-kit studio      # Open Drizzle Studio

# Testing
bun --env-file=../../.env src/__test__/setup/seed.ts && \  # Seed + run
bun --env-file=../../.env test src/__test__/unit/ \
  src/__test__/middleware/ \
  src/__test__/health.test.ts \
  src/__test__/integration/auth.test.ts && \
bun --env-file=../../.env src/__test__/setup/seed.ts && \
bun --env-file=../../.env test src/__test__/integration/users.test.ts && \
# ... (repeated for each integration test file)
```

Shorthand via root monorepo:

```bash
bun run --filter api dev
bun run --filter api build
bun run --filter api test
bun run --filter api db:generate
bun run --filter api db:migrate
bun run --filter api db:studio
```

---

## Environment Variables

All environment variables are validated at startup via Zod schema in `src/infra/config/env.ts`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `PORT` | ❌ | `3000` | HTTP server port |
| `NODE_ENV` | ❌ | `development` | `development`, `production`, or `test` |
| `CORS_ORIGIN` | ❌ | `*` | CORS allowed origin |
| `JWT_SECRET` | ✅ (≥ 32 chars) | — | JWT signing secret |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT token expiry duration |
| `PDF_UPLOAD_DIR` | ❌ | `./uploads/pdf` | Directory for PDF uploads |
| `LOGO_URL` | ❌ | `''` | Company logo URL for PDF generation |
| `DATABASE_URL_TEST` | ❌ | — | Separate test database URL |

The `.env` file is loaded from the monorepo root (`../../.env`) via Bun's `--env-file` flag. A minimal template is available at `apps/api/.env.example`.

---

## Directory Structure

```
apps/api/src/
├── index.ts                                     # Server bootstrap: starts Express, connects DB
├── app.ts                                       # Express app factory (CORS, JSON, routes, error handler)
│
├── infra/
│   ├── config/
│   │   └── env.ts                               # Zod-validated environment variables
│   │
│   └── adapters/
│       ├── driving/                              # Inbound adapters (HTTP → Application)
│       │   ├── controllers/                      # HTTP request handlers (factory functions)
│       │   │   ├── health.controller.ts          #   GET /health
│       │   │   ├── auth.controller.ts            #   login, forgot-password, reset-password
│       │   │   ├── user.controller.ts            #   users CRUD
│       │   │   ├── insumo.controller.ts          #   insumos CRUD + bulk-upload
│       │   │   ├── apu.controller.ts             #   apus CRUD + add/remove insumos
│       │   │   ├── cotizacion.controller.ts      #   cotizaciones CRUD + branch + PDF
│       │   │   ├── audit.controller.ts           #   audit log queries
│       │   │   └── sync.controller.ts            #   sync endpoint
│       │   │
│       │   ├── middleware/                       # Express middleware
│       │   │   ├── auth.middleware.ts            #   JWT decode + checkRole() factory
│       │   │   ├── financial.middleware.ts       #   Profit margin ≥ 8% guard
│       │   │   ├── upload.middleware.ts          #   Multer CSV multipart parser
│       │   │   ├── validate.middleware.ts        #   Zod schema validation
│       │   │   └── error-handler.middleware.ts   #   Global error handler
│       │   │
│       │   └── routes/                           # Express routers (composition root)
│       │       ├── index.ts                      #   Aggregates all route modules under /api/v1
│       │       ├── health.routes.ts              #   GET /api/v1/health
│       │       ├── auth.routes.ts                #   POST /api/v1/auth/*
│       │       ├── user.routes.ts                #   /api/v1/users/*
│       │       ├── insumo.routes.ts              #   /api/v1/insumos/*
│       │       ├── apu.routes.ts                 #   /api/v1/apus/*
│       │       ├── cotizacion.routes.ts          #   /api/v1/cotizaciones/*
│       │       ├── audit.routes.ts               #   /api/v1/audit-logs/*
│       │       └── sync.routes.ts                #   POST /api/v1/sincronizar
│       │
│       └── driven/                               # Outbound adapters (Application → Infrastructure)
│           ├── database/
│           │   ├── connection.ts                 #   Postgres.js + Drizzle ORM client
│           │   └── schema/                       #   Drizzle table definitions
│           │       ├── index.ts                  #     Re-exports all schemas
│           │       ├── user.schema.ts            #     users table
│           │       ├── insumo.schema.ts          #     insumos_maestro table
│           │       ├── apu.schema.ts             #     apus table
│           │       ├── apu-insumo.schema.ts      #     apu_insumos table
│           │       ├── cotizacion.schema.ts      #     cotizaciones table
│           │       ├── cotizacion-item.schema.ts #     cotizacion_items table
│           │       └── audit-log.schema.ts       #     audit_logs table
│           │
│           └── repositories/                     # Port implementations (Drizzle queries)
│               ├── postgres-user.repository.ts   #   UserRepositoryPort
│               ├── postgres-insumo.repository.ts #   InsumoRepositoryPort
│               ├── postgres-apu.repository.ts    #   ApuRepositoryPort
│               ├── postgres-cotizacion.repository.ts  #   CotizacionRepositoryPort
│               ├── postgres-audit.repository.ts  #   AuditRepositoryPort
│               └── sync.handler.ts              #   Offline-first sync helpers (ON CONFLICT)
│
└── __test__/                                     # Test files
    ├── health.test.ts                            #   Health check endpoint test
    ├── unit/                                     #   9 use case unit tests (mocked repos)
    ├── integration/                              #   6 integration tests (real database)
    ├── middleware/                               #   Middleware tests
    └── setup/                                    #   Test seed data + helpers
```

### Controllers (Driving)

All controllers are **factory functions** that receive use cases as arguments — this is the dependency injection pattern that keeps the HTTP layer decoupled from business logic.

```typescript
// Pattern: controller factory
export function createInsumoController(useCase: ManageInsumoUseCase, action: 'create' | 'update') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.execute(req.body, req.user.sub);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
```

### Middleware (Driving)

| Middleware | Applied To | Behavior |
|---|---|---|
| `decodeJWT` | All protected routes | Extracts Bearer token → verifies with JWT_SECRET → sets `req.user = { sub, role }` |
| `checkRole(...)` | All protected routes | Returns 403 if `req.user.role` not in allowed list |
| `validate(schema)` | All mutation routes | Validates `req.body` against Zod schema; returns 400 on failure |
| `validateProfitMargin` | PATCH `/cotizaciones/:id` | Returns 403 if `profit_margin_percent < 8` when estado is ENVIADA/APROBADA |
| `upload.single('file')` | POST `/insumos/bulk-upload` | Parses multipart CSV file via Multer |

### Routes (Driving) — Composition Root

The routes layer is the **composition root** where all dependencies are wired together:

```typescript
// Example: insumo.routes.ts
const manageInsumo = new ManageInsumoUseCase(
  postgresInsumoRepo,      // implements InsumoRepositoryPort
  postgresAuditRepo        // implements AuditRepositoryPort
);

router.post('/',
  decodeJWT,
  checkRole('ADMIN'),
  validate(createInsumoSchema),
  createInsumoController(manageInsumo, 'create')
);
```

### Database Schema (Driven)

Seven Drizzle table definitions map to the PostgreSQL database. All use UUID primary keys with `gen_random_uuid()`. Key conventions:

| Convention | Rule |
|---|---|
| Primary Keys | `uuid('id').defaultRandom().primaryKey()` |
| Foreign Keys | `.references(() => otherTable.id)` |
| Timestamps | `timestamp('created_at', { withTimezone: true }).defaultNow()` |
| Decimals | `numeric('column_name', { precision, scale })` |
| Check Constraints | `.check('check_name', sql\`column IN (...)\`)` |

### Repositories (Driven)

Each repository implements a port interface from `packages/core/src/application/ports/out/`. All queries use Drizzle ORM's type-safe query builder against Postgres.js.

| Repository | Key Methods |
|---|---|
| `postgres-user.repository.ts` | `findByEmail`, `findById`, `findAll`, `create`, `update`, `delete`, `findByResetToken`, `updatePassword` |
| `postgres-insumo.repository.ts` | `findAll`, `findById`, `findByCodigo`, `create`, `update`, `delete`, `bulkInsert` |
| `postgres-apu.repository.ts` | `findAll`, `findById` (with JOIN), `create`, `update`, `addInsumo`, `removeInsumo` |
| `postgres-cotizacion.repository.ts` | `findAll`, `findById` (with items), `create` (with items), `update`, `cloneQuote`, `countVersionsByProject` |
| `postgres-audit.repository.ts` | `create`, `findAll` (with filters) |

---

## Request Flow

A typical request traverses these layers:

```
HTTP Request
  ↓
Express Router (routes/index.ts → domain.routes.ts)
  ↓
Middleware Chain:
  1. decodeJWT     → verifies JWT, sets req.user
  2. checkRole()   → verifies role authorization
  3. validate()    → validates request body via Zod
  ↓
Controller Factory (receives use case)
  ↓
Use Case (pure business logic, in packages/core)
  ↓
Repository Port (interface)
  ↓
Repository Implementation (Drizzle ORM → Postgres.js → PostgreSQL)
  ↓
HTTP Response ← Error Handler (if error thrown)
```

---

## Testing

### Test Structure

```
apps/api/src/__test__/
├── setup/
│   └── seed.ts            # Database seed: creates tables, inserts test data
├── health.test.ts         # Health endpoint test
├── unit/                  # Use case unit tests (9 files)
│   ├── auth-login.use-case.test.ts
│   ├── auth-forgot-password.use-case.test.ts
│   ├── auth-reset-password.use-case.test.ts
│   ├── manage-insumo.use-case.test.ts
│   ├── manage-apu.use-case.test.ts
│   ├── manage-cotizacion.use-case.test.ts
│   ├── branch-cotizacion.use-case.test.ts
│   ├── calculation.use-case.test.ts
│   └── audit.use-case.test.ts
├── integration/           # Integration tests (6 files)
│   ├── auth.test.ts
│   ├── users.test.ts
│   ├── insumos.test.ts
│   ├── apus.test.ts
│   ├── cotizaciones.test.ts
│   └── sync.test.ts
└── middleware/             # Middleware tests
```

### Running Tests

```bash
# Run all tests (seeds database before each integration group)
bun run --filter api test

# Run a specific test file directly
bun test src/__test__/unit/calculation.use-case.test.ts
```

### Test Database

Integration tests require a separate `DATABASE_URL_TEST` environment variable. The seed script (`src/__test__/setup/seed.ts`) creates all tables and inserts test data before each integration test run.

---

## Migrations

Migrations are managed with Drizzle Kit and stored in `apps/api/migrations/`.

### Migration Workflow

1. **Modify** a schema file in `src/infra/adapters/driven/database/schema/`
2. **Generate** migration: `bun run --filter api db:generate`
3. **Review** the generated SQL in `apps/api/migrations/`
4. **Apply** migration: `bun run --filter api db:migrate`

### Configuration

Drizzle Kit configuration is in `drizzle.config.ts`:

```typescript
export default defineConfig({
  out: './migrations',
  schema: './src/infra/adapters/driven/database/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

---

## Dependencies

### Runtime

| Package | Purpose |
|---|---|
| `@proarq/core` | Domain + Application layer (workspace dependency) |
| `express` | HTTP framework |
| `cors` | CORS middleware |
| `drizzle-orm` | Type-safe SQL ORM |
| `postgres` | PostgreSQL client |
| `zod` | Schema validation |
| `jsonwebtoken` | JWT sign & verify |
| `decimal.js` | High-precision financial math |
| `csv-parse` | CSV parsing for bulk upload |
| `pdfkit` | PDF generation |
| `multer` | Multipart file upload parsing |
| `deep-diff` | JSON diff generation for audit logs |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `drizzle-kit` | Migration generation |
| `supertest` | HTTP integration testing |
| `@types/*` | TypeScript type definitions |
| `@biomejs/biome` | Linting and formatting |

---

## Related Documentation

- [`README.md`](../../README.md) — Root project documentation
- [`DESIGN.md`](../../DESIGN.md) — Architecture design document
