export interface Organization {
  id: string;
  name: string;
  business_type?: string;
  country: string;
  currency: string;
  primary_language: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name?: string;
  role: 'owner' | 'manager' | 'tailor' | 'assistant';
  phone?: string;
  avatar_url?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  customer_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  phone_secondary?: string;
  emirates_id?: string;
  visa_status?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string;
  anniversary_date?: string;
  profile_photo_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  emirate?: string;
  postal_code?: string;
  classification: 'VIP' | 'Regular' | 'New';
  status: 'Active' | 'Inactive' | 'Blocked';
  customer_since: string;
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  preferred_communication?: string[];
  communication_opt_in: boolean;
  notes?: string;
  tags?: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerMeasurement {
  id: string;
  organization_id: string;
  customer_id: string;
  measurement_date: string;
  garment_type: string;
  body_type?: string;
  size_standard?: string;
  measurements: Record<string, any>;
  fitting_notes?: string;
  measured_by?: string;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerCommunication {
  id: string;
  organization_id: string;
  customer_id: string;
  communication_type: 'SMS' | 'Email' | 'WhatsApp' | 'Phone' | 'In-Person';
  direction: 'Inbound' | 'Outbound';
  subject?: string;
  message?: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Read';
  sent_by?: string;
  related_order_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CustomerNote {
  id: string;
  organization_id: string;
  customer_id: string;
  note_type: 'General' | 'Complaint' | 'Feedback' | 'Important';
  note: string;
  is_pinned: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerEvent {
  id: string;
  organization_id: string;
  customer_id: string;
  event_type: 'Birthday' | 'Anniversary' | 'Special Occasion';
  event_date: string;
  recurrence: 'Yearly' | 'None';
  reminder_days_before: number[];
  last_reminded?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyProgram {
  id: string;
  organization_id: string;
  program_name: string;
  description?: string;
  points_per_aed: number;
  tier_thresholds: Record<string, number>;
  tier_benefits: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  organization_id: string;
  customer_id: string;
  transaction_type: 'Earned' | 'Redeemed' | 'Expired' | 'Adjusted';
  points: number;
  description?: string;
  related_order_id?: string;
  created_by?: string;
  created_at: string;
}


export interface Order {
  id: string;
  organization_id: string;
  customer_id: string;
  order_number: string;
  order_type: 'bespoke' | 'casual' | 'alteration' | 'repair' | 'special_occasion';
  status: 'new' | 'confirmed' | 'in_progress' | 'quality_check' | 'ready' | 'delivered' | 'cancelled';
  sub_status?: string;
  priority_level: 'rush' | 'normal' | 'low';
  garment_details: Record<string, any>;
  design_notes?: string;
  special_instructions?: string;
  estimated_completion?: string;
  delivery_date?: string;
  total_amount: number;
  advance_payment: number;
  vat_amount: number;
  final_amount: number;
  assigned_to?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface OrderItem {
  id: string;
  organization_id: string;
  order_id: string;
  item_type: string;
  item_name?: string;
  specifications: Record<string, any>;
  fabric_details?: string;
  color?: string;
  style_options: Record<string, any>;
  measurements_reference?: string;
  special_requirements?: string;
  estimated_time_hours?: number;
  item_amount: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  organization_id: string;
  order_id: string;
  status: string;
  sub_status?: string;
  previous_status?: string;
  changed_by?: string;
  changed_at: string;
  notes?: string;
  percentage_completion?: number;
}

export interface OrderApproval {
  id: string;
  organization_id: string;
  order_id: string;
  approval_type: 'design' | 'measurement' | 'final' | 'price';
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  customer_id: string;
  approved_by?: string;
  approval_date?: string;
  feedback?: string;
  revision_requests?: string;
  created_at: string;
}

export interface OrderTemplate {
  id: string;
  organization_id: string;
  template_name: string;
  template_type?: string;
  description?: string;
  default_specifications: Record<string, any>;
  template_settings: Record<string, any>;
  usage_count: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}


export interface OrderWorkflow {
  id: string;
  organization_id: string;
  workflow_name: string;
  workflow_type: string;
  description?: string;
  status_definitions: Record<string, any>;
  automation_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderWorkflowStatus {
  id: string;
  organization_id: string;
  order_id: string;
  workflow_id?: string;
  current_status: string;
  sub_status?: string;
  status_order: number;
  entered_at: string;
  completed_at?: string;
  assigned_employee_id?: string;
  status_notes?: string;
  progress_percentage: number;
  automatic_transition: boolean;
  approval_required: boolean;
  created_at: string;
}

export interface WorkflowTransition {
  id: string;
  organization_id: string;
  workflow_id: string;
  from_status?: string;
  to_status: string;
  transition_type: string;
  transition_rules: Record<string, any>;
  trigger_conditions: Record<string, any>;
  approval_requirements: Record<string, any>;
  notification_settings: Record<string, any>;
  created_at: string;
}

export interface WorkflowAnalytics {
  id: string;
  organization_id: string;
  workflow_id?: string;
  status: string;
  average_completion_time?: number;
  bottleneck_score?: number;
  efficiency_rating?: number;
  last_calculated: string;
  performance_metrics: Record<string, any>;
  created_at: string;
}

export interface AutomationRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_type: string;
  trigger_conditions: Record<string, any>;
  action_type: string;
  rule_configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowMilestone {
  id: string;
  organization_id: string;
  order_id: string;
  milestone_name: string;
  milestone_type?: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  order_index: number;
  created_at: string;
}
