/**
 * Email service – sends emails via SMTP
 * Uses BUG_REPORT_EMAIL and SMTP_* from env
 */
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendBugReport(params: {
  to: string;
  fromUser: string;
  subject: string;
  description: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.log('[email] SMTP not configured – bug report (set BUG_REPORT_EMAIL + SMTP_* in .env):', {
      to: params.to,
      fromUser: params.fromUser,
      subject: params.subject,
      description: params.description,
    });
    return true;
  }
  await transport.sendMail({
    from: env.SMTP_USER,
    to: params.to,
    subject: `[DocuTrust Bug] ${params.subject}`,
    text: `Bug report from ${params.fromUser}\n\nSubject: ${params.subject}\n\nDescription:\n${params.description}`,
    html: `
      <h2>Bug Report</h2>
      <p><strong>From:</strong> ${params.fromUser}</p>
      <p><strong>Subject:</strong> ${params.subject}</p>
      <h3>Description</h3>
      <pre>${params.description.replace(/</g, '&lt;')}</pre>
    `,
  });
  return true;
}
