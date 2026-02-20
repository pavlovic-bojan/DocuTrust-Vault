import { api } from '@/lib/api';

export interface User {
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

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  preferredLanguage?: 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR';
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  preferredLanguage?: 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR';
  password?: string;
}

export const usersApi = {
  list: (params?: { status?: string; role?: string; search?: string }) =>
    api.get<User[]>('/users', { params }),

  create: (payload: CreateUserPayload) =>
    api.post<User>('/users', payload),

  update: (userId: string, payload: UpdateUserPayload) =>
    api.patch<User>(`/users/${userId}`, payload),

  delete: (userId: string) =>
    api.delete(`/users/${userId}`),
};
