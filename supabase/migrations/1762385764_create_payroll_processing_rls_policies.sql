-- Migration: create_payroll_processing_rls_policies
-- Created at: 1762385764

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

-- Helper function to get user's organization_id (if not already exists)
CREATE OR REPLACE FUNCTION auth.get_user_organization_id() 
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PAYROLL_RUNS Policies
CREATE POLICY "Users can view payroll runs from their organization"
  ON payroll_runs FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

CREATE POLICY "HR and Finance can insert payroll runs"
  ON payroll_runs FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'Payroll Manager', 'CEO')
      )
    )
  );

CREATE POLICY "HR and Finance can update payroll runs"
  ON payroll_runs FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'Payroll Manager', 'CEO')
      )
    )
  );

CREATE POLICY "Admin can delete payroll runs"
  ON payroll_runs FOR DELETE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') = 'admin' OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title = 'CEO'
      )
    )
  );

-- 2. PAYROLL_ITEMS Policies
CREATE POLICY "Users can view payroll items from their organization"
  ON payroll_items FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      -- HR/Finance can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'Payroll Manager', 'CEO')
      ) OR
      -- Employees can see their own
      employee_id = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "HR and Finance can insert payroll items"
  ON payroll_items FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'Payroll Manager')
      )
    )
  );

CREATE POLICY "HR and Finance can update payroll items"
  ON payroll_items FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'Payroll Manager')
      )
    )
  );

-- 3. END_OF_SERVICE Policies
CREATE POLICY "Users can view end of service from their organization"
  ON end_of_service FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      -- HR/Finance can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'CEO')
      ) OR
      -- Employees can see their own
      employee_id = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "HR can insert end of service records"
  ON end_of_service FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'CEO')
      )
    )
  );

CREATE POLICY "HR can update end of service records"
  ON end_of_service FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'CEO')
      )
    )
  );

-- 4. BANK_TRANSFERS Policies
CREATE POLICY "Finance can view bank transfers from their organization"
  ON bank_transfers FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('Finance Manager', 'Payroll Manager', 'CEO')
      )
    )
  );

CREATE POLICY "Finance can insert bank transfers"
  ON bank_transfers FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'finance_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('Finance Manager', 'CEO')
      )
    )
  );

CREATE POLICY "Finance can update bank transfers"
  ON bank_transfers FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'finance_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('Finance Manager', 'CEO')
      )
    )
  );

-- 5. TAX_REPORTS Policies
CREATE POLICY "Finance can view tax reports from their organization"
  ON tax_reports FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('Finance Manager', 'Payroll Manager', 'CEO')
      )
    )
  );

CREATE POLICY "Finance can insert tax reports"
  ON tax_reports FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'finance_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('Finance Manager', 'CEO')
      )
    )
  );

CREATE POLICY "Finance can update tax reports"
  ON tax_reports FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'finance_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('Finance Manager', 'CEO')
      )
    )
  );

-- 6. PAYROLL_APPROVALS Policies
CREATE POLICY "Users can view relevant approvals from their organization"
  ON payroll_approvals FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      -- Admins and managers can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager') OR
      -- Assigned approvers can see their assignments
      (auth.jwt() ->> 'employee_id')::UUID = ANY(assigned_to) OR
      -- Requesters can see their requests
      requested_by = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "Users can insert approval requests"
  ON payroll_approvals FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    requested_by = (auth.jwt() ->> 'employee_id')::UUID
  );

CREATE POLICY "Assigned approvers can update approvals"
  ON payroll_approvals FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'employee_id')::UUID = ANY(assigned_to) OR
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager')
    )
  );

-- 7. PAYROLL_AUDITS Policies
CREATE POLICY "Authorized users can view audits from their organization"
  ON payroll_audits FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager') OR
      lead_auditor = (auth.jwt() ->> 'employee_id')::UUID OR
      (auth.jwt() ->> 'employee_id')::UUID = ANY(audit_team) OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('CEO', 'Compliance Manager', 'Internal Auditor')
      )
    )
  );

CREATE POLICY "Auditors can insert audit records"
  ON payroll_audits FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('CEO', 'Compliance Manager', 'Internal Auditor')
      )
    )
  );

CREATE POLICY "Auditors can update audit records"
  ON payroll_audits FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      lead_auditor = (auth.jwt() ->> 'employee_id')::UUID OR
      (auth.jwt() ->> 'employee_id')::UUID = ANY(audit_team) OR
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager')
    )
  );

-- 8. EMPLOYEE_STATEMENTS Policies
CREATE POLICY "Users can view relevant statements from their organization"
  ON employee_statements FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      -- HR/Finance can see all
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'finance_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Finance Manager', 'Payroll Manager', 'CEO')
      ) OR
      -- Employees can see their own statements
      employee_id = (auth.jwt() ->> 'employee_id')::UUID
    )
  );

CREATE POLICY "HR and Payroll can insert employee statements"
  ON employee_statements FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Payroll Manager')
      )
    )
  );

CREATE POLICY "HR and Payroll can update employee statements"
  ON employee_statements FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() AND
    (
      (auth.jwt() ->> 'role') IN ('admin', 'hr_manager', 'payroll_manager') OR
      EXISTS (
        SELECT 1 FROM employees e 
        WHERE e.id = (auth.jwt() ->> 'employee_id')::UUID 
        AND e.organization_id = auth.get_user_organization_id()
        AND e.job_title IN ('HR Manager', 'Payroll Manager')
      ) OR
      -- Employees can acknowledge their statements
      (employee_id = (auth.jwt() ->> 'employee_id')::UUID AND employee_acknowledged = false)
    )
  );;