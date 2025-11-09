-- Predictive Analytics System Database Schema
-- Create Database
CREATE DATABASE IF NOT EXISTS predictive_analytics;
USE predictive_analytics;

-- 1. Predictive Analytics Table
-- Main table for storing all predictive analytics data
CREATE TABLE predictive_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL, -- revenue, demand, customer, etc.
    analysis_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- linear, exponential, ml, etc.
    data_source VARCHAR(100) NOT NULL,
    historical_data JSON, -- Store historical data as JSON
    predicted_data JSON, -- Store predictions as JSON
    confidence_score DECIMAL(5,2), -- Confidence level (0-100)
    accuracy_score DECIMAL(5,2), -- Model accuracy percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    status ENUM('active', 'inactive', 'draft', 'archived') DEFAULT 'active',
    description TEXT,
    INDEX idx_analysis_type (analysis_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 2. Forecasting Models Table
-- Store forecasting model configurations and performance
CREATE TABLE forecasting_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- arima, lstm, linear, exponential
    model_version VARCHAR(20),
    parameters JSON, -- Model hyperparameters and configuration
    training_data_period_start DATE,
    training_data_period_end DATE,
    performance_metrics JSON, -- RMSE, MAE, R2, etc.
    model_accuracy DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_trained_at TIMESTAMP NULL,
    description TEXT,
    library_used VARCHAR(50), -- sklearn, tensorflow, statsmodels, etc.
    INDEX idx_model_type (model_type),
    INDEX idx_is_active (is_active),
    INDEX idx_last_trained (last_trained_at)
);

-- 3. Trend Analysis Table
-- Store trend analysis results and patterns
CREATE TABLE trend_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(50) NOT NULL, -- revenue, sales, users, etc.
    time_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly
    trend_direction ENUM('increasing', 'decreasing', 'stable', 'volatile'),
    trend_strength DECIMAL(5,2), -- Strength of trend (0-100)
    seasonal_patterns JSON, -- Seasonal decomposition data
    cyclical_patterns JSON, -- Business cycle data
    irregular_components JSON, -- Noise/irregular data
    trend_data JSON, -- Time series data
    seasonal_index JSON, -- Seasonal indices
    trend_equation TEXT, -- Mathematical equation describing trend
    r_squared DECIMAL(5,4), -- Goodness of fit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE,
    significance_level DECIMAL(5,4), -- Statistical significance
    INDEX idx_metric_name (metric_name),
    INDEX idx_time_period (time_period),
    INDEX idx_trend_direction (trend_direction),
    INDEX idx_period (period_start, period_end)
);

-- 4. Risk Assessment Table
-- Store risk analysis and assessment data
CREATE TABLE risk_assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    risk_name VARCHAR(100) NOT NULL,
    risk_category VARCHAR(50) NOT NULL, -- financial, operational, market, technology
    risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    probability DECIMAL(5,2), -- Probability of occurrence (0-100)
    impact_score DECIMAL(5,2), -- Impact if occurs (0-100)
    risk_score DECIMAL(8,2), -- Calculated risk score (probability * impact)
    mitigation_strategy TEXT,
    mitigation_status ENUM('planned', 'in_progress', 'completed', 'not_applicable'),
    owner VARCHAR(50), -- Person responsible for risk
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    review_date DATE,
    status ENUM('active', 'mitigated', 'accepted', 'transferred'),
    historical_data JSON, -- Past risk events
    scenario_analysis JSON, -- What-if scenario data
    control_effectiveness DECIMAL(5,2), -- Effectiveness of controls (0-100)
    residual_risk_score DECIMAL(8,2), -- Risk after mitigation
    INDEX idx_risk_category (risk_category),
    INDEX idx_risk_level (risk_level),
    INDEX idx_status (status),
    INDEX idx_review_date (review_date)
);

-- 5. Supporting Tables for Relationships

-- Forecast Predictions Table
CREATE TABLE forecast_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_id INT NOT NULL,
    analysis_id INT,
    prediction_date DATE NOT NULL,
    predicted_value DECIMAL(15,4),
    confidence_interval_lower DECIMAL(15,4),
    confidence_interval_upper DECIMAL(15,4),
    prediction_type ENUM('point', 'interval', 'distribution'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES forecasting_models(id) ON DELETE CASCADE,
    FOREIGN KEY (analysis_id) REFERENCES predictive_analytics(id) ON DELETE CASCADE,
    INDEX idx_model_id (model_id),
    INDEX idx_prediction_date (prediction_date)
);

-- Model Performance History
CREATE TABLE model_performance_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_id INT NOT NULL,
    evaluation_date DATE NOT NULL,
    metric_name VARCHAR(50) NOT NULL, -- rmse, mae, r2, mape, etc.
    metric_value DECIMAL(10,6),
    dataset_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES forecasting_models(id) ON DELETE CASCADE,
    INDEX idx_model_id (model_id),
    INDEX idx_evaluation_date (evaluation_date),
    INDEX idx_metric_name (metric_name)
);

-- Business Scenarios Table
CREATE TABLE business_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_name VARCHAR(100) NOT NULL,
    scenario_type ENUM('optimistic', 'pessimistic', 'base', 'best_case', 'worst_case'),
    description TEXT,
    assumptions JSON, -- Key assumptions for the scenario
    financial_projections JSON, -- Revenue, costs, profit projections
    probability DECIMAL(5,2), -- Likelihood of scenario
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_scenario_type (scenario_type),
    INDEX idx_probability (probability)
);

-- Data Quality Tracking
CREATE TABLE data_quality_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    column_name VARCHAR(50),
    metric_name VARCHAR(50) NOT NULL, -- completeness, accuracy, consistency, timeliness
    metric_value DECIMAL(5,2), -- Percentage or score
    measurement_date DATE NOT NULL,
    issues_detected JSON, -- List of data quality issues
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_name (table_name),
    INDEX idx_measurement_date (measurement_date),
    INDEX idx_metric_name (metric_name)
);

-- User Access and Permissions
CREATE TABLE user_access_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    table_accessed VARCHAR(50) NOT NULL,
    operation_type ENUM('select', 'insert', 'update', 'delete', 'export'),
    record_count INT,
    access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_user_id (user_id),
    INDEX idx_access_timestamp (access_timestamp),
    INDEX idx_table_accessed (table_accessed)
);

-- Create Views for Common Queries

-- View for Active Forecast Models
CREATE VIEW v_active_models AS
SELECT 
    fm.id,
    fm.model_name,
    fm.model_type,
    fm.model_version,
    fm.model_accuracy,
    fm.last_trained_at,
    fm.description,
    COUNT(fp.id) as total_predictions,
    MAX(fp.prediction_date) as latest_prediction_date
FROM forecasting_models fm
LEFT JOIN forecast_predictions fp ON fm.id = fp.model_id
WHERE fm.is_active = TRUE
GROUP BY fm.id, fm.model_name, fm.model_type, fm.model_version, 
         fm.model_accuracy, fm.last_trained_at, fm.description;

-- View for Risk Summary
CREATE VIEW v_risk_summary AS
SELECT 
    risk_category,
    COUNT(*) as total_risks,
    COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_risks,
    COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risks,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_risks,
    AVG(risk_score) as avg_risk_score,
    MAX(risk_score) as max_risk_score
FROM risk_assessment
WHERE status = 'active'
GROUP BY risk_category;

-- View for Model Performance Summary
CREATE VIEW v_model_performance_summary AS
SELECT 
    fm.id,
    fm.model_name,
    fm.model_type,
    fm.model_accuracy,
    mh.metric_name,
    mh.metric_value as latest_value,
    mh.evaluation_date as last_evaluation
FROM forecasting_models fm
LEFT JOIN model_performance_history mh ON fm.id = mh.model_id
WHERE mh.evaluation_date = (
    SELECT MAX(evaluation_date) 
    FROM model_performance_history mh2 
    WHERE mh2.model_id = fm.id AND mh2.metric_name = mh.metric_name
)
ORDER BY fm.id, mh.metric_name;

-- Create Stored Procedures

DELIMITER //

-- Procedure to update model performance
CREATE PROCEDURE UpdateModelPerformance(
    IN p_model_id INT,
    IN p_metric_name VARCHAR(50),
    IN p_metric_value DECIMAL(10,6),
    IN p_dataset_size INT
)
BEGIN
    INSERT INTO model_performance_history (model_id, metric_name, metric_value, dataset_size)
    VALUES (p_model_id, p_metric_name, p_metric_value, p_dataset_size);
    
    -- Update model accuracy if RMSE is provided
    IF p_metric_name = 'rmse' THEN
        UPDATE forecasting_models 
        SET model_accuracy = GREATEST(0, 100 - p_metric_value)
        WHERE id = p_model_id;
    END IF;
END //

-- Procedure to calculate risk score
CREATE PROCEDURE CalculateRiskScore(
    IN p_risk_id INT,
    IN p_probability DECIMAL(5,2),
    IN p_impact_score DECIMAL(5,2)
)
BEGIN
    UPDATE risk_assessment 
    SET 
        probability = p_probability,
        impact_score = p_impact_score,
        risk_score = (p_probability * p_impact_score) / 100
    WHERE id = p_risk_id;
END //

DELIMITER ;

-- Insert Sample Data

-- Sample forecasting models
INSERT INTO forecasting_models (model_name, model_type, model_version, parameters, training_data_period_start, training_data_period_end, model_accuracy, description, library_used) VALUES
('Revenue Forecast Linear', 'linear', 'v1.2', '{"alpha": 0.8, "beta": 0.2}', '2022-01-01', '2024-10-31', 92.5, 'Linear regression model for revenue forecasting', 'sklearn'),
('Demand Prediction ARIMA', 'arima', 'v2.1', '{"p": 2, "d": 1, "q": 1}', '2022-01-01', '2024-10-31', 89.3, 'ARIMA model for demand prediction', 'statsmodels'),
('Customer Churn ML', 'random_forest', 'v1.0', '{"n_estimators": 100, "max_depth": 10}', '2022-01-01', '2024-10-31', 85.7, 'Random Forest model for churn prediction', 'sklearn');

-- Sample predictive analytics data
INSERT INTO predictive_analytics (analysis_type, analysis_name, model_type, data_source, confidence_score, created_by, description) VALUES
('revenue', 'Q4 Revenue Forecast', 'linear', 'sales_data', 87.5, 'analyst_team', 'Quarterly revenue forecast using linear regression'),
('demand', 'Product Demand Forecast', 'arima', 'inventory_data', 89.2, 'operations_team', 'Monthly product demand prediction'),
('customer', 'Customer Churn Analysis', 'random_forest', 'customer_data', 85.1, 'marketing_team', 'Customer churn probability analysis');

-- Sample risk assessment data
INSERT INTO risk_assessment (risk_name, risk_category, risk_level, probability, impact_score, mitigation_strategy, mitigation_status, owner) VALUES
('Economic Downturn', 'market', 'high', 35.0, 80.0, 'Diversify revenue streams, build cash reserves', 'in_progress', 'cfo'),
('Cybersecurity Breach', 'technology', 'critical', 15.0, 95.0, 'Enhanced security protocols, regular audits', 'completed', 'cto'),
('Key Personnel Loss', 'operational', 'medium', 25.0, 60.0, 'Succession planning, knowledge transfer', 'planned', 'hr_director'),
('Regulatory Changes', 'compliance', 'medium', 40.0, 50.0, 'Compliance monitoring, legal consultation', 'in_progress', 'legal_team');

-- Sample trend analysis data
INSERT INTO trend_analysis (analysis_name, metric_name, time_period, trend_direction, trend_strength, trend_data, trend_equation) VALUES
('Revenue Growth Analysis', 'revenue', 'monthly', 'increasing', 87.5, '["Jan", "Feb", "Mar", "Apr", "May", "Jun"]', 'y = 1500 + 120*x'),
('Customer Acquisition', 'new_customers', 'monthly', 'increasing', 92.3, '["Jan", "Feb", "Mar", "Apr", "May", "Jun"]', 'y = 100 + 15*x'),
('Product Sales', 'units_sold', 'monthly', 'stable', 65.8, '["Jan", "Feb", "Mar", "Apr", "May", "Jun"]', 'y = 2000 + 50*sin(x)');

-- Sample business scenarios
INSERT INTO business_scenarios (scenario_name, scenario_type, description, assumptions, financial_projections, probability) VALUES
('Base Case Growth', 'base', 'Current trajectory with moderate growth', '{"growth_rate": 0.15, "market_stability": true}', '{"revenue": 3000000, "costs": 2100000, "profit": 900000}', 60.0),
('Market Expansion', 'optimistic', 'Aggressive market expansion scenario', '{"growth_rate": 0.25, "new_markets": true}', '{"revenue": 4500000, "costs": 2800000, "profit": 1700000}', 25.0),
('Economic Recession', 'pessimistic', 'Market contraction scenario', '{"growth_rate": -0.10, "market_stability": false}', '{"revenue": 1800000, "costs": 1600000, "profit": 200000}', 15.0);

-- Create Indexes for Performance
CREATE INDEX idx_predictive_analytics_type_status ON predictive_analytics(analysis_type, status);
CREATE INDEX idx_forecasting_models_type_active ON forecasting_models(model_type, is_active);
CREATE INDEX idx_risk_assessment_category_level ON risk_assessment(risk_category, risk_level);
CREATE INDEX idx_trend_analysis_metric_period ON trend_analysis(metric_name, time_period);
CREATE INDEX idx_forecast_predictions_date_model ON forecast_predictions(prediction_date, model_id);

-- End of Database Schema