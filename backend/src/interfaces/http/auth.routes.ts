/**
 * Auth routes – DocuTrust Vault
 * Per docs/OpenAPI.yaml: POST /auth/login, POST /auth/logout, GET /auth/me, PATCH /auth/me
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, type AuthRequest } from '../../middleware/auth.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
  ],
  (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) =>
    authController.login(req as AuthRequest, res).catch(next)
);

router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) =>
    authController.forgotPassword(req as AuthRequest, res).catch(next)
);

router.post('/logout', authenticate, (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) =>
  authController.logout(req as AuthRequest, res).catch(next)
);

router.get('/me', authenticate, (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) =>
  authController.getMe(req as AuthRequest, res).catch(next)
);

router.patch(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().trim().isEmail().withMessage('Valid email is required'),
    body('preferredLanguage').optional().isIn(['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR']),
  ],
  (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) =>
    authController.updateMe(req as AuthRequest, res).catch(next)
);

export default router;
