CREATE TABLE design_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    views_count INTEGER DEFAULT 0,
    selections_count INTEGER DEFAULT 0,
    approvals_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    revenue_aed NUMERIC(12,2) DEFAULT 0,
    avg_customization_price_aed NUMERIC(10,2),
    most_selected_variant JSONB,
    customer_demographics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(design_id,
    analytics_date)
);