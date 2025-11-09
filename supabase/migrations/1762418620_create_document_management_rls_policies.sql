-- Document Management System RLS Policies
-- Created: 2025-11-06
-- Purpose: Multi-tenant security with role-based access control

-- ==============================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================

ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- DOCUMENT CATEGORIES RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view categories in their organization"
    ON document_categories FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Managers can create categories"
    ON document_categories FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "Managers can update categories"
    ON document_categories FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "Managers can delete categories"
    ON document_categories FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
        AND is_system_category = false
    );

-- ==============================================
-- DOCUMENTS RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view documents they have access to"
    ON documents FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            -- Document owner
            uploaded_by = auth.uid()
            -- Public documents
            OR access_level = 'public'
            -- Internal documents for organization members
            OR (access_level = 'internal' AND organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            ))
            -- Explicit permission
            OR EXISTS (
                SELECT 1 FROM document_permissions
                WHERE document_id = documents.id
                AND target_user_id = auth.uid()
                AND can_view = true
                AND is_active = true
                AND (valid_until IS NULL OR valid_until > NOW())
            )
            -- Role-based access
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = ANY(documents.allowed_roles)
            )
        )
    );

CREATE POLICY "Users can upload documents"
    ON documents FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own documents or with permission"
    ON documents FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            uploaded_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM document_permissions
                WHERE document_id = documents.id
                AND target_user_id = auth.uid()
                AND can_edit = true
                AND is_active = true
                AND (valid_until IS NULL OR valid_until > NOW())
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = documents.organization_id
            )
        )
    );

CREATE POLICY "Users can delete their own documents or with permission"
    ON documents FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            uploaded_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM document_permissions
                WHERE document_id = documents.id
                AND target_user_id = auth.uid()
                AND can_delete = true
                AND is_active = true
                AND (valid_until IS NULL OR valid_until > NOW())
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'admin')
                AND organization_id = documents.organization_id
            )
        )
    );

-- ==============================================
-- DOCUMENT VERSIONS RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view versions of documents they can access"
    ON document_versions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_versions.document_id
            AND (
                uploaded_by = auth.uid()
                OR access_level IN ('public', 'internal')
                OR EXISTS (
                    SELECT 1 FROM document_permissions
                    WHERE document_id = documents.id
                    AND target_user_id = auth.uid()
                    AND can_view = true
                    AND is_active = true
                )
            )
        )
    );

CREATE POLICY "Users can create versions for documents they can edit"
    ON document_versions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_versions.document_id
            AND (
                uploaded_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM document_permissions
                    WHERE document_id = documents.id
                    AND target_user_id = auth.uid()
                    AND can_edit = true
                    AND is_active = true
                )
            )
        )
    );

-- ==============================================
-- DOCUMENT PERMISSIONS RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view permissions for documents they own or manage"
    ON document_permissions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            target_user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_permissions.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_permissions.organization_id
            )
        )
    );

CREATE POLICY "Document owners and managers can grant permissions"
    ON document_permissions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_permissions.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_permissions.organization_id
            )
        )
    );

CREATE POLICY "Document owners and managers can update permissions"
    ON document_permissions FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            granted_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_permissions.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_permissions.organization_id
            )
        )
    );

CREATE POLICY "Document owners and managers can revoke permissions"
    ON document_permissions FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            granted_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_permissions.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_permissions.organization_id
            )
        )
    );

-- ==============================================
-- DOCUMENT TEMPLATES RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view templates in their organization"
    ON document_templates FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND is_active = true
    );

CREATE POLICY "Managers can create templates"
    ON document_templates FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "Managers can update templates"
    ON document_templates FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "Managers can delete templates"
    ON document_templates FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
        AND is_system_template = false
    );

-- ==============================================
-- DOCUMENT APPROVALS RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view approvals for documents they can access"
    ON document_approvals FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            approver_id = auth.uid()
            OR created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_approvals.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_approvals.organization_id
            )
        )
    );

CREATE POLICY "Users can create approval requests"
    ON document_approvals FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_approvals.document_id
            AND uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Approvers can update their approval decisions"
    ON document_approvals FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            approver_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_approvals.organization_id
            )
        )
    );

-- ==============================================
-- DOCUMENT AUDIT LOGS RLS POLICIES
-- ==============================================

CREATE POLICY "Managers can view audit logs"
    ON document_audit_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "System can insert audit logs"
    ON document_audit_logs FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- ==============================================
-- DOCUMENT SHARES RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view shares they created"
    ON document_shares FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_shares.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_shares.organization_id
            )
        )
    );

CREATE POLICY "Users can create shares for documents they own or have permission"
    ON document_shares FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_shares.document_id
                AND uploaded_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM document_permissions
                WHERE document_id = document_shares.document_id
                AND target_user_id = auth.uid()
                AND can_share = true
                AND is_active = true
            )
        )
    );

CREATE POLICY "Users can update and revoke their shares"
    ON document_shares FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_shares.document_id
                AND uploaded_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their shares"
    ON document_shares FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM documents
                WHERE documents.id = document_shares.document_id
                AND uploaded_by = auth.uid()
            )
        )
    );

-- ==============================================
-- DOCUMENT COMMENTS RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view comments on documents they can access"
    ON document_comments FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_comments.document_id
            AND (
                uploaded_by = auth.uid()
                OR access_level IN ('public', 'internal')
                OR EXISTS (
                    SELECT 1 FROM document_permissions
                    WHERE document_id = documents.id
                    AND target_user_id = auth.uid()
                    AND can_view = true
                    AND is_active = true
                )
            )
        )
    );

CREATE POLICY "Users can create comments on documents they can access"
    ON document_comments FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_comments.document_id
            AND (
                uploaded_by = auth.uid()
                OR access_level IN ('public', 'internal')
                OR EXISTS (
                    SELECT 1 FROM document_permissions
                    WHERE document_id = documents.id
                    AND target_user_id = auth.uid()
                    AND can_comment = true
                    AND is_active = true
                )
            )
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own comments"
    ON document_comments FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can delete their own comments or managers can delete any"
    ON document_comments FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('owner', 'manager', 'admin')
                AND organization_id = document_comments.organization_id
            )
        )
    );

-- ==============================================
-- DOCUMENT TAGS RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view tags in their organization"
    ON document_tags FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create tags"
    ON document_tags FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Managers can update tags"
    ON document_tags FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );

CREATE POLICY "Managers can delete tags"
    ON document_tags FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'manager', 'admin')
        )
    );
