-- Migration: create_financial_compliance_tables
-- Created at: 1762411066

-- Advanced Financial Features & Compliance (AED) System Database Schema
-- UAE Financial Compliance and Advanced Features

-- 1. VAT Reports Table
CREATE TABLE IF NOT EXISTS vat_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    report_period VARCHAR(20) NOT NULL, -- "2024-Q1", "2024-01", etc.
    total_sales_aed DECIMAL(15,2) DEFAULT 0,
    total_vat_collected_aed DECIMAL(15,2) DEFAULT 0,
    total_purchases_aed DECIMAL(15,2) DEFAULT 0,
    total_vat_paid_aed DECIMAL(15,2) DEFAULT 0,
    net_vat_due_aed DECIMAL(15,2) DEFAULT 0,
    submission_status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected
    submission_date TIMESTAMP WITH TIME ZONE,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Audit Trails Table
CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- insert, update, delete
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- 3. Bank Reconciliation Table  
CREATE TABLE IF NOT EXISTS bank_reconciliation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    bank_account VARCHAR(100) NOT NULL,
    statement_date DATE NOT NULL,
    opening_balance_aed DECIMAL(15,2) DEFAULT 0,
    closing_balance_aed DECIMAL(15,2) DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    reconciled_amount_aed DECIMAL(15,2) DEFAULT 0,
    differences_aed DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reconciled, disputed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Compliance Calendar Table
CREATE TABLE IF NOT EXISTS compliance_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    compliance_type VARCHAR(50) NOT NULL, -- vat, corporate_tax, aml, audit, etc.
    requirement_name VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, overdue, exempted
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, critical
    description TEXT,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Financial Risk Assessment Table
CREATE TABLE IF NOT EXISTS financial_risk_assessment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    risk_type VARCHAR(50) NOT NULL, -- credit, market, operational, liquidity, regulatory
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    description TEXT NOT NULL,
    mitigation_plan TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, mitigated, monitoring, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Regulatory Reports Table
CREATE TABLE IF NOT EXISTS regulatory_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- central_bank, fta, securities_comm, etc.
    report_period VARCHAR(20) NOT NULL,
    submission_status VARCHAR(20) DEFAULT 'pending', -- pending, submitted, approved, rejected
    due_date DATE NOT NULL,
    submitted_date TIMESTAMP WITH TIME ZONE,
    report_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Financial Forecasting Table
CREATE TABLE IF NOT EXISTS financial_forecasting (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    forecast_type VARCHAR(30) NOT NULL, -- revenue, expense, cash_flow, budget
    forecast_period VARCHAR(20) NOT NULL, -- "2024-Q2", "2024", etc.
    revenue_projection_aed DECIMAL(15,2) DEFAULT 0,
    expense_projection_aed DECIMAL(15,2) DEFAULT 0,
    confidence_level DECIMAL(5,2) DEFAULT 80.00, -- percentage
    assumptions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vat_reports_org_period ON vat_reports(organization_id, report_period);
CREATE INDEX IF NOT EXISTS idx_audit_trails_org_table ON audit_trails(organization_id, table_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_org_date ON bank_reconciliation(organization_id, statement_date);
CREATE INDEX IF NOT EXISTS idx_compliance_calendar_org_due ON compliance_calendar(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_financial_risk_org_date ON financial_risk_assessment(organization_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_org_type ON regulatory_reports(organization_id, report_type);
CREATE INDEX IF NOT EXISTS idx_financial_forecasting_org_period ON financial_forecasting(organization_id, forecast_period);

-- Enable RLS on all tables
ALTER TABLE vat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_risk_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_forecasting ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (organization-based isolation)

-- VAT Reports policies
CREATE POLICY "vat_reports_select" ON vat_reports FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "vat_reports_insert" ON vat_reports FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "vat_reports_update" ON vat_reports FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "vat_reports_delete" ON vat_reports FOR DELETE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Audit Trails policies
CREATE POLICY "audit_trails_select" ON audit_trails FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "audit_trails_insert" ON audit_trails FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Bank Reconciliation policies
CREATE POLICY "bank_reconciliation_select" ON bank_reconciliation FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "bank_reconciliation_insert" ON bank_reconciliation FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "bank_reconciliation_update" ON bank_reconciliation FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Compliance Calendar policies  
CREATE POLICY "compliance_calendar_select" ON compliance_calendar FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "compliance_calendar_insert" ON compliance_calendar FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "compliance_calendar_update" ON compliance_calendar FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "compliance_calendar_delete" ON compliance_calendar FOR DELETE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Financial Risk Assessment policies
CREATE POLICY "financial_risk_assessment_select" ON financial_risk_assessment FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "financial_risk_assessment_insert" ON financial_risk_assessment FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "financial_risk_assessment_update" ON financial_risk_assessment FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Regulatory Reports policies
CREATE POLICY "regulatory_reports_select" ON regulatory_reports FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "regulatory_reports_insert" ON regulatory_reports FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "regulatory_reports_update" ON regulatory_reports FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Financial Forecasting policies
CREATE POLICY "financial_forecasting_select" ON financial_forecasting FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "financial_forecasting_insert" ON financial_forecasting FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
CREATE POLICY "financial_forecasting_update" ON financial_forecasting FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);;