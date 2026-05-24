# Swagger API Documentation + Postman Collection — Execution Plan

**Status:** DRAFT — Awaiting User Approval  
**Spec Source:** `.opencode/plans/swagger-postman.spec.md`  
**Target Service:** `apps/api/`  
**Plan Version:** 1.0  
**Date:** 2026-05-24

---

## 1. Overview

### Summary
Add interactive Swagger UI documentation (OpenAPI 3.0.3) served at the root path (`GET /`) and a companion Postman Collection v2.1 to the ProArq Express API. The documentation covers all 28 API endpoints with full request/response schemas, JWT Bearer auth via the "Authorize" button, and role-based access annotations. The Postman collection is a static JSON file at `apps/api/documentacion/postman.json` with environment templates for local, staging, and production.

### Architecture Impact
- **No changes** to existing controllers, use cases, repositories, or database schemas.
- **No changes** to existing route handlers or middleware.
- **One new file** for the OpenAPI spec + Swagger UI setup (`swagger.config.ts`).
- **One new file** for the Postman collection (`postman.json`).
- **One modified file** for route mounting (`routes/index.ts`).
- **One modified file** for env config (`env.ts`).
- **One modified file** for `.env.example`.
- **One new test file** (`swagger.test.ts`).

### 4 Implementation Phases

| Phase | Description | Files |
|-------|-------------|-------|
| **1** | Dependencies & Configuration | `package.json`, `env.ts`, `.env.example` |
| **2** | OpenAPI Spec Definition | `swagger.config.ts` (NEW) |
| **3** | Route Integration | `routes/index.ts` |
| **4** | Postman Collection | `postman.json` (NEW) |
| **5** | Tests (TDD) | `swagger.test.ts` (NEW) |

---

## 2. Detailed Phase Breakdown

### Phase 1: Dependencies & Configuration

#### 1.1 Install Dependencies

```bash
cd apps/api
bun add swagger-ui-express@^5.0.1
bun add -d openapi-types@^13.0.0
```

**Why these packages:**
- `swagger-ui-express` — Serves Swagger UI HTML from Express. CJS module, but Bun handles CJS imports transparently.
- `openapi-types` — TypeScript types (`OpenAPIObject`, `PathItemObject`, etc.) for type-safe spec construction.

**Risk:** `swagger-ui-express` is a CJS package. Bun supports CJS imports natively, so no ESM/CJS interop issues expected. If issues arise, fallback to serving `swagger-ui-dist` static files directly.

#### 1.2 Update `env.ts` — Add `SWAGGER_ENABLED`

**File:** `apps/api/src/infra/config/env.ts`

**Change:** Add to the `envSchema` object (after `LOGO_URL`):

```typescript
SWAGGER_ENABLED: z
  .preprocess((v) => v === 'true' || v === '1', z.boolean())
  .default(true),
```

**Rationale:** Uses `z.preprocess` to handle both `"true"` and `"1"` string values from env files. Defaults to `true` so Swagger is enabled out of the box in development.

#### 1.3 Update `.env.example`

**File:** `.env.example` (project root)

**Change:** Add after `LOGO_URL`:

```
SWAGGER_ENABLED=true    # Set to false to disable Swagger UI in production
```

---

### Phase 2: OpenAPI Spec Definition

#### 2.1 Create `swagger.config.ts`

**File:** `apps/api/src/infra/adapters/driving/swagger/swagger.config.ts` (NEW)

This is the **largest single file** in the implementation (~500-700 lines). It exports:

```typescript
export const swaggerSpec: OpenAPIObject;
export const swaggerUiOptions: SwaggerUiOptions;
export const swaggerServe: ReturnType<typeof swaggerUiExpress.serve>;
export const swaggerSetup: ReturnType<typeof swaggerUiExpress.setup>;
```

##### 2.1.1 OpenAPI Info & Servers

```typescript
const spec: OpenAPIObject = {
  openapi: '3.0.3',
  info: {
    title: 'ProArq API',
    version: '0.0.1',
    description: 'API de gestión de presupuestos de obra — ProArq\n\n## Autenticación\nTodas las rutas protegidas requieren un token JWT en el header `Authorization: Bearer <token>`.',
  },
  servers: [
    { url: 'http://localhost:8000', description: 'Local Development' },
  ],
  // ...
};
```

##### 2.1.2 Security Scheme

```typescript
components: {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token. Example: `valid-admin-jwt-token`',
    },
  },
  // ...
}
```

##### 2.1.3 Reusable Schemas (8 entities)

| Schema Name | Description | Key Fields |
|---|---|---|
| `User` | User object | id, name, email, role, createdAt, updatedAt |
| `UserResponse` | Wrapped user response | data: User |
| `Insumo` | Supply item | id, codigo, nombre, unidad (enum), costBase, createdAt, updatedAt |
| `InsumoResponse` | Wrapped insumo response | data: Insumo |
| `Apu` | APU (Análisis de Precio Unitario) | id, codigo, nombre, tipo, createdAt, updatedAt |
| `ApuInsumo` | APU-insumo relationship | id, apuId, insumoId, rendimiento, desperdicio |
| `ApuDetailResponse` | APU with nested insumos | data: Apu & { insumos: ApuInsumo[] } |
| `Cotizacion` | Quotation | id, codigo, projectoId, clienteId, estado (enum), items, totals |
| `CotizacionItem` | Quotation line item | id, apuId, cantidad, calculatedCostDirect |
| `CotizacionDetailResponse` | Cotizacion with items | data: Cotizacion & { items: CotizacionItem[] } |
| `AuditLog` | Audit log entry | id, tableName, recordId, userId, action, oldValues, newValues, timestamp |
| `ErrorResponse` | Generic error | error: string |
| `ValidationErrorDetail` | Validation error detail | message: string, path: string[] |
| `ValidationErrorResponse` | Validation error | error: string, details: ValidationErrorDetail[] |
| `SyncPayload` | Sync request body | insumos[], apus[], cotizaciones[], apuInsumos[], cotizacionItems[] |
| `SyncResponse` | Sync result | data: { accepted: number, conflicts: number } |
| `HealthResponse` | Health check | status, timestamp, checks |

##### 2.1.4 Reusable Responses (5)

| Response Name | HTTP Code | Schema |
|---|---|---|
| `ValidationError` | 400 | `$ref: ValidationErrorResponse` |
| `Unauthorized` | 401 | `$ref: ErrorResponse` |
| `Forbidden` | 403 | `$ref: ErrorResponse` |
| `NotFound` | 404 | `$ref: ErrorResponse` |
| `InternalError` | 500 | `$ref: ErrorResponse` |

##### 2.1.5 Path Definitions (28 endpoints)

Each path operation includes:
- `tags` — Logical grouping
- `summary` — Human-readable description
- `operationId` — Unique camelCase identifier
- `parameters` — Path + query params
- `requestBody` — For POST/PUT/PATCH
- `responses` — Success + error responses
- `security` — `[{ bearerAuth: [] }]` or empty `[]`
- `x-roles` — Custom extension listing allowed roles

**Complete endpoint list:**

| # | Method | Path | Tag | Auth | Roles | OperationId |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/v1/health` | Health | ❌ | All | `healthCheck` |
| 2 | POST | `/api/v1/auth/login` | Auth | ❌ | All | `login` |
| 3 | POST | `/api/v1/auth/forgot-password` | Auth | ❌ | All | `forgotPassword` |
| 4 | POST | `/api/v1/auth/reset-password` | Auth | ❌ | All | `resetPassword` |
| 5 | POST | `/api/v1/users` | Users | ✅ | ADMIN | `createUser` |
| 6 | GET | `/api/v1/users` | Users | ✅ | ADMIN | `listUsers` |
| 7 | GET | `/api/v1/users/:id` | Users | ✅ | ADMIN | `getUser` |
| 8 | PUT | `/api/v1/users/:id` | Users | ✅ | ADMIN | `updateUser` |
| 9 | DELETE | `/api/v1/users/:id` | Users | ✅ | ADMIN | `deleteUser` |
| 10 | POST | `/api/v1/insumos` | Insumos | ✅ | ADMIN | `createInsumo` |
| 11 | GET | `/api/v1/insumos` | Insumos | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `listInsumos` |
| 12 | GET | `/api/v1/insumos/:id` | Insumos | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `getInsumo` |
| 13 | PUT | `/api/v1/insumos/:id` | Insumos | ✅ | ADMIN | `updateInsumo` |
| 14 | DELETE | `/api/v1/insumos/:id` | Insumos | ✅ | ADMIN | `deleteInsumo` |
| 15 | POST | `/api/v1/insumos/bulk-upload` | Insumos | ✅ | ADMIN | `bulkUploadInsumos` |
| 16 | POST | `/api/v1/apus` | APUs | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `createApu` |
| 17 | GET | `/api/v1/apus` | APUs | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `listApus` |
| 18 | GET | `/api/v1/apus/:id` | APUs | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `getApu` |
| 19 | PUT | `/api/v1/apus/:id` | APUs | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `updateApu` |
| 20 | POST | `/api/v1/apus/:id/insumos` | APUs | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `addApuInsumo` |
| 21 | DELETE | `/api/v1/apus/:id/insumos/:itemId` | APUs | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `removeApuInsumo` |
| 22 | POST | `/api/v1/cotizaciones` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `createCotizacion` |
| 23 | GET | `/api/v1/cotizaciones` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `listCotizaciones` |
| 24 | GET | `/api/v1/cotizaciones/:id` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `getCotizacion` |
| 25 | PATCH | `/api/v1/cotizaciones/:id` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `updateCotizacion` |
| 26 | DELETE | `/api/v1/cotizaciones/:id` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `deleteCotizacion` |
| 27 | POST | `/api/v1/cotizaciones/:id/branch` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `branchCotizacion` |
| 28 | GET | `/api/v1/cotizaciones/:id/pdf` | Cotizaciones | ✅ | ALL (redacted) | `getCotizacionPdf` |
| 29 | PATCH | `/api/v1/cotizaciones/:id/estado` | Cotizaciones | ✅ | ADMIN,GERENTE_OBRA,DIRECTOR_OBRA | `updateCotizacionEstado` |
| 30 | GET | `/api/v1/audit-logs` | Audit Logs | ✅ | ADMIN | `listAuditLogs` |
| 31 | POST | `/api/v1/sincronizar` | Sync | ✅ | All authenticated | `syncData` |

> **Note:** Endpoints #26 (DELETE cotizacion) and #29 (PATCH estado) are specified in the spec but **not yet implemented** in the route files. They will be documented in the OpenAPI spec regardless, so the spec is forward-compatible. If they don't exist at runtime, Swagger UI will still show them — this is acceptable as documentation of the intended API surface.

##### 2.1.6 Swagger UI Options

```typescript
const swaggerUiOptions: swaggerUiExpress.SwaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ProArq API Documentation',
};
```

##### 2.1.7 Exports

```typescript
import swaggerUiExpress from 'swagger-ui-express';

export const swaggerSpec = spec as OpenAPIObject;
export const swaggerUiOptions = swaggerUiOptions;
export const swaggerServe = swaggerUiExpress.serve;
export const swaggerSetup = swaggerUiExpress.setup(swaggerSpec, swaggerUiOptions);
```

---

### Phase 3: Route Integration

#### 3.1 Modify `routes/index.ts`

**File:** `apps/api/src/infra/adapters/driving/routes/index.ts`

**Changes:**
1. Add imports for `swaggerServe`, `swaggerSetup`, `swaggerSpec`, and `env`
2. Add conditional Swagger UI mounting at root `/` before the `/api/v1` mount
3. Add `/api/v1/docs.json` endpoint for raw spec access

**New file content:**

```typescript
import { Router } from 'express';
import { router as healthRouter } from './health.routes';
import { router as userRouter } from './user.routes';
import { router as authRouter } from './auth.routes';
import { router as insumoRouter } from './insumo.routes';
import { router as apuRouter } from './apu.routes';
import { router as cotizacionRouter } from './cotizacion.routes';
import { router as auditRouter } from './audit.routes';
import { router as syncRouter } from './sync.routes';
import { env } from '../../../config/env';
import { swaggerServe, swaggerSetup, swaggerSpec } from '../swagger/swagger.config';

const router = Router();
const api = Router();

// Swagger UI on root path (conditionally mounted)
if (env.SWAGGER_ENABLED) {
  router.use('/', swaggerServe, swaggerSetup);
  router.get('/api/v1/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
}

api.use('/health', healthRouter);
api.use('/auth', authRouter);
api.use('/users', userRouter);
api.use('/insumos', insumoRouter);
api.use('/apus', apuRouter);
api.use('/cotizaciones', cotizacionRouter);
api.use('/audit-logs', auditRouter);
api.use('/sincronizar', syncRouter);

router.use('/api/v1', api);

export { router };
```

**Important:** The Swagger UI is mounted at `/` BEFORE `/api/v1` to avoid route conflicts. Express 5 matches routes in order, so `/` will only match if no other route matches first — but since Swagger UI uses `router.use('/', ...)` with its own internal routing, it must come first to catch the root path.

**Edge case:** If `SWAGGER_ENABLED=false`, the Swagger UI and docs.json routes are not registered at all, so `GET /` will return 404 (no route matches) and `GET /api/v1/docs.json` will also 404.

---

### Phase 4: Postman Collection

#### 4.1 Create `postman.json`

**File:** `apps/api/documentacion/postman.json` (NEW)

**Format:** Postman Collection v2.1

**Structure:**
```json
{
  "info": {
    "name": "ProArq API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "description": "API de gestión de presupuestos de obra — ProArq"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:8000", "type": "string" },
    { "key": "token", "value": "", "type": "string" }
  ],
  "item": [
    // Folders for each tag
  ]
}
```

**Folder Organization (8 folders):**

| Folder | Items | Auth |
|--------|-------|------|
| Health | 1 (GET health) | ❌ |
| Auth | 3 (login, forgot-password, reset-password) | ❌ |
| Users | 5 (CRUD) | ✅ Bearer {{token}} |
| Insumos | 6 (CRUD + bulk-upload) | ✅ Bearer {{token}} |
| APUs | 6 (CRUD + add/remove insumos) | ✅ Bearer {{token}} |
| Cotizaciones | 7 (CRUD + branch + pdf + estado) | ✅ Bearer {{token}} |
| Audit Logs | 1 (list) | ✅ Bearer {{token}} |
| Sync | 1 (sync) | ✅ Bearer {{token}} |

**Each request item includes:**
- `name` — Human-readable name (e.g., "Create Insumo")
- `request.method` — GET/POST/PUT/PATCH/DELETE
- `request.header` — `Authorization: Bearer {{token}}` (for protected), `Content-Type: application/json`
- `request.body` — For POST/PUT/PATCH with example JSON
- `request.url` — Using `{{base_url}}` variable with structured path
- `response` — Empty array (no example responses)

**Environment Templates (included as separate entries):**

```json
{
  "name": "ProArq API — Local",
  "values": [
    { "key": "base_url", "value": "http://localhost:8000", "type": "default" },
    { "key": "token", "value": "", "type": "default" }
  ]
}
```

Three environment templates:
1. **Local** — `http://localhost:8000`
2. **Staging** — `https://api-staging.proarq.com` (placeholder)
3. **Production** — `https://api.proarq.com` (placeholder)

---

### Phase 5: Tests (TDD)

#### 5.1 Create `swagger.test.ts`

**File:** `apps/api/src/__test__/swagger.test.ts` (NEW)

**Test 1: Swagger UI renders HTML at root**
```typescript
import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../app';

describe('Swagger Documentation', () => {
  test('GET / should return Swagger UI HTML', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
    expect(res.text).toContain('SwaggerUIBundle');
  });
});
```

**Test 2: Raw OpenAPI spec is valid**
```typescript
  test('GET /api/v1/docs.json should return valid OpenAPI spec', async () => {
    const res = await request(app).get('/api/v1/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info).toBeDefined();
    expect(res.body.info.title).toBe('ProArq API');
    expect(res.body.paths).toBeDefined();
    // Verify key endpoints exist
    expect(res.body.paths['/api/v1/health']).toBeDefined();
    expect(res.body.paths['/api/v1/auth/login']).toBeDefined();
    expect(res.body.paths['/api/v1/users']).toBeDefined();
    expect(res.body.paths['/api/v1/insumos']).toBeDefined();
    expect(res.body.paths['/api/v1/apus']).toBeDefined();
    expect(res.body.paths['/api/v1/cotizaciones']).toBeDefined();
    expect(res.body.paths['/api/v1/audit-logs']).toBeDefined();
    expect(res.body.paths['/api/v1/sincronizar']).toBeDefined();
    // Verify security scheme
    expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
  });
```

**Test 3: SWAGGER_ENABLED=false hides docs**
```typescript
  test('GET / should return 404 when SWAGGER_ENABLED=false', async () => {
    // Save original env
    const original = process.env.SWAGGER_ENABLED;
    process.env.SWAGGER_ENABLED = 'false';
    
    // Re-import to pick up new env (dynamic import to avoid module caching issues)
    // Note: This test may need special handling — see risk assessment below
    const { app: appWithoutSwagger } = await import('../app');
    const res = await request(appWithoutSwagger).get('/');
    expect(res.status).toBe(404);
    
    // Restore
    process.env.SWAGGER_ENABLED = original;
  });
```

**Risk with Test 3:** Bun's module system caches imports. Setting `process.env.SWAGGER_ENABLED` after the app is already created won't affect the already-initialized `env` object. Two approaches:

**Approach A (Recommended):** Create a test helper that creates a fresh app instance with a specific env. This requires refactoring `app.ts` to accept env overrides, or using `bun:test`'s `beforeAll`/`afterAll` with module reloading.

**Approach B (Simpler):** Test the conditional logic indirectly by verifying that when `SWAGGER_ENABLED` is false, the routes are not registered. This can be done by checking that `GET /` returns 404 using a separate app factory.

**Recommendation:** Use Approach A — refactor `app.ts` minimally to accept an optional env override:

```typescript
// app.ts
export function createApp(envOverrides?: Partial<typeof env>) {
  const app = express();
  // ... existing setup ...
  return app;
}
export const app = createApp();
```

Then in the test:
```typescript
test('GET / returns 404 when SWAGGER_ENABLED=false', async () => {
  const appWithoutSwagger = createApp({ SWAGGER_ENABLED: false });
  const res = await request(appWithoutSwagger).get('/');
  expect(res.status).toBe(404);
});
```

---

## 3. File Sequence (Creation/Modification Order)

| Order | Action | File | Description |
|-------|--------|------|-------------|
| 1 | MODIFY | `apps/api/package.json` | Add `swagger-ui-express` to dependencies, `openapi-types` to devDependencies |
| 2 | MODIFY | `apps/api/src/infra/config/env.ts` | Add `SWAGGER_ENABLED` env var with zod validation |
| 3 | MODIFY | `.env.example` | Add `SWAGGER_ENABLED=true` comment |
| 4 | CREATE | `apps/api/src/infra/adapters/driving/swagger/swagger.config.ts` | Full OpenAPI 3.0.3 spec + Swagger UI setup |
| 5 | MODIFY | `apps/api/src/infra/adapters/driving/routes/index.ts` | Add conditional Swagger UI mount at `/` and `/api/v1/docs.json` |
| 6 | CREATE | `apps/api/documentacion/postman.json` | Postman Collection v2.1 with all endpoints |
| 7 | CREATE | `apps/api/src/__test__/swagger.test.ts` | 3 integration tests for Swagger UI |

---

## 4. Risk Assessment

### Risk 1: Bun Compatibility with `swagger-ui-express` (CJS Module)

| Factor | Assessment |
|--------|------------|
| **Severity** | Medium |
| **Likelihood** | Low |
| **Mitigation** | Bun handles CJS imports transparently. The package is widely used with Bun. If issues arise, fall back to serving `swagger-ui-dist` static files directly via `express.static`. |

### Risk 2: Express 5 Route Matching

| Factor | Assessment |
|--------|------------|
| **Severity** | Medium |
| **Likelihood** | Low |
| **Mitigation** | Express 5 uses path-to-regexp v8 which has stricter matching. The root path `/` is mounted before `/api/v1` to avoid conflicts. Test 1 will verify this works. |

### Risk 3: Large OpenAPI Spec File (~600 lines)

| Factor | Assessment |
|--------|------------|
| **Severity** | Low |
| **Likelihood** | High |
| **Mitigation** | The file is large but well-organized with clear sections (schemas, responses, paths). Use `openapi-types` for type safety. Consider splitting into multiple files if maintainability becomes an issue in the future. |

### Risk 4: Test 3 — Module Caching with Env Override

| Factor | Assessment |
|--------|------------|
| **Severity** | High |
| **Likelihood** | Medium |
| **Mitigation** | Refactor `app.ts` to export a `createApp()` factory function. This is a minimal change that enables clean testing of different env configurations. See Phase 5 for details. |

### Risk 5: Spec-Only Endpoints Not Yet Implemented

| Factor | Assessment |
|--------|------------|
| **Severity** | Low |
| **Likelihood** | Certain |
| **Mitigation** | DELETE cotizacion and PATCH estado endpoints are documented in the spec but not yet implemented in routes. The OpenAPI spec will include them for forward compatibility. Swagger UI will show them even though they return 404 at runtime. This is acceptable documentation behavior. |

---

## 5. Verification Steps

### 5.1 Automated Tests

```bash
cd apps/api

# Run only the new Swagger tests
bun test src/__test__/swagger.test.ts

# Run the full test suite (must pass all ~142 existing tests + 3 new = ~145 total)
bun run test
```

**Expected results:**
- Test 1: `GET /` returns 200 with Swagger UI HTML containing `swagger-ui` and `SwaggerUIBundle`
- Test 2: `GET /api/v1/docs.json` returns valid OpenAPI 3.0.3 JSON with all paths and security scheme
- Test 3: `GET /` returns 404 when `SWAGGER_ENABLED=false`
- All existing tests: ✅ Pass without modification

### 5.2 Manual Verification

1. **Start the server:**
   ```bash
   cd apps/api && bun --env-file=../../.env dev
   ```

2. **Verify Swagger UI:**
   - Open `http://localhost:8000/` in browser
   - ✅ Swagger UI renders with title "ProArq API Documentation"
   - ✅ Top bar is hidden (custom CSS)
   - ✅ "Authorize" button is visible in top-right
   - ✅ All 8 tags appear: Health, Auth, Users, Insumos, APUs, Cotizaciones, Audit Logs, Sync
   - ✅ All endpoints listed with correct methods and paths

3. **Verify Authorize flow:**
   - Click "Authorize"
   - Enter `valid-admin-jwt-token` (test token)
   - Click "Authorize"
   - ✅ Lock icons appear on protected endpoints
   - ✅ Can execute requests from Swagger UI

4. **Verify raw spec:**
   - Open `http://localhost:8000/api/v1/docs.json`
   - ✅ Returns valid JSON
   - ✅ Contains `openapi: "3.0.3"`
   - ✅ Contains all paths

5. **Verify disable:**
   - Set `SWAGGER_ENABLED=false` in `.env`
   - Restart server
   - ✅ `http://localhost:8000/` returns 404
   - ✅ `http://localhost:8000/api/v1/docs.json` returns 404

6. **Verify Postman collection:**
   - Open Postman → Import → Select `apps/api/documentacion/postman.json`
   - ✅ Imports without errors
   - ✅ All 8 folders present
   - ✅ All endpoints present with correct methods
   - ✅ Variables `base_url` and `token` are defined
   - ✅ Protected endpoints have `Authorization: Bearer {{token}}` header
   - ✅ Example bodies present for POST/PUT/PATCH

### 5.3 Security Verification

- ✅ Swagger UI is served from same origin (no CORS exposure beyond existing config)
- ✅ No JWT secrets, DB URLs, or server-side secrets in the OpenAPI spec
- ✅ No real passwords or tokens in the Postman collection
- ✅ `SWAGGER_ENABLED` env var allows disabling in production
- ✅ JWT token in Swagger UI is stored client-side in browser localStorage

---

## 6. Appendix: Key Design Decisions

### 6.1 Why Manual OpenAPI Spec (Option A)?

| Option | Pros | Cons |
|--------|------|------|
| **A: Manual spec** (chosen) | Centralized, reviewable, respects Clean Architecture, no JSDoc pollution | Large file, manual updates needed |
| B: JSDoc annotations | Auto-generated from code | Pollutes controllers with comments, couples docs to implementation |
| C: Runtime reflection | Always in sync | Complex, fragile, requires decorators |

### 6.2 Why `swagger-ui-express` over `swagger-ui-dist`?

`swagger-ui-express` provides a ready-to-use middleware that handles serving the UI bundle, injecting the spec, and applying custom CSS. `swagger-ui-dist` would require manual HTML template creation and static file serving.

### 6.3 Why Postman Collection as Static JSON?

A static JSON file is version-controllable, reviewable in PRs, and doesn't require any runtime generation. The tradeoff is manual updates when routes change — but this is acceptable for v1 and can be automated later with a codegen script.

---

**PLAN_LOCKED: swagger-postman-plan.md — Waiting for User Approval**
