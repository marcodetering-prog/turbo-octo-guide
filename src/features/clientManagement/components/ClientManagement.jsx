import React, { useState } from 'react';
import { Plus, Trash2, Users, ArrowRight } from 'lucide-react';

export default function ClientManagement({ clients, onAddClient, onDeleteClient, onSelectClient }) {
  const [newClientName, setNewClientName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    onAddClient(newClientName.trim());
    setNewClientName('');
    setShowAddForm(false);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/50 p-8 font-sans">
      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Client?</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete this client? This action cannot be undone and all data will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Tenant Analytics
              </h1>
            </div>
            <p className="text-slate-500 text-lg ml-1">
              Manage your clients and track inquiry performance
            </p>
          </div>

          {/* Add Client Toggle Button (Visible when form is closed) */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 font-medium"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Add New Client
            </button>
          )}
        </div>

        {/* Add Client Form */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAddForm ? 'max-h-40 opacity-100 mb-10' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-2xl shadow-xl p-1">
            <div className="flex gap-2 p-2">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddClient()}
                placeholder="Enter client name..."
                autoFocus={showAddForm}
                className="flex-1 px-4 py-3 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder:text-slate-400 font-medium"
              />
              <button
                onClick={handleAddClient}
                disabled={!newClientName.trim()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewClientName('');
                }}
                className="px-6 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm border border-dashed border-slate-300 rounded-3xl p-16 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Clients Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Get started by adding your first client to track their analytics and inquiries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clients.map((client) => {
              const hasData = (client.periods && client.periods.length > 0) || (client.data && client.data.summary);
              const latestPeriod = client.periods && client.periods.length > 0 ? client.periods[client.periods.length - 1] : null;
              const summary = client.data?.summary;

              return (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="group relative bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToDelete(client.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors z-10 relative"
                        title="Delete client"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                      {hasData ? 'Data available' : 'No data'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-4 border-t border-slate-50 flex-1 bg-slate-50/30">
                    {hasData ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Latest Activity</p>
                          <p className="font-medium text-slate-700">
                            {latestPeriod ? latestPeriod.name : 'Uploaded File'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-500">
                            {latestPeriod ? latestPeriod.startDate : (client.data?.uploadedAt ? new Date(client.data.uploadedAt).toLocaleDateString() : 'N/A')}
                          </div>
                          <div className="px-2.5 py-1 bg-white border border-slate-100 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                            {latestPeriod
                              ? `${client.periods.reduce((sum, p) => sum + (p.inquiryCount || 0), 0)} Inquiries`
                              : `${summary?.totalMessages || 0} Messages`
                            }
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-slate-400 text-sm font-medium">No data uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClient(client);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all font-medium group/btn"
                    >
                      View Details
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
