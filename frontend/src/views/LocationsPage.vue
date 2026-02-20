<template>
  <div class="locations-page" data-test="page-locations">
    <h1 class="locations-page__title" data-test="locations-title">{{ $t('locations.title') }}</h1>
    <p class="locations-page__subtitle" data-test="locations-subtitle">{{ $t('locations.subtitle') }}</p>
    <div class="locations-page__actions">
      <div class="locations-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="locations-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="locations-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="loc in autocompleteSuggestions"
            :key="loc.id"
            class="locations-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(loc)"
          >
            {{ rowSummary(loc) }}
          </li>
        </ul>
      </div>
      <button type="button" class="locations-page__btn locations-page__btn--primary" data-test="button-add-location" @click="openDrawer()">
        {{ $t('locations.addLocation') }}
      </button>
      <select v-model="filterType" class="locations-page__filter" data-test="filter-type">
        <option value="">{{ $t('common.all') }}</option>
        <option value="PARKING">{{ $t('locations.typeParking') }}</option>
        <option value="SERVICE">{{ $t('locations.typeService') }}</option>
      </select>
    </div>
    <div class="locations-page__table-wrap" data-test="table-wrap">
      <table class="locations-page__table" data-test="table-locations">
        <thead>
          <tr>
            <th class="locations-page__th--sortable" :class="{ 'locations-page__th--sorted': sortKey === 'name' }" @click="setSort('name')">
              {{ $t('locations.name') }} <ChevronUp v-if="sortKey === 'name' && sortOrder === 'asc'" :size="14" class="locations-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'name' && sortOrder === 'desc'" :size="14" class="locations-page__sort-icon" /><span v-else class="locations-page__sort-placeholder">↕</span>
            </th>
            <th class="locations-page__th--sortable" :class="{ 'locations-page__th--sorted': sortKey === 'type' }" @click="setSort('type')">
              {{ $t('locations.type') }} <ChevronUp v-if="sortKey === 'type' && sortOrder === 'asc'" :size="14" class="locations-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'type' && sortOrder === 'desc'" :size="14" class="locations-page__sort-icon" /><span v-else class="locations-page__sort-placeholder">↕</span>
            </th>
            <th class="locations-page__th--sortable" :class="{ 'locations-page__th--sorted': sortKey === 'address' }" @click="setSort('address')">
              {{ $t('locations.address') }} <ChevronUp v-if="sortKey === 'address' && sortOrder === 'asc'" :size="14" class="locations-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'address' && sortOrder === 'desc'" :size="14" class="locations-page__sort-icon" /><span v-else class="locations-page__sort-placeholder">↕</span>
            </th>
            <th class="locations-page__th--sortable" :class="{ 'locations-page__th--sorted': sortKey === 'status' }" @click="setSort('status')">
              {{ $t('locations.status') }} <ChevronUp v-if="sortKey === 'status' && sortOrder === 'asc'" :size="14" class="locations-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'status' && sortOrder === 'desc'" :size="14" class="locations-page__sort-icon" /><span v-else class="locations-page__sort-placeholder">↕</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="locations-page__row-loading" data-test="row-loading">
            <td colspan="5">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="sortedFilteredItems.length === 0" class="locations-page__row-empty" data-test="row-empty">
            <td colspan="5">{{ $t('locations.noLocations') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="locations-page__row-empty" data-test="row-no-matches">
            <td colspan="5">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="loc in paginatedItems" :key="loc.id" :data-test="`row-location-${loc.id}`">
            <td>{{ loc.name }}</td>
            <td>{{ loc.type === 'PARKING' ? $t('locations.typeParking') : $t('locations.typeService') }}</td>
            <td>{{ loc.address || '—' }}</td>
            <td>{{ $t(statusLabel(loc.status)) }}</td>
            <td class="locations-page__cell-actions">
              <button type="button" class="locations-page__btn locations-page__btn--icon" :aria-label="$t('locations.editLocation')" data-test="button-edit-location" @click="openDrawer(loc)"><Pencil :size="18" stroke-width="2" /></button>
              <button type="button" class="locations-page__btn locations-page__btn--icon locations-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-location-${loc.id}`" @click="confirmDelete(loc)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="locations-page__pagination" data-test="pagination">
      <div class="locations-page__pagination-rows">
        <label for="locations-rows-per-page" class="locations-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="locations-rows-per-page" v-model.number="rowsPerPage" class="locations-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="locations-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="locations-page__pagination-nav">
        <button type="button" class="locations-page__btn locations-page__btn--secondary locations-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="locations-page__btn locations-page__btn--secondary locations-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="locations-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="locations-page__btn locations-page__btn--secondary locations-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="locations-page__btn locations-page__btn--secondary locations-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <div v-if="drawerOpen" class="locations-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="locations-page__drawer" :class="{ 'locations-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="locations-page__drawer-inner">
        <div class="locations-page__drawer-header">
          <h2 class="locations-page__drawer-title" data-test="drawer-title">{{ editingId ? $t('locations.editLocation') : $t('locations.addLocation') }}</h2>
          <button type="button" class="locations-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="locations-page__form" data-test="form-location" @submit.prevent="submitForm">
          <label class="locations-page__label">{{ $t('locations.name') }} *</label>
          <input v-model="form.name" type="text" class="locations-page__input" data-test="input-name" required />
          <label class="locations-page__label">{{ $t('locations.type') }} *</label>
          <select v-model="form.type" class="locations-page__input" data-test="select-type" required :disabled="!!editingId">
            <option value="">{{ $t('locations.selectType') }}</option>
            <option value="PARKING">{{ $t('locations.typeParking') }}</option>
            <option value="SERVICE">{{ $t('locations.typeService') }}</option>
          </select>
          <label class="locations-page__label">{{ $t('locations.address') }}</label>
          <input v-model="form.address" type="text" class="locations-page__input" data-test="input-address" />
          <label class="locations-page__label">{{ $t('locations.status') }}</label>
          <select v-model="form.status" class="locations-page__input" data-test="select-status">
            <option value="ACTIVE">{{ $t('locations.statusActive') }}</option>
            <option value="PAUSED">{{ $t('locations.statusPaused') }}</option>
            <option value="FROZEN">{{ $t('locations.statusFrozen') }}</option>
          </select>
          <div class="locations-page__form-actions">
            <button type="submit" class="locations-page__btn locations-page__btn--primary" :disabled="saving" data-test="button-save-location">{{ $t('common.save') }}</button>
            <button type="button" class="locations-page__btn locations-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <div v-if="deleteTarget" class="locations-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="locations-page__dialog" data-test="dialog-delete">
      <p class="locations-page__dialog-text">{{ $t('locations.confirmDelete') }}</p>
      <div class="locations-page__dialog-actions">
        <button type="button" class="locations-page__btn locations-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="locations-page__btn locations-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next';
import { locationsApi, type Location as LocationType, type LocationStatus } from '../api/locations.api';

const { t } = useI18n();
const loading = ref(true);
const items = ref<LocationType[]>([]);
const drawerOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const deleteTarget = ref<LocationType | null>(null);
const filterType = ref<'PARKING' | 'SERVICE' | ''>('');
const sortKey = ref<keyof LocationType | ''>('name');
const sortOrder = ref<'asc' | 'desc'>('asc');
const searchQuery = ref('');
const showAutocomplete = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [10, 25, 50, 100];

const form = ref({
  name: '',
  type: 'PARKING' as 'PARKING' | 'SERVICE',
  address: '',
  status: 'ACTIVE' as LocationStatus,
});

const statusLabelMap: Record<LocationStatus, string> = {
  ACTIVE: 'locations.statusActive',
  PAUSED: 'locations.statusPaused',
  FROZEN: 'locations.statusFrozen',
};

function statusLabel(s: LocationStatus): string {
  return statusLabelMap[s] || s;
}

const filteredItems = computed(() => {
  if (!filterType.value) return items.value;
  return items.value.filter((l) => l.type === filterType.value);
});

const sortedFilteredItems = computed(() => {
  const key = sortKey.value;
  const list = filteredItems.value;
  if (!key || !list.length) return list;
  return [...list].sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    const cmp = String(va).localeCompare(String(vb));
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

function typeLabel(loc: LocationType): string {
  return loc.type === 'PARKING' ? t('locations.typeParking') : t('locations.typeService');
}

function searchableString(loc: LocationType): string {
  return [
    loc.name,
    typeLabel(loc),
    loc.address ?? '',
    t(statusLabel(loc.status)),
  ].join(' ').toLowerCase();
}

const filteredBySearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return sortedFilteredItems.value;
  return sortedFilteredItems.value.filter((loc) => searchableString(loc).includes(q));
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

function rowSummary(loc: LocationType): string {
  return `${loc.name} – ${typeLabel(loc)}`;
}

function selectSuggestion(loc: LocationType) {
  searchQuery.value = rowSummary(loc);
  showAutocomplete.value = false;
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

function setSort(key: keyof LocationType) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await locationsApi.list();
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

function openDrawer(loc?: LocationType) {
  editingId.value = loc?.id ?? null;
  form.value = {
    name: loc?.name ?? '',
    type: (loc?.type as 'PARKING' | 'SERVICE') ?? 'PARKING',
    address: loc?.address ?? '',
    status: (loc?.status as LocationStatus) ?? 'ACTIVE',
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
      type: form.value.type,
      address: form.value.address || undefined,
      status: form.value.status,
    };
    if (id) {
      await locationsApi.update(id, payload);
    } else {
      await locationsApi.create(payload);
    }
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(loc: LocationType) {
  deleteTarget.value = loc;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await locationsApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.locations-page { width: 100%; }
.locations-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.locations-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.locations-page__actions { margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.locations-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.locations-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.locations-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.locations-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.locations-page__autocomplete-item:hover { background: #f0f0f0; }
.locations-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.locations-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.locations-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.locations-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.locations-page__pagination-showing { font-size: 0.9rem; color: #666; }
.locations-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.locations-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.locations-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.locations-page__btn--primary { background: #1976d2; color: #fff; }
.locations-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.locations-page__btn--danger { background: #c62828; color: #fff; }
.locations-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.locations-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.locations-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.locations-page__btn--icon:hover { opacity: 0.9; }
.locations-page__filter { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; }
.locations-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; -webkit-overflow-scrolling: touch; max-height: 70vh; background: #fff; }
.locations-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.locations-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.locations-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.locations-page__th--sortable:hover { background: #eee; }
.locations-page__th--sorted { color: #1976d2; }
.locations-page__sort-icon { display: inline-block; vertical-align: middle; margin-left: 2px; }
.locations-page__sort-placeholder { display: inline-block; opacity: 0.35; font-size: 0.7rem; margin-left: 2px; }
.locations-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.locations-page__row-loading td, .locations-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.locations-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.locations-page__drawer { position: fixed; top: 0; right: 0; width: 360px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.locations-page__drawer--open { transform: translateX(0); }
.locations-page__drawer-inner { padding: 1.5rem; }
.locations-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.locations-page__drawer-title { font-size: 1.25rem; margin: 0; }
.locations-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.locations-page__drawer-close:hover { background: #f0f0f0; color: #333; }
.locations-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.locations-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.locations-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.locations-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.locations-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.locations-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.locations-page__dialog-text { margin: 0 0 1rem; }
.locations-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
