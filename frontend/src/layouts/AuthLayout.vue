<template>
  <div class="auth-layout">
    <div class="auth-layout__left">
      <img src="/logo.png" alt="Vehicles" class="auth-layout__logo" width="80" height="80" />
      <h1 class="auth-layout__title" data-test="auth-welcome">{{ $t('auth.welcomeTo') }}</h1>
      <p class="auth-layout__subtitle" data-test="auth-subtitle">{{ $t('auth.subtitle') }}</p>
    </div>
    <div class="auth-layout__right">
      <div class="auth-layout__form-wrap">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}
.auth-layout__left {
  width: 33%;
  min-width: 280px;
  background: #1976d2;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}
.auth-layout__logo {
  display: block;
  margin-bottom: 1rem;
  object-fit: contain;
}
.auth-layout__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}
.auth-layout__subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}
.auth-layout__right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: #fff;
  min-width: 0;
}
.auth-layout__form-wrap {
  width: 100%;
  max-width: 420px;
}
@media (max-width: 700px) {
  .auth-layout { flex-direction: column; }
  .auth-layout__left { width: 100%; min-height: 160px; }
}
</style>
