-- Employee Performance Table Schema
CREATE TABLE employee_performance (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    performance_score DECIMAL(5,2) NOT NULL,
    productivity_index DECIMAL(5,2),
    task_completion_rate DECIMAL(5,2),
    quality_rating DECIMAL(3,2),
    time_efficiency DECIMAL(5,2),
    collaboration_score DECIMAL(5,2),
    innovation_rating DECIMAL(5,2),
    leadership_score DECIMAL(5,2),
    customer_satisfaction DECIMAL(3,2),
    goal_achievement_rate DECIMAL(5,2),
    training_hours_completed DECIMAL(6,2),
    certifications_earned INTEGER DEFAULT 0,
    improvement_areas TEXT[],
    strengths TEXT[],
    goals_set INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    performance_trend VARCHAR(20) DEFAULT 'stable',
    peer_rating DECIMAL(3,2),
    manager_rating DECIMAL(3,2),
    performance_period VARCHAR(50) NOT NULL,
    evaluation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_employee_performance_employee ON employee_performance(employee_id);
CREATE INDEX idx_employee_performance_department ON employee_performance(department);
CREATE INDEX idx_employee_performance_period ON employee_performance(performance_period);
CREATE INDEX idx_employee_performance_score ON employee_performance(performance_score);
CREATE INDEX idx_employee_performance_evaluation ON employee_performance(evaluation_date);

-- RLS
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access for all users" ON employee_performance
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON employee_performance
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON employee_performance
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON employee_performance
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE employee_performance IS 'Detailed employee performance tracking and analytics';
COMMENT ON COLUMN employee_performance.performance_score IS 'Overall performance score (0-100)';
COMMENT ON COLUMN employee_performance.performance_trend IS 'Performance trend: improving, declining, stable';
COMMENT ON COLUMN employee_performance.peer_rating IS 'Peer review rating (0-10)';
COMMENT ON COLUMN employee_performance.manager_rating IS 'Manager evaluation rating (0-10)';