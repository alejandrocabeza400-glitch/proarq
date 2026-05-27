import client from './client';

export interface ApuQuery {
  codigo?: string;
  nombre?: string;
  tipo?: string;
  page?: number;
  limit?: number;
}

export interface ApuItem {
  id: string;
  insumoId: string;
  insumoNombre: string;
  rendimiento: string;
  desperdicio: string;
  unitPriceSnapshot: string;
}

export interface Apu {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  createdBy: string;
  items?: ApuItem[];
  itemsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export const apusApi = {
  list: async (query?: ApuQuery): Promise<ApiResponse<Apu[]>> => {
    const { data } = await client.get('/apus', { params: query });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<Apu>> => {
    const { data } = await client.get(`/apus/${id}`);
    return data;
  },
  create: async (payload: Pick<Apu, 'codigo' | 'nombre' | 'tipo'>): Promise<ApiResponse<Apu>> => {
    const { data } = await client.post('/apus', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Apu>): Promise<ApiResponse<Apu>> => {
    const { data } = await client.put(`/apus/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/apus/${id}`);
  },
  addInsumo: async (apuId: string, payload: Partial<ApuItem>): Promise<ApiResponse<ApuItem>> => {
    const { data } = await client.post(`/apus/${apuId}/insumos`, payload);
    return data;
  },
  removeInsumo: async (apuId: string, itemId: string): Promise<void> => {
    await client.delete(`/apus/${apuId}/insumos/${itemId}`);
  },
  exportPdf: async (): Promise<Blob> => {
    const { data } = await client.get('/apus/pdf', { responseType: 'blob' });
    return data;
  },
};
