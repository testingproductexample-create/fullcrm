CREATE TABLE fitting_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    fitting_session_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT,
    angle_view TEXT,
    area_focus TEXT,
    caption TEXT,
    annotations JSONB,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);