import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Users, MapPin, Building, MessageSquare, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { parseAndStructureData, getDataSummary, cleanAILEANInput, groupConversationsByProperty } from '../../../services/dataParserService';
import UploadSection from './UploadSection';

export default function ClientDetail({ client, onBack, onUpdateClient }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [parsedData, setParsedData] = useState(client?.data?.parsed);
  const [dataSummary, setDataSummary] = useState(client?.data?.summary);
  const [expandedConversations, setExpandedConversations] = useState(new Set());
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' | 'properties'

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
      const rawCSVText = event.target.result;
      setTimeout(() => {
        try {
          // Clean AILEAN format by removing metadata section before parsing
          const cleanedCSV = cleanAILEANInput(rawCSVText);

          Papa.parse(cleanedCSV, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setProgressMessage('Structuring data...');

              // Parse and structure the data (pass raw text for metadata extraction)
              const structured = parseAndStructureData(results.data, rawCSVText);
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

  const properties = useMemo(() => {
    if (!parsedData?.conversations) return {};
    return groupConversationsByProperty(parsedData.conversations);
  }, [parsedData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-3 transition-colors text-sm"
          >
            <div className="p-1 rounded-md bg-slate-100 group-hover:bg-indigo-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                {client.name}
              </h1>
              <p className="text-slate-500 mt-1">
                {dataSummary
                  ? `${dataSummary.totalConversations} conversations found`
                  : 'Upload tenant message data to get started'}
              </p>
            </div>

            {/* Quick Stats Mini-Bar (only valid if data exists) */}
            {dataSummary && (
              <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <span>{dataSummary.uniqueTenants} Tenants</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{dataSummary.totalMessages} Messages</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Upload Section */}
        <UploadSection
          showUpload={true}
          onFileSelect={handleFileSelect}
          error={error}
          loading={loading}
          progress={progress}
          progressMessage={progressMessage}
        />

        {/* Data Summary */}
        {dataSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-slate-500 mb-1">Total Conversations</div>
              <div className="text-3xl font-bold text-indigo-600">{dataSummary.totalConversations}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-slate-500 mb-1">Total Messages</div>
              <div className="text-3xl font-bold text-violet-600">{dataSummary.totalMessages}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-slate-500 mb-1">Avg Messages/Conv</div>
              <div className="text-3xl font-bold text-fuchsia-600">{dataSummary.averageMessagesPerConversation}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-slate-500 mb-1">Properties</div>
              <div className="text-3xl font-bold text-emerald-600">{dataSummary.uniqueProperties || Object.keys(properties).length}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {parsedData && (
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex gap-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === 'conversations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                <MessageSquare className="w-4 h-4" />
                Conversations
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === 'properties'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                <Building className="w-4 h-4" />
                Property Analytics
              </button>
            </nav>
          </div>
        )}

        {/* Tab Content */}
        {parsedData && activeTab === 'conversations' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-slate-900 px-1">Detailed Conversations</h2>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
              {parsedData.conversations.map((conversation) => {
                const safeDate = (dateStr) => {
                  if (!dateStr) return null;
                  try {
                    const d = new Date(dateStr);
                    // Check if date is valid
                    if (isNaN(d.getTime())) return null;
                    return d;
                  } catch (e) {
                    return null;
                  }
                };

                const firstMsgDate = safeDate(conversation.firstMessageTime);

                return (
                  <div key={conversation.conversationId} className="group bg-white hover:bg-slate-50/80 transition-colors">
                    {/* Conversation Header */}
                    <button
                      onClick={() => toggleConversation(conversation.conversationId)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-full transition-colors ${expandedConversations.has(conversation.conversationId) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}`}>
                          {expandedConversations.has(conversation.conversationId) ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="font-semibold text-slate-900 text-lg">
                            {conversation.tenant.name || 'Unknown Tenant'}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600 border border-slate-200">ID: {conversation.conversationId}</span>
                            <span>•</span>
                            <span>{conversation.messageCount} messages</span>
                            <span>•</span>
                            <span>{conversation.durationHours}h duration</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">
                          {firstMsgDate ? firstMsgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {firstMsgDate ? firstMsgDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </button>

                    {/* Conversation Details */}
                    {expandedConversations.has(conversation.conversationId) && (
                      <div className="bg-slate-50/50 border-t border-indigo-100 p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                        {/* Tenant Info & Issue Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Tenant Info */}
                          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-500" /> Tenant Details
                            </h3>
                            <div className="space-y-2 text-sm">
                              {conversation.tenant.name && (
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                  <span className="text-slate-500">Name</span>
                                  <span className="font-medium text-slate-900">{conversation.tenant.name}</span>
                                </div>
                              )}
                              {conversation.tenant.phone && (
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                  <span className="text-slate-500">Phone</span>
                                  <span className="font-medium text-slate-900">{conversation.tenant.phone}</span>
                                </div>
                              )}
                              {conversation.tenant.email && (
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                  <span className="text-slate-500">Email</span>
                                  <span className="font-medium text-slate-900">{conversation.tenant.email}</span>
                                </div>
                              )}
                              {conversation.tenant.address && (
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                  <span className="text-slate-500">Address</span>
                                  <span className="font-medium text-slate-900 text-right">{conversation.tenant.address}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Issue */}
                          <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                            <h3 className="font-semibold text-indigo-900 mb-2">Issue Description</h3>
                            <p className="text-sm text-indigo-800 leading-relaxed bg-white/50 p-3 rounded-lg border border-indigo-100/50">
                              {conversation.issue}
                            </p>
                          </div>
                        </div>

                        {/* Messages */}
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-3 ml-1">Message History</h3>
                          <div className="bg-white rounded-xl border border-slate-200 shadow-inner p-4 space-y-3 max-h-[500px] overflow-y-auto">
                            {conversation.messages.map((msg, idx) => {
                              const msgDate = safeDate(msg.timestamp);
                              return (
                                <div
                                  key={idx}
                                  className={`flex flex-col ${msg.type === 'tenant'
                                    ? 'items-start'
                                    : msg.type === 'support'
                                      ? 'items-end'
                                      : 'items-center'
                                    }`}
                                >
                                  <div
                                    className={`max-w-[85%] text-sm px-4 py-3 rounded-2xl shadow-sm ${msg.type === 'tenant'
                                      ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                                      : msg.type === 'support'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-yellow-50 text-slate-600 border border-yellow-100 text-center text-xs py-1'
                                      }`}
                                  >
                                    {msg.content}
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                                    {msgDate ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Property Analytics Tab */}
        {parsedData && activeTab === 'properties' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-slate-900 px-1">Property Overview</h2>

            {Object.keys(properties).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">No property addresses found in the data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {Object.values(properties).map((prop, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{prop.address}</h3>
                            <p className="text-slate-500 text-sm mt-1">
                              Last Activity: {prop.lastActivity ? new Date(prop.lastActivity).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                            {prop.tenantCount} Tenants
                          </span>
                          <span className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                            {prop.conversations.length} Conversations
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                        {/* Tenants List */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Residents
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {prop.tenantNames.length > 0 ? (
                              prop.tenantNames.map((name, i) => (
                                <span key={i} className="inline-block px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md text-sm border border-slate-100">
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-sm italic">Unknown residents</span>
                            )}
                          </div>
                        </div>

                        {/* Issues List */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> Recent Issues
                          </h4>
                          <div className="space-y-2">
                            {prop.issues.length > 0 ? (
                              prop.issues.slice(0, 3).map((issue, i) => (
                                <div key={i} className="text-sm p-2 rounded-lg bg-orange-50 border border-orange-100 text-orange-900">
                                  {issue.description.length > 80 ? issue.description.substring(0, 80) + '...' : issue.description}
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-400 text-sm italic">No issues reported</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
