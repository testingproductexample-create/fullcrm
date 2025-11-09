CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    workflow_id UUID NOT NULL,
    from_status VARCHAR(100),
    to_status VARCHAR(100) NOT NULL,
    transition_type VARCHAR(50) DEFAULT 'manual',
    transition_rules JSONB DEFAULT '{}',
    trigger_conditions JSONB DEFAULT '{}',
    approval_requirements JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);