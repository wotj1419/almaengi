export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  APP_NAME: 'fe',
} as const;
