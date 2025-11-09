-- Row Level Security Policies for Appointment & Scheduling System
-- Multi-tenant security with role-based access control

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE appointment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_resource_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_blackout_periods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- APPOINTMENT SETTINGS POLICIES
-- =====================================================

-- SELECT: All authenticated users can view their organization's settings
CREATE POLICY "Users can view their organization's appointment settings"
ON appointment_settings FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Only owners and managers can create settings
CREATE POLICY "Owners and managers can create appointment settings"
ON appointment_settings FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- UPDATE: Only owners and managers can update settings
CREATE POLICY "Owners and managers can update appointment settings"
ON appointment_settings FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to appointment settings"
ON appointment_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT TYPES POLICIES
-- =====================================================

-- SELECT: All authenticated users can view their organization's types
CREATE POLICY "Users can view their organization's appointment types"
ON appointment_types FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Owners and managers can create types
CREATE POLICY "Owners and managers can create appointment types"
ON appointment_types FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- UPDATE: Owners and managers can update types
CREATE POLICY "Owners and managers can update appointment types"
ON appointment_types FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- DELETE: Owners and managers can delete types
CREATE POLICY "Owners and managers can delete appointment types"
ON appointment_types FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to appointment types"
ON appointment_types FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT RESOURCES POLICIES
-- =====================================================

-- SELECT: All authenticated users can view their organization's resources
CREATE POLICY "Users can view their organization's appointment resources"
ON appointment_resources FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Owners and managers can create resources
CREATE POLICY "Owners and managers can create appointment resources"
ON appointment_resources FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- UPDATE: Owners and managers can update resources
CREATE POLICY "Owners and managers can update appointment resources"
ON appointment_resources FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- DELETE: Owners and managers can delete resources
CREATE POLICY "Owners and managers can delete appointment resources"
ON appointment_resources FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to appointment resources"
ON appointment_resources FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENTS POLICIES
-- =====================================================

-- SELECT: Users can view their organization's appointments
CREATE POLICY "Users can view their organization's appointments"
ON appointments FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: All authenticated users can create appointments
CREATE POLICY "Users can create appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- UPDATE: Users can update appointments in their organization
-- (More granular control can be added based on role)
CREATE POLICY "Users can update appointments in their organization"
ON appointments FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- DELETE: Only owners and managers can delete appointments
CREATE POLICY "Owners and managers can delete appointments"
ON appointments FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to appointments"
ON appointments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT STAFF ASSIGNMENTS POLICIES
-- =====================================================

-- SELECT: Users can view their organization's staff assignments
CREATE POLICY "Users can view their organization's staff assignments"
ON appointment_staff_assignments FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Users can create staff assignments in their organization
CREATE POLICY "Users can create staff assignments"
ON appointment_staff_assignments FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- UPDATE: Users can update staff assignments in their organization
CREATE POLICY "Users can update staff assignments"
ON appointment_staff_assignments FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- DELETE: Users can delete staff assignments in their organization
CREATE POLICY "Users can delete staff assignments"
ON appointment_staff_assignments FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to staff assignments"
ON appointment_staff_assignments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT RESOURCE BOOKINGS POLICIES
-- =====================================================

-- SELECT: Users can view their organization's resource bookings
CREATE POLICY "Users can view their organization's resource bookings"
ON appointment_resource_bookings FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Users can create resource bookings in their organization
CREATE POLICY "Users can create resource bookings"
ON appointment_resource_bookings FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- UPDATE: Users can update resource bookings in their organization
CREATE POLICY "Users can update resource bookings"
ON appointment_resource_bookings FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- DELETE: Users can delete resource bookings in their organization
CREATE POLICY "Users can delete resource bookings"
ON appointment_resource_bookings FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to resource bookings"
ON appointment_resource_bookings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT REMINDERS POLICIES
-- =====================================================

-- SELECT: Users can view their organization's reminders
CREATE POLICY "Users can view their organization's reminders"
ON appointment_reminders FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: System can create reminders (typically via edge functions)
CREATE POLICY "System can create reminders"
ON appointment_reminders FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- UPDATE: System can update reminders
CREATE POLICY "System can update reminders"
ON appointment_reminders FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- DELETE: Owners and managers can delete reminders
CREATE POLICY "Owners and managers can delete reminders"
ON appointment_reminders FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to reminders"
ON appointment_reminders FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT AVAILABILITY OVERRIDES POLICIES
-- =====================================================

-- SELECT: Users can view their organization's availability overrides
CREATE POLICY "Users can view their organization's availability overrides"
ON appointment_availability_overrides FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Owners and managers can create availability overrides
CREATE POLICY "Owners and managers can create availability overrides"
ON appointment_availability_overrides FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- UPDATE: Owners and managers can update availability overrides
CREATE POLICY "Owners and managers can update availability overrides"
ON appointment_availability_overrides FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- DELETE: Owners and managers can delete availability overrides
CREATE POLICY "Owners and managers can delete availability overrides"
ON appointment_availability_overrides FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to availability overrides"
ON appointment_availability_overrides FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPOINTMENT BLACKOUT PERIODS POLICIES
-- =====================================================

-- SELECT: Users can view their organization's blackout periods
CREATE POLICY "Users can view their organization's blackout periods"
ON appointment_blackout_periods FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- INSERT: Owners and managers can create blackout periods
CREATE POLICY "Owners and managers can create blackout periods"
ON appointment_blackout_periods FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- UPDATE: Owners and managers can update blackout periods
CREATE POLICY "Owners and managers can update blackout periods"
ON appointment_blackout_periods FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- DELETE: Owners and managers can delete blackout periods
CREATE POLICY "Owners and managers can delete blackout periods"
ON appointment_blackout_periods FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
);

-- Service role full access
CREATE POLICY "Service role has full access to blackout periods"
ON appointment_blackout_periods FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on tables
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Grant permissions on appointment tables
GRANT ALL ON appointment_settings TO authenticated, service_role;
GRANT ALL ON appointment_types TO authenticated, service_role;
GRANT ALL ON appointment_resources TO authenticated, service_role;
GRANT ALL ON appointments TO authenticated, service_role;
GRANT ALL ON appointment_staff_assignments TO authenticated, service_role;
GRANT ALL ON appointment_resource_bookings TO authenticated, service_role;
GRANT ALL ON appointment_reminders TO authenticated, service_role;
GRANT ALL ON appointment_availability_overrides TO authenticated, service_role;
GRANT ALL ON appointment_blackout_periods TO authenticated, service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view their organization's appointment settings" ON appointment_settings 
IS 'Users can only view appointment settings from their own organization';

COMMENT ON POLICY "Users can view their organization's appointments" ON appointments 
IS 'Multi-tenant isolation: users can only view appointments from their organization';

COMMENT ON POLICY "Service role has full access to appointments" ON appointments 
IS 'Service role (edge functions) has full access for automated operations';
