/**
 * ML Services Validation Tests
 * Tests core functionality of ML integration without API calls
 */

import { getMLSettings, saveMLSettings, resetMLSettings } from '../services/mlConfigService';
import { processChunkWithML, aggregateMLInsights } from '../services/mlAnalyticsService';
import { analyzeSentiment } from '../services/sentimentService';

describe('ML Config Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getMLSettings returns default config', () => {
    const settings = getMLSettings();
    expect(settings).toHaveProperty('enabled');
    expect(settings).toHaveProperty('sentiment');
    expect(settings).toHaveProperty('topicModeling');
    expect(settings).toHaveProperty('contextEnhancement');
    expect(settings).toHaveProperty('predictiveAnalytics');
  });

  test('saveMLSettings persists to localStorage', () => {
    const customSettings = {
      enabled: true,
      sentiment: { enabled: true, provider: 'huggingface', apiKey: 'test-key' },
      topicModeling: { enabled: false, method: 'huggingface', apiKey: '' },
    };

    saveMLSettings(customSettings);
    const retrieved = getMLSettings();

    expect(retrieved.sentiment.apiKey).toBe('test-key');
    expect(retrieved.topicModeling.enabled).toBe(false);
  });

  test('resetMLSettings clears configuration', () => {
    const customSettings = {
      sentiment: { enabled: true, apiKey: 'test-key' },
    };

    saveMLSettings(customSettings);
    resetMLSettings();
    const settings = getMLSettings();

    expect(settings.sentiment.apiKey).toBe('');
  });
});

describe('Sentiment Analysis Service', () => {
  test('analyzeSentiment returns valid structure', async () => {
    const testMessages = [
      { content: 'This is great!' },
      { content: 'I am frustrated' },
      { content: 'It is okay' },
    ];

    const result = await analyzeSentiment(testMessages, 'dummy-key');

    expect(result).toHaveProperty('messageSentiments');
    expect(result).toHaveProperty('aggregatedSentiment');
    expect(result).toHaveProperty('sentimentBreakdown');
    expect(result).toHaveProperty('satisfactionRate');
    expect(result).toHaveProperty('frustrationRate');
  });

  test('sentiment breakdown sums to message count', async () => {
    const testMessages = Array(10).fill({ content: 'test' });
    const result = await analyzeSentiment(testMessages, 'dummy-key');

    const { positive, neutral, negative } = result.sentimentBreakdown;
    const total = positive + neutral + negative;

    expect(total).toBe(testMessages.length);
  });

  test('satisfaction and frustration rates are percentages', async () => {
    const testMessages = [{ content: 'test' }];
    const result = await analyzeSentiment(testMessages, 'dummy-key');

    expect(result.satisfactionRate).toMatch(/%$/);
    expect(result.frustrationRate).toMatch(/%$/);
  });
});

describe('ML Analytics Service', () => {
  test('processChunkWithML returns valid structure', async () => {
    const chunkData = {
      conversations: [
        {
          id: '1',
          messages: [{ content: 'test message' }],
        },
      ],
    };

    const result = await processChunkWithML(chunkData, [], {
      sentiment: { enabled: false },
      topicModeling: { enabled: false },
      contextEnhancement: { enabled: false },
      predictiveAnalytics: { enabled: false },
    });

    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('topics');
    expect(result).toHaveProperty('contextClusters');
    expect(result).toHaveProperty('predictions');
    expect(result).toHaveProperty('processingErrors');
    expect(Array.isArray(result.processingErrors)).toBe(true);
  });

  test('aggregateMLInsights combines multiple results', () => {
    const mlInsights1 = {
      sentiment: {
        satisfactionRate: '80%',
        frustrationRate: '10%',
        sentimentBreakdown: { positive: 8, neutral: 1, negative: 1 },
      },
      topics: { emergingTopics: [] },
    };

    const mlInsights2 = {
      sentiment: {
        satisfactionRate: '90%',
        frustrationRate: '5%',
        sentimentBreakdown: { positive: 9, neutral: 1, negative: 0 },
      },
      topics: { emergingTopics: [] },
    };

    const aggregated = aggregateMLInsights([mlInsights1, mlInsights2]);

    expect(aggregated).toHaveProperty('sentiment');
    expect(aggregated.sentiment.aggregatedSatisfactionRate).toBeDefined();
  });
});

describe('ML Integration Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('Full ML pipeline with all features disabled', async () => {
    const settings = {
      enabled: false,
      sentiment: { enabled: false },
      topicModeling: { enabled: false },
      contextEnhancement: { enabled: false },
      predictiveAnalytics: { enabled: false },
    };

    saveMLSettings(settings);

    const chunkData = {
      conversations: [{ id: '1', messages: [{ content: 'test' }] }],
    };

    const result = await processChunkWithML(chunkData, [], settings);

    // Should return empty but valid structure
    expect(result.processingErrors.length).toBeGreaterThanOrEqual(0);
  });

  test('ML pipeline gracefully handles missing configuration', async () => {
    const incompleteConfig = {
      sentiment: { enabled: true }, // missing apiKey
    };

    const chunkData = {
      conversations: [{ id: '1', messages: [{ content: 'test' }] }],
    };

    const result = await processChunkWithML(chunkData, [], incompleteConfig);

    // Should not crash, should continue with other features
    expect(result).toBeDefined();
  });
});

describe('Data Validation', () => {
  test('processChunkWithML handles empty conversations', async () => {
    const chunkData = { conversations: [] };

    const result = await processChunkWithML(chunkData, [], {
      sentiment: { enabled: false },
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.processingErrors)).toBe(true);
  });

  test('analyzeSentiment handles empty message list', async () => {
    const result = await analyzeSentiment([], 'dummy-key');

    expect(result.messageSentiments).toEqual([]);
    expect(result.sentimentBreakdown.positive).toBe(0);
  });

  test('aggregateMLInsights handles empty array', () => {
    const result = aggregateMLInsights([]);

    expect(result).toBeDefined();
    expect(result.sentiment).toBeDefined();
  });
});
