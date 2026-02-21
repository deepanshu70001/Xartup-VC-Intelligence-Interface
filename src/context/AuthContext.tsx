import React, { createContext, useContext, useState, useEffect } from 'react';
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
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
      }
    } catch (error) {
      console.error('Auth check failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any) => {
    const res = await fetch(buildApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const data = await parseApiResponse<{ user?: User; token?: string; error?: string }>(res);

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }
    setUser(data.user);
    toast.success('Welcome back!');
  };

  const register = async (credentials: any) => {
    const res = await fetch(buildApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const data = await parseApiResponse<{ user?: User; token?: string; error?: string }>(res);

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }
    setUser(data.user);
    toast.success('Account created successfully!');
  };

  const logout = async () => {
    await fetch(buildApiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    clearStoredAuthToken();
    setUser(null);
    toast.success('Logged out');
  };

  const updateProfile = async (data: any) => {
    const res = await fetch(buildApiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const responseData = await parseApiResponse<{ user?: User; error?: string }>(res);

    if (!res.ok) {
      throw new Error(responseData.error || 'Update failed');
    }

    setUser(responseData.user);
    toast.success('Profile updated');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
