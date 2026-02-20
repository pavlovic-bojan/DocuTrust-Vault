import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/stores/authStore';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || (user?.email ?? '');

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <h1 className="mb-4 text-center text-xl font-semibold sm:text-left">{t('dashboard.welcome', { name })}</h1>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {user?.role === 'ADMIN' && (
          <Link to="/users" className="rounded-lg border border-slate-200 p-4 shadow hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            {t('dashboard.users')}
          </Link>
        )}
        <Link to="/documents" className="rounded-lg border border-slate-200 p-4 shadow hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          {t('dashboard.documents')}
        </Link>
      </div>
    </div>
  );
}
