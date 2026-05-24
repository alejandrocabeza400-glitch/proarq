import { responses, schemas, securitySchemes } from './swagger-schemas';

// ---------------------------------------------------------------------------
// OpenAPI 3.0.3 Specification — ProArq API
// Paths are defined here; schemas, responses, and UI setup are in
// swagger-schemas.ts and swagger-ui.ts respectively.
// ---------------------------------------------------------------------------

export const swaggerSpec: Record<string, unknown> = {
  openapi: '3.0.3',
  info: {
    title: 'ProArq API',
    version: '0.0.1',
    description:
      'API de gestión de presupuestos de obra — ProArq\n\n## Autenticación\nTodas las rutas protegidas requieren un token JWT en el header `Authorization: Bearer <token>`.',
  },
  servers: [{ url: 'http://localhost:8000', description: 'Local Development' }],

  paths: {
    // -- Health --
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint — verifica servidor y base de datos',
        operationId: 'healthCheck',
        security: [],
        responses: {
          '200': {
            description: 'Servicio saludable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '503': {
            description: 'Servicio degradado (base de datos no disponible)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },

    // -- Auth --
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión y obtener token JWT',
        operationId: 'login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@proarq.com' },
                  password: { type: 'string', format: 'password', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso — devuelve token JWT y datos del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string', description: 'JWT Access Token' },
                        refreshToken: { type: 'string', description: 'JWT Refresh Token' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            role: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refrescar token JWT expirado usando refresh token',
        operationId: 'refreshToken',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Token de refresco de sesión' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Refresco exitoso — devuelve nuevos tokens y datos del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string', description: 'Nuevo JWT Access Token' },
                        refreshToken: { type: 'string', description: 'Nuevo JWT Refresh Token' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            role: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar restablecimiento de contraseña',
        operationId: 'forgotPassword',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@proarq.com' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Correo de restablecimiento enviado (si el email existe)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'If the email exists, a reset link has been sent',
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecer contraseña usando token',
        operationId: 'resetPassword',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: {
                    type: 'string',
                    description: 'Reset token recibido por email',
                    example: 'reset-token-123',
                  },
                  newPassword: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    example: 'NewPassword123!',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Contraseña restablecida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Password reset successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    // -- Users --
    '/api/v1/users': {
      post: {
        tags: ['Users'],
        summary: 'Crear un nuevo usuario',
        operationId: 'createUser',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', maxLength: 255, example: 'Juan Pérez' },
                  email: { type: 'string', format: 'email', example: 'juan@proarq.com' },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    example: 'SecurePass123!',
                  },
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'],
                    default: 'CLIENTE',
                    description: 'Rol del usuario (por defecto CLIENTE)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuario creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['Users'],
        summary: 'Listar todos los usuarios',
        operationId: 'listUsers',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'name',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por nombre',
          },
          {
            name: 'email',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por email',
          },
          {
            name: 'role',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por rol',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, maximum: 100 },
            description: 'Elementos por página',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/pdf': {
      get: {
        tags: ['Users'],
        summary: 'Exportar usuarios a PDF',
        operationId: 'exportUsersPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'Archivo PDF con el listado de usuarios',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener un usuario por ID',
        operationId: 'getUser',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario',
          },
        ],
        responses: {
          '200': {
            description: 'Usuario encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar un usuario',
        operationId: 'updateUser',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 255, example: 'Juan Pérez Actualizado' },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'juan.actualizado@proarq.com',
                  },
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Usuario actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Eliminar un usuario',
        operationId: 'deleteUser',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del usuario',
          },
        ],
        responses: {
          '204': { description: 'Usuario eliminado — sin contenido' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // -- Insumos --
    '/api/v1/insumos': {
      post: {
        tags: ['Insumos'],
        summary: 'Crear un nuevo insumo (material/suministro)',
        operationId: 'createInsumo',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo', 'nombre', 'unidad', 'costBase'],
                properties: {
                  codigo: { type: 'string', maxLength: 20, example: 'CEM-001' },
                  nombre: { type: 'string', maxLength: 255, example: 'Cemento Portland Tipo I' },
                  unidad: { type: 'string', enum: ['M3', 'KG', 'UND', 'GL'], example: 'KG' },
                  costBase: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', example: '12.50' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Insumo creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsumoResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['Insumos'],
        summary: 'Listar todos los insumos',
        operationId: 'listInsumos',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'codigo',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por código',
          },
          {
            name: 'nombre',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por nombre',
          },
          {
            name: 'unidad',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por unidad',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, maximum: 100 },
            description: 'Elementos por página',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de insumos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Insumo' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/insumos/pdf': {
      get: {
        tags: ['Insumos'],
        summary: 'Exportar insumos a PDF',
        operationId: 'exportInsumosPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        responses: {
          '200': {
            description: 'Archivo PDF con el listado de insumos',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/insumos/{id}': {
      get: {
        tags: ['Insumos'],
        summary: 'Obtener un insumo por ID',
        operationId: 'getInsumo',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del insumo',
          },
        ],
        responses: {
          '200': {
            description: 'Insumo encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsumoResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Insumos'],
        summary: 'Actualizar un insumo',
        operationId: 'updateInsumo',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del insumo',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string', maxLength: 255, example: 'Cemento Premium Tipo I' },
                  unidad: { type: 'string', enum: ['M3', 'KG', 'UND', 'GL'], example: 'KG' },
                  costBase: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', example: '15.00' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Insumo actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsumoResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Insumos'],
        summary: 'Eliminar un insumo',
        operationId: 'deleteInsumo',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del insumo',
          },
        ],
        responses: {
          '204': { description: 'Insumo eliminado — sin contenido' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/insumos/bulk-upload': {
      post: {
        tags: ['Insumos'],
        summary: 'Carga masiva de insumos desde archivo CSV',
        operationId: 'bulkUploadInsumos',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo CSV con columnas: codigo, nombre, unidad, cost_base',
                  },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Resultado de la carga masiva',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        imported: {
                          type: 'integer',
                          description: 'Cantidad de registros importados',
                        },
                        skipped: { type: 'integer', description: 'Cantidad de registros omitidos' },
                        errors: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              row: { type: 'integer' },
                              errors: { type: 'array', items: { type: 'string' } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // -- APUs --
    '/api/v1/apus': {
      post: {
        tags: ['APUs'],
        summary: 'Crear un nuevo APU (Análisis de Precio Unitario)',
        operationId: 'createApu',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo', 'nombre', 'tipo'],
                properties: {
                  codigo: { type: 'string', maxLength: 20, example: 'APU-001' },
                  nombre: { type: 'string', maxLength: 255, example: 'Excavación Manual' },
                  tipo: { type: 'string', maxLength: 50, example: 'EXCAVACION' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'APU creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApuResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['APUs'],
        summary: 'Listar todos los APUs',
        operationId: 'listApus',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'codigo',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por código',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, maximum: 100 },
            description: 'Elementos por página',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de APUs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Apu' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/apus/pdf': {
      get: {
        tags: ['APUs'],
        summary: 'Exportar APUs a PDF',
        operationId: 'exportApusPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        responses: {
          '200': {
            description: 'Archivo PDF con el listado de APUs',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/apus/{id}': {
      get: {
        tags: ['APUs'],
        summary: 'Obtener un APU por ID con sus insumos asociados',
        operationId: 'getApu',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del APU',
          },
        ],
        responses: {
          '200': {
            description: 'APU encontrado con insumos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApuDetailResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['APUs'],
        summary: 'Actualizar un APU',
        operationId: 'updateApu',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del APU',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Excavación Manual - Actualizado',
                  },
                  tipo: { type: 'string', maxLength: 50, example: 'EXCAVACION' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'APU actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApuResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/apus/{id}/insumos': {
      post: {
        tags: ['APUs'],
        summary: 'Agregar un insumo a un APU',
        operationId: 'addApuInsumo',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del APU',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['insumoId', 'rendimiento'],
                properties: {
                  insumoId: {
                    type: 'string',
                    format: 'uuid',
                    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                  },
                  rendimiento: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', example: '1.5' },
                  desperdicio: {
                    type: 'string',
                    pattern: '^\\d+(\\.\\d+)?$',
                    default: '0',
                    example: '0.05',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Insumo agregado al APU',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/ApuInsumo' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/apus/{id}/insumos/{itemId}': {
      delete: {
        tags: ['APUs'],
        summary: 'Eliminar un insumo de un APU',
        operationId: 'removeApuInsumo',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del APU',
          },
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID del insumo asociado (ApuInsumo)',
          },
        ],
        responses: {
          '204': { description: 'Insumo eliminado del APU — sin contenido' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // -- Cotizaciones --
    '/api/v1/cotizaciones': {
      post: {
        tags: ['Cotizaciones'],
        summary: 'Crear una nueva cotización',
        operationId: 'createCotizacion',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectoId', 'codigo'],
                properties: {
                  projectoId: { type: 'string', maxLength: 50, example: 'PROJ-001' },
                  codigo: { type: 'string', maxLength: 50, example: 'COT-001' },
                  clienteId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID del cliente (opcional)',
                  },
                  items: {
                    type: 'array',
                    description: 'Items de la cotización',
                    items: {
                      type: 'object',
                      properties: {
                        apuId: { type: 'string', format: 'uuid' },
                        cantidad: { type: 'string', pattern: '^\\d+(\\.\\d+)?$' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Cotización creada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CotizacionResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['Cotizaciones'],
        summary: 'Listar todas las cotizaciones',
        operationId: 'listCotizaciones',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'projecto_id',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por ID de proyecto',
          },
          {
            name: 'estado',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por estado',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, maximum: 100 },
            description: 'Elementos por página',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de cotizaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Cotizacion' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/cotizaciones/pdf': {
      get: {
        tags: ['Cotizaciones'],
        summary: 'Exportar cotizaciones a PDF',
        operationId: 'exportCotizacionesPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        responses: {
          '200': {
            description: 'Archivo PDF con el listado de cotizaciones',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/cotizaciones/{id}': {
      get: {
        tags: ['Cotizaciones'],
        summary: 'Obtener una cotización por ID con sus items',
        operationId: 'getCotizacion',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la cotización',
          },
        ],
        responses: {
          '200': {
            description: 'Cotización encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CotizacionDetailResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Cotizaciones'],
        summary: 'Actualizar una cotización',
        operationId: 'updateCotizacion',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la cotización',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  estado: {
                    type: 'string',
                    enum: ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA'],
                    description: 'Estado de la cotización',
                  },
                  clienteId: { type: 'string', format: 'uuid', nullable: true },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        apuId: { type: 'string', format: 'uuid' },
                        cantidad: { type: 'string', pattern: '^\\d+(\\.\\d+)?$' },
                      },
                    },
                  },
                  factorAPercentage: {
                    type: 'string',
                    pattern: '^\\d+(\\.\\d{1,2})?$',
                    example: '15.00',
                  },
                  factorBPercentage: {
                    type: 'string',
                    pattern: '^\\d+(\\.\\d{1,2})?$',
                    example: '10.00',
                  },
                  profitMarginPercent: {
                    type: 'string',
                    pattern: '^\\d+(\\.\\d{1,2})?$',
                    example: '8.00',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Cotización actualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CotizacionResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Cotizaciones'],
        summary: 'Eliminar una cotización',
        operationId: 'deleteCotizacion',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la cotización',
          },
        ],
        responses: {
          '204': { description: 'Cotización eliminada — sin contenido' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/cotizaciones/{id}/branch': {
      post: {
        tags: ['Cotizaciones'],
        summary: 'Crear una nueva versión (branch) de una cotización existente',
        operationId: 'branchCotizacion',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la cotización original',
          },
        ],
        responses: {
          '201': {
            description: 'Nueva versión de cotización creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CotizacionResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/cotizaciones/{id}/pdf': {
      get: {
        tags: ['Cotizaciones'],
        summary: 'Descargar cotización en formato PDF',
        operationId: 'getCotizacionPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la cotización',
          },
        ],
        responses: {
          '200': {
            description: 'Archivo PDF de la cotización',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/cotizaciones/{id}/estado': {
      patch: {
        tags: ['Cotizaciones'],
        summary: 'Actualizar el estado de una cotización',
        operationId: 'updateCotizacionEstado',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de la cotización',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estado'],
                properties: {
                  estado: {
                    type: 'string',
                    enum: ['ENVIADA', 'APROBADA'],
                    example: 'APROBADA',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Estado actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CotizacionResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // -- Audit Logs --
    '/api/v1/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Listar registros de auditoría',
        operationId: 'listAuditLogs',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'tableName',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por nombre de tabla',
          },
          {
            name: 'recordId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por ID del registro',
          },
          {
            name: 'userId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por ID del usuario',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, maximum: 100 },
            description: 'Elementos por página',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de registros de auditoría',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AuditLog' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/audit-logs/pdf': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Exportar registros de auditoría a PDF',
        operationId: 'exportAuditLogsPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'Archivo PDF con el listado de registros de auditoría',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // -- Sync --
    '/api/v1/sincronizar': {
      post: {
        tags: ['Sync'],
        summary: 'Sincronizar datos offline (insumos, APUs, cotizaciones)',
        operationId: 'syncData',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Datos sincronizados',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SyncResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // -- Proyectos --
    '/api/v1/proyectos': {
      get: {
        tags: ['Proyectos'],
        summary: 'Listar todos los proyectos',
        operationId: 'listProyectos',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'codigo',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por código de proyecto',
          },
          {
            name: 'nombre',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por nombre de proyecto',
          },
          {
            name: 'estado',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtrar por estado del proyecto',
          },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': {
            description: 'Lista de proyectos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Proyecto' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Proyectos'],
        summary: 'Crear un nuevo proyecto (ADMIN, GERENTE_OBRA)',
        operationId: 'createProyecto',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProyectoInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Proyecto creado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proyecto' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/proyectos/pdf': {
      get: {
        tags: ['Proyectos'],
        summary: 'Exportar proyectos a PDF',
        operationId: 'exportProyectosPdf',
        security: [{ bearerAuth: [] }],
        'x-roles': ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'],
        responses: {
          '200': {
            description: 'Archivo PDF con el listado de proyectos',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/proyectos/{id}': {
      get: {
        tags: ['Proyectos'],
        summary: 'Obtener un proyecto por ID',
        operationId: 'getProyecto',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Proyecto encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proyecto' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { description: 'Proyecto no encontrado' },
        },
      },
      put: {
        tags: ['Proyectos'],
        summary: 'Actualizar un proyecto por ID (ADMIN, GERENTE_OBRA)',
        operationId: 'updateProyecto',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProyectoInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Proyecto actualizado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proyecto' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { description: 'Proyecto no encontrado' },
        },
      },
      delete: {
        tags: ['Proyectos'],
        summary: 'Eliminar un proyecto por ID (ADMIN, GERENTE_OBRA)',
        operationId: 'deleteProyecto',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Proyecto eliminado' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { description: 'Proyecto no encontrado' },
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // Components
  // -------------------------------------------------------------------------
  components: {
    securitySchemes,
    schemas,
    responses,
  },

  // Default security (applied to all endpoints unless overridden)
  security: [{ bearerAuth: [] }],
};
