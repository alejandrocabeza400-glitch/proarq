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


# Rules
**Lenguage:** Always write in English, even if the original question is in Spanish. This ensures consistency and accessibility for all agents.
