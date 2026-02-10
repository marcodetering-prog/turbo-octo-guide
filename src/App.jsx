import React, { useState, useEffect } from 'react';
import * as storage from './services/supabaseService';
import { ClientManagement, ClientDetail } from './features/clientManagement';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const loadClients = async () => {
    const loadedClients = await storage.getClients();
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

  const handleAddClient = async (name) => {
    const newClient = await storage.addClient(name);
    if (newClient) {
      await loadClients();
    }
  };

  const handleDeleteClient = async (clientId) => {
    await storage.deleteClient(clientId);
    await loadClients();
    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
  };

  const handleUpdateClient = async (updatedClient) => {
    await storage.updateClient(updatedClient.id, { data: updatedClient.data });
    await loadClients();
    // Refresh selected client
    const clients = await storage.getClients();
    const freshClient = clients.find((c) => c.id === updatedClient.id);
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
