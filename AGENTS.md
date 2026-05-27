# AGENTS.md — ProArq Repo Guide for OpenCode Sessions

> Only the facts an agent would likely miss without explicit help. When in doubt, omit.

---

## Package manager

- **Bun** only (lockfile: `bun.lock`). Never use `npm`/`pnpm`/`yarn` — they will break the workspace linking.
- `bun install` from repo root to install everything.

---

## Monorepo structure

Only **two packages** exist:

| Path | Name | Purpose |
|---|---|---|
| `packages/core` | `@proarq/core` | Domain entities, use cases, ports (pure TS, zero I/O deps) |
| `apps/api` | `@proarq/api` | Express 5 server — the only deployable artifact |

There is **no** `apps/web`, no Turborepo, no GraphQL, no Prisma. The README mentions Turbo but it is not configured — Bun workspaces alone manage the monorepo.

---

## Exact commands (run from repo root)

| Goal | Command |
|---|---|
| Install deps | `bun install` |
| Dev server (API) | `bun run --filter @proarq/api dev` |
| Run all tests | `bun run --filter @proarq/api test` |
| Run a single test file | `bun test apps/api/src/__test__/unit/auth-login.use-case.test.ts` |
| Run tests matching a name | `bun test --test-name-pattern "should reject"` |
| Build everything | `bun run --filter '*' build` |
| Lint + auto-fix | `bun run lint` |
| Format + write | `bun run format` |
| Type-check | `bun run typecheck` (if available) |
| Generate Drizzle migration | `bun run --filter @proarq/api db:generate` |
| Run pending migrations | `bun run --filter @proarq/api db:migrate` |
| Push schema (dev only) | `bun run --filter @proarq/api db:push` |
| Open Drizzle Studio | `bun run --filter @proarq/api db:studio` |
| Reseed test DB | `bun run --filter @proarq/api db:seed` |

### Test runner: `bun test` (not Jest)

- Tests live under `apps/api/src/__test__/` split into `unit/`, `integration/`, `middleware/`.
- Supertest is used for HTTP-level integration tests.
- **Critical quirk:** The `test` script in `apps/api/package.json` runs each integration test file **sequentially** with a database seed before each one. You cannot simply run `bun test apps/api/src/__test__/integration/` — each file depends on `seed.ts` having run first.
- `packages/core` has no tests currently (`bun test` there returns nothing).

---

## Environment & secrets

- Single `.env` file at repo **root** (not per-package). Loaded via `--env-file=../../.env` in every script.
- `.env.example` at root — copy to `.env` before any dev work.
- Both `apps/api/package.json` scripts and manual `bun test` invocations **need** `--env-file=../../.env` to pick up env vars.
- `seed.ts` and `migrate.ts` hardcode `DATABASE_URL_TEST=postgres://root:root@localhost:5432/proarq_test` as fallback.
- Missing `JWT_SECRET` (<32 chars) or `DATABASE_URL` will crash the API on startup (Zod validation in `infra/config/env.ts`).

---

## Drizzle ORM schemas

- Located at `apps/api/src/infra/adapters/driven/database/schema/` (one file per table, barrel in `index.ts`).
- Migrations at `apps/api/migrations/`.
- **Never edit generated migration files by hand** — regenerate with `db:generate`.
- The Drizzle Kit config (`apps/api/drizzle.config.ts`) uses `dialect: 'postgresql'` and reads `process.env.DATABASE_URL`.

---

## Swagger UI

- Served at `GET /` (root path), **not** at `/api/v1/docs`.
- Toggle off with `SWAGGER_ENABLED=false` in `.env`.
- JSON spec at `GET /api/v1/docs.json`.

---

## Architecture (minimal cheat-sheet)

- **Clean Architecture + Hexagonal** enforced by `.agents/rules/clean-hexagonal-architecture.md`:
  - `packages/core` — domain + application (zero framework knowledge)
  - `apps/api` — infrastructure (Express, Drizzle, Postgres)
  - Dependency rule: infra → application → domain. Never the reverse.
- **Naming convention:** `*.entity.ts`, `*.use-case.ts`, `*.port.ts`, `*.controller.ts`, `*.routes.ts`, `*.middleware.ts`, `*.schema.ts`, `*-<db>.repository.ts`.
- **Biome** (v2) is the linter+formatter. Config at `biome.json`: single quotes, semicolons always, 2-space indent, 100 line width, LF line endings.

---

## What does NOT exist (common traps)

| Thing | Status |
|---|---|
| GitHub Actions / CI workflow | ❌ not configured |
| pre-commit hooks / Husky | ❌ not configured |
| `apps/web` | ❌ only `apps/api` |
| Turborepo / Nx | ❌ README mentions Turbo but no `turbo.json` exists |
| GraphQL | ❌ REST-only (Express) |
| Prisma | ❌ Drizzle ORM instead |
| Jest / Vitest | ❌ Bun native `bun test` |

---

## `.agents/rules/` — instruction files agents must read

These five files contain architectural constraints that override generic instructions:

1. **`clean-hexagonal-architecture.md`** — Dependency Rule, layer responsibilities, file naming, anti-patterns
2. **`drizzle-schemas.md`** — Table/column naming conventions, barrel export, migration workflow
3. **`env-management.md`** — Single `.env` at root, `--env-file` pattern, Zod validation at startup
4. **`monorepo-architecture.md`** — `packages/` vs `apps/` boundary, import direction, workspace scoping
5. **`api-documentation.md`** — Swagger + Postman sync: every endpoint change must update both docs

Read them before making architectural changes.

---

## Useful one-liners

```bash
# Start fresh (clean + install + build)
bun run clean && bun install && bun run --filter '*' build

# Run only unit tests (skips integration — no DB seed needed)
bun test apps/api/src/__test__/unit/

# Reseed, then run ONE integration test
bun --env-file=.env apps/api/src/__test__/setup/seed.ts && bun --env-file=.env test apps/api/src/__test__/integration/cotizaciones.test.ts

# Check Biome without writing fixes (CI mode)
bun run lint:ci

# Add an internal workspace dependency
bun add @proarq/core@workspace:*
```

---

*Keep this file short and authoritative. When you discover a new gotcha that cost time to figure out, add a line in the appropriate section.*

---

## Mobile app (`apps/mobile`)

A React Native (Expo) web app that consumes the ProArq REST API for construction cost estimation.

### Exact commands (run from repo root)

| Goal | Command |
|---|---|
| Dev server (Mobile) | `bun run --filter @proarq/mobile dev` |
| Build for web | `bun run --filter @proarq/mobile build` |
| Run all mobile tests | `bun run --filter @proarq/mobile test` |
| Run a single test file | `bun test apps/mobile/src/__tests__/app/login.test.tsx` |
| Run tests matching a name | `bun test --test-name-pattern "should render"` |
| Lint mobile | `bun run --filter @proarq/mobile lint` |
| Type-check mobile | `bun run --filter @proarq/mobile typecheck` |

### Test runner: `bun test` (same as API)

- Tests live under `apps/mobile/src/__tests__/` split into `app/`, `components/`, `services/`, `stores/`, `db/`, `theme/`.
- `@testing-library/react` is used for component tests.
- `fake-indexeddb` + `jsdom` provide browser-like DOM and IndexedDB in the Bun runtime.
- Global test setup at `apps/mobile/src/__tests__/global-setup.ts` mocks DOM globals, `sessionStorage`, and `crypto.randomUUID()`.
- All Zustand stores auto-reset between tests via the `reset-store.ts` registry.

### Architecture notes (mobile-specific)

- **Target:** Web-only (Expo web via Metro bundler) — no iOS/Android native builds.
- **State management:** Zustand for global app state (auth, sync), TanStack React Query for server-state caching.
- **Offline storage:** IndexedDB via Dexie.js (not SQLite — SQLite is unavailable on web).
- **Routing:** Expo Router (file-based routing) with `(auth)/` and `(tabs)/` route groups.
- **API client:** Axios with request interceptor (JWT attachment) and response interceptor (401 → refresh → retry with promise-deduplication).
- **Authentication:** Tokens stored in `sessionStorage` (web-native, cleared on tab close).
- **Design system:** Centralized theme tokens in `src/theme/` (colors, typography, spacing, shadows) — no inline color literals.
- **Clean Architecture:** Imports entity types and Zod schemas from `packages/core` (`@proarq/core`), keeping domain logic shared with the backend.
- **Biome:** Mobile code must pass the same `bun run lint` as the rest of the monorepo.

### Directory structure (mobile)

```
apps/mobile/
├── app.json                     # Expo config (web target, Navy Blue splash)
├── bunfig.toml                  # Test preload → global-setup.ts
├── package.json                 # @proarq/mobile workspace package
├── tsconfig.json                # TypeScript config with path aliases
└── src/
    ├── app/                     # Expo Router pages (file-based routing)
    │   ├── _layout.tsx          # Root layout: QueryClientProvider + ErrorBoundary
    │   ├── (auth)/              # Unauthenticated routes
    │   │   ├── login.tsx        #   S-01 Login
    │   │   ├── forgot-password.tsx  # S-02 Forgot Password
    │   │   └── verify-code.tsx  #   S-03 Verify Code
    │   ├── (tabs)/              # Bottom tab navigator (internal roles)
    │   │   ├── dashboard.tsx    #   S-04 Dashboard
    │   │   ├── insumos.tsx      #   S-08 Insumos Catalog
    │   │   ├── apus.tsx         #   S-09 APU List
    │   │   ├── cotizaciones.tsx #   S-13 Quote History
    │   │   └── users.tsx        #   S-05 User Directory (ADMIN)
    │   ├── profile.tsx          # S-07 Edit Profile
    │   ├── access-denied.tsx    # S-18 Access Denied (planned)
    │   ├── users/               # ADMIN user management
    │   │   └── create.tsx       #   S-06 Create User
    │   ├── insumos/             # Insumo CRUD (planned)
    │   ├── apus/                # APU detail & creation
    │   │   ├── create.tsx       #   S-09 APU Creator
    │   │   └── [id].tsx         #   S-09 APU Detail/Edit
    │   ├── cotizaciones/        # Quote screens
    │   │   └── [id]/
    │   │       ├── index.tsx    #   S-14 Quote Detail
    │   │       └── pdf.tsx      #   S-14 PDF Viewer
    │   └── projects/            # Project detail (planned)
    ├── components/
    │   ├── ui/                  # Design system primitives
    │   │   ├── Button.tsx       #   3 variants: primary (Orange), secondary (Navy), ghost
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Table.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── LoadingState.tsx
    │   ├── ErrorBoundary.tsx    # Route-level crash resilience
    │   ├── InsumoCard.tsx
    │   └── CotizacionCard.tsx
    ├── config/
    │   └── api.config.ts        # API_BASE_URL, timeouts
    ├── db/                      # (reserved for Dexie database helpers)
    ├── hooks/                   # React hooks
    │   ├── useInsumos.ts        #   React Query wrapper
    │   ├── useInsumosWithCache.ts  # React Query + Dexie write-through
    │   ├── useCotizaciones.ts
    │   └── useDashboard.ts
    ├── lib/
    │   └── queryClient.ts       # TanStack QueryClient singleton
    ├── services/
    │   ├── api/                 # Axios-based API clients
    │   │   ├── client.ts        #   Axios instance + auth interceptors
    │   │   ├── auth.api.ts
    │   │   ├── insumos.api.ts
    │   │   ├── apus.api.ts
    │   │   ├── cotizaciones.api.ts
    │   │   ├── users.api.ts
    │   │   ├── projects.api.ts
    │   │   └── index.ts         #   Barrel exports
    │   ├── auth/
    │   │   └── auth.service.ts  # Login/logout orchestration
    │   └── storage/
    │       ├── auth-storage.ts  # sessionStorage token management
    │       └── database.ts      # Dexie.js IndexedDB schema (ProArqDatabase)
    ├── stores/                  # Zustand stores
    │   ├── auth.store.ts        #   User, tokens, isAuthenticated, hasRole()
    │   └── reset-store.ts       #   Global store reset registry (testing)
    ├── theme/                   # Design system tokens
    │   ├── colors.ts            #   Material 3 palette: Navy, Orange, surface tones
    │   ├── typography.ts        #   Inter font scale (displayLg → labelSm)
    │   ├── spacing.ts
    │   ├── shadows.ts
    │   └── index.ts
    ├── utils/
    │   └── index.ts            # Logger utility
    └── __tests__/              # Test suite
        ├── global-setup.ts     #   jsdom DOM + fake-indexeddb + sessionStorage
        ├── test-wrapper.tsx    #   createQueryWrapper() factory
        ├── test-helpers.ts     #   resetMocks(), mockStorage
        ├── dom-mock.ts         #   Minimal DOM mock (fallback)
        ├── setup.ts
        ├── app/                #   7 screen test files
        ├── components/         #   6 component test files
        ├── services/           #   2 service test files
        ├── stores/             #   1 store test file
        ├── db/                 #   1 database test file
        └── theme/              #   1 theme test file
```

### What does NOT exist (mobile traps)

| Thing | Status |
|---|---|
| `(client)/` route group (Client Portal S-15) | ❌ not implemented |
| Sync engine (sync-queue, sync-service, conflict-resolver) | ❌ not implemented |
| Version comparison screen (S-11) | ❌ not implemented |
| Insumo create/edit screens (`insumos/create.tsx`, `insumos/[id].tsx`) | ❌ not yet created |
| Project detail screen (`projects/[id].tsx`) | ❌ not yet created |
| Link client screen (S-12) | ❌ not implemented |
| Audit log viewer | ❌ not implemented |
| `expo-secure-store` | ❌ using sessionStorage (web-native) |
| `react-native-svg` | ❌ not installed |
| iOS/Android native builds | ❌ web-only |
| `expo-sqlite` | ❌ using Dexie.js/IndexedDB instead |

---

# Rules
**Lenguage:** Always response in spanish
