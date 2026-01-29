import React, { useState, useEffect } from 'react';
import * as storage from './services/storage';
import { ClientManagement, ClientDetail } from './features/clientManagement';
import KPIDashboard from './features/analytics/components/KPIDashboard';
import TrendComparisonView from './features/trendAnalysis/components/TrendComparisonView';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);
  const [aiSettings] = useState(storage.getAISettings());

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // When client is selected with periods, show period overview
  useEffect(() => {
    if (selectedClient && selectedClient.periods && selectedClient.periods.length > 0) {
      // Stay on client detail
    }
  }, [selectedClient]);

  const loadClients = () => {
    const loadedClients = storage.getClients();
    setClients(loadedClients);
  };

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
    const freshClient = storage.getClients().find(c => c.id === updatedClient.id);
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
        <KPIDashboard
          analytics={selectedPeriod.analytics}
          period={selectedPeriod}
          onBack={handleBackToPeriods}
          client={selectedClient}
          periods={selectedClient.periods || []}
          onTrendAnalysis={() => setShowTrendAnalysis(true)}
          aiSettings={aiSettings}
        />
      </div>
    );
  }

  // 3. Trend Analysis View
  if (showTrendAnalysis && selectedClient.periods.length >= 2) {
    return (
      <TrendComparisonView
        client={selectedClient}
        periods={selectedClient.periods}
        onBack={() => setShowTrendAnalysis(false)}
        aiSettings={aiSettings}
      />
    );
  }

  // 4. Client Detail View - Periods Overview
  return (
    <ClientDetail
      client={selectedClient}
      onBack={handleBackToClients}
      onUpdateClient={handleUpdateClient}
      onSelectPeriod={handleSelectPeriod}
      aiSettings={aiSettings}
    />
  );
}
