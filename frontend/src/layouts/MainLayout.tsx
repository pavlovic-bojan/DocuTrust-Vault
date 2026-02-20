import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/stores/authStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

function getInitials(firstName: string, lastName: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';
  return (f + l) || '?';
}

export function MainLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" data-test="layout-main">
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <Link to={user?.role === 'USER' ? '/documents' : '/'} className="flex shrink-0 items-center gap-2">
            <img src="/logo.png" alt={t('app.title')} className="h-8 w-8 shrink-0" />
            <span className="hidden font-semibold sm:inline">{t('app.title')}</span>
            <span className="font-semibold sm:hidden">DocuTrust</span>
          </Link>
          <nav className="hidden gap-4 md:flex">
            {user?.role === 'ADMIN' && (
              <Link to="/users" className="text-sm hover:underline dark:text-slate-300">
                {t('layout.users')}
              </Link>
            )}
            <Link to="/documents" className="text-sm hover:underline dark:text-slate-300">
              {t('layout.documents')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 dark:bg-slate-600 dark:hover:bg-slate-500"
              aria-label={t('layout.userMenu')}
            >
              {getInitials(user?.firstName ?? '', user?.lastName ?? '')}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <div className="md:hidden">
              {user?.role === 'ADMIN' && (
                <DropdownMenuItem asChild>
                  <Link to="/users">{t('layout.users')}</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/documents">{t('layout.documents')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
            <DropdownMenuItem asChild>
              <Link to="/profile">{t('layout.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/report-bug">{t('layout.reportBug')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-600">
              {t('layout.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col overflow-x-hidden bg-slate-50 p-4 dark:bg-slate-900 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
