# Research Document — ProArq Mobile App

> **Author:** @Research Agent
> **Date:** 2026-05-24
> **Purpose:** Reference document for building the React Native (Expo) mobile app that consumes the ProArq REST API.
> **Status:** RESEARCH_COMPLETE: ProArq Mobile Patterns

---

## Table of Contents

1. [Entity Reference](#1-entity-reference)
2. [API Response Format](#2-api-response-format)
3. [Auth Flow](#3-auth-flow)
4. [Reusable Zod Schemas](#4-reusable-zod-schemas)
5. [Sync Protocol](#5-sync-protocol)
6. [Error Handling Pattern](#6-error-handling-pattern)
7. [API Endpoint Map](#7-api-endpoint-map)
8. [Key Findings](#8-key-findings)

---

## 1. Entity Reference

All entities live in `packages/core/src/domain/entities/`. These are pure TypeScript interfaces (zero framework deps) and can be imported by the mobile app via:
```typescript
import type { User } from '@proarq/core/domain/entities/user.entity';
```

### 1.1 User

**File:** `user.entity.ts`
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;          // NEVER exposed to client — use in API response stripping
  role: 'ADMIN' | 'GERENTE_OBRA' | 'DIRECTOR_OBRA' | 'CLIENTE' | 'REPRESENTANTE';
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**⚠️ Gotcha:** The `passwordHash` field EXISTS in the entity but will probably be stripped by the backend response — but verify this. The mobile app should NEVER receive or store `passwordHash`.

### 1.2 Insumo (Supply / Master Catalog)

**File:** `insumo.entity.ts`
```typescript
export interface Insumo {
  id: string;
  codigo: string;               // Unique code
  nombre: string;
  unidad: 'M3' | 'KG' | 'UND' | 'GL';  // Strict union
  costBase: string;             // Decimal string — use decimal.js for arithmetic
  createdBy: string;            // User ID
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.3 Apu (Unit Price Analysis)

**File:** `apu.entity.ts`
```typescript
export interface Apu {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.4 ApuInsumo (APU Line Item)

**File:** `apu-insumo.entity.ts`
```typescript
export interface ApuInsumo {
  id: string;
  apuId: string;
  insumoId: string;
  rendimiento: string;          // Decimal string — performance/yield
  desperdicio: string;          // Decimal string — waste percentage
  unitPriceSnapshot: string;    // Snapshot of insumo costBase at time of APU creation
  createdAt: Date;
}
```

**Cost Calculation (client-side):**
```
itemCost = rendimiento × unitPriceSnapshot × (1 + desperdicio / 100)
```

### 1.5 Cotizacion (Quote)

**File:** `cotizacion.entity.ts`
```typescript
export interface Cotizacion {
  id: string;
  projectoId: string;
  codigo: string;
  version: number;
  estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'REEMPLAZADA';
  clienteId?: string | null;
  totalCostDirect: string;      // Sum of all item direct costs
  factorAPercentage: string;    // Factor A %
  factorBPercentage: string;    // Factor B %
  profitMarginPercent: string;  // Profit margin U%
  totalAmount: string;          // Final calculated amount
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.6 CotizacionItem (Quote Line Item)

**File:** `cotizacion-item.entity.ts`
```typescript
export interface CotizacionItem {
  id: string;
  cotizacionId: string;
  apuId: string;
  cantidad: string;             // Quantity (decimal string)
  calculatedCostDirect: string; // Pre-calculated line total
  createdAt: Date;
}
```

### 1.7 Proyecto (Project)

**File:** `proyecto.entity.ts`
```typescript
export interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  estado: 'PLANIFICACION' | 'EN_EJECUCION' | 'FINALIZADO' | 'SUSPENDIDO';
  clienteId?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.8 AuditLog

**File:** `audit-log.entity.ts`
```typescript
export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string;
  dataHistory: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  createdAt: Date;
}
```

### Entity Relationship Summary

```
User ──1:N── Proyecto (via createdBy)
User ──1:N── Insumo (via createdBy)
User ──1:N── Apu (via createdBy)
User ──1:N── Cotizacion (via createdBy & clienteId)
Proyecto ──1:N── Cotizacion
Apu ──1:N── ApuInsumo ──N:1── Insumo
Cotizacion ──1:N── CotizacionItem ──N:1── Apu
```

---

## 2. API Response Format

### 2.1 Success Responses

All controllers follow the **`{ data: ... }` envelope pattern**:

| HTTP Method | Status Code | Body Format | Example |
|---|---|---|---|
| GET (list) | 200 | `{ data: Entity[] }` | `{ data: [ { id: "..." }, ... ] }` |
| GET (single) | 200 | `{ data: Entity }` | `{ data: { id: "...", ... } }` |
| POST (create) | 201 | `{ data: Entity }` | `{ data: { id: "..." } }` |
| PUT (update) | 200 | `{ data: Entity }` | `{ data: { id: "..." } }` |
| DELETE | 204 | *(no body)* | — |
| Login | 200 | `{ data: { accessToken, refreshToken, user } }` | See Auth Flow |
| Sync | 201 | `{ data: { accepted, conflicts } }` | See Sync Protocol |
| Forgot/Reset | 200 | `{ message: string }` | `{ message: "...instructions..." }` |
| Bulk Upload | 201 | `{ data: { imported, skipped, errors[] } }` | |

### 2.2 Error Responses

All errors follow the **`{ error: string, details?: any }`** pattern:

| Scenario | Status | Body |
|---|---|---|
| Validation error | 400 | `{ error: "Validation failed", details: [{ code: "too_small", ... }] }` |
| Missing token | 401 | `{ error: "No token provided" }` |
| Invalid token | 401 | `{ error: "Invalid token" }` |
| Wrong credentials | 401 | `{ error: "Invalid email or password" }` |
| Insufficient role | 403 | `{ error: "Forbidden: insufficient role" }` |
| Profit margin too low | 403 | `{ error: "Profit margin must be at least 8%" }` |
| Not found | 404 | `{ error: "Project not found" }` |
| Foreign key violation | 400 | `{ error: "...no existe.", details: "Key (cliente_id)=..." }` |
| Unique violation | 400 | `{ error: "Ya existe un registro...", details: "..." }` |
| Server error | 500 | `{ error: "Internal Server Error" }` |
| CSV missing | 400 | `{ error: "CSV file is required" }` |

### 2.3 Pagination

Query parameters are **NOT** returned as part of a pagination envelope — the `findAll` use cases return **only the data array**. If you need total count / page info, check if use cases return it. The query schema always has:
```typescript
page: z.coerce.number().int().positive().default(1);
limit: z.coerce.number().int().positive().max(100).default(10);
```

**⚠️ Gotcha:** The backend does NOT wrap paginated results in a `{ data, total, page, limit, totalPages }` envelope. Each `findAll` returns just `Entity[]`. You may need to either:
1. Add pagination meta to backend responses, OR
2. Use a total-count header if implemented, OR
3. Implement client-side "load more" with `limit` (no total pages)

---

## 3. Auth Flow

### 3.1 Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin User",
      "email": "admin@proarq.com",
      "role": "ADMIN",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**⚠️ Gotcha:** The `user` object in the login response includes all User entity fields. The `passwordHash` may be included — the app should map/transform to strip it. Test this.

### 3.2 JWT Payload Structure

**Access Token** (default 7d expiry):
```typescript
interface AccessTokenPayload {
  sub: string;    // User ID (UUID)
  role: string;   // e.g. "ADMIN"
  iat: number;    // Issued at
  exp: number;    // Expiry
}
```

**Refresh Token** (default 30d expiry):
```typescript
interface RefreshTokenPayload {
  sub: string;    // User ID (UUID)
  iat: number;
  exp: number;
}
```

The refresh token payload contains ONLY `sub` — no `role` field.

### 3.3 Request Authentication

All authenticated endpoints use:
```
Authorization: Bearer <access-token>
```

The `decodeJWT` middleware:
1. Extracts token from `Authorization` header (starts with `Bearer `)
2. Verifies with `JWT_SECRET`
3. Sets `req.user = { sub: string, role: string }`
4. Returns 401 if missing/invalid

### 3.4 Refresh Token Flow

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):** Same shape as login:
```json
{
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "user": { ... }
  }
}
```

**Key details:**
- Default `JWT_EXPIRES_IN = "7d"` and `JWT_REFRESH_EXPIRES_IN = "30d"`
- `JWT_SECRET` min 32 chars (enforced by Zod at startup)
- `JWT_REFRESH_SECRET` defaults to a hardcoded fallback (configurable)
- No refresh token rotation in the current code — same token is used each time
- On refresh failure: returns 401 with `{ error: "Invalid or expired refresh token" }`

### 3.5 Forgot / Reset Password

| Step | Endpoint | Request | Response |
|---|---|---|---|
| Request code | `POST /api/v1/auth/forgot-password` | `{ email: "..." }` | `{ message: "..." }` |
| Reset password | `POST /api/v1/auth/reset-password` | `{ token: "...", newPassword: "... (min 8 chars)" }` | `{ message: "..." }` |

### 3.6 Role-Based Access Control

Roles: `ADMIN`, `GERENTE_OBRA`, `DIRECTOR_OBRA`, `CLIENTE`, `REPRESENTANTE`

The `checkRole(...allowedRoles)` middleware returns 403 if the user's role is not in the allowed list.

**Role access per module:**

| Module | ADMIN | GERENTE_OBRA | DIRECTOR_OBRA | CLIENTE | REPRESENTANTE |
|---|---|---|---|---|---|
| Auth (login/refresh/forgot/reset) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users (CRUD) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Insumos (read) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Insumos (write) | ✅ | ❌ | ❌ | ❌ | ❌ |
| APUs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cotizaciones (oper) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cotizaciones (PDF) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proyectos (oper) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Proyectos (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sync | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 4. Reusable Zod Schemas

All input schemas live in `packages/core/src/application/ports/in/` and can be imported by the mobile app via:
```typescript
import { loginSchema, createInsumoSchema } from '@proarq/core/application/ports/in/insumo.input';
```

Since `@proarq/core` package.json exports `./application/*` → `./src/application/*.ts`, these are accessible.

### 4.1 Auth Schemas (`auth.input.ts`)

| Schema | Fields | Mobile Use |
|---|---|---|
| `loginSchema` | `email: z.string().email()`, `password: z.string().min(1)` | Login form |
| `forgotPasswordSchema` | `email: z.string().email()` | Forgot password form |
| `resetPasswordSchema` | `token: z.string().min(1)`, `newPassword: z.string().min(8)` | Reset password form |
| `refreshSchema` | `refreshToken: z.string().min(1)` | Token refresh |

### 4.2 Insumo Schemas (`insumo.input.ts`)

| Schema | Fields | Mobile Use |
|---|---|---|
| `createInsumoSchema` | `codigo (1-20)`, `nombre (1-255)`, `unidad (enum)`, `costBase (decimal)` | Create form |
| `updateInsumoSchema` | All optional | Edit form |
| `insumoQuerySchema` | `codigo?`, `nombre?`, `unidad?`, `page (default 1)`, `limit (default 10, max 100)` | Search/filter |
| `bulkInsumoSchema` | Same as create | Bulk upload |

### 4.3 APU Schemas (`apu.input.ts`)

| Schema | Fields | Mobile Use |
|---|---|---|
| `createApuSchema` | `codigo (1-20)`, `nombre (1-255)`, `tipo (1-50)` | Create form |
| `updateApuSchema` | `nombre?`, `tipo?` | Edit form |
| `apuQuerySchema` | `codigo?`, `page (1)`, `limit (10)` | Search |
| `addApuInsumoSchema` | `insumoId (uuid)`, `rendimiento (decimal)`, `desperdicio (decimal, default "0")` | Add item |

### 4.4 Cotizacion Schemas (`cotizacion.input.ts`)

| Schema | Fields | Mobile Use |
|---|---|---|
| `createCotizacionSchema` | `projectoId (uuid)`, `codigo (1-50)`, `clienteId? (uuid)`, `items: [{ apuId, cantidad }]` | Create form |
| `updateCotizacionSchema` | `estado?`, `clienteId?`, `items?`, `factorAPercentage?`, `factorBPercentage?`, `profitMarginPercent?` | Edit form |
| `cotizacionQuerySchema` | `projecto_id?`, `estado?`, `page (1)`, `limit (10)` | Filter/sort |
| `cotizacionItemInputSchema` | `apuId (uuid)`, `cantidad (decimal)` | Line item |

### 4.5 Proyecto Schemas (`proyecto.input.ts`)

| Schema | Fields | Mobile Use |
|---|---|---|
| `createProyectoSchema` | `codigo (req)`, `nombre (req)`, `descripcion?`, `estado (default PLANIFICACION)`, `clienteId?` | Create form |
| `updateProyectoSchema` | All optional | Edit form |
| `proyectoQuerySchema` | `codigo?`, `nombre?`, `estado?`, `page (1)`, `limit (10)` | Search/filter |

### 4.6 User Schemas (`create-user.input.ts`)

| Schema | Fields | Mobile Use |
|---|---|---|
| `createUserSchema` | `name (req)`, `email (email)`, `password (min 8)`, `role (default CLIENTE)` | Create form |
| `updateUserSchema` | `name?`, `email?`, `role?` | Edit form |
| `userQuerySchema` | `name?`, `email?`, `role?`, `page (1)`, `limit (10)` | Search/filter |

### 4.7 Audit Log Schema (`audit-log.input.ts`)

| Schema | Fields |
|---|---|
| `auditLogQuerySchema` | `tableName?`, `recordId?`, `userId?`, `page (1)`, `limit (10)` |

### 4.8 Sync Schema (`sync.input.ts`)

See full [Sync Protocol](#5-sync-protocol) section below.

### Import Path Quick Reference

```typescript
import { loginSchema } from '@proarq/core/application/ports/in/auth.input';
import { createInsumoSchema } from '@proarq/core/application/ports/in/insumo.input';
import { createApuSchema } from '@proarq/core/application/ports/in/apu.input';
import { createCotizacionSchema } from '@proarq/core/application/ports/in/cotizacion.input';
import { createProyectoSchema } from '@proarq/core/application/ports/in/proyecto.input';
import { createUserSchema } from '@proarq/core/application/ports/in/create-user.input';
import { syncPayloadSchema } from '@proarq/core/application/ports/in/sync.input';
```

---

## 5. Sync Protocol

### 5.1 Endpoint

**POST** `/api/v1/sincronizar`  
Auth: Required (any role)  
Validation: `syncPayloadSchema`

### 5.2 Request Payload

```json
{
  "insumos": [
    {
      "id": "uuid-pre-generated-on-client",
      "codigo": "INS001",
      "nombre": "Cemento Portland",
      "unidad": "KG",
      "cost_base": "8500.00",
      "created_by": "user-uuid"
    }
  ],
  "apus": [
    {
      "id": "uuid",
      "codigo": "APU001",
      "nombre": "Muro de ladrillo",
      "tipo": "Estructural",
      "created_by": "user-uuid"
    }
  ],
  "apuInsumos": [
    {
      "id": "uuid",
      "apu_id": "apu-uuid",
      "insumo_id": "insumo-uuid",
      "rendimiento": "1.5000",
      "desperdicio": "5.00",
      "unit_price_snapshot": "8500.00"
    }
  ],
  "cotizaciones": [
    {
      "id": "uuid",
      "projecto_id": "project-uuid",
      "codigo": "COT-2025-001",
      "version": 1,
      "estado": "BORRADOR",
      "cliente_id": "client-uuid",
      "created_by": "user-uuid"
    }
  ],
  "cotizacionItems": [
    {
      "id": "uuid",
      "cotizacion_id": "cotizacion-uuid",
      "apu_id": "apu-uuid",
      "cantidad": "10.0000"
    }
  ]
}
```

### 5.3 Response Format

```json
{
  "data": {
    "accepted": 12,
    "conflicts": 3
  }
}
```

### 5.4 Sync Semantics

- **ON CONFLICT (id) DO NOTHING** — first-write-wins
- Server iterates rows individually; each one is a separate INSERT
- A row with an existing `id` is **silently skipped** (counted as conflict, not error)
- No updates — sync only handles INSERT of new entities
- All 5 arrays are optional; empty arrays are simply skipped
- Sync handler does NOT perform cascading operations (e.g., syncing a cotizacion does not auto-sync its items — they must be sent separately)

### 5.5 Maximum Sync Chunk Size

The `syncPayloadSchema` is not size-limited by Zod, but the `createInserter` pattern iterates rows one-by-one. For large batches, consider chunking (recommended max: 50 items per request).

### 5.6 UUID Requirement

**All IDs must be pre-generated on the client** using `crypto.randomUUID()`. The server does not generate IDs for sync payloads.

---

## 6. Error Handling Pattern

### 6.1 Error Class Hierarchy (shared)

```
AppError (base)
├── statusCode: number
├── isOperational: boolean
├── ValidationError (status 400)
│   └── details: ZodError['issues']
├── NotFoundError (status 404)
└── ForbiddenError (status 403)
```

### 6.2 Global Error Handler (server-side)

The `errorHandler` middleware in `apps/api/src/infra/adapters/driving/middleware/error-handler.middleware.ts`:

1. **AppError** → returns `err.statusCode` with `{ error: err.message }` (+ `details` if ValidationError with status 400)
2. **PostgresError (foreign key 23503)** → 400 with Spanish error message
3. **PostgresError (unique 23505)** → 400 with `"Ya existe un registro..."` 
4. **Unknown errors** → 500 with `{ error: "Internal Server Error" }` (includes `message` in development mode)

### 6.3 HTTP Status Code Usage

| Code | Meaning | When |
|---|---|---|
| 200 | Success | GET, PUT, POST (auth actions) |
| 201 | Created | POST (resource creation), sync |
| 204 | No Content | DELETE |
| 400 | Bad Request | Validation failure, CSV missing, FK violation, unique violation |
| 401 | Unauthorized | No/invalid token, wrong credentials, expired refresh |
| 403 | Forbidden | Insufficient role, profit margin below minimum |
| 404 | Not Found | Resource not found by ID |
| 500 | Internal Error | Unexpected server failures |

### 6.4 Client-Side Strategy (Mobile)

The spec recommends this error handling approach:

```typescript
// Axios response interceptor handles 401 → refresh → retry
// Other errors pass through to the calling code

interface ApiError {
  error: string;
  details?: any;
}

// Validation errors come as 400 with:
// { error: "Validation failed", details: [{ code, message, path, ... }] }
```

---

## 7. API Endpoint Map

### 7.1 Complete Endpoint Table

| Method | Path | Roles | Body/Query | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | All | `{ email, password }` | `{ data: { accessToken, refreshToken, user } }` |
| `POST` | `/api/v1/auth/refresh` | All | `{ refreshToken }` | `{ data: { accessToken, refreshToken, user } }` |
| `POST` | `/api/v1/auth/forgot-password` | All | `{ email }` | `{ message }` |
| `POST` | `/api/v1/auth/reset-password` | All | `{ token, newPassword }` | `{ message }` |
| `POST` | `/api/v1/users` | ADMIN | `{ name, email, password, role }` | `{ data: User }` |
| `GET` | `/api/v1/users` | ADMIN | `?name=&email=&role=&page=&limit=` | `{ data: User[] }` |
| `GET` | `/api/v1/users/:id` | ADMIN | — | `{ data: User }` |
| `PUT` | `/api/v1/users/:id` | ADMIN | `{ name?, email?, role? }` | `{ data: User }` |
| `DELETE` | `/api/v1/users/:id` | ADMIN | — | 204 |
| `GET` | `/api/v1/users/pdf` | ADMIN | `?name=&role=&page=&limit=` | PDF file |
| `POST` | `/api/v1/insumos` | ADMIN | `{ codigo, nombre, unidad, costBase }` | `{ data: Insumo }` |
| `GET` | `/api/v1/insumos` | ADMIN,GERENTE,DIRECTOR | `?codigo=&nombre=&unidad=&page=&limit=` | `{ data: Insumo[] }` |
| `GET` | `/api/v1/insumos/:id` | ADMIN,GERENTE,DIRECTOR | — | `{ data: Insumo }` |
| `PUT` | `/api/v1/insumos/:id` | ADMIN | `{ nombre?, unidad?, costBase? }` | `{ data: Insumo }` |
| `DELETE` | `/api/v1/insumos/:id` | ADMIN | — | 204 |
| `POST` | `/api/v1/insumos/bulk-upload` | ADMIN | CSV file (multipart) | `{ data: { imported, skipped, errors[] } }` |
| `GET` | `/api/v1/insumos/pdf` | ADMIN,GERENTE,DIRECTOR | `?query params` | PDF file |
| `POST` | `/api/v1/apus` | ADMIN,GERENTE,DIRECTOR | `{ codigo, nombre, tipo }` | `{ data: Apu }` |
| `GET` | `/api/v1/apus` | ADMIN,GERENTE,DIRECTOR | `?codigo=&page=&limit=` | `{ data: Apu[] }` |
| `GET` | `/api/v1/apus/:id` | ADMIN,GERENTE,DIRECTOR | — | `{ data: Apu }` |
| `PUT` | `/api/v1/apus/:id` | ADMIN,GERENTE,DIRECTOR | `{ nombre?, tipo? }` | `{ data: Apu }` |
| `POST` | `/api/v1/apus/:id/insumos` | ADMIN,GERENTE,DIRECTOR | `{ insumoId, rendimiento, desperdicio? }` | `{ data: ApuInsumo }` |
| `DELETE` | `/api/v1/apus/:id/insumos/:itemId` | ADMIN,GERENTE,DIRECTOR | — | 204 |
| `GET` | `/api/v1/apus/pdf` | ADMIN,GERENTE,DIRECTOR | `?query params` | PDF file |
| `POST` | `/api/v1/cotizaciones` | ADMIN,GERENTE,DIRECTOR | `{ projectoId, codigo, clienteId?, items[] }` | `{ data: Cotizacion }` |
| `PATCH` | `/api/v1/cotizaciones/:id` | ADMIN,GERENTE,DIRECTOR | `{ estado?, items?, factors... }` | `{ data: Cotizacion }` |
| `GET` | `/api/v1/cotizaciones` | ADMIN,GERENTE,DIRECTOR | `?projecto_id=&estado=&page=&limit=` | `{ data: Cotizacion[] }` |
| `GET` | `/api/v1/cotizaciones/:id` | ADMIN,GERENTE,DIRECTOR | — | `{ data: Cotizacion }` |
| `POST` | `/api/v1/cotizaciones/:id/branch` | ADMIN,GERENTE,DIRECTOR | — | `{ data: Cotizacion }` (new version) |
| `GET` | `/api/v1/cotizaciones/:id/pdf` | ALL (incl CLIENTE) | — | PDF file |
| `GET` | `/api/v1/cotizaciones/pdf` | ADMIN,GERENTE,DIRECTOR | `?query params` | PDF file |
| `POST` | `/api/v1/proyectos` | ADMIN,GERENTE_OBRA | `{ codigo, nombre, descripcion?, estado?, clienteId? }` | `{ data: Proyecto }` |
| `GET` | `/api/v1/proyectos` | ALL | `?codigo=&nombre=&estado=&page=&limit=` | `{ data: Proyecto[] }` |
| `GET` | `/api/v1/proyectos/:id` | ALL | — | `{ data: Proyecto }` |
| `PUT` | `/api/v1/proyectos/:id` | ADMIN,GERENTE_OBRA | `{ nombre?, descripcion?, estado?, clienteId? }` | `{ data: Proyecto }` |
| `DELETE` | `/api/v1/proyectos/:id` | ADMIN,GERENTE_OBRA | — | 204 |
| `GET` | `/api/v1/proyectos/pdf` | ALL | `?query params` | PDF file |
| `GET` | `/api/v1/audit-logs` | ADMIN | `?tableName=&recordId=&userId=&page=&limit=` | `{ data: AuditLog[] }` |
| `POST` | `/api/v1/sincronizar` | ADMIN,GERENTE,DIRECTOR | Sync payload (see §5) | `{ data: { accepted, conflicts } }` |
| `GET` | `/api/v1/health` | None | — | `{ status, timestamp, checks }` |

### 7.2 Base URL

`http://localhost:8000/api/v1` (configurable in mobile `api.config.ts`)

---

## 8. Key Findings

### 8.1 Core Package Accessibility

- `@proarq/core` package.json has an `exports` map that allows deep imports:
  ```json
  "./domain/*": "./src/domain/*.ts",
  "./application/*": "./src/application/*.ts",
  "./errors": "./src/errors/index.ts"
  ```
- The main `index.ts` only exports user entity, auth input, user input, user repository, create-user use case, and errors.
- **Mobile can import Zod schemas** via `@proarq/core/application/ports/in/<module>.input` BUT only the top-level `index.ts` is re-exported. The deep imports may work because Bun handles the export map, but verify this.
- `zod` (v4.4.3) is a dependency of `@proarq/core` — the mobile app will have the same version.

### 8.2 No Standard Pagination Envelope

The backend returns raw arrays from `findAll`. The mobile app spec assumes `{ data: [], total, page, limit, totalPages }` but the backend does NOT currently return this. **Plan decision needed:** Either add pagination meta to backend, or use simpler load-more approach.

### 8.3 `{ data: ... }` Wrapper

All success responses are wrapped in `{ data: ... }`. This is consistent across all controllers. Login, forgot/reset, and sync also use this pattern (though forgot/reset use `{ message: ... }` directly).

### 8.4 Sync Requires Pre-generated UUIDs

The sync endpoint is designed for offline-first: clients generate UUIDs with `crypto.randomUUID()`, and the server uses `ON CONFLICT (id) DO NOTHING`. This means:
- **Entities must have IDs before being sent to server**
- **First write wins** — if two clients create the same ID, the second is silently ignored
- The sync handler does NOT cascade — sync each entity type separately

### 8.5 Cotizacion Update Uses PATCH, Not PUT

Cotizaciones use `PATCH /api/v1/cotizaciones/:id`, while all other entities use `PUT /api/v1/<entity>/:id`.

### 8.6 Auth Routes Are Unauthenticated

Auth endpoints (`/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`) do NOT require a JWT — no `decodeJWT` middleware on them.

### 8.7 Financial Constraints

The `validateProfitMargin` middleware enforces: when updating a cotizacion and estado is `ENVIADA`, the `profitMarginPercent` must be >= 8%. Client-side validation should mirror this.

### 8.8 Decimal Precision Patterns

| Field | Regex Pattern | Decimal Places |
|---|---|---|
| `costBase` | `/^\d+(\.\d{1,2})?$/` | Up to 2 |
| `rendimiento` | `/^\d+(\.\d{1,4})?$/` | Up to 4 |
| `desperdicio` | `/^\d+(\.\d{1,2})?$/` | Up to 2 |
| `cantidad` (cotizacion) | `/^\d+(\.\d{1,4})?$/` | Up to 4 |
| `factorAPercentage` | `/^\d+(\.\d{1,2})?$/` | Up to 2 |
| `profitMarginPercent` | `/^\d+(\.\d{1,2})?$/` | Up to 2 |

All monetary values are **strings**, not numbers, because `decimal.js` handles arbitrary precision server-side. The mobile app should use `decimal.js` as well for consistent arithmetic.

### 8.9 Token Expiry Configuration

| Variable | Default | Location |
|---|---|---|
| `JWT_SECRET` | Required (min 32 chars) | `.env` |
| `JWT_EXPIRES_IN` | `"7d"` | `.env` |
| `JWT_REFRESH_SECRET` | Hardcoded fallback | `.env` (optional override) |
| `JWT_REFRESH_EXPIRES_IN` | `"30d"` | `.env` |

### 8.10 PDF Endpoints

- Single quote PDF: `GET /api/v1/cotizaciones/:id/pdf` — requires auth, any role (CLIENTE sees redacted version)
- List PDF exports exist for insumos, apus, cotizaciones, proyectos, and users
- PDF content type: `application/pdf`
- Content-Disposition: `attachment; filename=...`

### 8.11 Middleware Pipeline Pattern

Every route uses this middleware pipeline:
```
decodeJWT  →  checkRole(...)  →  [validate(schema)]  →  controller
```

Auth routes skip `decodeJWT` and `checkRole`.  
Sync route includes `decodeJWT` but no `checkRole` (any authenticated user can sync).  
The `/insumos/bulk-upload` also includes `uploadCsvMemory` (multer) before the controller.

### 8.12 Audit Logging

Audit logs are generated server-side by use cases (injected `auditRepo`). The mobile app does NOT need to send audit data — it's automatic. The mobile can only **read** audit logs via `GET /api/v1/audit-logs` (ADMIN only).

### 8.13 Error Response Inconsistency

Most inline errors (from controllers/middleware) use `{ error: string }`, but the global error handler also includes `details` for validation errors (400) and DB constraint errors. The mobile API client should handle both shapes.

---

## Appendix: Key Import Paths for Mobile

```typescript
// === Domain Entities (for typing API responses) ===
import type { User } from '@proarq/core/domain/entities/user.entity';
import type { Insumo } from '@proarq/core/domain/entities/insumo.entity';
import type { Apu } from '@proarq/core/domain/entities/apu.entity';
import type { ApuInsumo } from '@proarq/core/domain/entities/apu-insumo.entity';
import type { Cotizacion } from '@proarq/core/domain/entities/cotizacion.entity';
import type { CotizacionItem } from '@proarq/core/domain/entities/cotizacion-item.entity';
import type { Proyecto } from '@proarq/core/domain/entities/proyecto.entity';
import type { AuditLog } from '@proarq/core/domain/entities/audit-log.entity';

// === Zod Schemas (for form validation — same rules as backend) ===
import { loginSchema } from '@proarq/core/application/ports/in/auth.input';
import { createInsumoSchema } from '@proarq/core/application/ports/in/insumo.input';
import { createApuSchema } from '@proarq/core/application/ports/in/apu.input';
import { createCotizacionSchema } from '@proarq/core/application/ports/in/cotizacion.input';
import { createProyectoSchema } from '@proarq/core/application/ports/in/proyecto.input';
import { createUserSchema } from '@proarq/core/application/ports/in/create-user.input';
import { syncPayloadSchema } from '@proarq/core/application/ports/in/sync.input';

// === Error Classes ===
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '@proarq/core/errors';

// === Types from Core (from index.ts) ===
import type { LoginInput, RefreshInput } from '@proarq/core/application/ports/in/auth.input';
import type { CreateUserInput } from '@proarq/core/application/ports/in/create-user.input';
```

---

**RESEARCH_COMPLETE: ProArq Mobile Patterns**
