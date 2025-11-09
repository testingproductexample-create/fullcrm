-- Migration: create_billing_invoice_system
-- Created at: 1762402405

-- Invoice & Billing System Tables
-- Creates 6 tables for complete invoice and payment management

-- 1. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Invoice dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Financial amounts (AED)
  subtotal_aed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount_aed DECIMAL(12, 2) DEFAULT 0,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  vat_amount_aed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount_aed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  paid_amount_aed DECIMAL(12, 2) DEFAULT 0,
  balance_due_aed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Invoice details
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  payment_terms VARCHAR(100),
  notes TEXT,
  internal_notes TEXT,
  
  -- Email tracking
  sent_date TIMESTAMP WITH TIME ZONE,
  sent_to_email VARCHAR(255),
  last_reminder_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'void')),
  CONSTRAINT positive_invoice_amounts CHECK (subtotal_aed >= 0 AND total_amount_aed >= 0 AND paid_amount_aed >= 0),
  CONSTRAINT valid_invoice_due_date CHECK (due_date >= issue_date)
);

-- 2. INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item details
  item_type VARCHAR(50) NOT NULL,
  item_description TEXT NOT NULL,
  item_code VARCHAR(50),
  
  -- Quantity and pricing
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price_aed DECIMAL(12, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount_aed DECIMAL(12, 2) DEFAULT 0,
  subtotal_aed DECIMAL(12, 2) NOT NULL,
  
  -- Tax
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  tax_amount_aed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_aed DECIMAL(12, 2) NOT NULL,
  
  -- Reference to source
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_item_type CHECK (item_type IN ('service', 'material', 'labor', 'custom', 'discount')),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_unit_price CHECK (unit_price_aed >= 0)
);

-- 3. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  
  -- Payment details
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_aed DECIMAL(12, 2) NOT NULL,
  
  -- Payment status and tracking
  payment_status VARCHAR(20) NOT NULL DEFAULT 'completed',
  transaction_reference VARCHAR(100),
  authorization_code VARCHAR(100),
  
  -- Check details (if applicable)
  check_number VARCHAR(50),
  check_date DATE,
  bank_name VARCHAR(100),
  
  -- Notes and metadata
  notes TEXT,
  internal_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'online', 'wallet')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('completed', 'pending', 'failed', 'refunded', 'cancelled')),
  CONSTRAINT positive_payment_amount CHECK (amount_aed > 0)
);

-- 4. INVOICE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Template details
  template_name VARCHAR(100) NOT NULL,
  template_description TEXT,
  is_default BOOLEAN DEFAULT false,
  
  -- Template content (JSON structure)
  template_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 5. INVOICE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Company information
  company_name VARCHAR(255) NOT NULL,
  company_name_arabic VARCHAR(255),
  company_address TEXT,
  company_address_arabic TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_website VARCHAR(255),
  
  -- Tax and legal
  tax_registration_number VARCHAR(50),
  commercial_registration VARCHAR(50),
  license_number VARCHAR(50),
  
  -- Bank details
  bank_name VARCHAR(100),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_iban VARCHAR(50),
  bank_swift_code VARCHAR(20),
  
  -- Invoice settings
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1001,
  next_invoice_number INTEGER DEFAULT 1001,
  default_payment_terms VARCHAR(100) DEFAULT 'Payment due within 30 days',
  default_due_days INTEGER DEFAULT 30,
  
  -- Email settings
  invoice_email_subject VARCHAR(255),
  invoice_email_body TEXT,
  payment_reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before_due INTEGER DEFAULT 3,
  reminder_days_after_due INTEGER DEFAULT 7,
  
  -- Appearance
  logo_url TEXT,
  signature_url TEXT,
  header_text TEXT,
  footer_text TEXT,
  terms_and_conditions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INVOICE HISTORY TABLE
CREATE TABLE IF NOT EXISTS invoice_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL,
  action_description TEXT,
  
  -- Status changes
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  
  -- Payment tracking
  payment_amount_aed DECIMAL(12, 2),
  previous_balance_aed DECIMAL(12, 2),
  new_balance_aed DECIMAL(12, 2),
  
  -- Changes snapshot (JSON)
  changes_data JSONB,
  
  -- Actor and timestamp
  changed_by UUID REFERENCES auth.users(id),
  change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Notes
  notes TEXT
);

-- CREATE INDEXES

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_balance ON invoices(balance_due_aed) WHERE balance_due_aed > 0;

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_type ON invoice_items(item_type);
CREATE INDEX IF NOT EXISTS idx_invoice_items_reference ON invoice_items(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_order ON invoice_items(invoice_id, display_order);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_organization ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(transaction_reference);

-- Invoice templates indexes
CREATE INDEX IF NOT EXISTS idx_invoice_templates_organization ON invoice_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_default ON invoice_templates(organization_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_invoice_templates_active ON invoice_templates(organization_id, is_active) WHERE is_active = true;

-- Invoice settings indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_settings_organization ON invoice_settings(organization_id);

-- Invoice history indexes
CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice ON invoice_history(invoice_id, change_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_history_action ON invoice_history(action_type);
CREATE INDEX IF NOT EXISTS idx_invoice_history_date ON invoice_history(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_history_user ON invoice_history(changed_by);

-- ENABLE ROW LEVEL SECURITY

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR INVOICES

CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert invoices in their organization"
  ON invoices FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update invoices in their organization"
  ON invoices FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete invoices in their organization"
  ON invoices FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS POLICIES FOR INVOICE ITEMS

CREATE POLICY "Users can view invoice items for their organization invoices"
  ON invoice_items FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert invoice items for their organization invoices"
  ON invoice_items FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update invoice items for their organization invoices"
  ON invoice_items FOR UPDATE
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete invoice items for their organization invoices"
  ON invoice_items FOR DELETE
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- RLS POLICIES FOR PAYMENTS

CREATE POLICY "Users can view payments in their organization"
  ON payments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert payments in their organization"
  ON payments FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update payments in their organization"
  ON payments FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete payments in their organization"
  ON payments FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS POLICIES FOR INVOICE TEMPLATES

CREATE POLICY "Users can view templates in their organization"
  ON invoice_templates FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert templates in their organization"
  ON invoice_templates FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update templates in their organization"
  ON invoice_templates FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete templates in their organization"
  ON invoice_templates FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS POLICIES FOR INVOICE SETTINGS

CREATE POLICY "Users can view settings in their organization"
  ON invoice_settings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert settings in their organization"
  ON invoice_settings FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update settings in their organization"
  ON invoice_settings FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete settings in their organization"
  ON invoice_settings FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS POLICIES FOR INVOICE HISTORY

CREATE POLICY "Users can view invoice history for their organization invoices"
  ON invoice_history FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert invoice history for their organization invoices"
  ON invoice_history FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));;