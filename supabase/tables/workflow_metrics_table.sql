-- Workflow Metrics Table Schema
CREATE TABLE workflow_metrics (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(100) NOT NULL,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_category VARCHAR(100) NOT NULL,
    process_step VARCHAR(255) NOT NULL,
    step_order INTEGER NOT NULL,
    total_steps INTEGER NOT NULL,
    completion_rate DECIMAL(5,2) NOT NULL,
    average_completion_time_minutes DECIMAL(8,2),
    target_completion_time_minutes DECIMAL(8,2),
    time_variance_percentage DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    error_rate DECIMAL(5,2),
    rework_rate DECIMAL(5,2),
    automation_level DECIMAL(5,2),
    manual_intervention_count INTEGER DEFAULT 0,
    throughput_per_hour DECIMAL(8,2),
    bottleneck_score DECIMAL(5,2),
    efficiency_rating DECIMAL(5,2),
    cost_per_transaction DECIMAL(8,2),
    customer_satisfaction DECIMAL(3,2),
    sla_compliance_rate DECIMAL(5,2),
    escalation_count INTEGER DEFAULT 0,
    approval_queue_time_minutes DECIMAL(8,2),
    review_cycles INTEGER DEFAULT 0,
    approval_rate DECIMAL(5,2),
    rejection_reasons TEXT[],
    improvement_suggestions TEXT[],
    automation_opportunities TEXT[],
    risk_level VARCHAR(20) DEFAULT 'low',
    compliance_score DECIMAL(5,2),
    audit_score DECIMAL(5,2),
    measurement_date DATE NOT NULL,
    time_period VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[],
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_workflow_metrics_workflow ON workflow_metrics(workflow_id);
CREATE INDEX idx_workflow_metrics_category ON workflow_metrics(workflow_category);
CREATE INDEX idx_workflow_metrics_date ON workflow_metrics(measurement_date);
CREATE INDEX idx_workflow_metrics_completion ON workflow_metrics(completion_rate);
CREATE INDEX idx_workflow_metrics_bottleneck ON workflow_metrics(bottleneck_score);
CREATE INDEX idx_workflow_metrics_sla ON workflow_metrics(sla_compliance_rate);

-- RLS
ALTER TABLE workflow_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access for all users" ON workflow_metrics
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON workflow_metrics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON workflow_metrics
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON workflow_metrics
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE workflow_metrics IS 'Comprehensive workflow and process performance metrics';
COMMENT ON COLUMN workflow_metrics.completion_rate IS 'Workflow step completion percentage (0-100)';
COMMENT ON COLUMN workflow_metrics.time_variance_percentage IS 'Deviation from target completion time';
COMMENT ON COLUMN workflow_metrics.automation_level IS 'Level of process automation (0-100)';
COMMENT ON COLUMN workflow_metrics.bottleneck_score IS 'Bottleneck severity identification (0-100)';
COMMENT ON COLUMN workflow_metrics.risk_level IS 'Workflow risk assessment: low, medium, high, critical';
COMMENT ON COLUMN workflow_metrics.sla_compliance_rate IS 'Percentage meeting Service Level Agreement requirements';