-- RLS Policies for Advanced Calendar & Multi-Location Management System
-- Created: 2025-11-06
-- Purpose: Secure multi-tenant access control for calendar system

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_utilization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_utilization_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BUSINESS LOCATIONS POLICIES
-- =====================================================

-- Users can view locations in their organization
CREATE POLICY "Users can view business locations in their organization"
    ON business_locations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Owners and managers can insert locations
CREATE POLICY "Owners and managers can create business locations"
    ON business_locations FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager')
        )
    );

-- Owners and managers can update locations
CREATE POLICY "Owners and managers can update business locations"
    ON business_locations FOR UPDATE
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

-- Only owners can delete locations
CREATE POLICY "Only owners can delete business locations"
    ON business_locations FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'owner'
        )
    );

-- =====================================================
-- STAFF SKILLS POLICIES
-- =====================================================

-- Users can view skills in their organization
CREATE POLICY "Users can view staff skills in their organization"
    ON staff_skills FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Staff can insert their own skills, managers can insert for anyone
CREATE POLICY "Staff can create their own skills, managers can create for anyone"
    ON staff_skills FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            staff_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    );

-- Staff can update their own skills, managers can update anyone's
CREATE POLICY "Staff can update their own skills, managers can update anyone"
    ON staff_skills FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            staff_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Managers and owners can delete skills
CREATE POLICY "Managers and owners can delete staff skills"
    ON staff_skills FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager')
        )
    );

-- =====================================================
-- STAFF AVAILABILITY POLICIES
-- =====================================================

-- Users can view staff availability in their organization
CREATE POLICY "Users can view staff availability in their organization"
    ON staff_availability FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Staff can insert their own availability, managers can insert for anyone
CREATE POLICY "Staff can create their own availability, managers can create for anyone"
    ON staff_availability FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            staff_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    );

-- Staff can update their own availability, managers can update anyone's
CREATE POLICY "Staff can update their own availability, managers can update anyone"
    ON staff_availability FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            staff_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Staff can delete their own availability, managers can delete anyone's
CREATE POLICY "Staff can delete their own availability, managers can delete anyone"
    ON staff_availability FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            staff_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    );

-- =====================================================
-- EXTERNAL CALENDAR CONNECTIONS POLICIES
-- =====================================================

-- Users can only view their own calendar connections
CREATE POLICY "Users can view their own calendar connections"
    ON external_calendar_connections FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own calendar connections
CREATE POLICY "Users can create their own calendar connections"
    ON external_calendar_connections FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can update their own calendar connections
CREATE POLICY "Users can update their own calendar connections"
    ON external_calendar_connections FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own calendar connections
CREATE POLICY "Users can delete their own calendar connections"
    ON external_calendar_connections FOR DELETE
    USING (user_id = auth.uid());

-- =====================================================
-- EXTERNAL CALENDAR EVENTS POLICIES
-- =====================================================

-- Users can view events from their calendar connections
CREATE POLICY "Users can view their external calendar events"
    ON external_calendar_events FOR SELECT
    USING (
        connection_id IN (
            SELECT id FROM external_calendar_connections WHERE user_id = auth.uid()
        )
    );

-- System can insert events (via service role in edge functions)
CREATE POLICY "System can insert external calendar events"
    ON external_calendar_events FOR INSERT
    WITH CHECK (
        connection_id IN (
            SELECT id FROM external_calendar_connections 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- System can update events
CREATE POLICY "System can update external calendar events"
    ON external_calendar_events FOR UPDATE
    USING (
        connection_id IN (
            SELECT id FROM external_calendar_connections 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    )
    WITH CHECK (
        connection_id IN (
            SELECT id FROM external_calendar_connections 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- System can delete events
CREATE POLICY "System can delete external calendar events"
    ON external_calendar_events FOR DELETE
    USING (
        connection_id IN (
            SELECT id FROM external_calendar_connections WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- APPOINTMENT CONFLICTS POLICIES
-- =====================================================

-- Users can view conflicts in their organization
CREATE POLICY "Users can view appointment conflicts in their organization"
    ON appointment_conflicts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- System can insert conflicts (via edge functions)
CREATE POLICY "System can insert appointment conflicts"
    ON appointment_conflicts FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can update conflicts they're involved in, managers can update all
CREATE POLICY "Users can update conflicts they're involved in"
    ON appointment_conflicts FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            auth.uid() = ANY(conflicting_staff_ids)
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Managers and owners can delete conflicts
CREATE POLICY "Managers can delete appointment conflicts"
    ON appointment_conflicts FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager')
        )
    );

-- =====================================================
-- RESOURCE UTILIZATION LOGS POLICIES
-- =====================================================

-- All users can view utilization logs in their organization
CREATE POLICY "Users can view resource utilization logs"
    ON resource_utilization_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- System can insert logs (via edge functions/triggers)
CREATE POLICY "System can insert resource utilization logs"
    ON resource_utilization_logs FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- No updates or deletes on logs (immutable audit trail)

-- =====================================================
-- STAFF UTILIZATION LOGS POLICIES
-- =====================================================

-- Users can view their own utilization, managers can view all
CREATE POLICY "Users can view staff utilization logs"
    ON staff_utilization_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            staff_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('owner', 'manager')
            )
        )
    );

-- System can insert logs (via edge functions/triggers)
CREATE POLICY "System can insert staff utilization logs"
    ON staff_utilization_logs FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- No updates or deletes on logs (immutable audit trail)

-- =====================================================
-- COMPLETED: RLS Policies for Advanced Calendar System
-- =====================================================
