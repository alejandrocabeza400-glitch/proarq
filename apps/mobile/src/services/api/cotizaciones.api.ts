import type { ApiResponse } from './apus.api';
import client from './client';

export interface Cotizacion {
  id: string;
  codigo: string;
  proyectoId: string;
  proyectoNombre?: string;
  clienteNombre?: string;
  version: number;
  estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'REEMPLAZADA';
  montoTotal: string;
  utilidadPorcentaje: string;
  createdAt: string;
  updatedAt: string;
}

export interface CotizacionQuery {
  proyectoId?: string;
  estado?: string;
}

export const cotizacionesApi = {
  list: async (query?: CotizacionQuery): Promise<ApiResponse<Cotizacion[]>> => {
    const { data } = await client.get('/cotizaciones', { params: query });
    return data;
  },

  getById: async (id: string): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await client.get(`/cotizaciones/${id}`);
    return data;
  },

  create: async (payload: Partial<Cotizacion>): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await client.post('/cotizaciones', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Cotizacion>): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await client.patch(`/cotizaciones/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/cotizaciones/${id}`);
  },

  branch: async (id: string): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await client.post(`/cotizaciones/${id}/branch`);
    return data;
  },

  exportPdf: async (): Promise<Blob> => {
    const { data } = await client.get('/cotizaciones/pdf', { responseType: 'blob' });
    return data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const { data } = await client.get(`/cotizaciones/${id}/pdf`, { responseType: 'blob' });
    return data;
  },
};
