// Inventory Management & Quality Control System Types for Tailoring CRM
// UAE-Compliant Material Resource Management

// ================================
// CORE INVENTORY TYPES
// ================================

export interface Supplier {
  id: string;
  organization_id: string;
  supplier_code: string;
  supplier_name: string;
  business_name?: string;
  supplier_type?: 'Fabric Mill' | 'Wholesaler' | 'Importer' | 'Local Dealer' | 'International' | 'Boutique';
  
  // Business Registration
  business_license_number?: string;
  business_license_expiry?: string;
  tax_registration_number?: string;
  commercial_registration?: string;
  establishment_date?: string;
  
  // Contact Information
  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  secondary_contact_name?: string;
  secondary_contact_phone?: string;
  secondary_contact_email?: string;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  country?: string;
  postal_code?: string;
  
  // Commercial Terms
  payment_terms?: 'Net 30' | 'Net 60' | 'COD' | 'Advance Payment' | 'Letter of Credit';
  credit_limit_aed?: number;
  currency_preference?: 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'CNY';
  minimum_order_value_aed?: number;
  bulk_discount_threshold_aed?: number;
  bulk_discount_percentage?: number;
  lead_time_days?: number;
  
  // Performance Ratings
  quality_rating?: number; // 1-5 scale
  delivery_rating?: number; // 1-5 scale
  service_rating?: number; // 1-5 scale
  overall_rating?: number; // 1-5 scale
  total_orders?: number;
  successful_deliveries?: number;
  
  // Capabilities
  specialization?: {
    fabric_types: string[];
    techniques: string[];
    certifications: string[];
  };
  certifications?: {
    iso_certifications: string[];
    quality_certifications: string[];
    environmental_certifications: string[];
  };
  production_capacity?: string;
  geographic_coverage?: string[];
  
  // UAE Import Compliance
  uae_import_license?: string;
  customs_broker_contact?: string;
  preferred_shipping_method?: 'Air Freight' | 'Sea Freight' | 'Land Transport' | 'Courier';
  incoterms_preference?: 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'DAP';
  
  // Relationship Management
  relationship_manager_id?: string;
  partnership_level?: 'Strategic' | 'Preferred' | 'Standard' | 'Trial';
  contract_start_date?: string;
  contract_end_date?: string;
  
  // Status & Verification
  verification_status?: 'Verified' | 'Pending' | 'Unverified' | 'Rejected';
  verification_date?: string;
  verified_by?: string;
  is_active?: boolean;
  blocked_reason?: string;
  blocked_date?: string;
  blocked_by?: string;
  
  // Banking Information
  bank_name?: string;
  bank_account_number?: string;
  bank_swift_code?: string;
  bank_iban?: string;
  
  // Additional Information
  website_url?: string;
  social_media?: {
    linkedin?: string;
    whatsapp?: string;
    instagram?: string;
  };
  notes?: string;
  tags?: string[];
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FabricLibrary {
  id: string;
  organization_id: string;
  fabric_code: string;
  fabric_name: string;
  fabric_type: 'Wool' | 'Cotton' | 'Silk' | 'Linen' | 'Polyester' | 'Viscose' | 'Blend' | 'Cashmere' | 'Mohair' | 'Tweed';
  fabric_weight_gsm?: number;
  fabric_composition?: string;
  texture_finish?: string;
  care_instructions?: string;
  
  // Supplier Information
  supplier_name?: string;
  supplier_contact?: string;
  
  // Pricing (AED)
  cost_per_meter_aed: number;
  selling_price_per_meter_aed: number;
  
  // Inventory
  stock_quantity_meters?: number;
  minimum_order_meters?: number;
  
  // Suitability
  season_suitable?: ('Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All Season')[];
  garment_suitable?: ('Suits' | 'Shirts' | 'Trousers' | 'Jackets' | 'Coats' | 'Dresses' | 'Casual Wear')[];
  
  // Origin & Sustainability
  country_of_origin?: string;
  is_sustainable?: boolean;
  is_available?: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: string;
  organization_id: string;
  fabric_id: string;
  storage_location_id: string;
  current_stock_meters: number;
  reserved_stock_meters?: number;
  available_stock_meters?: number;
  minimum_stock_level?: number;
  maximum_stock_level?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  
  // Cost Information
  average_cost_per_meter?: number;
  total_value_aed?: number;
  last_purchase_price?: number;
  last_purchase_date?: string;
  
  // Stock Management
  last_stock_check_date?: string;
  last_movement_date?: string;
  stock_status?: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' | 'Discontinued';
  
  created_at: string;
  updated_at: string;
  
  // Relations
  fabric?: FabricLibrary;
  storage_location?: StorageLocation;
}

export interface StorageLocation {
  id: string;
  organization_id: string;
  location_code: string;
  location_name: string;
  location_type: 'Warehouse' | 'Showroom' | 'Storage Room' | 'Quality Control' | 'Transit';
  address?: string;
  city?: string;
  contact_person?: string;
  contact_phone?: string;
  
  // Capacity
  total_capacity_sqm?: number;
  used_capacity_sqm?: number;
  available_capacity_sqm?: number;
  
  // Environmental Conditions
  temperature_controlled?: boolean;
  humidity_controlled?: boolean;
  security_level?: 'Basic' | 'Standard' | 'High Security';
  
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  po_number: string;
  supplier_id: string;
  
  // Order Details
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  
  // Status
  status: 'Draft' | 'Sent' | 'Confirmed' | 'In Production' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Partial';
  urgency_level?: 'Low' | 'Normal' | 'High' | 'Urgent';
  
  // Financial
  subtotal_aed: number;
  tax_amount_aed?: number;
  shipping_cost_aed?: number;
  discount_amount_aed?: number;
  total_amount_aed: number;
  currency: string;
  exchange_rate?: number;
  
  // Terms
  payment_terms?: string;
  shipping_terms?: string;
  notes?: string;
  
  // UAE Import
  import_license_required?: boolean;
  customs_value_aed?: number;
  hs_code?: string;
  
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  fabric_id: string;
  
  // Quantities
  ordered_quantity_meters: number;
  received_quantity_meters?: number;
  pending_quantity_meters?: number;
  
  // Pricing
  unit_price_aed: number;
  total_price_aed: number;
  
  // Quality
  quality_specification?: string;
  quality_approved?: boolean;
  quality_notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  fabric?: FabricLibrary;
  purchase_order?: PurchaseOrder;
}

export interface MaterialCost {
  id: string;
  organization_id: string;
  fabric_id: string;
  supplier_id: string;
  
  // Pricing
  cost_per_meter_aed: number;
  currency: string;
  effective_date: string;
  expiry_date?: string;
  
  // Quantity Breaks
  minimum_quantity?: number;
  maximum_quantity?: number;
  bulk_discount_percentage?: number;
  
  is_current?: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  fabric?: FabricLibrary;
  supplier?: Supplier;
}

export interface MaterialUsage {
  id: string;
  organization_id: string;
  fabric_id: string;
  order_id?: string;
  
  // Usage Details
  quantity_used_meters: number;
  cost_per_meter_aed: number;
  total_cost_aed: number;
  usage_date: string;
  usage_type: 'Production' | 'Sample' | 'Waste' | 'Return' | 'Quality Test';
  
  // References
  reference_number?: string;
  notes?: string;
  
  created_by: string;
  created_at: string;
  
  // Relations
  fabric?: FabricLibrary;
}

// ================================
// QUALITY CONTROL TYPES
// ================================

export interface QualityStandard {
  id: string;
  organization_id: string;
  standard_code: string;
  standard_name: string;
  standard_type: 'Fabric Quality' | 'Workmanship' | 'Measurement' | 'Finishing' | 'Packaging';
  category: string;
  
  // Standard Definition
  description: string;
  acceptance_criteria: string;
  measurement_method?: string;
  tools_required?: string[];
  
  // Tolerance & Limits
  minimum_value?: number;
  maximum_value?: number;
  target_value?: number;
  unit_of_measure?: string;
  
  // Implementation
  is_mandatory: boolean;
  applicable_garment_types: string[];
  inspection_stage: 'Incoming' | 'In-Process' | 'Final' | 'Pre-Delivery';
  
  // References
  industry_standard_reference?: string;
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QualityInspection {
  id: string;
  organization_id: string;
  inspection_number: string;
  inspection_type: 'Fabric Inspection' | 'Garment Inspection' | 'Final Quality Check' | 'Customer Return';
  
  // Subject of Inspection
  fabric_id?: string;
  order_id?: string;
  supplier_id?: string;
  
  // Inspection Details
  inspection_date: string;
  inspector_id: string;
  inspection_location: string;
  
  // Results
  overall_result: 'Passed' | 'Failed' | 'Conditional Pass' | 'Re-inspection Required';
  total_defects: number;
  critical_defects: number;
  major_defects: number;
  minor_defects: number;
  
  // Scoring
  quality_score?: number; // Percentage
  acceptance_level?: 'A' | 'B' | 'C' | 'D';
  
  // Actions
  action_required?: 'Accept' | 'Reject' | 'Rework' | 'Return to Supplier' | 'Mark Down';
  corrective_actions?: string;
  notes?: string;
  
  // Follow-up
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_by?: string;
  
  completed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  fabric?: FabricLibrary;
  inspector?: any; // Employee reference
  supplier?: Supplier;
  inspection_items?: QualityInspectionItem[];
}

export interface QualityInspectionItem {
  id: string;
  inspection_id: string;
  checklist_item_id?: string;
  
  // Item Details
  item_description: string;
  standard_reference?: string;
  
  // Inspection Results
  result: 'Pass' | 'Fail' | 'Not Applicable' | 'Conditional';
  measured_value?: number;
  expected_value?: number;
  deviation?: number;
  unit_of_measure?: string;
  
  // Defect Information
  defect_type?: 'Critical' | 'Major' | 'Minor';
  defect_location?: string;
  defect_description?: string;
  
  // Documentation
  photo_url?: string;
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface QualityChecklist {
  id: string;
  organization_id: string;
  checklist_name: string;
  checklist_type: 'Fabric Inspection' | 'Garment Quality' | 'Final Check' | 'Supplier Audit';
  garment_category?: 'Suits' | 'Shirts' | 'Trousers' | 'Dresses' | 'Outerwear' | 'All';
  
  // Checklist Details
  description?: string;
  version: string;
  effective_date: string;
  
  // Status
  is_active: boolean;
  is_default?: boolean;
  
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  items?: QualityChecklistItem[];
}

export interface QualityChecklistItem {
  id: string;
  checklist_id: string;
  item_sequence: number;
  
  // Item Definition
  item_name: string;
  item_description: string;
  inspection_method: 'Visual' | 'Measurement' | 'Touch/Feel' | 'Functional Test';
  
  // Standards & Criteria
  acceptance_criteria: string;
  rejection_criteria?: string;
  measurement_required: boolean;
  measurement_unit?: string;
  target_value?: number;
  tolerance_positive?: number;
  tolerance_negative?: number;
  
  // Classification
  defect_category: 'Critical' | 'Major' | 'Minor';
  is_mandatory: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface QualityIssue {
  id: string;
  organization_id: string;
  issue_number: string;
  issue_type: 'Defect' | 'Complaint' | 'Non-Conformance' | 'Process Issue' | 'Supplier Issue';
  
  // Issue Details
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  source: 'Customer Complaint' | 'Internal Inspection' | 'Supplier Report' | 'Production';
  
  // References
  fabric_id?: string;
  order_id?: string;
  customer_id?: string;
  supplier_id?: string;
  inspection_id?: string;
  
  // Issue Management
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Escalated';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  assigned_to?: string;
  
  // Resolution
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  resolution_date?: string;
  resolution_notes?: string;
  
  // Follow-up
  follow_up_required?: boolean;
  follow_up_date?: string;
  verification_required?: boolean;
  verification_date?: string;
  verified_by?: string;
  
  // Documentation
  attachments?: string[];
  cost_impact_aed?: number;
  
  reported_by: string;
  reported_date: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  fabric?: FabricLibrary;
  supplier?: Supplier;
  assigned_employee?: any; // Employee reference
}

// ================================
// ANALYTICS & DASHBOARD TYPES
// ================================

export interface InventoryStats {
  total_fabrics: number;
  total_suppliers: number;
  total_stock_value_aed: number;
  low_stock_items: number;
  out_of_stock_items: number;
  pending_orders: number;
  monthly_usage_value: number;
  top_fabrics_by_usage: Array<{
    fabric_name: string;
    usage_meters: number;
    value_aed: number;
  }>;
  supplier_performance: Array<{
    supplier_name: string;
    rating: number;
    orders_count: number;
    on_time_delivery: number;
  }>;
}

export interface QualityStats {
  total_inspections: number;
  pass_rate: number;
  defect_rate: number;
  critical_defects: number;
  supplier_quality_score: number;
  monthly_quality_trend: Array<{
    month: string;
    pass_rate: number;
    defect_count: number;
  }>;
  top_defect_types: Array<{
    defect_type: string;
    count: number;
    percentage: number;
  }>;
  supplier_quality_ranking: Array<{
    supplier_name: string;
    quality_score: number;
    defect_rate: number;
    inspection_count: number;
  }>;
}

export interface StockAlert {
  id: string;
  fabric_id: string;
  fabric_name: string;
  current_stock: number;
  minimum_stock: number;
  alert_type: 'Low Stock' | 'Out of Stock' | 'Overstock' | 'Expiring';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  recommended_action: string;
  created_at: string;
}

// ================================
// FORM INPUT TYPES
// ================================

export interface CreateSupplierInput {
  supplier_name: string;
  business_name?: string;
  supplier_type?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  country?: string;
  city?: string;
  specialization?: {
    fabric_types: string[];
    techniques: string[];
  };
  payment_terms?: string;
  currency_preference?: string;
  lead_time_days?: number;
  notes?: string;
}

export interface CreateFabricInput {
  fabric_name: string;
  fabric_type: string;
  fabric_composition?: string;
  fabric_weight_gsm?: number;
  cost_per_meter_aed: number;
  selling_price_per_meter_aed: number;
  supplier_name?: string;
  country_of_origin?: string;
  season_suitable?: string[];
  garment_suitable?: string[];
  care_instructions?: string;
  minimum_order_meters?: number;
  is_sustainable?: boolean;
}

export interface CreatePurchaseOrderInput {
  supplier_id: string;
  expected_delivery_date?: string;
  payment_terms?: string;
  shipping_terms?: string;
  notes?: string;
  items: Array<{
    fabric_id: string;
    ordered_quantity_meters: number;
    unit_price_aed: number;
    quality_specification?: string;
  }>;
}

export interface CreateQualityInspectionInput {
  inspection_type: string;
  fabric_id?: string;
  order_id?: string;
  supplier_id?: string;
  inspection_location: string;
  checklist_id?: string;
  notes?: string;
}

// ================================
// UTILITY FUNCTIONS
// ================================

export const formatAEDCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED'
  }).format(amount);
};

export const calculateStockValue = (quantity: number, costPerMeter: number): number => {
  return quantity * costPerMeter;
};

export const getStockStatus = (currentStock: number, minStock: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minStock) return 'Low Stock';
  return 'In Stock';
};

export const getSupplierRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600 bg-green-100';
  if (rating >= 4.0) return 'text-blue-600 bg-blue-100';
  if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100';
  if (rating >= 3.0) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

export const getQualityResultColor = (result: string): string => {
  switch (result) {
    case 'Passed': return 'text-green-600 bg-green-100';
    case 'Failed': return 'text-red-600 bg-red-100';
    case 'Conditional Pass': return 'text-yellow-600 bg-yellow-100';
    case 'Re-inspection Required': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getDefectSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'Critical': return 'text-red-600 bg-red-100';
    case 'Major': return 'text-orange-600 bg-orange-100';
    case 'Minor': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const calculateQualityScore = (totalDefects: number, inspectedItems: number): number => {
  if (inspectedItems === 0) return 100;
  return Math.max(0, 100 - ((totalDefects / inspectedItems) * 100));
};

// UAE Fabric Import Compliance
export const UAE_FABRIC_STANDARDS = {
  TEXTILE_IMPORT_CATEGORIES: [
    'Cotton Fabrics',
    'Wool Fabrics', 
    'Silk Fabrics',
    'Synthetic Fabrics',
    'Blended Fabrics'
  ],
  REQUIRED_CERTIFICATIONS: [
    'Certificate of Origin',
    'Quality Certificate',
    'Phytosanitary Certificate',
    'Commercial Invoice',
    'Packing List'
  ],
  QUALITY_STANDARDS: {
    FABRIC_WEIGHT_TOLERANCE: 5, // percentage
    COLOR_FASTNESS_MIN: 4, // grade
    SHRINKAGE_MAX: 3, // percentage
    DEFECTS_PER_100M_MAX: 5
  }
};

export const calculateImportDuty = (fabricValue: number, fabricType: string): number => {
  // UAE import duty rates (approximate)
  const dutyRates = {
    'Cotton': 0.05, // 5%
    'Wool': 0.05,
    'Silk': 0.05,
    'Synthetic': 0.10, // 10%
    'Blend': 0.075 // 7.5%
  };
  
  const rate = dutyRates[fabricType as keyof typeof dutyRates] || 0.075;
  return fabricValue * rate;
};



// Additional utility functions for formatting
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-AE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getUrgencyColor = (urgency: string): string => {
  const urgencyColors: { [key: string]: string } = {
    low: 'bg-green-100 text-green-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  return urgencyColors[urgency] || 'bg-gray-100 text-gray-800';
};

export const getInspectionStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    passed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    conditional: 'bg-orange-100 text-orange-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getQualityGradeColor = (grade: string): string => {
  const gradeColors: { [key: string]: string } = {
    'A': 'bg-green-600 text-white',
    'B': 'bg-blue-600 text-white',
    'C': 'bg-yellow-600 text-white',
    'D': 'bg-orange-600 text-white',
    'F': 'bg-red-600 text-white'
  };
  return gradeColors[grade] || 'bg-gray-600 text-white';
};
