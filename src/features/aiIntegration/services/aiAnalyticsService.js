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

  return `You are analyzing TENANT INQUIRY DATA for property management. This data represents inquiries from tenants about deficiencies, maintenance, and issues with rental properties.

**RAW METRICS PROVIDED:**
- Total Inquiries: ${analytics.totalInquiries}
- Inquiries Inside Working Hours (08:00-17:00): ${analytics.insideWorkingHours || 0} (${analytics.insidePercentage})
- Inquiries Outside Working Hours (17:00-08:00): ${analytics.outsideWorkingHours || 0} (${analytics.outsidePercentage})
- Successful/Resolved Reports: ${analytics.successfulReports || 0}
- Failed/Unresolved Reports: ${analytics.failedReports || 0}
- Avg Response Time: ${analytics.avgResponseTime}
- Avg Resolution Time: ${analytics.avgResolutionTime} min
- Avg Conversation Length: ${analytics.avgConversationLength} messages
- Data Quality Score: ${analytics.dataQualityScore}
- Total Issues Found: ${analytics.totalIssues || 0}
- Satisfied Tenants: ${analytics.satisfied || 0}
- Neutral Tenants: ${analytics.neutral || 0}
- Frustrated Tenants: ${analytics.frustrated || 0}

**TOP DEFICIENCY TYPES:**
${topDeficiencies || 'None'}

**CONTEXT GUIDE (For Accuracy):**
- Success Rate should reflect the percentage of resolved inquiries (successful / (successful + failed) * 100)
- Response Time is measured in seconds from inquiry to first response
- Resolution Time is in minutes from inquiry to final resolution
- Data Quality Score is 0-100% based on data completeness and accuracy
- Working Hours Success: Typically higher success rates occur during working hours
- After-Hours Impact: Inquiries outside 08:00-17:00 often have longer resolution times
- Satisfaction Rate: Calculate based on successful resolutions and response quality

**YOUR TASK:**
Analyze the tenant inquiry data deeply. Correct any anomalies in the provided metrics and return ONLY valid JSON with these exact fields (use 95% accuracy):

1. "successRate": Success rate percentage (formula: successful / (successful + failed) * 100) - format as "XX%"
2. "avgResponseTime": Average response time - format as "XXs" (seconds)
3. "avgResolutionTime": Average resolution time - format as "XX min"
4. "dataQualityScore": Data quality percentage - format as "XX%"
5. "satisfactionRate": Satisfaction percentage based on successful resolutions - format as "XX%"
6. "frustrationRate": Frustration percentage from unresolved issues - format as "XX%"
7. "trends": Array of 2-3 KEY TRENDS (e.g., "X% of inquiries during working hours", "Average resolution time increased by X%")
8. "anomalies": Array of 2-3 NOTABLE PATTERNS (e.g., "After-hours inquiries have X% lower success rate", "Peak inquiry type: Major Deficiencies")
9. "insights": Array of 2-3 ACTIONABLE INSIGHTS from the data patterns
10. "recommendations": Array of 2-3 SPECIFIC IMPROVEMENTS (prioritized by impact)

**EXAMPLE (Based on actual tenant data):**
{
  "successRate": "88%",
  "avgResponseTime": "120s",
  "avgResolutionTime": "240 min",
  "dataQualityScore": "92%",
  "satisfactionRate": "82%",
  "frustrationRate": "12%",
  "trends": [
    "54% of inquiries occur during working hours (08:00-17:00)",
    "Major deficiencies account for 58% of all inquiries",
    "Automated routing accuracy is 71%, requiring 29% manual intervention"
  ],
  "anomalies": [
    "After-hours inquiries show 22% longer resolution time",
    "78% of deficiency reports are made within working hours",
    "German inquiries represent 69% of all communications"
  ],
  "insights": [
    "Deficiency types are concentrated: Major (56) and Minor (7) deficiencies represent majority of workload",
    "Potential savings of CHF2,087 per period through automated processing",
    "Time efficiency: Major deficiencies average 57 minutes, with CHF49.50 hourly cost"
  ],
  "recommendations": [
    "Implement 24/7 automated response system to reduce after-hours resolution time gap",
    "Improve routing accuracy beyond current 71% to reduce manual intervention workload",
    "Focus resources on Major Deficiency handling which represents 58% of inquiry volume"
  ]
}

Respond with ONLY valid JSON, no other text. Ensure 95% accuracy to actual data patterns.`;
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
