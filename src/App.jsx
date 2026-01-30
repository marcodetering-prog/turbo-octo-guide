import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import * as storage from './services/storage';
import { ClientManagement, ClientDetail } from './features/clientManagement';
import KPIDashboard from './features/analytics/components/KPIDashboard';
import TrendComparisonView from './features/trendAnalysis/components/TrendComparisonView';
import MLSettingsPanel from './features/mlIntegration/components/MLSettingsPanel';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);
  const [showMLSettings, setShowMLSettings] = useState(false);
  const [aiSettings] = useState(storage.getAISettings());

  const loadClients = () => {
    const loadedClients = storage.getClients();
    setClients(loadedClients);
  };

  // Load clients on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, []);

  // When client is selected with periods, show period overview
  useEffect(() => {
    if (selectedClient && selectedClient.periods && selectedClient.periods.length > 0) {
      // Stay on client detail
    }
  }, [selectedClient]);

  const handleAddClient = (name) => {
    const newClient = storage.addClient(name);
    if (newClient) {
      loadClients();
    }
  };

  const handleDeleteClient = (clientId) => {
    storage.deleteClient(clientId);
    loadClients();
    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSelectedPeriod(null);
    setShowTrendAnalysis(false);
  };

  const handleUpdateClient = (updatedClient) => {
    storage.updateClient(updatedClient.id, { periods: updatedClient.periods });
    loadClients();
    // Refresh selected client
    const freshClient = storage.getClients().find((c) => c.id === updatedClient.id);
    setSelectedClient(freshClient);
  };

  const handleSelectPeriod = (period) => {
    setSelectedPeriod(period);
    setShowTrendAnalysis(false);
  };

  const handleBackToPeriods = () => {
    setSelectedPeriod(null);
    setShowTrendAnalysis(false);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setSelectedPeriod(null);
    setShowTrendAnalysis(false);
  };

  // VIEWS
  // 1. Landing Page - Client Management
  if (!selectedClient) {
    return (
      <ClientManagement
        clients={clients}
        onAddClient={handleAddClient}
        onDeleteClient={handleDeleteClient}
        onSelectClient={handleSelectClient}
      />
    );
  }

  // 2. Period Details View
  if (selectedPeriod && !showTrendAnalysis) {
    return (
      <div>
        {/* Global Header with ML Settings */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-4 flex justify-end">
          <button
            onClick={() => setShowMLSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            <Settings className="w-5 h-5" />
            ML Settings
          </button>
        </div>
        <KPIDashboard
          analytics={selectedPeriod.analytics}
          period={selectedPeriod}
          onBack={handleBackToPeriods}
          client={selectedClient}
          periods={selectedClient.periods || []}
          onTrendAnalysis={() => setShowTrendAnalysis(true)}
          aiSettings={aiSettings}
        />
        {showMLSettings && (
          <MLSettingsPanel onClose={() => setShowMLSettings(false)} />
        )}
      </div>
    );
  }

  // 3. Trend Analysis View
  if (showTrendAnalysis && selectedClient.periods.length >= 2) {
    return (
      <div>
        {/* Global Header with ML Settings */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-4 flex justify-end">
          <button
            onClick={() => setShowMLSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            <Settings className="w-5 h-5" />
            ML Settings
          </button>
        </div>
        <TrendComparisonView
          client={selectedClient}
          periods={selectedClient.periods}
          onBack={() => setShowTrendAnalysis(false)}
          aiSettings={aiSettings}
        />
        {showMLSettings && (
          <MLSettingsPanel onClose={() => setShowMLSettings(false)} />
        )}
      </div>
    );
  }

  // 4. Client Detail View - Periods Overview
  return (
    <div>
      {/* Global Header with ML Settings */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-4 flex justify-end">
        <button
          onClick={() => setShowMLSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        >
          <Settings className="w-5 h-5" />
          ML Settings
        </button>
      </div>
      <ClientDetail
        client={selectedClient}
        onBack={handleBackToClients}
        onUpdateClient={handleUpdateClient}
        onSelectPeriod={handleSelectPeriod}
        aiSettings={aiSettings}
      />
      {showMLSettings && (
        <MLSettingsPanel onClose={() => setShowMLSettings(false)} />
      )}
    </div>
  );
}
