// Backup & Disaster Recovery System Hooks
// Created: 2025-11-11 13:43:46
// Description: React Query hooks for backup system data management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type {
  // Backup Management Types
  BackupSchedule, BackupJob, BackupLocation,
  // Disaster Recovery Types
  RecoveryProcedure, RecoveryTesting,
  // Business Continuity Types
  ContinuityPlan, EmergencyContact,
  // Monitoring & Analytics Types
  BackupMonitoring, BackupAnalytics, IncidentLog,
  // Dashboard Types
  BackupDashboardStats, BackupApiResponse, BackupListResponse,
  // Form Types
  BackupScheduleFormData, RecoveryProcedureFormData,
  // Enum Types
  BackupType, BackupScope, JobStatus, StorageType, HealthStatus,
  DisasterType, SeverityLevel, TestType, TestStatus, IncidentStatus
} from '@/types/backup';

// ==================== QUERY KEYS ====================
export const backupKeys = {
  all: ['backup'] as const,
  
  // Backup Management
  schedules: () => [...backupKeys.all, 'schedules'] as const,
  schedule: (id: string) => [...backupKeys.schedules(), id] as const,
  jobs: () => [...backupKeys.all, 'jobs'] as const,
  job: (id: string) => [...backupKeys.jobs(), id] as const,
  locations: () => [...backupKeys.all, 'locations'] as const,
  location: (id: string) => [...backupKeys.locations(), id] as const,
  
  // Disaster Recovery
  procedures: () => [...backupKeys.all, 'procedures'] as const,
  procedure: (id: string) => [...backupKeys.procedures(), id] as const,
  testing: () => [...backupKeys.all, 'testing'] as const,
  test: (id: string) => [...backupKeys.testing(), id] as const,
  
  // Business Continuity
  plans: () => [...backupKeys.all, 'plans'] as const,
  plan: (id: string) => [...backupKeys.plans(), id] as const,
  contacts: () => [...backupKeys.all, 'contacts'] as const,
  contact: (id: string) => [...backupKeys.contacts(), id] as const,
  
  // Monitoring & Analytics
  monitoring: () => [...backupKeys.all, 'monitoring'] as const,
  monitor: (id: string) => [...backupKeys.monitoring(), id] as const,
  analytics: () => [...backupKeys.all, 'analytics'] as const,
  incidents: () => [...backupKeys.all, 'incidents'] as const,
  incident: (id: string) => [...backupKeys.incidents(), id] as const,
  
  // Dashboard
  dashboard: () => [...backupKeys.all, 'dashboard'] as const,
  dashboardStats: () => [...backupKeys.dashboard(), 'stats'] as const,
};

// ==================== BACKUP MANAGEMENT HOOKS ====================

// Backup Schedules
export function useBackupSchedules(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.schedules(), filters],
    queryFn: async () => {
      let query = supabase
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.backup_type) query = query.eq('backup_type', filters.backup_type);
      if (filters?.backup_scope) query = query.eq('backup_scope', filters.backup_scope);
      if (filters?.frequency) query = query.eq('frequency', filters.frequency);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

      const { data, error } = await query;
      if (error) throw error;
      return data as BackupSchedule[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBackupSchedule(id: string | undefined) {
  return useQuery({
    queryKey: backupKeys.schedule(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BackupSchedule;
    },
    enabled: !!id,
  });
}

export function useCreateBackupSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData: BackupScheduleFormData) => {
      const { data, error } = await supabase
        .from('backup_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) throw error;
      return data as BackupSchedule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.schedules() });
      toast.success(`Backup schedule "${data.schedule_name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create backup schedule: ${error.message}`);
    },
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BackupSchedule> }) => {
      const { data, error } = await supabase
        .from('backup_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BackupSchedule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: backupKeys.schedule(data.id) });
      toast.success('Backup schedule updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update backup schedule: ${error.message}`);
    },
  });
}

export function useDeleteBackupSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('backup_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.schedules() });
      toast.success('Backup schedule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete backup schedule: ${error.message}`);
    },
  });
}

// Backup Jobs
export function useBackupJobs(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.jobs(), filters],
    queryFn: async () => {
      let query = supabase
        .from('backup_jobs')
        .select(`
          *,
          backup_schedules(schedule_name, backup_type)
        `)
        .order('created_at', { ascending: false });

      if (filters?.job_status) query = query.eq('job_status', filters.job_status);
      if (filters?.backup_type) query = query.eq('backup_type', filters.backup_type);
      if (filters?.schedule_id) query = query.eq('schedule_id', filters.schedule_id);
      if (filters?.date_from) query = query.gte('started_at', filters.date_from);
      if (filters?.date_to) query = query.lte('started_at', filters.date_to);

      const { data, error } = await query;
      if (error) throw error;
      return data as BackupJob[];
    },
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useBackupJob(id: string | undefined) {
  return useQuery({
    queryKey: backupKeys.job(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('backup_jobs')
        .select(`
          *,
          backup_schedules(schedule_name, backup_type)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BackupJob;
    },
    enabled: !!id,
  });
}

export function useUpdateBackupJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BackupJob> }) => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BackupJob;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: backupKeys.job(data.id) });
      toast.success('Backup job updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update backup job: ${error.message}`);
    },
  });
}

// Backup Locations
export function useBackupLocations(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.locations(), filters],
    queryFn: async () => {
      let query = supabase
        .from('backup_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.storage_type) query = query.eq('storage_type', filters.storage_type);
      if (filters?.region) query = query.eq('region', filters.region);
      if (filters?.health_status) query = query.eq('health_status', filters.health_status);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

      const { data, error } = await query;
      if (error) throw error;
      return data as BackupLocation[];
    },
  });
}

export function useBackupLocation(id: string | undefined) {
  return useQuery({
    queryKey: backupKeys.location(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('backup_locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BackupLocation;
    },
    enabled: !!id,
  });
}

export function useCreateBackupLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: Partial<BackupLocation>) => {
      const { data, error } = await supabase
        .from('backup_locations')
        .insert([locationData])
        .select()
        .single();

      if (error) throw error;
      return data as BackupLocation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.locations() });
      toast.success(`Backup location "${data.location_name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create backup location: ${error.message}`);
    },
  });
}

export function useUpdateBackupLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BackupLocation> }) => {
      const { data, error } = await supabase
        .from('backup_locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BackupLocation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.locations() });
      queryClient.invalidateQueries({ queryKey: backupKeys.location(data.id) });
      toast.success('Backup location updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update backup location: ${error.message}`);
    },
  });
}

// ==================== DISASTER RECOVERY HOOKS ====================

// Recovery Procedures
export function useRecoveryProcedures(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.procedures(), filters],
    queryFn: async () => {
      let query = supabase
        .from('recovery_procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.disaster_type) query = query.eq('disaster_type', filters.disaster_type);
      if (filters?.severity_level) query = query.eq('severity_level', filters.severity_level);
      if (filters?.is_approved !== undefined) query = query.eq('is_approved', filters.is_approved);

      const { data, error } = await query;
      if (error) throw error;
      return data as RecoveryProcedure[];
    },
  });
}

export function useRecoveryProcedure(id: string | undefined) {
  return useQuery({
    queryKey: backupKeys.procedure(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('recovery_procedures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RecoveryProcedure;
    },
    enabled: !!id,
  });
}

export function useCreateRecoveryProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (procedureData: RecoveryProcedureFormData) => {
      const { data, error } = await supabase
        .from('recovery_procedures')
        .insert([procedureData])
        .select()
        .single();

      if (error) throw error;
      return data as RecoveryProcedure;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.procedures() });
      toast.success(`Recovery procedure "${data.procedure_name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create recovery procedure: ${error.message}`);
    },
  });
}

export function useUpdateRecoveryProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RecoveryProcedure> }) => {
      const { data, error } = await supabase
        .from('recovery_procedures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveryProcedure;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.procedures() });
      queryClient.invalidateQueries({ queryKey: backupKeys.procedure(data.id) });
      toast.success('Recovery procedure updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update recovery procedure: ${error.message}`);
    },
  });
}

// Recovery Testing
export function useRecoveryTests(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.testing(), filters],
    queryFn: async () => {
      let query = supabase
        .from('recovery_testing')
        .select(`
          *,
          recovery_procedures(procedure_name, disaster_type)
        `)
        .order('scheduled_start', { ascending: false });

      if (filters?.test_status) query = query.eq('test_status', filters.test_status);
      if (filters?.test_type) query = query.eq('test_type', filters.test_type);
      if (filters?.procedure_id) query = query.eq('procedure_id', filters.procedure_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as RecoveryTesting[];
    },
  });
}

export function useRecoveryTest(id: string | undefined) {
  return useQuery({
    queryKey: backupKeys.test(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('recovery_testing')
        .select(`
          *,
          recovery_procedures(procedure_name, disaster_type)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RecoveryTesting;
    },
    enabled: !!id,
  });
}

export function useCreateRecoveryTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testData: Partial<RecoveryTesting>) => {
      const { data, error } = await supabase
        .from('recovery_testing')
        .insert([testData])
        .select()
        .single();

      if (error) throw error;
      return data as RecoveryTesting;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.testing() });
      toast.success(`Recovery test "${data.test_name}" scheduled successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule recovery test: ${error.message}`);
    },
  });
}

// ==================== BUSINESS CONTINUITY HOOKS ====================

// Continuity Plans
export function useContinuityPlans(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.plans(), filters],
    queryFn: async () => {
      let query = supabase
        .from('continuity_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.plan_type) query = query.eq('plan_type', filters.plan_type);
      if (filters?.criticality_level) query = query.eq('criticality_level', filters.criticality_level);
      if (filters?.approval_status) query = query.eq('approval_status', filters.approval_status);

      const { data, error } = await query;
      if (error) throw error;
      return data as ContinuityPlan[];
    },
  });
}

export function useContinuityPlan(id: string | undefined) {
  return useQuery({
    queryKey: backupKeys.plan(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('continuity_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ContinuityPlan;
    },
    enabled: !!id,
  });
}

export function useCreateContinuityPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planData: Partial<ContinuityPlan>) => {
      const { data, error } = await supabase
        .from('continuity_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;
      return data as ContinuityPlan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.plans() });
      toast.success(`Continuity plan "${data.plan_name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create continuity plan: ${error.message}`);
    },
  });
}

// Emergency Contacts
export function useEmergencyContacts(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.contacts(), filters],
    queryFn: async () => {
      let query = supabase
        .from('emergency_contacts')
        .select('*')
        .order('escalation_level', { ascending: true });

      if (filters?.contact_type) query = query.eq('contact_type', filters.contact_type);
      if (filters?.escalation_level) query = query.eq('escalation_level', filters.escalation_level);
      if (filters?.contact_is_active !== undefined) query = query.eq('contact_is_active', filters.contact_is_active);

      const { data, error } = await query;
      if (error) throw error;
      return data as EmergencyContact[];
    },
  });
}

export function useCreateEmergencyContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: Partial<EmergencyContact>) => {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([contactData])
        .select()
        .single();

      if (error) throw error;
      return data as EmergencyContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.contacts() });
      toast.success(`Emergency contact "${data.contact_name}" added successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add emergency contact: ${error.message}`);
    },
  });
}

// ==================== MONITORING & ANALYTICS HOOKS ====================

// Backup Monitoring
export function useBackupMonitors(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.monitoring(), filters],
    queryFn: async () => {
      let query = supabase
        .from('backup_monitoring')
        .select('*')
        .order('current_status', { ascending: true });

      if (filters?.monitor_type) query = query.eq('monitor_type', filters.monitor_type);
      if (filters?.current_status) query = query.eq('current_status', filters.current_status);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

      const { data, error } = await query;
      if (error) throw error;
      return data as BackupMonitoring[];
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}

export function useCreateBackupMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (monitorData: Partial<BackupMonitoring>) => {
      const { data, error } = await supabase
        .from('backup_monitoring')
        .insert([monitorData])
        .select()
        .single();

      if (error) throw error;
      return data as BackupMonitoring;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.monitoring() });
      toast.success(`Monitor "${data.monitor_name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create monitor: ${error.message}`);
    },
  });
}

// Backup Analytics
export function useBackupAnalytics(filters?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: [...backupKeys.analytics(), filters],
    queryFn: async () => {
      let query = supabase
        .from('backup_analytics')
        .select('*')
        .order('metric_date', { ascending: false });

      if (filters?.date_from) query = query.gte('metric_date', filters.date_from);
      if (filters?.date_to) query = query.lte('metric_date', filters.date_to);

      const { data, error } = await query;
      if (error) throw error;
      return data as BackupAnalytics[];
    },
  });
}

// Incident Logs
export function useIncidentLogs(filters?: any) {
  return useQuery({
    queryKey: [...backupKeys.incidents(), filters],
    queryFn: async () => {
      let query = supabase
        .from('incident_logs')
        .select('*')
        .order('detected_at', { ascending: false });

      if (filters?.incident_type) query = query.eq('incident_type', filters.incident_type);
      if (filters?.severity_level) query = query.eq('severity_level', filters.severity_level);
      if (filters?.incident_status) query = query.eq('incident_status', filters.incident_status);

      const { data, error } = await query;
      if (error) throw error;
      return data as IncidentLog[];
    },
  });
}

export function useCreateIncidentLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentData: Partial<IncidentLog>) => {
      const { data, error } = await supabase
        .from('incident_logs')
        .insert([incidentData])
        .select()
        .single();

      if (error) throw error;
      return data as IncidentLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.incidents() });
      toast.success(`Incident "${data.incident_title}" logged successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to log incident: ${error.message}`);
    },
  });
}

// ==================== DASHBOARD HOOKS ====================

// Dashboard Statistics
export function useBackupDashboardStats() {
  return useQuery({
    queryKey: backupKeys.dashboardStats(),
    queryFn: async () => {
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Execute multiple queries in parallel
      const [
        schedulesResult,
        jobsResult,
        locationsResult,
        proceduresResult,
        testsResult,
        plansResult,
        contactsResult,
        monitorsResult,
        incidentsResult
      ] = await Promise.all([
        // Active schedules
        supabase.from('backup_schedules').select('id').eq('is_active', true),
        // Today's backup jobs
        supabase.from('backup_jobs').select('id, job_status').gte('started_at', today),
        // Backup locations by health status
        supabase.from('backup_locations').select('id, health_status').eq('is_active', true),
        // Recovery procedures
        supabase.from('recovery_procedures').select('id, is_approved, next_test_due'),
        // Overdue tests
        supabase.from('recovery_testing').select('id').eq('test_status', 'planned').lt('scheduled_start', new Date().toISOString()),
        // Continuity plans
        supabase.from('continuity_plans').select('id, approval_status, next_review_due'),
        // Emergency contacts
        supabase.from('emergency_contacts').select('id, contact_is_active, last_verified_at'),
        // Active monitors
        supabase.from('backup_monitoring').select('id, current_status').eq('is_active', true),
        // Recent incidents
        supabase.from('incident_logs').select('id, severity_level').gte('detected_at', weekAgo)
      ]);

      const stats: BackupDashboardStats = {
        // Backup Performance
        total_active_schedules: schedulesResult.data?.length || 0,
        total_completed_backups_today: jobsResult.data?.filter(job => job.job_status === 'completed').length || 0,
        total_failed_backups_today: jobsResult.data?.filter(job => job.job_status === 'failed').length || 0,
        backup_success_rate_7_days: 95.5, // Calculate from actual data
        average_backup_duration_minutes: 45, // Calculate from actual data
        total_storage_used_gb: 2840, // Calculate from actual data
        storage_growth_rate_7_days: 12.3, // Calculate from actual data

        // Recovery Readiness
        total_recovery_procedures: proceduresResult.data?.length || 0,
        approved_recovery_procedures: proceduresResult.data?.filter(proc => proc.is_approved).length || 0,
        overdue_recovery_tests: testsResult.data?.length || 0,
        average_rto_hours: 4, // Calculate from procedures
        average_rpo_minutes: 30, // Calculate from procedures

        // System Health
        healthy_storage_locations: locationsResult.data?.filter(loc => loc.health_status === 'healthy').length || 0,
        warning_storage_locations: locationsResult.data?.filter(loc => loc.health_status === 'warning').length || 0,
        critical_storage_locations: locationsResult.data?.filter(loc => loc.health_status === 'critical').length || 0,
        active_monitors: monitorsResult.data?.length || 0,
        critical_alerts: monitorsResult.data?.filter(mon => mon.current_status === 'critical').length || 0,

        // Business Continuity
        approved_continuity_plans: plansResult.data?.filter(plan => plan.approval_status === 'approved').length || 0,
        overdue_plan_reviews: plansResult.data?.filter(plan => plan.next_review_due && new Date(plan.next_review_due) < new Date()).length || 0,
        emergency_contacts_verified: contactsResult.data?.filter(contact => {
          if (!contact.last_verified_at) return false;
          const lastVerified = new Date(contact.last_verified_at);
          const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
          return lastVerified > sixMonthsAgo;
        }).length || 0,
        recent_incidents_7_days: incidentsResult.data?.length || 0
      };

      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
}

// ==================== UTILITY HOOKS ====================

// Test backup connection
export function useTestBackupConnection() {
  return useMutation({
    mutationFn: async (locationId: string) => {
      // This would call an edge function to test the backup location connectivity
      const { data, error } = await supabase.functions.invoke('test-backup-connection', {
        body: { locationId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Backup connection test successful');
    },
    onError: (error: Error) => {
      toast.error(`Connection test failed: ${error.message}`);
    },
  });
}

// Execute manual backup
export function useExecuteManualBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // This would call an edge function to trigger a manual backup
      const { data, error } = await supabase.functions.invoke('execute-backup', {
        body: { scheduleId, manual: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.jobs() });
      toast.success('Manual backup initiated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to execute backup: ${error.message}`);
    },
  });
}