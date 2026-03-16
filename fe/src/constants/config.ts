export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  APP_NAME: '알맹이',
} as const;
