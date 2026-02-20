<template>
  <div class="vehicles-page" data-test="page-vehicles">
    <h1 class="vehicles-page__title" data-test="vehicles-title">{{ $t('vehicles.title') }}</h1>
    <p class="vehicles-page__subtitle" data-test="vehicles-subtitle">{{ $t('vehicles.subtitle') }}</p>
    <div class="vehicles-page__actions">
      <div class="vehicles-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="vehicles-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="vehicles-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="v in autocompleteSuggestions"
            :key="v.id"
            class="vehicles-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(v)"
          >
            {{ rowSummary(v) }}
          </li>
        </ul>
      </div>
      <button type="button" class="vehicles-page__btn vehicles-page__btn--primary" data-test="button-add-vehicle" @click="openDrawer()">
        {{ $t('vehicles.addVehicle') }}
      </button>
    </div>
    <div class="vehicles-page__table-wrap" data-test="table-wrap">
      <table class="vehicles-page__table" data-test="table-vehicles">
        <thead>
          <tr>
            <th class="vehicles-page__th--sortable" :class="{ 'vehicles-page__th--sorted': sortKey === 'make' }" @click="setSort('make')">
              {{ $t('vehicles.make') }} <ChevronUp v-if="sortKey === 'make' && sortOrder === 'asc'" :size="14" class="vehicles-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'make' && sortOrder === 'desc'" :size="14" class="vehicles-page__sort-icon" /><span v-else class="vehicles-page__sort-placeholder">↕</span>
            </th>
            <th class="vehicles-page__th--sortable" :class="{ 'vehicles-page__th--sorted': sortKey === 'model' }" @click="setSort('model')">
              {{ $t('vehicles.model') }} <ChevronUp v-if="sortKey === 'model' && sortOrder === 'asc'" :size="14" class="vehicles-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'model' && sortOrder === 'desc'" :size="14" class="vehicles-page__sort-icon" /><span v-else class="vehicles-page__sort-placeholder">↕</span>
            </th>
            <th class="vehicles-page__th--sortable" :class="{ 'vehicles-page__th--sorted': sortKey === 'vin' }" @click="setSort('vin')">
              {{ $t('vehicles.vin') }} <ChevronUp v-if="sortKey === 'vin' && sortOrder === 'asc'" :size="14" class="vehicles-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'vin' && sortOrder === 'desc'" :size="14" class="vehicles-page__sort-icon" /><span v-else class="vehicles-page__sort-placeholder">↕</span>
            </th>
            <th class="vehicles-page__th--sortable" :class="{ 'vehicles-page__th--sorted': sortKey === 'registration' }" @click="setSort('registration')">
              {{ $t('vehicles.registration') }} <ChevronUp v-if="sortKey === 'registration' && sortOrder === 'asc'" :size="14" class="vehicles-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'registration' && sortOrder === 'desc'" :size="14" class="vehicles-page__sort-icon" /><span v-else class="vehicles-page__sort-placeholder">↕</span>
            </th>
            <th class="vehicles-page__th--sortable" :class="{ 'vehicles-page__th--sorted': sortKey === 'mileage' }" @click="setSort('mileage')">
              {{ $t('vehicles.mileage') }} <ChevronUp v-if="sortKey === 'mileage' && sortOrder === 'asc'" :size="14" class="vehicles-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'mileage' && sortOrder === 'desc'" :size="14" class="vehicles-page__sort-icon" /><span v-else class="vehicles-page__sort-placeholder">↕</span>
            </th>
            <th class="vehicles-page__th--sortable" :class="{ 'vehicles-page__th--sorted': sortKey === 'status' }" @click="setSort('status')">
              {{ $t('vehicles.status') }} <ChevronUp v-if="sortKey === 'status' && sortOrder === 'asc'" :size="14" class="vehicles-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'status' && sortOrder === 'desc'" :size="14" class="vehicles-page__sort-icon" /><span v-else class="vehicles-page__sort-placeholder">↕</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="vehicles-page__row-loading" data-test="row-loading">
            <td colspan="7">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="items.length === 0" class="vehicles-page__row-empty" data-test="row-empty">
            <td colspan="7">{{ $t('vehicles.noVehicles') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="vehicles-page__row-empty" data-test="row-no-matches">
            <td colspan="7">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="v in paginatedItems" :key="v.id" :data-test="`row-vehicle-${v.id}`">
            <td>{{ v.make }}</td>
            <td>{{ v.model }}</td>
            <td>{{ v.vin || '—' }}</td>
            <td>{{ v.registration || '—' }}</td>
            <td>{{ v.mileage }}</td>
            <td>{{ $t(statusLabel(v.status)) }}</td>
            <td class="vehicles-page__cell-actions">
              <button type="button" class="vehicles-page__btn vehicles-page__btn--icon" :aria-label="$t('vehicles.editVehicle')" data-test="button-edit-vehicle" @click="openDrawer(v)"><Pencil :size="18" stroke-width="2" /></button>
              <button type="button" class="vehicles-page__btn vehicles-page__btn--icon vehicles-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-vehicle-${v.id}`" @click="confirmDelete(v)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="vehicles-page__pagination" data-test="pagination">
      <div class="vehicles-page__pagination-rows">
        <label for="vehicles-rows-per-page" class="vehicles-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="vehicles-rows-per-page" v-model.number="rowsPerPage" class="vehicles-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="vehicles-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="vehicles-page__pagination-nav">
        <button type="button" class="vehicles-page__btn vehicles-page__btn--secondary vehicles-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="vehicles-page__btn vehicles-page__btn--secondary vehicles-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="vehicles-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="vehicles-page__btn vehicles-page__btn--secondary vehicles-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="vehicles-page__btn vehicles-page__btn--secondary vehicles-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <!-- Drawer for create/edit (per .cursor rules: use Drawer for create/edit) -->
    <div v-if="drawerOpen" class="vehicles-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="vehicles-page__drawer" :class="{ 'vehicles-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="vehicles-page__drawer-inner">
        <div class="vehicles-page__drawer-header">
          <h2 class="vehicles-page__drawer-title" data-test="drawer-title">{{ editingId ? $t('vehicles.editVehicle') : $t('vehicles.addVehicle') }}</h2>
          <button type="button" class="vehicles-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="vehicles-page__form" data-test="form-vehicle" @submit.prevent="submitForm">
          <label class="vehicles-page__label">{{ $t('vehicles.make') }} *</label>
          <input v-model="form.make" type="text" class="vehicles-page__input" data-test="input-make" required />
          <label class="vehicles-page__label">{{ $t('vehicles.model') }} *</label>
          <input v-model="form.model" type="text" class="vehicles-page__input" data-test="input-model" required />
          <label class="vehicles-page__label">{{ $t('vehicles.vin') }}</label>
          <input v-model="form.vin" type="text" class="vehicles-page__input" data-test="input-vin" />
          <label class="vehicles-page__label">{{ $t('vehicles.registration') }}</label>
          <input v-model="form.registration" type="text" class="vehicles-page__input" data-test="input-registration" />
          <label class="vehicles-page__label">{{ $t('vehicles.mileage') }}</label>
          <input v-model.number="form.mileage" type="number" min="0" class="vehicles-page__input" data-test="input-mileage" />
          <label class="vehicles-page__label">{{ $t('vehicles.purchaseDate') }}</label>
          <input v-model="form.purchaseDate" type="date" class="vehicles-page__input" data-test="input-purchase-date" />
          <label class="vehicles-page__label">{{ $t('vehicles.status') }}</label>
          <select v-model="form.status" class="vehicles-page__input" data-test="select-status">
            <option value="ACTIVE">{{ $t('vehicles.statusActive') }}</option>
            <option value="PAUSED">{{ $t('vehicles.statusPaused') }}</option>
            <option value="FROZEN">{{ $t('vehicles.statusFrozen') }}</option>
            <option value="IN_SERVICE">{{ $t('vehicles.statusInService') }}</option>
          </select>
          <div class="vehicles-page__form-actions">
            <button type="submit" class="vehicles-page__btn vehicles-page__btn--primary" :disabled="saving" data-test="button-save-vehicle">{{ $t('common.save') }}</button>
            <button type="button" class="vehicles-page__btn vehicles-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <!-- Delete confirmation dialog (per .cursor rules: use Dialog only for delete confirm) -->
    <div v-if="deleteTarget" class="vehicles-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="vehicles-page__dialog" data-test="dialog-delete">
      <p class="vehicles-page__dialog-text">{{ $t('vehicles.confirmDelete') }}</p>
      <div class="vehicles-page__dialog-actions">
        <button type="button" class="vehicles-page__btn vehicles-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="vehicles-page__btn vehicles-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next';
import { vehiclesApi, type Vehicle, type VehicleStatus } from '../api/vehicles.api';

const { t } = useI18n();
const loading = ref(true);
const items = ref<Vehicle[]>([]);
const sortKey = ref<keyof Vehicle | ''>('make');
const sortOrder = ref<'asc' | 'desc'>('asc');
const searchQuery = ref('');
const showAutocomplete = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [10, 25, 50, 100];

const sortedItems = computed(() => {
  const key = sortKey.value;
  if (!key || !items.value.length) return items.value;
  return [...items.value].sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

function searchableString(v: Vehicle): string {
  return [
    v.make,
    v.model,
    v.vin ?? '',
    v.registration ?? '',
    String(v.mileage),
    t(statusLabel(v.status)),
  ].join(' ').toLowerCase();
}

const filteredBySearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return sortedItems.value;
  return sortedItems.value.filter((v) => searchableString(v).includes(q));
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

function rowSummary(v: Vehicle): string {
  return [v.make, v.model, v.vin ?? '', v.registration ?? ''].filter(Boolean).join(' ');
}

function selectSuggestion(v: Vehicle) {
  searchQuery.value = rowSummary(v);
  showAutocomplete.value = false;
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

function setSort(key: keyof Vehicle) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}
const drawerOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const deleteTarget = ref<Vehicle | null>(null);

const form = ref({
  make: '',
  model: '',
  vin: '',
  registration: '',
  mileage: 0,
  purchaseDate: '',
  status: 'ACTIVE' as VehicleStatus,
});

const statusLabelMap: Record<VehicleStatus, string> = {
  ACTIVE: 'vehicles.statusActive',
  PAUSED: 'vehicles.statusPaused',
  FROZEN: 'vehicles.statusFrozen',
  IN_SERVICE: 'vehicles.statusInService',
};

function statusLabel(s: VehicleStatus): string {
  return statusLabelMap[s] || s;
}

async function load() {
  loading.value = true;
  try {
    const { data } = await vehiclesApi.list();
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

function openDrawer(vehicle?: Vehicle) {
  editingId.value = vehicle?.id ?? null;
  form.value = {
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    vin: vehicle?.vin ?? '',
    registration: vehicle?.registration ?? '',
    mileage: vehicle?.mileage ?? 0,
    purchaseDate: vehicle?.purchaseDate ? vehicle.purchaseDate.slice(0, 10) : '',
    status: (vehicle?.status as VehicleStatus) ?? 'ACTIVE',
  };
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
  editingId.value = null;
}

async function submitForm() {
  saving.value = true;
  try {
    const id = editingId.value;
    const payload = {
      make: form.value.make,
      model: form.value.model,
      vin: form.value.vin || undefined,
      registration: form.value.registration || undefined,
      mileage: form.value.mileage,
      purchaseDate: form.value.purchaseDate || undefined,
      status: form.value.status,
    };
    if (id) {
      await vehiclesApi.update(id, payload);
    } else {
      await vehiclesApi.create(payload);
    }
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(v: Vehicle) {
  deleteTarget.value = v;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await vehiclesApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.vehicles-page { width: 100%; }
.vehicles-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.vehicles-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.vehicles-page__actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.vehicles-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.vehicles-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.vehicles-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.vehicles-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.vehicles-page__autocomplete-item:hover { background: #f0f0f0; }
.vehicles-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.vehicles-page__btn--primary { background: #1976d2; color: #fff; }
.vehicles-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.vehicles-page__btn--danger { background: #c62828; color: #fff; }
.vehicles-page__btn--smallall { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.vehicles-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.vehicles-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.vehicles-page__btn--icon:hover { opacity: 0.9; }
.vehicles-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.vehicles-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.vehicles-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.vehicles-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.vehicles-page__pagination-showing { font-size: 0.9rem; color: #666; }
.vehicles-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.vehicles-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.vehicles-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; -webkit-overflow-scrolling: touch; max-height: 70vh; background: #fff; }
.vehicles-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.vehicles-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.vehicles-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.vehicles-page__th--sortable:hover { background: #eee; }
.vehicles-page__th--sorted { color: #1976d2; }
.vehicles-page__sort-icon { display: inline-block; vertical-align: middle; margin-left: 2px; }
.vehicles-page__sort-placeholder { display: inline-block; opacity: 0.35; font-size: 0.7rem; margin-left: 2px; }
.vehicles-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.vehicles-page__row-loading td, .vehicles-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.vehicles-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.vehicles-page__drawer { position: fixed; top: 0; right: 0; width: 360px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.vehicles-page__drawer--open { transform: translateX(0); }
.vehicles-page__drawer-inner { padding: 1.5rem; }
.vehicles-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.vehicles-page__drawer-title { font-size: 1.25rem; margin: 0; }
.vehicles-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.vehicles-page__drawer-close:hover { background: #f0f0f0; color: #333; }
.vehicles-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.vehicles-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.vehicles-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.vehicles-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.vehicles-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.vehicles-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.vehicles-page__dialog-text { margin: 0 0 1rem; }
.vehicles-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
