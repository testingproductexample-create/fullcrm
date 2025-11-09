-- Migration: design_catalog_rls_policies
-- Created at: 1762372186

-- Design Catalog System RLS Policies

-- Enable RLS on all tables
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_design_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_analytics ENABLE ROW LEVEL SECURITY;

-- designs table policies
CREATE POLICY "Users can view designs from their organization" ON designs
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and Manager can create designs" ON designs
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and Manager can update designs" ON designs
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete designs" ON designs
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- design_variants table policies
CREATE POLICY "Users can view design variants from their organization" ON design_variants
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and Manager can create design variants" ON design_variants
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and Manager can update design variants" ON design_variants
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete design variants" ON design_variants
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- fabric_library table policies
CREATE POLICY "Users can view fabric library from their organization" ON fabric_library
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and Manager can create fabric entries" ON fabric_library
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and Manager can update fabric entries" ON fabric_library
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete fabric entries" ON fabric_library
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- fabric_patterns table policies
CREATE POLICY "Users can view fabric patterns from their organization" ON fabric_patterns
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and Manager can create fabric patterns" ON fabric_patterns
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and Manager can update fabric patterns" ON fabric_patterns
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete fabric patterns" ON fabric_patterns
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- design_media table policies
CREATE POLICY "Users can view design media from their organization" ON design_media
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and Manager can create design media" ON design_media
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and Manager can update design media" ON design_media
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete design media" ON design_media
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- customer_design_selections table policies
CREATE POLICY "Users can view design selections from their organization" ON customer_design_selections
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create design selections for their organization" ON customer_design_selections
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update design selections from their organization" ON customer_design_selections
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete design selections" ON customer_design_selections
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- design_approval_requests table policies
CREATE POLICY "Users can view approval requests from their organization" ON design_approval_requests
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create approval requests for their organization" ON design_approval_requests
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update approval requests from their organization" ON design_approval_requests
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete approval requests" ON design_approval_requests
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- design_analytics table policies
CREATE POLICY "Users can view analytics from their organization" ON design_analytics
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and Manager can create analytics" ON design_analytics
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and Manager can update analytics" ON design_analytics
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete analytics" ON design_analytics
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );;