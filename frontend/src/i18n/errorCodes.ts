/**
 * Maps backend error codes to i18n keys. Use translateApiError() to get a localized message.
 */
export const ERROR_CODE_TO_KEY: Record<string, string> = {
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  ACCOUNT_DISABLED: 'errors.accountDisabled',
  COMPANY_INACTIVE: 'errors.companyInactive',
  EMAIL_EXISTS: 'errors.emailExists',
  FEATURE_DISABLED: 'errors.featureDisabled',
  SEND_FAILED: 'errors.sendFailed',
  NOT_FOUND: 'errors.notFound',
  FORBIDDEN: 'errors.forbidden',
  VALIDATION_ERROR: 'errors.validationError',
  UNAUTHORIZED: 'errors.unauthorized',
  MISSING_FILE: 'errors.missingFile',
  INVALID_FILE_TYPE: 'errors.invalidFileType',
  INVALID_CHANNEL: 'errors.invalidChannel',
};
