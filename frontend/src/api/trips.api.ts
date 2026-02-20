import { api } from '../boot/axios';

export type TripStatus = 'PRE_TRIP' | 'IN_PROGRESS' | 'POST_TRIP' | 'COMPLETED';

export interface TripVehicle {
  id: string;
  make: string;
  model: string;
  registration?: string;
}

export interface TripDriver {
  id: string;
  name: string;
}

export interface Trip {
  id: string;
  orgId: string;
  vehicleId: string;
  driverId: string;
  startAt: string;
  endAt: string | null;
  startMileage: number;
  endMileage: number | null;
  status: TripStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: TripVehicle;
  driver?: TripDriver;
}

export interface CreateTripPayload {
  vehicleId: string;
  driverId: string;
  startAt: string;
  startMileage?: number;
  status?: TripStatus;
  notes?: string;
}

export interface UpdateTripPayload {
  endAt?: string;
  endMileage?: number;
  status?: TripStatus;
  notes?: string;
}

export const tripsApi = {
  list: () => api.get<{ data: Trip[] }>('/api/trips'),
  getById: (id: string) => api.get<{ data: Trip }>(`/api/trips/${id}`),
  create: (payload: CreateTripPayload) =>
    api.post<{ data: Trip }>('/api/trips', payload),
  update: (id: string, payload: UpdateTripPayload) =>
    api.put<{ data: Trip }>(`/api/trips/${id}`, payload),
  delete: (id: string) =>
    api.delete<{ data: { ok: boolean } }>(`/api/trips/${id}`),
};
