import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as aiService from '../services/aiAnalyticsService';

export default function AISettingsPanel({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [envApiKey, setEnvApiKey] = useState(null);

  // Load API key from environment on mount
  useEffect(() => {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (openaiKey || claudeKey) {
      setEnvApiKey({
        openai: !!openaiKey,
        claude: !!claudeKey,
      });
    }
  }, []);

  const handleProviderChange = (provider) => {
    setTempSettings({
      ...tempSettings,
      provider,
    });
  };

  const handleToggleEnable = () => {
    setTempSettings({
      ...tempSettings,
      enabled: !tempSettings.enabled,
    });
  };

  const handleSave = () => {
    // Get API key from environment or localStorage
    let apiKey = null;
    if (tempSettings.provider === 'openai') {
      apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    } else if (tempSettings.provider === 'claude') {
      apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    }

    const updatedSettings = {
      ...tempSettings,
      apiKey: apiKey || tempSettings.apiKey,
    };

    onSettingsChange(updatedSettings);
    setIsOpen(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    let apiKey = null;
    if (tempSettings.provider === 'openai') {
      apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    } else if (tempSettings.provider === 'claude') {
      apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    }

    if (!tempSettings.provider || !apiKey) {
      setTestResult({
        success: false,
        message: `No API key found. Please set ${tempSettings.provider === 'openai' ? 'VITE_OPENAI_API_KEY' : 'VITE_CLAUDE_API_KEY'} environment variable on Railway.`,
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      await aiService.testAPIConnection(tempSettings.provider, apiKey);
      setTestResult({
        success: true,
        message: `✓ Connected to ${tempSettings.provider === 'openai' ? 'OpenAI' : 'Claude'} successfully!`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `✗ Connection failed: ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
      >
        <Settings size={18} />
        AI Settings
        {settings.enabled && settings.provider && (
          <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
            {settings.provider === 'openai' ? 'OpenAI' : 'Claude'} Enabled
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Settings size={20} className="text-blue-600" />
          AI Analysis Settings
        </h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setTestResult(null);
            setTempSettings(settings);
          }}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>AI-Enhanced Analysis:</strong> For CSV files with more than 7 days of data,
          each 7-day chunk is analyzed by AI to identify trends, anomalies, and provide
          recommendations. Results are compiled into a single comprehensive period.
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={tempSettings.enabled}
            onChange={handleToggleEnable}
            className="w-5 h-5 rounded accent-blue-600"
          />
          <span className="font-semibold text-gray-700">
            Enable AI-powered analysis for large files
          </span>
        </label>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">AI Provider</label>
        <div className="space-y-3">
          <label
            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            style={{ borderColor: tempSettings.provider === 'openai' ? '#3b82f6' : '#e5e7eb' }}
          >
            <input
              type="radio"
              name="provider"
              value="openai"
              checked={tempSettings.provider === 'openai'}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-4 h-4 accent-blue-600"
              disabled={!envApiKey?.openai}
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800">OpenAI (GPT-4)</div>
              <div className="text-xs text-gray-600">
                {envApiKey?.openai ? 'API key configured on Railway ✓' : 'No API key configured'}
              </div>
            </div>
          </label>

          <label
            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            style={{ borderColor: tempSettings.provider === 'claude' ? '#3b82f6' : '#e5e7eb' }}
          >
            <input
              type="radio"
              name="provider"
              value="claude"
              checked={tempSettings.provider === 'claude'}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-4 h-4 accent-blue-600"
              disabled={!envApiKey?.claude}
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Claude (Anthropic)</div>
              <div className="text-xs text-gray-600">
                {envApiKey?.claude ? 'API key configured on Railway ✓' : 'No API key configured'}
              </div>
            </div>
          </label>

          <label
            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            style={{ borderColor: tempSettings.provider === null ? '#3b82f6' : '#e5e7eb' }}
          >
            <input
              type="radio"
              name="provider"
              value=""
              checked={tempSettings.provider === null}
              onChange={() => handleProviderChange(null)}
              className="w-4 h-4 accent-blue-600"
            />
            <div>
              <div className="font-semibold text-gray-800">None</div>
              <div className="text-xs text-gray-600">Use standard analysis only (no AI)</div>
            </div>
          </label>
        </div>
      </div>

      {/* Environment Variable Info */}
      {tempSettings.provider && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ <strong>Railway Configuration:</strong> API key is loaded from environment variables
            (VITE_{tempSettings.provider === 'openai' ? 'OPENAI' : 'CLAUDE'}_API_KEY)
          </p>
        </div>
      )}

      {/* Test Connection */}
      {tempSettings.provider && tempSettings.apiKey && (
        <div className="mb-6">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition"
          >
            {testing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Settings size={18} />
                Test Connection
              </>
            )}
          </button>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            testResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.message}
          </p>
        </div>
      )}

      {/* Privacy Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Privacy Note:</strong> CSV data and analytics are sent to{' '}
          {tempSettings.provider === 'openai'
            ? 'OpenAI'
            : tempSettings.provider === 'claude'
              ? 'Anthropic'
              : 'the selected AI'}{' '}
          servers for analysis. Only enable this if you&apos;re comfortable sharing your data with
          third-party AI providers.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Save Settings
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            setTestResult(null);
            setTempSettings(settings);
          }}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
