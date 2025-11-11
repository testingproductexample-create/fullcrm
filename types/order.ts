// Order and Workflow Types for the Unified Tailoring Management Platform

export interface Order {
  id: string;
  organization_id?: string;
  customer_id?: string;
  order_number: string;
  order_type: string;
  status?: string;
  sub_status?: string;
  priority_level?: string;
  garment_details?: Record<string, any>;
  design_notes?: string;
  special_instructions?: string;
  estimated_completion?: string;
  delivery_date?: string;
  total_amount?: number;
  advance_payment?: number;
  vat_amount?: number;
  final_amount?: number;
  assigned_to?: string;
  progress_percentage?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface OrderItem {
  id: string;
  organization_id?: string;
  order_id?: string;
  item_type: string;
  item_name?: string;
  specifications?: Record<string, any>;
  fabric_details?: string;
  color?: string;
  style_options?: Record<string, any>;
  measurements_reference?: string;
  special_requirements?: string;
  estimated_time_hours?: number;
  item_amount?: number;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  organization_id?: string;
  order_id?: string;
  status: string;
  sub_status?: string;
  previous_status?: string;
  changed_by?: string;
  changed_at?: string;
  notes?: string;
  percentage_completion?: number;
}

export interface OrderWorkflow {
  id: string;
  organization_id: string;
  workflow_name: string;
  workflow_type?: string;
  description?: string;
  status_definitions?: Record<string, any>;
  automation_rules?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowMilestone {
  id: string;
  organization_id: string;
  order_id: string;
  milestone_name: string;
  milestone_type?: string;
  status?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  order_index?: number;
  created_at?: string;
}

export interface OrderFormData {
  customer_id: string;
  order_type: string;
  priority_level: string;
  garment_details: Record<string, any>;
  design_notes?: string;
  special_instructions?: string;
  estimated_completion?: string;
  delivery_date?: string;
  total_amount: number;
  advance_payment: number;
  items: OrderItemFormData[];
}

export interface OrderItemFormData {
  item_type: string;
  item_name: string;
  specifications: Record<string, any>;
  fabric_details?: string;
  color?: string;
  style_options?: Record<string, any>;
  measurements_reference?: string;
  special_requirements?: string;
  estimated_time_hours?: number;
  item_amount: number;
  quantity: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageCompletionTime: number;
  ordersByStatus: { status: string; count: number }[];
  ordersByType: { type: string; count: number }[];
  monthlyOrderTrends: { month: string; count: number; revenue: number }[];
  topCustomersByOrders: { customer_name: string; order_count: number; total_revenue: number }[];
}

export interface WorkflowAnalytics {
  totalActiveWorkflows: number;
  averageCompletionTime: number;
  bottleneckStages: { stage: string; average_time: number; order_count: number }[];
  completionRates: { stage: string; completion_rate: number }[];
  workflowEfficiency: { workflow_type: string; efficiency_score: number }[];
  dailyProgress: { date: string; completed: number; started: number }[];
}

// Workflow Stage Definitions
export const WORKFLOW_STAGES = {
  CONSULTATION: 'consultation',
  MEASUREMENTS: 'measurements',
  DESIGN_APPROVAL: 'design_approval',
  FABRIC_SELECTION: 'fabric_selection',
  CUTTING: 'cutting',
  SEWING: 'sewing',
  FITTING: 'fitting',
  ALTERATIONS: 'alterations',
  QUALITY_CONTROL: 'quality_control',
  DELIVERY: 'delivery',
} as const;

export const WORKFLOW_STAGE_LABELS = {
  [WORKFLOW_STAGES.CONSULTATION]: 'Consultation',
  [WORKFLOW_STAGES.MEASUREMENTS]: 'Measurements',
  [WORKFLOW_STAGES.DESIGN_APPROVAL]: 'Design Approval',
  [WORKFLOW_STAGES.FABRIC_SELECTION]: 'Fabric Selection',
  [WORKFLOW_STAGES.CUTTING]: 'Cutting',
  [WORKFLOW_STAGES.SEWING]: 'Sewing',
  [WORKFLOW_STAGES.FITTING]: 'Fitting',
  [WORKFLOW_STAGES.ALTERATIONS]: 'Alterations',
  [WORKFLOW_STAGES.QUALITY_CONTROL]: 'Quality Control',
  [WORKFLOW_STAGES.DELIVERY]: 'Delivery',
} as const;

// Order Status Definitions
export const ORDER_STATUSES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  FITTING: 'fitting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.DRAFT]: 'Draft',
  [ORDER_STATUSES.CONFIRMED]: 'Confirmed',
  [ORDER_STATUSES.IN_PROGRESS]: 'In Progress',
  [ORDER_STATUSES.FITTING]: 'Fitting',
  [ORDER_STATUSES.COMPLETED]: 'Completed',
  [ORDER_STATUSES.CANCELLED]: 'Cancelled',
  [ORDER_STATUSES.ON_HOLD]: 'On Hold',
} as const;

// Order Types
export const ORDER_TYPES = {
  SUIT: 'suit',
  SHIRT: 'shirt',
  DRESS: 'dress',
  ALTERATION: 'alteration',
  REPAIR: 'repair',
  CUSTOM: 'custom',
  CONSULTATION: 'consultation',
} as const;

export const ORDER_TYPE_LABELS = {
  [ORDER_TYPES.SUIT]: 'Suit',
  [ORDER_TYPES.SHIRT]: 'Shirt',
  [ORDER_TYPES.DRESS]: 'Dress',
  [ORDER_TYPES.ALTERATION]: 'Alteration',
  [ORDER_TYPES.REPAIR]: 'Repair',
  [ORDER_TYPES.CUSTOM]: 'Custom',
  [ORDER_TYPES.CONSULTATION]: 'Consultation',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const PRIORITY_LEVEL_LABELS = {
  [PRIORITY_LEVELS.LOW]: 'Low',
  [PRIORITY_LEVELS.NORMAL]: 'Normal',
  [PRIORITY_LEVELS.HIGH]: 'High',
  [PRIORITY_LEVELS.URGENT]: 'Urgent',
} as const;

// Milestone Status
export const MILESTONE_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  BLOCKED: 'blocked',
} as const;

export const MILESTONE_STATUS_LABELS = {
  [MILESTONE_STATUSES.PENDING]: 'Pending',
  [MILESTONE_STATUSES.IN_PROGRESS]: 'In Progress',
  [MILESTONE_STATUSES.COMPLETED]: 'Completed',
  [MILESTONE_STATUSES.SKIPPED]: 'Skipped',
  [MILESTONE_STATUSES.BLOCKED]: 'Blocked',
} as const;

// Type exports
export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];
export type OrderType = typeof ORDER_TYPES[keyof typeof ORDER_TYPES];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];
export type WorkflowStage = typeof WORKFLOW_STAGES[keyof typeof WORKFLOW_STAGES];
export type MilestoneStatus = typeof MILESTONE_STATUSES[keyof typeof MILESTONE_STATUSES];

// UAE VAT Configuration
export const UAE_VAT_RATE = 0.05; // 5%

// Utility functions for calculations
export const calculateVAT = (amount: number): number => {
  return amount * UAE_VAT_RATE;
};

export const calculateFinalAmount = (amount: number, vatAmount?: number): number => {
  return amount + (vatAmount || calculateVAT(amount));
};

export const getOrderStatusColor = (status: string) => {
  switch (status) {
    case ORDER_STATUSES.DRAFT: return 'bg-gray-100 text-gray-800 border-gray-200';
    case ORDER_STATUSES.CONFIRMED: return 'bg-blue-100 text-blue-800 border-blue-200';
    case ORDER_STATUSES.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case ORDER_STATUSES.FITTING: return 'bg-purple-100 text-purple-800 border-purple-200';
    case ORDER_STATUSES.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
    case ORDER_STATUSES.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
    case ORDER_STATUSES.ON_HOLD: return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case PRIORITY_LEVELS.LOW: return 'bg-gray-100 text-gray-800 border-gray-200';
    case PRIORITY_LEVELS.NORMAL: return 'bg-blue-100 text-blue-800 border-blue-200';
    case PRIORITY_LEVELS.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
    case PRIORITY_LEVELS.URGENT: return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getMilestoneStatusColor = (status: string) => {
  switch (status) {
    case MILESTONE_STATUSES.PENDING: return 'bg-gray-100 text-gray-800 border-gray-200';
    case MILESTONE_STATUSES.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
    case MILESTONE_STATUSES.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
    case MILESTONE_STATUSES.SKIPPED: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case MILESTONE_STATUSES.BLOCKED: return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};