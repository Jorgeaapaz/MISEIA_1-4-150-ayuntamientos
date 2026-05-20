'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SessionTokenPayload, ConfigSede } from '@/lib/types';

interface AuthUser extends SessionTokenPayload {
  name?: string;
}

interface GlobalContextType {
  user: AuthUser | null;
  token: string | null;
  configSede: ConfigSede | null;
  loading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  refreshSede: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [configSede, setConfigSede] = useState<ConfigSede | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSede = async () => {
    try {
      const res = await fetch('/api/sede');
      if (res.ok) {
        const data = await res.json();
        setConfigSede(data);
      }
    } catch {
      // sede config optional
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('sede_token');
    if (storedToken) {
      try {
        // Decode payload (no verification on client — server verifies)
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1])) as AuthUser & { exp: number };
          if (payload.exp * 1000 > Date.now()) {
            setUser(payload);
            setToken(storedToken);
          } else {
            localStorage.removeItem('sede_token');
          }
        }
      } catch {
        localStorage.removeItem('sede_token');
      }
    }
    refreshSede().finally(() => setLoading(false));
  }, []);

  const setAuth = (authUser: AuthUser, authToken: string) => {
    localStorage.setItem('sede_token', authToken);
    setUser(authUser);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('sede_token');
    setUser(null);
    setToken(null);
  };

  return (
    <GlobalContext.Provider value={{ user, token, configSede, loading, setAuth, logout, refreshSede }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal(): GlobalContextType {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobal must be used within GlobalProvider');
  return ctx;
}
