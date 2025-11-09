-- RBAC Database Schema
-- Complete role-based access control system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    level INTEGER DEFAULT 0, -- Hierarchy level (0 = highest)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- Format: resource:action (e.g., 'billing:read')
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- e.g., 'billing', 'employees', 'appointments'
    action VARCHAR(50) NOT NULL, -- e.g., 'read', 'write', 'delete', 'manage'
    is_system_permission BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Role permissions relationship (many-to-many)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT true, -- true = grant, false = deny
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(role_id, permission_id)
);

-- User roles relationship (many-to-many)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Role hierarchy for inheritance
CREATE TABLE role_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    inherits_permissions BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_role_id, child_role_id)
);

-- User-specific permission overrides
CREATE TABLE user_permission_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL, -- true = grant, false = deny
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    UNIQUE(user_id, permission_id)
);

-- Permission audit log
CREATE TABLE permission_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- NULL for system actions
    action VARCHAR(50) NOT NULL, -- 'assign_role', 'revoke_role', 'grant_permission', 'revoke_permission'
    target_user_id UUID, -- User whose permissions were changed
    target_role_id UUID, -- Role that was assigned/removed
    target_permission_id UUID, -- Permission that was granted/revoked
    old_values JSONB, -- Previous values
    new_values JSONB, -- New values
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Session permission cache
CREATE TABLE user_permission_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    permissions TEXT[] NOT NULL, -- Array of permission names
    roles TEXT[] NOT NULL, -- Array of role names
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_version INTEGER DEFAULT 1
);

-- Create indexes for performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_active ON roles(is_active) WHERE is_active = true;
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX idx_permission_audit_log_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_log_created ON permission_audit_log(created_at);
CREATE INDEX idx_user_permission_cache_expires ON user_permission_cache(expires_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get all user permissions (including inherited)
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT, granted BOOLEAN) AS $$
DECLARE
    user_perms TEXT[];
    role_perms TEXT[];
    override_perms TEXT[];
BEGIN
    -- Get direct user permissions from role assignments
    SELECT array_agg(DISTINCT p.name)
    INTO role_perms
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND rp.is_granted = true
    AND p.is_active = true;
    
    -- Get user-specific permission overrides
    SELECT array_agg(DISTINCT 
        CASE 
            WHEN upo.is_granted THEN p.name
            ELSE NULL
        END
    )
    INTO override_perms
    FROM user_permission_overrides upo
    JOIN permissions p ON upo.permission_id = p.id
    WHERE upo.user_id = user_uuid
    AND (upo.expires_at IS NULL OR upo.expires_at > NOW())
    AND p.is_active = true;
    
    -- Combine and return permissions
    RETURN QUERY
    SELECT unnest(role_perms) as permission_name, true as granted
    WHERE unnest(role_perms) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM get_user_permissions(user_uuid) 
        WHERE permission_name = get_user_permissions.permission_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, role_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.id
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND r.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user permission cache
CREATE OR REPLACE FUNCTION clear_user_permission_cache(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM user_permission_cache WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default admin role
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS UUID AS $$
DECLARE
    admin_role_id UUID;
    super_admin_role_id UUID;
    all_permissions CURSOR FOR SELECT name FROM permissions WHERE is_active = true;
    perm_name TEXT;
BEGIN
    -- Create Super Admin role
    INSERT INTO roles (name, display_name, description, is_system_role, level)
    VALUES (
        'super_admin',
        'Super Administrator',
        'Full system access with all permissions',
        true,
        0
    ) RETURNING id INTO super_admin_role_id;
    
    -- Create System Admin role
    INSERT INTO roles (name, display_name, description, is_system_role, level)
    VALUES (
        'system_admin',
        'System Administrator',
        'System administration and management',
        true,
        1
    ) RETURNING id INTO admin_role_id;
    
    -- Grant all permissions to Super Admin
    OPEN all_permissions;
    LOOP
        FETCH all_permissions INTO perm_name;
        EXIT WHEN NOT FOUND;
        
        INSERT INTO role_permissions (role_id, permission_id, is_granted)
        SELECT super_admin_role_id, id, true
        FROM permissions
        WHERE name = perm_name;
    END LOOP;
    CLOSE all_permissions;
    
    -- Set hierarchy: System Admin inherits from Super Admin
    INSERT INTO role_hierarchy (parent_role_id, child_role_id)
    VALUES (super_admin_role_id, admin_role_id);
    
    RETURN super_admin_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE roles IS 'Defines available roles in the system';
COMMENT ON TABLE permissions IS 'Defines all available permissions (resource:action format)';
COMMENT ON TABLE role_permissions IS 'Maps roles to their granted/denied permissions';
COMMENT ON TABLE user_roles IS 'Assigns roles to users with optional expiration';
COMMENT ON TABLE role_hierarchy IS 'Defines role inheritance relationships';
COMMENT ON TABLE user_permission_overrides IS 'User-specific permission overrides';
COMMENT ON TABLE permission_audit_log IS 'Logs all permission and role changes';
COMMENT ON TABLE user_permission_cache IS 'Cached user permissions for performance';

COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Returns all permissions for a user including inherited permissions';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Checks if a user has a specific permission';
COMMENT ON FUNCTION get_user_roles(UUID) IS 'Returns all active roles assigned to a user';
COMMENT ON FUNCTION create_default_admin() IS 'Creates default admin roles with all permissions';
