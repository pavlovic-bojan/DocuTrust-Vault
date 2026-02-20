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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await reportBugApi.submit(subject.trim(), description.trim());
      setSuccess(true);
      setSubject('');
      setDescription('');
    } catch (err: unknown) {
      setError(translateApiError(err, 'reportBug.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-semibold">{t('reportBug.title')}</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('reportBug.subject')}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('reportBug.subjectPlaceholder')}
              required
              className="mt-1 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('reportBug.description')}</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('reportBug.descriptionPlaceholder')}
              required
              rows={10}
              className="mt-1 block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-relaxed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('reportBug.descriptionHint')}
            </p>
          </div>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
          {success && <p className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">{t('reportBug.success')}</p>}
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="min-w-[160px]">
              {loading ? t('reportBug.sending') : t('reportBug.submitReport')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
