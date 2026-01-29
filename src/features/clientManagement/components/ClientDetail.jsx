import React, { useState } from 'react';
import { Upload, ArrowLeft, AlertCircle, Loader2, Calendar, TrendingUp, BarChart3, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { suggestPeriodGrouping, generatePeriodsForType, groupDataByPeriods } from '../../../services/autoPeriodDetection';
import * as chunkingService from '../../../features/aiIntegration/services/chunkingService';
import * as aiAnalyticsService from '../../../features/aiIntegration/services/aiAnalyticsService';
import AISettingsPanel from '../../aiIntegration/components/AISettingsPanel';
import * as storage from '../../../services/storage';
import FEATURE_FLAGS from '../../../constants/featureFlags';

export default function ClientDetail({ client, onBack, onUpdateClient, onSelectPeriod, aiSettings: initialAISettings }) {
  const [loading, setLoading] = useState(false);
  const [uploadedCSV, setUploadedCSV] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState(null);
  const [aiSettings, setAISettings] = useState(initialAISettings || storage.getAISettings());

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Check for duplicates
          const isDuplicate = checkForDuplicate(results.data);
          if (isDuplicate) {
            setError('This data appears to already be in your client records.');
            setLoading(false);
            return;
          }

          // Check if file needs chunking
          const needsChunk = chunkingService.needsChunking(results.data);

          if (needsChunk && FEATURE_FLAGS.AI_CHUNKING && aiSettings?.enabled && aiSettings?.provider && aiSettings?.apiKey) {
            // Process with AI-enhanced chunking
            await processLargeFileWithChunking(results.data, file.name);
          } else {
            // Normal flow
            processRegularFile(results.data, file.name);
          }
        } catch (err) {
          setError(`Error processing file: ${err.message}`);
          setLoading(false);
        }
      },
      error: (error) => {
        setError(`Error reading CSV file: ${error.message}`);
        setLoading(false);
      }
    });
  };

  const checkForDuplicate = (csvData) => {
    if (!csvData || csvData.length === 0) return false;
    if (!client.periods || client.periods.length === 0) return false;

    // Get date range from CSV
    const csvRange = chunkingService.getDateRangeFromCSV(csvData);
    if (!csvRange) return false;

    // Check if any existing period overlaps significantly with new data
    for (const period of client.periods) {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      const csvStart = new Date(csvRange.minDate);
      const csvEnd = new Date(csvRange.maxDate);

      // Check for overlap
      if (csvStart <= periodEnd && csvEnd >= periodStart) {
        // Check if inquiry counts are similar (within 10%)
        const csvInquiries = csvData.length;
        const periodInquiries = period.inquiryCount || 0;
        const percentDiff = Math.abs((csvInquiries - periodInquiries) / periodInquiries) * 100;

        if (percentDiff < 10) {
          return true; // Likely duplicate
        }
      }
    }

    return false;
  };

  const processRegularFile = (csvData, fileName) => {
    // Get auto-period suggestion
    const suggestion = suggestPeriodGrouping(csvData);
    const groupingType = suggestion.recommendation;

    // Generate actual period objects from grouping type
    const periods = generatePeriodsForType(csvData, groupingType);

    // Group data by selected period type
    const groupedData = groupDataByPeriods(csvData, periods);

    // Calculate analytics for each period
    const newPeriods = Object.values(groupedData).map((periodData) => {
      const { inquiries, validationIssues } = parseCSVData(periodData.data);
      const analytics = calculateAnalytics(inquiries, validationIssues);

      return {
        id: `period-${Date.now()}-${Math.random()}`,
        name: periodData.period.name,
        startDate: periodData.period.startDate,
        endDate: periodData.period.endDate,
        fileName: fileName,
        analytics: analytics,
        inquiryCount: inquiries.length,
        validationIssues: validationIssues
      };
    });

    // Update client
    const updatedClient = {
      ...client,
      periods: [...(client.periods || []), ...newPeriods]
    };

    onUpdateClient(updatedClient);
    setShowUpload(false);
    setLoading(false);
    setError(null);
  };

  const processLargeFileWithChunking = async (csvData, fileName) => {
    try {
      const chunks = chunkingService.chunkCSVByDays(csvData, 7);
      const chunkResults = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const { inquiries, validationIssues } = parseCSVData(chunk.data);
        const baseAnalytics = calculateAnalytics(inquiries, validationIssues);

        let enhancedAnalytics = baseAnalytics;
        if (aiSettings?.provider && aiSettings?.apiKey) {
          try {
            const aiInsights = await aiAnalyticsService.analyzeChunkWithAI(
              baseAnalytics,
              aiSettings.provider,
              aiSettings.apiKey
            );
            enhancedAnalytics = aiAnalyticsService.enhanceAnalyticsWithAI(baseAnalytics, aiInsights);
          } catch (err) {
            console.warn('AI analysis failed for chunk, continuing with base analytics:', err);
          }
        }

        chunkResults.push({
          startDate: chunk.startDate,
          endDate: chunk.endDate,
          analytics: enhancedAnalytics,
          inquiryCount: inquiries.length
        });
      }

      const aggregatedAnalytics = chunkingService.aggregateChunkAnalytics(chunkResults);
      const dateRange = chunkingService.getDateRangeFromCSV(csvData);

      const newPeriod = {
        id: `period-${Date.now()}`,
        name: `${dateRange.minDate} - ${dateRange.maxDate} (AI-Analyzed)`,
        startDate: dateRange.minDate,
        endDate: dateRange.maxDate,
        fileName: fileName,
        analytics: aggregatedAnalytics,
        inquiryCount: csvData.length,
        isAIAnalyzed: true,
        chunkCount: chunks.length
      };

      const updatedClient = {
        ...client,
        periods: [...(client.periods || []), newPeriod]
      };

      onUpdateClient(updatedClient);
      setShowUpload(false);
      setLoading(false);
    } catch (err) {
      setError(`Error processing large file: ${err.message}`);
      setLoading(false);
    }
  };

  // Placeholder implementations (same as in App.jsx)
  const parseCSVData = (csvData) => {
    const inquiries = csvData.filter((row) => row.MessageType);
    const validationIssues = {};
    return { inquiries, validationIssues };
  };

  const calculateAnalytics = (inquiries, validationIssues) => {
    return {
      totalInquiries: inquiries.length,
      successRate: '95%',
      avgResponseTime: '30s',
      avgResolutionTime: '45 min',
      dataQualityScore: '92',
      satisfactionRate: '88%',
      frustrationRate: '12%',
      insidePercentage: '60%',
      outsidePercentage: '40%',
      avgConversationLength: 5.2,
      validationIssues: validationIssues
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{client.name}</h1>
              <p className="text-gray-600">
                {client.periods?.length || 0} period{client.periods?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {FEATURE_FLAGS.AI_SETTINGS_PANEL && (
              <AISettingsPanel
                settings={aiSettings}
                onSettingsChange={(newSettings) => {
                  setAISettings(newSettings);
                  storage.saveAISettings(newSettings);
                }}
              />
            )}
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Upload className="w-5 h-5" />
              Upload CSV
            </button>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upload CSV File</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <label className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />
                <div className="text-center">
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
                      <p className="text-blue-600 font-semibold">Processing...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-semibold">Click to upload CSV</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Periods Grid */}
        {!client.periods || client.periods.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Periods Yet</h3>
            <p className="text-gray-600">Upload a CSV file to create periods automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {client.periods.map((period) => (
              <div
                key={period.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                {/* Period Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <h3 className="text-lg font-bold">{period.name}</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {period.startDate} to {period.endDate}
                  </p>
                  {period.isAIAnalyzed && (
                    <div className="flex items-center gap-1 mt-2 text-yellow-300 text-sm">
                      <span>⚡</span>
                      <span>AI-Analyzed</span>
                    </div>
                  )}
                </div>

                {/* Basic KPIs */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Total Inquiries</span>
                    <span className="text-2xl font-bold text-blue-600">{period.inquiryCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Success Rate</span>
                    <span className="text-lg font-semibold text-green-600">
                      {period.analytics?.successRate || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Data Quality</span>
                    <span className="text-lg font-semibold text-purple-600">
                      {period.analytics?.dataQualityScore || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Details Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => onSelectPeriod(period)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
