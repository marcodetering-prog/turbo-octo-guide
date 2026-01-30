import React, { useState } from 'react';
import { Plus, Trash2, Users, ArrowRight } from 'lucide-react';

export default function ClientManagement({ clients, onAddClient, onDeleteClient, onSelectClient }) {
  const [newClientName, setNewClientName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    onAddClient(newClientName.trim());
    setNewClientName('');
    setShowAddForm(false);
  };

  const handleDeleteClient = (clientId) => {
    if (confirm('Are you sure you want to delete this client and all their data?')) {
      onDeleteClient(clientId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Tenant Analytics</h1>
          </div>
          <p className="text-gray-600">Manage your clients and track analytics</p>
        </div>

        {/* Add Client Form */}
        {showAddForm ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Client</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddClient()}
                placeholder="Client name"
                autoFocus
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddClient}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewClientName('');
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        )}

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Clients Yet</h3>
            <p className="text-gray-600">Create your first client to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{client.name}</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        {client.periods?.length || 0} period
                        {client.periods?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 hover:bg-red-500 rounded-lg transition-colors"
                      title="Delete client"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {client.periods && client.periods.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Latest Period:</p>
                        <p className="font-semibold text-gray-800">
                          {client.periods[client.periods.length - 1].name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.periods[client.periods.length - 1].startDate} to{' '}
                          {client.periods[client.periods.length - 1].endDate}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          Total Inquiries:{' '}
                          <span className="font-semibold text-gray-800">
                            {client.periods.reduce((sum, p) => sum + (p.inquiryCount || 0), 0)}
                          </span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">No data uploaded yet</p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => onSelectClient(client)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    View
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
