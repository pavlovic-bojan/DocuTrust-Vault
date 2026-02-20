/**
 * k6 Configuration Module for DocuTrust Vault
 * Handles environment-specific configuration and constants
 */

/**
 * Get environment configuration from environment variables
 * @returns {Object} Configuration object with baseUrl, authToken, etc.
 */
export function getConfig() {
  const baseUrl = __ENV.BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'BASE_URL environment variable is required. ' +
        'Example: BASE_URL=http://localhost:4000'
    );
  }

  const url = baseUrl.replace(/\/+$/, '');
  const authToken = __ENV.AUTH_TOKEN;

  return {
    baseUrl: url,
    authToken: authToken || null,
    endpoints: {
      health: '/health',
      login: '/api/v1/auth/login',
      me: '/api/v1/auth/me',
      users: '/api/v1/users',
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Get thresholds configuration based on test type (minimum for CI)
 * @param {string} testType - Type of test (smoke, baseline, load, etc.)
 * @returns {Object} k6 thresholds object
 */
export function getThresholds(testType) {
  const baseThresholds = {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90'],
  };

  switch (testType) {
    case 'smoke':
      return {
        ...baseThresholds,
        http_req_duration: ['p(95)<3000', 'p(99)<8000'],
        http_req_failed: ['rate<0.05'],
      };
    case 'baseline':
    case 'load':
    case 'stress':
    case 'spike':
    case 'breakpoint':
    case 'soak':
      return baseThresholds;
    default:
      return baseThresholds;
  }
}
