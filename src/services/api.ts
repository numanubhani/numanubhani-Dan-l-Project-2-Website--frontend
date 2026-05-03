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
};
