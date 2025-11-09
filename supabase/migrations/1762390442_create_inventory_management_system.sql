-- Migration: create_inventory_management_system
-- Created at: 1762390442

-- ======================================
-- INVENTORY MANAGEMENT - CORE MATERIAL TRACKING SYSTEM
-- Creating 10 comprehensive tables for fabric inventory management
-- ======================================

-- 1. STORAGE_LOCATIONS - Warehouse and location management
-- Manages different storage areas and their capacities
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Location identification
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) DEFAULT 'warehouse' CHECK (location_type IN ('warehouse', 'showroom', 'cutting_room', 'storage_area', 'temporary', 'quality_hold')),
    
    -- Address and physical details
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    emirate VARCHAR(50),
    postal_code VARCHAR(20),
    
    -- Capacity management
    total_capacity_sqm DECIMAL(10,2),
    used_capacity_sqm DECIMAL(10,2) DEFAULT 0,
    max_weight_kg DECIMAL(12,2),
    current_weight_kg DECIMAL(12,2) DEFAULT 0,
    
    -- Environmental conditions
    temperature_controlled BOOLEAN DEFAULT FALSE,
    humidity_controlled BOOLEAN DEFAULT FALSE,
    temperature_range_min INTEGER,
    temperature_range_max INTEGER,
    humidity_range_min INTEGER,
    humidity_range_max INTEGER,
    
    -- Access and security
    access_level VARCHAR(50) DEFAULT 'standard' CHECK (access_level IN ('public', 'standard', 'restricted', 'secure')),
    security_features JSONB,
    authorized_personnel JSONB,
    
    -- Operational details
    operating_hours JSONB,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID NOT NULL,
    manager_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_location_code_per_org UNIQUE (organization_id, location_code),
    CONSTRAINT valid_capacity CHECK (total_capacity_sqm IS NULL OR total_capacity_sqm > 0),
    CONSTRAINT valid_usage CHECK (used_capacity_sqm >= 0 AND (total_capacity_sqm IS NULL OR used_capacity_sqm <= total_capacity_sqm))
);

-- 2. SUPPLIERS - Comprehensive supplier management
-- Enhanced supplier profiles with business details and performance tracking
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Supplier identification
    supplier_code VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    supplier_type VARCHAR(50) DEFAULT 'fabric_supplier' CHECK (supplier_type IN ('fabric_supplier', 'thread_supplier', 'accessories_supplier', 'equipment_supplier', 'service_provider')),
    
    -- Business details
    business_license_number VARCHAR(100),
    business_license_expiry DATE,
    tax_registration_number VARCHAR(100),
    commercial_registration VARCHAR(100),
    establishment_date DATE,
    
    -- Contact information
    primary_contact_name VARCHAR(255),
    primary_contact_title VARCHAR(100),
    primary_contact_phone VARCHAR(50),
    primary_contact_email VARCHAR(255),
    secondary_contact_name VARCHAR(255),
    secondary_contact_phone VARCHAR(50),
    secondary_contact_email VARCHAR(255),
    
    -- Address information
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Financial and business terms
    payment_terms VARCHAR(100),
    credit_limit_aed DECIMAL(15,2) DEFAULT 0,
    currency_preference VARCHAR(10) DEFAULT 'AED',
    minimum_order_value_aed DECIMAL(12,2) DEFAULT 0,
    bulk_discount_threshold_aed DECIMAL(12,2),
    bulk_discount_percentage DECIMAL(5,2),
    
    -- Performance metrics
    lead_time_days INTEGER DEFAULT 0,
    quality_rating DECIMAL(3,2) DEFAULT 0 CHECK (quality_rating >= 0 AND quality_rating <= 5),
    delivery_rating DECIMAL(3,2) DEFAULT 0 CHECK (delivery_rating >= 0 AND delivery_rating <= 5),
    service_rating DECIMAL(3,2) DEFAULT 0 CHECK (service_rating >= 0 AND service_rating <= 5),
    overall_rating DECIMAL(3,2) DEFAULT 0 CHECK (overall_rating >= 0 AND overall_rating <= 5),
    total_orders INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    
    -- Specialization and capabilities
    specialization JSONB, -- Fabric types, materials they specialize in
    certifications JSONB, -- Quality certifications, standards
    production_capacity TEXT,
    geographic_coverage JSONB, -- Countries/regions they serve
    
    -- UAE import and compliance
    uae_import_license VARCHAR(100),
    customs_broker_contact TEXT,
    preferred_shipping_method VARCHAR(100),
    incoterms_preference VARCHAR(20),
    
    -- Relationship management
    relationship_manager_id UUID,
    partnership_level VARCHAR(50) DEFAULT 'standard' CHECK (partnership_level IN ('preferred', 'standard', 'trial', 'restricted', 'blacklisted')),
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Status and verification
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    verification_date DATE,
    verified_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    blocked_reason TEXT,
    blocked_date DATE,
    blocked_by UUID,
    
    -- Banking and financial details
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_swift_code VARCHAR(20),
    bank_iban VARCHAR(50),
    
    -- Additional metadata
    website_url TEXT,
    social_media JSONB,
    notes TEXT,
    tags JSONB,
    
    -- Timestamps
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_supplier_code_per_org UNIQUE (organization_id, supplier_code)
);

-- 3. INVENTORY_STOCKS - Multi-location stock tracking
-- Real-time stock levels across different locations
CREATE TABLE IF NOT EXISTS inventory_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Material and location linkage
    fabric_id UUID NOT NULL, -- Links to fabric_library
    storage_location_id UUID NOT NULL,
    
    -- Stock quantities
    current_stock_meters DECIMAL(12,3) NOT NULL DEFAULT 0,
    reserved_stock_meters DECIMAL(12,3) DEFAULT 0,
    available_stock_meters DECIMAL(12,3) NOT NULL DEFAULT 0,
    
    -- Stock thresholds
    minimum_stock_level DECIMAL(12,3) DEFAULT 0,
    maximum_stock_level DECIMAL(12,3),
    reorder_point DECIMAL(12,3) DEFAULT 0,
    reorder_quantity DECIMAL(12,3) DEFAULT 0,
    
    -- Batch and lot tracking
    lot_number VARCHAR(100),
    batch_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE,
    dye_lot VARCHAR(100),
    
    -- Physical characteristics
    roll_count INTEGER DEFAULT 0,
    average_roll_length DECIMAL(8,3),
    roll_width_cm DECIMAL(8,2),
    total_weight_kg DECIMAL(10,3),
    
    -- Costing information
    unit_cost_aed DECIMAL(12,4),
    total_value_aed DECIMAL(15,2),
    last_purchase_cost_aed DECIMAL(12,4),
    last_purchase_date DATE,
    
    -- Quality status
    quality_status VARCHAR(50) DEFAULT 'good' CHECK (quality_status IN ('excellent', 'good', 'fair', 'poor', 'defective', 'quarantine')),
    quality_notes TEXT,
    last_inspection_date DATE,
    next_inspection_date DATE,
    
    -- Stock movement tracking
    last_movement_type VARCHAR(50),
    last_movement_date TIMESTAMPTZ,
    last_movement_quantity DECIMAL(12,3),
    last_movement_reference VARCHAR(255),
    
    -- Aging and condition
    received_date DATE,
    aging_category VARCHAR(50) DEFAULT 'fresh' CHECK (aging_category IN ('fresh', 'good', 'aging', 'old', 'obsolete')),
    condition_rating INTEGER DEFAULT 5 CHECK (condition_rating >= 1 AND condition_rating <= 5),
    
    -- Alerts and flags
    low_stock_alert BOOLEAN DEFAULT FALSE,
    out_of_stock_alert BOOLEAN DEFAULT FALSE,
    expiry_alert BOOLEAN DEFAULT FALSE,
    quality_alert BOOLEAN DEFAULT FALSE,
    
    -- Physical location details
    rack_number VARCHAR(50),
    shelf_number VARCHAR(50),
    bin_location VARCHAR(50),
    physical_location_notes TEXT,
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_fabric_location UNIQUE (fabric_id, storage_location_id),
    CONSTRAINT valid_stock_quantities CHECK (
        current_stock_meters >= 0 AND
        reserved_stock_meters >= 0 AND
        available_stock_meters >= 0 AND
        available_stock_meters = (current_stock_meters - reserved_stock_meters)
    ),
    CONSTRAINT valid_thresholds CHECK (
        minimum_stock_level >= 0 AND
        (maximum_stock_level IS NULL OR maximum_stock_level >= minimum_stock_level) AND
        reorder_point >= 0 AND reorder_quantity >= 0
    )
);

-- 4. PURCHASE_ORDERS - Procurement and ordering management
-- Complete purchase order lifecycle management
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Order identification
    po_number VARCHAR(100) NOT NULL,
    po_reference VARCHAR(255),
    po_type VARCHAR(50) DEFAULT 'regular' CHECK (po_type IN ('regular', 'urgent', 'consignment', 'sample', 'emergency')),
    
    -- Supplier and requestor information
    supplier_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    approved_by UUID,
    
    -- Order dates and timeline
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    requested_delivery_date DATE,
    confirmed_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial information
    subtotal_amount_aed DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount_aed DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 5, -- UAE VAT
    tax_amount_aed DECIMAL(12,2) DEFAULT 0,
    shipping_cost_aed DECIMAL(12,2) DEFAULT 0,
    customs_duty_aed DECIMAL(12,2) DEFAULT 0,
    other_charges_aed DECIMAL(12,2) DEFAULT 0,
    total_amount_aed DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Currency and exchange
    supplier_currency VARCHAR(10),
    exchange_rate DECIMAL(10,6),
    supplier_total_amount DECIMAL(15,2),
    
    -- Order status and workflow
    order_status VARCHAR(50) DEFAULT 'draft' CHECK (order_status IN (
        'draft', 'pending_approval', 'approved', 'sent_to_supplier', 
        'acknowledged', 'in_production', 'ready_to_ship', 'shipped', 
        'in_transit', 'delivered', 'received', 'completed', 'cancelled', 'rejected'
    )),
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'on_hold')),
    approval_notes TEXT,
    approval_date TIMESTAMPTZ,
    
    -- Delivery and logistics
    delivery_address_line1 TEXT,
    delivery_address_line2 TEXT,
    delivery_city VARCHAR(100),
    delivery_emirate VARCHAR(50),
    delivery_postal_code VARCHAR(20),
    delivery_contact_name VARCHAR(255),
    delivery_contact_phone VARCHAR(50),
    
    -- Shipping and import details
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    carrier_name VARCHAR(255),
    incoterms VARCHAR(20),
    
    -- UAE import compliance
    import_license_required BOOLEAN DEFAULT FALSE,
    import_license_number VARCHAR(100),
    customs_declaration_number VARCHAR(100),
    certificate_of_origin BOOLEAN DEFAULT FALSE,
    quality_certificate BOOLEAN DEFAULT FALSE,
    
    -- Terms and conditions
    payment_terms VARCHAR(100),
    delivery_terms TEXT,
    quality_requirements TEXT,
    special_instructions TEXT,
    
    -- Performance tracking
    lead_time_days INTEGER,
    delivery_performance_rating INTEGER CHECK (delivery_performance_rating >= 1 AND delivery_performance_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    
    -- Documents and attachments
    documents JSONB, -- List of attached documents
    certificates JSONB, -- Quality certificates, compliance docs
    
    -- Communication log
    communication_log JSONB, -- Supplier communications
    
    -- Financial status
    invoice_received BOOLEAN DEFAULT FALSE,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    payment_due_date DATE,
    
    -- Cancellation and modification
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_date TIMESTAMPTZ,
    modification_history JSONB,
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_po_number_per_org UNIQUE (organization_id, po_number),
    CONSTRAINT valid_dates CHECK (
        (expected_delivery_date IS NULL OR expected_delivery_date >= order_date) AND
        (actual_delivery_date IS NULL OR actual_delivery_date >= order_date)
    ),
    CONSTRAINT valid_amounts CHECK (
        subtotal_amount_aed >= 0 AND
        discount_amount_aed >= 0 AND
        tax_amount_aed >= 0 AND
        total_amount_aed >= 0
    )
);

-- 5. PURCHASE_ORDER_ITEMS - Line items for purchase orders
-- Detailed items within each purchase order
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Order linkage
    purchase_order_id UUID NOT NULL,
    line_number INTEGER NOT NULL,
    
    -- Material details
    fabric_id UUID, -- May be NULL for new materials
    fabric_code VARCHAR(100),
    fabric_name VARCHAR(255) NOT NULL,
    fabric_description TEXT,
    fabric_specification TEXT,
    
    -- Quantity and measurements
    ordered_quantity_meters DECIMAL(12,3) NOT NULL,
    received_quantity_meters DECIMAL(12,3) DEFAULT 0,
    rejected_quantity_meters DECIMAL(12,3) DEFAULT 0,
    accepted_quantity_meters DECIMAL(12,3) DEFAULT 0,
    
    -- Pricing information
    unit_price_supplier_currency DECIMAL(12,4) NOT NULL,
    unit_price_aed DECIMAL(12,4) NOT NULL,
    line_discount_percentage DECIMAL(5,2) DEFAULT 0,
    line_discount_amount_aed DECIMAL(12,2) DEFAULT 0,
    line_total_aed DECIMAL(15,2) NOT NULL,
    
    -- Quality specifications
    quality_requirements TEXT,
    color_specification VARCHAR(255),
    pattern_specification VARCHAR(255),
    width_specification VARCHAR(100),
    weight_specification VARCHAR(100),
    
    -- Delivery details
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    storage_location_id UUID,
    
    -- Status tracking
    item_status VARCHAR(50) DEFAULT 'pending' CHECK (item_status IN (
        'pending', 'confirmed', 'in_production', 'ready', 'shipped', 
        'delivered', 'inspected', 'accepted', 'rejected', 'cancelled'
    )),
    
    -- Quality control
    inspection_required BOOLEAN DEFAULT TRUE,
    inspection_status VARCHAR(50) DEFAULT 'pending' CHECK (inspection_status IN ('pending', 'in_progress', 'passed', 'failed', 'waived')),
    quality_notes TEXT,
    
    -- Batch information
    supplier_lot_number VARCHAR(100),
    supplier_batch_number VARCHAR(100),
    production_date DATE,
    
    -- Metadata
    notes TEXT,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_line_per_order UNIQUE (purchase_order_id, line_number),
    CONSTRAINT valid_quantities CHECK (
        ordered_quantity_meters > 0 AND
        received_quantity_meters >= 0 AND
        rejected_quantity_meters >= 0 AND
        accepted_quantity_meters >= 0 AND
        (received_quantity_meters >= (rejected_quantity_meters + accepted_quantity_meters))
    ),
    CONSTRAINT valid_pricing CHECK (
        unit_price_supplier_currency > 0 AND
        unit_price_aed > 0 AND
        line_total_aed >= 0
    )
);

-- ======================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ======================================

-- Storage locations indexes
CREATE INDEX IF NOT EXISTS idx_storage_locations_organization_id ON storage_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_location_code ON storage_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_storage_locations_is_active ON storage_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_storage_locations_location_type ON storage_locations(location_type);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_partnership_level ON suppliers(partnership_level);
CREATE INDEX IF NOT EXISTS idx_suppliers_verification_status ON suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);

-- Inventory stocks indexes
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_organization_id ON inventory_stocks(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_fabric_id ON inventory_stocks(fabric_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_storage_location_id ON inventory_stocks(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_current_stock ON inventory_stocks(current_stock_meters);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_quality_status ON inventory_stocks(quality_status);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_low_stock_alert ON inventory_stocks(low_stock_alert);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_batch_number ON inventory_stocks(batch_number);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_status ON purchase_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected_delivery ON purchase_orders(expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_requested_by ON purchase_orders(requested_by);

-- Purchase order items indexes
CREATE INDEX IF NOT EXISTS idx_po_items_organization_id ON purchase_order_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_po_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_fabric_id ON purchase_order_items(fabric_id);
CREATE INDEX IF NOT EXISTS idx_po_items_item_status ON purchase_order_items(item_status);
CREATE INDEX IF NOT EXISTS idx_po_items_inspection_status ON purchase_order_items(inspection_status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stocks_fabric_location ON inventory_stocks(fabric_id, storage_location_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active_type ON suppliers(is_active, supplier_type);
CREATE INDEX IF NOT EXISTS idx_po_supplier_status ON purchase_orders(supplier_id, order_status);

-- ======================================
-- UPDATE TIMESTAMP TRIGGERS
-- ======================================

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_storage_locations_updated_at 
    BEFORE UPDATE ON storage_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_stocks_updated_at 
    BEFORE UPDATE ON inventory_stocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at 
    BEFORE UPDATE ON purchase_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at 
    BEFORE UPDATE ON purchase_order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;