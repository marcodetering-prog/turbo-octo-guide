import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import { parseAndStructureData, getDataSummary } from '../../../services/dataParserService';
import UploadSection from './UploadSection';

export default function ClientDetail({ client, onBack, onUpdateClient }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [parsedData, setParsedData] = useState(client?.data?.parsed);
  const [dataSummary, setDataSummary] = useState(client?.data?.summary);
  const [expandedConversations, setExpandedConversations] = useState(new Set());

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(Math.round(percentComplete));
        setProgressMessage(`Loading file... ${Math.round(percentComplete)}%`);
      }
    };

    reader.onload = (event) => {
      setProgressMessage('Parsing CSV...');
      setTimeout(() => {
        try {
          Papa.parse(event.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setProgressMessage('Structuring data...');

              // Parse and structure the data
              const structured = parseAndStructureData(results.data);
              const summary = getDataSummary(structured);

              setParsedData(structured);
              setDataSummary(summary);

              // Save to client
              onUpdateClient({
                ...client,
                data: {
                  parsed: structured,
                  summary: summary,
                  uploadedAt: new Date().toISOString(),
                },
              });

              setProgress(100);
              setProgressMessage('Complete!');
              setLoading(false);

              // Clear progress after 2 seconds
              setTimeout(() => {
                setProgress(0);
                setProgressMessage('');
              }, 2000);
            },
            error: (error) => {
              setError(`CSV parsing error: ${error.message}`);
              setLoading(false);
            },
          });
        } catch (err) {
          setError(`Error processing file: ${err.message}`);
          setLoading(false);
        }
      }, 100);
    };

    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const toggleConversation = (conversationId) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId);
    } else {
      newExpanded.add(conversationId);
    }
    setExpandedConversations(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Clients
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
        <p className="text-gray-600">
          {dataSummary
            ? `${dataSummary.totalConversations} conversations • ${dataSummary.totalMessages} messages`
            : 'Upload CSV to begin analyzing data'}
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Upload Section */}
        <UploadSection
          onFileSelect={handleFileSelect}
          error={error}
          loading={loading}
          progress={progress}
          progressMessage={progressMessage}
        />

        {/* Data Summary */}
        {dataSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Data Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Conversations</div>
                <div className="text-3xl font-bold text-blue-600">{dataSummary.totalConversations}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Messages</div>
                <div className="text-3xl font-bold text-green-600">{dataSummary.totalMessages}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Avg Messages/Conv</div>
                <div className="text-3xl font-bold text-purple-600">{dataSummary.averageMessagesPerConversation}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Unique Tenants</div>
                <div className="text-3xl font-bold text-orange-600">{dataSummary.uniqueTenants}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-600">With Phone:</span>
                <span className="ml-2 font-semibold">{dataSummary.tenantsWithPhone}</span>
              </div>
              <div>
                <span className="text-gray-600">With Email:</span>
                <span className="ml-2 font-semibold">{dataSummary.tenantsWithEmail}</span>
              </div>
              <div>
                <span className="text-gray-600">With Address:</span>
                <span className="ml-2 font-semibold">{dataSummary.tenantsWithAddress}</span>
              </div>
            </div>
          </div>
        )}

        {/* Conversations List */}
        {parsedData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conversations</h2>
            <div className="space-y-2">
              {parsedData.conversations.map((conversation) => (
                <div key={conversation.conversationId} className="border rounded-lg overflow-hidden">
                  {/* Conversation Header */}
                  <button
                    onClick={() => toggleConversation(conversation.conversationId)}
                    className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {expandedConversations.has(conversation.conversationId) ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {conversation.tenant.name || 'Unknown Tenant'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {conversation.messageCount} messages • {conversation.durationHours}h duration
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-gray-900">{conversation.conversationId}</div>
                      <div className="text-gray-600">{conversation.firstMessageTime?.split('T')[0]}</div>
                    </div>
                  </button>

                  {/* Conversation Details */}
                  {expandedConversations.has(conversation.conversationId) && (
                    <div className="bg-white border-t p-4 space-y-4">
                      {/* Tenant Info */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Tenant Information</h3>
                        <div className="space-y-1 text-sm">
                          {conversation.tenant.name && (
                            <div>
                              <span className="text-gray-600">Name:</span> {conversation.tenant.name}
                            </div>
                          )}
                          {conversation.tenant.phone && (
                            <div>
                              <span className="text-gray-600">Phone:</span> {conversation.tenant.phone}
                            </div>
                          )}
                          {conversation.tenant.email && (
                            <div>
                              <span className="text-gray-600">Email:</span> {conversation.tenant.email}
                            </div>
                          )}
                          {conversation.tenant.address && (
                            <div>
                              <span className="text-gray-600">Address:</span> {conversation.tenant.address}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Issue */}
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Issue Description</h3>
                        <p className="text-sm text-gray-700">{conversation.issue}</p>
                      </div>

                      {/* Messages */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">Messages</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                          {conversation.messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`text-sm p-2 rounded ${
                                msg.type === 'tenant'
                                  ? 'bg-blue-100 text-blue-900'
                                  : msg.type === 'support'
                                    ? 'bg-green-100 text-green-900'
                                    : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <span className="font-semibold">[{msg.type}]</span> {msg.content}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
