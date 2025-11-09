CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_name TEXT,
    specifications JSONB DEFAULT '{}',
    fabric_details TEXT,
    color TEXT,
    style_options JSONB DEFAULT '{}',
    measurements_reference UUID REFERENCES customer_measurements(id),
    special_requirements TEXT,
    estimated_time_hours INTEGER,
    item_amount NUMERIC(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);