/**
 * k6 HTML Report - uses benc-uk/k6-reporter
 * Output: k6-report/index.html (for GitHub Pages deploy)
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/3.0.1/dist/bundle.js';

export function handleSummary(data) {
  return {
    'k6-report/index.html': htmlReport(data, {
      title: `SMS Load Test ${new Date().toISOString().slice(0, 10)}`,
    }),
  };
}
