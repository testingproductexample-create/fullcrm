-- RBAC Row Level Security (RLS) Policies
-- Database-level access control for all RBAC tables

-- Enable RLS on all RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_cache ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's ID
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION auth.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_perms TEXT[];
BEGIN
    -- Get cached permissions if available and not expired
    SELECT permissions INTO user_perms
    FROM user_permission_cache
    WHERE user_id = auth.current_user_id()
    AND expires_at > NOW();
    
    -- If cache is empty or expired, calculate from database
    IF user_perms IS NULL OR array_length(user_perms, 1) = 0 THEN
        SELECT array_agg(p.name) INTO user_perms
        FROM get_user_permissions(auth.current_user_id()) p;
        
        -- Update cache
        INSERT INTO user_permission_cache (user_id, permissions, roles, expires_at)
        VALUES (
            auth.current_user_id(),
            user_perms,
            (SELECT array_agg(role_name) FROM get_user_roles(auth.current_user_id())),
            NOW() + INTERVAL '1 hour'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            permissions = EXCLUDED.permissions,
            roles = EXCLUDED.roles,
            expires_at = EXCLUDED.expires_at,
            last_updated = NOW();
    END IF;
    
    -- Check if user has the permission
    RETURN permission_name = ANY(user_perms);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION auth.has_any_permission(permission_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    user_perms TEXT[];
    perm_name TEXT;
BEGIN
    -- Get cached permissions if available and not expired
    SELECT permissions INTO user_perms
    FROM user_permission_cache
    WHERE user_id = auth.current_user_id()
    AND expires_at > NOW();
    
    -- If cache is empty or expired, calculate from database
    IF user_perms IS NULL OR array_length(user_perms, 1) = 0 THEN
        SELECT array_agg(p.name) INTO user_perms
        FROM get_user_permissions(auth.current_user_id()) p;
        
        -- Update cache
        INSERT INTO user_permission_cache (user_id, permissions, roles, expires_at)
        VALUES (
            auth.current_user_id(),
            user_perms,
            (SELECT array_agg(role_name) FROM get_user_roles(auth.current_user_id())),
            NOW() + INTERVAL '1 hour'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            permissions = EXCLUDED.permissions,
            roles = EXCLUDED.roles,
            expires_at = EXCLUDED.expires_at,
            last_updated = NOW();
    END IF;
    
    -- Check if user has any of the permissions
    FOREACH perm_name IN ARRAY permission_names LOOP
        IF perm_name = ANY(user_perms) THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role names
CREATE OR REPLACE FUNCTION auth.user_roles()
RETURNS TEXT[] AS $$
DECLARE
    user_roles_arr TEXT[];
BEGIN
    SELECT roles INTO user_roles_arr
    FROM user_permission_cache
    WHERE user_id = auth.current_user_id()
    AND expires_at > NOW();
    
    -- If cache is empty or expired, get from database
    IF user_roles_arr IS NULL OR array_length(user_roles_arr, 1) = 0 THEN
        SELECT array_agg(role_name) INTO user_roles_arr
        FROM get_user_roles(auth.current_user_id());
    END IF;
    
    RETURN COALESCE(user_roles_arr, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 'super_admin' = ANY(auth.user_roles()) OR 
           'system_admin' = ANY(auth.user_roles());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RLS POLICIES FOR ROLES TABLE
-- ==========================================

-- Policy: Users can view roles if they have users:read or system:read permission
CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT USING (
        auth.is_admin() OR 
        auth.has_permission('users:read') OR 
        auth.has_permission('system:read')
    );

-- Policy: Only admins can modify roles
CREATE POLICY "roles_modify_policy" ON roles
    FOR ALL USING (auth.is_admin());

-- ==========================================
-- RLS POLICIES FOR PERMISSIONS TABLE
-- ==========================================

-- Policy: Users can view permissions if they have users:read or system:read permission
CREATE POLICY "permissions_select_policy" ON permissions
    FOR SELECT USING (
        auth.is_admin() OR 
        auth.has_permission('users:read') OR 
        auth.has_permission('system:read')
    );

-- Policy: Only admins can modify permissions
CREATE POLICY "permissions_modify_policy" ON permissions
    FOR ALL USING (auth.is_admin());

-- ==========================================
-- RLS POLICIES FOR ROLE_PERMISSIONS TABLE
-- ==========================================

-- Policy: Users can view role permissions if they have users:read or system:read permission
CREATE POLICY "role_permissions_select_policy" ON role_permissions
    FOR SELECT USING (
        auth.is_admin() OR 
        auth.has_permission('users:read') OR 
        auth.has_permission('system:read')
    );

-- Policy: Only admins can modify role permissions
CREATE POLICY "role_permissions_modify_policy" ON role_permissions
    FOR ALL USING (auth.is_admin());

-- ==========================================
-- RLS POLICIES FOR USER_ROLES TABLE
-- ==========================================

-- Policy: Users can view their own roles
CREATE POLICY "user_roles_select_own_policy" ON user_roles
    FOR SELECT USING (
        auth.current_user_id() = user_id OR
        auth.is_admin() OR 
        auth.has_permission('users:read')
    );

-- Policy: Only admins or users with users:permissions can modify user roles
CREATE POLICY "user_roles_modify_policy" ON user_roles
    FOR ALL USING (
        auth.is_admin() OR 
        auth.has_permission('users:permissions')
    );

-- ==========================================
-- RLS POLICIES FOR ROLE_HIERARCHY TABLE
-- ==========================================

-- Policy: Users can view role hierarchy if they have users:read or system:read permission
CREATE POLICY "role_hierarchy_select_policy" ON role_hierarchy
    FOR SELECT USING (
        auth.is_admin() OR 
        auth.has_permission('users:read') OR 
        auth.has_permission('system:read')
    );

-- Policy: Only admins can modify role hierarchy
CREATE POLICY "role_hierarchy_modify_policy" ON role_hierarchy
    FOR ALL USING (auth.is_admin());

-- ==========================================
-- RLS POLICIES FOR USER_PERMISSION_OVERRIDES TABLE
-- ==========================================

-- Policy: Users can view their own permission overrides
CREATE POLICY "user_permission_overrides_select_own_policy" ON user_permission_overrides
    FOR SELECT USING (
        auth.current_user_id() = user_id OR
        auth.is_admin() OR 
        auth.has_permission('users:permissions')
    );

-- Policy: Only admins or users with users:permissions can modify permission overrides
CREATE POLICY "user_permission_overrides_modify_policy" ON user_permission_overrides
    FOR ALL USING (
        auth.is_admin() OR 
        auth.has_permission('users:permissions')
    );

-- ==========================================
-- RLS POLICIES FOR PERMISSION_AUDIT_LOG TABLE
-- ==========================================

-- Policy: Users can view audit log if they have audit:read or system:read permission
CREATE POLICY "permission_audit_log_select_policy" ON permission_audit_log
    FOR SELECT USING (
        auth.is_admin() OR 
        auth.has_permission('audit:read') OR 
        auth.has_permission('system:read')
    );

-- Policy: Only system can insert audit log entries
CREATE POLICY "permission_audit_log_insert_policy" ON permission_audit_log
    FOR INSERT WITH CHECK (true); -- Allow all authenticated users to create audit entries

-- Policy: Only admins can modify audit log
CREATE POLICY "permission_audit_log_modify_policy" ON permission_audit_log
    FOR ALL USING (
        auth.is_admin() OR 
        auth.has_permission('audit:manage')
    );

-- ==========================================
-- RLS POLICIES FOR USER_PERMISSION_CACHE TABLE
-- ==========================================

-- Policy: Users can only access their own permission cache
CREATE POLICY "user_permission_cache_policy" ON user_permission_cache
    FOR ALL USING (auth.current_user_id() = user_id);

-- ==========================================
-- RLS POLICIES FOR MAIN APPLICATION TABLES
-- ==========================================

-- These policies should be added to existing tables for comprehensive access control

-- Customers table RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_access_policy" ON customers
    FOR ALL USING (
        -- Admins can access everything
        auth.is_admin() OR
        -- Users with customer management permissions
        auth.has_any_permission(ARRAY['customers:read', 'customers:write', 'customers:manage']) OR
        -- Users can view their own customer data
        auth.current_user_id() = customer_id
    );

-- Employees table RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_access_policy" ON employees
    FOR ALL USING (
        -- Admins can access everything
        auth.is_admin() OR
        -- Users with employee management permissions
        auth.has_any_permission(ARRAY['employees:read', 'employees:write', 'employees:manage']) OR
        -- Users can view their own employee data
        auth.current_user_id() = employee_id OR
        -- HR managers have extended access
        ('hr_manager' = ANY(auth.user_roles()))
    );

-- Appointments table RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_access_policy" ON appointments
    FOR ALL USING (
        -- Admins can access everything
        auth.is_admin() OR
        -- Users with appointment management permissions
        auth.has_any_permission(ARRAY['appointments:read', 'appointments:write', 'appointments:manage']) OR
        -- Users can view their own appointments
        auth.current_user_id() = customer_id OR
        auth.current_user_id() = assigned_employee_id
    );

-- Orders table RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_access_policy" ON orders
    FOR ALL USING (
        -- Admins can access everything
        auth.is_admin() OR
        -- Users with order management permissions
        auth.has_any_permission(ARRAY['orders:read', 'orders:write', 'orders:manage']) OR
        -- Users can view their own orders
        auth.current_user_id() = customer_id
    );

-- Financial data RLS (for tables like invoices, transactions, etc.)
CREATE POLICY "financial_access_policy" ON ANY financial_table
    FOR ALL USING (
        -- Admins can access everything
        auth.is_admin() OR
        -- Finance managers and accountants
        ('finance_manager' = ANY(auth.user_roles()) OR 'accountant' = ANY(auth.user_roles())) OR
        -- Users with finance permissions
        auth.has_any_permission(ARRAY['finance:read', 'finance:write', 'finance:manage']) OR
        -- Users can view their own financial data
        auth.current_user_id() = customer_id
    );

-- Document access RLS
CREATE POLICY "documents_access_policy" ON documents
    FOR ALL USING (
        -- Admins can access everything
        auth.is_admin() OR
        -- Users with document permissions
        auth.has_any_permission(ARRAY['documents:read', 'documents:write', 'documents:manage']) OR
        -- Document owners can access their own documents
        auth.current_user_id() = owner_id OR
        -- Shared documents
        auth.current_user_id() = ANY(shared_with)
    );

-- ==========================================
-- HELPER FUNCTIONS FOR COMMON ACCESS PATTERNS
-- ==========================================

-- Function to check access to specific resource types
CREATE OR REPLACE FUNCTION auth.can_access_resource(resource_type TEXT, action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    required_permission TEXT;
BEGIN
    required_permission := resource_type || ':' || action;
    RETURN auth.has_permission(required_permission);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action on own data
CREATE OR REPLACE FUNCTION auth.can_access_own_data(resource_type TEXT, action TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Users can always access their own data for read actions
    IF action = 'read' AND auth.current_user_id() = user_id THEN
        RETURN true;
    END IF;
    
    -- Check permission for other actions
    RETURN auth.can_access_resource(resource_type, action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's permission level for a resource
CREATE OR REPLACE FUNCTION auth.get_permission_level(resource_type TEXT)
RETURNS TEXT AS $$
DECLARE
    read_perm TEXT := resource_type || ':read';
    write_perm TEXT := resource_type || ':write';
    manage_perm TEXT := resource_type || ':manage';
BEGIN
    IF auth.has_permission(manage_perm) THEN
        RETURN 'manage';
    ELSIF auth.has_permission(write_perm) THEN
        RETURN 'write';
    ELSIF auth.has_permission(read_perm) THEN
        RETURN 'read';
    ELSE
        RETURN 'none';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- AUDIT TRIGGERS
-- ==========================================

-- Function to log permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log to audit table
    IF TG_OP = 'INSERT' THEN
        INSERT INTO permission_audit_log (
            action,
            target_user_id,
            target_role_id,
            new_values,
            created_by
        ) VALUES (
            'assign_role',
            NEW.user_id,
            NEW.role_id,
            jsonb_build_object('role_id', NEW.role_id, 'assigned_at', NEW.assigned_at),
            auth.current_user_id()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_audit_log (
            action,
            target_user_id,
            target_role_id,
            old_values,
            created_by
        ) VALUES (
            'revoke_role',
            OLD.user_id,
            OLD.role_id,
            jsonb_build_object('role_id', OLD.role_id, 'assigned_at', OLD.assigned_at),
            auth.current_user_id()
        );
    END IF;
    
    -- Clear permission cache for affected users
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        PERFORM clear_user_permission_cache(COALESCE(NEW.user_id, OLD.user_id));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION log_permission_change();

CREATE TRIGGER audit_user_permission_override_changes
    AFTER INSERT OR DELETE ON user_permission_overrides
    FOR EACH ROW EXECUTE FUNCTION log_permission_change();

-- ==========================================
-- PERFORMANCE OPTIMIZATIONS
-- ==========================================

-- Create a view for quick permission checking
CREATE OR REPLACE VIEW user_permission_summary AS
SELECT 
    u.id as user_id,
    u.email,
    array_agg(DISTINCT r.name) as roles,
    array_agg(DISTINCT p.name) as permissions
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_granted = true
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.id IS NOT NULL
GROUP BY u.id, u.email;

-- Create indexes for RLS performance
CREATE INDEX idx_user_roles_composite_rls ON user_roles(user_id, role_id, is_active);
CREATE INDEX idx_user_permission_overrides_composite ON user_permission_overrides(user_id, permission_id);
CREATE INDEX idx_permission_audit_log_composite ON permission_audit_log(created_at, action, user_id);

-- Comments for documentation
COMMENT ON FUNCTION auth.has_permission(TEXT) IS 'Checks if current user has specific permission (cached for performance)';
COMMENT ON FUNCTION auth.has_any_permission(TEXT[]) IS 'Checks if current user has any of the specified permissions';
COMMENT ON FUNCTION auth.user_roles() IS 'Returns array of role names for current user';
COMMENT ON FUNCTION auth.is_admin() IS 'Returns true if current user is an admin';
COMMENT ON FUNCTION auth.can_access_resource(TEXT, TEXT) IS 'Checks if current user can perform action on resource type';
COMMENT ON FUNCTION auth.get_permission_level(TEXT) IS 'Returns permission level (manage/write/read/none) for resource type';
