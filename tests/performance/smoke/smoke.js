/**
 * Smoke Test - DocuTrust Vault
 * Validates basic system stability under minimal load.
 * - Health check (no auth)
 * - Optional: auth/me if AUTH_TOKEN set
 * 1 VU, 3 iterations, ~1 min
 */

import { check } from 'k6';
import { getConfig, getThresholds } from '../lib/config.js';
export { handleSummary } from '../lib/summary.js';
import { getHealth, getMe, thinkTime } from '../lib/api.js';
import { getScenarioConfig, getScenarioName } from '../lib/scenarios.js';

const testType = 'smoke';
const config = getConfig();
const thresholds = getThresholds(testType);

export const options = {
  scenarios: {
    [getScenarioName(testType)]: getScenarioConfig(testType, {
      vus: parseInt(__ENV.VUS) || 1,
      iterations: parseInt(__ENV.ITERATIONS) || 3,
    }),
  },
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

export default function () {
  // 1. Health check (always)
  const healthRes = getHealth();
  check(healthRes, {
    'smoke - health accessible': (r) => r.status === 200,
    'smoke - health response time < 2s': (r) => r.timings.duration < 2000,
  });

  thinkTime(0.3, 0.8);

  // 2. Auth/me if token available
  if (config.authToken) {
    const meRes = getMe();
    check(meRes, {
      'smoke - auth/me accessible': (r) => r && r.status === 200,
    });
  }
}

export function setup() {
  console.log(`[SMOKE] Starting against: ${config.baseUrl}`);
  return {};
}

export function teardown() {
  console.log(`[SMOKE] Completed`);
}
