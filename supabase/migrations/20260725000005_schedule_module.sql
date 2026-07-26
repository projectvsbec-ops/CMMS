-- PHASE 6: Work Schedule & Preventive Maintenance

-- Schedule Templates
CREATE TABLE IF NOT EXISTS schedule_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Worker Schedules
CREATE TABLE IF NOT EXISTS worker_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    template_id UUID REFERENCES schedule_templates(id) ON DELETE SET NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    work_title VARCHAR(150) NOT NULL,
    work_description TEXT,
    work_task_id UUID REFERENCES work_tasks(id) ON DELETE SET NULL,
    schedule_status VARCHAR(30) DEFAULT 'Scheduled' CHECK (schedule_status IN ('Scheduled', 'Started', 'Completed', 'Cancelled')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_end_time_after_start CHECK (end_time > start_time)
);

-- Preventive Maintenance
CREATE TABLE IF NOT EXISTS preventive_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    frequency VARCHAR(30) NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly')),
    next_due_date DATE NOT NULL,
    estimated_duration INTEGER, -- in minutes
    assigned_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    work_task_template JSONB, -- stores base properties to construct a work task
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Updated_at triggers
CREATE TRIGGER set_updated_at_schedule_templates
    BEFORE UPDATE ON schedule_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_worker_schedules
    BEFORE UPDATE ON worker_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_preventive_maintenance
    BEFORE UPDATE ON preventive_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Indexes
CREATE INDEX idx_worker_schedules_worker_id ON worker_schedules(worker_id);
CREATE INDEX idx_worker_schedules_date ON worker_schedules(schedule_date);
CREATE INDEX idx_worker_schedules_status ON worker_schedules(schedule_status);

CREATE INDEX idx_pm_department ON preventive_maintenance(department_id);
CREATE INDEX idx_pm_due_date ON preventive_maintenance(next_due_date);
CREATE INDEX idx_pm_active ON preventive_maintenance(is_active);

-- Enable RLS
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_maintenance ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow all actions for anon" ON schedule_templates FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon" ON worker_schedules FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon" ON preventive_maintenance FOR ALL TO public USING (true) WITH CHECK (true);
