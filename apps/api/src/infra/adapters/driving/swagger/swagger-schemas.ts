// ---------------------------------------------------------------------------
// OpenAPI 3.0.3 — Component Schemas, Responses & Security Schemes
// Extracted from swagger.config.ts for SRP compliance
// ---------------------------------------------------------------------------

export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Ingrese su token JWT. Ejemplo: `valid-admin-jwt-token`',
  },
} as const;

export const schemas = {
  // -- User --
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      name: { type: 'string', example: 'Juan Pérez' },
      email: {
        type: 'string',
        format: 'email',
        example: 'juan@proarq.com',
      },
      role: {
        type: 'string',
        enum: ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'],
        example: 'ADMIN',
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },
  UserResponse: {
    type: 'object',
    properties: {
      data: { $ref: '#/components/schemas/User' },
    },
  },

  // -- Insumo --
  Insumo: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      codigo: { type: 'string', example: 'CEM-001' },
      nombre: {
        type: 'string',
        example: 'Cemento Portland Tipo I',
      },
      unidad: {
        type: 'string',
        enum: ['M3', 'KG', 'UND', 'GL'],
        example: 'KG',
      },
      costBase: { type: 'string', example: '12.50' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },
  InsumoResponse: {
    type: 'object',
    properties: {
      data: { $ref: '#/components/schemas/Insumo' },
    },
  },

  // -- APU --
  Apu: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      codigo: { type: 'string', example: 'APU-001' },
      nombre: { type: 'string', example: 'Excavación Manual' },
      tipo: { type: 'string', example: 'EXCAVACION' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },
  ApuResponse: {
    type: 'object',
    properties: {
      data: { $ref: '#/components/schemas/Apu' },
    },
  },
  ApuInsumo: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      apuId: { type: 'string', format: 'uuid' },
      insumoId: { type: 'string', format: 'uuid' },
      insumo: { $ref: '#/components/schemas/Insumo' },
      rendimiento: { type: 'string', example: '1.5' },
      desperdicio: { type: 'string', example: '0.05' },
    },
  },
  ApuDetailResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          codigo: { type: 'string' },
          nombre: { type: 'string' },
          tipo: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          insumos: {
            type: 'array',
            items: { $ref: '#/components/schemas/ApuInsumo' },
          },
        },
      },
    },
  },

  // -- Cotizacion --
  Cotizacion: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      codigo: { type: 'string', example: 'COT-001' },
      projectoId: { type: 'string', example: 'PROJ-001' },
      version: { type: 'integer', example: 1 },
      estado: {
        type: 'string',
        enum: ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA'],
        example: 'BORRADOR',
      },
      clienteId: {
        type: 'string',
        format: 'uuid',
        nullable: true,
      },
      factorAPercentage: { type: 'string', example: '15.00' },
      factorBPercentage: { type: 'string', example: '10.00' },
      profitMarginPercent: { type: 'string', example: '8.00' },
      totalCostDirect: { type: 'string', example: '15000.00' },
      totalAmount: { type: 'string', example: '20500.00' },
      createdBy: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },
  CotizacionItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      cotizacionId: { type: 'string', format: 'uuid' },
      apuId: { type: 'string', format: 'uuid' },
      apu: { $ref: '#/components/schemas/Apu' },
      cantidad: { type: 'string', example: '10.00' },
      calculatedCostDirect: { type: 'string', example: '1500.00' },
    },
  },
  CotizacionResponse: {
    type: 'object',
    properties: {
      data: { $ref: '#/components/schemas/Cotizacion' },
    },
  },
  CotizacionDetailResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          codigo: { type: 'string' },
          projectoId: { type: 'string' },
          version: { type: 'integer' },
          estado: { type: 'string' },
          clienteId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
          },
          factorAPercentage: { type: 'string' },
          factorBPercentage: { type: 'string' },
          profitMarginPercent: { type: 'string' },
          totalCostDirect: { type: 'string' },
          totalAmount: { type: 'string' },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CotizacionItem' },
          },
        },
      },
    },
  },

  // -- Audit Log --
  AuditLog: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tableName: { type: 'string', example: 'insumos' },
      recordId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      action: {
        type: 'string',
        enum: ['CREATE', 'UPDATE', 'DELETE'],
        example: 'UPDATE',
      },
      oldValues: { type: 'object', nullable: true },
      newValues: { type: 'object', nullable: true },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },

  // -- Proyecto --
  Proyecto: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
      codigo: { type: 'string', example: 'PROJ-001' },
      nombre: { type: 'string', example: 'Edificio Los Alerces' },
      descripcion: {
        type: 'string',
        example: 'Edificación multifamiliar de 10 pisos',
        nullable: true,
      },
      estado: {
        type: 'string',
        enum: ['PLANIFICACION', 'EN_EJECUCION', 'FINALIZADO', 'SUSPENDIDO'],
        example: 'PLANIFICACION',
      },
      clienteId: { type: 'string', format: 'uuid', nullable: true },
      createdBy: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  CreateProyectoInput: {
    type: 'object',
    required: ['codigo', 'nombre'],
    properties: {
      codigo: { type: 'string', example: 'PROJ-001' },
      nombre: { type: 'string', example: 'Edificio Los Alerces' },
      descripcion: { type: 'string', example: 'Edificación multifamiliar de 10 pisos' },
      estado: {
        type: 'string',
        enum: ['PLANIFICACION', 'EN_EJECUCION', 'FINALIZADO', 'SUSPENDIDO'],
        default: 'PLANIFICACION',
      },
      clienteId: { type: 'string', format: 'uuid' },
    },
  },
  UpdateProyectoInput: {
    type: 'object',
    properties: {
      nombre: { type: 'string', example: 'Edificio Los Alerces Modificado' },
      descripcion: { type: 'string', example: 'Nueva descripción para el proyecto' },
      estado: {
        type: 'string',
        enum: ['PLANIFICACION', 'EN_EJECUCION', 'FINALIZADO', 'SUSPENDIDO'],
      },
      clienteId: { type: 'string', format: 'uuid' },
    },
  },

  // -- Error Responses --
  ErrorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'Error message' },
    },
  },
  ValidationErrorDetail: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      path: { type: 'array', items: { type: 'string' } },
    },
  },
  ValidationErrorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'Validation failed' },
      details: {
        type: 'array',
        items: { $ref: '#/components/schemas/ValidationErrorDetail' },
      },
    },
  },

  // -- Sync --
  SyncPayload: {
    type: 'object',
    description: 'Payload de sincronización offline',
    properties: {
      insumos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            codigo: { type: 'string' },
            nombre: { type: 'string' },
            unidad: { type: 'string' },
            costBase: { type: 'string' },
          },
        },
      },
      apus: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            codigo: { type: 'string' },
            nombre: { type: 'string' },
            tipo: { type: 'string' },
          },
        },
      },
      cotizaciones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            codigo: { type: 'string' },
            projectoId: { type: 'string' },
          },
        },
      },
      apuInsumos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            apuCodigo: { type: 'string' },
            insumoCodigo: { type: 'string' },
            rendimiento: { type: 'string' },
            desperdicio: { type: 'string' },
          },
        },
      },
      cotizacionItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cotizacionCodigo: { type: 'string' },
            apuCodigo: { type: 'string' },
            cantidad: { type: 'string' },
          },
        },
      },
    },
  },
  SyncResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          accepted: { type: 'integer', example: 10 },
          conflicts: { type: 'integer', example: 2 },
        },
      },
    },
  },

  // -- Health --
  HealthResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ok', 'degraded'],
        example: 'ok',
      },
      timestamp: { type: 'string', format: 'date-time' },
      checks: {
        type: 'object',
        properties: {
          server: { type: 'string', example: 'ok' },
          database: { type: 'string', example: 'ok' },
        },
      },
    },
  },
} as const;

export const responses = {
  ValidationError: {
    description: 'Error de validación — datos de entrada inválidos',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ValidationErrorResponse',
        },
      },
    },
  },
  Unauthorized: {
    description: 'No autenticado — token faltante o inválido',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  Forbidden: {
    description: 'No autorizado — el rol no tiene permisos para esta acción',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  NotFound: {
    description: 'Recurso no encontrado',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  InternalError: {
    description: 'Error interno del servidor',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
} as const;
