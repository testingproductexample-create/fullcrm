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
    retention_period_years INTEGER DEFAULT 7, -- UAE business compliance: 7 years
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
-- DOCUMENTS TABLE (Main document metadata)
-- ==============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    
    -- Document identification
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID,
    document_type VARCHAR(100) NOT NULL, -- contract, measurement_sheet, design_approval, employee_contract, invoice, etc.
    
    -- File information
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    file_type VARCHAR(100) NOT NULL, -- PDF, DOCX, XLSX, JPG, PNG, etc.
    mime_type VARCHAR(200) NOT NULL,
    storage_path TEXT NOT NULL, -- Supabase storage path
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'documents',
    file_hash VARCHAR(255), -- SHA-256 hash for integrity verification
    
    -- Version control
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID, -- For versioned documents
    
    -- Related entities (manual references - no foreign keys)
    customer_id UUID,
    employee_id UUID,
    order_id UUID,
    appointment_id UUID,
    invoice_id UUID,
    supplier_id UUID,
    
    -- Document status
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending_approval, approved, rejected, archived, deleted
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, revision_required
    
    -- Compliance and retention
    retention_date DATE, -- When document can be deleted based on retention policy
    is_confidential BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT false,
    encryption_algorithm VARCHAR(50),
    compliance_flags JSONB DEFAULT '[]', -- Array of compliance tags (PDPL, etc.)
    
    -- Access control
    access_level VARCHAR(50) DEFAULT 'private', -- private, internal, public, restricted
    allowed_roles TEXT[], -- Array of roles that can access
    
    -- Metadata and tags
    tags TEXT[], -- Array of tags for search and organization
    metadata JSONB DEFAULT '{}', -- Additional flexible metadata
    
    -- Audit trail
    uploaded_by UUID NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by UUID,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional fields
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
    
    -- Version information
    version_number INTEGER NOT NULL,
    version_label VARCHAR(50), -- e.g., "v1.0", "Draft", "Final"
    
    -- File information
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'documents',
    file_hash VARCHAR(255),
    
    -- Change tracking
    change_summary TEXT,
    change_type VARCHAR(50), -- minor_edit, major_revision, format_change, etc.
    previous_version_id UUID,
    
    -- Version metadata
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
    
    -- Permission target
    permission_type VARCHAR(50) NOT NULL, -- user, role, department, team
    target_user_id UUID,
    target_role VARCHAR(100),
    target_department_id UUID,
    
    -- Access rights
    can_view BOOLEAN DEFAULT false,
    can_download BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    can_comment BOOLEAN DEFAULT false,
    
    -- Permission scope
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
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
    
    -- Template information
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    template_type VARCHAR(100) NOT NULL, -- contract, form, measurement_sheet, letter, etc.
    
    -- Template file
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'document-templates',
    
    -- Template fields (for form filling)
    template_fields JSONB DEFAULT '[]', -- Array of field definitions
    default_values JSONB DEFAULT '{}', -- Default values for fields
    
    -- Usage
    is_system_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
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
    
    -- Approval workflow
    approval_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 1,
    approval_level VARCHAR(50), -- manager, director, legal, finance, etc.
    
    -- Approver information
    approver_id UUID NOT NULL,
    approver_role VARCHAR(100),
    
    -- Approval status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, revision_required
    decision VARCHAR(50), -- approve, reject, revise
    comments TEXT,
    conditions TEXT, -- Any conditions attached to approval
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    responded_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Notification
    notification_sent BOOLEAN DEFAULT false,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
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
    
    -- Action information
    action VARCHAR(100) NOT NULL, -- upload, view, download, edit, delete, share, approve, reject, etc.
    action_category VARCHAR(50), -- access, modification, permission, approval
    action_details JSONB DEFAULT '{}',
    
    -- Actor information
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    user_email VARCHAR(255),
    
    -- Session information
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    geo_location JSONB DEFAULT '{}',
    
    -- Document state
    document_version INTEGER,
    document_status VARCHAR(50),
    before_state JSONB DEFAULT '{}', -- Document state before action
    after_state JSONB DEFAULT '{}', -- Document state after action
    
    -- Compliance
    compliance_event BOOLEAN DEFAULT false,
    retention_required BOOLEAN DEFAULT true,
    
    -- Timestamps
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
    
    -- Share information
    share_type VARCHAR(50) DEFAULT 'link', -- link, email, external
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    
    -- Access control
    can_view BOOLEAN DEFAULT true,
    can_download BOOLEAN DEFAULT false,
    can_comment BOOLEAN DEFAULT false,
    requires_password BOOLEAN DEFAULT false,
    password_hash TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    max_access_count INTEGER,
    access_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revocation_reason TEXT,
    
    -- Audit
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_from INET,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL,
    
    -- Notification
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
    parent_comment_id UUID, -- For threaded comments
    
    -- Comment content
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'general', -- general, review, approval, question, suggestion
    
    -- Comment location (for PDF annotations, etc.)
    page_number INTEGER,
    position_data JSONB DEFAULT '{}', -- {x, y, width, height} for annotations
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    
    -- Metadata
    mentions TEXT[], -- Array of mentioned user IDs
    attachments JSONB DEFAULT '[]', -- Array of attachment references
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Dubai', NOW()),
    created_by UUID NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
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

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number(org_id UUID, doc_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR;
    sequence_num INTEGER;
    doc_number VARCHAR;
BEGIN
    -- Determine prefix based on document type
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
    
    -- Get next sequence number for this org and type
    SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM documents
    WHERE organization_id = org_id 
    AND document_type = doc_type
    AND document_number LIKE prefix || '%';
    
    -- Generate document number: PREFIX-YYYYMMDD-NNNN
    doc_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN doc_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check document access permission
CREATE OR REPLACE FUNCTION check_document_access(doc_id UUID, user_id UUID, permission_type VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := false;
    doc_record RECORD;
BEGIN
    -- Get document details
    SELECT * INTO doc_record FROM documents WHERE id = doc_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if user is document owner
    IF doc_record.uploaded_by = user_id THEN
        RETURN true;
    END IF;
    
    -- Check explicit permissions
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

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Update view/download counts
    IF TG_OP = 'UPDATE' AND OLD.view_count != NEW.view_count THEN
        NEW.last_accessed_at := TIMEZONE('Asia/Dubai', NOW());
        NEW.last_accessed_by := NEW.updated_at; -- This should be set by application
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_document_access
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION log_document_access();

-- Function to update document timestamps
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
    EXECUTE FUNCTION update_document_timestamp();

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE documents IS 'Main document metadata table with UAE PDPL compliance';
COMMENT ON TABLE document_versions IS 'Document version control and history';
COMMENT ON TABLE document_permissions IS 'Role-based access control for documents';
COMMENT ON TABLE document_categories IS 'Hierarchical document categorization';
COMMENT ON TABLE document_templates IS 'Reusable document templates';
COMMENT ON TABLE document_approvals IS 'Document approval workflow management';
COMMENT ON TABLE document_audit_logs IS 'Comprehensive audit trail for compliance';
COMMENT ON TABLE document_shares IS 'External document sharing with security';
COMMENT ON TABLE document_comments IS 'Collaborative document comments and annotations';
COMMENT ON TABLE document_tags IS 'Flexible tagging system for documents';
