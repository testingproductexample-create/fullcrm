-- Migration: employee_management_rls_policies
-- Created at: 1762374700

-- Enable RLS on all employee management tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_workflow_assignments ENABLE ROW LEVEL SECURITY;

-- departments table policies
CREATE POLICY "Users can view departments from their organization" ON departments
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and HR can create departments" ON departments
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

CREATE POLICY "Admin and HR can update departments" ON departments
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

CREATE POLICY "Admin can delete departments" ON departments
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- employees table policies
CREATE POLICY "Users can view employees from their organization" ON employees
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    -- Employees can view their own record
    id = (
      SELECT employee_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and HR can create employees" ON employees
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

CREATE POLICY "Admin and HR can update employees" ON employees
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'hr_manager')
      ) OR
      -- Employees can update their own basic info
      (id = (SELECT employee_id FROM profiles WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Admin can delete employees" ON employees
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- employee_emergency_contacts table policies
CREATE POLICY "Users can view emergency contacts from their organization" ON employee_emergency_contacts
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    -- Employees can view their own emergency contacts
    employee_id = (
      SELECT employee_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR and employees can manage emergency contacts" ON employee_emergency_contacts
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'hr_manager')
      ) OR
      -- Employees can manage their own emergency contacts
      employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- employee_skills table policies
CREATE POLICY "Users can view skills from their organization" ON employee_skills
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR and managers can manage skills" ON employee_skills
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager', 'manager')
    )
  );

-- employee_certifications table policies
CREATE POLICY "Users can view certifications from their organization" ON employee_certifications
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    -- Employees can view their own certifications
    employee_id = (
      SELECT employee_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR and employees can manage certifications" ON employee_certifications
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'hr_manager')
      ) OR
      -- Employees can add their own certifications
      employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- employment_contracts table policies
CREATE POLICY "HR can view all contracts" ON employment_contracts
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

CREATE POLICY "Employees can view their own contracts" ON employment_contracts
  FOR SELECT USING (
    employee_id = (
      SELECT employee_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and HR can manage contracts" ON employment_contracts
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

-- visa_tracking table policies
CREATE POLICY "HR can view all visa records" ON visa_tracking
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

CREATE POLICY "Employees can view their own visa records" ON visa_tracking
  FOR SELECT USING (
    employee_id = (
      SELECT employee_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and HR can manage visa records" ON visa_tracking
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

-- performance_reviews table policies
CREATE POLICY "Users can view relevant performance reviews" ON performance_reviews
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      -- HR can see all reviews
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'hr_manager')
      ) OR
      -- Employees can see their own reviews
      employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid()) OR
      -- Reviewers can see reviews they conduct
      reviewer_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "HR and reviewers can manage performance reviews" ON performance_reviews
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'hr_manager')
      ) OR
      -- Reviewers can manage reviews they conduct
      reviewer_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- training_programs table policies
CREATE POLICY "Users can view training programs from their organization" ON training_programs
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR can manage training programs" ON training_programs
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  );

-- employee_training table policies
CREATE POLICY "Users can view training records from their organization" ON employee_training
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    -- Employees can view their own training records
    employee_id = (
      SELECT employee_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR and employees can manage training records" ON employee_training
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'hr_manager')
      ) OR
      -- Employees can manage their own training enrollment
      employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- employee_workflow_assignments table policies
CREATE POLICY "Users can view workflow assignments from their organization" ON employee_workflow_assignments
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can assign workflow tasks" ON employee_workflow_assignments
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'hr_manager')
    )
  );

CREATE POLICY "Managers and employees can update assignments" ON employee_workflow_assignments
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager', 'hr_manager')
      ) OR
      -- Employees can update their own assignments (status, hours, etc)
      employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin can delete workflow assignments" ON employee_workflow_assignments
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );;