import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/stores/authStore';
import { translateApiError } from '@/i18n/translateApiError';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'USER' ? '/documents' : '/');
    } catch (err: unknown) {
      setError(translateApiError(err, 'login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="mb-6 flex items-center gap-3" data-test="login-title">
          <img src="/logo.png" alt={t('app.title')} className="h-12 w-12" />
          <h1 className="text-xl font-semibold">{t('login.title')}</h1>
        </div>
        <form data-test="form-login" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('login.email')}</Label>
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
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-slate-600 hover:underline dark:text-slate-400"
                data-test="link-forgot-password"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              data-test="input-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" data-test="error-message">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} data-test="button-submit" className="w-full">
            {loading ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </form>
      </div>
    </div>
  );
}
