/**
 * User routes – DocuTrust Vault (Admin only)
 * GET /users – list all users in company
 * POST /users – create user
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import * as userController from './user.controller.js';

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res, next) =>
  userController.listUsers(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['ADMIN', 'USER']),
    body('preferredLanguage').optional().isIn(['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR']),
  ],
  validateRequest,
  (req, res, next) =>
    userController.createUser(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.patch(
  '/:userId',
  authenticate,
  requireAdmin,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().trim().isEmail(),
    body('role').optional().isIn(['ADMIN', 'USER']),
    body('status').optional().isIn(['ACTIVE', 'SUSPENDED', 'DELETED']),
    body('preferredLanguage').optional().isIn(['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR']),
    body('password').optional().trim().isLength({ min: 8 }),
  ],
  validateRequest,
  (req, res, next) =>
    userController.updateUser(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

router.delete('/:userId', authenticate, requireAdmin, (req, res, next) =>
  userController.deleteUser(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

export default router;
