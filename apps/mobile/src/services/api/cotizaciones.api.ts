import type { ApiResponse } from './apus.api';
import client from './client';

export interface CotizacionQuery {
  projecto_id?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface CotizacionItem {
  id: string;
  cotizacionId: string;
  apuId: string;
  cantidad: string;
  calculatedCostDirect: string;
  apuCodigo?: string;
  apuNombre?: string;
  createdAt: string;
}

export interface Cotizacion {
  id: string;
  projectoId: string;
  codigo: string;
  version: number;
  estado: string;
  clienteId?: string;
  totalCostDirect: string;
  factorAPercentage: string;
  factorBPercentage: string;
  profitMarginPercent: string;
  totalAmount: string;
  createdBy: string;
  proyectoNombre?: string;
  clienteNombre?: string;
  items?: CotizacionItem[];
  createdAt: string;
  updatedAt: string;
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
  downloadPdf: async (id: string): Promise<Blob> => {
    const { data } = await client.get(`/cotizaciones/${id}/pdf`, { responseType: 'blob' });
    return data;
  },
};
