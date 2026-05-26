import axios from 'axios';
import { API_BASE_URL, API_TIMEOUTS } from '../../config/api.config';
import { authStorage } from '../storage/auth-storage';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUTS.READ,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
client.interceptors.request.use(async (config) => {
  const token = await authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with refresh dedup
let isRefreshing = false;
interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  const queue = [...failedQueue];
  failedQueue = [];
  for (const item of queue) {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token as string);
    }
  }
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<unknown>((resolve, reject) => {
          failedQueue.push({
            resolve: (token: unknown) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              client(originalRequest).then(resolve).catch(reject);
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await authStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        // Dynamic import to support testing (module mocking)
        const { authApi } = await import('./auth.api');
        const { data } = await authApi.refresh(refreshToken);
        const { accessToken, refreshToken: newRefresh } = data;
        await authStorage.setTokens(accessToken, newRefresh);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await authStorage.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default client;
