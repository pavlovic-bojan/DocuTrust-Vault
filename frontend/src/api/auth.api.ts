import { api } from '@/lib/api';

export interface AuthUser {
  userId: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  preferredLanguage: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<{ ok: boolean; message: string }>('/auth/forgot-password', { email }),

  getMe: () => api.get<AuthUser>('/auth/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    preferredLanguage?: string;
  }) => api.patch<AuthUser>('/auth/me', data),
};
