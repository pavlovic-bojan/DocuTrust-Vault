import { api } from '../boot/axios';

export interface ReportSummary {
  vehicles: number;
  drivers: number;
  trips: number;
  fuelRecords: number;
  locations: number;
}

export interface FuelReportItem {
  vehicleId: string;
  orgName: string;
  vehicleMake: string;
  vehicleModel: string;
  totalLiters: number;
  totalCostCents: number | null;
  recordCount: number;
}

export interface LocationsReportItem {
  id: string;
  orgName: string;
  name: string;
  type: string;
  address: string | null;
  status: string;
}

export interface TripsReportItem {
  status: string;
  count: number;
}

export interface TripsReportPerOrg {
  orgId: string;
  orgName: string;
  total: number;
  byStatus: TripsReportItem[];
}

export interface TripsReport {
  total: number;
  byStatus: TripsReportItem[];
  perOrg: TripsReportPerOrg[];
}

export const reportsApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api.get<{ data: ReportSummary }>('/api/reports/summary', { params }),

  getFuelReport: (params?: { from?: string; to?: string }) =>
    api.get<{ data: FuelReportItem[] }>('/api/reports/fuel', { params }),

  getTripsReport: (params?: { from?: string; to?: string }) =>
    api.get<{ data: TripsReport }>('/api/reports/trips', { params }),

  getLocationsReport: () =>
    api.get<{ data: LocationsReportItem[] }>('/api/reports/locations'),
};
