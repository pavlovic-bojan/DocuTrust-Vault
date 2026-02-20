import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { usersApi, type User } from '@/api/users.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer } from '@/components/ui/drawer';
import { useAuth } from '@/stores/authStore';
import { translateApiError } from '@/i18n/translateApiError';

type SortKey = 'name' | 'email' | 'role' | 'status' | 'lastLoginAt' | 'createdAt';
const PAGE_SIZES = [10, 25, 50, 100] as const;

export function UsersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'DELETED',
    preferredLanguage: 'EN' as 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  function load() {
    usersApi
      .list()
      .then((r) => setUsers(r.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  }

  const sortedUsers = useMemo(() => {
    const arr = [...users];
    arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortBy) {
        case 'name':
          av = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
          bv = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim();
          break;
        case 'email':
        case 'role':
        case 'status':
          av = (a[sortBy] ?? '') as string;
          bv = (b[sortBy] ?? '') as string;
          break;
        case 'lastLoginAt':
          av = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          bv = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          break;
        case 'createdAt':
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const cmp = (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [users, sortBy, sortDir]);

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sortedUsers;
    return sortedUsers.filter((u) => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const role = (u.role ?? '').toLowerCase();
      const status = (u.status ?? '').toLowerCase();
      const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString().toLowerCase() : '';
      const created = new Date(u.createdAt).toLocaleDateString().toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        status.includes(q) ||
        lastLogin.includes(q) ||
        created.includes(q)
      );
    });
  }, [sortedUsers, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, effectivePage, pageSize]);

  const from = filteredUsers.length === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const to = Math.min(effectivePage * pageSize, filteredUsers.length);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isEditMode = !!editingUser;

  function validateForm(): boolean {
    const err: Record<string, string> = {};
    if (!formData.email.trim()) err.email = t('users.validation_emailRequired');
    else if (!emailRegex.test(formData.email.trim())) err.email = t('users.validation_emailInvalid');
    if (!formData.firstName.trim()) err.firstName = t('users.validation_firstNameRequired');
    if (!formData.lastName.trim()) err.lastName = t('users.validation_lastNameRequired');
    if (!isEditMode) {
      if (!formData.password) err.password = t('users.validation_passwordRequired');
      else if (formData.password.length < 8) err.password = t('users.validation_passwordMin');
    } else if (formData.password && formData.password.length < 8) {
      err.password = t('users.validation_passwordMin');
    }
    setFormErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(false);
    if (!validateForm()) return;
    setCreating(true);
    try {
      await usersApi.create({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        preferredLanguage: formData.preferredLanguage,
      });
      setCreateSuccess(true);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'USER', status: 'ACTIVE', preferredLanguage: 'EN' });
      setFormErrors({});
      load();
      setTimeout(() => {
        setCreateSuccess(false);
        setDrawerOpen(false);
      }, 1500);
    } catch (err) {
      setCreateError(translateApiError(err, 'users.createFailed'));
    } finally {
      setCreating(false);
    }
  }

  function openEditDrawer(u: User) {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.email ?? '',
      password: '',
      role: (u.role === 'ADMIN' ? 'ADMIN' : 'USER') as 'ADMIN' | 'USER',
      status: (u.status === 'SUSPENDED' ? 'SUSPENDED' : u.status === 'DELETED' ? 'DELETED' : 'ACTIVE') as 'ACTIVE' | 'SUSPENDED' | 'DELETED',
      preferredLanguage: (u.preferredLanguage ?? 'EN') as 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR',
    });
    setFormErrors({});
    setCreateError('');
    setCreateSuccess(false);
    setDrawerOpen(true);
  }

  function closeEditDrawer() {
    setDrawerOpen(false);
    setEditingUser(null);
    setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'USER', status: 'ACTIVE', preferredLanguage: 'EN' });
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setCreateError('');
    setCreateSuccess(false);
    if (!validateForm()) return;
    setCreating(true);
    try {
      const payload: Parameters<typeof usersApi.update>[1] = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        preferredLanguage: formData.preferredLanguage,
      };
      if (formData.password) payload.password = formData.password;
      await usersApi.update(editingUser.userId, payload);
      setCreateSuccess(true);
      load();
      setTimeout(() => {
        setCreateSuccess(false);
        closeEditDrawer();
      }, 1500);
    } catch (err) {
      setCreateError(translateApiError(err, 'users.updateFailed'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteConfirmUser) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteConfirmUser.userId);
      setDeleteConfirmUser(null);
      load();
    } catch (err) {
      setCreateError(translateApiError(err, 'users.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p>{t('users.loading')}</p>;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">{t('users.title')}</h1>
        <Button onClick={() => { setEditingUser(null); setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'USER', status: 'ACTIVE', preferredLanguage: 'EN' }); setDrawerOpen(true); }} className="w-full shrink-0 gap-2 sm:w-auto">
          <UserPlus className="h-4 w-4" />
          {t('users.addUser')}
        </Button>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder={t('users.filterPlaceholder')}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[640px] text-sm" data-test="table-users">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('users.name')}
                  {sortBy === 'name' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('email')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('users.email')}
                  {sortBy === 'email' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('role')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('users.role')}
                  {sortBy === 'role' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('users.status')}
                  {sortBy === 'status' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('lastLoginAt')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('users.lastLogin')}
                  {sortBy === 'lastLoginAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('createdAt')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('users.created')}
                  {sortBy === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">{t('users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u.userId} className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-4 py-2">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2"><Badge>{u.role}</Badge></td>
                <td className="px-4 py-2"><Badge variant={u.status}>{u.status}</Badge></td>
                <td className="px-4 py-2">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditDrawer(u)}
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                      aria-label={t('users.editUserTitle')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmUser(u)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      aria-label={t('users.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-4 text-center text-slate-500 dark:text-slate-400">{t('users.noUsers')}</p>
        )}
      </div>

      {users.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="usersPageSize" className="text-sm text-slate-600 dark:text-slate-400">
                {t('documents.rowsPerPage')}
              </label>
              <select
                id="usersPageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {t('documents.pageOf', { from, to, total: filteredUsers.length })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              {t('documents.prev')}
            </Button>
            <span className="text-sm">
              {effectivePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('documents.next')}
            </Button>
          </div>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={isEditMode ? closeEditDrawer : () => setDrawerOpen(false)} title={isEditMode ? t('users.editUserTitle') : t('users.addUserTitle')}>
        <form onSubmit={isEditMode ? handleUpdateUser : handleCreateUser} className="space-y-4">
          <div>
            <Label htmlFor="newFirstName">{t('profile.firstName')}</Label>
            <Input
              id="newFirstName"
              value={formData.firstName}
              onChange={(e) => setFormData((d) => ({ ...d, firstName: e.target.value }))}
              className="mt-1"
            />
            {formErrors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="newLastName">{t('profile.lastName')}</Label>
            <Input
              id="newLastName"
              value={formData.lastName}
              onChange={(e) => setFormData((d) => ({ ...d, lastName: e.target.value }))}
              className="mt-1"
            />
            {formErrors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.lastName}</p>}
          </div>
          <div>
            <Label htmlFor="newEmail">{t('profile.email')}</Label>
            <Input
              id="newEmail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
              className="mt-1"
            />
            {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
          </div>
          <div>
            <Label htmlFor="newPassword">{isEditMode ? t('users.passwordOptional') : t('users.password')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((d) => ({ ...d, password: e.target.value }))}
              placeholder={isEditMode ? t('users.passwordOptional') : undefined}
              className="mt-1"
            />
            {formErrors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>}
          </div>
          <div>
            <Label htmlFor="newRole">{t('profile.role')}</Label>
            <select
              id="newRole"
              value={formData.role}
              onChange={(e) => setFormData((d) => ({ ...d, role: e.target.value as 'ADMIN' | 'USER' }))}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          {isEditMode && (
            <div>
              <Label htmlFor="newStatus">{t('profile.status')}</Label>
              <select
                id="newStatus"
                value={formData.status}
                onChange={(e) => setFormData((d) => ({ ...d, status: e.target.value as 'ACTIVE' | 'SUSPENDED' | 'DELETED' }))}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="DELETED">DELETED</option>
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="newPreferredLanguage">{t('profile.preferredLanguage')}</Label>
            <select
              id="newPreferredLanguage"
              value={formData.preferredLanguage}
              onChange={(e) =>
                setFormData((d) => ({ ...d, preferredLanguage: e.target.value as typeof formData.preferredLanguage }))
              }
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="EN">{t('languages.EN')}</option>
              <option value="ES">{t('languages.ES')}</option>
              <option value="FR">{t('languages.FR')}</option>
              <option value="SR_LAT">{t('languages.SR_LAT')}</option>
              <option value="SR_CYR">{t('languages.SR_CYR')}</option>
            </select>
          </div>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
          {createSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {isEditMode ? t('users.updateSuccess') : t('users.createSuccess')}
            </p>
          )}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={creating}>
              {creating ? (isEditMode ? t('users.updating') : t('users.creating')) : (isEditMode ? t('users.update') : t('users.create'))}
            </Button>
            <Button type="button" variant="outline" onClick={isEditMode ? closeEditDrawer : () => setDrawerOpen(false)}>
              {t('documents.cancel')}
            </Button>
          </div>
        </form>
      </Drawer>

      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">{t('users.deleteConfirmTitle')}</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{t('users.deleteConfirmQuestion')}</p>
            <div className="flex gap-2">
              <Button onClick={handleDeleteUser} disabled={deleting} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
                {deleting ? t('users.deleting') : t('users.delete')}
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirmUser(null)} disabled={deleting}>
                {t('documents.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
