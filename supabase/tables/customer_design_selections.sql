CREATE TABLE customer_design_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    design_id UUID NOT NULL REFERENCES designs(id),
    measurement_id UUID REFERENCES customer_measurements(id),
    selected_variants JSONB,
    selected_fabric_id UUID REFERENCES fabric_library(id),
    selected_pattern_id UUID REFERENCES fabric_patterns(id),
    customization_notes TEXT,
    reference_images JSONB,
    total_price_aed NUMERIC(10,2),
    status TEXT DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);