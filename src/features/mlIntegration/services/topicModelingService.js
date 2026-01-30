/**
 * Topic Modeling Service
 * Identifies conversation topics and emerging issues using zero-shot classification
 * Model: facebook/bart-large-mnli (Hugging Face)
 */

/**
 * Predefined topics for zero-shot classification
 */
const PREDEFINED_TOPICS = [
  'plumbing',
  'heating',
  'electrical',
  'appliances',
  'maintenance',
  'repair',
  'inspection',
  'construction',
  'installation',
  'damage',
  'water issues',
  'hvac',
  'safety',
];

/**
 * Extract topics from inquiries using zero-shot classification
 * @param {Array} inquiries - Array of conversations
 * @param {Object} config - Topic config with apiKey
 * @returns {Promise<Object>} Topic analysis
 */
export const extractTopics = async (inquiries, config) => {
  const results = {
    conversationTopics: [],
    emergingTopics: [],
    topicDistribution: {},
  };

  if (!inquiries || inquiries.length === 0) {
    return results;
  }

  const apiKey = config.apiKey || config;
  const topicCounts = {};

  // Initialize topic counts
  PREDEFINED_TOPICS.forEach((topic) => {
    topicCounts[topic] = 0;
  });

  // Analyze each conversation
  for (const conversation of inquiries) {
    try {
      // Get tenant messages
      const tenantMessages = conversation.filter(
        (msg) => msg.MessageType === '3' || msg.MessageType === 3
      );

      if (tenantMessages.length === 0) {
        continue;
      }

      // Combine messages into conversation text
      const conversationText = tenantMessages
        .map((msg) => msg.Content || '')
        .filter((text) => text.length > 0)
        .join(' ')
        .substring(0, 1024); // Limit to 1024 chars

      if (conversationText.length < 10) {
        continue;
      }

      try {
        const topics = await classifyTopics(conversationText, apiKey, config.model);

        results.conversationTopics.push({
          conversationId: conversation[0].ConversationId,
          topics: topics.map((t) => t.label),
          primaryTopic: topics.length > 0 ? topics[0].label : 'other',
          confidence: topics.length > 0 ? topics[0].score : 0,
        });

        // Count primary topic
        if (topics.length > 0) {
          const primaryTopic = topics[0].label;
          if (topicCounts.hasOwnProperty(primaryTopic)) {
            topicCounts[primaryTopic]++;
          }
        }
      } catch (error) {
        console.warn(`Failed to classify topics for conversation:`, error.message);
        // Continue with other conversations
      }
    } catch (error) {
      console.warn(
        `Failed to process conversation ${conversation[0]?.ConversationId}:`,
        error.message
      );
      // Continue with next conversation
    }
  }

  // Calculate topic distribution
  const total = results.conversationTopics.length;
  if (total > 0) {
    PREDEFINED_TOPICS.forEach((topic) => {
      const percentage = (topicCounts[topic] / total) * 100;
      results.topicDistribution[topic] = Math.round(percentage);

      // Add to emerging topics if >20%
      if (percentage >= 20) {
        results.emergingTopics.push({
          topic,
          count: topicCounts[topic],
          percentage: `${Math.round(percentage)}%`,
        });
      }
    });

    // Sort emerging topics by count (descending)
    results.emergingTopics.sort((a, b) => b.count - a.count);
  }

  return results;
};

/**
 * Call Hugging Face BART API for zero-shot classification
 * @private
 */
const classifyTopics = async (text, apiKey, model) => {
  const defaultModel = 'facebook/bart-large-mnli';
  const endpoint = `https://api-inference.huggingface.co/models/${model || defaultModel}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        candidate_labels: PREDEFINED_TOPICS,
        multi_class: true, // Allow multiple topics per text
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Response format: { sequence, labels, scores }
  if (!data.labels || !data.scores) {
    throw new Error('Unexpected API response format');
  }

  // Combine labels with scores and sort by score
  const results = data.labels.map((label, idx) => ({
    label,
    score: data.scores[idx],
  }));

  return results.sort((a, b) => b.score - a.score);
};

/**
 * Get topics for all inquiries (batch processing for efficiency)
 * @param {Array} conversationTexts - Array of conversation strings
 * @param {Object} config - Configuration with API key
 * @returns {Promise<Array>} Topic classifications
 */
export const extractTopicsBatch = async (conversationTexts, config) => {
  const results = [];

  for (const text of conversationTexts) {
    try {
      const topics = await classifyTopics(text, config.apiKey || config, config.model);
      results.push(topics);
    } catch (error) {
      console.warn('Topic classification failed:', error.message);
      results.push([]);
    }
  }

  return results;
};
