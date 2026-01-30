/**
 * Sentiment Analysis Service
 * Analyzes conversation sentiment using Hugging Face Inference API
 * Model: distilbert-base-uncased-finetuned-sst-2-english
 */

/**
 * Analyze sentiment for all inquiries in a chunk
 * @param {Array} inquiries - Array of conversations
 * @param {Object} config - Sentiment config with apiKey
 * @returns {Promise<Object>} Sentiment insights
 */
export const analyzeSentiment = async (inquiries, config) => {
  const results = {
    conversationSentiments: [],
    aggregatedSatisfactionRate: '0%',
    aggregatedFrustrationRate: '0%',
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
  };

  if (!inquiries || inquiries.length === 0) {
    return results;
  }

  const apiKey = config.apiKey || config;

  // Analyze each conversation
  for (const conversation of inquiries) {
    try {
      // Get tenant messages only (MessageType = 3)
      const tenantMessages = conversation.filter(
        (msg) => msg.MessageType === '3' || msg.MessageType === 3
      );

      if (tenantMessages.length === 0) {
        continue;
      }

      // Analyze sentiment for each message
      const messageSentiments = [];

      for (const msg of tenantMessages) {
        // Skip very short messages
        if (!msg.Content || msg.Content.length < 5) {
          continue;
        }

        try {
          const sentiment = await callHuggingFaceAPI(msg.Content, apiKey, config.model);

          messageSentiments.push({
            timestamp: msg.TimeSent,
            text: msg.Content.substring(0, 100), // Store first 100 chars for reference
            sentiment: sentiment.label, // 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
            confidence: sentiment.score,
          });
        } catch (error) {
          console.warn(`Failed to analyze sentiment for message:`, error.message);
          // Continue with other messages
        }
      }

      // Calculate overall conversation sentiment
      if (messageSentiments.length > 0) {
        const conversationSentiment = calculateConversationSentiment(messageSentiments);

        results.conversationSentiments.push({
          conversationId: conversation[0].ConversationId,
          overallSentiment: conversationSentiment,
          messageCount: messageSentiments.length,
          messageSentiments,
        });

        // Update aggregate counts
        if (conversationSentiment === 'POSITIVE') {
          results.sentimentBreakdown.positive++;
        } else if (conversationSentiment === 'NEGATIVE') {
          results.sentimentBreakdown.negative++;
        } else {
          results.sentimentBreakdown.neutral++;
        }
      }
    } catch (error) {
      console.warn(
        `Failed to process conversation ${conversation[0]?.ConversationId}:`,
        error.message
      );
      // Continue with next conversation
    }
  }

  // Calculate aggregate satisfaction/frustration rates
  const total = results.conversationSentiments.length;
  if (total > 0) {
    results.aggregatedSatisfactionRate = `${Math.round(
      (results.sentimentBreakdown.positive / total) * 100
    )}%`;
    results.aggregatedFrustrationRate = `${Math.round(
      (results.sentimentBreakdown.negative / total) * 100
    )}%`;
  }

  return results;
};

/**
 * Call Hugging Face Inference API for sentiment analysis
 * @private
 */
const callHuggingFaceAPI = async (text, apiKey, model) => {
  const defaultModel = 'distilbert-base-uncased-finetuned-sst-2-english';
  const endpoint = `https://api-inference.huggingface.co/models/${model || defaultModel}`;

  // Limit text to first 512 characters (model input limit)
  const truncatedText = text.substring(0, 512);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: truncatedText }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Response format: [[{label: 'POSITIVE', score: 0.9998}, {label: 'NEGATIVE', score: 0.0002}]]
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected API response format');
  }

  // Return the classification with highest score
  return data[0].reduce((max, item) => (item.score > max.score ? item : max), {
    label: 'NEUTRAL',
    score: 0,
  });
};

/**
 * Calculate overall sentiment for a conversation
 * Uses weighted scoring with recency bias (recent messages weighted more heavily)
 * @private
 */
const calculateConversationSentiment = (messageSentiments) => {
  if (!messageSentiments || messageSentiments.length === 0) {
    return 'NEUTRAL';
  }

  // Weight recent messages more heavily (recency bias)
  let weightedScore = 0;
  let totalWeight = 0;

  messageSentiments.forEach((msg, idx) => {
    const weight = idx + 1; // Messages later in conversation have higher weight
    const score =
      msg.sentiment === 'POSITIVE' ? 1 : msg.sentiment === 'NEGATIVE' ? -1 : 0;
    const confidence = msg.confidence || 0.5;

    weightedScore += score * weight * confidence;
    totalWeight += weight;
  });

  const avgScore = weightedScore / totalWeight;

  // Determine overall sentiment with threshold
  if (avgScore > 0.3) {
    return 'POSITIVE';
  }
  if (avgScore < -0.3) {
    return 'NEGATIVE';
  }
  return 'NEUTRAL';
};

/**
 * Normalize sentiment labels to standard format
 * @private
 */
const normalizeSentimentLabel = (label) => {
  const normalized = label?.toUpperCase();
  if (['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(normalized)) {
    return normalized;
  }
  return 'NEUTRAL';
};

/**
 * Calculate sentiment trend over a conversation
 * Returns whether sentiment is improving, declining, or stable
 * @param {Array} messageSentiments - Ordered messages with sentiment
 * @returns {String} 'improving', 'declining', or 'stable'
 */
export const calculateSentimentTrend = (messageSentiments) => {
  if (!messageSentiments || messageSentiments.length < 2) {
    return 'neutral';
  }

  const firstHalf = messageSentiments.slice(0, Math.ceil(messageSentiments.length / 2));
  const secondHalf = messageSentiments.slice(Math.ceil(messageSentiments.length / 2));

  const getAverageScore = (messages) => {
    const scores = messages.map((m) =>
      m.sentiment === 'POSITIVE' ? 1 : m.sentiment === 'NEGATIVE' ? -1 : 0
    );
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const firstScore = getAverageScore(firstHalf);
  const secondScore = getAverageScore(secondHalf);
  const difference = secondScore - firstScore;

  if (difference > 0.2) return 'improving';
  if (difference < -0.2) return 'declining';
  return 'stable';
};

/**
 * Get sentiment distribution statistics
 * @param {Object} sentimentResults - Results from analyzeSentiment
 * @returns {Object} Statistics
 */
export const getSentimentStatistics = (sentimentResults) => {
  const { conversationSentiments, sentimentBreakdown } = sentimentResults;
  const total = conversationSentiments.length;

  return {
    totalConversations: total,
    positiveCount: sentimentBreakdown.positive,
    neutralCount: sentimentBreakdown.neutral,
    negativeCount: sentimentBreakdown.negative,
    positivePercentage: total > 0 ? ((sentimentBreakdown.positive / total) * 100).toFixed(1) : 0,
    neutralPercentage: total > 0 ? ((sentimentBreakdown.neutral / total) * 100).toFixed(1) : 0,
    negativePercentage: total > 0 ? ((sentimentBreakdown.negative / total) * 100).toFixed(1) : 0,
    averageConfidence:
      conversationSentiments.length > 0
        ? (
            conversationSentiments.reduce((sum, c) => {
              const avgConfidence =
                c.messageSentiments.reduce((s, m) => s + m.confidence, 0) /
                c.messageSentiments.length;
              return sum + avgConfidence;
            }, 0) / conversationSentiments.length
          ).toFixed(3)
        : 0,
  };
};
