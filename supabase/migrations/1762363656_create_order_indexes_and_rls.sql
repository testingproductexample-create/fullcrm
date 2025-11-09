-- Migration: create_order_indexes_and_rls
-- Created at: 1762363656

-- Create indexes for orders
CREATE INDEX idx_orders_org_id ON orders(organization_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(organization_id, order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date) WHERE delivery_date IS NOT NULL;
CREATE INDEX idx_orders_assigned_to ON orders(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_org_id ON order_items(organization_id);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at DESC);

CREATE INDEX idx_order_approvals_order_id ON order_approvals(order_id);
CREATE INDEX idx_order_approvals_status ON order_approvals(status);

CREATE INDEX idx_order_templates_org_id ON order_templates(organization_id);
CREATE INDEX idx_order_templates_active ON order_templates(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Orders
CREATE POLICY "Users can view orders in their organization" ON orders
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can insert orders in their organization" ON orders
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can update orders in their organization" ON orders
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can delete orders in their organization" ON orders
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Order Items
CREATE POLICY "Users can manage order items in their organization" ON order_items
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Order Status History
CREATE POLICY "Users can manage order status history in their organization" ON order_status_history
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Order Approvals
CREATE POLICY "Users can manage order approvals in their organization" ON order_approvals
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- RLS Policies for Order Templates
CREATE POLICY "Users can manage order templates in their organization" ON order_templates
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR auth.role() IN ('anon', 'service_role')
  );

-- Create function to auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num
  FROM orders
  WHERE organization_id = org_id
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update order timestamps
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timestamp();

CREATE TRIGGER update_order_items_timestamp
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timestamp();

CREATE TRIGGER update_order_templates_timestamp
  BEFORE UPDATE ON order_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timestamp();;