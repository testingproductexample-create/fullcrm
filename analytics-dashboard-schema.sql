-- Analytics Dashboard System Database Schema

-- Analytics Dashboards Table
CREATE TABLE IF NOT EXISTS analytics_dashboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(50) NOT NULL DEFAULT 'executive', -- executive, operational, financial, custom
    layout_config JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    owner_id UUID,
    permissions JSONB DEFAULT '{"read": true, "write": true, "admin": false}'
);

-- KPI Metrics Table
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- revenue, orders, employees, customers, financial
    metric_type VARCHAR(50) NOT NULL, -- total, average, percentage, count, trend
    current_value DECIMAL(15,2) DEFAULT 0,
    previous_value DECIMAL(15,2) DEFAULT 0,
    target_value DECIMAL(15,2),
    unit VARCHAR(20) DEFAULT 'AED', -- AED, percentage, count, etc.
    calculation_method JSONB, -- How to calculate the metric
    time_period VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly, quarterly, yearly
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    compliance_flags JSONB DEFAULT '{}', -- For Saudi/UAE compliance tracking
    threshold_warnings JSONB DEFAULT '{}' -- Warning thresholds
);

-- Dashboard Widgets Table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_id UUID REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- card, chart, table, gauge, progress
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data_source JSONB NOT NULL, -- SQL query or API endpoint
    visualization_config JSONB NOT NULL DEFAULT '{}', -- Chart configuration
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 3}', -- Grid position
    refresh_interval INTEGER DEFAULT 300, -- Seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"read": true, "write": true}'
);

-- Real-time Order Status Data
CREATE TABLE IF NOT EXISTS order_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL, -- pending, confirmed, processing, completed, cancelled
    status_percentage INTEGER DEFAULT 0,
    customer_id UUID,
    employee_id UUID,
    order_value DECIMAL(15,2) DEFAULT 0,
    completion_time INTEGER, -- Minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    sla_status VARCHAR(20) DEFAULT 'normal' -- normal, warning, breach
);

-- Employee Productivity Data
CREATE TABLE IF NOT EXISTS employee_productivity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    tasks_completed INTEGER DEFAULT 0,
    tasks_assigned INTEGER DEFAULT 0,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    working_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    customer_rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Financial Performance Data
CREATE TABLE IF NOT EXISTS financial_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    period_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'AED',
    comparison_value DECIMAL(15,2), -- Previous period value
    growth_percentage DECIMAL(5,2),
    category VARCHAR(50) DEFAULT 'revenue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customer Satisfaction Data
CREATE TABLE IF NOT EXISTS customer_satisfaction (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    service_type VARCHAR(100),
    order_id VARCHAR(100),
    satisfaction_score DECIMAL(3,2),
    response_time INTEGER, -- Minutes
    resolution_time INTEGER, -- Minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Revenue Tracking Data
CREATE TABLE IF NOT EXISTS revenue_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    revenue_amount DECIMAL(15,2) NOT NULL,
    cost_amount DECIMAL(15,2) DEFAULT 0,
    profit_amount DECIMAL(15,2),
    profit_margin DECIMAL(5,2),
    payment_method VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'AED',
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_category ON kpi_metrics(category);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_time_period ON kpi_metrics(time_period);
CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_order_metrics_status ON order_metrics(status);
CREATE INDEX IF NOT EXISTS idx_employee_productivity_date ON employee_productivity(date);
CREATE INDEX IF NOT EXISTS idx_employee_productivity_employee_id ON employee_productivity(employee_id);
CREATE INDEX IF NOT EXISTS idx_financial_performance_period ON financial_performance(period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_rating ON customer_satisfaction(rating);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_date ON revenue_tracking(transaction_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_analytics_dashboards_updated_at BEFORE UPDATE ON analytics_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_metrics_updated_at BEFORE UPDATE ON kpi_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_metrics_updated_at BEFORE UPDATE ON order_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_productivity_updated_at BEFORE UPDATE ON employee_productivity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();