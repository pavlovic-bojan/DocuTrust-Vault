import { api } from '@/lib/api';

export interface Document {
  documentId: string;
  companyId: string;
  originalFileName: string;
  currentFileName: string;
  fileType: string;
  fileSize: number;
  hashStatus: string;
  contentModified: boolean;
  renameOnly: boolean;
  uploadedAt: string;
  uploadedByUser: string;
  uploadedBy?: { name: string; email: string } | null;
}

export const documentsApi = {
  list: (params?: { logicalDeleted?: boolean; hashStatus?: string }) =>
    api.get<Document[]>('/documents', { params }),

  getById: (id: string) => api.get<Document>(`/documents/${id}`),

  upload: (file: File, creationTool?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (creationTool) fd.append('creationTool', creationTool);
    return api.post<{ document: Document; message: string }>('/documents', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  download: (id: string) =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  send: (id: string, channel: 'EMAIL' | 'VIBER', recipient: string) =>
    api.post<{ success: boolean; message: string; auditId: string }>(
      `/documents/${id}/send`,
      { channel, recipient }
    ),

  delete: (id: string) => api.delete(`/documents/${id}`),

  getAudit: (id: string) =>
    api.get<
      Array<{
        auditId: string;
        documentId: string;
        action: string;
        performedBy: string;
        performedAt: string;
        previousHash: string | null;
        newHash: string | null;
        channel: string | null;
        notes: string | null;
      }>
    >(`/documents/${id}/audit`),
};
