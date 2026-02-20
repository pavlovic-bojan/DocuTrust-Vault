/**
 * Integration tests – document routes (DocuTrust Vault)
 * GET /list, GET /:id, GET /:id/download, POST /:id/send, DELETE /:id, GET /:id/audit, POST / (upload)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as documentService from '../../usecases/document.service.js';

vi.mock('../../usecases/document.service.js');
vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

const getApp = async () => {
  const { app } = await import('../../app.js');
  return app;
};

function signToken(
  userId = 'u1',
  companyId = 'c1',
  role: 'ADMIN' | 'USER' = 'ADMIN'
) {
  return jwt.sign(
    { userId, email: 'admin@test.com', role, companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// Minimal valid PDF bytes for upload test
const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 2\ntrailer<</Root 1 0 R>>\n%%EOF');

describe('Document routes integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../infrastructure/db.js');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      companyId: 'c1',
      status: 'ACTIVE',
    } as never);
  });

  describe('GET /api/v1/documents', () => {
    it('should return 401 without token', async () => {
      const app = await getApp();

      await request(app).get('/api/v1/documents').expect(401);
    });

    it('should return 200 with documents', async () => {
      const app = await getApp();
      vi.mocked(documentService.listDocuments).mockResolvedValue([
        {
          documentId: 'doc1',
          companyId: 'c1',
          originalFileName: 'test.pdf',
          currentFileName: 'test.pdf',
        },
      ] as never);

      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${signToken()}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].documentId).toBe('doc1');
    });
  });

  describe('GET /api/v1/documents/:documentId', () => {
    it('should return 200 with document', async () => {
      const app = await getApp();
      vi.mocked(documentService.getDocument).mockResolvedValue({
        documentId: 'doc1',
        originalFileName: 'test.pdf',
      } as never);

      const res = await request(app)
        .get('/api/v1/documents/doc1')
        .set('Authorization', `Bearer ${signToken()}`)
        .expect(200);

      expect(res.body.documentId).toBe('doc1');
    });
  });

  describe('POST /api/v1/documents/:documentId/send', () => {
    it('should return 200 when send successful', async () => {
      const app = await getApp();
      vi.mocked(documentService.sendDocument).mockResolvedValue({
        success: true,
        message: 'Document sent via EMAIL',
        auditId: 'a1',
      });

      const res = await request(app)
        .post('/api/v1/documents/doc1/send')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({ channel: 'EMAIL', recipient: 'user@test.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 400 when channel invalid', async () => {
      const app = await getApp();

      await request(app)
        .post('/api/v1/documents/doc1/send')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({ channel: 'INVALID', recipient: 'user@test.com' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/documents/:documentId', () => {
    it('should return 204 on delete', async () => {
      const app = await getApp();
      vi.mocked(documentService.deleteDocument).mockResolvedValue(undefined);

      await request(app)
        .delete('/api/v1/documents/doc1')
        .set('Authorization', `Bearer ${signToken()}`)
        .expect(204);
    });
  });

  describe('GET /api/v1/documents/:documentId/audit', () => {
    it('should return 200 with audit logs', async () => {
      const app = await getApp();
      vi.mocked(documentService.getAuditTrail).mockResolvedValue([
        { auditId: 'a1', action: 'UPLOAD', newHash: 'abc' },
      ] as never);

      const res = await request(app)
        .get('/api/v1/documents/doc1/audit')
        .set('Authorization', `Bearer ${signToken()}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].action).toBe('UPLOAD');
    });
  });

  describe('POST /api/v1/documents (upload)', () => {
    it('should return 201 when upload successful', async () => {
      const app = await getApp();
      vi.mocked(documentService.uploadDocument).mockResolvedValue({
        documentId: 'doc-new',
        originalFileName: 'test.pdf',
      } as never);

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${signToken()}`)
        .attach('file', minimalPdf, { filename: 'test.pdf', contentType: 'application/pdf' })
        .expect(201);

      expect(res.body.document).toBeDefined();
      expect(res.body.document.documentId).toBe('doc-new');
    });

    it('should return 401 without token', async () => {
      const app = await getApp();

      await request(app)
        .post('/api/v1/documents')
        .attach('file', minimalPdf, { filename: 'test.pdf', contentType: 'application/pdf' })
        .expect(401);
    });
  });

  describe('GET /api/v1/documents/:documentId/download', () => {
    let tempFile: string;

    beforeEach(async () => {
      const dir = path.join(os.tmpdir(), `doctrust-test-${Date.now()}`);
      await fs.mkdir(dir, { recursive: true });
      tempFile = path.join(dir, 'test-download.pdf');
      await fs.writeFile(tempFile, minimalPdf);
    });

    afterEach(async () => {
      try {
        await fs.unlink(tempFile);
        await fs.rmdir(path.dirname(tempFile));
      } catch {
        // ignore
      }
    });

    it('should return 200 with file when download successful', async () => {
      const app = await getApp();
      vi.mocked(documentService.downloadDocument).mockResolvedValue({
        path: tempFile,
        fileName: 'test-download.pdf',
      });

      const res = await request(app)
        .get('/api/v1/documents/doc1/download')
        .set('Authorization', `Bearer ${signToken()}`)
        .expect(200);

      expect(res.header['content-disposition']).toContain('test-download.pdf');
      expect(res.body).toBeDefined();
      expect(Buffer.isBuffer(res.body) ? res.body.length : 0).toBeGreaterThan(0);
    });
  });
});
