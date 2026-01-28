import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function KPIDashboard({ analytics, period, onBack, client, periods, onTrendAnalysis }) {
  if (!analytics) return null;

  const COLORS = {
    deficiencies: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'],
    satisfaction: { satisfied: '#10b981', neutral: '#f59e0b', frustrated: '#ef4444' },
    window: { inside: '#10b981', outside: '#ef4444' },
    success: { successful: '#10b981', failed: '#ef4444' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{period.name}</h1>
              <p className="text-gray-600">{period.startDate} to {period.endDate}</p>
            </div>
          </div>
          {periods && periods.length >= 2 && onTrendAnalysis && (
            <button
              onClick={onTrendAnalysis}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              <TrendingUp className="w-5 h-5" />
              Compare Periods
            </button>
          )}
        </div>

        {/* KPI Content */}
        <div className="space-y-8">
      {/* KEY METRICS GRID */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Inquiries */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-700 font-semibold uppercase">Total Inquiries</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{analytics.totalInquiries || 0}</div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700 font-semibold uppercase">Success Rate</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{analytics.successRate || 'N/A'}</div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-700 font-semibold uppercase">Avg Response Time</div>
            <div className="text-3xl font-bold text-purple-900 mt-2">{analytics.avgResponseTime || 'N/A'}</div>
          </div>

          {/* Avg Resolution Time */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-orange-700 font-semibold uppercase">Avg Resolution Time</div>
            <div className="text-3xl font-bold text-orange-900 mt-2">{analytics.avgResolutionTime || 'N/A'} min</div>
          </div>

          {/* Data Quality Score */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-sm text-red-700 font-semibold uppercase">Data Quality</div>
            <div className="text-3xl font-bold text-red-900 mt-2">{analytics.dataQualityScore || 'N/A'}</div>
          </div>

          {/* Avg Conversation Length */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200">
            <div className="text-sm text-cyan-700 font-semibold uppercase">Avg Conv. Length</div>
            <div className="text-3xl font-bold text-cyan-900 mt-2">{parseFloat(analytics.avgConversationLength || 0).toFixed(1)} msgs</div>
          </div>

          {/* Working Hours % */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
            <div className="text-sm text-indigo-700 font-semibold uppercase">Working Hours</div>
            <div className="text-3xl font-bold text-indigo-900 mt-2">{analytics.insidePercentage || '0%'}</div>
          </div>

          {/* After Hours % */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
            <div className="text-sm text-pink-700 font-semibold uppercase">After Hours</div>
            <div className="text-3xl font-bold text-pink-900 mt-2">{analytics.outsidePercentage || '0%'}</div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deficiency Breakdown */}
        {analytics.deficiencyData && analytics.deficiencyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4">Deficiency Types Breakdown</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deficiencyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.deficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.deficiencies[index % COLORS.deficiencies.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Satisfaction Distribution */}
        {analytics.satisfactionData && analytics.satisfactionData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4">Satisfaction Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.satisfactionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.satisfactionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Satisfied'
                          ? COLORS.satisfaction.satisfied
                          : entry.name === 'Neutral'
                          ? COLORS.satisfaction.neutral
                          : COLORS.satisfaction.frustrated
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Window Distribution */}
        {analytics.timeWindowData && analytics.timeWindowData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4">Working Hours vs After Hours</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeWindowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Report Success Distribution */}
        {analytics.successData && analytics.successData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4">Report Success vs Failed</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.successData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[COLORS.success.successful, COLORS.success.failed].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Hourly Distribution */}
      {analytics.hourlyData && analytics.hourlyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Inquiries by Hour of Day</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Estimates */}
      {analytics.costData && analytics.costData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Cost Estimates by Category</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgCost" fill="#f59e0b" name="Avg Cost" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.costData.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-semibold">{item.name}</div>
                <div className="text-lg font-bold text-gray-800 mt-1">${parseFloat(item.avgCost).toFixed(2)}</div>
                <div className="text-xs text-gray-600 mt-1">{item.count} inquiries</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Additional Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Inside Working Hours Count */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Inside Working Hours</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">{analytics.insideWorkingHours || 0}</div>
            <div className="text-xs text-gray-500 mt-1">inquiries</div>
          </div>

          {/* Outside Working Hours Count */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Outside Working Hours</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">{analytics.outsideWorkingHours || 0}</div>
            <div className="text-xs text-gray-500 mt-1">inquiries</div>
          </div>

          {/* Successful Reports */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Successful Reports</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{analytics.successfulReports || 0}</div>
            <div className="text-xs text-gray-500 mt-1">reports</div>
          </div>

          {/* Failed Reports */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Failed Reports</div>
            <div className="text-2xl font-bold text-red-600 mt-2">{analytics.failedReports || 0}</div>
            <div className="text-xs text-gray-500 mt-1">reports</div>
          </div>

          {/* Satisfied Count */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Satisfied</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{analytics.satisfied || 0}</div>
            <div className="text-xs text-gray-500 mt-1">users</div>
          </div>

          {/* Frustrated Count */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Frustrated</div>
            <div className="text-2xl font-bold text-red-600 mt-2">{analytics.frustrated || 0}</div>
            <div className="text-xs text-gray-500 mt-1">users</div>
          </div>

          {/* Total Issues */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Data Quality Issues</div>
            <div className="text-2xl font-bold text-orange-600 mt-2">{analytics.totalIssues || 0}</div>
            <div className="text-xs text-gray-500 mt-1">issues found</div>
          </div>

          {/* Inquiry Count */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-600 font-semibold">Total Inquiries (Period)</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{period.inquiryCount || 0}</div>
            <div className="text-xs text-gray-500 mt-1">inquiries</div>
          </div>
        </div>
      </div>

      {/* Validation Issues */}
      {analytics.validationIssues && Object.keys(analytics.validationIssues).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            Data Quality Issues
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(analytics.validationIssues).map(([key, values]) => {
              const count = Array.isArray(values) ? values.length : 0;
              return count > 0 ? (
                <div key={key} className="bg-white p-3 rounded border border-yellow-200">
                  <div className="text-sm text-gray-700 font-semibold capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-bold text-yellow-700 mt-1">{count}</div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
