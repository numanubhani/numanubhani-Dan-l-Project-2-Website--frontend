import axios from 'axios';

const DEPLOYED_BACKEND = 'http://177.7.46.7';

// In DEV, we use the Vite proxy (empty string). In PROD, we use the deployed URL.
const BASE_URL = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV ? '' : DEPLOYED_BACKEND;

/**
 * Utility to fix absolute URLs returned by the backend that might 
 * incorrectly point to localhost:8000 in production.
 */
export const fixUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('blob:')) return url;
  if ((import.meta as unknown as { env: { DEV: boolean } }).env.DEV) return url;
  // Replace localhost:8000 with the actual deployed domain if found
  if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, DEPLOYED_BACKEND);
  }
  return url;
};

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach DRF Token auth header
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
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

// Handle HTML error pages and 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent raw Nginx HTML error pages (e.g. 502 Bad Gateway) from reaching the UI
    if (error.response && typeof error.response.data === 'string') {
      const dataStr = error.response.data.trim().toLowerCase();
      if (dataStr.startsWith('<html') || dataStr.startsWith('<!doctype')) {
        error.response.data = `Server Error (${error.response.status}). The backend service is currently down or unreachable.`;
      }
    }

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

// ─── Event Feed API helpers ──────────────────────────────────────────────────
import type { FeedEvent, ChallengeEvent } from '../types';

export const eventApi = {
  /** Unified feed of challenges + predictions. Pass type = 'challenge'|'prediction'|'' for All */
  getFeed: (type: 'challenge' | 'prediction' | '' = '') =>
    api.get<FeedEvent[]>('/events/feed/', { params: type ? { type } : undefined }),

  /** Sponsor a challenge event */
  sponsorChallenge: (eventId: string, amount: number, side: 'yes' | 'no' | 'sponsor') =>
    api.post<{ message: string; new_balance: string; event: ChallengeEvent }>(
      `/events/challenges/${eventId}/sponsor/`,
      { amount, side }
    ),

  /** Vote on a prediction market (existing endpoint, added for event feed use) */
  votePrediction: (marketId: string, side: 'yes' | 'no', amount?: number) =>
    api.post(`/markets/${marketId}/vote/`, { side, amount }),

  /** Create a new challenge event */
  createChallenge: (formData: FormData) =>
    api.post<ChallengeEvent>('/events/challenges/', formData),

  /** Create a new prediction market */
  createPrediction: (formData: FormData) =>
    api.post('/markets/', formData),
};