-- Migration: enhance_customer_measurements_table
-- Created at: 1762370176


-- Add enhanced fields to customer_measurements table
ALTER TABLE customer_measurements
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS fit_preference TEXT,
ADD COLUMN IF NOT EXISTS posture_notes TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_version_id UUID,
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS linked_order_id UUID,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update measurement_templates table with missing columns
ALTER TABLE measurement_templates
ADD COLUMN IF NOT EXISTS cultural_variant TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_measurements_customer ON customer_measurements(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_measurements_latest ON customer_measurements(customer_id, is_latest) WHERE is_latest = true;
CREATE INDEX IF NOT EXISTS idx_customer_measurements_garment ON customer_measurements(garment_type);
CREATE INDEX IF NOT EXISTS idx_customer_measurements_org ON customer_measurements(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_measurements_order ON customer_measurements(linked_order_id) WHERE linked_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fitting_sessions_customer ON fitting_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_fitting_sessions_order ON fitting_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_fitting_sessions_schedule ON fitting_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_fitting_sessions_status ON fitting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_fitting_sessions_org ON fitting_sessions(organization_id);

CREATE INDEX IF NOT EXISTS idx_fitting_photos_session ON fitting_photos(fitting_session_id);
CREATE INDEX IF NOT EXISTS idx_fitting_photos_org ON fitting_photos(organization_id);

CREATE INDEX IF NOT EXISTS idx_fitting_notes_session ON fitting_notes(fitting_session_id);
CREATE INDEX IF NOT EXISTS idx_fitting_notes_category ON fitting_notes(note_category);
CREATE INDEX IF NOT EXISTS idx_fitting_notes_resolved ON fitting_notes(is_resolved);
CREATE INDEX IF NOT EXISTS idx_fitting_notes_org ON fitting_notes(organization_id);

CREATE INDEX IF NOT EXISTS idx_alteration_requests_order ON alteration_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_alteration_requests_customer ON alteration_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_alteration_requests_status ON alteration_requests(status);
CREATE INDEX IF NOT EXISTS idx_alteration_requests_approval ON alteration_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_alteration_requests_session ON alteration_requests(fitting_session_id);
CREATE INDEX IF NOT EXISTS idx_alteration_requests_org ON alteration_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_alteration_requests_number ON alteration_requests(request_number);

CREATE INDEX IF NOT EXISTS idx_measurement_history_customer ON measurement_change_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_measurement_history_measurement ON measurement_change_history(measurement_id);
CREATE INDEX IF NOT EXISTS idx_measurement_history_org ON measurement_change_history(organization_id);

-- Add unique constraint for measurement templates
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurement_templates_unique 
ON measurement_templates(organization_id, garment_type, template_name);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DROP TRIGGER IF EXISTS update_customer_measurements_updated_at ON customer_measurements;
CREATE TRIGGER update_customer_measurements_updated_at
BEFORE UPDATE ON customer_measurements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_measurement_templates_updated_at ON measurement_templates;
CREATE TRIGGER update_measurement_templates_updated_at
BEFORE UPDATE ON measurement_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitting_sessions_updated_at ON fitting_sessions;
CREATE TRIGGER update_fitting_sessions_updated_at
BEFORE UPDATE ON fitting_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitting_notes_updated_at ON fitting_notes;
CREATE TRIGGER update_fitting_notes_updated_at
BEFORE UPDATE ON fitting_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alteration_requests_updated_at ON alteration_requests;
CREATE TRIGGER update_alteration_requests_updated_at
BEFORE UPDATE ON alteration_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
;