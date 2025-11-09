-- Migration: create_attendance_management_system
-- Created at: 1762382626

-- Work Schedule & Attendance Management System
-- UAE Labor Law Compliance Implementation

-- 1. Work Shifts Table - Shift definitions and templates
CREATE TABLE work_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shift_name VARCHAR(100) NOT NULL,
    shift_code VARCHAR(20) NOT NULL,
    shift_type VARCHAR(50) NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'flexible', 'part_time')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 60,
    total_work_hours DECIMAL(4,2) NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- 0=Sunday, 1=Monday, etc.
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    overtime_threshold_hours DECIMAL(4,2) DEFAULT 8.00,
    minimum_break_hours DECIMAL(4,2) DEFAULT 1.00,
    grace_period_minutes INTEGER DEFAULT 15,
    description TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_shift_code_per_org UNIQUE (organization_id, shift_code),
    CONSTRAINT valid_work_hours CHECK (total_work_hours <= 12.0), -- UAE compliance
    CONSTRAINT valid_break_duration CHECK (break_duration_minutes >= 30)
);

-- 2. Shift Assignments Table - Employee-shift assignments
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES work_shifts(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    assignment_status VARCHAR(50) DEFAULT 'scheduled' CHECK (assignment_status IN ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled')),
    is_mandatory BOOLEAN DEFAULT true,
    can_swap BOOLEAN DEFAULT true,
    swap_deadline TIMESTAMP WITH TIME ZONE,
    coverage_required BOOLEAN DEFAULT false,
    coverage_employee_id UUID REFERENCES employees(id),
    assigned_by_id UUID REFERENCES employees(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_employee_shift_date UNIQUE (employee_id, assignment_date, shift_id)
);

-- 3. Attendance Records Table - Individual check-in/out records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_assignment_id UUID REFERENCES shift_assignments(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    total_work_hours DECIMAL(4,2),
    total_break_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    late_arrival_minutes INTEGER DEFAULT 0,
    early_departure_minutes INTEGER DEFAULT 0,
    attendance_status VARCHAR(50) DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
    check_in_location JSONB, -- GPS coordinates, device info
    check_out_location JSONB,
    check_in_device_id UUID,
    check_out_device_id UUID,
    is_manual_entry BOOLEAN DEFAULT false,
    manual_entry_reason TEXT,
    approved_by UUID REFERENCES employees(id),
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_check_times CHECK (check_out_time IS NULL OR check_in_time <= check_out_time),
    CONSTRAINT valid_break_times CHECK (break_end_time IS NULL OR break_start_time <= break_end_time)
);

-- 4. Leave Requests Table - Leave requests and approvals (UAE compliance)
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'maternity', 'paternity', 'emergency', 'unpaid', 'hajj')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    working_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    supporting_documents JSONB, -- File URLs, medical certificates
    request_status VARCHAR(50) DEFAULT 'pending' CHECK (request_status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    hr_notes TEXT,
    is_emergency_leave BOOLEAN DEFAULT false,
    pay_status VARCHAR(50) CHECK (pay_status IN ('full_pay', 'half_pay', 'no_pay')) DEFAULT 'full_pay',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_leave_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_total_days CHECK (total_days > 0 AND total_days <= 365), -- Max 1 year
    CONSTRAINT valid_working_days CHECK (working_days <= total_days)
);

-- 5. Leave Balances Table - Leave balance tracking (UAE regulations)
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_year INTEGER NOT NULL,
    annual_leave_entitled INTEGER DEFAULT 30, -- UAE standard: 30 days after 1 year
    annual_leave_used INTEGER DEFAULT 0,
    annual_leave_balance INTEGER DEFAULT 30,
    sick_leave_entitled INTEGER DEFAULT 90, -- UAE: 90 days per year
    sick_leave_used INTEGER DEFAULT 0,
    sick_leave_balance INTEGER DEFAULT 90,
    maternity_leave_entitled INTEGER DEFAULT 60, -- UAE: 60 days
    maternity_leave_used INTEGER DEFAULT 0,
    maternity_leave_balance INTEGER DEFAULT 0,
    emergency_leave_used INTEGER DEFAULT 0,
    unpaid_leave_used INTEGER DEFAULT 0,
    leave_accrual_rate DECIMAL(4,2) DEFAULT 2.5, -- Days per month
    carry_forward_days INTEGER DEFAULT 0,
    max_carry_forward INTEGER DEFAULT 30, -- Max days to carry forward
    balance_as_of DATE DEFAULT CURRENT_DATE,
    last_updated_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_employee_leave_year UNIQUE (employee_id, leave_year),
    CONSTRAINT valid_leave_balances CHECK (
        annual_leave_balance >= 0 AND 
        sick_leave_balance >= 0 AND 
        maternity_leave_balance >= 0
    )
);

-- 6. Overtime Records Table - Overtime tracking and approvals (UAE compliance)
CREATE TABLE overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    overtime_date DATE NOT NULL,
    regular_hours DECIMAL(4,2) NOT NULL,
    overtime_hours DECIMAL(4,2) NOT NULL,
    overtime_rate DECIMAL(5,2) DEFAULT 1.25, -- UAE: 125% of regular rate
    overtime_type VARCHAR(50) DEFAULT 'daily' CHECK (overtime_type IN ('daily', 'weekly', 'holiday', 'emergency')),
    reason TEXT NOT NULL,
    pre_approved BOOLEAN DEFAULT false,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    requested_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    project_code VARCHAR(50),
    client_billable BOOLEAN DEFAULT false,
    overtime_cost_aed DECIMAL(10,2),
    manager_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_overtime_hours CHECK (overtime_hours > 0 AND overtime_hours <= 4), -- UAE: Max 2 hours/day typically
    CONSTRAINT valid_regular_hours CHECK (regular_hours >= 0 AND regular_hours <= 12)
);

-- 7. Attendance Devices Table - Biometric/GPS device registrations
CREATE TABLE attendance_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('biometric', 'rfid', 'mobile_gps', 'web_portal', 'manual')),
    device_serial VARCHAR(100),
    device_location VARCHAR(200),
    device_coordinates JSONB, -- GPS location of device
    is_active BOOLEAN DEFAULT true,
    requires_gps BOOLEAN DEFAULT false,
    gps_radius_meters INTEGER DEFAULT 100,
    allowed_employee_ids UUID[], -- Specific employees allowed to use this device
    department_restrictions UUID[], -- Department IDs
    device_settings JSONB, -- Device-specific configuration
    last_sync_at TIMESTAMP WITH TIME ZONE,
    installation_date DATE,
    maintenance_schedule TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_device_serial UNIQUE (organization_id, device_serial)
);

-- 8. Attendance Reports Table - Generated attendance reports
CREATE TABLE attendance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('monthly', 'weekly', 'daily', 'custom', 'overtime', 'leave_summary', 'compliance')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    employee_ids UUID[], -- Specific employees included
    department_ids UUID[], -- Departments included
    report_data JSONB NOT NULL, -- Generated report data
    report_summary JSONB, -- Summary statistics
    total_employees INTEGER,
    total_working_days INTEGER,
    total_attendance_percentage DECIMAL(5,2),
    total_overtime_hours DECIMAL(8,2),
    total_leave_days INTEGER,
    uae_compliance_score DECIMAL(5,2), -- Compliance with UAE labor law
    generated_by UUID REFERENCES employees(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_format VARCHAR(20) DEFAULT 'json' CHECK (report_format IN ('json', 'pdf', 'excel')),
    file_path TEXT, -- Path to generated file
    is_automated BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20) CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_work_shifts_org_active ON work_shifts(organization_id, is_active);
CREATE INDEX idx_shift_assignments_employee_date ON shift_assignments(employee_id, assignment_date);
CREATE INDEX idx_attendance_records_employee_date ON attendance_records(employee_id, attendance_date);
CREATE INDEX idx_attendance_records_date_status ON attendance_records(attendance_date, attendance_status);
CREATE INDEX idx_leave_requests_employee_status ON leave_requests(employee_id, request_status);
CREATE INDEX idx_leave_balances_employee_year ON leave_balances(employee_id, leave_year);
CREATE INDEX idx_overtime_records_employee_date ON overtime_records(employee_id, overtime_date);
CREATE INDEX idx_overtime_records_approval_status ON overtime_records(approval_status, overtime_date);
CREATE INDEX idx_attendance_devices_org_active ON attendance_devices(organization_id, is_active);
CREATE INDEX idx_attendance_reports_org_type ON attendance_reports(organization_id, report_type);

-- Add constraints for UAE labor law compliance
ALTER TABLE attendance_records ADD CONSTRAINT uae_max_daily_hours 
    CHECK (total_work_hours <= 12.0); -- UAE allows up to 12 hours with overtime

ALTER TABLE overtime_records ADD CONSTRAINT uae_max_annual_overtime 
    CHECK (overtime_hours >= 0); -- Will implement annual limit in application logic

COMMENT ON TABLE work_shifts IS 'Shift definitions and templates for work scheduling';
COMMENT ON TABLE shift_assignments IS 'Employee assignments to specific shifts';
COMMENT ON TABLE attendance_records IS 'Individual check-in/out records with GPS and device tracking';
COMMENT ON TABLE leave_requests IS 'Leave requests with UAE labor law compliance';
COMMENT ON TABLE leave_balances IS 'Employee leave balances per UAE regulations';
COMMENT ON TABLE overtime_records IS 'Overtime tracking with UAE rate calculations';
COMMENT ON TABLE attendance_devices IS 'Biometric and GPS device management';
COMMENT ON TABLE attendance_reports IS 'Generated attendance and compliance reports';;