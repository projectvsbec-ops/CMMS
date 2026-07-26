-- PHASE 5: Inventory & Material Management

-- Inventory Categories Table
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(30) DEFAULT 'bg-slate-400',
    icon VARCHAR(30) DEFAULT 'Package',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed basic categories
INSERT INTO inventory_categories (name, description, color, icon) VALUES
    ('Cleaning', 'Cleaning supplies and chemicals', 'bg-blue-400', 'SprayCan'),
    ('Electrical', 'Electrical parts and wires', 'bg-yellow-500', 'Zap'),
    ('Plumbing', 'Pipes, fittings, and fixtures', 'bg-blue-600', 'Wrench'),
    ('Civil', 'Cement, bricks, sand', 'bg-stone-500', 'Hammer'),
    ('Carpentry', 'Wood, nails, tools', 'bg-amber-700', 'Axe'),
    ('Safety', 'PPE, fire extinguishers', 'bg-red-500', 'ShieldAlert'),
    ('Stationery', 'Office supplies', 'bg-slate-500', 'Paperclip'),
    ('Transport', 'Vehicle spares', 'bg-teal-500', 'Truck'),
    ('Hostel', 'Hostel maintenance items', 'bg-indigo-500', 'Bed'),
    ('General', 'Miscellaneous items', 'bg-gray-500', 'Package')
ON CONFLICT (name) DO NOTHING;

-- Sequence for item coding
CREATE SEQUENCE IF NOT EXISTS inventory_item_seq START 1;

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL,
    current_stock NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    minimum_stock NUMERIC(12, 2) DEFAULT 0,
    maximum_stock NUMERIC(12, 2),
    reorder_level NUMERIC(12, 2) DEFAULT 0,
    store_location VARCHAR(100),
    supplier VARCHAR(150),
    unit_cost NUMERIC(12, 2) DEFAULT 0 CHECK (unit_cost >= 0),
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Generate item_code trigger
CREATE OR REPLACE FUNCTION set_inventory_item_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
        NEW.item_code := 'INV-' || LPAD(nextval('inventory_item_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_item_code_trigger
    BEFORE INSERT ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION set_inventory_item_code();

-- Updated_at triggers
CREATE TRIGGER set_updated_at_inventory_categories
    BEFORE UPDATE ON inventory_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_inventory_items
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'return')),
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    work_task_id UUID REFERENCES work_tasks(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically update current_stock
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
DECLARE
    new_stock NUMERIC(12, 2);
BEGIN
    -- Calculate the stock change based on transaction type
    IF NEW.transaction_type = 'stock_in' OR NEW.transaction_type = 'return' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock + NEW.quantity 
        WHERE id = NEW.inventory_item_id
        RETURNING current_stock INTO new_stock;
    ELSIF NEW.transaction_type = 'stock_out' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock - NEW.quantity 
        WHERE id = NEW.inventory_item_id
        RETURNING current_stock INTO new_stock;
        
        -- Prevent negative stock
        IF new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient stock. Transaction would result in negative stock.';
        END IF;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        -- Adjustment could be treated as an absolute set or relative. Let's treat it as relative (+/-)
        -- Wait, the requirement says "quantity > 0". So if it's an adjustment, we might need a way to say if it's adding or removing. 
        -- Actually, an absolute adjustment is easier for users. "I count 5 items". 
        -- If quantity > 0 is enforced, we can't do negative adjustments. Let's modify the quantity check.
        -- Let's redefine: an adjustment sets the absolute value? No, the standard is transaction_type = 'adjustment' and quantity is the diff.
        -- Let's change the table check constraint to allow negative quantities ONLY for adjustments.
        -- But since we already created it, let's just make 'adjustment' accept negative quantities or we can drop the check.
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Let's alter the quantity check to allow negative quantities ONLY for adjustments
ALTER TABLE inventory_transactions DROP CONSTRAINT inventory_transactions_quantity_check;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_quantity_check 
    CHECK (quantity != 0 AND (quantity > 0 OR transaction_type = 'adjustment'));

-- Now update the trigger to handle adjustments
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
DECLARE
    new_stock NUMERIC(12, 2);
BEGIN
    IF NEW.transaction_type = 'stock_in' OR NEW.transaction_type = 'return' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock + NEW.quantity 
        WHERE id = NEW.inventory_item_id
        RETURNING current_stock INTO new_stock;
    ELSIF NEW.transaction_type = 'stock_out' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock - NEW.quantity 
        WHERE id = NEW.inventory_item_id
        RETURNING current_stock INTO new_stock;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock + NEW.quantity 
        WHERE id = NEW.inventory_item_id
        RETURNING current_stock INTO new_stock;
    END IF;

    -- Global negative stock check
    IF new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Transaction would result in negative stock.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_transaction_trigger
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_stock();


-- Indexes
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_department_id ON inventory_items(department_id);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_work_task_id ON inventory_transactions(work_task_id);

-- Enable RLS
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow all actions for anon" ON inventory_categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon" ON inventory_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon" ON inventory_transactions FOR ALL TO public USING (true) WITH CHECK (true);
