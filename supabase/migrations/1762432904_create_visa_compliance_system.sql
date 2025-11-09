-- Migration: create_visa_compliance_system
-- Created at: 1762432904

-- Comprehensive Visa & Compliance Management System
-- Additional tables to complement existing visa_tracking table

-- 1. Compliance Violations and Risk Tracking
CREATE TABLE IF NOT EXISTS compliance_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('active', 'investigating', 'resolved', 'mitigated')) DEFAULT 'active',
    description TEXT NOT NULL,
    detected_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    resolution_date TIMESTAMPTZ,
    mitigation_plan TEXT,
    resolution_notes TEXT,
    financial_impact_aed NUMERIC(12,2),
    assigned_to_user_id UUID REFERENCES profiles(id),
    related_document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Government Portal Tracking (MOHRE, GDRFA, ICA)
CREATE TABLE IF NOT EXISTS government_portal_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    portal_name TEXT NOT NULL,
    application_type TEXT NOT NULL,
    application_number TEXT,
    submission_date TIMESTAMPTZ NOT NULL,
    expected_completion_date TIMESTAMPTZ,
    actual_completion_date TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed')) DEFAULT 'draft',
    fees_paid_aed NUMERIC(12,2),
    reference_number TEXT,
    tracking_url TEXT,
    submitted_by_user_id UUID REFERENCES profiles(id),
    documents_submitted JSONB,
    response_documents JSONB,
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Regulatory Updates Tracking
CREATE TABLE IF NOT EXISTS regulatory_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL,
    authority TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    effective_date DATE NOT NULL,
    announcement_date DATE NOT NULL,
    impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    affected_areas TEXT[],
    action_required BOOLEAN DEFAULT FALSE,
    action_deadline DATE,
    compliance_status TEXT CHECK (compliance_status IN ('pending', 'in_progress', 'compliant', 'non_compliant')) DEFAULT 'pending',
    implementation_notes TEXT,
    source_url TEXT,
    document_url TEXT,
    assigned_to_user_id UUID REFERENCES profiles(id),
    created_by_user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Visa Renewal Alerts
CREATE TABLE IF NOT EXISTS visa_renewal_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    visa_tracking_id UUID NOT NULL REFERENCES visa_tracking(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    alert_date TIMESTAMPTZ NOT NULL,
    days_until_expiry INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'acknowledged', 'action_taken', 'dismissed')) DEFAULT 'pending',
    notification_channels TEXT[],
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by_user_id UUID REFERENCES profiles(id),
    action_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Government Correspondence
CREATE TABLE IF NOT EXISTS government_correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    correspondence_type TEXT NOT NULL,
    authority TEXT NOT NULL,
    subject TEXT NOT NULL,
    reference_number TEXT,
    received_date TIMESTAMPTZ,
    sent_date TIMESTAMPTZ,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('draft', 'sent', 'received', 'responded', 'closed')) DEFAULT 'draft',
    due_date TIMESTAMPTZ,
    response_deadline TIMESTAMPTZ,
    content TEXT,
    document_urls TEXT[],
    assigned_to_user_id UUID REFERENCES profiles(id),
    responded_by_user_id UUID REFERENCES profiles(id),
    response_content TEXT,
    response_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Compliance Audit Logs (specific to visa & compliance)
CREATE TABLE IF NOT EXISTS visa_compliance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    audit_type TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    performed_by_user_id UUID REFERENCES profiles(id),
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    result TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WPS (Wages Protection System) Compliance
CREATE TABLE IF NOT EXISTS wps_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    submission_deadline DATE NOT NULL,
    submission_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'processing', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
    total_employees INTEGER NOT NULL,
    total_salary_aed NUMERIC(15,2) NOT NULL,
    sif_file_url TEXT,
    confirmation_number TEXT,
    bank_reference TEXT,
    submitted_by_user_id UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_violations_org_status ON compliance_violations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_employee ON compliance_violations(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_government_portal_org_status ON government_portal_tracking(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_government_portal_employee ON government_portal_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_government_portal_portal ON government_portal_tracking(portal_name);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_org ON regulatory_updates(organization_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_effective_date ON regulatory_updates(effective_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_compliance_status ON regulatory_updates(compliance_status);
CREATE INDEX IF NOT EXISTS idx_visa_renewal_alerts_org_status ON visa_renewal_alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_visa_renewal_alerts_employee ON visa_renewal_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_renewal_alerts_date ON visa_renewal_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_government_correspondence_org ON government_correspondence(organization_id);
CREATE INDEX IF NOT EXISTS idx_government_correspondence_status ON government_correspondence(status);
CREATE INDEX IF NOT EXISTS idx_government_correspondence_authority ON government_correspondence(authority);
CREATE INDEX IF NOT EXISTS idx_visa_compliance_audit_org ON visa_compliance_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_visa_compliance_audit_employee ON visa_compliance_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_compliance_audit_created ON visa_compliance_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_wps_compliance_org_month ON wps_compliance(organization_id, month);
CREATE INDEX IF NOT EXISTS idx_wps_compliance_status ON wps_compliance(status);;