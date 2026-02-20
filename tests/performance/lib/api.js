/**
 * API Request Module for k6 - DocuTrust Vault
 * Contains reusable API request functions for DocuTrust endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { getConfig } from './config.js';
import { getRequestParams } from './auth.js';

/**
 * GET /health - no auth required
 * @returns {Object} Response object
 */
export function getHealth() {
  const config = getConfig();
  const url = `${config.baseUrl}${config.endpoints.health}`;

  const response = http.get(url, {
    headers: config.headers,
    tags: { endpoint: 'health', method: 'GET' },
  });

  check(response, {
    'health - status is 200': (r) => r.status === 200,
    'health - response time < 2s': (r) => r.timings.duration < 2000,
    'health - has status ok': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && data.status === 'ok';
      } catch {
        return false;
      }
    },
  });

  return response;
}

/**
 * POST /api/v1/auth/login - get JWT
 * @param {string} email
 * @param {string} password
 * @returns {{ token?: string }} Login response with token
 */
export function login(email, password) {
  const config = getConfig();
  const url = `${config.baseUrl}${config.endpoints.login}`;
  const body = JSON.stringify({ email, password });
  const response = http.post(url, body, {
    headers: config.headers,
    tags: { endpoint: 'auth/login', method: 'POST' },
  });
  if (response.status !== 200) return {};
  try {
    const data = JSON.parse(response.body);
    return { token: data.token };
  } catch {
    return {};
  }
}

/**
 * GET /api/v1/auth/me - requires JWT
 * @returns {Object} Response object or null if no token
 */
export function getMe() {
  const config = getConfig();
  if (!config.authToken) return null;

  const url = `${config.baseUrl}${config.endpoints.me}`;
  const params = getRequestParams();

  const response = http.get(url, {
    ...params,
    tags: { ...params.tags, endpoint: 'auth/me', method: 'GET' },
  });

  check(response, {
    'auth/me - status is 200': (r) => r.status === 200,
    'auth/me - response time < 3s': (r) => r.timings.duration < 3000,
    'auth/me - has user id': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && typeof (data.userId || data.id) === 'string';
      } catch {
        return false;
      }
    },
  });

  return response;
}

/**
 * GET /api/v1/users - requires Admin JWT
 * @returns {Object} Response object or null if no token
 */
export function getUsers() {
  const config = getConfig();
  if (!config.authToken) return null;

  const url = `${config.baseUrl}${config.endpoints.users}`;
  const params = getRequestParams();

  const response = http.get(url, {
    ...params,
    tags: { ...params.tags, endpoint: 'users', method: 'GET' },
  });

  check(response, {
    'users - status 200 or 403': (r) => r.status === 200 || r.status === 403,
    'users - response time < 3s': (r) => r.timings.duration < 3000,
  });

  return response;
}

/**
 * Simulate user think time
 */
export function thinkTime(min = 0.5, max = 1.5) {
  sleep(Math.random() * (max - min) + min);
}
