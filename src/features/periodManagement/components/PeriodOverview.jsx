import React, { useState } from 'react';
import { Calendar, ChevronRight, TrendingUp, AlertCircle, CheckCircle, ArrowLeft, Trash2 } from 'lucide-react';
import KPIDashboard from '../../analytics/components/KPIDashboard';

export default function PeriodOverview({ client, onBack, onDeletePeriod }) {
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const selectedPeriod = selectedPeriodId ? client.periods.find(p => p.id === selectedPeriodId) : null;

  if (selectedPeriodId && selectedPeriod) {
    // Show full KPI details
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedPeriodId(null)}
                className="p-2 hover:bg-blue-700 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold">{selectedPeriod.name}</h2>
                <p className="text-blue-100">
                  {selectedPeriod.startDate} to {selectedPeriod.endDate}
                  {selectedPeriod.isAIAnalyzed && ` • AI-Analyzed (${selectedPeriod.chunkCount} chunks)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <KPIDashboard analytics={selectedPeriod.analytics} period={selectedPeriod} />
        </div>
      </div>
    );
  }

  // Show periods overview
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Period Overview</h2>
              <p className="text-blue-100">{client.name} • {client.periods.length} period{client.periods.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Periods Grid */}
      <div className="p-6">
        {client.periods.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No periods yet. Upload data to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...client.periods]
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              .map(period => (
                <div
                  key={period.id}
                  onClick={() => setSelectedPeriodId(period.id)}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-400 transition cursor-pointer group"
                >
                  {/* Header with AI Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{period.name}</h3>
                      <p className="text-sm text-gray-600">
                        {period.startDate} to {period.endDate}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${period.name}"? This cannot be undone.`)) {
                          onDeletePeriod(period.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* AI Badge */}
                  {period.isAIAnalyzed && (
                    <div className="mb-4 inline-flex items-center gap-2 bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                      <TrendingUp size={14} />
                      AI-Analyzed
                    </div>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-gray-600 uppercase font-semibold">Inquiries</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {period.analytics?.totalInquiries || 0}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="text-xs text-gray-600 uppercase font-semibold">Success</div>
                      <div className="text-2xl font-bold text-green-600 mt-1">
                        {period.analytics?.successRate || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-orange-100">
                      <div className="text-xs text-gray-600 uppercase font-semibold">Quality</div>
                      <div className="text-2xl font-bold text-orange-600 mt-1">
                        {period.analytics?.dataQualityScore || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="text-xs text-gray-600 uppercase font-semibold">Avg Time</div>
                      <div className="text-2xl font-bold text-purple-600 mt-1">
                        {period.analytics?.avgResponseTime || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Data Quality Issues Indicator */}
                  {period.analytics?.totalIssues > 0 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-4">
                      <AlertCircle size={16} />
                      {period.analytics.totalIssues} issue{period.analytics.totalIssues !== 1 ? 's' : ''} found
                    </div>
                  )}

                  {/* Satisfaction Summary */}
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-gray-700">
                      {period.analytics?.satisfied || 0} satisfied,{' '}
                      <span className="text-red-600">{period.analytics?.frustrated || 0} frustrated</span>
                    </span>
                  </div>

                  {/* Click to View Button */}
                  <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                    View Details
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
