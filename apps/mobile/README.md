# ProArq Mobile — React Native + Expo (Web)

A construction cost estimation mobile application that consumes the ProArq REST API. Built with **React Native (Expo)** targeting the **web platform** — part of the ProArq monorepo.

---

## What It Is

The ProArq mobile app lets construction professionals access budgets, supplies catalogs (insumos), unit price analyses (APUs), and quotes (cotizaciones) from their web browser. It role-gates UI for 5 RBAC roles (ADMIN, GERENTE_OBRA, DIRECTOR_OBRA, CLIENTE, REPRESENTANTE) and operates offline-first using IndexedDB caching.

---

## Quick Start

### Prerequisites

- **Bun** v1.x installed
- ProArq backend running at `http://localhost:8000` (or configure `src/config/api.config.ts`)

### Install

```bash
# From repo root
bun install
```

### Run Dev Server

```bash
# From repo root
bun run --filter @proarq/mobile dev
```

Opens Expo dev server at `http://localhost:8081`.

### Build for Production

```bash
bun run --filter @proarq/mobile build
```

Outputs static web files to `dist/`.

---

## Available Scripts

All commands run from repo root using `--filter`:

| Script | Command | Description |
|---|---|---|
| `dev` | `bun run --filter @proarq/mobile dev` | Start Expo web dev server |
| `build` | `bun run --filter @proarq/mobile build` | Build static web export |
| `test` | `bun run --filter @proarq/mobile test` | Run all tests |
| `lint` | `bun run --filter @proarq/mobile lint` | Fix lint with Biome |
| `typecheck` | `bun run --filter @proarq/mobile typecheck` | TypeScript check |

---

## Running Tests

### Run all tests

```bash
bun run --filter @proarq/mobile test
```

### Run a single test file

```bash
bun test apps/mobile/src/__tests__/app/login.test.tsx
```

### Run tests matching a name

```bash
bun test --test-name-pattern "should render"
```

### Test Architecture

- **Runner:** `bun test` (native, no Jest)
- **Component Testing:** `@testing-library/react`
- **DOM Simulation:** `jsdom` (JSDOM for browser-like DOM)
- **IndexedDB Simulation:** `fake-indexeddb` (auto-initialized in global setup)
- **Store Reset:** Zustand stores auto-reset between tests via `reset-store.ts` registry

Global setup (`src/__tests__/global-setup.ts`) runs before every test file, providing:
- jsdom DOM environment
- `sessionStorage` mock
- `crypto.randomUUID()` polyfill
- IndexedDB via `fake-indexeddb/auto`
- Zustand state cleanup via `afterEach`

---

## Architecture

### Layer Diagram

```
┌─────────────────────────────────┐
│  UI Layer                        │
│  Expo Router Pages (src/app/)   │
│  Reusable Components (src/comp.) │
├─────────────────────────────────┤
│  State Management                │
│  Zustand (global state)          │
│  React Query (server state)      │
├─────────────────────────────────┤
│  Service Layer                   │
│  API Client (Axios)              │
│  Sync Engine (planned)           │
│  Storage (Dexie.js + sessionStr)│
├─────────────────────────────────┤
│  Shared Domain (packages/core)   │
│  Entity types, Zod schemas       │
└─────────────────────────────────┘
```

### Key Patterns

| Pattern | Implementation |
|---|---|
| **API Client** | Axios with JWT request interceptor + 401 refresh response interceptor (promise-deduplicated) |
| **Auth** | JWT tokens in `sessionStorage` (web-native), cleared on tab close |
| **Offline Cache** | Dexie.js (IndexedDB) — write-through on API success, `placeholderData` for instant reads |
| **Global State** | Zustand stores for auth, per-domain stores as needed |
| **Server State** | TanStack React Query — 5min staleTime, 30min gcTime |
| **Routing** | Expo Router file-based routing with `(auth)/` and `(tabs)/` route groups |
| **Design Tokens** | Centralized theme in `src/theme/` — no inline color literals |

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Expo | ~52 | Mobile framework (web target) |
| Expo Router | ~4 | File-based routing |
| React Native | 0.76 | UI framework |
| React Native Web | ~0.19 | Web rendering |
| Zustand | ^5 | Global state management |
| TanStack React Query | ^5 | Server state + caching |
| Axios | ^1.7 | HTTP client |
| Dexie.js | ^4 | IndexedDB wrapper |
| Zod | 4.4.3 | Form validation |
| date-fns | ^4 | Date formatting |
| Biome | v2 (monorepo) | Linter + formatter |
| @testing-library/react | ^16 | Component testing |
| jsdom | ^29 | DOM simulation (tests) |
| fake-indexeddb | ^6 | IndexedDB simulation (tests) |

---

## Project Structure

```
apps/mobile/
├── app.json                        # Expo config (web platform, Navy splash)
├── bunfig.toml                     # Bun test config (preload global-setup)
├── package.json                    # @proarq/mobile workspace package
├── tsconfig.json                   # Path aliases: @/* → src/*
│
└── src/
    ├── app/                        # Expo Router pages (file-based routing)
    │   ├── _layout.tsx             # Root layout with QueryClient + ErrorBoundary
    │   ├── (auth)/                 # Unauthenticated screens
    │   │   ├── login.tsx           # S-01 Login
    │   │   ├── forgot-password.tsx # S-02 Forgot Password
    │   │   └── verify-code.tsx     # S-03 Verify Code
    │   ├── (tabs)/                 # Authenticated tab screens
    │   │   ├── dashboard.tsx       # S-04 Dashboard
    │   │   ├── insumos.tsx         # S-08 Insumos Catalog
    │   │   ├── apus.tsx            # S-09 APU List
    │   │   ├── cotizaciones.tsx    # S-13 Quote History
    │   │   └── users.tsx           # S-05 User Directory (ADMIN)
    │   ├── profile.tsx             # S-07 Edit Profile
    │   ├── access-denied.tsx       # S-18 Access Denied
    │   ├── insumos/                # (reserved for create/edit)
    │   ├── apus/
    │   │   ├── create.tsx          # APU create
    │   │   └── [id].tsx            # APU detail/edit
    │   ├── cotizaciones/
    │   │   └── [id]/
    │   │       ├── index.tsx       # Quote detail
    │   │       └── pdf.tsx         # PDF viewer
    │   ├── users/
    │   │   └── create.tsx          # User create (ADMIN)
    │   └── projects/               # (reserved for detail)
    │
    ├── components/
    │   ├── ui/                     # Design system primitives
    │   │   ├── Button.tsx          # 3 variants: primary, secondary, ghost
    │   │   ├── Card.tsx            # Surface card with bg shift
    │   │   ├── Input.tsx           # Ghost border, focus animation
    │   │   ├── Table.tsx           # Zebra-striped data table
    │   │   ├── EmptyState.tsx      # Empty state with icon + CTA
    │   │   └── LoadingState.tsx    # Skeleton/spinner
    │   ├── ErrorBoundary.tsx       # Route-level crash recovery
    │   ├── InsumoCard.tsx          # Insumo list card
    │   └── CotizacionCard.tsx      # Quote list card
    │
    ├── config/
    │   └── api.config.ts           # API_BASE_URL + timeout config
    │
    ├── db/                         # (reserved for Dexie helpers)
    │
    ├── hooks/                      # React Query hooks
    │   ├── useInsumos.ts           # Basic insumo query
    │   ├── useInsumosWithCache.ts  # Insumo query + Dexie write-through
    │   ├── useCotizaciones.ts      # Quote list query
    │   └── useDashboard.ts         # Aggregated dashboard data
    │
    ├── lib/
    │   └── queryClient.ts          # QueryClient singleton (5min stale, 30min gc)
    │
    ├── services/
    │   ├── api/                    # Axios-based API service modules
    │   │   ├── client.ts           # Axios instance + auth interceptors
    │   │   ├── auth.api.ts         # Login, forgot, reset, refresh
    │   │   ├── insumos.api.ts      # Insumos CRUD
    │   │   ├── apus.api.ts         # APUs CRUD + item management
    │   │   ├── cotizaciones.api.ts # Quotes CRUD + branch
    │   │   ├── users.api.ts        # Users CRUD (ADMIN)
    │   │   ├── projects.api.ts     # Projects list/get
    │   │   └── index.ts            # Barrel exports
    │   ├── auth/
    │   │   └── auth.service.ts     # Login/logout orchestration
    │   └── storage/
    │       ├── auth-storage.ts     # sessionStorage token management
    │       └── database.ts         # Dexie.js ProArqDatabase (8 tables)
    │
    ├── stores/                     # Zustand stores
    │   ├── auth.store.ts           # User, tokens, isAuthenticated, hasRole()
    │   └── reset-store.ts          # Global reset registry for tests
    │
    ├── theme/                      # Design system tokens
    │   ├── colors.ts               # Material 3 palette
    │   ├── typography.ts           # Inter font scale
    │   ├── spacing.ts              # 4px-base spacing scale
    │   ├── shadows.ts              # Ambient shadow presets
    │   └── index.ts                # Barrel exports
    │
    ├── utils/
    │   └── index.ts                # Logger utility (error, warn, info)
    │
    └── __tests__/                  # Test suite (19 files)
        ├── global-setup.ts         # jsdom + indexedDB + sessionStorage setup
        ├── test-wrapper.tsx        # createQueryWrapper() factory
        ├── test-helpers.ts         # resetMocks(), mockStorage helpers
        ├── dom-mock.ts             # Fallback minimal DOM mock
        ├── setup.ts                # Re-exports
        ├── app/                    # 7 screen tests
        ├── components/             # 6 component tests
        ├── services/               # 2 service tests
        ├── stores/                 # 1 store test
        ├── db/                     # 1 database test
        └── theme/                  # 1 theme test
```

---

## Environment Variables

The mobile app has no `.env` file — configuration is hardcoded in `src/config/api.config.ts`:

| Variable | Location | Default | Description |
|---|---|---|---|
| `API_BASE_URL` | `config/api.config.ts` | `http://localhost:8000/api/v1` | Backend base URL |
| `API_TIMEOUTS.READ` | `config/api.config.ts` | 10,000ms | Read request timeout |
| `API_TIMEOUTS.WRITE` | `config/api.config.ts` | 15,000ms | Write request timeout |
| `API_TIMEOUTS.UPLOAD` | `config/api.config.ts` | 60,000ms | Upload timeout |

Change these values in `src/config/api.config.ts` to point to a different backend.

---

## Design System

The app uses a **Material 3**-inspired design system defined in `src/theme/`:

- **Colors:** Navy Blue primary (`#1A2B45`), Construction Orange tertiary (`#F37021`), with full surface/error palette
- **Typography:** Inter font family, 10 levels from `displayLg` (48px) to `labelSm` (12px)
- **Spacing:** 4px base with xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)
- **Shadows:** Ambient shadows using on-surface tint (never pure black)

UI components in `src/components/ui/` consume these tokens exclusively.

---

## Offline Data Model (Dexie.js)

The `ProArqDatabase` class (`src/services/storage/database.ts`) manages 8 IndexedDB tables:

| Table | Backend Mirror | Key Indexes |
|---|---|---|
| `insumos` | `insumos_maestro` | `id, codigo, nombre, unidad` |
| `apus` | `apus` | `id, codigo, nombre` |
| `apuInsumos` | `apu_insumos` | `id, apuId, insumoId` |
| `cotizaciones` | `cotizaciones` | `id, codigo, estado, projectoId` |
| `cotizacionItems` | `cotizacion_items` | `id, cotizacionId, apuId` |
| `proyectos` | `proyectos` | `id, codigo, nombre, estado` |
| `users` | `users` | `id, name, email, role` |
| `syncQueue` | (local only) | `id, entity, status, createdAt` |

Every cached entity includes `_lastSyncedAt` (epoch ms) for TTL-based cache invalidation.

---

## What's Not Implemented

| Feature | Reason |
|---|---|
| **Sync Engine** | Pending — `POST /sincronizar` orchestration, queue processing, conflict resolution |
| **Client Portal** (S-15) | `(client)/` route group for CLIENTE/REPRESENTANTE role |
| **Version Compare** (S-11) | Side-by-side quote version diff |
| **Insumo Create/Edit** | `insumos/create.tsx` and `insumos/[id].tsx` |
| **Link Client** (S-12) | ADMIN screen to link clients to projects |
| **Audit Log Viewer** | ADMIN-only audit log query screen |
| **Project Detail** | `projects/[id].tsx` |
| **Push Notifications** | N/A (web target) |

---

## Related Documentation

- [Architecture Overview](/DESIGN.md) — Full system design including mobile
- [Mobile App Spec](/opencode/plans/mobile-app.spec.md) — Original specification
- [Mobile App Plan](/opencode/plans/mobile-app-plan.md) — Execution plan with phases
- [Research Notes](/opencode/plans/research-mobile-app.md) — API patterns and gotchas
- [AGENTS.md](/AGENTS.md) — Repo guide for OpenCode sessions

---

## License

Private — ProArq project.
