import axios from 'axios';

const viteEnv = (import.meta as unknown as { env: { DEV: boolean; VITE_API_BASE_URL?: string } }).env;
const BASE_URL = viteEnv.DEV ? '' : viteEnv.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach DRF Token auth header
api.interceptors.request.use(
  (config) => {
    const skipAuth = (config as { skipAuth?: boolean }).skipAuth === true;
    const path = `${config.baseURL || ''}${config.url || ''}`.replace(/\/+/g, '/');
    const isPublicAuth = /\/auth\/(register|login)\/?(\?|$)/.test(path);
    if (skipAuth || isPublicAuth) {
      delete (config.headers as Record<string, unknown>)['Authorization'];
      return config;
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
      // DRF TokenAuthentication expects "Token <key>" (not "Bearer")
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hasToken = !!localStorage.getItem('auth_token');
      if (hasToken) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
