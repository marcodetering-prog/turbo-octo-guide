import React from 'react';
import { Calendar } from 'lucide-react';
import PeriodCard from './PeriodCard';

export default function PeriodsGrid({ periods, onSelectPeriod }) {
  if (!periods || periods.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Periods Yet</h3>
        <p className="text-gray-600">Upload a CSV file to create periods automatically</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {periods.map((period) => (
        <PeriodCard key={period.id} period={period} onSelectPeriod={onSelectPeriod} />
      ))}
    </div>
  );
}
