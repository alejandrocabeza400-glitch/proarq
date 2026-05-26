import type { ApiResponse } from './apus.api';
import client from './client';

export interface ProyectoQuery {
  nombre?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  clienteId?: string;
  clienteNombre?: string;
  createdAt: string;
  updatedAt: string;
}

type CreateProyectoPayload = Omit<Proyecto, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateProyectoPayload = Partial<Proyecto>;

export const proyectosApi = {
  list: async (query?: ProyectoQuery): Promise<ApiResponse<Proyecto[]>> => {
    const { data } = await client.get('/proyectos', { params: query });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<Proyecto>> => {
    const { data } = await client.get(`/proyectos/${id}`);
    return data;
  },
  create: async (payload: CreateProyectoPayload): Promise<ApiResponse<Proyecto>> => {
    const { data } = await client.post('/proyectos', payload);
    return data;
  },
  update: async (id: string, payload: UpdateProyectoPayload): Promise<ApiResponse<Proyecto>> => {
    const { data } = await client.put(`/proyectos/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/proyectos/${id}`);
  },
};
