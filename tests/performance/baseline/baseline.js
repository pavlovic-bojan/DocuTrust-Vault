/**
 * Baseline Test - DocuTrust Vault
 * Minimal load: 2 VUs, 1 min
 */

import { check } from 'k6';
import { getConfig, getThresholds } from '../lib/config.js';
export { handleSummary } from '../lib/summary.js';
import { getHealth, getMe, thinkTime } from '../lib/api.js';
import { getScenarioConfig, getScenarioName } from '../lib/scenarios.js';

const testType = 'baseline';
const config = getConfig();
const thresholds = getThresholds(testType);

export const options = {
  scenarios: {
    [getScenarioName(testType)]: getScenarioConfig(testType, {
      vus: parseInt(__ENV.VUS) || 2,
      duration: __ENV.DURATION || '1m',
    }),
  },
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

export default function () {
  const healthRes = getHealth();
  check(healthRes, { 'baseline - health 200': (r) => r.status === 200 });

  thinkTime(0.5, 1);

  if (config.authToken) {
    const meRes = getMe();
    check(meRes, { 'baseline - auth/me 200': (r) => r && r.status === 200 });
  }
}

export function setup() {
  console.log(`[BASELINE] Starting: ${config.baseUrl}, VUs: 2, 1m`);
  return {};
}

export function teardown() {
  console.log(`[BASELINE] Completed`);
}
