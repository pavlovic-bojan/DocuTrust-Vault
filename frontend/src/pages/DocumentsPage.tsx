import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, Send, Trash2 } from 'lucide-react';
import { documentsApi, type Document } from '@/api/documents.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translateApiError } from '@/i18n/translateApiError';

type SortKey = 'currentFileName' | 'originalFileName' | 'fileType' | 'hashStatus' | 'uploadedAt' | 'uploadedBy';
const PAGE_SIZES = [10, 25, 50, 100] as const;

export function DocumentsPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [sendDoc, setSendDoc] = useState<Document | null>(null);
  const [channel, setChannel] = useState<'EMAIL' | 'VIBER'>('EMAIL');
  const [recipient, setRecipient] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    documentsApi
      .list()
      .then((r) => setDocs(r.data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentsApi.upload(file);
      load();
    } catch (err) {
      alert(translateApiError(err, 'documents.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSend() {
    if (!sendDoc) return;
    try {
      await documentsApi.send(sendDoc.documentId, channel, recipient);
      setSendDoc(null);
      setRecipient('');
      load();
    } catch (err) {
      alert(translateApiError(err, 'documents.sendFailed'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await documentsApi.delete(id);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      alert(translateApiError(err, 'documents.deleteFailed'));
    }
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  }

  const sortedDocs = useMemo(() => {
    const arr = [...docs];
    arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortBy) {
        case 'currentFileName':
        case 'originalFileName':
        case 'fileType':
        case 'hashStatus':
          av = a[sortBy] ?? '';
          bv = b[sortBy] ?? '';
          break;
        case 'uploadedAt':
          av = new Date(a.uploadedAt).getTime();
          bv = new Date(b.uploadedAt).getTime();
          break;
        case 'uploadedBy':
          av = a.uploadedBy?.name ?? '';
          bv = b.uploadedBy?.name ?? '';
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
  }, [docs, sortBy, sortDir]);

  const filteredDocs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sortedDocs;
    return sortedDocs.filter((d) => {
      const name = (d.currentFileName ?? '').toLowerCase();
      const original = (d.originalFileName ?? '').toLowerCase();
      const type = (d.fileType ?? '').toLowerCase();
      const hash = (d.hashStatus ?? '').toLowerCase();
      const by = (d.uploadedBy?.name ?? d.uploadedBy?.email ?? '').toLowerCase();
      const uploaded = new Date(d.uploadedAt).toLocaleString().toLowerCase();
      return (
        name.includes(q) ||
        original.includes(q) ||
        type.includes(q) ||
        hash.includes(q) ||
        by.includes(q) ||
        uploaded.includes(q)
      );
    });
  }, [sortedDocs, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedDocs = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, effectivePage, pageSize]);

  const from = filteredDocs.length === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const to = Math.min(effectivePage * pageSize, filteredDocs.length);

  function handleDownload(doc: Document) {
    documentsApi.download(doc.documentId).then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.currentFileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (loading) return <p>{t('documents.loading')}</p>;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">{t('documents.title')}</h1>
        <div className="flex shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-test="upload-area"
            className="w-full gap-2 sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            {uploading ? t('documents.uploading') : t('documents.upload')}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder={t('documents.filterPlaceholder')}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700" data-test="list-documents">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('currentFileName')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('documents.name')}
                  {sortBy === 'currentFileName' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('originalFileName')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('documents.original')}
                  {sortBy === 'originalFileName' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('fileType')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('documents.type')}
                  {sortBy === 'fileType' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('hashStatus')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('documents.hashStatus')}
                  {sortBy === 'hashStatus' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('uploadedAt')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('documents.uploaded')}
                  {sortBy === 'uploadedAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('uploadedBy')}
                  className="flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  {t('documents.by')}
                  {sortBy === 'uploadedBy' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
              <th className="px-4 py-2 text-left font-medium">{t('documents.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocs.map((d) => (
              <tr key={d.documentId} className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-4 py-2">{d.currentFileName}</td>
                <td className="px-4 py-2">{d.originalFileName}</td>
                <td className="px-4 py-2">{d.fileType}</td>
                <td className="px-4 py-2">
                  <Badge variant={d.hashStatus}>{d.hashStatus}</Badge>
                  {d.contentModified && <Badge className="ml-1">{t('documents.contentModified')}</Badge>}
                  {d.renameOnly && <Badge className="ml-1">{t('documents.renamedOnly')}</Badge>}
                </td>
                <td className="px-4 py-2">{new Date(d.uploadedAt).toLocaleString()}</td>
                <td className="px-4 py-2">{d.uploadedBy?.name ?? '-'}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownload(d)}
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                      aria-label={t('documents.download')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendDoc(d)}
                      data-test="button-send-document"
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                      aria-label={t('documents.send')}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(d.documentId)}
                      data-test="button-delete"
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      aria-label={t('documents.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {docs.length === 0 && (
          <p className="p-4 text-center text-slate-500 dark:text-slate-400">{t('documents.noDocuments')}</p>
        )}
      </div>

      {docs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-slate-600 dark:text-slate-400">
                {t('documents.rowsPerPage')}
              </label>
              <select
                id="pageSize"
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
              {t('documents.pageOf', { from, to, total: filteredDocs.length })}
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

      {sendDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <h3 className="mb-4 font-medium">{t('documents.sendDocument')}</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{sendDoc.currentFileName}</p>
            <div className="space-y-4">
              <div>
                <Label>{t('documents.channel')}</Label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as 'EMAIL' | 'VIBER')}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="EMAIL">Email</option>
                  <option value="VIBER">Viber</option>
                </select>
              </div>
              <div>
                <Label>{t('documents.recipient')}</Label>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={channel === 'EMAIL' ? t('documents.emailPlaceholder') : t('documents.viberPlaceholder')}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={handleSend}>{t('documents.send')}</Button>
              <Button variant="outline" onClick={() => setSendDoc(null)}>{t('documents.cancel')}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <h3 className="mb-4 font-medium">{t('documents.deleteConfirm')}</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{t('documents.deleteConfirmDesc')}</p>
            <div className="flex gap-2">
              <Button onClick={() => handleDelete(deleteConfirm)}>{t('documents.delete')}</Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t('documents.cancel')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
