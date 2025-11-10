// Financial Management and Invoicing Types for the Unified Tailoring Management Platform

// Financial Transaction Types
export interface FinancialTransaction {
  id: string;
  organization_id: string;
  transaction_type: 'revenue' | 'expense' | 'transfer' | 'adjustment';
  transaction_category?: string;
  amount_aed: number;
  description: string;
  transaction_date: string;
  reference_id?: string;
  reference_type?: string;
  account_type?: string;
  balance_before_aed?: number;
  balance_after_aed?: number;
  reconciled?: boolean;
  reconciliation_date?: string;
  fiscal_year?: number;
  fiscal_quarter?: number;
  fiscal_month?: number;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  customer_id: string;
  order_id?: string;
  issue_date: string;
  due_date: string;
  subtotal_aed: number;
  discount_amount_aed?: number;
  vat_rate: number;
  vat_amount_aed: number;
  total_amount_aed: number;
  paid_amount_aed?: number;
  balance_due_aed: number;
  status: InvoiceStatus;
  payment_terms?: string;
  notes?: string;
  internal_notes?: string;
  sent_date?: string;
  sent_to_email?: string;
  last_reminder_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  customers?: {
    full_name: string;
    customer_code: string;
    email?: string;
    phone?: string;
  };
  orders?: {
    order_number: string;
    status: string;
  };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  organization_id: string;
  item_description: string;
  item_type?: string;
  quantity: number;
  unit_price_aed: number;
  line_total_aed: number;
  tax_rate?: number;
  tax_amount_aed?: number;
  discount_percentage?: number;
  discount_amount_aed?: number;
  notes?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id?: string;
  customer_id?: string;
  payment_reference: string;
  payment_method: PaymentMethod;
  payment_date: string;
  amount_aed: number;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  bank_reference?: string;
  cheque_number?: string;
  card_last_four?: string;
  payment_gateway_ref?: string;
  status: PaymentStatus;
  created_by?: string;
  created_at?: string;
}

export interface InvoiceTemplate {
  id: string;
  organization_id: string;
  template_name: string;
  template_type: string;
  template_content: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceSettings {
  id: string;
  organization_id: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  tax_registration_number?: string;
  logo_url?: string;
  default_payment_terms?: string;
  default_notes?: string;
  invoice_prefix?: string;
  next_invoice_number?: number;
  default_vat_rate?: number;
  created_at?: string;
  updated_at?: string;
}

// Financial Reports
export interface FinancialReport {
  id: string;
  organization_id: string;
  report_type: string;
  report_name: string;
  report_period_start: string;
  report_period_end: string;
  report_data: Record<string, any>;
  generated_date: string;
  generated_by?: string;
  file_path?: string;
  file_format?: string;
  created_at?: string;
}

// Enums and Constants
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent', 
  VIEWED: 'viewed',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.DRAFT]: 'Draft',
  [INVOICE_STATUSES.SENT]: 'Sent',
  [INVOICE_STATUSES.VIEWED]: 'Viewed',
  [INVOICE_STATUSES.PARTIAL]: 'Partially Paid',
  [INVOICE_STATUSES.PAID]: 'Paid',
  [INVOICE_STATUSES.OVERDUE]: 'Overdue',
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.REFUNDED]: 'Refunded',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  ONLINE: 'online',
  CRYPTOCURRENCY: 'cryptocurrency',
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CARD]: 'Credit/Debit Card',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHODS.CHEQUE]: 'Cheque',
  [PAYMENT_METHODS.ONLINE]: 'Online Payment',
  [PAYMENT_METHODS.CRYPTOCURRENCY]: 'Cryptocurrency',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.PENDING]: 'Pending',
  [PAYMENT_STATUSES.COMPLETED]: 'Completed',
  [PAYMENT_STATUSES.FAILED]: 'Failed',
  [PAYMENT_STATUSES.CANCELLED]: 'Cancelled',
  [PAYMENT_STATUSES.REFUNDED]: 'Refunded',
} as const;

export const TRANSACTION_TYPES = {
  REVENUE: 'revenue',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
} as const;

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.REVENUE]: 'Revenue',
  [TRANSACTION_TYPES.EXPENSE]: 'Expense',
  [TRANSACTION_TYPES.TRANSFER]: 'Transfer',
  [TRANSACTION_TYPES.ADJUSTMENT]: 'Adjustment',
} as const;

// UAE-specific expense categories
export const UAE_EXPENSE_CATEGORIES = {
  OFFICE_RENT: 'office_rent',
  UTILITIES: 'utilities',
  MARKETING: 'marketing',
  TRAVEL: 'travel',
  PROFESSIONAL_SERVICES: 'professional_services',
  OFFICE_SUPPLIES: 'office_supplies',
  INSURANCE: 'insurance',
  TRAINING: 'training',
  SOFTWARE: 'software',
  EQUIPMENT: 'equipment',
  MAINTENANCE: 'maintenance',
  TELECOMMUNICATIONS: 'telecommunications',
  LEGAL_FEES: 'legal_fees',
  ACCOUNTING_FEES: 'accounting_fees',
  BANK_CHARGES: 'bank_charges',
  VISA_FEES: 'visa_fees',
  TRADE_LICENSE: 'trade_license',
  OTHER: 'other',
} as const;

export const UAE_EXPENSE_CATEGORY_LABELS = {
  [UAE_EXPENSE_CATEGORIES.OFFICE_RENT]: 'Office Rent',
  [UAE_EXPENSE_CATEGORIES.UTILITIES]: 'Utilities',
  [UAE_EXPENSE_CATEGORIES.MARKETING]: 'Marketing & Advertising',
  [UAE_EXPENSE_CATEGORIES.TRAVEL]: 'Travel & Transportation',
  [UAE_EXPENSE_CATEGORIES.PROFESSIONAL_SERVICES]: 'Professional Services',
  [UAE_EXPENSE_CATEGORIES.OFFICE_SUPPLIES]: 'Office Supplies',
  [UAE_EXPENSE_CATEGORIES.INSURANCE]: 'Insurance',
  [UAE_EXPENSE_CATEGORIES.TRAINING]: 'Training & Development',
  [UAE_EXPENSE_CATEGORIES.SOFTWARE]: 'Software & Licenses',
  [UAE_EXPENSE_CATEGORIES.EQUIPMENT]: 'Equipment & Tools',
  [UAE_EXPENSE_CATEGORIES.MAINTENANCE]: 'Maintenance & Repairs',
  [UAE_EXPENSE_CATEGORIES.TELECOMMUNICATIONS]: 'Telecommunications',
  [UAE_EXPENSE_CATEGORIES.LEGAL_FEES]: 'Legal Fees',
  [UAE_EXPENSE_CATEGORIES.ACCOUNTING_FEES]: 'Accounting & Audit Fees',
  [UAE_EXPENSE_CATEGORIES.BANK_CHARGES]: 'Bank Charges',
  [UAE_EXPENSE_CATEGORIES.VISA_FEES]: 'Visa & Immigration Fees',
  [UAE_EXPENSE_CATEGORIES.TRADE_LICENSE]: 'Trade License & Permits',
  [UAE_EXPENSE_CATEGORIES.OTHER]: 'Other',
} as const;

// Type exports
export type InvoiceStatus = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
export type UAEExpenseCategory = typeof UAE_EXPENSE_CATEGORIES[keyof typeof UAE_EXPENSE_CATEGORIES];

// UAE VAT Configuration
export const UAE_VAT_RATE = 0.05; // 5%

// Financial Analytics Types
export interface FinancialAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  operatingMargin: number;
  vatCollected: number;
  vatPaid: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  averagePaymentDays: number;
  cashFlowThisMonth: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

export interface InvoiceAnalytics {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  averageInvoiceValue: number;
  averagePaymentDays: number;
  collectionRate: number;
  monthlyInvoiceVolume: { month: string; amount: number; count: number }[];
  topCustomersByRevenue: { customer_name: string; total_amount: number; invoice_count: number }[];
}

// Form Types
export interface InvoiceFormData {
  customer_id: string;
  order_id?: string;
  issue_date: string;
  due_date: string;
  payment_terms?: string;
  notes?: string;
  internal_notes?: string;
  items: InvoiceItemFormData[];
}

export interface InvoiceItemFormData {
  item_description: string;
  quantity: number;
  unit_price_aed: number;
  discount_percentage?: number;
  notes?: string;
}

export interface PaymentFormData {
  invoice_id?: string;
  customer_id?: string;
  payment_method: PaymentMethod;
  payment_date: string;
  amount_aed: number;
  notes?: string;
  bank_reference?: string;
  cheque_number?: string;
  card_last_four?: string;
}

// Utility functions for calculations
export const calculateVAT = (amount: number, rate: number = UAE_VAT_RATE): number => {
  return amount * rate;
};

export const calculateTotal = (subtotal: number, vatAmount?: number, discountAmount?: number): number => {
  const vat = vatAmount || calculateVAT(subtotal);
  const discount = discountAmount || 0;
  return subtotal + vat - discount;
};

export const calculateLineTotal = (quantity: number, unitPrice: number, discountPercentage?: number): number => {
  const lineTotal = quantity * unitPrice;
  const discount = discountPercentage ? lineTotal * (discountPercentage / 100) : 0;
  return lineTotal - discount;
};

export const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case INVOICE_STATUSES.DRAFT: return 'bg-gray-100 text-gray-800 border-gray-200';
    case INVOICE_STATUSES.SENT: return 'bg-blue-100 text-blue-800 border-blue-200';
    case INVOICE_STATUSES.VIEWED: return 'bg-purple-100 text-purple-800 border-purple-200';
    case INVOICE_STATUSES.PARTIAL: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case INVOICE_STATUSES.PAID: return 'bg-green-100 text-green-800 border-green-200';
    case INVOICE_STATUSES.OVERDUE: return 'bg-red-100 text-red-800 border-red-200';
    case INVOICE_STATUSES.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
    case INVOICE_STATUSES.REFUNDED: return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case PAYMENT_STATUSES.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case PAYMENT_STATUSES.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
    case PAYMENT_STATUSES.FAILED: return 'bg-red-100 text-red-800 border-red-200';
    case PAYMENT_STATUSES.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
    case PAYMENT_STATUSES.REFUNDED: return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};