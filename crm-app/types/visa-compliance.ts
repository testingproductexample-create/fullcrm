// TypeScript types for Visa & Compliance Management System

export interface ComplianceViolation {
  id: string;
  organization_id: string;
  employee_id: string | null;
  violation_type: 'visa_expiry' | 'work_authorization' | 'labor_law' | 'contract_compliance' | 'working_hours' | 'leave_policy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'mitigated';
  description: string;
  detected_date: string;
  due_date: string | null;
  resolution_date: string | null;
  mitigation_plan: string | null;
  resolution_notes: string | null;
  financial_impact_aed: number | null;
  assigned_to_user_id: string | null;
  related_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovernmentPortalTracking {
  id: string;
  organization_id: string;
  employee_id: string | null;
  portal_name: 'MOHRE' | 'GDRFA' | 'ICA' | 'FTA' | 'DED' | 'Central Bank';
  application_type: 'work_permit' | 'visa_renewal' | 'emirates_id' | 'labor_complaint' | 'license_renewal' | string;
  application_number: string | null;
  submission_date: string;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  fees_paid_aed: number | null;
  reference_number: string | null;
  tracking_url: string | null;
  submitted_by_user_id: string | null;
  documents_submitted: any;
  response_documents: any;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryUpdate {
  id: string;
  organization_id: string;
  update_type: 'labor_law' | 'visa_regulation' | 'tax_law' | 'insurance_requirement' | 'work_hours' | string;
  authority: 'MOHRE' | 'GDRFA' | 'ICA' | 'FTA' | 'Central Bank' | string;
  title: string;
  description: string;
  effective_date: string;
  announcement_date: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical' | null;
  affected_areas: string[] | null;
  action_required: boolean;
  action_deadline: string | null;
  compliance_status: 'pending' | 'in_progress' | 'compliant' | 'non_compliant';
  implementation_notes: string | null;
  source_url: string | null;
  document_url: string | null;
  assigned_to_user_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisaRenewalAlert {
  id: string;
  organization_id: string;
  visa_tracking_id: string;
  employee_id: string;
  alert_type: 'visa_expiry' | 'emirates_id_expiry' | 'labor_card_expiry' | 'insurance_expiry';
  alert_date: string;
  days_until_expiry: number;
  expiry_date: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'action_taken' | 'dismissed';
  notification_channels: string[];
  sent_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by_user_id: string | null;
  action_notes: string | null;
  created_at: string;
}

export interface GovernmentCorrespondence {
  id: string;
  organization_id: string;
  employee_id: string | null;
  correspondence_type: 'inquiry' | 'complaint' | 'application' | 'response' | 'notice' | 'fine';
  authority: 'MOHRE' | 'GDRFA' | 'ICA' | 'FTA' | 'DED' | string;
  subject: string;
  reference_number: string | null;
  received_date: string | null;
  sent_date: string | null;
  direction: 'incoming' | 'outgoing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'sent' | 'received' | 'responded' | 'closed';
  due_date: string | null;
  response_deadline: string | null;
  content: string | null;
  document_urls: string[] | null;
  assigned_to_user_id: string | null;
  responded_by_user_id: string | null;
  response_content: string | null;
  response_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisaComplianceAuditLog {
  id: string;
  organization_id: string;
  employee_id: string | null;
  audit_type: 'visa_check' | 'document_review' | 'compliance_check' | 'system_access';
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  performed_by_user_id: string | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  result: 'success' | 'failure' | 'warning' | null;
  notes: string | null;
  created_at: string;
}

export interface WPSCompliance {
  id: string;
  organization_id: string;
  month: string;
  submission_deadline: string;
  submission_date: string | null;
  status: 'pending' | 'processing' | 'submitted' | 'approved' | 'rejected';
  total_employees: number;
  total_salary_aed: number;
  sif_file_url: string | null;
  confirmation_number: string | null;
  bank_reference: string | null;
  submitted_by_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisaTracking {
  id: string;
  organization_id: string;
  employee_id: string;
  visa_type: string;
  visa_number: string | null;
  passport_number: string;
  visa_status: string | null;
  issue_date: string;
  expiry_date: string;
  entry_date: string | null;
  sponsor_name: string | null;
  sponsor_license_number: string | null;
  visa_purpose: string | null;
  profession_on_visa: string | null;
  salary_on_visa_aed: number | null;
  entry_points: string[] | null;
  exit_reentry_permit: boolean | null;
  emirates_id_number: string | null;
  emirates_id_expiry_date: string | null;
  labor_card_number: string | null;
  labor_card_expiry_date: string | null;
  medical_insurance_number: string | null;
  medical_insurance_expiry_date: string | null;
  renewal_fee_aed: number | null;
  government_fees_aed: number | null;
  typing_center_fees_aed: number | null;
  total_renewal_cost_aed: number | null;
  renewal_reminder_days: number | null;
  last_renewal_date: string | null;
  next_renewal_due_date: string | null;
  renewal_status: string | null;
  authorized_signatory_id: string | null;
  visa_file_url: string | null;
  emirates_id_copy_url: string | null;
  passport_copy_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
