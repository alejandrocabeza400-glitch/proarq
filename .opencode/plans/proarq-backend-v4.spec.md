# ProArq Backend V4 — API Services, Persistence & Deterministic Cost Engine

## Feature Overview

**Why:** The ProArq construction management platform requires a deterministic financial engine, RBAC-secured endpoints, immutable audit trails, offline-first sync capability, and versioned quote workflows. This feature set transforms the MVP user management scaffold into a full-featured construction cost estimation backend.

**What:** V4 introduces five bounded domains — **Users & Auth** (CRUD + JWT), **Insumos** (master supplies), **APU** (unit price analysis), **Cotizaciones** (quotes with branching), **Audit** (immutable log), and **Sync** (offline-first UUID reconciliation) — all wired through the existing Clean Architecture + Hexagonal pattern.

---

## System Roles

The system defines **5 roles** with hierarchical permissions:

| Role | Level | Permission Scope |
|---|---|---|
| `ADMIN` | 4 (Full) | All endpoints, including user management, audit logs, insumo mutations |
| `GERENTE_OBRA` | 3 (Operational) | Same as DIRECTOR_OBRA — project/quote/APU management |
| `DIRECTOR_OBRA` | 3 (Operational) | Quote creation, APU management, insumo read, PDF download (full) |
| `CLIENTE` | 2 (External) | PDF download (redacted), sync endpoint |
| `REPRESENTANTE` | 2 (External) | Same as CLIENTE — PDF download (redacted), sync endpoint |

**Note:** `GERENTE_OBRA` and `DIRECTOR_OBRA` share identical permissions. `REPRESENTANTE` and `CLIENTE` share identical permissions.

---

## Adaptation Notes: SDD Flat Structure → Clean Architecture Mapping

The SDD proposed a flat `backend/` layout. The existing project already uses **Clean Architecture + Hexagonal** (`packages/core` → `apps/api`). The mapping below preserves the architecture while implementing all SDD requirements.

| SDD Flat Structure | Existing Clean Architecture Location | Rationale |
|---|---|---|
| `backend/index.ts` | `apps/api/src/index.ts` (unchanged) | Already exists |
| `backend/config/database.ts` | `apps/api/src/infra/adapters/driven/database/connection.ts` (unchanged) | Already exists |
| `backend/middlewares/auth.middleware.ts` | `apps/api/src/infra/adapters/driving/middleware/auth.middleware.ts` | Driving adapter (inbound HTTP) |
| `backend/middlewares/financial.middleware.ts` | `apps/api/src/infra/adapters/driving/middleware/financial.middleware.ts` | Driving adapter (inbound HTTP) |
| `backend/middlewares/upload.middleware.ts` | `apps/api/src/infra/adapters/driving/middleware/upload.middleware.ts` | Driving adapter (inbound HTTP) |
| `backend/controllers/*.ts` | `apps/api/src/infra/adapters/driving/controllers/*.controller.ts` | Driving adapter (inbound HTTP) |
| `backend/services/calculation.service.ts` | `packages/core/src/application/use-cases/calculation.use-case.ts` (+ port interfaces) | Pure application logic |
| `backend/services/audit.service.ts` | `packages/core/src/application/use-cases/audit.use-case.ts` (+ port interfaces) | Pure application logic |
| `backend/routes/api.routes.ts` | `apps/api/src/infra/adapters/driving/routes/index.ts` (extended) | Already exists |
| `backend/routes/subroutes/` | `apps/api/src/infra/adapters/driving/routes/{domain}.routes.ts` | Per-domain route files |
| DB schema (flat) | `apps/api/src/infra/adapters/driven/database/schema/{domain}.schema.ts` | Drizzle schema files |
| Repositories (flat) | `apps/api/src/infra/adapters/driven/repositories/*.repository.ts` | Driven adapters |

---

## User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | ADMIN | Manage insumos (supplies) via CRUD + CSV bulk upload | I can maintain the master supply catalog |
| US-02 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Query insumos with filters | I can find supplies for cost estimation |
| US-03 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Create and modify cotizaciones (quotes) | I can prepare project budgets |
| US-04 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA, CLIENTE, REPRESENTANTE | Download cotización as PDF | I can share quotes externally |
| US-05 | CLIENTE, REPRESENTANTE | Download PDF without APU_INSUMO breakdown | I only see prices, not internal markup |
| US-06 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Branch a quote to create a new version | I can iterate without losing history |
| US-07 | ADMIN | Modify INSUMOS_MAESTRO pricing | I can update master catalog, with audit trail |
| US-08 | ADMIN | View audit logs for price changes | I can track who changed what and when |
| US-09 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Receive 403 when U% < 8% | I cannot approve unprofitable quotes |
| US-10 | ADMIN | Create, read, update, delete system users | I can manage platform access |
| US-11 | Any (not authenticated) | Login with email + password | I can obtain a JWT token |
| US-12 | Any (not authenticated) | Request password reset via email | I can recover access |
| US-13 | Any (not authenticated) | Reset password with a valid token | I can set a new password |
| US-14 | Any (sync endpoint) | POST pre-generated UUID payloads to `/api/v1/sincronizar` | Mobile clients can sync offline-created records |

---

## Functional Requirements

### FR-1: Authentication Module

**Endpoints:**

| Method | Path | Body / Params | Response | Auth Required |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | `{ email, password }` | 200 `{ accessToken, refreshToken, user }` | ❌ |
| POST | `/api/v1/auth/forgot-password` | `{ email }` | 200 `{ message }` | ❌ |
| POST | `/api/v1/auth/reset-password` | `{ token, newPassword }` | 200 `{ message }` | ❌ |

**Behavior:**
- `login` validates credentials against DB, returns JWT + refresh token
- `forgot-password` generates a time-limited reset token and sends email (or logs it in dev)
- `reset-password` validates token and updates password hash
- No public registration endpoint exists — users are created by ADMIN only
- Password hashing uses **Bun.password** native API (`Bun.password.hash()` / `Bun.password.verify()`)

### FR-2: User Management (ADMIN only)

**Endpoints:**

| Method | Path | Body / Params | Response | Roles |
|---|---|---|---|---|
| POST | `/api/v1/users` | `{ name, email, password, role }` | 201 User | ADMIN only |
| GET | `/api/v1/users` | `?name=&email=&role=&page=&limit=` | 200 Paginated list | ADMIN only |
| GET | `/api/v1/users/:id` | — | 200 User | ADMIN only |
| PUT | `/api/v1/users/:id` | `{ name?, email?, role? }` | 200 User | ADMIN only |
| DELETE | `/api/v1/users/:id` | — | 204 No Content | ADMIN only |

**Behavior:**
- Only ADMIN role can access these endpoints (gated by `checkRole(['ADMIN'])`)
- Password is hashed via `Bun.password.hash()` before storage
- Role assignment is restricted to valid roles: `ADMIN`, `GERENTE_OBRA`, `DIRECTOR_OBRA`, `CLIENTE`, `REPRESENTANTE`

### FR-3: RBAC Security Matrix

A JWT-based role authorization layer with five roles: `ADMIN`, `GERENTE_OBRA`, `DIRECTOR_OBRA`, `CLIENTE`, `REPRESENTANTE`.

**Complete endpoint → role matrix:**

| # | Method | Path | ADMIN | GERENTE_OBRA | DIRECTOR_OBRA | CLIENTE | REPRESENTANTE |
|---|---|---|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | POST | `/api/v1/auth/forgot-password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | POST | `/api/v1/auth/reset-password` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | POST | `/api/v1/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 5 | GET | `/api/v1/users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 6 | GET | `/api/v1/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 7 | PUT | `/api/v1/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 8 | DELETE | `/api/v1/users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 9 | POST | `/api/v1/insumos` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 10 | PUT | `/api/v1/insumos/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 11 | DELETE | `/api/v1/insumos/:id` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 12 | GET | `/api/v1/insumos` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 13 | GET | `/api/v1/insumos/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 14 | POST | `/api/v1/insumos/bulk-upload` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 15 | POST | `/api/v1/apus` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 16 | PUT | `/api/v1/apus/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 17 | GET | `/api/v1/apus` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 18 | GET | `/api/v1/apus/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 19 | POST | `/api/v1/apus/:id/insumos` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 20 | DELETE | `/api/v1/apus/:id/insumos/:itemId` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 21 | POST | `/api/v1/cotizaciones` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 22 | PATCH | `/api/v1/cotizaciones/:id` | ✅ | ✅ | ✅ | ❌ | ❌(¹) |
| 23 | GET | `/api/v1/cotizaciones` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 24 | GET | `/api/v1/cotizaciones/:id` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 25 | GET | `/api/v1/cotizaciones/:id/pdf` | ✅(full) | ✅(full) | ✅(full) | ✅(redacted) | ✅(redacted) |
| 26 | POST | `/api/v1/cotizaciones/:id/branch` | ✅ | ✅ | ✅ | ❌ | ❌ |
| 27 | POST | `/api/v1/sincronizar` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 28 | GET | `/api/v1/audit-logs` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 29 | GET | `/api/v1/health` | ✅ | ✅ | ✅ | ✅ | ✅ |

(¹) PATCH returns 400 if quote estado = "APROBADA"

**JWT payload contract:**
```typescript
interface JwtPayload {
  sub: string;         // user UUID
  role: 'ADMIN' | 'GERENTE_OBRA' | 'DIRECTOR_OBRA' | 'CLIENTE' | 'REPRESENTANTE';
  iat: number;
  exp: number;
}
```

**Middleware behavior:**
- `checkRole(...allowedRoles: Role[])` returns 403 if decoded role not in allowed list
- PDF endpoint uses `filterPdfByRole(req, pdfData)` to strip APU_INSUMO array for CLIENTE/REPRESENTANTE

### FR-4: Insumos (Supplies) Module

**Entity — InsumoMaestro:**
```
INSUMOS_MAESTRO
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── codigo          VARCHAR(20) UNIQUE NOT NULL
├── nombre          VARCHAR(255) NOT NULL
├── unidad          VARCHAR(5) NOT NULL CHECK (unidad IN ('M3','KG','UND','GL'))
├── cost_base       DECIMAL(12,2) NOT NULL  -- master price (snapshot source)
├── created_by      UUID REFERENCES users(id)
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Endpoints:**
| Method | Path | Body / Params | Response | Roles |
|---|---|---|---|---|
| POST | `/api/v1/insumos` | `{ codigo, nombre, unidad, cost_base }` | 201 InsumoMaestro | ADMIN only |
| PUT | `/api/v1/insumos/:id` | `{ nombre?, unidad?, cost_base? }` | 200 InsumoMaestro | ADMIN only |
| DELETE | `/api/v1/insumos/:id` | — | 204 No Content | ADMIN only |
| GET | `/api/v1/insumos` | `?codigo=&nombre=&unidad=&page=&limit=` | 200 Paginated list | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/insumos/:id` | — | 200 InsumoMaestro | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| POST | `/api/v1/insumos/bulk-upload` | CSV body (multipart/form-data) | 201 Created / 422 + error detail | ADMIN only |

**Bulk upload rules:**
- Chunks of max 50 records
- Atomic: `BEGIN TRANSACTION → validate all → COMMIT`; any failure → `ROLLBACK`
- Valid units: `M3`, `KG`, `UND`, `GL`
- Invalid row → HTTP 422 with `{ row: number, errors: string[] }[]`
- On success → HTTP 201 `{ imported: number, skipped: number, errors: array }`
- Duplicate `codigo` rows are skipped, not failed

### FR-5: APU (Unit Price Analysis) Module

**Entity — Apu:**
```
APU
├── id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── codigo          VARCHAR(20) UNIQUE NOT NULL
├── nombre          VARCHAR(255) NOT NULL
├── tipo            VARCHAR(50) NOT NULL
├── created_by      UUID REFERENCES users(id)
├── created_at      TIMESTAMPTZ DEFAULT NOW()
├── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Entity — ApuInsumo:**
```
APU_INSUMO
├── id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── apu_id                UUID NOT NULL REFERENCES APU(id) ON DELETE CASCADE
├── insumo_id             UUID NOT NULL REFERENCES INSUMOS_MAESTRO(id)
├── rendimiento           DECIMAL(12,4) NOT NULL  -- yield per unit
├── desperdicio           DECIMAL(5,2) DEFAULT 0  -- waste %
├── unit_price_snapshot   DECIMAL(12,2) NOT NULL  -- PRICE AT INSERTION TIME (NO live JOIN)
├── created_at            TIMESTAMPTZ DEFAULT NOW()
```

**Cost formula (server-side, using decimal.js):**
```
Costo Directo Item = Rendimiento × unit_price_snapshot × (1 + desperdicio/100)
```

**Endpoints:**
| Method | Path | Body / Params | Response | Roles |
|---|---|---|---|---|
| POST | `/api/v1/apus` | `{ codigo, nombre, tipo }` | 201 APU | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PUT | `/api/v1/apus/:id` | `{ nombre?, tipo? }` | 200 APU | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/apus` | `?codigo=&page=&limit=` | 200 Paginated list | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/apus/:id` | — | 200 APU + items (joined) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| POST | `/api/v1/apus/:id/insumos` | `{ insumo_id, rendimiento, desperdicio }` | 201 ApuInsumo (snapshot copied from master) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| DELETE | `/api/v1/apus/:id/insumos/:itemId` | — | 204 No Content | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |

**Snapshot behavior:**
- When `POST /apus/:id/insumos` is called, the use case does:
  1. Fetch `cost_base` from `INSUMOS_MAESTRO`
  2. Insert into `APU_INSUMO` with `unit_price_snapshot = cost_base`
  3. No JOIN to `INSUMOS_MAESTRO` occurs during subsequent reads

### FR-6: Cotizaciones (Quotes) Module

**Entity — Cotizacion:**
```
COTIZACIONES
├── id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── projecto_id           UUID NOT NULL
├── codigo                VARCHAR(50) NOT NULL
├── version               INTEGER DEFAULT 1
├── estado                VARCHAR(20) NOT NULL DEFAULT 'BORRADOR'
│                         CHECK (estado IN ('BORRADOR','ENVIADA','APROBADA','REEMPLAZADA'))
├── cliente_id            UUID REFERENCES users(id)
├── total_cost_direct     DECIMAL(15,4) DEFAULT 0  -- sum of all items
├── factor_a_percentage   DECIMAL(5,2) DEFAULT 0   -- overhead A%
├── factor_b_percentage   DECIMAL(5,2) DEFAULT 0   -- overhead B%
├── profit_margin_percent DECIMAL(5,2) DEFAULT 0   -- U%
├── total_amount          DECIMAL(15,4) DEFAULT 0  -- final price
├── created_by            UUID REFERENCES users(id)
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
```

**Entity — CotizacionItem:**
```
COTIZACION_ITEMS
├── id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── cotizacion_id         UUID NOT NULL REFERENCES COTIZACIONES(id) ON DELETE CASCADE
├── apu_id                UUID NOT NULL REFERENCES APU(id)
├── cantidad              DECIMAL(12,4) NOT NULL
├── calculated_cost_direct DECIMAL(15,4) DEFAULT 0  -- cantidad × APU direct cost
├── created_at            TIMESTAMPTZ DEFAULT NOW()
```

**State machine:**
```
BORRADOR ──► ENVIADA ──► APROBADA
    │                       │
    └──► REEMPLAZADA  ◄────┘  (via branch endpoint)
```

**Endpoints:**
| Method | Path | Body / Params | Response | Roles |
|---|---|---|---|---|
| POST | `/api/v1/cotizaciones` | `{ projecto_id, codigo, cliente_id?, items[] }` | 201 Cotizacion | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PATCH | `/api/v1/cotizaciones/:id` | `{ estado?, items[], factor_a_percentage?, ... }` | 200 Cotizacion | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/cotizaciones` | `?projecto_id=&estado=&page=&limit=` | 200 Paginated list | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/cotizaciones/:id` | — | 200 Cotizacion + items | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/cotizaciones/:id/pdf` | — | 200 application/pdf | All roles (redacted for CLIENTE/REPRESENTANTE) |
| POST | `/api/v1/cotizaciones/:id/branch` | — | 201 Cotizacion (new version) | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |

**Branching rules:**
- Max 15 versions per `projecto_id` → HTTP 400 if exceeded
- Clones entire quote with `version = old.version + 1`
- Suffix: `codigo-V2`, `codigo-V3`, etc.
- Marks old quote as `estado = 'REEMPLAZADA'`
- Cascading clone of all `COTIZACION_ITEMS` rows
- New branch starts as `BORRADOR`

**APROBADA guard:**
- `PATCH /cotizaciones/:id` returns 400 if `estado === 'APROBADA'`
- Prevents modification of locked quotes (including items, factors, margin)

### FR-7: PDF Generation

**Implementation:** Uses **pdfkit** library.

**Behavior:**
- All roles can call `GET /cotizaciones/:id/pdf`
- For `CLIENTE` and `REPRESENTANTE`: the PDF omits the APU_INSUMO breakdown table (only shows item-level totals)
- For `ADMIN`/`GERENTE_OBRA`/`DIRECTOR_OBRA`: full PDF with APU composition

**Implementation note:**
- The role-filtering logic lives in the driving layer (controller/middleware), not in the use case

### FR-8: Audit Logging

**Entity — AuditLog:**
```
AUDIT_LOGS
├── id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── table_name        VARCHAR(100) NOT NULL
├── record_id         UUID NOT NULL
├── action            VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE'))
├── user_id           UUID NOT NULL REFERENCES users(id)
├── data_history      JSONB NOT NULL  -- { before: {...}, after: {...} }
├── created_at        TIMESTAMPTZ DEFAULT NOW()
```

**Behavior:**
- Every `INSERT`/`UPDATE`/`DELETE` on `INSUMOS_MAESTRO` creates an `AUDIT_LOGS` row
- Captures `user_id` from JWT token (extracted in middleware, passed to use case)
- Captures diff as `{ before: { col: val }, after: { col: val } }` in JSONB
- Queries: `GET /api/v1/audit-logs` (ADMIN only) with `?table_name=&record_id=&user_id=` filters

### FR-9: Profit Margin Guard

- Middleware `validateProfitMargin` runs on `PATCH /cotizaciones/:id` when `estado` is being set to `'ENVIADA'` or `'APROBADA'`
- Validates `profit_margin_percent >= 8.00`
- Fails with HTTP 403 `{ error: "Profit margin must be at least 8%" }`
- Uses `decimal.js` comparison to avoid floating-point errors

### FR-10: Offline-First Sync

**Endpoint:**
```
POST /api/v1/sincronizar
Content-Type: application/json

Body: {
  "insumos": [
    {
      "id": "uuid-pre-generated",
      "codigo": "...",
      "nombre": "...",
      "unidad": "M3",
      "cost_base": "150.50",
      "created_by": "user-uuid"
    }
  ],
  "apus": [ ... ],
  "cotizaciones": [ ... ]
}
```

**Behavior:**
- All transactional tables use UUIDv4 primary keys
- Accepts pre-generated UUIDs from mobile clients
- Uses `ON CONFLICT (id) DO NOTHING` to handle duplicates idempotently (no updates on conflict)
- Processes each entity group in a transaction
- Returns `201 { accepted: number, conflicts: number }`

### FR-11: Decimal Precision (Financial Logic Engine)

**Rules:**
1. All monetary columns use PostgreSQL `DECIMAL(p,s)` (no `FLOAT`, no `REAL`)
2. Server-side calculations use `decimal.js` library (`npm: decimal.js`)
3. Cost formula (APU_INSUMO):  
   `Costo Directo Item = Rendimiento × unit_price_snapshot × (1 + desperdicio/100)`
4. Cost formula (COTIZACION_ITEMS):  
   `calculated_cost_direct = cantidad × Apu.totalDirectCost`
5. Quote totals:  
   `total_cost_direct = SUM(calculated_cost_direct)`  
   `total_amount = total_cost_direct × (1 + factor_a_percentage/100) × (1 + factor_b_percentage/100) × (1 + profit_margin_percent/100)`
6. Rounding: all results rounded to 4 decimal places using `decimal.js toFixed(4)`

---

## Technical Constraints

| Constraint | Rule | Rationale |
|---|---|---|
| **Architecture** | All business logic MUST reside in `packages/core/src/application/use-cases/` | Clean Architecture — domain purity |
| **HTTP layer** | Controllers MUST be factory functions accepting use cases | Dependency injection through composition root |
| **Ports** | Every repository interaction MUST go through a port interface in `packages/core/src/application/ports/out/` | Hexagonal — driven port abstraction |
| **Validation** | All input validation uses Zod schemas defined in `packages/core/src/application/ports/in/` | Consistent validation layer |
| **RBAC** | Auth middleware MUST decode JWT and set `req.user = { sub, role }` | Standard Express middleware pattern |
| **ORM** | Use Drizzle ORM for all database access (NOT Knex or raw SQL) | Consistency with existing stack |
| **Migrations** | All schema changes use Drizzle Kit migrations (`drizzle-kit generate`) | Existing workflow |
| **Decimal** | All financial calculations MUST use `decimal.js` (imported as `Decimal`) | Floating-point avoidance |
| **Error handling** | Throw `AppError` subclasses for business logic errors | Consistent error middleware |
| **Transaction** | Bulk upload uses `db.transaction()` API from Drizzle/Postgres.js | Atomicity guarantee |
| **UUID PKs** | ALL tables use UUID primary keys (`gen_random_uuid()`) | Consistency + offline-first compatibility |
| **Password hashing** | Use `Bun.password.hash()` and `Bun.password.verify()` | Zero-dependency native hashing |
| **PDF** | Use `pdfkit` for server-side PDF generation | Lightweight, no browser dependency |
| **Sync conflict** | `ON CONFLICT (id) DO NOTHING` — skip on duplicate UUID | Idempotent sync |
| **File naming** | Domain schema files: `*.schema.ts`; Controllers: `*.controller.ts`; Routes: `*.routes.ts`; Use cases: `*.use-case.ts`; Ports: `*.port.ts` | Naming convention consistency |

---

## Data Model (Entity Definitions)

### 1. `users` (Migrated to UUID)

**Migration: change PK from `serial` to `uuid`:**

| Column | Type | Constraints |
|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` |
| name | `text` | NOT NULL |
| email | `text` | UNIQUE, NOT NULL |
| password_hash | `text` | NOT NULL (empty for initial migration, then updated) |
| role | `varchar(20)` | NOT NULL, default `'CLIENTE'`, CHECK (`ADMIN`,`GERENTE_OBRA`,`DIRECTOR_OBRA`,`CLIENTE`,`REPRESENTANTE`) |
| created_at | `timestamptz` | default `now()` |
| updated_at | `timestamptz` | default `now()` |

**Migration script:**
```sql
-- 1. Create temp column with UUID
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_temp UUID DEFAULT gen_random_uuid();
-- 2. Drop old PK constraint
ALTER TABLE users DROP CONSTRAINT users_pkey;
-- 3. Set new UUID as PK
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id_temp;
ALTER TABLE users DROP COLUMN id_temp;
ALTER TABLE users ADD PRIMARY KEY (id);
-- 4. Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'CLIENTE'
  CHECK (role IN ('ADMIN','GERENTE_OBRA','DIRECTOR_OBRA','CLIENTE','REPRESENTANTE'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

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
| action | `varchar(10)` | NOT NULL, CHECK |
| user_id | `uuid` | FK → users.id |
| data_history | `jsonb` | NOT NULL |
| created_at | `timestamptz` | default `now()` |

---

## Environment Variables

Add to `.env` and `env.ts` schema:

```env
# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# PDF
PDF_UPLOAD_DIR=./uploads/pdf
```

**Extended `env.ts` Zod schema:**
```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PDF_UPLOAD_DIR: z.string().default('./uploads/pdf'),
});
```

---

## Success Criteria / Definition of Done

1. **Auth:** Login returns JWT; forgot-password and reset-password work end-to-end; no public registration
2. **RBAC:** Every endpoint returns the correct HTTP status (200/201/403) for each role as defined in the security matrix
3. **Users CRUD:** Only ADMIN can create/read/update/delete users; other roles get 403
4. **Cost engine:** `decimal.js` calculations match the cost formula to 4 decimal places for 20+ test scenarios (edge cases: zero quantities, 100% waste, etc.)
5. **Snapshot pricing:** `APU_INSUMO.unit_price_snapshot` retains its original value after `INSUMOS_MAESTRO.cost_base` is updated; API returns prove it
6. **Bulk upload atomicity:** A CSV with 51 rows where row 5 is invalid → zero rows committed (ROLLBACK), HTTP 422
7. **Quote branching:** Branching creates an independent clone; modifying the branch does NOT affect the original; max 15 enforced
8. **APROBADA guard:** PATCH on an approved quote returns 400 with descriptive error
9. **Profit margin:** PATCH with `estado=ENVIADA` and `profit_margin_percent=7.99` returns 403
10. **Audit trail:** Every mutation on `INSUMOS_MAESTRO` has a corresponding `AUDIT_LOGS` row with correct JSONB diff
11. **PDF redaction:** CLIENTE/REPRESENTANTE role PDF response does NOT contain APU_INSUMO composition data
12. **Sync idempotency:** Repeated POST to `/sincronizar` with same UUIDs returns same result and does not create duplicate records
13. **Clean Architecture compliance:** All business rules are in `packages/core/.../use-cases/`; controllers only delegate to use cases; repositories implement port interfaces
14. **All tests pass:** ≥80% code coverage on use cases; integration tests for all endpoints

---

## Proposed File Manifest

### `packages/core/src/` — Domain & Application Layer (NEW files)

```
packages/core/src/
├── domain/entities/
│   ├── user.entity.ts           (migrate id to UUID, add role, password_hash)
│   ├── insumo.entity.ts         ★ NEW
│   ├── apu.entity.ts            ★ NEW
│   ├── apu-insumo.entity.ts     ★ NEW
│   ├── cotizacion.entity.ts     ★ NEW
│   ├── cotizacion-item.entity.ts★ NEW
│   └── audit-log.entity.ts      ★ NEW
├── application/
│   ├── ports/in/
│   │   ├── create-user.input.ts (extend with password, role)
│   │   ├── auth.input.ts        ★ NEW — login, forgot-password, reset-password schemas
│   │   ├── insumo.input.ts      ★ NEW — Zod schemas for insumo CRUD + bulk
│   │   ├── apu.input.ts         ★ NEW
│   │   ├── cotizacion.input.ts  ★ NEW
│   │   └── audit-log.input.ts   ★ NEW
│   ├── ports/out/
│   │   ├── user-repository.port.ts          (extend with CRUD + auth methods)
│   │   ├── insumo-repository.port.ts        ★ NEW
│   │   ├── apu-repository.port.ts           ★ NEW
│   │   ├── cotizacion-repository.port.ts    ★ NEW
│   │   └── audit-repository.port.ts         ★ NEW
│   └── use-cases/
│       ├── create-user.use-case.ts          (extend with password hashing + role)
│       ├── auth-login.use-case.ts           ★ NEW
│       ├── auth-forgot-password.use-case.ts ★ NEW
│       ├── auth-reset-password.use-case.ts  ★ NEW
│       ├── manage-insumo.use-case.ts        ★ NEW
│       ├── manage-apu.use-case.ts           ★ NEW
│       ├── manage-cotizacion.use-case.ts    ★ NEW
│       ├── branch-cotizacion.use-case.ts    ★ NEW
│       ├── calculation.use-case.ts          ★ NEW (cost engine)
│       └── audit.use-case.ts                ★ NEW
├── errors/                                  (existing)
└── index.ts                                 (extended with NEW exports)
```

### `apps/api/src/` — Infrastructure Layer (NEW files)

```
apps/api/src/
├── index.ts                                 (existing)
├── app.ts                                   (existing)
├── infra/
│   ├── config/env.ts                        (extend with JWT_SECRET, JWT_EXPIRES_IN, PDF_UPLOAD_DIR)
│   ├── adapters/driving/
│   │   ├── controllers/
│   │   │   ├── health.controller.ts         (existing)
│   │   │   ├── user.controller.ts           (extend for CRUD)
│   │   │   ├── auth.controller.ts           ★ NEW
│   │   │   ├── insumo.controller.ts         ★ NEW
│   │   │   ├── apu.controller.ts            ★ NEW
│   │   │   ├── cotizacion.controller.ts     ★ NEW
│   │   │   └── audit.controller.ts          ★ NEW
│   │   ├── middleware/
│   │   │   ├── error-handler.middleware.ts   (existing)
│   │   │   ├── validate.middleware.ts        (existing)
│   │   │   ├── auth.middleware.ts           ★ NEW — JWT decode + checkRole()
│   │   │   ├── financial.middleware.ts      ★ NEW — profit margin guard
│   │   │   └── upload.middleware.ts         ★ NEW — CSV multipart parser
│   │   └── routes/
│   │       ├── index.ts                     (extended)
│   │       ├── health.routes.ts             (existing)
│   │       ├── auth.routes.ts               ★ NEW
│   │       ├── user.routes.ts               (extend for CRUD)
│   │       ├── insumo.routes.ts             ★ NEW
│   │       ├── apu.routes.ts                ★ NEW
│   │       ├── cotizacion.routes.ts         ★ NEW
│   │       ├── audit.routes.ts              ★ NEW
│   │       └── sync.routes.ts               ★ NEW
│   └── adapters/driven/
│       ├── database/
│       │   ├── connection.ts                (existing)
│       │   └── schema/
│       │       ├── index.ts                 (extended)
│       │       ├── user.schema.ts           (migrate to UUID, add role, password_hash)
│       │       ├── insumo.schema.ts         ★ NEW
│       │       ├── apu.schema.ts            ★ NEW
│       │       ├── apu-insumo.schema.ts     ★ NEW
│       │       ├── cotizacion.schema.ts     ★ NEW
│       │       ├── cotizacion-item.schema.ts★ NEW
│       │       └── audit-log.schema.ts      ★ NEW
│       └── repositories/
│           ├── postgres-user.repository.ts  (extend for CRUD + auth queries)
│           ├── postgres-insumo.repository.ts★ NEW
│           ├── postgres-apu.repository.ts   ★ NEW
│           ├── postgres-cotizacion.repository.ts★ NEW
│           └── postgres-audit.repository.ts ★ NEW
```

### Additional Configuration

- `apps/api/drizzle.config.ts` — update schema path (already points to `schema/index.ts`)
- `apps/api/package.json` — add `decimal.js`, `jsonwebtoken`, `csv-parse`, `pdfkit`, `multer`, `deep-diff`
- `packages/core/package.json` — add `decimal.js` dependency
- `.env` — add `JWT_SECRET`, `JWT_EXPIRES_IN`, `PDF_UPLOAD_DIR`

---

## Dependencies to Add

| Package | Version | Layer | Purpose |
|---|---|---|---|
| `decimal.js` | ^10.5 | `packages/core`, `apps/api` | High-precision financial math |
| `jsonwebtoken` | ^9.0 | `apps/api` | JWT sign & verify |
| `@types/jsonwebtoken` | ^9.0 | `apps/api` (dev) | JWT type definitions |
| `csv-parse` | ^5.6 | `apps/api` | CSV parsing for bulk upload |
| `pdfkit` | ^0.15 | `apps/api` | PDF generation |
| `@types/pdfkit` | ^0.13 | `apps/api` (dev) | PDFKit type definitions |
| `multer` | ^1.4 | `apps/api` | Multipart file upload |
| `@types/multer` | ^1.4 | `apps/api` (dev) | Multer type definitions |
| `deep-diff` | ^1.0 | `apps/api` | JSON diff for audit logs |
| `@types/deep-diff` | ^1.0 | `apps/api` (dev) | Diff type definitions |

**Note:** Password hashing uses `Bun.password` (native) — no external dependency needed.

**Installation command:**
```bash
# apps/api
bun add decimal.js jsonwebtoken csv-parse pdfkit multer deep-diff && \
bun add -d @types/jsonwebtoken @types/pdfkit @types/multer @types/deep-diff

# packages/core
bun add decimal.js
```

---

## Implementation Order (Recommended Sequence)

| Phase | Modules | Dependencies | Estimated Effort |
|---|---|---|---|
| **1. Foundation** | Env config (JWT_SECRET), Auth middleware + JWT helpers, `decimal.js` setup, UUID migration | — | 3h |
| **2. Auth + Users** | Auth endpoints (login, forgot-password, reset-password), Users CRUD (ADMIN only) | Phase 1 | 4h |
| **3. Insumos Module** | Schema, entity, ports, repository, use case, controller, routes | Phase 1 | 6h |
| **4. APU Module** | Schema, entity, ports, repository, use case (with snapshot), controller, routes | Phase 1, 3 | 5h |
| **5. Cotizaciones** | Schema, entity, ports, repository, use cases (CRUD + branch), PDF | Phase 1, 3, 4 | 8h |
| **6. Audit Logging** | Schema, entity, ports, repository, use case, hooks in insumo repo | Phase 1, 3 | 3h |
| **7. Financial Guards** | Profit margin middleware, calculation use case | Phase 5 | 2h |
| **8. Sync Endpoint** | UUID reconciliation, ON CONFLICT DO NOTHING | Phase 3, 4, 5 | 3h |
| **9. Tests** | Integration + unit tests for all modules | All phases | 6h |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| UUID migration of existing users table | Data loss if migration script fails | Low | Test migration on staging; backup DB first |
| Decimal.js precision drift across aggregations | Financial mis-calc | Low | All intermediate values use `Decimal` type; only convert to number at API boundary |
| Bulk upload of 50+ rows times out | HTTP 503 / partial data | Low | Set Express body size limit; stream CSV; use 50-row batching |
| Quote branching cascading clone misses related data | Incomplete clone | Low | Explicit `INSERT ... SELECT` for each child table; test with integrations |
| JWT secret rotation invalidates all active tokens | All API calls fail | Low | Document rotation procedure; support multiple verification keys |

---

## Decisions Log (User-Confirmed)

| # | Decision | Value |
|---|---|---|
| D-01 | Primary keys | ALL tables use UUID (`gen_random_uuid()`) including `users` |
| D-02 | PDF Library | `pdfkit` |
| D-03 | Sync conflict | `ON CONFLICT (id) DO NOTHING` (no upsert) |
| D-04 | Password hashing | `Bun.password` native API |
| D-05 | Environment vars | `JWT_SECRET`, `JWT_EXPIRES_IN`, `PDF_UPLOAD_DIR` |

---

**SPECIFICATION_LOCKED: proarq-backend-v4.spec.md - Waiting for User Approval**
