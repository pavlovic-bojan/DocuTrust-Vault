import { api } from '../boot/axios';

export type LocationType = 'PARKING' | 'SERVICE';
export type LocationStatus = 'ACTIVE' | 'PAUSED' | 'FROZEN';

export interface Location {
  id: string;
  orgId: string;
  name: string;
  type: LocationType;
  address: string | null;
  status: LocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name: string;
  type: LocationType;
  address?: string;
  status?: LocationStatus;
}

export interface UpdateLocationPayload {
  name?: string;
  type?: LocationType;
  address?: string;
  status?: LocationStatus;
}

export const locationsApi = {
  list: (type?: LocationType) =>
    api.get<{ data: Location[] }>('/api/locations', type ? { params: { type } } : undefined),
  getById: (id: string) => api.get<{ data: Location }>(`/api/locations/${id}`),
  create: (payload: CreateLocationPayload) =>
    api.post<{ data: Location }>('/api/locations', payload),
  update: (id: string, payload: UpdateLocationPayload) =>
    api.put<{ data: Location }>(`/api/locations/${id}`, payload),
  delete: (id: string) =>
    api.delete<{ data: { ok: boolean } }>(`/api/locations/${id}`),
};
