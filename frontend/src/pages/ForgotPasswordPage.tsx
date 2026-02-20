import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { authApi } from '@/api/auth.api';
import { translateApiError } from '@/i18n/translateApiError';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(translateApiError(err, 'forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="mb-6 flex items-center gap-3" data-test="forgot-password-title">
          <img src="/logo.png" alt={t('app.title')} className="h-12 w-12" />
          <h1 className="text-xl font-semibold">{t('login.title')}</h1>
        </div>
        <h2 className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">{t('forgotPassword.title')}</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t('forgotPassword.description')}</p>
        <form data-test="form-forgot-password" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('forgotPassword.email')}</Label>
            <Input
              id="email"
              type="email"
              data-test="input-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" data-test="error-message">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600" data-test="success-message">
              {t('forgotPassword.success')}
            </p>
          )}
          <Button type="submit" disabled={loading} data-test="button-submit" className="w-full">
            {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
          </Button>
          <Link
            to="/login"
            className="block text-center text-sm text-slate-600 hover:underline dark:text-slate-400"
            data-test="link-back-to-login"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </form>
      </div>
    </div>
  );
}
