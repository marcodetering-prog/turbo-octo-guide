/**
 * AI Analytics Service
 * Integrates with OpenAI and Claude APIs for enhanced KPI analysis
 */

/**
 * Build analytics prompt for AI analysis
 * @param {Object} analytics - Analytics object with KPIs
 * @returns {String} Formatted prompt for AI
 */
const buildAnalyticsPrompt = (analytics) => {
  const topDeficiencies = (analytics.deficiencyData || [])
    .slice(0, 5)
    .map(d => `${d.name}: ${d.value} (${d.percentage})`)
    .join('\n');

  return `Analyze this period of tenant inquiry data and provide insights.

**Key Metrics:**
- Total Inquiries: ${analytics.totalInquiries}
- Success Rate: ${analytics.successRate}
- Avg Response Time: ${analytics.avgResponseTime}
- Avg Resolution Time: ${analytics.avgResolutionTime} min
- Data Quality Score: ${analytics.dataQualityScore}
- Working Hours: ${analytics.insidePercentage} | After Hours: ${analytics.outsidePercentage}
- Satisfaction: ${analytics.satisfied} satisfied, ${analytics.neutral} neutral, ${analytics.frustrated} frustrated
- Avg Conversation Length: ${analytics.avgConversationLength} messages

**Top Deficiencies:**
${topDeficiencies || 'None'}

**Task:** Provide a JSON response with these exact fields:
1. "trends": Array of 2-3 key trends observed
2. "anomalies": Array of 2-3 unusual patterns or outliers
3. "insights": Array of 2-3 actionable insights
4. "recommendations": Array of 2-3 specific improvements

Example format:
{
  "trends": ["Inquiry volume increased by 15%", "Peak hours shifted"],
  "anomalies": ["Unusual spike on Day 3", "Success rate dip"],
  "insights": ["High frustration correlates with wait times", "After-hours issues are common"],
  "recommendations": ["Increase staffing during peak", "Improve deficiency X detection"]
}

Respond with ONLY valid JSON, no other text.`;
};

/**
 * Analyze chunk with OpenAI API
 * @param {Object} analytics - Analytics object
 * @param {String} apiKey - OpenAI API key
 * @returns {Promise<Object>} AI insights
 */
export const analyzeChunkWithOpenAI = async (analytics, apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert analytics specialist analyzing tenant inquiry KPIs. Provide insights in valid JSON format.'
          },
          {
            role: 'user',
            content: buildAnalyticsPrompt(analytics)
          }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const insights = JSON.parse(jsonMatch[0]);

    // Validate structure
    return {
      trends: Array.isArray(insights.trends) ? insights.trends : [],
      anomalies: Array.isArray(insights.anomalies) ? insights.anomalies : [],
      insights: Array.isArray(insights.insights) ? insights.insights : [],
      recommendations: Array.isArray(insights.recommendations) ? insights.recommendations : [],
      provider: 'OpenAI'
    };
  } catch (error) {
    console.error('OpenAI Analysis Error:', error);
    throw error;
  }
};

/**
 * Analyze chunk with Claude API
 * @param {Object} analytics - Analytics object
 * @param {String} apiKey - Claude API key
 * @returns {Promise<Object>} AI insights
 */
export const analyzeChunkWithClaude = async (analytics, apiKey) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: buildAnalyticsPrompt(analytics)
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API error');
    }

    const data = await response.json();
    const content = data.content[0]?.text || '{}';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const insights = JSON.parse(jsonMatch[0]);

    // Validate structure
    return {
      trends: Array.isArray(insights.trends) ? insights.trends : [],
      anomalies: Array.isArray(insights.anomalies) ? insights.anomalies : [],
      insights: Array.isArray(insights.insights) ? insights.insights : [],
      recommendations: Array.isArray(insights.recommendations) ? insights.recommendations : [],
      provider: 'Claude'
    };
  } catch (error) {
    console.error('Claude Analysis Error:', error);
    throw error;
  }
};

/**
 * Unified interface for AI analysis
 * @param {Object} analytics - Analytics object
 * @param {String} provider - 'openai' or 'claude'
 * @param {String} apiKey - API key
 * @returns {Promise<Object>} AI insights
 */
export const analyzeChunkWithAI = async (analytics, provider, apiKey) => {
  if (provider === 'openai') {
    return analyzeChunkWithOpenAI(analytics, apiKey);
  } else if (provider === 'claude') {
    return analyzeChunkWithClaude(analytics, apiKey);
  } else {
    throw new Error(`Unknown AI provider: ${provider}`);
  }
};

/**
 * Merge AI insights into analytics object
 * @param {Object} baseAnalytics - Original analytics object
 * @param {Object} aiInsights - AI-generated insights
 * @returns {Object} Enhanced analytics with AI insights
 */
export const enhanceAnalyticsWithAI = (baseAnalytics, aiInsights) => {
  return {
    ...baseAnalytics,
    aiInsights: {
      trends: aiInsights.trends || [],
      anomalies: aiInsights.anomalies || [],
      insights: aiInsights.insights || [],
      recommendations: aiInsights.recommendations || [],
      provider: aiInsights.provider || 'Unknown'
    }
  };
};

/**
 * Test API connection
 * @param {String} provider - 'openai' or 'claude'
 * @param {String} apiKey - API key
 * @returns {Promise<Boolean>} true if valid, throws error otherwise
 */
export const testAPIConnection = async (provider, apiKey) => {
  try {
    // Create minimal test analytics
    const testAnalytics = {
      totalInquiries: 10,
      successRate: '80%',
      avgResponseTime: '30s',
      avgResolutionTime: '15',
      dataQualityScore: '85%',
      insidePercentage: '70%',
      outsidePercentage: '30%',
      satisfied: 7,
      neutral: 2,
      frustrated: 1,
      avgConversationLength: '5'
    };

    await analyzeChunkWithAI(testAnalytics, provider, apiKey);
    return true;
  } catch (error) {
    throw new Error(`API test failed: ${error.message}`);
  }
};
