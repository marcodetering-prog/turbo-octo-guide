/**
 * NLP-based KPI Extraction Service
 * Extracts KPIs directly from conversation text using traditional NLP techniques
 * No external API calls required - works entirely client-side
 */

/**
 * Issue category keywords for pattern matching
 */
const ISSUE_KEYWORDS = {
  plumbing: [
    'water',
    'leak',
    'pipe',
    'drain',
    'faucet',
    'toilet',
    'shower',
    'sink',
    'plumb',
    'sewage',
  ],
  heating: [
    'heat',
    'warm',
    'temperature',
    'radiator',
    'thermostat',
    'cold',
    'furnace',
    'boiler',
    'hvac',
  ],
  electrical: [
    'electric',
    'power',
    'light',
    'socket',
    'outlet',
    'wire',
    'circuit',
    'breaker',
    'voltage',
  ],
  appliances: [
    'fridge',
    'refrigerator',
    'oven',
    'stove',
    'microwave',
    'dishwasher',
    'washer',
    'dryer',
    'appliance',
  ],
  maintenance: ['maintain', 'maintain', 'clean', 'repair', 'fix', 'service', 'inspect'],
  damage: [
    'damage',
    'broken',
    'crack',
    'hole',
    'stain',
    'mold',
    'mildew',
    'paint',
    'wall',
  ],
  safety: ['safety', 'hazard', 'risk', 'dangerous', 'accident', 'injury', 'fire'],
};

/**
 * Satisfaction keywords
 */
const SATISFACTION_KEYWORDS = {
  positive: [
    'great',
    'excellent',
    'good',
    'happy',
    'satisfied',
    'pleased',
    'wonderful',
    'fantastic',
    'amazing',
    'perfect',
    'thanks',
    'thank you',
    'appreciate',
    'love',
  ],
  negative: [
    'bad',
    'terrible',
    'awful',
    'unhappy',
    'frustrated',
    'angry',
    'disappointed',
    'upset',
    'poor',
    'hate',
    'complaint',
    'problem',
    'issue',
  ],
  neutral: ['ok', 'okay', 'alright', 'average', 'normal', 'standard'],
};

/**
 * Extract KPIs from conversations using NLP techniques
 * @param {Array} inquiries - Array of conversations
 * @returns {Object} Extracted KPI data
 */
export const extractKpisWithNLP = (inquiries) => {
  if (!inquiries || inquiries.length === 0) {
    return getEmptyKpiResults();
  }

  const results = {
    totalConversations: inquiries.length,
    conversationAnalysis: [],
    kpiMetrics: {},
    topIssues: [],
    satisfactionBreakdown: { positive: 0, neutral: 0, negative: 0 },
    averageSentimentScore: 0,
    issueDistribution: {},
    responseQualityMetrics: {},
  };

  let totalSentimentScore = 0;

  // Analyze each conversation
  for (const conversation of inquiries) {
    const tenantMessages = conversation.filter(
      (msg) => msg.MessageType === '3' || msg.MessageType === 3
    );

    if (tenantMessages.length === 0) continue;

    const conversationText = tenantMessages
      .map((msg) => msg.Content || '')
      .join(' ')
      .toLowerCase();

    // Extract sentiment
    const sentiment = extractSentiment(conversationText);
    totalSentimentScore += sentiment.score;

    // Count satisfaction
    if (sentiment.label === 'POSITIVE') {
      results.satisfactionBreakdown.positive++;
    } else if (sentiment.label === 'NEGATIVE') {
      results.satisfactionBreakdown.negative++;
    } else {
      results.satisfactionBreakdown.neutral++;
    }

    // Extract issues
    const issues = extractIssueCategories(conversationText);
    const responseTime = estimateResponseTime(tenantMessages);
    const resolutionStatus = assessResolutionStatus(conversationText);

    results.conversationAnalysis.push({
      conversationId: conversation[0].ConversationId,
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      issues: issues,
      primaryIssue: issues.length > 0 ? issues[0].category : 'general',
      responseTime,
      resolved: resolutionStatus.resolved,
      conversationLength: tenantMessages.length,
      wordCount: conversationText.split(/\s+/).length,
    });

    // Update issue distribution
    issues.forEach((issue) => {
      results.issueDistribution[issue.category] =
        (results.issueDistribution[issue.category] || 0) + 1;
    });
  }

  // Calculate aggregated metrics
  results.averageSentimentScore = totalSentimentScore / results.totalConversations;

  // Extract top issues
  results.topIssues = Object.entries(results.issueDistribution)
    .map(([category, count]) => ({
      category,
      count,
      percentage: ((count / results.totalConversations) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate KPI metrics
  results.kpiMetrics = calculateKpiMetrics(results.conversationAnalysis);

  return results;
};

/**
 * Extract sentiment from text using keyword matching
 * @private
 */
const extractSentiment = (text) => {
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;

  // Count sentiment keywords
  SATISFACTION_KEYWORDS.positive.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    positiveScore += matches ? matches.length * 2 : 0;
  });

  SATISFACTION_KEYWORDS.negative.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    negativeScore += matches ? matches.length * 2 : 0;
  });

  SATISFACTION_KEYWORDS.neutral.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    neutralScore += matches ? matches.length : 0;
  });

  // Determine sentiment
  let label = 'NEUTRAL';
  let score = 0;

  if (positiveScore > negativeScore && positiveScore > 0) {
    label = 'POSITIVE';
    score = Math.min(1, positiveScore / 10);
  } else if (negativeScore > positiveScore && negativeScore > 0) {
    label = 'NEGATIVE';
    score = Math.min(1, negativeScore / 10) * -1;
  } else {
    score = neutralScore > 0 ? 0.5 : 0;
  }

  return { label, score };
};

/**
 * Extract issue categories from text
 * @private
 */
const extractIssueCategories = (text) => {
  const issues = [];
  const issueMatches = {};

  // Count keyword matches per category
  Object.entries(ISSUE_KEYWORDS).forEach(([category, keywords]) => {
    let matchCount = 0;

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      matchCount += matches ? matches.length : 0;
    });

    if (matchCount > 0) {
      issueMatches[category] = matchCount;
    }
  });

  // Sort by match count and return top issues
  Object.entries(issueMatches)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      issues.push({
        category,
        confidence: Math.min(1, count / 5), // Normalize confidence
        matchCount: count,
      });
    });

  return issues;
};

/**
 * Estimate response time based on message patterns
 * @private
 */
const estimateResponseTime = (messages) => {
  // Simple heuristic: average gap between messages
  if (messages.length < 2) return 0;

  // Assume consecutive messages are responses to previous ones
  // This is a simplification - real world would use timestamps
  return Math.ceil(messages.length / 2); // Rough estimate
};

/**
 * Assess if issue was resolved
 * @private
 */
const assessResolutionStatus = (text) => {
  const resolutionKeywords = [
    'resolved',
    'fixed',
    'solved',
    'working',
    'done',
    'completed',
    'thank you',
    'thanks',
    'appreciate',
  ];
  const unresolvedKeywords = [
    'still broken',
    'not fixed',
    'still waiting',
    'still have issue',
    'problem remains',
  ];

  const resolutionScore = resolutionKeywords.filter((kw) =>
    new RegExp(`\\b${kw}\\b`, 'i').test(text)
  ).length;

  const unresolvedScore = unresolvedKeywords.filter((kw) =>
    new RegExp(kw, 'i').test(text)
  ).length;

  return {
    resolved: resolutionScore > unresolvedScore,
    confidence: Math.min(
      1,
      Math.max(resolutionScore, unresolvedScore) / 3
    ),
  };
};

/**
 * Calculate KPI metrics from conversation analysis
 * @private
 */
const calculateKpiMetrics = (conversationAnalysis) => {
  const metrics = {
    totalInquiries: conversationAnalysis.length,
    satisfactionRate: '0%',
    avgConversationLength: 0,
    resolutionRate: '0%',
    averageResponseTime: 0,
    avgWordCount: 0,
  };

  if (conversationAnalysis.length === 0) return metrics;

  // Calculate satisfaction rate
  const positiveCount = conversationAnalysis.filter(
    (c) => c.sentiment === 'POSITIVE'
  ).length;
  metrics.satisfactionRate = `${Math.round(
    (positiveCount / conversationAnalysis.length) * 100
  )}%`;

  // Calculate resolution rate
  const resolvedCount = conversationAnalysis.filter((c) => c.resolved).length;
  metrics.resolutionRate = `${Math.round(
    (resolvedCount / conversationAnalysis.length) * 100
  )}%`;

  // Calculate averages
  metrics.avgConversationLength = (
    conversationAnalysis.reduce((sum, c) => sum + c.conversationLength, 0) /
    conversationAnalysis.length
  ).toFixed(1);

  metrics.avgWordCount = (
    conversationAnalysis.reduce((sum, c) => sum + c.wordCount, 0) /
    conversationAnalysis.length
  ).toFixed(0);

  metrics.averageResponseTime = (
    conversationAnalysis.reduce((sum, c) => sum + c.responseTime, 0) /
    conversationAnalysis.length
  ).toFixed(1);

  return metrics;
};

/**
 * Extract urgency level from text
 * @param {string} text - Conversation text
 * @returns {string} Urgency level: 'high', 'medium', 'low'
 */
export const extractUrgency = (text) => {
  const lowercaseText = text.toLowerCase();

  const urgentKeywords = [
    'urgent',
    'emergency',
    'immediately',
    'asap',
    'critical',
    'severe',
    'danger',
  ];
  const mediumKeywords = ['soon', 'need', 'want', 'require', 'important'];

  const urgentMatches = urgentKeywords.filter((kw) =>
    new RegExp(`\\b${kw}\\b`, 'i').test(lowercaseText)
  ).length;

  const mediumMatches = mediumKeywords.filter((kw) =>
    new RegExp(`\\b${kw}\\b`, 'i').test(lowercaseText)
  ).length;

  if (urgentMatches > 0) return 'high';
  if (mediumMatches > 0) return 'medium';
  return 'low';
};

/**
 * Extract specific entities from text (simple NER)
 * @param {string} text - Conversation text
 * @returns {Object} Extracted entities
 */
export const extractEntities = (text) => {
  const entities = {
    locations: [],
    measurements: [],
    timeReferences: [],
  };

  // Extract room/location mentions
  const locationKeywords = ['room', 'kitchen', 'bathroom', 'bedroom', 'living', 'hallway'];
  locationKeywords.forEach((loc) => {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(text)) {
      entities.locations.push(loc);
    }
  });

  // Extract measurements
  const measurementPattern = /\d+\s?(cm|inches|feet|ft|meters|m|celsius|fahrenheit|°c|°f)/gi;
  const measurements = text.match(measurementPattern);
  if (measurements) {
    entities.measurements = measurements;
  }

  // Extract time references
  const timePattern = /\b(today|tomorrow|yesterday|this week|this month|asap|urgent)\b/gi;
  const timeRefs = text.match(timePattern);
  if (timeRefs) {
    entities.timeReferences = timeRefs.map((t) => t.toLowerCase());
  }

  return entities;
};

/**
 * Get empty KPI results template
 * @private
 */
const getEmptyKpiResults = () => ({
  totalConversations: 0,
  conversationAnalysis: [],
  kpiMetrics: {
    totalInquiries: 0,
    satisfactionRate: '0%',
    avgConversationLength: 0,
    resolutionRate: '0%',
    averageResponseTime: 0,
    avgWordCount: 0,
  },
  topIssues: [],
  satisfactionBreakdown: { positive: 0, neutral: 0, negative: 0 },
  averageSentimentScore: 0,
  issueDistribution: {},
  responseQualityMetrics: {},
});

/**
 * Compare NLP results with baseline (for testing)
 * @param {Object} nlpResults - Results from NLP extraction
 * @param {Object} baselineResults - Baseline results to compare against
 * @returns {Object} Comparison metrics
 */
export const compareResults = (nlpResults, baselineResults) => {
  return {
    satisfactionRateMatch: nlpResults.kpiMetrics.satisfactionRate === baselineResults.satisfactionRate,
    resolutionRateMatch: nlpResults.kpiMetrics.resolutionRate === baselineResults.successRate,
    topIssuesOverlap: calculateOverlap(
      nlpResults.topIssues.map((i) => i.category),
      baselineResults.topCategories || []
    ),
    averageConversationLengthMatch:
      Math.abs(
        parseFloat(nlpResults.kpiMetrics.avgConversationLength) -
          baselineResults.avgConversationLength
      ) < 1,
  };
};

/**
 * Calculate overlap between two arrays
 * @private
 */
const calculateOverlap = (arr1, arr2) => {
  const matches = arr1.filter((item) => arr2.includes(item)).length;
  return matches / Math.max(arr1.length, arr2.length, 1);
};
