/**
 * Customer Loyalty & Rewards Programs System - React Query Hooks
 * 
 * Comprehensive data fetching and mutation hooks for:
 * - Loyalty Programs & Tiers
 * - Customer Loyalty Management
 * - Points Transactions & Rules
 * - Rewards Catalog & Redemptions
 * - Loyalty Campaigns
 * - Customer Referrals
 * - Analytics & Metrics
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  LoyaltyProgram, LoyaltyProgramInsert, LoyaltyProgramUpdate,
  LoyaltyTier, LoyaltyTierInsert, LoyaltyTierUpdate,
  CustomerLoyalty, CustomerLoyaltyInsert, CustomerLoyaltyUpdate,
  LoyaltyPointsRule, LoyaltyPointsRuleInsert, LoyaltyPointsRuleUpdate,
  LoyaltyPointsTransaction, LoyaltyPointsTransactionInsert,
  RewardsCatalog, RewardsCatalogInsert, RewardsCatalogUpdate,
  RewardRedemption, RewardRedemptionInsert, RewardRedemptionUpdate,
  LoyaltyCampaign, LoyaltyCampaignInsert, LoyaltyCampaignUpdate,
  TierBenefit, TierBenefitInsert, TierBenefitUpdate,
  LoyaltyAnalytics,
  CustomerReferral, CustomerReferralInsert, CustomerReferralUpdate,
  LoyaltyProgramWithDetails,
  LoyaltyTierWithBenefits,
  CustomerLoyaltyWithDetails,
  LoyaltyPointsTransactionWithDetails,
  RewardsCatalogWithDetails,
  RewardRedemptionWithDetails,
  LoyaltyCampaignWithDetails,
  CustomerReferralWithDetails,
  LoyaltyDashboardMetrics,
  LoyaltyMemberFilters,
  PointsTransactionFilters,
  RewardFilters,
  RedemptionFilters,
  CampaignFilters,
} from '@/types/loyalty';

// ============================================
// QUERY KEYS
// ============================================

export const loyaltyKeys = {
  all: ['loyalty'] as const,
  programs: () => [...loyaltyKeys.all, 'programs'] as const,
  program: (id: string) => [...loyaltyKeys.programs(), id] as const,
  tiers: (programId?: string) => [...loyaltyKeys.all, 'tiers', programId] as const,
  tier: (id: string) => [...loyaltyKeys.all, 'tier', id] as const,
  tierBenefits: (tierId: string) => [...loyaltyKeys.all, 'tier-benefits', tierId] as const,
  members: (filters?: LoyaltyMemberFilters) => [...loyaltyKeys.all, 'members', filters] as const,
  member: (id: string) => [...loyaltyKeys.all, 'member', id] as const,
  memberByCustomer: (customerId: string) => [...loyaltyKeys.all, 'member-by-customer', customerId] as const,
  pointsRules: (programId?: string) => [...loyaltyKeys.all, 'points-rules', programId] as const,
  pointsTransactions: (filters?: PointsTransactionFilters) => [...loyaltyKeys.all, 'points-transactions', filters] as const,
  rewards: (filters?: RewardFilters) => [...loyaltyKeys.all, 'rewards', filters] as const,
  reward: (id: string) => [...loyaltyKeys.all, 'reward', id] as const,
  redemptions: (filters?: RedemptionFilters) => [...loyaltyKeys.all, 'redemptions', filters] as const,
  redemption: (id: string) => [...loyaltyKeys.all, 'redemption', id] as const,
  campaigns: (filters?: CampaignFilters) => [...loyaltyKeys.all, 'campaigns', filters] as const,
  campaign: (id: string) => [...loyaltyKeys.all, 'campaign', id] as const,
  referrals: (customerId?: string) => [...loyaltyKeys.all, 'referrals', customerId] as const,
  analytics: (programId: string, dateRange?: { from: string; to: string }) => [...loyaltyKeys.all, 'analytics', programId, dateRange] as const,
  dashboard: (programId?: string) => [...loyaltyKeys.all, 'dashboard', programId] as const,
};

// ============================================
// LOYALTY PROGRAMS HOOKS
// ============================================

/**
 * Fetch all loyalty programs
 */
export function useLoyaltyPrograms(): UseQueryResult<LoyaltyProgram[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.programs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single loyalty program with details
 */
export function useLoyaltyProgram(programId: string): UseQueryResult<LoyaltyProgramWithDetails, Error> {
  return useQuery({
    queryKey: loyaltyKeys.program(programId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select(`
          *,
          tiers:loyalty_tiers(*)
        `)
        .eq('id', programId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

/**
 * Create new loyalty program
 */
export function useCreateLoyaltyProgram(): UseMutationResult<LoyaltyProgram, Error, LoyaltyProgramInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: LoyaltyProgramInsert) => {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .insert(program)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.programs() });
    },
  });
}

/**
 * Update loyalty program
 */
export function useUpdateLoyaltyProgram(): UseMutationResult<LoyaltyProgram, Error, { id: string; updates: LoyaltyProgramUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program(variables.id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.programs() });
    },
  });
}

/**
 * Delete loyalty program
 */
export function useDeleteLoyaltyProgram(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from('loyalty_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.programs() });
    },
  });
}

// ============================================
// LOYALTY TIERS HOOKS
// ============================================

/**
 * Fetch loyalty tiers for a program
 */
export function useLoyaltyTiers(programId?: string): UseQueryResult<LoyaltyTier[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.tiers(programId),
    queryFn: async () => {
      let query = supabase
        .from('loyalty_tiers')
        .select('*')
        .order('tier_level', { ascending: true });

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single tier with benefits
 */
export function useLoyaltyTier(tierId: string): UseQueryResult<LoyaltyTierWithBenefits, Error> {
  return useQuery({
    queryKey: loyaltyKeys.tier(tierId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select(`
          *,
          benefits:tier_benefits(*),
          program:loyalty_programs(*)
        `)
        .eq('id', tierId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tierId,
  });
}

/**
 * Create new tier
 */
export function useCreateTier(): UseMutationResult<LoyaltyTier, Error, LoyaltyTierInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tier: LoyaltyTierInsert) => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .insert(tier)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.tiers(data.program_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program(data.program_id) });
    },
  });
}

/**
 * Update tier
 */
export function useUpdateTier(): UseMutationResult<LoyaltyTier, Error, { id: string; updates: LoyaltyTierUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.tier(data.id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.tiers(data.program_id) });
    },
  });
}

/**
 * Delete tier
 */
export function useDeleteTier(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
    },
  });
}

// ============================================
// TIER BENEFITS HOOKS
// ============================================

/**
 * Fetch benefits for a tier
 */
export function useTierBenefits(tierId: string): UseQueryResult<TierBenefit[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.tierBenefits(tierId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_benefits')
        .select('*')
        .eq('tier_id', tierId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tierId,
  });
}

/**
 * Create tier benefit
 */
export function useCreateTierBenefit(): UseMutationResult<TierBenefit, Error, TierBenefitInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (benefit: TierBenefitInsert) => {
      const { data, error } = await supabase
        .from('tier_benefits')
        .insert(benefit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.tierBenefits(data.tier_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.tier(data.tier_id) });
    },
  });
}

/**
 * Update tier benefit
 */
export function useUpdateTierBenefit(): UseMutationResult<TierBenefit, Error, { id: string; updates: TierBenefitUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('tier_benefits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.tierBenefits(data.tier_id) });
    },
  });
}

/**
 * Delete tier benefit
 */
export function useDeleteTierBenefit(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (benefitId: string) => {
      const { error } = await supabase
        .from('tier_benefits')
        .delete()
        .eq('id', benefitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
    },
  });
}

// ============================================
// CUSTOMER LOYALTY HOOKS
// ============================================

/**
 * Fetch loyalty members with filters
 */
export function useLoyaltyMembers(filters?: LoyaltyMemberFilters): UseQueryResult<CustomerLoyalty[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.members(filters),
    queryFn: async () => {
      let query = supabase
        .from('customer_loyalty')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.in('status', filters.status);
      }
      if (filters?.tier_ids) {
        query = query.in('current_tier_id', filters.tier_ids);
      }
      if (filters?.min_points_balance) {
        query = query.gte('current_points_balance', filters.min_points_balance);
      }
      if (filters?.max_points_balance) {
        query = query.lte('current_points_balance', filters.max_points_balance);
      }
      if (filters?.min_lifetime_spending) {
        query = query.gte('lifetime_spending_amount', filters.min_lifetime_spending);
      }
      if (filters?.search_query) {
        query = query.or(`loyalty_number.ilike.%${filters.search_query}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single customer loyalty with details
 */
export function useCustomerLoyalty(loyaltyId: string): UseQueryResult<CustomerLoyaltyWithDetails, Error> {
  return useQuery({
    queryKey: loyaltyKeys.member(loyaltyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .select(`
          *,
          current_tier:loyalty_tiers!customer_loyalty_current_tier_id_fkey(*),
          previous_tier:loyalty_tiers!customer_loyalty_previous_tier_id_fkey(*),
          program:loyalty_programs(*)
        `)
        .eq('id', loyaltyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!loyaltyId,
  });
}

/**
 * Fetch customer loyalty by customer ID
 */
export function useCustomerLoyaltyByCustomer(customerId: string, programId?: string): UseQueryResult<CustomerLoyalty | null, Error> {
  return useQuery({
    queryKey: loyaltyKeys.memberByCustomer(customerId),
    queryFn: async () => {
      let query = supabase
        .from('customer_loyalty')
        .select('*')
        .eq('customer_id', customerId);

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

/**
 * Enroll customer in loyalty program
 */
export function useEnrollCustomer(): UseMutationResult<CustomerLoyalty, Error, CustomerLoyaltyInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollment: CustomerLoyaltyInsert) => {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .insert(enrollment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.members() });
    },
  });
}

/**
 * Update customer loyalty
 */
export function useUpdateCustomerLoyalty(): UseMutationResult<CustomerLoyalty, Error, { id: string; updates: CustomerLoyaltyUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.member(variables.id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.members() });
    },
  });
}

// ============================================
// POINTS RULES HOOKS
// ============================================

/**
 * Fetch points earning rules
 */
export function usePointsRules(programId?: string): UseQueryResult<LoyaltyPointsRule[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.pointsRules(programId),
    queryFn: async () => {
      let query = supabase
        .from('loyalty_points_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create points rule
 */
export function useCreatePointsRule(): UseMutationResult<LoyaltyPointsRule, Error, LoyaltyPointsRuleInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: LoyaltyPointsRuleInsert) => {
      const { data, error } = await supabase
        .from('loyalty_points_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.pointsRules(data.program_id) });
    },
  });
}

/**
 * Update points rule
 */
export function useUpdatePointsRule(): UseMutationResult<LoyaltyPointsRule, Error, { id: string; updates: LoyaltyPointsRuleUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('loyalty_points_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.pointsRules(data.program_id) });
    },
  });
}

/**
 * Delete points rule
 */
export function useDeletePointsRule(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('loyalty_points_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
    },
  });
}

// ============================================
// POINTS TRANSACTIONS HOOKS
// ============================================

/**
 * Fetch points transactions with filters
 */
export function usePointsTransactions(filters?: PointsTransactionFilters): UseQueryResult<LoyaltyPointsTransaction[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.pointsTransactions(filters),
    queryFn: async () => {
      let query = supabase
        .from('loyalty_points_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      // Apply filters
      if (filters?.transaction_types) {
        query = query.in('transaction_type', filters.transaction_types);
      }
      if (filters?.source_types) {
        query = query.in('source_type', filters.source_types);
      }
      if (filters?.customer_loyalty_id) {
        query = query.eq('customer_loyalty_id', filters.customer_loyalty_id);
      }
      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id);
      }
      if (filters?.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }
      if (filters?.min_points) {
        query = query.gte('points_amount', filters.min_points);
      }
      if (filters?.is_expired !== undefined) {
        query = query.eq('is_expired', filters.is_expired);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Award points to customer
 */
export function useAwardPoints(): UseMutationResult<LoyaltyPointsTransaction, Error, LoyaltyPointsTransactionInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: LoyaltyPointsTransactionInsert) => {
      const { data, error } = await supabase
        .from('loyalty_points_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.member(data.customer_loyalty_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.pointsTransactions() });
    },
  });
}

// ============================================
// REWARDS CATALOG HOOKS
// ============================================

/**
 * Fetch rewards catalog with filters
 */
export function useRewardsCatalog(filters?: RewardFilters): UseQueryResult<RewardsCatalog[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.rewards(filters),
    queryFn: async () => {
      let query = supabase
        .from('rewards_catalog')
        .select('*')
        .order('display_order', { ascending: true });

      // Apply filters
      if (filters?.categories) {
        query = query.in('reward_category', filters.categories);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }
      if (filters?.min_points_required) {
        query = query.gte('points_required', filters.min_points_required);
      }
      if (filters?.max_points_required) {
        query = query.lte('points_required', filters.max_points_required);
      }
      if (filters?.min_tier_level) {
        query = query.lte('min_tier_level', filters.min_tier_level);
      }
      if (filters?.in_stock) {
        query = query.or('is_unlimited.eq.true,remaining_quantity.gt.0');
      }
      if (filters?.search_query) {
        query = query.or(`reward_name.ilike.%${filters.search_query}%,reward_code.ilike.%${filters.search_query}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single reward
 */
export function useReward(rewardId: string): UseQueryResult<RewardsCatalogWithDetails, Error> {
  return useQuery({
    queryKey: loyaltyKeys.reward(rewardId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select(`
          *,
          program:loyalty_programs(*)
        `)
        .eq('id', rewardId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!rewardId,
  });
}

/**
 * Create reward
 */
export function useCreateReward(): UseMutationResult<RewardsCatalog, Error, RewardsCatalogInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reward: RewardsCatalogInsert) => {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .insert(reward)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.rewards() });
    },
  });
}

/**
 * Update reward
 */
export function useUpdateReward(): UseMutationResult<RewardsCatalog, Error, { id: string; updates: RewardsCatalogUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.reward(variables.id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.rewards() });
    },
  });
}

/**
 * Delete reward
 */
export function useDeleteReward(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from('rewards_catalog')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.rewards() });
    },
  });
}

// ============================================
// REWARD REDEMPTIONS HOOKS
// ============================================

/**
 * Fetch reward redemptions with filters
 */
export function useRedemptions(filters?: RedemptionFilters): UseQueryResult<RewardRedemption[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.redemptions(filters),
    queryFn: async () => {
      let query = supabase
        .from('reward_redemptions')
        .select('*')
        .order('redemption_date', { ascending: false });

      // Apply filters
      if (filters?.statuses) {
        query = query.in('status', filters.statuses);
      }
      if (filters?.customer_loyalty_id) {
        query = query.eq('customer_loyalty_id', filters.customer_loyalty_id);
      }
      if (filters?.reward_id) {
        query = query.eq('reward_id', filters.reward_id);
      }
      if (filters?.date_from) {
        query = query.gte('redemption_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('redemption_date', filters.date_to);
      }
      if (filters?.requires_approval !== undefined) {
        query = query.eq('requires_approval', filters.requires_approval);
      }
      if (filters?.min_rating) {
        query = query.gte('customer_rating', filters.min_rating);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single redemption
 */
export function useRedemption(redemptionId: string): UseQueryResult<RewardRedemptionWithDetails, Error> {
  return useQuery({
    queryKey: loyaltyKeys.redemption(redemptionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards_catalog(*),
          customer_loyalty:customer_loyalty(*),
          points_transaction:loyalty_points_transactions(*)
        `)
        .eq('id', redemptionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!redemptionId,
  });
}

/**
 * Redeem reward
 */
export function useRedeemReward(): UseMutationResult<RewardRedemption, Error, RewardRedemptionInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (redemption: RewardRedemptionInsert) => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .insert(redemption)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.redemptions() });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.member(data.customer_loyalty_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.reward(data.reward_id) });
    },
  });
}

/**
 * Update redemption status
 */
export function useUpdateRedemption(): UseMutationResult<RewardRedemption, Error, { id: string; updates: RewardRedemptionUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.redemption(variables.id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.redemptions() });
    },
  });
}

// ============================================
// LOYALTY CAMPAIGNS HOOKS
// ============================================

/**
 * Fetch loyalty campaigns with filters
 */
export function useCampaigns(filters?: CampaignFilters): UseQueryResult<LoyaltyCampaign[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.campaigns(filters),
    queryFn: async () => {
      let query = supabase
        .from('loyalty_campaigns')
        .select('*')
        .order('start_date', { ascending: false });

      // Apply filters
      if (filters?.statuses) {
        query = query.in('status', filters.statuses);
      }
      if (filters?.types) {
        query = query.in('campaign_type', filters.types);
      }
      if (filters?.date_from) {
        query = query.gte('start_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('end_date', filters.date_to);
      }
      if (filters?.is_active_now) {
        const now = new Date().toISOString();
        query = query
          .lte('start_date', now)
          .gte('end_date', now)
          .eq('status', 'active');
      }
      if (filters?.search_query) {
        query = query.or(`campaign_name.ilike.%${filters.search_query}%,campaign_code.ilike.%${filters.search_query}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single campaign
 */
export function useCampaign(campaignId: string): UseQueryResult<LoyaltyCampaignWithDetails, Error> {
  return useQuery({
    queryKey: loyaltyKeys.campaign(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_campaigns')
        .select(`
          *,
          program:loyalty_programs(*)
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
}

/**
 * Create campaign
 */
export function useCreateCampaign(): UseMutationResult<LoyaltyCampaign, Error, LoyaltyCampaignInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: LoyaltyCampaignInsert) => {
      const { data, error } = await supabase
        .from('loyalty_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.campaigns() });
    },
  });
}

/**
 * Update campaign
 */
export function useUpdateCampaign(): UseMutationResult<LoyaltyCampaign, Error, { id: string; updates: LoyaltyCampaignUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('loyalty_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.campaign(variables.id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.campaigns() });
    },
  });
}

/**
 * Delete campaign
 */
export function useDeleteCampaign(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('loyalty_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.campaigns() });
    },
  });
}

// ============================================
// CUSTOMER REFERRALS HOOKS
// ============================================

/**
 * Fetch customer referrals
 */
export function useReferrals(customerId?: string): UseQueryResult<CustomerReferral[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.referrals(customerId),
    queryFn: async () => {
      let query = supabase
        .from('customer_referrals')
        .select('*')
        .order('referred_date', { ascending: false });

      if (customerId) {
        query = query.eq('referrer_customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create referral
 */
export function useCreateReferral(): UseMutationResult<CustomerReferral, Error, CustomerReferralInsert> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referral: CustomerReferralInsert) => {
      const { data, error } = await supabase
        .from('customer_referrals')
        .insert(referral)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.referrals() });
    },
  });
}

/**
 * Update referral
 */
export function useUpdateReferral(): UseMutationResult<CustomerReferral, Error, { id: string; updates: CustomerReferralUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('customer_referrals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.referrals() });
    },
  });
}

// ============================================
// ANALYTICS & DASHBOARD HOOKS
// ============================================

/**
 * Fetch loyalty analytics for a period
 */
export function useLoyaltyAnalytics(
  programId: string,
  dateRange?: { from: string; to: string }
): UseQueryResult<LoyaltyAnalytics[], Error> {
  return useQuery({
    queryKey: loyaltyKeys.analytics(programId, dateRange),
    queryFn: async () => {
      let query = supabase
        .from('loyalty_analytics')
        .select('*')
        .eq('program_id', programId)
        .order('analysis_date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('analysis_date', dateRange.from)
          .lte('analysis_date', dateRange.to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

/**
 * Fetch loyalty dashboard metrics
 */
export function useLoyaltyDashboard(programId?: string): UseQueryResult<LoyaltyDashboardMetrics, Error> {
  return useQuery({
    queryKey: loyaltyKeys.dashboard(programId),
    queryFn: async () => {
      // This would typically aggregate data from multiple tables
      // For now, returning a placeholder structure
      // In production, this could call a Supabase function or RPC
      
      const metrics: LoyaltyDashboardMetrics = {
        total_members: 0,
        active_members: 0,
        new_members_this_month: 0,
        member_growth_rate: 0,
        total_points_earned: 0,
        total_points_redeemed: 0,
        total_points_expired: 0,
        points_balance: 0,
        total_rewards_redeemed: 0,
        rewards_value_aed: 0,
        popular_rewards: [],
        tier_distribution: {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
        },
        engagement_metrics: {
          average_engagement_score: 0,
          orders_from_loyalty_members: 0,
          loyalty_revenue_percentage: 0,
          average_order_value: 0,
        },
        campaign_metrics: {
          active_campaigns: 0,
          total_participants: 0,
          campaign_roi: 0,
        },
        referral_metrics: {
          total_referrals: 0,
          successful_referrals: 0,
          conversion_rate: 0,
        },
      };

      return metrics;
    },
  });
}
