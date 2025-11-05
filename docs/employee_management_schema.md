# Employee Management System - Database Schema

## Overview
Comprehensive HR management system for tailoring businesses with UAE labor compliance, skills tracking, performance management, and organizational hierarchy. Integrates with existing CRM workflow system for task assignment and workload management.

## New Tables

### 1. employees
Core employee profiles with UAE compliance features

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE NOT NULL, -- EMP-20250106-001
  emirates_id TEXT UNIQUE, -- UAE Emirates ID
  passport_number TEXT,
  passport_country TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name_arabic TEXT, -- Arabic name
  last_name_arabic TEXT,
  date_of_birth DATE,
  gender TEXT, -- 'male', 'female'
  nationality TEXT,
  religion TEXT,
  marital_status TEXT, -- 'single', 'married', 'divorced', 'widowed'
  email TEXT UNIQUE,
  phone_primary TEXT,
  phone_secondary TEXT,
  whatsapp_number TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'UAE',
  profile_photo_url TEXT,
  employment_status TEXT DEFAULT 'active', -- 'active', 'on_leave', 'terminated', 'suspended'
  hire_date DATE NOT NULL,
  termination_date DATE,
  termination_reason TEXT,
  job_title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES employees(id),
  employment_type TEXT, -- 'full_time', 'part_time', 'contract', 'internship'
  work_schedule TEXT, -- 'day_shift', 'night_shift', 'flexible'
  base_salary_aed NUMERIC(10,2),
  currency TEXT DEFAULT 'AED',
  pay_frequency TEXT, -- 'monthly', 'weekly', 'hourly'
  probation_period_months INTEGER DEFAULT 3,
  probation_end_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_emirates_id ON employees(emirates_id) WHERE emirates_id IS NOT NULL;
```

### 2. departments
Organizational structure and department management

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_code TEXT UNIQUE NOT NULL, -- DEPT-001
  department_name TEXT NOT NULL,
  department_name_arabic TEXT,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),
  department_head_id UUID REFERENCES employees(id),
  location TEXT,
  budget_annual_aed NUMERIC(12,2),
  cost_center_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_organization ON departments(organization_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_head ON departments(department_head_id);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;
```

### 3. employee_skills
Skills and expertise tracking for tailoring specializations

```sql
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_category TEXT NOT NULL, -- 'tailoring', 'design', 'sales', 'management', 'technical'
  skill_name TEXT NOT NULL, -- 'suit_tailoring', 'dress_making', 'alteration', 'pattern_making'
  skill_subcategory TEXT, -- garment type: 'suits', 'shirts', 'dresses', 'thobes', 'casual'
  proficiency_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  years_experience NUMERIC(3,1), -- 2.5 years
  verified_by UUID REFERENCES employees(id),
  verification_date DATE,
  verification_notes TEXT,
  last_assessment_date DATE,
  next_assessment_date DATE,
  quality_rating NUMERIC(3,2), -- 1.00 to 5.00
  speed_rating NUMERIC(3,2), -- 1.00 to 5.00
  consistency_rating NUMERIC(3,2), -- 1.00 to 5.00
  is_primary_skill BOOLEAN DEFAULT false,
  is_certified BOOLEAN DEFAULT false,
  certification_authority TEXT,
  certification_date DATE,
  certification_expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_org ON employee_skills(organization_id);
CREATE INDEX idx_employee_skills_category ON employee_skills(skill_category);
CREATE INDEX idx_employee_skills_name ON employee_skills(skill_name);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills(proficiency_level);
CREATE INDEX idx_employee_skills_primary ON employee_skills(is_primary_skill) WHERE is_primary_skill = true;
```

### 4. employee_certifications
Professional certifications and training records

```sql
CREATE TABLE employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_name_arabic TEXT,
  issuing_authority TEXT NOT NULL,
  certification_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  certification_level TEXT, -- 'basic', 'intermediate', 'advanced', 'master'
  certification_type TEXT, -- 'internal', 'external', 'government', 'industry'
  certification_category TEXT, -- 'tailoring', 'safety', 'quality', 'management'
  certificate_file_url TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'expired'
  verified_by UUID REFERENCES employees(id),
  verification_date DATE,
  renewal_required BOOLEAN DEFAULT false,
  renewal_reminder_days INTEGER DEFAULT 30,
  cost_aed NUMERIC(8,2),
  training_hours INTEGER,
  cpe_credits NUMERIC(5,2), -- Continuing Professional Education credits
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_certifications_employee ON employee_certifications(employee_id);
CREATE INDEX idx_employee_certifications_org ON employee_certifications(organization_id);
CREATE INDEX idx_employee_certifications_status ON employee_certifications(verification_status);
CREATE INDEX idx_employee_certifications_expiry ON employee_certifications(expiry_date);
CREATE INDEX idx_employee_certifications_type ON employee_certifications(certification_type);
```

### 5. employment_contracts
UAE labor contract management and legal documentation

```sql
CREATE TABLE employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE NOT NULL, -- CTR-20250106-001
  contract_type TEXT NOT NULL, -- 'limited', 'unlimited', 'part_time', 'consultant'
  contract_status TEXT DEFAULT 'active', -- 'active', 'expired', 'terminated', 'renewed'
  start_date DATE NOT NULL,
  end_date DATE, -- for limited contracts
  renewal_date DATE,
  contract_language TEXT DEFAULT 'english', -- 'english', 'arabic', 'bilingual'
  contract_file_url TEXT,
  contract_file_arabic_url TEXT, -- Arabic version
  job_description TEXT NOT NULL,
  job_description_arabic TEXT,
  basic_salary_aed NUMERIC(10,2) NOT NULL,
  housing_allowance_aed NUMERIC(10,2) DEFAULT 0,
  transport_allowance_aed NUMERIC(10,2) DEFAULT 0,
  food_allowance_aed NUMERIC(10,2) DEFAULT 0,
  other_allowances_aed NUMERIC(10,2) DEFAULT 0,
  total_package_aed NUMERIC(10,2) GENERATED ALWAYS AS (
    basic_salary_aed + housing_allowance_aed + transport_allowance_aed + 
    food_allowance_aed + other_allowances_aed
  ) STORED,
  working_hours_weekly INTEGER DEFAULT 48,
  working_days_weekly INTEGER DEFAULT 6,
  annual_leave_days INTEGER DEFAULT 30,
  sick_leave_days INTEGER DEFAULT 90,
  notice_period_days INTEGER DEFAULT 30,
  probation_period_months INTEGER DEFAULT 3,
  end_of_service_benefit TEXT, -- 'standard', 'enhanced', 'none'
  medical_insurance BOOLEAN DEFAULT true,
  life_insurance BOOLEAN DEFAULT false,
  gratuity_calculation TEXT, -- UAE end of service calculation
  termination_clause TEXT,
  non_compete_clause TEXT,
  confidentiality_clause TEXT,
  created_by UUID REFERENCES profiles(id),
  signed_by_employee_date DATE,
  signed_by_employer_date DATE,
  witness_name TEXT,
  witness_signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employment_contracts_employee ON employment_contracts(employee_id);
CREATE INDEX idx_employment_contracts_org ON employment_contracts(organization_id);
CREATE INDEX idx_employment_contracts_number ON employment_contracts(contract_number);
CREATE INDEX idx_employment_contracts_status ON employment_contracts(contract_status);
CREATE INDEX idx_employment_contracts_end_date ON employment_contracts(end_date);
```

### 6. visa_tracking
UAE visa and work permit management

```sql
CREATE TABLE visa_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  visa_type TEXT NOT NULL, -- 'employment', 'residence', 'work_permit', 'dependent'
  visa_number TEXT UNIQUE,
  passport_number TEXT NOT NULL,
  visa_status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'pending_renewal'
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  entry_date DATE,
  sponsor_name TEXT, -- Usually the company name
  sponsor_license_number TEXT,
  visa_purpose TEXT, -- 'employment', 'residence', 'family_reunion'
  profession_on_visa TEXT,
  salary_on_visa_aed NUMERIC(10,2),
  entry_points TEXT[], -- UAE entry points
  exit_reentry_permit BOOLEAN DEFAULT false,
  emirates_id_number TEXT,
  emirates_id_expiry_date DATE,
  labor_card_number TEXT,
  labor_card_expiry_date DATE,
  medical_insurance_number TEXT,
  medical_insurance_expiry_date DATE,
  renewal_fee_aed NUMERIC(8,2),
  government_fees_aed NUMERIC(8,2),
  typing_center_fees_aed NUMERIC(8,2),
  total_renewal_cost_aed NUMERIC(8,2),
  renewal_reminder_days INTEGER DEFAULT 60,
  last_renewal_date DATE,
  next_renewal_due_date DATE,
  renewal_status TEXT DEFAULT 'not_due', -- 'not_due', 'reminder_sent', 'in_progress', 'completed'
  authorized_signatory_id UUID REFERENCES employees(id),
  visa_file_url TEXT,
  emirates_id_copy_url TEXT,
  passport_copy_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visa_tracking_employee ON visa_tracking(employee_id);
CREATE INDEX idx_visa_tracking_org ON visa_tracking(organization_id);
CREATE INDEX idx_visa_tracking_number ON visa_tracking(visa_number);
CREATE INDEX idx_visa_tracking_status ON visa_tracking(visa_status);
CREATE INDEX idx_visa_tracking_expiry ON visa_tracking(expiry_date);
CREATE INDEX idx_visa_tracking_renewal ON visa_tracking(next_renewal_due_date);
```

### 7. performance_reviews
Performance evaluation and review management

```sql
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  review_type TEXT NOT NULL, -- 'quarterly', 'annual', 'probation', 'project_based'
  review_cycle TEXT, -- 'Q1_2025', 'ANNUAL_2025', 'PROBATION_001'
  reviewer_id UUID NOT NULL REFERENCES employees(id),
  review_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'acknowledged'
  overall_rating NUMERIC(3,2), -- 1.00 to 5.00
  overall_rating_text TEXT, -- 'excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory'
  
  -- Performance Metrics
  quality_rating NUMERIC(3,2),
  productivity_rating NUMERIC(3,2),
  reliability_rating NUMERIC(3,2),
  teamwork_rating NUMERIC(3,2),
  communication_rating NUMERIC(3,2),
  initiative_rating NUMERIC(3,2),
  leadership_rating NUMERIC(3,2),
  customer_service_rating NUMERIC(3,2),
  punctuality_rating NUMERIC(3,2),
  attendance_rating NUMERIC(3,2),
  
  -- Comments and Goals
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_achieved TEXT,
  goals_not_achieved TEXT,
  goals_next_period TEXT,
  development_plan TEXT,
  training_recommendations TEXT,
  career_aspirations TEXT,
  
  -- Review Process
  self_assessment_completed BOOLEAN DEFAULT false,
  self_assessment_date DATE,
  self_assessment_comments TEXT,
  peer_review_completed BOOLEAN DEFAULT false,
  peer_review_average_rating NUMERIC(3,2),
  manager_review_completed BOOLEAN DEFAULT false,
  manager_review_date DATE,
  manager_comments TEXT,
  hr_review_completed BOOLEAN DEFAULT false,
  hr_review_date DATE,
  hr_comments TEXT,
  
  -- Acknowledgment
  employee_acknowledgment BOOLEAN DEFAULT false,
  employee_acknowledgment_date DATE,
  employee_signature_url TEXT,
  employee_comments TEXT,
  reviewer_signature_url TEXT,
  
  -- Actions
  promotion_recommended BOOLEAN DEFAULT false,
  salary_increase_recommended BOOLEAN DEFAULT false,
  salary_increase_percentage NUMERIC(5,2),
  bonus_recommended BOOLEAN DEFAULT false,
  bonus_amount_aed NUMERIC(10,2),
  performance_improvement_plan BOOLEAN DEFAULT false,
  disciplinary_action BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_org ON performance_reviews(organization_id);
CREATE INDEX idx_performance_reviews_period ON performance_reviews(review_period_start, review_period_end);
CREATE INDEX idx_performance_reviews_reviewer ON performance_reviews(reviewer_id);
CREATE INDEX idx_performance_reviews_status ON performance_reviews(review_status);
CREATE INDEX idx_performance_reviews_type ON performance_reviews(review_type);
CREATE INDEX idx_performance_reviews_cycle ON performance_reviews(review_cycle);
```

### 8. training_programs
Training and development program management

```sql
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_code TEXT UNIQUE NOT NULL, -- TRN-20250106-001
  program_name TEXT NOT NULL,
  program_name_arabic TEXT,
  description TEXT,
  program_category TEXT, -- 'technical', 'soft_skills', 'safety', 'compliance', 'leadership'
  training_type TEXT, -- 'internal', 'external', 'online', 'workshop', 'seminar'
  skill_level TEXT, -- 'beginner', 'intermediate', 'advanced', 'all_levels'
  duration_hours INTEGER NOT NULL,
  duration_days INTEGER,
  max_participants INTEGER,
  min_participants INTEGER DEFAULT 1,
  cost_per_participant_aed NUMERIC(8,2),
  total_budget_aed NUMERIC(10,2),
  instructor_name TEXT,
  instructor_credentials TEXT,
  training_provider TEXT, -- External training provider
  training_location TEXT,
  training_format TEXT, -- 'classroom', 'online', 'hybrid', 'on_the_job'
  certification_provided BOOLEAN DEFAULT false,
  certification_authority TEXT,
  certification_validity_months INTEGER,
  prerequisites TEXT,
  target_audience TEXT,
  learning_objectives TEXT[],
  training_materials TEXT[],
  assessment_method TEXT, -- 'exam', 'practical', 'project', 'none'
  passing_score NUMERIC(5,2),
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES employees(id),
  approval_date DATE,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_programs_org ON training_programs(organization_id);
CREATE INDEX idx_training_programs_code ON training_programs(program_code);
CREATE INDEX idx_training_programs_category ON training_programs(program_category);
CREATE INDEX idx_training_programs_type ON training_programs(training_type);
CREATE INDEX idx_training_programs_active ON training_programs(is_active) WHERE is_active = true;
```

### 9. employee_training
Training attendance and completion tracking

```sql
CREATE TABLE employee_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  training_start_date DATE,
  training_end_date DATE,
  training_status TEXT DEFAULT 'enrolled', -- 'enrolled', 'in_progress', 'completed', 'failed', 'cancelled'
  attendance_percentage NUMERIC(5,2),
  assessment_score NUMERIC(5,2),
  assessment_passed BOOLEAN,
  completion_date DATE,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number TEXT,
  certificate_url TEXT,
  cost_aed NUMERIC(8,2),
  approved_by UUID REFERENCES employees(id),
  approval_date DATE,
  feedback_rating NUMERIC(3,2), -- Training feedback 1-5
  feedback_comments TEXT,
  trainer_feedback TEXT,
  skills_gained TEXT[],
  next_level_training_id UUID REFERENCES training_programs(id),
  reminder_sent BOOLEAN DEFAULT false,
  mandatory_completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_training_employee ON employee_training(employee_id);
CREATE INDEX idx_employee_training_program ON employee_training(training_program_id);
CREATE INDEX idx_employee_training_org ON employee_training(organization_id);
CREATE INDEX idx_employee_training_status ON employee_training(training_status);
CREATE INDEX idx_employee_training_completion ON employee_training(completion_date);
```

### 10. employee_emergency_contacts
Emergency contact information

```sql
CREATE TABLE employee_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_name_arabic TEXT,
  relationship TEXT NOT NULL, -- 'spouse', 'parent', 'sibling', 'child', 'friend', 'colleague'
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  authorized_for_medical BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_emergency_contacts_employee ON employee_emergency_contacts(employee_id);
CREATE INDEX idx_employee_emergency_contacts_org ON employee_emergency_contacts(organization_id);
CREATE INDEX idx_employee_emergency_contacts_primary ON employee_emergency_contacts(is_primary_contact) WHERE is_primary_contact = true;
```

### 11. employee_workflow_assignments
Integration with existing workflow system for task assignment

```sql
CREATE TABLE employee_workflow_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  workflow_task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  assignment_date TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES employees(id),
  task_type TEXT, -- 'measurement', 'cutting', 'stitching', 'finishing', 'quality_check'
  task_priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),
  task_status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'on_hold', 'cancelled'
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  quality_rating NUMERIC(3,2), -- Quality of work 1-5
  speed_rating NUMERIC(3,2), -- Speed of completion 1-5
  customer_satisfaction NUMERIC(3,2), -- If customer facing
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_workflow_assignments_employee ON employee_workflow_assignments(employee_id);
CREATE INDEX idx_employee_workflow_assignments_task ON employee_workflow_assignments(workflow_task_id);
CREATE INDEX idx_employee_workflow_assignments_org ON employee_workflow_assignments(organization_id);
CREATE INDEX idx_employee_workflow_assignments_status ON employee_workflow_assignments(task_status);
CREATE INDEX idx_employee_workflow_assignments_date ON employee_workflow_assignments(assignment_date);
```

## Relationship Summary

```
organizations
├── employees (1:many)
├── departments (1:many)
├── employee_skills (1:many)
├── employee_certifications (1:many)
├── employment_contracts (1:many)
├── visa_tracking (1:many)
├── performance_reviews (1:many)
├── training_programs (1:many)
├── employee_training (1:many)
├── employee_emergency_contacts (1:many)
└── employee_workflow_assignments (1:many)

employees
├── department (many:1 - departments)
├── manager (many:1 - employees, self-reference)
├── employee_skills (1:many)
├── employee_certifications (1:many)
├── employment_contracts (1:many)
├── visa_tracking (1:many)
├── performance_reviews (1:many)
├── employee_training (1:many)
├── employee_emergency_contacts (1:many)
├── employee_workflow_assignments (1:many)
├── subordinates (1:many - employees, reverse manager)
├── reviews_given (1:many - performance_reviews as reviewer)
└── training_approvals (1:many - various approval relationships)

departments
├── parent_department (many:1 - departments, self-reference)
├── department_head (many:1 - employees)
├── employees (1:many)
└── subdepartments (1:many - departments, reverse parent)

training_programs
├── employee_training (1:many)
└── next_level_training (1:many - employee_training)

workflow_tasks (existing)
└── employee_workflow_assignments (1:many)

orders (existing)
└── employee_workflow_assignments (1:many)
```

## RLS Policies Required

All tables require:
- Organization isolation (users only access their organization's data)
- Role-based access (HR admin full access, managers limited access, employees self-view)
- Manager hierarchy access (managers can view their subordinates)
- Privacy controls (sensitive data like salaries restricted)

## Triggers Required

1. **Employee number generation**: Auto-generate EMP-YYYYMMDD-###
2. **Contract number generation**: Auto-generate CTR-YYYYMMDD-###
3. **Training program code generation**: Auto-generate TRN-YYYYMMDD-###
4. **Update timestamps**: For all tables on UPDATE
5. **Visa renewal alerts**: Check expiry dates and set renewal status
6. **Performance review scheduling**: Auto-schedule reviews based on cycles
7. **Department hierarchy validation**: Prevent circular references
8. **Skill verification workflow**: Trigger approval processes
9. **Training completion notifications**: Update employee skills when training completed

## Storage Buckets Required

1. **employee-photos**: Profile photos (max 2MB, optimized)
2. **employee-documents**: Contracts, certificates, ID copies (max 10MB)
3. **training-materials**: Training content and resources
4. **performance-documents**: Review documents and signatures
5. **visa-documents**: Visa copies, Emirates ID, passport scans

## Default Data to Populate

### Departments:
1. Administration (CEO, HR, Finance, Legal)
2. Production (Tailoring, Quality Control, Finishing)
3. Sales & Marketing (Sales, Customer Service, Marketing)
4. Design & Development (Design, Pattern Making, R&D)
5. Operations (Inventory, Logistics, Maintenance)

### Sample Skills:
- Tailoring: Suit making, Shirt tailoring, Dress making, Alteration, Pattern making
- Design: Fashion design, Pattern design, Color coordination, Trend analysis
- Management: Team leadership, Project management, Quality assurance
- Technical: Sewing machine operation, Cutting, Pressing, Embroidery

### Training Programs:
- UAE Labor Law Compliance
- Workplace Safety & Health
- Customer Service Excellence
- Advanced Tailoring Techniques
- Quality Management Systems
- Arabic Language for Business
- Cultural Sensitivity Training

### Sample Employees:
- HR Manager, Tailoring Supervisors, Senior Tailors, Junior Tailors
- Sales Representatives, Customer Service Agents
- Quality Control Inspectors, Pattern Makers
- Various skill levels and UAE/expatriate mix

## Performance Considerations

- Index optimization for employee search and filtering
- Efficient skill matching queries for task assignment
- Performance review aggregation and analytics
- Training completion tracking and reporting
- Visa expiry monitoring and alert system
- Department hierarchy traversal optimization

## Integration Points

### Workflow System:
- Skill-based task assignment using employee_skills
- Workload balancing across employees
- Performance tracking from task completion
- Quality metrics from workflow feedback

### Analytics System:
- Employee performance dashboards
- Department productivity analytics
- Training ROI analysis
- Skill gap identification
- Cost per employee reporting

## UAE Compliance Features

- Emirates ID validation and tracking
- UAE visa and work permit management
- UAE employment contract templates
- Arabic language support for all documents
- UAE labor law compliance monitoring
- End of service benefit calculations
- UAE national/expatriate reporting
- Absher integration ready (UAE government portal)

This comprehensive schema provides the foundation for a complete HR management system while maintaining seamless integration with the existing CRM infrastructure.