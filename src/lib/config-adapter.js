// lib/config-adapter.js
/**
 * This adapter ensures configuration is available in both ESM and CommonJS modules
 */

// Import the config from the original config.js file
import defaultConfig from './config.js';

/**
 * Get a specific configuration value
 * @param {string} key - Dot notation path to configuration value
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Configuration value
 */
export function getConfig(key, defaultValue = null) {
  if (!key) return defaultConfig;
  
  const parts = key.split('.');
  let value = defaultConfig;
  
  for (const part of parts) {
    if (value === undefined || value === null || typeof value !== 'object') {
      return defaultValue;
    }
    value = value[part];
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * Get a configuration subset
 * @param {string} path - Base path for configuration subset
 * @returns {object} Configuration subset
 */
export function getConfigSection(path) {
  return getConfig(path, {});
}

// Export the default config directly
export default defaultConfig;