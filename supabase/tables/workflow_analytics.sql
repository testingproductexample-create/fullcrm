CREATE TABLE workflow_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    workflow_id UUID,
    status VARCHAR(100),
    average_completion_time INTEGER,
    bottleneck_score DECIMAL(5,2),
    efficiency_rating DECIMAL(5,2),
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);