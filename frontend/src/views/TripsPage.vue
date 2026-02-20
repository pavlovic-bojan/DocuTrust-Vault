<template>
  <div class="trips-page" data-test="page-trips">
    <h1 class="trips-page__title" data-test="trips-title">{{ $t('trips.title') }}</h1>
    <p class="trips-page__subtitle" data-test="trips-subtitle">{{ $t('trips.subtitle') }}</p>
    <div class="trips-page__actions">
      <div class="trips-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="trips-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="trips-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="t in autocompleteSuggestions"
            :key="t.id"
            class="trips-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(t)"
          >
            {{ rowSummary(t) }}
          </li>
        </ul>
      </div>
      <button type="button" class="trips-page__btn trips-page__btn--primary" data-test="button-add-trip" @click="openDrawer()">
        {{ $t('trips.addTrip') }}
      </button>
    </div>
    <div class="trips-page__table-wrap" data-test="table-wrap">
      <table class="trips-page__table" data-test="table-trips">
        <thead>
          <tr>
            <th class="trips-page__th--sortable" :class="{ 'trips-page__th--sorted': sortKey === 'vehicleLabel' }" @click="setSort('vehicleLabel')">
              {{ $t('trips.vehicle') }} <ChevronUp v-if="sortKey === 'vehicleLabel' && sortOrder === 'asc'" :size="14" class="trips-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'vehicleLabel' && sortOrder === 'desc'" :size="14" class="trips-page__sort-icon" /><span v-else class="trips-page__sort-placeholder">↕</span>
            </th>
            <th class="trips-page__th--sortable" :class="{ 'trips-page__th--sorted': sortKey === 'driverLabel' }" @click="setSort('driverLabel')">
              {{ $t('trips.driver') }} <ChevronUp v-if="sortKey === 'driverLabel' && sortOrder === 'asc'" :size="14" class="trips-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'driverLabel' && sortOrder === 'desc'" :size="14" class="trips-page__sort-icon" /><span v-else class="trips-page__sort-placeholder">↕</span>
            </th>
            <th class="trips-page__th--sortable" :class="{ 'trips-page__th--sorted': sortKey === 'startAt' }" @click="setSort('startAt')">
              {{ $t('trips.startAt') }} <ChevronUp v-if="sortKey === 'startAt' && sortOrder === 'asc'" :size="14" class="trips-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'startAt' && sortOrder === 'desc'" :size="14" class="trips-page__sort-icon" /><span v-else class="trips-page__sort-placeholder">↕</span>
            </th>
            <th class="trips-page__th--sortable" :class="{ 'trips-page__th--sorted': sortKey === 'endAt' }" @click="setSort('endAt')">
              {{ $t('trips.endAt') }} <ChevronUp v-if="sortKey === 'endAt' && sortOrder === 'asc'" :size="14" class="trips-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'endAt' && sortOrder === 'desc'" :size="14" class="trips-page__sort-icon" /><span v-else class="trips-page__sort-placeholder">↕</span>
            </th>
            <th class="trips-page__th--sortable" :class="{ 'trips-page__th--sorted': sortKey === 'status' }" @click="setSort('status')">
              {{ $t('trips.status') }} <ChevronUp v-if="sortKey === 'status' && sortOrder === 'asc'" :size="14" class="trips-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'status' && sortOrder === 'desc'" :size="14" class="trips-page__sort-icon" /><span v-else class="trips-page__sort-placeholder">↕</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="trips-page__row-loading" data-test="row-loading">
            <td colspan="6">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="items.length === 0" class="trips-page__row-empty" data-test="row-empty">
            <td colspan="6">{{ $t('trips.noTrips') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="trips-page__row-empty" data-test="row-no-matches">
            <td colspan="6">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="t in paginatedItems" :key="t.id" :data-test="`row-trip-${t.id}`">
            <td>{{ vehicleLabel(t) }}</td>
            <td>{{ driverLabel(t) }}</td>
            <td>{{ formatDateTime(t.startAt) }}</td>
            <td>{{ t.endAt ? formatDateTime(t.endAt) : '—' }}</td>
            <td>{{ $t(statusLabel(t.status)) }}</td>
            <td class="trips-page__cell-actions">
              <button type="button" class="trips-page__btn trips-page__btn--icon" :aria-label="$t('trips.editTrip')" data-test="button-edit-trip" @click="openDrawer(t)"><Pencil :size="18" stroke-width="2" /></button>
              <button type="button" class="trips-page__btn trips-page__btn--icon trips-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-trip-${t.id}`" @click="confirmDelete(t)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="trips-page__pagination" data-test="pagination">
      <div class="trips-page__pagination-rows">
        <label for="trips-rows-per-page" class="trips-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="trips-rows-per-page" v-model.number="rowsPerPage" class="trips-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="trips-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="trips-page__pagination-nav">
        <button type="button" class="trips-page__btn trips-page__btn--secondary trips-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="trips-page__btn trips-page__btn--secondary trips-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="trips-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="trips-page__btn trips-page__btn--secondary trips-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="trips-page__btn trips-page__btn--secondary trips-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <div v-if="drawerOpen" class="trips-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="trips-page__drawer" :class="{ 'trips-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="trips-page__drawer-inner">
        <div class="trips-page__drawer-header">
          <h2 class="trips-page__drawer-title" data-test="drawer-title">{{ editingId ? $t('trips.editTrip') : $t('trips.addTrip') }}</h2>
          <button type="button" class="trips-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="trips-page__form" data-test="form-trip" @submit.prevent="submitForm">
          <label class="trips-page__label">{{ $t('trips.vehicle') }} *</label>
          <select v-model="form.vehicleId" class="trips-page__input" data-test="select-vehicle" required :disabled="!!editingId">
            <option value="">{{ $t('trips.selectVehicle') }}</option>
            <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.make }} {{ v.model }} ({{ v.registration || v.id }})</option>
          </select>
          <label class="trips-page__label">{{ $t('trips.driver') }} *</label>
          <select v-model="form.driverId" class="trips-page__input" data-test="select-driver" required :disabled="!!editingId">
            <option value="">{{ $t('trips.selectDriver') }}</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <label class="trips-page__label">{{ $t('trips.startAt') }} *</label>
          <input v-model="form.startAt" type="datetime-local" class="trips-page__input" data-test="input-start-at" required />
          <label class="trips-page__label">{{ $t('trips.startMileage') }}</label>
          <input v-model.number="form.startMileage" type="number" min="0" class="trips-page__input" data-test="input-start-mileage" />
          <label class="trips-page__label">{{ $t('trips.status') }}</label>
          <select v-model="form.status" class="trips-page__input" data-test="select-status">
            <option value="PRE_TRIP">{{ $t('trips.statusPreTrip') }}</option>
            <option value="IN_PROGRESS">{{ $t('trips.statusInProgress') }}</option>
            <option value="POST_TRIP">{{ $t('trips.statusPostTrip') }}</option>
            <option value="COMPLETED">{{ $t('trips.statusCompleted') }}</option>
          </select>
          <label class="trips-page__label">{{ $t('trips.notes') }}</label>
          <textarea v-model="form.notes" class="trips-page__input trips-page__textarea" data-test="input-notes" rows="2"></textarea>
          <div v-if="editingId" class="trips-page__form-group">
            <label class="trips-page__label">{{ $t('trips.endAt') }}</label>
            <input v-model="form.endAt" type="datetime-local" class="trips-page__input" data-test="input-end-at" />
            <label class="trips-page__label">{{ $t('trips.endMileage') }}</label>
            <input v-model.number="form.endMileage" type="number" min="0" class="trips-page__input" data-test="input-end-mileage" />
          </div>
          <div class="trips-page__form-actions">
            <button type="submit" class="trips-page__btn trips-page__btn--primary" :disabled="saving" data-test="button-save-trip">{{ $t('common.save') }}</button>
            <button type="button" class="trips-page__btn trips-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <div v-if="deleteTarget" class="trips-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="trips-page__dialog" data-test="dialog-delete">
      <p class="trips-page__dialog-text">{{ $t('trips.confirmDelete') }}</p>
      <div class="trips-page__dialog-actions">
        <button type="button" class="trips-page__btn trips-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="trips-page__btn trips-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next';
import { tripsApi, type Trip, type TripStatus } from '../api/trips.api';
import { vehiclesApi } from '../api/vehicles.api';
import { driversApi, type Driver } from '../api/drivers.api';

const { t } = useI18n();
const loading = ref(true);
const items = ref<Trip[]>([]);
const sortKey = ref<'vehicleLabel' | 'driverLabel' | 'startAt' | 'endAt' | 'status'>('startAt');
const sortOrder = ref<'asc' | 'desc'>('desc');
const searchQuery = ref('');
const showAutocomplete = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [10, 25, 50, 100];

function getTripSortValue(t: Trip, key: string): string | number {
  if (key === 'vehicleLabel') return vehicleLabel(t);
  if (key === 'driverLabel') return driverLabel(t);
  if (key === 'startAt' || key === 'endAt') return new Date((t as Record<string, unknown>)[key] as string).getTime();
  return (t as Record<string, unknown>)[key] as string;
}

const sortedItems = computed(() => {
  const key = sortKey.value;
  if (!key || !items.value.length) return items.value;
  return [...items.value].sort((a, b) => {
    const va = getTripSortValue(a, key);
    const vb = getTripSortValue(b, key);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

function setSort(key: 'vehicleLabel' | 'driverLabel' | 'startAt' | 'endAt' | 'status') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'startAt' || key === 'endAt' ? 'desc' : 'asc';
  }
}

function searchableString(trip: Trip): string {
  return [
    vehicleLabel(trip),
    driverLabel(trip),
    formatDateTime(trip.startAt),
    trip.endAt ? formatDateTime(trip.endAt) : '',
    t(statusLabel(trip.status)),
  ].join(' ').toLowerCase();
}

const filteredBySearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return sortedItems.value;
  return sortedItems.value.filter((trip) => searchableString(trip).includes(q));
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredBySearch.value.length / rowsPerPage.value)));
const paginatedItems = computed(() => {
  const list = filteredBySearch.value;
  const per = rowsPerPage.value;
  const page = Math.min(currentPage.value, totalPages.value);
  const start = (page - 1) * per;
  return list.slice(start, start + per);
});
const paginationStart = computed(() => {
  if (filteredBySearch.value.length === 0) return 0;
  return (currentPage.value - 1) * rowsPerPage.value + 1;
});
const paginationEnd = computed(() => Math.min(currentPage.value * rowsPerPage.value, filteredBySearch.value.length));

watch([filteredBySearch, rowsPerPage], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
});

const autocompleteSuggestions = computed(() => filteredBySearch.value.slice(0, 8));

function rowSummary(trip: Trip): string {
  return `${vehicleLabel(trip)} – ${driverLabel(trip)} ${formatDateTime(trip.startAt)}`;
}

function selectSuggestion(trip: Trip) {
  searchQuery.value = rowSummary(trip);
  showAutocomplete.value = false;
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

const vehicles = ref<{ id: string; make: string; model: string; registration: string | null }[]>([]);
const drivers = ref<Driver[]>([]);
const drawerOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const deleteTarget = ref<Trip | null>(null);

const form = ref({
  vehicleId: '',
  driverId: '',
  startAt: '',
  startMileage: 0,
  endAt: '',
  endMileage: 0,
  status: 'PRE_TRIP' as TripStatus,
  notes: '',
});

const statusLabelMap: Record<TripStatus, string> = {
  PRE_TRIP: 'trips.statusPreTrip',
  IN_PROGRESS: 'trips.statusInProgress',
  POST_TRIP: 'trips.statusPostTrip',
  COMPLETED: 'trips.statusCompleted',
};

function statusLabel(s: TripStatus): string {
  return statusLabelMap[s] || s;
}

function vehicleLabel(t: Trip): string {
  if (t.vehicle) return `${t.vehicle.make} ${t.vehicle.model}`;
  return t.vehicleId;
}

function driverLabel(t: Trip): string {
  return t.driver?.name ?? t.driverId;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await tripsApi.list();
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const [vRes, dRes] = await Promise.all([
    vehiclesApi.list(),
    driversApi.list(),
  ]);
  vehicles.value = vRes.data.data;
  drivers.value = dRes.data.data;
}

function openDrawer(trip?: Trip) {
  editingId.value = trip?.id ?? null;
  const now = new Date();
  const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  form.value = {
    vehicleId: trip?.vehicleId ?? '',
    driverId: trip?.driverId ?? '',
    startAt: trip?.startAt ? trip.startAt.slice(0, 16) : nowLocal,
    startMileage: trip?.startMileage ?? 0,
    endAt: trip?.endAt ? trip.endAt.slice(0, 16) : '',
    endMileage: trip?.endMileage ?? 0,
    status: (trip?.status as TripStatus) ?? 'PRE_TRIP',
    notes: trip?.notes ?? '',
  };
  drawerOpen.value = true;
  loadOptions();
}

function closeDrawer() {
  drawerOpen.value = false;
  editingId.value = null;
}

async function submitForm() {
  saving.value = true;
  try {
    const id = editingId.value;
    if (id) {
      await tripsApi.update(id, {
        endAt: form.value.endAt || undefined,
        endMileage: form.value.endMileage || undefined,
        status: form.value.status,
        notes: form.value.notes || undefined,
      });
    } else {
      await tripsApi.create({
        vehicleId: form.value.vehicleId,
        driverId: form.value.driverId,
        startAt: new Date(form.value.startAt).toISOString(),
        startMileage: form.value.startMileage,
        status: form.value.status,
        notes: form.value.notes || undefined,
      });
    }
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(t: Trip) {
  deleteTarget.value = t;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await tripsApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.trips-page { width: 100%; }
.trips-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.trips-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.trips-page__actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.trips-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.trips-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.trips-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.trips-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.trips-page__autocomplete-item:hover { background: #f0f0f0; }
.trips-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.trips-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.trips-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.trips-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.trips-page__pagination-showing { font-size: 0.9rem; color: #666; }
.trips-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.trips-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.trips-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.trips-page__btn--primary { background: #1976d2; color: #fff; }
.trips-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.trips-page__btn--danger { background: #c62828; color: #fff; }
.trips-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.trips-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.trips-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.trips-page__btn--icon:hover { opacity: 0.9; }
.trips-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; -webkit-overflow-scrolling: touch; max-height: 70vh; background: #fff; }
.trips-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.trips-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.trips-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.trips-page__th--sortable:hover { background: #eee; }
.trips-page__th--sorted { color: #1976d2; }
.trips-page__sort-icon { display: inline-block; vertical-align: middle; margin-left: 2px; }
.trips-page__sort-placeholder { display: inline-block; opacity: 0.35; font-size: 0.7rem; margin-left: 2px; }
.trips-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.trips-page__row-loading td, .trips-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.trips-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.trips-page__drawer { position: fixed; top: 0; right: 0; width: 400px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.trips-page__drawer--open { transform: translateX(0); }
.trips-page__drawer-inner { padding: 1.5rem; }
.trips-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.trips-page__drawer-title { font-size: 1.25rem; margin: 0; }
.trips-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.trips-page__drawer-close:hover { background: #f0f0f0; color: #333; }
.trips-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.trips-page__form-group { display: flex; flex-direction: column; gap: 0.75rem; }
.trips-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.trips-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.trips-page__textarea { resize: vertical; min-height: 60px; }
.trips-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.trips-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.trips-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.trips-page__dialog-text { margin: 0 0 1rem; }
.trips-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
