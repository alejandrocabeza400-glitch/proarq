---
title: Clean Architecture + Hexagonal (Ports & Adapters)
description: Reglas arquitectónicas para todo el código del monorepo — Domain, Application e Infrastructure
agents: [build, devops, plan, spec]
---

# Clean Architecture + Hexagonal Architecture — Constitución arquitectónica

Este archivo define **cómo se estructura y escribe el código** en todo el monorepo. Es la autoridad máxima sobre decisiones de arquitectura. Léelo antes de crear, mover o modificar cualquier archivo. Aplica tanto a `packages/*` como a `apps/*`.

---

## 1. Principio fundamental — The Dependency Rule

> **Las dependencias apuntan SIEMPRE hacia adentro. El centro (Domain) no sabe que Express, Drizzle ni nada externo existe.**

```
  🧭 DIRECCIÓN DE DEPENDENCIAS
  ┌────────────────────────────────────────────────────────┐
  │  🖥️ INFRASTRUCTURE (Adapters)                          │
  │  Express, Drizzle, Postgres, Zod                       │
  │  Ubicación: apps/*/src/infra/                          │
  │           ↑                                            │
  │           │ importa                                     │
  ├────────────────────────────────────────────────────────┤
  │  🎯 APPLICATION (Use Cases / Ports)                    │
  │  Lógica de negocio, flujos de la aplicación            │
  │  Ubicación: packages/*/src/application/                │
  │           ↑                                            │
  │           │ importa                                     │
  ├────────────────────────────────────────────────────────┤
  │  🧬 DOMAIN (Entities / Value Objects)                  │
  │  Reglas de negocio puras, sin frameworks               │
  │  Ubicación: packages/*/src/domain/                     │
  └────────────────────────────────────────────────────────┘
```

**Reglas de dependencia:**
- **DOMAIN** → No importa NADA externo. Solo define interfaces, tipos y lógica pura en TypeScript.
- **APPLICATION** → Solo importa DOMAIN. No sabe de Express, Drizzle, HTTP, ni infraestructura.
- **INFRASTRUCTURE** → Importa APPLICATION y DOMAIN. Implementa los puertos (interfaces).

---

## 2. Responsabilidades de cada capa

### 🧬 Domain Layer — `packages/*/src/domain/`

**Responsabilidad:** Modelar el negocio sin importar frameworks, bases de datos ni HTTP.

| Qué contiene | Ejemplos |
|---|---|
| `entities/` | `user.entity.ts`, `order.entity.ts` — interfaces o clases puras del negocio |
| `value-objects/` | `email.ts`, `money.ts`, `slug.ts` — objetos inmutables con comportamiento |
| `errors/` | Errores de dominio personalizados |

**Reglas:**
- Zero dependencias externas. Solo TypeScript nativo.
- Las entidades contienen lógica de negocio que NO requiere I/O (cálculos, validaciones de reglas de negocio, transformaciones).
- Si una entidad necesita una operación de I/O (ej. "verificar si el email ya existe"), esa operación se define como interfaz en `application/ports/out/`.

### 🎯 Application Layer — `packages/*/src/application/`

**Responsabilidad:** Orquestar casos de uso del negocio. Define **QUÉ** hace el sistema, no **CÓMO**.

| Qué contiene | Ejemplos |
|---|---|
| `ports/in/` | `create-user.input.ts` — Input ports: Zod schemas + tipos inferidos |
| `ports/out/` | `user-repository.port.ts` — Output ports: interfaces que la aplicación necesita del exterior |
| `use-cases/` | `create-user.use-case.ts` — Casos de uso que orquestan una operación completa |

**Reglas:**
- Los use cases reciben dependencias por **constructor** (inyección de dependencias manual, sin contenedor mágico).
- Los use cases NUNCA reciben `req`, `res` de Express ni nada HTTP.
- Los use cases retornan datos planos, nunca manipulan `res` directamente.
- Los input ports (Zod schemas) definen la validación en la frontera — el use case confía en que el input ya fue validado.
- Un use case implementa UNA SOLA operación del negocio (Principio de Responsabilidad Única).

### 🔌 Infrastructure Layer — `apps/*/src/infra/`

**Responsabilidad:** Implementar los puertos definidos en Application. Conectar el mundo exterior (HTTP, DB, APIs) con los casos de uso.

| Carpeta | Contenido |
|---|---|
| `adapters/driving/` | **Primary adapters** — reciben input del exterior y llaman a use cases |
| `adapters/driving/controllers/` | Traducen HTTP → llamadas a use cases |
| `adapters/driving/routes/` | Definen rutas HTTP + wiring (Composition Root) |
| `adapters/driving/middleware/` | Cross-cutting: auth, validación, error handler, logging |
| `adapters/driven/` | **Secondary adapters** — implementan los output ports |
| `adapters/driven/repositories/` | Implementan interfaces de `ports/out/` usando Drizzle / SQL / APIs |
| `adapters/driven/database/` | Conexión a DB y schemas de Drizzle ORM |
| `config/` | Config de la aplicación (env vars validadas con Zod) |

**Reglas:**
- Los **controllers** traducen HTTP a llamadas a use cases. NO contienen lógica de negocio.
- Los **repositories** implementan las interfaces de `application/ports/out/`. Son los únicos que importan Drizzle/ORM.
- Las **routes** son el Composition Root: importan implementaciones concretas, las inyectan en use cases, y los conectan a controllers.
- La **config** se lee y valida AL ARRANQUE con Zod. No se importa desde core.

---

## 3. Convenciones de nomenclatura

### Archivos

```
{nombre}.{rol}.ts
```

| Rol | Sufijo | Ejemplo |
|---|---|---|
| Entidad de dominio | `.entity.ts` | `user.entity.ts` |
| Value Object | `.value-object.ts` | `email.value-object.ts` |
| Input Port (Zod schema) | `.input.ts` | `create-user.input.ts` |
| Output Port (interfaz) | `.port.ts` | `user-repository.port.ts` |
| Caso de uso | `.use-case.ts` | `create-user.use-case.ts` |
| Controller | `.controller.ts` | `user.controller.ts` |
| Middleware | `.middleware.ts` | `auth.middleware.ts` |
| Routes | `.routes.ts` | `user.routes.ts` |
| Repository (impl) | `.repository.ts` | `postgres-user.repository.ts` |
| Schema Drizzle | `.schema.ts` | `user.schema.ts` |

### Importación

```typescript
// ✅ CORRECTO — infra importa application y domain
import { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import type { UserRepository } from '@proarq/core/application/ports/out/user-repository.port';

// ❌ INCORRECTO — domain/application NO deben importar de infra
// import { db } from 'apps/api/src/infra/...'; // PROHIBIDO
```

### Patrón de implementación

| Capa | Patrón recomendado | Razón |
|---|---|---|
| Domain | Interfaces o clases | Encapsular comportamiento de negocio |
| Application (use cases) | Clases | Inyección de dependencias por constructor |
| Application (ports) | Interfaces + Zod schemas | Definir contratos |
| Infrastructure (controllers) | Funciones factory | Simples, sin estado, reciben el use case por parámetro |
| Infrastructure (repositories) | Objetos literales o clases | Implementan la interfaz del port |

---

## 4. Flujo de una petición

```
HTTP Request
  │
  ▼
┌────────────────────────────────────────────────────────────┐
│  ROUTES (driving/routes/)                                  │
│  • Define HTTP method + path                               │
│  • Aplica middleware (validate, auth, etc.)                │
│  • Composition Root: instancia use cases y repos           │
├────────────────────────────────────────────────────────────┤
│  MIDDLEWARE (driving/middleware/)                          │
│  • validate() → parsea req.body con Zod                    │
│  • errorHandler() → captura errores, responde JSON         │
├────────────────────────────────────────────────────────────┤
│  CONTROLLER (driving/controllers/)                         │
│  • Extrae datos del request (ya validados)                 │
│  • Llama al caso de uso con datos planos                   │
│  • Formatea la respuesta HTTP                              │
├────────────────────────────────────────────────────────────┤
│  USE CASE (application/use-cases/) [en @proarq/core]       │
│  • Aplica reglas de negocio                                │
│  • Llama a los puertos de salida (interfaces)              │
│  • Retorna datos, nunca responde HTTP                      │
├────────────────────────────────────────────────────────────┤
│  REPOSITORY (driven/repositories/)                         │
│  • Implementa la interfaz del puerto de salida             │
│  • Ejecuta queries con Drizzle ORM                         │
│  • Retorna entidades del dominio                           │
└────────────────────────────────────────────────────────────┘
  │
  ▼
Database
```

---

## 5. Anti-patrones — Lo que NO se debe hacer

| Anti-patrón | Por qué es malo | Solución |
|---|---|---|
| Controller pasamanos (solo llama a service sin transformar nada) | Capa inútil | El controller debe traducir HTTP → datos planos, o fusionarlo con la ruta |
| Service/UseCase que recibe `req`/`res` de Express | Acopla lógica a HTTP | El use case recibe objetos planos; controller maneja req/res |
| Use case que importa Drizzle o `db` directamente | Viola Dependency Rule | El use case depende de una interfaz en `ports/out/` |
| Lógica de negocio en middleware | Middleware debe ser cross-cutting (auth, log, validación) | Mover la lógica a un use case |
| Repositorio que retorna tipos de Drizzle (ej. `typeof db.select(...)`) | Filtra tipos de infraestructura al dominio | Mapear siempre a la entidad del dominio |
| Import cíclico entre use cases | Dependencia cruzada | Extraer lógica compartida a un tercer use case o a domain |
| DTOs de validación en la API en lugar de en core | La definición de input válido debe estar con el caso de uso | Los Zod schemas van en `application/ports/in/` dentro de `@proarq/core` |

---

## 6. Ubicación de Drizzle Schemas

Los schemas de Drizzle viven en la capa de infraestructura, DENTRO del adapter driven de base de datos:

```
apps/<app>/src/infra/adapters/driven/database/schema/
├── index.ts              → Barrel
├── user.schema.ts        → Tabla users
└── ...                   → Nuevas tablas aquí
```

**Reglas (heredadas de drizzle-schemas.md):**
- Cada tabla en su propio archivo `{entidad}.schema.ts`
- Named exports (nunca default exports)
- camelCase para TS, snake_case para nombres DB
- Barrel en `index.ts` con orden alfabético
- Relaciones entre tablas: import directo del schema vecino
- Circular dependencies: usar archivo de `relations` separado

> ⚠️ La ruta anterior `apps/api/src/db/schema/` ya NO existe. Usar siempre `infra/adapters/driven/database/schema/`.

---

## 7. Checklist para Code Review

Antes de aprobar cualquier PR, verificar:

- [ ] ¿Código en `packages/*/src/domain/` importa algo de infraestructura? → ❌ DENEGADO
- [ ] ¿Código en `packages/*/src/application/` importa algo de `apps/`? → ❌ DENEGADO
- [ ] ¿Los controladores reciben `req`/`res`? → ✅ (es su trabajo)
- [ ] ¿Los use cases reciben `req`/`res`? → ❌ DENEGADO
- [ ] ¿Los repositories implementan interfaces de `ports/out/`? → ✅
- [ ] ¿Las rutas hacen wiring (instancian dependencias)? → ✅
- [ ] ¿El `app.ts` está separado del `index.ts`? → ✅ (si no, refactorizar)
- [ ] ¿El error handler está registrado en `app.use()`? → ✅

---

## 8. Resumen rápido (30 segundos)

```
┌──────────────────────────────────────────────────────────┐
│  ¿Nuevo archivo? ¿Dónde va?                              │
│                                                          │
│  Entidad / Value Object del negocio  →  packages/*/domain/│
│  Caso de uso / Puerto / Schema Zod   →  packages/*/application/ │
│  Controller / Routes / Middleware     →  apps/*/driving/   │
│  Repository / DB schema / API call    →  apps/*/driven/    │
│  Config de la app (env vars)          →  apps/*/config/    │
│                                                          │
│  Regla de oro:                                           │
│  ┌─ domain ───→ nada (zero deps externas)                │
│  ├─ application → solo domain                            │
│  └─ infra ─────→ application + domain + frameworks ✅     │
│                                                          │
│  Los frameworks (Express, Drizzle) solo existen          │
│  en infra/. El core no sabe que existen.                 │
└──────────────────────────────────────────────────────────┘
```

---

> **Este archivo es la autoridad máxima en decisiones arquitectónicas. Si contradice a otro rule file, este tiene prioridad.**
