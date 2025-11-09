-- Sample Data Generator for Predictive Analytics System
-- This script generates realistic sample data for testing and demonstration

USE predictive_analytics;

-- Generate sample revenue data
DELIMITER //

CREATE PROCEDURE GenerateSampleRevenueData()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE start_date DATE DEFAULT '2022-01-01';
    DECLARE current_date DATE;
    DECLARE base_revenue DECIMAL(10,2) DEFAULT 2000000.00;
    DECLARE trend_factor DECIMAL(10,4);
    DECLARE seasonal_factor DECIMAL(10,4);
    DECLARE random_factor DECIMAL(10,4);
    
    WHILE i <= 36 DO
        SET current_date = DATE_ADD(start_date, INTERVAL i MONTH);
        SET trend_factor = 1 + (i * 0.02); -- 2% monthly growth
        SET seasonal_factor = CASE MONTH(current_date)
            WHEN 1 THEN 0.85
            WHEN 2 THEN 0.90
            WHEN 3 THEN 0.95
            WHEN 4 THEN 1.00
            WHEN 5 THEN 1.05
            WHEN 6 THEN 1.10
            WHEN 7 THEN 1.08
            WHEN 8 THEN 1.12
            WHEN 9 THEN 1.15
            WHEN 10 THEN 1.20
            WHEN 11 THEN 1.25
            WHEN 12 THEN 1.30
        END;
        SET random_factor = 0.9 + (RAND() * 0.2); -- ±10% random variation
        
        INSERT INTO predictive_analytics (
            analysis_type, analysis_name, model_type, data_source, 
            historical_data, confidence_score, accuracy_score, created_by
        ) VALUES (
            'revenue', 
            CONCAT('Monthly Revenue ', DATE_FORMAT(current_date, '%Y-%m')), 
            'linear',
            'revenue_data',
            JSON_OBJECT(
                'date', current_date,
                'revenue', base_revenue * trend_factor * seasonal_factor * random_factor,
                'month', MONTH(current_date),
                'year', YEAR(current_date),
                'quarter', QUARTER(current_date)
            ),
            85 + (RAND() * 10), -- 85-95% confidence
            88 + (RAND() * 8),  -- 88-96% accuracy
            'data_generator'
        );
        
        SET i = i + 1;
    END WHILE;
END //

-- Generate sample demand prediction data
CREATE PROCEDURE GenerateSampleDemandData()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE start_date DATE DEFAULT '2022-01-01';
    DECLARE current_date DATE;
    DECLARE base_demand INT DEFAULT 1000;
    DECLARE trend_factor DECIMAL(10,4);
    DECLARE seasonal_factor DECIMAL(10,4);
    DECLARE random_factor DECIMAL(10,4);
    
    WHILE i <= 36 DO
        SET current_date = DATE_ADD(start_date, INTERVAL i MONTH);
        SET trend_factor = 1 + (i * 0.015); -- 1.5% monthly growth
        SET seasonal_factor = CASE MONTH(current_date)
            WHEN 1 THEN 0.80
            WHEN 2 THEN 0.85
            WHEN 3 THEN 0.90
            WHEN 4 THEN 0.95
            WHEN 5 THEN 1.00
            WHEN 6 THEN 1.10
            WHEN 7 THEN 1.15
            WHEN 8 THEN 1.20
            WHEN 9 THEN 1.10
            WHEN 10 THEN 1.05
            WHEN 11 THEN 1.00
            WHEN 12 THEN 0.90
        END;
        SET random_factor = 0.85 + (RAND() * 0.3); -- ±15% random variation
        
        INSERT INTO predictive_analytics (
            analysis_type, analysis_name, model_type, data_source,
            historical_data, confidence_score, accuracy_score, created_by
        ) VALUES (
            'demand',
            CONCAT('Product Demand ', DATE_FORMAT(current_date, '%Y-%m')),
            'arima',
            'inventory_data',
            JSON_OBJECT(
                'date', current_date,
                'demand', base_demand * trend_factor * seasonal_factor * random_factor,
                'product_category', CASE WHEN RAND() > 0.7 THEN 'electronics' ELSE 'general' END,
                'month', MONTH(current_date),
                'year', YEAR(current_date)
            ),
            82 + (RAND() * 12), -- 82-94% confidence
            86 + (RAND() * 8),  -- 86-94% accuracy
            'demand_forecaster'
        );
        
        SET i = i + 1;
    END WHILE;
END //

-- Generate sample customer churn data
CREATE PROCEDURE GenerateSampleChurnData()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE customer_count INT DEFAULT 1000;
    DECLARE churn_base_rate DECIMAL(5,2) DEFAULT 8.5;
    DECLARE segment VARCHAR(20);
    DECLARE risk_score DECIMAL(5,2);
    DECLARE current_date DATE DEFAULT CURDATE();
    
    WHILE i <= 100 DO
        SET segment = CASE 
            WHEN RAND() > 0.8 THEN 'enterprise'
            WHEN RAND() > 0.5 THEN 'smb'
            ELSE 'individual'
        END;
        
        SET risk_score = CASE segment
            WHEN 'enterprise' THEN 2 + (RAND() * 8)    -- 2-10% risk
            WHEN 'smb' THEN 5 + (RAND() * 15)          -- 5-20% risk
            ELSE 8 + (RAND() * 20)                     -- 8-28% risk
        END;
        
        INSERT INTO predictive_analytics (
            analysis_type, analysis_name, model_type, data_source,
            historical_data, confidence_score, accuracy_score, created_by
        ) VALUES (
            'customer',
            CONCAT('Customer Churn Analysis ', i),
            'random_forest',
            'customer_database',
            JSON_OBJECT(
                'customer_id', CONCAT('CUST_', LPAD(i, 6, '0')),
                'segment', segment,
                'churn_probability', risk_score,
                'tenure_months', FLOOR(1 + (RAND() * 60)),
                'monthly_spend', FLOOR(50 + (RAND() * 950)),
                'support_tickets', FLOOR(RAND() * 10),
                'last_activity', DATE_SUB(current_date, INTERVAL FLOOR(RAND() * 30) DAY)
            ),
            75 + (RAND() * 20), -- 75-95% confidence
            82 + (RAND() * 12), -- 82-94% accuracy
            'churn_analyst'
        );
        
        SET i = i + 1;
    END WHILE;
END //

-- Generate sample trend analysis data
CREATE PROCEDURE GenerateSampleTrendData()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE metrics TEXT DEFAULT 'revenue,sales,users,traffic,conversion_rate';
    DECLARE metric_name VARCHAR(50);
    DECLARE token_count INT;
    DECLARE token_index INT;
    DECLARE start_value DECIMAL(10,2);
    DECLARE trend_slope DECIMAL(10,4);
    DECLARE trend_r2 DECIMAL(5,4);
    
    SET token_count = (LENGTH(metrics) - LENGTH(REPLACE(metrics, ',', '')) + 1);
    
    WHILE i <= token_count DO
        SET metric_name = SUBSTRING_INDEX(SUBSTRING_INDEX(metrics, ',', i), ',', -1);
        
        -- Generate different starting values and trends for different metrics
        SET start_value = CASE metric_name
            WHEN 'revenue' THEN 1500000
            WHEN 'sales' THEN 500
            WHEN 'users' THEN 10000
            WHEN 'traffic' THEN 50000
            WHEN 'conversion_rate' THEN 2.5
        END;
        
        SET trend_slope = CASE metric_name
            WHEN 'revenue' THEN 0.02
            WHEN 'sales' THEN 0.025
            WHEN 'users' THEN 0.03
            WHEN 'traffic' THEN 0.015
            WHEN 'conversion_rate' THEN 0.01
        END;
        
        SET trend_r2 = 0.75 + (RAND() * 0.2); -- 75-95% R-squared
        
        INSERT INTO trend_analysis (
            analysis_name, metric_name, time_period, trend_direction,
            trend_strength, trend_data, r_squared
        ) VALUES (
            CONCAT(CASE metric_name
                WHEN 'revenue' THEN 'Revenue Growth Analysis'
                WHEN 'sales' THEN 'Sales Performance Trend'
                WHEN 'users' THEN 'User Acquisition Trend'
                WHEN 'traffic' THEN 'Website Traffic Analysis'
                WHEN 'conversion_rate' THEN 'Conversion Optimization Trend'
            END),
            metric_name,
            'monthly',
            CASE 
                WHEN trend_slope > 0.02 THEN 'increasing'
                WHEN trend_slope < 0.01 THEN 'stable'
                ELSE 'volatile'
            END,
            70 + (RAND() * 25), -- 70-95% trend strength
            JSON_OBJECT(
                'data_points', 12,
                'start_value', start_value,
                'end_value', start_value * (1 + (trend_slope * 12)),
                'slope', trend_slope,
                'pattern', CASE WHEN RAND() > 0.7 THEN 'seasonal' ELSE 'linear' END
            ),
            trend_r2
        );
        
        SET i = i + 1;
    END WHILE;
END //

-- Generate sample risk assessment data
CREATE PROCEDURE GenerateSampleRiskData()
BEGIN
    DECLARE risk_types TEXT DEFAULT 'financial,operational,market,technology,compliance,reputation';
    DECLARE risk_count INT;
    DECLARE risk_name VARCHAR(100);
    DECLARE risk_category VARCHAR(50);
    DECLARE risk_level ENUM('low', 'medium', 'high', 'critical');
    DECLARE probability DECIMAL(5,2);
    DECLARE impact_score DECIMAL(5,2);
    DECLARE risk_score DECIMAL(8,2);
    DECLARE mitigation_status ENUM('planned', 'in_progress', 'completed', 'not_applicable');
    
    SET risk_count = (LENGTH(risk_types) - LENGTH(REPLACE(risk_types, ',', '')) + 1);
    
    -- Generate multiple risks for each category
    INSERT INTO risk_assessment (risk_name, risk_category, risk_level, probability, impact_score, mitigation_strategy, mitigation_status) VALUES
    -- Financial Risks
    ('Cash Flow Shortage', 'financial', 'high', 25.0, 85.0, 'Maintain 6-month cash reserves, improve collections', 'in_progress'),
    ('Credit Risk Default', 'financial', 'medium', 15.0, 70.0, 'Credit scoring system, payment terms optimization', 'completed'),
    ('Currency Exchange Risk', 'financial', 'medium', 30.0, 45.0, 'Hedging strategies, multi-currency accounts', 'planned'),
    
    -- Operational Risks
    ('Supply Chain Disruption', 'operational', 'critical', 20.0, 90.0, 'Diversify suppliers, safety stock management', 'in_progress'),
    ('System Downtime', 'operational', 'high', 35.0, 75.0, 'Redundancy systems, disaster recovery plans', 'completed'),
    ('Key Personnel Departure', 'operational', 'medium', 40.0, 60.0, 'Succession planning, knowledge documentation', 'planned'),
    
    -- Market Risks
    ('Economic Recession', 'market', 'high', 35.0, 80.0, 'Market diversification, cost optimization', 'in_progress'),
    ('Competitor Disruption', 'market', 'medium', 45.0, 65.0, 'Innovation pipeline, customer loyalty programs', 'planned'),
    ('Regulatory Changes', 'market', 'medium', 50.0, 55.0, 'Regulatory monitoring, compliance framework', 'in_progress'),
    
    -- Technology Risks
    ('Cybersecurity Breach', 'technology', 'critical', 15.0, 95.0, 'Security audits, incident response plan', 'completed'),
    ('Technology Obsolescence', 'technology', 'medium', 25.0, 70.0, 'Technology roadmap, R&D investment', 'planned'),
    ('Data Loss', 'technology', 'high', 10.0, 85.0, 'Backup systems, data recovery procedures', 'completed'),
    
    -- Compliance Risks
    ('Regulatory Non-compliance', 'compliance', 'critical', 20.0, 90.0, 'Compliance training, regular audits', 'in_progress'),
    ('Data Privacy Violations', 'compliance', 'high', 15.0, 80.0, 'Privacy framework, consent management', 'completed'),
    ('Environmental Compliance', 'compliance', 'medium', 30.0, 50.0, 'Environmental management system', 'planned'),
    
    -- Reputation Risks
    ('Brand Damage', 'reputation', 'high', 20.0, 75.0, 'Crisis communication plan, PR strategy', 'planned'),
    ('Social Media Crisis', 'reputation', 'medium', 35.0, 60.0, 'Social media monitoring, response team', 'in_progress'),
    ('Negative Reviews', 'reputation', 'low', 50.0, 40.0, 'Customer service excellence, review management', 'completed');
END //

-- Generate sample forecasting model performance data
CREATE PROCEDURE GenerateModelPerformanceData()
BEGIN
    DECLARE model_id INT;
    DECLARE i INT DEFAULT 1;
    DECLARE metrics TEXT DEFAULT 'rmse,mae,r2,mape';
    DECLARE metric_name VARCHAR(50);
    DECLARE metric_value DECIMAL(10,6);
    DECLARE dataset_size INT;
    
    -- Get all model IDs
    DECLARE done INT DEFAULT FALSE;
    DECLARE model_cursor CURSOR FOR SELECT id FROM forecasting_models;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN model_cursor;
    
    read_loop: LOOP
        FETCH model_cursor INTO model_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET i = 1;
        WHILE i <= 4 DO
            SET metric_name = SUBSTRING_INDEX(SUBSTRING_INDEX(metrics, ',', i), ',', -1);
            
            -- Generate realistic values for each metric
            SET metric_value = CASE metric_name
                WHEN 'rmse' THEN 0.5 + (RAND() * 2.0)    -- 0.5-2.5
                WHEN 'mae' THEN 0.3 + (RAND() * 1.5)     -- 0.3-1.8
                WHEN 'r2' THEN 0.7 + (RAND() * 0.25)     -- 0.7-0.95
                WHEN 'mape' THEN 5 + (RAND() * 15)       -- 5-20
            END;
            
            SET dataset_size = FLOOR(1000 + (RAND() * 9000));
            
            INSERT INTO model_performance_history (model_id, metric_name, metric_value, dataset_size)
            VALUES (model_id, metric_name, metric_value, dataset_size);
            
            SET i = i + 1;
        END WHILE;
    END LOOP;
    
    CLOSE model_cursor;
END //

DELIMITER ;

-- Execute all sample data generation procedures
CALL GenerateSampleRevenueData();
CALL GenerateSampleDemandData();
CALL GenerateSampleChurnData();
CALL GenerateSampleTrendData();
CALL GenerateSampleRiskData();
CALL GenerateModelPerformanceData();

-- Clean up procedures
DROP PROCEDURE GenerateSampleRevenueData;
DROP PROCEDURE GenerateSampleDemandData;
DROP PROCEDURE GenerateSampleChurnData;
DROP PROCEDURE GenerateSampleTrendData;
DROP PROCEDURE GenerateSampleRiskData;
DROP PROCEDURE GenerateModelPerformanceData;

-- Generate some realistic forecast predictions
INSERT INTO forecast_predictions (model_id, analysis_id, prediction_date, predicted_value, confidence_interval_lower, confidence_interval_upper, prediction_type) 
SELECT 
    fm.id as model_id,
    pa.id as analysis_id,
    DATE_ADD(CURDATE(), INTERVAL n MONTH) as prediction_date,
    (pa.historical_data->>'$.revenue' * (1.02 + (RAND() * 0.03))) as predicted_value,
    (pa.historical_data->>'$.revenue' * (1.02 + (RAND() * 0.03)) * 0.95) as confidence_interval_lower,
    (pa.historical_data->>'$.revenue' * (1.02 + (RAND() * 0.03)) * 1.05) as confidence_interval_upper,
    'interval' as prediction_type
FROM forecasting_models fm
CROSS JOIN predictive_analytics pa
CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) as months
WHERE fm.model_type = 'linear' 
  AND pa.analysis_type = 'revenue'
  AND fm.is_active = TRUE
LIMIT 20;

-- Update model accuracy based on performance history
UPDATE forecasting_models fm
SET fm.model_accuracy = (
    SELECT AVG(metric_value * 100) 
    FROM model_performance_history mh 
    WHERE mh.model_id = fm.id AND mh.metric_name = 'r2'
)
WHERE fm.id IN (SELECT DISTINCT model_id FROM model_performance_history);

-- Update risk scores
UPDATE risk_assessment 
SET risk_score = (probability * impact_score) / 100
WHERE risk_score IS NULL;

-- Add some sample data quality metrics
INSERT INTO data_quality_metrics (table_name, column_name, metric_name, metric_value, measurement_date, issues_detected) VALUES
('predictive_analytics', 'historical_data', 'completeness', 95.5, CURDATE(), JSON_ARRAY('Missing data in 4.5% of records')),
('forecasting_models', 'model_accuracy', 'accuracy', 88.2, CURDATE(), JSON_ARRAY('Accuracy below threshold for 2 models')),
('risk_assessment', 'mitigation_strategy', 'completeness', 92.8, CURDATE(), JSON_ARRAY('7 risks missing mitigation strategies')),
('trend_analysis', 'trend_data', 'consistency', 96.1, CURDATE(), NULL),
('forecast_predictions', 'predicted_value', 'validity', 94.7, CURDATE(), JSON_ARRAY('3 predictions outside expected range'));

-- Show summary of generated data
SELECT 
    'predictive_analytics' as table_name, 
    COUNT(*) as record_count 
FROM predictive_analytics
UNION ALL
SELECT 
    'forecasting_models' as table_name, 
    COUNT(*) as record_count 
FROM forecasting_models
UNION ALL
SELECT 
    'trend_analysis' as table_name, 
    COUNT(*) as record_count 
FROM trend_analysis
UNION ALL
SELECT 
    'risk_assessment' as table_name, 
    COUNT(*) as record_count 
FROM risk_assessment
UNION ALL
SELECT 
    'forecast_predictions' as table_name, 
    COUNT(*) as record_count 
FROM forecast_predictions
UNION ALL
SELECT 
    'model_performance_history' as table_name, 
    COUNT(*) as record_count 
FROM model_performance_history;