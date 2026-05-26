import type { ApiResponse } from './apus.api';
import client from './client';

export interface UserQuery {
  name?: string;
  email?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export const usersApi = {
  list: async (query?: UserQuery): Promise<ApiResponse<User[]>> => {
    const { data } = await client.get('/users', { params: query });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const { data } = await client.get(`/users/${id}`);
    return data;
  },
  create: async (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<ApiResponse<User>> => {
    const { data } = await client.post('/users', payload);
    return data;
  },
  update: async (id: string, payload: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await client.put(`/users/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },
};
