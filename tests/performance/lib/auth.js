/**
 * Authentication Module for k6 - DocuTrust Vault
 * Handles JWT Bearer authentication for DocuTrust APIs
 */

import { getConfig } from './config.js';

/**
 * Get authentication headers (if token available)
 * @returns {Object} Headers object with optional Authorization
 */
export function getAuthHeaders() {
  const config = getConfig();
  const headers = { ...config.headers };
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }
  return headers;
}

/**
 * Get request params for API calls (with optional auth)
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Request params with headers
 */
export function getRequestParams(additionalHeaders = {}) {
  return {
    headers: {
      ...getAuthHeaders(),
      ...additionalHeaders,
    },
    tags: { name: 'DocuTrust_API' },
  };
}
