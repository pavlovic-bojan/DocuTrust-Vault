<template>
  <div class="drivers-page" data-test="page-drivers">
    <h1 class="drivers-page__title" data-test="drivers-title">{{ $t('drivers.title') }}</h1>
    <p class="drivers-page__subtitle" data-test="drivers-subtitle">{{ $t('drivers.subtitle') }}</p>
    <div class="drivers-page__actions">
      <div class="drivers-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="drivers-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="drivers-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="d in autocompleteSuggestions"
            :key="d.id"
            class="drivers-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(d)"
          >
            {{ rowSummary(d) }}
          </li>
        </ul>
      </div>
      <button type="button" class="drivers-page__btn drivers-page__btn--primary" data-test="button-add-driver" @click="openDrawer()">
        {{ $t('drivers.addDriver') }}
      </button>
    </div>
    <div class="drivers-page__table-wrap" data-test="table-wrap">
      <table class="drivers-page__table" data-test="table-drivers">
        <thead>
          <tr>
            <th class="drivers-page__th--sortable" :class="{ 'drivers-page__th--sorted': sortKey === 'name' }" @click="setSort('name')">
              {{ $t('drivers.name') }} <ChevronUp v-if="sortKey === 'name' && sortOrder === 'asc'" :size="14" class="drivers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'name' && sortOrder === 'desc'" :size="14" class="drivers-page__sort-icon" /><span v-else class="drivers-page__sort-placeholder">↕</span>
            </th>
            <th class="drivers-page__th--sortable" :class="{ 'drivers-page__th--sorted': sortKey === 'licenseNumber' }" @click="setSort('licenseNumber')">
              {{ $t('drivers.licenseNumber') }} <ChevronUp v-if="sortKey === 'licenseNumber' && sortOrder === 'asc'" :size="14" class="drivers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'licenseNumber' && sortOrder === 'desc'" :size="14" class="drivers-page__sort-icon" /><span v-else class="drivers-page__sort-placeholder">↕</span>
            </th>
            <th class="drivers-page__th--sortable" :class="{ 'drivers-page__th--sorted': sortKey === 'licenseExpiry' }" @click="setSort('licenseExpiry')">
              {{ $t('drivers.licenseExpiry') }} <ChevronUp v-if="sortKey === 'licenseExpiry' && sortOrder === 'asc'" :size="14" class="drivers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'licenseExpiry' && sortOrder === 'desc'" :size="14" class="drivers-page__sort-icon" /><span v-else class="drivers-page__sort-placeholder">↕</span>
            </th>
            <th class="drivers-page__th--sortable" :class="{ 'drivers-page__th--sorted': sortKey === 'phone' }" @click="setSort('phone')">
              {{ $t('drivers.phone') }} <ChevronUp v-if="sortKey === 'phone' && sortOrder === 'asc'" :size="14" class="drivers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'phone' && sortOrder === 'desc'" :size="14" class="drivers-page__sort-icon" /><span v-else class="drivers-page__sort-placeholder">↕</span>
            </th>
            <th class="drivers-page__th--sortable" :class="{ 'drivers-page__th--sorted': sortKey === 'status' }" @click="setSort('status')">
              {{ $t('drivers.status') }} <ChevronUp v-if="sortKey === 'status' && sortOrder === 'asc'" :size="14" class="drivers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'status' && sortOrder === 'desc'" :size="14" class="drivers-page__sort-icon" /><span v-else class="drivers-page__sort-placeholder">↕</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="drivers-page__row-loading" data-test="row-loading">
            <td colspan="6">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="items.length === 0" class="drivers-page__row-empty" data-test="row-empty">
            <td colspan="6">{{ $t('drivers.noDrivers') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="drivers-page__row-empty" data-test="row-no-matches">
            <td colspan="6">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="d in paginatedItems" :key="d.id" :data-test="`row-driver-${d.id}`">
            <td>{{ d.name }}</td>
            <td>{{ d.licenseNumber || '—' }}</td>
            <td>{{ d.licenseExpiry ? formatDate(d.licenseExpiry) : '—' }}</td>
            <td>{{ d.phone || '—' }}</td>
            <td>{{ $t(statusLabel(d.status)) }}</td>
            <td class="drivers-page__cell-actions">
              <button type="button" class="drivers-page__btn drivers-page__btn--icon" :aria-label="$t('drivers.editDriver')" data-test="button-edit-driver" @click="openDrawer(d)"><Pencil :size="18" stroke-width="2" /></button>
              <button type="button" class="drivers-page__btn drivers-page__btn--icon drivers-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-driver-${d.id}`" @click="confirmDelete(d)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="drivers-page__pagination" data-test="pagination">
      <div class="drivers-page__pagination-rows">
        <label for="drivers-rows-per-page" class="drivers-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="drivers-rows-per-page" v-model.number="rowsPerPage" class="drivers-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="drivers-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="drivers-page__pagination-nav">
        <button type="button" class="drivers-page__btn drivers-page__btn--secondary drivers-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="drivers-page__btn drivers-page__btn--secondary drivers-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="drivers-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="drivers-page__btn drivers-page__btn--secondary drivers-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="drivers-page__btn drivers-page__btn--secondary drivers-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <div v-if="drawerOpen" class="drivers-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="drivers-page__drawer" :class="{ 'drivers-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="drivers-page__drawer-inner">
        <div class="drivers-page__drawer-header">
          <h2 class="drivers-page__drawer-title" data-test="drawer-title">{{ editingId ? $t('drivers.editDriver') : $t('drivers.addDriver') }}</h2>
          <button type="button" class="drivers-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="drivers-page__form" data-test="form-driver" @submit.prevent="submitForm">
          <label class="drivers-page__label">{{ $t('drivers.name') }} *</label>
          <input v-model="form.name" type="text" class="drivers-page__input" data-test="input-name" required />
          <label class="drivers-page__label">{{ $t('drivers.licenseNumber') }}</label>
          <input v-model="form.licenseNumber" type="text" class="drivers-page__input" data-test="input-license-number" />
          <label class="drivers-page__label">{{ $t('drivers.licenseExpiry') }}</label>
          <input v-model="form.licenseExpiry" type="date" class="drivers-page__input" data-test="input-license-expiry" />
          <label class="drivers-page__label">{{ $t('drivers.phone') }}</label>
          <input v-model="form.phone" type="text" class="drivers-page__input" data-test="input-phone" />
          <label class="drivers-page__label">{{ $t('drivers.status') }}</label>
          <select v-model="form.status" class="drivers-page__input" data-test="select-status">
            <option value="ACTIVE">{{ $t('drivers.statusActive') }}</option>
            <option value="PAUSED">{{ $t('drivers.statusPaused') }}</option>
            <option value="FROZEN">{{ $t('drivers.statusFrozen') }}</option>
          </select>
          <div class="drivers-page__form-actions">
            <button type="submit" class="drivers-page__btn drivers-page__btn--primary" :disabled="saving" data-test="button-save-driver">{{ $t('common.save') }}</button>
            <button type="button" class="drivers-page__btn drivers-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <div v-if="deleteTarget" class="drivers-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="drivers-page__dialog" data-test="dialog-delete">
      <p class="drivers-page__dialog-text">{{ $t('drivers.confirmDelete') }}</p>
      <div class="drivers-page__dialog-actions">
        <button type="button" class="drivers-page__btn drivers-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="drivers-page__btn drivers-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next';
import { driversApi, type Driver as DriverType, type DriverStatus } from '../api/drivers.api';

const { t } = useI18n();
const loading = ref(true);
const items = ref<DriverType[]>([]);
const sortKey = ref<keyof DriverType | ''>('name');
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
    let cmp: number;
    if (key === 'licenseExpiry') {
      cmp = new Date(va as string).getTime() - new Date(vb as string).getTime();
    } else {
      cmp = String(va).localeCompare(String(vb));
    }
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

function searchableString(d: DriverType): string {
  return [
    d.name,
    d.licenseNumber ?? '',
    d.licenseExpiry ? formatDate(d.licenseExpiry) : '',
    d.phone ?? '',
    t(statusLabel(d.status)),
  ].join(' ').toLowerCase();
}

const filteredBySearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return sortedItems.value;
  return sortedItems.value.filter((d) => searchableString(d).includes(q));
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

function rowSummary(d: DriverType): string {
  return [d.name, d.licenseNumber ?? ''].filter(Boolean).join(' – ');
}

function selectSuggestion(d: DriverType) {
  searchQuery.value = rowSummary(d);
  showAutocomplete.value = false;
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

function setSort(key: keyof DriverType) {
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
const deleteTarget = ref<DriverType | null>(null);

const form = ref({
  name: '',
  licenseNumber: '',
  licenseExpiry: '',
  phone: '',
  status: 'ACTIVE' as DriverStatus,
});

const statusLabelMap: Record<DriverStatus, string> = {
  ACTIVE: 'drivers.statusActive',
  PAUSED: 'drivers.statusPaused',
  FROZEN: 'drivers.statusFrozen',
};

function statusLabel(s: DriverStatus): string {
  return statusLabelMap[s] || s;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await driversApi.list();
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

function openDrawer(driver?: DriverType) {
  editingId.value = driver?.id ?? null;
  form.value = {
    name: driver?.name ?? '',
    licenseNumber: driver?.licenseNumber ?? '',
    licenseExpiry: driver?.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : '',
    phone: driver?.phone ?? '',
    status: (driver?.status as DriverStatus) ?? 'ACTIVE',
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
      name: form.value.name,
      licenseNumber: form.value.licenseNumber || undefined,
      licenseExpiry: form.value.licenseExpiry || undefined,
      phone: form.value.phone || undefined,
      status: form.value.status,
    };
    if (id) {
      await driversApi.update(id, payload);
    } else {
      await driversApi.create(payload);
    }
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(d: DriverType) {
  deleteTarget.value = d;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await driversApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.drivers-page { width: 100%; }
.drivers-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.drivers-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.drivers-page__actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.drivers-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.drivers-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.drivers-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.drivers-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.drivers-page__autocomplete-item:hover { background: #f0f0f0; }
.drivers-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.drivers-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.drivers-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.drivers-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.drivers-page__pagination-showing { font-size: 0.9rem; color: #666; }
.drivers-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.drivers-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.drivers-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.drivers-page__btn--primary { background: #1976d2; color: #fff; }
.drivers-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.drivers-page__btn--danger { background: #c62828; color: #fff; }
.drivers-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.drivers-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.drivers-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.drivers-page__btn--icon:hover { opacity: 0.9; }
.drivers-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; -webkit-overflow-scrolling: touch; max-height: 70vh; background: #fff; }
.drivers-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.drivers-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.drivers-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.drivers-page__th--sortable:hover { background: #eee; }
.drivers-page__th--sorted { color: #1976d2; }
.drivers-page__sort-icon { display: inline-block; vertical-align: middle; margin-left: 2px; }
.drivers-page__sort-placeholder { display: inline-block; opacity: 0.35; font-size: 0.7rem; margin-left: 2px; }
.drivers-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.drivers-page__row-loading td, .drivers-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.drivers-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.drivers-page__drawer { position: fixed; top: 0; right: 0; width: 360px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.drivers-page__drawer--open { transform: translateX(0); }
.drivers-page__drawer-inner { padding: 1.5rem; }
.drivers-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.drivers-page__drawer-title { font-size: 1.25rem; margin: 0; }
.drivers-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.drivers-page__drawer-close:hover { background: #f0f0f0; color: #333; }
.drivers-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.drivers-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.drivers-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.drivers-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.drivers-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.drivers-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.drivers-page__dialog-text { margin: 0 0 1rem; }
.drivers-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
