-- Operational Analytics Table Schema
CREATE TABLE operational_analytics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_category VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    time_period VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    project_id VARCHAR(100),
    workflow_id VARCHAR(100),
    quality_score DECIMAL(5,2),
    completion_time_minutes INTEGER,
    sla_compliance BOOLEAN DEFAULT false,
    bottleneck_score DECIMAL(5,2),
    resource_efficiency DECIMAL(5,2),
    customer_satisfaction DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_date DATE NOT NULL,
    tags TEXT[],
    metadata JSONB
);

-- Indexes for performance optimization
CREATE INDEX idx_operational_analytics_date ON operational_analytics(data_date);
CREATE INDEX idx_operational_analytics_category ON operational_analytics(metric_category);
CREATE INDEX idx_operational_analytics_department ON operational_analytics(department);
CREATE INDEX idx_operational_analytics_employee ON operational_analytics(employee_id);
CREATE INDEX idx_operational_analytics_workflow ON operational_analytics(workflow_id);
CREATE INDEX idx_operational_analytics_created ON operational_analytics(created_at);

-- Enable RLS
ALTER TABLE operational_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access for all users" ON operational_analytics
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON operational_analytics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON operational_analytics
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON operational_analytics
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE operational_analytics IS 'Comprehensive operational analytics and performance metrics data storage';
COMMENT ON COLUMN operational_analytics.metric_name IS 'Name of the performance metric';
COMMENT ON COLUMN operational_analytics.metric_category IS 'Category of metric (productivity, quality, efficiency, etc.)';
COMMENT ON COLUMN operational_analytics.metric_value IS 'Numeric value of the metric';
COMMENT ON COLUMN operational_analytics.sla_compliance IS 'Whether the metric meets SLA requirements';
COMMENT ON COLUMN operational_analytics.bottleneck_score IS 'Identified bottleneck severity (0-100)';
COMMENT ON COLUMN operational_analytics.resource_efficiency IS 'Resource utilization efficiency percentage';