CREATE TABLE customer_loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('Earned',
    'Redeemed',
    'Expired',
    'Adjusted')) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    related_order_id UUID,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);