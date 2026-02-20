/**
 * Document service – DocuTrust Vault
 * Upload, list, get, download, send, delete, audit
 * Per docs/OpenAPI.yaml and docs/DocuTrust_Vault_ TDD.md
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../infrastructure/db.js';
import { ApiError } from '../utils/ApiError.js';
import type { HashStatus } from '@prisma/client';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXT = ['.pdf', '.docx'];

function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getFileExt(mimeType: string): string {
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
  return '';
}

export async function uploadDocument(
  companyId: string,
  userId: string,
  file: Express.Multer.File,
  creationTool?: string
) {
  const ext = path.extname(file.originalname).toLowerCase() || getFileExt(file.mimetype);
  if (!ALLOWED_EXT.includes(ext)) {
    throw new ApiError('Invalid file type. Allowed: PDF, DOCX', 400, 'INVALID_FILE_TYPE');
  }

  const hash = computeSha256(file.buffer);
  const docId = crypto.randomUUID();
  const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR, companyId);
  await fs.mkdir(uploadDir, { recursive: true });
  const storagePath = path.join(companyId, `${docId}${ext}`);
  const fullPath = path.join(process.cwd(), env.UPLOAD_DIR, storagePath);
  await fs.writeFile(fullPath, file.buffer);

  const retentionDays = 2555; // ~7 years
  const retentionExpiryDate = new Date();
  retentionExpiryDate.setDate(retentionExpiryDate.getDate() + retentionDays);

  const doc = await prisma.$transaction(async (tx) => {
    const d = await tx.document.create({
      data: {
        id: docId,
        companyId,
        originalFileName: file.originalname,
        currentFileName: file.originalname,
        fileType: ext === '.pdf' ? 'PDF' : 'DOCX',
        fileSize: BigInt(file.size),
        storagePath,
        uploadedByUser: userId,
        createdByUser: userId,
        creationTool: creationTool ?? null,
        initialHash: hash,
        hashAlgorithm: 'SHA-256',
        hashStatus: 'VALID',
      },
    });

    await tx.auditLog.create({
      data: {
        documentId: d.id,
        action: 'UPLOAD',
        performedBy: userId,
        newHash: hash,
        notes: `Uploaded: ${file.originalname}`,
      },
    });

    return d;
  });

  return mapDocument(doc);
}

export async function listDocuments(
  companyId: string,
  userId: string,
  role: string,
  options: { logicalDeleted?: boolean; hashStatus?: string } = {}
) {
  const where: Prisma.DocumentWhereInput = {
    companyId,
  };

  if (role === 'USER') {
    where.uploadedByUser = userId;
  }

  if (options.logicalDeleted === false || options.logicalDeleted === undefined) {
    where.logicalDeleted = false;
  }

  if (options.hashStatus && ['VALID', 'MISSING', 'REMOVED', 'SYSTEM'].includes(options.hashStatus)) {
    where.hashStatus = options.hashStatus as HashStatus;
  }

  const docs = await prisma.document.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return docs.map(mapDocumentWithUploader);
}

export async function getDocument(
  documentId: string,
  companyId: string,
  userId: string,
  role: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!doc || doc.companyId !== companyId) {
    throw new ApiError('Document not found', 404, 'NOT_FOUND');
  }

  if (role === 'USER' && doc.uploadedByUser !== userId) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  return mapDocumentWithUploader(doc);
}

export async function downloadDocument(
  documentId: string,
  companyId: string,
  userId: string,
  role: string
): Promise<{ path: string; fileName: string }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.companyId !== companyId) {
    throw new ApiError('Document not found', 404, 'NOT_FOUND');
  }

  if (role === 'USER' && doc.uploadedByUser !== userId) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  const fullPath = path.join(process.cwd(), env.UPLOAD_DIR, doc.storagePath);
  try {
    await fs.access(fullPath);
  } catch {
    throw new ApiError('File not found on storage', 404, 'FILE_NOT_FOUND');
  }

  return { path: fullPath, fileName: doc.currentFileName };
}

export async function sendDocument(
  documentId: string,
  companyId: string,
  userId: string,
  role: string,
  channel: 'EMAIL' | 'VIBER',
  recipient: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.companyId !== companyId) {
    throw new ApiError('Document not found', 404, 'NOT_FOUND');
  }

  if (role === 'USER' && doc.uploadedByUser !== userId) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  // Stub: log send. In production, integrate Email/Viber APIs.
  const audit = await prisma.$transaction(async (tx) => {
    const a = await tx.auditLog.create({
      data: {
        documentId,
        action: 'SEND',
        performedBy: userId,
        newHash: doc.initialHash,
        channel: channel as 'EMAIL' | 'VIBER',
        notes: `Sent via ${channel} to ${recipient}`,
      },
    });

    await tx.document.update({
      where: { id: documentId },
      data: {
        sentExternally: true,
        sentVia: channel,
        sentVersionHash: doc.initialHash,
      },
    });

    return a;
  });

  return { success: true, message: `Document sent via ${channel}`, auditId: audit.id };
}

export async function deleteDocument(
  documentId: string,
  companyId: string,
  userId: string,
  role: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.companyId !== companyId) {
    throw new ApiError('Document not found', 404, 'NOT_FOUND');
  }

  if (role === 'USER' && doc.uploadedByUser !== userId) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        documentId,
        action: 'DELETE',
        performedBy: userId,
        previousHash: doc.initialHash,
        notes: 'Logical delete',
      },
    });

    await tx.document.update({
      where: { id: documentId },
      data: {
        logicalDeleted: true,
        logicalDeletedAt: new Date(),
      },
    });
  });
}

export async function getAuditTrail(
  documentId: string,
  companyId: string,
  userId: string,
  role: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.companyId !== companyId) {
    throw new ApiError('Document not found', 404, 'NOT_FOUND');
  }

  if (role === 'USER' && doc.uploadedByUser !== userId) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  const logs = await prisma.auditLog.findMany({
    where: { documentId },
    orderBy: { performedAt: 'asc' },
    include: {
      performer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return logs.map((l) => ({
    auditId: l.id,
    documentId: l.documentId,
    action: l.action,
    performedBy: l.performedBy,
    performedAt: l.performedAt,
    previousHash: l.previousHash,
    newHash: l.newHash,
    channel: l.channel,
    notes: l.notes,
  }));
}

function mapDocument(d: { id: string; companyId: string; originalFileName: string; currentFileName: string; fileType: string; fileSize: bigint; createdAt: Date; uploadedAt: Date; uploadedByUser: string; initialHash: string; hashAlgorithm: string; hashStatus: string; contentModified: boolean; renameOnly: boolean; lastModifiedAt: Date | null; modificationTool: string | null; sentExternally: boolean; sentVia: string | null; legalHold: boolean; logicalDeleted: boolean; logicalDeletedAt: Date | null; retentionExpiryDate: Date | null; auditStatus: string }) {
  return {
    documentId: d.id,
    companyId: d.companyId,
    originalFileName: d.originalFileName,
    currentFileName: d.currentFileName,
    fileType: d.fileType,
    fileSize: Number(d.fileSize),
    createdAt: d.createdAt,
    uploadedAt: d.uploadedAt,
    uploadedByUser: d.uploadedByUser,
    initialHash: d.initialHash,
    hashAlgorithm: d.hashAlgorithm,
    hashStatus: d.hashStatus,
    contentModified: d.contentModified,
    renameOnly: d.renameOnly,
    lastModifiedAt: d.lastModifiedAt,
    modificationTool: d.modificationTool,
    sentExternally: d.sentExternally,
    sentVia: d.sentVia,
    legalHold: d.legalHold,
    logicalDeleted: d.logicalDeleted,
    logicalDeletedAt: d.logicalDeletedAt,
    retentionExpiryDate: d.retentionExpiryDate,
    auditStatus: d.auditStatus,
  };
}

function mapDocumentWithUploader(d: {
  id: string;
  companyId: string;
  originalFileName: string;
  currentFileName: string;
  fileType: string;
  fileSize: bigint;
  createdAt: Date;
  uploadedAt: Date;
  uploadedByUser: string;
  initialHash: string;
  hashAlgorithm: string;
  hashStatus: string;
  contentModified: boolean;
  renameOnly: boolean;
  lastModifiedAt: Date | null;
  modificationTool: string | null;
  sentExternally: boolean;
  sentVia: string | null;
  legalHold: boolean;
  logicalDeleted: boolean;
  logicalDeletedAt: Date | null;
  retentionExpiryDate: Date | null;
  auditStatus: string;
  uploadedBy?: { firstName: string; lastName: string; email: string };
}) {
  const base = mapDocument(d);
  return {
    ...base,
    uploadedBy: d.uploadedBy
      ? { name: `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`, email: d.uploadedBy.email }
      : null,
  };
}
