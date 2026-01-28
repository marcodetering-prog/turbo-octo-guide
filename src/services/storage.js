// localStorage.js - Utility functions for managing persistent storage

const STORAGE_KEYS = {
  CLIENTS: 'tenant_analytics_clients',
  SETTINGS: 'tenant_analytics_settings',
  AI_SETTINGS: 'tenant_analytics_ai_settings'
};

/**
 * Initialize storage if not exists
 */
export const initializeStorage = () => {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        theme: 'light',
        lastAccessed: new Date().toISOString()
      }));
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    return false;
  }
};

/**
 * Get all clients from localStorage
 */
export const getClients = () => {
  try {
    const clients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return clients ? JSON.parse(clients) : [];
  } catch (error) {
    console.error('Error reading clients:', error);
    return [];
  }
};

/**
 * Save all clients to localStorage
 */
export const saveClients = (clients) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return true;
  } catch (error) {
    console.error('Error saving clients:', error);
    return false;
  }
};

/**
 * Get a single client by ID
 */
export const getClientById = (clientId) => {
  try {
    const clients = getClients();
    return clients.find(client => client.id === clientId) || null;
  } catch (error) {
    console.error('Error getting client:', error);
    return null;
  }
};

/**
 * Add a new client
 */
export const addClient = (clientName) => {
  try {
    const clients = getClients();
    const newClient = {
      id: Date.now().toString(),
      name: clientName,
      periods: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clients.push(newClient);
    saveClients(clients);
    return newClient;
  } catch (error) {
    console.error('Error adding client:', error);
    return null;
  }
};

/**
 * Update an existing client
 */
export const updateClient = (clientId, updates) => {
  try {
    const clients = getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex === -1) {
      return null;
    }
    
    clients[clientIndex] = {
      ...clients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    saveClients(clients);
    return clients[clientIndex];
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};

/**
 * Delete a client
 */
export const deleteClient = (clientId) => {
  try {
    const clients = getClients();
    const filteredClients = clients.filter(c => c.id !== clientId);
    saveClients(filteredClients);
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

/**
 * Add a period to a client
 */
export const addPeriodToClient = (clientId, periodData) => {
  try {
    const clients = getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex === -1) {
      return null;
    }
    
    const newPeriod = {
      id: Date.now().toString(),
      ...periodData,
      uploadedAt: new Date().toISOString()
    };
    
    clients[clientIndex].periods.push(newPeriod);
    clients[clientIndex].updatedAt = new Date().toISOString();
    
    saveClients(clients);
    return newPeriod;
  } catch (error) {
    console.error('Error adding period:', error);
    return null;
  }
};

/**
 * Delete a period from a client
 */
export const deletePeriodFromClient = (clientId, periodId) => {
  try {
    const clients = getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex === -1) {
      return false;
    }
    
    clients[clientIndex].periods = clients[clientIndex].periods.filter(
      p => p.id !== periodId
    );
    clients[clientIndex].updatedAt = new Date().toISOString();
    
    saveClients(clients);
    return true;
  } catch (error) {
    console.error('Error deleting period:', error);
    return false;
  }
};

/**
 * Get settings
 */
export const getSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};
  }
};

/**
 * Save settings
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Clear all data (use with caution!)
 */
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    initializeStorage();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Export all data as JSON (for backup)
 */
export const exportData = () => {
  try {
    return {
      clients: getClients(),
      settings: getSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

/**
 * Import data from JSON (for restore)
 */
export const importData = (data) => {
  try {
    if (data.clients) {
      saveClients(data.clients);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = () => {
  try {
    const clients = getClients();
    const totalPeriods = clients.reduce((sum, client) => sum + client.periods.length, 0);
    
    // Estimate storage size
    const dataSize = new Blob([
      localStorage.getItem(STORAGE_KEYS.CLIENTS) || '',
      localStorage.getItem(STORAGE_KEYS.SETTINGS) || ''
    ]).size;
    
    return {
      totalClients: clients.length,
      totalPeriods: totalPeriods,
      estimatedSizeKB: (dataSize / 1024).toFixed(2),
      storageAvailable: typeof Storage !== 'undefined'
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return null;
  }
};

/**
 * Get AI settings
 */
export const getAISettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
    return settings ? JSON.parse(settings) : {
      enabled: false,
      provider: null, // 'openai' | 'claude' | null
      apiKey: null
    };
  } catch (error) {
    console.error('Error reading AI settings:', error);
    return {
      enabled: false,
      provider: null,
      apiKey: null
    };
  }
};

/**
 * Save AI settings
 */
export const saveAISettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return false;
  }
};

// Initialize storage on module load
initializeStorage();
