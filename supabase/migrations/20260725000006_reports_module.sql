-- ==============================================================================
-- CMMS - Reports Module
-- ==============================================================================

CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g. "Work", "Inventory", "Attendance"
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER update_saved_reports_modtime
    BEFORE UPDATE ON saved_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Policies (Admin only, same as existing tables)
CREATE POLICY "Enable read access for authenticated users" ON saved_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON saved_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON saved_reports FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON saved_reports FOR DELETE TO authenticated USING (true);
