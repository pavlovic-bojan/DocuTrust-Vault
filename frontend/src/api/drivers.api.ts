import { api } from '../boot/axios';

export type DriverStatus = 'ACTIVE' | 'PAUSED' | 'FROZEN';

export interface Driver {
  id: string;
  orgId: string;
  userId: string | null;
  name: string;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  phone: string | null;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; name: string } | null;
}

export interface CreateDriverPayload {
  name: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  phone?: string;
  userId?: string;
  status?: DriverStatus;
}

export interface UpdateDriverPayload {
  name?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  phone?: string;
  userId?: string;
  status?: DriverStatus;
}

export const driversApi = {
  list: () => api.get<{ data: Driver[] }>('/api/drivers'),

  getById: (id: string) => api.get<{ data: Driver }>(`/api/drivers/${id}`),

  create: (payload: CreateDriverPayload) =>
    api.post<{ data: Driver }>('/api/drivers', payload),

  update: (id: string, payload: UpdateDriverPayload) =>
    api.put<{ data: Driver }>(`/api/drivers/${id}`, payload),

  delete: (id: string) =>
    api.delete<{ data: { ok: boolean } }>(`/api/drivers/${id}`),
};
