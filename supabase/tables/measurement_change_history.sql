CREATE TABLE measurement_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    measurement_id UUID NOT NULL,
    change_type TEXT NOT NULL,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);