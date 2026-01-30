import React, { useState } from 'react';
import { Settings, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  getMLSettings,
  saveMLSettings,
  testMLConnection,
  getDefaultMLSettings,
} from '../services/mlConfigService';

export default function MLSettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(getMLSettings());
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});
  const [showApiKeys, setShowApiKeys] = useState({});

  const handleFeatureToggle = (feature) => {
    setSettings({
      ...settings,
      [feature]: {
        ...settings[feature],
        enabled: !settings[feature].enabled,
      },
    });
  };

  const handleApiKeyChange = (feature, apiKey) => {
    setSettings({
      ...settings,
      [feature]: {
        ...settings[feature],
        apiKey,
      },
    });
  };

  const handleTestConnection = async (feature) => {
    setTesting({ ...testing, [feature]: true });
    const result = await testMLConnection(feature, settings[feature]);
    setTestResults({ ...testResults, [feature]: result });
    setTesting({ ...testing, [feature]: false });
  };

  const handleSave = () => {
    const success = saveMLSettings(settings);
    if (success) {
      alert('ML settings saved successfully!');
      setIsOpen(false);
    } else {
      alert('Failed to save ML settings');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all ML settings to defaults?')) {
      setSettings(getDefaultMLSettings());
    }
  };

  const toggleShowApiKey = (feature) => {
    setShowApiKeys({
      ...showApiKeys,
      [feature]: !showApiKeys[feature],
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
        title="ML Settings (AI enhancement features)"
      >
        <Settings className="w-5 h-5" />
        ML Settings
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-2xl font-bold">ML Integration Settings</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl hover:bg-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Master Toggle */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className="w-6 h-6 rounded accent-purple-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Enable ML Features</p>
                <p className="text-sm text-gray-600">
                  Master switch for all machine learning enhancements
                </p>
              </div>
            </label>
          </div>

          {settings.enabled && (
            <>
              {/* Sentiment Analysis */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Sentiment Analysis</h3>
                    <p className="text-sm text-gray-600">
                      Analyzes customer emotion (positive/negative/neutral) to improve satisfaction metrics
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sentiment?.enabled}
                      onChange={() => handleFeatureToggle('sentiment')}
                      className="w-5 h-5 rounded accent-purple-600"
                    />
                    <span className="text-sm font-semibold">Enable</span>
                  </label>
                </div>

                {settings.sentiment?.enabled && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hugging Face API Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys.sentiment ? 'text' : 'password'}
                          placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
                          value={settings.sentiment?.apiKey || ''}
                          onChange={(e) =>
                            handleApiKeyChange('sentiment', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <button
                          onClick={() => toggleShowApiKey('sentiment')}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {showApiKeys.sentiment ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestConnection('sentiment')}
                      disabled={testing.sentiment || !settings.sentiment?.apiKey}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-semibold"
                    >
                      {testing.sentiment ? 'Testing...' : 'Test Connection'}
                    </button>

                    {testResults.sentiment && (
                      <div
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          testResults.sentiment.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {testResults.sentiment.success ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span className="text-sm">
                          {testResults.sentiment.success
                            ? '✓ Connection successful'
                            : `✗ ${testResults.sentiment.error}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Topic Modeling */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Topic Modeling</h3>
                    <p className="text-sm text-gray-600">
                      Automatically categorizes inquiries and identifies emerging issues
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.topicModeling?.enabled}
                      onChange={() => handleFeatureToggle('topicModeling')}
                      className="w-5 h-5 rounded accent-purple-600"
                    />
                    <span className="text-sm font-semibold">Enable</span>
                  </label>
                </div>

                {settings.topicModeling?.enabled && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hugging Face API Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys.topicModeling ? 'text' : 'password'}
                          placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
                          value={settings.topicModeling?.apiKey || ''}
                          onChange={(e) =>
                            handleApiKeyChange('topicModeling', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <button
                          onClick={() => toggleShowApiKey('topicModeling')}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {showApiKeys.topicModeling ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestConnection('topicModeling')}
                      disabled={testing.topicModeling || !settings.topicModeling?.apiKey}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-semibold"
                    >
                      {testing.topicModeling ? 'Testing...' : 'Test Connection'}
                    </button>

                    {testResults.topicModeling && (
                      <div
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          testResults.topicModeling.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {testResults.topicModeling.success ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span className="text-sm">
                          {testResults.topicModeling.success
                            ? '✓ Connection successful'
                            : `✗ ${testResults.topicModeling.error}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Context Enhancement */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Context Enhancement (BERT/GPT-4)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Semantic understanding through OpenAI embeddings for better context awareness
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.contextEnhancement?.enabled}
                      onChange={() => handleFeatureToggle('contextEnhancement')}
                      className="w-5 h-5 rounded accent-purple-600"
                    />
                    <span className="text-sm font-semibold">Enable</span>
                  </label>
                </div>

                {settings.contextEnhancement?.enabled && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        OpenAI API Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys.contextEnhancement ? 'text' : 'password'}
                          placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                          value={settings.contextEnhancement?.apiKey || ''}
                          onChange={(e) =>
                            handleApiKeyChange('contextEnhancement', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <button
                          onClick={() => toggleShowApiKey('contextEnhancement')}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {showApiKeys.contextEnhancement ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestConnection('contextEnhancement')}
                      disabled={testing.contextEnhancement || !settings.contextEnhancement?.apiKey}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-semibold"
                    >
                      {testing.contextEnhancement ? 'Testing...' : 'Test Connection'}
                    </button>

                    {testResults.contextEnhancement && (
                      <div
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          testResults.contextEnhancement.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {testResults.contextEnhancement.success ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span className="text-sm">
                          {testResults.contextEnhancement.success
                            ? '✓ Connection successful'
                            : `✗ ${testResults.contextEnhancement.error}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Predictive Analytics */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Predictive Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Forecasts future KPI trends using time-series analysis (no API key required)
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.predictiveAnalytics?.enabled}
                      onChange={() => handleFeatureToggle('predictiveAnalytics')}
                      className="w-5 h-5 rounded accent-purple-600"
                    />
                    <span className="text-sm font-semibold">Enable</span>
                  </label>
                </div>

                {settings.predictiveAnalytics?.enabled && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">
                        ✓ Ready to use (requires 3+ historical periods)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> ML features work best when enabled alongside AI analysis.
                  Sentiment Analysis + AI provides the highest accuracy improvement (10-20%). Start with
                  Sentiment Analysis for best results.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Reset Defaults
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
