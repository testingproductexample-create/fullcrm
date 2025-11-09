-- Migration: create_task_assignment_rls_policies
-- Created at: 1762379997

-- Row Level Security Policies for Task Assignment & Workload Management System
-- Ensuring organization-based data isolation and role-based access control

-- Enable RLS on all task assignment tables
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_workloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_requirements ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is manager/admin
CREATE OR REPLACE FUNCTION is_user_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(role IN ('admin', 'manager', 'supervisor'), FALSE)
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user's employee ID
CREATE OR REPLACE FUNCTION get_user_employee_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT e.id 
        FROM employees e
        JOIN profiles p ON p.organization_id = e.organization_id
        WHERE p.id = auth.uid()
        AND (p.email = e.email OR p.phone = e.phone_primary)
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. TASK_ASSIGNMENTS Policies

-- Policy: Users can view task assignments in their organization
CREATE POLICY "Users can view task assignments in their organization" ON task_assignments
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Policy: Managers can create task assignments
CREATE POLICY "Managers can create task assignments" ON task_assignments
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Managers and assigned employees can update task assignments
CREATE POLICY "Managers and assigned employees can update task assignments" ON task_assignments
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND (
            is_user_manager() 
            OR primary_employee_id = get_user_employee_id()
            OR get_user_employee_id() = ANY(supporting_employee_ids)
        )
    );

-- Policy: Only managers can delete task assignments
CREATE POLICY "Only managers can delete task assignments" ON task_assignments
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 2. EMPLOYEE_WORKLOADS Policies

-- Policy: Users can view workloads in their organization
CREATE POLICY "Users can view workloads in their organization" ON employee_workloads
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Policy: System and managers can insert workload records
CREATE POLICY "System and managers can insert workload records" ON employee_workloads
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND (is_user_manager() OR current_setting('app.user_role', true) = 'system')
    );

-- Policy: System and managers can update workload records
CREATE POLICY "System and managers can update workload records" ON employee_workloads
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND (is_user_manager() OR current_setting('app.user_role', true) = 'system')
    );

-- Policy: Only managers can delete workload records
CREATE POLICY "Only managers can delete workload records" ON employee_workloads
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 3. ASSIGNMENT_RULES Policies

-- Policy: Users can view assignment rules in their organization
CREATE POLICY "Users can view assignment rules in their organization" ON assignment_rules
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Policy: Only managers can create assignment rules
CREATE POLICY "Only managers can create assignment rules" ON assignment_rules
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Only managers can update assignment rules
CREATE POLICY "Only managers can update assignment rules" ON assignment_rules
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Only managers can delete assignment rules
CREATE POLICY "Only managers can delete assignment rules" ON assignment_rules
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 4. PERFORMANCE_METRICS Policies

-- Policy: Users can view performance metrics in their organization
CREATE POLICY "Users can view performance metrics in their organization" ON performance_metrics
    FOR SELECT USING (
        organization_id = get_user_organization_id() 
        AND (
            is_user_manager() 
            OR employee_id = get_user_employee_id()
        )
    );

-- Policy: System and managers can insert performance metrics
CREATE POLICY "System and managers can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND (is_user_manager() OR current_setting('app.user_role', true) = 'system')
    );

-- Policy: System and managers can update performance metrics
CREATE POLICY "System and managers can update performance metrics" ON performance_metrics
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND (is_user_manager() OR current_setting('app.user_role', true) = 'system')
    );

-- Policy: Only managers can delete performance metrics
CREATE POLICY "Only managers can delete performance metrics" ON performance_metrics
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 5. TASK_COLLABORATIONS Policies

-- Policy: Users can view collaborations in their organization
CREATE POLICY "Users can view collaborations in their organization" ON task_collaborations
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Policy: Managers and involved employees can create collaborations
CREATE POLICY "Managers and involved employees can create collaborations" ON task_collaborations
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND (
            is_user_manager() 
            OR primary_employee_id = get_user_employee_id()
            OR secondary_employee_id = get_user_employee_id()
        )
    );

-- Policy: Managers and involved employees can update collaborations
CREATE POLICY "Managers and involved employees can update collaborations" ON task_collaborations
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND (
            is_user_manager() 
            OR primary_employee_id = get_user_employee_id()
            OR secondary_employee_id = get_user_employee_id()
        )
    );

-- Policy: Only managers can delete collaborations
CREATE POLICY "Only managers can delete collaborations" ON task_collaborations
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 6. WORKLOAD_ALERTS Policies

-- Policy: Users can view alerts in their organization
CREATE POLICY "Users can view alerts in their organization" ON workload_alerts
    FOR SELECT USING (
        organization_id = get_user_organization_id() 
        AND (
            is_user_manager() 
            OR employee_id = get_user_employee_id()
            OR manager_id = get_user_employee_id()
        )
    );

-- Policy: System and managers can create alerts
CREATE POLICY "System and managers can create alerts" ON workload_alerts
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND (is_user_manager() OR current_setting('app.user_role', true) = 'system')
    );

-- Policy: Managers and alert targets can update alerts
CREATE POLICY "Managers and alert targets can update alerts" ON workload_alerts
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND (
            is_user_manager() 
            OR employee_id = get_user_employee_id()
            OR manager_id = get_user_employee_id()
        )
    );

-- Policy: Only managers can delete alerts
CREATE POLICY "Only managers can delete alerts" ON workload_alerts
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 7. CAPACITY_PLANNING Policies

-- Policy: Users can view capacity planning in their organization
CREATE POLICY "Users can view capacity planning in their organization" ON capacity_planning
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Policy: Only managers can create capacity plans
CREATE POLICY "Only managers can create capacity plans" ON capacity_planning
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Only managers can update capacity plans
CREATE POLICY "Only managers can update capacity plans" ON capacity_planning
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Only managers can delete capacity plans
CREATE POLICY "Only managers can delete capacity plans" ON capacity_planning
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- 8. SKILL_REQUIREMENTS Policies

-- Policy: Users can view skill requirements in their organization
CREATE POLICY "Users can view skill requirements in their organization" ON skill_requirements
    FOR SELECT USING (organization_id = get_user_organization_id());

-- Policy: Only managers can create skill requirements
CREATE POLICY "Only managers can create skill requirements" ON skill_requirements
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Only managers can update skill requirements
CREATE POLICY "Only managers can update skill requirements" ON skill_requirements
    FOR UPDATE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Policy: Only managers can delete skill requirements
CREATE POLICY "Only managers can delete skill requirements" ON skill_requirements
    FOR DELETE USING (
        organization_id = get_user_organization_id() 
        AND is_user_manager()
    );

-- Create additional helper functions for complex queries

-- Function: Get employee's current workload
CREATE OR REPLACE FUNCTION get_employee_current_workload(employee_uuid UUID)
RETURNS TABLE (
    active_tasks INTEGER,
    current_hours DECIMAL(5,2),
    capacity_hours DECIMAL(5,2),
    utilization_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ew.current_active_tasks, 0) as active_tasks,
        COALESCE(ew.current_workload_hours, 0) as current_hours,
        COALESCE(ew.max_capacity_hours, 40) as capacity_hours,
        CASE 
            WHEN COALESCE(ew.max_capacity_hours, 40) > 0 
            THEN (COALESCE(ew.current_workload_hours, 0) * 100.0 / COALESCE(ew.max_capacity_hours, 40))
            ELSE 0
        END as utilization_percentage
    FROM employee_workloads ew
    WHERE ew.employee_id = employee_uuid
    AND ew.week_start_date = date_trunc('week', CURRENT_DATE)::DATE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate task priority score
CREATE OR REPLACE FUNCTION calculate_task_priority_score(
    priority_level_param VARCHAR(20),
    complexity_score_param INTEGER,
    due_date_param TIMESTAMP WITH TIME ZONE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    priority_weight DECIMAL(3,2);
    complexity_weight DECIMAL(3,2);
    urgency_weight DECIMAL(3,2);
    days_until_due INTEGER;
    total_score DECIMAL(5,2);
BEGIN
    -- Priority level weights
    priority_weight := CASE priority_level_param
        WHEN 'urgent' THEN 4.0
        WHEN 'high' THEN 3.0
        WHEN 'medium' THEN 2.0
        WHEN 'low' THEN 1.0
        ELSE 2.0
    END;
    
    -- Complexity weight (normalized to 1-4 scale)
    complexity_weight := COALESCE(complexity_score_param, 5) * 0.4;
    
    -- Urgency based on due date
    days_until_due := EXTRACT(DAYS FROM (due_date_param - CURRENT_TIMESTAMP));
    urgency_weight := CASE
        WHEN days_until_due <= 1 THEN 4.0
        WHEN days_until_due <= 3 THEN 3.0
        WHEN days_until_due <= 7 THEN 2.0
        WHEN days_until_due <= 14 THEN 1.5
        ELSE 1.0
    END;
    
    -- Calculate weighted average
    total_score := (priority_weight * 0.4) + (complexity_weight * 0.3) + (urgency_weight * 0.3);
    
    RETURN LEAST(total_score, 10.0); -- Cap at 10.0
END;
$$ LANGUAGE plpgsql;;