/**
 * Breakpoint Test - DocuTrust Vault
 * Minimal ramp: 2 -> 4 VUs, ~1.5 min
 */

import { check } from 'k6';
import { getConfig, getThresholds } from '../lib/config.js';
export { handleSummary } from '../lib/summary.js';
import { getHealth, getMe, thinkTime } from '../lib/api.js';
import { getScenarioConfig, getScenarioName } from '../lib/scenarios.js';

const testType = 'breakpoint';
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
  check(healthRes, { 'breakpoint - health 200': (r) => r.status === 200 });
  thinkTime(0.3, 0.8);
  if (config.authToken) {
    const meRes = getMe();
    check(meRes, { 'breakpoint - auth/me ok': (r) => r && r.status >= 200 && r.status < 500 });
  }
}

export function setup() {
  console.log(`[BREAKPOINT] Starting: ${config.baseUrl}`);
  return {};
}

export function teardown() {
  console.log(`[BREAKPOINT] Completed`);
}
