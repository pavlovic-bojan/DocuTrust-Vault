<template>
  <AuthLayout>
    <div class="auth-form">
      <h2 class="auth-form__title" data-test="forgot-title">{{ $t('auth.forgotPasswordTitle') }}</h2>
      <form class="auth-form__form" data-test="form-forgot" @submit.prevent="onSubmit">
        <label class="auth-form__label">{{ $t('auth.email') }}</label>
        <input v-model="email" type="email" class="auth-form__input" data-test="input-email" required />
        <p class="auth-form__hint">{{ $t('auth.forgotHint') }}</p>
        <button type="submit" class="auth-form__btn" :disabled="loading" data-test="button-send-reset-link">{{ $t('auth.sendResetLink') }}</button>
      </form>
      <p class="auth-form__footer">
        <router-link :to="{ name: 'login' }" class="auth-form__link" data-test="link-back-to-login">{{ $t('auth.backToLogin') }}</router-link>
      </p>
      <p class="auth-form__or">{{ $t('auth.orContinueWith') }}</p>
      <div class="auth-form__social">
        <button type="button" class="auth-form__social-btn" :disabled="loading" data-test="button-login-google">Google</button>
        <button type="button" class="auth-form__social-btn" :disabled="loading" data-test="button-login-facebook">Facebook</button>
      </div>
      <p v-if="error" class="auth-form__error" data-test="error-message">{{ $t('auth.errorForgot') }}</p>
      <p v-if="success" class="auth-form__success" data-test="success-message">{{ $t('auth.resetLinkSent') }}</p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import { authApi } from '../api/auth.api';

const email = ref('');
const loading = ref(false);
const error = ref(false);
const success = ref(false);

async function onSubmit() {
  loading.value = true;
  error.value = false;
  success.value = false;
  try {
    await authApi.forgotPassword(email.value);
    success.value = true;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-form { width: 100%; }
.auth-form__title { font-size: 1.5rem; color: #1976d2; margin: 0 0 1.5rem; text-align: center; }
.auth-form__form { display: flex; flex-direction: column; gap: 1rem; }
.auth-form__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.auth-form__input { padding: 0.6rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.auth-form__hint { font-size: 0.75rem; color: #666; margin: -0.5rem 0 0; }
.auth-form__btn { padding: 0.75rem 1rem; background: #1976d2; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; width: 100%; }
.auth-form__btn:disabled { opacity: 0.7; cursor: not-allowed; }
.auth-form__footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; }
.auth-form__or { text-align: center; margin: 1.5rem 0 0.5rem; font-size: 0.875rem; color: #888; }
.auth-form__social { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
.auth-form__social-btn { padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.875rem; }
.auth-form__error { color: #c62828; font-size: 0.875rem; text-align: center; margin-top: 1rem; }
.auth-form__success { color: #2e7d32; font-size: 0.875rem; text-align: center; margin-top: 1rem; }
.auth-form__link { color: #1976d2; text-decoration: none; }
.auth-form__link:hover { text-decoration: underline; }
</style>
