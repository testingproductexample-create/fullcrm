# Digital Measurement & Fitting System - Database Schema

## Overview
Comprehensive measurement tracking and fitting management system for tailoring businesses with support for 6 garment types, measurement versioning, fitting sessions, and alteration tracking.

## New Tables

### 1. measurement_templates
Defines measurement fields for different garment types

```sql
CREATE TABLE measurement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  garment_type TEXT NOT NULL, -- 'suit', 'shirt', 'trouser', 'dress', 'thobe', 'casual'
  template_name TEXT NOT NULL,
  measurement_fields JSONB NOT NULL, -- Array of field definitions with units
  cultural_variant TEXT, -- 'standard', 'emirati', 'gulf', 'western'
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, garment_type, template_name)
);
```

**Field Structure Example:**
```json
{
  "fields": [
    {"name": "chest", "label": "Chest", "unit": "cm", "required": true, "order": 1},
    {"name": "waist", "label": "Waist", "unit": "cm", "required": true, "order": 2},
    {"name": "sleeve_length", "label": "Sleeve Length", "unit": "cm", "required": true, "order": 3}
  ]
}
```

### 2. customer_measurements (Enhanced)
Individual customer measurements with full versioning

```sql
CREATE TABLE customer_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id UUID REFERENCES measurement_templates(id),
  garment_type TEXT NOT NULL,
  measurement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  measurements JSONB NOT NULL, -- Actual measurement values
  body_type TEXT, -- 'slim', 'athletic', 'regular', 'plus'
  fit_preference TEXT, -- 'slim', 'regular', 'relaxed', 'loose'
  posture_notes TEXT,
  special_requirements TEXT,
  measured_by UUID REFERENCES users(id),
  version_number INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES customer_measurements(id),
  change_reason TEXT,
  linked_order_id UUID REFERENCES orders(id),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_measurements_customer ON customer_measurements(customer_id);
CREATE INDEX idx_customer_measurements_latest ON customer_measurements(customer_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_customer_measurements_garment ON customer_measurements(garment_type);
CREATE INDEX idx_customer_measurements_org ON customer_measurements(organization_id);
```

**Measurements JSON Example:**
```json
{
  "chest": 102,
  "waist": 92,
  "hips": 105,
  "sleeve_length": 65,
  "jacket_length": 75,
  "shoulder_width": 46,
  "neck": 41,
  "trouser_waist": 92,
  "trouser_inseam": 82,
  "trouser_outseam": 110
}
```

### 3. fitting_sessions
Track fitting appointments and progress

```sql
CREATE TABLE fitting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  session_number INTEGER DEFAULT 1,
  session_type TEXT NOT NULL, -- 'first_fitting', 'second_fitting', 'final_fitting', 'alteration_check'
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
  conducted_by UUID REFERENCES users(id),
  duration_minutes INTEGER,
  overall_fit_rating INTEGER CHECK (overall_fit_rating BETWEEN 1 AND 5),
  fit_assessment JSONB, -- Per-area fit ratings
  requires_alterations BOOLEAN DEFAULT false,
  alterations_approved BOOLEAN DEFAULT false,
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
  next_session_recommended BOOLEAN DEFAULT false,
  next_session_date TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fitting_sessions_customer ON fitting_sessions(customer_id);
CREATE INDEX idx_fitting_sessions_order ON fitting_sessions(order_id);
CREATE INDEX idx_fitting_sessions_schedule ON fitting_sessions(scheduled_at);
CREATE INDEX idx_fitting_sessions_status ON fitting_sessions(status);
CREATE INDEX idx_fitting_sessions_org ON fitting_sessions(organization_id);
```

**Fit Assessment JSON Example:**
```json
{
  "chest": {"fit": "perfect", "adjustment_needed": null},
  "waist": {"fit": "tight", "adjustment_needed": "let_out_2cm"},
  "sleeves": {"fit": "loose", "adjustment_needed": "take_in_1cm"},
  "shoulders": {"fit": "perfect", "adjustment_needed": null},
  "length": {"fit": "long", "adjustment_needed": "shorten_2cm"}
}
```

### 4. fitting_photos
Photo documentation for fitting sessions

```sql
CREATE TABLE fitting_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fitting_session_id UUID NOT NULL REFERENCES fitting_sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT, -- 'front', 'back', 'side', 'detail', 'before', 'after'
  angle_view TEXT, -- 'front', 'back', 'left_side', 'right_side', 'detail'
  area_focus TEXT, -- 'chest', 'waist', 'sleeves', 'collar', 'overall'
  caption TEXT,
  annotations JSONB, -- Markup data for highlighting issues
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fitting_photos_session ON fitting_photos(fitting_session_id);
CREATE INDEX idx_fitting_photos_org ON fitting_photos(organization_id);
```

### 5. fitting_notes
Detailed notes and progress tracking for each fitting

```sql
CREATE TABLE fitting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fitting_session_id UUID NOT NULL REFERENCES fitting_sessions(id) ON DELETE CASCADE,
  note_category TEXT NOT NULL, -- 'fit_issue', 'alteration_required', 'customer_feedback', 'progress', 'general'
  note_area TEXT, -- 'chest', 'waist', 'sleeves', 'collar', 'shoulders', 'length', 'overall'
  note_text TEXT NOT NULL,
  severity TEXT, -- 'minor', 'moderate', 'major', 'critical'
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fitting_notes_session ON fitting_notes(fitting_session_id);
CREATE INDEX idx_fitting_notes_category ON fitting_notes(note_category);
CREATE INDEX idx_fitting_notes_resolved ON fitting_notes(is_resolved);
CREATE INDEX idx_fitting_notes_org ON fitting_notes(organization_id);
```

### 6. alteration_requests
Alteration tracking and approval system

```sql
CREATE TABLE alteration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fitting_session_id UUID REFERENCES fitting_sessions(id),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  request_number TEXT UNIQUE NOT NULL, -- Auto-generated: ALT-20250106-001
  request_date TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES users(id),
  alteration_type TEXT NOT NULL, -- 'minor', 'major', 'remake'
  garment_areas JSONB NOT NULL, -- List of areas requiring alteration
  detailed_instructions TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled'
  approval_status TEXT DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  assigned_to UUID REFERENCES users(id),
  estimated_cost_aed NUMERIC(10,2),
  actual_cost_aed NUMERIC(10,2),
  charge_customer BOOLEAN DEFAULT false,
  customer_charge_aed NUMERIC(10,2),
  estimated_hours NUMERIC(4,1),
  actual_hours NUMERIC(4,1),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quality_check_passed BOOLEAN,
  quality_checked_by UUID REFERENCES users(id),
  quality_check_notes TEXT,
  customer_notified BOOLEAN DEFAULT false,
  customer_notification_sent_at TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alteration_requests_order ON alteration_requests(order_id);
CREATE INDEX idx_alteration_requests_customer ON alteration_requests(customer_id);
CREATE INDEX idx_alteration_requests_status ON alteration_requests(status);
CREATE INDEX idx_alteration_requests_approval ON alteration_requests(approval_status);
CREATE INDEX idx_alteration_requests_session ON alteration_requests(fitting_session_id);
CREATE INDEX idx_alteration_requests_org ON alteration_requests(organization_id);
CREATE INDEX idx_alteration_requests_number ON alteration_requests(request_number);
```

**Garment Areas JSON Example:**
```json
{
  "alterations": [
    {
      "area": "waist",
      "action": "let_out",
      "measurement": "2cm",
      "priority": "high",
      "estimated_time": "1.5"
    },
    {
      "area": "sleeve_length",
      "action": "shorten",
      "measurement": "1.5cm",
      "priority": "medium",
      "estimated_time": "0.5"
    }
  ]
}
```

### 7. measurement_change_history
Audit trail for measurement changes

```sql
CREATE TABLE measurement_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  measurement_id UUID NOT NULL REFERENCES customer_measurements(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'archived'
  changed_fields JSONB, -- Which measurements changed and by how much
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_measurement_history_customer ON measurement_change_history(customer_id);
CREATE INDEX idx_measurement_history_measurement ON measurement_change_history(measurement_id);
CREATE INDEX idx_measurement_history_org ON measurement_change_history(organization_id);
```

## Relationship Summary

```
organizations
├── measurement_templates (1:many)
├── customer_measurements (1:many)
├── fitting_sessions (1:many)
├── fitting_photos (1:many)
├── fitting_notes (1:many)
├── alteration_requests (1:many)
└── measurement_change_history (1:many)

customers
├── customer_measurements (1:many)
├── fitting_sessions (1:many)
├── alteration_requests (1:many)
└── measurement_change_history (1:many)

orders
├── fitting_sessions (1:many)
└── alteration_requests (1:many)

fitting_sessions
├── fitting_photos (1:many)
├── fitting_notes (1:many)
└── alteration_requests (1:many)
```

## Default Garment Templates

### Suit Template
- Chest, Waist, Hips
- Jacket Length, Shoulder Width, Sleeve Length
- Neck Size, Collar Size
- Trouser Waist, Trouser Inseam, Trouser Outseam
- Trouser Rise, Leg Opening
- Jacket Style (single/double breasted), Lapel Width

### Shirt Template
- Chest, Waist
- Sleeve Length, Shoulder Width
- Collar Size, Cuff Size
- Shirt Length, Yoke Width
- Fit Preference (slim/regular/relaxed)

### Trouser Template
- Waist, Hips
- Inseam, Outseam, Rise
- Thigh, Knee, Leg Opening
- Seat, Crotch Depth
- Break Preference

### Dress Template
- Bust, Waist, Hips
- Shoulder to Waist, Shoulder to Hem
- Sleeve Length, Armhole Depth
- Neckline Preference, Dress Style

### Thobe/Kandura Template
- Shoulder Width, Chest
- Waist, Hip
- Thobe Length (shoulder to floor)
- Sleeve Length, Cuff Size
- Collar Height, Collar Style
- Fit Preference (traditional/modern/slim)

### Casual Wear Template
- Custom fields based on garment selection
- Chest, Waist, Hips (when applicable)
- Length measurements
- Fit preference

## RLS Policies Required

All tables require:
- Organization isolation (users can only access their organization's data)
- Role-based access (owners/managers can modify, tailors can view/modify measurements)
- Customer privacy (customers can view their own measurements if customer portal enabled)

## Triggers Required

1. **Update is_latest flag**: When new measurement version created
2. **Auto-generate request numbers**: For alteration_requests
3. **Update timestamps**: For all tables on UPDATE
4. **Create change history**: When measurements are modified
5. **Update order workflow**: When fitting completed or alteration approved
