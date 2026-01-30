/**
 * AI Analytics Service
 * Integrates with OpenAI and Claude APIs for enhanced KPI analysis
 */

/**
 * Normalize and validate KPI values from AI response
 * @param {Object} result - Raw AI response
 * @returns {Object} Normalized KPI values
 */
const normalizeAIKPIs = (result) => {
  const normalizeValue = (value, defaultValue) => {
    if (!value || value === 'undefined' || value === 'N/A') {
      return defaultValue;
    }
    return value;
  };

  return {
    successRate: normalizeValue(result.successRate, '50%'),
    avgResponseTime: normalizeValue(result.avgResponseTime, '60s'),
    avgResolutionTime: normalizeValue(result.avgResolutionTime, '120 min'),
    dataQualityScore: normalizeValue(result.dataQualityScore, '75%'),
    satisfactionRate: normalizeValue(result.satisfactionRate, '50%'),
    frustrationRate: normalizeValue(result.frustrationRate, '20%'),
  };
};

/**
 * Build analytics prompt for AI analysis
 * @param {Object} analytics - Analytics object with KPIs
 * @param {Object} chunkMetadata - Optional metadata from chunking service
 * @returns {String} Formatted prompt for AI
 */
const buildAnalyticsPrompt = (analytics, chunkMetadata = null) => {
  const topDeficiencies = (analytics.deficiencyData || [])
    .slice(0, 5)
    .map((d) => `${d.name}: ${d.value} (${d.percentage})`)
    .join('\n');

  // Build chunk context if available
  let chunkContext = '';
  if (chunkMetadata) {
    chunkContext = `

**CHUNK-LEVEL CONTEXT:**
- Peak Hour: ${chunkMetadata.peakHour || 'Unknown'}:00 (${chunkMetadata.peakHourActivity || 0} inquiries)
- Activity Level: ${chunkMetadata.busyPeriod || 'Unknown'}
- Data Quality Score: ${chunkMetadata.dataQuality || '0%'}
- Conversation Metrics:
  - Total Conversations: ${chunkMetadata.conversationMetrics?.total || 0}
  - Avg Conversation Length: ${chunkMetadata.conversationMetrics?.avgLength || 0} messages
  - Short Conversations (<3 msgs): ${chunkMetadata.conversationMetrics?.shortConversations || 0}
  - Long Conversations (>10 msgs): ${chunkMetadata.conversationMetrics?.longConversations || 0}
  - Resolution Success Rate: ${chunkMetadata.conversationMetrics?.successRate || 'N/A'}
- Detected Trend: ${chunkMetadata.trend || 'Unknown'}
${chunkMetadata.anomalies && chunkMetadata.anomalies.length > 0 ? `- Identified Issues: ${chunkMetadata.anomalies.join(', ')}` : ''}`;
  }

  return `You are analyzing TENANT INQUIRY DATA for property management. This data represents inquiries from tenants about deficiencies, maintenance, and issues with rental properties.

**RAW METRICS PROVIDED:**
- Total Inquiries: ${analytics.totalInquiries}
- Inquiries Inside Working Hours (09:00-17:00): ${analytics.insideWorkingHours || 0} (${analytics.insidePercentage})
- Inquiries Outside Working Hours (17:00-09:00): ${analytics.outsideWorkingHours || 0} (${analytics.outsidePercentage})
- Successful/Resolved Reports: ${analytics.successfulReports || 0}
- Failed/Unresolved Reports: ${analytics.failedReports || 0}
- Avg Response Time: ${analytics.avgResponseTime}
- Avg Resolution Time: ${analytics.avgResolutionTime}
- Avg Conversation Length: ${analytics.avgConversationLength} messages
- Data Quality Score: ${analytics.dataQualityScore}
- Total Data Quality Issues Found: ${analytics.totalIssues || 0}
- Satisfied Tenants (based on resolution success): ${analytics.satisfied || 0}
- Neutral Tenants: ${analytics.neutral || 0}
- Frustrated Tenants (based on failed resolutions): ${analytics.frustrated || 0}

**TOP DEFICIENCY TYPES:**
${topDeficiencies || 'None'}${chunkContext}

**CALCULATION FORMULAS (For Accuracy):**
- successRate = (successful reports / total inquiries) × 100
- satisfactionRate = (satisfied / total inquiries) × 100, where satisfied = successful resolutions with good quality
- frustrationRate = (frustrated / total inquiries) × 100, where frustrated = failed/unresolved + quality issues
- avgResponseTime = seconds from first message to first response (already in seconds)
- avgResolutionTime = minutes from first message to last message (already in minutes)
- dataQualityScore = based on data completeness and validation (0-100%)

**ANALYSIS RULES:**
1. If successRate > 80% AND dataQualityScore > 80%, then satisfactionRate ≈ successRate
2. If there are failed reports, frustrationRate ≈ (failed + issues) / total × 100
3. The satisfactionRate and frustrationRate should be realistic percentages based on the data
4. All rates must be between 0-100%
5. satisfactionRate + frustrationRate can be less than 100% (some remain neutral)

**YOUR TASK:**
Validate and correct the provided metrics to ensure they accurately reflect the data. Return ONLY valid JSON with these exact fields:

{
  "successRate": "XX%",
  "avgResponseTime": "XXs",
  "avgResolutionTime": "XX min",
  "dataQualityScore": "XX%",
  "satisfactionRate": "XX%",
  "frustrationRate": "XX%",
  "trends": ["trend 1", "trend 2", "trend 3"],
  "anomalies": ["anomaly 1", "anomaly 2", "anomaly 3"],
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

**EXAMPLE OUTPUT:**
{
  "successRate": "88%",
  "avgResponseTime": "120s",
  "avgResolutionTime": "240 min",
  "dataQualityScore": "92%",
  "satisfactionRate": "82%",
  "frustrationRate": "12%",
  "trends": [
    "54% of inquiries handled during working hours with 15% faster resolution",
    "Response times remain consistent across time periods",
    "High data quality maintained throughout period"
  ],
  "anomalies": [
    "After-hours inquiries show 22% longer resolution times",
    "79% of inquiries result in successful resolution",
    "Response times average 2 minutes"
  ],
  "insights": [
    "Strong performance with 88% success rate indicates effective resolution process",
    "Data quality is excellent (92%), enabling reliable analytics",
    "Working hours handling demonstrates efficiency with similar success rates"
  ],
  "recommendations": [
    "Maintain current resolution strategy as it achieves strong 88% success rate",
    "Consider extending working hours support given good performance metrics",
    "Continue monitoring data quality as it directly enables accurate analytics"
  ]
}

CRITICAL: Respond with ONLY valid JSON. NO other text before or after. Ensure all percentage values are realistic and between 0-100%.`;
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
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert analytics specialist analyzing tenant inquiry KPIs. Provide insights in valid JSON format.',
          },
          {
            role: 'user',
            content: buildAnalyticsPrompt(analytics),
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // Extract JSON from response (handle multiple braces)
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error(`JSON parse error: ${parseError.message}`);
    }

    // Normalize and validate KPI values
    const normalizedResult = normalizeAIKPIs(result);

    // Validate structure
    return {
      // Evaluated KPI metrics from AI
      successRate: normalizedResult.successRate,
      avgResponseTime: normalizedResult.avgResponseTime,
      avgResolutionTime: normalizedResult.avgResolutionTime,
      dataQualityScore: normalizedResult.dataQualityScore,
      satisfactionRate: normalizedResult.satisfactionRate,
      frustrationRate: normalizedResult.frustrationRate,
      // AI insights
      trends: Array.isArray(result.trends) ? result.trends : [],
      anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      provider: 'OpenAI',
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
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: buildAnalyticsPrompt(analytics),
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API error');
    }

    const data = await response.json();
    const content = data.content[0]?.text || '{}';

    // Extract JSON from response (handle multiple braces)
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      throw new Error(`JSON parse error: ${parseError.message}`);
    }

    // Normalize and validate KPI values
    const normalizedResult = normalizeAIKPIs(result);

    // Validate structure
    return {
      // Evaluated KPI metrics from AI
      successRate: normalizedResult.successRate,
      avgResponseTime: normalizedResult.avgResponseTime,
      avgResolutionTime: normalizedResult.avgResolutionTime,
      dataQualityScore: normalizedResult.dataQualityScore,
      satisfactionRate: normalizedResult.satisfactionRate,
      frustrationRate: normalizedResult.frustrationRate,
      // AI insights
      trends: Array.isArray(result.trends) ? result.trends : [],
      anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      provider: 'Claude',
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
      provider: aiAnalysis.provider || 'Unknown',
    },
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
      avgConversationLength: '5',
    };

    await analyzeChunkWithAI(testAnalytics, provider, apiKey);
    return true;
  } catch (error) {
    throw new Error(`API test failed: ${error.message}`);
  }
};
