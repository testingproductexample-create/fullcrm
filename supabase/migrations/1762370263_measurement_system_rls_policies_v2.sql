-- Migration: measurement_system_rls_policies_v2
-- Created at: 1762370263


-- Enable RLS on all measurement system tables
ALTER TABLE measurement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitting_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alteration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_change_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "measurement_templates_select" ON measurement_templates;
DROP POLICY IF EXISTS "measurement_templates_insert" ON measurement_templates;
DROP POLICY IF EXISTS "measurement_templates_update" ON measurement_templates;
DROP POLICY IF EXISTS "measurement_templates_delete" ON measurement_templates;

DROP POLICY IF EXISTS "customer_measurements_select" ON customer_measurements;
DROP POLICY IF EXISTS "customer_measurements_insert" ON customer_measurements;
DROP POLICY IF EXISTS "customer_measurements_update" ON customer_measurements;
DROP POLICY IF EXISTS "customer_measurements_delete" ON customer_measurements;

DROP POLICY IF EXISTS "fitting_sessions_select" ON fitting_sessions;
DROP POLICY IF EXISTS "fitting_sessions_insert" ON fitting_sessions;
DROP POLICY IF EXISTS "fitting_sessions_update" ON fitting_sessions;
DROP POLICY IF EXISTS "fitting_sessions_delete" ON fitting_sessions;

DROP POLICY IF EXISTS "fitting_photos_select" ON fitting_photos;
DROP POLICY IF EXISTS "fitting_photos_insert" ON fitting_photos;
DROP POLICY IF EXISTS "fitting_photos_update" ON fitting_photos;
DROP POLICY IF EXISTS "fitting_photos_delete" ON fitting_photos;

DROP POLICY IF EXISTS "fitting_notes_select" ON fitting_notes;
DROP POLICY IF EXISTS "fitting_notes_insert" ON fitting_notes;
DROP POLICY IF EXISTS "fitting_notes_update" ON fitting_notes;
DROP POLICY IF EXISTS "fitting_notes_delete" ON fitting_notes;

DROP POLICY IF EXISTS "alteration_requests_select" ON alteration_requests;
DROP POLICY IF EXISTS "alteration_requests_insert" ON alteration_requests;
DROP POLICY IF EXISTS "alteration_requests_update" ON alteration_requests;
DROP POLICY IF EXISTS "alteration_requests_delete" ON alteration_requests;

DROP POLICY IF EXISTS "measurement_change_history_select" ON measurement_change_history;
DROP POLICY IF EXISTS "measurement_change_history_insert" ON measurement_change_history;

-- measurement_templates policies
CREATE POLICY "measurement_templates_select" ON measurement_templates
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "measurement_templates_insert" ON measurement_templates
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "measurement_templates_update" ON measurement_templates
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "measurement_templates_delete" ON measurement_templates
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

-- customer_measurements policies
CREATE POLICY "customer_measurements_select" ON customer_measurements
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "customer_measurements_insert" ON customer_measurements
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor')
  )
);

CREATE POLICY "customer_measurements_update" ON customer_measurements
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor')
  )
);

CREATE POLICY "customer_measurements_delete" ON customer_measurements
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

-- fitting_sessions policies
CREATE POLICY "fitting_sessions_select" ON fitting_sessions
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "fitting_sessions_insert" ON fitting_sessions
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor', 'assistant')
  )
);

CREATE POLICY "fitting_sessions_update" ON fitting_sessions
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor', 'assistant')
  )
);

CREATE POLICY "fitting_sessions_delete" ON fitting_sessions
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

-- fitting_photos policies
CREATE POLICY "fitting_photos_select" ON fitting_photos
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "fitting_photos_insert" ON fitting_photos
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor', 'assistant')
  )
);

CREATE POLICY "fitting_photos_update" ON fitting_photos
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor')
  )
);

CREATE POLICY "fitting_photos_delete" ON fitting_photos
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor')
  )
);

-- fitting_notes policies
CREATE POLICY "fitting_notes_select" ON fitting_notes
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "fitting_notes_insert" ON fitting_notes
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor', 'assistant')
  )
);

CREATE POLICY "fitting_notes_update" ON fitting_notes
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor')
  )
);

CREATE POLICY "fitting_notes_delete" ON fitting_notes
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

-- alteration_requests policies
CREATE POLICY "alteration_requests_select" ON alteration_requests
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "alteration_requests_insert" ON alteration_requests
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor', 'assistant')
  )
);

CREATE POLICY "alteration_requests_update" ON alteration_requests
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'tailor', 'assistant')
  )
);

CREATE POLICY "alteration_requests_delete" ON alteration_requests
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

-- measurement_change_history policies (read-only audit trail)
CREATE POLICY "measurement_change_history_select" ON measurement_change_history
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "measurement_change_history_insert" ON measurement_change_history
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
;