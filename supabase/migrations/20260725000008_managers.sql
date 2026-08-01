-- ==========================================
-- 1. Managers Table
-- ==========================================
-- Create enum for manager status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE manager_status AS ENUM ('active', 'inactive', 'on_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE,
    name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    phone TEXT,
    email TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status manager_status NOT NULL DEFAULT 'active',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for managers
CREATE INDEX idx_managers_department_id ON managers(department_id);

-- Trigger for managers updated_at
CREATE TRIGGER update_managers_updated_at
    BEFORE UPDATE ON managers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2. Update Work Tasks
-- ==========================================
ALTER TABLE work_tasks ADD COLUMN manager_id UUID REFERENCES managers(id) ON DELETE SET NULL;
CREATE INDEX idx_work_tasks_manager_id ON work_tasks(manager_id);

-- ==========================================
-- 3. RLS Policies
-- ==========================================
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for anon on managers (managed via proxy middleware)" ON managers
    FOR ALL TO public USING (true) WITH CHECK (true);
