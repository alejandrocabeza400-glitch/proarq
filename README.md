# ProArq

**Construction Cost Estimation Platform** — A TypeScript monorepo following Clean Architecture + Hexagonal (Ports & Adapters) pattern, built with Bun, Express, PostgreSQL, and Drizzle ORM.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database Migrations](#database-migrations)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Users (ADMIN)](#users-admin)
  - [Insumos (Supplies)](#insumos-supplies)
  - [APU (Unit Price Analysis)](#apu-unit-price-analysis)
  - [Cotizaciones (Quotes)](#cotizaciones-quotes)
  - [Audit Logs](#audit-logs)
  - [Sync (Offline-First)](#sync-offline-first)
  - [Health](#health)
- [RBAC Security Matrix](#rbac-security-matrix)
- [Project Structure](#project-structure)
- [Testing](#testing)

---

## Project Overview

ProArq is a construction cost estimation and quote management backend. It provides:

- **Authentication & Authorization** — JWT-based with 5 hierarchical roles
- **User Management** — Full CRUD for ADMIN only
- **Master Supplies Catalog** — Manage construction supplies with CSV bulk upload
- **Unit Price Analysis (APU)** — Define work units with snapshot-priced components
- **Quotes (Cotizaciones)** — Create, branch, and manage construction quotes with deterministic cost engine
- **Audit Trail** — Immutable logging of all supply catalog mutations
- **Offline-First Sync** — UUID-based idempotent sync for mobile clients
- **PDF Generation** — Role-aware PDF export (full vs. redacted)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | [Bun](https://bun.sh) v1.x | High-performance JS/TS runtime, bundler, package manager |
| Web Framework | [Express](https://expressjs.com) 5 | HTTP server |
| ORM | [Drizzle ORM](https://orm.drizzle.team) | Type-safe SQL for PostgreSQL |
| Database | [PostgreSQL](https://www.postgresql.org) 16+ | Relational store with decimal precision |
| Validation | [Zod](https://zod.dev) | Runtime schema validation |
| Financial Math | [decimal.js](https://mikemcl.github.io/decimal.js/) | High-precision decimal arithmetic |
| PDF Generation | [pdfkit](http://pdfkit.org) | Server-side PDF generation |
| CSV Parsing | [csv-parse](https://csv.js.org/parse/) | CSV bulk upload parser |
| JWT | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT sign & verify |
| Monorepo | Bun workspaces + Turborepo | Multi-package orchestration |
| Linting | [Biome](https://biomejs.dev) v2 | Unified linter + formatter |

---

## Architecture

The project follows **Clean Architecture** with **Hexagonal (Ports & Adapters)** pattern:

```
                         ┌─────────────────────┐
                         │   HTTP / External     │
                         └──────────┬──────────┘
                                    │
┌───────────────────────────────────┴───────────────────────────────────┐
│                       apps/api (Infrastructure)                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Driving Adapters (inbound): Controllers, Middleware, Routes     │  │
│  └──────────────────────────────┬──────────────────────────────────┘  │
│                                 │ depends on abstractions (ports)     │
│  ┌──────────────────────────────┴──────────────────────────────────┐  │
│  │  Driven Adapters (outbound): Repositories, DB Connection         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ depends on abstractions (ports)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     packages/core (Domain + Application)             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Domain Entities (pure TS interfaces)                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Application: Use Cases + Inbound Ports + Outbound Ports       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Domain Isolation** — `packages/core` has zero knowledge of HTTP, databases, or frameworks.
2. **Dependency Inversion** — `apps/api` depends on abstractions from `packages/core` (ports), never the other way.
3. **Testability** — Use cases are unit-tested without a database or HTTP server.
4. **Offline-First** — Transactional tables use UUIDv4 primary keys for mobile sync compatibility.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.x (install: `curl -fsSL https://bun.sh/install | bash`)
- PostgreSQL 16+ running locally or remotely
- Node.js 22+ (for Biome and Drizzle Kit)

### Installation

```bash
# Clone the repository
git clone <repo-url> proarq
cd proarq

# Install all dependencies (monorepo workspaces)
bun install

# Copy and configure environment variables
cp apps/api/.env.example .env
# Edit .env with your database URL and JWT secret

# Generate and run database migrations
bun run --filter api db:generate
bun run --filter api db:migrate

# Start development server
bun run dev
```

### Environment Variables

Create a `.env` file at the project root:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/proarq
DATABASE_URL_TEST=postgres://user:password@localhost:5432/proarq_test

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# PDF Generation
PDF_UPLOAD_DIR=./uploads/pdf
LOGO_URL=
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `DATABASE_URL_TEST` | ❌ | — | Test database (optional) |
| `PORT` | ❌ | `3000` | HTTP server port |
| `NODE_ENV` | ❌ | `development` | Runtime environment |
| `CORS_ORIGIN` | ❌ | `*` | CORS allowed origin |
| `JWT_SECRET` | ✅ | — | JWT signing secret (≥ 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT token expiry |
| `PDF_UPLOAD_DIR` | ❌ | `./uploads/pdf` | PDF upload directory |
| `LOGO_URL` | ❌ | `''` | Logo for PDF generation |

> **Note:** The `.env` file is loaded automatically by Bun. The `apps/api/.env.example` file contains a minimal template.

---

## Available Scripts

### Root (all workspaces)

| Script | Description |
|---|---|
| `bun run dev` | Start all workspaces in development mode |
| `bun run build` | Build all workspaces |
| `bun run test` | Run tests across all workspaces |
| `bun run lint` | Lint and auto-fix with Biome |
| `bun run lint:ci` | Lint check (CI mode, no fixes) |
| `bun run format` | Format code with Biome |
| `bun run format:check` | Check formatting (CI mode) |
| `bun run clean` | Clean all dist directories |

### API (`apps/api`)

| Script | Description |
|---|---|
| `bun run --filter api dev` | Start API in watch mode |
| `bun run --filter api build` | Build API for production |
| `bun run --filter api start` | Start production server |
| `bun run --filter api db:generate` | Generate Drizzle Kit migration |
| `bun run --filter api db:migrate` | Run pending migrations |
| `bun run --filter api db:push` | Push schema (dev only) |
| `bun run --filter api db:studio` | Open Drizzle Studio |
| `bun run --filter api test` | Run all tests (seed + unit + integration) |

---

## Database Migrations

Migrations live in `apps/api/migrations/` and are managed with Drizzle Kit.

### Workflow

1. **Modify a schema file** in `apps/api/src/infra/adapters/driven/database/schema/`
2. **Generate migration:**
   ```bash
   bun run --filter api db:generate
   ```
3. **Review the generated SQL** in `apps/api/migrations/`
4. **Apply migration:**
   ```bash
   bun run --filter api db:migrate
   ```

### Development Shortcut

For rapid prototyping, you can push schema changes directly:
```bash
bun run --filter api db:push
```

> **Warning:** `db:push` is not recommended for production — always use generated migrations.

---

## API Documentation

**Base URL:** `http://localhost:3000/api/v1`

### Authentication

Public endpoints — no auth token required.

#### POST `/auth/login`

Authenticate a user and receive JWT tokens.

```json
// Request
{ "email": "admin@proarq.com", "password": "securepassword" }

// Response 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "user": { "id": "uuid", "name": "Admin", "email": "admin@proarq.com", "role": "ADMIN" }
}
```

#### POST `/auth/forgot-password`

Request a password reset token (mailed in production, logged in dev).

```json
// Request
{ "email": "user@proarq.com" }

// Response 200
{ "message": "If the email exists, a reset link has been sent" }
```

#### POST `/auth/reset-password`

Reset password using a valid reset token.

```json
// Request
{ "token": "reset-token-string", "newPassword": "newSecurePassword" }

// Response 200
{ "message": "Password reset successfully" }
```

---

### Users (ADMIN)

All user endpoints require `Authorization: Bearer <token>` with ADMIN role.

#### POST `/users`

Create a new system user.

```json
// Request
{ "name": "New User", "email": "user@proarq.com", "password": "securepass", "role": "DIRECTOR_OBRA" }

// Response 201
{ "id": "uuid", "name": "New User", "email": "user@proarq.com", "role": "DIRECTOR_OBRA" }
```

#### GET `/users`

List users with pagination and filtering.

| Query Param | Type | Description |
|---|---|---|
| `name` | string | Filter by name (partial match) |
| `email` | string | Filter by email (partial match) |
| `role` | string | Filter by role |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

#### GET `/users/:id`

Get a single user by UUID.

#### PUT `/users/:id`

Update user fields.

```json
// Request (partial)
{ "name": "Updated Name", "role": "GERENTE_OBRA" }

// Response 200
{ "id": "uuid", "name": "Updated Name", "role": "GERENTE_OBRA" }
```

#### DELETE `/users/:id`

Delete a user.

- **Response:** `204 No Content`

---

### Insumos (Supplies)

#### POST `/insumos` (ADMIN)

Create a new supply item.

```json
// Request
{ "codigo": "CEM-001", "nombre": "Cemento Portland Tipo I", "unidad": "KG", "cost_base": 12.50 }

// Response 201
{ "id": "uuid", "codigo": "CEM-001", "nombre": "Cemento Portland Tipo I", "unidad": "KG", "cost_base": "12.50" }
```

#### PUT `/insumos/:id` (ADMIN)

Update a supply item.

```json
// Request (partial)
{ "cost_base": 15.00 }

// Response 200
{ "id": "uuid", "codigo": "CEM-001", "cost_base": "15.00" }
```

#### DELETE `/insumos/:id` (ADMIN)

Delete a supply item.

- **Response:** `204 No Content`

#### GET `/insumos` (ADMIN, GERENTE_OBRA, DIRECTOR_OBRA)

List supplies with pagination and filtering.

| Query Param | Type | Description |
|---|---|---|
| `codigo` | string | Filter by code (partial match) |
| `nombre` | string | Filter by name (partial match) |
| `unidad` | string | Filter by unit (M3, KG, UND, GL) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

#### GET `/insumos/:id` (ADMIN, GERENTE_OBRA, DIRECTOR_OBRA)

Get a single supply item.

#### POST `/insumos/bulk-upload` (ADMIN)

Upload a CSV file with supply items (multipart/form-data).

| Field | Type | Description |
|---|---|---|
| `file` | file | CSV file with columns: codigo, nombre, unidad, cost_base |

- **Success:** `201 { imported: number, skipped: number, errors: [] }`
- **Error:** `422` with per-row error details
- **Atomic:** All-or-nothing transaction, max 50 rows per request

**Valid units:** `M3`, `KG`, `UND`, `GL`

---

### APU (Unit Price Analysis)

All APU endpoints require `Authorization: Bearer <token>` with ADMIN, GERENTE_OBRA, or DIRECTOR_OBRA role.

#### POST `/apus`

Create a new APU.

```json
// Request
{ "codigo": "APU-001", "nombre": "Muro de ladrillo", "tipo": "Estructural" }

// Response 201
{ "id": "uuid", "codigo": "APU-001", "nombre": "Muro de ladrillo", "tipo": "Estructural" }
```

#### PUT `/apus/:id`

Update an APU.

#### GET `/apus`

List APUs with pagination.

| Query Param | Type | Description |
|---|---|---|
| `codigo` | string | Filter by code |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

#### GET `/apus/:id`

Get an APU with its insumos (joined).

#### POST `/apus/:id/insumos`

Add an insumo to the APU. The `unit_price_snapshot` is captured from `INSUMOS_MAESTRO.cost_base` at insertion time.

```json
// Request
{ "insumo_id": "uuid", "rendimiento": 0.5, "desperdicio": 5 }

// Response 201
{ "id": "uuid", "apu_id": "uuid", "insumo_id": "uuid", "rendimiento": "0.5000", "desperdicio": "5.00", "unit_price_snapshot": "12.50" }
```

#### DELETE `/apus/:id/insumos/:itemId`

Remove an insumo from the APU.

- **Response:** `204 No Content`

---

### Cotizaciones (Quotes)

All cotización endpoints require `Authorization: Bearer <token>` with ADMIN, GERENTE_OBRA, or DIRECTOR_OBRA role (except PDF which is available to all roles).

#### POST `/cotizaciones`

Create a new cotización with items.

```json
// Request
{
  "projecto_id": "uuid",
  "codigo": "COT-2026-001",
  "cliente_id": "uuid",
  "items": [
    { "apu_id": "uuid", "cantidad": 10 }
  ]
}

// Response 201
{
  "id": "uuid",
  "projecto_id": "uuid",
  "codigo": "COT-2026-001",
  "version": 1,
  "estado": "BORRADOR",
  "total_cost_direct": "1500.0000",
  "total_amount": "1500.0000",
  "items": [...]
}
```

#### PATCH `/cotizaciones/:id`

Update a cotización. Returns **400** if `estado === 'APROBADA'`. Returns **403** if setting `estado` to `ENVIADA`/`APROBADA` with `profit_margin_percent < 8`.

```json
// Request (partial)
{
  "estado": "ENVIADA",
  "factor_a_percentage": 10,
  "factor_b_percentage": 5,
  "profit_margin_percent": 12
}

// Response 200
{
  "id": "uuid",
  "estado": "ENVIADA",
  "total_cost_direct": "1500.0000",
  "total_amount": "1940.4000"
}
```

#### GET `/cotizaciones`

List cotizaciones with pagination and filtering.

| Query Param | Type | Description |
|---|---|---|
| `projecto_id` | string | Filter by project |
| `estado` | string | Filter by estado |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

#### GET `/cotizaciones/:id`

Get a cotización with its items.

#### GET `/cotizaciones/:id/pdf`

Download a PDF of the cotización.

| Role | PDF Content |
|---|---|
| ADMIN | Full PDF with APU_INSUMO composition |
| GERENTE_OBRA | Full PDF with APU_INSUMO composition |
| DIRECTOR_OBRA | Full PDF with APU_INSUMO composition |
| CLIENTE | Redacted PDF (no APU_INSUMO breakdown) |
| REPRESENTANTE | Redacted PDF (no APU_INSUMO breakdown) |

- **Response:** `200 application/pdf`

#### POST `/cotizaciones/:id/branch`

Branch (version clone) a cotización. Marks the original as `REEMPLAZADA` and creates a new version as `BORRADOR`.

| Condition | Behavior |
|---|---|
| Max 15 versions per project | HTTP 400 if exceeded |
| Original estado | Set to `REEMPLAZADA` |
| New version | `version = old.version + 1`, starts as `BORRADOR` |
| Items | All cotizacion_items are cloned |
| Codigo suffix | `codigo-V2`, `codigo-V3`, etc. |

- **Response:** `201` with the new cotización

### Quote State Machine

```
BORRADOR ──► ENVIADA ──► APROBADA
    │                       │
    └──► REEMPLAZADA  ◄────┘  (via branch)
```

---

### Audit Logs

Requires ADMIN role.

#### GET `/audit-logs`

Query audit logs with pagination and filtering.

| Query Param | Type | Description |
|---|---|---|
| `table_name` | string | Filter by table (e.g., `insumos_maestro`) |
| `record_id` | string | Filter by record UUID |
| `user_id` | string | Filter by user UUID |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "table_name": "insumos_maestro",
      "record_id": "uuid",
      "action": "UPDATE",
      "user_id": "uuid",
      "data_history": { "before": { "cost_base": "10.00" }, "after": { "cost_base": "12.50" } },
      "created_at": "2026-05-23T..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

---

### Sync (Offline-First)

Requires authentication (any role). Accepts pre-generated UUIDs for idempotent offline-first sync.

#### POST `/sincronizar`

```json
// Request
{
  "insumos": [
    { "id": "uuid", "codigo": "CEM-001", "nombre": "Cemento", "unidad": "KG", "cost_base": "12.50", "created_by": "uuid" }
  ],
  "apus": [...],
  "apuInsumos": [...],
  "cotizaciones": [...],
  "cotizacionItems": [...]
}

// Response 200
{ "accepted": 15, "conflicts": 3 }
```

- Uses `ON CONFLICT (id) DO NOTHING` — duplicates are skipped, not overwritten.
- Processes each entity group independently within a transaction.

---

### Health

#### GET `/health`

Health check endpoint (no authentication required).

```json
// Response 200
{ "status": "ok", "timestamp": "2026-05-23T12:00:00.000Z" }
```

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

### Role Hierarchy

| Role | Level | Permission Scope |
|---|---|---|
| `ADMIN` | 4 (Full) | All endpoints, user management, audit logs |
| `GERENTE_OBRA` | 3 (Operational) | Quotes, APUs, insumo read |
| `DIRECTOR_OBRA` | 3 (Operational) | Quotes, APUs, insumo read |
| `CLIENTE` | 2 (External) | PDF (redacted), sync |
| `REPRESENTANTE` | 2 (External) | PDF (redacted), sync |

> **Note:** `GERENTE_OBRA` and `DIRECTOR_OBRA` share identical permissions. `CLIENTE` and `REPRESENTANTE` share identical permissions.

---

## Project Structure

```
proarq/
├── packages/
│   └── core/                              # Domain + Application Layer
│       └── src/
│           ├── domain/entities/            # 7 pure domain interfaces
│           ├── application/
│           │   ├── ports/
│           │   │   ├── in/                 # 7 Zod input schemas
│           │   │   └── out/                # 5 repository interfaces
│           │   └── use-cases/              # 11 business logic use cases
│           ├── errors/                     # 4 error classes
│           └── index.ts                    # Public API exports
│
├── apps/
│   └── api/                               # Infrastructure Layer
│       ├── migrations/                     # Drizzle Kit SQL migrations
│       ├── drizzle.config.ts               # Drizzle Kit configuration
│       └── src/
│           ├── index.ts                    # Server bootstrap
│           ├── app.ts                      # Express app factory
│           ├── __test__/                   # Tests (unit, integration, middleware)
│           └── infra/
│               ├── config/env.ts           # Zod-validated environment
│               └── adapters/
│                   ├── driving/
│                   │   ├── controllers/    # 8 HTTP controllers
│                   │   ├── middleware/      # 5 Express middleware
│                   │   └── routes/         # 9 route definitions
│                   └── driven/
│                       ├── database/
│                       │   ├── connection.ts
│                       │   └── schema/     # 7 Drizzle table schemas
│                       └── repositories/   # 5 repository implementations
│
├── DESIGN.md                              # Architecture design document
├── README.md                              # This file
└── package.json                           # Root monorepo config
```

---

## Testing

### Test Structure

```
apps/api/src/__test__/
├── unit/                # 9 use case unit tests (mocked repos)
│   ├── auth-login.use-case.test.ts
│   ├── auth-forgot-password.use-case.test.ts
│   ├── auth-reset-password.use-case.test.ts
│   ├── manage-insumo.use-case.test.ts
│   ├── manage-apu.use-case.test.ts
│   ├── manage-cotizacion.use-case.test.ts
│   ├── branch-cotizacion.use-case.test.ts
│   ├── calculation.use-case.test.ts
│   └── audit.use-case.test.ts
├── integration/         # 6 integration tests (real database)
│   ├── auth.test.ts
│   ├── users.test.ts
│   ├── insumos.test.ts
│   ├── apus.test.ts
│   ├── cotizaciones.test.ts
│   └── sync.test.ts
├── middleware/           # Middleware tests
├── setup/               # Test seed data and helpers
└── health.test.ts       # Health check test
```

### Running Tests

```bash
# Run all tests (with database seeding)
bun run --filter api test

# Run specific test file
bun test apps/api/src/__test__/unit/auth-login.use-case.test.ts

# Run integration tests only
bun test apps/api/src/__test__/integration/cotizaciones.test.ts
```

### Test Philosophy

- **Unit tests** mock repository ports to test use case business logic in isolation.
- **Integration tests** use a real PostgreSQL database (seeded before each test run).
- Each integration test file runs a fresh seed to ensure deterministic results.
- Tests cover RBAC enforcement (403 scenarios), financial calculations, snapshot pricing, branching logic, audit trail, and sync idempotency.

---

## Related Documentation

- [`DESIGN.md`](./DESIGN.md) — Detailed architecture design, entity relationships, and code inventory
- [`apps/api/README.md`](./apps/api/README.md) — API-specific instructions and directory details
- [Specification](.opencode/plans/proarq-backend-v4.spec.md) — Original V4 feature specification
- [Implementation Plan](.opencode/plans/proarq-backend-v4-plan.md) — Detailed execution plan

---

## License

ProArq — Construction Cost Estimation Platform
