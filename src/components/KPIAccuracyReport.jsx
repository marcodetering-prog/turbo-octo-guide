import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

export default function KPIAccuracyReport({ validationResults, baselineKPIs }) {
  if (!validationResults) return null;

  /**
   * Format a metric value for display
   */
  const formatValue = (value) => {
    if (!value) return '0';
    return value.toString();
  };

  /**
   * Parse percentage for display
   */
  const parsePercentage = (percentStr) => {
    if (!percentStr) return 0;
    return parseFloat(percentStr.toString().replace('%', ''));
  };

  /**
   * Parse time value
   */
  const parseTime = (timeStr) => {
    if (!timeStr) return '0';
    return timeStr.toString();
  };

  /**
   * Determine color based on accuracy
   */
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return '#10b981'; // green
    if (accuracy >= 80) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  /**
   * Determine background color based on accuracy
   */
  const getAccuracyBgColor = (accuracy) => {
    if (accuracy >= 95) return '#ecfdf5'; // green bg
    if (accuracy >= 80) return '#fffbeb'; // orange bg
    return '#fef2f2'; // red bg
  };

  const scores = validationResults.kpiScores || {};
  const overallAccuracy = validationResults.overallAccuracy || 0;

  // Group KPIs by category
  const kpiCategories = {
    'Response Metrics': ['avgResponseTime', 'avgResolutionTime'],
    'Quality Metrics': ['dataQualityScore', 'satisfactionRate', 'frustrationRate'],
    'Success Metrics': ['successRate'],
    'Volume Metrics': ['totalInquiries']
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-8">
      {/* Header with Overall Accuracy */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-800">KPI Accuracy Report</h2>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-lg p-6 shadow-lg border-2"
             style={{ borderColor: getAccuracyColor(overallAccuracy) }}>
          <div className="text-right">
            <p className="text-sm text-gray-600 font-medium">Overall Accuracy</p>
            <p className="text-4xl font-bold" style={{ color: getAccuracyColor(overallAccuracy) }}>
              {overallAccuracy}%
            </p>
          </div>
          {overallAccuracy >= 95 ? (
            <CheckCircle size={40} style={{ color: getAccuracyColor(overallAccuracy) }} />
          ) : (
            <AlertCircle size={40} style={{ color: getAccuracyColor(overallAccuracy) }} />
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-8">
        {validationResults.passedValidation ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
            <CheckCircle size={18} />
            ✓ PASSED VALIDATION (95%+)
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
            <AlertCircle size={18} />
            ⚠ NEEDS REFINEMENT (Below 95%)
          </div>
        )}
      </div>

      {/* KPI Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(kpiCategories).map(([categoryName, kpiKeys]) => {
          // Filter to only show KPIs that have scores
          const categoryKPIs = kpiKeys.filter(key => scores[key]);

          if (categoryKPIs.length === 0) return null;

          return (
            <div
              key={categoryName}
              className="bg-white rounded-lg p-6 shadow-lg border-l-4"
              style={{ borderColor: '#3b82f6' }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">{categoryName}</h3>

              <div className="space-y-4">
                {categoryKPIs.map((key) => {
                  const score = scores[key];
                  const accuracy = score.accuracy;
                  const isPass = accuracy >= 95;

                  return (
                    <div
                      key={key}
                      className="p-4 rounded border-l-4"
                      style={{
                        backgroundColor: getAccuracyBgColor(accuracy),
                        borderColor: getAccuracyColor(accuracy)
                      }}
                    >
                      {/* Metric Name */}
                      <p className="font-semibold text-gray-800 capitalize mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>

                      {/* Accuracy Percentage */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Accuracy</span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: getAccuracyColor(accuracy) }}
                        >
                          {accuracy}%
                        </span>
                      </div>

                      {/* AI Value vs Baseline */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">AI Output</p>
                          <p className="font-semibold text-gray-800">{score.aiValue}</p>
                        </div>
                        <div className="px-3 text-gray-500 font-bold">vs</div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-600 mb-1">Expected</p>
                          <p className="font-semibold text-gray-800">{score.baselineValue}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isPass ? (
                        <div className="inline-flex items-center gap-1 text-green-700 text-sm font-semibold">
                          <CheckCircle size={14} />
                          ✓ PASS
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-yellow-700 text-sm font-semibold">
                          <AlertCircle size={14} />
                          ⚠ Needs refinement
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warnings Section */}
      {validationResults.warnings && validationResults.warnings.length > 0 && (
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            ⚠ Warnings - Low Accuracy Areas
          </h3>
          <ul className="space-y-2">
            {validationResults.warnings.map((warning, idx) => (
              <li key={idx} className="text-yellow-800 text-sm flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions Section */}
      {validationResults.suggestions && validationResults.suggestions.length > 0 && (
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            💡 Suggestions for Improvement
          </h3>
          <ul className="space-y-2">
            {validationResults.suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-blue-900 text-sm flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Progress to 95% Target</p>
          <p className="text-sm font-bold text-gray-700">{overallAccuracy}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${Math.min(overallAccuracy, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {overallAccuracy >= 95
            ? '✓ Target reached! KPI analysis is accurate.'
            : `${95 - overallAccuracy}% improvement needed to reach target accuracy.`}
        </p>
      </div>
    </div>
  );
}
