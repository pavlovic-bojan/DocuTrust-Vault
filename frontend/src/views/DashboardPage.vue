<template>
  <div class="dashboard" data-test="page-dashboard">
    <h1 class="dashboard__title" data-test="dashboard-title">{{ $t('dashboard.title') }}</h1>
    <p class="dashboard__subtitle" data-test="dashboard-subtitle">{{ $t('dashboard.subtitle') }}</p>
    <div v-if="loading" class="dashboard__loading" data-test="row-loading">
      <Loader2 class="dashboard__loading-icon" :size="24" stroke-width="2" />
      <span>{{ $t('common.loading') }}</span>
    </div>
    <div v-else class="dashboard__grid" data-test="dashboard-overview">
      <router-link :to="{ name: 'vehicles' }" class="dashboard__card" data-test="card-vehicles">
        <Truck class="dashboard__card-icon" :size="28" stroke-width="2" />
        <span class="dashboard__card-value">{{ counts.vehicles }}</span>
        <span class="dashboard__card-label">{{ $t('dashboard.vehicles') }}</span>
      </router-link>
      <router-link :to="{ name: 'drivers' }" class="dashboard__card" data-test="card-drivers">
        <Users class="dashboard__card-icon" :size="28" stroke-width="2" />
        <span class="dashboard__card-value">{{ counts.drivers }}</span>
        <span class="dashboard__card-label">{{ $t('dashboard.drivers') }}</span>
      </router-link>
      <router-link :to="{ name: 'trips' }" class="dashboard__card" data-test="card-trips">
        <Route class="dashboard__card-icon" :size="28" stroke-width="2" />
        <span class="dashboard__card-value">{{ counts.trips }}</span>
        <span class="dashboard__card-label">{{ $t('dashboard.trips') }}</span>
      </router-link>
      <router-link :to="{ name: 'fuel' }" class="dashboard__card" data-test="card-fuel">
        <Fuel class="dashboard__card-icon" :size="28" stroke-width="2" />
        <span class="dashboard__card-value">{{ counts.fuelRecords }}</span>
        <span class="dashboard__card-label">{{ $t('dashboard.fuel') }}</span>
      </router-link>
      <router-link :to="{ name: 'locations' }" class="dashboard__card" data-test="card-locations">
        <MapPin class="dashboard__card-icon" :size="28" stroke-width="2" />
        <span class="dashboard__card-value">{{ counts.locations }}</span>
        <span class="dashboard__card-label">{{ $t('dashboard.locations') }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loader2, Truck, Users, Route, Fuel, MapPin } from 'lucide-vue-next';
import { vehiclesApi } from '../api/vehicles.api';
import { driversApi } from '../api/drivers.api';
import { tripsApi } from '../api/trips.api';
import { fuelApi } from '../api/fuel.api';
import { locationsApi } from '../api/locations.api';

const loading = ref(true);
const counts = ref({
  vehicles: 0,
  drivers: 0,
  trips: 0,
  fuelRecords: 0,
  locations: 0,
});

onMounted(async () => {
  try {
    const [v, d, t, f, l] = await Promise.all([
      vehiclesApi.list(),
      driversApi.list(),
      tripsApi.list(),
      fuelApi.list(),
      locationsApi.list(),
    ]);
    counts.value = {
      vehicles: v.data.data.length,
      drivers: d.data.data.length,
      trips: t.data.data.length,
      fuelRecords: f.data.data.length,
      locations: l.data.data.length,
    };
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard { width: 100%; }
.dashboard__title { font-size: 1.75rem; font-weight: 600; margin: 0 0 0.25rem; color: #333; }
.dashboard__subtitle { font-size: 0.9rem; color: #666; margin: 0 0 1.5rem; }
.dashboard__loading { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: #888; }
.dashboard__loading-icon { flex-shrink: 0; animation: dashboard-spin 0.8s linear infinite; }
@keyframes dashboard-spin { to { transform: rotate(360deg); } }
.dashboard__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
.dashboard__card { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; text-decoration: none; color: inherit; transition: box-shadow 0.2s, border-color 0.2s; }
.dashboard__card:hover { border-color: #1976d2; box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15); }
.dashboard__card-icon { color: #1976d2; flex-shrink: 0; }
.dashboard__card-value { font-size: 1.75rem; font-weight: 700; color: #333; }
.dashboard__card-label { font-size: 0.9rem; color: #666; }
</style>
