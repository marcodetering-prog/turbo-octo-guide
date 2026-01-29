import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ProgressBar({
  progress = 0,
  message = '',
  isComplete = false,
  variant = 'default'
}) {
  return (
    <div className="w-full">
      {/* Progress bar track */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            variant === 'success'
              ? 'bg-green-500'
              : variant === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Status message and percentage */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {isComplete && <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />}
          <p className={`text-sm font-medium ${
            isComplete
              ? 'text-green-600'
              : variant === 'error'
              ? 'text-red-600'
              : 'text-gray-700'
          }`}>
            {message}
          </p>
        </div>
        {!isComplete && <span className="text-xs text-gray-600">{Math.round(progress)}%</span>}
      </div>
    </div>
  );
}
