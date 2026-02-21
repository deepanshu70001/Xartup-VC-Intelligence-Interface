import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { buildApiUrl, parseApiResponse } from '../lib/api';

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
        credentials: 'include',
      });
      if (res.ok) {
        const data = await parseApiResponse<{ user: User }>(res);
        setUser(data.user);
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

    const data = await parseApiResponse<{ user?: User; error?: string }>(res);

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
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

    const data = await parseApiResponse<{ user?: User; error?: string }>(res);

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
    toast.success('Account created successfully!');
  };

  const logout = async () => {
    await fetch(buildApiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    toast.success('Logged out');
  };

  const updateProfile = async (data: any) => {
    const res = await fetch(buildApiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
