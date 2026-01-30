import React, { useState, useEffect } from 'react';
import * as storage from './services/storage';
import { ClientManagement, ClientDetail } from './features/clientManagement';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

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
  };

  const handleUpdateClient = (updatedClient) => {
    storage.updateClient(updatedClient.id, { data: updatedClient.data });
    loadClients();
    // Refresh selected client
    const freshClient = storage.getClients().find((c) => c.id === updatedClient.id);
    setSelectedClient(freshClient);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
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

  // 2. Client Detail View
  return (
    <ClientDetail
      client={selectedClient}
      onBack={handleBackToClients}
      onUpdateClient={handleUpdateClient}
    />
  );
}
