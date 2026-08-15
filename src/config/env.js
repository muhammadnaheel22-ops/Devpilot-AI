const env = import.meta.env;
export const appEnv = {
  apiBaseUrl: env.VITE_API_BASE_URL || '/api',
};
