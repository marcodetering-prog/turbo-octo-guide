/**
 * CSV Chunking Service
 * Splits CSV data into 7-day segments for AI analysis
 */

/**
 * Extract date range from CSV data
 * @param {Array} csvData - Parsed CSV data
 * @returns {Object} {minDate, maxDate, daySpan}
 */
export const getDateRangeFromCSV = (csvData) => {
  if (!csvData || csvData.length === 0) {
    return null;
  }

  let minDate = null;
  let maxDate = null;

  for (const row of csvData) {
    if (!row.TimeSent) continue;

    const date = new Date(row.TimeSent);
    if (isNaN(date.getTime())) continue;

    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
  }

  if (!minDate || !maxDate) {
    return null;
  }

  const daySpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  return {
    minDate: minDate.toISOString().split('T')[0],
    maxDate: maxDate.toISOString().split('T')[0],
    daySpan,
    minDateObj: minDate,
    maxDateObj: maxDate
  };
};

/**
 * Check if CSV data spans more than 7 days
 * @param {Array} csvData - Parsed CSV data
 * @returns {Boolean} true if data spans > 7 days
 */
export const needsChunking = (csvData) => {
  const dateRange = getDateRangeFromCSV(csvData);
  return dateRange && dateRange.daySpan > 7;
};

/**
 * Split CSV data into 7-day chunks
 * @param {Array} csvData - Parsed CSV data
 * @param {Number} daysPerChunk - Days per chunk (default: 7)
 * @returns {Array} Array of chunks: [{data: [], startDate, endDate}, ...]
 */
export const chunkCSVByDays = (csvData, daysPerChunk = 7) => {
  const dateRange = getDateRangeFromCSV(csvData);

  if (!dateRange || dateRange.daySpan <= daysPerChunk) {
    // No chunking needed
    return [{
      data: csvData,
      startDate: dateRange?.minDate || null,
      endDate: dateRange?.maxDate || null,
      inquiryCount: csvData.length
    }];
  }

  const chunks = [];
  let currentChunkStart = new Date(dateRange.minDateObj);

  while (currentChunkStart < dateRange.maxDateObj) {
    // Calculate chunk end date (7 days later)
    const currentChunkEnd = new Date(currentChunkStart);
    currentChunkEnd.setDate(currentChunkEnd.getDate() + daysPerChunk);

    // Filter CSV rows that fall within this chunk's date range
    const chunkData = csvData.filter(row => {
      if (!row.TimeSent) return false;
      const rowDate = new Date(row.TimeSent);
      return rowDate >= currentChunkStart && rowDate < currentChunkEnd;
    });

    if (chunkData.length > 0) {
      chunks.push({
        data: chunkData,
        startDate: currentChunkStart.toISOString().split('T')[0],
        endDate: new Date(currentChunkEnd.getTime() - 1000).toISOString().split('T')[0],
        inquiryCount: chunkData.length
      });
    }

    // Move to next chunk
    currentChunkStart = currentChunkEnd;
  }

  return chunks.length > 0 ? chunks : [{
    data: csvData,
    startDate: dateRange.minDate,
    endDate: dateRange.maxDate,
    inquiryCount: csvData.length
  }];
};

/**
 * Aggregate analytics from multiple chunks into single result
 * @param {Array} chunkResults - Array of {analytics, inquiryCount, startDate, endDate}
 * @returns {Object} Aggregated analytics
 */
export const aggregateChunkAnalytics = (chunkResults) => {
  if (!chunkResults || chunkResults.length === 0) {
    return null;
  }

  if (chunkResults.length === 1) {
    return chunkResults[0].analytics;
  }

  const totalInquiries = chunkResults.reduce((sum, c) => sum + (c.inquiryCount || 0), 0);

  // Initialize aggregated object
  const aggregated = {
    // Count metrics - sum them
    totalInquiries: 0,
    insideWorkingHours: 0,
    outsideWorkingHours: 0,
    successfulReports: 0,
    failedReports: 0,
    frustrated: 0,
    neutral: 0,
    satisfied: 0,
    totalIssues: 0,

    // Array metrics - merge them
    deficiencyData: [],
    costData: [],
    satisfactionData: [],
    hourlyData: new Array(24).fill(null).map((_, i) => ({
      hour: `${i}:00`,
      count: 0,
      isWorkingHours: i >= 9 && i < 17
    })),
    validationIssues: {
      missingDeficiencyType: [],
      missingCostEstimate: [],
      missingReportStatus: [],
      lowConfidenceScore: [],
      highFrustration: [],
      longConversations: [],
      shortConversations: []
    }
  };

  // Sum count metrics
  for (const chunk of chunkResults) {
    const analytics = chunk.analytics;
    aggregated.totalInquiries += analytics.totalInquiries || 0;
    aggregated.insideWorkingHours += analytics.insideWorkingHours || 0;
    aggregated.outsideWorkingHours += analytics.outsideWorkingHours || 0;
    aggregated.successfulReports += analytics.successfulReports || 0;
    aggregated.failedReports += analytics.failedReports || 0;
    aggregated.frustrated += analytics.frustrated || 0;
    aggregated.neutral += analytics.neutral || 0;
    aggregated.satisfied += analytics.satisfied || 0;
    aggregated.totalIssues += analytics.totalIssues || 0;
  }

  // Recalculate percentages
  aggregated.insidePercentage = aggregated.totalInquiries > 0
    ? ((aggregated.insideWorkingHours / aggregated.totalInquiries) * 100).toFixed(1) + '%'
    : '0%';
  aggregated.outsidePercentage = aggregated.totalInquiries > 0
    ? ((aggregated.outsideWorkingHours / aggregated.totalInquiries) * 100).toFixed(1) + '%'
    : '0%';

  // Calculate success rate
  const totalReports = aggregated.successfulReports + aggregated.failedReports;
  aggregated.successRate = totalReports > 0
    ? ((aggregated.successfulReports / totalReports) * 100).toFixed(1) + '%'
    : 'N/A';

  // Aggregate deficiency data
  const deficiencyMap = {};
  for (const chunk of chunkResults) {
    if (chunk.analytics.deficiencyData) {
      for (const item of chunk.analytics.deficiencyData) {
        if (!deficiencyMap[item.name]) {
          deficiencyMap[item.name] = 0;
        }
        deficiencyMap[item.name] += parseInt(item.value) || 0;
      }
    }
  }

  aggregated.deficiencyData = Object.entries(deficiencyMap).map(([name, value]) => ({
    name,
    value,
    percentage: aggregated.totalInquiries > 0
      ? ((value / aggregated.totalInquiries) * 100).toFixed(1) + '%'
      : '0%'
  })).sort((a, b) => b.value - a.value);

  // Aggregate cost data
  const costMap = {};
  for (const chunk of chunkResults) {
    if (chunk.analytics.costData) {
      for (const item of chunk.analytics.costData) {
        if (!costMap[item.name]) {
          costMap[item.name] = {
            name: item.name,
            totalCost: 0,
            count: 0,
            costs: []
          };
        }
        costMap[item.name].count += parseInt(item.count) || 0;
        costMap[item.name].totalCost += parseFloat(item.totalCost) || 0;
        costMap[item.name].costs.push(parseFloat(item.avgCost) || 0);
      }
    }
  }

  aggregated.costData = Object.values(costMap).map(item => ({
    name: item.name,
    count: item.count,
    totalCost: item.totalCost.toFixed(2),
    avgCost: item.count > 0
      ? (item.costs.reduce((a, b) => a + b, 0) / item.costs.length).toFixed(2)
      : '0.00'
  }));

  // Aggregate hourly data
  for (const chunk of chunkResults) {
    if (chunk.analytics.hourlyData) {
      for (const hourData of chunk.analytics.hourlyData) {
        const hourIndex = parseInt(hourData.hour) || 0;
        if (aggregated.hourlyData[hourIndex]) {
          aggregated.hourlyData[hourIndex].count += parseInt(hourData.count) || 0;
        }
      }
    }
  }

  // Aggregate satisfaction data
  aggregated.satisfactionData = [
    { name: 'Satisfied', value: aggregated.satisfied, color: '#10b981' },
    { name: 'Neutral', value: aggregated.neutral, color: '#f59e0b' },
    { name: 'Frustrated', value: aggregated.frustrated, color: '#ef4444' }
  ];

  // Aggregate validation issues
  for (const chunk of chunkResults) {
    if (chunk.analytics.validationIssues) {
      for (const [key, values] of Object.entries(chunk.analytics.validationIssues)) {
        if (Array.isArray(values)) {
          aggregated.validationIssues[key] = [
            ...aggregated.validationIssues[key],
            ...values
          ];
        }
      }
    }
  }

  // Calculate average metrics (weighted by inquiry count)
  aggregated.avgConversationLength = calculateWeightedAverage(
    chunkResults.map(c => ({
      value: parseFloat(c.analytics.avgConversationLength) || 0,
      weight: c.inquiryCount
    }))
  ).toFixed(2);

  aggregated.avgResponseTime = calculateWeightedAverage(
    chunkResults.map(c => ({
      value: c.analytics.avgResponseTime
        ? parseFloat(c.analytics.avgResponseTime.match(/[\d.]+/)?.[0]) || 0
        : 0,
      weight: c.inquiryCount
    }))
  ).toFixed(2) + 's';

  aggregated.avgResolutionTime = calculateWeightedAverage(
    chunkResults.map(c => ({
      value: parseFloat(c.analytics.avgResolutionTime) || 0,
      weight: c.inquiryCount
    }))
  ).toFixed(2);

  aggregated.dataQualityScore = calculateWeightedAverage(
    chunkResults.map(c => ({
      value: parseFloat(c.analytics.dataQualityScore) || 0,
      weight: c.inquiryCount
    }))
  ).toFixed(0) + '%';

  // Chart data
  aggregated.timeWindowData = [
    { name: 'Working Hours', value: aggregated.insideWorkingHours },
    { name: 'After Hours', value: aggregated.outsideWorkingHours }
  ];

  aggregated.successData = [
    { name: 'Successful', value: aggregated.successfulReports },
    { name: 'Failed', value: aggregated.failedReports }
  ];

  return aggregated;
};

/**
 * Calculate weighted average from array of {value, weight} objects
 * @param {Array} items - Array of {value: number, weight: number}
 * @returns {Number} Weighted average
 */
const calculateWeightedAverage = (items) => {
  if (!items || items.length === 0) return 0;

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = items.reduce((sum, item) => sum + ((item.value || 0) * (item.weight || 0)), 0);
  return weightedSum / totalWeight;
};
