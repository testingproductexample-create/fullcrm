-- Performance Monitoring System Database Schema
-- This schema creates all necessary tables for storing performance metrics and monitoring data

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    host_id TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu', 'memory', 'disk', 'network', 'process')),
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit TEXT,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_system_metrics_timestamp (timestamp),
    INDEX idx_system_metrics_host_type (host_id, metric_type),
    INDEX idx_system_metrics_name (metric_name),
    INDEX idx_system_metrics_tags USING GIN (tags)
);

-- Application performance metrics table
CREATE TABLE IF NOT EXISTS application_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    service_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('http', 'database', 'cache', 'queue', 'custom')),
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit TEXT,
    percentile DOUBLE PRECISION, -- For percentile metrics (p50, p90, p95, p99)
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_app_metrics_timestamp (timestamp),
    INDEX idx_app_metrics_service (service_name),
    INDEX idx_app_metrics_type_name (metric_type, metric_name),
    INDEX idx_app_metrics_endpoint (endpoint),
    INDEX idx_app_metrics_tags USING GIN (tags)
);

-- Database performance metrics table
CREATE TABLE IF NOT EXISTS database_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    database_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('connection', 'query', 'transaction', 'lock', 'cache', 'index')),
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit TEXT,
    query_hash TEXT, -- Hash of the query for slow query tracking
    query_text TEXT, -- Anonymized query text
    execution_time_ms DOUBLE PRECISION,
    rows_affected INTEGER,
    connection_id INTEGER,
    session_id TEXT,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_db_metrics_timestamp (timestamp),
    INDEX idx_db_metrics_database (database_name),
    INDEX idx_db_metrics_type (metric_type),
    INDEX idx_db_metrics_query (query_hash),
    INDEX idx_db_metrics_execution_time (execution_time_ms),
    INDEX idx_db_metrics_tags USING GIN (tags)
);

-- API performance metrics table
CREATE TABLE IF NOT EXISTS api_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    api_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('request', 'response', 'error', 'rate_limit')),
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit TEXT,
    status_code INTEGER,
    response_time_ms DOUBLE PRECISION,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_agent TEXT,
    ip_address INET,
    rate_limit_remaining INTEGER,
    rate_limit_reset TIMESTAMPTZ,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_api_metrics_timestamp (timestamp),
    INDEX idx_api_metrics_endpoint (endpoint),
    INDEX idx_api_metrics_method (method),
    INDEX idx_api_metrics_status (status_code),
    INDEX idx_api_metrics_response_time (response_time_ms),
    INDEX idx_api_metrics_tags USING GIN (tags)
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS error_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    service_name TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_code TEXT,
    stack_trace TEXT,
    file_path TEXT,
    line_number INTEGER,
    function_name TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    user_id TEXT,
    session_id TEXT,
    request_id TEXT,
    endpoint TEXT,
    method TEXT,
    user_agent TEXT,
    ip_address INET,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    occurrence_count INTEGER DEFAULT 1,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_error_logs_timestamp (timestamp),
    INDEX idx_error_logs_service (service_name),
    INDEX idx_error_logs_type (error_type),
    INDEX idx_error_logs_severity (severity),
    INDEX idx_error_logs_resolved (resolved),
    INDEX idx_error_logs_user (user_id),
    INDEX idx_error_logs_session (session_id),
    INDEX idx_error_logs_request (request_id),
    INDEX idx_error_logs_tags USING GIN (tags)
);

-- Log entries table (for general log processing)
CREATE TABLE IF NOT EXISTS log_entries (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    service_name TEXT NOT NULL,
    log_level TEXT NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    source TEXT,
    file_path TEXT,
    line_number INTEGER,
    function_name TEXT,
    user_id TEXT,
    session_id TEXT,
    request_id TEXT,
    ip_address INET,
    user_agent TEXT,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    INDEX idx_log_entries_timestamp (timestamp),
    INDEX idx_log_entries_service (service_name),
    INDEX idx_log_entries_level (log_level),
    INDEX idx_log_entries_source (source),
    INDEX idx_log_entries_user (user_id),
    INDEX idx_log_entries_request (request_id),
    INDEX idx_log_entries_processed (processed),
    INDEX idx_log_entries_tags USING GIN (tags)
);

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    condition TEXT NOT NULL, -- SQL-like condition (e.g., 'value > 80')
    threshold_value DOUBLE PRECISION,
    duration_seconds INTEGER NOT NULL DEFAULT 60,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB DEFAULT '[]', -- Array of channel configurations
    escalation_rules JSONB DEFAULT '{}', -- Escalation configuration
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    INDEX idx_alert_rules_name (name),
    INDEX idx_alert_rules_enabled (enabled),
    INDEX idx_alert_rules_severity (severity)
);

-- Alert events table
CREATE TABLE IF NOT EXISTS alert_events (
    id BIGSERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES alert_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    triggered_value DOUBLE PRECISION,
    threshold_value DOUBLE PRECISION,
    duration_seconds INTEGER,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_time_seconds INTEGER,
    escalation_level INTEGER DEFAULT 0,
    notification_status JSONB DEFAULT '{}', -- Track notification delivery status
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_alert_events_rule (rule_id),
    INDEX idx_alert_events_triggered (triggered_at),
    INDEX idx_alert_events_status (status),
    INDEX idx_alert_events_severity (severity)
);

-- Frontend performance metrics table
CREATE TABLE IF NOT EXISTS frontend_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    page_url TEXT NOT NULL,
    session_id TEXT,
    user_id TEXT,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('web_vitals', 'navigation', 'resource', 'interaction', 'custom')),
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit TEXT,
    url TEXT, -- Current page URL
    referrer TEXT,
    user_agent TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    device_pixel_ratio DOUBLE PRECISION,
    connection_type TEXT, -- 2g, 3g, 4g, wifi, etc.
    connection_effective_type TEXT, -- slow-2g, 2g, 3g, 4g
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    os_version TEXT,
    device_type TEXT, -- desktop, mobile, tablet
    country TEXT,
    region TEXT,
    city TEXT,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_frontend_metrics_timestamp (timestamp),
    INDEX idx_frontend_metrics_page (page_url),
    INDEX idx_frontend_metrics_session (session_id),
    INDEX idx_frontend_metrics_user (user_id),
    INDEX idx_frontend_metrics_type (metric_type),
    INDEX idx_frontend_metrics_name (metric_name),
    INDEX idx_frontend_metrics_browser (browser_name),
    INDEX idx_frontend_metrics_device (device_type),
    INDEX idx_frontend_metrics_tags USING GIN (tags)
);

-- Performance reports table
CREATE TABLE IF NOT EXISTS performance_reports (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom', 'on_demand')),
    parameters JSONB DEFAULT '{}', -- Report generation parameters
    status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    file_path TEXT,
    file_size_bytes BIGINT,
    format TEXT, -- pdf, html, csv, json
    generated_by TEXT,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    INDEX idx_performance_reports_status (status),
    INDEX idx_performance_reports_type (report_type),
    INDEX idx_performance_reports_generated (generated_by),
    INDEX idx_performance_reports_expires (expires_at)
);

-- Optimization recommendations table
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category TEXT NOT NULL CHECK (category IN ('system', 'application', 'database', 'api', 'frontend', 'security', 'cost')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    current_state TEXT,
    recommended_state TEXT,
    impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
    effort_score INTEGER CHECK (effort_score BETWEEN 1 AND 10),
    roi_estimate TEXT, -- Return on investment estimate
    implementation_steps JSONB DEFAULT '[]', -- Array of implementation steps
    dependencies JSONB DEFAULT '[]', -- Required dependencies
    risks JSONB DEFAULT '[]', -- Potential risks
    tags JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed', 'rejected')),
    assigned_to TEXT,
    due_date DATE,
    created_by TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    implementation_notes TEXT,
    INDEX idx_optimization_recommendations_category (category),
    INDEX idx_optimization_recommendations_priority (priority),
    INDEX idx_optimization_recommendations_status (status),
    INDEX idx_optimization_recommendations_assigned (assigned_to),
    INDEX idx_optimization_recommendations_due (due_date)
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_configuration (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type TEXT NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT,
    INDEX idx_system_config_key (key),
    INDEX idx_system_config_category (category)
);

-- Data retention policy table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    retention_period INTERVAL NOT NULL,
    archive_strategy TEXT, -- 'delete', 'archive', 'aggregate'
    archive_location TEXT,
    aggregation_level TEXT, -- '1m', '5m', '1h', '1d'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_name)
);

-- User sessions table (for tracking dashboard usage)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    username TEXT,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    page_views INTEGER DEFAULT 0,
    actions_performed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_active (is_active),
    INDEX idx_user_sessions_started (started_at)
);

-- Performance baselines table
CREATE TABLE IF NOT EXISTS performance_baselines (
    id BIGSERIAL PRIMARY KEY,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    tags JSONB DEFAULT '{}',
    baseline_period_start TIMESTAMPTZ NOT NULL,
    baseline_period_end TIMESTAMPTZ NOT NULL,
    mean_value DOUBLE PRECISION,
    median_value DOUBLE PRECISION,
    p95_value DOUBLE PRECISION,
    p99_value DOUBLE PRECISION,
    standard_deviation DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    sample_count INTEGER,
    confidence_level DOUBLE PRECISION DEFAULT 0.95,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    UNIQUE(metric_type, metric_name, baseline_period_start, baseline_period_end),
    INDEX idx_performance_baselines_metric (metric_type, metric_name),
    INDEX idx_performance_baselines_period (baseline_period_start, baseline_period_end),
    INDEX idx_performance_baselines_tags USING GIN (tags)
);

-- Anomaly detection results table
CREATE TABLE IF NOT EXISTS anomaly_detection_results (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    tags JSONB DEFAULT '{}',
    detected_value DOUBLE PRECISION NOT NULL,
    expected_value DOUBLE PRECISION,
    anomaly_score DOUBLE PRECISION NOT NULL, -- Higher score = more anomalous
    anomaly_type TEXT, -- 'spike', 'drop', 'trend', 'pattern'
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
    confidence DOUBLE PRECISION, -- Detection confidence (0-1)
    algorithm TEXT NOT NULL, -- Detection algorithm used
    parameters JSONB DEFAULT '{}', -- Algorithm parameters
    context TEXT, -- Additional context
    is_confirmed BOOLEAN,
    confirmed_by TEXT,
    confirmed_at TIMESTAMPTZ,
    is_false_positive BOOLEAN DEFAULT FALSE,
    notes TEXT,
    INDEX idx_anomaly_detection_timestamp (timestamp),
    INDEX idx_anomaly_detection_metric (metric_type, metric_name),
    INDEX idx_anomaly_detection_score (anomaly_score),
    INDEX idx_anomaly_detection_confirmed (is_confirmed),
    INDEX idx_anomaly_detection_tags USING GIN (tags)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp_host ON system_metrics (timestamp, host_id);
CREATE INDEX IF NOT EXISTS idx_application_metrics_timestamp_service ON application_metrics (timestamp, service_name);
CREATE INDEX IF NOT EXISTS idx_database_metrics_timestamp_database ON database_metrics (timestamp, database_name);
CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp_endpoint ON api_metrics (timestamp, endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp_service_severity ON error_logs (timestamp, service_name, severity);
CREATE INDEX IF NOT EXISTS idx_log_entries_timestamp_service_level ON log_entries (timestamp, service_name, log_level);
CREATE INDEX IF NOT EXISTS idx_frontend_metrics_timestamp_page ON frontend_metrics (timestamp, page_url);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_system_metrics_composite ON system_metrics (timestamp, host_id, metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_application_metrics_composite ON application_metrics (timestamp, service_name, metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_database_metrics_composite ON database_metrics (timestamp, database_name, metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_api_metrics_composite ON api_metrics (timestamp, api_name, method, status_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_composite ON error_logs (timestamp, service_name, error_type, severity);
CREATE INDEX IF NOT EXISTS idx_frontend_metrics_composite ON frontend_metrics (timestamp, page_url, metric_type, metric_name);

-- Partitioning for large tables (optional, for better performance)
-- Uncomment and modify based on your needs

-- CREATE TABLE system_metrics_2024_01 PARTITION OF system_metrics 
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- CREATE TABLE system_metrics_2024_02 PARTITION OF system_metrics 
-- FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Create functions for automated data maintenance
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT table_name, retention_period 
        FROM data_retention_policies 
        WHERE archive_strategy = 'delete'
    LOOP
        EXECUTE format('DELETE FROM %I WHERE timestamp < NOW() - $1', policy_record.table_name)
        USING policy_record.retention_period;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic updated_at updates
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reports_updated_at BEFORE UPDATE ON performance_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at BEFORE UPDATE ON system_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration
INSERT INTO system_configuration (key, value, data_type, description, category) VALUES
('system_host', 'localhost', 'string', 'System hostname', 'system'),
('collection_interval', '5000', 'number', 'Default metrics collection interval in milliseconds', 'metrics'),
('retention_period_days', '30', 'number', 'Default data retention period in days', 'retention'),
('alert_check_interval', '10000', 'number', 'Alert checking interval in milliseconds', 'alerts'),
('dashboard_refresh_interval', '30000', 'number', 'Dashboard refresh interval in milliseconds', 'dashboard'),
('enable_real_time_updates', 'true', 'boolean', 'Enable real-time dashboard updates', 'dashboard'),
('max_concurrent_users', '100', 'number', 'Maximum concurrent dashboard users', 'dashboard'),
('log_level', 'info', 'string', 'Default logging level', 'logging')
ON CONFLICT (key) DO NOTHING;

-- Insert default data retention policies
INSERT INTO data_retention_policies (table_name, retention_period, archive_strategy, aggregation_level) VALUES
('system_metrics', INTERVAL '7 days', 'aggregate', '5m'),
('application_metrics', INTERVAL '30 days', 'aggregate', '5m'),
('database_metrics', INTERVAL '30 days', 'aggregate', '5m'),
('api_metrics', INTERVAL '30 days', 'aggregate', '1m'),
('error_logs', INTERVAL '90 days', 'archive', NULL),
('log_entries', INTERVAL '7 days', 'delete', NULL),
('frontend_metrics', INTERVAL '30 days', 'aggregate', '1m'),
('alert_events', INTERVAL '180 days', 'archive', NULL),
('anomaly_detection_results', INTERVAL '90 days', 'archive', NULL)
ON CONFLICT (table_name) DO NOTHING;

-- Grant permissions (adjust based on your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO monitoring_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO monitoring_user;

-- Comments for documentation
COMMENT ON TABLE system_metrics IS 'System resource metrics (CPU, memory, disk, network)';
COMMENT ON TABLE application_metrics IS 'Application performance metrics (HTTP, database, cache)';
COMMENT ON TABLE database_metrics IS 'Database performance metrics and slow queries';
COMMENT ON TABLE api_metrics IS 'API request/response metrics and analytics';
COMMENT ON TABLE error_logs IS 'Error tracking and stack traces';
COMMENT ON TABLE log_entries IS 'General application logs';
COMMENT ON TABLE alert_rules IS 'Alert rules and thresholds';
COMMENT ON TABLE alert_events IS 'Alert events and status tracking';
COMMENT ON TABLE frontend_metrics IS 'Frontend performance metrics and user experience data';
COMMENT ON TABLE performance_reports IS 'Generated performance reports';
COMMENT ON TABLE optimization_recommendations IS 'Performance optimization recommendations';
COMMENT ON TABLE performance_baselines IS 'Performance baseline calculations';
COMMENT ON TABLE anomaly_detection_results IS 'Anomaly detection algorithm results';