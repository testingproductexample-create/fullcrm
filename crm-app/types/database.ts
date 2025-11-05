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
