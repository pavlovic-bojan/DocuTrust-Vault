import { api } from '@/lib/api';

export const reportBugApi = {
  submit: (subject: string, description: string) =>
    api.post<{ ok: boolean; message: string }>('/report-bug', { subject, description }),
};
