import React, { useState } from 'react';
import { Upload, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import {
  suggestPeriodGrouping,
  generatePeriodsForType,
  groupDataByPeriods,
} from '../../../services/autoPeriodDetection';
import * as chunkingService from '../../../features/aiIntegration/services/chunkingService';
import * as aiAnalyticsService from '../../../features/aiIntegration/services/aiAnalyticsService';
import AISettingsPanel from '../../aiIntegration/components/AISettingsPanel';
import * as storage from '../../../services/storage';
import * as kpiValidation from '../../../services/kpiValidation';
import KPIAccuracyReport from '../../../components/KPIAccuracyReport';
import FEATURE_FLAGS from '../../../constants/featureFlags';
import uiStrings from '../../../config/uiStrings.json';
import { parseCSVData } from '../services/csvProcessing';
import { calculateAnalytics } from '../services/analyticsCalculation';
import UploadSection from './UploadSection';
import PeriodsGrid from './PeriodsGrid';

export default function ClientDetail({
  client,
  onBack,
  onUpdateClient,
  onSelectPeriod,
  aiSettings: initialAISettings,
}) {
  const [loading, setLoading] = useState(false);
  const [uploadedCSV, setUploadedCSV] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState(null);
  const [aiSettings, setAISettings] = useState(initialAISettings || storage.getAISettings());
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [validationResults, setValidationResults] = useState(null);

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
            setError(uiStrings.clientDetail.uploadSection.uploadError);
            setLoading(false);
            return;
          }

          // Check if file needs chunking
          const needsChunk = chunkingService.needsChunking(results.data);

          if (
            needsChunk &&
            FEATURE_FLAGS.AI_CHUNKING &&
            aiSettings?.enabled &&
            aiSettings?.provider &&
            aiSettings?.apiKey
          ) {
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
      },
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
    // Step 1: Analyze period grouping
    setProgressMessage(uiStrings.clientDetail.progress.analyzingData);
    setProgress(20);

    const suggestion = suggestPeriodGrouping(csvData);
    const groupingType = suggestion.recommendation;

    // Step 2: Generate periods
    setProgressMessage(uiStrings.clientDetail.progress.generatingPeriods);
    setProgress(40);

    const periods = generatePeriodsForType(csvData, groupingType);
    const groupedData = groupDataByPeriods(csvData, periods);

    // Step 3: Calculate analytics
    setProgressMessage(uiStrings.clientDetail.progress.calculatingAnalytics);
    setProgress(60);

    const newPeriods = Object.values(groupedData).map((periodData) => {
      const { inquiries, allMessages, validationIssues } = parseCSVData(periodData.data);
      const analytics = calculateAnalytics(inquiries, validationIssues, allMessages);

      return {
        id: `period-${Date.now()}-${Math.random()}`,
        name: periodData.period.name,
        startDate: periodData.period.startDate,
        endDate: periodData.period.endDate,
        fileName: fileName,
        analytics: analytics,
        inquiryCount: inquiries.length,
        validationIssues: validationIssues,
      };
    });

    // Step 4: Save results
    setProgressMessage(uiStrings.clientDetail.progress.savingResults);
    setProgress(90);

    const updatedClient = {
      ...client,
      periods: [...(client.periods || []), ...newPeriods],
    };

    onUpdateClient(updatedClient);

    setProgress(100);
    setProgressMessage(uiStrings.clientDetail.progress.uploadComplete);
    setTimeout(() => {
      setShowUpload(false);
      setLoading(false);
      setError(null);
      setProgress(0);
      setProgressMessage('');
    }, 800);
  };

  const processLargeFileWithChunking = async (csvData, fileName) => {
    try {
      setProgressMessage(uiStrings.clientDetail.progress.chunkingData);
      setProgress(15);

      const chunks = chunkingService.chunkCSVByDays(csvData, 7);
      const chunkResults = [];
      const totalChunks = chunks.length;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Update progress message with chunk number
        const progressTemplate =
          aiSettings?.provider && aiSettings?.apiKey
            ? uiStrings.clientDetail.progress.processingDocument
            : uiStrings.clientDetail.progress.processingDocumentNoAI;
        const progressMessage = progressTemplate
          .replace('{current}', i + 1)
          .replace('{total}', totalChunks);
        setProgressMessage(progressMessage);

        // Calculate progress: start at 15%, end at 85% during chunking
        const chunkProgress = 15 + (i / totalChunks) * 70;
        setProgress(chunkProgress);

        const { inquiries, allMessages, validationIssues } = parseCSVData(chunk.data);
        const baseAnalytics = calculateAnalytics(inquiries, validationIssues, allMessages);

        let enhancedAnalytics = baseAnalytics;
        if (aiSettings?.provider && aiSettings?.apiKey) {
          try {
            const aiInsights = await aiAnalyticsService.analyzeChunkWithAI(
              baseAnalytics,
              aiSettings.provider,
              aiSettings.apiKey
            );
            enhancedAnalytics = aiAnalyticsService.enhanceAnalyticsWithAI(
              baseAnalytics,
              aiInsights
            );
          } catch (err) {
            console.warn('AI analysis failed for chunk, continuing with base analytics:', err);
          }
        }

        chunkResults.push({
          startDate: chunk.startDate,
          endDate: chunk.endDate,
          analytics: enhancedAnalytics,
          inquiryCount: inquiries.length,
        });
      }

      // Step: Aggregate results by month
      setProgressMessage(uiStrings.clientDetail.progress.aggregatingResults);
      setProgress(88);

      const monthlyGroups = chunkingService.groupChunksByMonth(chunkResults);
      const newPeriods = monthlyGroups.map((group) => {
        const monthlyAnalytics = chunkingService.aggregateChunkAnalytics(group.chunks);
        const monthlyInquiryCount = group.chunks.reduce(
          (sum, chunk) => sum + chunk.inquiryCount,
          0
        );

        // Format month name
        const [year, month] = group.monthYear.split('-');
        const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });

        return {
          id: `period-${Date.now()}-${group.monthYear}`,
          name: monthName,
          startDate: group.startDate,
          endDate: group.endDate,
          fileName: fileName,
          analytics: monthlyAnalytics,
          inquiryCount: monthlyInquiryCount,
          isAIAnalyzed: true,
          chunkCount: group.chunks.length,
        };
      });

      // Step: Validate KPIs against baseline
      setProgressMessage('Validating KPI accuracy...');
      setProgress(92);

      // Validate the first period's analytics as representative
      if (newPeriods.length > 0) {
        const validation = kpiValidation.validateKPIs(newPeriods[0].analytics);
        setValidationResults(validation);

        // Log validation for debugging
        console.log('KPI Validation Results:', validation);
      }

      // Step: Save results
      setProgressMessage(uiStrings.clientDetail.progress.savingResults);
      setProgress(95);

      const updatedClient = {
        ...client,
        periods: [...(client.periods || []), ...newPeriods],
      };

      onUpdateClient(updatedClient);

      setProgress(100);
      setProgressMessage(uiStrings.clientDetail.progress.uploadComplete);
      setTimeout(() => {
        setShowUpload(false);
        setLoading(false);
        setProgress(0);
        setProgressMessage('');
      }, 800);
    } catch (err) {
      setError(`Error processing large file: ${err.message}`);
      setLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
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
              {uiStrings.common.uploadCSV}
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <UploadSection
          showUpload={showUpload}
          onToggleUpload={() => setShowUpload(!showUpload)}
          onFileSelect={handleFileSelect}
          error={error}
          loading={loading}
          progress={progress}
          progressMessage={progressMessage}
        />

        {/* KPI Accuracy Report */}
        {validationResults && (
          <div className="mb-8">
            <KPIAccuracyReport validationResults={validationResults} />
          </div>
        )}

        {/* Periods Grid */}
        <PeriodsGrid periods={client.periods} onSelectPeriod={onSelectPeriod} />
      </div>
    </div>
  );
}
