import { api } from '../boot/axios';

export interface FuelRecordVehicle {
  id: string;
  make: string;
  model: string;
}

export interface FuelRecordTrip {
  id: string;
  startAt?: string;
}

export interface FuelRecord {
  id: string;
  orgId: string;
  vehicleId: string;
  tripId: string | null;
  amountLiters: number;
  costCents: number | null;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: FuelRecordVehicle;
  trip?: FuelRecordTrip | null;
}

export interface CreateFuelRecordPayload {
  vehicleId: string;
  tripId?: string;
  amountLiters: number;
  costCents?: number;
  recordedAt?: string;
  notes?: string;
}

export const fuelApi = {
  list: () => api.get<{ data: FuelRecord[] }>('/api/fuel-records'),
  getById: (id: string) => api.get<{ data: FuelRecord }>(`/api/fuel-records/${id}`),
  create: (payload: CreateFuelRecordPayload) =>
    api.post<{ data: FuelRecord }>('/api/fuel-records', payload),
  delete: (id: string) =>
    api.delete<{ data: { ok: boolean } }>(`/api/fuel-records/${id}`),
};
