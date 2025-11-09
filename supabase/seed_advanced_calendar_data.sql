-- Seed Data for Advanced Calendar & Multi-Location Management System
-- Purpose: Initialize business locations and sample data

-- Insert Business Locations (Dubai, Abu Dhabi, Sharjah)
-- Note: Replace organization_id with actual organization ID after first user signup

-- Sample Organization ID (will be replaced in production)
DO $$
DECLARE
    sample_org_id UUID;
BEGIN
    -- Get first organization or create a sample one for testing
    SELECT id INTO sample_org_id FROM organizations LIMIT 1;
    
    IF sample_org_id IS NULL THEN
        RAISE NOTICE 'No organizations found. Please create an organization first.';
        RETURN;
    END IF;

    -- Dubai Main Branch
    INSERT INTO business_locations (
        organization_id, location_code, location_name, location_type,
        address_line1, address_line2, city, emirate, country,
        phone_number, email, timezone,
        max_concurrent_appointments, is_primary, is_active,
        amenities, specializations, parking_available, wheelchair_accessible
    ) VALUES (
        sample_org_id, 'DXB-MAIN', 'Dubai Main Branch', 'branch',
        'Shop 12, Al Barsha Mall', 'Al Barsha 1', 'Dubai', 'Dubai', 'UAE',
        '+971-4-123-4567', 'dubai@tailoring.ae', 'Asia/Dubai',
        15, true, true,
        ARRAY['WiFi', 'Waiting Area', 'Refreshments', 'Prayer Room', 'Parking'],
        ARRAY['Bespoke Tailoring', 'Wedding Attire', 'Traditional Wear', 'Corporate Uniforms'],
        true, true
    ) ON CONFLICT (organization_id, location_code) DO NOTHING;

    -- Abu Dhabi Branch
    INSERT INTO business_locations (
        organization_id, location_code, location_name, location_type,
        address_line1, address_line2, city, emirate, country,
        phone_number, email, timezone,
        max_concurrent_appointments, is_primary, is_active,
        amenities, specializations, parking_available, wheelchair_accessible
    ) VALUES (
        sample_org_id, 'AUH-01', 'Abu Dhabi Branch', 'branch',
        'Unit 45, Marina Mall', 'Corniche Road', 'Abu Dhabi', 'Abu Dhabi', 'UAE',
        '+971-2-987-6543', 'abudhabi@tailoring.ae', 'Asia/Dubai',
        12, false, true,
        ARRAY['WiFi', 'Waiting Area', 'Refreshments', 'Prayer Room'],
        ARRAY['Bespoke Tailoring', 'Wedding Attire', 'Traditional Wear'],
        true, true
    ) ON CONFLICT (organization_id, location_code) DO NOTHING;

    -- Sharjah Branch
    INSERT INTO business_locations (
        organization_id, location_code, location_name, location_type,
        address_line1, address_line2, city, emirate, country,
        phone_number, email, timezone,
        max_concurrent_appointments, is_primary, is_active,
        amenities, specializations, parking_available, wheelchair_accessible
    ) VALUES (
        sample_org_id, 'SHJ-01', 'Sharjah Branch', 'branch',
        'Shop 8, City Centre Sharjah', 'King Faisal Street', 'Sharjah', 'Sharjah', 'UAE',
        '+971-6-555-8888', 'sharjah@tailoring.ae', 'Asia/Dubai',
        10, false, true,
        ARRAY['WiFi', 'Waiting Area', 'Prayer Room', 'Parking'],
        ARRAY['Bespoke Tailoring', 'Traditional Wear', 'Casual Wear'],
        true, true
    ) ON CONFLICT (organization_id, location_code) DO NOTHING;

    RAISE NOTICE 'Business locations seed data inserted successfully!';
END $$;

-- Sample Staff Skills (Common tailoring skills)
-- Note: staff_id needs to be actual employee IDs from profiles table

COMMENT ON TABLE business_locations IS 'Physical business locations/branches for multi-location appointment management';
COMMENT ON TABLE staff_skills IS 'Employee skills for skill-based scheduling and resource allocation';
COMMENT ON TABLE staff_availability IS 'Staff working hours and availability across multiple locations';
COMMENT ON TABLE external_calendar_connections IS 'Integration with Google Calendar, Outlook, and Apple Calendar';
COMMENT ON TABLE external_calendar_events IS 'Synchronized events from external calendars';
COMMENT ON TABLE appointment_conflicts IS 'Track and resolve scheduling conflicts across resources and staff';
COMMENT ON TABLE resource_utilization_logs IS 'Analytics for resource capacity planning and utilization tracking';
COMMENT ON TABLE staff_utilization_logs IS 'Staff performance metrics and utilization analytics';
