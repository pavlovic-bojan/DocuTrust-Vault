<template>
  <div class="documents-page" data-test="page-documents">
    <h1 class="documents-page__title" data-test="documents-title">{{ $t('documents.title') }}</h1>
    <p class="documents-page__subtitle" data-test="documents-subtitle">{{ $t('documents.subtitle') }}</p>
    <div class="documents-page__actions">
      <div class="documents-page__search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="documents-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
          @focus="showAutocomplete = true"
          @blur="onSearchBlur"
        />
        <ul v-if="showAutocomplete && searchQuery && autocompleteSuggestions.length" class="documents-page__autocomplete" data-test="autocomplete-list">
          <li
            v-for="d in autocompleteSuggestions"
            :key="d.id"
            class="documents-page__autocomplete-item"
            data-test="autocomplete-item"
            @mousedown.prevent="selectSuggestion(d)"
          >
            {{ d.fileName }}
          </li>
        </ul>
      </div>
      <button type="button" class="documents-page__btn documents-page__btn--primary" data-test="button-add-document" @click="openDrawer()">
        {{ $t('documents.addDocument') }}
      </button>
      <select v-model="filterEntityType" class="documents-page__filter" data-test="filter-entity-type">
        <option value="">{{ $t('common.all') }}</option>
        <option value="TRIP">{{ $t('documents.entityTypeTrip') }}</option>
        <option value="VEHICLE">{{ $t('documents.entityTypeVehicle') }}</option>
        <option value="DRIVER">{{ $t('documents.entityTypeDriver') }}</option>
      </select>
    </div>
    <div class="documents-page__table-wrap" data-test="table-wrap">
      <table class="documents-page__table" data-test="table-documents">
        <thead>
          <tr>
            <th>{{ $t('documents.fileName') }}</th>
            <th>{{ $t('documents.entityType') }}</th>
            <th>{{ $t('documents.entityId') }}</th>
            <th>{{ $t('documents.uploadedBy') }}</th>
            <th>{{ $t('documents.fileUrl') }}</th>
            <th>{{ $t('documents.createdAt') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="documents-page__row-loading" data-test="row-loading">
            <td colspan="7">{{ $t('common.loading') }}</td>
          </tr>
          <tr v-else-if="items.length === 0" class="documents-page__row-empty" data-test="row-empty">
            <td colspan="7">{{ $t('documents.noDocuments') }}</td>
          </tr>
          <tr v-else-if="searchQuery && filteredBySearch.length === 0" class="documents-page__row-empty" data-test="row-no-matches">
            <td colspan="7">{{ $t('common.noMatches') }}</td>
          </tr>
          <tr v-else v-for="d in paginatedItems" :key="d.id" :data-test="`row-document-${d.id}`">
            <td>{{ d.fileName }}</td>
            <td>{{ entityTypeLabel(d.entityType) }}</td>
            <td>{{ entityLabel(d) }}</td>
            <td>{{ d.user?.name ?? d.user?.email ?? '—' }}</td>
            <td>
              <a v-if="d.fileUrl" :href="d.fileUrl" target="_blank" rel="noopener noreferrer" class="documents-page__link">{{ d.fileName }}</a>
              <span v-else>—</span>
            </td>
            <td>{{ formatDateTime(d.createdAt) }}</td>
            <td class="documents-page__cell-actions">
              <button v-if="d.contentHash && d.fileUrl" type="button" class="documents-page__btn documents-page__btn--icon" :aria-label="$t('documents.verifyIntegrity')" :data-test="`button-verify-document-${d.id}`" :disabled="verifyingId === d.id" :title="$t('documents.verifyIntegrity')" @click="verifyIntegrity(d)"><ShieldCheck :size="18" stroke-width="2" /></button>
              <button type="button" class="documents-page__btn documents-page__btn--icon documents-page__btn--danger" :aria-label="$t('common.delete')" :data-test="`button-delete-document-${d.id}`" @click="confirmDelete(d)"><Trash2 :size="18" stroke-width="2" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && items.length > 0" class="documents-page__pagination" data-test="pagination">
      <div class="documents-page__pagination-rows">
        <label for="documents-rows-per-page" class="documents-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
        <select id="documents-rows-per-page" v-model.number="rowsPerPage" class="documents-page__select" data-test="select-rows-per-page">
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <span class="documents-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, filteredBySearch.length]) }}</span>
      <div class="documents-page__pagination-nav">
        <button type="button" class="documents-page__btn documents-page__btn--secondary documents-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="currentPage = 1">{{ $t('common.first') }}</button>
        <button type="button" class="documents-page__btn documents-page__btn--secondary documents-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="currentPage = Math.max(1, currentPage - 1)">{{ $t('common.previous') }}</button>
        <span class="documents-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
        <button type="button" class="documents-page__btn documents-page__btn--secondary documents-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }}</button>
        <button type="button" class="documents-page__btn documents-page__btn--secondary documents-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="currentPage = totalPages">{{ $t('common.last') }}</button>
      </div>
    </div>

    <div v-if="drawerOpen" class="documents-page__drawer-overlay" data-test="drawer-overlay" @click="closeDrawer"></div>
    <aside class="documents-page__drawer" :class="{ 'documents-page__drawer--open': drawerOpen }" data-test="drawer">
      <div class="documents-page__drawer-inner">
        <div class="documents-page__drawer-header">
          <h2 class="documents-page__drawer-title" data-test="drawer-title">{{ $t('documents.addDocument') }}</h2>
          <button type="button" class="documents-page__drawer-close" aria-label="Close" data-test="button-close-drawer" @click="closeDrawer">×</button>
        </div>
        <form class="documents-page__form" data-test="form-document" @submit.prevent="submitForm">
          <label class="documents-page__label">{{ $t('documents.entityType') }} *</label>
          <select v-model="form.entityType" class="documents-page__input" data-test="select-entity-type" required @change="onEntityTypeChange">
            <option value="">{{ $t('documents.selectEntity') }}</option>
            <option value="TRIP">{{ $t('documents.entityTypeTrip') }}</option>
            <option value="VEHICLE">{{ $t('documents.entityTypeVehicle') }}</option>
            <option value="DRIVER">{{ $t('documents.entityTypeDriver') }}</option>
          </select>
          <label class="documents-page__label">{{ $t('documents.entityId') }} *</label>
          <select v-model="form.entityId" class="documents-page__input" data-test="select-entity-id" required :disabled="!form.entityType">
            <option value="">{{ $t('documents.selectEntity') }}</option>
            <option v-for="opt in entityOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
          <label class="documents-page__label">{{ $t('documents.fileName') }} *</label>
          <input v-model="form.fileName" type="text" class="documents-page__input" data-test="input-file-name" required />
          <label class="documents-page__label">{{ $t('documents.fileUrl') }}</label>
          <input v-model="form.fileUrl" type="url" class="documents-page__input" data-test="input-file-url" placeholder="https://..." />
          <label class="documents-page__label">{{ $t('documents.contentHash') }}</label>
          <input v-model="form.contentHash" type="text" class="documents-page__input" data-test="input-content-hash" :placeholder="$t('documents.contentHashPlaceholder')" />
          <label class="documents-page__label">{{ $t('documents.mimeType') }}</label>
          <input v-model="form.mimeType" type="text" class="documents-page__input" data-test="input-mime-type" placeholder="application/pdf" />
          <div class="documents-page__form-actions">
            <button type="submit" class="documents-page__btn documents-page__btn--primary" :disabled="saving" data-test="button-save-document">{{ $t('common.save') }}</button>
            <button type="button" class="documents-page__btn documents-page__btn--secondary" data-test="button-cancel-drawer" @click="closeDrawer">{{ $t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </aside>

    <div v-if="deleteTarget" class="documents-page__dialog-overlay" data-test="dialog-overlay" @click="deleteTarget = null"></div>
    <div v-if="deleteTarget" class="documents-page__dialog" data-test="dialog-delete">
      <p class="documents-page__dialog-text">{{ $t('documents.confirmDelete') }}</p>
      <div class="documents-page__dialog-actions">
        <button type="button" class="documents-page__btn documents-page__btn--danger" data-test="button-confirm-delete" @click="doDelete">{{ $t('common.yes') }}</button>
        <button type="button" class="documents-page__btn documents-page__btn--secondary" data-test="button-cancel-delete" @click="deleteTarget = null">{{ $t('common.no') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Trash2, ShieldCheck } from 'lucide-vue-next';
import { documentsApi, type Document, type DocumentEntityType } from '../api/documents.api';
import { vehiclesApi } from '../api/vehicles.api';
import { driversApi } from '../api/drivers.api';
import { tripsApi } from '../api/trips.api';

const { t } = useI18n();
const loading = ref(true);
const items = ref<Document[]>([]);
const searchQuery = ref('');
const showAutocomplete = ref(false);
const filterEntityType = ref<DocumentEntityType | ''>('');
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [10, 25, 50, 100];
const drawerOpen = ref(false);
const saving = ref(false);
const deleteTarget = ref<Document | null>(null);
const verifyingId = ref<string | null>(null);
const vehicles = ref<{ id: string; make: string; model: string; registration: string | null }[]>([]);
const drivers = ref<{ id: string; name: string }[]>([]);
const trips = ref<{ id: string; vehicleId: string; driverId: string; startAt: string; vehicle?: { make: string; model: string }; driver?: { name: string } }[]>([]);

const form = ref({
  entityType: '' as DocumentEntityType | '',
  entityId: '',
  fileName: '',
  fileUrl: '',
  contentHash: '',
  mimeType: '',
});

const filteredItems = computed(() => {
  if (!filterEntityType.value) return items.value;
  return items.value.filter((d) => d.entityType === filterEntityType.value);
});

const filteredBySearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return filteredItems.value;
  return filteredItems.value.filter(
    (d) =>
      d.fileName.toLowerCase().includes(q) ||
      d.entityId.toLowerCase().includes(q) ||
      (d.fileUrl && d.fileUrl.toLowerCase().includes(q))
  );
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

const entityOptions = computed(() => {
  if (form.value.entityType === 'VEHICLE') {
    return vehicles.value.map((v) => ({ id: v.id, label: `${v.make} ${v.model} ${v.registration || v.id}` }));
  }
  if (form.value.entityType === 'DRIVER') {
    return drivers.value.map((d) => ({ id: d.id, label: d.name }));
  }
  if (form.value.entityType === 'TRIP') {
    return trips.value.map((trip) => {
      const v = trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : trip.vehicleId;
      const d = trip.driver?.name ?? trip.driverId;
      const date = trip.startAt ? new Date(trip.startAt).toLocaleDateString() : '';
      return { id: trip.id, label: `${v} – ${d} (${date})` };
    });
  }
  return [];
});

function entityTypeLabel(type: DocumentEntityType): string {
  const map = { TRIP: t('documents.entityTypeTrip'), VEHICLE: t('documents.entityTypeVehicle'), DRIVER: t('documents.entityTypeDriver') };
  return map[type] || type;
}

function entityLabel(d: Document): string {
  if (d.entityType === 'VEHICLE') {
    const v = vehicles.value.find((x) => x.id === d.entityId);
    return v ? `${v.make} ${v.model}` : d.entityId;
  }
  if (d.entityType === 'DRIVER') {
    const dr = drivers.value.find((x) => x.id === d.entityId);
    return dr ? dr.name : d.entityId;
  }
  if (d.entityType === 'TRIP') {
    const trip = trips.value.find((x) => x.id === d.entityId);
    if (trip) {
      const v = trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : trip.vehicleId;
      const dr = trip.driver?.name ?? trip.driverId;
      return `${v} – ${dr}`;
    }
  }
  return d.entityId;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function onSearchBlur() {
  setTimeout(() => { showAutocomplete.value = false; }, 150);
}

function selectSuggestion(d: Document) {
  searchQuery.value = d.fileName;
  showAutocomplete.value = false;
}

function onEntityTypeChange() {
  form.value.entityId = '';
}

async function load() {
  loading.value = true;
  try {
    const params = filterEntityType.value ? { entityType: filterEntityType.value } : undefined;
    const { data } = await documentsApi.list(params);
    items.value = data.data;
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const [vRes, dRes, tRes] = await Promise.all([
    vehiclesApi.list(),
    driversApi.list(),
    tripsApi.list(),
  ]);
  vehicles.value = vRes.data.data;
  drivers.value = dRes.data.data.map((d) => ({ id: d.id, name: d.name }));
  trips.value = tRes.data.data;
}

watch(filterEntityType, () => load());

function openDrawer() {
  form.value = { entityType: '', entityId: '', fileName: '', fileUrl: '', contentHash: '', mimeType: '' };
  drawerOpen.value = true;
  loadOptions();
}

function closeDrawer() {
  drawerOpen.value = false;
}

async function submitForm() {
  if (!form.value.entityType || !form.value.entityId || !form.value.fileName) return;
  saving.value = true;
  try {
    await documentsApi.create({
      entityType: form.value.entityType,
      entityId: form.value.entityId,
      fileName: form.value.fileName,
      fileUrl: form.value.fileUrl || undefined,
      contentHash: form.value.contentHash || undefined,
      mimeType: form.value.mimeType || undefined,
    });
    closeDrawer();
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(d: Document) {
  deleteTarget.value = d;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await documentsApi.delete(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleteTarget.value = null;
  }
}

async function verifyIntegrity(d: Document) {
  verifyingId.value = d.id;
  try {
    const { data } = await documentsApi.verifyIntegrity(d.id);
    const result = data.data;
    const title = result.tampered ? t('documents.integrityTampered') : result.ok ? t('documents.integrityOk') : t('documents.integrityError');
    alert(`${title}\n\n${result.message}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    alert(`${t('documents.integrityError')}\n\n${msg}`);
  } finally {
    verifyingId.value = null;
  }
}

onMounted(() => {
  load();
  loadOptions();
});
</script>

<style scoped>
.documents-page { width: 100%; }
.documents-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.documents-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.documents-page__actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.documents-page__search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
.documents-page__search { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
.documents-page__autocomplete { position: absolute; top: 100%; left: 0; right: 0; margin: 0; padding: 0; list-style: none; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 240px; overflow-y: auto; z-index: 10; }
.documents-page__autocomplete-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
.documents-page__autocomplete-item:hover { background: #f0f0f0; }
.documents-page__filter { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.documents-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.documents-page__btn--primary { background: #1976d2; color: #fff; }
.documents-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.documents-page__btn--danger { background: #c62828; color: #fff; }
.documents-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.documents-page__btn--icon { padding: 0.4rem; min-width: 32px; min-height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.documents-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; -webkit-overflow-scrolling: touch; max-height: 70vh; background: #fff; }
.documents-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.documents-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.documents-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.documents-page__row-loading td, .documents-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.documents-page__cell-actions { display: flex; align-items: center; gap: 0.25rem; }
.documents-page__link { color: #1976d2; text-decoration: none; }
.documents-page__link:hover { text-decoration: underline; }
.documents-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.documents-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.documents-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.documents-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.documents-page__pagination-showing { font-size: 0.9rem; color: #666; }
.documents-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.documents-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
.documents-page__drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; }
.documents-page__drawer { position: fixed; top: 0; right: 0; width: 360px; max-width: 100%; height: 100%; background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,0.15); z-index: 101; transform: translateX(100%); transition: transform 0.2s; }
.documents-page__drawer--open { transform: translateX(0); }
.documents-page__drawer-inner { padding: 1.5rem; }
.documents-page__drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.documents-page__drawer-title { font-size: 1.25rem; margin: 0; }
.documents-page__drawer-close { width: 32px; height: 32px; padding: 0; border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #666; cursor: pointer; border-radius: 4px; }
.documents-page__form { display: flex; flex-direction: column; gap: 0.75rem; }
.documents-page__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.documents-page__input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.documents-page__form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.documents-page__dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 102; }
.documents-page__dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 103; min-width: 280px; }
.documents-page__dialog-text { margin: 0 0 1rem; }
.documents-page__dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
</style>
