---
title: API Documentation — Swagger & Postman
description: Reglas obligatorias para mantener sincronizada la documentación de la API (Swagger + Postman) al crear o modificar endpoints
agents: [build, spec, plan, codeReview, qa]
---

# API Documentation — Sincronización Obligatoria de Swagger + Postman

Este archivo define **la regla de oro de la documentación de la API**: cada vez que se agrega, modifica o elimina un endpoint REST, **DEBEN actualizarse ambos archivos de documentación** simultáneamente.

---

## 1. Principio fundamental

> **"Endpoint nuevo o modificado → Swagger + Postman actualizados."**
> No existe un endpoint que esté en código pero no en la documentación.

Cada ruta definida en `apps/api/src/infra/adapters/driving/routes/*.routes.ts` debe tener su contraparte en:

1. **Swagger Spec** — `apps/api/src/infra/adapters/driving/swagger/swagger.config.ts`
2. **Postman Collection** — `apps/api/docs/postman.json`

---

## 2. Archivos a mantener sincronizados

| Documento | Ubicación | Propósito |
|---|---|---|
| **Routes (código fuente)** | `apps/api/src/infra/adapters/driving/routes/*.routes.ts` | Definición real del endpoint |
| **Swagger Spec** | `apps/api/src/infra/adapters/driving/swagger/swagger.config.ts` | Documentación OpenAPI 3.0.3 |
| **Swagger Schemas** | `apps/api/src/infra/adapters/driving/swagger/swagger-schemas.ts` | Schemas reutilizables (`$ref`) |
| **Swagger Test** | `apps/api/src/__test__/swagger.test.ts` | Verifica que los paths esperados existan |
| **Postman Collection** | `apps/api/docs/postman.json` | Colección Postman v2.1 para测试/testing manual |

---

## 3. Reglas obligatorias

### 3.1. Al agregar un NUEVO endpoint

- [ ] Crear/Modificar la ruta en `*.routes.ts`
- [ ] Agregar la definición del endpoint en `swagger.config.ts` (dentro del bloque `paths: {}`)
  - Incluir: `tags`, `summary`, `operationId`, `security`, `parameters` (path/query), `requestBody` (si aplica), y `responses`
  - Asignar roles con `'x-roles'` donde aplique
  - Si el endpoint requiere autenticación, incluir `security: [{ bearerAuth: [] }]`
- [ ] Si se necesita un nuevo schema o response, agregarlo en `swagger-schemas.ts`
- [ ] Agregar el nuevo endpoint en `apps/api/docs/postman.json`:
  - Ubicarlo dentro del `item[]` correspondiente (por grupo: Auth, Users, Insumos, APUs, Cotizaciones, etc.)
  - Usar `{{base_url}}` para la URL base
  - Usar variables (`{{variable}}`) para IDs y valores dinámicos
  - Incluir `headers` necesarios (Authorization, Content-Type, etc.)
  - Incluir `body` con ejemplo representativo si el método es POST, PUT o PATCH
- [ ] Si el test `swagger.test.ts` tiene una lista de `expectedPaths`, agregar el nuevo path allí

### 3.2. Al MODIFICAR un endpoint existente

- [ ] Actualizar la definición en `swagger.config.ts` (cambios en body, parámetros, respuestas, roles, etc.)
- [ ] Actualizar el request en `apps/api/docs/postman.json` (URL, headers, body, método)
- [ ] Si el test `swagger.test.ts` verifica algo específico del endpoint modificado, actualizarlo

### 3.3. Al ELIMINAR un endpoint

- [ ] Eliminar la definición de `swagger.config.ts`
- [ ] Eliminar el item de `apps/api/docs/postman.json`
- [ ] Si el schema ya no lo usa nadie más, limpiarlo de `swagger-schemas.ts`
- [ ] Si el path está en `expectedPaths` del test, eliminarlo

---

## 4. Guía rápida de ubicación en Postman

Los endpoints se organizan en grupos (folders) dentro de la colección Postman:

| Grupo Postman | Rutas incluidas |
|---|---|
| `Health` | `/api/v1/health` |
| `Auth` | `/api/v1/auth/*` |
| `Users` | `/api/v1/users*` |
| `Insumos` | `/api/v1/insumos*` |
| `APUs` | `/api/v1/apus*` |
| `Cotizaciones` | `/api/v1/cotizaciones*` |
| `Audit Logs` | `/api/v1/audit-logs` |
| `Sync` | `/api/v1/sincronizar` |
| `Projects` | `/api/v1/proyectos*` |

Si se agrega un grupo nuevo (ej. `/api/v1/nuevo-recurso*`), crear un nuevo folder en Postman.

---

## 5. Formato Postman — Convenciones

- **URL**: Siempre usar `{{base_url}}` como host, con path absolute: `{{base_url}}/api/v1/recurso/{{id}}`
- **Variables**: Usar `{{variable_name}}` para valores dinámicos (IDs, tokens). Si la variable no existe,agregarla en el array `variable[]` del root de la colección
- **Auth headers**: Incluir `Authorization: Bearer {{token}}` en los endpoints protegidos
- **Content-Type**: Incluir `Content-Type: application/json` donde el body sea JSON
- **Ejemplos**: El body `raw` debe contener un ejemplo realista y funcional
- **Query params**: Incluir parámetros opcionales con `"disabled": true`

---

## 6. Formato Swagger — Convenciones

- Usar `operationId` con nombre camelCase (ej. `createUser`, `listInsumos`)
- Usar `tags` agrupando por recurso (ej. `Users`, `Insumos`, `APUs`)
- Especificar roles con `'x-roles'` como array de strings
- Para endpoints con paginación, incluir parámetros query `page` (default: 1) y `limit` (default: 10, max: 100)
- Reutilizar schemas via `$ref` en lugar de definir tipos inline
- Los schemas van en `swagger-schemas.ts` y se importan en `swagger.config.ts`

---

## 7. Verificación

Después de agregar/modificar un endpoint, verificar:

```bash
# 1. La app arranca sin errores
bun run --filter @proarq/api dev

# 2. El JSON spec de Swagger es válido
curl http://localhost:8000/api/v1/docs.json | jq .

# 3. El test de Swagger pasa
bun test apps/api/src/__test__/swagger.test.ts

# 4. El JSON de Postman es válido
python3 -m json.tool apps/api/docs/postman.json > /dev/null && echo "Postman JSON válido"
```

---

## 8. Checklist para Code Review

- [ ] ¿Cada ruta nueva en `*.routes.ts` tiene su definición en `swagger.config.ts`?
- [ ] ¿Cada ruta nueva tiene su entrada en `apps/api/docs/postman.json`?
- [ ] ¿Los cambios en un endpoint existente se reflejan en ambos documentos?
- [ ] ¿El `operationId` en Swagger es único y descriptivo?
- [ ] ¿Los ejemplos en Swagger y Postman son realistas y funcionales?
- [ ] ¿Se agregaron las variables necesarias al `variable[]` del Postman?
- [ ] ¿El test `swagger.test.ts` está actualizado?

---

> **Esta regla es obligatoria. Pull Requests que agreguen o modifiquen endpoints sin actualizar Swagger y Postman serán rechazados.**
