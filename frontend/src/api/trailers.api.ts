import { api } from '../boot/axios';

export type TrailerStatus = 'ACTIVE' | 'PAUSED' | 'FROZEN' | 'IN_SERVICE';

export interface Trailer {
  id: string;
  orgId: string;
  make: string;
  model: string;
  registration: string | null;
  mileage: number;
  purchaseDate: string | null;
  status: TrailerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrailerPayload {
  make: string;
  model: string;
  registration?: string;
  mileage?: number;
  purchaseDate?: string;
  status?: TrailerStatus;
}

export interface UpdateTrailerPayload {
  make?: string;
  model?: string;
  registration?: string;
  mileage?: number;
  purchaseDate?: string;
  status?: TrailerStatus;
}

export const trailersApi = {
  list: () => api.get<{ data: Trailer[] }>('/api/trailers'),
  getById: (id: string) => api.get<{ data: Trailer }>(`/api/trailers/${id}`),
  create: (payload: CreateTrailerPayload) =>
    api.post<{ data: Trailer }>('/api/trailers', payload),
  update: (id: string, payload: UpdateTrailerPayload) =>
    api.put<{ data: Trailer }>(`/api/trailers/${id}`, payload),
  delete: (id: string) =>
    api.delete<{ data: { ok: boolean } }>(`/api/trailers/${id}`),
};
