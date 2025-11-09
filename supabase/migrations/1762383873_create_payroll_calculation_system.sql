-- Migration: create_payroll_calculation_system
-- Created at: 1762383873

-- Commission & Salary Calculation Engine
-- UAE Labor Law Compliance & Performance-Based Compensation System

-- 1. Salary Structures Table - Base salary configurations and templates
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    structure_name VARCHAR(200) NOT NULL,
    structure_code VARCHAR(50) NOT NULL,
    job_title VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES departments(id),
    experience_level VARCHAR(50) NOT NULL CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'expert', 'lead')),
    base_salary_aed DECIMAL(10,2) NOT NULL,
    min_salary_aed DECIMAL(10,2) NOT NULL,
    max_salary_aed DECIMAL(10,2) NOT NULL,
    salary_currency VARCHAR(3) DEFAULT 'AED',
    hourly_rate_aed DECIMAL(8,2),
    overtime_rate_multiplier DECIMAL(4,2) DEFAULT 1.25, -- UAE: 125% of regular rate
    commission_eligible BOOLEAN DEFAULT false,
    commission_base_percentage DECIMAL(5,2) DEFAULT 0.00,
    bonus_eligible BOOLEAN DEFAULT true,
    transportation_allowance_aed DECIMAL(8,2) DEFAULT 0,
    meal_allowance_aed DECIMAL(8,2) DEFAULT 0,
    accommodation_allowance_aed DECIMAL(8,2) DEFAULT 0,
    skills_allowance_aed DECIMAL(8,2) DEFAULT 0,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    annual_review_month INTEGER DEFAULT 1, -- January
    grade_level INTEGER DEFAULT 1,
    performance_band VARCHAR(50) DEFAULT 'standard' CHECK (performance_band IN ('below', 'standard', 'above', 'excellent')),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_structure_code_per_org UNIQUE (organization_id, structure_code),
    CONSTRAINT valid_salary_range CHECK (min_salary_aed <= base_salary_aed AND base_salary_aed <= max_salary_aed),
    CONSTRAINT valid_commission_percentage CHECK (commission_base_percentage >= 0 AND commission_base_percentage <= 50),
    CONSTRAINT valid_overtime_multiplier CHECK (overtime_rate_multiplier >= 1.0 AND overtime_rate_multiplier <= 3.0)
);

-- 2. Commission Rates Table - Commission percentages by role and performance metrics
CREATE TABLE commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    commission_name VARCHAR(200) NOT NULL,
    commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('task_completion', 'order_value', 'quality_bonus', 'efficiency_bonus', 'customer_satisfaction')),
    employee_id UUID REFERENCES employees(id), -- Specific employee or NULL for role-based
    job_title VARCHAR(200), -- Job title pattern matching
    department_id UUID REFERENCES departments(id), -- Department-specific rates
    task_type VARCHAR(100), -- Specific task types for task_completion commissions
    min_order_value_aed DECIMAL(10,2), -- Minimum order value for commission eligibility
    max_order_value_aed DECIMAL(10,2), -- Maximum order value for commission calculation
    commission_percentage DECIMAL(5,2) NOT NULL,
    flat_amount_aed DECIMAL(10,2) DEFAULT 0,
    performance_threshold DECIMAL(5,2), -- Minimum performance score required
    quality_threshold DECIMAL(3,1), -- Minimum quality score (1-5)
    customer_satisfaction_threshold DECIMAL(3,1), -- Minimum customer satisfaction (1-5)
    calculation_frequency VARCHAR(50) DEFAULT 'monthly' CHECK (calculation_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    is_cumulative BOOLEAN DEFAULT false, -- Whether commissions accumulate over time
    cap_amount_aed DECIMAL(10,2), -- Maximum commission amount per period
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_commission_percentage CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    CONSTRAINT valid_order_value_range CHECK (max_order_value_aed IS NULL OR min_order_value_aed <= max_order_value_aed),
    CONSTRAINT valid_performance_threshold CHECK (performance_threshold IS NULL OR (performance_threshold >= 0 AND performance_threshold <= 100))
);

-- 3. Salary Calculations Table - Monthly calculation records and status
CREATE TABLE salary_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    calculation_period_month INTEGER NOT NULL CHECK (calculation_period_month >= 1 AND calculation_period_month <= 12),
    calculation_period_year INTEGER NOT NULL CHECK (calculation_period_year >= 2020 AND calculation_period_year <= 2100),
    salary_structure_id UUID REFERENCES salary_structures(id),
    base_salary_aed DECIMAL(10,2) NOT NULL,
    hourly_rate_aed DECIMAL(8,2) NOT NULL,
    total_work_hours DECIMAL(8,2) DEFAULT 0,
    regular_hours DECIMAL(8,2) DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_amount_aed DECIMAL(10,2) DEFAULT 0,
    commission_amount_aed DECIMAL(10,2) DEFAULT 0,
    bonus_amount_aed DECIMAL(10,2) DEFAULT 0,
    allowances_amount_aed DECIMAL(10,2) DEFAULT 0,
    gross_salary_aed DECIMAL(10,2) NOT NULL,
    deductions_amount_aed DECIMAL(10,2) DEFAULT 0,
    tax_amount_aed DECIMAL(10,2) DEFAULT 0,
    insurance_deduction_aed DECIMAL(10,2) DEFAULT 0,
    advance_deduction_aed DECIMAL(10,2) DEFAULT 0,
    leave_deduction_aed DECIMAL(10,2) DEFAULT 0,
    other_deductions_aed DECIMAL(10,2) DEFAULT 0,
    net_salary_aed DECIMAL(10,2) NOT NULL,
    calculation_status VARCHAR(50) DEFAULT 'pending' CHECK (calculation_status IN ('pending', 'calculating', 'calculated', 'approved', 'paid', 'cancelled')),
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(200),
    notes TEXT,
    calculation_details JSONB, -- Detailed breakdown of calculations
    is_final BOOLEAN DEFAULT false,
    adjustment_reason TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_employee_period UNIQUE (employee_id, calculation_period_month, calculation_period_year),
    CONSTRAINT valid_salary_amounts CHECK (gross_salary_aed >= 0 AND net_salary_aed >= 0),
    CONSTRAINT valid_hours CHECK (total_work_hours >= 0 AND regular_hours >= 0 AND overtime_hours >= 0)
);

-- 4. Overtime Calculations Table - Enhanced overtime calculations with UAE compliance
CREATE TABLE overtime_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_calculation_id UUID REFERENCES salary_calculations(id) ON DELETE CASCADE,
    calculation_period_month INTEGER NOT NULL,
    calculation_period_year INTEGER NOT NULL,
    regular_hourly_rate_aed DECIMAL(8,2) NOT NULL,
    overtime_multiplier DECIMAL(4,2) DEFAULT 1.25, -- UAE: 125% rate
    overtime_hourly_rate_aed DECIMAL(8,2) NOT NULL,
    total_overtime_hours DECIMAL(8,2) NOT NULL,
    daily_overtime_hours DECIMAL(8,2) DEFAULT 0,
    weekly_overtime_hours DECIMAL(8,2) DEFAULT 0,
    holiday_overtime_hours DECIMAL(8,2) DEFAULT 0,
    emergency_overtime_hours DECIMAL(8,2) DEFAULT 0,
    total_overtime_amount_aed DECIMAL(10,2) NOT NULL,
    uae_compliance_check BOOLEAN DEFAULT true,
    max_daily_limit_exceeded BOOLEAN DEFAULT false,
    max_annual_limit_exceeded BOOLEAN DEFAULT false,
    overtime_source_data JSONB, -- Reference to source attendance/overtime records
    calculation_method VARCHAR(100) DEFAULT 'automatic',
    is_manual_adjustment BOOLEAN DEFAULT false,
    adjustment_reason TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_overtime_rates CHECK (overtime_hourly_rate_aed >= regular_hourly_rate_aed),
    CONSTRAINT valid_overtime_hours CHECK (total_overtime_hours >= 0 AND total_overtime_hours <= 500), -- Reasonable annual limit
    CONSTRAINT uae_daily_overtime_check CHECK (NOT max_daily_limit_exceeded OR total_overtime_hours <= 2 * 30) -- 2h/day * 30 days max
);

-- 5. Allowances Table - Transportation, meal, skills allowances
CREATE TABLE allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_calculation_id UUID REFERENCES salary_calculations(id) ON DELETE CASCADE,
    allowance_type VARCHAR(50) NOT NULL CHECK (allowance_type IN ('transportation', 'meal', 'accommodation', 'skills_certification', 'mobile', 'internet', 'education', 'health', 'family')),
    allowance_name VARCHAR(200) NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'fixed' CHECK (calculation_method IN ('fixed', 'daily', 'hourly', 'percentage', 'performance_based')),
    base_amount_aed DECIMAL(10,2) NOT NULL,
    calculation_rate DECIMAL(8,2), -- For daily/hourly calculations
    eligible_days INTEGER, -- Days eligible for daily allowances
    eligible_hours DECIMAL(8,2), -- Hours eligible for hourly allowances
    percentage_base DECIMAL(10,2), -- Base amount for percentage calculations
    calculated_amount_aed DECIMAL(10,2) NOT NULL,
    is_taxable BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    calculation_period_month INTEGER NOT NULL,
    calculation_period_year INTEGER NOT NULL,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    supporting_documents JSONB, -- URLs to supporting documents
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_allowance_amounts CHECK (base_amount_aed >= 0 AND calculated_amount_aed >= 0),
    CONSTRAINT valid_calculation_days CHECK (eligible_days IS NULL OR eligible_days >= 0),
    CONSTRAINT valid_calculation_hours CHECK (eligible_hours IS NULL OR eligible_hours >= 0)
);

-- 6. Deductions Table - Tax, insurance, leave deductions with UAE compliance
CREATE TABLE deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_calculation_id UUID REFERENCES salary_calculations(id) ON DELETE CASCADE,
    deduction_type VARCHAR(50) NOT NULL CHECK (deduction_type IN ('income_tax', 'social_security', 'health_insurance', 'life_insurance', 'pension', 'loan_repayment', 'advance_salary', 'unpaid_leave', 'disciplinary', 'other')),
    deduction_name VARCHAR(200) NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'fixed' CHECK (calculation_method IN ('fixed', 'percentage', 'daily_rate', 'pro_rated')),
    base_amount_aed DECIMAL(10,2), -- Base salary for percentage calculations
    deduction_rate DECIMAL(8,4), -- Percentage rate or daily rate
    calculated_amount_aed DECIMAL(10,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    is_statutory BOOLEAN DEFAULT false, -- Required by UAE law
    deduction_period_start DATE,
    deduction_period_end DATE,
    calculation_period_month INTEGER NOT NULL,
    calculation_period_year INTEGER NOT NULL,
    remaining_amount_aed DECIMAL(10,2), -- For installment deductions
    installment_number INTEGER,
    total_installments INTEGER,
    uae_compliance_verified BOOLEAN DEFAULT true,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    reference_number VARCHAR(100), -- External reference (loan, policy numbers)
    notes TEXT,
    supporting_documents JSONB,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_deduction_amounts CHECK (calculated_amount_aed >= 0),
    CONSTRAINT valid_installment_numbers CHECK (installment_number IS NULL OR (installment_number > 0 AND installment_number <= total_installments)),
    CONSTRAINT valid_deduction_rate CHECK (deduction_rate IS NULL OR deduction_rate >= 0)
);

-- 7. Bonus Records Table - Performance and annual bonus tracking
CREATE TABLE bonus_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_calculation_id UUID REFERENCES salary_calculations(id) ON DELETE CASCADE,
    bonus_type VARCHAR(50) NOT NULL CHECK (bonus_type IN ('performance', 'annual', 'festival', 'customer_satisfaction', 'efficiency', 'quality', 'team_achievement', 'retention', 'referral')),
    bonus_name VARCHAR(200) NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'fixed' CHECK (calculation_method IN ('fixed', 'percentage', 'performance_based', 'target_based')),
    base_amount_aed DECIMAL(10,2), -- Base salary for percentage calculations
    bonus_percentage DECIMAL(5,2), -- Percentage of base salary
    target_value DECIMAL(10,2), -- Target value for achievement bonuses
    actual_value DECIMAL(10,2), -- Actual achieved value
    achievement_percentage DECIMAL(5,2), -- Percentage of target achieved
    calculated_amount_aed DECIMAL(10,2) NOT NULL,
    performance_period_start DATE,
    performance_period_end DATE,
    calculation_period_month INTEGER NOT NULL,
    calculation_period_year INTEGER NOT NULL,
    eligibility_criteria JSONB, -- Criteria for bonus eligibility
    performance_metrics JSONB, -- Performance data supporting the bonus
    is_taxable BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    approval_level INTEGER DEFAULT 1, -- 1=supervisor, 2=manager, 3=hr, 4=executive
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    payout_date DATE,
    is_paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_bonus_amounts CHECK (calculated_amount_aed >= 0),
    CONSTRAINT valid_bonus_percentage CHECK (bonus_percentage IS NULL OR (bonus_percentage >= 0 AND bonus_percentage <= 500)),
    CONSTRAINT valid_achievement_percentage CHECK (achievement_percentage IS NULL OR achievement_percentage >= 0),
    CONSTRAINT valid_approval_level CHECK (approval_level >= 1 AND approval_level <= 4)
);

-- 8. Salary Reports Table - Generated calculation reports and summaries
CREATE TABLE salary_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('individual_payslip', 'department_summary', 'monthly_payroll', 'commission_report', 'overtime_analysis', 'deductions_summary', 'bonus_report', 'compliance_audit')),
    report_period_month INTEGER NOT NULL,
    report_period_year INTEGER NOT NULL,
    employee_ids UUID[], -- Specific employees included
    department_ids UUID[], -- Departments included
    report_data JSONB NOT NULL, -- Generated report data
    summary_statistics JSONB, -- Summary metrics and totals
    total_employees INTEGER,
    total_gross_salary_aed DECIMAL(12,2),
    total_net_salary_aed DECIMAL(12,2),
    total_deductions_aed DECIMAL(12,2),
    total_overtime_aed DECIMAL(12,2),
    total_commissions_aed DECIMAL(12,2),
    total_bonuses_aed DECIMAL(12,2),
    uae_compliance_score DECIMAL(5,2), -- Overall compliance score
    generated_by UUID REFERENCES employees(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_format VARCHAR(20) DEFAULT 'json' CHECK (report_format IN ('json', 'pdf', 'excel', 'csv')),
    file_path TEXT, -- Path to generated file
    is_confidential BOOLEAN DEFAULT true,
    access_level INTEGER DEFAULT 3, -- 1=employee, 2=supervisor, 3=hr, 4=executive
    retention_period_months INTEGER DEFAULT 84, -- 7 years UAE requirement
    is_automated BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20) CHECK (schedule_frequency IN ('weekly', 'monthly', 'quarterly', 'annual')),
    next_generation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_salary_structures_org_active ON salary_structures(organization_id, is_active);
CREATE INDEX idx_salary_structures_job_title ON salary_structures(job_title, experience_level);
CREATE INDEX idx_commission_rates_employee_active ON commission_rates(employee_id, is_active);
CREATE INDEX idx_commission_rates_type_active ON commission_rates(commission_type, is_active);
CREATE INDEX idx_salary_calculations_employee_period ON salary_calculations(employee_id, calculation_period_year, calculation_period_month);
CREATE INDEX idx_salary_calculations_status ON salary_calculations(calculation_status, calculation_date);
CREATE INDEX idx_overtime_calculations_employee_period ON overtime_calculations(employee_id, calculation_period_year, calculation_period_month);
CREATE INDEX idx_allowances_employee_period ON allowances(employee_id, calculation_period_year, calculation_period_month);
CREATE INDEX idx_allowances_type_recurring ON allowances(allowance_type, is_recurring);
CREATE INDEX idx_deductions_employee_period ON deductions(employee_id, calculation_period_year, calculation_period_month);
CREATE INDEX idx_deductions_type_mandatory ON deductions(deduction_type, is_mandatory);
CREATE INDEX idx_bonus_records_employee_period ON bonus_records(employee_id, calculation_period_year, calculation_period_month);
CREATE INDEX idx_bonus_records_type_approved ON bonus_records(bonus_type, approved_at);
CREATE INDEX idx_salary_reports_org_type ON salary_reports(organization_id, report_type);
CREATE INDEX idx_salary_reports_period ON salary_reports(report_period_year, report_period_month);

-- UAE compliance constraints
ALTER TABLE salary_calculations ADD CONSTRAINT uae_minimum_wage 
    CHECK (net_salary_aed >= 1000); -- UAE minimum wage consideration

ALTER TABLE overtime_calculations ADD CONSTRAINT uae_overtime_limits 
    CHECK (overtime_multiplier >= 1.25); -- UAE minimum overtime rate

COMMENT ON TABLE salary_structures IS 'Base salary configurations and templates for different roles';
COMMENT ON TABLE commission_rates IS 'Commission percentages and performance-based compensation rates';
COMMENT ON TABLE salary_calculations IS 'Monthly salary calculation records with UAE compliance';
COMMENT ON TABLE overtime_calculations IS 'UAE-compliant overtime calculations and tracking';
COMMENT ON TABLE allowances IS 'Employee allowances including transportation, meals, and skills bonuses';
COMMENT ON TABLE deductions IS 'Tax, insurance, and statutory deductions with UAE compliance';
COMMENT ON TABLE bonus_records IS 'Performance, annual, and achievement bonus tracking';
COMMENT ON TABLE salary_reports IS 'Generated payroll reports and analytics for management';;