-- Multi-Factor Authentication and Security Tables Migration
-- Created: 2025-11-06

-- User MFA Settings
CREATE TABLE IF NOT EXISTS user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_method TEXT CHECK (preferred_method IN ('totp', 'sms', 'email', 'backup_codes')),
    totp_secret TEXT,
    totp_secret_encrypted BOOLEAN DEFAULT false,
    totp_qr_code_url TEXT,
    sms_phone_number TEXT,
    sms_phone_encrypted BOOLEAN DEFAULT false,
    email_address TEXT,
    email_verified BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- Array of hashed backup codes
    backup_codes_used TEXT[], -- Array of used backup codes
    enforce_mfa BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Security Settings
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    failed_attempts INTEGER DEFAULT 0,
    last_failed_attempt TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    password_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    ip_address_last_login INET,
    device_fingerprint_last_login TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    location_country TEXT,
    location_city TEXT,
    is_active BOOLEAN DEFAULT true,
    is_trusted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Trusted Devices
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    location_country TEXT,
    location_city TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, device_fingerprint)
);

-- Security Logs
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'login_success',
            'login_failed', 
            'mfa_challenge',
            'mfa_success',
            'mfa_failed',
            'password_changed',
            'account_locked',
            'account_unlocked',
            'trusted_device_added',
            'trusted_device_removed',
            'suspicious_activity',
            'session_created',
            'session_ended',
            'password_reset_requested',
            'password_reset_completed'
        )
    ),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MFA Attempts
CREATE TABLE IF NOT EXISTS mfa_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL CHECK (method_type IN ('totp', 'sms', 'email', 'backup_codes')),
    code_attempted TEXT,
    success BOOLEAN NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login Attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    mfa_required BOOLEAN DEFAULT false,
    mfa_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auth Challenges (for password reset, email verification, etc.)
CREATE TABLE IF NOT EXISTS auth_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('mfa', 'password_reset', 'email_verification')),
    method_type TEXT CHECK (method_type IN ('totp', 'sms', 'email', 'backup_codes')),
    challenge_code TEXT,
    code_hash TEXT, -- Hashed version of the code
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Password History
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_id ON mfa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_created_at ON mfa_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_id ON auth_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires ON auth_challenges(expires_at) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_user_mfa_settings_updated_at BEFORE UPDATE ON user_mfa_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at BEFORE UPDATE ON user_security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Mark expired sessions as inactive
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Remove expired trusted devices
    DELETE FROM trusted_devices 
    WHERE expires_at < NOW();
    
    -- Clean up expired auth challenges
    DELETE FROM auth_challenges 
    WHERE expires_at < NOW();
    
    -- Clean up old security logs (keep last 1000 per user)
    DELETE FROM security_logs 
    WHERE id NOT IN (
        SELECT id FROM security_logs 
        WHERE user_id = security_logs.user_id 
        ORDER BY created_at DESC 
        LIMIT 1000
    ) AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check account lockout status
CREATE OR REPLACE FUNCTION check_account_lockout(user_uuid UUID)
RETURNS TABLE(
    is_locked BOOLEAN,
    remaining_attempts INTEGER,
    locked_until TIMESTAMPTZ,
    lockout_duration_minutes INTEGER
) AS $$
DECLARE
    lockout_config RECORD;
    current_attempts INTEGER;
    last_failed TIMESTAMPTZ;
    locked_until_time TIMESTAMPTZ;
    reset_threshold INTERVAL;
BEGIN
    -- Get lockout configuration (you can make these configurable)
    lockout_config.max_attempts := 5;
    lockout_config.lockout_duration_minutes := 30;
    lockout_config.reset_after_minutes := 60;
    
    -- Get current security settings
    SELECT failed_attempts, last_failed_attempt, locked_until
    INTO current_attempts, last_failed, locked_until_time
    FROM user_security_settings
    WHERE user_id = user_uuid;
    
    -- If no record exists, user is not locked
    IF current_attempts IS NULL THEN
        RETURN QUERY SELECT false, lockout_config.max_attempts, NULL::TIMESTAMPTZ, lockout_config.lockout_duration_minutes;
        RETURN;
    END IF;
    
    -- Check if currently locked
    IF locked_until_time IS NOT NULL AND locked_until_time > NOW() THEN
        RETURN QUERY SELECT true, 0, locked_until_time, lockout_config.lockout_duration_minutes;
        RETURN;
    END IF;
    
    -- Check if lockout period has expired and reset attempts
    IF last_failed IS NOT NULL AND (NOW() - last_failed) > (lockout_config.reset_after_minutes || ' minutes')::INTERVAL THEN
        -- Reset failed attempts
        UPDATE user_security_settings
        SET failed_attempts = 0, last_failed_attempt = NULL, locked_until = NULL
        WHERE user_id = user_uuid;
        
        current_attempts := 0;
    END IF;
    
    -- Return current status
    RETURN QUERY SELECT false, GREATEST(0, lockout_config.max_attempts - COALESCE(current_attempts, 0)), NULL::TIMESTAMPTZ, lockout_config.lockout_duration_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login_attempt(user_uuid UUID, ip_addr INET, user_agent_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    lockout_config RECORD;
    current_attempts INTEGER;
    should_lock BOOLEAN := false;
BEGIN
    -- Get lockout configuration
    lockout_config.max_attempts := 5;
    lockout_config.lockout_duration_minutes := 30;
    
    -- Get current failed attempts
    SELECT failed_attempts INTO current_attempts
    FROM user_security_settings
    WHERE user_id = user_uuid;
    
    -- Initialize if no record exists
    IF current_attempts IS NULL THEN
        INSERT INTO user_security_settings (user_id, failed_attempts, last_failed_attempt)
        VALUES (user_uuid, 1, NOW());
        current_attempts := 1;
    ELSE
        -- Increment failed attempts
        UPDATE user_security_settings
        SET 
            failed_attempts = failed_attempts + 1,
            last_failed_attempt = NOW()
        WHERE user_id = user_uuid;
        
        current_attempts := current_attempts + 1;
    END IF;
    
    -- Check if should lock account
    IF current_attempts >= lockout_config.max_attempts THEN
        should_lock := true;
        
        -- Lock account
        UPDATE user_security_settings
        SET locked_until = NOW() + (lockout_config.lockout_duration_minutes || ' minutes')::INTERVAL
        WHERE user_id = user_uuid;
        
        -- Log security event
        INSERT INTO security_logs (user_id, event_type, event_data, ip_address, user_agent)
        VALUES (user_uuid, 'account_locked', 
                jsonb_build_object('failed_attempts', current_attempts, 'lockout_duration_minutes', lockout_config.lockout_duration_minutes),
                ip_addr, user_agent_text);
    END IF;
    
    -- Log failed login attempt
    INSERT INTO login_attempts (user_id, email, success, ip_address, user_agent, mfa_required, mfa_completed)
    SELECT user_uuid, email, false, ip_addr, user_agent_text, false, false
    FROM auth.users
    WHERE id = user_uuid;
    
    -- Log security event
    INSERT INTO security_logs (user_id, event_type, event_data, ip_address, user_agent)
    VALUES (user_uuid, 'login_failed', 
            jsonb_build_object('failed_attempts', current_attempts, 'account_locked', should_lock),
            ip_addr, user_agent_text);
    
    RETURN should_lock;
END;
$$ LANGUAGE plpgsql;

-- Function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_attempts(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_security_settings
    SET 
        failed_attempts = 0,
        last_failed_attempt = NULL,
        locked_until = NULL,
        last_login_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view their own MFA settings" ON user_mfa_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings" ON user_mfa_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own security settings" ON user_security_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON user_security_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own trusted devices" ON trusted_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trusted devices" ON trusted_devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted devices" ON trusted_devices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted devices" ON trusted_devices
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own security logs" ON security_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security logs" ON security_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own MFA attempts" ON mfa_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert MFA attempts" ON mfa_attempts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own login attempts" ON login_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert login attempts" ON login_attempts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own auth challenges" ON auth_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own auth challenges" ON auth_challenges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own password history" ON password_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert password history" ON password_history
    FOR INSERT WITH CHECK (true);

-- Insert initial data (optional)
-- Add any initial configuration or default settings here

-- Create a view for security summary
CREATE OR REPLACE VIEW user_security_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.last_sign_in_at,
    COALESCE(uss.failed_attempts, 0) as failed_attempts,
    COALESCE(uss.locked_until > NOW(), false) as is_locked,
    COALESCE(uss.locked_until, NOW()) as locked_until,
    (
        SELECT COUNT(*) 
        FROM user_sessions s 
        WHERE s.user_id = u.id AND s.is_active = true
    ) as active_sessions,
    (
        SELECT COUNT(*) 
        FROM trusted_devices d 
        WHERE d.user_id = u.id AND d.is_active = true
    ) as trusted_devices_count,
    (
        SELECT COUNT(*) 
        FROM security_logs sl 
        WHERE sl.user_id = u.id 
        AND sl.created_at > NOW() - INTERVAL '24 hours'
    ) as security_events_24h
FROM auth.users u
LEFT JOIN user_security_settings uss ON u.id = uss.user_id;

-- Grant permissions
GRANT SELECT ON user_security_summary TO authenticated;
