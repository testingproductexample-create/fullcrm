-- Resource Utilization Table Schema
CREATE TABLE resource_utilization (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    utilization_rate DECIMAL(5,2) NOT NULL,
    capacity_total DECIMAL(10,2) NOT NULL,
    capacity_used DECIMAL(10,2) NOT NULL,
    capacity_available DECIMAL(10,2) NOT NULL,
    efficiency_score DECIMAL(5,2),
    downtime_hours DECIMAL(8,2) DEFAULT 0,
    maintenance_hours DECIMAL(8,2) DEFAULT 0,
    idle_time_hours DECIMAL(8,2) DEFAULT 0,
    peak_utilization DECIMAL(5,2),
    average_utilization DECIMAL(5,2),
    cost_per_hour DECIMAL(8,2),
    total_cost DECIMAL(12,2),
    roi_percentage DECIMAL(5,2),
    performance_rating DECIMAL(3,2),
    quality_issues INTEGER DEFAULT 0,
    maintenance_required BOOLEAN DEFAULT false,
    resource_status VARCHAR(50) DEFAULT 'active',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    utilization_date DATE NOT NULL,
    time_period VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[],
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_resource_utilization_type ON resource_utilization(resource_type);
CREATE INDEX idx_resource_utilization_department ON resource_utilization(department);
CREATE INDEX idx_resource_utilization_date ON resource_utilization(utilization_date);
CREATE INDEX idx_resource_utilization_rate ON resource_utilization(utilization_rate);
CREATE INDEX idx_resource_utilization_status ON resource_utilization(resource_status);

-- RLS
ALTER TABLE resource_utilization ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access for all users" ON resource_utilization
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON resource_utilization
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON resource_utilization
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON resource_utilization
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE resource_utilization IS 'Resource utilization tracking and optimization analytics';
COMMENT ON COLUMN resource_utilization.utilization_rate IS 'Resource utilization percentage (0-100)';
COMMENT ON COLUMN resource_utilization.efficiency_score IS 'Resource efficiency performance score (0-100)';
COMMENT ON COLUMN resource_utilization.roi_percentage IS 'Return on investment percentage';
COMMENT ON COLUMN resource_utilization.resource_status IS 'Current status: active, maintenance, offline, retired';