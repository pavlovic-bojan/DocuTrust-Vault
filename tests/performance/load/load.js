/**
 * Load Test - DocuTrust Vault
 * Minimal ramp: 0 -> 2 VUs, ~2 min total
 */

import { check } from 'k6';
import { getConfig, getThresholds } from '../lib/config.js';
export { handleSummary } from '../lib/summary.js';
import { getHealth, getMe, thinkTime } from '../lib/api.js';
import { getScenarioConfig, getScenarioName } from '../lib/scenarios.js';

const testType = 'load';
const config = getConfig();
const thresholds = getThresholds(testType);

export const options = {
  scenarios: {
    [getScenarioName(testType)]: getScenarioConfig(testType),
  },
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

export default function () {
  const healthRes = getHealth();
  check(healthRes, { 'load - health 200': (r) => r.status === 200 });
  thinkTime(0.5, 1);
  if (config.authToken) {
    const meRes = getMe();
    check(meRes, { 'load - auth/me 200': (r) => r && r.status === 200 });
  }
}

export function setup() {
  console.log(`[LOAD] Starting: ${config.baseUrl}`);
  return {};
}

export function teardown() {
  console.log(`[LOAD] Completed`);
}
