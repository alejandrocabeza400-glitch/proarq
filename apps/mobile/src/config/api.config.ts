const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const port = process.env.EXPO_PUBLIC_PORT || process.env.PORT || '8000';
  return `http://localhost:${port}/api/v1`;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_TIMEOUTS = {
  READ: 10000,
  WRITE: 15000,
  UPLOAD: 60000,
} as const;
