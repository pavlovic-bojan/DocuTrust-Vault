<template>
  <AuthLayout>
    <div class="auth-form">
      <h2 class="auth-form__title" data-test="login-title">{{ $t('auth.welcomeBack') }}</h2>
      <form class="auth-form__form" data-test="form-login" @submit.prevent="onSubmit">
        <label class="auth-form__label">{{ $t('auth.email') }}</label>
        <input
          v-model="email"
          type="email"
          class="auth-form__input"
          data-test="input-email"
          required
        />
        <label class="auth-form__label">{{ $t('auth.password') }}</label>
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="auth-form__input"
          data-test="input-password"
          required
        />
        <div class="auth-form__row">
          <label class="auth-form__checkbox">
            <input v-model="rememberMe" type="checkbox" data-test="checkbox-remember" />
            {{ $t('auth.rememberMe') }}
          </label>
          <router-link :to="{ name: 'forgot-password' }" class="auth-form__link" data-test="link-forgot-password">{{ $t('auth.forgotPassword') }}</router-link>
        </div>
        <button type="submit" class="auth-form__btn" :disabled="loading" data-test="button-sign-in">
          {{ $t('auth.signIn') }}
        </button>
        <template v-if="devAuthEnabled">
          <hr class="auth-form__hr" />
          <label class="auth-form__label">{{ $t('auth.devSecret') }}</label>
          <input v-model="devSecret" type="password" class="auth-form__input" data-test="input-dev-secret" />
          <button type="button" class="auth-form__btn auth-form__btn--outline" :disabled="loading || !devSecret" data-test="button-login-dev" @click="loginWithDev">{{ $t('auth.devLogin') }}</button>
        </template>
      </form>
      <p class="auth-form__footer">
        {{ $t('auth.noAccount') }}
        <router-link :to="{ name: 'register' }" class="auth-form__link" data-test="link-register">{{ $t('auth.register') }}</router-link>
      </p>
      <p class="auth-form__or">{{ $t('auth.orContinueWith') }}</p>
      <div class="auth-form__social">
        <button type="button" class="auth-form__social-btn" :disabled="loading" data-test="button-login-google" @click="loginWithGoogle">Google</button>
        <button type="button" class="auth-form__social-btn" :disabled="loading" data-test="button-login-facebook" @click="loginWithFacebook">Facebook</button>
      </div>
      <p v-if="error" class="auth-form__error" data-test="error-message">{{ $t('auth.errorLogin') }}</p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AuthLayout from '../layouts/AuthLayout.vue';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth.api';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const error = ref(false);
const devSecret = ref('');
const devAuthEnabled = import.meta.env.VITE_DEV_AUTH === '1';

async function onSubmit() {
  if (!email.value || !password.value) return;
  loading.value = true;
  error.value = false;
  try {
    const { data } = await authApi.login(email.value, password.value);
    authStore.setAuth(data.data.token, data.data.user);
    await router.push((route.query.redirect as string) || '/');
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function loginWithDev() {
  if (!devAuthEnabled) return;
  const secret = devSecret.value;
  if (!secret) return;
  loading.value = true;
  error.value = false;
  try {
    const { data } = await authApi.loginDev(secret);
    authStore.setAuth(data.data.token, data.data.user);
    await router.push((route.query.redirect as string) || '/');
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function loginWithGoogle() {
  loading.value = true;
  error.value = false;
  try {
    const idToken = (window as unknown as { __demoGoogleToken?: string }).__demoGoogleToken;
    if (!idToken) { error.value = true; loading.value = false; return; }
    const { data } = await authApi.loginGoogle(idToken);
    authStore.setAuth(data.data.token, data.data.user);
    await router.push((route.query.redirect as string) || '/');
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function loginWithFacebook() {
  loading.value = true;
  error.value = false;
  try {
    const accessToken = (window as unknown as { __demoFbToken?: string }).__demoFbToken;
    if (!accessToken) { error.value = true; loading.value = false; return; }
    const { data } = await authApi.loginFacebook(accessToken);
    authStore.setAuth(data.data.token, data.data.user);
    await router.push((route.query.redirect as string) || '/');
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) router.replace({ name: 'dashboard' });
});
</script>

<style scoped>
.auth-form { width: 100%; }
.auth-form__title { font-size: 1.5rem; color: #1976d2; margin: 0 0 1.5rem; text-align: center; }
.auth-form__form { display: flex; flex-direction: column; gap: 1rem; }
.auth-form__label { font-size: 0.875rem; font-weight: 500; color: #333; }
.auth-form__input { padding: 0.6rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.auth-form__row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.auth-form__checkbox { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
.auth-form__link { color: #1976d2; text-decoration: none; font-size: 0.875rem; }
.auth-form__link:hover { text-decoration: underline; }
.auth-form__btn { padding: 0.75rem 1rem; background: #1976d2; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; width: 100%; }
.auth-form__btn:disabled { opacity: 0.7; cursor: not-allowed; }
.auth-form__btn--outline { background: transparent; color: #1976d2; border: 1px solid #1976d2; }
.auth-form__hr { margin: 1.25rem 0; border: none; border-top: 1px solid #eee; }
.auth-form__footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: #666; }
.auth-form__or { text-align: center; margin: 1.5rem 0 0.5rem; font-size: 0.875rem; color: #888; }
.auth-form__social { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
.auth-form__social-btn { padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.875rem; }
.auth-form__error { color: #c62828; font-size: 0.875rem; text-align: center; margin-top: 1rem; }
</style>
