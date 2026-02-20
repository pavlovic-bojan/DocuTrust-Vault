import i18n from './index';
import { ERROR_CODE_TO_KEY } from './errorCodes';

/**
 * Translates API error message using backend error code when available.
 * Falls back to translated generic message if no match.
 */
export function translateApiError(err: unknown, fallbackKey = 'errors.generic'): string {
  const axiosErr = err as { response?: { data?: { message?: string; code?: string }; status?: number }; message?: string };
  const code = axiosErr?.response?.data?.code;
  const key = code && ERROR_CODE_TO_KEY[code] ? ERROR_CODE_TO_KEY[code] : fallbackKey;
  const translated = i18n.t(key);
  if (translated === key) return axiosErr?.response?.data?.message ?? i18n.t('errors.generic');
  return translated;
}
