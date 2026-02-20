/**
 * Report Bug routes – authenticated users can submit bug reports
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.js';
import * as reportBugController from './report-bug.controller.js';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  (req, res, next) => reportBugController.submit(req as import('../../middleware/auth.js').AuthRequest, res).catch(next)
);

export default router;
