<template>
  <div class="trailers-page" data-test="page-trailers">
    <h1 class="trailers-page__title" data-test="trailers-title">{{ $t('trailers.title') }}</h1>
    <p class="trailers-page__subtitle" data-test="trailers-subtitle">{{ $t('trailers.subtitle') }}</p>
    <div class="trailers-page__actions">
      <div class="trailers-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="trailers-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="trailers-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="v in autocompleteSuggestions"
            :key="v.id"
            class="trailers-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(v)"
          >
            {{ rowSummary(v) }}
          </li>
        </ul>
      </div>
      <button type="button" class="trailers-page__btn trailers-page__btn--primary" data-test="button-add-trailer" @click="openDrawer()">
        {{ $t('trailers.addTrailer') }}
      </button>
    </div>
    <div class="trailers-page__table-wrap" data-test="table-wrap">
      <table class="trailers-page__table" data-test="table-trailers">
        <thead>
          <tr>
            <th class="trailers-page__th--sortable" :class="{ 'trailers-page__th--sorted': sortKey === 'make' }" @click="setSort('make')">
              {{ $t('trailers.make') }} <ChevronUp v-if="sortKey === 'make' && sortOrder === 'asc'" :size="14" class="trailers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'make' && sortOrder === 'desc'" :size="14" class="trailers-page__sort-icon" /><span v-else class="trailers-page__sort-placeholder">↕</span>
            </th>
            <th class="trailers-page__th--sortable" :class="{ 'trailers-page__th--sorted': sortKey === 'model' }" @click="setSort('model')">
              {{ $t('trailers.model') }} <ChevronUp v-if="sortKey === 'model' && sortOrder === 'asc'" :size="14" class="trailers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'model' && sortOrder === 'desc'" :size="14" class="trailers-page__sort-icon" /><span v-else class="trailers-page__sort-placeholder">↕</span>
            </th>
            <th class="trailers-page__th--sortable" :class="{ 'trailers-page__th--sorted': sortKey === 'registration' }" @click="setSort('registration')">
              {{ $t('trailers.registration') }} <ChevronUp v-if="sortKey === 'registration' && sortOrder === 'asc'" :size="14" class="trailers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'registration' && sortOrder === 'desc'" :size="14" class="trailers-page__sort-icon" /><span v-else class="trailers-page__sort-placeholder">↕</span>
            </th>
            <th class="trailers-page__th--sortable" :class="{ 'trailers-page__th--sorted': sortKey === 'mileage' }" @click="setSort('mileage')">
              {{ $t('trailers.mileage') }} <ChevronUp v-if="sortKey === 'mileage' && sortOrder === 'asc'" :size="14" class="trailers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'mileage' && sortOrder === 'desc'" :size="14" class="trailers-page__sort-icon" /><span v-else class="trailers-page__sort-placeholder">↕</span>
            </th>
            <th class="trailers-page__th--sortable" :class="{ 'trailers-page__th--sorted': sortKey === 'status' }" @click="setSort('status')">
              {{ $t('trailers.status') }} <ChevronUp v-if="sortKey === 'status' && sortOrder === 'asc'" :size="14" class="trailers-page__sort-icon" /><ChevronDown v-else-if="sortKey === 'status' && sortOrder === 'desc'" :size="14" class="trailers-page__sort-icon" /><span v-else class="trailers-page__sort-placeholder">↕</span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="trailers-page__row-loading" data-test="row-loading">
            <td colspan="6">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="items.length === 0" class="trailers-page__row-empty" data-test="row-empty">
            <td colspan="6">{{ $t('trailers.noTrailers') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="trailers-page__row-empty" data-test="row-no-matches">
            <td colspan="6">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="v in paginatedItems" :key="v.id" :data-test="`row-trailer-${v.id}`">
            <td>{{ v.make }}</td>
            <td>{{ v.model }}</td>
            <td>{{ v.registration || '—' }}</td>
            <td>{{ v.mileage }}</td>
            <td>{{ $t(statusLabel(v.status)) }}</td>
            <td class="trailers-page__cell-actions">
              <button type="button" class="trailers-page__btn trailers-page__btn--icon" :aria-label="$t('trailers.editTrailer')" data-test="button-edit-trailer" @click="openDrawer(v)"><Pencil :size="18" stroke-width="2" /></button>
              <button type="button" class="trailers-page__btn trailers-page__btn--icon trailers-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-trailer-${v.id}`" @click="confirmDelete(v)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="trailers-page__pagination" data-test="pagination">
      <div class="trailers-page__pagination-rows">
        <label for="trailers-rows-per-page" class="trailers-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="trailers-rows-per-page" v-model.number="rowsPerPage" class="trailers-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="trailers-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="trailers-page__pagination-nav">
        <button type="button" class="trailers-page__btn trailers-page__btn--secondary trailers-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="trailers-page__btn trailers-page__btn--secondary trailers-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="trailers-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="trailers-page__btn trailers-page__btn--secondary trailers-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="trailers-page__btn trailers-page__btn--secondary trailers-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <div v-if="drawerOpen" class="trailers-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="trailers-page__drawer" :class="{ 'trailers-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="trailers-page__drawer-inner">
        <div class="trailers-page__drawer-header">
          <h2 class="trailers-page__drawer-title" data-test="drawer-title">{{ editingId ? $t('trailers.editTrailer') : $t('trailers.addTrailer') }}</h2>
          <button type="button" class="trailers-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="trailers-page__form" data-test="form-trailer" @submit.prevent="submitForm">
          <label class="trailers-page__label">{{ $t('trailers.make') }} *</label>
          <input v-model="form.make" type="text" class="trailers-page__input" data-test="input-make" required />
          <label class="trailers-page__label">{{ $t('trailers.model') }} *</label>
          <input v-model="form.model" type="text" class="trailers-page__input" data-test="input-model" required />
          <label class="trailers-page__label">{{ $t('trailers.registration') }}</label>
          <input v-model="form.registration" type="text" class="trailers-page__input" data-test="input-registration" />
          <label class="trailers-page__label">{{ $t('trailers.mileage') }}</label>
          <input v-model.number="form.mileage" type="number" min="0" class="trailers-page__input" data-test="input-mileage" />
          <label class="trailers-page__label">{{ $t('trailers.purchaseDate') }}</label>
          <input v-model="form.purchaseDate" type="date" class="trailers-page__input" data-test="input-purchase-date" />
          <label class="trailers-page__label">{{ $t('trailers.status') }}</label>
          <select v-model="form.status" class="trailers-page__input" data-test="select-status">
            <option value="ACTIVE">{{ $t('trailers.statusActive') }}</option>
            <option value="PAUSED">{{ $t('trailers.statusPaused') }}</option>
            <option value="FROZEN">{{ $t('trailers.statusFrozen') }}</option>
            <option value="IN_SERVICE">{{ $t('trailers.statusInService') }}</option>
          </select>
          <div class="trailers-page__form-actions">
            <button type="submit" class="trailers-page__btn trailers-page__btn--primary" :disabled="saving" data-test="button-save-trailer">{{ $t('common.save') }}</button>
            <button type="button" class="trailers-page__btn trailers-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <div v-if="deleteTarget" class="trailers-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="trailers-page__dialog" data-test="dialog-delete">
      <p class="trailers-page__dialog-text">{{ $t('trailers.confirmDelete') }}</p>
      <div class="trailers-page__dialog-actions">
        <button type="button" class="trailers-page__btn trailers-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="trailers-page__btn trailers-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next';
import { trailersApi, type Trailer, type TrailerStatus } from '../api/trailers.api';

const { t } = useI18n();
const loading = ref(true);
const items = ref<Trailer[]>([]);
const sortKey = ref<keyof Trailer | ''>('make');
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

function searchableString(v: Trailer): string {
  return [
    v.make,
    v.model,
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

function rowSummary(v: Trailer): string {
  return [v.make, v.model, v.registration ?? ''].filter(Boolean).join(' ');
}

function selectSuggestion(v: Trailer) {
  searchQuery.value = rowSummary(v);
  showAutocomplete.value = false;
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

function setSort(key: keyof Trailer) {
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
const deleteTarget = ref<Trailer | null>(null);

const form = ref({
  make: '',
  model: '',
  registration: '',
  mileage: 0,
  purchaseDate: '',
  status: 'ACTIVE' as TrailerStatus,
});

const statusLabelMap: Record<TrailerStatus, string> = {
  ACTIVE: 'trailers.statusActive',
  PAUSED: 'trailers.statusPaused',
  FROZEN: 'trailers.statusFrozen',
  IN_SERVICE: 'trailers.statusInService',
};

function statusLabel(s: TrailerStatus): string {
  return statusLabelMap[s] || s;
}

async function load() {
  loading.value = true;
  try {
    const { data } = await trailersApi.list();
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

function openDrawer(trailer?: Trailer) {
  editingId.value = trailer?.id ?? null;
  form.value = {
    make: trailer?.make ?? '',
    model: trailer?.model ?? '',
    registration: trailer?.registration ?? '',
    mileage: trailer?.mileage ?? 0,
    purchaseDate: trailer?.purchaseDate ? trailer.purchaseDate.slice(0, 10) : '',
    status: (trailer?.status as TrailerStatus) ?? 'ACTIVE',
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
      registration: form.value.registration || undefined,
      mileage: form.value.mileage,
      purchaseDate: form.value.purchaseDate || undefined,
      status: form.value.status,
    };
    if (id) {
      await trailersApi.update(id, payload);
    } else {
      await trailersApi.create(payload);
    }
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(v: Trailer) {
  deleteTarget.value = v;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await trailersApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.trailers-page { width: 100%; }
.trailers-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.trailers-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.trailers-page__actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.trailers-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.trailers-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.trailers-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.trailers-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.trailers-page__autocomplete-item:hover { background: #f0f0f0; }
.trailers-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.trailers-page__btn--primary { background: #1976d2; color: #fff; }
.trailers-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.trailers-page__btn--danger { background: #c62828; color: #fff; }
.trailers-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.trailers-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.trailers-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.trailers-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.trailers-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.trailers-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.trailers-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.trailers-page__pagination-showing { font-size: 0.9rem; color: #666; }
.trailers-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.trailers-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.trailers-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; max-height: 70vh; background: #fff; }
.trailers-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.trailers-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.trailers-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.trailers-page__th--sortable:hover { background: #eee; }
.trailers-page__th--sorted { color: #1976d2; }
.trailers-page__sort-icon { display: inline-block; vertical-align: middle; margin-left: 2px; }
.trailers-page__sort-placeholder { display: inline-block; opacity: 0.35; font-size: 0.7rem; margin-left: 2px; }
.trailers-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.trailers-page__row-loading td, .trailers-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.trailers-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.trailers-page__drawer { position: fixed; top: 0; right: 0; width: 360px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.trailers-page__drawer--open { transform: translateX(0); }
.trailers-page__drawer-inner { padding: 1.5rem; }
.trailers-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.trailers-page__drawer-title { font-size: 1.25rem; margin: 0; }
.trailers-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.trailers-page__drawer-close:hover { background: #f0f0f0; color: #333; }
.trailers-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.trailers-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.trailers-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.trailers-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.trailers-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.trailers-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.trailers-page__dialog-text { margin: 0 0 1rem; }
.trailers-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
