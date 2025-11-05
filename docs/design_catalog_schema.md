# Design Catalog & Media Management System - Database Schema

## Overview
Comprehensive digital design catalog with fabric library, media management, and customer approval workflows for tailoring businesses. Supports 6 garment categories with UAE market specifics and cultural design variants.

## New Tables

### 1. designs
Main design catalog with specifications and pricing

```sql
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  design_code TEXT UNIQUE NOT NULL, -- DSN-20250106-001
  design_name TEXT NOT NULL,
  garment_category TEXT NOT NULL, -- 'suit', 'shirt', 'trouser', 'dress', 'thobe', 'casual'
  cultural_variant TEXT, -- 'emirati', 'gulf', 'western', 'modern'
  description TEXT,
  technical_notes TEXT, -- Construction details
  fabric_requirements JSONB, -- Required fabric types and quantities
  base_price_aed NUMERIC(10,2) NOT NULL,
  markup_percentage NUMERIC(5,2) DEFAULT 0,
  final_price_aed NUMERIC(10,2) GENERATED ALWAYS AS (base_price_aed * (1 + markup_percentage / 100)) STORED,
  complexity_level TEXT, -- 'simple', 'moderate', 'complex', 'expert'
  estimated_hours NUMERIC(5,1),
  season_tags TEXT[], -- ['summer', 'winter', 'all-season']
  occasion_tags TEXT[], -- ['formal', 'casual', 'wedding', 'business']
  style_tags TEXT[], -- ['modern', 'traditional', 'slim-fit', 'regular']
  popularity_score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  selection_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_designs_category ON designs(garment_category);
CREATE INDEX idx_designs_org ON designs(organization_id);
CREATE INDEX idx_designs_active ON designs(is_active) WHERE is_active = true;
CREATE INDEX idx_designs_featured ON designs(is_featured) WHERE is_featured = true;
CREATE INDEX idx_designs_cultural ON designs(cultural_variant);
CREATE INDEX idx_designs_price ON designs(final_price_aed);
CREATE INDEX idx_designs_popularity ON designs(popularity_score DESC);
```

**Fabric Requirements JSON Example:**
```json
{
  "primary_fabric": {
    "type": "wool",
    "quantity_meters": 2.5,
    "weight_gsm": 280,
    "pattern_type": "solid"
  },
  "lining": {
    "type": "polyester",
    "quantity_meters": 1.5
  },
  "accessories": ["buttons", "thread", "interfacing"]
}
```

### 2. design_variants
Customization options and variations per design

```sql
CREATE TABLE design_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_category TEXT NOT NULL, -- 'collar', 'sleeve', 'fit', 'button', 'pocket', 'lining'
  variant_options JSONB NOT NULL, -- Available options with pricing adjustments
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_design_variants_design ON design_variants(design_id);
CREATE INDEX idx_design_variants_org ON design_variants(organization_id);
CREATE INDEX idx_design_variants_category ON design_variants(variant_category);
```

**Variant Options JSON Example:**
```json
{
  "options": [
    {
      "value": "point_collar",
      "label": "Point Collar",
      "price_adjustment_aed": 0,
      "image_url": "/variants/point-collar.jpg"
    },
    {
      "value": "spread_collar",
      "label": "Spread Collar",
      "price_adjustment_aed": 50,
      "image_url": "/variants/spread-collar.jpg"
    }
  ]
}
```

### 3. fabric_library
Fabric catalog with supplier and pricing information

```sql
CREATE TABLE fabric_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fabric_code TEXT UNIQUE NOT NULL, -- FAB-20250106-001
  fabric_name TEXT NOT NULL,
  fabric_type TEXT NOT NULL, -- 'wool', 'cotton', 'silk', 'linen', 'polyester', 'blend'
  fabric_weight_gsm INTEGER,
  fabric_composition TEXT, -- 'I00% Cotton', '70% Wool 30% Polyester'
  texture_finish TEXT, -- 'smooth', 'textured', 'brushed', 'satin'
  care_instructions TEXT,
  supplier_name TEXT,
  supplier_contact TEXT,
  cost_per_meter_aed NUMERIC(10,2) NOT NULL,
  selling_price_per_meter_aed NUMERIC(10,2) NOT NULL,
  stock_quantity_meters NUMERIC(8,2) DEFAULT 0,
  minimum_order_meters NUMERIC(5,2) DEFAULT 1,
  season_suitable TEXT[], -- ['summer', 'winter', 'all-season']
  garment_suitable TEXT[], -- ['suit', 'shirt', 'dress']
  country_of_origin TEXT,
  is_sustainable BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fabric_library_type ON fabric_library(fabric_type);
CREATE INDEX idx_fabric_library_org ON fabric_library(organization_id);
CREATE INDEX idx_fabric_library_available ON fabric_library(is_available) WHERE is_available = true;
CREATE INDEX idx_fabric_library_price ON fabric_library(selling_price_per_meter_aed);
```

### 4. fabric_patterns
Pattern images and color variants

```sql
CREATE TABLE fabric_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fabric_id UUID NOT NULL REFERENCES fabric_library(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_type TEXT, -- 'solid', 'stripe', 'check', 'plaid', 'floral', 'geometric'
  color_name TEXT NOT NULL,
  color_hex TEXT, -- '#1A2B3C'
  pattern_image_url TEXT NOT NULL,
  swatch_image_url TEXT,
  is_primary_color BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fabric_patterns_fabric ON fabric_patterns(fabric_id);
CREATE INDEX idx_fabric_patterns_org ON fabric_patterns(organization_id);
CREATE INDEX idx_fabric_patterns_color ON fabric_patterns(color_name);
CREATE INDEX idx_fabric_patterns_type ON fabric_patterns(pattern_type);
```

### 5. design_media
Images, videos, and 3D models per design

```sql
CREATE TABLE design_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'image', 'video', '3d_model'
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  view_angle TEXT, -- 'front', 'back', 'side_left', 'side_right', 'detail', '360'
  alt_text TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  file_size_kb INTEGER,
  dimensions_width INTEGER,
  dimensions_height INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_design_media_design ON design_media(design_id);
CREATE INDEX idx_design_media_org ON design_media(organization_id);
CREATE INDEX idx_design_media_type ON design_media(media_type);
CREATE INDEX idx_design_media_primary ON design_media(is_primary) WHERE is_primary = true;
```

### 6. customer_design_selections
Customer's selected designs and customizations

```sql
CREATE TABLE customer_design_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id),
  measurement_id UUID REFERENCES customer_measurements(id),
  selected_variants JSONB, -- Customer's variant choices
  selected_fabric_id UUID REFERENCES fabric_library(id),
  selected_pattern_id UUID REFERENCES fabric_patterns(id),
  customization_notes TEXT,
  reference_images JSONB, -- Customer-uploaded inspiration images
  total_price_aed NUMERIC(10,2),
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected', 'ordered'
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_design_selections_customer ON customer_design_selections(customer_id);
CREATE INDEX idx_customer_design_selections_design ON customer_design_selections(design_id);
CREATE INDEX idx_customer_design_selections_status ON customer_design_selections(status);
CREATE INDEX idx_customer_design_selections_org ON customer_design_selections(organization_id);
```

**Selected Variants JSON Example:**
```json
{
  "collar": {
    "variant_id": "uuid-123",
    "value": "spread_collar",
    "label": "Spread Collar",
    "price_adjustment_aed": 50
  },
  "sleeves": {
    "variant_id": "uuid-456",
    "value": "french_cuff",
    "label": "French Cuff",
    "price_adjustment_aed": 75
  }
}
```

### 7. design_approval_requests
Approval workflow and digital signatures

```sql
CREATE TABLE design_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  selection_id UUID NOT NULL REFERENCES customer_design_selections(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  request_number TEXT UNIQUE NOT NULL, -- APR-20250106-001
  approval_stage TEXT NOT NULL, -- 'customer', 'tailor', 'production_manager', 'final'
  approval_sequence INTEGER DEFAULT 1,
  requested_from UUID REFERENCES profiles(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'revision_requested'
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  digital_signature TEXT, -- Base64 encoded signature or signature URL
  rejection_reason TEXT,
  revision_notes TEXT,
  approval_notes TEXT,
  version_number INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES design_approval_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_design_approval_requests_selection ON design_approval_requests(selection_id);
CREATE INDEX idx_design_approval_requests_customer ON design_approval_requests(customer_id);
CREATE INDEX idx_design_approval_requests_status ON design_approval_requests(status);
CREATE INDEX idx_design_approval_requests_stage ON design_approval_requests(approval_stage);
CREATE INDEX idx_design_approval_requests_org ON design_approval_requests(organization_id);
CREATE INDEX idx_design_approval_requests_number ON design_approval_requests(request_number);
```

### 8. design_analytics
Performance tracking and popularity metrics

```sql
CREATE TABLE design_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 0,
  selections_count INTEGER DEFAULT 0,
  approvals_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue_aed NUMERIC(12,2) DEFAULT 0,
  avg_customization_price_aed NUMERIC(10,2),
  most_selected_variant JSONB,
  customer_demographics JSONB, -- Age groups, genders
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(design_id, analytics_date)
);

CREATE INDEX idx_design_analytics_design ON design_analytics(design_id);
CREATE INDEX idx_design_analytics_date ON design_analytics(analytics_date DESC);
CREATE INDEX idx_design_analytics_org ON design_analytics(organization_id);
```

## Relationship Summary

```
organizations
├── designs (1:many)
├── design_variants (1:many)
├── fabric_library (1:many)
├── fabric_patterns (1:many)
├── design_media (1:many)
├── customer_design_selections (1:many)
├── design_approval_requests (1:many)
└── design_analytics (1:many)

designs
├── design_variants (1:many)
├── design_media (1:many)
├── customer_design_selections (1:many)
└── design_analytics (1:many)

fabric_library
├── fabric_patterns (1:many)
└── customer_design_selections (1:many - via selected_fabric_id)

customers
├── customer_design_selections (1:many)
└── design_approval_requests (1:many)

customer_measurements
└── customer_design_selections (1:many - linkage)

customer_design_selections
└── design_approval_requests (1:many)
```

## RLS Policies Required

All tables require:
- Organization isolation (users only access their organization's data)
- Role-based access (owners/managers full access, tailors view/modify, customers limited view)
- Customer portal access (customers can view their own selections and approvals)

## Triggers Required

1. **Update design popularity**: When selection/view count changes
2. **Auto-generate request numbers**: For design_approval_requests
3. **Update timestamps**: For all tables on UPDATE
4. **Update analytics**: When designs are viewed/selected/ordered
5. **Calculate total price**: When variants or fabric selected

## Storage Buckets Required

1. **design-images**: Design catalog images (high-resolution, optimized)
2. **fabric-patterns**: Fabric swatch and pattern images
3. **customer-references**: Customer-uploaded inspiration images
4. **digital-signatures**: Approval signature storage

## Default Data to Populate

### Garment Categories (6):
1. Suits (Business Suits, Tuxedos, Three-Piece)
2. Shirts (Dress Shirts, Casual Shirts, Traditional Emirati Shirts)
3. Trousers (Dress Pants, Casual Pants)
4. Dresses (Formal Gowns, Casual Dresses, Abayas)
5. Thobes/Kanduras (Traditional Emirati, Modern Emirati, Gulf Style)
6. Casual Wear (Blazers, Polo Shirts, Chinos)

### Cultural Variants:
- Emirati Traditional
- Gulf Modern
- Western Contemporary
- Fusion Styles

### Fabric Types:
- Wool (Super 120s, Super 150s, Merino)
- Cotton (Egyptian, Pima, Organic)
- Silk (Pure Silk, Silk Blend)
- Linen (Pure Linen, Linen Blend)
- Synthetic Blends

## Performance Considerations

- Image optimization: WebP format, lazy loading
- CDN integration: Fast global delivery
- Caching strategy: Redis for popular designs
- Search optimization: Full-text search indexes
- Pagination: Limit query results to 20-50 per page
