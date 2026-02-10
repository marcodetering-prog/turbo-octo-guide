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
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-8 mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-indigo-500" />
        {uiStrings.clientDetail.uploadSection.title}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-pulse">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading && progress > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
            <span>{progressMessage}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <label
          className={`group flex-1 py-12 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden ${loading
              ? 'border-slate-200 bg-slate-50 cursor-wait opacity-70'
              : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'
            }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            disabled={loading}
            className="hidden"
          />
          <div className="text-center relative z-10 transition-transform group-hover:scale-105 duration-300">
            {loading ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin">
                  <Loader2 className="w-full h-full" />
                </div>
                <p className="text-indigo-600 font-semibold text-lg">
                  {uiStrings.clientDetail.uploadSection.processing}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 transition-colors shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-slate-900 font-bold text-lg mb-1">
                  {uiStrings.clientDetail.uploadSection.clickToUpload}
                </p>
                <p className="text-slate-500">
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
