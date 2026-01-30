/**
 * Context Enhancement Service
 * Provides semantic understanding through OpenAI Embeddings + k-means clustering
 * Model: text-embedding-3-small (1536 dimensions)
 */

/**
 * Enhance context with semantic analysis and clustering
 * @param {Array} inquiries - Array of conversations
 * @param {Object} config - Config with OpenAI API key
 * @returns {Promise<Object>} Context clusters and semantic analysis
 */
export const enhanceContext = async (inquiries, config) => {
  const results = {
    contextClusters: [],
    semanticSimilarity: 0,
    contextualKPIs: {},
  };

  if (!inquiries || inquiries.length === 0) {
    return results;
  }

  const apiKey = config.apiKey || config;

  try {
    // Extract conversation texts
    const conversationTexts = inquiries.map((conversation) => {
      const tenantMessages = conversation.filter(
        (msg) => msg.MessageType === '3' || msg.MessageType === 3
      );

      return {
        conversationId: conversation[0].ConversationId,
        text: tenantMessages
          .map((msg) => msg.Content || '')
          .filter((text) => text.length > 0)
          .join(' ')
          .substring(0, 1024),
      };
    });

    // Filter out empty conversations
    const validConversations = conversationTexts.filter((c) => c.text.length > 10);

    if (validConversations.length === 0) {
      return results;
    }

    // Get embeddings for all conversations
    const embeddings = await getEmbeddings(
      validConversations.map((c) => c.text),
      apiKey,
      config.model
    );

    if (embeddings.length === 0) {
      return results;
    }

    // Perform k-means clustering
    const k = Math.min(5, Math.ceil(validConversations.length / 5));
    const clusters = kMeansClustering(embeddings, k, validConversations);

    // Calculate semantic similarity
    const similarity = calculateSemanticSimilarity(embeddings);

    // Organize results
    results.contextClusters = clusters.map((cluster, idx) => ({
      clusterId: idx,
      size: cluster.indices.length,
      conversations: cluster.indices.map((i) => validConversations[i].conversationId),
      commonTheme: generateClusterTheme(
        cluster.indices.map((i) => validConversations[i].text)
      ),
      cohesion: cluster.cohesion,
    }));

    results.semanticSimilarity = Math.round(similarity);

    return results;
  } catch (error) {
    console.warn('Context enhancement failed:', error.message);
    return results;
  }
};

/**
 * Get embeddings from OpenAI API
 * @private
 */
const getEmbeddings = async (texts, apiKey, model) => {
  const endpoint = 'https://api.openai.com/v1/embeddings';
  const defaultModel = 'text-embedding-3-small';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || defaultModel,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Unexpected API response format');
  }

  // Extract embeddings in order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
};

/**
 * K-means clustering algorithm
 * @private
 */
const kMeansClustering = (embeddings, k, conversations) => {
  // Initialize random centroids
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIdx = Math.floor(Math.random() * embeddings.length);
    centroids.push(embeddings[randomIdx]);
  }

  let clusters = [];
  let converged = false;
  let iterations = 0;
  const maxIterations = 10;

  while (!converged && iterations < maxIterations) {
    // Assign points to nearest centroid
    clusters = Array(k)
      .fill(null)
      .map(() => ({ indices: [], centroid: null }));

    for (let i = 0; i < embeddings.length; i++) {
      let minDist = Infinity;
      let nearestCluster = 0;

      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(embeddings[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = j;
        }
      }

      clusters[nearestCluster].indices.push(i);
    }

    // Update centroids
    let newCentroids = [];
    let changed = false;

    for (let i = 0; i < k; i++) {
      if (clusters[i].indices.length === 0) {
        // Keep old centroid if cluster is empty
        newCentroids.push(centroids[i]);
      } else {
        const newCentroid = calculateCentroid(
          clusters[i].indices.map((idx) => embeddings[idx])
        );
        newCentroids.push(newCentroid);

        // Check if centroid changed significantly
        if (euclideanDistance(newCentroid, centroids[i]) > 0.01) {
          changed = true;
        }
      }
    }

    centroids = newCentroids;
    converged = !changed;
    iterations++;
  }

  // Calculate cluster cohesion
  return clusters.map((cluster) => {
    let cohesion = 0;
    if (cluster.indices.length > 1) {
      const centroid = calculateCentroid(
        cluster.indices.map((idx) => embeddings[idx])
      );
      cohesion =
        cluster.indices.reduce((sum, idx) => sum + euclideanDistance(embeddings[idx], centroid), 0) /
        cluster.indices.length;
    }

    return { ...cluster, cohesion: Math.round((1 - Math.min(cohesion, 1)) * 100) };
  });
};

/**
 * Calculate Euclidean distance between two vectors
 * @private
 */
const euclideanDistance = (vec1, vec2) => {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  return Math.sqrt(sum);
};

/**
 * Calculate centroid of vectors
 * @private
 */
const calculateCentroid = (vectors) => {
  if (vectors.length === 0) return [];

  const centroid = new Array(vectors[0].length).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < vector.length; i++) {
      centroid[i] += vector[i];
    }
  }

  return centroid.map((val) => val / vectors.length);
};

/**
 * Calculate overall semantic similarity using cosine similarity
 * @private
 */
const calculateSemanticSimilarity = (embeddings) => {
  if (embeddings.length < 2) return 0;

  let totalSimilarity = 0;
  let comparisons = 0;

  // Sample pairs for efficiency (don't compute all pairs for large datasets)
  const sampleSize = Math.min(20, embeddings.length);
  for (let i = 0; i < sampleSize; i++) {
    const idx1 = Math.floor(Math.random() * embeddings.length);
    const idx2 = Math.floor(Math.random() * embeddings.length);

    if (idx1 !== idx2) {
      const similarity = cosineSimilarity(embeddings[idx1], embeddings[idx2]);
      totalSimilarity += similarity;
      comparisons++;
    }
  }

  return comparisons > 0 ? (totalSimilarity / comparisons) * 100 : 0;
};

/**
 * Calculate cosine similarity between two vectors
 * @private
 */
const cosineSimilarity = (vec1, vec2) => {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

/**
 * Generate a theme label for a cluster based on its conversations
 * @private
 */
const generateClusterTheme = (texts) => {
  // Extract common keywords/themes from texts
  const words = texts
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4);

  const wordFreq = {};
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Find most common word as theme
  const topWord = Object.entries(wordFreq).sort((a, b) => b[1] - a[1])[0];
  return topWord
    ? topWord[0].charAt(0).toUpperCase() + topWord[0].slice(1) + ' Issues'
    : 'General Issues';
};
