/**
 * ML Analytics Service
 * Orchestrates all ML features (sentiment, topic modeling, context enhancement, predictions)
 * and integrates them into the analytics pipeline
 */

import { analyzeSentiment } from './sentimentService';
import { extractTopics } from './topicModelingService';
import { enhanceContext } from './contextEnhancementService';
import { predictNextPeriod } from './predictiveAnalyticsService';

/**
 * Process chunk with all enabled ML features in parallel
 * @param {Array} chunkData - CSV data for the chunk
 * @param {Array} inquiries - Parsed inquiries for the chunk
 * @param {Object} mlConfig - ML configuration with enabled features
 * @returns {Promise<Object>} ML insights
 */
export const processChunkWithML = async (chunkData, inquiries, mlConfig) => {
  const results = {
    sentiment: null,
    topics: null,
    contextEnhancement: null,
    predictions: null,
    errors: [],
  };

  if (!mlConfig || !mlConfig.enabled) {
    return results;
  }

  // Prepare task list for parallel execution
  const tasks = [];

  if (mlConfig.sentiment?.enabled && mlConfig.sentiment?.apiKey) {
    tasks.push(
      processChunkWithML.analyzeSentimentTask(inquiries, mlConfig.sentiment).then((result) => ({
        type: 'sentiment',
        result,
      }))
    );
  }

  if (mlConfig.topicModeling?.enabled && mlConfig.topicModeling?.apiKey) {
    tasks.push(
      processChunkWithML.extractTopicsTask(inquiries, mlConfig.topicModeling).then((result) => ({
        type: 'topics',
        result,
      }))
    );
  }

  if (mlConfig.contextEnhancement?.enabled && mlConfig.contextEnhancement?.apiKey) {
    tasks.push(
      processChunkWithML.enhanceContextTask(inquiries, mlConfig.contextEnhancement).then(
        (result) => ({
          type: 'contextEnhancement',
          result,
        })
      )
    );
  }

  if (mlConfig.predictiveAnalytics?.enabled) {
    // Note: Predictions require historical periods, handled separately
    // For chunk-level processing, we skip this
  }

  // Run all ML tasks in parallel
  if (tasks.length > 0) {
    const outcomes = await Promise.allSettled(tasks);

    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        const { type, result } = outcome.value;
        results[type] = result;
      } else {
        results.errors.push({
          feature: outcome.reason?.feature || 'unknown',
          error: outcome.reason?.message || String(outcome.reason),
        });
      }
    });
  }

  return results;
};

/**
 * Sentiment analysis task
 */
processChunkWithML.analyzeSentimentTask = async (inquiries, config) => {
  return analyzeSentiment(inquiries, config);
};

/**
 * Topic extraction task
 */
processChunkWithML.extractTopicsTask = async (inquiries, config) => {
  return extractTopics(inquiries, config);
};

/**
 * Context enhancement task
 */
processChunkWithML.enhanceContextTask = async (inquiries, config) => {
  return enhanceContext(inquiries, config);
};

/**
 * Enhance analytics with ML insights
 * Merges ML-derived insights into the base analytics object
 * @param {Object} baseAnalytics - Original calculated analytics
 * @param {Object} mlInsights - ML-generated insights
 * @returns {Object} Enhanced analytics with ML data
 */
export const enhanceAnalyticsWithML = (baseAnalytics, mlInsights) => {
  if (!mlInsights || Object.values(mlInsights).every((v) => v === null)) {
    return baseAnalytics;
  }

  const enhanced = { ...baseAnalytics };

  // Override satisfaction/frustration rates with ML sentiment if available
  if (mlInsights.sentiment) {
    const sentiment = mlInsights.sentiment;
    if (sentiment.aggregatedSatisfactionRate) {
      enhanced.satisfactionRate = sentiment.aggregatedSatisfactionRate;
    }
    if (sentiment.aggregatedFrustrationRate) {
      enhanced.frustrationRate = sentiment.aggregatedFrustrationRate;
    }
  }

  // Add comprehensive ML insights
  enhanced.mlInsights = {
    sentiment: mlInsights.sentiment || null,
    topics: mlInsights.topics || null,
    contextClusters: mlInsights.contextEnhancement?.clusters || null,
    semanticSimilarity: mlInsights.contextEnhancement?.similarityScore || null,
    predictions: mlInsights.predictions || null,
    processingErrors: mlInsights.errors || [],
  };

  return enhanced;
};

/**
 * Aggregate ML insights from multiple chunks into period-level insights
 * @param {Array<Object>} mlInsightsArray - Array of ML insights from each chunk
 * @returns {Object} Aggregated ML insights
 */
export const aggregateMLInsights = (mlInsightsArray) => {
  if (!mlInsightsArray || mlInsightsArray.length === 0) {
    return null;
  }

  const aggregated = {
    sentiment: null,
    topics: null,
    contextClusters: null,
    semanticSimilarity: null,
    predictions: null,
    processingErrors: [],
  };

  // Aggregate sentiment data
  const sentiments = mlInsightsArray.filter((m) => m.sentiment).map((m) => m.sentiment);
  if (sentiments.length > 0) {
    aggregated.sentiment = aggregateSentimentInsights(sentiments);
  }

  // Aggregate topic data
  const allTopics = mlInsightsArray.filter((m) => m.topics).map((m) => m.topics);
  if (allTopics.length > 0) {
    aggregated.topics = aggregateTopicInsights(allTopics);
  }

  // Merge context clusters
  const contextData = mlInsightsArray
    .filter((m) => m.contextEnhancement)
    .map((m) => m.contextEnhancement);
  if (contextData.length > 0) {
    aggregated.contextClusters = mergeContextClusters(contextData);
    aggregated.semanticSimilarity = calculateAverageSemanticSimilarity(contextData);
  }

  // Collect all errors
  mlInsightsArray.forEach((m) => {
    if (m.processingErrors && m.processingErrors.length > 0) {
      aggregated.processingErrors.push(...m.processingErrors);
    }
  });

  return aggregated;
};

/**
 * Aggregate sentiment insights across chunks
 * @private
 */
const aggregateSentimentInsights = (sentiments) => {
  let totalConversations = 0;
  let totalPositive = 0;
  let totalNegative = 0;
  const allConversationSentiments = [];

  sentiments.forEach((sentiment) => {
    if (sentiment.sentimentBreakdown) {
      const positiveCount = sentiment.sentimentBreakdown.positive || 0;
      const negativeCount = sentiment.sentimentBreakdown.negative || 0;
      const neutralCount = sentiment.sentimentBreakdown.neutral || 0;
      const chunkTotal = positiveCount + negativeCount + neutralCount;

      totalConversations += chunkTotal;
      totalPositive += positiveCount;
      totalNegative += negativeCount;
    }

    if (sentiment.conversationSentiments) {
      allConversationSentiments.push(...sentiment.conversationSentiments);
    }
  });

  return {
    aggregatedSatisfactionRate:
      totalConversations > 0 ? `${Math.round((totalPositive / totalConversations) * 100)}%` : '0%',
    aggregatedFrustrationRate:
      totalConversations > 0 ? `${Math.round((totalNegative / totalConversations) * 100)}%` : '0%',
    sentimentBreakdown: {
      positive: totalPositive,
      neutral: totalConversations - totalPositive - totalNegative,
      negative: totalNegative,
    },
    conversationSentiments: allConversationSentiments,
  };
};

/**
 * Aggregate topic insights across chunks
 * @private
 */
const aggregateTopicInsights = (topicsArray) => {
  const topicCounts = {};
  const allConversationTopics = [];

  topicsArray.forEach((topics) => {
    if (topics.emergingTopics) {
      topics.emergingTopics.forEach((topic) => {
        topicCounts[topic.topic] = (topicCounts[topic.topic] || 0) + topic.count;
      });
    }

    if (topics.conversationTopics) {
      allConversationTopics.push(...topics.conversationTopics);
    }
  });

  const emergingTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: `${Math.round((count / allConversationTopics.length) * 100)}%`,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 topics

  return {
    emergingTopics,
    conversationTopics: allConversationTopics,
    topicDistribution: topicCounts,
  };
};

/**
 * Merge context clusters from multiple chunks
 * @private
 */
const mergeContextClusters = (contextDataArray) => {
  const mergedClusters = [];
  let clusterId = 0;

  contextDataArray.forEach((contextData) => {
    if (contextData.clusters) {
      contextData.clusters.forEach((cluster) => {
        mergedClusters.push({
          ...cluster,
          clusterId: clusterId++,
        });
      });
    }
  });

  return mergedClusters;
};

/**
 * Calculate average semantic similarity across chunks
 * @private
 */
const calculateAverageSemanticSimilarity = (contextDataArray) => {
  const scores = contextDataArray
    .map((c) => c.similarityScore)
    .filter((s) => typeof s === 'number');

  if (scores.length === 0) return 0;

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

/**
 * Check if any ML features returned errors
 * @param {Object} mlInsights - ML insights object
 * @returns {Array<String>} Array of error messages
 */
export const getMLProcessingErrors = (mlInsights) => {
  if (!mlInsights || !mlInsights.processingErrors) {
    return [];
  }

  return mlInsights.processingErrors.map(
    (err) => `${err.feature}: ${err.error}` || 'Unknown error'
  );
};
