CREATE TABLE customer_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    measurement_date DATE DEFAULT CURRENT_DATE,
    garment_type TEXT NOT NULL,
    body_type TEXT,
    size_standard TEXT,
    measurements JSONB NOT NULL DEFAULT '{}',
    fitting_notes TEXT,
    measured_by UUID REFERENCES profiles(id),
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);