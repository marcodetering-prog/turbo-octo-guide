/**
 * KPI Validation Service
 * Compares AI-generated KPIs against baseline/expected values
 * Tracks accuracy and provides feedback for refinement
 */

/**
 * Baseline KPI reference data
 * This represents the validated, correct KPI values from actual data
 */
const BASELINE_KPIS = {
  totalInquiries: 96,
  automationRate: '88%',
  routingAccuracy: '71%',
  insideWorkingHours: '54%',
  outsideWorkingHours: '46%',
  deficiencyReportsInsideHours: '78%',
  deficiencyReportsOutsideHours: '22%',
  majorDeficiencies: 56,
  minorDeficiencies: 7,
  avgResponseTime: '120s', // Estimated from data
  avgResolutionTime: '240 min', // Estimated from data
  dataQualityScore: '92%',
  potentialSavings: 'CHF2,087.25',
  totalCost: 'CHF1,065.60',
  successRate: '88%', // Estimated from deficiency resolution rates
  satisfactionRate: '82%',
  frustrationRate: '12%'
};

/**
 * Parse percentage string to number
 * @param {string} percentStr - "88%"
 * @returns {number} 88
 */
const parsePercentage = (percentStr) => {
  if (!percentStr) return 0;
  return parseFloat(percentStr.toString().replace('%', ''));
};

/**
 * Parse time string to seconds for comparison
 * @param {string} timeStr - "120s" or "240 min"
 * @returns {number} Value in seconds
 */
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const str = timeStr.toString().toLowerCase();
  const value = parseFloat(str);

  if (str.includes('min')) {
    return value * 60; // Convert minutes to seconds
  } else if (str.includes('h')) {
    return value * 3600; // Convert hours to seconds
  }
  return value; // Already in seconds
};

/**
 * Calculate accuracy between AI value and baseline
 * @param {*} aiValue - Value from AI
 * @param {*} baselineValue - Expected value from baseline
 * @param {string} type - 'percentage', 'time', 'number', 'currency'
 * @returns {number} Accuracy percentage (0-100)
 */
const calculateAccuracy = (aiValue, baselineValue, type = 'number') => {
  if (!aiValue || !baselineValue) return 0;

  let aiNum, baselineNum;

  switch (type) {
    case 'percentage':
      aiNum = parsePercentage(aiValue);
      baselineNum = parsePercentage(baselineValue);
      break;
    case 'time':
      aiNum = parseTimeToSeconds(aiValue);
      baselineNum = parseTimeToSeconds(baselineValue);
      break;
    case 'currency':
      aiNum = parseFloat(aiValue.toString().replace(/[^0-9.]/g, ''));
      baselineNum = parseFloat(baselineValue.toString().replace(/[^0-9.]/g, ''));
      break;
    case 'number':
    default:
      aiNum = parseFloat(aiValue);
      baselineNum = parseFloat(baselineValue);
  }

  if (baselineNum === 0) return aiNum === 0 ? 100 : 0;

  const difference = Math.abs(aiNum - baselineNum);
  const percentDifference = (difference / baselineNum) * 100;

  // Accuracy = 100 - percentDifference
  return Math.max(0, 100 - percentDifference);
};

/**
 * Validate AI KPIs against baseline
 * @param {Object} aiKPIs - KPIs returned from AI
 * @returns {Object} Validation results with accuracy scores
 */
export const validateKPIs = (aiKPIs) => {
  const results = {
    timestamp: new Date().toISOString(),
    overallAccuracy: 0,
    kpiScores: {},
    warnings: [],
    suggestions: [],
    passedValidation: false
  };

  const kpiMappings = [
    { key: 'successRate', type: 'percentage' },
    { key: 'avgResponseTime', type: 'time' },
    { key: 'avgResolutionTime', type: 'time' },
    { key: 'dataQualityScore', type: 'percentage' },
    { key: 'satisfactionRate', type: 'percentage' },
    { key: 'frustrationRate', type: 'percentage' },
    { key: 'totalInquiries', type: 'number' }
  ];

  let totalAccuracy = 0;
  let validKPIs = 0;

  // Calculate accuracy for each KPI
  kpiMappings.forEach(({ key, type }) => {
    if (BASELINE_KPIS[key]) {
      const accuracy = calculateAccuracy(aiKPIs[key], BASELINE_KPIS[key], type);
      results.kpiScores[key] = {
        aiValue: aiKPIs[key],
        baselineValue: BASELINE_KPIS[key],
        accuracy: Math.round(accuracy),
        status: accuracy >= 95 ? '✓ PASS' : '✗ NEEDS REFINEMENT'
      };

      totalAccuracy += accuracy;
      validKPIs++;

      // Add warnings for low accuracy
      if (accuracy < 80) {
        results.warnings.push(
          `${key}: Only ${Math.round(accuracy)}% accurate. AI: ${aiKPIs[key]}, Expected: ${BASELINE_KPIS[key]}`
        );
      }
    }
  });

  // Calculate overall accuracy
  results.overallAccuracy = validKPIs > 0 ? Math.round(totalAccuracy / validKPIs) : 0;
  results.passedValidation = results.overallAccuracy >= 95;

  // Generate suggestions based on failed KPIs
  if (!results.passedValidation) {
    const failedKPIs = Object.entries(results.kpiScores)
      .filter(([_, score]) => score.accuracy < 95)
      .map(([key, _]) => key);

    if (failedKPIs.includes('successRate')) {
      results.suggestions.push('Review success rate calculation: Verify resolved vs unresolved inquiry counts');
    }
    if (failedKPIs.includes('avgResponseTime')) {
      results.suggestions.push('Check response time calculation: Ensure measuring from inquiry to first response in seconds');
    }
    if (failedKPIs.includes('avgResolutionTime')) {
      results.suggestions.push('Verify resolution time calculation: Should be from inquiry to final resolution in minutes');
    }
    if (failedKPIs.includes('dataQualityScore')) {
      results.suggestions.push('Improve data quality assessment: Check for missing fields, invalid timestamps, incomplete records');
    }
    if (failedKPIs.includes('satisfactionRate')) {
      results.suggestions.push('Refine satisfaction calculation: Based on successful resolutions and user feedback');
    }
  }

  return results;
};

/**
 * Get baseline KPIs for reference
 * @returns {Object} Baseline KPI values
 */
export const getBaselineKPIs = () => {
  return { ...BASELINE_KPIS };
};

/**
 * Update baseline KPIs with new reference data
 * @param {Object} newBaseline - Updated baseline KPI values
 */
export const updateBaselineKPIs = (newBaseline) => {
  Object.assign(BASELINE_KPIS, newBaseline);
};

/**
 * Format validation results for display
 * @param {Object} validationResults - Results from validateKPIs
 * @returns {string} Formatted validation report
 */
export const formatValidationReport = (validationResults) => {
  let report = `\n=== KPI VALIDATION REPORT ===\n`;
  report += `Overall Accuracy: ${validationResults.overallAccuracy}%\n`;
  report += `Status: ${validationResults.passedValidation ? '✓ PASSED (95%+)' : '✗ NEEDS REFINEMENT (Below 95%)'}\n\n`;

  report += `INDIVIDUAL KPI SCORES:\n`;
  Object.entries(validationResults.kpiScores).forEach(([key, score]) => {
    report += `  ${key}: ${score.accuracy}% [AI: ${score.aiValue}, Expected: ${score.baselineValue}]\n`;
  });

  if (validationResults.warnings.length > 0) {
    report += `\nWARNINGS:\n`;
    validationResults.warnings.forEach(warning => {
      report += `  ⚠ ${warning}\n`;
    });
  }

  if (validationResults.suggestions.length > 0) {
    report += `\nSUGGESTIONS FOR IMPROVEMENT:\n`;
    validationResults.suggestions.forEach(suggestion => {
      report += `  → ${suggestion}\n`;
    });
  }

  return report;
};
