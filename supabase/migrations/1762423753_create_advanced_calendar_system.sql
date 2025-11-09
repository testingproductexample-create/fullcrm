-- Migration: create_advanced_calendar_system
-- Created at: 1762423753

-- Advanced Calendar & Multi-Location Management System
-- Created: 2025-11-06
-- Purpose: Extend appointment system with multi-location support, staff availability, and external calendar sync

-- =====================================================
-- 1. BUSINESS LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) DEFAULT 'branch',
    
    -- Address Information (UAE Format)
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    emirate VARCHAR(50),
    country VARCHAR(50) DEFAULT 'UAE',
    postal_code VARCHAR(20),
    
    -- Location Details
    phone_number VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID,
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    
    -- Operating Hours (JSON format)
    operating_hours JSONB DEFAULT '{
        "saturday": {"open": "09:00", "close": "20:00", "is_open": true},
        "sunday": {"open": "09:00", "close": "20:00", "is_open": true},
        "monday": {"open": "09:00", "close": "20:00", "is_open": true},
        "tuesday": {"open": "09:00", "close": "20:00", "is_open": true},
        "wednesday": {"open": "09:00", "close": "20:00", "is_open": true},
        "thursday": {"open": "09:00", "close": "20:00", "is_open": true},
        "friday": {"open": "14:00", "close": "20:00", "is_open": true}
    }'::jsonb,
    
    -- Prayer Times Configuration
    prayer_breaks_enabled BOOLEAN DEFAULT true,
    prayer_break_duration INTEGER DEFAULT 15,
    
    -- Capacity
    max_concurrent_appointments INTEGER DEFAULT 10,
    total_staff_count INTEGER DEFAULT 0,
    total_resources_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
    -- Metadata
    amenities TEXT[],
    specializations TEXT[],
    parking_available BOOLEAN DEFAULT true,
    wheelchair_accessible BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_location_code_per_org UNIQUE(organization_id, location_code)
);

CREATE INDEX idx_business_locations_org ON business_locations(organization_id);
CREATE INDEX idx_business_locations_active ON business_locations(organization_id, is_active);
CREATE INDEX idx_business_locations_emirate ON business_locations(emirate);

-- =====================================================
-- 2. ADD LOCATION SUPPORT TO EXISTING TABLES
-- =====================================================

-- Add location_id to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_id UUID;
CREATE INDEX IF NOT EXISTS idx_appointments_location ON appointments(location_id);

-- Add location_id to appointment_resources table
ALTER TABLE appointment_resources ADD COLUMN IF NOT EXISTS location_id UUID;
CREATE INDEX IF NOT EXISTS idx_appointment_resources_location ON appointment_resources(location_id);

-- =====================================================
-- 3. STAFF SKILLS & AVAILABILITY
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    
    -- Skill Information
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100),
    proficiency_level VARCHAR(50) DEFAULT 'intermediate',
    
    -- Certification
    is_certified BOOLEAN DEFAULT false,
    certification_date DATE,
    certification_expiry DATE,
    certification_number VARCHAR(100),
    
    -- Experience
    years_of_experience INTEGER DEFAULT 0,
    
    -- Related Services
    applicable_service_types TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_staff_skill UNIQUE(organization_id, staff_id, skill_name)
);

CREATE INDEX idx_staff_skills_org ON staff_skills(organization_id);
CREATE INDEX idx_staff_skills_staff ON staff_skills(staff_id);
CREATE INDEX idx_staff_skills_category ON staff_skills(skill_category);

CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    location_id UUID,
    
    -- Date and Time
    availability_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability Type
    availability_type VARCHAR(50) DEFAULT 'working',
    
    -- Status
    status VARCHAR(50) DEFAULT 'available',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    
    -- Break Times
    break_times JSONB DEFAULT '[]'::jsonb,
    
    -- Capacity
    max_concurrent_appointments INTEGER DEFAULT 1,
    current_bookings_count INTEGER DEFAULT 0,
    
    -- Override Information
    is_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_availability_org ON staff_availability(organization_id);
CREATE INDEX idx_staff_availability_staff ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_location ON staff_availability(location_id);
CREATE INDEX idx_staff_availability_date ON staff_availability(availability_date);
CREATE INDEX idx_staff_availability_date_staff ON staff_availability(staff_id, availability_date);

-- =====================================================
-- 4. EXTERNAL CALENDAR SYNCHRONIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS external_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Calendar Provider
    provider VARCHAR(50) NOT NULL,
    calendar_id VARCHAR(255),
    calendar_name VARCHAR(255),
    
    -- OAuth & Authentication
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Configuration
    sync_direction VARCHAR(50) DEFAULT 'bidirectional',
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(50),
    sync_errors_count INTEGER DEFAULT 0,
    
    -- Sync Settings
    sync_settings JSONB DEFAULT '{
        "sync_past_days": 7,
        "sync_future_days": 90,
        "auto_sync_interval_minutes": 15,
        "conflict_resolution": "manual"
    }'::jsonb,
    
    -- Mapping Configuration
    appointment_type_mappings JSONB,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_calendar_connection UNIQUE(organization_id, user_id, provider, calendar_id)
);

CREATE INDEX idx_external_calendar_org ON external_calendar_connections(organization_id);
CREATE INDEX idx_external_calendar_user ON external_calendar_connections(user_id);
CREATE INDEX idx_external_calendar_provider ON external_calendar_connections(provider);
CREATE INDEX idx_external_calendar_active ON external_calendar_connections(is_active, sync_enabled);

CREATE TABLE IF NOT EXISTS external_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    
    -- External Event Details
    external_event_id VARCHAR(255) NOT NULL,
    event_title VARCHAR(500),
    event_description TEXT,
    
    -- Time
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    
    -- Location
    external_location TEXT,
    
    -- Mapping to Internal Appointment
    appointment_id UUID,
    mapping_status VARCHAR(50) DEFAULT 'pending',
    
    -- Sync Status
    sync_status VARCHAR(50) DEFAULT 'synced',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Conflict Detection
    has_conflict BOOLEAN DEFAULT false,
    conflict_details JSONB,
    
    event_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_external_event UNIQUE(connection_id, external_event_id)
);

CREATE INDEX idx_external_events_connection ON external_calendar_events(connection_id);
CREATE INDEX idx_external_events_org ON external_calendar_events(organization_id);
CREATE INDEX idx_external_events_appointment ON external_calendar_events(appointment_id);
CREATE INDEX idx_external_events_datetime ON external_calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_external_events_conflict ON external_calendar_events(has_conflict);

-- =====================================================
-- 5. APPOINTMENT CONFLICTS & RESOLUTION
-- =====================================================

CREATE TABLE IF NOT EXISTS appointment_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Conflicting Appointments
    appointment_id_1 UUID NOT NULL,
    appointment_id_2 UUID,
    external_event_id UUID,
    
    -- Conflict Type
    conflict_type VARCHAR(50) NOT NULL,
    conflict_severity VARCHAR(50) DEFAULT 'medium',
    
    -- Conflict Details
    conflict_description TEXT,
    conflict_data JSONB,
    
    -- Resource Conflicts
    conflicting_staff_ids UUID[],
    conflicting_resource_ids UUID[],
    
    -- Resolution
    resolution_status VARCHAR(50) DEFAULT 'pending',
    resolution_action VARCHAR(50),
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Auto-Resolution
    auto_resolution_attempted BOOLEAN DEFAULT false,
    auto_resolution_suggestion JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_conflicts_org ON appointment_conflicts(organization_id);
CREATE INDEX idx_appointment_conflicts_appt1 ON appointment_conflicts(appointment_id_1);
CREATE INDEX idx_appointment_conflicts_status ON appointment_conflicts(resolution_status);
CREATE INDEX idx_appointment_conflicts_severity ON appointment_conflicts(conflict_severity);

-- =====================================================
-- 6. RESOURCE CAPACITY & UTILIZATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_utilization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    location_id UUID,
    
    -- Resource Information
    resource_id UUID,
    resource_type VARCHAR(100),
    
    -- Time Period
    log_date DATE NOT NULL,
    hour_of_day INTEGER,
    
    -- Utilization Metrics
    total_capacity_minutes INTEGER DEFAULT 0,
    utilized_minutes INTEGER DEFAULT 0,
    available_minutes INTEGER DEFAULT 0,
    maintenance_minutes INTEGER DEFAULT 0,
    
    utilization_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Booking Statistics
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    no_show_bookings INTEGER DEFAULT 0,
    
    -- Revenue (if applicable)
    revenue_generated_aed DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resource_util_org ON resource_utilization_logs(organization_id);
CREATE INDEX idx_resource_util_location ON resource_utilization_logs(location_id);
CREATE INDEX idx_resource_util_resource ON resource_utilization_logs(resource_id);
CREATE INDEX idx_resource_util_date ON resource_utilization_logs(log_date);
CREATE INDEX idx_resource_util_location_date ON resource_utilization_logs(location_id, log_date);

CREATE TABLE IF NOT EXISTS staff_utilization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    location_id UUID,
    staff_id UUID NOT NULL,
    
    -- Time Period
    log_date DATE NOT NULL,
    
    -- Availability Metrics
    scheduled_work_minutes INTEGER DEFAULT 0,
    actual_work_minutes INTEGER DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,
    idle_minutes INTEGER DEFAULT 0,
    
    -- Appointment Statistics
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    
    -- Performance Metrics
    utilization_percentage DECIMAL(5,2) DEFAULT 0.00,
    average_appointment_duration INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2),
    
    -- Revenue Contribution
    revenue_generated_aed DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_util_org ON staff_utilization_logs(organization_id);
CREATE INDEX idx_staff_util_location ON staff_utilization_logs(location_id);
CREATE INDEX idx_staff_util_staff ON staff_utilization_logs(staff_id);
CREATE INDEX idx_staff_util_date ON staff_utilization_logs(log_date);
CREATE INDEX idx_staff_util_staff_date ON staff_utilization_logs(staff_id, log_date);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to check location availability
CREATE OR REPLACE FUNCTION check_location_capacity(
    p_location_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    v_max_concurrent INTEGER;
    v_current_concurrent INTEGER;
BEGIN
    -- Get location's max concurrent appointments
    SELECT max_concurrent_appointments INTO v_max_concurrent
    FROM business_locations
    WHERE id = p_location_id AND is_active = true;
    
    IF v_max_concurrent IS NULL THEN
        RETURN false;
    END IF;
    
    -- Count overlapping appointments
    SELECT COUNT(*) INTO v_current_concurrent
    FROM appointments
    WHERE location_id = p_location_id
        AND appointment_date = p_appointment_date
        AND status NOT IN ('cancelled', 'no_show')
        AND (
            (start_time <= p_start_time AND end_time > p_start_time) OR
            (start_time < p_end_time AND end_time >= p_end_time) OR
            (start_time >= p_start_time AND end_time <= p_end_time)
        );
    
    RETURN v_current_concurrent < v_max_concurrent;
END;
$$ LANGUAGE plpgsql;

-- Function to get available staff for location
CREATE OR REPLACE FUNCTION get_available_staff_for_location(
    p_organization_id UUID,
    p_location_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_required_skills TEXT[] DEFAULT NULL
) RETURNS TABLE(
    staff_id UUID,
    staff_name TEXT,
    available_capacity INTEGER,
    skill_match_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        sa.staff_id,
        p.full_name as staff_name,
        (sa.max_concurrent_appointments - sa.current_bookings_count) as available_capacity,
        COALESCE(
            (SELECT COUNT(*)
             FROM staff_skills ss
             WHERE ss.staff_id = sa.staff_id
                 AND ss.is_active = true
                 AND (p_required_skills IS NULL OR ss.skill_name = ANY(p_required_skills))
            ), 0
        )::INTEGER as skill_match_count
    FROM staff_availability sa
    JOIN profiles p ON p.id = sa.staff_id
    WHERE sa.organization_id = p_organization_id
        AND (sa.location_id = p_location_id OR sa.location_id IS NULL)
        AND sa.availability_date = p_appointment_date
        AND sa.status = 'available'
        AND sa.start_time <= p_start_time
        AND sa.end_time >= p_end_time
        AND (sa.max_concurrent_appointments - sa.current_bookings_count) > 0
    ORDER BY skill_match_count DESC, available_capacity DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect appointment conflicts
CREATE OR REPLACE FUNCTION detect_appointment_conflicts(
    p_appointment_id UUID,
    p_organization_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_staff_ids UUID[],
    p_resource_ids UUID[]
) RETURNS TABLE(
    conflict_type TEXT,
    conflict_description TEXT,
    conflicting_appointment_id UUID
) AS $$
BEGIN
    -- Check staff conflicts
    IF p_staff_ids IS NOT NULL AND array_length(p_staff_ids, 1) > 0 THEN
        RETURN QUERY
        SELECT 
            'staff_double_booking'::TEXT,
            'Staff member already has an appointment at this time'::TEXT,
            a.id
        FROM appointments a
        JOIN appointment_staff_assignments asa ON asa.appointment_id = a.id
        WHERE a.organization_id = p_organization_id
            AND a.id != p_appointment_id
            AND a.appointment_date = p_appointment_date
            AND a.status NOT IN ('cancelled', 'no_show')
            AND asa.staff_id = ANY(p_staff_ids)
            AND (
                (a.start_time <= p_start_time AND a.end_time > p_start_time) OR
                (a.start_time < p_end_time AND a.end_time >= p_end_time) OR
                (a.start_time >= p_start_time AND a.end_time <= p_end_time)
            );
    END IF;
    
    -- Check resource conflicts
    IF p_resource_ids IS NOT NULL AND array_length(p_resource_ids, 1) > 0 THEN
        RETURN QUERY
        SELECT 
            'resource_conflict'::TEXT,
            'Resource already booked at this time'::TEXT,
            a.id
        FROM appointments a
        JOIN appointment_resource_bookings arb ON arb.appointment_id = a.id
        WHERE a.organization_id = p_organization_id
            AND a.id != p_appointment_id
            AND a.appointment_date = p_appointment_date
            AND a.status NOT IN ('cancelled', 'no_show')
            AND arb.resource_id = ANY(p_resource_ids)
            AND (
                (a.start_time <= p_start_time AND a.end_time > p_start_time) OR
                (a.start_time < p_end_time AND a.end_time >= p_end_time) OR
                (a.start_time >= p_start_time AND a.end_time <= p_end_time)
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. UPDATE TRIGGERS
-- =====================================================

-- Trigger for business_locations updated_at
CREATE OR REPLACE FUNCTION update_business_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_business_locations_updated_at
    BEFORE UPDATE ON business_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_business_locations_updated_at();

-- Similar triggers for other tables
CREATE TRIGGER trigger_staff_skills_updated_at
    BEFORE UPDATE ON staff_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_business_locations_updated_at();

CREATE TRIGGER trigger_staff_availability_updated_at
    BEFORE UPDATE ON staff_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_business_locations_updated_at();

CREATE TRIGGER trigger_external_calendar_connections_updated_at
    BEFORE UPDATE ON external_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_business_locations_updated_at();;