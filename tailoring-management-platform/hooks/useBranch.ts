// Multi-Location & Branch Management Hooks
// React Query hooks for branch management data fetching
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Branch,
  BranchOperatingHours,
  BranchStaffAssignment,
  BranchInventory,
  InterBranchTransfer,
  TransferItem,
  BranchPerformanceMetrics,
  CrossLocationOrder,
  BranchSettings,
  BranchAsset,
  CreateBranchDTO,
  UpdateBranchDTO,
  CreateTransferDTO,
  CreateStaffAssignmentDTO,
  BranchFilters,
  TransferFilters,
  InventoryFilters,
  BranchStatistics,
  MultiLocationOverview
} from '@/types/branch';

// ============================================
// BRANCH MANAGEMENT HOOKS
// ============================================

/**
 * Fetch all branches for an organization
 */
export function useBranches(organizationId?: string, filters?: BranchFilters) {
  return useQuery({
    queryKey: ['branches', organizationId, filters],
    queryFn: async () => {
      let query = supabase
        .from('branches')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('branch_name', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.branch_type) {
        query = query.eq('branch_type', filters.branch_type);
      }
      if (filters?.emirate) {
        query = query.eq('emirate', filters.emirate);
      }
      if (filters?.is_flagship !== undefined) {
        query = query.eq('is_flagship', filters.is_flagship);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!organizationId,
    staleTime: 30000
  });
}

/**
 * Fetch a single branch by ID
 */
export function useBranch(branchId?: string) {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId!)
        .single();
      if (error) throw error;
      return data as Branch;
    },
    enabled: !!branchId,
    staleTime: 30000
  });
}

/**
 * Create a new branch
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branchData: CreateBranchDTO & { organization_id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .insert([branchData])
        .select()
        .single();
      if (error) throw error;
      return data as Branch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    }
  });
}

/**
 * Update a branch
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBranchDTO }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Branch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', data.id] });
    }
  });
}

/**
 * Delete a branch
 */
export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branchId: string) => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    }
  });
}

// ============================================
// BRANCH OPERATING HOURS HOOKS
// ============================================

/**
 * Fetch operating hours for a branch
 */
export function useBranchOperatingHours(branchId?: string) {
  return useQuery({
    queryKey: ['branch-operating-hours', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_operating_hours')
        .select('*')
        .eq('branch_id', branchId!)
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data as BranchOperatingHours[];
    },
    enabled: !!branchId
  });
}

/**
 * Update branch operating hours
 */
export function useUpdateOperatingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: Partial<BranchOperatingHours> & { branch_id: string; organization_id: string }) => {
      const { data, error } = await supabase
        .from('branch_operating_hours')
        .upsert([hours], { onConflict: 'branch_id,day_of_week,special_date' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch-operating-hours', variables.branch_id] });
    }
  });
}

// ============================================
// STAFF ASSIGNMENT HOOKS
// ============================================

/**
 * Fetch staff assignments for a branch
 */
export function useBranchStaffAssignments(branchId?: string) {
  return useQuery({
    queryKey: ['branch-staff-assignments', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_staff_assignments')
        .select('*')
        .eq('branch_id', branchId!)
        .eq('status', 'active')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as BranchStaffAssignment[];
    },
    enabled: !!branchId
  });
}

/**
 * Fetch staff assignments for an employee
 */
export function useEmployeeAssignments(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-assignments', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_staff_assignments')
        .select('*, branches(*)')
        .eq('employee_id', employeeId!)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId
  });
}

/**
 * Create staff assignment
 */
export function useCreateStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: CreateStaffAssignmentDTO & { organization_id: string }) => {
      const { data, error } = await supabase
        .from('branch_staff_assignments')
        .insert([assignment])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branch-staff-assignments', data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ['employee-assignments', data.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    }
  });
}

/**
 * Update staff assignment
 */
export function useUpdateStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BranchStaffAssignment> }) => {
      const { data, error } = await supabase
        .from('branch_staff_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branch-staff-assignments', data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ['employee-assignments', data.employee_id] });
    }
  });
}

// ============================================
// BRANCH INVENTORY HOOKS
// ============================================

/**
 * Fetch inventory for a branch
 */
export function useBranchInventory(branchId?: string, filters?: InventoryFilters) {
  return useQuery({
    queryKey: ['branch-inventory', branchId, filters],
    queryFn: async () => {
      let query = supabase
        .from('branch_inventory')
        .select('*')
        .eq('branch_id', branchId!)
        .order('quantity_in_stock', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.below_minimum) {
        query = query.lt('quantity_in_stock', 'minimum_stock_level');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BranchInventory[];
    },
    enabled: !!branchId
  });
}

/**
 * Update branch inventory
 */
export function useUpdateBranchInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BranchInventory> }) => {
      const { data, error } = await supabase
        .from('branch_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branch-inventory', data.branch_id] });
    }
  });
}

// ============================================
// INTER-BRANCH TRANSFER HOOKS
// ============================================

/**
 * Fetch all transfers for an organization
 */
export function useTransfers(organizationId?: string, filters?: TransferFilters) {
  return useQuery({
    queryKey: ['transfers', organizationId, filters],
    queryFn: async () => {
      let query = supabase
        .from('inter_branch_transfers')
        .select('*, source_branch:branches!source_branch_id(branch_name), destination_branch:branches!destination_branch_id(branch_name)')
        .eq('organization_id', organizationId!)
        .order('requested_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.source_branch_id) {
        query = query.eq('source_branch_id', filters.source_branch_id);
      }
      if (filters?.destination_branch_id) {
        query = query.eq('destination_branch_id', filters.destination_branch_id);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.date_from) {
        query = query.gte('requested_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('requested_date', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId
  });
}

/**
 * Fetch a single transfer with items
 */
export function useTransfer(transferId?: string) {
  return useQuery({
    queryKey: ['transfer', transferId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inter_branch_transfers')
        .select('*, items:transfer_items(*), source_branch:branches!source_branch_id(*), destination_branch:branches!destination_branch_id(*)')
        .eq('id', transferId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!transferId
  });
}

/**
 * Create a new transfer
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferData: CreateTransferDTO & { organization_id: string; requested_by: string }) => {
      // Generate transfer number
      const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Create transfer
      const { data: transfer, error: transferError } = await supabase
        .from('inter_branch_transfers')
        .insert([{
          transfer_number: transferNumber,
          organization_id: transferData.organization_id,
          source_branch_id: transferData.source_branch_id,
          destination_branch_id: transferData.destination_branch_id,
          transfer_type: transferData.transfer_type,
          transfer_reason: transferData.transfer_reason,
          priority: transferData.priority || 'normal',
          scheduled_date: transferData.scheduled_date,
          transport_method: transferData.transport_method,
          requested_by: transferData.requested_by,
          status: 'draft'
        }])
        .select()
        .single();

      if (transferError) throw transferError;

      // Create transfer items
      const items = transferData.items.map(item => ({
        transfer_id: transfer.id,
        material_id: item.material_id,
        organization_id: transferData.organization_id,
        quantity_requested: item.quantity_requested,
        unit_of_measure: item.unit_of_measure
      }));

      const { error: itemsError } = await supabase
        .from('transfer_items')
        .insert(items);

      if (itemsError) throw itemsError;

      return transfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
}

/**
 * Update transfer status
 */
export function useUpdateTransferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, updates }: { id: string; status: string; updates?: any }) => {
      const { data, error } = await supabase
        .from('inter_branch_transfers')
        .update({ status, ...updates })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer', data.id] });
    }
  });
}

// ============================================
// BRANCH PERFORMANCE METRICS HOOKS
// ============================================

/**
 * Fetch performance metrics for a branch
 */
export function useBranchMetrics(branchId?: string, period?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['branch-metrics', branchId, period, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('branch_performance_metrics')
        .select('*')
        .eq('branch_id', branchId!)
        .order('metric_date', { ascending: false });

      if (period) {
        query = query.eq('metric_period', period);
      }
      if (startDate) {
        query = query.gte('metric_date', startDate);
      }
      if (endDate) {
        query = query.lte('metric_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BranchPerformanceMetrics[];
    },
    enabled: !!branchId
  });
}

// ============================================
// CROSS-LOCATION ORDERS HOOKS
// ============================================

/**
 * Fetch cross-location orders
 */
export function useCrossLocationOrders(organizationId?: string, branchId?: string) {
  return useQuery({
    queryKey: ['cross-location-orders', organizationId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('cross_location_orders')
        .select('*, receiving_branch:branches!receiving_branch_id(branch_name), fulfilling_branch:branches!fulfilling_branch_id(branch_name)')
        .eq('organization_id', organizationId!);

      if (branchId) {
        query = query.or(`receiving_branch_id.eq.${branchId},fulfilling_branch_id.eq.${branchId}`);
      }

      const { data, error } = await query.order('routing_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId
  });
}

// ============================================
// BRANCH SETTINGS HOOKS
// ============================================

/**
 * Fetch settings for a branch
 */
export function useBranchSettings(branchId?: string) {
  return useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_settings')
        .select('*')
        .eq('branch_id', branchId!)
        .single();
      if (error) throw error;
      return data as BranchSettings;
    },
    enabled: !!branchId
  });
}

/**
 * Update branch settings
 */
export function useUpdateBranchSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, settings }: { branchId: string; settings: Partial<BranchSettings> & { organization_id: string } }) => {
      const { data, error } = await supabase
        .from('branch_settings')
        .upsert([{ branch_id: branchId, ...settings }], { onConflict: 'branch_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branch-settings', data.branch_id] });
    }
  });
}

// ============================================
// BRANCH ASSETS HOOKS
// ============================================

/**
 * Fetch assets for a branch
 */
export function useBranchAssets(branchId?: string) {
  return useQuery({
    queryKey: ['branch-assets', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_assets')
        .select('*')
        .eq('branch_id', branchId!)
        .order('asset_name', { ascending: true });
      if (error) throw error;
      return data as BranchAsset[];
    },
    enabled: !!branchId
  });
}

// ============================================
// STATISTICS & OVERVIEW HOOKS
// ============================================

/**
 * Fetch multi-location overview statistics
 */
export function useMultiLocationOverview(organizationId?: string) {
  return useQuery({
    queryKey: ['multi-location-overview', organizationId],
    queryFn: async () => {
      // Fetch all branches
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', organizationId!);

      if (branchesError) throw branchesError;

      // Fetch latest metrics for each branch
      const metricsPromises = branches.map(branch => 
        supabase
          .from('branch_performance_metrics')
          .select('*')
          .eq('branch_id', branch.id)
          .eq('metric_period', 'monthly')
          .order('metric_date', { ascending: false })
          .limit(1)
          .single()
      );

      const metricsResults = await Promise.allSettled(metricsPromises);

      const branchStats: BranchStatistics[] = branches.map((branch, index) => {
        const metricsResult = metricsResults[index];
        const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value.data : null;

        return {
          branch_id: branch.id,
          branch_name: branch.branch_name,
          total_staff: branch.total_staff_count || 0,
          active_orders: metrics?.pending_orders || 0,
          monthly_revenue: metrics?.total_revenue_aed || 0,
          inventory_value: 0, // Would need to calculate from branch_inventory
          customer_satisfaction: metrics?.customer_satisfaction_score || 0,
          on_time_delivery_rate: metrics?.on_time_delivery_percentage || 0
        };
      });

      // Calculate totals
      const overview: MultiLocationOverview = {
        total_branches: branches.length,
        active_branches: branches.filter(b => b.status === 'active').length,
        total_staff: branches.reduce((sum, b) => sum + (b.total_staff_count || 0), 0),
        total_inventory_value: 0,
        monthly_revenue_all_branches: branchStats.reduce((sum, b) => sum + b.monthly_revenue, 0),
        pending_transfers: 0, // Would need to query inter_branch_transfers
        branches: branchStats
      };

      return overview;
    },
    enabled: !!organizationId,
    staleTime: 60000
  });
}
