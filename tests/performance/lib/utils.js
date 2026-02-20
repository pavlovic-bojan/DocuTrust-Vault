/**
 * Utility Functions Module
 * Common helper functions for k6 tests
 */

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random item from an array
 * @param {Array} array - Array to select from
 * @returns {*} Random item from array
 */
export function randomItem(array) {
    if (!array || array.length === 0) {
        return null;
    }
    return array[randomInt(0, array.length - 1)];
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Validate response structure
 * @param {Object} response - k6 HTTP response
 * @param {Object} schema - Expected schema (basic validation)
 * @returns {boolean} True if valid
 */
export function validateResponse(response, schema) {
    if (!response || response.status !== 200) {
        return false;
    }
    
    try {
        const data = JSON.parse(response.body);
        
        // Basic schema validation
        for (const key in schema) {
            if (!(key in data)) {
                return false;
            }
            if (schema[key] === 'array' && !Array.isArray(data[key])) {
                return false;
            }
            if (schema[key] === 'object' && typeof data[key] !== 'object') {
                return false;
            }
        }
        
        return true;
    } catch {
        return false;
    }
}

/**
 * Log test information (only in non-CI environments)
 * @param {string} message - Message to log
 */
export function logInfo(message) {
    if (!__ENV.CI) {
        console.log(`[INFO] ${message}`);
    }
}

/**
 * Calculate percentile from array of values
 * @param {Array<number>} values - Array of numeric values
 * @param {number} percentile - Percentile (0-100)
 * @returns {number} Percentile value
 */
export function calculatePercentile(values, percentile) {
    if (!values || values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}
