import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/stores/authStore';
import { authApi } from '@/api/auth.api';
import { translateApiError } from '@/i18n/translateApiError';
import { PREFERRED_TO_LOCALE, persistLocale } from '@/i18n';

const LANG_OPTIONS = ['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR'] as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<typeof LANG_OPTIONS[number]>('EN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setPreferredLanguage((user.preferredLanguage as typeof LANG_OPTIONS[number]) ?? 'EN');
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        preferredLanguage,
      });
      await refresh();
      const locale = PREFERRED_TO_LOCALE[preferredLanguage] ?? 'en';
      persistLocale(locale);
      setSuccess(true);
    } catch (err: unknown) {
      setError(translateApiError(err, 'profile.error'));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-semibold">{t('profile.title')}</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('profile.firstName')}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('profile.lastName')}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">{t('profile.preferredLanguage')}</Label>
            <select
              id="preferredLanguage"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as typeof LANG_OPTIONS[number])}
              className="mt-1 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {LANG_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`languages.${lang}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-6 rounded-md border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>{t('profile.role')}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{user.role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>{t('profile.status')}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{user.status}</span>
            </div>
          </div>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
          {success && <p className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">{t('profile.success')}</p>}
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              {loading ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
