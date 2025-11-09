CREATE TABLE order_workflow_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    order_id UUID NOT NULL,
    workflow_id UUID,
    current_status VARCHAR(100) NOT NULL,
    sub_status VARCHAR(100),
    status_order INTEGER DEFAULT 0,
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    assigned_employee_id UUID,
    status_notes TEXT,
    progress_percentage INTEGER DEFAULT 0,
    automatic_transition BOOLEAN DEFAULT false,
    approval_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);