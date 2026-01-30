# ML API Reference Documentation

Complete technical reference for all ML service implementations.

---

## Sentiment Analysis Service

**File**: `src/features/mlIntegration/services/sentimentService.js`

### API Calls

```javascript
// Analyze sentiment for all conversations
const result = await analyzeSentiment(inquiries, config);
```

**Parameters**:
- `inquiries`: Array of conversation arrays
  - Each conversation: Array of message objects
  - Message object: `{ MessageType, Content, TimeSent, ConversationId }`
  - MessageType: '3' or 3 for tenant messages
- `config`: Configuration object
  - `apiKey`: Hugging Face API key (required)
  - `model`: (optional) Model name, defaults to `distilbert-base-uncased-finetuned-sst-2-english`

**Response**:
```javascript
{
  conversationSentiments: [
    {
      conversationId: "conv-123",
      overallSentiment: "POSITIVE", // or "NEGATIVE", "NEUTRAL"
      messageCount: 5,
      messageSentiments: [
        {
          timestamp: "2024-01-30T10:00:00Z",
          text: "Great service...",
          sentiment: "POSITIVE", // or "NEGATIVE", "NEUTRAL"
          confidence: 0.9998
        }
      ]
    }
  ],
  aggregatedSatisfactionRate: "85%",
  aggregatedFrustrationRate: "10%",
  sentimentBreakdown: {
    positive: 85,  // Count of positive conversations
    neutral: 5,
    negative: 10
  }
}
```

### API Details

**Endpoint**: `https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english`

**Request Format**:
```json
{
  "inputs": "Text to analyze (up to 512 characters)"
}
```

**Response Format**:
```json
[
  [
    {
      "label": "POSITIVE",
      "score": 0.9998
    },
    {
      "label": "NEGATIVE",
      "score": 0.0002
    }
  ]
]
```

### Key Features

1. **Message-Level Analysis**: Each message classified individually
2. **Recency Bias**: Recent messages weighted more heavily in conversation sentiment
3. **Confidence Scoring**: Each classification includes confidence (0-1)
4. **Aggregation**: Combines multiple conversations into satisfaction rates
5. **Error Handling**: Skips messages <5 characters, continues on failures

### Performance

- Per message: ~50-100ms (with API latency)
- Per conversation: Depends on message count
- Memory: Low (streaming processing)
- Caching: None (fresh analysis each time)

### Examples

```javascript
// Example 1: Simple analysis
const config = { apiKey: 'hf_...' };
const sentiments = await analyzeSentiment(conversations, config);
console.log(sentiments.aggregatedSatisfactionRate); // "85%"

// Example 2: With custom model
const customConfig = {
  apiKey: 'hf_...',
  model: 'roberta-base-openai-detector'
};

// Example 3: Get statistics
const stats = getSentimentStatistics(sentiments);
console.log(stats.positivePercentage); // "85.0"
```

### Trend Calculation

```javascript
const trend = calculateSentimentTrend(messageSentiments);
// Returns: 'improving', 'declining', or 'stable'
// Compares first half vs second half of conversation
```

---

## Topic Modeling Service

**File**: `src/features/mlIntegration/services/topicModelingService.js`

### API Calls

```javascript
// Extract topics from conversations
const result = await extractTopics(inquiries, config);

// Batch process multiple texts
const batchResult = await extractTopicsBatch(texts, config);
```

**Parameters**:
- `inquiries`: Array of conversation arrays (same format as sentiment)
- `conversationTexts`: Array of text strings for batch processing
- `config`: Configuration object
  - `apiKey`: Hugging Face API key (required)
  - `model`: (optional) Model name, defaults to `facebook/bart-large-mnli`

**Response**:
```javascript
{
  conversationTopics: [
    {
      conversationId: "conv-123",
      topics: ["plumbing", "water issues"],
      primaryTopic: "plumbing",
      confidence: 0.95
    }
  ],
  emergingTopics: [
    {
      topic: "plumbing",
      count: 42,
      percentage: "35%"  // >20% threshold for "emerging"
    },
    {
      topic: "heating",
      count: 30,
      percentage: "25%"
    }
  ],
  topicDistribution: {
    "plumbing": 35,
    "heating": 25,
    "electrical": 20,
    // ... other topics
  }
}
```

### API Details

**Endpoint**: `https://api-inference.huggingface.co/models/facebook/bart-large-mnli`

**Request Format**:
```json
{
  "inputs": "Conversation text (up to 1024 characters)",
  "parameters": {
    "candidate_labels": ["plumbing", "heating", "electrical", ...],
    "multi_class": true
  }
}
```

**Response Format**:
```json
{
  "sequence": "original text",
  "labels": ["plumbing", "heating", "electrical", ...],
  "scores": [0.95, 0.65, 0.42, ...]
}
```

### Predefined Topics

```javascript
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
```

### Key Features

1. **Zero-Shot Classification**: No training required, works with predefined topics
2. **Multi-label Support**: Each conversation can have multiple topics
3. **Emerging Topic Detection**: Topics appearing in >20% of conversations
4. **Topic Distribution**: Overall percentage breakdown
5. **Batch Processing**: Efficient processing of multiple texts

### Performance

- Per text: ~100-200ms (with API latency)
- Batch processing: Linear with number of texts
- Memory: Minimal
- Caching: Can cache topic classifications per conversation ID

### Examples

```javascript
// Example 1: Extract topics
const topics = await extractTopics(conversations, { apiKey: 'hf_...' });
console.log(topics.emergingTopics); // Top topics >20%

// Example 2: Batch processing
const texts = ['text1', 'text2', 'text3'];
const results = await extractTopicsBatch(texts, { apiKey: 'hf_...' });

// Example 3: Custom topics (extend PREDEFINED_TOPICS)
// Add to PREDEFINED_TOPICS array in sentenceService.js
```

### Customization

To add new topics:
1. Open `topicModelingService.js`
2. Add to `PREDEFINED_TOPICS` array
3. Redeploy

Example:
```javascript
const PREDEFINED_TOPICS = [
  'plumbing',
  'heating',
  // ... existing
  'roofing',     // New topic
  'flooring',    // New topic
];
```

---

## Context Enhancement Service

**File**: `src/features/mlIntegration/services/contextEnhancementService.js`

### API Calls

```javascript
// Enhance context with semantic analysis
const result = await enhanceContext(inquiries, config);
```

**Parameters**:
- `inquiries`: Array of conversation arrays
- `config`: Configuration object
  - `apiKey`: OpenAI API key (required)
  - `model`: (optional) Model name, defaults to `text-embedding-3-small`

**Response**:
```javascript
{
  contextClusters: [
    {
      clusterId: 0,
      size: 12,  // Number of conversations in cluster
      conversations: ["conv-1", "conv-2", ...],
      commonTheme: "Water Damage Issues",
      cohesion: 78  // Cluster quality (0-100)
    },
    {
      clusterId: 1,
      size: 8,
      conversations: ["conv-5", ...],
      commonTheme: "HVAC System Problems",
      cohesion: 82
    }
  ],
  semanticSimilarity: 78,  // Overall similarity score (0-100)
  contextualKPIs: {}
}
```

### API Details

**Endpoint**: `https://api.openai.com/v1/embeddings`

**Request Format**:
```json
{
  "model": "text-embedding-3-small",
  "input": ["text1", "text2", "text3"]
}
```

**Response Format**:
```json
{
  "data": [
    {
      "index": 0,
      "embedding": [0.123, -0.456, 0.789, ...],  // 1536 dimensions
      "object": "embedding"
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 100,
    "total_tokens": 100
  }
}
```

### Algorithm Details

**K-Means Clustering**:
1. Generate 1536-dimensional embeddings for each conversation
2. Initialize k centroids randomly (k = min(5, ceil(n/5)))
3. Iteratively assign conversations to nearest centroid
4. Update centroids until convergence (max 10 iterations)
5. Calculate cluster cohesion (inverse of average distance to centroid)

**Semantic Similarity**:
- Uses cosine similarity between conversation embeddings
- Samples 20 random pairs for efficiency
- Returns average similarity * 100

**Theme Generation**:
- Extracts most common words (>4 characters) from cluster texts
- Top word becomes cluster theme (e.g., "water" → "Water Issues")

### Performance

- Per embedding: ~10-50ms (batch processing)
- Clustering: ~100-500ms for typical dataset
- Memory: ~10MB for 1536-dim vectors (moderate)
- Cost: ~$0.20 per 1,000 conversations

### Examples

```javascript
// Example 1: Semantic clustering
const context = await enhanceContext(conversations, {
  apiKey: 'sk-...'
});
console.log(context.semanticSimilarity); // 78

// Example 2: Access clusters
context.contextClusters.forEach(cluster => {
  console.log(`Cluster ${cluster.clusterId}: ${cluster.commonTheme}`);
});

// Example 3: Monitor cluster quality
const goodClusters = context.contextClusters.filter(c => c.cohesion > 80);
console.log(`High-quality clusters: ${goodClusters.length}`);
```

### Customization

Change number of clusters (default k=5):
```javascript
// In contextEnhancementService.js, function enhanceContext
const k = Math.min(7, Math.ceil(validConversations.length / 3)); // Change multiplier
```

### Model Options

OpenAI embedding models:
- `text-embedding-3-small`: Fast, 1536 dimensions (recommended)
- `text-embedding-3-large`: More accurate, 3072 dimensions (slower, more expensive)
- `text-embedding-ada-002`: Legacy model (not recommended)

---

## Predictive Analytics Service

**File**: `src/features/mlIntegration/services/predictiveAnalyticsService.js`

### API Calls

```javascript
// Predict next period KPIs
const predictions = predictNextPeriod(historicalPeriods);

// Validate data suitability
const isValid = isValidForPrediction(historicalPeriods);

// Calculate prediction accuracy
const accuracy = calculatePredictionAccuracy(historicalPeriods, predictions);
```

**Parameters**:
- `historicalPeriods`: Array of period objects with analytics
  - Minimum: 3 periods
  - Structure: `{ name, analytics: { kpiName, ... } }`

**Response**:
```javascript
{
  predictedDate: "February 2024",
  predictedKPIs: {
    successRate: "92%",
    satisfactionRate: "87%",
    avgResponseTime: "2.2 hours",
    avgConversationLength: "4.5 msgs"
  },
  confidence: "medium",  // or "low", "high"
  trendIndicators: {
    successRate: "stable",      // or "increasing", "decreasing"
    satisfactionRate: "increasing",
    avgResponseTime: "decreasing"
  },
  confidenceScore: 72  // 0-100
}
```

### Algorithm Details

**Exponential Smoothing**:
```
S(t) = α × Y(t) + (1 - α) × S(t-1)

Where:
- S(t) = smoothed value at time t
- Y(t) = actual value at time t
- α = 0.3 (smoothing factor)
- α = 0.3 gives weight: 30% recent, 70% historical
```

**Trend Detection** (Linear Regression):
```
y = mx + b

Where:
- m = slope
- If m > 0.5: "increasing"
- If m < -0.5: "decreasing"
- Otherwise: "stable"
```

**Confidence Calculation**:
- Based on coefficient of variation (CV = std_dev / mean)
- Lower CV = higher confidence
- Formula: confidence = max(0.3, min(1, 1 - min(CV, 1)))

### Supported KPIs

Automatically detected from historical periods:
- `successRate` (%)
- `satisfactionRate` (%)
- `avgResponseTime` (hours)
- `avgResolutionTime` (hours)
- `insidePercentage` (%)
- `dataQualityScore` (%)
- `avgConversationLength` (messages)

### Performance

- Prediction generation: ~10-50ms
- Accuracy calculation: ~5-20ms
- Memory: Minimal (only calculates needed KPIs)
- No API calls (local computation)

### Examples

```javascript
// Example 1: Simple prediction
const periods = [period1, period2, period3];
const forecast = predictNextPeriod(periods);
console.log(forecast.predictedKPIs.successRate); // "92%"

// Example 2: With validation
if (isValidForPrediction(periods)) {
  const forecast = predictNextPeriod(periods);
  console.log(`Confidence: ${forecast.confidence}`);
}

// Example 3: Accuracy metrics
const accuracy = calculatePredictionAccuracy(periods, forecast.predictedKPIs);
console.log(accuracy.mape); // Mean Absolute Percentage Error
console.log(accuracy.accuracy); // Trend direction accuracy %
```

### Confidence Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 75-100% | HIGH | Very stable KPIs, high prediction confidence |
| 50-74% | MEDIUM | Moderate variability, reasonable predictions |
| 0-49% | LOW | High variability, predictions should be cautious |

### Customization

**Change smoothing factor** (default 0.3):
```javascript
// In predictNextPeriod function
const forecast = exponentialSmoothing(values, 0.2); // Lower = more historical weight
// 0.1 = 10% recent, 0.5 = 50% recent
```

**Add custom KPIs**:
```javascript
// In extractKPINames function
const kpis = [
  'successRate',
  'myCustomKPI',  // Add here
  // ...
];
```

---

## Integration Points

### How ML Services Connect

```
ClientDetail.jsx (CSV upload)
        ↓
mlAnalyticsService.processChunkWithML()
        ↓
    ┌───┴────┬────────┬─────────────┐
    ↓        ↓        ↓             ↓
Sentiment  Topics  Context     Predictions
Analysis   Modeling Enhancement Analytics
    ↓        ↓        ↓             ↓
    └───┬────┴────┬─────────────┘
        ↓         ↓
mlAnalyticsService.enhanceAnalyticsWithML()
        ↓
Period Analytics (stored in DB)
        ↓
MLInsightsPanel (display)
```

### Data Flow

1. **CSV Upload** → ClientDetail.jsx processes chunks
2. **ML Processing** → mlAnalyticsService calls all 4 services
3. **Results Merge** → ML insights added to analytics
4. **Storage** → Results saved to localStorage/DB
5. **Display** → MLInsightsPanel renders insights

### Error Handling

All services use graceful degradation:
```javascript
try {
  const result = await mlService();
  // Success
} catch (error) {
  // Log error
  processingErrors.push({
    feature: 'ServiceName',
    error: error.message
  });
  // Continue with other services
}
```

---

## Cost Breakdown

### Per 1,000 Conversations

| Service | API | Cost | Calls |
|---------|-----|------|-------|
| Sentiment | Hugging Face | $0.00 | 1,000 |
| Topics | Hugging Face | $0.00 | 1,000 |
| Context | OpenAI | $0.20 | 1 (batch) |
| Predictions | Local | $0.00 | N/A |
| **Total** | | **~$0.20** | |

### Monthly Budget Examples

- 1,000 conversations/month: ~$0.20
- 10,000 conversations/month: ~$2.00
- 100,000 conversations/month: ~$20.00

### Cost Optimization

1. **Disable Context Enhancement** if budget limited (saves $0.20/1k)
2. **Batch processing** (already done in services)
3. **Cache embeddings** (for repeated texts)
4. **Monthly analysis** instead of real-time (batch off-hours)

---

## Monitoring & Logging

### Debug Output

Enable detailed logging:
```javascript
// In mlAnalyticsService.js
console.log('Processing chunk with ML:', { chunkSize, enabledFeatures });
```

### Error Tracking

All errors stored in analytics.mlInsights.processingErrors:
```javascript
{
  feature: 'SentimentAnalysis',
  error: 'API key invalid'
}
```

### Performance Metrics

Track in your monitoring system:
- API response times
- Number of API failures
- Cost per period
- ML insights accuracy vs actual

---

## Future Enhancements

### Planned
- [ ] Local model caching (faster, offline support)
- [ ] Fine-tuning on domain data
- [ ] Custom topic learning
- [ ] Real-time streaming analysis
- [ ] Batch API endpoints

### Optional
- [ ] Multi-language support
- [ ] Named entity recognition
- [ ] Aspect-based sentiment
- [ ] Custom embedding models
- [ ] ML model versioning

---

## API Key Management Best Practices

1. **Never commit keys to git** ✓ (stored in localStorage)
2. **Rotate keys regularly** (monthly recommended)
3. **Use read-only tokens** where possible (Hugging Face)
4. **Monitor usage** (check OpenAI dashboard monthly)
5. **Set spending limits** (OpenAI: Organization → Usage limits)
6. **Track costs** (budget notifications)

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key is valid and not expired |
| 429 Too Many Requests | Rate limited - wait 1 minute or upgrade plan |
| 500 Server Error | API service down - check status page |
| Empty results | Check input data format, try simpler text |
| Slow processing | Disable Context Enhancement or reduce batch size |

### Debug Commands

```javascript
// Test API connectivity
const testResponse = await fetch('https://api.openai.com/v1/models', {
  headers: { Authorization: `Bearer ${apiKey}` }
});
console.log(testResponse.status); // Should be 200 or 401

// Check stored settings
const settings = JSON.parse(localStorage.getItem('tenant_analytics_ml_settings'));
console.log(Object.keys(settings)); // Verify all expected keys
```

---

## References

- [Hugging Face Inference API Docs](https://huggingface.co/docs/inference-api)
- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [K-means Clustering Algorithm](https://en.wikipedia.org/wiki/K-means_clustering)
- [Exponential Smoothing](https://en.wikipedia.org/wiki/Exponential_smoothing)
- [Zero-shot Classification](https://huggingface.co/tasks/zero-shot-classification)

---

**Version**: 1.0
**Status**: Production Ready
**Last Updated**: 2024-01-30
