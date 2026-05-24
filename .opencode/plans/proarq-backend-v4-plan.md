# ProArq Backend V4 — Execution Plan

**Plan ID:** proarq-backend-v4-plan.md  
**Based on:** `.opencode/plans/proarq-backend-v4.spec.md`  
**Architecture:** Clean Architecture + Hexagonal (Ports & Adapters)  
**Runtime:** Bun v1.x  
**Date:** 2026-05-23

---

## Table of Contents

1. Architecture Overview
2. Data Model (ASCII ERD)
3. RBAC Security Strategy
4. Detailed Implementation Plan (9 Phases)
5. File Creation Sequence (Per Phase)
6. Dependencies & Package Installation
7. Testing Strategy
8. Risk Mitigation
9. User Approval

---

## 1. Architecture Overview

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        apps/api (Infrastructure)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  Controllers  │  │  Middleware   │  │        Routes             │  │
│  │  (driving)    │  │  (driving)    │  │     (composition root)    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────────┘  │
│         │                 │                       │                  │
│         └─────────────────┴───────────────────────┘                  │
│                            │                                         │
│  ┌─────────────────────────┴──────────────────────────────────────┐  │
│  │                  Driven Adapters (infra)                        │  │
│  │  ┌─────────────────┐  ┌───────────────────────────────────┐   │  │
│  │  │ Drizzle ORM/DB   │  │   Repositories (Postgres)         │   │  │
│  │  │ (connection.ts)  │  │   (implement Port interfaces)     │   │  │
│  │  └─────────────────┘  └───────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ depends on abstractions (ports)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     packages/core (Domain + Application)             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Domain Entities (pure TS interfaces)                       │  │
│  │  User, Insumo, Apu, ApuInsumo, Cotizacion, CotizacionItem,  │  │
│  │  AuditLog                                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           │                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Application Layer                                           │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                 │  │
│  │  │  Inbound Ports    │  │  Outbound Ports   │                 │  │
│  │  │  (Zod schemas)    │  │  (Repositories)   │                 │  │
│  │  └──────────────────┘  └──────────────────┘                 │  │
│  │                           │                                   │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │  Use Cases (business logic + decimal.js calculations)  │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           │                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Errors (AppError, NotFoundError, ValidationError)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow (Example: POST /api/v1/insumos)

```
HTTP POST /api/v1/insumos
  ↓
  ↓ 1. Express Router matches → insumo.routes.ts
  ↓ 2. auth.middleware.ts decodes JWT, sets req.user = { sub, role }
  ↓ 3. checkRole(['ADMIN']) returns 403 if not ADMIN
  ↓ 4. validate(createInsumoSchema) validates req.body
  ↓
  ↓ 5. insumo.controller.ts factory receives use case, calls execute(input)
  ↓ 6. manage-insumo.use-case.ts applies business rules
  ↓ 7. insumo-repository.port.ts interface → postgres-insumo.repository.ts
  ↓ 8. Drizzle ORM executes SQL via postgres.js
  ↓
  ↓ 9. Response flows back through the layers
HTTP 201 { data: { ... } }
```

### File Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Domain entities | `*.entity.ts` | `user.entity.ts` |
| Inbound ports | `*.input.ts` | `create-user.input.ts` |
| Outbound ports | `*.port.ts` | `user-repository.port.ts` |
| Use cases | `*.use-case.ts` | `create-user.use-case.ts` |
| Drizzle schemas | `*.schema.ts` | `user.schema.ts` |
| Controllers | `*.controller.ts` | `user.controller.ts` |
| Routes | `*.routes.ts` | `user.routes.ts` |
| Middleware | `*.middleware.ts` | `auth.middleware.ts` |
| Repositories | `*-<db>.repository.ts` | `postgres-user.repository.ts` |

---

## 2. Data Model (ASCII ERD)

### Entity Relationship Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌──────────────────────────────┐                                            │
│  │           USERS              │                                            │
│  ├──────────────────────────────┤                                            │
│  │ id              UUID ◄───────┼──── PK                                      │
│  │ name            TEXT         │                                            │
│  │ email           TEXT (UNIQ)  │                                            │
│  │ password_hash   TEXT         │                                            │
│  │ role            VARCHAR(20)  │  -- CHECK (ADMIN,GERENTE_OBRA,DIRECTOR_OBRA,│
│  │                │            │  --        CLIENTE,REPRESENTANTE)            │
│  │ created_at      TIMESTAMPTZ  │                                            │
│  │ updated_at      TIMESTAMPTZ  │                                            │
│  └───────┬──────────────────────┘                                            │
│          │                                                                    │
│          │ 1:N (created_by)                                                  │
│          ▼                                                                    │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐          │
│  │      INSUMOS_MAESTRO         │  │           APUS               │          │
│  ├──────────────────────────────┤  ├──────────────────────────────┤          │
│  │ id              UUID ◄───────┼──┼── PK                        │          │
│  │ codigo          VARCHAR(20)  │  │ id              UUID ◄───────┼── PK    │
│  │ nombre          VARCHAR(255) │  │ codigo          VARCHAR(20) │ UNIQUE   │
│  │ unidad          VARCHAR(5) ──┼──┼── CHECK (M3,KG,UND,GL)     │          │
│  │ cost_base       DECIMAL(12,2)│  │ nombre          VARCHAR(255) │          │
│  │ created_by      UUID ────────┼──┼── FK → users.id             │          │
│  │ created_at      TIMESTAMPTZ  │  │ tipo            VARCHAR(50) │          │
│  │ updated_at      TIMESTAMPTZ  │  │ created_by      UUID ────────┼── FK → u.│
│  └──────────────┬───────────────┘  │ created_at      TIMESTAMPTZ │          │
│                 │                  │ updated_at      TIMESTAMPTZ │          │
│                 │ 1:N              └───────────┬──────────────────┘          │
│                 │                             │ 1:N                          │
│                 ▼                             ▼                              │
│  ┌──────────────────────────────────────────────────────────┐                │
│  │                    APU_INSUMOS                             │               │
│  ├──────────────────────────────────────────────────────────┤               │
│  │ id                  UUID ◄──── PK                         │               │
│  │ apu_id              UUID ───── FK → apus.id (ON DEL CASCADE)             │
│  │ insumo_id           UUID ───── FK → insumos_maestro.id    │               │
│  │ rendimiento         DECIMAL(12,4) NOT NULL                 │               │
│  │ desperdicio         DECIMAL(5,2) DEFAULT 0                 │               │
│  │ unit_price_snapshot DECIMAL(12,2) NOT NULL  ← snapshot     │               │
│  │ created_at          TIMESTAMPTZ                            │               │
│  └──────────────────────────────────────────────────────────┘                │
│                                                                               │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐          │
│  │        COTIZACIONES           │  │      COTIZACION_ITEMS         │         │
│  ├──────────────────────────────┤  ├──────────────────────────────┤          │
│  │ id              UUID ◄───────┼──┼── PK                        │          │
│  │ projecto_id     UUID         │  │ id              UUID ◄───────┼── PK    │
│  │ codigo          VARCHAR(50)  │  │ cotizacion_id   UUID ────────┼── FK    │
│  │ version         INTEGER = 1  │  │                │ (ON DEL CASCADE)       │
│  │ estado          VARCHAR(20)──┼──┼── CHECK (states)│                          │
│  │ cliente_id      UUID ────────┼──┼── FK → users.id│                          │
│  │ total_cost_direct DEC(15,4)  │  │ apu_id      UUID ──── FK → apus.id      │
│  │ factor_a_percent DEC(5,2)    │  │ cantidad    DECIMAL(12,4)    │          │
│  │ factor_b_percent DEC(5,2)    │  │ calc_cost_dir DECIMAL(15,4)  │          │
│  │ profit_margin_pct DEC(5,2)   │  │ created_at  TIMESTAMPTZ      │          │
│  │ total_amount     DECIMAL(15,4)│  └──────────────────────────────┘          │
│  │ created_by      UUID ────────┼──┼── FK → users.id             │          │
│  │ created_at      TIMESTAMPTZ  │                                   │          │
│  │ updated_at      TIMESTAMPTZ  │                                   │          │
│  └──────────────────────────────┘                                   │          │
│                                                                     │          │
│  ┌──────────────────────────────────────────────────────────┐       │          │
│  │                     AUDIT_LOGS                            │       │          │
│  ├──────────────────────────────────────────────────────────┤       │          │
│  │ id              UUID ◄──── PK                            │       │          │
│  │ table_name      VARCHAR(100) NOT NULL                    │       │          │
│  │ record_id       UUID NOT NULL                            │       │          │
│  │ action          VARCHAR(10) ── CHECK (INSERT,UPDATE,DELETE)      │          │
│  │ user_id         UUID ──────── FK → users.id             │       │          │
│  │ data_history    JSONB NOT NULL  ({ before: {}, after: {} })      │          │
│  │ created_at      TIMESTAMPTZ                              │       │          │
│  └──────────────────────────────────────────────────────────┘       │          │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Column Type Summary

| Entity | PK | FKs | DECIMAL Columns | CHECK Constraints |
|--------|----|-----|-----------------|-------------------|
| users | `uuid` | — | — | `role IN (...)` |
| insumos_maestro | `uuid` | `created_by → users.id` | `cost_base DECIMAL(12,2)` | `unidad IN ('M3','KG','UND','GL')` |
| apus | `uuid` | `created_by → users.id` | — | — |
| apu_insumos | `uuid` | `apu_id → apus.id` (CASCADE), `insumo_id → insumos_maestro.id` | `rendimiento DECIMAL(12,4)`, `desperdicio DECIMAL(5,2)`, `unit_price_snapshot DECIMAL(12,2)` | — |
| cotizaciones | `uuid` | `cliente_id → users.id`, `created_by → users.id` | `total_cost_direct DECIMAL(15,4)`, `factor_a_percentage DECIMAL(5,2)`, `factor_b_percentage DECIMAL(5,2)`, `profit_margin_percent DECIMAL(5,2)`, `total_amount DECIMAL(15,4)` | `estado IN ('BORRADOR','ENVIADA','APROBADA','REEMPLAZADA')` |
| cotizacion_items | `uuid` | `cotizacion_id → cotizaciones.id` (CASCADE), `apu_id → apus.id` | `cantidad DECIMAL(12,4)`, `calculated_cost_direct DECIMAL(15,4)` | — |
| audit_logs | `uuid` | `user_id → users.id` | — | `action IN ('INSERT','UPDATE','DELETE')` |

---

## 3. RBAC Security Strategy

### JWT Middleware Architecture

```
                          ┌─────────────────────┐
                          │   Express Request    │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  auth.middleware.ts  │
                          │                     │
                          │ 1. Extract Bearer   │
                          │    token from        │
                          │    Authorization     │
                          │    header            │
                          │                     │
                          │ 2. jwt.verify(token, │
                          │    JWT_SECRET)       │
                          │                     │
                          │ 3. Set req.user =   │
                          │    { sub, role }     │
                          │                     │
                          │ 4. next()           │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  checkRole(...roles) │  ← middleware factory
                          │                     │
                          │ if req.user.role     │
                          │ not in allowed       │
                          │ roles → 403          │
                          │                     │
                          │ else → next()       │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Route Handler       │
                          └─────────────────────┘
```

### Role Hierarchy & Permission Mapping

```
ROLE HIERARCHY:
ADMIN (level 4) ───── Full system access
     │
     ├── GERENTE_OBRA (level 3) ─── Operational: quotes, APUs, insumo read
     └── DIRECTOR_OBRA (level 3) ── Operational: quotes, APUs, insumo read
              │
              ├── CLIENTE (level 2) ───── External: PDF (redacted), sync
              └── REPRESENTANTE (level 2) ── External: PDF (redacted), sync

PERMISSION GROUPING:
┌──────────────────────────────┬────────────────────────────────────┐
│ Permission Group             │ Allowed Roles                      │
├──────────────────────────────┼────────────────────────────────────┤
│ Auth (login/forgot/reset)    │ ALL (no middleware)                │
│ Users CRUD                   │ ADMIN only                         │
│ Insumos CREATE/UPDATE/DELETE │ ADMIN only                         │
│ Insumos READ                 │ ADMIN, GERENTE_OBRA, DIRECTOR_OBRA │
│ Insumos BULK UPLOAD          │ ADMIN only                         │
│ APUs CRUD                    │ ADMIN, GERENTE_OBRA, DIRECTOR_OBRA │
│ Cotizaciones CRUD            │ ADMIN, GERENTE_OBRA, DIRECTOR_OBRA │
│ Cotizaciones PDF             │ ALL (redacted for CLIENTE/REPRES.) │
│ Cotizaciones BRANCH          │ ADMIN, GERENTE_OBRA, DIRECTOR_OBRA │
│ Audit Logs                   │ ADMIN only                         │
│ Sync (sincronizar)           │ ALL                                │
│ Health                       │ ALL (no middleware)                │
└──────────────────────────────┴────────────────────────────────────┘
```

### Middleware Implementation Details

#### `auth.middleware.ts`
```typescript
// Extends Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: Role };
    }
  }
}

// decodeJWT(): extracts Bearer token, verifies with JWT_SECRET, sets req.user
// Returns 401 if missing/invalid token

// checkRole(...allowed: Role[]): returns middleware that checks req.user.role
// Returns 403 with { error: 'Forbidden: insufficient role' } if not allowed
// Example: checkRole('ADMIN') or checkRole('ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA')
```

#### PDF Role-Based Filtering

```
PDF REDACTION STRATEGY:

GET /cotizaciones/:id/pdf
  │
  ├── Role is CLIENTE or REPRESENTANTE?
  │   YES → Generate PDF with:
  │          ✓ Cotizacion header (project, code, version)
  │          ✓ Item-level totals (quantity × APU cost)
  │          ✓ Grand totals (direct cost, overhead, margin, final price)
  │          ✗ APU_INSUMO breakdown table (hidden)
  │          ✗ Individual component costs (hidden)
  │
  └── Role is ADMIN, GERENTE_OBRA, or DIRECTOR_OBRA?
      YES → Generate FULL PDF with:
             ✓ All of the above
             ✓ APU_INSUMO composition table
             ✓ Individual component costs and yields

  Implementation: PDF generation receives a `showDetails: boolean` flag
  The flag is determined by the controller/middleware based on req.user.role
  Not by the use case (clean architecture rule)
```

### Route Registration Pattern

```typescript
// Example: insumo.routes.ts
import { Router } from 'express';
import { decodeJWT, checkRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createInsumoSchema } from '@proarq/core/application/ports/in/insumo.input';
import { createInsumoController } from '../controllers/insumo.controller';
import { ManageInsumoUseCase } from '@proarq/core/application/use-cases/manage-insumo.use-case';
import { postgresInsumoRepo } from '../../driven/repositories/postgres-insumo.repository';

const manageInsumo = new ManageInsumoUseCase(postgresInsumoRepo); // audit injected

export const router = Router();

router.post('/',
  decodeJWT,
  checkRole('ADMIN'),
  validate(createInsumoSchema),
  createInsumoController(manageInsumo, 'create')
);
```

---

## 4. Detailed Implementation Plan (9 Phases)

### PHASE 0: Prerequisites & Context Setup

**Goal:** Verify existing project structure, install tools, prepare working environment.

**Steps:**
1. Verify all existing files are correct (user.entity.ts, create-user.input.ts, etc.)
2. Check that Drizzle Kit migrations directory exists (`apps/api/migrations/`)
3. Configure `.env` with JWT and PDF vars
4. Install all new npm packages

**Files to create (none) — verification only.**

---

### PHASE 1: Foundation (Env, Auth Middleware, decimal.js, UUID Migration)

**Goal:** Set up the foundational infrastructure that ALL other phases depend on.

#### Files to Create (in order):

**Step 1.1 — Extend env.ts**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/config/env.ts` | **MODIFY** | Add `JWT_SECRET`, `JWT_EXPIRES_IN`, `PDF_UPLOAD_DIR` to Zod schema |

**Step 1.2 — Create Auth Middleware**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/middleware/auth.middleware.ts` | **CREATE** | JWT decode + checkRole() factory |

**Step 1.3 — Create ForbiddenError**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/errors/forbidden.error.ts` | **CREATE** | `ForbiddenError extends AppError` (status 403) |
| `packages/core/src/errors/index.ts` | **MODIFY** | Add export |

**Step 1.4 — Add decimal.js to packages/core**
| File | Action | Details |
|------|--------|---------|
| `packages/core/package.json` | **MODIFY** | Add `decimal.js` dependency |

**Step 1.5 — Add packages to apps/api**
| File | Action | Details |
|------|--------|---------|
| `apps/api/package.json` | **MODIFY** | Add all API dependencies |

**Step 1.6 — UUID Migration for users table**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/database/schema/user.schema.ts` | **MODIFY** | Change `serial('id')` to `uuid('id').defaultRandom().primaryKey()`, add `password_hash`, `role`, `updated_at` columns |
| Run `bun run db:generate` | **EXECUTE** | Generate Drizzle Kit migration |
| Create manual SQL migration | **CREATE** | Custom SQL for existing data migration (ALTER TYPE, etc.) |

**Step 1.7 — Install & Run**
```bash
bun install  # install all new dependencies
bun run db:generate  # generate initial migration with UUID schema
```

**Key Implementation Details:**
- `auth.middleware.ts` MUST use `import jwt from 'jsonwebtoken'` (ESM default import)
- JWT_SECRET validated to be ≥ 32 chars in env.ts schema
- The UUID migration for users needs careful handling of existing data:
  1. Drizzle will generate migration for new schema
  2. Create a companion SQL script for migrating existing rows
  3. Execute manually in staging first

---

### PHASE 2: Auth + Users

**Goal:** Complete authentication endpoints and full user CRUD (ADMIN only).

#### Dependencies: Phase 1 complete (env, auth middleware, decimal.js)

#### Files to Create/Modify (in order):

**Step 2.1 — Update User Entity**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/domain/entities/user.entity.ts` | **MODIFY** | Add `id: string`, `passwordHash`, `role`, `updatedAt` |

**Step 2.2 — Create Auth Input Schemas**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/auth.input.ts` | **CREATE** | `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema` + types |

**Step 2.3 — Update Create User Input**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/create-user.input.ts` | **MODIFY** | Add `password`, `role` fields with Zod validation |

**Step 2.4 — Extend User Repository Port**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/out/user-repository.port.ts` | **MODIFY** | Add `findById`, `findAll(filters)`, `update`, `delete`, `findByResetToken`, `updatePassword` |

**Step 2.5 — Create Auth Use Cases**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/auth-login.use-case.ts` | **CREATE** | Validate credentials via `Bun.password.verify()`, return tokens |
| `packages/core/src/application/use-cases/auth-forgot-password.use-case.ts` | **CREATE** | Generate reset token, store hash, log in dev |
| `packages/core/src/application/use-cases/auth-reset-password.use-case.ts` | **CREATE** | Validate token, `Bun.password.hash()`, update |

**Step 2.6 — Update Create User Use Case**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/create-user.use-case.ts` | **MODIFY** | Add `Bun.password.hash()` for password, role validation |

**Step 2.7 — Extend User Repository**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/repositories/postgres-user.repository.ts` | **MODIFY** | Add all new CRUD methods + auth methods |

**Step 2.8 — Extend User Schema (updated in Phase 1)**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/database/schema/user.schema.ts` | **MODIFY** | (Already done in Phase 1) |

**Step 2.9 — Create Auth Controller**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/controllers/auth.controller.ts` | **CREATE** | Factory functions for login, forgot-password, reset-password |
| `apps/api/src/infra/adapters/driving/controllers/user.controller.ts` | **MODIFY** | Add CRUD handlers (list, get, update, delete) |

**Step 2.10 — Create Auth Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/auth.routes.ts` | **CREATE** | POST /login, POST /forgot-password, POST /reset-password |
| `apps/api/src/infra/adapters/driving/routes/user.routes.ts` | **MODIFY** | Add GET (list), GET /:id, PUT /:id, DELETE /:id with checkRole('ADMIN') |

**Step 2.11 — Register Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/index.ts` | **MODIFY** | Add auth routes, keep user routes under `/users` |

**Step 2.12 — Update Core exports**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/index.ts` | **MODIFY** | Export all new modules |

**Key Implementation Details:**
- **Login flow:** `findByEmail` → `Bun.password.verify(password, user.passwordHash)` → sign JWT with `{ sub: user.id, role: user.role }` → return `{ accessToken, user }`
- **Forgot password:** Generate crypto-random token → store SHA-256 hash in DB with expiry → log reset URL in dev → (future: send email)
- **Reset password:** Find by token hash → check expiry → hash new password with `Bun.password.hash()` → update DB → delete token
- **Users CRUD:** All require `checkRole('ADMIN')`; DELETE returns 204; password is hashed on create; role is validated against allowed values
- **IMPORTANT:** The `user-repository.port.ts` needs a `update` method that returns the updated user, and a `delete` method. Need to also add `resetToken` and `resetTokenExpiry` columns to the users schema (not in original spec but needed for forgot-password flow).

**Add to user schema (columns not in original spec but required):**
- `reset_token_hash VARCHAR(64)` — nullable, for forgot-password
- `reset_token_expiry TIMESTAMPTZ` — nullable

---

### PHASE 3: Insumos Module

**Goal:** Complete CRUD + CSV bulk upload for the master supplies catalog.

#### Dependencies: Phase 1 (env, auth middleware), Phase 2 (auth checks)

#### Files to Create/Modify (in order):

**Step 3.1 — Create Insumo Entity**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/domain/entities/insumo.entity.ts` | **CREATE** | `Insumo` interface matching schema |

**Step 3.2 — Create Insumo Input Schemas**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/insumo.input.ts` | **CREATE** | `createInsumoSchema`, `updateInsumoSchema`, `insumoQuerySchema`, `insumoQueryResult` with Zod, with enum for unidad |

**Step 3.3 — Create Insumo Repository Port**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/out/insumo-repository.port.ts` | **CREATE** | `findAll(filters)`, `findById`, `findByCodigo`, `create`, `update`, `delete`, `bulkInsert` |

**Step 3.4 — Create Manage Insumo Use Case**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/manage-insumo.use-case.ts` | **CREATE** | CRUD logic + bulk upload with validation |

**Step 3.5 — Create Insumo Drizzle Schema**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/database/schema/insumo.schema.ts` | **CREATE** | Table definition with UUID PK, FK, CHECK constraints |
| `apps/api/src/infra/adapters/driven/database/schema/index.ts` | **MODIFY** | Add export |

**Step 3.6 — Create Insumo Repository**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/repositories/postgres-insumo.repository.ts` | **CREATE** | All Drizzle queries implementing the port |

**Step 3.7 — Create Insumo Controller**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/controllers/insumo.controller.ts` | **CREATE** | Factory functions for each endpoint |

**Step 3.8 — Create Upload Middleware**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/middleware/upload.middleware.ts` | **CREATE** | Multer config for CSV upload |

**Step 3.9 — Create Insumo Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/insumo.routes.ts` | **CREATE** | All endpoints with RBAC guards |
| `apps/api/src/infra/adapters/driving/routes/index.ts` | **MODIFY** | Register insumo routes |

**Step 3.10 — Generate DB migration**
| Action | Details |
|--------|---------|
| `bun run db:generate` | Generate migration for insumos_maestro table |

**Key Implementation Details:**
- **Bulk upload:** Uses `csv-parse` to parse CSV → validates all rows → `db.transaction()` with batch insert of max 50 records → rolls back on any error
- **Duplicate codigo:** Check `findByCodigo` before insert; skip duplicates, don't fail
- **Audit hook:** The `manage-insumo.use-case.ts` needs an `AuditRepository` port for logging (will be injected, but implementation Phase 6). For Phase 3, stubs can be used.
- **Pagination:** Use Drizzle's `.limit()` and `.offset()` from query params

---

### PHASE 4: APU Module

**Goal:** Complete CRUD for APUs with snapshot pricing logic.

#### Dependencies: Phase 1 (env, auth), Phase 3 (insumos for FK reference)

#### Files to Create/Modify (in order):

**Step 4.1 — Create APU Entity**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/domain/entities/apu.entity.ts` | **CREATE** | `Apu` interface |
| `packages/core/src/domain/entities/apu-insumo.entity.ts` | **CREATE** | `ApuInsumo` interface |

**Step 4.2 — Create APU Input Schemas**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/apu.input.ts` | **CREATE** | `createApuSchema`, `updateApuSchema`, `addApuInsumoSchema` |

**Step 4.3 — Create APU Repository Ports**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/out/apu-repository.port.ts` | **CREATE** | `findAll`, `findById`, `create`, `update`, `delete`, `addInsumo`, `removeInsumo`, `findInsumoById` |

**Step 4.4 — Create Manage APU Use Case**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/manage-apu.use-case.ts` | **CREATE** | CRUD + snapshot logic (fetch cost_base on addInsumo) |
| `packages/core/src/application/use-cases/calculation.use-case.ts` | **CREATE** | Cost engine with decimal.js formulas |

**Step 4.5 — Create APU Drizzle Schemas**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/database/schema/apu.schema.ts` | **CREATE** | Table for `apus` |
| `apps/api/src/infra/adapters/driven/database/schema/apu-insumo.schema.ts` | **CREATE** | Table for `apu_insumos` with FK cascade |
| `apps/api/src/infra/adapters/driven/database/schema/index.ts` | **MODIFY** | Add exports |

**Step 4.6 — Create APU Repository**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/repositories/postgres-apu.repository.ts` | **CREATE** | All queries + JOINs |

**Step 4.7 — Create APU Controller**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/controllers/apu.controller.ts` | **CREATE** | Crud + add/remove insumo |

**Step 4.8 — Create APU Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/apu.routes.ts` | **CREATE** | All endpoints |
| `apps/api/src/infra/adapters/driving/routes/index.ts` | **MODIFY** | Register |

**Step 4.9 — Generate DB migration**

**Key Implementation Details:**
- **Snapshot behavior:** When `POST /apus/:id/insumos` is called:
  1. Use case calls `insumoRepository.findById(insumo_id)` to get `cost_base`
  2. Use case calls `apuRepository.addInsumo(...)` with `unit_price_snapshot = cost_base`
  3. No live JOIN occurs on subsequent reads
- **Cost formula (calculation.use-case.ts):**
  ```typescript
  import Decimal from 'decimal.js';
  // per item:
  const costoDirecto = new Decimal(rendimiento)
    .times(unit_price_snapshot)
    .times(new Decimal(1).plus(desperdicio).div(100));
  ```
- **APU read:** Returns APU joined with its `apu_insumos` and their `insumo.nombre` for display

---

### PHASE 5: Cotizaciones Module

**Goal:** Complete quote CRUD, branching, PDF generation, and financial calculations.

#### Dependencies: Phase 1 (env, auth), Phase 3 (insumos), Phase 4 (APUs)

#### Files to Create/Modify (in order):

**Step 5.1 — Create Cotizacion Entities**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/domain/entities/cotizacion.entity.ts` | **CREATE** | `Cotizacion` interface |
| `packages/core/src/domain/entities/cotizacion-item.entity.ts` | **CREATE** | `CotizacionItem` interface |

**Step 5.2 — Create Cotizacion Input Schemas**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/cotizacion.input.ts` | **CREATE** | `createCotizacionSchema`, `updateCotizacionSchema`, `cotizacionQuerySchema` |

**Step 5.3 — Create Cotizacion Repository Port**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/out/cotizacion-repository.port.ts` | **CREATE** | `findAll`, `findById` (with items), `create` (with items), `update`, `delete`, `cloneQuote`, `countVersionsByProject` |

**Step 5.4 — Create Cotizacion Use Cases**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/manage-cotizacion.use-case.ts` | **CREATE** | CRUD + APRORADA guard + item calculations |
| `packages/core/src/application/use-cases/branch-cotizacion.use-case.ts` | **CREATE** | Version increment, clone, max 15 check |

**Step 5.5 — Create Cotizacion Drizzle Schemas**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/database/schema/cotizacion.schema.ts` | **CREATE** | Table for `cotizaciones` with CHECK on estado |
| `apps/api/src/infra/adapters/driven/database/schema/cotizacion-item.schema.ts` | **CREATE** | Table for `cotizacion_items` with FK cascade |
| `apps/api/src/infra/adapters/driven/database/schema/index.ts` | **MODIFY** | Add exports |

**Step 5.6 — Create Cotizacion Repository**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/repositories/postgres-cotizacion.repository.ts` | **CREATE** | Complex queries with items JOIN + transactions for branch |

**Step 5.7 — Create Cotizacion Controller**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/controllers/cotizacion.controller.ts` | **CREATE** | CRUD + branch + PDF |

**Step 5.8 — Create PDF Service (Infrastructure)**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/services/pdf.service.ts` | **CREATE** | Factory function that accepts `showDetails: boolean` |
| Uses `pdfkit` to generate PDF buffers |

**Step 5.9 — Create Cotizacion Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/cotizacion.routes.ts` | **CREATE** | All endpoints |
| `apps/api/src/infra/adapters/driving/routes/index.ts` | **MODIFY** | Register |

**Step 5.10 — Generate DB migration**

**Key Implementation Details:**
- **Item calculation on create:**
  ```typescript
  // For each item in the create/update payload:
  // 1. Fetch all APU_INSUMO rows for the APU
  // 2. Sum(cantidad × unit_price_snapshot × (1 + desperdicio/100)) = totalDirectCost
  // 3. calculated_cost_direct = cantidad × totalDirectCost
  ```
- **Quote totals:**
  ```typescript
  total_cost_direct = sum(calculated_cost_direct for all items)
  total_amount = total_cost_direct
    .times(1 + factor_a_percentage/100)
    .times(1 + factor_b_percentage/100)
    .times(1 + profit_margin_percent/100)
  ```
- **Branching:** Use `db.transaction()`:
  1. Check version count < 15
  2. Clone cotizacion row with new version
  3. Clone all cotizacion_items
  4. Mark old as `REEMPLAZADA`
  5. New starts as `BORRADOR`
- **APROBADA guard:** In use case, check `current.estado !== 'APROBADA'` before PATCH
- **PDF:** `pdf.service.ts` receives data + `showDetails: boolean`. Uses `pdfkit` to create a buffer stream. The controller determines the flag based on role.
- **PDF includes:** Header (logo/project info), items table, totals section, footer. When `showDetails=false`, the APU composition column is omitted.

---

### PHASE 6: Audit Logging

**Goal:** Immutable audit trail for all INSUMOS_MAESTRO mutations.

#### Dependencies: Phase 1 (env, auth), Phase 3 (insumos)

#### Files to Create/Modify (in order):

**Step 6.1 — Create AuditLog Entity**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/domain/entities/audit-log.entity.ts` | **CREATE** | `AuditLog` interface |

**Step 6.2 — Create AuditLog Input Schema**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/audit-log.input.ts` | **CREATE** | `auditLogQuerySchema` |

**Step 6.3 — Create AuditLog Repository Port**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/out/audit-repository.port.ts` | **CREATE** | `create`, `findAll(filters)` |

**Step 6.4 — Create Audit Use Case**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/audit.use-case.ts` | **CREATE** | Log mutations + query logs |

**Step 6.5 — Create AuditLog Drizzle Schema**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/database/schema/audit-log.schema.ts` | **CREATE** | Table with JSONB, CHECK constraint |
| `apps/api/src/infra/adapters/driven/database/schema/index.ts` | **MODIFY** | Add export |

**Step 6.6 — Create AuditLog Repository**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driven/repositories/postgres-audit.repository.ts` | **CREATE** | Drizzle queries for audit logs |

**Step 6.7 — Wire Audit into ManageInsumo Use Case**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/manage-insumo.use-case.ts` | **MODIFY** | Accept `AuditRepository` in constructor, log on create/update/delete |

**Step 6.8 — Create Audit Controller**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/controllers/audit.controller.ts` | **CREATE** | GET handler with filters |

**Step 6.9 — Create Audit Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/audit.routes.ts` | **CREATE** | GET /audit-logs (ADMIN only) |
| `apps/api/src/infra/adapters/driving/routes/index.ts` | **MODIFY** | Register |

**Step 6.10 — Generate DB migration**

**Key Implementation Details:**
- **JSONB diff format:** `{ before: { cost_base: "100.00" }, after: { cost_base: "150.00" } }`
- Use `deep-diff` library or manual comparison for generating diffs
- **Who triggers logging?** The `ManageInsumoUseCase` calls `auditRepository.create(...)` after successful mutations
- **user_id** comes from the use case caller (passed as parameter from controller which extracts from `req.user.sub`)
- **Audit queries** support `table_name`, `record_id`, `user_id` filters + pagination

---

### PHASE 7: Financial Guards

**Goal:** Profit margin validation (U% ≥ 8%) and financial middleware.

#### Dependencies: Phase 5 (cotizaciones)

#### Files to Create/Modify (in order):

**Step 7.1 — Create Financial Middleware**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/middleware/financial.middleware.ts` | **CREATE** | `validateProfitMargin` middleware |

**Step 7.2 — Wire into Cotizacion Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/cotizacion.routes.ts` | **MODIFY** | Add `validateProfitMargin` before PATCH handler when estado changes to ENVIADA/APROBADA |

**Key Implementation Details:**
- **`validateProfitMargin` middleware:**
  1. Check if request body contains `estado` set to `'ENVIADA'` or `'APROBADA'`
  2. If yes, validate `profit_margin_percent >= 8.00` using `decimal.js`
  3. If below threshold, return 403 `{ error: "Profit margin must be at least 8%" }`
  4. If `estado` is not changing to ENVIADA/APROBADA, skip validation
- **Implementation logic:**
  ```typescript
  const margin = new Decimal(req.body.profit_margin_percent ?? 0);
  if (margin.lessThan(8)) {
    return res.status(403).json({ error: 'Profit margin must be at least 8%' });
  }
  ```

---

### PHASE 8: Sync Endpoint

**Goal:** Offline-first synchronization accepting pre-generated UUIDs.

#### Dependencies: Phase 3 (insumos), Phase 4 (APUs), Phase 5 (cotizaciones)

#### Files to Create/Modify (in order):

**Step 8.1 — Create Sync Input Schema**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/ports/in/sync.input.ts` | **CREATE** | `syncPayloadSchema` with all entity arrays |

**Step 8.2 — Create Sync Use Case**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/sync.use-case.ts` | **CREATE** | Process payload with ON CONFLICT DO NOTHING |

**Step 8.3 — Create Sync Controller**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/controllers/sync.controller.ts` | **CREATE** | POST handler |

**Step 8.4 — Create Sync Routes**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/infra/adapters/driving/routes/sync.routes.ts` | **CREATE** | POST /sincronizar (all authenticated roles) |
| `apps/api/src/infra/adapters/driving/routes/index.ts` | **MODIFY** | Register |

**Key Implementation Details:**
- **ON CONFLICT logic:** Using Drizzle's `onConflictDoNothing()`:
  ```typescript
  await db.insert(insumosMaestro).values(rows).onConflictDoNothing();
  ```
- **Transaction:** All entity groups within a single `db.transaction()`
- **Payload structure:**
  ```typescript
  {
    insumos: InsumoMaestro[],
    apus: Apu[],
    apuInsumos: ApuInsumo[],
    cotizaciones: Cotizacion[],
    cotizacionItems: CotizacionItem[]
  }
  ```
- **Response:** `{ accepted: number, conflicts: number }`
- **Role check:** All authenticated users can sync (CLIENTE, REPRESENTANTE can sync their own data)

---

### PHASE 9: Tests

**Goal:** Comprehensive test coverage for all modules.

#### Dependencies: All phases complete

#### Files to Create/Modify:

**Step 9.1 — Unit Tests (packages/core)**
| File | Action | Details |
|------|--------|---------|
| `packages/core/src/application/use-cases/__test__/auth-login.use-case.test.ts` | **CREATE** | Mock repository, test valid/invalid login |
| `packages/core/src/application/use-cases/__test__/manage-insumo.use-case.test.ts` | **CREATE** | CRUD, bulk validation, duplicate handling |
| `packages/core/src/application/use-cases/__test__/manage-apu.use-case.test.ts` | **CREATE** | Snapshot pricing, add/remove insumo |
| `packages/core/src/application/use-cases/__test__/manage-cotizacion.use-case.test.ts` | **CREATE** | CRUD, APROBADA guard, calculations |
| `packages/core/src/application/use-cases/__test__/branch-cotizacion.use-case.test.ts` | **CREATE** | Branching, max version limit |
| `packages/core/src/application/use-cases/__test__/calculation.use-case.test.ts` | **CREATE** | All cost formulas, edge cases |
| `packages/core/src/application/use-cases/__test__/audit.use-case.test.ts` | **CREATE** | Log creation, query filters |
| `packages/core/src/application/use-cases/__test__/sync.use-case.test.ts` | **CREATE** | Duplicate handling, partial success |

**Step 9.2 — Integration Tests (apps/api)**
| File | Action | Details |
|------|--------|---------|
| `apps/api/src/__test__/auth.test.ts` | **CREATE** | Login, forgot-password, reset-password flow |
| `apps/api/src/__test__/users.test.ts` | **CREATE** | CRUD with role gating (403 tests) |
| `apps/api/src/__test__/insumos.test.ts` | **CREATE** | CRUD, bulk upload, RBAC |
| `apps/api/src/__test__/apus.test.ts` | **CREATE** | CRUD, snapshot verification |
| `apps/api/src/__test__/cotizaciones.test.ts` | **CREATE** | CRUD, branching, APROBADA guard, profit margin |
| `apps/api/src/__test__/pdf.test.ts` | **CREATE** | Full vs redacted PDF per role |
| `apps/api/src/__test__/audit.test.ts` | **CREATE** | Log creation on insumo change, query |
| `apps/api/src/__test__/sync.test.ts` | **CREATE** | Idempotency, UUID reconciliation |

**Key Implementation Details:**
- **Unit tests:** Use `bun:test` with mock implementations of repository ports
- **Integration tests:** Use `supertest` with the Express app, require test database
- **Test database:** Use a separate `.env.test` or `DATABASE_URL_TEST` environment variable
- **Coverage target:** ≥80% on use cases; all endpoint success + error paths
- **E2E Scenarios to test:**
  1. Bulk upload atomicity (51 rows with invalid row 5 → 0 committed)
  2. Snapshot pricing (update insumo cost_base after APU link → APU retains original)
  3. Quote branching (clone is independent)
  4. PDF redaction (CLIENTE role response has no APU_INSUMO data)
  5. Sync idempotency (same UUIDs → same result, no duplicates)

---

## 5. Complete File Creation Sequence

### Phase 1: Foundation

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/errors/forbidden.error.ts      CREATE  core
2      packages/core/src/errors/index.ts                MODIFY  core
3      packages/core/package.json                        MODIFY  core
4      apps/api/src/infra/config/env.ts                  MODIFY  api
5      apps/api/src/infra/adapters/driving/middleware/   CREATE  api
         auth.middleware.ts
6      apps/api/package.json                             MODIFY  api
7      apps/api/src/infra/adapters/driven/database/      MODIFY  api
         schema/user.schema.ts
8      .env                                              MODIFY  root
9      (run) bun install                                          root
10     (run) bun run db:generate                                  api
```

### Phase 2: Auth + Users

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/domain/entities/       MODIFY  core
         user.entity.ts
2      packages/core/src/application/ports/     CREATE  core
         in/auth.input.ts
3      packages/core/src/application/ports/     MODIFY  core
         in/create-user.input.ts
4      packages/core/src/application/ports/     MODIFY  core
         out/user-repository.port.ts
5      packages/core/src/application/use-cases/ CREATE  core
         auth-login.use-case.ts
6      packages/core/src/application/use-cases/ CREATE  core
         auth-forgot-password.use-case.ts
7      packages/core/src/application/use-cases/ CREATE  core
         auth-reset-password.use-case.ts
8      packages/core/src/application/use-cases/ MODIFY  core
         create-user.use-case.ts
9      packages/core/src/index.ts               MODIFY  core
10     apps/api/src/infra/adapters/driven/       MODIFY  api
         database/schema/user.schema.ts
11     apps/api/src/infra/adapters/driven/       MODIFY  api
         repositories/postgres-user.repository.ts
12     apps/api/src/infra/adapters/driving/      CREATE  api
         controllers/auth.controller.ts
13     apps/api/src/infra/adapters/driving/      MODIFY  api
         controllers/user.controller.ts
14     apps/api/src/infra/adapters/driving/      CREATE  api
         routes/auth.routes.ts
15     apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/user.routes.ts
16     apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/index.ts
```

### Phase 3: Insumos Module

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/domain/entities/       CREATE  core
         insumo.entity.ts
2      packages/core/src/application/ports/     CREATE  core
         in/insumo.input.ts
3      packages/core/src/application/ports/     CREATE  core
         out/insumo-repository.port.ts
4      packages/core/src/application/use-cases/ CREATE  core
         manage-insumo.use-case.ts
5      packages/core/src/index.ts               MODIFY  core
6      apps/api/src/infra/adapters/driven/       CREATE  api
         database/schema/insumo.schema.ts
7      apps/api/src/infra/adapters/driven/       MODIFY  api
         database/schema/index.ts
8      apps/api/src/infra/adapters/driven/       CREATE  api
         repositories/postgres-insumo.repository.ts
9      apps/api/src/infra/adapters/driving/      CREATE  api
         middleware/upload.middleware.ts
10     apps/api/src/infra/adapters/driving/      CREATE  api
         controllers/insumo.controller.ts
11     apps/api/src/infra/adapters/driving/      CREATE  api
         routes/insumo.routes.ts
12     apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/index.ts
13     (run) bun run db:generate                          api
```

### Phase 4: APU Module

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/domain/entities/       CREATE  core
         apu.entity.ts
2      packages/core/src/domain/entities/       CREATE  core
         apu-insumo.entity.ts
3      packages/core/src/application/ports/     CREATE  core
         in/apu.input.ts
4      packages/core/src/application/ports/     CREATE  core
         out/apu-repository.port.ts
5      packages/core/src/application/use-cases/ CREATE  core
         manage-apu.use-case.ts
6      packages/core/src/application/use-cases/ CREATE  core
         calculation.use-case.ts
7      packages/core/src/index.ts               MODIFY  core
8      apps/api/src/infra/adapters/driven/       CREATE  api
         database/schema/apu.schema.ts
9      apps/api/src/infra/adapters/driven/       CREATE  api
         database/schema/apu-insumo.schema.ts
10     apps/api/src/infra/adapters/driven/       MODIFY  api
         database/schema/index.ts
11     apps/api/src/infra/adapters/driven/       CREATE  api
         repositories/postgres-apu.repository.ts
12     apps/api/src/infra/adapters/driving/      CREATE  api
         controllers/apu.controller.ts
13     apps/api/src/infra/adapters/driving/      CREATE  api
         routes/apu.routes.ts
14     apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/index.ts
15     (run) bun run db:generate                          api
```

### Phase 5: Cotizaciones Module

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/domain/entities/       CREATE  core
         cotizacion.entity.ts
2      packages/core/src/domain/entities/       CREATE  core
         cotizacion-item.entity.ts
3      packages/core/src/application/ports/     CREATE  core
         in/cotizacion.input.ts
4      packages/core/src/application/ports/     CREATE  core
         out/cotizacion-repository.port.ts
5      packages/core/src/application/use-cases/ CREATE  core
         manage-cotizacion.use-case.ts
6      packages/core/src/application/use-cases/ CREATE  core
         branch-cotizacion.use-case.ts
7      packages/core/src/index.ts               MODIFY  core
8      apps/api/src/infra/adapters/driven/       CREATE  api
         database/schema/cotizacion.schema.ts
9      apps/api/src/infra/adapters/driven/       CREATE  api
         database/schema/cotizacion-item.schema.ts
10     apps/api/src/infra/adapters/driven/       MODIFY  api
         database/schema/index.ts
11     apps/api/src/infra/adapters/driven/       CREATE  api
         repositories/postgres-cotizacion.repository.ts
12     apps/api/src/infra/services/              CREATE  api
         pdf.service.ts
13     apps/api/src/infra/adapters/driving/      CREATE  api
         controllers/cotizacion.controller.ts
14     apps/api/src/infra/adapters/driving/      CREATE  api
         routes/cotizacion.routes.ts
15     apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/index.ts
16     (run) bun run db:generate                          api
```

### Phase 6: Audit Logging

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/domain/entities/       CREATE  core
         audit-log.entity.ts
2      packages/core/src/application/ports/     CREATE  core
         in/audit-log.input.ts
3      packages/core/src/application/ports/     CREATE  core
         out/audit-repository.port.ts
4      packages/core/src/application/use-cases/ CREATE  core
         audit.use-case.ts
5      packages/core/src/index.ts               MODIFY  core
6      packages/core/src/application/use-cases/ MODIFY  core
         manage-insumo.use-case.ts
7      apps/api/src/infra/adapters/driven/       CREATE  api
         database/schema/audit-log.schema.ts
8      apps/api/src/infra/adapters/driven/       MODIFY  api
         database/schema/index.ts
9      apps/api/src/infra/adapters/driven/       CREATE  api
         repositories/postgres-audit.repository.ts
10     apps/api/src/infra/adapters/driving/      CREATE  api
         controllers/audit.controller.ts
11     apps/api/src/infra/adapters/driving/      CREATE  api
         routes/audit.routes.ts
12     apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/index.ts
13     (run) bun run db:generate                          api
```

### Phase 7: Financial Guards

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      apps/api/src/infra/adapters/driving/     CREATE  api
         middleware/financial.middleware.ts
2      apps/api/src/infra/adapters/driving/     MODIFY  api
         routes/cotizacion.routes.ts
```

### Phase 8: Sync Endpoint

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
1      packages/core/src/application/ports/     CREATE  core
         in/sync.input.ts
2      packages/core/src/application/use-cases/ CREATE  core
         sync.use-case.ts
3      packages/core/src/index.ts               MODIFY  core
4      apps/api/src/infra/adapters/driving/      CREATE  api
         controllers/sync.controller.ts
5      apps/api/src/infra/adapters/driving/      CREATE  api
         routes/sync.routes.ts
6      apps/api/src/infra/adapters/driving/      MODIFY  api
         routes/index.ts
```

### Phase 9: Tests

```
ORDER  FILE                                    ACTION      LAYER
─────  ──────────────────────────────────────  ──────────  ───────────────
 [core unit tests]
1      packages/core/src/application/use-cases/ CREATE  core
         __test__/auth-login.use-case.test.ts
2      packages/core/src/application/use-cases/ CREATE  core
         __test__/manage-insumo.use-case.test.ts
3      packages/core/src/application/use-cases/ CREATE  core
         __test__/manage-apu.use-case.test.ts
4      packages/core/src/application/use-cases/ CREATE  core
         __test__/manage-cotizacion.use-case.test.ts
5      packages/core/src/application/use-cases/ CREATE  core
         __test__/branch-cotizacion.use-case.test.ts
6      packages/core/src/application/use-cases/ CREATE  core
         __test__/calculation.use-case.test.ts
7      packages/core/src/application/use-cases/ CREATE  core
         __test__/audit.use-case.test.ts
8      packages/core/src/application/use-cases/ CREATE  core
         __test__/sync.use-case.test.ts

 [api integration tests]
9      apps/api/src/__test__/auth.test.ts       CREATE  api
10     apps/api/src/__test__/users.test.ts       CREATE  api
11     apps/api/src/__test__/insumos.test.ts     CREATE  api
12     apps/api/src/__test__/apus.test.ts        CREATE  api
13     apps/api/src/__test__/cotizaciones.test.ts CREATE  api
14     apps/api/src/__test__/pdf.test.ts         CREATE  api
15     apps/api/src/__test__/audit.test.ts       CREATE  api
16     apps/api/src/__test__/sync.test.ts        CREATE  api
```

---

## 6. Dependencies & Package Installation

### New npm Packages

| Package | Version | Layer | Purpose |
|---------|---------|-------|---------|
| `decimal.js` | ^10.5 | `packages/core`, `apps/api` | Precise financial math |
| `jsonwebtoken` | ^9.0 | `apps/api` | JWT sign & verify |
| `@types/jsonwebtoken` | ^9.0 (dev) | `apps/api` | Type defs |
| `csv-parse` | ^5.6 | `apps/api` | CSV parsing |
| `pdfkit` | ^0.15 | `apps/api` | PDF generation |
| `@types/pdfkit` | ^0.13 (dev) | `apps/api` | PDFKit types |
| `multer` | ^1.4 | `apps/api` | Multipart file upload |
| `@types/multer` | ^1.4 (dev) | `apps/api` | Multer types |
| `deep-diff` | ^1.0 | `apps/api` | JSON diff for audit |
| `@types/deep-diff` | ^1.0 (dev) | `apps/api` | Diff types |

### Install Commands

```bash
# Install API layer dependencies
bun add decimal.js jsonwebtoken csv-parse pdfkit multer deep-diff --cwd apps/api
bun add -d @types/jsonwebtoken @types/pdfkit @types/multer @types/deep-diff --cwd apps/api

# Install Core layer dependencies
bun add decimal.js --cwd packages/core

# Install all workspace packages
bun install
```

### .env additions

```env
###>>> JWT <<<###
JWT_SECRET=your-secret-key-here-min-32-chars-long
JWT_EXPIRES_IN=7d

###>>> PDF <<<###
PDF_UPLOAD_DIR=./uploads/pdf
```

---

## 7. Testing Strategy

### Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST STRATEGY MATRIX                          │
├────────────────────┬───────────────────┬────────────────────────┤
│ Layer              │ Type              │ Runner                 │
├────────────────────┼───────────────────┼────────────────────────┤
│ packages/core      │ Unit tests        │ bun:test               │
│   (use cases)      │ (mock repos)      │                        │
├────────────────────┼───────────────────┼────────────────────────┤
│ apps/api           │ Integration tests │ bun:test + supertest   │
│   (endpoints)      │ (real DB)         │                        │
├────────────────────┼───────────────────┼────────────────────────┤
│ E2E scenarios      │ E2E suite         │ bun:test + supertest   │
│                    │                   │ (isolated collections) │
└────────────────────┴───────────────────┴────────────────────────┘
```

### Unit Tests (packages/core)

Use cases are tested in isolation with mock repository implementations.

| Test File | Scenarios | Coverage Targets |
|-----------|-----------|------------------|
| `auth-login.use-case.test.ts` | Valid login, wrong password, non-existent user, token format | 4 paths |
| `create-user.use-case.test.ts` | Create user, duplicate email, invalid role | 3 paths |
| `manage-insumo.use-case.test.ts` | CRUD, duplicate codigo, bulk validation, auth check propagation | 8 paths |
| `manage-apu.use-case.test.ts` | CRUD, snapshot retention after master update, add/remove insumo | 6 paths |
| `calculation.use-case.test.ts` | All cost formulas, zero quantities, 100% waste, decimal precision | 8 paths |
| `manage-cotizacion.use-case.test.ts` | CRUD, APROBADA guard, item calculations, total recalculation | 8 paths |
| `branch-cotizacion.use-case.test.ts` | Branch creation, max 15 enforcement, independence | 5 paths |
| `audit.use-case.test.ts` | Log creation, diff generation, query filters | 4 paths |
| `sync.use-case.test.ts` | New records, duplicate UUIDs, partial arrays | 4 paths |

### Integration Tests (apps/api)

Using `supertest` with the Express `app` factory against a test database.

| Test File | Key Tests |
|-----------|-----------|
| `health.test.ts` | Existing — GET /api/v1/health returns 200 |
| `auth.test.ts` | POST /login (valid/invalid), POST /forgot-password, POST /reset-password |
| `users.test.ts` | CRUD as ADMIN, 403 for non-ADMIN roles, pagination, filters |
| `insumos.test.ts` | CRUD as ADMIN, 403 for CLIENTE, GET as GERENTE_OBRA allowed, bulk upload success/failure |
| `apus.test.ts` | CRUD, snapshot proof (change master → APU unchanged), RBAC |
| `cotizaciones.test.ts` | CRUD, branching, APROBADA guard → 400, profit margin < 8% → 403 |
| `pdf.test.ts` | Full PDF for ADMIN, redacted for CLIENTE, 200 status |
| `audit.test.ts` | Log created on insumo change, GET /audit-logs, ADMIN only |
| `sync.test.ts` | POST /sincronizar with payload, idempotency check, role check |

### E2E Scenarios (critical paths)

```
SCENARIO 1: Bulk Upload Atomicity
  Given: CSV with 51 rows, row 5 has invalid "invalid-unit"
  When: POST /insumos/bulk-upload
  Then: HTTP 422, zero rows committed, detailed error per row

SCENARIO 2: Snapshot Pricing
  Given: APU with insumo X (cost_base = 100)
  When: PUT /insumos/:id (cost_base → 200)
  Then: GET /apus/:id → unit_price_snapshot still 100

SCENARIO 3: Quote Branching Independence
  Given: Quote V1 with 3 items
  When: POST /cotizaciones/:id/branch → Quote V2
  Then: V1 estado = REEMPLAZADA, V2 estado = BORRADOR
  And: Modifying V2 does NOT affect V1

SCENARIO 4: PDF Redaction
  Given: CLIENTE role user
  When: GET /cotizaciones/:id/pdf
  Then: Response is 200 Content-Type application/pdf
  And: PDF content does NOT contain APU_INSUMO composition table

SCENARIO 5: Sync Idempotency
  Given: Payload with UUIDs that already exist
  When: POST /sincronizar (twice)
  Then: Both calls return 201
  And: No duplicate records exist in database

SCENARIO 6: Profit Margin Guard
  Given: Quote with profit_margin_percent = 7.99
  When: PATCH with estado = "ENVIADA"
  Then: HTTP 403, margin must be ≥ 8%
```

---

## 8. Risk Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| **UUID migration data loss** | Data loss if migration SQL fails | Low | 1. Backup DB before migration 2. Test migration on staging first 3. Use IF EXISTS/IF NOT NULL guards 4. Write a rollback script |
| **Decimal.js precision drift** | Financial miscalculation | Low | 1. All intermediate values remain as `Decimal` type 2. Only convert to `number` at API response boundary 3. Use `toFixed(4)` consistently 4. Test with edge cases (zero, negative, 100% waste) |
| **Bulk upload >50 rows timeout** | HTTP 503 / partial write | Low | 1. Set Express `bodyParser` size limit 2. Use `csv-parse` stream mode 3. Process in 50-row transactions 4. Set appropriate `timeout` middleware |
| **Branching clone misses data** | Incomplete quotes | Low | 1. Explicit `INSERT ... SELECT` for each child table 2. Use `db.transaction()` for atomicity 3. Integration test verifies all items are cloned |
| **JWT secret rotation** | All tokens invalidated | Low | 1. Document rotation procedure 2. Support multiple verification keys via JWKS pattern 3. Use short-lived tokens (7d default) 4. Graceful error handling on 401 |
| **Concurrent PATCH on approved quote** | Race condition bypasses guard | Low | 1. Use `db.transaction()` with row-level `SELECT ... FOR UPDATE` 2. Read current estado inside transaction 3. Check estado before applying update |
| **PDF generation memory leak** | Server OOM | Low | 1. Stream PDF to response (not build in memory) 2. Set max PDF page limits 3. Clean up temp files in PDF_UPLOAD_DIR |

### Key Guard Implementation Details

**APROBADA guard (race condition safe):**
```typescript
// Inside manage-cotizacion.use-case.ts update method:
async update(id: string, input: UpdateCotizacionInput): Promise<Cotizacion> {
  return this.db.transaction(async (tx) => {
    const current = await tx.select().from(cotizaciones)
      .where(eq(cotizaciones.id, id))
      .forUpdate()  // row-level lock
      .limit(1)
      .then(r => r[0]);

    if (current.estado === 'APROBADA') {
      throw new AppError('Cannot modify an approved quote', 400);
    }

    // ... apply updates
  });
}
```

---

## 9. User Approval Request

### Summary

This plan covers **9 implementation phases** for the ProArq Backend V4, building on the existing Clean Architecture + Hexagonal monorepo:

| Phase | Focus | Files Changed | Effort |
|-------|-------|---------------|--------|
| 1 | Foundation (env, auth middleware, UUID) | 8 files | 3h |
| 2 | Auth + Users | 16 files | 4h |
| 3 | Insumos Module | 13 files | 6h |
| 4 | APU Module | 15 files | 5h |
| 5 | Cotizaciones | 16 files | 8h |
| 6 | Audit Logging | 13 files | 3h |
| 7 | Financial Guards | 2 files | 2h |
| 8 | Sync Endpoint | 6 files | 3h |
| 9 | Tests | 16 files | 6h |
| **Total** | | **~105 files** | **~40h** |

### Key Design Decisions

- **Express Request augmentation**: `req.user` is typed with `{ sub: string; role: Role }` via `declare global`
- **PDF service** is an infrastructure concern in `apps/api/src/infra/services/` (not in core); uses **pdfkit** with configurable `LOGO_URL`
- **Audit logging** is wired through constructor injection (`AuditRepository` injected into `ManageInsumoUseCase`)
- **Financial calculations** live in `calculation.use-case.ts` (pure logic, decimal.js) — reusable by cotizacion and APU use cases
- **Reset password** uses token hash stored in `users` table (columns: `reset_token_hash`, `reset_token_expires_at`)
- **ON CONFLICT DO NOTHING** is implemented at the repository level using Drizzle's built-in support
- **Test database** uses dedicated `DATABASE_URL_TEST` env var
- **Sync scope** enforces `created_by` filtering for CLIENTE/REPRESENTANTE roles

### Decisions Log (User-Confirmed)

| # | Decision | Selection |
|---|---|---|
| D-01 | **Reset token storage** | `users` table — 2 extra columns (`reset_token_hash`, `reset_token_expires_at`) |
| D-02 | **PDF logo** | Configurable `LOGO_URL` env var (text-only fallback if empty) |
| D-03 | **Test database** | Dedicated `DATABASE_URL_TEST` env var with separate test DB |
| D-04 | **Sync scope** | CLIENTE/REPRESENTANTE only sync their own records (`created_by` filtering); ADMIN/GERENTE_OBRA/DIRECTOR_OBRA sync all

---

**PLAN_LOCKED: proarq-backend-v4-plan.md — Waiting for User Approval**
