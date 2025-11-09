-- Migration: create_inventory_management_additional_tables
-- Created at: 1762390747

-- ======================================
-- INVENTORY MANAGEMENT SYSTEM - ADDITIONAL TABLES
-- Creating remaining 6 tables for complete inventory management
-- ======================================

-- 6. MATERIAL_COSTS - Historical pricing and cost tracking
-- Comprehensive cost tracking with bulk pricing and currency conversion
CREATE TABLE IF NOT EXISTS material_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Material and supplier linkage
    fabric_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    
    -- Cost identification
    cost_record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cost_type VARCHAR(50) DEFAULT 'purchase' CHECK (cost_type IN ('purchase', 'quote', 'market_rate', 'negotiated', 'promotional')),
    
    -- Pricing information
    base_cost_per_meter DECIMAL(12,4) NOT NULL,
    supplier_currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    exchange_rate_to_aed DECIMAL(10,6) DEFAULT 1,
    cost_per_meter_aed DECIMAL(12,4) NOT NULL,
    
    -- Bulk pricing tiers
    tier_1_quantity_meters DECIMAL(12,3),
    tier_1_cost_per_meter_aed DECIMAL(12,4),
    tier_2_quantity_meters DECIMAL(12,3),
    tier_2_cost_per_meter_aed DECIMAL(12,4),
    tier_3_quantity_meters DECIMAL(12,3),
    tier_3_cost_per_meter_aed DECIMAL(12,4),
    
    -- Additional costs
    shipping_cost_per_meter_aed DECIMAL(12,4) DEFAULT 0,
    import_duty_percentage DECIMAL(5,2) DEFAULT 0,
    import_duty_per_meter_aed DECIMAL(12,4) DEFAULT 0,
    handling_cost_per_meter_aed DECIMAL(12,4) DEFAULT 0,
    insurance_cost_per_meter_aed DECIMAL(12,4) DEFAULT 0,
    
    -- Total cost calculation
    total_cost_per_meter_aed DECIMAL(12,4) NOT NULL,
    
    -- Market analysis
    market_position VARCHAR(50) CHECK (market_position IN ('very_low', 'low', 'competitive', 'high', 'very_high')),
    competitive_index DECIMAL(5,2), -- Percentage vs market average
    
    -- Validity and terms
    valid_from_date DATE,
    valid_until_date DATE,
    minimum_order_quantity DECIMAL(12,3),
    payment_terms VARCHAR(100),
    lead_time_days INTEGER,
    
    -- Quality and specifications
    quality_grade VARCHAR(50),
    fabric_width_cm DECIMAL(8,2),
    fabric_weight_gsm INTEGER,
    special_conditions TEXT,
    
    -- Source and documentation
    source_document VARCHAR(255), -- Quote ref, invoice ref, etc.
    purchase_order_id UUID, -- If from actual purchase
    quote_reference VARCHAR(255),
    negotiation_notes TEXT,
    
    -- Status and approval
    cost_status VARCHAR(50) DEFAULT 'active' CHECK (cost_status IN ('active', 'expired', 'superseded', 'rejected')),
    approved_by UUID,
    approved_date DATE,
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_cost_amounts CHECK (
        base_cost_per_meter > 0 AND
        cost_per_meter_aed > 0 AND
        total_cost_per_meter_aed > 0 AND
        exchange_rate_to_aed > 0
    ),
    CONSTRAINT valid_bulk_pricing CHECK (
        (tier_1_quantity_meters IS NULL OR tier_1_quantity_meters > 0) AND
        (tier_2_quantity_meters IS NULL OR tier_2_quantity_meters > COALESCE(tier_1_quantity_meters, 0)) AND
        (tier_3_quantity_meters IS NULL OR tier_3_quantity_meters > COALESCE(tier_2_quantity_meters, 0))
    ),
    CONSTRAINT valid_dates CHECK (valid_until_date IS NULL OR valid_until_date >= valid_from_date)
);

-- 7. QUALITY_INSPECTIONS - Quality control and defect tracking
-- Comprehensive quality control tracking with inspection procedures
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Inspection identification
    inspection_number VARCHAR(100) NOT NULL,
    inspection_type VARCHAR(50) DEFAULT 'incoming' CHECK (inspection_type IN ('incoming', 'in_house', 'customer_complaint', 'random', 'return_inspection')),
    
    -- Material and batch information
    fabric_id UUID NOT NULL,
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    supplier_id UUID,
    purchase_order_id UUID,
    
    -- Inspection scheduling
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector_id UUID NOT NULL,
    inspection_start_time TIMESTAMPTZ,
    inspection_end_time TIMESTAMPTZ,
    
    -- Sample information
    total_quantity_meters DECIMAL(12,3),
    sample_quantity_meters DECIMAL(12,3),
    roll_count INTEGER,
    sample_roll_count INTEGER,
    sampling_method VARCHAR(100),
    
    -- Visual inspection results
    color_consistency_rating INTEGER CHECK (color_consistency_rating >= 1 AND color_consistency_rating <= 5),
    pattern_quality_rating INTEGER CHECK (pattern_quality_rating >= 1 AND pattern_quality_rating <= 5),
    surface_finish_rating INTEGER CHECK (surface_finish_rating >= 1 AND surface_finish_rating <= 5),
    edge_quality_rating INTEGER CHECK (edge_quality_rating >= 1 AND edge_quality_rating <= 5),
    
    -- Physical property tests
    fabric_width_measured_cm DECIMAL(8,2),
    fabric_width_variance_cm DECIMAL(6,2),
    fabric_weight_measured_gsm INTEGER,
    fabric_weight_variance_gsm INTEGER,
    thickness_measured_mm DECIMAL(6,3),
    
    -- Defect tracking
    defect_count_total INTEGER DEFAULT 0,
    major_defects_count INTEGER DEFAULT 0,
    minor_defects_count INTEGER DEFAULT 0,
    defect_rate_per_meter DECIMAL(8,4) DEFAULT 0,
    defect_categories JSONB, -- Array of defect types found
    
    -- Specific defect types
    color_variations_count INTEGER DEFAULT 0,
    weaving_defects_count INTEGER DEFAULT 0,
    printing_defects_count INTEGER DEFAULT 0,
    finishing_defects_count INTEGER DEFAULT 0,
    contamination_count INTEGER DEFAULT 0,
    texture_irregularities_count INTEGER DEFAULT 0,
    
    -- Compliance tests
    care_instruction_compliance BOOLEAN DEFAULT TRUE,
    composition_verification BOOLEAN DEFAULT TRUE,
    environmental_compliance BOOLEAN DEFAULT TRUE,
    fire_safety_compliance BOOLEAN DEFAULT TRUE,
    uae_standards_compliance BOOLEAN DEFAULT TRUE,
    
    -- Overall assessment
    overall_quality_rating INTEGER CHECK (overall_quality_rating >= 1 AND overall_quality_rating <= 5),
    acceptance_recommendation VARCHAR(50) CHECK (acceptance_recommendation IN ('accept', 'conditional_accept', 'reject', 'rework_required')),
    inspector_comments TEXT,
    
    -- Decision and outcomes
    final_decision VARCHAR(50) DEFAULT 'pending' CHECK (final_decision IN ('pending', 'accepted', 'conditionally_accepted', 'rejected', 'returned')),
    decision_by UUID,
    decision_date DATE,
    decision_notes TEXT,
    
    -- Follow-up actions
    corrective_actions_required BOOLEAN DEFAULT FALSE,
    supplier_notification_required BOOLEAN DEFAULT FALSE,
    return_authorization_number VARCHAR(100),
    replacement_requested BOOLEAN DEFAULT FALSE,
    
    -- Documentation
    inspection_photos JSONB, -- Array of photo URLs
    test_certificates JSONB, -- Array of certificate URLs
    inspection_report_url TEXT,
    
    -- Supplier communication
    supplier_notified BOOLEAN DEFAULT FALSE,
    supplier_response TEXT,
    supplier_response_date DATE,
    corrective_action_plan TEXT,
    
    -- Cost impact
    inspection_cost_aed DECIMAL(10,2),
    rejection_cost_aed DECIMAL(12,2),
    rework_cost_aed DECIMAL(12,2),
    total_impact_cost_aed DECIMAL(12,2),
    
    -- Standards and procedures
    inspection_standard VARCHAR(100), -- ISO, ASTM, etc.
    inspection_procedure_ref VARCHAR(100),
    equipment_used JSONB,
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_inspection_number_per_org UNIQUE (organization_id, inspection_number),
    CONSTRAINT valid_inspection_time CHECK (inspection_end_time IS NULL OR inspection_end_time >= inspection_start_time),
    CONSTRAINT valid_sample_quantity CHECK (sample_quantity_meters IS NULL OR sample_quantity_meters <= COALESCE(total_quantity_meters, sample_quantity_meters)),
    CONSTRAINT valid_defect_counts CHECK (
        defect_count_total >= 0 AND
        major_defects_count >= 0 AND
        minor_defects_count >= 0 AND
        defect_count_total >= (major_defects_count + minor_defects_count)
    )
);

-- 8. SUPPLIER_RATINGS - Performance scores and feedback
-- Detailed supplier performance tracking and rating system
CREATE TABLE IF NOT EXISTS supplier_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Supplier and evaluation period
    supplier_id UUID NOT NULL,
    rating_period_start DATE NOT NULL,
    rating_period_end DATE NOT NULL,
    evaluation_type VARCHAR(50) DEFAULT 'periodic' CHECK (evaluation_type IN ('periodic', 'order_based', 'complaint', 'audit', 'annual')),
    
    -- Rating categories (1-5 scale)
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating DECIMAL(3,2) CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    service_rating DECIMAL(3,2) CHECK (service_rating >= 1 AND service_rating <= 5),
    pricing_rating DECIMAL(3,2) CHECK (pricing_rating >= 1 AND pricing_rating <= 5),
    communication_rating DECIMAL(3,2) CHECK (communication_rating >= 1 AND communication_rating <= 5),
    
    -- Performance metrics
    orders_placed INTEGER DEFAULT 0,
    orders_delivered_on_time INTEGER DEFAULT 0,
    orders_delivered_late INTEGER DEFAULT 0,
    on_time_delivery_percentage DECIMAL(5,2) DEFAULT 0,
    
    quality_issues_count INTEGER DEFAULT 0,
    returned_items_count INTEGER DEFAULT 0,
    quality_compliance_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Financial performance
    total_order_value_aed DECIMAL(15,2) DEFAULT 0,
    cost_savings_achieved_aed DECIMAL(12,2) DEFAULT 0,
    price_competitiveness_score DECIMAL(3,2),
    payment_terms_flexibility_score DECIMAL(3,2),
    
    -- Service metrics
    response_time_hours DECIMAL(8,2),
    issue_resolution_time_hours DECIMAL(8,2),
    customer_service_incidents INTEGER DEFAULT 0,
    proactive_communication_score DECIMAL(3,2),
    
    -- Innovation and value-add
    new_products_introduced INTEGER DEFAULT 0,
    process_improvements_suggested INTEGER DEFAULT 0,
    sustainability_initiatives_score DECIMAL(3,2),
    innovation_score DECIMAL(3,2),
    
    -- Risk assessment
    financial_stability_score DECIMAL(3,2),
    supply_chain_reliability_score DECIMAL(3,2),
    compliance_score DECIMAL(3,2),
    business_continuity_score DECIMAL(3,2),
    
    -- Overall calculations
    weighted_average_rating DECIMAL(3,2),
    overall_performance_score DECIMAL(5,2),
    recommendation_status VARCHAR(50) CHECK (recommendation_status IN ('preferred', 'approved', 'conditional', 'restricted', 'not_recommended')),
    
    -- Detailed feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    specific_feedback TEXT,
    action_items TEXT,
    
    -- Evaluation team
    evaluated_by UUID NOT NULL,
    reviewed_by UUID,
    approved_by UUID,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Supplier engagement
    feedback_shared_with_supplier BOOLEAN DEFAULT FALSE,
    feedback_sharing_date DATE,
    supplier_response TEXT,
    supplier_improvement_plan TEXT,
    
    -- Benchmarking
    industry_benchmark_score DECIMAL(3,2),
    peer_comparison_ranking INTEGER,
    historical_trend VARCHAR(50) CHECK (historical_trend IN ('improving', 'stable', 'declining', 'new_supplier')),
    
    -- Next steps
    contract_renewal_recommendation BOOLEAN,
    volume_increase_recommendation BOOLEAN,
    audit_required BOOLEAN DEFAULT FALSE,
    development_program_recommended BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating_period CHECK (rating_period_end >= rating_period_start),
    CONSTRAINT valid_percentages CHECK (
        on_time_delivery_percentage >= 0 AND on_time_delivery_percentage <= 100 AND
        quality_compliance_percentage >= 0 AND quality_compliance_percentage <= 100
    ),
    CONSTRAINT valid_order_counts CHECK (
        orders_placed >= 0 AND
        orders_delivered_on_time >= 0 AND
        orders_delivered_late >= 0 AND
        orders_placed >= (orders_delivered_on_time + orders_delivered_late)
    )
);

-- 9. MATERIAL_USAGE - Usage tracking for cost calculations
-- Track material consumption for accurate costing and inventory management
CREATE TABLE IF NOT EXISTS material_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Usage identification
    usage_reference VARCHAR(100) NOT NULL,
    usage_type VARCHAR(50) DEFAULT 'production' CHECK (usage_type IN ('production', 'sample', 'fitting', 'waste', 'adjustment', 'return')),
    
    -- Material and location
    fabric_id UUID NOT NULL,
    storage_location_id UUID NOT NULL,
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    
    -- Order and project linkage
    order_id UUID, -- Links to orders table
    order_item_id UUID,
    customer_id UUID,
    employee_id UUID, -- Who used the material
    
    -- Usage quantities
    quantity_used_meters DECIMAL(12,3) NOT NULL,
    quantity_wasted_meters DECIMAL(12,3) DEFAULT 0,
    quantity_returned_meters DECIMAL(12,3) DEFAULT 0,
    net_consumption_meters DECIMAL(12,3) NOT NULL,
    
    -- Cost calculations
    unit_cost_aed DECIMAL(12,4),
    total_cost_aed DECIMAL(15,2),
    waste_cost_aed DECIMAL(12,2),
    
    -- Usage details
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_start_time TIMESTAMPTZ,
    usage_end_time TIMESTAMPTZ,
    work_order_number VARCHAR(100),
    project_reference VARCHAR(100),
    
    -- Garment details
    garment_type VARCHAR(100),
    garment_size VARCHAR(50),
    design_id UUID, -- Links to designs table
    pattern_pieces JSONB, -- List of pattern pieces cut
    
    -- Quality and efficiency
    cutting_efficiency_percentage DECIMAL(5,2),
    material_utilization_rating INTEGER CHECK (material_utilization_rating >= 1 AND material_utilization_rating <= 5),
    quality_of_cut_rating INTEGER CHECK (quality_of_cut_rating >= 1 AND quality_of_cut_rating <= 5),
    
    -- Waste analysis
    waste_reason VARCHAR(100),
    waste_category VARCHAR(50) CHECK (waste_category IN ('cutting_error', 'material_defect', 'design_change', 'measurement_error', 'normal_trim', 'other')),
    waste_description TEXT,
    recoverable_waste_meters DECIMAL(12,3) DEFAULT 0,
    
    -- Equipment and tools used
    cutting_equipment VARCHAR(100),
    cutting_method VARCHAR(100),
    tools_used JSONB,
    
    -- Approval and verification
    approved_by UUID,
    approved_date DATE,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed', 'corrected')),
    verified_by UUID,
    
    -- Costing allocation
    allocated_to_order BOOLEAN DEFAULT TRUE,
    cost_center VARCHAR(100),
    department_id UUID,
    billing_status VARCHAR(50) DEFAULT 'pending' CHECK (billing_status IN ('pending', 'billed', 'written_off', 'disputed')),
    
    -- Returns and adjustments
    return_date DATE,
    return_reason TEXT,
    return_condition VARCHAR(50) CHECK (return_condition IN ('excellent', 'good', 'fair', 'poor', 'unusable')),
    adjustment_required BOOLEAN DEFAULT FALSE,
    adjustment_amount_aed DECIMAL(12,2),
    
    -- Documentation
    cutting_photos JSONB, -- Photos of cutting process/results
    waste_photos JSONB, -- Photos of waste for analysis
    usage_documentation JSONB, -- Related documents
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_usage_reference_per_org UNIQUE (organization_id, usage_reference),
    CONSTRAINT valid_usage_quantities CHECK (
        quantity_used_meters > 0 AND
        quantity_wasted_meters >= 0 AND
        quantity_returned_meters >= 0 AND
        net_consumption_meters >= 0 AND
        net_consumption_meters <= quantity_used_meters
    ),
    CONSTRAINT valid_usage_times CHECK (usage_end_time IS NULL OR usage_end_time >= usage_start_time)
);

-- 10. REORDER_TRIGGERS - Automated reorder point management
-- Intelligent reorder point calculation and alert management
CREATE TABLE IF NOT EXISTS reorder_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Material and location
    fabric_id UUID NOT NULL,
    storage_location_id UUID,
    
    -- Reorder calculations
    minimum_stock_level DECIMAL(12,3) NOT NULL,
    maximum_stock_level DECIMAL(12,3),
    reorder_point DECIMAL(12,3) NOT NULL,
    reorder_quantity DECIMAL(12,3) NOT NULL,
    safety_stock_level DECIMAL(12,3) DEFAULT 0,
    
    -- Demand forecasting
    average_monthly_consumption DECIMAL(12,3) DEFAULT 0,
    seasonal_factor DECIMAL(4,2) DEFAULT 1.0,
    lead_time_days INTEGER DEFAULT 0,
    lead_time_variability_days INTEGER DEFAULT 0,
    
    -- Historical data analysis
    historical_months_analyzed INTEGER DEFAULT 12,
    consumption_trend VARCHAR(50) CHECK (consumption_trend IN ('increasing', 'stable', 'decreasing', 'seasonal', 'irregular')),
    demand_variability_coefficient DECIMAL(4,2),
    forecast_accuracy_percentage DECIMAL(5,2),
    
    -- Calculation method
    calculation_method VARCHAR(100) DEFAULT 'statistical' CHECK (calculation_method IN ('manual', 'simple', 'statistical', 'machine_learning', 'hybrid')),
    calculation_parameters JSONB, -- Parameters used in calculation
    last_calculation_date DATE,
    next_calculation_date DATE,
    
    -- Alert configuration
    alert_threshold_percentage DECIMAL(5,2) DEFAULT 100, -- Trigger at 100% of reorder point
    emergency_threshold_percentage DECIMAL(5,2) DEFAULT 50, -- Emergency alert at 50% of minimum
    alert_frequency VARCHAR(50) DEFAULT 'daily' CHECK (alert_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'manual')),
    
    -- Alert status
    alert_active BOOLEAN DEFAULT FALSE,
    alert_triggered_date TIMESTAMPTZ,
    alert_acknowledged BOOLEAN DEFAULT FALSE,
    alert_acknowledged_by UUID,
    alert_acknowledged_date TIMESTAMPTZ,
    emergency_alert_active BOOLEAN DEFAULT FALSE,
    
    -- Supplier preferences for reordering
    preferred_supplier_id UUID,
    backup_supplier_ids JSONB, -- Array of backup supplier IDs
    auto_po_creation BOOLEAN DEFAULT FALSE,
    auto_po_template_id UUID,
    
    -- Approval workflow
    approval_required BOOLEAN DEFAULT TRUE,
    approved_by UUID,
    approval_threshold_aed DECIMAL(12,2), -- Auto-approve below this amount
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    
    -- Performance tracking
    stockout_incidents_count INTEGER DEFAULT 0,
    last_stockout_date DATE,
    overstock_incidents_count INTEGER DEFAULT 0,
    inventory_accuracy_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Seasonal and special considerations
    seasonal_adjustments JSONB, -- Month-wise adjustment factors
    special_events_impact JSONB, -- Ramadan, Eid, wedding seasons etc.
    minimum_shelf_life_days INTEGER, -- For perishable items
    obsolescence_risk_factor DECIMAL(3,2) DEFAULT 0,
    
    -- Economic factors
    carrying_cost_percentage DECIMAL(5,2) DEFAULT 20, -- Annual carrying cost %
    ordering_cost_aed DECIMAL(10,2) DEFAULT 0, -- Cost per purchase order
    stockout_cost_per_meter_aed DECIMAL(12,4), -- Business impact of stockout
    
    -- Review and maintenance
    last_review_date DATE,
    next_review_date DATE,
    review_frequency_months INTEGER DEFAULT 6,
    reviewed_by UUID,
    review_notes TEXT,
    
    -- Status and configuration
    trigger_status VARCHAR(50) DEFAULT 'active' CHECK (trigger_status IN ('active', 'inactive', 'suspended', 'manual_override')),
    is_automatic BOOLEAN DEFAULT TRUE,
    manual_override BOOLEAN DEFAULT FALSE,
    manual_override_reason TEXT,
    manual_override_by UUID,
    manual_override_until DATE,
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_reorder_trigger_fabric_location UNIQUE (fabric_id, storage_location_id),
    CONSTRAINT valid_stock_levels CHECK (
        minimum_stock_level >= 0 AND
        (maximum_stock_level IS NULL OR maximum_stock_level > minimum_stock_level) AND
        reorder_point >= minimum_stock_level AND
        reorder_quantity > 0 AND
        safety_stock_level >= 0
    ),
    CONSTRAINT valid_percentages CHECK (
        seasonal_factor > 0 AND
        alert_threshold_percentage > 0 AND
        emergency_threshold_percentage > 0 AND
        emergency_threshold_percentage <= alert_threshold_percentage
    )
);

-- 11. IMPORT_DOCUMENTS - UAE compliance and customs documentation
-- Complete import documentation and compliance tracking
CREATE TABLE IF NOT EXISTS import_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Import shipment identification
    import_reference VARCHAR(100) NOT NULL,
    shipment_reference VARCHAR(100),
    customs_declaration_number VARCHAR(100),
    purchase_order_id UUID,
    supplier_id UUID NOT NULL,
    
    -- Shipment details
    shipment_date DATE,
    arrival_date DATE,
    customs_clearance_date DATE,
    delivery_completion_date DATE,
    
    -- Customs and legal documentation
    commercial_invoice_number VARCHAR(100),
    commercial_invoice_date DATE,
    commercial_invoice_value_aed DECIMAL(15,2),
    
    packing_list_reference VARCHAR(100),
    bill_of_lading VARCHAR(100),
    airway_bill VARCHAR(100),
    
    certificate_of_origin_number VARCHAR(100),
    certificate_of_origin_country VARCHAR(100),
    certificate_of_origin_date DATE,
    
    -- UAE import licenses and permits
    import_license_number VARCHAR(100),
    import_license_expiry DATE,
    import_permit_number VARCHAR(100),
    
    -- Quality and compliance certificates
    quality_certificate_number VARCHAR(100),
    quality_certificate_authority VARCHAR(255),
    quality_certificate_date DATE,
    quality_certificate_expiry DATE,
    
    textile_standards_certificate VARCHAR(100),
    environmental_compliance_certificate VARCHAR(100),
    fire_safety_certificate VARCHAR(100),
    
    -- Customs duties and fees
    customs_value_aed DECIMAL(15,2),
    customs_duty_rate_percentage DECIMAL(5,2),
    customs_duty_amount_aed DECIMAL(12,2),
    vat_rate_percentage DECIMAL(5,2) DEFAULT 5,
    vat_amount_aed DECIMAL(12,2),
    
    handling_charges_aed DECIMAL(10,2),
    storage_charges_aed DECIMAL(10,2),
    inspection_charges_aed DECIMAL(10,2),
    other_charges_aed DECIMAL(10,2),
    total_charges_aed DECIMAL(15,2),
    
    -- Shipping and logistics
    shipping_company VARCHAR(255),
    container_number VARCHAR(50),
    seal_number VARCHAR(50),
    vessel_name VARCHAR(255),
    voyage_number VARCHAR(100),
    
    port_of_origin VARCHAR(100),
    port_of_destination VARCHAR(100),
    customs_broker_name VARCHAR(255),
    clearing_agent_contact TEXT,
    
    -- Insurance and risk
    insurance_policy_number VARCHAR(100),
    insurance_company VARCHAR(255),
    insurance_value_aed DECIMAL(15,2),
    
    -- Inspection and examination
    customs_examination_required BOOLEAN DEFAULT FALSE,
    customs_examination_date DATE,
    customs_examination_result VARCHAR(100),
    pre_shipment_inspection BOOLEAN DEFAULT FALSE,
    destination_inspection BOOLEAN DEFAULT FALSE,
    
    -- Material details
    total_quantity_meters DECIMAL(15,3),
    total_weight_kg DECIMAL(12,3),
    number_of_packages INTEGER,
    package_type VARCHAR(100),
    
    material_description TEXT,
    hs_code VARCHAR(20), -- Harmonized System code
    fabric_composition_declared TEXT,
    
    -- Compliance status
    customs_clearance_status VARCHAR(50) DEFAULT 'pending' CHECK (customs_clearance_status IN (
        'pending', 'in_progress', 'cleared', 'held', 'rejected', 'under_examination'
    )),
    compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN (
        'pending', 'compliant', 'non_compliant', 'conditional', 'under_review'
    )),
    
    -- Issues and resolutions
    compliance_issues JSONB, -- Array of identified issues
    corrective_actions JSONB, -- Actions taken to resolve issues
    penalty_amount_aed DECIMAL(12,2),
    penalty_reason TEXT,
    
    -- Document management
    document_urls JSONB, -- Array of document file URLs
    original_documents_location TEXT,
    digital_copies_verified BOOLEAN DEFAULT FALSE,
    document_retention_until DATE,
    
    -- Approval and verification
    customs_officer_name VARCHAR(255),
    customs_officer_id VARCHAR(100),
    internal_verifier_id UUID,
    verification_date DATE,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'requires_clarification')),
    
    -- Follow-up and audit
    audit_required BOOLEAN DEFAULT FALSE,
    audit_date DATE,
    audit_outcome VARCHAR(100),
    lessons_learned TEXT,
    
    -- Supplier performance impact
    supplier_documentation_rating INTEGER CHECK (supplier_documentation_rating >= 1 AND supplier_documentation_rating <= 5),
    documentation_completeness_score INTEGER CHECK (documentation_completeness_score >= 0 AND documentation_completeness_score <= 100),
    
    -- Metadata
    notes TEXT,
    tags JSONB,
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_import_reference_per_org UNIQUE (organization_id, import_reference),
    CONSTRAINT valid_dates CHECK (
        (arrival_date IS NULL OR arrival_date >= shipment_date) AND
        (customs_clearance_date IS NULL OR customs_clearance_date >= arrival_date) AND
        (delivery_completion_date IS NULL OR delivery_completion_date >= customs_clearance_date)
    ),
    CONSTRAINT valid_financial_amounts CHECK (
        customs_value_aed >= 0 AND
        customs_duty_amount_aed >= 0 AND
        vat_amount_aed >= 0 AND
        total_charges_aed >= 0
    )
);

-- ======================================
-- ADDITIONAL INDEXES FOR NEW TABLES
-- ======================================

-- Material costs indexes
CREATE INDEX IF NOT EXISTS idx_material_costs_organization_id ON material_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_material_costs_fabric_id ON material_costs(fabric_id);
CREATE INDEX IF NOT EXISTS idx_material_costs_supplier_id ON material_costs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_material_costs_cost_record_date ON material_costs(cost_record_date);
CREATE INDEX IF NOT EXISTS idx_material_costs_cost_status ON material_costs(cost_status);
CREATE INDEX IF NOT EXISTS idx_material_costs_cost_type ON material_costs(cost_type);

-- Quality inspections indexes
CREATE INDEX IF NOT EXISTS idx_quality_inspections_organization_id ON quality_inspections(organization_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_fabric_id ON quality_inspections(fabric_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_supplier_id ON quality_inspections(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_inspection_date ON quality_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_inspector_id ON quality_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_final_decision ON quality_inspections(final_decision);

-- Supplier ratings indexes
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_organization_id ON supplier_ratings(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier_id ON supplier_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_evaluation_date ON supplier_ratings(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_overall_performance ON supplier_ratings(overall_performance_score);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_recommendation ON supplier_ratings(recommendation_status);

-- Material usage indexes
CREATE INDEX IF NOT EXISTS idx_material_usage_organization_id ON material_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_fabric_id ON material_usage(fabric_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_order_id ON material_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_usage_date ON material_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_material_usage_employee_id ON material_usage(employee_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_verification_status ON material_usage(verification_status);

-- Reorder triggers indexes
CREATE INDEX IF NOT EXISTS idx_reorder_triggers_organization_id ON reorder_triggers(organization_id);
CREATE INDEX IF NOT EXISTS idx_reorder_triggers_fabric_id ON reorder_triggers(fabric_id);
CREATE INDEX IF NOT EXISTS idx_reorder_triggers_alert_active ON reorder_triggers(alert_active);
CREATE INDEX IF NOT EXISTS idx_reorder_triggers_trigger_status ON reorder_triggers(trigger_status);
CREATE INDEX IF NOT EXISTS idx_reorder_triggers_next_review ON reorder_triggers(next_review_date);

-- Import documents indexes
CREATE INDEX IF NOT EXISTS idx_import_documents_organization_id ON import_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_import_documents_supplier_id ON import_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_import_documents_purchase_order_id ON import_documents(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_import_documents_customs_status ON import_documents(customs_clearance_status);
CREATE INDEX IF NOT EXISTS idx_import_documents_compliance_status ON import_documents(compliance_status);
CREATE INDEX IF NOT EXISTS idx_import_documents_arrival_date ON import_documents(arrival_date);

-- Additional composite indexes
CREATE INDEX IF NOT EXISTS idx_material_costs_fabric_supplier ON material_costs(fabric_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_batch_lot ON quality_inspections(batch_number, lot_number);
CREATE INDEX IF NOT EXISTS idx_material_usage_order_fabric ON material_usage(order_id, fabric_id);
CREATE INDEX IF NOT EXISTS idx_reorder_alerts_fabric_active ON reorder_triggers(fabric_id, alert_active);

-- ======================================
-- UPDATE TIMESTAMP TRIGGERS FOR NEW TABLES
-- ======================================

CREATE TRIGGER update_material_costs_updated_at 
    BEFORE UPDATE ON material_costs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_inspections_updated_at 
    BEFORE UPDATE ON quality_inspections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_ratings_updated_at 
    BEFORE UPDATE ON supplier_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_usage_updated_at 
    BEFORE UPDATE ON material_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reorder_triggers_updated_at 
    BEFORE UPDATE ON reorder_triggers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_documents_updated_at 
    BEFORE UPDATE ON import_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;