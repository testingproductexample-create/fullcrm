-- Comprehensive Audit Logging System Schema
-- This schema tracks all user actions, data access, and system changes

-- Main audit logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL, -- Unique identifier for each audit event
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    event_type VARCHAR(100) NOT NULL, -- login, logout, data_access, data_modification, etc.
    event_category VARCHAR(50) NOT NULL, -- authentication, authorization, data, system, security
    resource_type VARCHAR(100), -- table/entity being accessed
    resource_id VARCHAR(255), -- specific resource identifier
    action VARCHAR(100) NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, etc.
    details JSONB, -- additional event details
    old_values JSONB, -- previous values for updates
    new_values JSONB, -- new values for inserts/updates
    risk_level VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(20) DEFAULT 'SUCCESS', -- SUCCESS, FAILED, PARTIAL
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table for monitoring
CREATE TABLE security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    source_ip INET,
    user_agent TEXT,
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed login attempts table
CREATE TABLE failed_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempt_method VARCHAR(50) NOT NULL, -- password, token, social, etc.
    failure_reason VARCHAR(100) NOT NULL, -- invalid_password, account_locked, etc.
    details JSONB,
    blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User behavior analytics table
CREATE TABLE user_behavior_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    session_count INTEGER DEFAULT 0,
    total_actions INTEGER DEFAULT 0,
    unique_resources_accessed INTEGER DEFAULT 0,
    avg_session_duration INTERVAL,
    login_count INTEGER DEFAULT 0,
    failed_login_count INTEGER DEFAULT 0,
    most_accessed_resources JSONB,
    access_patterns JSONB,
    risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    anomalies JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_date)
);

-- Anomaly detection table
CREATE TABLE anomaly_detection (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anomaly_type VARCHAR(100) NOT NULL, -- unusual_login_time, excessive_access, etc.
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    baseline_metrics JSONB,
    current_metrics JSONB,
    deviation_score DECIMAL(3,2), -- how much it deviates from normal
    confidence_level DECIMAL(3,2), -- confidence in the anomaly detection
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, INVESTIGATED, FALSE_POSITIVE, CONFIRMED
    investigated_at TIMESTAMP WITH TIME ZONE,
    investigated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance reports table
CREATE TABLE compliance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL, -- GDPR, SOX, HIPAA, etc.
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'GENERATING', -- GENERATING, COMPLETED, FAILED
    file_path TEXT,
    summary JSONB,
    metrics JSONB,
    findings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Alert configuration table
CREATE TABLE alert_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type VARCHAR(100) NOT NULL, -- failed_logins, anomalies, security_events
    conditions JSONB NOT NULL, -- alert conditions
    severity_threshold VARCHAR(20) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB, -- email, sms, webhook, etc.
    cooldown_period INTERVAL DEFAULT '1 hour',
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_risk_level ON audit_logs(risk_level);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Security events indexes
CREATE INDEX idx_security_events_timestamp ON security_events(created_at);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

-- Failed login attempts indexes
CREATE INDEX idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_attempts_created ON failed_login_attempts(created_at);
CREATE INDEX idx_failed_login_attempts_blocked ON failed_login_attempts(blocked);

-- User behavior analytics indexes
CREATE INDEX idx_user_behavior_user_id ON user_behavior_analytics(user_id);
CREATE INDEX idx_user_behavior_date ON user_behavior_analytics(event_date);
CREATE INDEX idx_user_behavior_risk_score ON user_behavior_analytics(risk_score);

-- Anomaly detection indexes
CREATE INDEX idx_anomaly_detection_timestamp ON anomaly_detection(created_at);
CREATE INDEX idx_anomaly_detection_user_id ON anomaly_detection(user_id);
CREATE INDEX idx_anomaly_detection_severity ON anomaly_detection(severity);
CREATE INDEX idx_anomaly_detection_status ON anomaly_detection(status);

-- Row Level Security (RLS) policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit tables (only admin users can access)
CREATE POLICY "Admin access to audit logs" ON audit_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin'
        )
    );

CREATE POLICY "Admin access to security events" ON security_events
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Allow users to view their own failed login attempts
CREATE POLICY "User access to own failed logins" ON failed_login_attempts
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Allow admin access to other audit tables
CREATE POLICY "Admin access to user behavior analytics" ON user_behavior_analytics
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admin access to anomaly detection" ON anomaly_detection
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admin access to compliance reports" ON compliance_reports
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admin access to alert configurations" ON alert_configurations
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Functions for audit logging
CREATE OR REPLACE FUNCTION log_audit_event(
    p_event_id VARCHAR(255),
    p_user_id UUID,
    p_session_id VARCHAR(255),
    p_ip_address INET,
    p_user_agent TEXT,
    p_event_type VARCHAR(100),
    p_event_category VARCHAR(50),
    p_resource_type VARCHAR(100),
    p_resource_id VARCHAR(255),
    p_action VARCHAR(100),
    p_details JSONB,
    p_old_values JSONB,
    p_new_values JSONB,
    p_risk_level VARCHAR(20) DEFAULT 'LOW',
    p_status VARCHAR(20) DEFAULT 'SUCCESS',
    p_error_message TEXT
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        event_id, user_id, session_id, ip_address, user_agent,
        event_type, event_category, resource_type, resource_id, action,
        details, old_values, new_values, risk_level, status, error_message
    ) VALUES (
        p_event_id, p_user_id, p_session_id, p_ip_address, p_user_agent,
        p_event_type, p_event_category, p_resource_type, p_resource_id, p_action,
        p_details, p_old_values, p_new_values, p_risk_level, p_status, p_error_message
    ) RETURNING id INTO audit_id;
    
    -- Log to console/file as well
    RAISE NOTICE 'Audit event logged: % - % - %', p_event_type, p_event_category, p_action;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_id VARCHAR(255),
    p_user_id UUID,
    p_event_type VARCHAR(100),
    p_severity VARCHAR(20),
    p_source_ip INET,
    p_user_agent TEXT,
    p_details JSONB
) RETURNS UUID AS $$
DECLARE
    security_id UUID;
BEGIN
    INSERT INTO security_events (
        event_id, user_id, event_type, severity, source_ip, user_agent, details
    ) VALUES (
        p_event_id, p_user_id, p_event_type, p_severity, p_source_ip, p_user_agent, p_details
    ) RETURNING id INTO security_id;
    
    RAISE NOTICE 'Security event logged: % - %', p_event_type, p_severity;
    
    RETURN security_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log failed login attempts
CREATE OR REPLACE FUNCTION log_failed_login(
    p_event_id VARCHAR(255),
    p_email VARCHAR(255),
    p_ip_address INET,
    p_user_agent TEXT,
    p_attempt_method VARCHAR(50),
    p_failure_reason VARCHAR(100),
    p_details JSONB
) RETURNS UUID AS $$
DECLARE
    failed_id UUID;
    user_record UUID;
    attempt_count INTEGER;
    should_block BOOLEAN := FALSE;
BEGIN
    -- Get user ID if email exists
    SELECT id INTO user_record FROM auth.users WHERE email = p_email;
    
    -- Check if IP should be blocked (5+ failed attempts in last hour)
    SELECT COUNT(*) INTO attempt_count
    FROM failed_login_attempts
    WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '1 hour'
    AND blocked = FALSE;
    
    IF attempt_count >= 4 THEN
        should_block := TRUE;
    END IF;
    
    INSERT INTO failed_login_attempts (
        event_id, email, ip_address, user_agent, attempt_method,
        failure_reason, details, blocked, blocked_until
    ) VALUES (
        p_event_id, p_email, p_ip_address, p_user_agent, p_attempt_method,
        p_failure_reason, p_details, should_block, 
        CASE WHEN should_block THEN NOW() + INTERVAL '1 hour' END
    ) RETURNING id INTO failed_id;
    
    -- Create security event for failed login
    PERFORM log_security_event(
        p_event_id,
        user_record,
        'failed_login',
        CASE WHEN should_block THEN 'HIGH' ELSE 'MEDIUM' END,
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
            'email', p_email,
            'failure_reason', p_failure_reason,
            'blocked', should_block
        )
    );
    
    RETURN failed_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user behavior analytics
CREATE OR REPLACE FUNCTION update_user_behavior_analytics(
    p_user_id UUID,
    p_event_date DATE
) RETURNS VOID AS $$
DECLARE
    login_count INTEGER;
    failed_login_count INTEGER;
    session_count INTEGER;
    total_actions INTEGER;
    unique_resources INTEGER;
    avg_duration INTERVAL;
BEGIN
    -- Get metrics for the date
    SELECT COUNT(*) INTO login_count
    FROM audit_logs
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_event_date
    AND event_type = 'login';
    
    SELECT COUNT(*) INTO failed_login_count
    FROM failed_login_attempts
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_event_date;
    
    -- Get session information
    SELECT COUNT(DISTINCT session_id), SUM(
        CASE WHEN action = 'logout' THEN 
            EXTRACT(EPOCH FROM (timestamp - lag(timestamp) OVER (PARTITION BY session_id ORDER BY timestamp)))
        END
    ) INTO session_count, total_actions
    FROM audit_logs
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_event_date;
    
    -- Calculate average session duration
    WITH session_durations AS (
        SELECT 
            session_id,
            MIN(timestamp) as session_start,
            MAX(timestamp) as session_end,
            MAX(timestamp) - MIN(timestamp) as duration
        FROM audit_logs
        WHERE user_id = p_user_id
        AND DATE(timestamp) = p_event_date
        AND session_id IS NOT NULL
        GROUP BY session_id
    )
    SELECT AVG(duration) INTO avg_duration
    FROM session_durations
    WHERE duration IS NOT NULL;
    
    -- Get unique resources accessed
    SELECT COUNT(DISTINCT resource_type) INTO unique_resources
    FROM audit_logs
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_event_date
    AND resource_type IS NOT NULL;
    
    -- Insert or update analytics
    INSERT INTO user_behavior_analytics (
        user_id, event_date, session_count, total_actions,
        unique_resources_accessed, avg_session_duration,
        login_count, failed_login_count, risk_score
    ) VALUES (
        p_user_id, p_event_date, COALESCE(session_count, 0), 
        COALESCE(total_actions, 0), COALESCE(unique_resources, 0),
        avg_duration, COALESCE(login_count, 0), 
        COALESCE(failed_login_count, 0),
        -- Simple risk score calculation
        LEAST(1.0, (COALESCE(failed_login_count, 0) * 0.2) + (COALESCE(session_count, 0) * 0.1))
    )
    ON CONFLICT (user_id, event_date)
    DO UPDATE SET
        session_count = EXCLUDED.session_count,
        total_actions = EXCLUDED.total_actions,
        unique_resources_accessed = EXCLUDED.unique_resources_accessed,
        avg_session_duration = EXCLUDED.avg_session_duration,
        login_count = EXCLUDED.login_count,
        failed_login_count = EXCLUDED.failed_login_count,
        risk_score = EXCLUDED.risk_score,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql;