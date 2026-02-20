import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/api/auth.api';
import { authApi } from '@/api/auth.api';
import i18n, { PREFERRED_TO_LOCALE, persistLocale } from '@/i18n';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      setUser(data);
      const locale = PREFERRED_TO_LOCALE[data.preferredLanguage ?? 'EN'] ?? 'en';
      i18n.changeLanguage(locale);
      persistLocale(locale);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    const locale = PREFERRED_TO_LOCALE[data.user.preferredLanguage ?? 'EN'] ?? 'en';
    i18n.changeLanguage(locale);
    persistLocale(locale);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
