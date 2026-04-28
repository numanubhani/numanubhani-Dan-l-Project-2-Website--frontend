import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, oauthApi } from '../services/api';
import { User } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me/');
      const profile = response.data;
      setUser({
        ...profile,
        avatar: profile.avatar || profile.avatar_url || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', username);
      params.append('password', password);
      params.append('client_id', 'vpulse_frontend_client');
      // Secret is optional for public clients, but our app config might require it depending on setup.
      // We set client_type = PUBLIC in the script, so we might not need the secret here.
      // params.append('client_secret', 'vpulse_frontend_secret_key_123');

      const response = await oauthApi.post('/token/', params);
      
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        await fetchProfile();
        toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      console.error('Login error', error.response?.data);
      throw new Error(error.response?.data?.error_description || 'Login failed. Please check your credentials.');
    }
  };

  const register = async (data: any) => {
    try {
      // Custom register endpoint expects json
      await api.post('/auth/register/', data);
      
      // Auto-login after successful registration
      await login(data.username, data.password);
    } catch (error: any) {
      console.error('Registration error', error.response?.data);
      throw new Error(error.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.success('Logged out successfully!');
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
