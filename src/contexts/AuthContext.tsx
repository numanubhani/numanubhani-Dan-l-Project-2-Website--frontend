import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: Record<string, string>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Fetch the current user profile ─────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me/');
      const profile = response.data;
      setUser({
        ...profile,
        avatar: profile.avatar_url || profile.avatar || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setUser(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  // On mount: restore session if token is stored
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const response = await api.post(
        '/auth/login/',
        { username: usernameOrEmail, password },
        { skipAuth: true } as any
      );

      const { token, user: userData } = response.data;
      if (!token) throw new Error('No token returned from server.');

      localStorage.setItem('auth_token', token);

      setUser({
        ...userData,
        avatar: userData.avatar_url || userData.avatar || '',
      });

      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error('Login error', error.response?.data);

      // Build a friendly error message from DRF field / non-field errors
      const data = error.response?.data;
      if (data) {
        if (typeof data === 'string') throw new Error(data);
        // DRF serializer errors come under non_field_errors or field names
        if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0)
          throw new Error(data.non_field_errors[0]);
        if (typeof data.non_field_errors === 'string') throw new Error(data.non_field_errors);
        if (data.detail) throw new Error(String(data.detail));
        // Fall back: grab first field error
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          throw new Error(Array.isArray(val) ? val[0] : String(val));
        }
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  // ─── Register ────────────────────────────────────────────────────────────────
  const register = async (data: Record<string, string>) => {
    try {
      // POST to /api/auth/register/ — no auth header needed
      await api.post('/auth/register/', data, { skipAuth: true } as any);
      // After registration, immediately log in to get a token
      await login(data.username, data.password);
    } catch (error: unknown) {
      const ax = error as { response?: { data?: unknown }; message?: string };

      // Check for an Axios response error first (DRF 400 validation errors)
      // AxiosError extends Error so we CANNOT use `instanceof Error` to distinguish
      if (ax?.response?.data) {
        const d = ax.response.data;
        if (typeof d === 'object' && d !== null) {
          const parts: string[] = [];
          for (const [, val] of Object.entries(d as Record<string, unknown>)) {
            if (Array.isArray(val)) parts.push((val as string[]).join(' '));
            else if (typeof val === 'string') parts.push(val);
          }
          throw new Error(parts.join(' ') || 'Registration failed. Please try again.');
        }
        if (typeof d === 'string') throw new Error(d);
      }

      // Re-throw plain errors (e.g. thrown by login() with a clean message)
      throw error;
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (_) {
      // Ignore errors — we always clear locally
    }
    localStorage.removeItem('auth_token');
    setUser(null);
    toast.success('Logged out successfully!');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
