-- Secure File Storage System Database Schema
-- Created: 2025-11-06

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(45) NULL,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_attempt TIMESTAMP NULL,
    last_password_change TIMESTAMP NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(255) NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    encrypted_filename VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    encrypted_path VARCHAR(500) NOT NULL,
    encryption_key TEXT NOT NULL,
    encryption_iv VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    tags TEXT NULL, -- JSON array of tags
    description TEXT NULL,
    thumbnail_path VARCHAR(255) NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT true,
    is_accessible BOOLEAN NOT NULL DEFAULT true,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMP NULL,
    last_downloaded_from_ip VARCHAR(45) NULL,
    quarantine_status VARCHAR(20) NOT NULL DEFAULT 'clean' CHECK (quarantine_status IN ('clean', 'quarantined', 'infected')),
    virus_scan_result TEXT NULL, -- JSON with scan results
    metadata TEXT NULL, -- JSON with additional metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- File shares table
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    max_downloads INTEGER NOT NULL DEFAULT 10,
    download_count INTEGER NOT NULL DEFAULT 0,
    requires_password BOOLEAN NOT NULL DEFAULT false,
    password_hash VARCHAR(255) NULL,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    last_viewed_at TIMESTAMP NULL,
    last_downloaded_at TIMESTAMP NULL,
    last_downloaded_from_ip VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(20) NOT NULL CHECK (event_category IN ('AUTH', 'FILE', 'SHARE', 'ADMIN', 'SECURITY', 'SYSTEM')),
    severity VARCHAR(10) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    resource_id VARCHAR(255) NULL,
    resource_type VARCHAR(50) NULL,
    metadata TEXT NULL, -- JSON with additional event data
    is_security_incident BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolution TEXT NULL,
    resolved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quarantine table
CREATE TABLE IF NOT EXISTS quarantine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL UNIQUE REFERENCES files(id) ON DELETE CASCADE,
    quarantined_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    threat_type VARCHAR(100) NULL,
    scan_report TEXT NULL, -- JSON with detailed scan report
    quarantine_path VARCHAR(500) NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolution VARCHAR(20) NULL CHECK (resolution IN ('deleted', 'released', 'false_positive')),
    resolved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_is_accessible ON files(is_accessible);
CREATE INDEX IF NOT EXISTS idx_files_quarantine_status ON files(quarantine_status);
CREATE INDEX IF NOT EXISTS idx_files_mimetype ON files(mimetype);

-- File shares indexes
CREATE INDEX IF NOT EXISTS idx_file_shares_owner_id ON file_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON file_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_shares_is_active ON file_shares(is_active);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_security_incident ON audit_logs(is_security_incident) WHERE is_security_incident = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Quarantine indexes
CREATE INDEX IF NOT EXISTS idx_quarantine_file_id ON quarantine(file_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_is_resolved ON quarantine(is_resolved);
CREATE INDEX IF NOT EXISTS idx_quarantine_created_at ON quarantine(created_at);

-- Comments and documentation
COMMENT ON TABLE users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE files IS 'Encrypted file storage with metadata and security information';
COMMENT ON TABLE file_shares IS 'Secure file sharing links with expiration and access controls';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for security and compliance';
COMMENT ON TABLE user_sessions IS 'Active user sessions for authentication management';
COMMENT ON TABLE quarantine IS 'Quarantined files that failed security checks';

-- Insert default admin user (password: Admin123!)
INSERT INTO users (
    id,
    email, 
    password, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    email_verified
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@securefiles.com',
    '$2a$12$LQv3c1yqBwlkbO6YGOe0Fe4jGUzQ1j9R0oBwX6H0rE1D0E3M5K6L8',
    'System',
    'Administrator',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_file_shares_updated_at ON file_shares;
CREATE TRIGGER update_file_shares_updated_at 
    BEFORE UPDATE ON file_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quarantine_updated_at ON quarantine;
CREATE TRIGGER update_quarantine_updated_at 
    BEFORE UPDATE ON quarantine 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
DECLARE
    deleted_shares INTEGER;
    deleted_audit_logs INTEGER;
BEGIN
    -- Clean up expired file shares
    DELETE FROM file_shares 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
    
    GET DIAGNOSTICS deleted_shares = ROW_COUNT;
    
    -- Clean up old audit logs (keep only non-security logs for 90 days, security logs for 365 days)
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days' 
    AND is_security_incident = false;
    
    GET DIAGNOSTICS deleted_audit_logs = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO audit_logs (
        event_type,
        event_category,
        severity,
        description,
        metadata
    ) VALUES (
        'AUTO_CLEANUP',
        'SYSTEM',
        'INFO',
        'Automatic cleanup of expired data',
        json_build_object(
            'deleted_shares', deleted_shares,
            'deleted_audit_logs', deleted_audit_logs,
            'cleanup_time', CURRENT_TIMESTAMP
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.created_at,
    u.last_login,
    COUNT(f.id) as file_count,
    COALESCE(SUM(f.size), 0) as total_storage_used,
    COUNT(fs.id) as shares_created,
    COUNT(CASE WHEN fs.is_active = true THEN 1 END) as active_shares
FROM users u
LEFT JOIN files f ON u.id = f.user_id AND f.deleted_at IS NULL
LEFT JOIN file_shares fs ON u.id = fs.owner_id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at, u.last_login;

-- Create view for security incidents
CREATE OR REPLACE VIEW security_incidents AS
SELECT 
    al.id,
    al.event_type,
    al.severity,
    al.description,
    al.ip_address,
    al.user_agent,
    al.resource_id,
    al.resource_type,
    al.created_at,
    al.is_resolved,
    al.resolution,
    u.email as user_email
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.is_security_incident = true
ORDER BY al.created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Default admin user created with email: admin@securefiles.com';
    RAISE NOTICE 'Please change the default password after first login.';
END $$;