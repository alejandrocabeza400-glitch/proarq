import type { ApiResponse } from './apus.api';
import client from './client';

export interface InsumoQuery {
  codigo?: string;
  nombre?: string;
  unidad?: string;
  page?: number;
  limit?: number;
}

export interface Insumo {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  costBase: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const insumosApi = {
  list: async (query?: InsumoQuery): Promise<ApiResponse<Insumo[]>> => {
    const { data } = await client.get('/insumos', { params: query });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<Insumo>> => {
    const { data } = await client.get(`/insumos/${id}`);
    return data;
  },
  create: async (
    payload: Omit<Insumo, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiResponse<Insumo>> => {
    const { data } = await client.post('/insumos', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Insumo>): Promise<ApiResponse<Insumo>> => {
    const { data } = await client.put(`/insumos/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/insumos/${id}`);
  },
};
