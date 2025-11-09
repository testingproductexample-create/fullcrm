-- Appointment & Scheduling System Database Migration
-- Customer-facing appointment scheduling with staff and resource management

-- =====================================================
-- APPOINTMENT SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Working schedule
    working_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    working_hours_start TIME NOT NULL DEFAULT '09:00:00',
    working_hours_end TIME NOT NULL DEFAULT '20:00:00',
    
    -- Appointment configuration
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
    advance_booking_days INTEGER NOT NULL DEFAULT 30,
    min_booking_notice_hours INTEGER NOT NULL DEFAULT 24,
    max_appointments_per_slot INTEGER NOT NULL DEFAULT 3,
    
    -- Booking settings
    allow_customer_booking BOOLEAN NOT NULL DEFAULT true,
    require_deposit BOOLEAN NOT NULL DEFAULT false,
    deposit_percentage NUMERIC(5,2) DEFAULT 20.00,
    cancellation_hours_notice INTEGER NOT NULL DEFAULT 24,
    
    -- Reminder configuration
    reminder_settings JSONB DEFAULT '{
        "sms": {"enabled": true, "hours_before": [24, 2]},
        "email": {"enabled": true, "hours_before": [48, 24, 2]},
        "whatsapp": {"enabled": true, "hours_before": [24, 2]}
    }'::jsonb,
    
    -- Localization
    timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
    currency TEXT NOT NULL DEFAULT 'AED',
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(organization_id)
);

-- =====================================================
-- APPOINTMENT TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Type details
    type_name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Visual identification
    color_code TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'calendar',
    
    -- Pricing
    price NUMERIC(10,2) DEFAULT 0.00,
    deposit_required BOOLEAN DEFAULT false,
    
    -- Requirements
    requires_customer BOOLEAN DEFAULT true,
    requires_staff BOOLEAN DEFAULT true,
    requires_resources TEXT[] DEFAULT ARRAY[]::TEXT[],
    skill_requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(organization_id, type_name)
);

-- =====================================================
-- APPOINTMENT RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Resource details
    resource_name TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN (
        'fitting_room', 'sewing_machine', 'embroidery_machine', 
        'consultation_room', 'cutting_table', 'pressing_equipment', 
        'measurement_area', 'equipment', 'other'
    )),
    description TEXT,
    location TEXT,
    capacity INTEGER DEFAULT 1,
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    maintenance_schedule JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
        'available', 'in_use', 'maintenance', 'out_of_service'
    )),
    
    -- Booking configuration
    booking_priority INTEGER DEFAULT 5,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(organization_id, resource_name)
);

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Appointment identification
    appointment_number TEXT NOT NULL,
    appointment_type_id UUID NOT NULL REFERENCES appointment_types(id),
    
    -- Customer information
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    
    -- Scheduling
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Status management
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed', 
        'cancelled', 'no_show', 'rescheduled'
    )),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Related records
    related_order_id UUID,
    related_measurement_id UUID,
    
    -- Booking metadata
    booking_source TEXT DEFAULT 'staff' CHECK (booking_source IN (
        'online', 'phone', 'walk_in', 'staff', 'mobile_app'
    )),
    
    -- Confirmation
    confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN (
        'pending', 'confirmed', 'auto_confirmed'
    )),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES profiles(id),
    
    -- Deposit
    deposit_amount NUMERIC(10,2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT false,
    deposit_payment_method TEXT,
    
    -- Cancellation
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES profiles(id),
    
    -- No-show tracking
    no_show_reason TEXT,
    
    -- Check-in/out
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    actual_duration_minutes INTEGER,
    
    -- Reminders
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(organization_id, appointment_number)
);

-- =====================================================
-- APPOINTMENT STAFF ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Assignment details
    role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN (
        'primary', 'assistant', 'consultant', 'specialist'
    )),
    
    -- Status
    is_confirmed BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Audit
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    assigned_by UUID REFERENCES profiles(id),
    
    UNIQUE(appointment_id, employee_id, role)
);

-- =====================================================
-- APPOINTMENT RESOURCE BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_resource_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES appointment_resources(id) ON DELETE CASCADE,
    
    -- Booking times
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN (
        'reserved', 'confirmed', 'in_use', 'released', 'cancelled'
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(appointment_id, resource_id)
);

-- =====================================================
-- APPOINTMENT REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    
    -- Reminder details
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('sms', 'email', 'whatsapp')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'failed', 'cancelled'
    )),
    
    -- Delivery
    recipient TEXT NOT NULL,
    message_content TEXT NOT NULL,
    delivery_status TEXT CHECK (delivery_status IN (
        'queued', 'delivered', 'failed', 'read'
    )),
    error_message TEXT,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- APPOINTMENT AVAILABILITY OVERRIDES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_availability_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Override date
    override_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT false,
    reason TEXT NOT NULL,
    
    -- Custom hours (if available)
    custom_hours_start TIME,
    custom_hours_end TIME,
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(organization_id, override_date)
);

-- =====================================================
-- APPOINTMENT BLACKOUT PERIODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_blackout_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Blackout period
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    
    -- Affected staff
    affects_all_staff BOOLEAN DEFAULT true,
    affected_employee_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    CHECK (end_datetime > start_datetime)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Appointment settings indexes
CREATE INDEX idx_appointment_settings_org ON appointment_settings(organization_id);

-- Appointment types indexes
CREATE INDEX idx_appointment_types_org ON appointment_types(organization_id);
CREATE INDEX idx_appointment_types_active ON appointment_types(is_active) WHERE is_active = true;

-- Appointment resources indexes
CREATE INDEX idx_appointment_resources_org ON appointment_resources(organization_id);
CREATE INDEX idx_appointment_resources_type ON appointment_resources(resource_type);
CREATE INDEX idx_appointment_resources_status ON appointment_resources(status);

-- Appointments indexes
CREATE INDEX idx_appointments_org ON appointments(organization_id);
CREATE INDEX idx_appointments_org_date ON appointments(organization_id, appointment_date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_type ON appointments(appointment_type_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, start_time);
CREATE INDEX idx_appointments_number ON appointments(appointment_number);
CREATE INDEX idx_appointments_created ON appointments(created_at);

-- Staff assignments indexes
CREATE INDEX idx_staff_assignments_org ON appointment_staff_assignments(organization_id);
CREATE INDEX idx_staff_assignments_appointment ON appointment_staff_assignments(appointment_id);
CREATE INDEX idx_staff_assignments_employee ON appointment_staff_assignments(employee_id);
CREATE INDEX idx_staff_assignments_employee_date ON appointment_staff_assignments(employee_id, assigned_at);

-- Resource bookings indexes
CREATE INDEX idx_resource_bookings_org ON appointment_resource_bookings(organization_id);
CREATE INDEX idx_resource_bookings_appointment ON appointment_resource_bookings(appointment_id);
CREATE INDEX idx_resource_bookings_resource ON appointment_resource_bookings(resource_id);
CREATE INDEX idx_resource_bookings_time ON appointment_resource_bookings(start_time, end_time);

-- Reminders indexes
CREATE INDEX idx_reminders_org ON appointment_reminders(organization_id);
CREATE INDEX idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_reminders_status ON appointment_reminders(status);
CREATE INDEX idx_reminders_scheduled ON appointment_reminders(scheduled_time) WHERE status = 'pending';
CREATE INDEX idx_reminders_type ON appointment_reminders(reminder_type);

-- Availability overrides indexes
CREATE INDEX idx_availability_overrides_org ON appointment_availability_overrides(organization_id);
CREATE INDEX idx_availability_overrides_date ON appointment_availability_overrides(override_date);

-- Blackout periods indexes
CREATE INDEX idx_blackout_periods_org ON appointment_blackout_periods(organization_id);
CREATE INDEX idx_blackout_periods_time ON appointment_blackout_periods(start_datetime, end_datetime);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate appointment number
CREATE OR REPLACE FUNCTION generate_appointment_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    year_part TEXT;
BEGIN
    -- Get current year
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get next sequential number for this year
    SELECT COUNT(*) + 1
    INTO next_number
    FROM appointments
    WHERE organization_id = org_id
    AND EXTRACT(YEAR FROM appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Return formatted appointment number
    RETURN 'APT-' || year_part || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to check resource availability
CREATE OR REPLACE FUNCTION check_resource_availability(
    p_resource_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointment_resource_bookings
    WHERE resource_id = p_resource_id
    AND booking_status IN ('reserved', 'confirmed', 'in_use')
    AND (appointment_id != p_exclude_appointment_id OR p_exclude_appointment_id IS NULL)
    AND (
        (start_time <= p_start_time AND end_time > p_start_time)
        OR (start_time < p_end_time AND end_time >= p_end_time)
        OR (start_time >= p_start_time AND end_time <= p_end_time)
    );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check staff availability
CREATE OR REPLACE FUNCTION check_staff_availability(
    p_employee_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointment_staff_assignments asa
    JOIN appointments a ON a.id = asa.appointment_id
    WHERE asa.employee_id = p_employee_id
    AND a.appointment_date = p_appointment_date
    AND a.status NOT IN ('cancelled', 'no_show')
    AND (a.id != p_exclude_appointment_id OR p_exclude_appointment_id IS NULL)
    AND (
        (a.start_time <= p_start_time AND a.end_time > p_start_time)
        OR (a.start_time < p_end_time AND a.end_time >= p_end_time)
        OR (a.start_time >= p_start_time AND a.end_time <= p_end_time)
    );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointment_settings_timestamp
    BEFORE UPDATE ON appointment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER update_appointment_types_timestamp
    BEFORE UPDATE ON appointment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER update_appointment_resources_timestamp
    BEFORE UPDATE ON appointment_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER update_appointments_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE appointment_settings IS 'Organization-level configuration for appointment scheduling';
COMMENT ON TABLE appointment_types IS 'Types of appointments that can be scheduled';
COMMENT ON TABLE appointment_resources IS 'Physical resources (rooms, equipment) available for booking';
COMMENT ON TABLE appointments IS 'Customer appointments with scheduling and status tracking';
COMMENT ON TABLE appointment_staff_assignments IS 'Staff members assigned to appointments';
COMMENT ON TABLE appointment_resource_bookings IS 'Resource allocations for appointments';
COMMENT ON TABLE appointment_reminders IS 'Automated reminders sent to customers';
COMMENT ON TABLE appointment_availability_overrides IS 'Special availability rules for specific dates';
COMMENT ON TABLE appointment_blackout_periods IS 'Time periods when appointments cannot be scheduled';
