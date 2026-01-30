/**
 * Predictive Analytics Service
 * Forecasts future KPI trends using exponential smoothing and linear regression
 * Alpha (smoothing factor): 0.3
 */

/**
 * Predict next period KPIs based on historical data
 * @param {Array} historicalPeriods - Array of period analytics
 * @returns {Object} Predictions with confidence and trends
 */
export const predictNextPeriod = (historicalPeriods) => {
  const minPeriods = 3;

  if (!historicalPeriods || historicalPeriods.length < minPeriods) {
    return null;
  }

  try {
    // Extract KPI values across periods
    const kpiNames = extractKPINames(historicalPeriods);
    const predictions = {};
    const trendIndicators = {};
    let confidenceScores = [];

    // Forecast each KPI
    for (const kpiName of kpiNames) {
      const values = extractKPIValues(historicalPeriods, kpiName);

      if (values.length >= minPeriods) {
        const forecast = exponentialSmoothing(values, 0.3);
        const trend = detectTrend(values);
        const confidence = calculateForecastConfidence(values);

        // Format the prediction
        predictions[kpiName] = formatKPIValue(forecast.nextValue, kpiName);
        trendIndicators[kpiName] = trend;
        confidenceScores.push(confidence);
      }
    }

    // Calculate overall confidence
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;
    const confidenceLevel = getConfidenceLevel(avgConfidence);

    // Get next period date
    const lastPeriod = historicalPeriods[historicalPeriods.length - 1];
    const nextDate = getNextPeriodDate(lastPeriod.name);

    return {
      predictedDate: nextDate,
      predictedKPIs: predictions,
      confidence: confidenceLevel,
      trendIndicators,
      confidenceScore: Math.round(avgConfidence * 100),
    };
  } catch (error) {
    console.warn('Predictive analytics failed:', error.message);
    return null;
  }
};

/**
 * Extract unique KPI names from historical periods
 * @private
 */
const extractKPINames = (periods) => {
  const kpiSet = new Set();

  for (const period of periods) {
    if (period.analytics) {
      const analytics = period.analytics;
      // Common KPI names to track
      const kpis = [
        'successRate',
        'satisfactionRate',
        'avgResponseTime',
        'avgResolutionTime',
        'insidePercentage',
        'dataQualityScore',
        'avgConversationLength',
      ];

      kpis.forEach((kpi) => {
        if (analytics[kpi] !== undefined && analytics[kpi] !== null) {
          kpiSet.add(kpi);
        }
      });
    }
  }

  return Array.from(kpiSet);
};

/**
 * Extract values for a specific KPI across all periods
 * @private
 */
const extractKPIValues = (periods, kpiName) => {
  return periods
    .map((period) => {
      const value = period.analytics?.[kpiName];
      if (value === undefined || value === null) return null;

      // Convert percentage strings to numbers
      if (typeof value === 'string' && value.endsWith('%')) {
        return parseInt(value, 10);
      }

      // Handle time durations (e.g., "2.3 hours")
      if (typeof value === 'string') {
        const match = value.match(/^([\d.]+)/);
        return match ? parseFloat(match[1]) : null;
      }

      return typeof value === 'number' ? value : null;
    })
    .filter((v) => v !== null);
};

/**
 * Exponential smoothing forecast
 * Uses formula: S(t) = alpha * Y(t) + (1 - alpha) * S(t-1)
 * @private
 */
const exponentialSmoothing = (values, alpha = 0.3) => {
  if (values.length === 0) return { nextValue: 0, forecast: [] };

  const forecast = [values[0]]; // First forecast is first value

  for (let i = 1; i < values.length; i++) {
    const smoothed = alpha * values[i] + (1 - alpha) * forecast[i - 1];
    forecast.push(smoothed);
  }

  // Predict next value (one step ahead)
  const nextValue = alpha * values[values.length - 1] + (1 - alpha) * forecast[forecast.length - 1];

  return { nextValue, forecast };
};

/**
 * Detect trend using linear regression
 * @private
 */
const detectTrend = (values) => {
  if (values.length < 2) return 'stable';

  // Calculate slope using least squares method
  const n = values.length;
  const xMean = (n - 1) / 2; // x values are 0, 1, 2, ..., n-1
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = values[i];
    numerator += (x - xMean) * (y - yMean);
    denominator += (x - xMean) * (x - xMean);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Determine trend based on slope
  if (slope > 0.5) return 'increasing';
  if (slope < -0.5) return 'decreasing';
  return 'stable';
};

/**
 * Calculate forecast confidence based on historical variance
 * @private
 */
const calculateForecastConfidence = (values) => {
  if (values.length < 2) return 0.5;

  // Calculate coefficient of variation (std dev / mean)
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0.5;

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / Math.abs(mean);

  // Lower CV = higher confidence (less variability)
  return Math.max(0.3, Math.min(1, 1 - Math.min(cv, 1)));
};

/**
 * Get confidence level label based on score
 * @private
 */
const getConfidenceLevel = (score) => {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
};

/**
 * Format KPI value with appropriate units
 * @private
 */
const formatKPIValue = (value, kpiName) => {
  if (isNaN(value)) return '0';

  // Round to appropriate precision
  let rounded;
  if (kpiName.includes('Percentage') || kpiName.includes('Rate')) {
    rounded = Math.round(value);
    return `${rounded}%`;
  }

  if (kpiName.includes('Time')) {
    rounded = parseFloat(value.toFixed(1));
    return `${rounded} hours`;
  }

  if (kpiName.includes('Length')) {
    rounded = parseFloat(value.toFixed(1));
    return `${rounded} msgs`;
  }

  rounded = Math.round(value);
  return rounded.toString();
};

/**
 * Calculate next period date based on current period name
 * @private
 */
const getNextPeriodDate = (currentPeriodName) => {
  // Try to parse month/year from period name (e.g., "January 2024")
  const match = currentPeriodName.match(/(\w+)\s+(\d{4})/);

  if (match) {
    const monthName = match[1];
    const year = parseInt(match[2], 10);

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthIndex = months.indexOf(monthName);
    if (monthIndex !== -1) {
      const nextMonthIndex = (monthIndex + 1) % 12;
      const nextYear = monthIndex === 11 ? year + 1 : year;
      return `${months[nextMonthIndex]} ${nextYear}`;
    }
  }

  // Fallback: just return a generic next period
  return 'Next Period';
};

/**
 * Validate and ensure minimum data quality for predictions
 * @param {Array} historicalPeriods - Periods to validate
 * @returns {Boolean} Whether data is suitable for prediction
 */
export const isValidForPrediction = (historicalPeriods) => {
  if (!historicalPeriods || historicalPeriods.length < 3) {
    return false;
  }

  // Check if periods have analytics
  return historicalPeriods.every((period) => period.analytics && typeof period.analytics === 'object');
};

/**
 * Calculate prediction accuracy metrics
 * @param {Array} historicalPeriods - Historical periods with actual values
 * @param {Object} predictions - Predicted values
 * @returns {Object} Accuracy metrics
 */
export const calculatePredictionAccuracy = (historicalPeriods, predictions) => {
  const metrics = {
    mape: 0, // Mean Absolute Percentage Error
    mae: 0, // Mean Absolute Error
    accuracy: 0, // Percentage of correct trend directions
  };

  if (!historicalPeriods || !predictions || historicalPeriods.length < 3) {
    return metrics;
  }

  let totalErrors = [];
  let correctTrends = 0;
  let totalTrends = 0;

  for (const [kpiName, predictedValue] of Object.entries(predictions)) {
    const values = extractKPIValues(historicalPeriods, kpiName);

    if (values.length >= 2) {
      // Calculate trend accuracy
      const lastValue = values[values.length - 1];
      const prevValue = values[values.length - 2];
      const actualTrend = lastValue >= prevValue ? 'increasing' : 'decreasing';
      const predictedTrend =
        parseFloat(predictedValue) >= lastValue ? 'increasing' : 'decreasing';

      if (actualTrend === predictedTrend) {
        correctTrends++;
      }
      totalTrends++;

      // Calculate MAPE
      const absError = Math.abs(parseFloat(predictedValue) - lastValue);
      const percentError = Math.abs(lastValue) > 0 ? absError / Math.abs(lastValue) : 0;
      totalErrors.push(percentError);
    }
  }

  if (totalErrors.length > 0) {
    metrics.mape = (totalErrors.reduce((a, b) => a + b, 0) / totalErrors.length) * 100;
  }

  if (totalTrends > 0) {
    metrics.accuracy = (correctTrends / totalTrends) * 100;
  }

  return metrics;
};
