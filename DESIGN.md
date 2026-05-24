# ProArq — Design Document

## Architecture Overview

**ProArq** is a TypeScript monorepo (Bun + Turbo) following **Clean Architecture + Hexagonal (Ports & Adapters)** pattern. The codebase is split into two layers:

```
packages/core   → Domain + Application (pure TypeScript, zero framework deps)
    apps/api    → Infrastructure (Express, Drizzle, Postgres)
```

### Core Principles

1. **Domain Isolation** — `packages/core` has zero knowledge of HTTP, databases, or frameworks.
2. **Dependency Inversion** — `apps/api` depends on abstractions from `packages/core` (ports), never the other way.
3. **Testability** — Use cases can be unit-tested without a database or HTTP server.
4. **Offline-First** — Transactional tables use UUIDv4 primary keys generated client-side to support mobile sync.

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Bun v1.x | High-performance JS/TS runtime, bundler, package manager |
| Web Framework | Express 5 | HTTP server with strict TypeScript types |
| ORM / Query Builder | Drizzle ORM | Type-safe SQL for PostgreSQL |
| Database | PostgreSQL | Relational store with decimal precision |
| Validation | Zod | Runtime schema validation |
| Monorepo | Bun workspaces + Turbo | Multi-package orchestration |
| Linting | Biome v2 | Unified linter + formatter |

---

## Directory Structure

```
proarq/
├── packages/
│   └── core/                            # Domain + Application Layer
│       └── src/
│           ├── domain/entities/          # Pure domain interfaces (7 entities)
│           │   ├── user.entity.ts
│           │   ├── insumo.entity.ts
│           │   ├── apu.entity.ts
│           │   ├── apu-insumo.entity.ts
│           │   ├── cotizacion.entity.ts
│           │   ├── cotizacion-item.entity.ts
│           │   └── audit-log.entity.ts
│           ├── application/
│           │   ├── ports/
│           │   │   ├── in/               # Inbound ports (Zod input schemas)
│           │   │   │   ├── create-user.input.ts
│           │   │   │   ├── auth.input.ts
│           │   │   │   ├── insumo.input.ts
│           │   │   │   ├── apu.input.ts
│           │   │   │   ├── cotizacion.input.ts
│           │   │   │   ├── audit-log.input.ts
│           │   │   │   └── sync.input.ts
│           │   │   └── out/              # Outbound ports (repository interfaces)
│           │   │       ├── user-repository.port.ts
│           │   │       ├── insumo-repository.port.ts
│           │   │       ├── apu-repository.port.ts
│           │   │       ├── cotizacion-repository.port.ts
│           │   │       └── audit-repository.port.ts
│           │   └── use-cases/            # Application business logic (11 use cases)
│           │       ├── create-user.use-case.ts
│           │       ├── auth-login.use-case.ts
│           │       ├── auth-forgot-password.use-case.ts
│           │       ├── auth-reset-password.use-case.ts
│           │       ├── manage-insumo.use-case.ts
│           │       ├── manage-apu.use-case.ts
│           │       ├── manage-cotizacion.use-case.ts
│           │       ├── branch-cotizacion.use-case.ts
│           │       ├── calculation.use-case.ts
│           │       ├── audit.use-case.ts
│           │       └── sync.use-case.ts
│           └── errors/                   # Shared error types
│               ├── app.error.ts
│               ├── forbidden.error.ts
│               ├── not-found.error.ts
│               └── validation.error.ts
│
├── apps/
│   └── api/                             # Infrastructure Layer (Express)
│       └── src/
│           ├── index.ts                 # Server bootstrap
│           ├── app.ts                   # Express app factory
│           ├── __test__/
│           │   ├── health.test.ts
│           │   ├── unit/                # 9 unit test files
│           │   ├── integration/         # 6 integration test files
│           │   ├── middleware/
│           │   └── setup/               # Test seed & helpers
│           └── infra/
│               ├── config/
│               │   └── env.ts           # Zod-validated env vars
│               └── adapters/
│                   ├── driving/         # Controllers, Routes, Middleware (inbound)
│                   │   ├── controllers/ # 8 controllers
│                   │   ├── middleware/   # 5 middleware
│                   │   └── routes/      # 9 route files
│                   └── driven/          # Repositories, DB connection (outbound)
│                       ├── database/
│                       │   ├── connection.ts
│                       │   └── schema/  # 7 Drizzle schema files + index
│                       └── repositories/ # 5 repositories + sync handler
│
├── DESIGN.md                            # This file
├── README.md
└── package.json                         # Root monorepo config
```

---

## Domain Entities

### 1. `users`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| name | `text` | NOT NULL |
| email | `text` | UNIQUE, NOT NULL |
| password_hash | `text` | NOT NULL |
| role | `varchar(20)` | NOT NULL, default `'CLIENTE'`, CHECK (`ADMIN`,`GERENTE_OBRA`,`DIRECTOR_OBRA`,`CLIENTE`,`REPRESENTANTE`) |
| reset_token_hash | `varchar(64)` | nullable |
| reset_token_expiry | `timestamptz` | nullable |
| created_at | `timestamptz` | default `now()` |
| updated_at | `timestamptz` | default `now()` |

### 2. `insumos_maestro`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| codigo | `varchar(20)` | UNIQUE, NOT NULL |
| nombre | `varchar(255)` | NOT NULL |
| unidad | `varchar(5)` | NOT NULL, CHECK (`M3`,`KG`,`UND`,`GL`) |
| cost_base | `decimal(12,2)` | NOT NULL |
| created_by | `uuid` | FK → users.id |
| created_at | `timestamptz` | default `now()` |
| updated_at | `timestamptz` | default `now()` |

### 3. `apus`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| codigo | `varchar(20)` | UNIQUE, NOT NULL |
| nombre | `varchar(255)` | NOT NULL |
| tipo | `varchar(50)` | NOT NULL |
| created_by | `uuid` | FK → users.id |
| created_at | `timestamptz` | default `now()` |
| updated_at | `timestamptz` | default `now()` |

### 4. `apu_insumos`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| apu_id | `uuid` | FK → apus.id, ON DELETE CASCADE |
| insumo_id | `uuid` | FK → insumos_maestro.id |
| rendimiento | `decimal(12,4)` | NOT NULL |
| desperdicio | `decimal(5,2)` | default 0 |
| unit_price_snapshot | `decimal(12,2)` | NOT NULL |
| created_at | `timestamptz` | default `now()` |

### 5. `cotizaciones`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| projecto_id | `uuid` | NOT NULL |
| codigo | `varchar(50)` | NOT NULL |
| version | `integer` | default 1 |
| estado | `varchar(20)` | NOT NULL, default `'BORRADOR'`, CHECK |
| cliente_id | `uuid` | FK → users.id |
| total_cost_direct | `decimal(15,4)` | default 0 |
| factor_a_percentage | `decimal(5,2)` | default 0 |
| factor_b_percentage | `decimal(5,2)` | default 0 |
| profit_margin_percent | `decimal(5,2)` | default 0 |
| total_amount | `decimal(15,4)` | default 0 |
| created_by | `uuid` | FK → users.id |
| created_at | `timestamptz` | default `now()` |
| updated_at | `timestamptz` | default `now()` |

### 6. `cotizacion_items`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| cotizacion_id | `uuid` | FK → cotizaciones.id, ON DELETE CASCADE |
| apu_id | `uuid` | FK → apus.id |
| cantidad | `decimal(12,4)` | NOT NULL |
| calculated_cost_direct | `decimal(15,4)` | default 0 |
| created_at | `timestamptz` | default `now()` |

### 7. `audit_logs`

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| table_name | `varchar(100)` | NOT NULL |
| record_id | `uuid` | NOT NULL |
| action | `varchar(10)` | NOT NULL, CHECK (`INSERT`,`UPDATE`,`DELETE`) |
| user_id | `uuid` | FK → users.id |
| data_history | `jsonb` | NOT NULL |
| created_at | `timestamptz` | default `now()` |

---

## Entity Relationship Diagram

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

---

## API Endpoints

### Base URL: `/api/v1`

#### Authentication (no auth required)

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login with email + password, returns JWT | ❌ |
| POST | `/auth/forgot-password` | Request password reset (generates token) | ❌ |
| POST | `/auth/reset-password` | Reset password with valid token | ❌ |

#### Users (ADMIN only)

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/users` | Create user | ADMIN |
| GET | `/users` | List users (paginated, filterable) | ADMIN |
| GET | `/users/:id` | Get user by ID | ADMIN |
| PUT | `/users/:id` | Update user | ADMIN |
| DELETE | `/users/:id` | Delete user | ADMIN |

#### Insumos (Supplies)

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/insumos` | Create insumo | ADMIN |
| PUT | `/insumos/:id` | Update insumo | ADMIN |
| DELETE | `/insumos/:id` | Delete insumo | ADMIN |
| GET | `/insumos` | List insumos (paginated, filterable) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/insumos/:id` | Get insumo by ID | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| POST | `/insumos/bulk-upload` | CSV bulk upload | ADMIN |

#### APU (Unit Price Analysis)

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/apus` | Create APU | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PUT | `/apus/:id` | Update APU | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/apus` | List APUs (paginated) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/apus/:id` | Get APU with items | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| POST | `/apus/:id/insumos` | Add insumo to APU (snapshot price) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| DELETE | `/apus/:id/insumos/:itemId` | Remove insumo from APU | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |

#### Cotizaciones (Quotes)

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/cotizaciones` | Create cotización with items | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PATCH | `/cotizaciones/:id` | Update cotización (frozen if APROBADA) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/cotizaciones` | List cotizaciones (paginated, filterable) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/cotizaciones/:id` | Get cotización with items | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/cotizaciones/:id/pdf` | Download PDF (redacted for CLIENTE/REPRESENTANTE) | ALL |
| POST | `/cotizaciones/:id/branch` | Branch (version clone) a cotización | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |

#### Audit Logs

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/audit-logs` | Query audit logs (filterable, paginated) | ADMIN |

#### Sync (Offline-First)

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/sincronizar` | Sync pre-generated UUID payloads idempotently | ALL (authenticated) |

#### Health

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/health` | Health check | ALL (no auth) |

---

## RBAC Security Matrix

| # | Method | Path | ADMIN | GERENTE_OBRA | DIRECTOR_OBRA | CLIENTE | REPRESENTANTE |
|---|---|---|---|---|---|---|---|
| 1 | POST | `/auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | POST | `/auth/forgot-password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | POST | `/auth/reset-password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | POST | `/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 5 | GET | `/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 6 | GET | `/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 7 | PUT | `/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 8 | DELETE | `/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 9 | POST | `/insumos` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 10 | PUT | `/insumos/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 11 | DELETE | `/insumos/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 12 | GET | `/insumos` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 13 | GET | `/insumos/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 14 | POST | `/insumos/bulk-upload` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 15 | POST | `/apus` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 16 | PUT | `/apus/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 17 | GET | `/apus` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 18 | GET | `/apus/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 19 | POST | `/apus/:id/insumos` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 20 | DELETE | `/apus/:id/insumos/:itemId` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 21 | POST | `/cotizaciones` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 22 | PATCH | `/cotizaciones/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 23 | GET | `/cotizaciones` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 24 | GET | `/cotizaciones/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 25 | GET | `/cotizaciones/:id/pdf` | ✅ (full) | ✅ (full) | ✅ (full) | ✅ (redacted) | ✅ (redacted) |
| 26 | POST | `/cotizaciones/:id/branch` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 27 | POST | `/sincronizar` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 28 | GET | `/audit-logs` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 29 | GET | `/health` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Key Architectural Decisions

### 1. JWT Authentication (RBAC)
- Stateless JWT tokens encode user role among 5 roles: `ADMIN`, `GERENTE_OBRA`, `DIRECTOR_OBRA`, `CLIENTE`, `REPRESENTANTE`.
- `auth.middleware.ts` decodes JWT and sets `req.user = { sub, role }`.
- `checkRole(...allowedRoles)` factory returns 403 if role not in allowed list.
- PDF generation uses role-based filtering: CLIENTE/REPRESENTANTE get redacted PDF (no APU_INSUMO breakdown).

### 2. Snapshot Pricing (Immutability)
- `APU_INSUMO.unit_price_snapshot` stores the price at insertion time — no live `JOIN` to `INSUMOS_MAESTRO`.
- Historical quotes remain accurate even if master prices change.

### 3. Decimal Precision for Finance
- All monetary columns use `DECIMAL(p,s)` in PostgreSQL (no `FLOAT`/`REAL`).
- Server-side calculations use `decimal.js` (imported as `Decimal`) to avoid floating-point errors.
- Cost formula (APU_INSUMO): `Costo Directo Item = Rendimiento × unit_price_snapshot × (1 + desperdicio/100)`
- Quote totals:
  - `total_cost_direct = SUM(calculated_cost_direct)`
  - `total_amount = total_cost_direct × (1 + factor_a/100) × (1 + factor_b/100) × (1 + profit_margin/100)`

### 4. Atomic Bulk Upload
- CSV processing uses atomic transactions: `BEGIN` → validate all rows → `COMMIT` or `ROLLBACK`.
- Max 50-row chunks to limit memory usage.
- Duplicate `codigo` rows are skipped (not failed).

### 5. Audit Logging
- Every `INSERT`/`UPDATE`/`DELETE` on `INSUMOS_MAESTRO` inserts into `AUDIT_LOGS`.
- Captures `user_id` from JWT, diff as `{ before: {...}, after: {...} }` in JSONB column.
- Queryable via `GET /api/v1/audit-logs` (ADMIN only) with `?table_name=&record_id=&user_id=` filters.

### 6. Quote Versioning (Branching)
- `POST /api/v1/cotizaciones/:id/branch` clones a frozen quote (estado → `REEMPLAZADA`), creates new version with `BORRADOR` state, cascades all items.
- Maximum 15 versions per `projecto_id` → HTTP 400 if exceeded.
- Suffix pattern: `codigo-V2`, `codigo-V3`, etc.

### 7. Quote State Machine
```
BORRADOR ──► ENVIADA ──► APROBADA
    │                       │
    └──► REEMPLAZADA  ◄────┘  (via branch endpoint)
```

### 8. Profit Margin Guard (8% Rule)
- `financial.middleware.ts` validates `U% >= 8%` before persisting quotes with `ENVIADA` or `APROBADA` status.
- Returns HTTP 403 `{ error: "Profit margin must be at least 8%" }` if below threshold.
- Uses `decimal.js` comparison to avoid floating-point errors.

### 9. APROBADA Guard
- `PATCH /cotizaciones/:id` returns HTTP 400 if `estado === 'APROBADA'`.
- Prevents modification of locked quotes (including items, factors, margin).

### 10. Offline-First UUIDs
- Transactional tables use UUIDv4 primary keys, generated client-side, to avoid key collisions during sync.
- Sync endpoint (`POST /api/v1/sincronizar`) uses `ON CONFLICT (id) DO NOTHING` for idempotent inserts.

### 11. Password Hashing
- Uses `Bun.password.hash()` and `Bun.password.verify()` — zero external dependencies.

### 12. PDF Generation
- Uses `pdfkit` library — lightweight, no browser dependency.
- PDF generation lives in the controller layer (not use case), so role-based filtering respects Clean Architecture boundaries.
- CLIENTE/REPRESENTANTE receive PDF without APU_INSUMO breakdown table.

---

## Request Flow (Example: POST /api/v1/insumos)

```
HTTP POST /api/v1/insumos
  ↓
  ↓ 1. Express Router matches → insumo.routes.ts
  ↓ 2. auth.middleware.ts: decodeJWT() → verifies JWT, sets req.user = { sub, role }
  ↓ 3. checkRole(['ADMIN']) → 403 if not ADMIN
  ↓ 4. validate(createInsumoSchema) → validates req.body via Zod
  ↓
  ↓ 5. insumo.controller.ts factory → receives use case, calls execute(input)
  ↓ 6. manage-insumo.use-case.ts → applies business rules (duplicate check, audit log)
  ↓ 7. insumo-repository.port.ts interface → postgres-insumo.repository.ts
  ↓ 8. Drizzle ORM executes SQL via postgres.js
  ↓
  ↓ 9. Response flows back through the layers
HTTP 201 { data: { ... } }
```

---

## Layer Architecture

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
│  │  Errors (AppError, ForbiddenError, NotFoundError,             │  │
│  │         ValidationError)                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Code Inventory

### Use Cases (11) — `packages/core/src/application/use-cases/`

| Use Case | File | Responsibility |
|---|---|---|
| Create User | `create-user.use-case.ts` | Hash password, validate role, delegate to repository |
| Auth Login | `auth-login.use-case.ts` | Validate credentials, return JWT payload |
| Forgot Password | `auth-forgot-password.use-case.ts` | Generate reset token, store hash, log in dev |
| Reset Password | `auth-reset-password.use-case.ts` | Validate token, hash new password, update |
| Manage Insumo | `manage-insumo.use-case.ts` | CRUD + bulk upload + audit logging |
| Manage APU | `manage-apu.use-case.ts` | CRUD + snapshot pricing on insumo add |
| Manage Cotización | `manage-cotizacion.use-case.ts` | CRUD + APROBADA guard + item calculations |
| Branch Cotización | `branch-cotizacion.use-case.ts` | Version increment, clone, max-15 enforcement |
| Calculation | `calculation.use-case.ts` | Cost engine with decimal.js formulas |
| Audit | `audit.use-case.ts` | Log mutations + query logs |
| Sync | `sync.use-case.ts` | Process payload with ON CONFLICT DO NOTHING |

### Drizzle Schemas (7) — `apps/api/src/infra/adapters/driven/database/schema/`

| Schema | File | Table |
|---|---|---|
| Users | `user.schema.ts` | `users` |
| Insumos | `insumo.schema.ts` | `insumos_maestro` |
| APUs | `apu.schema.ts` | `apus` |
| APU Insumos | `apu-insumo.schema.ts` | `apu_insumos` |
| Cotizaciones | `cotizacion.schema.ts` | `cotizaciones` |
| Cotización Items | `cotizacion-item.schema.ts` | `cotizacion_items` |
| Audit Logs | `audit-log.schema.ts` | `audit_logs` |

### Repositories (5 + sync handler) — `apps/api/src/infra/adapters/driven/repositories/`

| Repository | File | Port Implemented |
|---|---|---|
| Postgres User | `postgres-user.repository.ts` | `UserRepositoryPort` |
| Postgres Insumo | `postgres-insumo.repository.ts` | `InsumoRepositoryPort` |
| Postgres APU | `postgres-apu.repository.ts` | `ApuRepositoryPort` |
| Postgres Cotización | `postgres-cotizacion.repository.ts` | `CotizacionRepositoryPort` |
| Postgres Audit | `postgres-audit.repository.ts` | `AuditRepositoryPort` |
| Sync Handler | `sync.handler.ts` | Offline-first sync helpers |

### Controllers (8) — `apps/api/src/infra/adapters/driving/controllers/`

| Controller | File | Endpoints |
|---|---|---|
| Health | `health.controller.ts` | `GET /health` |
| Auth | `auth.controller.ts` | Login, forgot-password, reset-password |
| User | `user.controller.ts` | Users CRUD |
| Insumo | `insumo.controller.ts` | Insumos CRUD + bulk-upload |
| APU | `apu.controller.ts` | APUs CRUD + add/remove insumos |
| Cotización | `cotizacion.controller.ts` | Cotizaciones CRUD + branch + PDF |
| Audit | `audit.controller.ts` | Audit log queries |
| Sync | `sync.controller.ts` | Sync endpoint |

### Middleware (5) — `apps/api/src/infra/adapters/driving/middleware/`

| Middleware | File | Purpose |
|---|---|---|
| Auth | `auth.middleware.ts` | JWT decode + `checkRole()` factory |
| Error Handler | `error-handler.middleware.ts` | Global error handling |
| Financial | `financial.middleware.ts` | Profit margin ≥ 8% guard |
| Upload | `upload.middleware.ts` | Multer CSV multipart parser |
| Validate | `validate.middleware.ts` | Zod schema validation |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `PORT` | ❌ | `3000` | HTTP server port |
| `NODE_ENV` | ❌ | `development` | Runtime environment |
| `CORS_ORIGIN` | ❌ | `*` | CORS allowed origin |
| `JWT_SECRET` | ✅ | — | JWT signing secret (≥ 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT token expiry duration |
| `PDF_UPLOAD_DIR` | ❌ | `./uploads/pdf` | PDF file upload directory |
| `LOGO_URL` | ❌ | `''` | Logo URL for PDF generation |
| `DATABASE_URL_TEST` | ❌ | — | Test database connection string |

---

## Test Coverage

### Unit Tests (9 files) — `apps/api/src/__test__/unit/`

| File | Module Tested |
|---|---|
| `auth-login.use-case.test.ts` | Login use case |
| `auth-forgot-password.use-case.test.ts` | Forgot password use case |
| `auth-reset-password.use-case.test.ts` | Reset password use case |
| `manage-insumo.use-case.test.ts` | Insumo management |
| `manage-apu.use-case.test.ts` | APU management |
| `manage-cotizacion.use-case.test.ts` | Cotización management |
| `branch-cotizacion.use-case.test.ts` | Branching logic |
| `calculation.use-case.test.ts` | Cost engine formulas |
| `audit.use-case.test.ts` | Audit logging |

### Integration Tests (6 files) — `apps/api/src/__test__/integration/`

| File | Module Tested |
|---|---|
| `auth.test.ts` | Auth endpoints (login, forgot, reset) |
| `users.test.ts` | Users CRUD with RBAC |
| `insumos.test.ts` | Insumos CRUD + bulk upload |
| `apus.test.ts` | APUs CRUD + snapshot verification |
| `cotizaciones.test.ts` | Cotizaciones CRUD + branch + PDF |
| `sync.test.ts` | Sync endpoint idempotency |

---

## File Naming Conventions

| Layer | Pattern | Example |
|---|---|---|
| Domain entities | `*.entity.ts` | `user.entity.ts` |
| Inbound ports | `*.input.ts` | `create-user.input.ts` |
| Outbound ports | `*.port.ts` | `user-repository.port.ts` |
| Use cases | `*.use-case.ts` | `create-user.use-case.ts` |
| Drizzle schemas | `*.schema.ts` | `user.schema.ts` |
| Controllers | `*.controller.ts` | `user.controller.ts` |
| Routes | `*.routes.ts` | `user.routes.ts` |
| Middleware | `*.middleware.ts` | `auth.middleware.ts` |
| Repositories | `*-<db>.repository.ts` | `postgres-user.repository.ts` |
