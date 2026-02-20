import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reportBugApi } from '@/api/report-bug.api';
import { translateApiError } from '@/i18n/translateApiError';

export function ReportBugPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await reportBugApi.submit(subject, description);
      setSubmitted(true);
      setSubject('');
      setDescription('');
    } catch (err: unknown) {
      setError(translateApiError(err, 'reportBug.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 sm:px-0">
      <h1 className="mb-4 text-xl font-semibold">{t('reportBug.title')}</h1>
      <div className="w-full max-w-md px-2 sm:px-0">
        {submitted ? (
          <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {t('reportBug.success')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <div>
              <Label htmlFor="subject">{t('reportBug.subject')}</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('reportBug.subjectPlaceholder')}
                required
                className="mt-1"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div>
              <Label htmlFor="description">{t('reportBug.description')}</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportBug.descriptionPlaceholder')}
                required
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t('reportBug.sending') : t('reportBug.submitReport')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
