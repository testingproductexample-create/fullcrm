CREATE TABLE design_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    view_angle TEXT,
    alt_text TEXT,
    caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    file_size_kb INTEGER,
    dimensions_width INTEGER,
    dimensions_height INTEGER,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);