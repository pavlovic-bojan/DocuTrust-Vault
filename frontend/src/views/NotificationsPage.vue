<template>
  <div class="notifications-page" data-test="page-notifications">
    <h1 class="notifications-page__title" data-test="notifications-title">{{ $t('notifications.title') }}</h1>
    <p class="notifications-page__subtitle" data-test="notifications-subtitle">{{ $t('notifications.subtitle') }}</p>
    <div v-if="loading" class="notifications-page__loading" data-test="row-loading">
      {{ $t('common.loading') }}
    </div>
    <div v-else class="notifications-page__list-wrap">
      <ul v-if="items.length > 0" class="notifications-page__list" data-test="notifications-list">
        <li
          v-for="n in items"
          :key="n.id"
          class="notifications-page__item"
          :class="{ 'notifications-page__item--read': n.read }"
          :data-test="`notification-${n.id}`"
        >
          <span class="notifications-page__item-type">{{ typeLabel(n.type) }}</span>
          <span class="notifications-page__item-message">{{ n.message }}</span>
          <span class="notifications-page__item-date">{{ formatDateTime(n.createdAt) }}</span>
        </li>
      </ul>
      <p v-else class="notifications-page__empty" data-test="notifications-empty">
        {{ $t('notifications.noNotifications') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const loading = ref(true);
const items = ref<{ id: string; type: string; message: string; createdAt: string; read: boolean }[]>([]);

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    INFO: t('notifications.typeInfo'),
    WARNING: t('notifications.typeWarning'),
    ALERT: t('notifications.typeAlert'),
  };
  return map[type] || type;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    // Placeholder: no backend yet; show empty or mock list
    items.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.notifications-page { width: 100%; }
.notifications-page__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.notifications-page__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.notifications-page__loading { padding: 2rem; text-align: center; color: #888; }
.notifications-page__list-wrap { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
.notifications-page__list { list-style: none; margin: 0; padding: 0; }
.notifications-page__item { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #eee; font-size: 0.95rem; }
.notifications-page__item:last-child { border-bottom: none; }
.notifications-page__item--read { background: #fafafa; color: #888; }
.notifications-page__item-type { font-weight: 600; color: #1976d2; font-size: 0.8rem; text-transform: uppercase; }
.notifications-page__item-message { color: #333; }
.notifications-page__item-date { font-size: 0.85rem; color: #666; }
.notifications-page__empty { padding: 3rem 2rem; text-align: center; color: #888; margin: 0; }
</style>
