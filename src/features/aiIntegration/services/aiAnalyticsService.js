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

  return `Analyze this period of tenant inquiry data deeply and provide both KPI evaluations and insights.

**Raw Metrics Provided:**
- Total Inquiries: ${analytics.totalInquiries}
- Success Rate: ${analytics.successRate}
- Avg Response Time: ${analytics.avgResponseTime}
- Avg Resolution Time: ${analytics.avgResolutionTime} min
- Data Quality Score: ${analytics.dataQualityScore}
- Working Hours: ${analytics.insidePercentage} | After Hours: ${analytics.outsidePercentage}
- Inside Working Hours Count: ${analytics.insideWorkingHours || 0}
- Outside Working Hours Count: ${analytics.outsideWorkingHours || 0}
- Successful Reports: ${analytics.successfulReports || 0}
- Failed Reports: ${analytics.failedReports || 0}
- Satisfied Users: ${analytics.satisfied || 0}
- Neutral Users: ${analytics.neutral || 0}
- Frustrated Users: ${analytics.frustrated || 0}
- Avg Conversation Length: ${analytics.avgConversationLength} messages
- Total Data Quality Issues: ${analytics.totalIssues || 0}

**Top Deficiencies:**
${topDeficiencies || 'None'}

**Task:** Analyze the data deeply and return ONLY valid JSON with these exact fields:
1. "successRate": Refined success rate percentage (0-100, as string with % like "85%")
2. "avgResponseTime": Evaluated average response time (format like "45s")
3. "avgResolutionTime": Evaluated average resolution time in minutes (format like "120 min")
4. "dataQualityScore": Evaluated data quality percentage (0-100, as string with % like "90%")
5. "satisfactionRate": Calculated satisfaction percentage (0-100, as string with % like "75%")
6. "frustrationRate": Calculated frustration percentage (0-100, as string with % like "15%")
7. "trends": Array of 2-3 key trends observed in the data
8. "anomalies": Array of 2-3 unusual patterns or outliers
9. "insights": Array of 2-3 actionable insights based on the analysis
10. "recommendations": Array of 2-3 specific improvements to implement

Example format:
{
  "successRate": "82%",
  "avgResponseTime": "35s",
  "avgResolutionTime": "95 min",
  "dataQualityScore": "88%",
  "satisfactionRate": "78%",
  "frustrationRate": "12%",
  "trends": ["Inquiry volume increased by 15%", "Peak hours shifted to afternoon"],
  "anomalies": ["Unusual spike in failed reports on specific day", "Response time variance is high"],
  "insights": ["High frustration correlates with response time delays", "After-hours inquiries have lower success rates"],
  "recommendations": ["Implement auto-response for after-hours inquiries", "Allocate more resources during peak hours", "Improve data validation process"]
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

    const result = JSON.parse(jsonMatch[0]);

    // Validate structure
    return {
      // Evaluated KPI metrics from AI
      successRate: result.successRate || 'N/A',
      avgResponseTime: result.avgResponseTime || '0s',
      avgResolutionTime: result.avgResolutionTime || '0 min',
      dataQualityScore: result.dataQualityScore || '0%',
      satisfactionRate: result.satisfactionRate || '0%',
      frustrationRate: result.frustrationRate || '0%',
      // AI insights
      trends: Array.isArray(result.trends) ? result.trends : [],
      anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
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

    const result = JSON.parse(jsonMatch[0]);

    // Validate structure
    return {
      // Evaluated KPI metrics from AI
      successRate: result.successRate || 'N/A',
      avgResponseTime: result.avgResponseTime || '0s',
      avgResolutionTime: result.avgResolutionTime || '0 min',
      dataQualityScore: result.dataQualityScore || '0%',
      satisfactionRate: result.satisfactionRate || '0%',
      frustrationRate: result.frustrationRate || '0%',
      // AI insights
      trends: Array.isArray(result.trends) ? result.trends : [],
      anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
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
 * Merge AI evaluated metrics and insights into analytics object
 * @param {Object} baseAnalytics - Original analytics object
 * @param {Object} aiAnalysis - AI-generated metrics and insights
 * @returns {Object} Enhanced analytics with AI-evaluated KPIs and insights
 */
export const enhanceAnalyticsWithAI = (baseAnalytics, aiAnalysis) => {
  return {
    ...baseAnalytics,
    // Replace with AI-evaluated KPI metrics
    successRate: aiAnalysis.successRate || baseAnalytics.successRate,
    avgResponseTime: aiAnalysis.avgResponseTime || baseAnalytics.avgResponseTime,
    avgResolutionTime: aiAnalysis.avgResolutionTime || baseAnalytics.avgResolutionTime,
    dataQualityScore: aiAnalysis.dataQualityScore || baseAnalytics.dataQualityScore,
    satisfactionRate: aiAnalysis.satisfactionRate || baseAnalytics.satisfactionRate || '0%',
    frustrationRate: aiAnalysis.frustrationRate || baseAnalytics.frustrationRate || '0%',
    // Add AI insights
    aiInsights: {
      trends: Array.isArray(aiAnalysis.trends) ? aiAnalysis.trends : [],
      anomalies: Array.isArray(aiAnalysis.anomalies) ? aiAnalysis.anomalies : [],
      insights: Array.isArray(aiAnalysis.insights) ? aiAnalysis.insights : [],
      recommendations: Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : [],
      provider: aiAnalysis.provider || 'Unknown'
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
