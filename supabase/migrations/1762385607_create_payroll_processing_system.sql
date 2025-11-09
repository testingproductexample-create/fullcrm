-- Migration: create_payroll_processing_system
-- Created at: 1762385607

-- Create Payroll Processing & Employee Financial Report System
-- 8 tables for comprehensive payroll processing with UAE compliance

-- 1. Payroll Runs - Monthly payroll processing records and status
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_name VARCHAR(255) NOT NULL,
    run_period_month INTEGER NOT NULL CHECK (run_period_month >= 1 AND run_period_month <= 12),
    run_period_year INTEGER NOT NULL CHECK (run_period_year >= 2020 AND run_period_year <= 2050),
    run_type VARCHAR(50) DEFAULT 'regular' CHECK (run_type IN ('regular', 'bonus', 'adjustment', 'final', 'advance')),
    
    -- Processing Status
    processing_status VARCHAR(50) DEFAULT 'draft' CHECK (processing_status IN ('draft', 'calculating', 'pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled')),
    total_employees INTEGER DEFAULT 0,
    processed_employees INTEGER DEFAULT 0,
    failed_employees INTEGER DEFAULT 0,
    
    -- Financial Totals (in AED)
    total_gross_amount_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_net_amount_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_deductions_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_taxes_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_bonuses_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_commissions_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_overtime_aed DECIMAL(15, 2) DEFAULT 0.00,
    
    -- UAE Compliance
    uae_compliance_verified BOOLEAN DEFAULT false,
    wps_file_generated BOOLEAN DEFAULT false,
    bank_transfer_ready BOOLEAN DEFAULT false,
    
    -- Processing Metadata
    calculation_started_at TIMESTAMP WITH TIME ZONE,
    calculation_completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES employees(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES employees(id),
    
    -- Configuration
    include_bonuses BOOLEAN DEFAULT true,
    include_commissions BOOLEAN DEFAULT true,
    include_overtime BOOLEAN DEFAULT true,
    auto_approve BOOLEAN DEFAULT false,
    
    notes TEXT,
    processing_logs JSONB DEFAULT '[]'::jsonb,
    error_details JSONB,
    
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Unique constraint for one run per month per organization
    UNIQUE(organization_id, run_period_month, run_period_year, run_type)
);

-- 2. Payroll Items - Individual employee payroll line items
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_calculation_id UUID REFERENCES salary_calculations(id),
    
    -- Employee Information (snapshot)
    employee_number VARCHAR(100),
    employee_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    department_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(255),
    bank_iban VARCHAR(50),
    
    -- Salary Components (in AED)
    base_salary_aed DECIMAL(10, 2) NOT NULL,
    overtime_amount_aed DECIMAL(10, 2) DEFAULT 0.00,
    commission_amount_aed DECIMAL(10, 2) DEFAULT 0.00,
    bonus_amount_aed DECIMAL(10, 2) DEFAULT 0.00,
    allowances_amount_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Gross and Deductions
    gross_salary_aed DECIMAL(10, 2) NOT NULL,
    tax_deduction_aed DECIMAL(10, 2) DEFAULT 0.00,
    insurance_deduction_aed DECIMAL(10, 2) DEFAULT 0.00,
    advance_deduction_aed DECIMAL(10, 2) DEFAULT 0.00,
    leave_deduction_aed DECIMAL(10, 2) DEFAULT 0.00,
    other_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    total_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Net Amount
    net_salary_aed DECIMAL(10, 2) NOT NULL,
    
    -- Processing Status
    item_status VARCHAR(50) DEFAULT 'pending' CHECK (item_status IN ('pending', 'calculated', 'approved', 'paid', 'failed', 'cancelled')),
    processing_order INTEGER DEFAULT 0,
    
    -- Attendance Integration
    total_work_hours DECIMAL(8, 2) DEFAULT 0.00,
    overtime_hours DECIMAL(8, 2) DEFAULT 0.00,
    leave_days_taken INTEGER DEFAULT 0,
    
    -- UAE Compliance Checks
    minimum_wage_compliance BOOLEAN DEFAULT true,
    overtime_limit_compliance BOOLEAN DEFAULT true,
    working_hours_compliance BOOLEAN DEFAULT true,
    
    -- Payment Details
    payment_method VARCHAR(50) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'cheque', 'card')),
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Calculation Details
    calculation_breakdown JSONB DEFAULT '{}'::jsonb,
    error_messages TEXT[],
    notes TEXT,
    
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        base_salary_aed >= 0 AND 
        gross_salary_aed >= 0 AND 
        net_salary_aed >= 0 AND
        total_deductions_aed >= 0
    )
);

-- 3. End of Service - End-of-service calculations and payments
CREATE TABLE end_of_service (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Employment Details
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(100),
    job_title VARCHAR(255),
    hire_date DATE NOT NULL,
    termination_date DATE NOT NULL,
    termination_reason VARCHAR(255),
    termination_type VARCHAR(100) CHECK (termination_type IN ('resignation', 'termination', 'retirement', 'contract_end', 'death', 'other')),
    
    -- Service Period Calculation
    total_service_years DECIMAL(4, 2) NOT NULL,
    total_service_months INTEGER NOT NULL,
    total_service_days INTEGER NOT NULL,
    
    -- Salary Information (in AED)
    last_basic_salary_aed DECIMAL(10, 2) NOT NULL,
    average_salary_last_6_months_aed DECIMAL(10, 2),
    daily_salary_rate_aed DECIMAL(8, 2) NOT NULL,
    
    -- UAE Gratuity Calculation (21 days per year)
    gratuity_years_full INTEGER DEFAULT 0,
    gratuity_months_partial INTEGER DEFAULT 0,
    gratuity_days_calculation INTEGER NOT NULL, -- 21 days × years + pro-rata
    gratuity_amount_aed DECIMAL(10, 2) NOT NULL,
    
    -- Leave Compensation
    unused_annual_leave_days INTEGER DEFAULT 0,
    leave_compensation_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Notice Period Payment
    notice_period_required_days INTEGER DEFAULT 0,
    notice_period_paid_days INTEGER DEFAULT 0,
    notice_period_amount_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Other Payments
    overtime_pending_aed DECIMAL(10, 2) DEFAULT 0.00,
    bonus_pending_aed DECIMAL(10, 2) DEFAULT 0.00,
    commission_pending_aed DECIMAL(10, 2) DEFAULT 0.00,
    allowances_pending_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Deductions
    advance_recovery_aed DECIMAL(10, 2) DEFAULT 0.00,
    loan_recovery_aed DECIMAL(10, 2) DEFAULT 0.00,
    insurance_deduction_aed DECIMAL(10, 2) DEFAULT 0.00,
    equipment_charges_aed DECIMAL(10, 2) DEFAULT 0.00,
    other_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    total_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Final Settlement
    gross_settlement_aed DECIMAL(10, 2) NOT NULL,
    net_settlement_aed DECIMAL(10, 2) NOT NULL,
    
    -- Processing Status
    calculation_status VARCHAR(50) DEFAULT 'draft' CHECK (calculation_status IN ('draft', 'calculated', 'approved', 'paid', 'disputed', 'cancelled')),
    approval_level INTEGER DEFAULT 1,
    
    -- UAE Compliance
    uae_labor_law_compliance BOOLEAN DEFAULT true,
    ministry_notification_required BOOLEAN DEFAULT false,
    ministry_notification_sent BOOLEAN DEFAULT false,
    
    -- Payment Details
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Documentation
    calculation_details JSONB DEFAULT '{}'::jsonb,
    supporting_documents JSONB DEFAULT '[]'::jsonb,
    legal_requirements TEXT,
    notes TEXT,
    
    -- Approval Workflow
    calculated_by UUID REFERENCES employees(id),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_service_period CHECK (termination_date >= hire_date),
    CONSTRAINT positive_settlement CHECK (gross_settlement_aed >= 0 AND net_settlement_aed >= 0)
);

-- 4. Bank Transfers - Bank transfer records and status tracking
CREATE TABLE bank_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
    
    -- Transfer Details
    transfer_batch_id VARCHAR(100) NOT NULL,
    transfer_type VARCHAR(50) DEFAULT 'salary' CHECK (transfer_type IN ('salary', 'bonus', 'commission', 'end_of_service', 'advance', 'reimbursement')),
    transfer_date DATE NOT NULL,
    value_date DATE,
    
    -- Financial Summary (in AED)
    total_amount_aed DECIMAL(15, 2) NOT NULL,
    total_employees INTEGER NOT NULL,
    successful_transfers INTEGER DEFAULT 0,
    failed_transfers INTEGER DEFAULT 0,
    pending_transfers INTEGER DEFAULT 0,
    
    -- Bank Details
    originating_bank VARCHAR(255),
    originating_account VARCHAR(100),
    processing_bank VARCHAR(255),
    
    -- WPS Integration (UAE Wage Protection System)
    wps_file_generated BOOLEAN DEFAULT false,
    wps_file_path TEXT,
    wps_reference_number VARCHAR(100),
    wps_submission_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (wps_submission_status IN ('not_submitted', 'submitted', 'approved', 'rejected', 'processed')),
    wps_submission_date TIMESTAMP WITH TIME ZONE,
    
    -- Processing Status
    transfer_status VARCHAR(50) DEFAULT 'draft' CHECK (transfer_status IN ('draft', 'ready', 'submitted', 'processing', 'completed', 'partially_failed', 'failed', 'cancelled')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Central Bank Integration
    central_bank_reference VARCHAR(100),
    central_bank_status VARCHAR(50),
    central_bank_response JSONB,
    
    -- Error Handling
    failed_employee_ids UUID[],
    error_summary JSONB DEFAULT '{}'::jsonb,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Reconciliation
    bank_confirmation_received BOOLEAN DEFAULT false,
    bank_confirmation_date TIMESTAMP WITH TIME ZONE,
    bank_reference_number VARCHAR(255),
    reconciliation_status VARCHAR(50) DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'matched', 'discrepancy', 'resolved')),
    
    -- Compliance & Audit
    compliance_check_passed BOOLEAN DEFAULT true,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    regulatory_notifications JSONB DEFAULT '[]'::jsonb,
    
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (total_amount_aed > 0 AND total_employees > 0)
);

-- 5. Tax Reports - Tax calculation summaries and compliance reports
CREATE TABLE tax_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Report Details
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('monthly_tax_summary', 'quarterly_filing', 'annual_return', 'wps_compliance', 'labor_audit', 'ministry_report')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- UAE Tax Information
    tax_year INTEGER NOT NULL,
    tax_quarter INTEGER CHECK (tax_quarter IN (1, 2, 3, 4)),
    tax_month INTEGER CHECK (tax_month >= 1 AND tax_month <= 12),
    
    -- Financial Summary (in AED)
    total_gross_payroll_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_basic_salary_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_allowances_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_overtime_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_bonuses_aed DECIMAL(15, 2) DEFAULT 0.00,
    total_commissions_aed DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Tax Calculations
    total_income_tax_aed DECIMAL(12, 2) DEFAULT 0.00,
    total_social_security_aed DECIMAL(12, 2) DEFAULT 0.00,
    total_pension_contributions_aed DECIMAL(12, 2) DEFAULT 0.00,
    total_health_insurance_aed DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Employee Statistics
    total_employees INTEGER DEFAULT 0,
    uae_nationals INTEGER DEFAULT 0,
    expatriate_employees INTEGER DEFAULT 0,
    new_hires INTEGER DEFAULT 0,
    terminations INTEGER DEFAULT 0,
    
    -- UAE Labor Law Compliance
    working_hours_compliance_rate DECIMAL(5, 2) DEFAULT 100.00,
    overtime_compliance_rate DECIMAL(5, 2) DEFAULT 100.00,
    minimum_wage_compliance_rate DECIMAL(5, 2) DEFAULT 100.00,
    leave_compliance_rate DECIMAL(5, 2) DEFAULT 100.00,
    
    -- WPS Compliance
    wps_submission_count INTEGER DEFAULT 0,
    wps_success_rate DECIMAL(5, 2) DEFAULT 100.00,
    wps_penalty_amount_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Report Data
    detailed_calculations JSONB DEFAULT '{}'::jsonb,
    employee_breakdown JSONB DEFAULT '[]'::jsonb,
    compliance_details JSONB DEFAULT '{}'::jsonb,
    regulatory_requirements JSONB DEFAULT '{}'::jsonb,
    
    -- Report Status
    report_status VARCHAR(50) DEFAULT 'draft' CHECK (report_status IN ('draft', 'generated', 'reviewed', 'submitted', 'approved', 'filed')),
    generation_method VARCHAR(50) DEFAULT 'automated' CHECK (generation_method IN ('automated', 'manual', 'imported')),
    
    -- Submission Details
    submitted_to VARCHAR(255),
    submission_reference VARCHAR(100),
    submission_date TIMESTAMP WITH TIME ZONE,
    submission_deadline DATE,
    
    -- File Management
    report_file_path TEXT,
    report_format VARCHAR(20) DEFAULT 'pdf' CHECK (report_format IN ('pdf', 'excel', 'xml', 'csv')),
    file_size_bytes BIGINT,
    
    -- Compliance & Validation
    validation_passed BOOLEAN DEFAULT true,
    validation_errors TEXT[],
    compliance_score DECIMAL(5, 2) DEFAULT 100.00,
    
    generated_by UUID REFERENCES employees(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_period CHECK (report_period_end >= report_period_start)
);

-- Create indexes for performance optimization
CREATE INDEX idx_payroll_runs_organization_period ON payroll_runs(organization_id, run_period_year, run_period_month);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(processing_status);
CREATE INDEX idx_payroll_items_run_employee ON payroll_items(payroll_run_id, employee_id);
CREATE INDEX idx_payroll_items_status ON payroll_items(item_status);
CREATE INDEX idx_end_of_service_employee ON end_of_service(employee_id);
CREATE INDEX idx_end_of_service_termination_date ON end_of_service(termination_date);
CREATE INDEX idx_bank_transfers_batch ON bank_transfers(transfer_batch_id);
CREATE INDEX idx_bank_transfers_status ON bank_transfers(transfer_status);
CREATE INDEX idx_tax_reports_period ON tax_reports(organization_id, tax_year, tax_quarter);
CREATE INDEX idx_tax_reports_type ON tax_reports(report_type, report_status);;