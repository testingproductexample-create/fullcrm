CREATE TABLE customer_segmentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    segment_name TEXT NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    customer_count INTEGER DEFAULT 0,
    last_calculated TIMESTAMPTZ,
    is_dynamic BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id,
    segment_name)
);