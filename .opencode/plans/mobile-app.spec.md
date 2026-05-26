# ProArq Mobile — React Native + Expo Application

## Feature Overview

**Why:** The ProArq construction cost estimation platform has a complete REST API backend (Express 5 + Drizzle ORM + PostgreSQL) but no mobile interface. Construction professionals work on-site and need access to budgets, supplies catalogs (insumos), unit price analyses (APUs), quotes (cotizaciones), and projects from their mobile devices — often with intermittent connectivity.

**What:** A React Native mobile application built with Expo, targeting the **web platform** first, that consumes the existing ProArq API. The app implements the "Innova APU Manager" design language across 18 screens, supports 5 RBAC roles with role-appropriate views, and operates in an offline-first mode using the sync endpoint (`POST /api/v1/sincronizar`) for data reconciliation.

---

## Tenets

1. **Offline-First by Design** — Users can create, read, and modify data without a network connection. Sync happens transparently when connectivity is restored.
2. **Role-Appropriate Interfaces** — Each of the 5 roles (ADMIN, GERENTE_OBRA, DIRECTOR_OBRA, CLIENTE, REPRESENTANTE) sees only the screens and data their permissions allow.
3. **Architectural Blueprint Design Language** — The "Innova APU Manager" Stitch design system governs every pixel: Navy Blue (#1A2B45) structure, Construction Orange (#F37021) actions, Inter typography, no-line sectioning, surface transitions for depth.
4. **Single Source of Truth** — All data originates from the ProArq API. The mobile app is a consumer, never an authoritative data store. Offline data is a local cache that syncs upstream.
5. **Clean Architecture Alignment** — The mobile app follows the same hexagonal/ports-and-adapters pattern as the backend, ensuring testability and separation of concerns.

---

## User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-M-01 | Any user (not authenticated) | Log in with email + password | I can access the ProArq platform |
| US-M-02 | Any user (not authenticated) | Request a password reset via email | I can recover my account access |
| US-M-03 | Any user (not authenticated) | Verify a reset code and set a new password | I can regain access after forgetting my password |
| US-M-04 | ADMIN | View a dashboard with project stats and key metrics | I can understand platform activity at a glance |
| US-M-05 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Browse, search, and filter the master supplies catalog (insumos) | I can find supplies for cost estimation |
| US-M-06 | ADMIN | Create, edit, and delete supplies in the master catalog | I can maintain the supply database |
| US-M-07 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Create and edit APU templates with supply items | I can build unit price analyses |
| US-M-08 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Create quotes by selecting APUs and setting quantities | I can prepare project budgets |
| US-M-09 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Browse quote history, filter by status or project | I can track all quotes |
| US-M-10 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | View quote details including items and cost breakdown | I can review quote composition |
| US-M-11 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Branch a quote to create a new version | I can iterate without losing history |
| US-M-12 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Compare quote versions side-by-side | I can see what changed between iterations |
| US-M-13 | ADMIN, GERENTE_OBRA, DIRECTOR_OBRA | Download quotes as PDF (full breakdown) | I can share quotes externally |
| US-M-14 | ADMIN | Manage users: create, edit, search, delete | I can control platform access |
| US-M-15 | ADMIN | Link client users to projects | I can grant project visibility to CLIENTE/REPRESENTANTE |
| US-M-16 | ADMIN | View audit logs | I can track who changed what |
| US-M-17 | Any user | Edit their own profile (name, email) | I can keep my information current |
| US-M-18 | CLIENTE, REPRESENTANTE | View the Client Portal with their assigned projects | I can see quotes relevant to me |
| US-M-19 | CLIENTE, REPRESENTANTE | Download quotes as PDF (redacted, no APU breakdown) | I can see prices without internal markup |
| US-M-20 | Any authenticated user | Sync offline-created data when connectivity returns | I can work without internet |
| US-M-21 | Any role | See an appropriate empty state when no data exists | I understand the UI is not broken |
| US-M-22 | Any role | See a 403 Access Denied page when attempting unauthorized actions | I understand my permission limits |

---

## Screen Specifications

### S-01: Login Screen
- **Stitch Screen:** Login Screen (`adc18082`)
- **Roles:** All (unauthenticated)
- **API Endpoints:**
  - `POST /auth/login` — Authenticate user, receive JWT + refresh token
- **UI Elements:**
  - Brand header with ProArq logo (Navy Blue)
  - Email input (Inter body-md, ghost border, 2px Navy bottom-border on focus)
  - Password input (secure, with show/hide toggle)
  - "Iniciar Sesión" button (Orange `tertiary_container` fill)
  - "¿Olvidaste tu contraseña?" link navigates to S-02
- **Behavior:**
  - On success: store access token + refresh token in secure storage → navigate to S-04 (Dashboard)
  - On 401: show inline error "Credenciales inválidas"
  - On network error: show cached last-login state if available, else offline error
- **Offline:** Not available offline (auth required). Show cached session if tokens exist.

### S-02: Recuperar Contraseña - Email
- **Stitch Screen:** Recuperar Contraseña - Email (`8e77f82a`)
- **Roles:** All (unauthenticated)
- **API Endpoints:**
  - `POST /auth/forgot-password` — Request reset email
- **UI Elements:**
  - Back arrow → S-01
  - Email input
  - "Enviar código" button (Orange)
  - Instruction text: "Ingresa tu correo electrónico y te enviaremos un código de verificación"
- **Behavior:**
  - On success: show confirmation → auto-navigate to S-03
  - On error: show inline message

### S-03: Verificar Código
- **Stitch Screen:** Verificar Código (`8602e344`)
- **Roles:** All (unauthenticated)
- **API Endpoints:**
  - `POST /auth/reset-password` — Reset password with token + new password
- **UI Elements:**
  - OTP code input (6 digits, individual boxes)
  - New password input
  - Confirm password input
  - "Restablecer contraseña" button
- **Behavior:**
  - On success: navigate to S-01 with success message
  - Code expires after 15 minutes (backend-enforced)
- **Offline:** Not available

### S-04: Project Dashboard
- **Stitch Screen:** Project Dashboard (`ce6f1a0e`)
- **Roles:** ADMIN, GERENTE_OBRA, DIRECTOR_OBRA
- **API Endpoints:**
  - `GET /projects` — List projects (paginated)
  - `GET /cotizaciones?page=1&limit=5` — Recent quotes snapshot
- **UI Elements:**
  - Header with app name and profile avatar → S-17
  - Project stats cards (total projects, active quotes, total value)
  - Recent projects horizontal scroll
  - Quick action FAB: "Nueva Cotización" (Orange)
  - Navigation bottom bar: Dashboard | Insumos | APUs | Cotizaciones | Users (ADMIN only)
- **Behavior:**
  - Pull-to-refresh re-fetches data
  - Tapping a project → navigates to quote history filtered by that project
- **Offline:** Show last-cached dashboard data with "Última sincronización: [timestamp]" banner

### S-05: User Directory (ADMIN only)
- **Stitch Screen:** User Directory (`d87e01c1`)
- **Roles:** ADMIN only
- **API Endpoints:**
  - `GET /users?name=&email=&role=&page=&limit=` — Paginated user list
- **UI Elements:**
  - Search bar with filters (name, email, role)
  - User list with avatar, name, email, role badge
  - FAB: "Nuevo Usuario" → S-06
  - Swipe-to-delete on user rows
- **Behavior:**
  - Pull-to-refresh
  - Tap user → S-06 in edit mode
  - Delete shows confirmation dialog
- **Offline:** Read from cache. Create/edit/delete requires online.

### S-06: Create/Edit User (ADMIN only)
- **Stitch Screen:** Create/Edit User (`6b9f84df`)
- **Roles:** ADMIN only
- **API Endpoints:**
  - `POST /users` — Create user
  - `PUT /users/:id` — Update user
  - `GET /users/:id` — Get user by ID (edit mode)
- **UI Elements:**
  - Name input
  - Email input
  - Password input (only on create, optional on edit)
  - Role dropdown: ADMIN | GERENTE_OBRA | DIRECTOR_OBRA | CLIENTE | REPRESENTANTE
  - Save button (Orange)
  - Cancel button (Ghost)
- **Behavior:**
  - Form validation: email format, password min 8 chars
  - On create success: navigate back to S-05 with new user in list
  - On edit success: update user in list

### S-07: Edit Profile
- **Stitch Screen:** Edit Profile (`455a3f97`)
- **Roles:** All authenticated
- **API Endpoints:**
  - `PUT /users/:id` — Update own profile (need an endpoint for current user or use users/:id)
  - `GET /users/:id` — Get current user details
- **UI Elements:**
  - Profile avatar (editable)
  - Name input
  - Email input (read-only for non-ADMIN? depends on API)
  - Role display (read-only badge)
  - Save button
- **Behavior:**
  - Accessed from profile avatar in header (any screen)
  - On success: toast "Perfil actualizado"

### S-08: Insumos - Catálogo Maestro
- **Stitch Screen:** Insumos - Catálogo Maestro (`c1c70f3c`)
- **Roles:** ADMIN (read/write), GERENTE_OBRA (read), DIRECTOR_OBRA (read)
- **API Endpoints:**
  - `GET /insumos?codigo=&nombre=&unidad=&page=&limit=` — Paginated list
  - `GET /insumos/:id` — Get single insumo
  - `POST /insumos` — Create insumo (ADMIN)
  - `PUT /insumos/:id` — Update insumo (ADMIN)
  - `DELETE /insumos/:id` — Delete insumo (ADMIN)
  - `POST /insumos/bulk-upload` — CSV bulk upload (ADMIN)
- **UI Elements:**
  - Search bar with filter chips (por código, nombre, unidad)
  - Insumo list: Código | Nombre | Unidad | Costo Base
  - FAB: "Nuevo Insumo" (ADMIN only)
  - Pull-to-refresh
  - Row actions: Edit (ADMIN), Delete (ADMIN)
- **Offline:** Full read from cache. Create/edit operations queued for sync.

### S-09: Creador de Plantilla APU
- **Stitch Screen:** Creador de Plantilla APU (`193b685e`)
- **Roles:** ADMIN, GERENTE_OBRA, DIRECTOR_OBRA
- **API Endpoints:**
  - `POST /apus` — Create APU
  - `PUT /apus/:id` — Update APU
  - `GET /apus/:id` — Get APU with items
  - `POST /apus/:id/insumos` — Add insumo to APU
  - `DELETE /apus/:id/insumos/:itemId` — Remove insumo
  - `GET /insumos` — Search insumos to add
- **UI Elements:**
  - APU header: Código, Nombre, Tipo
  - Items list with: Insumo nombre | Rendimiento | Desperdicio | Precio Unitario | Costo Directo
  - "Agregar Insumo" button → search insumo modal
  - Cost summary footer
  - Save button
- **Behavior:**
  - When adding an insumo: search /insumos, select one, set rendimiento and desperdicio
  - Cost calculation done client-side: `Rendimiento × unit_price_snapshot × (1 + desperdicio/100)`
  - On save: POST /apus then batch POST /apus/:id/insumos for each item
- **Offline:** Full CRUD queued. Sync via POST /sincronizar.

### S-10: APU Quote Creator
- **Stitch Screen:** APU Quote Creator (`c679622f`)
- **Roles:** ADMIN, GERENTE_OBRA, DIRECTOR_OBRA
- **API Endpoints:**
  - `POST /cotizaciones` — Create quote with items
  - `GET /apus` — List APUs to select from
  - `GET /apu/:id` — Get APU details for cost calculation
  - `GET /projects` — List projects
- **UI Elements:**
  - Quote header fields: Código, Proyecto (dropdown), Cliente (dropdown)
  - APU selection: search + multi-select from APU list
  - For each selected APU: cantidad input
  - Cost breakdown: total cost direct, Factor A%, Factor B%, Profit Margin U%
  - Final amount calculation
  - Save as Draft / Send (Enviada)
- **Behavior:**
  - Selecting a project filters available APUs
  - When saving with estado=ENVIADA, profit margin must be >= 8%
  - On save: POST /cotizaciones with items array
- **Offline:** Queued for sync.

### S-11: Comparación de Versiones
- **Stitch Screen:** Comparación de Versiones (`c4d3ab42`)
- **Roles:** ADMIN, GERENTE_OBRA, DIRECTOR_OBRA
- **API Endpoints:**
  - `GET /cotizaciones/:id` — Get quote by ID
  - (Need: version comparison — fetch multiple versions)
- **UI Elements:**
  - Version selector (dropdown: V1, V2, V3...)
  - Side-by-side or stacked comparison view
  - Changed fields highlighted with color diff
  - Item changes (added/removed/modified quantities)
  - Total cost comparison
- **Behavior:**
  - User selects two versions to compare
  - System highlights differences in cost, items, factors
- **Offline:** Uses cached quote versions.

### S-12: Link Client to Projects
- **Stitch Screen:** Link Client to Projects (`2671219d`)
- **Roles:** ADMIN only
- **API Endpoints:**
  - `GET /users?role=CLIENTE&role=REPRESENTANTE` — List client-type users
  - `GET /projects` — List projects
  - (Need: association endpoints or use PATCH on project/user)
- **UI Elements:**
  - Client user search + select
  - Project multi-select list
  - "Vincular" button
- **Behavior:**
  - Select a client user, then checkmark projects to associate
  - Show currently linked projects for selected client

### S-13: Quote History
- **Stitch Screen:** Quote History (`3c7510ca`)
- **Roles:** ADMIN, GERENTE_OBRA, DIRECTOR_OBRA
- **API Endpoints:**
  - `GET /cotizaciones?projecto_id=&estado=&page=&limit=` — Paginated, filterable
- **UI Elements:**
  - Filter bar: All | Borrador | Enviada | Aprobada | Reemplazada
  - Search by código
  - Quote list cards: Código, Proyecto, Estado badge, Total Amount, Version
  - Tap → S-14 (Quote Detail)
  - Empty state → S-17 (Sin Cotizaciones)
- **Offline:** Reads from cached quotes.

### S-14: Quote Detail / Visor de PDF
- **Stitch Screen:** Visor de PDF - Cotización Obra (`7211071e`)
- **Roles:** ADMIN, GERENTE_OBRA, DIRECTOR_OBRA, CLIENTE, REPRESENTANTE
- **API Endpoints:**
  - `GET /cotizaciones/:id` — Get quote with items
  - `GET /cotizaciones/:id/pdf` — Download PDF
  - `POST /cotizaciones/:id/branch` — Branch quote
  - `PATCH /cotizaciones/:id` — Update quote
- **UI Elements:**
  - Quote header: Código, Proyecto, Versión, Estado
  - Items table: APU | Cantidad | Costo Directo
  - Financial summary: Costo Directo Total, Factor A%, Factor B%, U%, Monto Final
  - Action buttons:
    - "Descargar PDF" (all roles)
    - "Editar" (if estado=BORRADOR, internal roles)
    - "Crear Versión" / "Branch" (internal roles)
    - "Enviar" / "Aprobar" (status transitions)
  - In-app PDF viewer (for CLIENTE/REPRESENTANTE, PDF is redacted)
- **Offline:** Cached quote detail. PDF download requires online.

### S-15: Client Portal
- **Stitch Screen:** Client Portal (`507a58d4`)
- **Roles:** CLIENTE, REPRESENTANTE
- **API Endpoints:**
  - `GET /cotizaciones?projecto_id=<assigned>` — Quotes for client's projects
  - `GET /cotizaciones/:id/pdf` — Redacted PDF
- **UI Elements:**
  - "Bienvenido, [Name]" header
  - My Projects list
  - Per-project quote cards (redacted: show total amount, no APU breakdown)
  - Status badges
  - Tap → Quote Detail (redacted view)
  - Download PDF button
- **Behavior:**
  - Client sees only their assigned projects
  - PDF is always redacted (no APU_INSUMO data)
  - Empty state → S-18 (Sin Cotizaciones)

### S-16: Estado Vacío - Sin Cotizaciones
- **Stitch Screen:** Estado Vacío - Sin Cotizaciones (`9895baf6`)
- **Roles:** All
- **UI Elements:**
  - Illustration/icon
  - "No hay cotizaciones" heading
  - "Crea tu primera cotización para empezar" subtext (internal roles)
  - "Consulta con tu administrador" subtext (CLIENTE/REPRESENTANTE)
  - CTA button: "Crear Cotización" (internal roles only)

### S-17: Estado Vacío - Sin Proyectos
- **Stitch Screen:** Estado Vacío - Sin Proyectos (`5dfad652`)
- **Roles:** All
- **UI Elements:**
  - Illustration/icon
  - "No hay proyectos" heading
  - "Crea un proyecto para empezar" subtext
  - CTA button: "Crear Proyecto" (internal roles only)

### S-18: Acceso Denegado (403)
- **Stitch Screen:** Acceso Denegado (`a9cde45d`)
- **Roles:** All (shown when role lacks permission)
- **UI Elements:**
  - Lock icon / 403 graphic
  - "Acceso Denegado" heading
  - "No tienes permisos para ver esta página" subtext
  - "Volver al Inicio" button → S-04
  - "Cerrar Sesión" link
- **Behavior:**
  - Shown when user navigates to a screen their role cannot access
  - Also shown when API returns 403

---

## Navigation Structure

```
                    ┌─────────────────────┐
                    │   S-01: Login        │
                    │   (unauthenticated)   │
                    └──────┬──────────────┘
                           │ auth success
                           ▼
              ┌────────────────────────────┐
              │  Role Router (auth gate)    │
              │  CLIENTE/REPRESENTANTE      │
              │  → S-15 Client Portal       │
              │  ADMIN/GERENTE/DIRECTOR     │
              │  → S-04 Dashboard           │
              └────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
  ┌─────────────────────┐   ┌─────────────────────┐
  │ S-04: Dashboard     │   │ S-15: Client Portal │
  │ (internal roles)    │   │ (CLIENTE/REPRES.)   │
  └──┬──┬──┬──┬──┬──┬──┘   └──┬──────────────────┘
     │  │  │  │  │  │         │
     │  │  │  │  │  │         ▼
     │  │  │  │  │  │   S-14: Quote Detail
     │  │  │  │  │  │   (redacted PDF)
     │  │  │  │  │  │
     │  │  │  │  │  └── S-07: Edit Profile
     │  │  │  │  │
     │  │  │  │  └───── S-05: User Directory (ADMIN only)
     │  │  │  │            ├── S-06: Create/Edit User
     │  │  │  │            └── S-12: Link Client to Projects
     │  │  │  │
     │  │  │  └──────── S-13: Quote History
     │  │  │                ├── S-14: Quote Detail
     │  │  │                │    ├── S-11: Comparación de Versiones
     │  │  │                │    └── Download PDF
     │  │  │                └── S-16: Empty State (Sin Cotizaciones)
     │  │  │
     │  │  └─────────── S-09: APU Creator
     │  │
     │  └────────────── S-08: Insumos Catalog
     │
     └───────────────── S-10: Quote Creator

Unauthenticated flow:
  S-01: Login ──► S-02: Forgot Password ──► S-03: Verify Code
       │                                        │
       └──────────────── S-18: 403 ─────────────┘

Bottom Navigation Bar (internal roles):
  ┌──────────┬──────────┬──────────┬──────────┬──────────┐
  │ Dashboard│ Insumos  │   APUs   │Cotizacion│  Users   │
  │          │          │          │   es     │ (ADMIN)  │
  └──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Data Flow Architecture

### Online Mode
```
User Action → Screen Component → Service Layer → API Client → HTTP Request → Backend API
                                           ↓
                                    Response Cache
                                           ↓
                              Response → Update State → Render
```

### Offline Mode
```
User Action → Screen Component → Service Layer → Local Storage (SQLite/AsyncStorage)
                                           ↓
                                  Offline Queue (pending sync)
                                           ↓
                              Response → Update State → Render
```

### Sync Flow
```
Connectivity Restored → Sync Service triggered
                           ↓
                  Read Offline Queue
                           ↓
                  POST /api/v1/sincronizar
                    { insumos, apus, cotizaciones }
                           ↓
                  Server processes → ON CONFLICT (id) DO NOTHING
                           ↓
                  Response { accepted, conflicts }
                           ↓
                  Update local cache, clear synced items from queue
                           ↓
                  Show "Sincronización completa" toast
```

### Data Cache Strategy (Actual Implementation)

| Data Type | Cache Location | TTL | Invalidation |
|---|---|---|---|
| Auth tokens | sessionStorage | Until expiry | On 401 or logout (tab close clears) |
| User profile | Dexie.js `users` table | 10 minutes | On profile edit or pull-to-refresh |
| Insumos catalog | Dexie.js `insumos` table | 24 hours | On sync or pull-to-refresh |
| APUs | Dexie.js `apus` table | 24 hours | On sync or pull-to-refresh |
| APU Insumos | Dexie.js `apuInsumos` table | 24 hours | On sync or pull-to-refresh |
| Cotizaciones | Dexie.js `cotizaciones` table | 12 hours | On sync or pull-to-refresh |
| Cotización Items | Dexie.js `cotizacionItems` table | 12 hours | On sync or pull-to-refresh |
| Projects | Dexie.js `proyectos` table | 24 hours | On sync or pull-to-refresh |
| Audit logs | Not cached | — | Always fetch fresh |
| PDFs | (browser cache for `<iframe>`) | Session | Cleared on tab close |
| Pending mutations | Dexie.js `syncQueue` table | Until synced | On successful sync (engine pending) |

**Deviation from planned:**
- expo-secure-store → sessionStorage (web-native)
- SQLite → Dexie.js (IndexedDB wrapper)
- AsyncStorage → Dexie.js (all structured data in IndexedDB)
- apuInsumos and cotizacionItems are cached separately (not in spec)
- All cached entities include `_lastSyncedAt` timestamp for TTL comparison

---

## Offline Strategy

### Core Principles

1. **Local-First Reads:** All GET responses are cached locally. Screens read from cache first, update from API in background.
2. **Optimistic Writes:** Create/update/delete operations apply locally immediately, then queue for sync.
3. **Queue-Based Sync:** Mutations are stored in an ordered queue. When online, the sync service processes the queue via `POST /sincronizar`.
4. **UUID Pre-Generation:** All new entities get a UUIDv4 generated on the client before being sent to the server. This enables local references before sync completion.
5. **Conflict Resolution:** Server uses `ON CONFLICT (id) DO NOTHING` — first write wins. Conflicting writes are returned in the sync response for manual resolution.

### Offline Queue Schema

```typescript
interface SyncQueueItem {
  id: string;           // UUID
  entity: 'insumo' | 'apu' | 'cotizacion' | 'apu_insumo' | 'cotizacion_item' | 'project' | 'user';
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  entityId: string;      // pre-generated UUID
  createdAt: string;     // ISO timestamp
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}
```

### Connectivity Detection

- Use `@react-native-community/netinfo` for network status
- On connectivity change: online → trigger sync; offline → show banner "Modo sin conexión"
- Debounce sync trigger by 5 seconds after reconnection to handle flaky connections

### Offline Limitations

| Feature | Offline Capability |
|---|---|
| View cached data | ✅ Full read |
| Search/filter cached data | ✅ Client-side |
| Create new entities | ✅ Queued, UUID pre-generated |
| Edit entities | ✅ Queued |
| Delete entities | ✅ Queued |
| PDF Download | ❌ Requires online |
| User management | ❌ Requires online (ADMIN only) |
| Bulk upload | ❌ Requires online |
| Audit logs | ❌ Always fresh |
| Auth operations | ❌ Requires online |
| Sync | ✅ Reads queue, sends when online |

---

## Technical Architecture

### Monorepo Package Structure

> **Note:** The planned `packages/mobile-core` was NOT created. The mobile app imports directly from `packages/core` (`@proarq/core`).

```
proarq/
├── packages/
│   └── core/                              # Domain + Application (shared)
│       └── src/
│           ├── domain/entities/           # Shared domain interfaces
│           ├── application/               # Shared business logic + Zod schemas
│           └── errors/
│
└── apps/
    ├── api/                               # Backend (Express 5 + Drizzle + Postgres)
    └── mobile/                            # ★ React Native (Expo) Web app
        └── src/
            ├── app/                       # Expo Router (file-based routing)
            │   ├── _layout.tsx            # Root layout: QueryClientProvider + ErrorBoundary
            │   ├── (auth)/                # Unauthenticated routes
            │   │   ├── login.tsx          #   S-01 Login
            │   │   ├── forgot-password.tsx  # S-02 Forgot Password
            │   │   └── verify-code.tsx    #   S-03 Verify Code
            │   ├── (tabs)/                # Bottom tab navigator
            │   │   ├── dashboard.tsx      #   S-04 Dashboard
            │   │   ├── insumos.tsx        #   S-08 Insumos Catalog
            │   │   ├── apus.tsx           #   S-09 APU List
            │   │   ├── cotizaciones.tsx   #   S-13 Quote History
            │   │   └── users.tsx          #   S-05 User Directory (ADMIN)
            │   ├── users/
            │   │   └── create.tsx          #   S-06 Create User (ADMIN)
            │   ├── apus/
            │   │   ├── create.tsx          #   S-09 APU Creator
            │   │   └── [id].tsx            #   S-09 APU Detail/Edit
            │   ├── cotizaciones/
            │   │   └── [id]/
            │   │       ├── index.tsx       #   S-14 Quote Detail
            │   │       └── pdf.tsx         #   S-14 PDF Viewer
            │   └── ...                     # (pending: profile, access-denied, insumos/, projects/)
            │
            ├── components/                # Reusable UI components
            │   ├── ui/                    # Design system primitives
            │   │   ├── Button.tsx         #   3 variants (Orange/Navy/Ghost)
            │   │   ├── Card.tsx
            │   │   ├── Input.tsx
            │   │   ├── Table.tsx
            │   │   ├── EmptyState.tsx
            │   │   └── LoadingState.tsx
            │   ├── ErrorBoundary.tsx      # Route-level crash resilience
            │   ├── InsumoCard.tsx
            │   └── CotizacionCard.tsx
            │
            ├── config/
            │   └── api.config.ts          # API_BASE_URL + timeouts
            │
            ├── db/                        # (reserved for Dexie helpers)
            │
            ├── hooks/                     # React hooks (React Query wrappers)
            │   ├── useInsumos.ts
            │   ├── useInsumosWithCache.ts # React Query + Dexie write-through
            │   ├── useCotizaciones.ts
            │   └── useDashboard.ts
            │
            ├── lib/
            │   └── queryClient.ts         # QueryClient singleton
            │
            ├── services/
            │   ├── api/                   # Axios-based API clients
            │   │   ├── client.ts          #   Axios instance + auth interceptors
            │   │   ├── auth.api.ts
            │   │   ├── insumos.api.ts
            │   │   ├── apus.api.ts
            │   │   ├── cotizaciones.api.ts
            │   │   ├── users.api.ts
            │   │   ├── projects.api.ts
            │   │   └── index.ts           #   Barrel exports
            │   ├── auth/
            │   │   └── auth.service.ts    # Login/logout orchestration
            │   └── storage/
            │       ├── auth-storage.ts    # sessionStorage token management
            │       └── database.ts        # Dexie.js IndexedDB schema (8 tables)
            │
            ├── stores/                    # Zustand stores
            │   ├── auth.store.ts          # User, tokens, isAuthenticated, hasRole()
            │   └── reset-store.ts         # Global store reset for tests
            │
            ├── theme/                     # Design system tokens
            │   ├── colors.ts              # Material 3 palette (Navy, Orange, surfaces)
            │   ├── typography.ts          # Inter font scale (displayLg → labelSm)
            │   ├── spacing.ts
            │   ├── shadows.ts
            │   └── index.ts
            │
            ├── utils/
            │   └── index.ts              # Logger utility
            │
            └── __tests__/                # Test suite (19 files)
                ├── global-setup.ts       # jsdom + fake-indexeddb + sessionStorage
                ├── test-wrapper.tsx      # createQueryWrapper() factory
                ├── test-helpers.ts       # resetMocks(), mockStorage
                ├── dom-mock.ts           # Minimal DOM mock (fallback)
                ├── setup.ts
                ├── app/                  # 7 screen tests
                ├── components/           # 6 component tests
                ├── services/             # 2 service tests
                ├── stores/               # 1 store test
                ├── db/                   # 1 database test
                └── theme/                # 1 theme test
```

### Key Libraries

| Package | Purpose | Layer | Status |
|---|---|---|---|
| `expo` ~52 | Framework | Root | ✅ Installed |
| `expo-router` | File-based routing | App | ✅ Installed |
| `expo-secure-store` | Secure token storage | Auth | ❌ Replaced by sessionStorage |
| `expo-file-system` | PDF caching | Storage | ❌ Not needed (web) |
| `expo-web-browser` | PDF viewer (web) | UI | ❌ Not needed (iframe) |
| `@react-native-community/netinfo` | Connectivity detection | Sync | ❌ Not yet installed |
| `zustand` | Lightweight state management | State | ✅ Installed (^5) |
| `axios` | HTTP client with interceptors | API | ✅ Installed (^1.7) |
| `dexie` | IndexedDB wrapper (replaces SQLite) | Storage | ✅ Installed (^4) |
| `react-native-pdf` or web PDF viewer | PDF rendering | UI | ❌ Replaced by `<iframe>` |
| `uuid` (v4) | UUID generation | Utils | ❌ Replaced by `crypto.randomUUID()` |
| `react-native-reanimated` | Animations (optional) | UI | ❌ Not installed |
| `@tanstack/react-query` | Data fetching + cache | Data layer | ✅ Installed (^5) |
| `zod` | Validation (shared with core) | Validation | ✅ Installed (4.4.3) |
| `date-fns` | Date formatting | Utils | ✅ Installed (^4) |
| `react-native-svg` | Icons and illustrations | UI | ❌ Not installed |

### State Management Strategy (Actual Implementation)

```
                    ┌─────────────────────────────┐
                    │      Zustand Stores          │
                    │  (global app state)           │
                    │  - auth.store.ts              │
                    │    (user, tokens, login,      │
                    │     logout, hasRole())        │
                    │  - reset-store.ts             │
                    │    (test cleanup registry)    │
                    └──────────┬──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
  │ React Query   │   │ React Query   │   │  Local State      │
  │ (Server state)│   │ (Mutations)   │   │  (form inputs,    │
  │ - GET cached  │   │ - POST/PUT   │   │   UI toggles)     │
  │ - Auto refetch│   │   /DELETE    │   │                   │
  │ - placeholder │   └──────┬───────┘   └──────────────────┘
  │   from Dexie  │          │
  └──────┬───────┘           │
         │                   ▼
         │           ┌──────────────────┐
         │           │  Sync Queue      │
         └──────┐    │  (Dexie table)   │
                │    └──────────────────┘
                ▼             │
       ┌──────────────┐       │
       │  Dexie.js    │       ▼
       │  IndexedDB   │  ┌──────────────────┐
       │  (8 tables)  │  │  Sync Service     │
       │  write-      │  │  (POST /sincronizar│
       │  through     │  │   — NOT YET IMPL) │
       │  cache       │  └──────────────────┘
       └──────────────┘

Key difference from planned: SQLite → Dexie.js (IndexedDB).
```

---

## Design System Implementation

### Color Palette (from Stitch "Innova APU Manager")

```typescript
// theme/colors.ts
export const colors = {
  primary: '#04162f',           // On primary surface
  primaryContainer: '#1a2b45',  // Navy Blue — structural, navigation
  onPrimaryContainer: '#8293b2',
  primaryFixed: '#d6e3ff',
  primaryFixedDim: '#b6c7e8',

  tertiary: '#2d0d00',
  tertiaryContainer: '#F37021', // Construction Orange — actions, attention
  onTertiaryContainer: '#ed6c1c',
  tertiaryFixed: '#ffdbcb',
  tertiaryFixedDim: '#ffb693',

  surface: '#fbf9fb',
  surfaceBright: '#fbf9fb',
  surfaceContainer: '#efedf0',
  surfaceContainerHigh: '#e9e7ea',
  surfaceContainerHighest: '#e4e2e4',
  surfaceContainerLow: '#f5f3f5',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dbd9dc',
  surfaceTint: '#4e5f7c',
  surfaceVariant: '#e4e2e4',

  onSurface: '#1b1b1e',
  onSurfaceVariant: '#44474d',
  outline: '#75777e',
  outlineVariant: '#c5c6ce',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  secondary: '#5e5e5e',
  secondaryContainer: '#e1dfdf',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#626263',
};
```

### Typography Scale

```typescript
// theme/typography.ts
export const typography = {
  displayLg: { fontFamily: 'Inter', fontSize: 48, fontWeight: '800', lineHeight: 1.1, letterSpacing: -0.02 },
  displaySm: { fontFamily: 'Inter', fontSize: 36, fontWeight: '800', lineHeight: 1.2, letterSpacing: -0.02 },
  headlineLg: { fontFamily: 'Inter', fontSize: 30, fontWeight: '700', lineHeight: 1.3 },
  headlineSm: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', lineHeight: 1.3 },
  titleMd: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', lineHeight: 1.4 },
  titleSm: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', lineHeight: 1.4 },
  bodyMd: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 1.6 },
  bodySm: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: 1.5 },
  labelMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '500', lineHeight: 1.4 },
  labelSm: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500', lineHeight: 1.4, letterSpacing: 0.05 },
};
```

### Component Design Rules

| Component | Design Rule |
|---|---|
| **Button Primary** | `tertiary_container` (Orange #F37021) fill, `on_tertiary` white text, `md` roundedness (0.375rem), 135° gradient from `tertiary` to `tertiary_container` |
| **Button Secondary** | `primary_container` (Navy #1A2B45) fill, `on_primary_container` text |
| **Button Tertiary (Ghost)** | Transparent bg, `primary` text label |
| **Cards** | No dividers. 24-32px vertical spacing between modules. Background shift instead of borders |
| **Tables** | `surface_container_lowest` for header row. Alternating `surface` and `surface_container_low` for rows (zebra striping). All-caps `label-sm` with 0.05rem letter-spacing for headers |
| **Inputs** | Ghost border (1px `outline_variant` at 15% opacity) default. 2px `primary` bottom-border on focus. Error: red text, neutral bg |
| **Shadows** | Ambient: 32px blur, 6% opacity, tinted `on_surface`. Never pure black |
| **Modals** | `surface_bright` bg with 20px backdrop blur. Linear gradient on CTAs (135°) |

---

## API Integration Map

| Screen ID | Screen Name | API Endpoint(s) | Method | Cache Strategy |
|---|---|---|---|---|
| S-01 | Login | `/auth/login` | POST | No cache (tokens in secure storage) |
| S-02 | Forgot Password | `/auth/forgot-password` | POST | No cache |
| S-03 | Verify Code | `/auth/reset-password` | POST | No cache |
| S-04 | Dashboard | `/projects`, `/cotizaciones?limit=5` | GET | Cache + background refresh |
| S-05 | User Directory | `/users?name=&email=&role=&page=&limit=` | GET | Cache 10min |
| S-06 | Create/Edit User | `/users` (POST), `/users/:id` (GET/PUT) | GET/POST/PUT | Invalidate user directory cache |
| S-07 | Edit Profile | `/users/:id` (GET/PUT) | GET/PUT | Cache 1hour |
| S-08 | Insumos Catalog | `/insumos?codigo=&nombre=&unidad=&page=&limit=` | GET | Cache 24hrs |
| S-08a | Create/Edit Insumo | `/insumos` (POST), `/insumos/:id` (PUT/DELETE) | POST/PUT/DELETE | Invalidate insumos cache, queue offline |
| S-08b | Bulk Upload | `/insumos/bulk-upload` | POST | Online only |
| S-09 | APU Creator | `/apus` (POST), `/apus/:id` (GET/PUT), `/apus/:id/insumos` (POST/DELETE), `/insumos` (GET) | All | Cache 24hrs, queue mutations |
| S-10 | Quote Creator | `/cotizaciones` (POST), `/apus` (GET), `/projects` (GET), `/users?role=CLIENTE` (GET) | GET/POST | Cache 12hrs, queue creation |
| S-11 | Version Compare | `/cotizaciones/:id` (GET × 2 versions) | GET | Cache quote versions |
| S-12 | Link Client | `/users?role=CLIENTE|REPRESENTANTE` (GET), `/projects` (GET), PATCH project | GET/PATCH | Cache, online for writes |
| S-13 | Quote History | `/cotizaciones?projecto_id=&estado=&page=&limit=` | GET | Cache 12hrs |
| S-14 | Quote Detail | `/cotizaciones/:id` (GET), `/cotizaciones/:id/pdf` (GET), `/cotizaciones/:id/branch` (POST), `/cotizaciones/:id` (PATCH) | GET/POST/PATCH | Cache 12hrs, PDF online only |
| S-15 | Client Portal | `/cotizaciones?projecto_id=<assigned>` (GET), `/cotizaciones/:id/pdf` (GET) | GET | Cache 12hrs, PDF redacted |
| S-16 | Empty: No Quotes | — (shown when S-13/S-15 returns empty) | — | — |
| S-17 | Empty: No Projects | — (shown when S-04 returns empty) | — | — |
| S-18 | Access Denied | — (shown on 403 or role guard) | — | — |

### Cross-Cutting API Concerns

| Concern | Implementation |
|---|---|
| **Auth Header** | `Authorization: Bearer <token>` sent via axios interceptor |
| **Token Refresh** | Axios response interceptor catches 401 → calls `/auth/login` with refresh token → retries request |
| **Base URL** | `http://localhost:8000/api/v1` (configurable in `api.config.ts`) |
| **Error Format** | All errors: `{ error: string, details?: any }` |
| **Pagination** | Standard: `?page=1&limit=20` → response: `{ data: [], total, page, limit, totalPages }` |
| **Timeouts** | Read: 10s, Write: 15s, Upload: 60s |

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|---|---|
| App cold start | < 3 seconds (web: < 2s) |
| Screen transition | < 300ms |
| List render (100 items) | < 500ms |
| Search filter response | < 200ms (client-side) |
| API response time (p95) | < 2s (depends on backend) |
| Offline queue sync | < 5s for 50 items |
| PDF download + render | < 5s (1MB PDF) |
| Bundle size (web) | < 300KB initial JS |

### Security

| Requirement | Implementation |
|---|---|
| Token storage | `expo-secure-store` (encrypted) |
| Auto logout | On 401 or token expiry, clear storage → redirect to login |
| Input sanitization | Zod validation on all user inputs |
| Role-based UI hiding | Never render admin-only screens for CLIENTE/REPRESENTANTE |
| API key exposure | None — app uses JWT only |
| Network requests | HTTPS only (in production) |

### Accessibility

| Requirement | Implementation |
|---|---|
| Screen reader support | `accessibilityLabel` on all interactive elements |
| Color contrast | Minimum 4.5:1 for text (verified against design token palette) |
| Touch targets | Minimum 44×44px for all interactive elements |
| Focus indicators | Visible focus ring (2px orange) on keyboard navigation |
| Reduced motion | Respect `prefers-reduced-motion` |

### Reliability

| Requirement | Implementation |
|---|---|
| Offline capability | All read operations work offline |
| Data consistency | Optimistic writes + conflict resolution |
| Error recovery | Retry failed sync queue items with exponential backoff (max 3 retries) |
| Graceful degradation | Show cached data when API unreachable, with timestamp |
| Crash resilience | Error boundaries at route level |

---

## Technical Constraints

| Constraint | Rule | Rationale |
|---|---|---|
| **Monorepo** | All mobile code lives in `apps/mobile`. Shared types in `packages/core` or new `packages/mobile-core`. | Bun workspaces consistency |
| **Package manager** | Bun only. No npm/pnpm/yarn. | Existing project constraint |
| **Expo target** | Web-only (no iOS/Android native for now). | User decision |
| **API dependency** | All API calls go through axios client with auth interceptor. Never call fetch() directly. | Centralized auth handling |
| **State management** | Zustand for global state, React Query for server state. | Separation of concerns |
| **UUID generation** | Use `crypto.randomUUID()` (available in modern browsers) for offline UUIDs. | Browser-native, no extra dependency |
| **Form validation** | Zod schemas shared or replicated from `packages/core/src/application/ports/in/`. | Consistency with backend |
| **Offline persistence** | SQLite via `expo-sqlite` for structured data. `AsyncStorage` for key-value. | Performance + queryability |
| **Design system** | All component styles use the centralized theme tokens. No inline color literals. | Theming consistency |
| **Routing** | Expo Router with file-based routing. | Expo convention |
| **Biome** | All code must pass `bun run lint` (Biome) before commit. | Existing project constraint |

---

## Success Criteria / Definition of Done

1. **All 18 screens** render correctly with the "Innova APU Manager" design system (verified against Stitch screenshots)
2. **Authentication flow** works end-to-end: login, token refresh, auto-logout on 401, forgot/reset password
3. **RBAC enforcement**: CLIENTE/REPRESENTANTE see only Client Portal (S-15); ADMIN sees all screens
4. **Offline reads**: All list and detail screens show cached data when offline, with "Modo sin conexión" banner
5. **Offline writes**: Creating/editing insumos, APUs, and cotizaciones works offline; mutations queued and synced
6. **Sync service**: `POST /sincronizar` processes queued mutations; conflicts reported with resolution options
7. **PDF download**: Full PDF for internal roles, redacted PDF for CLIENTE/REPRESENTANTE
8. **Empty states**: S-16, S-17 shown when respective data is empty
9. **403 handling**: S-18 shown when user navigates to unauthorized screen
10. **Pull-to-refresh**: All list screens support pull-to-refresh when online
11. **Search/filter**: Client-side search on cached data responds in < 200ms
12. **Token refresh**: Axios interceptor automatically refreshes expired tokens
13. **Cost calculations**: Client-side cost formulas match backend to 4 decimal places
14. **Quote branching**: Branch creates new version, old quote marked as REEMPLAZADA
15. **Biome compliance**: All code passes `bun run lint` without errors

---

## Implementation Order (Recommended Phases)

| Phase | Modules | Dependencies | Estimated Effort | Status |
|---|---|---|---|---|
| **1. Foundation** | Expo project setup, monorepo workspace, theme tokens, base UI components (Button, Card, Input, Badge), API client with auth interceptor | — | 6h | ✅ Complete |
| **2. Auth + Navigation** | Login (S-01), Forgot Password (S-02), Verify Code (S-03), auth service, token manager, Expo Router setup, role-based routing | Phase 1 | 6h | ✅ Complete |
| **3. Dashboard + Empty States** | Dashboard (S-04), Empty States (S-16, S-17), Access Denied (S-18), Edit Profile (S-07) | Phase 1, 2 | 6h | 🟡 Partial (empty states exist, S-07/S-18 pending) |
| **4. Insumos Module** | Insumos Catalog (S-08), create/edit/deletion, search, filter, bulk upload trigger | Phase 1, 2, 3 | 6h | 🟡 Partial (listing works, create/edit screens pending) |
| **5. APU Module** | APU Creator (S-09), insumo search modal, cost calculation, offline queue | Phase 1, 2, 4 | 8h | ✅ Complete (create, detail/edit exist) |
| **6. Quotes Module** | Quote Creator (S-10), Quote History (S-13), Quote Detail (S-14), PDF viewer, branching | Phase 1, 2, 5 | 10h | 🟡 Partial (history, detail, PDF exist; creator pending) |
| **7. Version Compare** | Version Comparison (S-11), diff rendering | Phase 6 | 4h | ❌ Not started |
| **8. Users Module** | User Directory (S-05), Create/Edit User (S-06), Link Client (S-12) | Phase 1, 2 | 6h | 🟡 Partial (directory tab + create exist; edit/Link Client pending) |
| **9. Client Portal** | Client Portal (S-15), redacted PDF, project-scoped data | Phase 1, 2, 6 | 4h | ❌ Not started |
| **10. Sync Engine** | Offline queue, sync service, conflict resolution, connectivity detection | Phase 4, 5, 6 | 8h | 🟡 Partial (syncQueue table schema exists, engine pending) |
| **11. Polish + Edge Cases** | Design system refinement, loading/error states, animations, accessibility audit, Biome cleanup | All phases | 6h | 🟡 Partial (ErrorBoundary, EmptyState, LoadingState exist) |

### Implementation Notes

- **Phase 1 deviation:** Base UI components built: Button (3 variants), Card, Input, Table, EmptyState, LoadingState. Badge, SearchBar, FilterChip, ErrorState pending.
- **Phase 2 deviation:** Role-based routing gate not yet implemented in `_layout.tsx`. Auth store and service complete.
- **Phase 3 deviation:** EmptyState + LoadingState components exist. Access Denied screen and Profile screen not yet built. Client portal route group `(client)/` not started.
- **Phase 4 deviation:** `useInsumosWithCache.ts` implements write-through Dexie cache. Create/edit screens (`insumos/create.tsx`, `insumos/[id].tsx`) not implemented.
- **Phase 6 deviation:** Quote Creator screen (`cotizaciones/create.tsx`) not implemented. Branching not implemented.
- **Phase 8 deviation:** User edit screen (`users/[id].tsx`) not implemented. Link Client screen not started.
- **Phase 10 deviation:** Dexie `syncQueue` table and `SyncQueueItem` interface defined. Sync engine (service, queue processing, conflict resolution) not implemented.

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation | Actual Outcome |
|---|---|---|---|---|
| Expo web does not support SQLite | Offline persistence broken | Medium | Fallback to IndexedDB via `localforage` or `idb` | **Risk materialized.** Used **Dexie.js** (IndexedDB wrapper) instead. Schema defined in `services/storage/database.ts` with 8 tables. |
| JWT refresh race condition | Multiple simultaneous 401s cause request storms | Medium | Axios interceptor queues requests during refresh (promise-based dedup) | **Mitigated.** Implemented in `services/api/client.ts` with `isRefreshing` flag and `failedQueue` array. |
| Sync conflicts accumulate | Users lose data on sync | Low | `ON CONFLICT DO NOTHING` first-write-wins; surface remaining conflicts in UI | **Not yet tested.** Sync engine not implemented. Queue schema (`syncQueue` table) is defined. |
| Stitch design tokens drift from implementation | App looks inconsistent | Medium | Document all tokens in code; visually verify against Stitch screenshots per phase | **Mitigated.** All tokens in `src/theme/` — colors, typography, spacing, shadows. No inline color literals. |
| Large offline queue causes slow startup | App feels unresponsive | Low | Process queue in background after render; limit to 50 items per sync batch | **Not yet applicable.** Sync engine not implemented. |
| Web PDF viewer limitations | PDF rendering inconsistent | Medium | Use browser-native `<iframe>` with PDF URL or `react-pdf` library | **Mitigated.** `<iframe>` in `cotizaciones/[id]/pdf.tsx` pointing to backend PDF endpoint. |
| expo-secure-store unavailable on web | Token storage broken | High | Use sessionStorage as web-native alternative | **Risk materialized & mitigated.** Moved to `sessionStorage` (tab-scoped, cleared on close). |
| expo-sqlite unavailable on web | Offline cache broken | High | Use IndexedDB via Dexie.js | **Risk materialized & mitigated.** Dexie.js with 8-table schema. Write-through cache pattern via React Query. |

---

## Dependencies to Add

### `apps/mobile/package.json` (Actual Implementation)

```json
{
  "name": "@proarq/mobile",
  "version": "0.0.1",
  "type": "module",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start --web",
    "build": "expo export --platform web",
    "test": "bun test",
    "lint": "biome check --write --unsafe src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-linking": "~7.0.0",
    "expo-constants": "~17.0.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.0",
    "react-native-web": "~0.19.0",
    "react-native-safe-area-context": "~5.0.0",
    "@react-navigation/native": "~7.0.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "zod": "4.4.3",
    "date-fns": "^4.0.0",
    "dexie": "^4.0.0",               // ← replaces expo-sqlite
    "@tanstack/react-query": "^5.0.0",
    "@proarq/core": "workspace:*"     // ← shared domain package
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "~18.3.0",
    "fake-indexeddb": "6.2.5",         // ← for IndexedDB tests
    "happy-dom": "20.9.0",
    "jsdom": "29.1.1",
    "typescript": "~5.6.0"
  }
}
```

**Not installed (removed from spec):**
- `expo-secure-store` (native-only, replaced by sessionStorage)
- `expo-file-system` (native-only)
- `expo-sqlite` (native-only, replaced by Dexie.js)
- `@react-native-community/netinfo` (not yet implemented)
- `react-native-svg` (not yet needed)
- `react-native-pdf` (replaced by `<iframe>`)
- `react-native-blob-util` (native-only)
- `uuid` (using built-in `crypto.randomUUID()`)

### `package.json` (root — extend workspaces)

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

> **Note:** No workspace change needed — `apps/*` already covers `apps/mobile`.

---

## Decisions Log

| # | Decision | Proposed Value | Status | Actual Implementation |
|---|---|---|---|---|
| D-M-01 | Expo target | Web only | ✅ Confirmed | Web-only (Expo web via Metro). No iOS/Android native builds. |
| D-M-02 | State management | Zustand + React Query | ✅ Implemented | Zustand ^5 for auth store + global state. TanStack React Query ^5 for server state caching. QueryClient: staleTime=5min, gcTime=30min. |
| D-M-03 | Offline DB | SQLite (`expo-sqlite`) | ✅ Changed | **IndexedDB via Dexie.js ^4.** SQLite is unavailable on web. Dexie provides promise-based API with 8 tables matching backend entities. |
| D-M-04 | HTTP client | Axios with interceptors | ✅ Implemented | Axios ^1.7 with request interceptor (JWT attach) and response interceptor (401 refresh with promise-deduplication queue). |
| D-M-05 | Routing | Expo Router (file-based) | ✅ Implemented | Expo Router ~4 with `(auth)/` and `(tabs)/` route groups. File-based routing in `src/app/`. |
| D-M-06 | Icon library | react-native-svg + custom SVGs | ❌ Skipped | Not installed. Using text/emoji fallbacks. SVG lib pending. |
| D-M-07 | PDF viewer | Browser-native `<iframe>` + download fallback | ✅ Implemented | `<iframe>` pointing to backend PDF endpoint (`GET /cotizaciones/:id/pdf`). No `react-native-pdf` dependency. |
| D-M-08 | Shared package | New `packages/mobile-core` or reuse `packages/core` | ✅ Ruled: reuse core | **Reusing `packages/core` directly.** No `packages/mobile-core` created. All entity types and Zod schemas imported from `@proarq/core`. |
| D-M-09 | CI/CD | None initially (same as backend) | ✅ As-proposed | No CI configured. |
| D-M-10 | Form validation | Zod (same schemas as backend) | ✅ Implemented | Zod 4.4.3 validation on forms, shared schemas importable from `@proarq/core/application/ports/in/`. |
| D-M-11 | Token storage | expo-secure-store | ❌ Changed | **sessionStorage** instead. `expo-secure-store` is native-only. Web uses `sessionStorage` (tab-scoped, cleared on close). |
| D-M-12 | Connectivity detection | `@react-native-community/netinfo` | ❌ Not yet | Pending implementation. Not yet installed. |
| D-M-13 | Sync engine | Sync service with offline queue | ❌ Not yet | Dexie `syncQueue` table schema defined (`services/storage/database.ts`). Sync orchestration not yet implemented. |
| D-M-14 | PDF caching | expo-file-system | ❌ Skipped | `expo-file-system` is native-only. Web uses direct `<iframe>` to backend URL. |
| D-M-15 | UUID generation | `crypto.randomUUID()` | ✅ Implemented | Browser-native `crypto.randomUUID()`. Polyfilled in tests via `global-setup.ts`. |

### Spec-to-Implementation Deviations

| Spec Statement | Actual | Impact |
|---|---|---|
| All 18 screens rendered | ~10 screens implemented | US-M-09 (APU Creator), US-M-10 (Quote Creator), US-M-12 (Version Compare), US-M-15 (Link Client), US-M-16 (Audit Logs) not yet built |
| SQLite via `expo-sqlite` | IndexedDB via Dexie.js | Web-compatible offline storage, different query syntax |
| `expo-secure-store` | sessionStorage | Tokens cleared on tab close, less secure but web-appropriate |
| `react-native-svg` for icons | Not installed | Using text/emoji as placeholders |
| Sync service implemented | Only schema defined | Offline queue structure exists, sync engine pending |
| Client Portal (S-15) implemented | Not implemented | CLIENTE/REPRESENTANTE role has no dedicated screens yet |
| Profile screen (S-07) | Not implemented | `profile.tsx` does not exist in file tree |
| Access Denied (S-18) | Not implemented | `access-denied.tsx` does not exist in file tree |

---

## File Manifest — Actual File Inventory

### Decision: No `packages/mobile-core`

The shared mobile package was **not created**. The mobile app imports domain types directly from `@proarq/core`:
- Entity types: `@proarq/core/domain/entities/*`
- Zod schemas: `@proarq/core/application/ports/in/*`
- Error classes: `@proarq/core/errors`

### `apps/mobile/src/` — Actual Created Structure

```
apps/mobile/src/
├── app/                            # Expo Router pages (10 screens implemented)
│   ├── _layout.tsx                 # Root layout: QueryClientProvider + ErrorBoundary
│   ├── (auth)/
│   │   ├── login.tsx               # S-01 Login
│   │   ├── forgot-password.tsx     # S-02 Forgot Password
│   │   └── verify-code.tsx         # S-03 Verify Code
│   ├── (tabs)/
│   │   ├── dashboard.tsx           # S-04 Dashboard
│   │   ├── insumos.tsx             # S-08 Insumos Catalog
│   │   ├── apus.tsx                # S-09 APU List
│   │   ├── cotizaciones.tsx        # S-13 Quote History
│   │   └── users.tsx               # S-05 User Directory (ADMIN)
│   ├── users/
│   │   └── create.tsx              # S-06 Create User (ADMIN)
│   ├── apus/
│   │   ├── create.tsx              # S-09 APU Creator
│   │   └── [id].tsx                # S-09 APU Detail/Edit
│   └── cotizaciones/
│       └── [id]/
│           ├── index.tsx            # S-14 Quote Detail
│           └── pdf.tsx              # S-14 PDF Viewer
│   # NOT IMPLEMENTED:
│   # - profile.tsx (S-07)
│   # - access-denied.tsx (S-18)
│   # - insumos/create.tsx, insumos/[id].tsx (S-08a)
│   # - cotizaciones/create.tsx (S-10)
│   # - cotizaciones/[id]/compare.tsx (S-11)
│   # - link-client.tsx (S-12)
│   # - projects/[id].tsx
│   # - (client)/ route group (S-15)
│
├── components/                     # UI components (9 implemented)
│   ├── ui/
│   │   ├── Button.tsx              # 3 variants: primary (Orange), secondary (Navy), ghost
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   │   # NOT IMPLEMENTED: Badge, SearchBar, FilterChip, ErrorState
│   ├── ErrorBoundary.tsx           # Route-level error boundary
│   ├── InsumoCard.tsx
│   └── CotizacionCard.tsx
│   # NOT IMPLEMENTED: ApuCard, QuoteStatusBadge, CostSummary
│   # NOT IMPLEMENTED: layout/ (Header, BottomNav, OfflineBanner, SyncStatusBadge)
│
├── config/
│   └── api.config.ts               # API_BASE_URL + timeouts
│
├── db/                             # (empty directory, reserved)
│
├── hooks/                          # React hooks (4 implemented)
│   ├── useInsumos.ts               # Basic useQuery wrapper
│   ├── useInsumosWithCache.ts      # useQuery + Dexie write-through
│   ├── useCotizaciones.ts          # useQuery with status filter
│   └── useDashboard.ts             # Aggregated dashboard query
│   # NOT IMPLEMENTED: useApus, useUsers, useProjects, usePagination, useRoleGuard
│
├── lib/
│   └── queryClient.ts              # QueryClient (staleTime=5min, gcTime=30min)
│
├── services/
│   ├── api/                        # 7 API service modules
│   │   ├── client.ts               # Axios + auth interceptors (JWT attach + 401 refresh)
│   │   ├── auth.api.ts             # login, forgot, reset, refresh
│   │   ├── insumos.api.ts          # list, getById, create, update, delete
│   │   ├── apus.api.ts             # list, getById, create, update, delete, add/removeInsumo
│   │   ├── cotizaciones.api.ts     # list, getById, create, update, branch
│   │   ├── users.api.ts            # list, getById, create, update, delete
│   │   ├── projects.api.ts         # list, getById
│   │   └── index.ts                # Barrel exports
│   ├── auth/
│   │   └── auth.service.ts         # login(), forgotPassword(), resetPassword(), logout()
│   └── storage/
│       ├── auth-storage.ts         # sessionStorage get/set/clear tokens
│       └── database.ts             # ProArqDatabase (Dexie) with 8 tables
│   # NOT IMPLEMENTED: sync/ (sync.service, sync-queue, conflict-resolver)
│
├── stores/                         # Zustand stores (1 store implemented)
│   ├── auth.store.ts               # user, token, isAuthenticated, login(), logout(), hasRole()
│   └── reset-store.ts              # Global store reset registry (for tests)
│
├── theme/                          # Design system tokens (5 files)
│   ├── colors.ts                   # Material 3 palette
│   ├── typography.ts               # Inter font scale (10 levels)
│   ├── spacing.ts                  # 4px-base scale
│   ├── shadows.ts                  # Ambient shadow presets
│   └── index.ts                    # Barrel exports
│
├── utils/
│   └── index.ts                    # Logger utility (error, warn, info)
│
└── __tests__/                      # 19 test files
    ├── global-setup.ts             # jsdom + fake-indexeddb + sessionStorage
    ├── test-wrapper.tsx            # createQueryWrapper()
    ├── test-helpers.ts             # resetMocks(), mockStorage
    ├── dom-mock.ts                 # Fallback minimal DOM mock
    ├── setup.ts                    # Re-exports
    ├── app/                        # 7 test files
    ├── components/                 # 6 test files
    ├── services/                   # 2 test files
    ├── stores/                     # 1 test file
    ├── db/                         # 1 test file
    └── theme/                      # 1 test file
```
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterChip.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorState.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── SyncStatusBadge.tsx
│   └── domain/
│       ├── InsumoCard.tsx
│       ├── ApuCard.tsx
│       ├── QuoteCard.tsx
│       ├── QuoteStatusBadge.tsx
│       ├── CostSummary.tsx
│       └── VersionDiff.tsx
│
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── insumos.api.ts
│   │   ├── apus.api.ts
│   │   ├── cotizaciones.api.ts
│   │   ├── users.api.ts
│   │   ├── projects.api.ts
│   │   ├── audit.api.ts
│   │   └── sync.api.ts
│   ├── sync/
│   │   ├── sync.service.ts
│   │   ├── sync-queue.ts
│   │   └── conflict-resolver.ts
│   ├── storage/
│   │   ├── database.ts
│   │   ├── auth-storage.ts
│   │   └── cache.service.ts
│   └── auth/
│       ├── auth.service.ts
│       └── token-manager.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useOnline.ts
│   ├── useSync.ts
│   ├── useInsumos.ts
│   ├── useApus.ts
│   ├── useCotizaciones.ts
│   ├── useUsers.ts
│   ├── useProjects.ts
│   ├── usePagination.ts
│   └── useRoleGuard.ts
│
├── stores/
│   ├── auth.store.ts
│   ├── sync.store.ts
│   ├── insumos.store.ts
│   ├── apus.store.ts
│   └── cotizaciones.store.ts
│
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   └── index.ts
│
├── utils/
│   ├── uuid.ts
│   ├── formatters.ts
│   ├── validators.ts
│   ├── cost-calculator.ts
│   └── role-utils.ts
│
└── config/
    ├── api.config.ts
    └── env.ts
```

---

**SPECIFICATION_LOCKED: mobile-app.spec.md - Waiting for User Approval**
