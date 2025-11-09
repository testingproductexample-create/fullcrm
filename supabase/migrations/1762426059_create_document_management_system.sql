-- Migration: create_document_management_system
-- Created at: 1762426059

-- Document Management System for UAE Tailoring Business
-- Created: 2025-11-06
-- Purpose: Comprehensive document management with UAE PDPL compliance

-- ==============================================
-- DOCUMENT CATEGORIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    parent_category_id UUID,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    retention_period_years INTEGER DEFAULT 7,
    is_system_category BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID,
    UNIQUE(organization_id, category_code)
);

CREATE INDEX idx_document_categories_org ON document_categories(organization_id);
CREATE INDEX idx_document_categories_parent ON document_categories(parent_category_id);
CREATE INDEX idx_document_categories_active ON document_categories(is_active);

-- ==============================================
-- DOCUMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'documents',
    file_hash VARCHAR(255),
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID,
    customer_id UUID,
    employee_id UUID,
    order_id UUID,
    appointment_id UUID,
    invoice_id UUID,
    supplier_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    approval_status VARCHAR(50) DEFAULT 'pending',
    retention_date DATE,
    is_confidential BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT false,
    encryption_algorithm VARCHAR(50),
    compliance_flags JSONB DEFAULT '[]',
    access_level VARCHAR(50) DEFAULT 'private',
    allowed_roles TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by UUID,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(organization_id, document_number)
);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_order ON documents(order_id);
CREATE INDEX idx_documents_invoice ON documents(invoice_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_documents_metadata ON documents USING gin(metadata);
CREATE INDEX idx_documents_active ON documents(is_active);
CREATE INDEX idx_documents_retention ON documents(retention_date);
CREATE INDEX idx_documents_latest_version ON documents(is_latest_version);

-- ==============================================
-- DOCUMENT VERSIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    version_label VARCHAR(50),
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'documents',
    file_hash VARCHAR(255),
    change_summary TEXT,
    change_type VARCHAR(50),
    previous_version_id UUID,
    is_current BOOLEAN DEFAULT false,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_org ON document_versions(organization_id);
CREATE INDEX idx_document_versions_current ON document_versions(is_current);
CREATE INDEX idx_document_versions_uploaded_by ON document_versions(uploaded_by);

-- ==============================================
-- DOCUMENT PERMISSIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    permission_type VARCHAR(50) NOT NULL,
    target_user_id UUID,
    target_role VARCHAR(100),
    target_department_id UUID,
    can_view BOOLEAN DEFAULT false,
    can_download BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    can_comment BOOLEAN DEFAULT false,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    granted_by UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revocation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW())
);

CREATE INDEX idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON document_permissions(target_user_id);
CREATE INDEX idx_document_permissions_role ON document_permissions(target_role);
CREATE INDEX idx_document_permissions_active ON document_permissions(is_active);
CREATE INDEX idx_document_permissions_org ON document_permissions(organization_id);

-- ==============================================
-- DOCUMENT TEMPLATES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    template_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'document-templates',
    template_fields JSONB DEFAULT '[]',
    default_values JSONB DEFAULT '{}',
    is_system_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL,
    UNIQUE(organization_id, template_code)
);

CREATE INDEX idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX idx_document_templates_category ON document_templates(category_id);
CREATE INDEX idx_document_templates_type ON document_templates(template_type);
CREATE INDEX idx_document_templates_active ON document_templates(is_active);
CREATE INDEX idx_document_templates_tags ON document_templates USING gin(tags);

-- ==============================================
-- DOCUMENT APPROVALS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    approval_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 1,
    approval_level VARCHAR(50),
    approver_id UUID NOT NULL,
    approver_role VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    decision VARCHAR(50),
    comments TEXT,
    conditions TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    responded_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT false,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL
);

CREATE INDEX idx_document_approvals_document ON document_approvals(document_id);
CREATE INDEX idx_document_approvals_approver ON document_approvals(approver_id);
CREATE INDEX idx_document_approvals_status ON document_approvals(status);
CREATE INDEX idx_document_approvals_org ON document_approvals(organization_id);
CREATE INDEX idx_document_approvals_due_date ON document_approvals(due_date);

-- ==============================================
-- DOCUMENT AUDIT LOGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    action_category VARCHAR(50),
    action_details JSONB DEFAULT '{}',
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    geo_location JSONB DEFAULT '{}',
    document_version INTEGER,
    document_status VARCHAR(50),
    before_state JSONB DEFAULT '{}',
    after_state JSONB DEFAULT '{}',
    compliance_event BOOLEAN DEFAULT false,
    retention_required BOOLEAN DEFAULT true,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW())
);

CREATE INDEX idx_document_audit_logs_document ON document_audit_logs(document_id);
CREATE INDEX idx_document_audit_logs_user ON document_audit_logs(user_id);
CREATE INDEX idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX idx_document_audit_logs_timestamp ON document_audit_logs(action_timestamp);
CREATE INDEX idx_document_audit_logs_org ON document_audit_logs(organization_id);
CREATE INDEX idx_document_audit_logs_compliance ON document_audit_logs(compliance_event);

-- ==============================================
-- DOCUMENT SHARES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    share_type VARCHAR(50) DEFAULT 'link',
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    can_view BOOLEAN DEFAULT true,
    can_download BOOLEAN DEFAULT false,
    can_comment BOOLEAN DEFAULT false,
    requires_password BOOLEAN DEFAULT false,
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_access_count INTEGER,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revocation_reason TEXT,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_from INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL,
    notification_sent BOOLEAN DEFAULT false
);

CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_token ON document_shares(share_token);
CREATE INDEX idx_document_shares_active ON document_shares(is_active);
CREATE INDEX idx_document_shares_expires ON document_shares(expires_at);
CREATE INDEX idx_document_shares_org ON document_shares(organization_id);

-- ==============================================
-- DOCUMENT COMMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    parent_comment_id UUID,
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'general',
    page_number INTEGER,
    position_data JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    mentions TEXT[],
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX idx_document_comments_document ON document_comments(document_id);
CREATE INDEX idx_document_comments_parent ON document_comments(parent_comment_id);
CREATE INDEX idx_document_comments_user ON document_comments(created_by);
CREATE INDEX idx_document_comments_org ON document_comments(organization_id);
CREATE INDEX idx_document_comments_resolved ON document_comments(is_resolved);

-- ==============================================
-- DOCUMENT TAGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(50),
    tag_description TEXT,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL,
    UNIQUE(organization_id, tag_name)
);

CREATE INDEX idx_document_tags_org ON document_tags(organization_id);
CREATE INDEX idx_document_tags_active ON document_tags(is_active);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

CREATE OR REPLACE FUNCTION generate_document_number(org_id UUID, doc_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR;
    sequence_num INTEGER;
    doc_number VARCHAR;
BEGIN
    prefix := CASE doc_type
        WHEN 'contract' THEN 'CNT'
        WHEN 'measurement_sheet' THEN 'MES'
        WHEN 'design_approval' THEN 'DES'
        WHEN 'employee_contract' THEN 'EMP'
        WHEN 'invoice' THEN 'INV'
        WHEN 'purchase_order' THEN 'PO'
        WHEN 'quality_report' THEN 'QR'
        ELSE 'DOC'
    END;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM documents
    WHERE organization_id = org_id 
    AND document_type = doc_type
    AND document_number LIKE prefix || '%';
    
    doc_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN doc_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_document_access(doc_id UUID, user_id UUID, permission_type VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := false;
    doc_record RECORD;
BEGIN
    SELECT * INTO doc_record FROM documents WHERE id = doc_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    IF doc_record.uploaded_by = user_id THEN
        RETURN true;
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM document_permissions
        WHERE document_id = doc_id
        AND target_user_id = user_id
        AND is_active = true
        AND (valid_until IS NULL OR valid_until > NOW())
        AND CASE permission_type
            WHEN 'view' THEN can_view
            WHEN 'download' THEN can_download
            WHEN 'edit' THEN can_edit
            WHEN 'delete' THEN can_delete
            WHEN 'share' THEN can_share
            WHEN 'approve' THEN can_approve
            WHEN 'comment' THEN can_comment
            ELSE false
        END
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.view_count != NEW.view_count THEN
        NEW.last_accessed_at := TIMEZONE('Asia/Dubai', NOW());
        NEW.last_accessed_by := NEW.updated_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_document_access
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION log_document_access();

CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('Asia/Dubai', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_timestamp
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

CREATE TRIGGER trigger_update_document_categories_timestamp
    BEFORE UPDATE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();;