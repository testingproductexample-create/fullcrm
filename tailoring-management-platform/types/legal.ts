// Legal & Contract Management System Types
// Created: 2025-11-11 12:02:50
// Description: Comprehensive TypeScript interfaces for legal and contract management system

// ==================== ENUM TYPES ====================

export type ContractType = 'client_service' | 'employee' | 'supplier' | 'vendor' | 'lease' | 'insurance';
export type ContractCategory = 'tailoring_service' | 'employment' | 'supply_agreement' | 'maintenance' | 'alteration_service' | 'design_service';
export type ContractStatus = 'draft' | 'review' | 'approval' | 'active' | 'expired' | 'terminated' | 'renewed';
export type SignatureStatus = 'pending' | 'partial' | 'signed' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PartyType = 'primary' | 'secondary' | 'witness' | 'guarantor';
export type EntityType = 'individual' | 'company' | 'organization';
export type ClauseType = 'payment' | 'delivery' | 'warranty' | 'liability' | 'termination' | 'confidentiality' | 'dispute_resolution';
export type AmendmentType = 'extension' | 'value_change' | 'scope_change' | 'termination' | 'renewal';
export type DocumentType = 'contract' | 'agreement' | 'policy' | 'procedure' | 'law' | 'regulation';
export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type ComplianceType = 'contract_law' | 'labor_law' | 'commercial_law' | 'tax_law' | 'data_protection';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'under_review';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type WorkflowStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
export type ReferenceType = 'federal_law' | 'local_law' | 'regulation' | 'circular' | 'guideline';
export type CaseStatus = 'open' | 'pending' | 'resolved' | 'closed' | 'appealed';
export type DisputeCategory = 'contract_dispute' | 'employment_dispute' | 'commercial_dispute' | 'regulatory_issue';
export type ResolutionType = 'settlement' | 'judgment' | 'dismissal' | 'withdrawal';
export type SignatureMethod = 'digital' | 'electronic' | 'wet_signature' | 'biometric';
export type LegalValidationStatus = 'valid' | 'invalid' | 'pending_validation';
export type RenewalStatus = 'pending' | 'initiated' | 'negotiating' | 'renewed' | 'terminated';
export type Currency = 'AED' | 'USD' | 'EUR' | 'GBP';
export type Language = 'en' | 'ar' | 'both';

// ==================== CONTRACT MANAGEMENT TABLES ====================

// Contracts Table
export interface Contract {
  id: string;
  organization_id: string;
  contract_number: string;
  contract_type: ContractType;
  contract_category?: ContractCategory;
  title: string;
  title_arabic?: string;
  description?: string;
  description_arabic?: string;
  
  // Parties
  primary_party_id?: string;
  primary_party_type?: string;
  secondary_party_id?: string;
  secondary_party_type?: string;
  
  // Contract Details
  contract_value?: number;
  currency: Currency;
  start_date: string;
  end_date?: string;
  duration_months?: number;
  auto_renewal: boolean;
  renewal_notice_days: number;
  
  // Status and Workflow
  status: ContractStatus;
  signature_status: SignatureStatus;
  approval_status: ApprovalStatus;
  
  // Legal Compliance
  governing_law: string;
  jurisdiction: string;
  language: Language;
  
  // Template Information
  template_id?: string;
  custom_terms?: any;
  special_clauses?: string;
  
  // Alerts and Reminders
  renewal_alert_sent: boolean;
  expiry_alert_sent: boolean;
  next_review_date?: string;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  version: number;
}

export interface ContractInsert extends Omit<Contract, 'id' | 'created_at' | 'updated_at'> {}
export interface ContractUpdate extends Partial<ContractInsert> {}

// Contract Templates
export interface ContractTemplate {
  id: string;
  organization_id: string;
  template_name: string;
  template_name_arabic?: string;
  template_code: string;
  template_type: ContractType;
  template_category?: string;
  
  // Template Content
  template_content: string;
  template_content_arabic?: string;
  template_variables?: any;
  default_terms?: any;
  required_fields?: any;
  
  // UAE Legal Compliance
  uae_compliance_checked: boolean;
  legal_review_date?: string;
  legal_reviewer_id?: string;
  compliance_notes?: string;
  
  // Template Status
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  last_used_date?: string;
  
  // Version Control
  version: string;
  parent_template_id?: string;
  changelog?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface ContractTemplateInsert extends Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'> {}
export interface ContractTemplateUpdate extends Partial<ContractTemplateInsert> {}

// Contract Parties
export interface ContractParty {
  id: string;
  contract_id: string;
  organization_id: string;
  
  // Party Information
  party_type: PartyType;
  entity_type: EntityType;
  entity_id?: string;
  
  // Contact Details
  full_name: string;
  full_name_arabic?: string;
  title_position?: string;
  company_name?: string;
  company_name_arabic?: string;
  
  // Address Information
  address?: string;
  address_arabic?: string;
  city?: string;
  emirate?: string;
  postal_code?: string;
  country: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Legal Information
  trade_license?: string;
  passport_number?: string;
  emirates_id?: string;
  authorized_signatory: boolean;
  signatory_designation?: string;
  
  // Signature Information
  signature_required: boolean;
  signature_order: number;
  signed_at?: string;
  signature_ip_address?: string;
  signature_method?: SignatureMethod;
  
  created_at?: string;
  updated_at?: string;
}

export interface ContractPartyInsert extends Omit<ContractParty, 'id' | 'created_at' | 'updated_at'> {}
export interface ContractPartyUpdate extends Partial<ContractPartyInsert> {}

// Contract Terms
export interface ContractTerm {
  id: string;
  contract_id: string;
  organization_id: string;
  
  // Term Information
  clause_type: ClauseType;
  clause_title: string;
  clause_title_arabic?: string;
  clause_content: string;
  clause_content_arabic?: string;
  
  // Term Details
  is_mandatory: boolean;
  is_negotiable: boolean;
  order_position?: number;
  
  // Legal Compliance
  uae_law_reference?: string;
  compliance_requirement?: string;
  legal_risk_level: RiskLevel;
  
  // Modification Tracking
  original_clause?: string;
  modification_reason?: string;
  modified_by?: string;
  modified_at?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface ContractTermInsert extends Omit<ContractTerm, 'id' | 'created_at' | 'updated_at'> {}
export interface ContractTermUpdate extends Partial<ContractTermInsert> {}

// Contract Amendments
export interface ContractAmendment {
  id: string;
  contract_id: string;
  organization_id: string;
  
  // Amendment Information
  amendment_number: string;
  amendment_type: AmendmentType;
  amendment_title: string;
  amendment_description?: string;
  
  // Amendment Details
  effective_date: string;
  old_values?: any;
  new_values?: any;
  impact_assessment?: string;
  
  // Approval and Signatures
  amendment_status: ContractStatus;
  approval_required: boolean;
  signatures_required: boolean;
  
  // Legal Compliance
  legal_review_required: boolean;
  legal_reviewer_id?: string;
  legal_review_date?: string;
  compliance_impact?: string;
  
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContractAmendmentInsert extends Omit<ContractAmendment, 'id' | 'created_at' | 'updated_at'> {}
export interface ContractAmendmentUpdate extends Partial<ContractAmendmentInsert> {}

// ==================== LEGAL & COMPLIANCE TABLES ====================

// Legal Documents
export interface LegalDocument {
  id: string;
  organization_id: string;
  
  // Document Information
  document_title: string;
  document_title_arabic?: string;
  document_type: DocumentType;
  document_category?: string;
  document_number?: string;
  
  // Content and Storage
  document_content?: string;
  file_url?: string;
  file_name?: string;
  file_size_kb?: number;
  file_type?: string;
  
  // Related Entities
  related_contract_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  
  // Legal Classification
  confidentiality_level: ConfidentialityLevel;
  retention_period_years: number;
  legal_hold: boolean;
  destruction_date?: string;
  
  // Access Control
  access_permissions?: any;
  last_accessed_at?: string;
  access_count: number;
  
  // Version Control
  version: string;
  parent_document_id?: string;
  is_active: boolean;
  
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface LegalDocumentInsert extends Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'> {}
export interface LegalDocumentUpdate extends Partial<LegalDocumentInsert> {}

// Compliance Tracking
export interface ComplianceTracking {
  id: string;
  organization_id: string;
  
  // Compliance Information
  compliance_type: ComplianceType;
  regulation_name: string;
  regulation_name_arabic?: string;
  authority_name: string;
  
  // Requirement Details
  requirement_description: string;
  requirement_description_arabic?: string;
  compliance_deadline?: string;
  renewal_frequency?: string;
  next_review_date?: string;
  
  // Status and Tracking
  compliance_status: ComplianceStatus;
  risk_level: RiskLevel;
  impact_assessment?: string;
  
  // Related Entities
  related_contracts?: any;
  affected_departments?: any;
  responsible_person_id?: string;
  
  // Documentation
  compliance_evidence?: string;
  supporting_documents?: any;
  audit_notes?: string;
  corrective_actions?: string;
  
  // Alerts and Notifications
  alert_sent: boolean;
  last_alert_date?: string;
  notification_recipients?: any;
  
  created_at?: string;
  updated_at?: string;
}

export interface ComplianceTrackingInsert extends Omit<ComplianceTracking, 'id' | 'created_at' | 'updated_at'> {}
export interface ComplianceTrackingUpdate extends Partial<ComplianceTrackingInsert> {}

// Approval Workflows
export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  
  // Workflow Information
  workflow_name: string;
  workflow_type: string;
  workflow_description?: string;
  
  // Workflow Configuration
  approval_steps: any;
  is_sequential: boolean;
  auto_approve_conditions?: any;
  escalation_rules?: any;
  
  // Related Entity
  entity_type: string;
  entity_id: string;
  
  // Workflow Status
  workflow_status: WorkflowStatus;
  current_step: number;
  total_steps: number;
  
  // Approval Tracking
  approvals?: any;
  rejections?: any;
  started_at?: string;
  completed_at?: string;
  
  // SLA and Performance
  target_completion_hours: number;
  actual_completion_hours?: number;
  escalated: boolean;
  escalation_date?: string;
  
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalWorkflowInsert extends Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'> {}
export interface ApprovalWorkflowUpdate extends Partial<ApprovalWorkflowInsert> {}

// Legal References
export interface LegalReference {
  id: string;
  organization_id: string;
  
  // Legal Reference Information
  reference_title: string;
  reference_title_arabic?: string;
  reference_type: ReferenceType;
  authority: string;
  
  // Legal Details
  law_number?: string;
  article_number?: string;
  section_reference?: string;
  effective_date?: string;
  last_updated_date?: string;
  
  // Content
  legal_text: string;
  legal_text_arabic?: string;
  summary?: string;
  summary_arabic?: string;
  
  // Application and Scope
  applicable_business_areas?: any;
  contract_types_affected?: any;
  compliance_requirements?: string;
  penalties_fines?: string;
  
  // References and Links
  official_source_url?: string;
  related_references?: any;
  superseded_by?: string;
  
  // Status
  is_active: boolean;
  review_frequency: string;
  next_review_date?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface LegalReferenceInsert extends Omit<LegalReference, 'id' | 'created_at' | 'updated_at'> {}
export interface LegalReferenceUpdate extends Partial<LegalReferenceInsert> {}

// Dispute Cases
export interface DisputeCase {
  id: string;
  organization_id: string;
  
  // Case Information
  case_number: string;
  case_title: string;
  case_type: DisputeCategory;
  dispute_category?: string;
  
  // Related Entities
  related_contract_id?: string;
  opposing_party_name?: string;
  opposing_party_type?: string;
  
  // Case Details
  dispute_description: string;
  dispute_value?: number;
  filing_date?: string;
  response_deadline?: string;
  court_jurisdiction?: string;
  case_status: CaseStatus;
  
  // Legal Representation
  internal_counsel_id?: string;
  external_counsel_firm?: string;
  external_counsel_contact?: string;
  legal_costs_budget?: number;
  legal_costs_actual?: number;
  
  // Case Progress
  case_milestones?: any;
  court_hearings?: any;
  evidence_documents?: any;
  settlement_discussions: boolean;
  
  // Resolution
  resolution_type?: ResolutionType;
  resolution_date?: string;
  resolution_amount?: number;
  resolution_terms?: string;
  
  // Risk Assessment
  win_probability?: number;
  risk_assessment?: string;
  business_impact?: string;
  
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisputeCaseInsert extends Omit<DisputeCase, 'id' | 'created_at' | 'updated_at'> {}
export interface DisputeCaseUpdate extends Partial<DisputeCaseInsert> {}

// ==================== ANALYTICS & TRACKING TABLES ====================

// Contract Analytics
export interface ContractAnalytics {
  id: string;
  organization_id: string;
  
  // Analytics Period
  analysis_date: string;
  period_type: string;
  period_start: string;
  period_end: string;
  
  // Contract Metrics
  total_contracts: number;
  new_contracts: number;
  renewed_contracts: number;
  expired_contracts: number;
  terminated_contracts: number;
  
  // Value Metrics
  total_contract_value: number;
  average_contract_value: number;
  new_contract_value: number;
  renewal_contract_value: number;
  
  // Performance Metrics
  average_approval_time_hours: number;
  average_signature_time_hours: number;
  contract_completion_rate: number;
  renewal_rate: number;
  
  // Risk and Compliance Metrics
  compliance_score: number;
  high_risk_contracts: number;
  overdue_renewals: number;
  pending_approvals: number;
  
  // Department/Type Breakdown
  contracts_by_type?: any;
  contracts_by_department?: any;
  value_by_type?: any;
  
  created_at?: string;
  updated_at?: string;
}

export interface ContractAnalyticsInsert extends Omit<ContractAnalytics, 'id' | 'created_at' | 'updated_at'> {}
export interface ContractAnalyticsUpdate extends Partial<ContractAnalyticsInsert> {}

// Audit Logs
export interface AuditLog {
  id: string;
  organization_id: string;
  
  // Audit Information
  entity_type: string;
  entity_id: string;
  action: string;
  
  // User Information
  user_id?: string;
  user_name?: string;
  user_role?: string;
  user_ip_address?: string;
  user_agent?: string;
  
  // Change Details
  old_values?: any;
  new_values?: any;
  changed_fields?: any;
  action_description?: string;
  
  // Context
  session_id?: string;
  request_id?: string;
  additional_context?: any;
  
  // Security
  is_suspicious_activity: boolean;
  security_flags?: any;
  
  timestamp?: string;
}

export interface AuditLogInsert extends Omit<AuditLog, 'id' | 'timestamp'> {}

// Signature Tracking
export interface SignatureTracking {
  id: string;
  organization_id: string;
  
  // Document Information
  document_type: string;
  document_id: string;
  document_title?: string;
  
  // Signature Request
  signature_request_id?: string;
  requester_id: string;
  request_date?: string;
  completion_deadline?: string;
  
  // Signer Information
  signer_id?: string;
  signer_name: string;
  signer_email: string;
  signer_role?: string;
  signature_order: number;
  
  // Signature Details
  signature_status: SignatureStatus;
  signature_method?: SignatureMethod;
  signature_timestamp?: string;
  signature_ip_address?: string;
  signature_location?: string;
  
  // Legal Validation
  legal_validation_status: LegalValidationStatus;
  certificate_authority?: string;
  signature_hash?: string;
  
  // Communication
  email_sent_at?: string;
  reminder_count: number;
  last_reminder_date?: string;
  viewed_at?: string;
  
  // Completion
  completed_at?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface SignatureTrackingInsert extends Omit<SignatureTracking, 'id' | 'created_at' | 'updated_at'> {}
export interface SignatureTrackingUpdate extends Partial<SignatureTrackingInsert> {}

// Renewal Calendar
export interface RenewalCalendar {
  id: string;
  organization_id: string;
  
  // Contract Information
  contract_id: string;
  contract_number?: string;
  contract_title?: string;
  contract_type?: string;
  
  // Renewal Details
  current_end_date: string;
  renewal_date?: string;
  new_end_date?: string;
  renewal_status: RenewalStatus;
  
  // Notification Management
  first_notice_date?: string;
  second_notice_date?: string;
  final_notice_date?: string;
  first_notice_sent: boolean;
  second_notice_sent: boolean;
  final_notice_sent: boolean;
  
  // Renewal Terms
  auto_renewal_eligible: boolean;
  renewal_value?: number;
  value_change_percentage?: number;
  renewal_duration_months?: number;
  
  // Stakeholders
  contract_manager_id?: string;
  client_contact_id?: string;
  renewal_approver_id?: string;
  
  // Risk Assessment
  renewal_probability?: number;
  risk_factors?: string;
  business_justification?: string;
  
  // Tracking
  renewal_initiated_date?: string;
  renewal_completed_date?: string;
  renewal_notes?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface RenewalCalendarInsert extends Omit<RenewalCalendar, 'id' | 'created_at' | 'updated_at'> {}
export interface RenewalCalendarUpdate extends Partial<RenewalCalendarInsert> {}

// ==================== DASHBOARD & ANALYTICS TYPES ====================

export interface LegalDashboardStats {
  total_contracts: number;
  active_contracts: number;
  pending_signatures: number;
  expiring_contracts: number;
  compliance_score: number;
  pending_approvals: number;
  renewal_rate: number;
  average_contract_value: number;
}

export interface ComplianceSummary {
  compliance_type: string;
  total_requirements: number;
  compliant_count: number;
  non_compliant_count: number;
  upcoming_deadlines: number;
  compliance_percentage: number;
}

export interface ContractPerformance {
  month: string;
  contract_type: string;
  contracts_created: number;
  total_value: number;
  average_value: number;
  active_contracts: number;
  signed_contracts: number;
}

export interface RiskAnalysis {
  risk_category: string;
  high_risk_contracts: number;
  medium_risk_contracts: number;
  low_risk_contracts: number;
  total_exposure_value: number;
  mitigation_actions: string[];
}

export interface SignatureWorkflowSummary {
  document_type: string;
  pending_signatures: number;
  completed_signatures: number;
  overdue_signatures: number;
  average_completion_time_hours: number;
}

// ==================== FILTERS AND SEARCH TYPES ====================

export interface ContractFilters {
  contract_type?: ContractType;
  status?: ContractStatus;
  signature_status?: SignatureStatus;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  contract_value_min?: number;
  contract_value_max?: number;
  primary_party_type?: string;
  search?: string;
}

export interface LegalDocumentFilters {
  document_type?: DocumentType;
  confidentiality_level?: ConfidentialityLevel;
  related_entity_type?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface ComplianceFilters {
  compliance_type?: ComplianceType;
  compliance_status?: ComplianceStatus;
  risk_level?: RiskLevel;
  deadline_from?: string;
  deadline_to?: string;
  authority?: string;
  search?: string;
}

export interface LegalPagination {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==================== CONTRACT TEMPLATE VARIABLES ====================

export interface TemplateVariable {
  name: string;
  label: string;
  label_arabic?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  default_value?: any;
  options?: string[]; // For select type
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
  };
}