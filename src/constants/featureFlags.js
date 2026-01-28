/**
 * Feature Flags Configuration
 * Control which features are enabled/disabled in the application
 *
 * Can be controlled via:
 * 1. Environment variables (VITE_FEATURE_*)
 * 2. localStorage (override env vars at runtime)
 */

const parseEnvBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
};

// Get feature flag value from env var or default
const getFeatureFlag = (featureName, defaultValue = true) => {
  // Check localStorage first (allows runtime override)
  const storageKey = `feature_${featureName}`;
  const stored = localStorage.getItem(storageKey);
  if (stored !== null) {
    return parseEnvBoolean(stored);
  }

  // Fall back to environment variable
  const envKey = `VITE_FEATURE_${featureName.toUpperCase()}`;
  const envValue = import.meta.env[envKey];
  if (envValue !== undefined) {
    return parseEnvBoolean(envValue);
  }

  return defaultValue;
};

// Feature flags definition
export const FEATURE_FLAGS = {
  // Core Features
  CLIENT_MANAGEMENT: getFeatureFlag('CLIENT_MANAGEMENT', true),
  CSV_UPLOAD: getFeatureFlag('CSV_UPLOAD', true),
  PERIOD_MANAGEMENT: getFeatureFlag('PERIOD_MANAGEMENT', true),

  // Analytics Features
  ANALYTICS_DASHBOARD: getFeatureFlag('ANALYTICS_DASHBOARD', true),
  TREND_ANALYSIS: getFeatureFlag('TREND_ANALYSIS', true),

  // AI Features
  AI_INTEGRATION: getFeatureFlag('AI_INTEGRATION', true),
  AI_SETTINGS_PANEL: getFeatureFlag('AI_SETTINGS_PANEL', true),
  AI_CHUNKING: getFeatureFlag('AI_CHUNKING', true),
};

/**
 * Toggle a feature flag at runtime
 * @param {string} featureName - Feature name
 * @param {boolean} enabled - Enable or disable
 */
export const setFeatureFlag = (featureName, enabled) => {
  const storageKey = `feature_${featureName}`;
  localStorage.setItem(storageKey, String(enabled));
};

/**
 * Reset all feature flags to default (remove from localStorage)
 */
export const resetFeatureFlags = () => {
  Object.keys(FEATURE_FLAGS).forEach(feature => {
    localStorage.removeItem(`feature_${feature}`);
  });
};

/**
 * Get all feature flags status (for debugging)
 */
export const getAllFeatureFlags = () => {
  return { ...FEATURE_FLAGS };
};

export default FEATURE_FLAGS;
