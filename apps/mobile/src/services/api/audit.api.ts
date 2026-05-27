import type { ApiResponse } from './apus.api';
import client from './client';

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string | null;
  userEmail?: string;
  userName?: string;
  dataHistory: any;
  createdAt: string;
}

export const auditApi = {
  list: async (params?: Record<string, string>): Promise<ApiResponse<AuditLog[]>> => {
    const res = await client.get<ApiResponse<AuditLog[]>>('/audit-logs', { params });
    return res.data;
  },
  
  exportPdf: async () => {
    const res = await client.get('/audit-logs/pdf', { responseType: 'blob' });
    return res.data;
  }
};
