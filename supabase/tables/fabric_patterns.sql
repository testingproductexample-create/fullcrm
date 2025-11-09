CREATE TABLE fabric_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fabric_id UUID NOT NULL REFERENCES fabric_library(id) ON DELETE CASCADE,
    pattern_name TEXT NOT NULL,
    pattern_type TEXT,
    color_name TEXT NOT NULL,
    color_hex TEXT,
    pattern_image_url TEXT NOT NULL,
    swatch_image_url TEXT,
    is_primary_color BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);