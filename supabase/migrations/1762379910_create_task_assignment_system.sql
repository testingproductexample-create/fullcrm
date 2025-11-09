-- Migration: create_task_assignment_system
-- Created at: 1762379910

-- Task Assignment & Workload Management System Database Schema
-- Creating comprehensive tables for intelligent workforce optimization

-- 1. Task Assignments - Core assignment tracking
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Task Reference
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    workflow_status_id UUID REFERENCES order_workflow_statuses(id) ON DELETE SET NULL,
    task_type VARCHAR(100) NOT NULL, -- 'workflow_stage', 'alteration', 'fitting', 'quality_check'
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    
    -- Employee Assignment
    primary_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    supporting_employee_ids UUID[], -- Array for multi-employee tasks
    assigned_by_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Task Details
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Skill Requirements
    required_skills JSONB, -- Array of {skill_name, proficiency_level, is_required}
    skill_match_score DECIMAL(5,2), -- How well employee skills match requirements
    
    -- Status Tracking
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'paused', 'completed', 'cancelled'
    assignment_method VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'auto', 'manual', 'requested'
    
    -- Timeline
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance Tracking
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
    quality_notes TEXT,
    customer_satisfaction_score DECIMAL(3,2) CHECK (customer_satisfaction_score >= 0 AND customer_satisfaction_score <= 5),
    
    -- Collaboration
    collaboration_required BOOLEAN DEFAULT FALSE,
    collaboration_notes TEXT,
    
    -- Notes and Comments
    assignment_notes TEXT,
    completion_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employee Workloads - Real-time capacity tracking
CREATE TABLE employee_workloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Current Workload
    current_active_tasks INTEGER DEFAULT 0,
    current_workload_hours DECIMAL(5,2) DEFAULT 0,
    max_capacity_hours DECIMAL(5,2) NOT NULL DEFAULT 40, -- Weekly capacity
    
    -- Availability
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'overloaded', 'unavailable', 'on_leave'
    availability_start_date DATE,
    availability_end_date DATE,
    availability_notes TEXT,
    
    -- Performance Metrics
    avg_task_completion_time DECIMAL(5,2),
    avg_quality_score DECIMAL(3,2),
    tasks_completed_this_week INTEGER DEFAULT 0,
    tasks_completed_this_month INTEGER DEFAULT 0,
    
    -- Efficiency Metrics
    efficiency_score DECIMAL(3,2), -- Based on estimated vs actual time
    consistency_score DECIMAL(3,2), -- Consistency in delivery times
    collaboration_score DECIMAL(3,2), -- How well they work in teams
    
    -- Workload Alerts
    is_overloaded BOOLEAN DEFAULT FALSE,
    is_underutilized BOOLEAN DEFAULT FALSE,
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    
    -- Timeline Tracking
    week_start_date DATE NOT NULL,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, employee_id, week_start_date)
);

-- 3. Assignment Rules - Configurable automation
CREATE TABLE assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Rule Definition
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- 'skill_based', 'workload_based', 'priority_based', 'rotation'
    
    -- Conditions
    task_types VARCHAR(100)[], -- Which task types this rule applies to
    priority_levels VARCHAR(20)[], -- Which priority levels trigger this rule
    customer_types VARCHAR(50)[], -- VIP, regular, wholesale
    order_value_min DECIMAL(10,2), -- Minimum order value
    order_value_max DECIMAL(10,2), -- Maximum order value
    
    -- Skill Requirements
    required_skills JSONB, -- Skill matching criteria
    min_proficiency_level VARCHAR(20), -- Minimum skill level required
    certification_required BOOLEAN DEFAULT FALSE,
    
    -- Employee Selection Criteria
    department_ids UUID[], -- Restrict to specific departments
    max_concurrent_tasks INTEGER, -- Max tasks per employee
    preferred_employee_ids UUID[], -- Preferred employees for this rule
    excluded_employee_ids UUID[], -- Employees to exclude
    
    -- Assignment Logic
    assignment_logic VARCHAR(50) NOT NULL DEFAULT 'best_match', -- 'best_match', 'round_robin', 'least_busy', 'most_experienced'
    load_balancing_enabled BOOLEAN DEFAULT TRUE,
    consider_availability BOOLEAN DEFAULT TRUE,
    consider_workload BOOLEAN DEFAULT TRUE,
    
    -- Rule Settings
    is_active BOOLEAN DEFAULT TRUE,
    priority_order INTEGER DEFAULT 10, -- Lower numbers = higher priority
    auto_assign BOOLEAN DEFAULT FALSE, -- Automatically assign or just suggest
    
    -- Performance Tracking
    times_triggered INTEGER DEFAULT 0,
    successful_assignments INTEGER DEFAULT 0,
    avg_assignment_quality DECIMAL(3,2),
    
    -- Metadata
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Performance Metrics - Detailed tracking
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Metric Period
    metric_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Task Performance
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_in_progress INTEGER DEFAULT 0,
    tasks_overdue INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- Time Management
    total_estimated_hours DECIMAL(7,2) DEFAULT 0,
    total_actual_hours DECIMAL(7,2) DEFAULT 0,
    avg_task_duration DECIMAL(5,2) DEFAULT 0,
    time_efficiency_ratio DECIMAL(5,2) DEFAULT 0, -- Estimated/Actual
    
    -- Quality Metrics
    avg_quality_score DECIMAL(3,2),
    quality_consistency_score DECIMAL(3,2),
    rework_requests INTEGER DEFAULT 0,
    customer_complaints INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2),
    
    -- Collaboration Metrics
    multi_employee_tasks INTEGER DEFAULT 0,
    mentoring_sessions INTEGER DEFAULT 0,
    knowledge_sharing_sessions INTEGER DEFAULT 0,
    team_collaboration_score DECIMAL(3,2),
    
    -- Skill Development
    new_skills_learned INTEGER DEFAULT 0,
    certifications_earned INTEGER DEFAULT 0,
    training_hours_completed DECIMAL(5,2) DEFAULT 0,
    skill_improvement_score DECIMAL(3,2),
    
    -- Attendance & Availability
    working_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    late_arrivals INTEGER DEFAULT 0,
    availability_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Financial Impact
    revenue_generated DECIMAL(12,2) DEFAULT 0,
    cost_savings DECIMAL(12,2) DEFAULT 0,
    efficiency_cost_ratio DECIMAL(7,2) DEFAULT 0,
    
    -- Department Comparison
    department_rank INTEGER,
    department_percentile DECIMAL(5,2),
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, employee_id, metric_period, period_start_date)
);

-- 5. Task Collaborations - Multi-employee coordination
CREATE TABLE task_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_assignment_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
    
    -- Collaboration Details
    collaboration_type VARCHAR(50) NOT NULL, -- 'mentoring', 'joint_work', 'review', 'knowledge_transfer'
    primary_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    secondary_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Role Definition
    primary_role VARCHAR(50) NOT NULL, -- 'lead', 'mentor', 'specialist', 'reviewer'
    secondary_role VARCHAR(50) NOT NULL, -- 'assistant', 'mentee', 'support', 'checker'
    
    -- Collaboration Progress
    collaboration_status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Time Allocation
    estimated_hours_primary DECIMAL(5,2),
    estimated_hours_secondary DECIMAL(5,2),
    actual_hours_primary DECIMAL(5,2),
    actual_hours_secondary DECIMAL(5,2),
    
    -- Quality & Feedback
    collaboration_effectiveness DECIMAL(3,2), -- 1-5 rating
    knowledge_transfer_rating DECIMAL(3,2), -- How much was learned
    synergy_score DECIMAL(3,2), -- How well they worked together
    
    -- Communication
    communication_frequency VARCHAR(20), -- 'high', 'medium', 'low'
    preferred_communication_method VARCHAR(50), -- 'in_person', 'whatsapp', 'email', 'phone'
    
    -- Timeline
    planned_start_date TIMESTAMP WITH TIME ZONE,
    planned_end_date TIMESTAMP WITH TIME ZONE,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    collaboration_notes TEXT,
    completion_feedback TEXT,
    
    -- Metadata
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Workload Alerts - Automated notifications
CREATE TABLE workload_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Alert Target
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Alert Details
    alert_type VARCHAR(50) NOT NULL, -- 'overload', 'underutilized', 'skill_gap', 'deadline_risk', 'quality_concern'
    alert_severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    
    -- Alert Data
    current_workload_hours DECIMAL(5,2),
    capacity_utilization_percentage DECIMAL(5,2),
    tasks_at_risk INTEGER,
    affected_orders UUID[],
    
    -- Alert Status
    alert_status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    priority_level INTEGER DEFAULT 5 CHECK (priority_level >= 1 AND priority_level <= 10),
    
    -- Response Tracking
    acknowledged_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Automatic Actions
    auto_action_taken VARCHAR(100), -- 'reassignment', 'capacity_increase', 'deadline_extension'
    auto_action_details JSONB,
    
    -- Escalation
    escalation_level INTEGER DEFAULT 1,
    escalated_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    escalated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Capacity Planning - Future resource planning
CREATE TABLE capacity_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Planning Period
    planning_period VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly'
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Department/Employee Scope
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Demand Forecasting
    expected_orders INTEGER,
    expected_order_value DECIMAL(12,2),
    peak_periods JSONB, -- Array of {start_date, end_date, intensity_multiplier}
    seasonal_adjustments JSONB,
    
    -- Capacity Analysis
    current_total_capacity DECIMAL(8,2), -- Total hours available
    projected_demand_hours DECIMAL(8,2), -- Estimated hours needed
    capacity_gap_hours DECIMAL(8,2), -- Positive = surplus, Negative = deficit
    utilization_target_percentage DECIMAL(5,2) DEFAULT 85,
    
    -- Skill Analysis
    skill_demand_forecast JSONB, -- Projected skill requirements
    skill_availability JSONB, -- Current skill capacity
    skill_gaps JSONB, -- Skills that need development/hiring
    
    -- Resource Recommendations
    hiring_recommendations JSONB, -- Suggested new hires
    training_recommendations JSONB, -- Skill development needs
    equipment_recommendations JSONB, -- Additional tools/equipment
    outsourcing_recommendations JSONB, -- Tasks to outsource
    
    -- Scenario Planning
    best_case_scenario JSONB,
    worst_case_scenario JSONB,
    most_likely_scenario JSONB,
    contingency_plans JSONB,
    
    -- Budget Impact
    current_labor_cost DECIMAL(12,2),
    projected_labor_cost DECIMAL(12,2),
    additional_investment_needed DECIMAL(12,2),
    expected_roi DECIMAL(5,2),
    
    -- Approval & Implementation
    plan_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'implemented'
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    implementation_start_date DATE,
    
    -- Performance Tracking
    actual_vs_planned_variance DECIMAL(5,2),
    accuracy_score DECIMAL(3,2), -- How accurate the forecast was
    
    -- Metadata
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, planning_period, period_start_date, department_id, employee_id)
);

-- 8. Skill Requirements - Task skill matching matrix
CREATE TABLE skill_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Task Classification
    task_type VARCHAR(100) NOT NULL, -- Links to task_assignments.task_type
    task_complexity_level INTEGER CHECK (task_complexity_level >= 1 AND task_complexity_level <= 10),
    order_type VARCHAR(50), -- 'suit', 'shirt', 'dress', 'alteration'
    customer_tier VARCHAR(20), -- 'vip', 'premium', 'standard'
    
    -- Skill Requirements
    primary_skill_category VARCHAR(100) NOT NULL,
    primary_skill_name VARCHAR(100) NOT NULL,
    required_proficiency_level VARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
    is_mandatory BOOLEAN DEFAULT TRUE,
    
    -- Additional Skills
    secondary_skills JSONB, -- Array of {skill_name, proficiency_level, weight}
    nice_to_have_skills JSONB, -- Optional skills that add value
    
    -- Experience Requirements
    minimum_years_experience DECIMAL(3,1) DEFAULT 0,
    specific_experience_types VARCHAR(100)[], -- 'luxury_fabrics', 'wedding_dress', 'mens_formal'
    
    -- Certification Requirements
    required_certifications VARCHAR(100)[],
    preferred_certifications VARCHAR(100)[],
    
    -- Quality Standards
    minimum_quality_score DECIMAL(3,2) DEFAULT 3.0,
    maximum_rework_tolerance INTEGER DEFAULT 2,
    customer_interaction_required BOOLEAN DEFAULT FALSE,
    
    -- Time Constraints
    typical_completion_time_hours DECIMAL(5,2),
    maximum_completion_time_hours DECIMAL(5,2),
    rush_order_capability_required BOOLEAN DEFAULT FALSE,
    
    -- Collaboration Requirements
    team_work_required BOOLEAN DEFAULT FALSE,
    mentoring_capability_required BOOLEAN DEFAULT FALSE,
    training_others_required BOOLEAN DEFAULT FALSE,
    
    -- Equipment/Tools
    required_tools JSONB, -- Array of tools/equipment needed
    workspace_requirements VARCHAR(255),
    
    -- Performance Benchmarks
    target_efficiency_score DECIMAL(3,2) DEFAULT 3.5,
    target_quality_score DECIMAL(3,2) DEFAULT 4.0,
    target_customer_satisfaction DECIMAL(3,2) DEFAULT 4.0,
    
    -- Business Rules
    priority_modifier DECIMAL(3,2) DEFAULT 1.0, -- Multiplier for task priority
    cost_impact_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    revenue_impact_level VARCHAR(20) DEFAULT 'medium',
    
    -- Version Control
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE DEFAULT CURRENT_DATE,
    retirement_date DATE,
    version_number INTEGER DEFAULT 1,
    superseded_by UUID REFERENCES skill_requirements(id) ON DELETE SET NULL,
    
    -- Metadata
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_task_assignments_employee ON task_assignments(primary_employee_id);
CREATE INDEX idx_task_assignments_order ON task_assignments(order_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(assignment_status);
CREATE INDEX idx_task_assignments_due_date ON task_assignments(due_date);
CREATE INDEX idx_task_assignments_organization ON task_assignments(organization_id);

CREATE INDEX idx_employee_workloads_employee ON employee_workloads(employee_id);
CREATE INDEX idx_employee_workloads_week ON employee_workloads(week_start_date);
CREATE INDEX idx_employee_workloads_status ON employee_workloads(availability_status);
CREATE INDEX idx_employee_workloads_organization ON employee_workloads(organization_id);

CREATE INDEX idx_assignment_rules_active ON assignment_rules(is_active);
CREATE INDEX idx_assignment_rules_priority ON assignment_rules(priority_order);
CREATE INDEX idx_assignment_rules_organization ON assignment_rules(organization_id);

CREATE INDEX idx_performance_metrics_employee ON performance_metrics(employee_id);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(metric_period, period_start_date);
CREATE INDEX idx_performance_metrics_organization ON performance_metrics(organization_id);

CREATE INDEX idx_task_collaborations_task ON task_collaborations(task_assignment_id);
CREATE INDEX idx_task_collaborations_employees ON task_collaborations(primary_employee_id, secondary_employee_id);
CREATE INDEX idx_task_collaborations_organization ON task_collaborations(organization_id);

CREATE INDEX idx_workload_alerts_employee ON workload_alerts(employee_id);
CREATE INDEX idx_workload_alerts_status ON workload_alerts(alert_status);
CREATE INDEX idx_workload_alerts_severity ON workload_alerts(alert_severity);
CREATE INDEX idx_workload_alerts_organization ON workload_alerts(organization_id);

CREATE INDEX idx_capacity_planning_period ON capacity_planning(period_start_date, period_end_date);
CREATE INDEX idx_capacity_planning_department ON capacity_planning(department_id);
CREATE INDEX idx_capacity_planning_organization ON capacity_planning(organization_id);

CREATE INDEX idx_skill_requirements_task_type ON skill_requirements(task_type);
CREATE INDEX idx_skill_requirements_skill ON skill_requirements(primary_skill_category, primary_skill_name);
CREATE INDEX idx_skill_requirements_active ON skill_requirements(is_active);
CREATE INDEX idx_skill_requirements_organization ON skill_requirements(organization_id);;