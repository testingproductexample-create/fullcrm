-- Migration: create_payslip_generation_system
-- Created at: 1762388446

-- ======================================
-- UAE PAYSLIP GENERATION SYSTEM
-- Creating 6 tables for comprehensive payslip management
-- ======================================

-- 1. PAYSLIPS - Core payslip records with PDF storage
-- Stores generated payslip data with secure PDF storage
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    payroll_run_id UUID NOT NULL,
    
    -- Payslip identification
    payslip_number VARCHAR(50) NOT NULL UNIQUE,
    payslip_reference VARCHAR(100),
    
    -- Period information
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Salary breakdown (stored in AED)
    base_salary_aed DECIMAL(12,2) NOT NULL DEFAULT 0,
    commission_amount_aed DECIMAL(12,2) DEFAULT 0,
    bonus_amount_aed DECIMAL(12,2) DEFAULT 0,
    allowances_aed DECIMAL(12,2) DEFAULT 0,
    overtime_amount_aed DECIMAL(12,2) DEFAULT 0,
    gross_salary_aed DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Deductions
    income_tax_aed DECIMAL(12,2) DEFAULT 0,
    social_security_aed DECIMAL(12,2) DEFAULT 0,
    insurance_aed DECIMAL(12,2) DEFAULT 0,
    advance_deduction_aed DECIMAL(12,2) DEFAULT 0,
    other_deductions_aed DECIMAL(12,2) DEFAULT 0,
    total_deductions_aed DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Final amounts
    net_salary_aed DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- PDF and template information
    template_id UUID,
    pdf_storage_path TEXT,
    pdf_file_size INTEGER,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Digital signature
    digital_signature_id UUID,
    is_digitally_signed BOOLEAN DEFAULT FALSE,
    signature_timestamp TIMESTAMPTZ,
    
    -- UAE compliance
    emirates_id VARCHAR(20),
    visa_number VARCHAR(50),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    
    -- Status and validation
    generation_status VARCHAR(50) DEFAULT 'draft' CHECK (generation_status IN ('draft', 'generated', 'signed', 'distributed', 'archived')),
    validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'error', 'compliance_verified')),
    compliance_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    generated_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_pay_period CHECK (pay_period_end >= pay_period_start),
    CONSTRAINT valid_amounts CHECK (net_salary_aed >= 0 AND gross_salary_aed >= 0),
    CONSTRAINT valid_deductions CHECK (total_deductions_aed >= 0)
);

-- 2. PAYSLIP_TEMPLATES - Customizable template configurations
-- Manages different payslip templates for various employee types
CREATE TABLE IF NOT EXISTS payslip_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Template identification
    template_name VARCHAR(100) NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'standard' CHECK (template_type IN ('standard', 'premium', 'government_compliant', 'executive', 'contractor')),
    
    -- Template configuration
    template_version VARCHAR(20) DEFAULT '1.0',
    template_description TEXT,
    
    -- Design settings
    logo_url TEXT,
    company_header_text TEXT,
    primary_color VARCHAR(10) DEFAULT '#000000',
    secondary_color VARCHAR(10) DEFAULT '#666666',
    font_family VARCHAR(50) DEFAULT 'Arial',
    font_size INTEGER DEFAULT 10,
    
    -- Layout configuration
    layout_style VARCHAR(50) DEFAULT 'professional' CHECK (layout_style IN ('professional', 'modern', 'classic', 'minimal', 'government')),
    include_logo BOOLEAN DEFAULT TRUE,
    include_company_address BOOLEAN DEFAULT TRUE,
    include_employee_photo BOOLEAN DEFAULT FALSE,
    include_qr_code BOOLEAN DEFAULT TRUE,
    include_signature_line BOOLEAN DEFAULT TRUE,
    
    -- Content settings
    show_detailed_breakdown BOOLEAN DEFAULT TRUE,
    show_year_to_date BOOLEAN DEFAULT TRUE,
    show_leave_balance BOOLEAN DEFAULT TRUE,
    show_tax_details BOOLEAN DEFAULT TRUE,
    show_bank_details BOOLEAN DEFAULT TRUE,
    
    -- UAE compliance settings
    uae_ministry_compliant BOOLEAN DEFAULT TRUE,
    include_arabic_translation BOOLEAN DEFAULT FALSE,
    include_emirates_id BOOLEAN DEFAULT TRUE,
    include_visa_details BOOLEAN DEFAULT TRUE,
    include_wps_reference BOOLEAN DEFAULT TRUE,
    
    -- Usage and status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Approval and validation
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
    
    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_template_code_per_org UNIQUE (organization_id, template_code),
    CONSTRAINT valid_colors CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$' AND secondary_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- 3. DIGITAL_SIGNATURES - Signature verification and authentication
-- Manages digital signatures for legal compliance
CREATE TABLE IF NOT EXISTS digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Signature identification
    signature_reference VARCHAR(100) NOT NULL UNIQUE,
    signature_type VARCHAR(50) DEFAULT 'payslip' CHECK (signature_type IN ('payslip', 'contract', 'approval', 'compliance')),
    
    -- Payslip association
    payslip_id UUID,
    employee_id UUID NOT NULL,
    
    -- Signer information
    signer_name VARCHAR(255) NOT NULL,
    signer_title VARCHAR(100),
    signer_employee_id UUID,
    signer_email VARCHAR(255),
    
    -- Signature data
    signature_hash TEXT NOT NULL,
    signature_algorithm VARCHAR(50) DEFAULT 'SHA256',
    certificate_serial VARCHAR(100),
    certificate_issuer TEXT,
    
    -- Verification data
    verification_code VARCHAR(100) NOT NULL,
    verification_url TEXT,
    verification_method VARCHAR(50) DEFAULT 'digital_certificate' CHECK (verification_method IN ('digital_certificate', 'biometric', 'two_factor', 'government_id')),
    
    -- Timestamps and validity
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_valid BOOLEAN DEFAULT TRUE,
    
    -- Compliance and audit
    signature_purpose TEXT NOT NULL,
    legal_framework VARCHAR(100) DEFAULT 'UAE_ELECTRONIC_TRANSACTIONS_LAW',
    compliance_level VARCHAR(50) DEFAULT 'high' CHECK (compliance_level IN ('basic', 'standard', 'high', 'government_grade')),
    audit_trail JSONB,
    
    -- Status
    signature_status VARCHAR(50) DEFAULT 'active' CHECK (signature_status IN ('active', 'expired', 'revoked', 'suspended')),
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    geo_location JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_signature_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- 4. PAYSLIP_DISTRIBUTION - Email/SMS distribution tracking
-- Tracks digital distribution of payslips to employees
CREATE TABLE IF NOT EXISTS payslip_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Distribution identification
    distribution_reference VARCHAR(100) NOT NULL UNIQUE,
    distribution_batch_id UUID,
    
    -- Payslip and employee association
    payslip_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    
    -- Distribution method
    distribution_method VARCHAR(50) NOT NULL CHECK (distribution_method IN ('email', 'sms', 'whatsapp', 'portal_notification', 'physical_delivery')),
    
    -- Recipient information
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_whatsapp VARCHAR(20),
    recipient_name VARCHAR(255) NOT NULL,
    
    -- Distribution content
    subject_line TEXT,
    message_content TEXT,
    attachment_size INTEGER,
    attachment_type VARCHAR(50),
    
    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    
    -- Status tracking
    distribution_status VARCHAR(50) DEFAULT 'pending' CHECK (distribution_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'downloaded')),
    delivery_attempts INTEGER DEFAULT 0,
    max_delivery_attempts INTEGER DEFAULT 3,
    
    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    last_error_at TIMESTAMPTZ,
    
    -- Provider information
    service_provider VARCHAR(100),
    provider_message_id VARCHAR(255),
    provider_status VARCHAR(100),
    provider_response JSONB,
    
    -- Security and compliance
    is_secure_delivery BOOLEAN DEFAULT TRUE,
    encryption_method VARCHAR(50),
    access_code VARCHAR(20),
    expires_at TIMESTAMPTZ,
    
    -- Employee interaction
    employee_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    access_ip_addresses JSONB,
    last_access_device TEXT,
    
    -- Retry and scheduling
    next_retry_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- Metadata
    initiated_by UUID NOT NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_delivery_attempts CHECK (delivery_attempts >= 0 AND delivery_attempts <= max_delivery_attempts)
);

-- 5. EMPLOYEE_ACCESS_LOG - Employee portal access audit trail
-- Tracks employee access to payslip portal for security and compliance
CREATE TABLE IF NOT EXISTS employee_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Employee and session information
    employee_id UUID NOT NULL,
    session_id VARCHAR(255),
    
    -- Access details
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('login', 'logout', 'payslip_view', 'payslip_download', 'password_change', 'profile_update')),
    accessed_resource VARCHAR(255),
    payslip_id UUID,
    
    -- Authentication information
    authentication_method VARCHAR(50) DEFAULT 'password' CHECK (authentication_method IN ('password', 'two_factor', 'biometric', 'sso', 'oauth')),
    login_successful BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Device and location information
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(50),
    operating_system VARCHAR(100),
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    
    -- Geographic information
    country_code VARCHAR(3),
    city VARCHAR(100),
    geo_location JSONB,
    timezone VARCHAR(50),
    
    -- Security analysis
    is_suspicious_activity BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    security_flags JSONB,
    vpn_detected BOOLEAN DEFAULT FALSE,
    proxy_detected BOOLEAN DEFAULT FALSE,
    
    -- Session duration and activity
    session_duration INTEGER, -- in seconds
    pages_visited INTEGER DEFAULT 1,
    actions_performed INTEGER DEFAULT 1,
    session_end_reason VARCHAR(50) CHECK (session_end_reason IN ('logout', 'timeout', 'forced_logout', 'system_maintenance')),
    
    -- Compliance and audit
    compliance_purpose VARCHAR(100) DEFAULT 'payslip_access_audit',
    data_accessed JSONB,
    data_downloaded JSONB,
    retention_period_days INTEGER DEFAULT 2555, -- 7 years for UAE compliance
    
    -- Timestamps
    access_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_start_time TIMESTAMPTZ,
    session_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_session_duration CHECK (session_duration IS NULL OR session_duration >= 0),
    CONSTRAINT valid_session_times CHECK (session_end_time IS NULL OR session_end_time >= session_start_time)
);

-- 6. PAYSLIP_ARCHIVES - Historical archive management
-- Manages long-term storage and archival of payslips for compliance
CREATE TABLE IF NOT EXISTS payslip_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Archive identification
    archive_reference VARCHAR(100) NOT NULL UNIQUE,
    archive_batch_id UUID,
    
    -- Original payslip information
    original_payslip_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    
    -- Archive timing
    pay_period_year INTEGER NOT NULL,
    pay_period_month INTEGER NOT NULL CHECK (pay_period_month >= 1 AND pay_period_month <= 12),
    archived_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Storage information
    storage_location TEXT NOT NULL,
    storage_type VARCHAR(50) DEFAULT 'cloud' CHECK (storage_type IN ('cloud', 'local', 'hybrid', 'external')),
    storage_provider VARCHAR(100),
    storage_region VARCHAR(50),
    
    -- File information
    archived_file_path TEXT NOT NULL,
    archived_file_size INTEGER NOT NULL,
    file_format VARCHAR(20) DEFAULT 'PDF',
    compression_method VARCHAR(50),
    encrypted BOOLEAN DEFAULT TRUE,
    encryption_method VARCHAR(50) DEFAULT 'AES-256',
    
    -- Checksums and integrity
    file_checksum TEXT NOT NULL,
    checksum_algorithm VARCHAR(20) DEFAULT 'SHA256',
    integrity_verified BOOLEAN DEFAULT FALSE,
    last_integrity_check TIMESTAMPTZ,
    
    -- Legal and compliance
    retention_period_years INTEGER NOT NULL DEFAULT 7, -- UAE law requirement
    legal_hold BOOLEAN DEFAULT FALSE,
    legal_hold_reason TEXT,
    legal_hold_until DATE,
    disposal_eligible_date DATE NOT NULL,
    disposal_status VARCHAR(50) DEFAULT 'retained' CHECK (disposal_status IN ('retained', 'scheduled_disposal', 'disposed', 'permanent_retention')),
    
    -- Access control
    access_level VARCHAR(50) DEFAULT 'restricted' CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
    authorized_roles JSONB,
    access_log_required BOOLEAN DEFAULT TRUE,
    
    -- Migration and recovery
    migration_status VARCHAR(50) DEFAULT 'archived' CHECK (migration_status IN ('archived', 'migrating', 'restored', 'corrupted')),
    backup_locations JSONB,
    recovery_point_objective INTEGER DEFAULT 24, -- hours
    last_backup_timestamp TIMESTAMPTZ,
    
    -- Metadata and search
    search_metadata JSONB,
    tags JSONB,
    employee_name VARCHAR(255) NOT NULL,
    employee_emirates_id VARCHAR(20),
    department_name VARCHAR(100),
    
    -- Audit trail
    archived_by UUID NOT NULL,
    archive_reason VARCHAR(255) DEFAULT 'regular_archival',
    archive_method VARCHAR(50) DEFAULT 'automated',
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_pay_period CHECK (pay_period_year >= 2020 AND pay_period_year <= 2050),
    CONSTRAINT valid_retention_period CHECK (retention_period_years > 0),
    CONSTRAINT valid_disposal_date CHECK (disposal_eligible_date > archived_date)
);

-- ======================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ======================================

-- Payslips indexes
CREATE INDEX IF NOT EXISTS idx_payslips_organization_id ON payslips(organization_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payroll_run_id ON payslips(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payslip_number ON payslips(payslip_number);
CREATE INDEX IF NOT EXISTS idx_payslips_pay_period ON payslips(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payslips_issue_date ON payslips(issue_date);
CREATE INDEX IF NOT EXISTS idx_payslips_generation_status ON payslips(generation_status);
CREATE INDEX IF NOT EXISTS idx_payslips_digital_signature ON payslips(digital_signature_id, is_digitally_signed);

-- Payslip templates indexes
CREATE INDEX IF NOT EXISTS idx_payslip_templates_organization_id ON payslip_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_payslip_templates_template_code ON payslip_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_payslip_templates_is_active ON payslip_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_payslip_templates_is_default ON payslip_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_payslip_templates_type ON payslip_templates(template_type);

-- Digital signatures indexes
CREATE INDEX IF NOT EXISTS idx_digital_signatures_organization_id ON digital_signatures(organization_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_payslip_id ON digital_signatures(payslip_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_employee_id ON digital_signatures(employee_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_reference ON digital_signatures(signature_reference);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_status ON digital_signatures(signature_status);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_signed_at ON digital_signatures(signed_at);

-- Payslip distribution indexes
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_organization_id ON payslip_distribution(organization_id);
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_payslip_id ON payslip_distribution(payslip_id);
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_employee_id ON payslip_distribution(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_status ON payslip_distribution(distribution_status);
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_method ON payslip_distribution(distribution_method);
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_sent_at ON payslip_distribution(sent_at);
CREATE INDEX IF NOT EXISTS idx_payslip_distribution_batch_id ON payslip_distribution(distribution_batch_id);

-- Employee access log indexes
CREATE INDEX IF NOT EXISTS idx_employee_access_log_organization_id ON employee_access_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_access_log_employee_id ON employee_access_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_access_log_access_timestamp ON employee_access_log(access_timestamp);
CREATE INDEX IF NOT EXISTS idx_employee_access_log_access_type ON employee_access_log(access_type);
CREATE INDEX IF NOT EXISTS idx_employee_access_log_ip_address ON employee_access_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_employee_access_log_payslip_id ON employee_access_log(payslip_id);
CREATE INDEX IF NOT EXISTS idx_employee_access_log_session_id ON employee_access_log(session_id);

-- Payslip archives indexes
CREATE INDEX IF NOT EXISTS idx_payslip_archives_organization_id ON payslip_archives(organization_id);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_employee_id ON payslip_archives(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_original_payslip_id ON payslip_archives(original_payslip_id);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_pay_period ON payslip_archives(pay_period_year, pay_period_month);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_archived_date ON payslip_archives(archived_date);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_disposal_eligible ON payslip_archives(disposal_eligible_date);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_employee_name ON payslip_archives(employee_name);
CREATE INDEX IF NOT EXISTS idx_payslip_archives_emirates_id ON payslip_archives(employee_emirates_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payslips_employee_period ON payslips(employee_id, pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payslips_org_status ON payslips(organization_id, generation_status);
CREATE INDEX IF NOT EXISTS idx_distribution_employee_status ON payslip_distribution(employee_id, distribution_status);
CREATE INDEX IF NOT EXISTS idx_archives_employee_year ON payslip_archives(employee_id, pay_period_year);

-- ======================================
-- CONSTRAINTS AND VALIDATIONS
-- ======================================

-- Update timestamp triggers will be added via RLS policies migration
-- Foreign key relationships will be managed manually in application code;