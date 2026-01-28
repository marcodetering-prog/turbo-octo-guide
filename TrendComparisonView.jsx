import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import * as trendService from './trendAnalysisService';
import * as aiService from './aiAnalyticsService';

export default function TrendComparisonView({ client, periods, onBack, aiSettings }) {
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [aiTrendAnalysis, setAiTrendAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('mom'); // mom, growth, ranking, ai

  const keyMetrics = [
    'totalInquiries',
    'successRate',
    'avgResponseTime',
    'avgResolutionTime',
    'dataQualityScore',
    'frustrationRate',
    'satisfactionRate'
  ];

  // Initialize with at least 2 periods selected
  useEffect(() => {
    if (selectedPeriods.length === 0 && periods.length >= 2) {
      // Auto-select last 3 months or all if less than 3
      const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const toSelect = sortedPeriods.slice(Math.max(0, sortedPeriods.length - 3));
      setSelectedPeriods(toSelect);
    }
  }, [periods]);

  // Calculate trends when periods change
  useEffect(() => {
    if (selectedPeriods.length >= 2) {
      const momData = {};
      for (const metric of keyMetrics) {
        momData[metric] = trendService.calculateMoMChange(selectedPeriods, metric);
      }
      setTrendData(momData);
    }
  }, [selectedPeriods]);

  const handlePeriodToggle = (period) => {
    if (selectedPeriods.find(p => p.id === period.id)) {
      setSelectedPeriods(selectedPeriods.filter(p => p.id !== period.id));
    } else {
      setSelectedPeriods([...selectedPeriods, period]);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (selectedPeriods.length < 2 || !aiSettings?.provider || !aiSettings?.apiKey) {
      alert('Please select at least 2 periods and configure AI settings');
      return;
    }

    setLoadingAI(true);
    try {
      const preparedData = trendService.prepareTrendDataForAI(selectedPeriods);
      const prompt = trendService.buildTrendAnalysisPrompt(preparedData);

      const aiInsights = await aiService.analyzeChunkWithAI(
        { trendSummary: preparedData },
        aiSettings.provider,
        aiSettings.apiKey
      );

      setAiTrendAnalysis(aiInsights);
      setActiveTab('ai');
    } catch (error) {
      console.error('AI Trend Analysis Error:', error);
      alert(`AI analysis failed: ${error.message}`);
    } finally {
      setLoadingAI(false);
    }
  };

  if (selectedPeriods.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Trend Analysis</h2>
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <TrendingUp size={40} className="text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Periods to Compare</h3>
          <p className="text-gray-600 mb-6">Choose at least 2 periods to view trend analysis and KPI comparisons</p>

          <div className="space-y-3">
            {periods.map(period => (
              <label
                key={period.id}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedPeriods.some(p => p.id === period.id)}
                  onChange={() => handlePeriodToggle(period)}
                  className="w-5 h-5 rounded accent-blue-600"
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-800">{period.name}</div>
                  <div className="text-sm text-gray-600">{period.startDate} to {period.endDate}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Trend Analysis</h2>
            <p className="text-blue-100 mt-1">
              {selectedPeriods.length} periods selected • {client.name}
            </p>
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-700 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="border-b border-gray-200 p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-3">Change Period Selection</h3>
        <div className="flex flex-wrap gap-2">
          {periods.map(period => (
            <button
              key={period.id}
              onClick={() => handlePeriodToggle(period)}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                selectedPeriods.some(p => p.id === period.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {period.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('mom')}
          className={`flex-1 px-6 py-3 font-medium transition ${
            activeTab === 'mom'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Month-over-Month Change
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`flex-1 px-6 py-3 font-medium transition ${
            activeTab === 'growth'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Growth Trends
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 px-6 py-3 font-medium transition ${
            activeTab === 'ranking'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Rankings
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 px-6 py-3 font-medium transition ${
            activeTab === 'ai'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          AI Analysis
        </button>
      </div>

      <div className="p-6">
        {/* Month-over-Month Tab */}
        {activeTab === 'mom' && trendData && (
          <div className="space-y-8">
            {keyMetrics.map(metric => (
              <div key={metric} className="border rounded-lg p-6">
                <h4 className="font-bold text-gray-800 mb-4">{trendService.getMetricLabel(metric)}</h4>
                <div className="space-y-3">
                  {trendData[metric].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{item.month}</div>
                        <div className="text-sm text-gray-600">{item.startDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">
                          {trendService.formatMetricValue(metric, item.value)}
                        </div>
                        {item.changePercent !== null && (
                          <div className={`text-sm font-bold ${
                            item.direction === 'up' ? 'text-green-600' :
                            item.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {item.direction === 'up' && '📈'}
                            {item.direction === 'down' && '📉'}
                            {item.direction === 'stable' && '→'}
                            {' '}{item.changePercent > 0 ? '+' : ''}{item.changePercent}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Growth Trends Tab */}
        {activeTab === 'growth' && (
          <div className="space-y-6">
            {keyMetrics.map(metric => {
              const trendMetrics = trendService.calculateTrendMetrics(selectedPeriods, metric);
              if (!trendMetrics) return null;

              return (
                <div key={metric} className="border rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl">{trendMetrics.direction}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{trendService.getMetricLabel(metric)}</h4>
                      <p className="text-sm text-gray-600">{trendMetrics.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-xs text-gray-600 uppercase">Start Value</div>
                      <div className="text-xl font-bold text-gray-800">
                        {trendService.formatMetricValue(metric, trendMetrics.firstValue)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-xs text-gray-600 uppercase">End Value</div>
                      <div className="text-xl font-bold text-gray-800">
                        {trendService.formatMetricValue(metric, trendMetrics.lastValue)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <div className="text-xs text-gray-600 uppercase">Growth Rate</div>
                      <div className={`text-xl font-bold ${trendMetrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trendMetrics.growthRate > 0 ? '+' : ''}{trendMetrics.growthRate}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            {(() => {
              const rankings = trendService.calculateComparativeRankings(selectedPeriods, keyMetrics);
              return Object.entries(rankings).map(([metric, rankedPeriods]) => (
                <div key={metric} className="border rounded-lg p-6">
                  <h4 className="font-bold text-gray-800 mb-4">{trendService.getMetricLabel(metric)}</h4>
                  <div className="space-y-2">
                    {rankedPeriods.map(item => (
                      <div key={item.month} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {item.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.month}</div>
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                          {trendService.formatMetricValue(metric, item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai' && (
          <div>
            {!aiTrendAnalysis ? (
              <div className="text-center py-12">
                <button
                  onClick={handleAnalyzeWithAI}
                  disabled={loadingAI || !aiSettings?.provider}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-semibold flex items-center gap-2 mx-auto"
                >
                  {loadingAI ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzing Trends...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={18} />
                      Analyze Trends with AI
                    </>
                  )}
                </button>
                {!aiSettings?.provider && (
                  <p className="text-gray-600 text-sm mt-4">Configure AI settings to enable trend analysis</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Trends */}
                {aiTrendAnalysis.trends && aiTrendAnalysis.trends.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="text-blue-600" size={20} />
                      Key Trends
                    </h4>
                    <ul className="space-y-2">
                      {aiTrendAnalysis.trends.map((trend, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-gray-800">{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {aiTrendAnalysis.recommendations && aiTrendAnalysis.recommendations.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {aiTrendAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-green-600 font-bold">✓</span>
                          <span className="text-gray-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
