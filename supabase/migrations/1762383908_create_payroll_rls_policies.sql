-- Migration: create_payroll_rls_policies
-- Created at: 1762383908

-- Row Level Security Policies for Commission & Salary Calculation Engine
-- Organization-based data isolation for payroll system

-- Enable RLS on all payroll management tables
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_reports ENABLE ROW LEVEL SECURITY;

-- Salary Structures RLS Policies
CREATE POLICY "salary_structures_select" ON salary_structures FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_structures_insert" ON salary_structures FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_structures_update" ON salary_structures FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_structures_delete" ON salary_structures FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Commission Rates RLS Policies
CREATE POLICY "commission_rates_select" ON commission_rates FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "commission_rates_insert" ON commission_rates FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "commission_rates_update" ON commission_rates FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "commission_rates_delete" ON commission_rates FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Salary Calculations RLS Policies
CREATE POLICY "salary_calculations_select" ON salary_calculations FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_calculations_insert" ON salary_calculations FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_calculations_update" ON salary_calculations FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_calculations_delete" ON salary_calculations FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Overtime Calculations RLS Policies
CREATE POLICY "overtime_calculations_select" ON overtime_calculations FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "overtime_calculations_insert" ON overtime_calculations FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "overtime_calculations_update" ON overtime_calculations FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "overtime_calculations_delete" ON overtime_calculations FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Allowances RLS Policies
CREATE POLICY "allowances_select" ON allowances FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "allowances_insert" ON allowances FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "allowances_update" ON allowances FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "allowances_delete" ON allowances FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Deductions RLS Policies
CREATE POLICY "deductions_select" ON deductions FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "deductions_insert" ON deductions FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "deductions_update" ON deductions FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "deductions_delete" ON deductions FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Bonus Records RLS Policies
CREATE POLICY "bonus_records_select" ON bonus_records FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "bonus_records_insert" ON bonus_records FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "bonus_records_update" ON bonus_records FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "bonus_records_delete" ON bonus_records FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

-- Salary Reports RLS Policies
CREATE POLICY "salary_reports_select" ON salary_reports FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_reports_insert" ON salary_reports FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_reports_update" ON salary_reports FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "salary_reports_delete" ON salary_reports FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM employees WHERE id = auth.uid()));

COMMENT ON POLICY "salary_structures_select" ON salary_structures IS 'Allow users to view salary structures within their organization';
COMMENT ON POLICY "salary_calculations_select" ON salary_calculations IS 'Allow users to view salary calculations within their organization';
COMMENT ON POLICY "commission_rates_select" ON commission_rates IS 'Allow users to view commission rates within their organization';;