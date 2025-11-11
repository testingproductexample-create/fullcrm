// Customer Types for the Unified Tailoring Management Platform

export interface Customer {
  id: string;
  organization_id?: string;
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
  classification?: string;
  status?: string;
  customer_since?: string;
  last_order_date?: string;
  total_orders?: number;
  total_spent?: number;
  loyalty_points?: number;
  loyalty_tier?: string;
  preferred_communication?: string[];
  communication_opt_in?: boolean;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerMeasurement {
  id: string;
  organization_id?: string;
  customer_id?: string;
  measurement_date?: string;
  garment_type: string;
  body_type?: string;
  size_standard?: string;
  measurements: Record<string, any>;
  fitting_notes?: string;
  measured_by?: string;
  is_latest?: boolean;
  template_id?: string;
  fit_preference?: string;
  posture_notes?: string;
  special_requirements?: string;
  version_number?: number;
  previous_version_id?: string;
  change_reason?: string;
  linked_order_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerNote {
  id: string;
  organization_id?: string;
  customer_id?: string;
  note_type?: string;
  note: string;
  is_pinned?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerCommunication {
  id: string;
  organization_id?: string;
  customer_id?: string;
  channel_type: string;
  message_type: string;
  subject?: string;
  content: string;
  status?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  external_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

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

export interface CustomerFormData {
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
  address_line1?: string;
  address_line2?: string;
  city?: string;
  emirate?: string;
  postal_code?: string;
  classification?: string;
  preferred_communication?: string[];
  communication_opt_in?: boolean;
  notes?: string;
  tags?: string[];
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;
  topCustomersByRevenue: Customer[];
  customersByCity: { city: string; count: number }[];
  customersByNationality: { nationality: string; count: number }[];
  loyaltyTierDistribution: { tier: string; count: number }[];
  monthlyCustomerGrowth: { month: string; count: number }[];
  averageOrderValue: number;
  customerRetentionRate: number;
}

// Enums and constants
export const CUSTOMER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PROSPECT: 'prospect',
  BLACKLISTED: 'blacklisted',
} as const;

export const CUSTOMER_CLASSIFICATIONS = {
  REGULAR: 'regular',
  VIP: 'vip',
  CORPORATE: 'corporate',
  WHOLESALE: 'wholesale',
} as const;

export const LOYALTY_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export const UAE_EMIRATES = {
  DUBAI: 'Dubai',
  ABU_DHABI: 'Abu Dhabi',
  SHARJAH: 'Sharjah',
  AJMAN: 'Ajman',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah',
  UMM_AL_QUWAIN: 'Umm Al Quwain',
} as const;

export const COMMUNICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  PHONE: 'phone',
  IN_PERSON: 'in_person',
} as const;

export type CustomerStatus = typeof CUSTOMER_STATUSES[keyof typeof CUSTOMER_STATUSES];
export type CustomerClassification = typeof CUSTOMER_CLASSIFICATIONS[keyof typeof CUSTOMER_CLASSIFICATIONS];
export type LoyaltyTier = typeof LOYALTY_TIERS[keyof typeof LOYALTY_TIERS];
export type Emirate = typeof UAE_EMIRATES[keyof typeof UAE_EMIRATES];
export type CommunicationChannel = typeof COMMUNICATION_CHANNELS[keyof typeof COMMUNICATION_CHANNELS];