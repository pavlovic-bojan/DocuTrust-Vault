import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateApiError } from './translateApiError';

vi.mock('./index', () => ({
  default: {
    t: vi.fn((key: string) => {
      const map: Record<string, string> = {
        'errors.invalidCredentials': 'Invalid credentials',
        'errors.generic': 'Something went wrong',
        'login.invalidCredentials': 'Invalid login',
      };
      return map[key] ?? key;
    }),
  },
}));

describe('translateApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns translated message when code matches', () => {
    const err = { response: { data: { code: 'INVALID_CREDENTIALS' } } };
    expect(translateApiError(err, 'login.invalidCredentials')).toBe('Invalid credentials');
  });

  it('uses fallback when code has no translation', () => {
    const err = { response: { data: { code: 'UNKNOWN_CODE' } } };
    expect(translateApiError(err, 'login.invalidCredentials')).toBe('Invalid login');
  });

  it('returns response message when translation equals key (missing)', () => {
    const err = { response: { data: { code: 'UNKNOWN', message: 'Custom error msg' } } };
    // fallbackKey not in mock map → i18n.t returns key, so we use response.message
    expect(translateApiError(err, 'missing.key')).toBe('Custom error msg');
  });

  it('returns generic when no response', () => {
    const err = new Error('Network error');
    expect(translateApiError(err)).toBe('Something went wrong');
  });

  it('handles null/undefined err', () => {
    expect(translateApiError(null)).toBe('Something went wrong');
  });
});
