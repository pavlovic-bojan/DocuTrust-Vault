/**
 * Unit tests – document.service (DocuTrust Vault)
 * listDocuments, getDocument, getAuditTrail, sendDocument, deleteDocument
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as documentService from '../../usecases/document.service.js';

vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}));

vi.mock('../../config/env.js', () => ({
  env: { UPLOAD_DIR: 'uploads-test' },
}));

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('abc123hash'),
    })),
    randomUUID: vi.fn().mockReturnValue('doc-uuid-1'),
  },
}));

describe('document.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDoc = {
    id: 'doc1',
    companyId: 'c1',
    originalFileName: 'test.pdf',
    currentFileName: 'test.pdf',
    fileType: 'PDF',
    fileSize: BigInt(1024),
    storagePath: 'c1/doc1.pdf',
    createdAt: new Date(),
    uploadedAt: new Date(),
    uploadedByUser: 'u1',
    initialHash: 'abc123',
    hashAlgorithm: 'SHA-256',
    hashStatus: 'VALID',
    contentModified: false,
    renameOnly: false,
    lastModifiedAt: null,
    modificationTool: null,
    sentExternally: false,
    sentVia: null,
    legalHold: false,
    logicalDeleted: false,
    logicalDeletedAt: null,
    retentionExpiryDate: null,
    auditStatus: 'COMPLIANT',
    uploadedBy: { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
  };

  describe('listDocuments', () => {
    it('should return documents for company', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findMany).mockResolvedValue([mockDoc] as never);

      const result = await documentService.listDocuments('c1', 'u1', 'ADMIN');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        documentId: 'doc1',
        companyId: 'c1',
        originalFileName: 'test.pdf',
      });
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'c1', logicalDeleted: false }),
        })
      );
    });

    it('should filter by uploadedByUser when role is USER', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findMany).mockResolvedValue([]);

      await documentService.listDocuments('c1', 'u1', 'USER');

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ uploadedByUser: 'u1' }),
        })
      );
    });
  });

  describe('getDocument', () => {
    it('should return document when found and authorized', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as never);

      const result = await documentService.getDocument('doc1', 'c1', 'u1', 'ADMIN');

      expect(result.documentId).toBe('doc1');
      expect(result.uploadedBy).toMatchObject({ email: 'admin@test.com' });
    });

    it('should throw 404 when document not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      await expect(
        documentService.getDocument('none', 'c1', 'u1', 'ADMIN')
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });

    it('should throw 403 when USER tries to access other user document', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        ...mockDoc,
        uploadedByUser: 'other-user',
      } as never);

      await expect(
        documentService.getDocument('doc1', 'c1', 'u1', 'USER')
      ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit logs for document', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as never);
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
        {
          id: 'a1',
          documentId: 'doc1',
          action: 'UPLOAD',
          performedBy: 'u1',
          performedAt: new Date(),
          previousHash: null,
          newHash: 'abc123',
          channel: null,
          notes: 'Uploaded',
          performer: { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
        },
      ] as never);

      const result = await documentService.getAuditTrail('doc1', 'c1', 'u1', 'ADMIN');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ action: 'UPLOAD', newHash: 'abc123' });
    });

    it('should throw 404 when document not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      await expect(
        documentService.getAuditTrail('none', 'c1', 'u1', 'ADMIN')
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });
  });

  describe('sendDocument', () => {
    it('should create audit and return success', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as never);
      const tx = {
        auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit1' }) },
        document: { update: vi.fn().mockResolvedValue({}) },
      };
      vi.mocked(prisma.$transaction).mockImplementation((fn: (t: unknown) => Promise<unknown>) =>
        fn(tx) as Promise<unknown>
      );

      const result = await documentService.sendDocument(
        'doc1',
        'c1',
        'u1',
        'ADMIN',
        'EMAIL',
        'recipient@test.com'
      );

      expect(result.success).toBe(true);
      expect(result.auditId).toBe('audit1');
    });

    it('should throw 404 when document not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      await expect(
        documentService.sendDocument('none', 'c1', 'u1', 'ADMIN', 'EMAIL', 'r@t.com')
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });
  });

  describe('deleteDocument', () => {
    it('should logically delete document', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as never);
      const tx = {
        auditLog: { create: vi.fn().mockResolvedValue({}) },
        document: { update: vi.fn().mockResolvedValue({}) },
      };
      vi.mocked(prisma.$transaction).mockImplementation((fn: (t: unknown) => Promise<unknown>) =>
        fn(tx) as Promise<unknown>
      );

      await documentService.deleteDocument('doc1', 'c1', 'u1', 'ADMIN');

      expect(tx.auditLog.create).toHaveBeenCalled();
      expect(tx.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc1' },
          data: expect.objectContaining({ logicalDeleted: true }),
        })
      );
    });

    it('should throw 404 when document not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      await expect(
        documentService.deleteDocument('none', 'c1', 'u1', 'ADMIN')
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });
  });

  describe('uploadDocument', () => {
    it('should upload and return document', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      const createdDoc = {
        id: 'doc-uuid-1',
        companyId: 'c1',
        originalFileName: 'test.pdf',
        currentFileName: 'test.pdf',
        fileType: 'PDF',
        fileSize: BigInt(1024),
        createdAt: new Date(),
        uploadedAt: new Date(),
        uploadedByUser: 'u1',
        initialHash: 'abc123hash',
        hashAlgorithm: 'SHA-256',
        hashStatus: 'VALID',
        contentModified: false,
        renameOnly: false,
        lastModifiedAt: null,
        modificationTool: null,
        sentExternally: false,
        sentVia: null,
        legalHold: false,
        logicalDeleted: false,
        logicalDeletedAt: null,
        retentionExpiryDate: null,
        auditStatus: 'COMPLIANT',
      };
      const tx = {
        document: { create: vi.fn().mockResolvedValue(createdDoc) },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
      };
      vi.mocked(prisma.$transaction).mockImplementation((fn: (t: unknown) => Promise<unknown>) =>
        fn(tx) as Promise<unknown>
      );

      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4'),
        size: 1024,
      } as Express.Multer.File;

      const result = await documentService.uploadDocument('c1', 'u1', file);

      expect(result.documentId).toBe('doc-uuid-1');
      expect(result.currentFileName).toBe('test.pdf');
      expect(result.hashStatus).toBe('VALID');
      expect(tx.document.create).toHaveBeenCalled();
      expect(tx.auditLog.create).toHaveBeenCalled();
    });

    it('should throw when file type invalid', async () => {
      const file = {
        originalname: 'test.exe',
        mimetype: 'application/octet-stream',
        buffer: Buffer.alloc(0),
        size: 0,
      } as Express.Multer.File;

      await expect(documentService.uploadDocument('c1', 'u1', file)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_FILE_TYPE',
      });
    });
  });
});
