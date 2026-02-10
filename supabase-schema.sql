-- Supabase Database Schema for Tenant Analytics
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  periods JSONB DEFAULT '[]'::jsonb,
  data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings JSONB NOT NULL DEFAULT '{"enabled": false, "provider": null, "apiKey": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- For now, allowing all operations for authenticated and anon users
-- You may want to restrict this in production

-- Clients policies
CREATE POLICY "Enable all access for clients" ON clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Settings policies
CREATE POLICY "Enable all access for settings" ON settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- AI Settings policies
CREATE POLICY "Enable all access for ai_settings" ON ai_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Insert default settings row
INSERT INTO settings (settings) VALUES ('{"theme": "light"}'::jsonb)
  ON CONFLICT DO NOTHING;

-- Optional: Insert default ai_settings row
INSERT INTO ai_settings (settings) VALUES ('{"enabled": false, "provider": null, "apiKey": null}'::jsonb)
  ON CONFLICT DO NOTHING;
