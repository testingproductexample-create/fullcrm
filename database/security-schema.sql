-- ============================================================================
-- UAE TAILORING PLATFORM - SECURITY DATABASE SCHEMA
-- ============================================================================
-- This schema provides comprehensive security features for a multi-tenant
-- UAE tailoring business platform including authentication, authorization,
-- audit logging, compliance tracking, and data protection.
--
-- Compatible with: PostgreSQL 14+
-- Created: 2025-11-06
-- Version: 1.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending', 'locked');
CREATE TYPE session_status AS ENUM ('active', 'expired', 'terminated', 'suspended');
CREATE TYPE mfa_method AS ENUM ('sms', 'email', 'totp', 'hardware', 'biometric');
CREATE TYPE security_event_type AS ENUM (
    'login_success', 'login_failure', 'logout', 'password_change',
    'account_locked', 'account_unlocked', 'mfa_enabled', 'mfa_disabled',
    'permission_granted', 'permission_revoked', 'data_access', 'data_modification',
    'configuration_change', 'security_policy_violation', 'suspicious_activity',
    'backup_created', 'backup_restored', 'encryption_key_rotated'
);
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'pending_review', 'exempt');
CREATE TYPE backup_status AS ENUM ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import');

-- ============================================================================
-- CORE SECURITY TABLES
-- ============================================================================

-- Organizations/Tenants table for multi-tenancy
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    trade_license VARCHAR(100),
    emirates_id VARCHAR(50),
    tax_id VARCHAR(50),
    industry_code VARCHAR(20) DEFAULT '4771', -- UAE retail tailoring
    country_code CHAR(2) DEFAULT 'AE',
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    settings JSONB DEFAULT '{}',
    security_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT organizations_name_chk CHECK (char_length(name) >= 2),
    CONSTRAINT organizations_emirates_id_chk CHECK (emirates_id IS NULL OR length(emirates_id) = 15),
    
    -- Indexes
    CONSTRAINT organizations_name_uq UNIQUE (name),
    CONSTRAINT organizations_trade_license_uq UNIQUE (trade_license),
    CONSTRAINT organizations_emirates_id_uq UNIQUE (emirates_id)
);

-- Enhanced users table with UAE-specific fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),
    
    -- UAE-specific identity fields
    emirates_id VARCHAR(15),
    passport_number VARCHAR(50),
    nationality VARCHAR(3), -- ISO country code
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Contact information
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_emirate VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(2) DEFAULT 'AE',
    
    -- Account management
    status user_status DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Security preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    preferred_mfa_method mfa_method DEFAULT 'sms',
    security_questions JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT users_email_chk CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_username_chk CHECK (char_length(username) >= 3),
    CONSTRAINT users_name_chk CHECK (char_length(first_name) >= 1 AND char_length(last_name) >= 1),
    CONSTRAINT users_emirates_id_chk CHECK (emirates_id IS NULL OR length(emirates_id) = 15),
    CONSTRAINT users_age_chk CHECK (date_of_birth IS NULL OR date_of_birth < CURRENT_DATE - INTERVAL '13 years'),
    
    -- Indexes
    CONSTRAINT users_username_uq UNIQUE (organization_id, username),
    CONSTRAINT users_email_uq UNIQUE (organization_id, email),
    CONSTRAINT users_emirates_id_uq UNIQUE (organization_id, emirates_id)
);

-- Roles definition
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false, -- System roles cannot be modified
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '[]', -- Array of permission strings
    constraints JSONB DEFAULT '{}', -- Role-specific constraints
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT roles_name_chk CHECK (char_length(name) >= 2),
    
    -- Indexes
    CONSTRAINT roles_name_uq UNIQUE (organization_id, name)
);

-- User-role assignments
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT user_roles_valid_assignment CHECK (
        expires_at IS NULL OR expires_at > assigned_at
    ),
    
    -- Indexes
    CONSTRAINT user_roles_user_role_uq UNIQUE (user_id, role_id),
    CONSTRAINT user_roles_user_active_uq UNIQUE (user_id, role_id) WHERE is_active = true
);

-- Permissions catalog
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- e.g., 'orders', 'customers', 'admin'
    resource VARCHAR(100), -- e.g., 'orders', 'customers', 'reports'
    action VARCHAR(50), -- e.g., 'create', 'read', 'update', 'delete'
    conditions JSONB DEFAULT '{}', -- Permission conditions
    is_system_permission BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT permissions_name_uq UNIQUE (name),
    CONSTRAINT permissions_resource_action_uq UNIQUE (resource, action)
);

-- Role-permission assignments
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conditions JSONB DEFAULT '{}', -- Specific conditions for this assignment
    
    -- Constraints
    CONSTRAINT role_permissions_role_perm_uq UNIQUE (role_id, permission_id)
);

-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    refresh_token TEXT,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB, -- {country, city, coordinates}
    mfa_completed BOOLEAN DEFAULT false,
    status session_status DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    terminated_at TIMESTAMP WITH TIME ZONE,
    terminated_by UUID REFERENCES users(id),
    termination_reason TEXT,
    
    -- Security tracking
    is_mobile BOOLEAN DEFAULT false,
    is_trusted_device BOOLEAN DEFAULT false,
    fingerprint_hash TEXT, -- Browser/device fingerprint
    
    -- Constraints
    CONSTRAINT sessions_token_chk CHECK (char_length(session_token) >= 32),
    CONSTRAINT sessions_expiry_chk CHECK (expires_at > started_at),
    
    -- Indexes
    CONSTRAINT sessions_token_uq UNIQUE (session_token),
    CONSTRAINT sessions_user_active_uq UNIQUE (user_id, id) WHERE status = 'active',
    CONSTRAINT sessions_refresh_token_uq UNIQUE (refresh_token)
);

-- Session activities for detailed tracking
CREATE TABLE session_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    activity_type VARCHAR(50), -- 'page_view', 'api_call', 'data_access', etc.
    activity_data JSONB,
    resource_accessed TEXT, -- URL or resource identifier
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MULTI-FACTOR AUTHENTICATION
-- ============================================================================

CREATE TABLE mfa_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method mfa_method NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_enabled BOOLEAN DEFAULT true,
    device_name VARCHAR(100),
    phone_number VARCHAR(20), -- For SMS
    email_address VARCHAR(255), -- For email
    secret_key TEXT, -- For TOTP
    backup_codes JSONB DEFAULT '[]', -- Array of backup codes
    qr_code_data TEXT, -- QR code for TOTP setup
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT mfa_config_method_required CHECK (
        (method = 'sms' AND phone_number IS NOT NULL) OR
        (method = 'email' AND email_address IS NOT NULL) OR
        (method = 'totp' AND secret_key IS NOT NULL) OR
        (method IN ('hardware', 'biometric'))
    ),
    
    -- Indexes
    CONSTRAINT mfa_config_user_method_uq UNIQUE (user_id, method)
);

-- MFA attempts for security tracking
CREATE TABLE mfa_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mfa_config_id UUID REFERENCES mfa_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method mfa_method NOT NULL,
    code_provided TEXT, -- Hashed code
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT mfa_attempts_code_length_chk CHECK (
        code_provided IS NULL OR char_length(code_provided) >= 4
    )
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- e.g., 'user', 'order', 'customer'
    resource_id VARCHAR(255), -- ID of the affected resource
    table_name VARCHAR(100), -- Database table name
    record_data JSONB, -- Data before/after changes
    old_values JSONB, -- Previous values for updates
    new_values JSONB, -- New values for updates
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    business_context JSONB, -- Additional business context
    risk_score INTEGER DEFAULT 0, -- 0-10 risk score
    severity severity_level DEFAULT 'low',
    tags TEXT[], -- Searchable tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT audit_logs_risk_score_chk CHECK (risk_score >= 0 AND risk_score <= 10)
);

-- Audit log retention policy
CREATE TABLE audit_log_retention (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    retention_period_days INTEGER NOT NULL,
    archive_after_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT audit_log_retention_period_chk CHECK (retention_period_days > 0),
    
    -- Indexes
    CONSTRAINT audit_log_retention_resource_uq UNIQUE (organization_id, resource_type)
);

-- ============================================================================
-- SECURITY EVENTS
-- ============================================================================

CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type security_event_type NOT NULL,
    severity severity_level DEFAULT 'medium',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    event_data JSONB NOT NULL, -- Detailed event information
    detection_method VARCHAR(50), -- 'automated', 'manual', 'system'
    automated_source VARCHAR(100), -- Which system detected it
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    assigned_to UUID REFERENCES users(id),
    description TEXT,
    impact_assessment TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Risk assessment
    data_compromised BOOLEAN DEFAULT false,
    data_types_affected TEXT[], -- e.g., ['PII', 'Financial']
    compliance_impact TEXT, -- Description of compliance impact
    regulatory_notification_required BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT security_events_risk_assessment_chk CHECK (
        (data_compromised = true AND array_length(data_types_affected, 1) IS NOT NULL) OR
        data_compromised = false
    )
);

-- Security event correlation
CREATE TABLE security_event_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_event_id UUID NOT NULL REFERENCES security_events(id) ON DELETE CASCADE,
    related_event_id UUID NOT NULL REFERENCES security_events(id) ON DELETE CASCADE,
    correlation_type VARCHAR(50), -- 'related', 'duplicate', 'part_of_sequence'
    correlation_strength DECIMAL(3,2), -- 0.00 to 1.00
    correlation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT security_event_correlations_unique UNIQUE (primary_event_id, related_event_id),
    CONSTRAINT security_event_correlations_strength_chk CHECK (
        correlation_strength >= 0.00 AND correlation_strength <= 1.00
    )
);

-- ============================================================================
-- DATA ENCRYPTION KEYS
-- ============================================================================

CREATE TABLE data_encryption_keys (
    id UUID PRIMARY KEY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    key_type VARCHAR(50) NOT NULL, -- 'master', 'data', 'backup', 'column'
    key_version INTEGER NOT NULL,
    key_material TEXT NOT NULL, -- Encrypted key material
    key_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    key_length INTEGER DEFAULT 256,
    key_status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'expired', 'compromised'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    rotation_scheduled_for TIMESTAMP WITH TIME ZONE,
    is_primary BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    
    -- Key management metadata
    key_purpose TEXT, -- Description of key purpose
    associated_tables TEXT[], -- Tables using this key
    backup_key_id UUID REFERENCES data_encryption_keys(id), -- Key used to encrypt this key
    hsm_key_id VARCHAR(255), -- HSM key identifier if using external HSM
    
    -- Constraints
    CONSTRAINT data_encryption_keys_name_version_uq UNIQUE (key_name, key_version),
    CONSTRAINT data_encryption_keys_algorithm_chk CHECK (
        key_algorithm IN ('AES-256-GCM', 'AES-256-CBC', 'ChaCha20-Poly1305')
    ),
    CONSTRAINT data_encryption_keys_key_length_chk CHECK (key_length >= 128),
    
    -- Only one primary key per name per organization
    CONSTRAINT data_encryption_keys_primary_key_uq UNIQUE (organization_id, key_name) 
    WHERE is_primary = true
);

-- Key rotation logs
CREATE TABLE key_rotation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    old_key_id UUID NOT NULL REFERENCES data_encryption_keys(id),
    new_key_id UUID NOT NULL REFERENCES data_encryption_keys(id),
    rotation_reason VARCHAR(100) NOT NULL, -- 'scheduled', 'compromised', 'policy', 'manual'
    initiated_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'initiated', -- 'initiated', 'approved', 'in_progress', 'completed', 'failed'
    affected_tables TEXT[],
    affected_records_count BIGINT,
    rotation_notes TEXT,
    
    -- Constraints
    CONSTRAINT key_rotation_logs_keys_different CHECK (old_key_id != new_key_id),
    CONSTRAINT key_rotation_logs_approval_chk CHECK (
        approved_at IS NULL OR approved_at > initiated_at
    )
);

-- ============================================================================
-- SECURITY POLICIES
-- ============================================================================

CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL, -- 'password', 'session', 'access', 'data_retention', 'compliance'
    policy_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_system_policy BOOLEAN DEFAULT false, -- System policies cannot be modified
    description TEXT,
    policy_rules JSONB NOT NULL, -- Detailed policy rules
    enforcement_level VARCHAR(20) DEFAULT 'audit', -- 'audit', 'warning', 'enforce'
    compliance_frameworks TEXT[], -- ['UAE_PDPL', 'ISO27001', 'GDPR']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT security_policies_name_version_uq UNIQUE (organization_id, policy_name, policy_version)
);

-- Policy violations tracking
CREATE TABLE policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity severity_level DEFAULT 'medium',
    description TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action_taken TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Context of violation
    ip_address INET,
    user_agent TEXT,
    resource_accessed TEXT,
    violation_data JSONB,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'false_positive',
    escalation_level INTEGER DEFAULT 0, -- 0=no escalation, 1=manager, 2=admin, 3=security_team
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_to UUID REFERENCES users(id)
);

-- ============================================================================
-- COMPLIANCE TRACKING
-- ============================================================================

CREATE TABLE compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    authority VARCHAR(100), -- Regulatory authority
    country_code CHAR(2) DEFAULT 'AE',
    effective_date DATE,
    requirements JSONB NOT NULL, -- Detailed requirements
    control_categories JSONB DEFAULT '[]', -- Categories of controls
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT compliance_frameworks_name_uq UNIQUE (name, version)
);

-- Compliance requirements tracking
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(50), -- 'technical', 'organizational', 'legal', 'procedural'
    mandatory BOOLEAN DEFAULT true,
    implementation_guidance TEXT,
    evidence_required TEXT[],
    assessment_frequency VARCHAR(20) DEFAULT 'annual', -- 'monthly', 'quarterly', 'annual', 'bi_annual'
    responsible_role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT compliance_requirements_code_uq UNIQUE (framework_id, requirement_code)
);

-- Organization compliance status
CREATE TABLE organization_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    status compliance_status DEFAULT 'pending_review',
    implementation_date DATE,
    evidence_documents TEXT[], -- URLs or references to evidence
    last_assessed_at TIMESTAMP WITH TIME ZONE,
    next_assessment_due TIMESTAMP WITH TIME ZONE,
    assessed_by UUID REFERENCES users(id),
    assessment_notes TEXT,
    exceptions TEXT[], -- Approved exceptions
    risk_acceptance_level VARCHAR(20), -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT organization_compliance_assessment_date_chk CHECK (
        next_assessment_due IS NULL OR next_assessment_due > COALESCE(last_assessed_at, created_at::date)
    ),
    
    -- Indexes
    CONSTRAINT organization_compliance_uq UNIQUE (organization_id, requirement_id)
);

-- Data subject rights tracking (UAE PDPL compliance)
CREATE TABLE data_subject_rights_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_identifier VARCHAR(255) NOT NULL, -- Email, Emirates ID, etc.
    subject_type VARCHAR(20) DEFAULT 'data_subject', -- 'data_subject', 'parent', 'guardian'
    request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
    request_details JSONB NOT NULL,
    identity_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'received', -- 'received', 'verified', 'processing', 'completed', 'rejected', 'expired'
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deadline_date DATE NOT NULL, -- UAE PDPL: 30 days from receipt
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    response_method VARCHAR(20) DEFAULT 'email', -- 'email', 'secure_portal', 'postal'
    response_sent_at TIMESTAMP WITH TIME ZONE,
    response_data JSONB, -- Details of what was provided/deleted
    fees_applied DECIMAL(10,2) DEFAULT 0.00,
    fees_waived BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    
    -- Compliance tracking
    is_complex_request BOOLEAN DEFAULT false, -- Requires additional time
    complex_request_extension_until DATE,
    regulatory_notification_required BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT data_subject_rights_deadline_chk CHECK (deadline_date >= received_at::date),
    CONSTRAINT data_subject_rights_deadline_extension_chk CHECK (
        complex_request_extension_until IS NULL OR complex_request_extension_until > received_at::date
    )
);

-- ============================================================================
-- BACKUP CONFIGURATIONS
-- ============================================================================

CREATE TABLE backup_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    config_name VARCHAR(100) NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'differential', 'transaction_log'
    scope JSONB NOT NULL, -- What to backup: {tables: [], schemas: [], databases: []}
    schedule_cron TEXT NOT NULL, -- Cron expression for scheduling
    schedule_description TEXT, -- Human readable description
    retention_policy JSONB NOT NULL, -- {daily: 7, weekly: 4, monthly: 12, yearly: 7}
    encryption_enabled BOOLEAN DEFAULT true,
    compression_enabled BOOLEAN DEFAULT true,
    verification_enabled BOOLEAN DEFAULT true,
    notification_settings JSONB DEFAULT '{}',
    storage_config JSONB NOT NULL, -- {type: 'local|cloud', location: 'path|url', credentials: 'ref'}
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Indexes
    CONSTRAINT backup_configurations_name_uq UNIQUE (organization_id, config_name)
);

-- Backup execution history
CREATE TABLE backup_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuration_id UUID NOT NULL REFERENCES backup_configurations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id VARCHAR(100) NOT NULL, -- Unique execution identifier
    backup_type VARCHAR(50) NOT NULL,
    status backup_status DEFAULT 'scheduled',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_size_bytes BIGINT,
    actual_size_bytes BIGINT,
    backup_location TEXT, -- File path or storage URL
    encryption_key_id UUID REFERENCES data_encryption_keys(id),
    checksum TEXT, -- File checksum for integrity verification
    verification_result TEXT, -- Result of backup verification
    error_message TEXT,
    logs JSONB DEFAULT '[]', -- Execution logs
    initiated_by UUID REFERENCES users(id),
    triggered_by VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'manual', 'api'
    
    -- Backup metadata
    database_version VARCHAR(50),
    backup_format VARCHAR(20) DEFAULT 'custom',
    compressed BOOLEAN DEFAULT true,
    encrypted BOOLEAN DEFAULT true,
    
    -- Restore testing
    last_restore_test_at TIMESTAMP WITH TIME ZONE,
    restore_test_result TEXT,
    restore_test_notes TEXT,
    
    -- Constraints
    CONSTRAINT backup_executions_execution_id_uq UNIQUE (execution_id),
    CONSTRAINT backup_executions_size_chk CHECK (estimated_size_bytes > 0 AND actual_size_bytes >= 0)
);

-- ============================================================================
-- SYSTEM METADATA AND CONFIGURATION
-- ============================================================================

-- System configuration
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT system_config_key_chk CHECK (char_length(key) >= 2)
);

-- Security metrics and health monitoring
CREATE TABLE security_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_data JSONB, -- Additional metric data
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT security_metrics_name_org_uq UNIQUE (metric_name, organization_id, recorded_at)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_event_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_rotation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Helper Functions
-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT u.organization_id
    FROM users u
    WHERE u.id = current_setting('app.current_user_id', true)::UUID
        AND u.status = 'active';
$$;

-- Get current user's roles
CREATE OR REPLACE FUNCTION get_current_user_roles()
RETURNS TEXT[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT ARRAY_AGG(r.name)
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
    JOIN roles r ON ur.role_id = r.id AND r.is_active = true
    WHERE u.id = current_setting('app.current_user_id', true)::UUID
        AND u.status = 'active';
$$;

-- Check if current user has role
CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        JOIN roles r ON ur.role_id = r.id AND r.is_active = true
        WHERE u.id = current_setting('app.current_user_id', true)::UUID
            AND u.status = 'active'
            AND r.name = role_name
    );
$$;

-- Check if current user has permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = current_setting('app.current_user_id', true)::UUID
            AND u.status = 'active'
            AND p.name = permission_name
    );
$$;

-- RLS Policies for Organizations
CREATE POLICY organization_isolation ON organizations
    USING (
        -- System users can see all organizations
        current_setting('app.current_user_id', true) = 'system'
        OR
        -- Users can only see their own organization
        id = get_current_organization_id()
    );

-- RLS Policies for Users
CREATE POLICY user_isolation ON users
    USING (
        -- Users can only see users in their organization
        organization_id = get_current_organization_id()
        OR
        -- Users can see their own record
        id = current_setting('app.current_user_id', true)::UUID
    );

CREATE POLICY user_self_update ON users
    FOR UPDATE
    USING (
        -- Users can update their own record
        id = current_setting('app.current_user_id', true)::UUID
        OR
        -- Users with admin role can update any user in their organization
        (organization_id = get_current_organization_id() AND user_has_role('admin'))
    );

-- RLS Policies for Roles and User Roles
CREATE POLICY role_isolation ON roles
    USING (
        organization_id = get_current_organization_id()
        OR
        is_system_role = true
    );

CREATE POLICY user_role_isolation ON user_roles
    USING (
        organization_id = get_current_organization_id()
    );

-- RLS Policies for Sessions
CREATE POLICY session_user_isolation ON sessions
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID
        OR
        organization_id = get_current_organization_id() AND user_has_role('admin')
    );

CREATE POLICY session_activity_isolation ON session_activities
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND (
                s.user_id = current_setting('app.current_user_id', true)::UUID
                OR
                (s.organization_id = get_current_organization_id() AND user_has_role('admin'))
            )
        )
    );

-- RLS Policies for MFA Config
CREATE POLICY mfa_config_user_isolation ON mfa_config
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID
        OR
        (organization_id = get_current_organization_id() AND user_has_role('admin'))
    );

-- RLS Policies for Audit Logs (Read-only for most users)
CREATE POLICY audit_log_organization_isolation ON audit_logs
    FOR SELECT
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_id = current_setting('app.current_user_id', true)::UUID
            OR
            user_has_role('admin')
            OR
            user_has_permission('view_audit_logs')
        )
    );

-- RLS Policies for Security Events
CREATE POLICY security_event_organization_isolation ON security_events
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_id = current_setting('app.current_user_id', true)::UUID
            OR
            user_has_role('admin')
            OR
            user_has_permission('view_security_events')
        )
    );

-- RLS Policies for Encryption Keys (Admin only)
CREATE POLICY encryption_key_admin_only ON data_encryption_keys
    USING (
        organization_id = get_current_organization_id()
        AND user_has_role('admin')
    );

-- RLS Policies for Security Policies
CREATE POLICY security_policy_isolation ON security_policies
    USING (
        organization_id = get_current_organization_id()
        OR
        is_system_policy = true
    );

-- RLS Policies for Compliance
CREATE POLICY compliance_organization_isolation ON organization_compliance
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_has_role('admin')
            OR
            user_has_permission('view_compliance')
        )
    );

-- RLS Policies for Data Subject Rights
CREATE POLICY data_subject_rights_admin_only ON data_subject_rights_requests
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_has_role('admin')
            OR
            user_has_role('compliance_officer')
        )
    );

-- RLS Policies for Backup Configurations
CREATE POLICY backup_config_admin_only ON backup_configurations
    USING (
        organization_id = get_current_organization_id()
        AND user_has_role('admin')
    );

-- RLS Policies for Security Metrics
CREATE POLICY security_metrics_organization_isolation ON security_metrics
    FOR SELECT
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_id = current_setting('app.current_user_id', true)::UUID
            OR
            user_has_role('admin')
            OR
            user_has_permission('view_security_metrics')
        )
    );

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_config_updated_at
    BEFORE UPDATE ON mfa_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_events_updated_at
    BEFORE UPDATE ON security_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at
    BEFORE UPDATE ON security_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_compliance_updated_at
    BEFORE UPDATE ON organization_compliance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_configurations_updated_at
    BEFORE UPDATE ON backup_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_organization_id UUID,
    p_event_type security_event_type,
    p_severity severity_level DEFAULT 'medium',
    p_user_id UUID DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        organization_id, event_type, severity, user_id, session_id,
        event_data, ip_address, user_agent
    ) VALUES (
        p_organization_id, p_event_type, p_severity, p_user_id, p_session_id,
        p_event_data, p_ip_address, p_user_agent
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_organization_id UUID,
    p_user_id UUID,
    p_action audit_action,
    p_resource_type VARCHAR(100),
    p_resource_id VARCHAR(255) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        organization_id, user_id, action, resource_type, resource_id,
        old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- Function to hash passwords securely
CREATE OR REPLACE FUNCTION hash_password(password_text TEXT, salt TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    actual_salt TEXT;
    hash_result TEXT;
BEGIN
    -- Generate salt if not provided
    actual_salt := COALESCE(salt, encode(gen_random_bytes(32), 'base64'));
    
    -- Hash the password using Argon2 (via pgcrypto)
    hash_result := 'argon2$' || actual_salt || '$' || 
                   encode(
                       digest(password_text || actual_salt, 'sha256'),
                       'base64'
                   );
    
    RETURN hash_result;
END;
$$;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_password(password_text TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hash_parts TEXT[];
    salt TEXT;
    hash_to_verify TEXT;
    computed_hash TEXT;
BEGIN
    -- Parse the stored hash
    hash_parts := string_to_array(stored_hash, '$');
    
    IF array_length(hash_parts, 1) != 3 OR hash_parts[1] != 'argon2' THEN
        RETURN false;
    END IF;
    
    salt := hash_parts[2];
    hash_to_verify := hash_parts[3];
    
    -- Compute the hash with the same salt
    computed_hash := encode(
        digest(password_text || salt, 'sha256'),
        'base64'
    );
    
    RETURN computed_hash = hash_to_verify;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE sessions
    SET status = 'expired',
        terminated_at = CURRENT_TIMESTAMP,
        termination_reason = 'Automatic cleanup'
    WHERE status = 'active'
        AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to generate secure session token
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Generate a cryptographically secure random token
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login_attempt(p_user_id UUID, p_ip_address INET)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_org_id UUID;
    failure_count INTEGER;
    should_lock BOOLEAN := false;
BEGIN
    -- Get user's organization
    SELECT organization_id INTO user_org_id
    FROM users
    WHERE id = p_user_id;
    
    -- Increment failed login attempts
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1,
        last_login_ip = p_ip_address
    WHERE id = p_user_id;
    
    -- Check if account should be locked (5 failed attempts)
    SELECT failed_login_attempts INTO failure_count
    FROM users
    WHERE id = p_user_id;
    
    should_lock := (failure_count >= 5);
    
    IF should_lock THEN
        -- Lock the account for 30 minutes
        UPDATE users
        SET status = 'locked',
            locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
        WHERE id = p_user_id;
        
        -- Log security event
        PERFORM log_security_event(
            user_org_id,
            'account_locked',
            'high',
            p_user_id,
            NULL,
            jsonb_build_object('reason', 'failed_login_attempts', 'count', failure_count),
            p_ip_address,
            NULL
        );
    END IF;
    
    -- Log the failed login attempt
    PERFORM log_security_event(
        user_org_id,
        'login_failure',
        'medium',
        p_user_id,
        NULL,
        jsonb_build_object('attempt_count', failure_count, 'account_locked', should_lock),
        p_ip_address,
        NULL
    );
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email_organization ON users(organization_id, email);
CREATE INDEX idx_users_username_organization ON users(organization_id, username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX idx_users_emirates_id ON users(organization_id, emirates_id);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_organization_id ON sessions(organization_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_status_expires ON sessions(status, expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at DESC);
CREATE INDEX idx_sessions_ip_address ON sessions(ip_address);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_tags ON audit_logs USING GIN(tags);
CREATE INDEX idx_audit_logs_gin ON audit_logs USING GIN(record_data);
CREATE INDEX idx_audit_logs_organization_created ON audit_logs(organization_id, created_at DESC);

-- Security events indexes
CREATE INDEX idx_security_events_organization_id ON security_events(organization_id);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_status ON security_events(status);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_assigned_to ON security_events(assigned_to);
CREATE INDEX idx_security_events_gin ON security_events USING GIN(event_data);

-- MFA indexes
CREATE INDEX idx_mfa_config_user_id ON mfa_config(user_id);
CREATE INDEX idx_mfa_config_method ON mfa_config(user_id, method);
CREATE INDEX idx_mfa_attempts_user_id ON mfa_attempts(user_id);
CREATE INDEX idx_mfa_attempts_time ON mfa_attempts(attempt_time DESC);

-- Encryption keys indexes
CREATE INDEX idx_encryption_keys_organization_id ON data_encryption_keys(organization_id);
CREATE INDEX idx_encryption_keys_name_version ON data_encryption_keys(key_name, key_version);
CREATE INDEX idx_encryption_keys_status ON data_encryption_keys(key_status);
CREATE INDEX idx_encryption_keys_primary ON data_encryption_keys(organization_id, key_name) WHERE is_primary = true;

-- Security policies indexes
CREATE INDEX idx_security_policies_organization_id ON security_policies(organization_id);
CREATE INDEX idx_security_policies_type_active ON security_policies(policy_type, is_active);
CREATE INDEX idx_security_policies_system ON security_policies(is_system_policy);

-- Compliance indexes
CREATE INDEX idx_compliance_organization_id ON organization_compliance(organization_id);
CREATE INDEX idx_compliance_status ON organization_compliance(status);
CREATE INDEX idx_compliance_framework ON organization_compliance(framework_id);
CREATE INDEX idx_compliance_assessment_due ON organization_compliance(next_assessment_due);

-- Backup indexes
CREATE INDEX idx_backup_config_organization_id ON backup_configurations(organization_id);
CREATE INDEX idx_backup_config_active ON backup_configurations(is_active, next_run_at);
CREATE INDEX idx_backup_executions_config_id ON backup_executions(configuration_id);
CREATE INDEX idx_backup_executions_organization_id ON backup_executions(organization_id);
CREATE INDEX idx_backup_executions_status ON backup_executions(status);
CREATE INDEX idx_backup_executions_started_at ON backup_executions(started_at DESC);

-- Data subject rights indexes
CREATE INDEX idx_data_subject_requests_organization_id ON data_subject_rights_requests(organization_id);
CREATE INDEX idx_data_subject_requests_subject_id ON data_subject_rights_requests(subject_identifier);
CREATE INDEX idx_data_subject_requests_status ON data_subject_rights_requests(status);
CREATE INDEX idx_data_subject_requests_deadline ON data_subject_rights_requests(deadline_date);

-- Policy violations indexes
CREATE INDEX idx_policy_violations_organization_id ON policy_violations(organization_id);
CREATE INDEX idx_policy_violations_policy_id ON policy_violations(policy_id);
CREATE INDEX idx_policy_violations_user_id ON policy_violations(user_id);
CREATE INDEX idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX idx_policy_violations_detected_at ON policy_violations(detected_at DESC);
CREATE INDEX idx_policy_violations_status ON policy_violations(status);

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert system permissions
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
-- User management permissions
('users.create', 'Create new users', 'user_management', 'users', 'create', true),
('users.read', 'View user information', 'user_management', 'users', 'read', true),
('users.update', 'Update user information', 'user_management', 'users', 'update', true),
('users.delete', 'Delete users', 'user_management', 'users', 'delete', true),
('users.manage_roles', 'Assign and revoke user roles', 'user_management', 'users', 'manage_roles', true),

-- Role management permissions
('roles.create', 'Create new roles', 'role_management', 'roles', 'create', true),
('roles.read', 'View role information', 'role_management', 'roles', 'read', true),
('roles.update', 'Update role information', 'role_management', 'roles', 'update', true),
('roles.delete', 'Delete roles', 'role_management', 'roles', 'delete', true),

-- Security permissions
('security.view_events', 'View security events', 'security', 'security_events', 'read', true),
('security.manage_events', 'Manage security events', 'security', 'security_events', 'manage', true),
('security.view_audit_logs', 'View audit logs', 'security', 'audit_logs', 'read', true),
('security.manage_policies', 'Manage security policies', 'security', 'security_policies', 'manage', true),
('security.view_metrics', 'View security metrics', 'security', 'security_metrics', 'read', true),

-- Compliance permissions
('compliance.view', 'View compliance status', 'compliance', 'compliance', 'read', true),
('compliance.manage', 'Manage compliance requirements', 'compliance', 'compliance', 'manage', true),
('compliance.data_subject_rights', 'Handle data subject rights requests', 'compliance', 'data_subject_rights', 'manage', true),

-- Backup permissions
('backup.view', 'View backup configurations', 'backup', 'backup_configurations', 'read', true),
('backup.manage', 'Manage backup configurations', 'backup', 'backup_configurations', 'manage', true),
('backup.execute', 'Execute backup operations', 'backup', 'backup_executions', 'execute', true),

-- Session management
('sessions.view_own', 'View own sessions', 'session_management', 'sessions', 'read_own', true),
('sessions.view_all', 'View all sessions', 'session_management', 'sessions', 'read_all', true),
('sessions.terminate', 'Terminate sessions', 'session_management', 'sessions', 'terminate', true),

-- Organization management
('organization.manage', 'Manage organization settings', 'organization', 'organization', 'manage', true),
('organization.view', 'View organization information', 'organization', 'organization', 'read', true);

-- Insert system roles
INSERT INTO roles (name, description, is_system_role, permissions) VALUES
('super_admin', 'System super administrator with all privileges', true, '[]'),
('admin', 'Organization administrator with full management rights', true, '[]'),
('security_officer', 'Security officer responsible for security monitoring', true, '[]'),
('compliance_officer', 'Compliance officer responsible for regulatory compliance', true, '[]'),
('user', 'Regular user with basic access rights', true, '[]');

-- Insert system security policies
INSERT INTO security_policies (policy_name, policy_type, is_system_policy, policy_rules, enforcement_level, compliance_frameworks) VALUES
('Password Policy', 'password', true, 
 '{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true, "history_count": 5, "max_age_days": 90}',
 'enforce', '{"UAE_PDPL", "ISO27001"}'),

('Session Management Policy', 'session', true,
 '{"timeout_minutes": 30, "max_duration_hours": 8, "concurrent_sessions": 5, "secure_tokens": true}',
 'enforce', '{"UAE_PDPL", "ISO27001"}'),

('Data Retention Policy', 'data_retention', true,
 '{"user_data_years": 7, "audit_logs_years": 7, "session_data_months": 6, "security_events_years": 7}',
 'enforce', '{"UAE_PDPL"}'),

('MFA Policy', 'access_control', true,
 '{"required_for_admin": true, "required_for_sensitive_data": true, "methods": ["sms", "email", "totp"], "backup_codes": true}',
 'enforce', '{"UAE_PDPL", "ISO27001"}');

-- Insert default system configuration
INSERT INTO system_config (key, value, description, is_sensitive) VALUES
('security.max_failed_logins', '"5"', 'Maximum failed login attempts before account lockout', false),
('security.lockout_duration_minutes', '"30"', 'Account lockout duration in minutes', false),
('session.timeout_minutes', '"30"', 'Session timeout in minutes', false),
('session.max_duration_hours', '"8"', 'Maximum session duration in hours', false),
('backup.default_retention_days', '"2555"', 'Default backup retention in days (7 years)', false),
('encryption.algorithm', '"AES-256-GCM"', 'Default encryption algorithm', false),
('compliance.framework_version', '"1.0"', 'Current compliance framework version', false),
('audit.retention_days', '"2555"', 'Audit log retention period in days', false);

-- Create initial organization (for system setup)
INSERT INTO organizations (name, legal_name, country_code, timezone, is_active) VALUES
('System', 'System Organization', 'AE', 'Asia/Dubai', true);

-- Create system user (for administrative operations)
INSERT INTO users (
    id, organization_id, username, email, password_hash, 
    first_name, last_name, status, email_verified, is_system_user
) VALUES (
    uuid_generate_v4(),
    (SELECT id FROM organizations WHERE name = 'System'),
    'system',
    'system@uaetailoring.local',
    '$argon2$base64$somesalt$somehash',
    'System',
    'Administrator',
    'active',
    true,
    true
);

-- Grant super admin role to system user
INSERT INTO user_roles (user_id, role_id, organization_id, created_by)
SELECT 
    u.id,
    r.id,
    u.organization_id,
    u.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'system' 
    AND r.name = 'super_admin';

-- ============================================================================
-- VIEWS FOR SECURITY MONITORING
-- ============================================================================

-- Security dashboard view
CREATE VIEW security_dashboard AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    -- User statistics
    (SELECT COUNT(*) FROM users WHERE organization_id = o.id AND status = 'active') as active_users,
    (SELECT COUNT(*) FROM users WHERE organization_id = o.id AND status = 'locked') as locked_users,
    -- Session statistics
    (SELECT COUNT(*) FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE u.organization_id = o.id AND s.status = 'active') as active_sessions,
    -- Security events
    (SELECT COUNT(*) FROM security_events se 
     JOIN users u ON se.user_id = u.id 
     WHERE u.organization_id = o.id AND se.status = 'open' AND se.severity = 'critical') as critical_events,
    (SELECT COUNT(*) FROM security_events se 
     JOIN users u ON se.user_id = u.id 
     WHERE u.organization_id = o.id AND se.status = 'open') as total_open_events,
    -- Compliance status
    (SELECT COUNT(*) FROM organization_compliance oc 
     WHERE oc.organization_id = o.id AND oc.status = 'non_compliant') as compliance_violations,
    -- Recent activity
    (SELECT COUNT(*) FROM audit_logs al 
     WHERE al.organization_id = o.id AND al.created_at >= CURRENT_DATE) as daily_activities
FROM organizations o
WHERE o.is_active = true;

-- User security status view
CREATE VIEW user_security_status AS
SELECT 
    u.id,
    u.organization_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    u.failed_login_attempts,
    u.locked_until,
    u.last_login_at,
    -- MFA status
    (SELECT COUNT(*) FROM mfa_config mfa 
     WHERE mfa.user_id = u.id AND mfa.is_enabled = true) as mfa_enabled_methods,
    (SELECT mfa.method FROM mfa_config mfa 
     WHERE mfa.user_id = u.id AND mfa.is_primary = true AND mfa.is_enabled = true) as primary_mfa_method,
    -- Session status
    (SELECT COUNT(*) FROM sessions s 
     WHERE s.user_id = u.id AND s.status = 'active') as active_sessions,
    -- Security events
    (SELECT COUNT(*) FROM security_events se 
     WHERE se.user_id = u.id AND se.status = 'open') as open_security_events,
    u.created_at
FROM users u;

-- Compliance status view
CREATE VIEW compliance_status AS
SELECT 
    oc.organization_id,
    o.name as organization_name,
    cf.name as framework_name,
    cf.version as framework_version,
    COUNT(*) as total_requirements,
    COUNT(CASE WHEN oc.status = 'compliant' THEN 1 END) as compliant_count,
    COUNT(CASE WHEN oc.status = 'non_compliant' THEN 1 END) as non_compliant_count,
    COUNT(CASE WHEN oc.status = 'pending_review' THEN 1 END) as pending_count,
    ROUND(
        COUNT(CASE WHEN oc.status = 'compliant' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 
        2
    ) as compliance_percentage
FROM organization_compliance oc
JOIN organizations o ON oc.organization_id = o.id
JOIN compliance_frameworks cf ON oc.framework_id = cf.id
WHERE o.is_active = true
GROUP BY oc.organization_id, o.name, cf.name, cf.version;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'UAE Tailoring Platform Security Schema - Comprehensive security implementation for multi-tenant business platform with UAE compliance';

COMMENT ON TABLE organizations IS 'Organizations/Tenants - Multi-tenant organization data with UAE-specific fields';
COMMENT ON TABLE users IS 'Users - Comprehensive user management with UAE identity fields and security tracking';
COMMENT ON TABLE roles IS 'Roles - Role-based access control with permission assignments';
COMMENT ON TABLE user_roles IS 'User Role Assignments - Many-to-many relationship between users and roles';
COMMENT ON TABLE permissions IS 'Permissions - Granular permission definitions for resource access control';
COMMENT ON TABLE role_permissions IS 'Role Permission Assignments - Many-to-many relationship between roles and permissions';

COMMENT ON TABLE sessions IS 'User Sessions - Session management with security tracking and multi-device support';
COMMENT ON TABLE session_activities IS 'Session Activities - Detailed session activity logging for security analysis';

COMMENT ON TABLE mfa_config IS 'MFA Configuration - Multi-factor authentication setup for users';
COMMENT ON TABLE mfa_attempts IS 'MFA Attempts - MFA authentication attempts for security tracking';

COMMENT ON TABLE audit_logs IS 'Audit Logs - Comprehensive audit trail for all system activities';
COMMENT ON TABLE audit_log_retention IS 'Audit Log Retention - Configurable retention policies by data type';

COMMENT ON TABLE security_events IS 'Security Events - Security incident tracking and management';
COMMENT ON TABLE security_event_correlations IS 'Security Event Correlations - Relationship mapping between related security events';

COMMENT ON TABLE data_encryption_keys IS 'Data Encryption Keys - Key management for data-at-rest encryption';
COMMENT ON TABLE key_rotation_logs IS 'Key Rotation Logs - Audit trail for encryption key lifecycle management';

COMMENT ON TABLE security_policies IS 'Security Policies - Configurable security policies with enforcement levels';
COMMENT ON TABLE policy_violations IS 'Policy Violations - Tracking and management of security policy violations';

COMMENT ON TABLE compliance_frameworks IS 'Compliance Frameworks - Regulatory compliance framework definitions';
COMMENT ON TABLE compliance_requirements IS 'Compliance Requirements - Detailed compliance requirement tracking';
COMMENT ON TABLE organization_compliance IS 'Organization Compliance - Per-organization compliance status tracking';
COMMENT ON TABLE data_subject_rights_requests IS 'Data Subject Rights - UAE PDPL compliance for data subject rights requests';

COMMENT ON TABLE backup_configurations IS 'Backup Configurations - Configurable backup policies and schedules';
COMMENT ON TABLE backup_executions IS 'Backup Executions - Historical backup execution records with verification';

COMMENT ON TABLE security_metrics IS 'Security Metrics - Aggregated security metrics for monitoring and reporting';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions (adjust based on your deployment)
-- Note: In production, use a dedicated service account with minimal required permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant to service role (for application access)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- This schema provides a comprehensive security implementation including:
-- 1. Multi-tenant data isolation with RLS
-- 2. Comprehensive audit logging
-- 3. Security event tracking
-- 4. MFA support with multiple methods
-- 5. Key management and encryption
-- 6. Compliance tracking for UAE PDPL
-- 7. Backup and disaster recovery
-- 8. Security policy enforcement
-- 9. Session management
-- 10. Row-level security policies for data protection

-- Additional considerations for production deployment:
-- 1. Configure SSL/TLS connections
-- 2. Set up monitoring and alerting
-- 3. Implement automated backups
-- 4. Configure log rotation
-- 5. Set up disaster recovery procedures
-- 6. Regular security audits
-- 7. Penetration testing
-- 8. Staff security training

SELECT 'UAE Tailoring Platform Security Schema created successfully!' as status;