import React, { useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import * as storage from './localStorage';

export default function BackupRestore({ onRestoreComplete }) {
  const fileInputRef = useRef(null);
  const [message, setMessage] = React.useState(null);
  const [messageType, setMessageType] = React.useState('success');

  const handleExport = () => {
    try {
      const data = storage.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage(`✓ Backup exported successfully (${data.clients.length} clients)`);
      setMessageType('success');
    } catch (error) {
      setMessage(`✗ Export failed: ${error.message}`);
      setMessageType('error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);

        if (!data.clients || !data.settings) {
          throw new Error('Invalid backup file format');
        }

        const confirmed = confirm(
          `Restore backup with ${data.clients.length} clients? This will replace current data.`
        );

        if (confirmed) {
          storage.importData(data);
          setMessage(`✓ Data restored successfully (${data.clients.length} clients)`);
          setMessageType('success');
          onRestoreComplete?.();
        }
      } catch (error) {
        setMessage(`✗ Import failed: ${error.message}`);
        setMessageType('error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={18} />
            Export Backup
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Upload size={18} />
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {message && (
          <div className={`flex items-center gap-2 text-sm ${messageType === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {messageType === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {message}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 mt-3">
        💡 Tip: Export a backup before making any updates. Use the import button to restore your data if needed.
      </p>
    </div>
  );
}
