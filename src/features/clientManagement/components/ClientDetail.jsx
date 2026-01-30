import React, { useState } from 'react';
import { Upload, ArrowLeft, AlertCircle, Loader2, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import Papa from 'papaparse';
import { suggestPeriodGrouping, generatePeriodsForType, groupDataByPeriods } from '../../../services/autoPeriodDetection';
import * as chunkingService from '../../../features/aiIntegration/services/chunkingService';
import * as aiAnalyticsService from '../../../features/aiIntegration/services/aiAnalyticsService';
import AISettingsPanel from '../../aiIntegration/components/AISettingsPanel';
import * as storage from '../../../services/storage';
import * as kpiValidation from '../../../services/kpiValidation';
import ProgressBar from '../../../components/ProgressBar';
import KPIAccuracyReport from '../../../components/KPIAccuracyReport';
import FEATURE_FLAGS from '../../../constants/featureFlags';
import uiStrings from '../../../config/uiStrings.json';

export default function ClientDetail({ client, onBack, onUpdateClient, onSelectPeriod, aiSettings: initialAISettings }) {
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
        validationIssues: validationIssues
      };
    });

    // Step 4: Save results
    setProgressMessage(uiStrings.clientDetail.progress.savingResults);
    setProgress(90);

    const updatedClient = {
      ...client,
      periods: [...(client.periods || []), ...newPeriods]
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
        const progressTemplate = aiSettings?.provider && aiSettings?.apiKey
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

      // Step: Aggregate results by month
      setProgressMessage(uiStrings.clientDetail.progress.aggregatingResults);
      setProgress(88);

      const monthlyGroups = chunkingService.groupChunksByMonth(chunkResults);
      const newPeriods = monthlyGroups.map((group) => {
        const monthlyAnalytics = chunkingService.aggregateChunkAnalytics(group.chunks);
        const monthlyInquiryCount = group.chunks.reduce((sum, chunk) => sum + chunk.inquiryCount, 0);

        // Format month name
        const [year, month] = group.monthYear.split('-');
        const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        return {
          id: `period-${Date.now()}-${group.monthYear}`,
          name: monthName,
          startDate: group.startDate,
          endDate: group.endDate,
          fileName: fileName,
          analytics: monthlyAnalytics,
          inquiryCount: monthlyInquiryCount,
          isAIAnalyzed: true,
          chunkCount: group.chunks.length
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
        periods: [...(client.periods || []), ...newPeriods]
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

  const parseCSVData = (csvData) => {
    // Group by conversation ID to identify unique inquiries
    const conversationMap = {};
    const allMessages = [];

    csvData.forEach((row) => {
      if (row.ConversationId) {
        if (!conversationMap[row.ConversationId]) {
          conversationMap[row.ConversationId] = [];
        }
        conversationMap[row.ConversationId].push(row);
        allMessages.push(row);
      }
    });

    // Inquiries are conversations with at least one tenant message (MessageType = 3)
    const inquiries = Object.values(conversationMap).filter((conversation) => {
      return conversation.some((msg) => msg.MessageType === '3' || msg.MessageType === 3);
    });

    // Calculate validation issues - match aggregateChunkAnalytics format (arrays, not numbers)
    const validationIssues = {
      missingDeficiencyType: [],
      missingCostEstimate: [],
      missingReportStatus: [],
      lowConfidenceScore: [],
      highFrustration: [],
      longConversations: [],
      shortConversations: []
    };

    inquiries.forEach((conversation) => {
      conversation.forEach((msg) => {
        if (!msg.TimeSent || !msg.ConversationId) {
          validationIssues.missingReportStatus.push(`Conversation ${msg.ConversationId}: Missing timestamp`);
        }
      });
    });

    return { inquiries, allMessages, validationIssues };
  };

  const calculateAnalytics = (inquiries, validationIssues, allMessages = []) => {
    if (inquiries.length === 0) {
      return {
        totalInquiries: 0,
        successRate: 'N/A',
        avgResponseTime: '0s',
        avgResolutionTime: '0 min',
        dataQualityScore: '0%',
        satisfactionRate: '0%',
        frustrationRate: '0%',
        insidePercentage: '0%',
        outsidePercentage: '0%',
        avgConversationLength: 0,
        insideWorkingHours: 0,
        outsideWorkingHours: 0,
        successfulReports: 0,
        failedReports: 0,
        satisfied: 0,
        frustrated: 0,
        neutral: 0,
        totalIssues: 0,
        validationIssues: validationIssues,
        deficiencyData: [],
        costData: [],
        satisfactionData: [],
        hourlyData: [],
        timeWindowData: [],
        successData: []
      };
    }

    // Calculate conversation metrics
    let totalMessages = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let conversationsWithResponseTime = 0;
    let insideWorkingHours = 0;
    let outsideWorkingHours = 0;
    let successCount = 0;
    let failCount = 0;
    let hourlyData = new Array(24).fill(0);

    inquiries.forEach((conversation) => {
      totalMessages += conversation.length;

      const sortedMessages = conversation.sort((a, b) => {
        const dateA = new Date(a.TimeSent).getTime();
        const dateB = new Date(b.TimeSent).getTime();
        return dateA - dateB;
      });

      // Count first message time
      if (sortedMessages[0].TimeSent) {
        const hour = new Date(sortedMessages[0].TimeSent).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;

        if (hour >= 9 && hour < 17) {
          insideWorkingHours++;
        } else {
          outsideWorkingHours++;
        }
      }

      // Calculate response time (time between first and second message)
      if (sortedMessages.length > 1 && sortedMessages[0].TimeSent && sortedMessages[1].TimeSent) {
        const firstTime = new Date(sortedMessages[0].TimeSent).getTime();
        const secondTime = new Date(sortedMessages[1].TimeSent).getTime();
        const responseTime = Math.round((secondTime - firstTime) / 1000); // in seconds
        totalResponseTime += responseTime;
        conversationsWithResponseTime++;
      }

      // Calculate resolution time (first to last message)
      if (sortedMessages.length > 1 && sortedMessages[0].TimeSent && sortedMessages[sortedMessages.length - 1].TimeSent) {
        const firstTime = new Date(sortedMessages[0].TimeSent).getTime();
        const lastTime = new Date(sortedMessages[sortedMessages.length - 1].TimeSent).getTime();
        const resolutionTime = Math.round((lastTime - firstTime) / (1000 * 60)); // in minutes
        totalResolutionTime += resolutionTime;
      }

      // Count success/failed (assume Status field or count based on presence of resolution)
      if (conversation.some((msg) => msg.Status === 'resolved' || msg.Status === 'closed')) {
        successCount++;
      } else {
        failCount++;
      }
    });

    const avgResponseTime = conversationsWithResponseTime > 0
      ? Math.round(totalResponseTime / conversationsWithResponseTime)
      : 0;
    const avgResolutionTime = inquiries.length > 0
      ? Math.round(totalResolutionTime / inquiries.length)
      : 0;
    const avgConversationLength = inquiries.length > 0
      ? (totalMessages / inquiries.length).toFixed(1)
      : 0;

    const insidePercentage = inquiries.length > 0
      ? Math.round((insideWorkingHours / inquiries.length) * 100)
      : 0;
    const outsidePercentage = inquiries.length > 0
      ? Math.round((outsideWorkingHours / inquiries.length) * 100)
      : 0;

    const successRate = (successCount + failCount) > 0
      ? Math.round((successCount / (successCount + failCount)) * 100)
      : 0;

    // Data quality score - count total issues from validation issues arrays
    const totalIssuesCount = Object.values(validationIssues).reduce((sum, issues) => {
      return sum + (Array.isArray(issues) ? issues.length : 0);
    }, 0);
    const qualityScore = allMessages.length > 0
      ? Math.max(0, 100 - Math.round((totalIssuesCount / allMessages.length) * 100))
      : 100;

    // Calculate satisfaction based on resolution success and quality
    // Satisfied = successful resolutions + good quality
    // Frustrated = failed resolutions or low quality
    // Neutral = inquiries without clear status
    const satisfiedCount = Math.max(0, Math.round((successCount * (qualityScore / 100)) / inquiries.length * inquiries.length));
    const frustratedCount = Math.max(0, Math.round(failCount * 1.5)); // Failed + some quality issues
    const neutralCount = Math.max(0, inquiries.length - satisfiedCount - frustratedCount);

    const satisfactionRate = inquiries.length > 0
      ? Math.round((satisfiedCount / inquiries.length) * 100)
      : 0;
    const frustrationRate = inquiries.length > 0
      ? Math.round((frustratedCount / inquiries.length) * 100)
      : 0;

    return {
      totalInquiries: inquiries.length,
      successRate: successRate > 0 ? `${successRate}%` : 'N/A',
      avgResponseTime: avgResponseTime > 0 ? `${avgResponseTime}s` : '0s',
      avgResolutionTime: avgResolutionTime > 0 ? `${avgResolutionTime} min` : '0 min',
      dataQualityScore: `${qualityScore}%`,
      satisfactionRate: `${satisfactionRate}%`,
      frustrationRate: `${frustrationRate}%`,
      insidePercentage: `${insidePercentage}%`,
      outsidePercentage: `${outsidePercentage}%`,
      avgConversationLength: parseFloat(avgConversationLength),
      insideWorkingHours: insideWorkingHours,
      outsideWorkingHours: outsideWorkingHours,
      successfulReports: successCount,
      failedReports: failCount,
      satisfied: satisfiedCount,
      frustrated: frustratedCount,
      neutral: neutralCount,
      totalIssues: totalIssuesCount,
      validationIssues: validationIssues,
      deficiencyData: [],
      costData: [],
      satisfactionData: [
        { name: 'Satisfied', value: satisfiedCount, color: '#10b981' },
        { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
        { name: 'Frustrated', value: frustratedCount, color: '#ef4444' }
      ],
      hourlyData: hourlyData.map((count, hour) => ({
        hour: `${hour}:00`,
        count: count,
        isWorkingHours: hour >= 9 && hour < 17
      })),
      timeWindowData: [
        { name: 'Working Hours', value: insideWorkingHours },
        { name: 'After Hours', value: outsideWorkingHours }
      ],
      successData: [
        { name: 'Successful', value: successCount },
        { name: 'Failed', value: failCount }
      ]
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
              {uiStrings.common.uploadCSV}
            </button>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{uiStrings.clientDetail.uploadSection.title}</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {loading && progress > 0 && (
              <div className="mb-6">
                <ProgressBar
                  progress={progress}
                  message={progressMessage}
                  isComplete={progress === 100}
                  variant={progress === 100 ? 'success' : 'default'}
                />
              </div>
            )}
            <div className="flex gap-3">
              <label className={`flex-1 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                loading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-blue-500'
              }`}>
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
                      <p className="text-blue-600 font-semibold">{uiStrings.clientDetail.uploadSection.processing}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-semibold">{uiStrings.clientDetail.uploadSection.clickToUpload}</p>
                      <p className="text-sm text-gray-500">{uiStrings.clientDetail.uploadSection.dragAndDrop}</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* KPI Accuracy Report */}
        {validationResults && (
          <div className="mb-8">
            <KPIAccuracyReport
              validationResults={validationResults}
              baselineKPIs={kpiValidation.getBaselineKPIs()}
            />
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
