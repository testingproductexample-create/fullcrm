-- Migration: create_payroll_processing_additional_tables
-- Created at: 1762385691

-- Create additional tables for Payroll Processing System
-- Tables 6-8: payroll_approvals, payroll_audits, employee_statements

-- 6. Payroll Approvals - Approval workflow tracking
CREATE TABLE payroll_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Reference to what's being approved
    approval_type VARCHAR(100) NOT NULL CHECK (approval_type IN ('payroll_run', 'payroll_item', 'end_of_service', 'bank_transfer', 'tax_report', 'salary_adjustment')),
    reference_id UUID NOT NULL, -- References the ID of the object being approved
    reference_table VARCHAR(100) NOT NULL,
    
    -- Approval Workflow
    approval_level INTEGER NOT NULL DEFAULT 1,
    approval_step VARCHAR(100) NOT NULL,
    required_approval_count INTEGER DEFAULT 1,
    current_approval_count INTEGER DEFAULT 0,
    
    -- Approval Status
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
    is_final_approval BOOLEAN DEFAULT false,
    
    -- Approval Details
    requested_by UUID NOT NULL REFERENCES employees(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_to UUID[] NOT NULL, -- Array of employee IDs who can approve
    department_approvers UUID[], -- Department-based approvers
    role_approvers TEXT[], -- Role-based approvers
    
    -- Financial Thresholds
    amount_aed DECIMAL(15, 2),
    approval_threshold_aed DECIMAL(15, 2),
    requires_ceo_approval BOOLEAN DEFAULT false,
    requires_hr_approval BOOLEAN DEFAULT false,
    requires_finance_approval BOOLEAN DEFAULT false,
    
    -- Approval Actions
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    approval_notes TEXT,
    
    -- Deadline Management
    approval_deadline TIMESTAMP WITH TIME ZONE,
    escalation_level INTEGER DEFAULT 0,
    escalated_to UUID REFERENCES employees(id),
    escalated_at TIMESTAMP WITH TIME ZONE,
    
    -- Notification Tracking
    notification_sent BOOLEAN DEFAULT false,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    
    -- Approval Metadata
    approval_criteria JSONB DEFAULT '{}'::jsonb,
    approval_documents JSONB DEFAULT '[]'::jsonb,
    system_generated BOOLEAN DEFAULT true,
    
    -- UAE Compliance Requirements
    uae_compliance_check BOOLEAN DEFAULT true,
    ministry_approval_required BOOLEAN DEFAULT false,
    legal_review_required BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_approval_level CHECK (approval_level > 0),
    CONSTRAINT valid_approval_count CHECK (current_approval_count <= required_approval_count)
);

-- 7. Payroll Audits - Audit trail and compliance documentation
CREATE TABLE payroll_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Audit Details
    audit_type VARCHAR(100) NOT NULL CHECK (audit_type IN ('internal', 'external', 'regulatory', 'compliance', 'investigation', 'reconciliation')),
    audit_scope VARCHAR(100) NOT NULL CHECK (audit_scope IN ('payroll_run', 'employee_specific', 'period_review', 'system_wide', 'process_audit', 'compliance_check')),
    audit_title VARCHAR(255) NOT NULL,
    audit_description TEXT,
    
    -- Audit Period
    audit_period_start DATE NOT NULL,
    audit_period_end DATE NOT NULL,
    
    -- Audit Scope Details
    payroll_run_ids UUID[],
    employee_ids UUID[],
    department_ids UUID[],
    process_areas TEXT[],
    
    -- Audit Status
    audit_status VARCHAR(50) DEFAULT 'planned' CHECK (audit_status IN ('planned', 'in_progress', 'completed', 'draft_report', 'final_report', 'closed')),
    priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Auditor Information
    lead_auditor UUID REFERENCES employees(id),
    audit_team UUID[],
    external_auditor_firm VARCHAR(255),
    external_auditor_contact JSONB,
    
    -- Audit Findings
    total_findings INTEGER DEFAULT 0,
    critical_findings INTEGER DEFAULT 0,
    high_findings INTEGER DEFAULT 0,
    medium_findings INTEGER DEFAULT 0,
    low_findings INTEGER DEFAULT 0,
    
    -- Financial Impact
    financial_discrepancies_aed DECIMAL(15, 2) DEFAULT 0.00,
    overpayments_identified_aed DECIMAL(15, 2) DEFAULT 0.00,
    underpayments_identified_aed DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Compliance Assessment
    compliance_score DECIMAL(5, 2) DEFAULT 100.00,
    uae_labor_law_compliance BOOLEAN DEFAULT true,
    wps_compliance BOOLEAN DEFAULT true,
    tax_compliance BOOLEAN DEFAULT true,
    
    -- Audit Evidence
    evidence_collected JSONB DEFAULT '[]'::jsonb,
    documents_reviewed JSONB DEFAULT '[]'::jsonb,
    interviews_conducted JSONB DEFAULT '[]'::jsonb,
    system_tests JSONB DEFAULT '[]'::jsonb,
    
    -- Findings and Recommendations
    audit_findings JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    management_responses JSONB DEFAULT '[]'::jsonb,
    corrective_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_responsible UUID REFERENCES employees(id),
    implementation_deadline DATE,
    
    -- Regulatory Requirements
    regulatory_body VARCHAR(255),
    regulatory_reference VARCHAR(100),
    regulatory_deadline DATE,
    regulatory_submission_required BOOLEAN DEFAULT false,
    
    -- Report Details
    draft_report_date DATE,
    final_report_date DATE,
    report_file_path TEXT,
    executive_summary TEXT,
    
    -- Sign-off
    management_sign_off BOOLEAN DEFAULT false,
    management_sign_off_by UUID REFERENCES employees(id),
    management_sign_off_date TIMESTAMP WITH TIME ZONE,
    external_sign_off BOOLEAN DEFAULT false,
    external_sign_off_date TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_audit_period CHECK (audit_period_end >= audit_period_start),
    CONSTRAINT valid_compliance_score CHECK (compliance_score >= 0 AND compliance_score <= 100)
);

-- 8. Employee Statements - Employee financial report records
CREATE TABLE employee_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Statement Details
    statement_type VARCHAR(100) NOT NULL CHECK (statement_type IN ('monthly_payslip', 'quarterly_summary', 'annual_statement', 'ytd_summary', 'tax_certificate', 'end_of_service')),
    statement_period_start DATE NOT NULL,
    statement_period_end DATE NOT NULL,
    statement_year INTEGER NOT NULL,
    statement_month INTEGER CHECK (statement_month >= 1 AND statement_month <= 12),
    
    -- Employee Information (snapshot)
    employee_number VARCHAR(100),
    employee_name VARCHAR(255) NOT NULL,
    employee_name_arabic VARCHAR(255),
    job_title VARCHAR(255),
    department_name VARCHAR(255),
    emirates_id VARCHAR(50),
    
    -- Financial Summary (in AED)
    basic_salary_aed DECIMAL(10, 2) DEFAULT 0.00,
    overtime_earnings_aed DECIMAL(10, 2) DEFAULT 0.00,
    commission_earnings_aed DECIMAL(10, 2) DEFAULT 0.00,
    bonus_earnings_aed DECIMAL(10, 2) DEFAULT 0.00,
    allowances_total_aed DECIMAL(10, 2) DEFAULT 0.00,
    gross_earnings_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Deductions Breakdown
    income_tax_aed DECIMAL(10, 2) DEFAULT 0.00,
    social_security_aed DECIMAL(10, 2) DEFAULT 0.00,
    health_insurance_aed DECIMAL(10, 2) DEFAULT 0.00,
    advance_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    loan_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    other_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    total_deductions_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Net Payment
    net_pay_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Year-to-Date Totals
    ytd_gross_earnings_aed DECIMAL(12, 2) DEFAULT 0.00,
    ytd_total_deductions_aed DECIMAL(12, 2) DEFAULT 0.00,
    ytd_net_pay_aed DECIMAL(12, 2) DEFAULT 0.00,
    ytd_tax_paid_aed DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Attendance Summary
    days_worked INTEGER DEFAULT 0,
    overtime_hours DECIMAL(6, 2) DEFAULT 0.00,
    leave_days_taken INTEGER DEFAULT 0,
    leave_balance_remaining INTEGER DEFAULT 0,
    
    -- Allowances Breakdown
    transportation_allowance_aed DECIMAL(8, 2) DEFAULT 0.00,
    meal_allowance_aed DECIMAL(8, 2) DEFAULT 0.00,
    accommodation_allowance_aed DECIMAL(8, 2) DEFAULT 0.00,
    skills_allowance_aed DECIMAL(8, 2) DEFAULT 0.00,
    
    -- Bank Transfer Details
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    iban VARCHAR(50),
    transfer_reference VARCHAR(100),
    transfer_date DATE,
    
    -- Statement Generation
    statement_status VARCHAR(50) DEFAULT 'draft' CHECK (statement_status IN ('draft', 'generated', 'approved', 'distributed', 'acknowledged')),
    generation_method VARCHAR(50) DEFAULT 'automated' CHECK (generation_method IN ('automated', 'manual', 'corrected')),
    
    -- File Management
    statement_file_path TEXT,
    statement_format VARCHAR(20) DEFAULT 'pdf' CHECK (statement_format IN ('pdf', 'html', 'excel')),
    file_size_bytes BIGINT,
    is_encrypted BOOLEAN DEFAULT true,
    
    -- Distribution
    distributed_via VARCHAR(50) DEFAULT 'email' CHECK (distributed_via IN ('email', 'portal', 'print', 'sms', 'hand_delivery')),
    distribution_date TIMESTAMP WITH TIME ZONE,
    employee_acknowledged BOOLEAN DEFAULT false,
    acknowledgment_date TIMESTAMP WITH TIME ZONE,
    acknowledgment_ip_address INET,
    
    -- Languages and Localization
    primary_language VARCHAR(10) DEFAULT 'en',
    include_arabic BOOLEAN DEFAULT true,
    currency_format VARCHAR(10) DEFAULT 'AED',
    
    -- Compliance and Legal
    uae_compliant BOOLEAN DEFAULT true,
    includes_legal_notices BOOLEAN DEFAULT true,
    privacy_consent BOOLEAN DEFAULT true,
    data_retention_period_months INTEGER DEFAULT 84, -- 7 years
    
    -- Statement Data
    detailed_calculations JSONB DEFAULT '{}'::jsonb,
    allowances_breakdown JSONB DEFAULT '{}'::jsonb,
    deductions_breakdown JSONB DEFAULT '{}'::jsonb,
    attendance_details JSONB DEFAULT '{}'::jsonb,
    
    -- Corrections and Adjustments
    is_correction BOOLEAN DEFAULT false,
    original_statement_id UUID REFERENCES employee_statements(id),
    correction_reason TEXT,
    correction_approved_by UUID REFERENCES employees(id),
    
    -- Access Control
    access_level VARCHAR(50) DEFAULT 'employee_only' CHECK (access_level IN ('employee_only', 'hr_access', 'finance_access', 'management_access')),
    viewing_restrictions JSONB DEFAULT '{}'::jsonb,
    
    generated_by UUID REFERENCES employees(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_statement_period CHECK (statement_period_end >= statement_period_start),
    CONSTRAINT positive_amounts CHECK (gross_earnings_aed >= 0 AND net_pay_aed >= 0),
    CONSTRAINT valid_year CHECK (statement_year >= 2020 AND statement_year <= 2050)
);

-- Create additional indexes for performance optimization
CREATE INDEX idx_payroll_approvals_reference ON payroll_approvals(reference_id, reference_table);
CREATE INDEX idx_payroll_approvals_status ON payroll_approvals(approval_status, approval_level);
CREATE INDEX idx_payroll_approvals_assigned ON payroll_approvals USING GIN (assigned_to);
CREATE INDEX idx_payroll_audits_period ON payroll_audits(audit_period_start, audit_period_end);
CREATE INDEX idx_payroll_audits_status ON payroll_audits(audit_status, priority_level);
CREATE INDEX idx_employee_statements_employee_period ON employee_statements(employee_id, statement_period_start, statement_period_end);
CREATE INDEX idx_employee_statements_type_status ON employee_statements(statement_type, statement_status);
CREATE INDEX idx_employee_statements_year_month ON employee_statements(statement_year, statement_month);;