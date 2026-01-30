import React from 'react';

export default function PeriodCard({ period, onSelectPeriod }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
      {/* Period Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h3 className="text-lg font-bold">{period.name}</h3>
        <p className="text-blue-100 text-sm mt-1">
          {period.startDate} to {period.endDate}
        </p>
        {period.isAIAnalyzed && (
          <div className="flex items-center gap-1 mt-2 text-yellow-300 text-sm">
            <span>⚡</span>
            <span>AI-Analyzed</span>
          </div>
        )}
      </div>

      {/* Basic KPIs */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Total Inquiries</span>
          <span className="text-2xl font-bold text-blue-600">{period.inquiryCount || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Success Rate</span>
          <span className="text-lg font-semibold text-green-600">
            {period.analytics?.successRate || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Data Quality</span>
          <span className="text-lg font-semibold text-purple-600">
            {period.analytics?.dataQualityScore || 'N/A'}
          </span>
        </div>
      </div>

      {/* Details Button */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => onSelectPeriod(period)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
