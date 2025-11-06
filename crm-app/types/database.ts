// Database Types

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  role: 'owner' | 'manager' | 'tailor' | 'assistant';
  phone: string | null;
  avatar_url: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  business_type: string;
  country: string;
  currency: string;
  primary_language: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  notes: string | null;
  customer_type: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  subtotal_aed: number;
  vat_rate: number;
  vat_amount_aed: number;
  total_amount_aed: number;
  paid_amount_aed: number;
  balance_due_aed: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_aed: number;
  subtotal_aed: number;
  vat_amount_aed: number;
  total_aed: number;
  sort_order: number;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount_aed: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}
