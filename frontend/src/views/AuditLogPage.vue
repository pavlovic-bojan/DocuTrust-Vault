<template>
  <div class="audit-page" data-test="page-audit">
    <h1 class="audit-page__title" data-test="audit-title">{{ $t('audit.title') }}</h1>
    <p class="audit-page__subtitle" data-test="audit-subtitle">{{ $t('audit.subtitle') }}</p>
    <div v-if="forbidden" class="audit-page__forbidden" data-test="audit-forbidden">
      {{ $t('audit.adminOnly') }}
    </div>
    <template v-else>
      <div class="audit-page__actions">
        <input
          v-model="searchQuery"
          type="text"
          class="audit-page__search"
          :placeholder="$t('common.searchPlaceholder')"
          data-test="input-search"
          autocomplete="off"
        />
      </div>
      <div v-if="loading" class="audit-page__loading" data-test="row-loading">
        {{ $t('common.loading') }}
      </div>
      <div v-else class="audit-page__table-wrap" data-test="table-wrap">
        <table class="audit-page__table" data-test="table-audit">
          <thead>
            <tr>
              <th class="audit-page__th--sortable" :class="{ 'audit-page__th--sorted': sortKey === 'user' }" @click="setSort('user')">
                {{ $t('audit.user') }}
                <ChevronUp v-if="sortKey === 'user' && sortOrder === 'asc'" :size="14" class="audit-page__sort-icon" />
                <ChevronDown v-else-if="sortKey === 'user' && sortOrder === 'desc'" :size="14" class="audit-page__sort-icon" />
                <span v-else class="audit-page__sort-placeholder">↕</span>
              </th>
              <th class="audit-page__th--sortable" :class="{ 'audit-page__th--sorted': sortKey === 'action' }" @click="setSort('action')">
                {{ $t('audit.action') }}
                <ChevronUp v-if="sortKey === 'action' && sortOrder === 'asc'" :size="14" class="audit-page__sort-icon" />
                <ChevronDown v-else-if="sortKey === 'action' && sortOrder === 'desc'" :size="14" class="audit-page__sort-icon" />
                <span v-else class="audit-page__sort-placeholder">↕</span>
              </th>
              <th class="audit-page__th--sortable" :class="{ 'audit-page__th--sorted': sortKey === 'ip' }" @click="setSort('ip')">
                {{ $t('audit.ip') }}
                <ChevronUp v-if="sortKey === 'ip' && sortOrder === 'asc'" :size="14" class="audit-page__sort-icon" />
                <ChevronDown v-else-if="sortKey === 'ip' && sortOrder === 'desc'" :size="14" class="audit-page__sort-icon" />
                <span v-else class="audit-page__sort-placeholder">↕</span>
              </th>
              <th class="audit-page__th--sortable" :class="{ 'audit-page__th--sorted': sortKey === 'userAgent' }" @click="setSort('userAgent')">
                {{ $t('audit.userAgent') }}
                <ChevronUp v-if="sortKey === 'userAgent' && sortOrder === 'asc'" :size="14" class="audit-page__sort-icon" />
                <ChevronDown v-else-if="sortKey === 'userAgent' && sortOrder === 'desc'" :size="14" class="audit-page__sort-icon" />
                <span v-else class="audit-page__sort-placeholder">↕</span>
              </th>
              <th class="audit-page__th--sortable" :class="{ 'audit-page__th--sorted': sortKey === 'createdAt' }" @click="setSort('createdAt')">
                {{ $t('audit.createdAt') }}
                <ChevronUp v-if="sortKey === 'createdAt' && sortOrder === 'asc'" :size="14" class="audit-page__sort-icon" />
                <ChevronDown v-else-if="sortKey === 'createdAt' && sortOrder === 'desc'" :size="14" class="audit-page__sort-icon" />
                <span v-else class="audit-page__sort-placeholder">↕</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="items.length === 0" class="audit-page__row-empty" data-test="row-empty">
              <td colspan="5">{{ searchQuery.trim() ? $t('common.noMatches') : $t('audit.noEntries') }}</td>
            </tr>
            <tr v-else v-for="e in items" :key="e.id" :data-test="`row-audit-${e.id}`">
              <td>{{ e.user?.name ?? e.user?.email ?? e.userId }}</td>
              <td>{{ e.action }}</td>
              <td>{{ e.ip || '—' }}</td>
              <td class="audit-page__cell-ua">{{ e.userAgent || '—' }}</td>
              <td>{{ formatDateTime(e.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loading && total > 0" class="audit-page__pagination" data-test="pagination">
        <div class="audit-page__pagination-rows">
          <label for="audit-rows-per-page" class="audit-page__pagination-label">{{ $t('common.rowsPerPage') }}</label>
          <select id="audit-rows-per-page" v-model.number="rowsPerPage" class="audit-page__select" data-test="select-rows-per-page" @change="onRowsPerPageChange">
            <option v-for="n in rowsPerPageOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <span class="audit-page__pagination-showing">{{ $t('common.showingRows', [paginationStart, paginationEnd, total]) }}</span>
        <div class="audit-page__pagination-nav">
          <button type="button" class="audit-page__btn audit-page__btn--secondary audit-page__btn--small" :disabled="currentPage <= 1" data-test="button-first" @click="goToPage(1)">{{ $t('common.first') }}</button>
          <button type="button" class="audit-page__btn audit-page__btn--secondary audit-page__btn--small" :disabled="currentPage <= 1" data-test="button-prev" @click="goToPage(currentPage - 1)">{{ $t('common.previous') }}</button>
          <span class="audit-page__pagination-page">{{ $t('common.pageOf', [currentPage, totalPages]) }}</span>
          <button type="button" class="audit-page__btn audit-page__btn--secondary audit-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-next" @click="goToPage(currentPage + 1)">{{ $t('common.next') }}</button>
          <button type="button" class="audit-page__btn audit-page__btn--secondary audit-page__btn--small" :disabled="currentPage >= totalPages" data-test="button-last" @click="goToPage(totalPages)">{{ $t('common.last') }}</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ChevronUp, ChevronDown } from 'lucide-vue-next';
import { authApi, type LoginAuditEntry } from '../api/auth.api';

const SEARCH_DEBOUNCE_MS = 300;

type SortKey = 'createdAt' | 'action' | 'ip' | 'userAgent' | 'user';

const loading = ref(true);
const forbidden = ref(false);
const items = ref<LoginAuditEntry[]>([]);
const total = ref(0);
const searchQuery = ref('');
const sortKey = ref<SortKey>('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');
const currentPage = ref(1);
const rowsPerPage = ref(20);
const rowsPerPageOptions = [10, 20, 50, 100];

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / rowsPerPage.value)));

const paginationStart = computed(() => {
  if (total.value === 0) return 0;
  return (currentPage.value - 1) * rowsPerPage.value + 1;
});

const paginationEnd = computed(() =>
  Math.min(currentPage.value * rowsPerPage.value, total.value)
);

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'createdAt' ? 'desc' : 'asc';
  }
  currentPage.value = 1;
  load();
}

function goToPage(page: number) {
  const p = Math.max(1, Math.min(page, totalPages.value));
  if (p === currentPage.value) return;
  currentPage.value = p;
  load();
}

function onRowsPerPageChange() {
  currentPage.value = 1;
  load();
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    load();
    searchDebounceTimer = null;
  }, SEARCH_DEBOUNCE_MS);
});

async function load() {
  loading.value = true;
  forbidden.value = false;
  try {
    const { data } = await authApi.getAudit({
      page: currentPage.value,
      limit: rowsPerPage.value,
      sort: sortKey.value,
      order: sortOrder.value,
      search: searchQuery.value.trim() || undefined,
    });
    items.value = data.data;
    total.value = data.total;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 403) forbidden.value = true;
    else {
      items.value = [];
      total.value = 0;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => load());
</script>

<style scoped>
.audit-page { width: 100%; }
.audit-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.audit-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1rem; }
.audit-page__forbidden { padding: 2rem; text-align: center; color: #c62828; font-weight: 500; }
.audit-page__actions { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
.audit-page__search { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; min-width: 200px; max-width: 320px; }
.audit-page__btn { padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; }
.audit-page__btn--secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
.audit-page__btn--small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
.audit-page__loading { padding: 2rem; text-align: center; color: #888; }
.audit-page__table-wrap { border: 1px solid #e0e0e0; border-radius: 4px; overflow: auto; max-height: 70vh; background: #fff; }
.audit-page__table { width: 100%; min-width: max-content; border-collapse: collapse; }
.audit-page__table th { text-align: left; padding: 0.75rem 1rem; background: #f5f5f5; font-size: 0.8rem; font-weight: 600; color: #666; }
.audit-page__th--sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.audit-page__th--sorted { color: #1976d2; }
.audit-page__sort-icon { vertical-align: middle; margin-left: 2px; }
.audit-page__sort-placeholder { display: inline-block; width: 14px; margin-left: 2px; color: #999; vertical-align: middle; }
.audit-page__table td { padding: 0.75rem 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.audit-page__cell-ua { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audit-page__row-empty td { text-align: center; padding: 2rem; color: #888; }
.audit-page__pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.audit-page__pagination-rows { display: flex; align-items: center; gap: 0.5rem; }
.audit-page__pagination-label { font-size: 0.9rem; color: #666; white-space: nowrap; }
.audit-page__select { padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; background: #fff; }
.audit-page__pagination-showing { font-size: 0.9rem; color: #666; }
.audit-page__pagination-nav { display: flex; align-items: center; gap: 0.5rem; }
.audit-page__pagination-page { font-size: 0.9rem; color: #333; min-width: 6rem; text-align: center; }
</style>
