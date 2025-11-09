CREATE TABLE order_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    approval_type TEXT CHECK (approval_type IN ('design',
    'measurement',
    'final',
    'price')) NOT NULL,
    status TEXT CHECK (status IN ('pending',
    'approved',
    'rejected',
    'revision_requested')) DEFAULT 'pending',
    customer_id UUID REFERENCES customers(id),
    approved_by UUID REFERENCES profiles(id),
    approval_date TIMESTAMPTZ,
    feedback TEXT,
    revision_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);