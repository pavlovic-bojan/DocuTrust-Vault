import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/stores/authStore';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import i18n, { PREFERRED_TO_LOCALE, persistLocale } from '@/i18n';
import { translateApiError } from '@/i18n/translateApiError';

const LANG_VALUES = ['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR'] as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('EN');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setPreferredLanguage(user.preferredLanguage ?? 'EN');
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.updateProfile({ firstName, lastName, email, preferredLanguage });
      await refresh();
      const locale = PREFERRED_TO_LOCALE[preferredLanguage] ?? 'en';
      i18n.changeLanguage(locale);
      persistLocale(locale);
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; code?: string; errors?: Array<{ msg?: string }> } }; message?: string };
      const res = axiosErr?.response?.data;
      let msg = res?.message ?? res?.errors?.[0]?.msg;
      if (!msg) {
        if (axiosErr?.response?.status) {
          msg = t('profile.errorRequest', { status: axiosErr.response.status });
        } else if (axiosErr?.message?.includes('Network')) {
          msg = t('profile.errorNetwork');
        } else {
          msg = translateApiError(err, 'profile.error');
        }
      } else {
        msg = translateApiError(err, 'profile.error');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 sm:px-0">
      <h1 className="mb-4 text-xl font-semibold">{t('profile.title')}</h1>
      <div className="w-full max-w-md px-2 sm:px-0">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <div>
            <Label htmlFor="firstName">{t('profile.firstName')}</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lastName">{t('profile.lastName')}</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="preferredLanguage">{t('profile.preferredLanguage')}</Label>
            <select
              id="preferredLanguage"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {LANG_VALUES.map((val) => (
                <option key={val} value={val}>
                  {t(`languages.${val}`)}
                </option>
              ))}
            </select>
          </div>
          {user && (
            <div className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <p>
                <span className="font-medium">{t('profile.role')}:</span> {user.role}
              </p>
              <p>
                <span className="font-medium">{t('profile.status')}:</span> {user.status}
              </p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{t('profile.success')}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? t('profile.saving') : t('profile.saveChanges')}
          </Button>
        </form>
      </div>
    </div>
  );
}
