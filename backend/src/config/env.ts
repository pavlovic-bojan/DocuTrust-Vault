/**
 * Environment configuration. All env vars are validated at startup.
 */

const required = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, defaultValue: string): string => {
  return process.env[key] ?? defaultValue;
};

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4000'), 10),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  SESSION_SECRET: optional('SESSION_SECRET', 'session-secret-change-in-production'),
  UPLOAD_DIR: optional('UPLOAD_DIR', 'uploads'),
  DEV_AUTH_SECRET: optional('DEV_AUTH_SECRET', ''),
  BUG_REPORT_EMAIL: optional('BUG_REPORT_EMAIL', ''),
  SMTP_HOST: optional('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_SECURE: optional('SMTP_SECURE', 'false') === 'true',
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASS: optional('SMTP_PASS', ''),
} as const;
