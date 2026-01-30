import React from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import ProgressBar from '../../../components/ProgressBar';
import uiStrings from '../../../config/uiStrings.json';

export default function UploadSection({
  showUpload,
  onToggleUpload,
  onFileSelect,
  error,
  loading,
  progress,
  progressMessage,
}) {
  if (!showUpload) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {uiStrings.clientDetail.uploadSection.title}
      </h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {loading && progress > 0 && (
        <div className="mb-6">
          <ProgressBar
            progress={progress}
            message={progressMessage}
            isComplete={progress === 100}
            variant={progress === 100 ? 'success' : 'default'}
          />
        </div>
      )}
      <div className="flex gap-3">
        <label
          className={`flex-1 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            loading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            disabled={loading}
            className="hidden"
          />
          <div className="text-center">
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
                <p className="text-blue-600 font-semibold">
                  {uiStrings.clientDetail.uploadSection.processing}
                </p>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 font-semibold">
                  {uiStrings.clientDetail.uploadSection.clickToUpload}
                </p>
                <p className="text-sm text-gray-500">
                  {uiStrings.clientDetail.uploadSection.dragAndDrop}
                </p>
              </>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
