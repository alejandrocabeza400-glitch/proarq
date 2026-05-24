---
title: Environment Variable Management
description: Reglas para el manejo de variables de entorno globales con --env-file
agents: [build, devops, plan, spec]
---

# Environment Variable Management — Gestión de variables de entorno

### Decisión: `.env` GLOBAL en la raíz del monorepo

- Un solo `.env` en la raíz, NO un `.env` por app/package
- Se carga explícitamente con `bun --env-file=../../.env` en cada script
- Esto evita duplicación cuando múltiples apps comparten vars (DB, cloud, etc.)

### Por qué NO per-project `.env`

1. **Duplicación** — Si 3 apps usan `DATABASE_URL`, tendrías que copiarlo 3 veces
2. **Deriva de configuración** — Es fácil olvidar actualizar un `.env` de una app
3. **Onboarding lento** — Nuevo dev tiene que crear N archivos `.env`

### Reglas de uso

- El `.env` está en `.gitignore` — no se versiona
- Se versiona `.env.example` como plantilla
- TODOS los scripts que necesiten env vars deben prefijarse con `bun --env-file=../../.env`
- Esto incluye: dev, start, db:generate, db:migrate, db:push, db:studio
- Las apps leen de `Bun.env` (o `process.env`) sin configuración adicional

### Ejemplo en `package.json`

```json
{
  "scripts": {
    "dev": "bun --env-file=../../.env --watch src/index.ts",
    "db:migrate": "bun --env-file=../../.env drizzle-kit migrate"
  }
}
```

### Consideraciones

- El path `../../.env` asume que la app está en `apps/<name>/`. Si la estructura del monorepo cambia, actualizar los paths.
- Para migrations en CI/CD, pasar `DATABASE_URL` como env var del sistema (tiene prioridad sobre `--env-file`).
- Zod valida y tipa todas las variables al arranque mediante `envSchema.parse(Bun.env)`. Si falta una var obligatoria, la app falla al iniciar con un error claro.
- `NODE_ENV` controla comportamientos como la inclusión del stack trace en errores (solo en development).
