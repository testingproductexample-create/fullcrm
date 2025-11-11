// Legal & Contract Management System Hooks
// Created: 2025-11-11 12:02:50
// Description: React Query hooks for legal system data management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type {
  // Contract Management Types
  Contract, ContractInsert, ContractUpdate,
  ContractTemplate, ContractTemplateInsert, ContractTemplateUpdate,
  ContractParty, ContractPartyInsert, ContractPartyUpdate,
  ContractTerm, ContractTermInsert, ContractTermUpdate,
  ContractAmendment, ContractAmendmentInsert, ContractAmendmentUpdate,
  // Legal & Compliance Types
  LegalDocument, LegalDocumentInsert, LegalDocumentUpdate,
  ComplianceTracking, ComplianceTrackingInsert, ComplianceTrackingUpdate,
  ApprovalWorkflow, ApprovalWorkflowInsert, ApprovalWorkflowUpdate,
  LegalReference, LegalReferenceInsert, LegalReferenceUpdate,
  DisputeCase, DisputeCaseInsert, DisputeCaseUpdate,
  // Analytics Types
  ContractAnalytics, ContractAnalyticsInsert, ContractAnalyticsUpdate,
  AuditLog, AuditLogInsert,
  SignatureTracking, SignatureTrackingInsert, SignatureTrackingUpdate,
  RenewalCalendar, RenewalCalendarInsert, RenewalCalendarUpdate,
  // Dashboard Types
  LegalDashboardStats, ComplianceSummary, ContractPerformance, RiskAnalysis, SignatureWorkflowSummary,
  // Filter Types
  ContractFilters, LegalDocumentFilters, ComplianceFilters, LegalPagination
} from '@/types/legal';

// ==================== QUERY KEYS ====================
export const legalKeys = {
  all: ['legal'] as const,
  
  // Contract Management
  contracts: () => [...legalKeys.all, 'contracts'] as const,
  contract: (id: string) => [...legalKeys.contracts(), id] as const,
  templates: () => [...legalKeys.all, 'templates'] as const,
  template: (id: string) => [...legalKeys.templates(), id] as const,
  parties: () => [...legalKeys.all, 'parties'] as const,
  party: (id: string) => [...legalKeys.parties(), id] as const,
  terms: () => [...legalKeys.all, 'terms'] as const,
  term: (id: string) => [...legalKeys.terms(), id] as const,
  amendments: () => [...legalKeys.all, 'amendments'] as const,
  amendment: (id: string) => [...legalKeys.amendments(), id] as const,
  
  // Legal & Compliance
  documents: () => [...legalKeys.all, 'documents'] as const,
  document: (id: string) => [...legalKeys.documents(), id] as const,
  compliance: () => [...legalKeys.all, 'compliance'] as const,
  complianceItem: (id: string) => [...legalKeys.compliance(), id] as const,
  workflows: () => [...legalKeys.all, 'workflows'] as const,
  workflow: (id: string) => [...legalKeys.workflows(), id] as const,
  references: () => [...legalKeys.all, 'references'] as const,
  reference: (id: string) => [...legalKeys.references(), id] as const,
  disputes: () => [...legalKeys.all, 'disputes'] as const,
  dispute: (id: string) => [...legalKeys.disputes(), id] as const,
  
  // Analytics & Tracking
  analytics: () => [...legalKeys.all, 'analytics'] as const,
  auditLogs: () => [...legalKeys.all, 'audit-logs'] as const,
  signatures: () => [...legalKeys.all, 'signatures'] as const,
  signature: (id: string) => [...legalKeys.signatures(), id] as const,
  renewals: () => [...legalKeys.all, 'renewals'] as const,
  renewal: (id: string) => [...legalKeys.renewals(), id] as const,
  
  // Dashboard
  dashboard: () => [...legalKeys.all, 'dashboard'] as const,
  complianceSummary: () => [...legalKeys.all, 'compliance-summary'] as const,
  performance: () => [...legalKeys.all, 'performance'] as const,
  riskAnalysis: () => [...legalKeys.all, 'risk-analysis'] as const,
  signatureWorkflow: () => [...legalKeys.all, 'signature-workflow'] as const,
};

// ==================== CONTRACT MANAGEMENT HOOKS ====================

// Contracts
export function useContracts(filters?: ContractFilters, pagination?: LegalPagination) {
  return useQuery({
    queryKey: [...legalKeys.contracts(), filters, pagination],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          contract_parties!inner(full_name, party_type, company_name),
          contract_templates(template_name)
        `);

      // Apply filters
      if (filters?.contract_type) query = query.eq('contract_type', filters.contract_type);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.signature_status) query = query.eq('signature_status', filters.signature_status);
      if (filters?.start_date_from) query = query.gte('start_date', filters.start_date_from);
      if (filters?.start_date_to) query = query.lte('start_date', filters.start_date_to);
      if (filters?.end_date_from) query = query.gte('end_date', filters.end_date_from);
      if (filters?.end_date_to) query = query.lte('end_date', filters.end_date_to);
      if (filters?.contract_value_min) query = query.gte('contract_value', filters.contract_value_min);
      if (filters?.contract_value_max) query = query.lte('contract_value', filters.contract_value_max);
      if (filters?.primary_party_type) query = query.eq('primary_party_type', filters.primary_party_type);
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, sort_by = 'created_at', sort_order = 'desc' } = pagination;
        query = query
          .range((page - 1) * limit, page * limit - 1)
          .order(sort_by, { ascending: sort_order === 'asc' });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: legalKeys.contract(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_parties(
            id, party_type, full_name, company_name, email, phone,
            signature_required, signature_order, signed_at
          ),
          contract_terms(
            id, clause_type, clause_title, clause_content, is_mandatory,
            legal_risk_level, uae_law_reference
          ),
          contract_templates(template_name, template_code),
          contract_amendments(
            id, amendment_number, amendment_type, amendment_title,
            effective_date, amendment_status
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: ContractInsert) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single();
      if (error) throw error;
      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.contracts() });
      toast.success('Contract created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create contract: ' + error.message);
    },
  });
}

export function useUpdateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ContractUpdate) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Contract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legalKeys.contracts() });
      queryClient.invalidateQueries({ queryKey: legalKeys.contract(data.id) });
      toast.success('Contract updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update contract: ' + error.message);
    },
  });
}

export function useDeleteContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.contracts() });
      toast.success('Contract deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete contract: ' + error.message);
    },
  });
}

// Contract Templates
export function useContractTemplates(templateType?: string) {
  return useQuery({
    queryKey: [...legalKeys.templates(), templateType],
    queryFn: async () => {
      let query = supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (templateType) query = query.eq('template_type', templateType);

      const { data, error } = await query;
      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useContractTemplate(id: string) {
  return useQuery({
    queryKey: legalKeys.template(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ContractTemplate;
    },
    enabled: !!id,
  });
}

export function useContractTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: ContractTemplateInsert) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert(template)
        .select()
        .single();
      if (error) throw error;
      return data as ContractTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.templates() });
      toast.success('Contract template created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create contract template: ' + error.message);
    },
  });
}

// Contract Parties
export function useContractParties(contractId: string) {
  return useQuery({
    queryKey: [...legalKeys.parties(), contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_parties')
        .select('*')
        .eq('contract_id', contractId)
        .order('signature_order');
      if (error) throw error;
      return data as ContractParty[];
    },
    enabled: !!contractId,
  });
}

export function useContractPartyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (party: ContractPartyInsert) => {
      const { data, error } = await supabase
        .from('contract_parties')
        .insert(party)
        .select()
        .single();
      if (error) throw error;
      return data as ContractParty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.parties() });
      toast.success('Contract party added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add contract party: ' + error.message);
    },
  });
}

// Contract Terms
export function useContractTerms(contractId: string) {
  return useQuery({
    queryKey: [...legalKeys.terms(), contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_terms')
        .select('*')
        .eq('contract_id', contractId)
        .order('order_position');
      if (error) throw error;
      return data as ContractTerm[];
    },
    enabled: !!contractId,
  });
}

export function useContractTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (term: ContractTermInsert) => {
      const { data, error } = await supabase
        .from('contract_terms')
        .insert(term)
        .select()
        .single();
      if (error) throw error;
      return data as ContractTerm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.terms() });
      toast.success('Contract term added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add contract term: ' + error.message);
    },
  });
}

// Contract Amendments
export function useContractAmendments(contractId: string) {
  return useQuery({
    queryKey: [...legalKeys.amendments(), contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_amendments')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContractAmendment[];
    },
    enabled: !!contractId,
  });
}

export function useContractAmendmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amendment: ContractAmendmentInsert) => {
      const { data, error } = await supabase
        .from('contract_amendments')
        .insert(amendment)
        .select()
        .single();
      if (error) throw error;
      return data as ContractAmendment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.amendments() });
      toast.success('Contract amendment created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create contract amendment: ' + error.message);
    },
  });
}

// ==================== LEGAL & COMPLIANCE HOOKS ====================

// Legal Documents
export function useLegalDocuments(filters?: LegalDocumentFilters, pagination?: LegalPagination) {
  return useQuery({
    queryKey: [...legalKeys.documents(), filters, pagination],
    queryFn: async () => {
      let query = supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters?.document_type) query = query.eq('document_type', filters.document_type);
      if (filters?.confidentiality_level) query = query.eq('confidentiality_level', filters.confidentiality_level);
      if (filters?.related_entity_type) query = query.eq('related_entity_type', filters.related_entity_type);
      if (filters?.created_from) query = query.gte('created_at', filters.created_from);
      if (filters?.created_to) query = query.lte('created_at', filters.created_to);
      
      if (filters?.search) {
        query = query.or(`document_title.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, sort_by = 'created_at', sort_order = 'desc' } = pagination;
        query = query
          .range((page - 1) * limit, page * limit - 1)
          .order(sort_by, { ascending: sort_order === 'asc' });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LegalDocument[];
    },
  });
}

export function useLegalDocument(id: string) {
  return useQuery({
    queryKey: legalKeys.document(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as LegalDocument;
    },
    enabled: !!id,
  });
}

export function useLegalDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: LegalDocumentInsert) => {
      const { data, error } = await supabase
        .from('legal_documents')
        .insert(document)
        .select()
        .single();
      if (error) throw error;
      return data as LegalDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.documents() });
      toast.success('Legal document created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create legal document: ' + error.message);
    },
  });
}

// Compliance Tracking
export function useComplianceTracking(filters?: ComplianceFilters, pagination?: LegalPagination) {
  return useQuery({
    queryKey: [...legalKeys.compliance(), filters, pagination],
    queryFn: async () => {
      let query = supabase
        .from('compliance_tracking')
        .select('*');

      // Apply filters
      if (filters?.compliance_type) query = query.eq('compliance_type', filters.compliance_type);
      if (filters?.compliance_status) query = query.eq('compliance_status', filters.compliance_status);
      if (filters?.risk_level) query = query.eq('risk_level', filters.risk_level);
      if (filters?.deadline_from) query = query.gte('compliance_deadline', filters.deadline_from);
      if (filters?.deadline_to) query = query.lte('compliance_deadline', filters.deadline_to);
      if (filters?.authority) query = query.eq('authority_name', filters.authority);
      
      if (filters?.search) {
        query = query.or(`regulation_name.ilike.%${filters.search}%,requirement_description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, sort_by = 'compliance_deadline', sort_order = 'asc' } = pagination;
        query = query
          .range((page - 1) * limit, page * limit - 1)
          .order(sort_by, { ascending: sort_order === 'asc' });
      } else {
        query = query.order('compliance_deadline', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ComplianceTracking[];
    },
  });
}

export function useComplianceTrackingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (compliance: ComplianceTrackingInsert) => {
      const { data, error } = await supabase
        .from('compliance_tracking')
        .insert(compliance)
        .select()
        .single();
      if (error) throw error;
      return data as ComplianceTracking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.compliance() });
      toast.success('Compliance requirement added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add compliance requirement: ' + error.message);
    },
  });
}

// Approval Workflows
export function useApprovalWorkflows(entityType?: string, entityId?: string) {
  return useQuery({
    queryKey: [...legalKeys.workflows(), entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('approval_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (entityType) query = query.eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ApprovalWorkflow[];
    },
  });
}

export function useApprovalWorkflowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflow: ApprovalWorkflowInsert) => {
      const { data, error } = await supabase
        .from('approval_workflows')
        .insert(workflow)
        .select()
        .single();
      if (error) throw error;
      return data as ApprovalWorkflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.workflows() });
      toast.success('Approval workflow created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create approval workflow: ' + error.message);
    },
  });
}

// Legal References
export function useLegalReferences(referenceType?: string) {
  return useQuery({
    queryKey: [...legalKeys.references(), referenceType],
    queryFn: async () => {
      let query = supabase
        .from('legal_references')
        .select('*')
        .eq('is_active', true)
        .order('reference_title');

      if (referenceType) query = query.eq('reference_type', referenceType);

      const { data, error } = await query;
      if (error) throw error;
      return data as LegalReference[];
    },
  });
}

export function useLegalReference(id: string) {
  return useQuery({
    queryKey: legalKeys.reference(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_references')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as LegalReference;
    },
    enabled: !!id,
  });
}

export function useLegalReferenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: LegalReferenceInsert) => {
      const { data, error } = await supabase
        .from('legal_references')
        .insert(reference)
        .select()
        .single();
      if (error) throw error;
      return data as LegalReference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.references() });
      toast.success('Legal reference added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add legal reference: ' + error.message);
    },
  });
}

// Dispute Cases
export function useDisputeCases() {
  return useQuery({
    queryKey: legalKeys.disputes(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispute_cases')
        .select('*')
        .order('filing_date', { ascending: false });
      if (error) throw error;
      return data as DisputeCase[];
    },
  });
}

export function useDisputeCase(id: string) {
  return useQuery({
    queryKey: legalKeys.dispute(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispute_cases')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DisputeCase;
    },
    enabled: !!id,
  });
}

export function useDisputeCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disputeCase: DisputeCaseInsert) => {
      const { data, error } = await supabase
        .from('dispute_cases')
        .insert(disputeCase)
        .select()
        .single();
      if (error) throw error;
      return data as DisputeCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.disputes() });
      toast.success('Dispute case created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create dispute case: ' + error.message);
    },
  });
}

// ==================== SIGNATURE TRACKING HOOKS ====================

export function useSignatureTracking(documentType?: string, documentId?: string) {
  return useQuery({
    queryKey: [...legalKeys.signatures(), documentType, documentId],
    queryFn: async () => {
      let query = supabase
        .from('signature_tracking')
        .select('*')
        .order('signature_order');

      if (documentType) query = query.eq('document_type', documentType);
      if (documentId) query = query.eq('document_id', documentId);

      const { data, error } = await query;
      if (error) throw error;
      return data as SignatureTracking[];
    },
  });
}

export function useSignatureTrackingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signature: SignatureTrackingInsert) => {
      const { data, error } = await supabase
        .from('signature_tracking')
        .insert(signature)
        .select()
        .single();
      if (error) throw error;
      return data as SignatureTracking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.signatures() });
      toast.success('Signature request created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create signature request: ' + error.message);
    },
  });
}

// ==================== RENEWAL CALENDAR HOOKS ====================

export function useRenewalCalendar() {
  return useQuery({
    queryKey: legalKeys.renewals(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renewal_calendar')
        .select(`
          *,
          contracts!inner(
            title, contract_type, contract_value, 
            primary_party_id, primary_party_type
          )
        `)
        .order('current_end_date');
      if (error) throw error;
      return data as (RenewalCalendar & { 
        contracts: Pick<Contract, 'title' | 'contract_type' | 'contract_value' | 'primary_party_id' | 'primary_party_type'> 
      })[];
    },
  });
}

export function useRenewalCalendarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (renewal: RenewalCalendarInsert) => {
      const { data, error } = await supabase
        .from('renewal_calendar')
        .insert(renewal)
        .select()
        .single();
      if (error) throw error;
      return data as RenewalCalendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalKeys.renewals() });
      toast.success('Renewal calendar entry created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create renewal calendar entry: ' + error.message);
    },
  });
}

// ==================== DASHBOARD & ANALYTICS HOOKS ====================

export function useLegalDashboardStats() {
  return useQuery({
    queryKey: legalKeys.dashboard(),
    queryFn: async () => {
      try {
        // Get dashboard stats from multiple tables
        const [contractsResult, signaturesResult, complianceResult, renewalsResult] = await Promise.all([
          supabase.from('contracts').select('status, signature_status, contract_value'),
          supabase.from('signature_tracking').select('signature_status'),
          supabase.from('compliance_tracking').select('compliance_status'),
          supabase.from('renewal_calendar').select('renewal_status, current_end_date'),
        ]);

        const contracts = contractsResult.data || [];
        const signatures = signaturesResult.data || [];
        const compliance = complianceResult.data || [];
        const renewals = renewalsResult.data || [];

        const totalContracts = contracts.length;
        const activeContracts = contracts.filter(c => c.status === 'active').length;
        const pendingSignatures = signatures.filter(s => s.signature_status === 'pending').length;
        
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expiringContracts = contracts.filter(c => {
          if (!c.end_date) return false;
          const endDate = new Date(c.end_date);
          return endDate <= thirtyDaysFromNow && endDate >= now;
        }).length;

        const complianceScore = compliance.length > 0 ? 
          (compliance.filter(c => c.compliance_status === 'compliant').length / compliance.length) * 100 : 100;

        const pendingApprovals = contracts.filter(c => c.signature_status === 'pending').length;

        const renewalRate = renewals.length > 0 ? 
          (renewals.filter(r => r.renewal_status === 'renewed').length / renewals.length) * 100 : 0;

        const avgContractValue = contracts.length > 0 ? 
          contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0) / contracts.length : 0;

        return {
          total_contracts: totalContracts,
          active_contracts: activeContracts,
          pending_signatures: pendingSignatures,
          expiring_contracts: expiringContracts,
          compliance_score: Math.round(complianceScore),
          pending_approvals: pendingApprovals,
          renewal_rate: Math.round(renewalRate),
          average_contract_value: avgContractValue,
        } as LegalDashboardStats;
      } catch (error) {
        throw error;
      }
    },
  });
}

export function useComplianceSummary() {
  return useQuery({
    queryKey: legalKeys.complianceSummary(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_compliance_dashboard')
        .select('*');
      
      if (error) throw error;
      return data as ComplianceSummary[];
    },
  });
}

export function useContractPerformance(period: 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: [...legalKeys.performance(), period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_contract_performance')
        .select('*')
        .limit(12);
      
      if (error) throw error;
      return data as ContractPerformance[];
    },
  });
}

export function useRiskAnalysis() {
  return useQuery({
    queryKey: legalKeys.riskAnalysis(),
    queryFn: async () => {
      // This would need a more complex query to analyze contract risks
      // For now, returning mock data structure
      const mockRiskAnalysis: RiskAnalysis[] = [
        {
          risk_category: 'High Value Contracts',
          high_risk_contracts: 3,
          medium_risk_contracts: 8,
          low_risk_contracts: 25,
          total_exposure_value: 2500000,
          mitigation_actions: ['Regular review', 'Enhanced monitoring'],
        },
        {
          risk_category: 'Expiring Soon',
          high_risk_contracts: 2,
          medium_risk_contracts: 5,
          low_risk_contracts: 10,
          total_exposure_value: 850000,
          mitigation_actions: ['Renewal preparation', 'Client communication'],
        },
      ];
      return mockRiskAnalysis;
    },
  });
}

export function useSignatureWorkflowSummary() {
  return useQuery({
    queryKey: legalKeys.signatureWorkflow(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signature_tracking')
        .select('document_type, signature_status, created_at, completed_at');
      
      if (error) throw error;

      // Group by document type and calculate metrics
      const summary = data.reduce((acc, sig) => {
        const docType = sig.document_type;
        if (!acc[docType]) {
          acc[docType] = {
            document_type: docType,
            pending_signatures: 0,
            completed_signatures: 0,
            overdue_signatures: 0,
            average_completion_time_hours: 0,
          };
        }

        if (sig.signature_status === 'signed') {
          acc[docType].completed_signatures++;
        } else if (sig.signature_status === 'pending') {
          acc[docType].pending_signatures++;
          // Check if overdue (more than 7 days)
          const createdAt = new Date(sig.created_at);
          const now = new Date();
          const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff > 7) {
            acc[docType].overdue_signatures++;
          }
        }

        return acc;
      }, {} as Record<string, SignatureWorkflowSummary>);

      return Object.values(summary);
    },
  });
}

// ==================== AUDIT LOG MUTATION ====================

export function useAuditLogMutation() {
  return useMutation({
    mutationFn: async (auditLog: AuditLogInsert) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(auditLog)
        .select()
        .single();
      if (error) throw error;
      return data as AuditLog;
    },
    // No toast notifications for audit logs as they're background operations
  });
}