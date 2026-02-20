/**
 * Document routes – DocuTrust Vault
 * Per docs/OpenAPI.yaml
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.js';
import { uploadSingle } from '../../infrastructure/multer.js';
import * as documentController from './document.controller.js';

const router = Router();

router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    uploadSingle(req, res, (err) => {
      if (err) next(err);
      else next();
    });
  },
  (req, res, next) => documentController.upload(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.get('/', authenticate, (req: Request, res: Response, next: NextFunction) =>
  documentController.list(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.get('/:documentId/download', authenticate, (req: Request, res: Response, next: NextFunction) =>
  documentController.download(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.get('/:documentId', authenticate, (req: Request, res: Response, next: NextFunction) =>
  documentController.getById(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.post(
  '/:documentId/send',
  authenticate,
  [
    body('channel').isIn(['EMAIL', 'VIBER']).withMessage('channel must be EMAIL or VIBER'),
    body('recipient').trim().notEmpty().withMessage('recipient is required'),
  ],
  (req: Request, res: Response, next: NextFunction) => documentController.send(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.delete('/:documentId', authenticate, (req: Request, res: Response, next: NextFunction) =>
  documentController.remove(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.get('/:documentId/audit', authenticate, (req: Request, res: Response, next: NextFunction) =>
  documentController.getAudit(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

export default router;
