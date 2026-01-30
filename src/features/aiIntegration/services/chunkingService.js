/**
 * CSV Chunking Service
 * Splits CSV data into intelligent chunks: by tenant first, then by time
 */

/**
 * Extract tenant identifier from conversation content
 * @param {Array} messages - Array of messages in a conversation
 * @returns {String} Tenant identifier (name or address)
 */
const extractTenantIdentifier = (messages) => {
  // Look for explicit tenant names (e.g., "Herr/Frau [Name]")
  // This pattern captures when a tenant explicitly provides their name
  const namePattern = /(Herr|Frau|Mr|Ms)\s+([A-Za-zäöüß]+)/i;
  for (const msg of messages) {
    if (msg.Content) {
      const nameMatch = msg.Content.match(namePattern);
      if (nameMatch) {
        const name = nameMatch[2].toLowerCase();
        return `tenant-${name}`;
      }
    }
  }

  // Look for property addresses (most reliable identifier)
  // Captures street addresses provided by tenants
  const addressPattern = /(Badenerstrasse|Im Struppen|Strasse|Str\.)\s+(\d+[a-z]?)/i;
  for (const msg of messages) {
    if (msg.Content) {
      const addressMatch = msg.Content.match(addressPattern);
      if (addressMatch) {
        const address = (addressMatch[1] + '-' + addressMatch[2])
          .toLowerCase()
          .replace(/\s+/g, '-');
        return `property-${address}`;
      }
    }
  }

  // Fallback: use ConversationId as tenant identifier
  // Each conversation represents a unique tenant interaction
  const firstMsg = messages[0];
  if (firstMsg && firstMsg.ConversationId) {
    return `conversation-${firstMsg.ConversationId.substring(0, 8)}`;
  }

  return 'tenant-unknown';
};

/**
 * Group CSV data by tenant
 * @param {Array} csvData - Parsed CSV data
 * @returns {Object} {tenantId: [...messages]}
 */
export const groupDataByTenant = (csvData) => {
  const tenantMap = {};
  const conversationMap = {};

  // First, group by conversation
  csvData.forEach((row) => {
    if (row.ConversationId) {
      if (!conversationMap[row.ConversationId]) {
        conversationMap[row.ConversationId] = [];
      }
      conversationMap[row.ConversationId].push(row);
    }
  });

  // Then, extract tenant from each conversation
  for (const [conversationId, messages] of Object.entries(conversationMap)) {
    const tenantId = extractTenantIdentifier(messages);
    if (!tenantMap[tenantId]) {
      tenantMap[tenantId] = [];
    }
    tenantMap[tenantId].push(...messages);
  }

  return tenantMap;
};

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
    maxDateObj: maxDate,
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
 * Split CSV data into 1-day chunks with enhanced metadata
 * @param {Array} csvData - Parsed CSV data
 * @param {Number} daysPerChunk - Days per chunk (default: 1)
 * @returns {Array} Array of chunks: [{data: [], startDate, endDate, metadata: {...}}, ...]
 */
export const chunkCSVByDays = (csvData, daysPerChunk = 1) => {
  const dateRange = getDateRangeFromCSV(csvData);

  if (!dateRange || dateRange.daySpan <= daysPerChunk) {
    // No chunking needed
    const metadata = generateChunkMetadata(csvData);
    return [
      {
        data: csvData,
        startDate: dateRange?.minDate || null,
        endDate: dateRange?.maxDate || null,
        inquiryCount: csvData.length,
        metadata: metadata,
        isFullPeriod: true,
      },
    ];
  }

  const chunks = [];
  let currentChunkStart = new Date(dateRange.minDateObj);
  let previousChunkData = null;

  while (currentChunkStart < dateRange.maxDateObj) {
    // Calculate chunk end date (7 days later)
    const currentChunkEnd = new Date(currentChunkStart);
    currentChunkEnd.setDate(currentChunkEnd.getDate() + daysPerChunk);

    // Filter CSV rows that fall within this chunk's date range
    const chunkData = csvData.filter((row) => {
      if (!row.TimeSent) return false;
      const rowDate = new Date(row.TimeSent);
      return rowDate >= currentChunkStart && rowDate < currentChunkEnd;
    });

    if (chunkData.length > 0) {
      const metadata = generateChunkMetadata(chunkData, previousChunkData);
      chunks.push({
        data: chunkData,
        startDate: currentChunkStart.toISOString().split('T')[0],
        endDate: new Date(currentChunkEnd.getTime() - 1000).toISOString().split('T')[0],
        inquiryCount: chunkData.length,
        metadata: metadata,
        chunkIndex: chunks.length,
        totalChunks: Math.ceil(dateRange.daySpan / daysPerChunk),
      });
      previousChunkData = chunkData;
    }

    // Move to next chunk
    currentChunkStart = currentChunkEnd;
  }

  return chunks.length > 0
    ? chunks
    : [
        {
          data: csvData,
          startDate: dateRange.minDate,
          endDate: dateRange.maxDate,
          inquiryCount: csvData.length,
          metadata: generateChunkMetadata(csvData),
          isFullPeriod: true,
        },
      ];
};

/**
 * Generate intelligent metadata for a chunk
 * @param {Array} chunkData - CSV data for the chunk
 * @param {Array} previousChunkData - Previous chunk data for comparison
 * @returns {Object} Metadata with insights about the chunk
 */
const generateChunkMetadata = (chunkData, previousChunkData = null) => {
  if (!chunkData || chunkData.length === 0) {
    return {
      peakHour: null,
      busyPeriod: 'Low activity',
      dataQuality: '0%',
      conversationMetrics: {},
      trend: 'unknown',
      anomalies: [],
    };
  }

  // Group by conversation to analyze patterns
  const conversationMap = {};
  chunkData.forEach((row) => {
    if (row.ConversationId) {
      if (!conversationMap[row.ConversationId]) {
        conversationMap[row.ConversationId] = [];
      }
      conversationMap[row.ConversationId].push(row);
    }
  });

  const conversations = Object.values(conversationMap);

  // Find peak hour
  const hourCounts = new Array(24).fill(0);
  chunkData.forEach((row) => {
    if (row.TimeSent) {
      const hour = new Date(row.TimeSent).getHours();
      hourCounts[hour]++;
    }
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourActivity = hourCounts[peakHour];

  // Calculate data quality
  let qualityIssues = 0;
  chunkData.forEach((row) => {
    if (!row.TimeSent || !row.ConversationId || !row.MessageType) {
      qualityIssues++;
    }
  });
  const dataQuality = Math.max(0, 100 - Math.round((qualityIssues / chunkData.length) * 100));

  // Analyze conversation metrics
  let totalConversationLength = 0;
  let shortConversations = 0;
  let longConversations = 0;
  let resolvedConversations = 0;

  conversations.forEach((conv) => {
    totalConversationLength += conv.length;
    if (conv.length <= 2) shortConversations++;
    if (conv.length > 10) longConversations++;
    if (conv.some((msg) => msg.Status === 'resolved' || msg.Status === 'closed')) {
      resolvedConversations++;
    }
  });

  const avgConvLength =
    conversations.length > 0 ? (totalConversationLength / conversations.length).toFixed(1) : 0;
  const successRate =
    conversations.length > 0 ? Math.round((resolvedConversations / conversations.length) * 100) : 0;

  // Determine busy period classification
  let busyPeriod = 'Moderate activity';
  if (peakHourActivity < chunkData.length / 10) busyPeriod = 'Low activity';
  if (peakHourActivity > chunkData.length / 5) busyPeriod = 'High activity';

  // Detect trend compared to previous chunk
  let trend = 'stable';
  if (previousChunkData && previousChunkData.length > 0) {
    const previousAvgConvLength =
      Object.keys(conversationMap).length > 0 ? totalConversationLength / conversations.length : 0;
    if (chunkData.length > previousChunkData.length * 1.2) trend = 'increasing';
    if (chunkData.length < previousChunkData.length * 0.8) trend = 'decreasing';
  }

  // Detect anomalies
  const anomalies = [];
  if (shortConversations > conversations.length * 0.3) {
    anomalies.push(`${shortConversations} short conversations (2 msgs or less)`);
  }
  if (longConversations > conversations.length * 0.1) {
    anomalies.push(`${longConversations} long conversations (10+ msgs)`);
  }
  if (dataQuality < 70) {
    anomalies.push('Low data quality detected');
  }
  if (successRate < 60) {
    anomalies.push(`Low resolution rate: ${successRate}%`);
  }

  return {
    peakHour: peakHour,
    peakHourActivity: peakHourActivity,
    busyPeriod: busyPeriod,
    dataQuality: `${dataQuality}%`,
    dataQualityNumeric: dataQuality,
    conversationMetrics: {
      total: conversations.length,
      avgLength: avgConvLength,
      shortConversations: shortConversations,
      longConversations: longConversations,
      resolvedCount: resolvedConversations,
      successRate: `${successRate}%`,
    },
    trend: trend,
    anomalies: anomalies,
    messageCount: chunkData.length,
    hourlyDistribution: hourCounts
      .map((count, hour) => ({
        hour,
        count,
        percentage: ((count / chunkData.length) * 100).toFixed(1),
      }))
      .filter((h) => h.count > 0),
  };
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
      isWorkingHours: i >= 9 && i < 17,
    })),
    validationIssues: {
      missingDeficiencyType: [],
      missingCostEstimate: [],
      missingReportStatus: [],
      lowConfidenceScore: [],
      highFrustration: [],
      longConversations: [],
      shortConversations: [],
    },
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
  aggregated.insidePercentage =
    aggregated.totalInquiries > 0
      ? ((aggregated.insideWorkingHours / aggregated.totalInquiries) * 100).toFixed(1) + '%'
      : '0%';
  aggregated.outsidePercentage =
    aggregated.totalInquiries > 0
      ? ((aggregated.outsideWorkingHours / aggregated.totalInquiries) * 100).toFixed(1) + '%'
      : '0%';

  // Calculate success rate
  const totalReports = aggregated.successfulReports + aggregated.failedReports;
  aggregated.successRate =
    totalReports > 0
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

  aggregated.deficiencyData = Object.entries(deficiencyMap)
    .map(([name, value]) => ({
      name,
      value,
      percentage:
        aggregated.totalInquiries > 0
          ? ((value / aggregated.totalInquiries) * 100).toFixed(1) + '%'
          : '0%',
    }))
    .sort((a, b) => b.value - a.value);

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
            costs: [],
          };
        }
        costMap[item.name].count += parseInt(item.count) || 0;
        costMap[item.name].totalCost += parseFloat(item.totalCost) || 0;
        costMap[item.name].costs.push(parseFloat(item.avgCost) || 0);
      }
    }
  }

  aggregated.costData = Object.values(costMap).map((item) => ({
    name: item.name,
    count: item.count,
    totalCost: item.totalCost.toFixed(2),
    avgCost:
      item.count > 0
        ? (item.costs.reduce((a, b) => a + b, 0) / item.costs.length).toFixed(2)
        : '0.00',
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
    { name: 'Frustrated', value: aggregated.frustrated, color: '#ef4444' },
  ];

  // Aggregate validation issues
  for (const chunk of chunkResults) {
    if (chunk.analytics.validationIssues) {
      for (const [key, values] of Object.entries(chunk.analytics.validationIssues)) {
        if (Array.isArray(values)) {
          aggregated.validationIssues[key] = [...aggregated.validationIssues[key], ...values];
        }
      }
    }
  }

  // Calculate average metrics (weighted by inquiry count)
  aggregated.avgConversationLength = calculateWeightedAverage(
    chunkResults.map((c) => ({
      value: parseFloat(c.analytics.avgConversationLength) || 0,
      weight: c.inquiryCount,
    }))
  ).toFixed(2);

  aggregated.avgResponseTime =
    calculateWeightedAverage(
      chunkResults.map((c) => ({
        value: c.analytics.avgResponseTime
          ? parseFloat(c.analytics.avgResponseTime.match(/[\d.]+/)?.[0]) || 0
          : 0,
        weight: c.inquiryCount,
      }))
    ).toFixed(2) + 's';

  aggregated.avgResolutionTime = calculateWeightedAverage(
    chunkResults.map((c) => ({
      value: parseFloat(c.analytics.avgResolutionTime) || 0,
      weight: c.inquiryCount,
    }))
  ).toFixed(2);

  aggregated.dataQualityScore =
    calculateWeightedAverage(
      chunkResults.map((c) => ({
        value: parseFloat(c.analytics.dataQualityScore) || 0,
        weight: c.inquiryCount,
      }))
    ).toFixed(0) + '%';

  // Chart data
  aggregated.timeWindowData = [
    { name: 'Working Hours', value: aggregated.insideWorkingHours },
    { name: 'After Hours', value: aggregated.outsideWorkingHours },
  ];

  aggregated.successData = [
    { name: 'Successful', value: aggregated.successfulReports },
    { name: 'Failed', value: aggregated.failedReports },
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

  const weightedSum = items.reduce((sum, item) => sum + (item.value || 0) * (item.weight || 0), 0);
  return weightedSum / totalWeight;
};

/**
 * Create hierarchical chunks: Group by tenant first, then by time (1-day chunks)
 * @param {Array} csvData - Parsed CSV data
 * @param {Number} daysPerChunk - Days per chunk (default: 1 for daily analysis)
 * @returns {Array} Array of tenant chunks with nested daily time chunks
 */
export const chunkCSVByTenantThenTime = (csvData, daysPerChunk = 1) => {
  const tenantData = groupDataByTenant(csvData);
  const tenantChunks = [];

  for (const [tenantId, tenantMessages] of Object.entries(tenantData)) {
    // For each tenant, chunk their data by time
    const timeChunks = chunkCSVByDays(tenantMessages, daysPerChunk);

    // Generate tenant-specific metadata
    const tenantMetadata = generateTenantMetadata(tenantId, tenantMessages);

    tenantChunks.push({
      tenantId: tenantId,
      tenantMetadata: tenantMetadata,
      inquiryCount: tenantMessages.length,
      timeChunks: timeChunks,
      startDate: timeChunks[0]?.startDate,
      endDate: timeChunks[timeChunks.length - 1]?.endDate,
    });
  }

  return tenantChunks.sort((a, b) => b.inquiryCount - a.inquiryCount);
};

/**
 * Generate tenant-specific metadata and profile
 * @param {String} tenantId - Tenant identifier
 * @param {Array} tenantData - All messages for this tenant
 * @returns {Object} Tenant profile with behavior metrics
 */
const generateTenantMetadata = (tenantId, tenantData) => {
  if (!tenantData || tenantData.length === 0) {
    return {
      tenantId,
      conversationCount: 0,
      messageCount: 0,
      issueTypes: [],
      responseTime: null,
      resolutionRate: '0%',
      engagementLevel: 'low',
      riskProfile: 'low',
      recommendedPriority: 'low',
    };
  }

  // Group by conversation
  const conversationMap = {};
  tenantData.forEach((row) => {
    if (row.ConversationId) {
      if (!conversationMap[row.ConversationId]) {
        conversationMap[row.ConversationId] = [];
      }
      conversationMap[row.ConversationId].push(row);
    }
  });

  const conversations = Object.values(conversationMap);
  const messageCount = tenantData.length;

  // Extract issue types
  const issueTypes = new Set();
  const costEstimates = [];
  tenantData.forEach((row) => {
    if (row.Content && row.Content.includes('deficiencyType')) {
      try {
        const parsed = JSON.parse(row.Content);
        if (parsed.deficiencyType) {
          issueTypes.add(parsed.deficiencyType);
        }
        if (parsed.costEstimateCHF) {
          costEstimates.push(parseFloat(parsed.costEstimateCHF));
        }
      } catch (e) {
        // Skip parsing errors
      }
    }
  });

  // Calculate response metrics
  let totalResponseTime = 0;
  let responseCount = 0;
  let resolvedCount = 0;

  conversations.forEach((conv) => {
    const sortedMsgs = conv.sort((a, b) => new Date(a.TimeSent) - new Date(b.TimeSent));

    // Calculate response time (first to second message)
    if (sortedMsgs.length > 1 && sortedMsgs[0].TimeSent && sortedMsgs[1].TimeSent) {
      const firstTime = new Date(sortedMsgs[0].TimeSent).getTime();
      const secondTime = new Date(sortedMsgs[1].TimeSent).getTime();
      const responseTime = (secondTime - firstTime) / 1000; // seconds
      totalResponseTime += responseTime;
      responseCount++;
    }

    // Check if resolved
    if (conv.some((msg) => msg.Status === 'resolved' || msg.Status === 'closed')) {
      resolvedCount++;
    }
  });

  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
  const resolutionRate =
    conversations.length > 0 ? Math.round((resolvedCount / conversations.length) * 100) : 0;

  // Determine engagement level
  let engagementLevel = 'low';
  if (conversations.length > 3) engagementLevel = 'medium';
  if (conversations.length > 7) engagementLevel = 'high';
  if (conversations.length > 15) engagementLevel = 'very-high';

  // Determine risk profile
  let riskProfile = 'low';
  if (resolutionRate < 50) riskProfile = 'high';
  else if (resolutionRate < 70) riskProfile = 'medium';
  else if (conversations.length > 5 && resolutionRate > 80) riskProfile = 'low';

  // Determine priority
  let recommendedPriority = 'low';
  if (riskProfile === 'high') recommendedPriority = 'critical';
  else if (riskProfile === 'medium' || engagementLevel === 'high') recommendedPriority = 'medium';

  return {
    tenantId,
    displayName: tenantId.replace(/^(tenant|property|conversation)-/, '').replace(/-/g, ' '),
    conversationCount: conversations.length,
    messageCount: messageCount,
    avgMessagesPerConversation: (messageCount / conversations.length).toFixed(1),
    issueTypes: Array.from(issueTypes),
    avgResponseTime: avgResponseTime > 0 ? `${avgResponseTime}s` : 'N/A',
    resolutionRate: `${resolutionRate}%`,
    resolvedCount: resolvedCount,
    unResolvedCount: conversations.length - resolvedCount,
    totalCostEstimated:
      costEstimates.length > 0
        ? `CHF ${costEstimates.reduce((a, b) => a + b, 0).toFixed(2)}`
        : 'N/A',
    engagementLevel: engagementLevel,
    riskProfile: riskProfile,
    recommendedPriority: recommendedPriority,
    communicationStyle: determineCommStyle(conversations),
    satisfactionIndicators: determineSatisfaction(conversations),
  };
};

/**
 * Determine tenant communication style from patterns
 * @param {Array} conversations - Conversations for tenant
 * @returns {Object} Communication style profile
 */
const determineCommStyle = (conversations) => {
  let avgLength = 0;
  let shortConvs = 0;
  let longConvs = 0;

  conversations.forEach((conv) => {
    avgLength += conv.length;
    if (conv.length <= 2) shortConvs++;
    if (conv.length > 10) longConvs++;
  });

  avgLength = avgLength / conversations.length;

  return {
    averageConversationLength: avgLength.toFixed(1),
    isDetailOriented: avgLength > 6,
    isDirective: shortConvs > conversations.length * 0.4,
    isEngaging: longConvs > conversations.length * 0.2,
  };
};

/**
 * Determine tenant satisfaction indicators
 * @param {Array} conversations - Conversations for tenant
 * @returns {Object} Satisfaction indicators
 */
const determineSatisfaction = (conversations) => {
  let resolvedCount = 0;
  let urgentIssuesCount = 0;
  let escalationsCount = 0;

  conversations.forEach((conv) => {
    if (conv.some((msg) => msg.Status === 'resolved' || msg.Status === 'closed')) {
      resolvedCount++;
    }
    if (
      conv.some(
        (msg) =>
          msg.Content && (msg.Content.includes('Emergency') || msg.Content.includes('urgent'))
      )
    ) {
      urgentIssuesCount++;
    }
    if (conv.some((msg) => msg.Content && msg.Content.includes('Hausverwaltung'))) {
      escalationsCount++;
    }
  });

  const resolutionSuccess = (resolvedCount / conversations.length) * 100;
  let satisfaction = 'neutral';

  if (resolutionSuccess > 80 && escalationsCount === 0) satisfaction = 'satisfied';
  if (resolutionSuccess < 50 || escalationsCount > conversations.length * 0.5)
    satisfaction = 'at-risk';

  return {
    estimatedSatisfaction: satisfaction,
    urgentIssuesReported: urgentIssuesCount,
    escalationsRequired: escalationsCount,
    resolutionSuccess: resolutionSuccess.toFixed(0) + '%',
  };
};

/**
 * Group chunk results by month
 * @param {Array} chunkResults - Array of {startDate, endDate, analytics, inquiryCount}
 * @returns {Array} Array of monthly groups: [{monthYear, startDate, endDate, chunks: []}]
 */
export const groupChunksByMonth = (chunkResults) => {
  if (!chunkResults || chunkResults.length === 0) {
    return [];
  }

  const monthMap = {};

  for (const chunk of chunkResults) {
    const startDate = new Date(chunk.startDate);
    const monthYear = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap[monthYear]) {
      monthMap[monthYear] = {
        monthYear,
        startDate: chunk.startDate,
        endDate: chunk.endDate,
        chunks: [],
      };
    }

    // Update endDate if this chunk extends further
    if (chunk.endDate > monthMap[monthYear].endDate) {
      monthMap[monthYear].endDate = chunk.endDate;
    }

    monthMap[monthYear].chunks.push(chunk);
  }

  // Sort by month and return as array
  return Object.values(monthMap).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
};
