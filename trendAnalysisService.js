/**
 * Trend Analysis Service
 * Calculates trend KPIs across multiple periods
 */

/**
 * Calculate Month-over-Month % change for a metric
 * @param {Array} periods - Array of periods sorted chronologically
 * @param {String} metricKey - Metric to track (e.g., 'totalInquiries')
 * @returns {Array} MoM changes: [{month, value, change%, direction}, ...]
 */
export const calculateMoMChange = (periods, metricKey) => {
  if (!periods || periods.length < 2) return [];

  const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const results = [];

  for (let i = 0; i < sortedPeriods.length; i++) {
    const current = sortedPeriods[i];
    const currentValue = getMetricValue(current, metricKey);

    if (i === 0) {
      // First month has no previous month
      results.push({
        month: current.name,
        startDate: current.startDate,
        value: currentValue,
        changePercent: null,
        direction: 'baseline'
      });
    } else {
      const previous = sortedPeriods[i - 1];
      const previousValue = getMetricValue(previous, metricKey);

      const changePercent = previousValue !== 0
        ? (((currentValue - previousValue) / previousValue) * 100).toFixed(1)
        : (currentValue > 0 ? 100 : 0);

      const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable';

      results.push({
        month: current.name,
        startDate: current.startDate,
        value: currentValue,
        changePercent: parseFloat(changePercent),
        direction,
        previous: previousValue,
        current: currentValue
      });
    }
  }

  return results;
};

/**
 * Calculate trend direction and growth rate
 * @param {Array} periods - Periods sorted chronologically
 * @param {String} metricKey - Metric to analyze
 * @returns {Object} {trend, growthRate, slope, direction, description}
 */
export const calculateTrendMetrics = (periods, metricKey) => {
  if (!periods || periods.length < 2) return null;

  const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const values = sortedPeriods.map(p => getMetricValue(p, metricKey));

  // Calculate simple linear regression (slope)
  const n = values.length;
  const xMean = (n - 1) / 2; // Average index
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += (i - xMean) * (values[i] - yMean);
    sumX2 += (i - xMean) * (i - xMean);
  }

  const slope = sumX2 !== 0 ? sumXY / sumX2 : 0;

  // Overall growth rate
  const firstValue = values[0];
  const lastValue = values[n - 1];
  const overallGrowth = firstValue !== 0
    ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
    : (lastValue > 0 ? 100 : 0);

  // Determine trend direction
  let trendDirection = 'stable';
  if (slope > 0.5) trendDirection = 'strong-upward';
  else if (slope > 0.1) trendDirection = 'upward';
  else if (slope < -0.5) trendDirection = 'strong-downward';
  else if (slope < -0.1) trendDirection = 'downward';

  const directionEmoji = {
    'strong-upward': '📈',
    'upward': '📈',
    'strong-downward': '📉',
    'downward': '📉',
    'stable': '→'
  };

  return {
    metric: metricKey,
    slope,
    trendDirection,
    growthRate: parseFloat(overallGrowth),
    firstValue,
    lastValue,
    direction: directionEmoji[trendDirection],
    description: `${directionEmoji[trendDirection]} ${trendDirection.replace('-', ' ')}: ${overallGrowth}% overall change`
  };
};

/**
 * Rank periods by performance on each KPI
 * @param {Array} periods - Periods to rank
 * @param {Array} metricKeys - Metrics to rank on
 * @returns {Object} {metricKey: [{rank, month, value, period}, ...]}
 */
export const calculateComparativeRankings = (periods, metricKeys) => {
  if (!periods || periods.length < 2) return {};

  const rankings = {};

  for (const metricKey of metricKeys) {
    const periodMetrics = periods.map(p => ({
      month: p.name,
      startDate: p.startDate,
      value: getMetricValue(p, metricKey),
      period: p
    }));

    // Sort by value (descending for most metrics, ascending for time-based)
    const isInverse = ['avgResponseTime', 'avgResolutionTime'].includes(metricKey);
    periodMetrics.sort((a, b) => isInverse ? a.value - b.value : b.value - a.value);

    rankings[metricKey] = periodMetrics.map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  }

  return rankings;
};

/**
 * Prepare data for AI trend analysis
 * @param {Array} periods - Periods to analyze
 * @returns {Object} Summary of all trend metrics for AI analysis
 */
export const prepareTrendDataForAI = (periods) => {
  if (!periods || periods.length < 2) return null;

  const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const keyMetrics = [
    'totalInquiries',
    'successRate',
    'avgResponseTime',
    'avgResolutionTime',
    'dataQualityScore',
    'frustrationRate',
    'satisfactionRate'
  ];

  const trendSummary = {
    periodCount: periods.length,
    dateRange: `${sortedPeriods[0].startDate} to ${sortedPeriods[sortedPeriods.length - 1].endDate}`,
    periods: sortedPeriods.map(p => ({
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate
    })),
    metrics: {}
  };

  for (const metric of keyMetrics) {
    const momChanges = calculateMoMChange(sortedPeriods, metric);
    const trendMetrics = calculateTrendMetrics(sortedPeriods, metric);

    trendSummary.metrics[metric] = {
      monthOverMonth: momChanges,
      trend: trendMetrics,
      values: sortedPeriods.map(p => ({
        month: p.name,
        value: getMetricValue(p, metric)
      }))
    };
  }

  return trendSummary;
};

/**
 * Build prompt for AI to analyze trends
 * @param {Object} trendData - Output from prepareTrendDataForAI
 * @returns {String} Prompt for AI model
 */
export const buildTrendAnalysisPrompt = (trendData) => {
  const metricsStr = Object.entries(trendData.metrics)
    .map(([key, data]) => {
      const trend = data.trend;
      const values = data.values.map(v => `${v.month}: ${typeof v.value === 'string' ? v.value : v.value.toFixed(2)}`).join(' → ');
      return `${key}: ${values}\nTrend: ${trend?.description || 'No trend data'}`;
    })
    .join('\n\n');

  return `Analyze these ${trendData.periodCount} months of analytics data and provide insights on trends and patterns:

**Time Period:** ${trendData.dateRange}

**Key Metrics Over Time:**
${metricsStr}

**Task:** Provide a JSON response with:
1. "keyTrends": Array of 2-3 main trends across the period
2. "monthlyHighlights": Identify the best and worst performing months
3. "predictedNextMonth": Forecast metrics for the next month based on trend
4. "recommendations": Array of 2-3 strategic recommendations based on trends

Example format:
{
  "keyTrends": [
    "Inquiries trending upward at 5% MoM growth",
    "Success rate stable around 82%"
  ],
  "monthlyHighlights": {
    "best": "February with highest satisfaction rate",
    "worst": "January with longest response times"
  },
  "predictedNextMonth": {
    "totalInquiries": 150,
    "successRate": "82%",
    "avgResponseTime": "35s"
  },
  "recommendations": [
    "Continue current operations - stable metrics",
    "Focus on maintaining response time improvements"
  ]
}

Respond with ONLY valid JSON, no other text.`;
};

/**
 * Extract metric value from period analytics
 * Handles nested structure and different data types
 */
const getMetricValue = (period, metricKey) => {
  if (!period || !period.analytics) return 0;

  const analytics = period.analytics;

  // Handle string percentages (e.g., "82.5%")
  if (typeof analytics[metricKey] === 'string') {
    const numValue = parseFloat(analytics[metricKey]);
    return isNaN(numValue) ? 0 : numValue;
  }

  // Handle numbers
  if (typeof analytics[metricKey] === 'number') {
    return analytics[metricKey];
  }

  return 0;
};

/**
 * Format metric value for display with appropriate units
 * @param {String} metricKey - Metric name
 * @param {Number} value - Metric value
 * @returns {String} Formatted value with units
 */
export const formatMetricValue = (metricKey, value) => {
  if (typeof value === 'string') return value;

  if (['successRate', 'dataQualityScore', 'frustrationRate', 'satisfactionRate', 'escalationRate'].includes(metricKey)) {
    return `${value.toFixed(1)}%`;
  }

  if (['avgResponseTime'].includes(metricKey)) {
    return `${value.toFixed(0)}s`;
  }

  if (['avgResolutionTime'].includes(metricKey)) {
    return `${value.toFixed(0)}m`;
  }

  if (['avgConversationLength'].includes(metricKey)) {
    return `${value.toFixed(1)} msgs`;
  }

  return value.toFixed(1);
};

/**
 * Get human-readable metric name
 */
export const getMetricLabel = (metricKey) => {
  const labels = {
    totalInquiries: 'Total Inquiries',
    successRate: 'Success Rate',
    avgResponseTime: 'Avg Response Time',
    avgResolutionTime: 'Avg Resolution Time',
    dataQualityScore: 'Data Quality',
    frustrationRate: 'Frustration Rate',
    satisfactionRate: 'Satisfaction Rate',
    escalationRate: 'Escalation Rate',
    avgConversationLength: 'Avg Conversation Length',
    insidePercentage: 'Working Hours %',
    outsidePercentage: 'After Hours %',
    deficiencyTypeAccuracy: 'Deficiency Accuracy',
    costEstimateCoverage: 'Cost Coverage'
  };

  return labels[metricKey] || metricKey;
};
