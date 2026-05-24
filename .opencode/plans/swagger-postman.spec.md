# Documentación Swagger + Postman Collection para @proarq/api

## Feature Overview

**Why:** The ProArq API currently lacks interactive API documentation. Developers must read source code or rely on Postman collections shared manually (which get stale). Adding Swagger UI provides living documentation that is always in sync with the running server. A companion Postman collection enables offline testing, team sharing, and integration with CI/CD pipelines.

**What:** Two deliverables:
1. **Swagger UI** served directly from the Express API at the root path (`GET /`), with full OpenAPI 3.0.3 specification coverage of all API endpoints, including request/response schemas, query parameters, path parameters, and JWT Bearer auth via the "Authorize" button.
2. **Postman Collection v2.1** exported as a static JSON file at `apps/api/documentacion/postman.json`, importable into Postman with all endpoints pre-configured with headers, example bodies, auth variables, and environment templates.

---

## User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | Developer onboarding the API | Browse all endpoints with their schemas from the browser | I can understand the API without reading source code |
| US-02 | Frontend developer | Test API endpoints from Swagger UI with my JWT token | I can prototype integrations without Postman |
| US-03 | QA engineer | Import a Postman collection with all endpoints and example payloads | I can run manual and automated API tests |
| US-04 | Backend developer | Re-generate the Postman collection when routes change | The exported documentation stays in sync with the code |
| US-05 | DevOps / Security | Disable Swagger UI in production via environment variable | The API surface is not unnecessarily exposed |
| US-06 | Tech lead | See the exact role-based access for each endpoint in the docs | Permissions are transparent and auditable |

---

## Functional Requirements

### FR-01: Swagger UI Endpoint
- The Swagger UI MUST be served at `GET /` (root path, e.g., `http://localhost:8000/`).
- The raw OpenAPI JSON spec MUST be accessible at `GET /api/v1/docs.json`.
- The UI MUST display ALL endpoints organized by tags: `Health`, `Auth`, `Users`, `Insumos`, `APUs`, `Cotizaciones`, `Audit Logs`, `Sync`.
- The UI MUST include an "Authorize" button configured for JWT Bearer token (`Authorization: Bearer <token>`).
- A custom CSS MUST hide the Swagger top bar (`display: none`) for a clean look.
- The Swagger UI MUST be disableable via `SWAGGER_ENABLED=false` environment variable.

### FR-02: Endpoint Documentation Coverage
Every endpoint MUST include:
- **Summary** — Human-readable description of the operation.
- **Operation ID** — Unique identifier (e.g., `createUser`, `listInsumos`).
- **Tags** — Logical grouping tag.
- **Path parameters** — For `:id`, `:itemId`, etc.
- **Query parameters** — For pagination (`page`, `limit`) and filters (`codigo`, `nombre`, `estado`, etc.).
- **Request body** — JSON schema.
- **Response schemas** — Success (200/201/204) and error (400/401/403/404/500) responses.
- **Security** — Which endpoints require JWT and which roles are allowed.

### FR-03: All Endpoints to Document

#### Health
| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/health` | ❌ | All |
- Response 200: `{ status: "ok"|"degraded", timestamp: string, checks: { server: string, database: string } }`

#### Auth
| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/auth/login` | ❌ | All |
| POST | `/api/v1/auth/forgot-password` | ❌ | All |
| POST | `/api/v1/auth/reset-password` | ❌ | All |

**POST /auth/login**
- Body: `{ email: string, password: string }`
- Response 200: `{ data: { token: string, user: { id: string, name: string, email: string, role: string } } }`

**POST /auth/forgot-password**
- Body: `{ email: string }`
- Response 200: `{ message: string }`

**POST /auth/reset-password**
- Body: `{ token: string, newPassword: string }`
- Response 200: `{ message: string }`

#### Users
| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/users` | ✅ Bearer | ADMIN |
| GET | `/api/v1/users` | ✅ Bearer | ADMIN |
| GET | `/api/v1/users/:id` | ✅ Bearer | ADMIN |
| PUT | `/api/v1/users/:id` | ✅ Bearer | ADMIN |
| DELETE | `/api/v1/users/:id` | ✅ Bearer | ADMIN |

**POST /users**
- Body: `{ name: string, email: string, password: string, role?: "ADMIN"|"GERENTE_OBRA"|"DIRECTOR_OBRA"|"CLIENTE"|"REPRESENTANTE" }`
- Response 201: `{ data: { id: string, name: string, email: string, role: string, createdAt: string } }`

**GET /users**
- Query: `name?`, `email?`, `role?`, `page?` (default 1), `limit?` (default 10, max 100)
- Response 200: `{ data: Array<User> }`

**GET /users/:id**
- Response 200: `{ data: User }` | Response 404: `{ error: string }`

**PUT /users/:id**
- Body: `{ name?: string, email?: string, role?: enum }`
- Response 200: `{ data: User }`

**DELETE /users/:id**
- Response 204: (no body)

#### Insumos
| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/insumos` | ✅ Bearer | ADMIN |
| GET | `/api/v1/insumos` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/insumos/:id` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PUT | `/api/v1/insumos/:id` | ✅ Bearer | ADMIN |
| DELETE | `/api/v1/insumos/:id` | ✅ Bearer | ADMIN |
| POST | `/api/v1/insumos/bulk-upload` | ✅ Bearer | ADMIN |

**POST /insumos**
- Body: `{ codigo: string, nombre: string, unidad: "M3"|"KG"|"UND"|"GL", costBase: string }`
- Response 201: `{ data: Insumo }`

**GET /insumos**
- Query: `codigo?`, `nombre?`, `unidad?`, `page?`, `limit?`
- Response 200: `{ data: Array<Insumo> }`

**GET /insumos/:id**
- Response 200: `{ data: Insumo }`

**PUT /insumos/:id**
- Body: `{ nombre?: string, unidad?: enum, costBase?: string }`
- Response 200: `{ data: Insumo }`

**DELETE /insumos/:id**
- Response 204: (no body)

**POST /insumos/bulk-upload**
- Body: `multipart/form-data` with CSV file field
- Response 201: `{ data: { imported: number, skipped: number, errors: Array<{ row: number, errors: string[] }> } }`

#### APUs
| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/apus` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/apus` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/apus/:id` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PUT | `/api/v1/apus/:id` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| POST | `/api/v1/apus/:id/insumos` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| DELETE | `/api/v1/apus/:id/insumos/:itemId` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |

**POST /apus**
- Body: `{ codigo: string, nombre: string, tipo: string }`
- Response 201: `{ data: Apu }`

**GET /apus**
- Query: `codigo?`, `page?`, `limit?`
- Response 200: `{ data: Array<Apu> }`

**GET /apus/:id**
- Response 200: `{ data: Apu & { insumos: Array<ApuInsumo> } }`

**PUT /apus/:id**
- Body: `{ nombre?: string, tipo?: string }`
- Response 200: `{ data: Apu }`

**POST /apus/:id/insumos**
- Body: `{ insumoId: string, rendimiento: string, desperdicio?: string }`
- Response 201: `{ data: ApuInsumo }`

**DELETE /apus/:id/insumos/:itemId**
- Response 204: (no body)

#### Cotizaciones
| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/cotizaciones` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/cotizaciones` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/cotizaciones/:id` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| PATCH | `/api/v1/cotizaciones/:id` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| DELETE | `/api/v1/cotizaciones/:id` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| POST | `/api/v1/cotizaciones/:id/branch` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |
| GET | `/api/v1/cotizaciones/:id/pdf` | ✅ Bearer | ALL (redacted for CLIENTE/REPRESENTANTE) |
| PATCH | `/api/v1/cotizaciones/:id/estado` | ✅ Bearer | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA |

**POST /cotizaciones**
- Body: `{ projectoId: string, codigo: string, clienteId?: string, items?: Array<{ apuId: string, cantidad: string }> }`
- Response 201: `{ data: Cotizacion }`

**GET /cotizaciones**
- Query: `projecto_id?`, `estado?`, `page?`, `limit?`
- Response 200: `{ data: Array<Cotizacion> }`

**GET /cotizaciones/:id**
- Response 200: `{ data: Cotizacion & { items: Array<CotizacionItem> } }`

**PATCH /cotizaciones/:id**
- Body: `{ estado?: enum, clienteId?: string|null, items?: Array<ItemInput>, factorAPercentage?: string, factorBPercentage?: string, profitMarginPercent?: string }`
- Response 200: `{ data: Cotizacion }`

**DELETE /cotizaciones/:id**
- Response 204: (no body)

**POST /cotizaciones/:id/branch**
- Response 201: `{ data: Cotizacion }`

**GET /cotizaciones/:id/pdf**
- Response 200: `application/pdf` binary stream

**PATCH /cotizaciones/:id/estado**
- Body: `{ estado: "ENVIADA"|"APROBADA" }`
- Response 200: `{ data: Cotizacion }`

#### Audit Logs
| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | ✅ Bearer | ADMIN |

**GET /audit-logs**
- Query: `tableName?`, `recordId?`, `userId?`, `page?`, `limit?`
- Response 200: `{ data: Array<AuditLog> }`

#### Sync
| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/sincronizar` | ✅ Bearer | All authenticated |

**POST /sincronizar**
- Body: Complex sync payload (insumos, apus, cotizaciones, apuInsumos, cotizacionItems arrays)
- Response 200: `{ data: { accepted: number, conflicts: number } }`

### FR-04: Common Error Responses
All endpoints MUST document these error responses:
- **400 Bad Request** — `{ error: string, details?: Array<{ message: string, path: string[] }> }` (validation errors)
- **401 Unauthorized** — `{ error: "No token provided" }` or `{ error: "Invalid token" }`
- **403 Forbidden** — `{ error: "Forbidden: insufficient role" }`
- **404 Not Found** — `{ error: string }`
- **500 Internal Server Error** — `{ error: "Internal Server Error" }` (no stack trace in production)

### FR-05: Postman Collection
- File MUST be at `apps/api/documentacion/postman.json`.
- Format: **Postman Collection v2.1** (`info.schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"`).
- MUST include ALL endpoints with correct HTTP methods and full paths.
- MUST include a `variables` section with:
  - `base_url` — default `http://localhost:8000`
  - `token` — empty string placeholder
- MUST include environment templates for: **local** (`localhost:8000`), **staging**, **production**.
- MUST include an `Authorization` header on all protected endpoints using `{{token}}` variable: `Authorization: Bearer {{token}}`.
- MUST include example request bodies (JSON) for POST/PUT/PATCH endpoints with representative data.
- MUST include example query parameters for GET endpoints with pagination.
- MUST be organized in folders matching the tags: Health, Auth, Users, Insumos, APUs, Cotizaciones, Audit Logs, Sync.
- MUST NOT contain any real sensitive data, passwords, tokens, or production URLs.

---

## Technical Constraints

### TC-01: Package Selection
Use these npm packages (compatible with Bun + Express 5):

| Package | Version | Purpose |
|---|---|---|
| `swagger-ui-express` | `^5.0.1` | Serves Swagger UI HTML from Express |
| `openapi-types` | `^13.0.0` (dev) | TypeScript types for OpenAPI 3.0 |

**Decision:** Manual OpenAPI specification (Option A) — write the complete OpenAPI 3.0.3 spec as a TypeScript file using `openapi-types` for type safety. This approach:
- Keeps documentation centralized and reviewable.
- Avoids polluting route/controller files with JSDoc comments (respects Clean Architecture).
- Is easier to maintain when routes change (single file to update).

### TC-02: OpenAPI Version
Use **OpenAPI 3.0.3**.

### TC-03: File Structure
New files to create:

```
apps/api/
├── src/
│   ├── infra/
│   │   ├── config/
│   │   │   └── env.ts                          # ← ADD: SWAGGER_ENABLED env var
│   │   └── adapters/
│   │       └── driving/
│   │           ├── swagger/
│   │           │   └── swagger.config.ts       # ← NEW: OpenAPI spec + swagger-ui setup
│   │           └── routes/
│   │               └── index.ts                # ← MODIFY: add swagger route at /
├── documentacion/
│   └── postman.json                            # ← NEW: Postman collection v2.1
```

### TC-04: Swagger Config File (`swagger.config.ts`)
Must export:
- `swaggerSpec` — the OpenAPI 3.0.3 document object (JSON-compatible).
- `swaggerUiOptions` — Swagger UI options (explorer: true, custom CSS).
- `swaggerServe` and `swaggerSetup` — Express middleware from `swagger-ui-express`.

### TC-05: Route Integration
In `routes/index.ts`:
```typescript
import { swaggerServe, swaggerSetup } from '../swagger/swagger.config';

// Swagger UI on root path (conditionally mounted)
if (env.SWAGGER_ENABLED) {
  router.use('/', swaggerServe, swaggerSetup);
  router.get('/api/v1/docs.json', (_req, res) => res.json(swaggerSpec));
}
```

This mounts the UI at `/` (e.g., `http://localhost:8000/`).

### TC-06: Environment Variables
Add to `env.ts`:
```typescript
SWAGGER_ENABLED: z
  .preprocess((v) => v === 'true' || v === '1', z.boolean())
  .default(true),
```

Update `.env.example`:
```
SWAGGER_ENABLED=true    # Set to false to disable Swagger UI
```

### TC-07: Postman Collection
The Postman collection will be created **manually** as a static JSON file at `apps/api/documentacion/postman.json`. This is the most reliable approach for v1 — a comprehensive v2.1 collection with all 28+ endpoints, folders, variables, environment templates, example bodies, and auth headers.

### TC-08: Server URL
The OpenAPI `servers` entry MUST use the port from env (default 8000, matching `.env.example`):
```typescript
servers: [
  { url: 'http://localhost:8000', description: 'Local Development' },
]
```

---

## Success Criteria

| # | Criterion | Verification Method |
|---|---|---|
| SC-01 | `GET /` renders Swagger UI in browser | Manual: navigate to `http://localhost:8000/` |
| SC-02 | `GET /api/v1/docs.json` returns valid OpenAPI 3.0.3 JSON | Automated: integration test |
| SC-03 | Swagger UI has "Authorize" button accepting JWT Bearer token | Manual: click Authorize, enter token, see lock icons |
| SC-04 | All endpoints appear in Swagger UI with correct methods and paths | Visual inspection |
| SC-05 | Each endpoint shows request body schema (POST/PUT/PATCH) | Visual inspection |
| SC-06 | Each endpoint shows query parameters where applicable | Visual inspection |
| SC-07 | Each endpoint shows path parameters with descriptions | Visual inspection |
| SC-08 | Each endpoint documents allowed roles in the description | Visual inspection |
| SC-09 | `SWAGGER_ENABLED=false` disables Swagger (root returns 404) | Automated: integration test |
| SC-10 | `apps/api/documentacion/postman.json` is valid Postman v2.1 | Automated: validate JSON structure |
| SC-11 | Postman collection has ALL endpoints, auth header, variables, folders | Manual inspection |
| SC-12 | All existing tests pass without modification | Run: `bun run test` |
| SC-13 | Postman collection can be imported into Postman without errors | Manual: import and verify |

---

## Security Considerations

| ID | Consideration | Implementation |
|---|---|---|
| SEC-01 | Swagger UI must be disableable | `SWAGGER_ENABLED` env var (default `true`) |
| SEC-02 | No sensitive data in Postman collection | All example data is fictional |
| SEC-03 | JWT token in Swagger UI is client-side only | Stored in browser localStorage by Swagger UI |
| SEC-04 | API secrets not exposed in spec | No JWT_SECRET, DB URLs, or server-side secrets in spec |
| SEC-05 | Existing CORS middleware applies to Swagger UI | Served from same origin; no additional exposure |

---

## Edge Cases & Error Handling

| Edge Case | Behavior |
|---|---|
| `SWAGGER_ENABLED=false` | Root path `/` returns 404; docs.json also not served |
| Invalid OpenAPI spec | Bun logs error at startup; server starts without Swagger UI |
| Postman collection out of sync | Must be regenerated manually when routes change |
| Bun compatibility with `swagger-ui-express` | Bun handles CJS imports transparently; fallback to `swagger-ui-dist` if issues |
| Express 5 path matching | Ensure root path `/` doesn't conflict with other routes |

---

## Implementation Phases

### Phase 1: Dependencies & Env Setup
1. Install `swagger-ui-express` and `openapi-types`
2. Add `SWAGGER_ENABLED` to `env.ts`
3. Add `SWAGGER_ENABLED` to `.env.example`

### Phase 2: Swagger Config & OpenAPI Spec
4. Create `swagger.config.ts` with full OpenAPI 3.0.3 spec
5. Define reusable `components.schemas` for all entities
6. Document all paths with request/response schemas
7. Add `security` and role info to each path operation

### Phase 3: Route Integration
8. Wire Swagger UI route at `/` in routes/index.ts
9. Add `/api/v1/docs.json` endpoint for raw spec

### Phase 4: Postman Collection
10. Create `apps/api/documentacion/postman.json` (manual v2.1 format)
11. Include all endpoints, folders, variables, environment templates

### Phase 5: Tests
12. Add integration test: `GET /` returns 200 (Swagger UI)
13. Add integration test: `GET /api/v1/docs.json` returns valid spec
14. Add integration test: `SWAGGER_ENABLED=false` hides docs
15. Run full test suite — all existing tests must pass

---

## Appendices

### A: Sample OpenAPI Path Definition
```yaml
/api/v1/insumos:
  post:
    tags: [Insumos]
    summary: Create a new insumo (supply)
    operationId: createInsumo
    security:
      - bearerAuth: []
    x-roles: [ADMIN]
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [codigo, nombre, unidad, costBase]
            properties:
              codigo:
                type: string
                maxLength: 20
                example: "CEM-001"
              nombre:
                type: string
                maxLength: 255
                example: "Cemento Portland Tipo I"
              unidad:
                type: string
                enum: [M3, KG, UND, GL]
                example: "KG"
              costBase:
                type: string
                pattern: "^\d+(\.\d{1,2})?$"
                example: "12.50"
    responses:
      "201":
        description: Insumo created
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/InsumoResponse"
      "400":
        $ref: "#/components/responses/ValidationError"
      "401":
        $ref: "#/components/responses/Unauthorized"
      "403":
        $ref: "#/components/responses/Forbidden"
```

### B: Sample Postman Item Structure
```json
{
  "name": "Create Insumo",
  "request": {
    "method": "POST",
    "header": [
      { "key": "Authorization", "value": "Bearer {{token}}", "type": "text" },
      { "key": "Content-Type", "value": "application/json", "type": "text" }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"codigo\": \"CEM-001\",\n  \"nombre\": \"Cemento Portland Tipo I\",\n  \"unidad\": \"KG\",\n  \"costBase\": \"12.50\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/api/v1/insumos",
      "host": ["{{base_url}}"],
      "path": ["api", "v1", "insumos"]
    }
  }
}
```

---

## Stakeholder Decisions (Confirmed ✅)

| # | Question | Decision |
|---|---|---|
| 1 | Swagger UI route path? | ✅ Root path `GET /` (localhost:8000/) |
| 2 | Which endpoints to document? | ✅ **ALL** endpoints — full coverage |
| 3 | Postman environment templates? | ✅ Yes — local, staging, production |
| 4 | Dependencies? | ✅ `swagger-ui-express` + `openapi-types` confirmed |
| 5 | CI/CD automation? | ❌ Not for now; manual generation |

---

**STATUS: SPEC_APPROVED — Ready for Planning Phase**
