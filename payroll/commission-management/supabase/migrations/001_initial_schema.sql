-- Commission Management System Database Schema
-- Created for UAE Payroll Commission Management

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE commission_type AS ENUM ('percentage', 'tiered', 'fixed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE payment_method AS ENUM ('bank', 'check', 'cash', 'stripe', 'paypal');
CREATE TYPE schedule_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'custom');
CREATE TYPE schedule_status AS ENUM ('scheduled', 'processing', 'completed', 'failed');
CREATE TYPE gateway_type AS ENUM ('bank', 'stripe', 'paypal', 'local');

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission structures (templates) table
CREATE TABLE commission_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type commission_type NOT NULL,
    base_rate DECIMAL(5, 2) NOT NULL,
    tier_rates JSONB, -- Array of {min, max, rate}
    bonus_threshold DECIMAL(12, 2),
    bonus_rate DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    changes_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Commission structure versions table
CREATE TABLE commission_structure_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID REFERENCES commission_structures(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type commission_type NOT NULL,
    base_rate DECIMAL(5, 2) NOT NULL,
    tier_rates JSONB,
    bonus_threshold DECIMAL(12, 2),
    bonus_rate DECIMAL(5, 2) DEFAULT 0,
    changes_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT false
);

-- Employee commission structure assignments
CREATE TABLE employee_commission_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    structure_id UUID REFERENCES commission_structures(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, structure_id, effective_date)
);

-- Sales/orders table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    sale_amount DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    product_category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed', -- completed, pending, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission calculations table
CREATE TABLE commission_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    structure_id UUID REFERENCES commission_structures(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sale_amount DECIMAL(12, 2) NOT NULL,
    base_commission DECIMAL(12, 2) NOT NULL,
    bonus_commission DECIMAL(12, 2) DEFAULT 0,
    total_commission DECIMAL(12, 2) NOT NULL,
    calculation_data JSONB, -- Stores detailed calculation breakdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES employees(id)
);

-- Payments table
CREATE TABLE commission_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    gateway_id UUID, -- References payment_gateways table
    processed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES employees(id),
    notes TEXT
);

-- Payment details (breakdown)
CREATE TABLE payment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES commission_payments(id) ON DELETE CASCADE,
    calculation_id UUID REFERENCES commission_calculations(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment gateways table
CREATE TABLE payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type gateway_type NOT NULL,
    is_configured BOOLEAN DEFAULT false,
    configuration JSONB, -- Stores gateway configuration
    transaction_fees DECIMAL(5, 2) DEFAULT 0, -- Percentage
    processing_time VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment schedules table
CREATE TABLE payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    frequency schedule_frequency NOT NULL,
    next_run_date DATE NOT NULL,
    last_run_date DATE,
    is_active BOOLEAN DEFAULT true,
    schedule_status schedule_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Schedule employees (many-to-many)
CREATE TABLE schedule_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES payment_schedules(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schedule_id, employee_id)
);

-- Preset templates table
CREATE TABLE preset_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- sales, real-estate, insurance, retail, custom
    icon VARCHAR(10),
    structure JSONB NOT NULL, -- Commission structure data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts table
CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES commission_payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    download_count INTEGER DEFAULT 0,
    receipt_data JSONB, -- Stores receipt template data
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_to VARCHAR(255) -- Email address if sent
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES employees(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_is_active ON employees(is_active);

CREATE INDEX idx_commission_structures_type ON commission_structures(type);
CREATE INDEX idx_commission_structures_is_active ON commission_structures(is_active);
CREATE INDEX idx_commission_structures_version ON commission_structures(version_number);

CREATE INDEX idx_sales_employee_id ON sales(employee_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);

CREATE INDEX idx_commission_calculations_employee_id ON commission_calculations(employee_id);
CREATE INDEX idx_commission_calculations_period ON commission_calculations(period_start, period_end);
CREATE INDEX idx_commission_calculations_structure_id ON commission_calculations(structure_id);

CREATE INDEX idx_payments_employee_id ON commission_payments(employee_id);
CREATE INDEX idx_payments_status ON commission_payments(payment_status);
CREATE INDEX idx_payments_period ON commission_payments(period_start, period_end);
CREATE INDEX idx_payments_processed_date ON commission_payments(processed_date);

CREATE INDEX idx_payment_details_payment_id ON payment_details(payment_id);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_structures_updated_at BEFORE UPDATE ON commission_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON commission_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs(table_name, record_id, action, old_values, changed_by)
        VALUES(TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs(table_name, record_id, action, old_values, new_values, changed_by)
        VALUES(TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs(table_name, record_id, action, new_values, changed_by)
        VALUES(TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers for important tables
CREATE TRIGGER audit_employees
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_commission_structures
    AFTER INSERT OR UPDATE OR DELETE ON commission_structures
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON commission_payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    p_sale_amount DECIMAL,
    p_structure JSONB
) RETURNS DECIMAL AS $$
DECLARE
    v_commission DECIMAL := 0;
    v_base_rate DECIMAL;
    v_tier_rates JSONB;
    v_bonus_threshold DECIMAL;
    v_bonus_rate DECIMAL;
    v_tier JSONB;
BEGIN
    -- Extract structure data
    v_base_rate := (p_structure->>'base_rate')::DECIMAL;
    v_tier_rates := p_structure->'tier_rates';
    v_bonus_threshold := COALESCE((p_structure->>'bonus_threshold')::DECIMAL, 0);
    v_bonus_rate := COALESCE((p_structure->>'bonus_rate')::DECIMAL, 0);
    
    -- Calculate based on structure type
    IF (p_structure->>'type') = 'percentage' THEN
        v_commission := (p_sale_amount * v_base_rate) / 100;
    ELSIF (p_structure->>'type') = 'tiered' THEN
        -- Find applicable tier
        FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tier_rates)
        LOOP
            IF p_sale_amount >= (v_tier->>'min')::DECIMAL AND 
               p_sale_amount < COALESCE((v_tier->>'max')::DECIMAL, 999999999) THEN
                v_commission := (p_sale_amount * (v_tier->>'rate')::DECIMAL) / 100;
                EXIT;
            END IF;
        END LOOP;
    ELSIF (p_structure->>'type') = 'fixed' THEN
        v_commission := v_base_rate;
    END IF;
    
    -- Add bonus if applicable
    IF p_sale_amount > v_bonus_threshold AND v_bonus_rate > 0 THEN
        v_commission := v_commission + ((p_sale_amount - v_bonus_threshold) * v_bonus_rate) / 100;
    END IF;
    
    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_receipt_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number, 4) AS INTEGER)), 0) + 1
    INTO v_count
    FROM payment_receipts
    WHERE receipt_number LIKE 'REC-%';
    
    v_receipt_number := 'REC-' || LPAD(v_count::TEXT, 6, '0');
    
    RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Insert default payment gateways
INSERT INTO payment_gateways (name, type, is_configured, transaction_fees, processing_time) VALUES
('Emirates NBD', 'bank', true, 0.50, '1-2 business days'),
('ADCB', 'bank', true, 0.75, '1-3 business days'),
('Dubai Islamic Bank', 'bank', true, 0.50, 'Same day'),
('First Gulf Bank', 'bank', false, 0.50, '1-2 business days'),
('Standard Chartered', 'bank', false, 0.75, '1-2 business days');

-- Insert default preset templates
INSERT INTO preset_templates (name, description, category, icon, structure) VALUES
('Standard Sales Commission', 'Standard 5% commission for sales team', 'sales', '📊', 
 '{"name": "Standard Sales", "type": "percentage", "baseRate": 5, "bonusThreshold": 100000, "bonusRate": 2, "isActive": true}'::jsonb),
('Real Estate Tiered', 'Progressive commission for real estate agents', 'real-estate', '🏠',
 '{"name": "Real Estate Progressive", "type": "tiered", "baseRate": 3, "tierRates": [{"min": 0, "max": 500000, "rate": 3}, {"min": 500000, "max": 1000000, "rate": 4}, {"min": 1000000, "max": "Infinity", "rate": 5}], "bonusThreshold": 1500000, "bonusRate": 1.5, "isActive": true}'::jsonb),
('Insurance Commission', 'Variable rate for insurance sales', 'insurance', '🛡️',
 '{"name": "Insurance Sales", "type": "tiered", "baseRate": 10, "tierRates": [{"min": 0, "max": 25000, "rate": 8}, {"min": 25000, "max": 50000, "rate": 10}, {"min": 50000, "max": 100000, "rate": 12}, {"min": 100000, "max": "Infinity", "rate": 15}], "bonusThreshold": 75000, "bonusRate": 3, "isActive": true}'::jsonb),
('Retail Performance', 'Performance-based for retail sales', 'retail', '🛍️',
 '{"name": "Retail Performance", "type": "percentage", "baseRate": 3, "bonusThreshold": 50000, "bonusRate": 1.5, "isActive": true}'::jsonb),
('Fixed Rate Structure', 'Fixed commission per unit sold', 'custom', '💰',
 '{"name": "Fixed Rate", "type": "fixed", "baseRate": 500, "bonusThreshold": 1000, "bonusRate": 750, "isActive": true}'::jsonb);

-- Insert sample employees
INSERT INTO employees (employee_id, name, email, position, department, base_salary, hire_date) VALUES
('EMP001', 'Ahmed Al-Rashid', 'ahmed.alrashid@company.ae', 'Sales Manager', 'Sales', 15000, '2023-01-15'),
('EMP002', 'Fatima Al-Zahra', 'fatima.alzahra@company.ae', 'Senior Sales Representative', 'Sales', 12000, '2023-02-01'),
('EMP003', 'Mohammed Al-Mansouri', 'mohammed.almansouri@company.ae', 'Real Estate Agent', 'Real Estate', 10000, '2023-03-10'),
('EMP004', 'Aisha Al-Qasimi', 'aisha.alqasimi@company.ae', 'Insurance Specialist', 'Insurance', 11000, '2023-04-05'),
('EMP005', 'Khalid Al-Nakhi', 'khalid.alnakhi@company.ae', 'Retail Supervisor', 'Retail', 9000, '2023-05-20');

-- Create views for common queries
CREATE VIEW employee_commission_summary AS
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.department,
    e.position,
    COUNT(cc.id) as total_sales,
    COALESCE(SUM(cc.sale_amount), 0) as total_sales_amount,
    COALESCE(SUM(cc.total_commission), 0) as total_commission_earned,
    COALESCE(SUM(CASE WHEN cp.payment_status = 'completed' THEN cp.total_amount ELSE 0 END), 0) as paid_commission,
    COALESCE(SUM(CASE WHEN cp.payment_status IN ('pending', 'processing') THEN cp.total_amount ELSE 0 END), 0) as pending_commission
FROM employees e
LEFT JOIN commission_calculations cc ON e.id = cc.employee_id
LEFT JOIN commission_payments cp ON e.id = cp.employee_id
WHERE e.is_active = true
GROUP BY e.id, e.employee_id, e.name, e.department, e.position;

CREATE VIEW payment_status_summary AS
SELECT 
    payment_status,
    COUNT(*) as payment_count,
    SUM(total_amount) as total_amount
FROM commission_payments
GROUP BY payment_status;

-- Create policies for RLS (Row Level Security)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create basic policies (these should be customized based on your authentication system)
CREATE POLICY "Enable read access for authenticated users" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON commission_structures
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON commission_calculations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON commission_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON payment_details
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON payment_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Note: You should implement proper RLS policies based on your user roles and permissions
-- This is a basic setup for development. In production, you should create more restrictive policies.

COMMIT;