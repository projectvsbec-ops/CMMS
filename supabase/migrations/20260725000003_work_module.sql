-- PHASE 4: Work Allocation & Task Management

-- Lookup table for Task Categories
CREATE TABLE IF NOT EXISTS task_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(30) DEFAULT 'bg-slate-400',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed basic categories
INSERT INTO task_categories (name, color) VALUES
    ('Cleaning', 'bg-blue-400'),
    ('Plumbing', 'bg-blue-600'),
    ('Electrical', 'bg-yellow-500'),
    ('Carpentry', 'bg-amber-700'),
    ('Civil', 'bg-stone-500'),
    ('Transport', 'bg-teal-500'),
    ('Hostel', 'bg-indigo-500'),
    ('Purchase', 'bg-green-600'),
    ('Gardening', 'bg-emerald-500'),
    ('Inspection', 'bg-purple-500'),
    ('Repair', 'bg-rose-500'),
    ('Other', 'bg-slate-500')
ON CONFLICT (name) DO NOTHING;

-- Sequence for task numbering
CREATE SEQUENCE IF NOT EXISTS work_task_seq START 1;

-- Core Work Tasks Table
CREATE TABLE IF NOT EXISTS work_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    identified_by VARCHAR(100),
    target_date DATE,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- stored in minutes
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to autogenerate task_number on insert
CREATE OR REPLACE FUNCTION set_work_task_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_number IS NULL OR NEW.task_number = '' THEN
        NEW.task_number := 'WRK-' || LPAD(nextval('work_task_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_task_number_trigger
    BEFORE INSERT ON work_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_work_task_number();

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_work_tasks
    BEFORE UPDATE ON work_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically set completed_date when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_date := now();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_date := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_task_completed_date_trigger
    BEFORE UPDATE ON work_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_date();

-- Indexes for performance
CREATE INDEX idx_work_tasks_department_id ON work_tasks(department_id);
CREATE INDEX idx_work_tasks_worker_id ON work_tasks(worker_id);
CREATE INDEX idx_work_tasks_status ON work_tasks(status);
CREATE INDEX idx_work_tasks_priority ON work_tasks(priority);
CREATE INDEX idx_work_tasks_target_date ON work_tasks(target_date);
CREATE INDEX idx_work_tasks_created_at ON work_tasks(created_at);

-- Enable RLS
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies (Admin access for all since single user system via proxy)
CREATE POLICY "Allow all actions for anon (managed via proxy middleware)" ON task_categories
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for anon (managed via proxy middleware)" ON work_tasks
    FOR ALL TO public USING (true) WITH CHECK (true);
