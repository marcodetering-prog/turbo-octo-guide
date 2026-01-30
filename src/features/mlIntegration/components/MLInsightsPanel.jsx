import React from 'react';
import { TrendingUp, AlertCircle, Zap, BarChart3 } from 'lucide-react';

export default function MLInsightsPanel({ mlInsights }) {
  if (!mlInsights) {
    return null;
  }

  const hasInsights = Object.values(mlInsights).some(
    (insight) => insight && typeof insight === 'object' && Object.keys(insight).length > 0
  );

  if (!hasInsights) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-200 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-purple-600" />
        <h3 className="text-2xl font-bold text-gray-800">ML-Enhanced Insights</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis Results */}
        {mlInsights.sentiment && (
          <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-purple-600">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Sentiment Analysis
            </h4>

            {mlInsights.sentiment.aggregatedSatisfactionRate && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Satisfaction Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {mlInsights.sentiment.aggregatedSatisfactionRate}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: mlInsights.sentiment.aggregatedSatisfactionRate,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Frustration Rate</span>
                    <span className="text-lg font-bold text-red-600">
                      {mlInsights.sentiment.aggregatedFrustrationRate}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{
                        width: mlInsights.sentiment.aggregatedFrustrationRate,
                      }}
                    />
                  </div>
                </div>

                {mlInsights.sentiment.sentimentBreakdown && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Breakdown:</p>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-sm text-green-600 font-bold">
                          {mlInsights.sentiment.sentimentBreakdown.positive}
                        </p>
                        <p className="text-xs text-gray-600">Positive</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-yellow-600 font-bold">
                          {mlInsights.sentiment.sentimentBreakdown.neutral}
                        </p>
                        <p className="text-xs text-gray-600">Neutral</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-red-600 font-bold">
                          {mlInsights.sentiment.sentimentBreakdown.negative}
                        </p>
                        <p className="text-xs text-gray-600">Negative</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Topic Modeling Results */}
        {mlInsights.topics && mlInsights.topics.emergingTopics && (
          <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-indigo-600">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Emerging Topics
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mlInsights.topics.emergingTopics.length > 0 ? (
                mlInsights.topics.emergingTopics.map((topic, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-700">
                      {idx + 1}. {topic.topic}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600">
                        {topic.percentage}
                      </span>
                      <span className="text-xs text-gray-600">({topic.count})</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No dominant topics detected yet</p>
              )}
            </div>
          </div>
        )}

        {/* Context Clusters */}
        {mlInsights.contextClusters && mlInsights.contextClusters.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-blue-600">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Context Clusters
            </h4>

            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Semantic Similarity: <span className="font-bold">{mlInsights.semanticSimilarity}%</span>
              </p>
              <p className="text-xs text-gray-600">
                {mlInsights.contextClusters.length} clusters identified
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {mlInsights.contextClusters.slice(0, 3).map((cluster, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded">
                    <p className="text-xs font-semibold text-gray-700">
                      Cluster {cluster.clusterId + 1}
                    </p>
                    <p className="text-xs text-gray-600">
                      {cluster.size} conversations
                      {cluster.commonTheme && ` • ${cluster.commonTheme}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Predictions */}
        {mlInsights.predictions && (
          <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-amber-600">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Next Period Forecast
            </h4>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Confidence Level</p>
                <p className="text-sm font-bold text-amber-600 capitalize">
                  {mlInsights.predictions.confidence}
                </p>
              </div>

              {mlInsights.predictions.predictedKPIs && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Predicted Metrics:</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(mlInsights.predictions.predictedKPIs)
                      .slice(0, 3)
                      .map(([key, value]) => {
                        const trend = mlInsights.predictions.trendIndicators?.[key];
                        const trendIcon =
                          trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
                        return (
                          <p key={key} className="text-gray-700">
                            {trendIcon}{' '}
                            <span className="font-semibold">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>{' '}
                            {value}
                          </p>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Errors */}
        {mlInsights.processingErrors && mlInsights.processingErrors.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-600">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Processing Notices
            </h4>

            <div className="space-y-2">
              {mlInsights.processingErrors.map((error, idx) => (
                <div key={idx} className="p-2 bg-red-50 rounded border border-red-200">
                  <p className="text-xs text-red-700">
                    <span className="font-semibold">{error.feature}:</span> {error.error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-6 pt-6 border-t border-purple-200 bg-purple-50 rounded p-4">
        <p className="text-xs text-purple-800">
          <strong>ℹ️ ML Insights:</strong> These insights are generated from machine learning models.
          For highest accuracy, ensure ML features are enabled in settings and configured with valid API
          keys.
        </p>
      </div>
    </div>
  );
}
