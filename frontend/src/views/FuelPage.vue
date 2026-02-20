<template>
  <div class="fuel-page" data-test="page-fuel">
    <h1 class="fuel-page__title" data-test="fuel-title">{{ $t('fuel.title') }}</h1>
    <p class="fuel-page__subtitle" data-test="fuel-subtitle">{{ $t('fuel.subtitle') }}</p>
    <div class="fuel-page__actions">
      <div class="fuel-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="fuel-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="fuel-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="r in autocompleteSuggestions"
            :key="r.id"
            class="fuel-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(r)"
          >
            {{ rowSummary(r) }}
          </li>
        </ul>
      </div>
      <button type="button" class="fuel-page__btn fuel-page__btn--primary" data-test="button-add-fuel" @click="openDrawer()">
        {{ $t('fuel.addRecord') }}
      </button>
    </div>
    <div class="fuel-page__table-wrap" data-test="table-wrap">
      <table class="fuel-page__table" data-test="table-fuel">
        <thead>
          <tr>
            <th class="fuel-page__th--sortable" :class="{ 'fuel-page__th--sorted': sortKey === 'vehicleId' }" @click="setSort('vehicleId')">
              {{ $t('fuel.vehicle') }} <ChevronUp v-if="sortKey === 'vehicleId' && sortOrder === 'asc'" :size="14" class="fuel-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'vehicleId' && sortOrder === 'desc'" :size="14" class="fuel-page__sort-icon" /><span v-else class="fuel-page__sort-placeholder">↕</span>
            </th>
            <th class="fuel-page__th--sortable" :class="{ 'fuel-page__th--sorted': sortKey === 'amountLiters' }" @click="setSort('amountLiters')">
              {{ $t('fuel.amountLiters') }} <ChevronUp v-if="sortKey === 'amountLiters' && sortOrder === 'asc'" :size="14" class="fuel-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'amountLiters' && sortOrder === 'desc'" :size="14" class="fuel-page__sort-icon" /><span v-else class="fuel-page__sort-placeholder">↕</span>
            </th>
            <th class="fuel-page__th--sortable" :class="{ 'fuel-page__th--sorted': sortKey === 'costCents' }" @click="setSort('costCents')">
              {{ $t('fuel.costCents') }} <ChevronUp v-if="sortKey === 'costCents' && sortOrder === 'asc'" :size="14" class="fuel-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'costCents' && sortOrder === 'desc'" :size="14" class="fuel-page__sort-icon" /><span v-else class="fuel-page__sort-placeholder">↕</span>
            </th>
            <th class="fuel-page__th--sortable" :class="{ 'fuel-page__th--sorted': sortKey === 'recordedAt' }" @click="setSort('recordedAt')">
              {{ $t('fuel.recordedAt') }} <ChevronUp v-if="sortKey === 'recordedAt' && sortOrder === 'asc'" :size="14" class="fuel-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'recordedAt' && sortOrder === 'desc'" :size="14" class="fuel-page__sort-icon" /><span v-else class="fuel-page__sort-placeholder">↕</span>
            </th>
            <th class="fuel-page__th--sortable" :class="{ 'fuel-page__th--sorted': sortKey === 'notes' }" @click="setSort('notes')">
              {{ $t('fuel.notes') }} <ChevronUp v-if="sortKey === 'notes' && sortOrder === 'asc'" :size="14" class="fuel-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'notes' && sortOrder === 'desc'" :size="14" class="fuel-page__sort-icon" /><span v-else class="fuel-page__sort-placeholder">↕</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="fuel-page__row-loading" data-test="row-loading">
            <td colspan="6">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="items.length === 0" class="fuel-page__row-empty" data-test="row-empty">
            <td colspan="6">{{ $t('fuel.noRecords') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="fuel-page__row-empty" data-test="row-no-matches">
            <td colspan="6">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="r in paginatedItems" :key="r.id" :data-test="`row-fuel-${r.id}`">
            <td>{{ vehicleLabel(r) }}</td>
            <td>{{ r.amountLiters }}</td>
            <td>{{ r.costCents != null ? formatCost(r.costCents) : '—' }}</td>
            <td>{{ formatDateTime(r.recordedAt) }}</td>
            <td>{{ r.notes || '—' }}</td>
            <td class="fuel-page__cell-actions">
              <button type="button" class="fuel-page__btn fuel-page__btn--icon fuel-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-fuel-${r.id}`" @click="confirmDelete(r)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="fuel-page__pagination" data-test="pagination">
      <div class="fuel-page__pagination-rows">
        <label for="fuel-rows-per-page" class="fuel-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="fuel-rows-per-page" v-model.number="rowsPerPage" class="fuel-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="fuel-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="fuel-page__pagination-nav">
        <button type="button" class="fuel-page__btn fuel-page__btn--secondary fuel-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="fuel-page__btn fuel-page__btn--secondary fuel-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="fuel-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="fuel-page__btn fuel-page__btn--secondary fuel-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="fuel-page__btn fuel-page__btn--secondary fuel-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <div v-if="drawerOpen" class="fuel-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="fuel-page__drawer" :class="{ 'fuel-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="fuel-page__drawer-inner">
        <div class="fuel-page__drawer-header">
          <h2 class="fuel-page__drawer-title" data-test="drawer-title">{{ $t('fuel.addRecord') }}</h2>
          <button type="button" class="fuel-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="fuel-page__form" data-test="form-fuel" @submit.prevent="submitForm">
          <label class="fuel-page__label">{{ $t('fuel.vehicle') }} *</label>
          <select v-model="form.vehicleId" class="fuel-page__input" data-test="select-vehicle" required>
            <option value="">{{ $t('fuel.selectVehicle') }}</option>
            <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.make }} {{ v.model }} ({{ v.registration || v.id }})</option>
          </select>
          <label class="fuel-page__label">{{ $t('fuel.trip') }}</label>
          <select v-model="form.tripId" class="fuel-page__input" data-test="select-trip">
            <option value="">{{ $t('fuel.noTrip') }}</option>
            <option v-for="t in trips" :key="t.id" :value="t.id">{{ formatTripLabel(t) }}</option>
          </select>
          <label class="fuel-page__label">{{ $t('fuel.amountLiters') }} *</label>
          <input v-model.number="form.amountLiters" type="number" min="0" step="0.01" class="fuel-page__input" data-test="input-amount-liters" required />
          <label class="fuel-page__label">{{ $t('fuel.costCents') }}</label>
          <input v-model.number="form.costCents" type="number" min="0" class="fuel-page__input" data-test="input-cost-cents" />
          <label class="fuel-page__label">{{ $t('fuel.recordedAt') }}</label>
          <input v-model="form.recordedAt" type="datetime-local" class="fuel-page__input" data-test="input-recorded-at" />
          <label class="fuel-page__label">{{ $t('fuel.notes') }}</label>
          <textarea v-model="form.notes" class="fuel-page__input fuel-page__textarea" data-test="input-notes" rows="2"></textarea>
          <div class="fuel-page__form-actions">
            <button type="submit" class="fuel-page__btn fuel-page__btn--primary" :disabled="saving" data-test="button-save-fuel">{{ $t('common.save') }}</button>
            <button type="button" class="fuel-page__btn fuel-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <div v-if="deleteTarget" class="fuel-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="fuel-page__dialog" data-test="dialog-delete">
      <p class="fuel-page__dialog-text">{{ $t('fuel.confirmDelete') }}</p>
      <div class="fuel-page__dialog-actions">
        <button type="button" class="fuel-page__btn fuel-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="fuel-page__btn fuel-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next';
import { fuelApi, type FuelRecord } from '../api/fuel.api';
import { vehiclesApi } from '../api/vehicles.api';
import { tripsApi, type Trip } from '../api/trips.api';

const loading = ref(true);
const items = ref<FuelRecord[]>([]);
const sortKey = ref<keyof FuelRecord | ''>('recordedAt');
const sortOrder = ref<'asc' | 'desc'>('desc');

const sortedItems = computed(() => {
  const key = sortKey.value;
  if (!key || !items.value.length) return items.value;
  return [...items.value].sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    let cmp: number;
    if (key === 'recordedAt') {
      cmp = new Date(va as string).getTime() - new Date(vb as string).getTime();
    } else if (key === 'amountLiters' || key === 'costCents') {
      cmp = Number(va) - Number(vb);
    } else {
      cmp = String(va).localeCompare(String(vb));
    }
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

function setSort(key: keyof FuelRecord) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'recordedAt' ? 'desc' : 'asc';
  }
}

const searchQuery = ref('');
const showAutocomplete = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [10, 25, 50, 100];

function searchableString(r: FuelRecord): string {
  return [
    vehicleLabel(r),
    String(r.amountLiters),
    r.costCents != null ? formatCost(r.costCents) : '',
    formatDateTime(r.recordedAt),
    r.notes ?? '',
  ].join(' ').toLowerCase();
}

const filteredBySearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return sortedItems.value;
  return sortedItems.value.filter((r) => searchableString(r).includes(q));
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

function rowSummary(r: FuelRecord): string {
  return `${vehicleLabel(r)} ${r.amountLiters}L ${formatDateTime(r.recordedAt)}`;
}

function selectSuggestion(r: FuelRecord) {
  searchQuery.value = rowSummary(r);
  showAutocomplete.value = false;
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

const vehicles = ref<{ id: string; make: string; model: string; registration: string | null }[]>([]);
const trips = ref<Trip[]>([]);
const drawerOpen = ref(false);
const saving = ref(false);
const deleteTarget = ref<FuelRecord | null>(null);

const form = ref({
  vehicleId: '',
  tripId: '',
  amountLiters: 0,
  costCents: 0 as number | '',
  recordedAt: '',
  notes: '',
});

function vehicleLabel(r: FuelRecord): string {
  if (r.vehicle) return `${r.vehicle.make} ${r.vehicle.model}`;
  return r.vehicleId;
}

function formatCost(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatTripLabel(t: Trip): string {
  const start = t.startAt ? new Date(t.startAt).toLocaleDateString() : '';
  const v = t.vehicle ? `${t.vehicle.make} ${t.vehicle.model}` : t.vehicleId;
  return `${v} – ${start}`;
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fuelApi.list();
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const [vRes, tRes] = await Promise.all([
    vehiclesApi.list(),
    tripsApi.list(),
  ]);
  vehicles.value = vRes.data.data;
  trips.value = tRes.data.data;
}

function openDrawer() {
  const now = new Date();
  const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  form.value = {
    vehicleId: '',
    tripId: '',
    amountLiters: 0,
    costCents: '',
    recordedAt: nowLocal,
    notes: '',
  };
  drawerOpen.value = true;
  loadOptions();
}

function closeDrawer() {
  drawerOpen.value = false;
}

async function submitForm() {
  saving.value = true;
  try {
    await fuelApi.create({
      vehicleId: form.value.vehicleId,
      tripId: form.value.tripId || undefined,
      amountLiters: form.value.amountLiters,
      costCents: form.value.costCents === '' ? undefined : Number(form.value.costCents),
      recordedAt: form.value.recordedAt ? new Date(form.value.recordedAt).toISOString() : undefined,
      notes: form.value.notes || undefined,
    });
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(r: FuelRecord) {
  deleteTarget.value = r;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await fuelApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.fuel-page { width: 100%; }
.fuel-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.fuel-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.fuel-page__actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.fuel-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.fuel-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.fuel-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.fuel-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.fuel-page__autocomplete-item:hover { background: #f0f0f0; }
.fuel-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.fuel-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.fuel-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.fuel-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.fuel-page__pagination-showing { font-size: 0.9rem; color: #666; }
.fuel-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.fuel-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.fuel-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.fuel-page__btn--primary { background: #1976d2; color: #fff; }
.fuel-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.fuel-page__btn--danger { background: #c62828; color: #fff; }
.fuel-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.fuel-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.fuel-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.fuel-page__btn--icon:hover { opacity: 0.9; }
.fuel-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; -webkit-overflow-scrolling: touch; max-height: 70vh; background: #fff; }
.fuel-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.fuel-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.fuel-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.fuel-page__th--sortable:hover { background: #eee; }
.fuel-page__th--sorted { color: #1976d2; }
.fuel-page__sort-icon { display: inline-block; vertical-align: middle; margin-left: 2px; }
.fuel-page__sort-placeholder { display: inline-block; opacity: 0.35; font-size: 0.7rem; margin-left: 2px; }
.fuel-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.fuel-page__row-loading td, .fuel-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.fuel-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.fuel-page__drawer { position: fixed; top: 0; right: 0; width: 400px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.fuel-page__drawer--open { transform: translateX(0); }
.fuel-page__drawer-inner { padding: 1.5rem; }
.fuel-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.fuel-page__drawer-title { font-size: 1.25rem; margin: 0; }
.fuel-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.fuel-page__drawer-close:hover { background: #f0f0f0; color: #333; }
.fuel-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.fuel-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.fuel-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.fuel-page__textarea { resize: vertical; min-height: 60px; }
.fuel-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.fuel-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.fuel-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.fuel-page__dialog-text { margin: 0 0 1rem; }
.fuel-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
