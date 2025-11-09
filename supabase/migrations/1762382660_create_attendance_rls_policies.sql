-- Migration: create_attendance_rls_policies
-- Created at: 1762382660

-- Row Level Security Policies for Attendance Management System
-- Organization-based data isolation

-- Enable RLS on all attendance management tables
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_reports ENABLE ROW LEVEL SECURITY;

-- Work Shifts RLS Policies
CREATE POLICY "work_shifts_select" ON work_shifts FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "work_shifts_insert" ON work_shifts FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "work_shifts_update" ON work_shifts FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "work_shifts_delete" ON work_shifts FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Shift Assignments RLS Policies
CREATE POLICY "shift_assignments_select" ON shift_assignments FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "shift_assignments_insert" ON shift_assignments FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "shift_assignments_update" ON shift_assignments FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "shift_assignments_delete" ON shift_assignments FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Attendance Records RLS Policies
CREATE POLICY "attendance_records_select" ON attendance_records FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_records_insert" ON attendance_records FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_records_update" ON attendance_records FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_records_delete" ON attendance_records FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Leave Requests RLS Policies
CREATE POLICY "leave_requests_select" ON leave_requests FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "leave_requests_insert" ON leave_requests FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "leave_requests_update" ON leave_requests FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "leave_requests_delete" ON leave_requests FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Leave Balances RLS Policies
CREATE POLICY "leave_balances_select" ON leave_balances FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "leave_balances_insert" ON leave_balances FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "leave_balances_update" ON leave_balances FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "leave_balances_delete" ON leave_balances FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Overtime Records RLS Policies
CREATE POLICY "overtime_records_select" ON overtime_records FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "overtime_records_insert" ON overtime_records FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "overtime_records_update" ON overtime_records FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "overtime_records_delete" ON overtime_records FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Attendance Devices RLS Policies
CREATE POLICY "attendance_devices_select" ON attendance_devices FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_devices_insert" ON attendance_devices FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_devices_update" ON attendance_devices FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_devices_delete" ON attendance_devices FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Attendance Reports RLS Policies
CREATE POLICY "attendance_reports_select" ON attendance_reports FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_reports_insert" ON attendance_reports FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_reports_update" ON attendance_reports FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "attendance_reports_delete" ON attendance_reports FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

COMMENT ON POLICY "work_shifts_select" ON work_shifts IS 'Allow users to view shifts within their organization';
COMMENT ON POLICY "attendance_records_select" ON attendance_records IS 'Allow users to view attendance records within their organization';
COMMENT ON POLICY "leave_requests_select" ON leave_requests IS 'Allow users to view leave requests within their organization';;