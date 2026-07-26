-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 1. Departments Table
-- ==========================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for departments
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed initial departments
INSERT INTO departments (name, icon, color) VALUES
    ('Indoor', 'Building2', 'blue'),
    ('Outdoor', 'TreePine', 'green'),
    ('Hostel Maintenance', 'Bed', 'orange'),
    ('Electrical', 'Zap', 'yellow'),
    ('Transport', 'Bus', 'purple'),
    ('Mess', 'Utensils', 'red'),
    ('Purchase', 'ShoppingCart', 'teal');

-- ==========================================
-- 2. Areas Table
-- ==========================================
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(department_id, name) -- Area names must be unique within a department
);

-- Index for fast department lookups
CREATE INDEX idx_areas_department_id ON areas(department_id);

-- Trigger for areas
CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. Workers Table
-- ==========================================
-- Create enum for worker status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE worker_status AS ENUM ('active', 'inactive', 'on_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    area_id UUID REFERENCES areas(id) ON DELETE RESTRICT, -- Optional area assignment
    phone TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status worker_status NOT NULL DEFAULT 'active',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for workers
CREATE INDEX idx_workers_department_id ON workers(department_id);
CREATE INDEX idx_workers_area_id ON workers(area_id);
CREATE INDEX idx_workers_employee_id ON workers(employee_id);

-- Trigger for workers
CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. Activity Logs Table
-- ==========================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- e.g., 'department', 'worker'
    entity_id UUID, -- UUID of the entity affected
    description TEXT NOT NULL,
    metadata JSONB, -- Additional details
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Track who made the change
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast activity log lookups
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
