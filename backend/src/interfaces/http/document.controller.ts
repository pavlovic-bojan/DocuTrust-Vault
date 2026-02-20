/**
 * Document controller – DocuTrust Vault
 */
import type { Response } from 'express';
import path from 'path';
import type { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import * as documentService from '../../usecases/document.service.js';

export async function upload(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const file = req.file;
  if (!file) {
    throw new ApiError('No file provided', 400, 'MISSING_FILE');
  }
  const creationTool = (req.body?.creationTool as string) || undefined;
  const result = await documentService.uploadDocument(
    req.user.companyId,
    req.user.id,
    file,
    creationTool
  );
  res.status(201).json({
    document: result,
    message: 'Document uploaded successfully. Hash validated.',
  });
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const logicalDeleted = req.query.logicalDeleted === 'true';
  const hashStatus = typeof req.query.hashStatus === 'string' ? req.query.hashStatus : undefined;
  const docs = await documentService.listDocuments(
    req.user.companyId,
    req.user.id,
    req.user.role,
    { logicalDeleted, hashStatus }
  );
  res.json(docs);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const documentId = req.params.documentId;
  if (!documentId) throw new ApiError('Document ID required', 400);
  const doc = await documentService.getDocument(
    documentId,
    req.user.companyId,
    req.user.id,
    req.user.role
  );
  res.json(doc);
}

export async function download(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const documentId = req.params.documentId;
  if (!documentId) throw new ApiError('Document ID required', 400);
  const { path: filePath, fileName } = await documentService.downloadDocument(
    documentId,
    req.user.companyId,
    req.user.id,
    req.user.role
  );
  res.sendFile(path.resolve(filePath), { headers: { 'Content-Disposition': `attachment; filename="${fileName}"` } });
}

export async function send(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const documentId = req.params.documentId;
  const { channel, recipient } = req.body as { channel: string; recipient: string };
  if (!documentId || !channel || !recipient) {
    throw new ApiError('documentId, channel, recipient required', 400);
  }
  if (!['EMAIL', 'VIBER'].includes(channel)) {
    throw new ApiError('Invalid channel. Allowed: EMAIL, VIBER', 400);
  }
  const result = await documentService.sendDocument(
    documentId,
    req.user.companyId,
    req.user.id,
    req.user.role,
    channel as 'EMAIL' | 'VIBER',
    recipient
  );
  res.json(result);
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const documentId = req.params.documentId;
  if (!documentId) throw new ApiError('Document ID required', 400);
  await documentService.deleteDocument(
    documentId,
    req.user.companyId,
    req.user.id,
    req.user.role
  );
  res.status(204).send();
}

export async function getAudit(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const documentId = req.params.documentId;
  if (!documentId) throw new ApiError('Document ID required', 400);
  const logs = await documentService.getAuditTrail(
    documentId,
    req.user.companyId,
    req.user.id,
    req.user.role
  );
  res.json(logs);
}
