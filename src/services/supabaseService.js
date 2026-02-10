// Supabase service - replaces localStorage with live database
import { supabase } from '../config/supabase';

/**
 * Get all clients from Supabase
 */
export const getClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform snake_case to camelCase for consistency
    return (data || []).map(client => ({
      id: client.id,
      name: client.name,
      periods: client.periods || [],
      data: client.data || null,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    }));
  } catch (error) {
    console.error('Error reading clients:', error);
    return [];
  }
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      periods: data.periods || [],
      data: data.data || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting client:', error);
    return null;
  }
};

/**
 * Add a new client
 */
export const addClient = async (clientName) => {
  try {
    const newClient = {
      name: clientName,
      periods: [],
      data: null
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([newClient])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      periods: data.periods || [],
      data: data.data || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error adding client:', error);
    return null;
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (clientId, updates) => {
  try {
    // Transform camelCase to snake_case for database
    const dbUpdates = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.periods !== undefined) dbUpdates.periods = updates.periods;
    if (updates.data !== undefined) dbUpdates.data = updates.data;

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      periods: data.periods || [],
      data: data.data || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

/**
 * Add a period to a client
 */
export const addPeriodToClient = async (clientId, periodData) => {
  try {
    // Get current client
    const client = await getClientById(clientId);
    if (!client) return null;

    const newPeriod = {
      id: Date.now().toString(),
      ...periodData,
      uploadedAt: new Date().toISOString()
    };

    // Add period to periods array
    const updatedPeriods = [...(client.periods || []), newPeriod];

    // Update client
    const updatedClient = await updateClient(clientId, { periods: updatedPeriods });

    return updatedClient ? newPeriod : null;
  } catch (error) {
    console.error('Error adding period:', error);
    return null;
  }
};

/**
 * Delete a period from a client
 */
export const deletePeriodFromClient = async (clientId, periodId) => {
  try {
    // Get current client
    const client = await getClientById(clientId);
    if (!client) return false;

    // Filter out the period
    const updatedPeriods = (client.periods || []).filter(p => p.id !== periodId);

    // Update client
    const updatedClient = await updateClient(clientId, { periods: updatedPeriods });

    return updatedClient !== null;
  } catch (error) {
    console.error('Error deleting period:', error);
    return false;
  }
};

/**
 * Get settings
 */
export const getSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

    return data?.settings || {};
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};
  }
};

/**
 * Save settings
 */
export const saveSettings = async (settings) => {
  try {
    // Try to get existing settings
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('settings')
        .update({ settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('settings')
        .insert([{ settings }]);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Clear all data (use with caution!)
 */
export const clearAllData = async () => {
  try {
    // Delete all clients
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (clientsError) throw clientsError;

    // Delete all settings
    const { error: settingsError } = await supabase
      .from('settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (settingsError) throw settingsError;

    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Export all data as JSON (for backup)
 */
export const exportData = async () => {
  try {
    const clients = await getClients();
    const settings = await getSettings();

    return {
      clients,
      settings,
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
export const importData = async (data) => {
  try {
    if (data.clients) {
      // Clear existing clients
      await clearAllData();

      // Insert all clients
      for (const client of data.clients) {
        await addClient(client.name);
        // Update with full data
        const clients = await getClients();
        const newClient = clients.find(c => c.name === client.name);
        if (newClient) {
          await updateClient(newClient.id, {
            periods: client.periods,
            data: client.data
          });
        }
      }
    }

    if (data.settings) {
      await saveSettings(data.settings);
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
export const getStorageStats = async () => {
  try {
    const clients = await getClients();
    const totalPeriods = clients.reduce((sum, client) => sum + (client.periods?.length || 0), 0);

    return {
      totalClients: clients.length,
      totalPeriods: totalPeriods,
      storageType: 'supabase',
      storageAvailable: true
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return null;
  }
};

/**
 * Get AI settings
 */
export const getAISettings = async () => {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data?.settings || {
      enabled: false,
      provider: null,
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
export const saveAISettings = async (settings) => {
  try {
    // Try to get existing settings
    const { data: existing } = await supabase
      .from('ai_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('ai_settings')
        .update({ settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('ai_settings')
        .insert([{ settings }]);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return false;
  }
};
