<template>
  <div class="reports-page" data-test="page-reports">
    <div class="reports-page__header">
      <h1 class="reports-page__title" data-test="reports-title">{{ $t('reports.title') }}</h1>
      <p class="reports-page__subtitle" data-test="reports-subtitle">{{ $t('reports.subtitle') }}</p>
      <div class="reports-page__range">
        <label class="reports-page__label">{{ $t('reports.dateFrom') }}</label>
        <input v-model="dateFrom" type="datetime-local" class="reports-page__input" data-test="input-date-from" />
        <label class="reports-page__label">{{ $t('reports.dateTo') }}</label>
        <input v-model="dateTo" type="datetime-local" class="reports-page__input" data-test="input-date-to" />
        <button type="button" class="reports-page__btn reports-page__btn--secondary" data-test="btn-load-report" :disabled="loading" @click="load">
          {{ $t('reports.loadReport') }}
        </button>
      </div>
      <div class="reports-page__actions">
        <button type="button" class="reports-page__btn reports-page__btn--secondary" data-test="btn-export-csv" :disabled="loading" @click="exportCsv">
          {{ $t('reports.exportCsv') }}
        </button>
        <button type="button" class="reports-page__btn reports-page__btn--primary" data-test="btn-export-pdf" :disabled="loading" @click="exportPdf">
          {{ $t('reports.exportPdf') }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="reports-page__loading" data-test="row-loading">
      {{ $t('common.loading') }}
    </div>
    <div v-else class="reports-page__content" data-test="reports-content">
      <p v-if="dateFrom && dateTo" class="reports-page__period" data-test="report-period">
        {{ $t('reports.dateFrom') }}: {{ dateFrom }} — {{ $t('reports.dateTo') }}: {{ dateTo }}
      </p>
      <section class="reports-page__section" data-test="section-trips">
        <h2 class="reports-page__section-title">{{ $t('reports.tripsByStatus') }}</h2>
        <p class="reports-page__total">{{ $t('reports.totalTrips') }}: {{ tripsReport.total }}</p>
        <div class="reports-page__bars">
          <div v-for="item in tripsReport.byStatus" :key="item.status" class="reports-page__bar-row" :data-test="`bar-${item.status}`">
            <span class="reports-page__bar-label">{{ formatTripStatus(item.status) }}</span>
            <div class="reports-page__bar-track">
              <div class="reports-page__bar-fill" :style="{ width: barWidth(item.count) + '%' }" />
            </div>
            <span class="reports-page__bar-value">{{ item.count }}</span>
          </div>
        </div>
        <p v-if="tripsReport.byStatus.length === 0" class="reports-page__no-data">{{ $t('reports.noData') }}</p>
      </section>
      <section class="reports-page__section" data-test="section-summary">
        <h2 class="reports-page__section-title">{{ $t('reports.summary') }}</h2>
        <div class="reports-page__cards">
          <div class="reports-page__card" data-test="card-vehicles">
            <span class="reports-page__card-value">{{ summary.vehicles }}</span>
            <span class="reports-page__card-label">{{ $t('dashboard.vehicles') }}</span>
          </div>
          <div class="reports-page__card" data-test="card-drivers">
            <span class="reports-page__card-value">{{ summary.drivers }}</span>
            <span class="reports-page__card-label">{{ $t('dashboard.drivers') }}</span>
          </div>
          <div class="reports-page__card" data-test="card-trips">
            <span class="reports-page__card-value">{{ summary.trips }}</span>
            <span class="reports-page__card-label">{{ $t('dashboard.trips') }}</span>
          </div>
          <div class="reports-page__card" data-test="card-fuel">
            <span class="reports-page__card-value">{{ summary.fuelRecords }}</span>
            <span class="reports-page__card-label">{{ $t('dashboard.fuel') }}</span>
          </div>
          <div class="reports-page__card" data-test="card-locations">
            <span class="reports-page__card-value">{{ summary.locations }}</span>
            <span class="reports-page__card-label">{{ $t('dashboard.locations') }}</span>
          </div>
        </div>
      </section>
      <section class="reports-page__section" data-test="section-fuel">
        <h2 class="reports-page__section-title">{{ $t('reports.fuelByVehicle') }}</h2>
        <div class="reports-page__table-wrap">
          <table class="reports-page__table" data-test="table-fuel">
            <thead>
              <tr>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': fuelSortKey === 'orgName' }" @click="setFuelSort('orgName')">
                  {{ $t('reports.organization') }}
                  <ChevronUp v-if="fuelSortKey === 'orgName' && fuelSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="fuelSortKey === 'orgName' && fuelSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': fuelSortKey === 'vehicle' }" @click="setFuelSort('vehicle')">
                  {{ $t('reports.vehicle') }}
                  <ChevronUp v-if="fuelSortKey === 'vehicle' && fuelSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="fuelSortKey === 'vehicle' && fuelSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': fuelSortKey === 'totalLiters' }" @click="setFuelSort('totalLiters')">
                  {{ $t('reports.totalLiters') }}
                  <ChevronUp v-if="fuelSortKey === 'totalLiters' && fuelSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="fuelSortKey === 'totalLiters' && fuelSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': fuelSortKey === 'totalCostCents' }" @click="setFuelSort('totalCostCents')">
                  {{ $t('reports.totalCost') }}
                  <ChevronUp v-if="fuelSortKey === 'totalCostCents' && fuelSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="fuelSortKey === 'totalCostCents' && fuelSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': fuelSortKey === 'recordCount' }" @click="setFuelSort('recordCount')">
                  {{ $t('reports.recordCount') }}
                  <ChevronUp v-if="fuelSortKey === 'recordCount' && fuelSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="fuelSortKey === 'recordCount' && fuelSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="fuelReport.length === 0" class="reports-page__row-empty">
                <td colspan="5">{{ $t('reports.noData') }}</td>
              </tr>
              <tr v-for="row in paginatedFuelReport" :key="row.vehicleId" :data-test="`row-fuel-${row.vehicleId}`">
                <td>{{ row.orgName }}</td>
                <td>{{ row.vehicleMake }} {{ row.vehicleModel }}</td>
                <td>{{ formatNumber(row.totalLiters) }} L</td>
                <td>{{ row.totalCostCents != null ? formatCents(row.totalCostCents) : '—' }}</td>
                <td>{{ row.recordCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="fuelReport.length > 0" class="reports-page__pagination" data-test="fuel-pagination">
          <div class="reports-page__pagination-rows">
            <label for="reports-fuel-rows" class="reports-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
            <select id="reports-fuel-rows" v-model.number="fuelRowsPerPage" class="reports-page__select" data-test="select-fuel-rows-per-page" @change="onFuelRowsPerPageChange">
              <option v-for="n in fuelRowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <span class="reports-page__pagination-showing">{{ $t('common.showingRows', [fuelPaginationStart, fuelPaginationEnd, fuelReport.length]) }}</span>
          <div class="reports-page__pagination-nav">
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="fuelPage <= 1" data-test="fuel-pagination-first" @click="fuelPage = 1">{{ $t('common.first') }}</button>
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="fuelPage <= 1" data-test="fuel-pagination-prev" @click="fuelPage = Math.max(1, fuelPage - 1)">{{ $t('common.previous') }}</button>
            <span class="reports-page__pagination-page">{{ $t('common.pageOf', [fuelPage, fuelTotalPages]) }}</span>
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="fuelPage >= fuelTotalPages" data-test="fuel-pagination-next" @click="fuelPage = Math.min(fuelTotalPages, fuelPage + 1)">{{ $t('common.next') }}</button>
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="fuelPage >= fuelTotalPages" data-test="fuel-pagination-last" @click="fuelPage = fuelTotalPages">{{ $t('common.last') }}</button>
          </div>
        </div>
      </section>
      <section class="reports-page__section" data-test="section-locations">
        <h2 class="reports-page__section-title">{{ $t('reports.parkingAndService') }}</h2>
        <div class="reports-page__table-wrap">
          <table class="reports-page__table" data-test="table-locations">
            <thead>
              <tr>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': locSortKey === 'orgName' }" @click="setLocSort('orgName')">
                  {{ $t('reports.organization') }}
                  <ChevronUp v-if="locSortKey === 'orgName' && locSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="locSortKey === 'orgName' && locSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': locSortKey === 'name' }" @click="setLocSort('name')">
                  {{ $t('locations.name') }}
                  <ChevronUp v-if="locSortKey === 'name' && locSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="locSortKey === 'name' && locSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': locSortKey === 'type' }" @click="setLocSort('type')">
                  {{ $t('locations.type') }}
                  <ChevronUp v-if="locSortKey === 'type' && locSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="locSortKey === 'type' && locSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': locSortKey === 'address' }" @click="setLocSort('address')">
                  {{ $t('locations.address') }}
                  <ChevronUp v-if="locSortKey === 'address' && locSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="locSortKey === 'address' && locSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
                <th class="reports-page__th--sortable" :class="{ 'reports-page__th--sorted': locSortKey === 'status' }" @click="setLocSort('status')">
                  {{ $t('locations.status') }}
                  <ChevronUp v-if="locSortKey === 'status' && locSortOrder === 'asc'" :size="14" class="reports-page__sort-icon" />
                  <ChevronDown v-else-if="locSortKey === 'status' && locSortOrder === 'desc'" :size="14" class="reports-page__sort-icon" />
                  <span v-else class="reports-page__sort-placeholder">↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="locationsReport.length === 0" class="reports-page__row-empty">
                <td colspan="5">{{ $t('reports.noData') }}</td>
              </tr>
              <tr v-for="row in paginatedLocationsReport" :key="row.id" :data-test="`row-location-${row.id}`">
                <td>{{ row.orgName }}</td>
                <td>{{ row.name }}</td>
                <td>{{ formatLocationType(row.type) }}</td>
                <td>{{ row.address || '—' }}</td>
                <td>{{ formatLocationStatus(row.status) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="locationsReport.length > 0" class="reports-page__pagination" data-test="locations-pagination">
          <div class="reports-page__pagination-rows">
            <label for="reports-loc-rows" class="reports-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
            <select id="reports-loc-rows" v-model.number="locRowsPerPage" class="reports-page__select" data-test="select-loc-rows-per-page" @change="onLocRowsPerPageChange">
              <option v-for="n in locRowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <span class="reports-page__pagination-showing">{{ $t('common.showingRows', [locPaginationStart, locPaginationEnd, locationsReport.length]) }}</span>
          <div class="reports-page__pagination-nav">
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="locPage <= 1" data-test="loc-pagination-first" @click="locPage = 1">{{ $t('common.first') }}</button>
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="locPage <= 1" data-test="loc-pagination-prev" @click="locPage = Math.max(1, locPage - 1)">{{ $t('common.previous') }}</button>
            <span class="reports-page__pagination-page">{{ $t('common.pageOf', [locPage, locTotalPages]) }}</span>
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="locPage >= locTotalPages" data-test="loc-pagination-next" @click="locPage = Math.min(locTotalPages, locPage + 1)">{{ $t('common.next') }}</button>
            <button type="button" class="reports-page__btn reports-page__btn--secondary reports-page__btn--small" :disabled="locPage >= locTotalPages" data-test="loc-pagination-last" @click="locPage = locTotalPages">{{ $t('common.last') }}</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ChevronUp, ChevronDown } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import {
  reportsApi,
  type ReportSummary,
  type FuelReportItem,
  type TripsReport,
  type LocationsReportItem,
} from '../api/reports.api';

type FuelSortKey = 'orgName' | 'vehicle' | 'totalLiters' | 'totalCostCents' | 'recordCount';
type LocSortKey = 'orgName' | 'name' | 'type' | 'address' | 'status';

const { t } = useI18n();
const loading = ref(true);
const summary = ref<ReportSummary>({
  vehicles: 0,
  drivers: 0,
  trips: 0,
  fuelRecords: 0,
  locations: 0,
});
const fuelReport = ref<FuelReportItem[]>([]);
const tripsReport = ref<TripsReport>({ total: 0, byStatus: [] });
const locationsReport = ref<LocationsReportItem[]>([]);

const dateFrom = ref('');
const dateTo = ref('');

const fuelSortKey = ref<FuelSortKey>('vehicle');
const fuelSortOrder = ref<'asc' | 'desc'>('asc');
const fuelPage = ref(1);
const fuelRowsPerPage = ref(10);
const fuelRowsPerPageOptions = [10, 25, 50, 100];

const sortedFuelReport = computed(() => {
  const list = fuelReport.value;
  const key = fuelSortKey.value;
  const order = fuelSortOrder.value;
  if (!list.length) return list;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (key === 'orgName') {
      cmp = (a.orgName ?? '').localeCompare(b.orgName ?? '');
    } else if (key === 'vehicle') {
      const va = `${a.vehicleMake} ${a.vehicleModel}`.toLowerCase();
      const vb = `${b.vehicleMake} ${b.vehicleModel}`.toLowerCase();
      cmp = va.localeCompare(vb);
    } else if (key === 'totalLiters') {
      cmp = a.totalLiters - b.totalLiters;
    } else if (key === 'totalCostCents') {
      const va = a.totalCostCents ?? 0;
      const vb = b.totalCostCents ?? 0;
      cmp = va - vb;
    } else {
      cmp = a.recordCount - b.recordCount;
    }
    return order === 'asc' ? cmp : -cmp;
  });
});

const fuelTotalPages = computed(() =>
  Math.max(1, Math.ceil(fuelReport.value.length / fuelRowsPerPage.value))
);

const paginatedFuelReport = computed(() => {
  const list = sortedFuelReport.value;
  const per = fuelRowsPerPage.value;
  const page = Math.min(fuelPage.value, fuelTotalPages.value);
  const start = (page - 1) * per;
  return list.slice(start, start + per);
});

const fuelPaginationStart = computed(() => {
  if (fuelReport.value.length === 0) return 0;
  return (fuelPage.value - 1) * fuelRowsPerPage.value + 1;
});

const fuelPaginationEnd = computed(() =>
  Math.min(fuelPage.value * fuelRowsPerPage.value, fuelReport.value.length)
);

function setFuelSort(key: FuelSortKey) {
  if (fuelSortKey.value === key) {
    fuelSortOrder.value = fuelSortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    fuelSortKey.value = key;
    fuelSortOrder.value = 'asc';
  }
}

function onFuelRowsPerPageChange() {
  fuelPage.value = 1;
}

watch([fuelReport, fuelRowsPerPage], () => {
  if (fuelPage.value > fuelTotalPages.value) fuelPage.value = Math.max(1, fuelTotalPages.value);
});

const locSortKey = ref<LocSortKey>('type');
const locSortOrder = ref<'asc' | 'desc'>('asc');
const locPage = ref(1);
const locRowsPerPage = ref(10);
const locRowsPerPageOptions = [10, 25, 50, 100];

const sortedLocationsReport = computed(() => {
  const list = locationsReport.value;
  const key = locSortKey.value;
  const order = locSortOrder.value;
  if (!list.length) return list;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (key === 'orgName') cmp = (a.orgName ?? '').localeCompare(b.orgName ?? '');
    else if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'type') cmp = a.type.localeCompare(b.type);
    else if (key === 'address') cmp = (a.address ?? '').localeCompare(b.address ?? '');
    else cmp = a.status.localeCompare(b.status);
    return order === 'asc' ? cmp : -cmp;
  });
});

const locTotalPages = computed(() =>
  Math.max(1, Math.ceil(locationsReport.value.length / locRowsPerPage.value))
);

const paginatedLocationsReport = computed(() => {
  const list = sortedLocationsReport.value;
  const per = locRowsPerPage.value;
  const page = Math.min(locPage.value, locTotalPages.value);
  const start = (page - 1) * per;
  return list.slice(start, start + per);
});

const locPaginationStart = computed(() => {
  if (locationsReport.value.length === 0) return 0;
  return (locPage.value - 1) * locRowsPerPage.value + 1;
});

const locPaginationEnd = computed(() =>
  Math.min(locPage.value * locRowsPerPage.value, locationsReport.value.length)
);

function setLocSort(key: LocSortKey) {
  if (locSortKey.value === key) {
    locSortOrder.value = locSortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    locSortKey.value = key;
    locSortOrder.value = 'asc';
  }
}

function onLocRowsPerPageChange() {
  locPage.value = 1;
}

function formatLocationType(type: string): string {
  const key = type === 'PARKING' ? 'locations.typeParking' : 'locations.typeService';
  const out = t(key);
  return out !== key ? out : type;
}

function formatLocationStatus(status: string): string {
  const key =
    status === 'ACTIVE' ? 'locations.statusActive' : status === 'PAUSED' ? 'locations.statusPaused' : 'locations.statusFrozen';
  const out = t(key);
  return out !== key ? out : status;
}

watch([locationsReport, locRowsPerPage], () => {
  if (locPage.value > locTotalPages.value) locPage.value = Math.max(1, locTotalPages.value);
});

function reportParams(): { from?: string; to?: string } | undefined {
  const from = dateFrom.value?.trim();
  const to = dateTo.value?.trim();
  if (!from && !to) return undefined;
  const params: { from?: string; to?: string } = {};
  if (from) params.from = new Date(from).toISOString();
  if (to) params.to = new Date(to).toISOString();
  return params;
}

async function load() {
  loading.value = true;
  try {
    const params = reportParams();
    const [s, f, tr, loc] = await Promise.all([
      reportsApi.getSummary(params),
      reportsApi.getFuelReport(params),
      reportsApi.getTripsReport(params),
      reportsApi.getLocationsReport(),
    ]);
    summary.value = s.data.data;
    fuelReport.value = f.data.data;
    tripsReport.value = tr.data.data;
    locationsReport.value = loc.data.data;
  } finally {
    loading.value = false;
  }
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const tripStatusOrder = ['PRE_TRIP', 'IN_PROGRESS', 'POST_TRIP', 'COMPLETED'];

function formatTripStatus(status: string): string {
  const key = `reports.tripStatus.${status}`;
  const out = t(key);
  return out !== key ? out : status;
}

function barWidth(count: number): number {
  const max = Math.max(1, ...tripsReport.value.byStatus.map((x) => x.count));
  return max ? (count / max) * 100 : 0;
}

function exportCsv() {
  const rows: string[][] = [
    [t('reports.summary'), ''],
    [t('dashboard.vehicles'), String(summary.value.vehicles)],
    [t('dashboard.drivers'), String(summary.value.drivers)],
    [t('dashboard.trips'), String(summary.value.trips)],
    [t('dashboard.fuel'), String(summary.value.fuelRecords)],
    [t('dashboard.locations'), String(summary.value.locations)],
    [],
    [t('reports.fuelByVehicle'), '', '', '', ''],
    [t('reports.organization'), t('reports.vehicle'), t('reports.totalLiters'), t('reports.totalCost'), t('reports.recordCount')],
    ...fuelReport.value.map((r) => [
      r.orgName ?? '',
      `${r.vehicleMake} ${r.vehicleModel}`,
      String(r.totalLiters),
      r.totalCostCents != null ? String(r.totalCostCents / 100) : '',
      String(r.recordCount),
    ]),
    [],
    [t('reports.parkingAndService'), '', '', '', ''],
    [t('reports.organization'), t('locations.name'), t('locations.type'), t('locations.address'), t('locations.status')],
    ...locationsReport.value.map((l) => [
      l.orgName,
      l.name,
      formatLocationType(l.type),
      l.address ?? '',
      formatLocationStatus(l.status),
    ]),
    [],
    [t('reports.tripsByStatus'), ''],
    [t('reports.totalTrips'), String(tripsReport.value.total)],
    ...tripsReport.value.byStatus.map((x) => [formatTripStatus(x.status), String(x.count)]),
  ];
  const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const from = dateFrom.value?.trim();
  const to = dateTo.value?.trim();
  const rangePart = from && to ? `${from.slice(0, 10)}_${to.slice(0, 10)}` : new Date().toISOString().slice(0, 10);
  a.download = `reports-${rangePart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf() {
  window.print();
}

onMounted(() => load());
</script>

<style scoped>
.reports-page { width: 100%; }
.reports-page__header { margin-bottom: 1.5rem; }
.reports-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.reports-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1rem; }
.reports-page__range { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; margin-bottom: 1rem; }
.reports-page__label { font-size: 0.85rem; color: #666; white-space: nowrap; }
.reports-page__input { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; }
.reports-page__actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.reports-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.reports-page__btn:disabled { opacity: 0.6; cursor: not-allowed; }
.reports-page__btn--primary { background: #1976d2; color: #fff; }
.reports-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.reports-page__loading { padding: 2rem; color: #888; }
.reports-page__section { margin-bottom: 2rem; }
.reports-page__section-title { font-size: 1.15rem; font-weight: 600; margin: 0 0 1rem; color: #333; }
.reports-page__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; }
.reports-page__card { padding: 1rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; text-align: center; }
.reports-page__card-value { display: block; font-size: 1.5rem; font-weight: 700; color: #333; }
.reports-page__card-label { font-size: 0.85rem; color: #666; }
.reports-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; background: #fff; }
.reports-page__table { width: 100%; border-collapse: collapse; }
.reports-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.reports-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.reports-page__th--sorted { color: #1976d2; }
.reports-page__sort-icon { vertical-align: middle; margin-left: 2px; }
.reports-page__sort-placeholder { display: inline-block; width: 14px; margin-left: 2px; color: #999; vertical-align: middle; }
.reports-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.reports-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.reports-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.reports-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.reports-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.reports-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.reports-page__pagination-showing { font-size: 0.9rem; color: #666; }
.reports-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.reports-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.reports-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.reports-page__total { margin: 0 0 0.75rem; font-size: 0.95rem; color: #666; }
.reports-page__bars { display: flex; flex-direction: column; gap: 0.5rem; max-width: 400px; }
.reports-page__bar-row { display: grid; grid-template-columns: 120px 1fr 40px; align-items: center; gap: 0.5rem; }
.reports-page__bar-label { font-size: 0.9rem; color: #333; }
.reports-page__bar-track { height: 20px; background: #eee; border-radius: 4px; overflow: hidden; }
.reports-page__bar-fill { height: 100%; background: #1976d2; border-radius: 4px; min-width: 2px; }
.reports-page__bar-value { font-size: 0.9rem; font-weight: 600; color: #333; text-align: right; }
.reports-page__no-data { color: #888; font-size: 0.9rem; margin: 0; }
.reports-page__period { font-size: 0.9rem; color: #666; margin: 0 0 1rem; }

@media print {
  .reports-page__range { display: none !important; }
  .reports-page__actions { display: none !important; }
  .reports-page__btn { display: none !important; }
  .reports-page__pagination { display: none !important; }
}
</style>
