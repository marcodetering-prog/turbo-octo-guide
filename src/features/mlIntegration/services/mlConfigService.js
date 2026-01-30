/**
 * ML Configuration Service
 * Manages ML feature settings, API keys, and provider configuration
 */

const STORAGE_KEY = 'tenant_analytics_ml_settings';

const DEFAULT_ML_SETTINGS = {
  enabled: false,
  sentiment: {
    enabled: false,
    provider: 'huggingface',
    apiKey: null,
    model: 'distilbert-base-uncased-finetuned-sst-2-english',
  },
  topicModeling: {
    enabled: false,
    method: 'huggingface',
    apiKey: null,
    numTopics: 5,
    candidateLabels: [
      'plumbing issues',
      'heating problems',
      'electrical issues',
      'appliance malfunction',
      'structural damage',
      'noise complaints',
      'pest control',
      'maintenance request',
      'emergency repair',
      'general inquiry',
    ],
  },
  contextEnhancement: {
    enabled: false,
    provider: 'openai',
    apiKey: null,
    model: 'text-embedding-3-small',
    clusteringMethod: 'kmeans',
    numClusters: 5,
  },
  predictiveAnalytics: {
    enabled: true,
    minPeriodsRequired: 3,
    smoothingAlpha: 0.3,
  },
};

/**
 * Get ML settings from localStorage
 * @returns {Object} ML settings
 */
export const getMLSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEY);
    return settings ? JSON.parse(settings) : getDefaultMLSettings();
  } catch (error) {
    console.warn('Error reading ML settings, using defaults:', error);
    return getDefaultMLSettings();
  }
};

/**
 * Get default ML settings
 * @returns {Object} Default settings
 */
export const getDefaultMLSettings = () => JSON.parse(JSON.stringify(DEFAULT_ML_SETTINGS));

/**
 * Save ML settings to localStorage
 * @param {Object} settings - ML settings object
 * @returns {Boolean} Success flag
 */
export const saveMLSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving ML settings:', error);
    return false;
  }
};

/**
 * Update specific ML feature settings
 * @param {String} feature - Feature name (sentiment, topicModeling, etc.)
 * @param {Object} config - Feature configuration
 * @returns {Boolean} Success flag
 */
export const updateMLFeature = (feature, config) => {
  try {
    const settings = getMLSettings();
    settings[feature] = { ...settings[feature], ...config };
    return saveMLSettings(settings);
  } catch (error) {
    console.error(`Error updating ${feature} settings:`, error);
    return false;
  }
};

/**
 * Test API connection for a specific ML feature
 * @param {String} feature - Feature name
 * @param {Object} config - Feature configuration with apiKey
 * @returns {Promise<{success: Boolean, error?: String}>}
 */
export const testMLConnection = async (feature, config) => {
  try {
    switch (feature) {
      case 'sentiment':
        await testHuggingFaceConnection(config.apiKey);
        break;
      case 'topicModeling':
        await testHuggingFaceConnection(config.apiKey);
        break;
      case 'contextEnhancement':
        await testOpenAIConnection(config.apiKey);
        break;
      case 'predictiveAnalytics':
        return { success: true }; // No API required
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Test Hugging Face API connection
 * @param {String} apiKey - Hugging Face API key
 * @throws {Error} If connection fails
 */
const testHuggingFaceConnection = async (apiKey) => {
  if (!apiKey) throw new Error('No API key provided');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'This is a test message.' }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }
};

/**
 * Test OpenAI API connection
 * @param {String} apiKey - OpenAI API key
 * @throws {Error} If connection fails
 */
const testOpenAIConnection = async (apiKey) => {
  if (!apiKey) throw new Error('No API key provided');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: 'test',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
};

/**
 * Reset ML settings to defaults
 * @returns {Boolean} Success flag
 */
export const resetMLSettings = () => {
  try {
    return saveMLSettings(getDefaultMLSettings());
  } catch (error) {
    console.error('Error resetting ML settings:', error);
    return false;
  }
};

/**
 * Check if a specific ML feature is fully configured and ready
 * @param {String} feature - Feature name
 * @returns {Boolean} True if feature is enabled and configured
 */
export const isMLFeatureReady = (feature) => {
  const settings = getMLSettings();

  if (!settings[feature] || !settings[feature].enabled) {
    return false;
  }

  // Predictive analytics requires no API key
  if (feature === 'predictiveAnalytics') {
    return true;
  }

  // Other features require API key
  return !!settings[feature].apiKey;
};

/**
 * Get enabled ML features
 * @returns {Array<String>} Array of enabled feature names
 */
export const getEnabledMLFeatures = () => {
  const settings = getMLSettings();
  const features = [];

  if (settings.enabled) {
    if (isMLFeatureReady('sentiment')) features.push('sentiment');
    if (isMLFeatureReady('topicModeling')) features.push('topicModeling');
    if (isMLFeatureReady('contextEnhancement')) features.push('contextEnhancement');
    if (isMLFeatureReady('predictiveAnalytics')) features.push('predictiveAnalytics');
  }

  return features;
};
