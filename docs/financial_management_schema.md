# Financial Management System - Database Schema

## Overview
Complete financial management system for UAE tailoring business with AED currency, VAT compliance, and comprehensive tracking.

## Tables

### 1. revenue_tracking
Tracks all revenue sources including orders, appointments, and services.

```sql
CREATE TABLE revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('order', 'appointment', 'service', 'refund', 'adjustment')),
  amount_aed DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Reference Links
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Payment Details
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'received', 'partial', 'overdue', 'cancelled')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque', 'online')),
  payment_date DATE,
  
  -- VAT Details
  vat_applied BOOLEAN DEFAULT true,
  vat_rate DECIMAL(5,2) DEFAULT 5.00,
  vat_amount_aed DECIMAL(12,2),
  net_amount_aed DECIMAL(12,2),
  gross_amount_aed DECIMAL(12,2),
  
  -- Metadata
  invoice_number VARCHAR(50) UNIQUE,
  fiscal_year INTEGER,
  fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
  fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### 2. expense_tracking
Tracks all business expenses with UAE business categories.

```sql
CREATE TABLE expense_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Expense Details
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'materials', 'labor', 'overhead', 'utilities', 'rent', 
    'marketing', 'equipment', 'insurance', 'bank_charges', 
    'professional_services', 'administrative', 'maintenance', 'transportation'
  )),
  subcategory VARCHAR(100),
  amount_aed DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vendor Details
  vendor_name VARCHAR(200),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Documentation
  receipt_url TEXT,
  invoice_number VARCHAR(50),
  
  -- Classification
  expense_type VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (expense_type IN ('operational', 'capital', 'one_time')),
  deductible_status BOOLEAN DEFAULT true,
  
  -- VAT Details
  vat_included BOOLEAN DEFAULT false,
  vat_amount_aed DECIMAL(12,2),
  
  -- Budget Tracking
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  
  -- Payment Details
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
  payment_method VARCHAR(50),
  payment_date DATE,
  
  -- Metadata
  fiscal_year INTEGER,
  fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
  fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### 3. financial_transactions
Comprehensive transaction log for all financial activities.

```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('revenue', 'expense', 'transfer', 'adjustment', 'refund')),
  transaction_category VARCHAR(50),
  amount_aed DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Reference Links
  reference_id UUID,
  reference_type VARCHAR(50) CHECK (reference_type IN ('order', 'appointment', 'expense', 'revenue', 'payroll', 'inventory')),
  
  -- Account Tracking
  account_type VARCHAR(50) CHECK (account_type IN ('cash', 'bank', 'credit', 'other')),
  balance_before_aed DECIMAL(12,2),
  balance_after_aed DECIMAL(12,2),
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT false,
  reconciliation_date DATE,
  
  -- Metadata
  fiscal_year INTEGER,
  fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
  fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### 4. budgets
Budget planning and tracking for different categories.

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Budget Period
  budget_name VARCHAR(200) NOT NULL,
  budget_period VARCHAR(30) NOT NULL CHECK (budget_period IN ('monthly', 'quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  
  -- Budget Category
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Budget Amounts
  budgeted_amount_aed DECIMAL(12,2) NOT NULL,
  actual_amount_aed DECIMAL(12,2) DEFAULT 0,
  variance_amount_aed DECIMAL(12,2) GENERATED ALWAYS AS (budgeted_amount_aed - actual_amount_aed) STORED,
  variance_percentage DECIMAL(5,2),
  
  -- Status
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  
  -- Alerts
  alert_threshold_percentage DECIMAL(5,2) DEFAULT 80.00,
  alert_triggered BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### 5. financial_reports
Stores generated financial reports for historical reference.

```sql
CREATE TABLE financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Report Details
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'profit_loss', 'cash_flow', 'balance_sheet', 'budget_variance', 
    'revenue_analysis', 'expense_analysis', 'vat_return', 'financial_summary'
  )),
  report_period VARCHAR(30) NOT NULL CHECK (report_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom')),
  report_name VARCHAR(200) NOT NULL,
  
  -- Period Coverage
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fiscal_year INTEGER,
  fiscal_quarter INTEGER,
  
  -- Report Data (JSON format)
  report_data JSONB NOT NULL,
  summary_metrics JSONB,
  
  -- Export Information
  export_format VARCHAR(20) CHECK (export_format IN ('pdf', 'excel', 'csv', 'json')),
  file_url TEXT,
  
  -- Status
  generated_date TIMESTAMP DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. vendors (Supporting Table)
Vendor/supplier management for expense tracking.

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Vendor Details
  vendor_name VARCHAR(200) NOT NULL,
  vendor_code VARCHAR(50) UNIQUE,
  vendor_type VARCHAR(50) CHECK (vendor_type IN ('supplier', 'service_provider', 'contractor', 'utility', 'landlord', 'other')),
  
  -- Contact Information
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  
  -- Business Details
  trn_number VARCHAR(50),
  payment_terms VARCHAR(100),
  credit_limit_aed DECIMAL(12,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Indexes

```sql
-- Revenue Tracking Indexes
CREATE INDEX idx_revenue_organization ON revenue_tracking(organization_id);
CREATE INDEX idx_revenue_date ON revenue_tracking(transaction_date);
CREATE INDEX idx_revenue_status ON revenue_tracking(payment_status);
CREATE INDEX idx_revenue_type ON revenue_tracking(transaction_type);
CREATE INDEX idx_revenue_customer ON revenue_tracking(customer_id);
CREATE INDEX idx_revenue_order ON revenue_tracking(order_id);
CREATE INDEX idx_revenue_fiscal_period ON revenue_tracking(fiscal_year, fiscal_quarter, fiscal_month);

-- Expense Tracking Indexes
CREATE INDEX idx_expense_organization ON expense_tracking(organization_id);
CREATE INDEX idx_expense_date ON expense_tracking(expense_date);
CREATE INDEX idx_expense_category ON expense_tracking(category);
CREATE INDEX idx_expense_vendor ON expense_tracking(vendor_id);
CREATE INDEX idx_expense_status ON expense_tracking(payment_status);
CREATE INDEX idx_expense_fiscal_period ON expense_tracking(fiscal_year, fiscal_quarter, fiscal_month);

-- Financial Transactions Indexes
CREATE INDEX idx_transaction_organization ON financial_transactions(organization_id);
CREATE INDEX idx_transaction_date ON financial_transactions(transaction_date);
CREATE INDEX idx_transaction_type ON financial_transactions(transaction_type);
CREATE INDEX idx_transaction_reference ON financial_transactions(reference_id, reference_type);
CREATE INDEX idx_transaction_fiscal_period ON financial_transactions(fiscal_year, fiscal_quarter, fiscal_month);

-- Budgets Indexes
CREATE INDEX idx_budget_organization ON budgets(organization_id);
CREATE INDEX idx_budget_period ON budgets(start_date, end_date);
CREATE INDEX idx_budget_category ON budgets(category);
CREATE INDEX idx_budget_status ON budgets(status);
CREATE INDEX idx_budget_fiscal_year ON budgets(fiscal_year);

-- Financial Reports Indexes
CREATE INDEX idx_report_organization ON financial_reports(organization_id);
CREATE INDEX idx_report_type ON financial_reports(report_type);
CREATE INDEX idx_report_period ON financial_reports(start_date, end_date);
CREATE INDEX idx_report_fiscal_period ON financial_reports(fiscal_year, fiscal_quarter);

-- Vendors Indexes
CREATE INDEX idx_vendor_organization ON vendors(organization_id);
CREATE INDEX idx_vendor_active ON vendors(is_active);
```

## RLS Policies

All tables implement Row-Level Security for multi-tenant isolation:

```sql
-- Enable RLS
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern for all tables)
CREATE POLICY "Users can view their organization's data" ON revenue_tracking
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their organization's data" ON revenue_tracking
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their organization's data" ON revenue_tracking
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their organization's data" ON revenue_tracking
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));
```

## Integration Points

1. **Orders System**: Link revenue_tracking to orders table
2. **Appointments System**: Link revenue_tracking to appointments table
3. **Inventory System**: Track material costs in expense_tracking
4. **Payroll System**: Track labor costs in expense_tracking
5. **Customers**: Link revenue to customer_id for analytics

## UAE Compliance

1. **VAT Compliance**: 5% standard rate applied to applicable transactions
2. **AED Currency**: All amounts in AED with 2 decimal precision
3. **Fiscal Year**: January to December
4. **Business Categories**: UAE-specific expense categories
5. **TRN Numbers**: Track vendor TRN for VAT compliance
