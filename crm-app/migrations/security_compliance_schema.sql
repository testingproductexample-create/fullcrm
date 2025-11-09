-- Security & Compliance Hardening System Database Schema
-- Comprehensive security tables for enterprise-grade protection

-- ============================================================================
-- 1. ENHANCED AUTHENTICATION & SESSION MANAGEMENT
-- ============================================================================

-- Multi-factor authentication settings
CREATE TABLE IF NOT EXISTS mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- Encrypted backup codes
    totp_secret TEXT, -- Encrypted TOTP secret for authenticator apps
    sms_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT false,
    biometric_enabled BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session management and security
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location_info JSONB,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    ip_address INET,
    user_agent TEXT,
    attempt_count INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password history to prevent reuse
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- ============================================================================

-- Security roles with granular permissions
CREATE TABLE IF NOT EXISTS security_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    role_name TEXT NOT NULL,
    role_description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    permissions JSONB NOT NULL DEFAULT '{}', -- Detailed permissions per module
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, role_name)
);

-- User role assignments with time-based access
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES security_roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    assignment_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource permissions for fine-grained access control
CREATE TABLE IF NOT EXISTS resource_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    resource_type TEXT NOT NULL, -- 'customers', 'orders', 'employees', etc.
    resource_id UUID, -- Specific resource ID (null for type-level permissions)
    user_id UUID REFERENCES auth.users(id),
    role_id UUID REFERENCES security_roles(id),
    permissions JSONB NOT NULL DEFAULT '{}', -- read, write, delete, admin
    granted_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR role_id IS NOT NULL)
);

-- ============================================================================
-- 3. COMPREHENSIVE AUDIT LOGGING & MONITORING
-- ============================================================================

-- Enhanced audit trail for all system activities
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID REFERENCES user_sessions(id),
    event_type TEXT NOT NULL, -- 'login', 'data_access', 'data_modify', 'permission_change', etc.
    event_category TEXT NOT NULL, -- 'authentication', 'authorization', 'data', 'system'
    resource_type TEXT, -- 'customer', 'order', 'employee', etc.
    resource_id UUID,
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout'
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    event_source TEXT DEFAULT 'web', -- 'web', 'api', 'mobile', 'system'
    additional_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User behavior analytics for anomaly detection
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    session_id UUID REFERENCES user_sessions(id),
    behavior_type TEXT NOT NULL, -- 'login_pattern', 'data_access', 'work_hours', etc.
    behavior_data JSONB NOT NULL,
    anomaly_score REAL DEFAULT 0.0, -- 0.0-1.0 anomaly score
    is_anomaly BOOLEAN DEFAULT false,
    baseline_data JSONB,
    detection_rules TEXT[],
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents and alerts
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    incident_type TEXT NOT NULL, -- 'unauthorized_access', 'data_breach', 'anomaly', etc.
    severity_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    title TEXT NOT NULL,
    description TEXT,
    affected_users UUID[],
    affected_resources JSONB,
    detection_method TEXT, -- 'automated', 'manual', 'external'
    response_actions JSONB,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id),
    escalated_at TIMESTAMP WITH TIME ZONE,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. DATA PROTECTION & ENCRYPTION
-- ============================================================================

-- Encryption keys management
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    key_type TEXT NOT NULL, -- 'field_encryption', 'file_encryption', 'backup'
    key_purpose TEXT NOT NULL, -- 'pii', 'financial', 'medical', etc.
    key_algorithm TEXT NOT NULL DEFAULT 'AES-256',
    key_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    rotated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensitive data classification and handling
CREATE TABLE IF NOT EXISTS data_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    classification_level TEXT NOT NULL, -- 'public', 'internal', 'confidential', 'restricted'
    data_type TEXT NOT NULL, -- 'pii', 'financial', 'health', 'business'
    encryption_required BOOLEAN DEFAULT false,
    retention_period_days INTEGER,
    access_restrictions JSONB,
    compliance_tags TEXT[], -- 'pdpl', 'pci', 'hipaa', etc.
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, table_name, column_name)
);

-- Data anonymization and pseudonymization tracking
CREATE TABLE IF NOT EXISTS data_anonymization_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    operation_type TEXT NOT NULL, -- 'anonymize', 'pseudonymize', 'restore'
    table_name TEXT NOT NULL,
    record_ids UUID[],
    fields_affected TEXT[],
    anonymization_method TEXT, -- 'masking', 'randomization', 'generalization'
    request_reason TEXT,
    performed_by UUID REFERENCES auth.users(id),
    is_reversible BOOLEAN DEFAULT false,
    reversal_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. COMPLIANCE & GOVERNANCE (UAE PDPL & CSA)
-- ============================================================================

-- Data consent management (PDPL compliance)
CREATE TABLE IF NOT EXISTS data_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    subject_id UUID NOT NULL, -- customer, employee, etc.
    subject_type TEXT NOT NULL, -- 'customer', 'employee', 'vendor'
    consent_type TEXT NOT NULL, -- 'marketing', 'processing', 'sharing', 'storage'
    consent_status TEXT NOT NULL DEFAULT 'pending', -- 'granted', 'denied', 'withdrawn', 'expired'
    consent_method TEXT, -- 'website_form', 'paper_form', 'verbal', 'email'
    purpose TEXT NOT NULL,
    data_categories TEXT[],
    retention_period_days INTEGER,
    consent_language TEXT DEFAULT 'en',
    legal_basis TEXT, -- Under PDPL
    granted_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    evidence_url TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data subject rights requests (PDPL Article 13)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    subject_type TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction'
    status TEXT DEFAULT 'received', -- 'received', 'processing', 'completed', 'rejected'
    request_details TEXT,
    identity_verified BOOLEAN DEFAULT false,
    verification_method TEXT,
    requested_data JSONB,
    response_data JSONB,
    legal_basis_for_processing TEXT,
    rejection_reason TEXT,
    requested_by_email TEXT,
    requested_by_phone TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE, -- 30 days under PDPL
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UAE Cybersecurity compliance tracking
CREATE TABLE IF NOT EXISTS cybersecurity_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    framework TEXT NOT NULL, -- 'UAE_CSA', 'NIST', 'ISO27001'
    control_id TEXT NOT NULL,
    control_name TEXT NOT NULL,
    control_description TEXT,
    implementation_status TEXT DEFAULT 'not_implemented', -- 'implemented', 'partially', 'not_implemented'
    compliance_level TEXT, -- 'basic', 'advanced', 'critical'
    evidence_documents TEXT[],
    assessment_date TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    responsible_person UUID REFERENCES auth.users(id),
    risk_rating TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    remediation_plan TEXT,
    implementation_cost DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, framework, control_id)
);

-- ============================================================================
-- 6. SECURITY MONITORING & ALERTING
-- ============================================================================

-- Real-time security monitoring rules
CREATE TABLE IF NOT EXISTS security_monitoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'threshold', 'pattern', 'anomaly', 'compliance'
    rule_category TEXT NOT NULL, -- 'authentication', 'data_access', 'system'
    conditions JSONB NOT NULL,
    threshold_values JSONB,
    is_active BOOLEAN DEFAULT true,
    severity_level TEXT DEFAULT 'medium',
    alert_channels TEXT[], -- 'email', 'sms', 'webhook', 'dashboard'
    auto_response_actions JSONB,
    created_by UUID REFERENCES auth.users(id),
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security alerts and notifications
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    rule_id UUID REFERENCES security_monitoring_rules(id),
    alert_type TEXT NOT NULL,
    severity_level TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'false_positive'
    affected_users UUID[],
    event_data JSONB,
    auto_actions_taken JSONB,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API security and rate limiting
CREATE TABLE IF NOT EXISTS api_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    api_endpoint TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    api_key_id UUID,
    request_method TEXT NOT NULL,
    request_size INTEGER,
    response_status INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    rate_limit_hit BOOLEAN DEFAULT false,
    rate_limit_window TEXT,
    rate_limit_count INTEGER,
    authentication_method TEXT,
    request_headers JSONB,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. BACKUP & DISASTER RECOVERY
-- ============================================================================

-- Data backup tracking and management
CREATE TABLE IF NOT EXISTS data_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    backup_type TEXT NOT NULL, -- 'full', 'incremental', 'differential'
    backup_scope TEXT NOT NULL, -- 'database', 'files', 'complete'
    backup_status TEXT DEFAULT 'in_progress', -- 'completed', 'failed', 'in_progress'
    backup_location TEXT NOT NULL,
    backup_size_bytes BIGINT,
    encryption_used BOOLEAN DEFAULT true,
    encryption_algorithm TEXT DEFAULT 'AES-256',
    checksum TEXT,
    retention_until TIMESTAMP WITH TIME ZONE,
    restore_tested_at TIMESTAMP WITH TIME ZONE,
    restore_test_status TEXT, -- 'passed', 'failed', 'pending'
    initiated_by UUID REFERENCES auth.users(id),
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Disaster recovery procedures and testing
CREATE TABLE IF NOT EXISTS disaster_recovery_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    procedure_name TEXT NOT NULL,
    procedure_type TEXT NOT NULL, -- 'data_breach', 'system_failure', 'cyber_attack'
    priority_level INTEGER DEFAULT 1, -- 1-5 priority
    steps JSONB NOT NULL,
    responsible_roles TEXT[],
    estimated_recovery_time TEXT,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_results TEXT,
    next_test_due TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. SECURITY CONFIGURATION & SETTINGS
-- ============================================================================

-- Organization security policies and settings
CREATE TABLE IF NOT EXISTS security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    policy_type TEXT NOT NULL, -- 'password', 'access', 'data_handling', 'incident_response'
    policy_name TEXT NOT NULL,
    policy_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    enforcement_level TEXT DEFAULT 'mandatory', -- 'advisory', 'recommended', 'mandatory'
    applies_to_roles TEXT[],
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, policy_type, policy_name)
);

-- Security configuration settings
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    setting_category TEXT NOT NULL, -- 'authentication', 'session', 'encryption', 'monitoring'
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL, -- 'boolean', 'integer', 'string', 'json'
    is_sensitive BOOLEAN DEFAULT false,
    description TEXT,
    validation_rules JSONB,
    modified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, setting_category, setting_key)
);

-- ============================================================================
-- INDEXES AND PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Indexes for security audit logs (frequently queried)
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_org_time ON security_audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_time ON security_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_resource ON security_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Indexes for failed login attempts
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_time ON failed_login_attempts(email, last_attempt_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_time ON failed_login_attempts(ip_address, last_attempt_at);

-- Indexes for user behavior analytics
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_time ON user_behavior_analytics(user_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_anomaly ON user_behavior_analytics(is_anomaly, anomaly_score DESC);

-- Indexes for security incidents
CREATE INDEX IF NOT EXISTS idx_security_incidents_org_status ON security_incidents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity_time ON security_incidents(severity_level, created_at DESC);

-- Indexes for data consent
CREATE INDEX IF NOT EXISTS idx_data_consent_subject ON data_consent(subject_id, subject_type);
CREATE INDEX IF NOT EXISTS idx_data_consent_status_expires ON data_consent(consent_status, expires_at);

-- Indexes for API security logs
CREATE INDEX IF NOT EXISTS idx_api_security_logs_endpoint_time ON api_security_logs(api_endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_user_time ON api_security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_rate_limit ON api_security_logs(rate_limit_hit, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all security tables
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_anonymization_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cybersecurity_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_monitoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_recovery_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (organization-based access)
CREATE POLICY "Organization users can view their security data" ON security_audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage security settings" ON security_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

-- Additional policies will be created for each table based on specific access requirements

-- ============================================================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC SECURITY LOGGING
-- ============================================================================

-- Function to automatically log data changes
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_logs (
        organization_id,
        user_id,
        event_type,
        event_category,
        resource_type,
        resource_id,
        action,
        old_values,
        new_values,
        ip_address,
        additional_context
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        auth.uid(),
        TG_OP,
        'data',
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE TG_OP
            WHEN 'INSERT' THEN 'create'
            WHEN 'UPDATE' THEN 'update'
            WHEN 'DELETE' THEN 'delete'
        END,
        CASE TG_OP WHEN 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE TG_OP WHEN 'INSERT' THEN to_jsonb(NEW) 
                    WHEN 'UPDATE' THEN to_jsonb(NEW) 
                    ELSE NULL END,
        inet_client_addr(),
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables (will be applied to all sensitive tables)
-- These triggers will be created for all tables containing sensitive data

-- ============================================================================
-- INITIAL SECURITY CONFIGURATION
-- ============================================================================

-- Insert default security roles
INSERT INTO security_roles (organization_id, role_name, role_description, is_system_role, permissions) VALUES
('00000000-0000-0000-0000-000000000000', 'Security Administrator', 'Full security management access', true, '{"security": {"read": true, "write": true, "admin": true}, "audit": {"read": true, "write": true}, "compliance": {"read": true, "write": true}}'),
('00000000-0000-0000-0000-000000000000', 'Data Protection Officer', 'PDPL compliance and data protection', true, '{"compliance": {"read": true, "write": true}, "data_subjects": {"read": true, "write": true}, "audit": {"read": true}}'),
('00000000-0000-0000-0000-000000000000', 'Security Analyst', 'Security monitoring and incident response', true, '{"security": {"read": true}, "incidents": {"read": true, "write": true}, "monitoring": {"read": true}}'),
('00000000-0000-0000-0000-000000000000', 'Compliance Officer', 'UAE regulatory compliance management', true, '{"compliance": {"read": true, "write": true}, "policies": {"read": true, "write": true}}')
ON CONFLICT (organization_id, role_name) DO NOTHING;

-- Insert default security policies
INSERT INTO security_policies (organization_id, policy_type, policy_name, policy_content, created_by) VALUES
('00000000-0000-0000-0000-000000000000', 'password', 'Password Policy', 
'{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true, "max_age_days": 90, "min_history": 5, "lockout_attempts": 5, "lockout_duration_minutes": 30}', 
'00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000000', 'session', 'Session Management', 
'{"max_concurrent_sessions": 3, "idle_timeout_minutes": 30, "absolute_timeout_hours": 8, "require_re_auth_for_sensitive": true}', 
'00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000000', 'data_handling', 'Data Protection Policy', 
'{"encryption_at_rest": true, "encryption_in_transit": true, "data_retention_days": 2557, "backup_frequency": "daily", "data_classification_required": true}', 
'00000000-0000-0000-0000-000000000000')
ON CONFLICT (organization_id, policy_type, policy_name) DO NOTHING;

-- Insert default security settings
INSERT INTO security_settings (organization_id, setting_category, setting_key, setting_value, setting_type, description) VALUES
('00000000-0000-0000-0000-000000000000', 'authentication', 'mfa_required', 'true', 'boolean', 'Require multi-factor authentication for all users'),
('00000000-0000-0000-0000-000000000000', 'authentication', 'session_timeout_minutes', '30', 'integer', 'Automatic session timeout in minutes'),
('00000000-0000-0000-0000-000000000000', 'monitoring', 'failed_login_threshold', '5', 'integer', 'Maximum failed login attempts before lockout'),
('00000000-0000-0000-0000-000000000000', 'monitoring', 'anomaly_detection_enabled', 'true', 'boolean', 'Enable user behavior anomaly detection'),
('00000000-0000-0000-0000-000000000000', 'encryption', 'field_encryption_enabled', 'true', 'boolean', 'Enable field-level encryption for sensitive data'),
('00000000-0000-0000-0000-000000000000', 'compliance', 'pdpl_consent_required', 'true', 'boolean', 'Require explicit consent for data processing (PDPL)')
ON CONFLICT (organization_id, setting_category, setting_key) DO NOTHING;