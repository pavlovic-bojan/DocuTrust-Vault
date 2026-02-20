import { api } from '../boot/axios';

export type VehicleStatus = 'ACTIVE' | 'PAUSED' | 'FROZEN' | 'IN_SERVICE';

export interface Vehicle {
  id: string;
  orgId: string;
  make: string;
  model: string;
  vin: string | null;
  registration: string | null;
  mileage: number;
  purchaseDate: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiclePayload {
  make: string;
  model: string;
  vin?: string;
  registration?: string;
  mileage?: number;
  purchaseDate?: string;
  status?: VehicleStatus;
}

export interface UpdateVehiclePayload {
  make?: string;
  model?: string;
  vin?: string;
  registration?: string;
  mileage?: number;
  purchaseDate?: string;
  status?: VehicleStatus;
}

export const vehiclesApi = {
  list: () => api.get<{ data: Vehicle[] }>('/api/vehicles'),

  getById: (id: string) => api.get<{ data: Vehicle }>(`/api/vehicles/${id}`),

  create: (payload: CreateVehiclePayload) =>
    api.post<{ data: Vehicle }>('/api/vehicles', payload),

  update: (id: string, payload: UpdateVehiclePayload) =>
    api.put<{ data: Vehicle }>(`/api/vehicles/${id}`, payload),

  delete: (id: string) =>
    api.delete<{ data: { ok: boolean } }>(`/api/vehicles/${id}`),
};
