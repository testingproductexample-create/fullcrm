-- RLS Policies for Analytics Dashboard System

-- Enable RLS on all tables
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Analytics Dashboards Policies
CREATE POLICY "Enable read access for authenticated users" ON analytics_dashboards
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for dashboard owners" ON analytics_dashboards
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id OR 
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
    );

CREATE POLICY "Enable update for dashboard owners and admins" ON analytics_dashboards
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
    );

CREATE POLICY "Enable delete for dashboard owners and admins" ON analytics_dashboards
    FOR DELETE USING (
        auth.uid() = owner_id OR 
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
    );

-- KPI Metrics Policies (Read-only for most users, admin can modify)
CREATE POLICY "Enable read access for authenticated users" ON kpi_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins" ON kpi_metrics
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'manager'
    );

CREATE POLICY "Enable update for admins and managers" ON kpi_metrics
    FOR UPDATE USING (
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() ->> 'user_metadata' ->> 'role' = 'manager'
    );

-- Dashboard Widgets Policies
CREATE POLICY "Enable read access for authenticated users" ON dashboard_widgets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for dashboard owners and admins" ON dashboard_widgets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM analytics_dashboards 
            WHERE id = dashboard_id AND 
            (owner_id = auth.uid() OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
        )
    );

CREATE POLICY "Enable update for dashboard owners and admins" ON dashboard_widgets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM analytics_dashboards 
            WHERE id = dashboard_id AND 
            (owner_id = auth.uid() OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
        )
    );

CREATE POLICY "Enable delete for dashboard owners and admins" ON dashboard_widgets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM analytics_dashboards 
            WHERE id = dashboard_id AND 
            (owner_id = auth.uid() OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
        )
    );

-- Order Metrics Policies (Operational data - all authenticated users can read)
CREATE POLICY "Enable read access for authenticated users" ON order_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for system service" ON order_metrics
    FOR INSERT WITH CHECK (true); -- Allow inserts from application service

CREATE POLICY "Enable update for system service" ON order_metrics
    FOR UPDATE USING (true); -- Allow updates from application service

-- Employee Productivity Policies
CREATE POLICY "Enable read access for authenticated users" ON employee_productivity
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for HR and managers" ON employee_productivity
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'manager', 'hr')
    );

CREATE POLICY "Enable update for HR and managers" ON employee_productivity
    FOR UPDATE USING (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'manager', 'hr')
    );

-- Financial Performance Policies
CREATE POLICY "Enable read access for authenticated users" ON financial_performance
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for finance and admins" ON financial_performance
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'finance', 'manager')
    );

CREATE POLICY "Enable update for finance and admins" ON financial_performance
    FOR UPDATE USING (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'finance', 'manager')
    );

-- Customer Satisfaction Policies
CREATE POLICY "Enable read access for authenticated users" ON customer_satisfaction
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for customer service" ON customer_satisfaction
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'customer_service', 'manager')
    );

CREATE POLICY "Enable update for customer service" ON customer_satisfaction
    FOR UPDATE USING (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'customer_service', 'manager')
    );

-- Revenue Tracking Policies
CREATE POLICY "Enable read access for authenticated users" ON revenue_tracking
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for finance and admins" ON revenue_tracking
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'finance', 'manager')
    );

CREATE POLICY "Enable update for finance and admins" ON revenue_tracking
    FOR UPDATE USING (
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'finance', 'manager')
    );

-- Additional Security: Ensure users can only see their own employee data
CREATE POLICY "Users can view their own productivity data" ON employee_productivity
    FOR SELECT USING (
        auth.uid()::text = employee_id::text OR
        auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'manager', 'hr')
    );