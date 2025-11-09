-- RBAC Seed Data
-- Default roles, permissions, and assignments for all 23+ systems

-- Insert all permissions for 23+ systems
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
-- Dashboard permissions
('dashboard:read', 'View Dashboard', 'Can view dashboard and overview', 'dashboard', 'read'),
('dashboard:write', 'Modify Dashboard', 'Can modify dashboard settings', 'dashboard', 'write'),
('dashboard:manage', 'Manage Dashboard', 'Can manage dashboard configuration', 'dashboard', 'manage'),

-- Appointments permissions
('appointments:read', 'View Appointments', 'Can view appointment listings and details', 'appointments', 'read'),
('appointments:write', 'Create/Edit Appointments', 'Can create and edit appointments', 'appointments', 'write'),
('appointments:delete', 'Delete Appointments', 'Can delete appointments', 'appointments', 'delete'),
('appointments:manage', 'Manage Appointments', 'Can manage appointment settings and resources', 'appointments', 'manage'),
('appointments:schedule', 'Schedule Appointments', 'Can schedule new appointments', 'appointments', 'schedule'),
('appointments:cancel', 'Cancel Appointments', 'Can cancel appointments', 'appointments', 'cancel'),
('appointments:reschedule', 'Reschedule Appointments', 'Can reschedule appointments', 'appointments', 'reschedule'),
('appointments:availability', 'Manage Availability', 'Can manage appointment availability', 'appointments', 'availability'),

-- Billing permissions
('billing:read', 'View Billing', 'Can view billing information', 'billing', 'read'),
('billing:write', 'Edit Billing', 'Can create and edit billing entries', 'billing', 'write'),
('billing:delete', 'Delete Billing', 'Can delete billing entries', 'billing', 'delete'),
('billing:manage', 'Manage Billing', 'Can manage billing settings and configurations', 'billing', 'manage'),
('billing:invoices', 'Manage Invoices', 'Can create and manage invoices', 'billing', 'invoices'),
('billing:payments', 'Process Payments', 'Can process payments', 'billing', 'payments'),
('billing:refunds', 'Process Refunds', 'Can process refunds', 'billing', 'refunds'),
('billing:reports', 'View Financial Reports', 'Can view financial reports', 'billing', 'reports'),
('billing:export', 'Export Billing Data', 'Can export billing data', 'billing', 'export'),

-- Communication permissions
('communication:read', 'View Communications', 'Can view customer communications', 'communication', 'read'),
('communication:write', 'Send Communications', 'Can send communications to customers', 'communication', 'write'),
('communication:manage', 'Manage Communication Settings', 'Can manage communication templates and settings', 'communication', 'manage'),
('communication:email', 'Email Management', 'Can send and manage emails', 'communication', 'email'),
('communication:sms', 'SMS Management', 'Can send and manage SMS', 'communication', 'sms'),
('communication:whatsapp', 'WhatsApp Management', 'Can send and manage WhatsApp messages', 'communication', 'whatsapp'),
('communication:video', 'Video Communication', 'Can conduct video calls', 'communication', 'video'),
('communication:bulk', 'Bulk Communication', 'Can send bulk communications', 'communication', 'bulk'),
('communication:templates', 'Manage Templates', 'Can manage communication templates', 'communication', 'templates'),

-- Compliance permissions
('compliance:read', 'View Compliance', 'Can view compliance information', 'compliance', 'read'),
('compliance:write', 'Update Compliance', 'Can update compliance records', 'compliance', 'write'),
('compliance:manage', 'Manage Compliance', 'Can manage compliance processes', 'compliance', 'manage'),
('compliance:audit', 'Audit Management', 'Can conduct compliance audits', 'compliance', 'audit'),
('compliance:regulatory', 'Regulatory Management', 'Can manage regulatory requirements', 'compliance', 'regulatory'),
('compliance:reports', 'Compliance Reports', 'Can generate compliance reports', 'compliance', 'reports'),
('compliance:violations', 'Manage Violations', 'Can manage compliance violations', 'compliance', 'violations'),

-- Customers permissions
('customers:read', 'View Customers', 'Can view customer information', 'customers', 'read'),
('customers:write', 'Edit Customers', 'Can create and edit customer records', 'customers', 'write'),
('customers:delete', 'Delete Customers', 'Can delete customer records', 'customers', 'delete'),
('customers:manage', 'Manage Customers', 'Can manage customer settings and segmentation', 'customers', 'manage'),
('customers:profile', 'Manage Customer Profiles', 'Can manage detailed customer profiles', 'customers', 'profile'),
('customers:segments', 'Manage Customer Segments', 'Can manage customer segmentation', 'customers', 'segments'),
('customers:preferences', 'Manage Preferences', 'Can manage customer preferences', 'customers', 'preferences'),
('customers:notes', 'Customer Notes', 'Can view and manage customer notes', 'customers', 'notes'),
('customers:loyalty', 'Loyalty Management', 'Can manage customer loyalty programs', 'customers', 'loyalty'),

-- Designs permissions
('designs:read', 'View Designs', 'Can view design catalog', 'designs', 'read'),
('designs:write', 'Create/Edit Designs', 'Can create and edit designs', 'designs', 'write'),
('designs:delete', 'Delete Designs', 'Can delete designs', 'designs', 'delete'),
('designs:manage', 'Manage Designs', 'Can manage design catalog and categories', 'designs', 'manage'),
('designs:approval', 'Design Approvals', 'Can approve or reject designs', 'designs', 'approval'),
('designs:variants', 'Manage Variants', 'Can manage design variants', 'designs', 'variants'),
('designs:media', 'Manage Media', 'Can manage design media files', 'designs', 'media'),
('designs:browse', 'Browse Designs', 'Can browse design catalog', 'designs', 'browse'),
('designs:fabrics', 'Manage Fabrics', 'Can manage fabric selections', 'designs', 'fabrics'),

-- Documents permissions
('documents:read', 'View Documents', 'Can view documents', 'documents', 'read'),
('documents:write', 'Create/Edit Documents', 'Can create and edit documents', 'documents', 'write'),
('documents:delete', 'Delete Documents', 'Can delete documents', 'documents', 'delete'),
('documents:manage', 'Manage Documents', 'Can manage document settings and permissions', 'documents', 'manage'),
('documents:upload', 'Upload Documents', 'Can upload documents', 'documents', 'upload'),
('documents:share', 'Share Documents', 'Can share documents with others', 'documents', 'share'),
('documents:templates', 'Manage Templates', 'Can manage document templates', 'documents', 'templates'),
('documents:categories', 'Manage Categories', 'Can manage document categories', 'documents', 'categories'),
('documents:approvals', 'Document Approvals', 'Can approve or reject documents', 'documents', 'approvals'),

-- Employees permissions
('employees:read', 'View Employees', 'Can view employee information', 'employees', 'read'),
('employees:write', 'Edit Employees', 'Can create and edit employee records', 'employees', 'write'),
('employees:delete', 'Delete Employees', 'Can delete employee records', 'employees', 'delete'),
('employees:manage', 'Manage Employees', 'Can manage employee settings and departments', 'employees', 'manage'),
('employees:directory', 'Employee Directory', 'Can view employee directory', 'employees', 'directory'),
('employees:profile', 'Employee Profiles', 'Can manage detailed employee profiles', 'employees', 'profile'),
('employees:skills', 'Manage Skills', 'Can manage employee skills and certifications', 'employees', 'skills'),
('employees:training', 'Training Management', 'Can manage training programs', 'employees', 'training'),
('employees:reviews', 'Performance Reviews', 'Can conduct performance reviews', 'employees', 'reviews'),
('employees:emergency', 'Emergency Contacts', 'Can manage emergency contacts', 'employees', 'emergency'),

-- Finance permissions
('finance:read', 'View Finance', 'Can view financial information', 'finance', 'read'),
('finance:write', 'Edit Finance', 'Can create and edit financial entries', 'finance', 'write'),
('finance:delete', 'Delete Finance', 'Can delete financial entries', 'finance', 'delete'),
('finance:manage', 'Manage Finance', 'Can manage financial settings and processes', 'finance', 'manage'),
('finance:budgets', 'Budget Management', 'Can manage budgets', 'finance', 'budgets'),
('finance:expenses', 'Expense Management', 'Can manage expenses', 'finance', 'expenses'),
('finance:revenue', 'Revenue Management', 'Can manage revenue tracking', 'finance', 'revenue'),
('finance:transactions', 'Transaction Management', 'Can manage financial transactions', 'finance', 'transactions'),
('finance:reports', 'Financial Reports', 'Can generate financial reports', 'finance', 'reports'),

-- Measurements permissions
('measurements:read', 'View Measurements', 'Can view customer measurements', 'measurements', 'read'),
('measurements:write', 'Edit Measurements', 'Can create and edit measurements', 'measurements', 'write'),
('measurements:delete', 'Delete Measurements', 'Can delete measurements', 'measurements', 'delete'),
('measurements:manage', 'Manage Measurements', 'Can manage measurement settings', 'measurements', 'manage'),
('measurements:fitting', 'Fitting Management', 'Can manage fitting sessions', 'measurements', 'fitting'),
('measurements:alterations', 'Alteration Requests', 'Can manage alteration requests', 'measurements', 'alterations'),
('measurements:photos', 'Fitting Photos', 'Can manage fitting photos', 'measurements', 'photos'),
('measurements:notes', 'Fitting Notes', 'Can manage fitting notes', 'measurements', 'notes'),

-- Orders permissions
('orders:read', 'View Orders', 'Can view order information', 'orders', 'read'),
('orders:write', 'Edit Orders', 'Can create and edit orders', 'orders', 'write'),
('orders:delete', 'Delete Orders', 'Can delete orders', 'orders', 'delete'),
('orders:manage', 'Manage Orders', 'Can manage order settings and workflows', 'orders', 'manage'),
('orders:create', 'Create Orders', 'Can create new orders', 'orders', 'create'),
('orders:status', 'Update Order Status', 'Can update order status', 'orders', 'status'),
('orders:templates', 'Order Templates', 'Can manage order templates', 'orders', 'templates'),

-- Payroll permissions
('payroll:read', 'View Payroll', 'Can view payroll information', 'payroll', 'read'),
('payroll:write', 'Edit Payroll', 'Can create and edit payroll entries', 'payroll', 'write'),
('payroll:delete', 'Delete Payroll', 'Can delete payroll entries', 'payroll', 'delete'),
('payroll:manage', 'Manage Payroll', 'Can manage payroll settings and processes', 'payroll', 'manage'),
('payroll:processing', 'Payroll Processing', 'Can process payroll', 'payroll', 'processing'),
('payroll:calculations', 'Payroll Calculations', 'Can perform payroll calculations', 'payroll', 'calculations'),
('payroll:commissions', 'Commission Management', 'Can manage commissions', 'payroll', 'commissions'),
('payroll:structures', 'Payroll Structures', 'Can manage payroll structures', 'payroll', 'structures'),
('payroll:payslips', 'Payslip Management', 'Can manage payslips', 'payroll', 'payslips'),

-- Security permissions
('security:read', 'View Security', 'Can view security information', 'security', 'read'),
('security:write', 'Update Security', 'Can update security settings', 'security', 'write'),
('security:manage', 'Manage Security', 'Can manage security policies', 'security', 'manage'),
('security:authentication', 'Authentication Management', 'Can manage authentication settings', 'security', 'authentication'),
('security:monitoring', 'Security Monitoring', 'Can monitor security events', 'security', 'monitoring'),
('security:compliance', 'Security Compliance', 'Can manage security compliance', 'security', 'compliance'),

-- Visa Compliance permissions
('visa_compliance:read', 'View Visa Compliance', 'Can view visa compliance information', 'visa_compliance', 'read'),
('visa_compliance:write', 'Edit Visa Compliance', 'Can update visa compliance records', 'visa_compliance', 'write'),
('visa_compliance:manage', 'Manage Visa Compliance', 'Can manage visa compliance processes', 'visa_compliance', 'manage'),
('visa_compliance:visas', 'Visa Management', 'Can manage visa applications and renewals', 'visa_compliance', 'visas'),
('visa_compliance:violations', 'Visa Violations', 'Can manage visa violations', 'visa_compliance', 'violations'),
('visa_compliance:wps', 'WPS Management', 'Can manage WPS compliance', 'visa_compliance', 'wps'),
('visa_compliance:regulatory', 'Regulatory Updates', 'Can manage regulatory updates', 'visa_compliance', 'regulatory'),

-- Workflow permissions
('workflow:read', 'View Workflows', 'Can view workflow information', 'workflow', 'read'),
('workflow:write', 'Edit Workflows', 'Can create and edit workflows', 'workflow', 'write'),
('workflow:delete', 'Delete Workflows', 'Can delete workflows', 'workflow', 'delete'),
('workflow:manage', 'Manage Workflows', 'Can manage workflow settings and automation', 'workflow', 'manage'),
('workflow:templates', 'Workflow Templates', 'Can manage workflow templates', 'workflow', 'templates'),
('workflow:analytics', 'Workflow Analytics', 'Can view workflow analytics', 'workflow', 'analytics'),
('workflow:automation', 'Process Automation', 'Can manage process automation', 'workflow', 'automation'),

-- Workload permissions
('workload:read', 'View Workload', 'Can view workload information', 'workload', 'read'),
('workload:write', 'Edit Workload', 'Can update workload assignments', 'workload', 'write'),
('workload:manage', 'Manage Workload', 'Can manage workload distribution', 'workload', 'manage'),
('workload:assignments', 'Task Assignments', 'Can assign tasks and workloads', 'workload', 'assignments'),
('workload:monitoring', 'Workload Monitoring', 'Can monitor workload metrics', 'workload', 'monitoring'),

-- Analytics permissions
('analytics:read', 'View Analytics', 'Can view analytics and reports', 'analytics', 'read'),
('analytics:write', 'Edit Analytics', 'Can create and edit reports', 'analytics', 'write'),
('analytics:manage', 'Manage Analytics', 'Can manage analytics settings', 'analytics', 'manage'),
('analytics:export', 'Export Analytics', 'Can export analytics data', 'analytics', 'export'),
('analytics:dashboards', 'Analytics Dashboards', 'Can create analytics dashboards', 'analytics', 'dashboards'),

-- Mobile permissions
('mobile:read', 'Mobile Access', 'Can access mobile features', 'mobile', 'read'),
('mobile:write', 'Mobile Operations', 'Can perform mobile operations', 'mobile', 'write'),
('mobile:manage', 'Manage Mobile', 'Can manage mobile app settings', 'mobile', 'manage'),
('mobile:offline', 'Offline Mode', 'Can use offline functionality', 'mobile', 'offline'),

-- Offline permissions
('offline:read', 'Offline Access', 'Can access offline features', 'offline', 'read'),
('offline:sync', 'Data Sync', 'Can sync offline data', 'offline', 'sync'),
('offline:manage', 'Manage Offline', 'Can manage offline settings', 'offline', 'manage'),

-- User Management permissions
('users:read', 'View Users', 'Can view user information', 'users', 'read'),
('users:write', 'Edit Users', 'Can create and edit users', 'users', 'write'),
('users:delete', 'Delete Users', 'Can delete users', 'users', 'delete'),
('users:manage', 'Manage Users', 'Can manage user settings and permissions', 'users', 'manage'),
('users:roles', 'Role Management', 'Can assign and manage user roles', 'users', 'roles'),
('users:permissions', 'Permission Management', 'Can manage user permissions', 'users', 'permissions'),

-- System Settings permissions
('system:read', 'View System Settings', 'Can view system settings', 'system', 'read'),
('system:write', 'Edit System Settings', 'Can edit system settings', 'system', 'write'),
('system:manage', 'Manage System', 'Can manage system configuration', 'system', 'manage'),
('system:backup', 'System Backup', 'Can perform system backups', 'system', 'backup'),
('system:restore', 'System Restore', 'Can restore system data', 'system', 'restore'),
('system:maintenance', 'System Maintenance', 'Can perform system maintenance', 'system', 'maintenance'),

-- Audit & Logging permissions
('audit:read', 'View Audit Logs', 'Can view audit logs', 'audit', 'read'),
('audit:manage', 'Manage Audit', 'Can manage audit settings', 'audit', 'manage'),
('audit:export', 'Export Audit Logs', 'Can export audit logs', 'audit', 'export'),
('audit:reports', 'Audit Reports', 'Can generate audit reports', 'audit', 'reports'),
('logging:read', 'View System Logs', 'Can view system logs', 'logging', 'read'),
('logging:manage', 'Manage Logging', 'Can manage logging settings', 'logging', 'manage');

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system_role, level) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true, 0),
('system_admin', 'System Administrator', 'System administration and management', true, 1),
('operations_manager', 'Operations Manager', 'Day-to-day operations management', true, 2),
('hr_manager', 'HR Manager', 'Human resources management', true, 2),
('finance_manager', 'Finance Manager', 'Financial operations management', true, 2),
('sales_manager', 'Sales Manager', 'Sales and customer management', true, 2),
('designer', 'Designer', 'Design and creative work', true, 3),
('customer_service', 'Customer Service', 'Customer support and service', true, 3),
('accountant', 'Accountant', 'Financial and accounting tasks', true, 3),
('compliance_officer', 'Compliance Officer', 'Compliance and legal oversight', true, 3),
('department_manager', 'Department Manager', 'Department-level management', true, 4),
('team_lead', 'Team Lead', 'Team supervision and coordination', true, 4),
('employee', 'Employee', 'Standard employee access', true, 5),
('customer', 'Customer', 'Customer portal access', true, 6),
('viewer', 'Viewer', 'Read-only access', true, 7);

-- Create role hierarchy relationships
INSERT INTO role_hierarchy (parent_role_id, child_role_id) VALUES
-- Super Admin hierarchy
((SELECT id FROM roles WHERE name = 'super_admin'), (SELECT id FROM roles WHERE name = 'system_admin')),

-- System Admin hierarchy
((SELECT id FROM roles WHERE name = 'system_admin'), (SELECT id FROM roles WHERE name = 'operations_manager')),
((SELECT id FROM roles WHERE name = 'system_admin'), (SELECT id FROM roles WHERE name = 'hr_manager')),
((SELECT id FROM roles WHERE name = 'system_admin'), (SELECT id FROM roles WHERE name = 'finance_manager')),
((SELECT id FROM roles WHERE name = 'system_admin'), (SELECT id FROM roles WHERE name = 'sales_manager')),

-- Operations Manager hierarchy
((SELECT id FROM roles WHERE name = 'operations_manager'), (SELECT id FROM roles WHERE name = 'department_manager')),
((SELECT id FROM roles WHERE name = 'operations_manager'), (SELECT id FROM roles WHERE name = 'designer')),
((SELECT id FROM roles WHERE name = 'operations_manager'), (SELECT id FROM roles WHERE name = 'customer_service')),

-- Department Manager hierarchy
((SELECT id FROM roles WHERE name = 'department_manager'), (SELECT id FROM roles WHERE name = 'team_lead')),
((SELECT id FROM roles WHERE name = 'department_manager'), (SELECT id FROM roles WHERE name = 'employee')),

-- Team Lead hierarchy
((SELECT id FROM roles WHERE name = 'team_lead'), (SELECT id FROM roles WHERE name = 'employee')),

-- Finance Manager hierarchy
((SELECT id FROM roles WHERE name = 'finance_manager'), (SELECT id FROM roles WHERE name = 'accountant')),

-- Sales Manager hierarchy
((SELECT id FROM roles WHERE name = 'sales_manager'), (SELECT id FROM roles WHERE name = 'customer_service'));

-- Function to grant all permissions to a role
CREATE OR REPLACE FUNCTION grant_all_permissions_to_role(role_name TEXT)
RETURNS VOID AS $$
DECLARE
    role_id UUID;
    perm_id UUID;
    perm_record RECORD;
BEGIN
    SELECT id INTO role_id FROM roles WHERE name = role_name;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', role_name;
    END IF;
    
    FOR perm_record IN SELECT id FROM permissions WHERE is_active = true LOOP
        INSERT INTO role_permissions (role_id, permission_id, is_granted)
        VALUES (role_id, perm_record.id, true)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant all permissions to Super Admin
SELECT grant_all_permissions_to_role('super_admin');

-- Function to grant basic permissions to a role
CREATE OR REPLACE FUNCTION grant_basic_permissions_to_role(role_name TEXT)
RETURNS VOID AS $$
DECLARE
    role_id UUID;
BEGIN
    SELECT id INTO role_id FROM roles WHERE name = role_name;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', role_name;
    END IF;
    
    -- Dashboard read
    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT role_id, id, true
    FROM permissions 
    WHERE name = 'dashboard:read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Basic employee permissions
    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT role_id, id, true
    FROM permissions 
    WHERE resource = 'employees' AND action = 'read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Grant basic permissions to Employee role
SELECT grant_basic_permissions_to_role('employee');

-- Grant specific permissions to each role
-- System Admin gets all permissions except those requiring super_admin
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'system_admin'),
    id,
    true
FROM permissions
WHERE name NOT LIKE 'system:%'
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Operations Manager permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'operations_manager'),
    id,
    true
FROM permissions
WHERE resource IN ('appointments', 'orders', 'workflow', 'workload', 'employees:read', 'dashboard:read', 'analytics:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR Manager permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'hr_manager'),
    id,
    true
FROM permissions
WHERE resource IN ('employees', 'payroll', 'dashboard:read', 'analytics:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance Manager permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'finance_manager'),
    id,
    true
FROM permissions
WHERE resource IN ('finance', 'billing', 'dashboard:read', 'analytics:read', 'payroll:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Sales Manager permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'sales_manager'),
    id,
    true
FROM permissions
WHERE resource IN ('customers', 'appointments', 'orders', 'communication', 'dashboard:read', 'analytics:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Designer permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'designer'),
    id,
    true
FROM permissions
WHERE resource IN ('designs', 'measurements', 'customers:read', 'dashboard:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer Service permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'customer_service'),
    id,
    true
FROM permissions
WHERE resource IN ('customers', 'appointments', 'communication', 'orders:read', 'dashboard:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Accountant permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'accountant'),
    id,
    true
FROM permissions
WHERE resource IN ('billing', 'finance', 'payroll:read', 'dashboard:read', 'analytics:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Compliance Officer permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'compliance_officer'),
    id,
    true
FROM permissions
WHERE resource IN ('compliance', 'visa_compliance', 'audit', 'dashboard:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Department Manager permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'department_manager'),
    id,
    true
FROM permissions
WHERE resource IN ('employees:read', 'workload:read', 'workflow:read', 'orders:read', 'appointments:read', 'dashboard:read', 'analytics:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Team Lead permissions
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'team_lead'),
    id,
    true
FROM permissions
WHERE resource IN ('workload:read', 'workflow:read', 'employees:read', 'dashboard:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'viewer'),
    id,
    true
FROM permissions
WHERE action = 'read'
AND resource NOT IN ('system', 'audit', 'logging', 'users')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer permissions (customer portal)
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'customer'),
    id,
    true
FROM permissions
WHERE resource IN ('appointments:read', 'orders:read', 'measurements:read', 'documents:read', 'customers:read', 'dashboard:read')
AND is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(email TEXT, password TEXT, role_name TEXT DEFAULT 'super_admin')
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    role_id UUID;
BEGIN
    -- This would be implemented with proper auth user creation
    -- For now, just return the role ID for reference
    SELECT id INTO role_id FROM roles WHERE name = role_name;
    
    RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_permissions_composite ON permissions(resource, action, is_active);
CREATE INDEX idx_user_roles_composite ON user_roles(user_id, role_id, is_active);
CREATE INDEX idx_role_permissions_composite ON role_permissions(role_id, permission_id, is_granted);

-- Clean up functions
DROP FUNCTION IF EXISTS grant_all_permissions_to_role(TEXT);
DROP FUNCTION IF EXISTS grant_basic_permissions_to_role(TEXT);
