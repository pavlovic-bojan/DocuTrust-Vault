/**
 * Scenario Configuration Module - DocuTrust Vault
 * Minimum load configurations for CI and quick validation
 */

/**
 * Get scenario configuration based on test type (minimum for CI)
 * @param {string} testType - Type of test
 * @param {Object} customOptions - Custom options to override defaults
 * @returns {Object} k6 scenario configuration
 */
export function getScenarioConfig(testType, customOptions = {}) {
  const defaultScenarios = {
    smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '1m',
    },
    baseline: {
      executor: 'constant-vus',
      vus: 2,
      duration: '1m',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '1m', target: 2 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '1m', target: 4 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 2 },
        { duration: '15s', target: 4 },
        { duration: '15s', target: 2 },
      ],
      gracefulRampDown: '10s',
    },
    breakpoint: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '30s', target: 4 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    soak: {
      executor: 'constant-arrival-rate',
      rate: 2,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 2,
      maxVUs: 4,
    },
  };

  const scenario = defaultScenarios[testType] || defaultScenarios.smoke;
  return { ...scenario, ...customOptions };
}

/**
 * Get scenario name for tagging
 */
export function getScenarioName(testType) {
  return `doctrust_${testType}_test`;
}
