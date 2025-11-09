CREATE TABLE customer_loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    program_name TEXT NOT NULL,
    description TEXT,
    points_per_aed NUMERIC(5,2) DEFAULT 1.0,
    tier_thresholds JSONB DEFAULT '{"Bronze": 0,
    "Silver": 1000,
    "Gold": 5000,
    "Platinum": 10000}',
    tier_benefits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id,
    program_name)
);