/**
 * Report Bug controller – sends bug report email to admin
 */
import type { Response } from 'express';
import { validationResult } from 'express-validator';
import type { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { sendBugReport } from '../../infrastructure/email.js';

export async function submit(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const bugReportEmail = env.BUG_REPORT_EMAIL?.trim();
  if (!bugReportEmail) {
    throw new ApiError('Bug report feature is not configured. Contact administrator.', 503, 'FEATURE_DISABLED');
  }

  if (!req.user) throw new ApiError('Unauthorized', 401);

  const { subject, description } = req.body as { subject: string; description: string };
  const fromUser = `${req.user.firstName} ${req.user.lastName} (${req.user.email})`;

  const sent = await sendBugReport({
    to: bugReportEmail,
    fromUser,
    subject,
    description,
  });

  if (!sent) {
    throw new ApiError('Failed to send bug report. Please try again later.', 503, 'SEND_FAILED');
  }

  res.status(200).json({ ok: true, message: 'Bug report sent successfully.' });
}
