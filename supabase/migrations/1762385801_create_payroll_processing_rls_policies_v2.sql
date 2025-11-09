-- Migration: create_payroll_processing_rls_policies_v2
-- Created at: 1762385801

-- Create Row Level Security policies for Payroll Processing System
-- Enable RLS and create organization-based policies for all 8 tables

-- Enable RLS on all payroll processing tables
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_of_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_statements ENABLE ROW LEVEL SECURITY;

-- 1. PAYROLL_RUNS Policies
CREATE POLICY "payroll_runs_select_policy" ON payroll_runs FOR SELECT
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_runs_insert_policy" ON payroll_runs FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_runs_update_policy" ON payroll_runs FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_runs_delete_policy" ON payroll_runs FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 2. PAYROLL_ITEMS Policies
CREATE POLICY "payroll_items_select_policy" ON payroll_items FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID AND
    (
      -- HR/Finance/Admin can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      -- Employees can see their own
      employee_id = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "payroll_items_insert_policy" ON payroll_items FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_items_update_policy" ON payroll_items FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_items_delete_policy" ON payroll_items FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 3. END_OF_SERVICE Policies
CREATE POLICY "end_of_service_select_policy" ON end_of_service FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID AND
    (
      -- HR/Finance/Admin can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager') OR
      -- Employees can see their own
      employee_id = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "end_of_service_insert_policy" ON end_of_service FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "end_of_service_update_policy" ON end_of_service FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "end_of_service_delete_policy" ON end_of_service FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 4. BANK_TRANSFERS Policies
CREATE POLICY "bank_transfers_select_policy" ON bank_transfers FOR SELECT
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "bank_transfers_insert_policy" ON bank_transfers FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "bank_transfers_update_policy" ON bank_transfers FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "bank_transfers_delete_policy" ON bank_transfers FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 5. TAX_REPORTS Policies
CREATE POLICY "tax_reports_select_policy" ON tax_reports FOR SELECT
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "tax_reports_insert_policy" ON tax_reports FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "tax_reports_update_policy" ON tax_reports FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "tax_reports_delete_policy" ON tax_reports FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 6. PAYROLL_APPROVALS Policies
CREATE POLICY "payroll_approvals_select_policy" ON payroll_approvals FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID AND
    (
      -- Admins and managers can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager') OR
      -- Assigned approvers can see their assignments
      (auth.jwt() ->> 'employee_id')::UUID = ANY(assigned_to) OR
      -- Requesters can see their requests
      requested_by = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "payroll_approvals_insert_policy" ON payroll_approvals FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_approvals_update_policy" ON payroll_approvals FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_approvals_delete_policy" ON payroll_approvals FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 7. PAYROLL_AUDITS Policies
CREATE POLICY "payroll_audits_select_policy" ON payroll_audits FOR SELECT
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_audits_insert_policy" ON payroll_audits FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_audits_update_policy" ON payroll_audits FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "payroll_audits_delete_policy" ON payroll_audits FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- 8. EMPLOYEE_STATEMENTS Policies
CREATE POLICY "employee_statements_select_policy" ON employee_statements FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::UUID AND
    (
      -- HR/Finance/Admin can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      -- Employees can see their own statements
      employee_id = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "employee_statements_insert_policy" ON employee_statements FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "employee_statements_update_policy" ON employee_statements FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

CREATE POLICY "employee_statements_delete_policy" ON employee_statements FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);;