-- Migration: employee_management_constraints_and_indexes
-- Created at: 1762374624

-- Add department head reference to departments table
ALTER TABLE departments ADD COLUMN department_head_id UUID REFERENCES employees(id);

-- Employee Management System Indexes

-- departments table
CREATE INDEX idx_departments_organization ON departments(organization_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_head ON departments(department_head_id);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;
CREATE INDEX idx_departments_code ON departments(department_code);

-- employees table
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_emirates_id ON employees(emirates_id) WHERE emirates_id IS NOT NULL;
CREATE INDEX idx_employees_email ON employees(email) WHERE email IS NOT NULL;
CREATE INDEX idx_employees_name ON employees(first_name, last_name);

-- employee_emergency_contacts table
CREATE INDEX idx_employee_emergency_contacts_employee ON employee_emergency_contacts(employee_id);
CREATE INDEX idx_employee_emergency_contacts_org ON employee_emergency_contacts(organization_id);
CREATE INDEX idx_employee_emergency_contacts_primary ON employee_emergency_contacts(is_primary_contact) WHERE is_primary_contact = true;

-- employee_skills table
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_org ON employee_skills(organization_id);
CREATE INDEX idx_employee_skills_category ON employee_skills(skill_category);
CREATE INDEX idx_employee_skills_name ON employee_skills(skill_name);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills(proficiency_level);
CREATE INDEX idx_employee_skills_primary ON employee_skills(is_primary_skill) WHERE is_primary_skill = true;

-- employee_certifications table
CREATE INDEX idx_employee_certifications_employee ON employee_certifications(employee_id);
CREATE INDEX idx_employee_certifications_org ON employee_certifications(organization_id);
CREATE INDEX idx_employee_certifications_status ON employee_certifications(verification_status);
CREATE INDEX idx_employee_certifications_expiry ON employee_certifications(expiry_date);
CREATE INDEX idx_employee_certifications_type ON employee_certifications(certification_type);

-- employment_contracts table
CREATE INDEX idx_employment_contracts_employee ON employment_contracts(employee_id);
CREATE INDEX idx_employment_contracts_org ON employment_contracts(organization_id);
CREATE INDEX idx_employment_contracts_number ON employment_contracts(contract_number);
CREATE INDEX idx_employment_contracts_status ON employment_contracts(contract_status);
CREATE INDEX idx_employment_contracts_end_date ON employment_contracts(end_date);

-- visa_tracking table
CREATE INDEX idx_visa_tracking_employee ON visa_tracking(employee_id);
CREATE INDEX idx_visa_tracking_org ON visa_tracking(organization_id);
CREATE INDEX idx_visa_tracking_number ON visa_tracking(visa_number);
CREATE INDEX idx_visa_tracking_status ON visa_tracking(visa_status);
CREATE INDEX idx_visa_tracking_expiry ON visa_tracking(expiry_date);
CREATE INDEX idx_visa_tracking_renewal ON visa_tracking(next_renewal_due_date);

-- performance_reviews table
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_org ON performance_reviews(organization_id);
CREATE INDEX idx_performance_reviews_period ON performance_reviews(review_period_start, review_period_end);
CREATE INDEX idx_performance_reviews_reviewer ON performance_reviews(reviewer_id);
CREATE INDEX idx_performance_reviews_status ON performance_reviews(review_status);
CREATE INDEX idx_performance_reviews_type ON performance_reviews(review_type);
CREATE INDEX idx_performance_reviews_cycle ON performance_reviews(review_cycle);

-- training_programs table
CREATE INDEX idx_training_programs_org ON training_programs(organization_id);
CREATE INDEX idx_training_programs_code ON training_programs(program_code);
CREATE INDEX idx_training_programs_category ON training_programs(program_category);
CREATE INDEX idx_training_programs_type ON training_programs(training_type);
CREATE INDEX idx_training_programs_active ON training_programs(is_active) WHERE is_active = true;

-- employee_training table
CREATE INDEX idx_employee_training_employee ON employee_training(employee_id);
CREATE INDEX idx_employee_training_program ON employee_training(training_program_id);
CREATE INDEX idx_employee_training_org ON employee_training(organization_id);
CREATE INDEX idx_employee_training_status ON employee_training(training_status);
CREATE INDEX idx_employee_training_completion ON employee_training(completion_date);

-- employee_workflow_assignments table
CREATE INDEX idx_employee_workflow_assignments_employee ON employee_workflow_assignments(employee_id);
CREATE INDEX idx_employee_workflow_assignments_workflow ON employee_workflow_assignments(order_workflow_id);
CREATE INDEX idx_employee_workflow_assignments_org ON employee_workflow_assignments(organization_id);
CREATE INDEX idx_employee_workflow_assignments_status ON employee_workflow_assignments(task_status);
CREATE INDEX idx_employee_workflow_assignments_date ON employee_workflow_assignments(assignment_date);
CREATE INDEX idx_employee_workflow_assignments_order ON employee_workflow_assignments(order_id);;