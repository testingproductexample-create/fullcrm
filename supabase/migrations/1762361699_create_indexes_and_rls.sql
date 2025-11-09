-- Migration: create_indexes_and_rls
-- Created at: 1762361699

-- Create indexes for performance
CREATE INDEX idx_customers_org_id ON customers(organization_id);
CREATE INDEX idx_customers_customer_code ON customers(organization_id, customer_code);
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_classification ON customers(classification);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier);

CREATE INDEX idx_customer_measurements_customer_id ON customer_measurements(customer_id);
CREATE INDEX idx_customer_measurements_org_id ON customer_measurements(organization_id);
CREATE INDEX idx_customer_measurements_latest ON customer_measurements(customer_id, is_latest) WHERE is_latest = true;

CREATE INDEX idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX idx_customer_communications_org_id ON customer_communications(organization_id);
CREATE INDEX idx_customer_communications_created_at ON customer_communications(created_at DESC);

CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_pinned ON customer_notes(customer_id, is_pinned) WHERE is_pinned = true;

CREATE INDEX idx_customer_events_date ON customer_events(event_date);
CREATE INDEX idx_customer_events_active ON customer_events(is_active, event_date) WHERE is_active = true;
CREATE INDEX idx_customer_events_org_id ON customer_events(organization_id);

CREATE INDEX idx_loyalty_transactions_customer_id ON customer_loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_created_at ON customer_loyalty_transactions(created_at DESC);

CREATE INDEX idx_profiles_org_id ON profiles(organization_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segmentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organizations
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Service role can insert organizations" ON organizations
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Owners can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Profiles
CREATE POLICY "Users can view profiles in their organization" ON profiles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customers
CREATE POLICY "Users can view customers in their organization" ON customers
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can insert customers in their organization" ON customers
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can update customers in their organization" ON customers
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can delete customers in their organization" ON customers
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Measurements
CREATE POLICY "Users can view measurements in their organization" ON customer_measurements
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can insert measurements in their organization" ON customer_measurements
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can update measurements in their organization" ON customer_measurements
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Measurement Templates
CREATE POLICY "Users can view templates in their organization" ON measurement_templates
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can insert templates in their organization" ON measurement_templates
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Communications
CREATE POLICY "Users can view communications in their organization" ON customer_communications
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can insert communications in their organization" ON customer_communications
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Preferences
CREATE POLICY "Users can view preferences in their organization" ON customer_preferences
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Notes
CREATE POLICY "Users can manage notes in their organization" ON customer_notes
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Events
CREATE POLICY "Users can manage events in their organization" ON customer_events
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Loyalty Programs
CREATE POLICY "Users can manage loyalty programs in their organization" ON customer_loyalty_programs
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Loyalty Transactions
CREATE POLICY "Users can manage loyalty transactions in their organization" ON customer_loyalty_transactions
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Segmentation
CREATE POLICY "Users can manage segmentation in their organization" ON customer_segmentation
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Customer Segment Members
CREATE POLICY "Users can manage segment members in their organization" ON customer_segment_members
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );;