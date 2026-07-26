-- ==============================================================================
-- CMMS - Settings & Notifications Module
-- ==============================================================================

CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL UNIQUE, -- e.g. "college", "working_hours", "inventory_defaults", "report_preferences"
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT -- Could be user UUID, but we only have 1 admin
);

-- Seed default settings
INSERT INTO app_settings (category, settings_json) VALUES
('college', '{"name": "Engineering College CMMS", "address": "", "contact_number": "", "email": "", "time_zone": "UTC"}'::jsonb),
('working_hours', '{"start_time": "08:00", "end_time": "17:00", "break_time": "60", "weekly_off_days": ["Sunday"]}'::jsonb),
('inventory_defaults', '{"default_unit": "Pieces", "currency": "USD"}'::jsonb),
('report_preferences', '{"page_size": "A4", "header": "CMMS Official Report", "footer": "Generated Automatically"}'::jsonb);

-- Triggers for updated_at
CREATE TRIGGER update_app_settings_modtime
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON app_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON app_settings FOR DELETE TO authenticated USING (true);

-- ==============================================================================
-- Notifications
-- ==============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    reference_id UUID, -- Optional link to a task, item, etc.
    reference_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON notifications FOR DELETE TO authenticated USING (true);
