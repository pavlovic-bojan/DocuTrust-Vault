<template>
  <AuthLayout>
    <div class="auth-form">
      <h2 class="auth-form__title" data-test="register-title">{{ $t('auth.createAccount') }}</h2>
      <form class="auth-form__form" data-test="form-register" @submit.prevent="onSubmit">
        <label class="auth-form__label">{{ $t('auth.name') }}</label>
        <input v-model="name" type="text" class="auth-form__input" data-test="input-name" required />
        <label class="auth-form__label">{{ $t('auth.email') }}</label>
        <input v-model="email" type="email" class="auth-form__input" data-test="input-email" required />
        <label class="auth-form__label">{{ $t('auth.iAmA') }}</label>
        <select v-model="role" class="auth-form__input" data-test="select-role">
          <option value="DRIVER">{{ $t('auth.roleDriver') }}</option>
          <option value="ADMIN">{{ $t('auth.roleAdmin') }}</option>
        </select>
        <label class="auth-form__label">{{ $t('auth.password') }}</label>
        <input v-model="password" :type="showPassword ? 'text' : 'password'" class="auth-form__input" data-test="input-password" required />
        <p class="auth-form__hint">{{ $t('auth.passwordHint') }}</p>
        <label class="auth-form__label">{{ $t('auth.confirmPassword') }}</label>
        <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" class="auth-form__input" data-test="input-confirm-password" required />
        <button type="submit" class="auth-form__btn" :disabled="loading" data-test="button-create-account">{{ $t('auth.createAccount') }}</button>
      </form>
      <p class="auth-form__footer">
        {{ $t('auth.haveAccount') }}
        <router-link :to="{ name: 'login' }" class="auth-form__link" data-test="link-sign-in">{{ $t('auth.signIn') }}</router-link>
      </p>
      <p class="auth-form__or">{{ $t('auth.orSignUpWith') }}</p>
      <div class="auth-form__social">
        <button type="button" class="auth-form__social-btn" :disabled="loading" data-test="button-login-google">Google</button>
        <button type="button" class="auth-form__social-btn" :disabled="loading" data-test="button-login-facebook">Facebook</button>
      </div>
      <p v-if="error" class="auth-form__error" data-test="error-message">{{ $t('auth.errorRegister') }}</p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from '../layouts/AuthLayout.vue';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth.api';

const authStore = useAuthStore();

const router = useRouter();
const name = ref('');
const email = ref('');
const role = ref('DRIVER');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref(false);

async function onSubmit() {
  if (password.value !== confirmPassword.value) {
    error.value = true;
    return;
  }
  loading.value = true;
  error.value = false;
  try {
    const { data } = await authApi.register({
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value,
    });
    authStore.setAuth(data.data.token, data.data.user);
    await router.push('/');
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
.auth-form__footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: #666; }
.auth-form__or { text-align: center; margin: 1.5rem 0 0.5rem; font-size: 0.875rem; color: #888; }
.auth-form__social { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
.auth-form__social-btn { padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.875rem; }
.auth-form__error { color: #c62828; font-size: 0.875rem; text-align: center; margin-top: 1rem; }
.auth-form__link { color: #1976d2; text-decoration: none; }
.auth-form__link:hover { text-decoration: underline; }
</style>
