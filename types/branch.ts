// Multi-Location & Branch Management Types
// Generated: 2025-11-10

export type BranchType = 'main' | 'branch' | 'outlet' | 'franchise' | 'warehouse';
export type BranchStatus = 'active' | 'inactive' | 'under_renovation' | 'temporarily_closed' | 'permanently_closed';
export type Emirate = 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type AssignmentType = 'permanent' | 'temporary' | 'rotating' | 'on_demand';
export type AccessLevel = 'full' | 'limited' | 'read_only';
export type StaffAssignmentStatus = 'active' | 'inactive' | 'on_leave' | 'transferred';
export type InventoryStatus = 'available' | 'reserved' | 'low_stock' | 'out_of_stock' | 'discontinued';
export type TransferType = 'stock_balancing' | 'emergency_request' | 'planned_redistribution' | 'return' | 'quality_issue';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type TransferStatus = 'draft' | 'pending_approval' | 'approved' | 'in_transit' | 'received' | 'cancelled' | 'rejected';
export type QualityStatus = 'passed' | 'failed' | 'pending' | 'damaged';
export type MetricPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RoutingReason = 'capacity' | 'specialization' | 'material_availability' | 'customer_preference' | 'load_balancing';
export type RoutingStatus = 'pending' | 'in_production' | 'completed' | 'transferred' | 'cancelled';
export type AssetType = 'machinery' | 'equipment' | 'furniture' | 'vehicle' | 'computer' | 'tool' | 'fixture';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair' | 'obsolete';
export type AssetStatus = 'active' | 'inactive' | 'under_maintenance' | 'retired' | 'lost' | 'sold';
export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'units_of_production';

// ============================================
// Branch (Location) Interface
// ============================================
export interface Branch {
  id: string;
  organization_id: string;
  branch_code: string;
  branch_name: string;
  branch_type: BranchType;
  
  // Location Details
  address_line1: string;
  address_line2?: string;
  city: string;
  emirate?: Emirate;
  postal_code?: string;
  country: string;
  
  // Contact Information
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  whatsapp?: string;
  
  // Operational Details
  status: BranchStatus;
  opening_date: string;
  closing_date?: string;
  
  // Capacity & Resources
  floor_area_sqm?: number;
  number_of_floors: number;
  staff_capacity?: number;
  production_capacity_per_month?: number;
  
  // Manager & Staff
  branch_manager_id?: string;
  assistant_manager_id?: string;
  total_staff_count: number;
  
  // Financial
  monthly_rent_aed?: number;
  monthly_utilities_budget_aed?: number;
  monthly_overhead_aed?: number;
  
  // UAE Compliance
  trade_license_number?: string;
  trade_license_expiry?: string;
  municipality_license?: string;
  civil_defense_certificate?: string;
  
  // Settings
  allows_walk_in: boolean;
  allows_delivery: boolean;
  allows_pickup: boolean;
  is_flagship: boolean;
  priority_level: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ============================================
// Branch Operating Hours
// ============================================
export interface BranchOperatingHours {
  id: string;
  branch_id: string;
  organization_id: string;
  
  day_of_week: DayOfWeek;
  is_open: boolean;
  opening_time?: string;
  closing_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  
  // Special Hours
  is_special_hours: boolean;
  special_date?: string;
  special_reason?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Branch Staff Assignment
// ============================================
export interface BranchStaffAssignment {
  id: string;
  branch_id: string;
  employee_id: string;
  organization_id: string;
  
  // Assignment Details
  assignment_type: AssignmentType;
  role_at_branch: string;
  department?: string;
  
  // Period
  start_date: string;
  end_date?: string;
  is_primary_location: boolean;
  
  // Permissions
  access_level: AccessLevel;
  can_manage_inventory: boolean;
  can_approve_orders: boolean;
  can_access_financials: boolean;
  can_manage_staff: boolean;
  
  // Work Schedule
  weekly_hours?: number;
  shift_pattern?: string;
  
  // Status
  status: StaffAssignmentStatus;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================
// Branch Inventory
// ============================================
export interface BranchInventory {
  id: string;
  branch_id: string;
  material_id: string;
  organization_id: string;
  
  // Stock Levels
  quantity_in_stock: number;
  unit_of_measure: string;
  
  // Thresholds
  minimum_stock_level: number;
  maximum_stock_level?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  
  // Location within Branch
  storage_location?: string;
  shelf_number?: string;
  bin_location?: string;
  
  // Valuation
  unit_cost_aed?: number;
  total_value_aed?: number;
  last_purchase_price_aed?: number;
  average_cost_aed?: number;
  
  // Tracking
  last_stock_count_date?: string;
  last_stock_count_by?: string;
  last_replenishment_date?: string;
  last_movement_date?: string;
  
  // Status
  status: InventoryStatus;
  is_consignment: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Inter-Branch Transfer
// ============================================
export interface InterBranchTransfer {
  id: string;
  transfer_number: string;
  organization_id: string;
  
  // Transfer Route
  source_branch_id: string;
  destination_branch_id: string;
  
  // Transfer Details
  transfer_type: TransferType;
  transfer_reason?: string;
  priority: Priority;
  
  // Dates
  requested_date: string;
  scheduled_date?: string;
  dispatched_date?: string;
  received_date?: string;
  
  // Requesters & Approvers
  requested_by: string;
  approved_by?: string;
  dispatched_by?: string;
  received_by?: string;
  
  // Status
  status: TransferStatus;
  
  // Financial
  total_items_count: number;
  total_transfer_value_aed: number;
  transport_cost_aed?: number;
  
  // Logistics
  transport_method?: string;
  tracking_number?: string;
  carrier_name?: string;
  estimated_delivery_date?: string;
  
  // Notes
  transfer_notes?: string;
  cancellation_reason?: string;
  rejection_reason?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Transfer Item
// ============================================
export interface TransferItem {
  id: string;
  transfer_id: string;
  material_id: string;
  organization_id: string;
  
  // Quantities
  quantity_requested: number;
  quantity_approved?: number;
  quantity_dispatched?: number;
  quantity_received?: number;
  quantity_damaged: number;
  
  unit_of_measure: string;
  
  // Valuation
  unit_cost_aed?: number;
  total_value_aed?: number;
  
  // Quality Check
  quality_checked: boolean;
  quality_status?: QualityStatus;
  quality_notes?: string;
  
  // Notes
  item_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Branch Performance Metrics
// ============================================
export interface BranchPerformanceMetrics {
  id: string;
  branch_id: string;
  organization_id: string;
  
  // Period
  metric_date: string;
  metric_period: MetricPeriod;
  
  // Sales Metrics
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_revenue_aed: number;
  average_order_value_aed: number;
  
  // Customer Metrics
  new_customers: number;
  returning_customers: number;
  total_customers_served: number;
  customer_satisfaction_score?: number;
  
  // Production Metrics
  garments_produced: number;
  alterations_completed: number;
  average_production_time_days?: number;
  on_time_delivery_percentage?: number;
  
  // Staff Metrics
  total_staff_present: number;
  staff_utilization_percentage?: number;
  overtime_hours: number;
  
  // Inventory Metrics
  inventory_turnover_ratio?: number;
  stock_out_incidents: number;
  transfer_requests_sent: number;
  transfer_requests_received: number;
  
  // Financial Metrics
  cost_of_goods_sold_aed: number;
  operational_expenses_aed: number;
  gross_profit_aed: number;
  net_profit_aed: number;
  profit_margin_percentage?: number;
  
  // Quality Metrics
  quality_issues_reported: number;
  customer_complaints: number;
  rework_percentage?: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Cross-Location Order
// ============================================
export interface CrossLocationOrder {
  id: string;
  order_id: string;
  organization_id: string;
  
  // Locations
  receiving_branch_id: string;
  fulfilling_branch_id: string;
  
  // Routing Details
  routing_reason: RoutingReason;
  routing_date: string;
  routed_by: string;
  
  // Timeline
  estimated_completion_date?: string;
  actual_completion_date?: string;
  transfer_initiated_date?: string;
  transfer_completed_date?: string;
  
  // Status
  routing_status: RoutingStatus;
  
  // Coordination
  coordinator_branch_id?: string;
  coordination_notes?: string;
  
  // Financial
  inter_branch_charge_aed: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Branch Settings
// ============================================
export interface BranchSettings {
  id: string;
  branch_id: string;
  organization_id: string;
  
  // Operational Settings
  default_order_lead_time_days: number;
  rush_order_surcharge_percentage: number;
  minimum_order_value_aed: number;
  
  // Inventory Settings
  auto_reorder_enabled: boolean;
  low_stock_notification_threshold_percentage: number;
  allows_negative_inventory: boolean;
  
  // Customer Settings
  loyalty_points_multiplier: number;
  allows_credit_customers: boolean;
  max_credit_limit_aed: number;
  
  // Pricing Settings
  price_list_version?: string;
  applies_branch_specific_pricing: boolean;
  discount_authority_limit_percentage: number;
  
  // Communication Settings
  sms_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  
  // Integration Settings
  pos_system_integration?: string;
  accounting_system_integration?: string;
  erp_system_code?: string;
  
  // Language & Localization
  default_language: string;
  supports_arabic: boolean;
  currency_code: string;
  timezone: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Branch Asset
// ============================================
export interface BranchAsset {
  id: string;
  branch_id: string;
  organization_id: string;
  
  // Asset Details
  asset_code: string;
  asset_name: string;
  asset_type: AssetType;
  asset_category?: string;
  
  // Purchase Information
  purchase_date?: string;
  purchase_cost_aed?: number;
  supplier_name?: string;
  invoice_number?: string;
  warranty_expiry_date?: string;
  
  // Depreciation
  depreciation_method?: DepreciationMethod;
  useful_life_years?: number;
  salvage_value_aed?: number;
  current_book_value_aed?: number;
  
  // Maintenance
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_frequency_days?: number;
  maintenance_cost_ytd_aed: number;
  
  // Location & Status
  physical_location?: string;
  condition: AssetCondition;
  status: AssetStatus;
  
  // Assignment
  assigned_to_employee_id?: string;
  assignment_date?: string;
  
  // Insurance
  is_insured: boolean;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  
  // Notes
  asset_notes?: string;
  
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

// ============================================
// Extended Interfaces with Relations
// ============================================
export interface BranchWithDetails extends Branch {
  operating_hours?: BranchOperatingHours[];
  staff_assignments?: BranchStaffAssignment[];
  inventory_items?: BranchInventory[];
  settings?: BranchSettings;
  assets?: BranchAsset[];
  performance_metrics?: BranchPerformanceMetrics[];
}

export interface TransferWithItems extends InterBranchTransfer {
  items?: TransferItem[];
  source_branch?: Branch;
  destination_branch?: Branch;
}

// ============================================
// Create/Update DTOs
// ============================================
export interface CreateBranchDTO {
  branch_code: string;
  branch_name: string;
  branch_type: BranchType;
  address_line1: string;
  address_line2?: string;
  city: string;
  emirate?: Emirate;
  postal_code?: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  whatsapp?: string;
  opening_date: string;
  floor_area_sqm?: number;
  staff_capacity?: number;
  production_capacity_per_month?: number;
  branch_manager_id?: string;
  monthly_rent_aed?: number;
  trade_license_number?: string;
  trade_license_expiry?: string;
}

export interface UpdateBranchDTO extends Partial<CreateBranchDTO> {
  status?: BranchStatus;
  closing_date?: string;
}

export interface CreateTransferDTO {
  source_branch_id: string;
  destination_branch_id: string;
  transfer_type: TransferType;
  transfer_reason?: string;
  priority?: Priority;
  scheduled_date?: string;
  transport_method?: string;
  items: {
    material_id: string;
    quantity_requested: number;
    unit_of_measure: string;
  }[];
}

export interface CreateStaffAssignmentDTO {
  branch_id: string;
  employee_id: string;
  assignment_type: AssignmentType;
  role_at_branch: string;
  department?: string;
  start_date: string;
  end_date?: string;
  is_primary_location?: boolean;
  access_level?: AccessLevel;
  weekly_hours?: number;
}

// ============================================
// Filter & Query Types
// ============================================
export interface BranchFilters {
  status?: BranchStatus;
  branch_type?: BranchType;
  emirate?: Emirate;
  is_flagship?: boolean;
}

export interface TransferFilters {
  status?: TransferStatus;
  source_branch_id?: string;
  destination_branch_id?: string;
  priority?: Priority;
  date_from?: string;
  date_to?: string;
}

export interface InventoryFilters {
  branch_id?: string;
  status?: InventoryStatus;
  below_minimum?: boolean;
}

// ============================================
// Statistics & Summary Types
// ============================================
export interface BranchStatistics {
  branch_id: string;
  branch_name: string;
  total_staff: number;
  active_orders: number;
  monthly_revenue: number;
  inventory_value: number;
  customer_satisfaction: number;
  on_time_delivery_rate: number;
}

export interface TransferSummary {
  total_transfers: number;
  pending_approvals: number;
  in_transit: number;
  completed_this_month: number;
  total_value_aed: number;
}

export interface MultiLocationOverview {
  total_branches: number;
  active_branches: number;
  total_staff: number;
  total_inventory_value: number;
  monthly_revenue_all_branches: number;
  pending_transfers: number;
  branches: BranchStatistics[];
}
