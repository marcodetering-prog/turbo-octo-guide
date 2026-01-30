import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

export default function ProgressBar({
  progress = 0,
  message = '',
  isComplete = false,
  variant = 'default',
  currentChunk = null,
  totalChunks = null,
}) {
  // Parse chunk info from message if not provided (e.g., "Chunk 1/5: Analyzing with AI")
  let chunkInfo = { current: currentChunk, total: totalChunks, action: message };

  if (!currentChunk && !totalChunks && message) {
    const chunkMatch = message.match(/Chunk (\d+)\/(\d+):\s*(.*)/);
    if (chunkMatch) {
      chunkInfo = {
        current: parseInt(chunkMatch[1]),
        total: parseInt(chunkMatch[2]),
        action: chunkMatch[3],
      };
    }
  }

  const showChunkInfo = chunkInfo.current && chunkInfo.total;

  return (
    <div className="w-full space-y-3">
      {/* Chunk Information Display */}
      {showChunkInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-blue-900">
                  Chunk {chunkInfo.current} of {chunkInfo.total}
                </div>
                <div className="text-xs text-blue-700 mt-0.5">
                  {chunkInfo.action}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {Math.round((chunkInfo.current / chunkInfo.total) * 100)}%
              </div>
              <div className="text-xs text-blue-600">chunk progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar track */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-sm">
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

      {/* Status message and overall percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete && <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />}
          <p
            className={`text-sm font-medium ${
              isComplete ? 'text-green-600' : variant === 'error' ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {!showChunkInfo ? message : 'Processing...'}
          </p>
        </div>
        <div className="text-right">
          {!isComplete && (
            <span className="text-sm font-semibold text-gray-700">{Math.round(progress)}%</span>
          )}
          {isComplete && <span className="text-sm font-semibold text-green-600">Complete!</span>}
        </div>
      </div>

      {/* Optional: Show chunk progress bar if we have chunk info */}
      {showChunkInfo && (
        <div className="pt-2">
          <div className="text-xs text-gray-600 mb-1">Overall Progress</div>
          <div className="w-full bg-gray-300 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gray-600 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
