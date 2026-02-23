import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import {
  buildApiUrl,
  clearStoredAuthToken,
  getAuthHeaders,
  parseApiResponse,
  setStoredAuthToken,
} from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: unknown) => Promise<void>;
  register: (data: unknown) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: unknown) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const request = useCallback(
    async <T,>(
      url: string,
      options: RequestInit,
      onSuccess?: (data: T) => void
    ) => {
      try {
        const res = await fetch(buildApiUrl(url), {
          credentials: 'include',
          ...options,
        });

        const data = await parseApiResponse<T & { error?: string }>(res);

        if (!res.ok) {
          throw new Error(data?.error || 'Request failed');
        }

        onSuccess?.(data);
        return data;
      } catch (error: any) {
        throw new Error(error.message || 'Unexpected error');
      }
    },
    []
  );

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(buildApiUrl('/api/auth/me'), {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await parseApiResponse<{ user: User }>(res);
        setUser(data.user);
      } else if (res.status === 401 || res.status === 403) {
        clearStoredAuthToken();
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (credentials: unknown) => {
    await request<{ user: User; token?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      },
      (data) => {
        if (data.token) setStoredAuthToken(data.token);
        setUser(data.user);
        toast.success('Welcome back!');
      }
    );
  }, [request]);

  const register = useCallback(async (credentials: unknown) => {
    await request<{ user: User; token?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      },
      (data) => {
        if (data.token) setStoredAuthToken(data.token);
        setUser(data.user);
        toast.success('Account created successfully!');
      }
    );
  }, [request]);

  const logout = useCallback(async () => {
    try {
      await request(
        '/api/auth/logout',
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
    } finally {
      clearStoredAuthToken();
      setUser(null);
      toast.success('Logged out');
    }
  }, [request]);

  const updateProfile = useCallback(async (data: unknown) => {
    await request<{ user: User }>(
      '/api/auth/profile',
      {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
      },
      (response) => {
        setUser(response.user);
        toast.success('Profile updated');
      }
    );
  }, [request]);

  const deleteAccount = useCallback(async (password: string) => {
    await request<{ success: boolean }>(
      '/api/auth/account',
      {
        method: 'DELETE',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ password }),
      }
    );

    clearStoredAuthToken();
    try {
      localStorage.removeItem('companies');
      localStorage.removeItem('lists');
      localStorage.removeItem('savedSearches');
      localStorage.removeItem('activities');
      localStorage.removeItem('userFavorites');
      localStorage.removeItem('userNotes');
      localStorage.removeItem('thesis');
    } catch {
      // ignore storage failures
    }
    setUser(null);
    toast.success('Account deleted');
  }, [request]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      deleteAccount,
    }),
    [user, isLoading, login, register, logout, updateProfile, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
