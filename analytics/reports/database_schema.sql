-- Custom Reports & Business Intelligence System Database Schema
-- Comprehensive schema for custom reports, business intelligence, and analytics

-- Custom Reports Table
CREATE TABLE custom_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('executive_summary', 'detailed_analytics', 'comparative_analysis', 'compliance', 'ad_hoc')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_scheduled BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
    metadata JSONB DEFAULT '{}',
    data_sources JSONB DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    grouping JSONB DEFAULT '[]',
    sort_order JSONB DEFAULT '[]',
    visualization_config JSONB DEFAULT '{}',
    export_formats TEXT[] DEFAULT ARRAY['pdf', 'excel', 'csv'],
    language VARCHAR(10) DEFAULT 'en',
    compliance_category VARCHAR(50),
    audit_trail JSONB DEFAULT '[]'
);

-- Report Templates Table
CREATE TABLE report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('dashboard', 'executive', 'operational', 'compliance', 'financial')),
    template_data JSONB NOT NULL,
    preview_image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    tags TEXT[] DEFAULT ARRAY[]',
    compatibility JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    region VARCHAR(50) DEFAULT 'global'
);

-- Report Schedules Table
CREATE TABLE report_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    schedule_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    cron_expression TEXT,
    schedule_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    next_execution TIMESTAMP WITH TIME ZONE,
    last_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    recipients JSONB DEFAULT '[]',
    delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'dashboard', 'webhook', 'file')),
    format_preference VARCHAR(20) DEFAULT 'pdf',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Report Analytics Table
CREATE TABLE report_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'download', 'share', 'schedule_create', 'schedule_execute', 'template_use', 'export')),
    user_id UUID NOT NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    execution_time INTEGER, -- in milliseconds
    record_count INTEGER,
    data_size INTEGER, -- in bytes
    export_format VARCHAR(20),
    error_message TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50)
);

-- Report Sharing Table
CREATE TABLE report_sharing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL,
    shared_with UUID[],
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('view', 'edit', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255),
    is_public BOOLEAN DEFAULT false,
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Report Data Sources Table
CREATE TABLE report_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('database', 'api', 'file', 'streaming', 'external')),
    connection_config JSONB NOT NULL,
    schema_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Report Widgets Table
CREATE TABLE report_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN ('chart', 'table', 'metric', 'kpi', 'map', 'gauge')),
    widget_config JSONB NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    z_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Query Builder History Table
CREATE TABLE query_builder_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    query_name VARCHAR(255),
    query_config JSONB NOT NULL,
    sql_query TEXT,
    execution_time INTEGER,
    record_count INTEGER,
    is_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Compliance Reports Table
CREATE TABLE compliance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    compliance_type VARCHAR(100) NOT NULL,
    regulation_code VARCHAR(50) NOT NULL, -- UAE regulations
    reporting_period JSONB NOT NULL,
    data_points JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'submitted', 'archived')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    submission_reference VARCHAR(100),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- User Preferences Table
CREATE TABLE user_report_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    default_dashboard_id UUID,
    preferred_language VARCHAR(10) DEFAULT 'en',
    preferred_timezone VARCHAR(50) DEFAULT 'UTC',
    notification_settings JSONB DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}',
    data_privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX idx_custom_reports_type ON custom_reports(report_type);
CREATE INDEX idx_custom_reports_status ON custom_reports(status);
CREATE INDEX idx_custom_reports_language ON custom_reports(language);
CREATE INDEX idx_report_schedules_report_id ON report_schedules(report_id);
CREATE INDEX idx_report_schedules_next_execution ON report_schedules(next_execution);
CREATE INDEX idx_report_analytics_report_id ON report_analytics(report_id);
CREATE INDEX idx_report_analytics_user_id ON report_analytics(user_id);
CREATE INDEX idx_report_analytics_event_type ON report_analytics(event_type);
CREATE INDEX idx_report_analytics_created_at ON report_analytics(created_at);
CREATE INDEX idx_report_sharing_report_id ON report_sharing(report_id);
CREATE INDEX idx_report_widgets_report_id ON report_widgets(report_id);
CREATE INDEX idx_query_builder_user_id ON query_builder_history(user_id);
CREATE INDEX idx_compliance_created_by ON compliance_reports(created_by);
CREATE INDEX idx_compliance_type ON compliance_reports(compliance_type);

-- Create Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add Triggers for updated_at
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON report_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_widgets_updated_at BEFORE UPDATE ON report_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_report_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data
INSERT INTO report_templates (name, description, category, template_type, template_data) VALUES
('Executive Dashboard', 'High-level KPI overview for executives', 'executive', 'executive', '{"widgets": [{"type": "kpi", "title": "Revenue", "dataSource": "financial"}, {"type": "chart", "title": "Monthly Growth", "chartType": "line"}]}'),
('Sales Performance', 'Detailed sales analytics and performance metrics', 'sales', 'operational', '{"widgets": [{"type": "chart", "title": "Sales by Region", "chartType": "bar"}, {"type": "table", "title": "Top Performers"}]}'),
('UAE Compliance Report', 'Regulatory compliance report for UAE authorities', 'compliance', 'compliance', '{"widgets": [{"type": "metric", "title": "Compliance Score"}, {"type": "table", "title": "Regulatory Status"}]}'),
('Financial Overview', 'Comprehensive financial dashboard', 'financial', 'dashboard', '{"widgets": [{"type": "chart", "title": "Revenue vs Expenses", "chartType": "combo"}, {"type": "gauge", "title": "Profit Margin"}]}'),
('Customer Analytics', 'Customer behavior and engagement analytics', 'customer', 'dashboard', '{"widgets": [{"type": "chart", "title": "Customer Acquisition", "chartType": "area"}, {"type": "metric", "title": "Customer Lifetime Value"}]}'),
('Operational Metrics', 'Key operational performance indicators', 'operations', 'operational', '{"widgets": [{"type": "gauge", "title": "Efficiency Score"}, {"type": "kpi", "title": "Active Projects"}]}'),
('HR Analytics', 'Human resources and employee analytics', 'hr', 'operational', '{"widgets": [{"type": "chart", "title": "Employee Growth", "chartType": "line"}, {"type": "metric", "title": "Retention Rate"}]}'),
('Inventory Dashboard', 'Inventory management and stock analytics', 'inventory', 'operational', '{"widgets": [{"type": "chart", "title": "Stock Levels", "chartType": "bar"}, {"type": "kpi", "title": "Turnover Rate"}]}');

-- Sample Report Data Sources
INSERT INTO report_data_sources (name, source_type, connection_config, created_by) VALUES
('Main Database', 'database', '{"host": "localhost", "database": "main_db", "port": 5432}', gen_random_uuid()),
('Sales API', 'api', '{"endpoint": "/api/sales", "method": "GET", "auth": "Bearer"}', gen_random_uuid()),
('Financial Files', 'file', '{"path": "/data/financial", "format": "csv"}', gen_random_uuid()),
('Customer Data Stream', 'streaming', '{"topic": "customer_events", "type": "kafka"}', gen_random_uuid());

-- Enable Row Level Security
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_builder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_report_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (basic implementation)
CREATE POLICY "Users can view their own reports" ON custom_reports FOR SELECT USING (created_by = auth.uid() OR is_public = true);
CREATE POLICY "Users can create their own reports" ON custom_reports FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their own reports" ON custom_reports FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their own reports" ON custom_reports FOR DELETE USING (created_by = auth.uid());

-- Similar policies for other tables
CREATE POLICY "Users can view report templates" ON report_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own schedules" ON report_schedules FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can view their own analytics" ON report_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view shared reports" ON report_sharing FOR SELECT USING (auth.uid() = ANY(shared_with) OR shared_by = auth.uid());

-- Comments
COMMENT ON TABLE custom_reports IS 'Stores custom report definitions and configurations';
COMMENT ON TABLE report_templates IS 'Pre-built report templates for quick generation';
COMMENT ON TABLE report_schedules IS 'Automated report scheduling and delivery configurations';
COMMENT ON TABLE report_analytics IS 'Usage analytics and tracking for reports';
COMMENT ON TABLE report_sharing IS 'Report sharing permissions and access control';
COMMENT ON TABLE report_data_sources IS 'External data source configurations';
COMMENT ON TABLE report_widgets IS 'Individual dashboard widgets and their configurations';
COMMENT ON TABLE query_builder_history IS 'Saved query builder configurations and history';
COMMENT ON TABLE compliance_reports IS 'Regulatory compliance reports for UAE authorities';
COMMENT ON TABLE user_report_preferences IS 'User-specific reporting preferences and settings';