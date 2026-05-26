import client from './client';

export interface AnalyticsStats {
  totalCotizaciones: number;
  proyectosActivos: number;
  totalInsumos: number;
  montoTotalAPU: string;
  usuariosActivos?: number;
}

export const analyticsApi = {
  getStats: async (): Promise<AnalyticsStats> => {
    const { data } = await client.get('/analytics');
    return data.data;
  },
};
