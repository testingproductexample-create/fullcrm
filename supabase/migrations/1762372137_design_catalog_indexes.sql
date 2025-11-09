-- Migration: design_catalog_indexes
-- Created at: 1762372137

-- Design Catalog System Indexes
-- designs table
CREATE INDEX idx_designs_category ON designs(garment_category);
CREATE INDEX idx_designs_org ON designs(organization_id);
CREATE INDEX idx_designs_active ON designs(is_active) WHERE is_active = true;
CREATE INDEX idx_designs_featured ON designs(is_featured) WHERE is_featured = true;
CREATE INDEX idx_designs_cultural ON designs(cultural_variant);
CREATE INDEX idx_designs_price ON designs(final_price_aed);
CREATE INDEX idx_designs_popularity ON designs(popularity_score DESC);

-- design_variants table
CREATE INDEX idx_design_variants_design ON design_variants(design_id);
CREATE INDEX idx_design_variants_org ON design_variants(organization_id);
CREATE INDEX idx_design_variants_category ON design_variants(variant_category);

-- fabric_library table
CREATE INDEX idx_fabric_library_type ON fabric_library(fabric_type);
CREATE INDEX idx_fabric_library_org ON fabric_library(organization_id);
CREATE INDEX idx_fabric_library_available ON fabric_library(is_available) WHERE is_available = true;
CREATE INDEX idx_fabric_library_price ON fabric_library(selling_price_per_meter_aed);

-- fabric_patterns table
CREATE INDEX idx_fabric_patterns_fabric ON fabric_patterns(fabric_id);
CREATE INDEX idx_fabric_patterns_org ON fabric_patterns(organization_id);
CREATE INDEX idx_fabric_patterns_color ON fabric_patterns(color_name);
CREATE INDEX idx_fabric_patterns_type ON fabric_patterns(pattern_type);

-- design_media table
CREATE INDEX idx_design_media_design ON design_media(design_id);
CREATE INDEX idx_design_media_org ON design_media(organization_id);
CREATE INDEX idx_design_media_type ON design_media(media_type);
CREATE INDEX idx_design_media_primary ON design_media(is_primary) WHERE is_primary = true;

-- customer_design_selections table
CREATE INDEX idx_customer_design_selections_customer ON customer_design_selections(customer_id);
CREATE INDEX idx_customer_design_selections_design ON customer_design_selections(design_id);
CREATE INDEX idx_customer_design_selections_status ON customer_design_selections(status);
CREATE INDEX idx_customer_design_selections_org ON customer_design_selections(organization_id);

-- design_approval_requests table
CREATE INDEX idx_design_approval_requests_selection ON design_approval_requests(selection_id);
CREATE INDEX idx_design_approval_requests_customer ON design_approval_requests(customer_id);
CREATE INDEX idx_design_approval_requests_status ON design_approval_requests(status);
CREATE INDEX idx_design_approval_requests_stage ON design_approval_requests(approval_stage);
CREATE INDEX idx_design_approval_requests_org ON design_approval_requests(organization_id);
CREATE INDEX idx_design_approval_requests_number ON design_approval_requests(request_number);

-- design_analytics table
CREATE INDEX idx_design_analytics_design ON design_analytics(design_id);
CREATE INDEX idx_design_analytics_date ON design_analytics(analytics_date DESC);
CREATE INDEX idx_design_analytics_org ON design_analytics(organization_id);;