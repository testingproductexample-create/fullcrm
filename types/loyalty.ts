/**
 * Customer Loyalty & Rewards Programs System - TypeScript Type Definitions
 * 
 * Complete type definitions for the loyalty and rewards management system including:
 * - Loyalty Programs
 * - Customer Tiers (Bronze, Silver, Gold, Platinum)
 * - Points Transactions & Earning Rules
 * - Rewards Catalog & Redemptions
 * - Loyalty Campaigns
 * - Customer Referrals
 * - Analytics & Metrics
 */

import { Database } from './supabase';

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type LoyaltyProgram = Database['public']['Tables']['loyalty_programs']['Row'];
export type LoyaltyProgramInsert = Database['public']['Tables']['loyalty_programs']['Insert'];
export type LoyaltyProgramUpdate = Database['public']['Tables']['loyalty_programs']['Update'];

export type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];
export type LoyaltyTierInsert = Database['public']['Tables']['loyalty_tiers']['Insert'];
export type LoyaltyTierUpdate = Database['public']['Tables']['loyalty_tiers']['Update'];

export type CustomerLoyalty = Database['public']['Tables']['customer_loyalty']['Row'];
export type CustomerLoyaltyInsert = Database['public']['Tables']['customer_loyalty']['Insert'];
export type CustomerLoyaltyUpdate = Database['public']['Tables']['customer_loyalty']['Update'];

export type LoyaltyPointsRule = Database['public']['Tables']['loyalty_points_rules']['Row'];
export type LoyaltyPointsRuleInsert = Database['public']['Tables']['loyalty_points_rules']['Insert'];
export type LoyaltyPointsRuleUpdate = Database['public']['Tables']['loyalty_points_rules']['Update'];

export type LoyaltyPointsTransaction = Database['public']['Tables']['loyalty_points_transactions']['Row'];
export type LoyaltyPointsTransactionInsert = Database['public']['Tables']['loyalty_points_transactions']['Insert'];
export type LoyaltyPointsTransactionUpdate = Database['public']['Tables']['loyalty_points_transactions']['Update'];

export type RewardsCatalog = Database['public']['Tables']['rewards_catalog']['Row'];
export type RewardsCatalogInsert = Database['public']['Tables']['rewards_catalog']['Insert'];
export type RewardsCatalogUpdate = Database['public']['Tables']['rewards_catalog']['Update'];

export type RewardRedemption = Database['public']['Tables']['reward_redemptions']['Row'];
export type RewardRedemptionInsert = Database['public']['Tables']['reward_redemptions']['Insert'];
export type RewardRedemptionUpdate = Database['public']['Tables']['reward_redemptions']['Update'];

export type LoyaltyCampaign = Database['public']['Tables']['loyalty_campaigns']['Row'];
export type LoyaltyCampaignInsert = Database['public']['Tables']['loyalty_campaigns']['Insert'];
export type LoyaltyCampaignUpdate = Database['public']['Tables']['loyalty_campaigns']['Update'];

export type TierBenefit = Database['public']['Tables']['tier_benefits']['Row'];
export type TierBenefitInsert = Database['public']['Tables']['tier_benefits']['Insert'];
export type TierBenefitUpdate = Database['public']['Tables']['tier_benefits']['Update'];

export type LoyaltyAnalytics = Database['public']['Tables']['loyalty_analytics']['Row'];
export type LoyaltyAnalyticsInsert = Database['public']['Tables']['loyalty_analytics']['Insert'];
export type LoyaltyAnalyticsUpdate = Database['public']['Tables']['loyalty_analytics']['Update'];

export type CustomerReferral = Database['public']['Tables']['customer_referrals']['Row'];
export type CustomerReferralInsert = Database['public']['Tables']['customer_referrals']['Insert'];
export type CustomerReferralUpdate = Database['public']['Tables']['customer_referrals']['Update'];

// ============================================
// ENUM TYPES
// ============================================

export type ProgramStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type TierLevel = 1 | 2 | 3 | 4; // Bronze, Silver, Gold, Platinum
export type CustomerLoyaltyStatus = 'active' | 'inactive' | 'suspended' | 'cancelled';

export type RuleType = 
  | 'purchase'
  | 'signup'
  | 'referral'
  | 'birthday'
  | 'review'
  | 'social_share'
  | 'event'
  | 'bonus'
  | 'custom';

export type CalculationMethod = 'fixed' | 'percentage' | 'per_unit' | 'tiered';

export type TransactionType = 
  | 'earned'
  | 'redeemed'
  | 'expired'
  | 'adjusted'
  | 'bonus'
  | 'refund'
  | 'reversed';

export type SourceType = 
  | 'order'
  | 'referral'
  | 'signup'
  | 'birthday'
  | 'review'
  | 'campaign'
  | 'reward_redemption'
  | 'manual_adjustment'
  | 'bonus';

export type RewardCategory = 
  | 'discount'
  | 'product'
  | 'service'
  | 'experience'
  | 'voucher'
  | 'upgrade'
  | 'custom';

export type FulfillmentType = 
  | 'automatic'
  | 'manual'
  | 'voucher_code'
  | 'in_store';

export type RedemptionStatus = 
  | 'pending'
  | 'approved'
  | 'processing'
  | 'fulfilled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export type CampaignType = 
  | 'bonus_points'
  | 'double_points'
  | 'tier_boost'
  | 'special_reward'
  | 'seasonal'
  | 'flash_sale'
  | 'referral_bonus';

export type CampaignStatus = 
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type BenefitType = 
  | 'discount'
  | 'service'
  | 'access'
  | 'priority'
  | 'bonus'
  | 'gift'
  | 'perk';

export type PeriodType = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type ReferralMethod = 
  | 'email'
  | 'sms'
  | 'social_media'
  | 'in_person'
  | 'link';

export type ReferralStatus = 
  | 'pending'
  | 'accepted'
  | 'qualified'
  | 'completed'
  | 'expired'
  | 'cancelled';

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface LoyaltyProgramWithDetails extends LoyaltyProgram {
  tiers?: LoyaltyTier[];
  active_members_count?: number;
  total_points_issued?: number;
  total_rewards_redeemed?: number;
}

export interface LoyaltyTierWithBenefits extends LoyaltyTier {
  benefits?: TierBenefit[];
  members_count?: number;
  program?: LoyaltyProgram;
}

export interface CustomerLoyaltyWithDetails extends CustomerLoyalty {
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  current_tier?: LoyaltyTier;
  previous_tier?: LoyaltyTier;
  program?: LoyaltyProgram;
  recent_transactions?: LoyaltyPointsTransaction[];
  pending_redemptions?: RewardRedemption[];
  referrals?: CustomerReferral[];
}

export interface LoyaltyPointsTransactionWithDetails extends LoyaltyPointsTransaction {
  customer_loyalty?: CustomerLoyalty;
  rule?: LoyaltyPointsRule;
  reversed_transaction?: LoyaltyPointsTransaction;
}

export interface RewardsCatalogWithDetails extends RewardsCatalog {
  program?: LoyaltyProgram;
  eligible_tiers?: LoyaltyTier[];
  redemption_count?: number;
  average_rating?: number;
}

export interface RewardRedemptionWithDetails extends RewardRedemption {
  customer_loyalty?: CustomerLoyalty;
  reward?: RewardsCatalog;
  points_transaction?: LoyaltyPointsTransaction;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface LoyaltyCampaignWithDetails extends LoyaltyCampaign {
  program?: LoyaltyProgram;
  target_tiers?: LoyaltyTier[];
  participants_count?: number;
  performance_metrics?: {
    participation_rate: number;
    points_awarded: number;
    revenue_generated: number;
    roi: number;
  };
}

export interface CustomerReferralWithDetails extends CustomerReferral {
  referrer?: {
    id: string;
    name: string;
    email: string;
    loyalty_number: string;
  };
  referred?: {
    id: string;
    name: string;
    email: string;
    loyalty_number?: string;
  };
  campaign?: LoyaltyCampaign;
  referrer_transaction?: LoyaltyPointsTransaction;
  referred_transaction?: LoyaltyPointsTransaction;
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface LoyaltyDashboardMetrics {
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  member_growth_rate: number;
  
  total_points_earned: number;
  total_points_redeemed: number;
  total_points_expired: number;
  points_balance: number;
  
  total_rewards_redeemed: number;
  rewards_value_aed: number;
  popular_rewards: Array<{
    reward_id: string;
    reward_name: string;
    redemption_count: number;
  }>;
  
  tier_distribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  
  engagement_metrics: {
    average_engagement_score: number;
    orders_from_loyalty_members: number;
    loyalty_revenue_percentage: number;
    average_order_value: number;
  };
  
  campaign_metrics: {
    active_campaigns: number;
    total_participants: number;
    campaign_roi: number;
  };
  
  referral_metrics: {
    total_referrals: number;
    successful_referrals: number;
    conversion_rate: number;
  };
}

export interface TierPerformanceMetrics {
  tier_id: string;
  tier_name: string;
  tier_level: number;
  
  members_count: number;
  members_percentage: number;
  
  average_spending: number;
  total_revenue: number;
  average_orders: number;
  
  points_earned: number;
  points_redeemed: number;
  redemption_rate: number;
  
  retention_rate: number;
  upgrade_rate: number;
  downgrade_rate: number;
}

export interface PointsActivitySummary {
  period: string; // Date or period label
  
  points_earned: number;
  points_redeemed: number;
  points_expired: number;
  
  earning_sources: {
    purchases: number;
    referrals: number;
    bonuses: number;
    campaigns: number;
    other: number;
  };
  
  redemption_categories: {
    discounts: number;
    products: number;
    services: number;
    experiences: number;
    other: number;
  };
  
  average_points_per_member: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  
  start_date: string;
  end_date: string;
  days_remaining?: number;
  
  target_members: number;
  actual_participants: number;
  participation_rate: number;
  
  budget_points: number;
  points_allocated: number;
  budget_utilization: number;
  
  orders_generated: number;
  revenue_generated: number;
  campaign_cost: number;
  roi: number;
  
  conversion_rate: number;
  average_order_value: number;
}

export interface MemberSegmentation {
  segment_name: string;
  member_count: number;
  percentage: number;
  
  average_lifetime_value: number;
  average_points_balance: number;
  average_engagement_score: number;
  
  tier_distribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  
  behavior: {
    purchase_frequency: number;
    average_order_value: number;
    redemption_rate: number;
    referral_rate: number;
  };
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface CreateLoyaltyProgramInput {
  program_name: string;
  program_code: string;
  program_description?: string;
  
  earning_rate: number;
  minimum_order_amount?: number;
  earning_multiplier?: number;
  
  points_expire?: boolean;
  expiration_months?: number;
  expiration_warning_days?: number;
  
  launch_date: string;
  end_date?: string;
  
  allow_referrals?: boolean;
  referral_bonus_points?: number;
  birthday_bonus_points?: number;
  signup_bonus_points?: number;
  
  terms_and_conditions?: string;
}

export interface CreateTierInput {
  tier_name: string;
  tier_level: TierLevel;
  tier_code: string;
  tier_color?: string;
  tier_icon?: string;
  
  min_spending_amount: number;
  min_points_balance?: number;
  min_orders_count?: number;
  qualification_period_months?: number;
  
  points_multiplier?: number;
  discount_percentage?: number;
  free_shipping?: boolean;
  priority_support?: boolean;
  exclusive_access?: boolean;
  
  maintain_spending_amount?: number;
  downgrade_grace_period_months?: number;
  
  tier_description?: string;
  benefits_summary?: Record<string, any>;
}

export interface EnrollCustomerInput {
  customer_id: string;
  program_id: string;
  loyalty_number?: string;
  enrollment_date?: string;
}

export interface AwardPointsInput {
  customer_loyalty_id: string;
  points_amount: number;
  transaction_type: TransactionType;
  source_type?: SourceType;
  source_id?: string;
  order_id?: string;
  order_amount?: number;
  rule_id?: string;
  transaction_notes?: string;
  expiration_date?: string;
}

export interface CreateRewardInput {
  reward_name: string;
  reward_code: string;
  reward_category: RewardCategory;
  
  short_description?: string;
  full_description?: string;
  reward_image_url?: string;
  
  points_required: number;
  cash_value_aed?: number;
  
  total_quantity?: number;
  is_unlimited?: boolean;
  
  min_tier_level?: number;
  eligible_tier_ids?: string[];
  
  max_redemptions_per_customer?: number;
  redemption_cooldown_days?: number;
  
  start_date: string;
  end_date?: string;
  is_seasonal?: boolean;
  season_name?: string;
  
  fulfillment_type?: FulfillmentType;
  fulfillment_instructions?: string;
  estimated_delivery_days?: number;
  
  terms_and_conditions?: string;
}

export interface RedeemRewardInput {
  customer_loyalty_id: string;
  reward_id: string;
  points_used: number;
  
  delivery_address?: Record<string, any>;
  contact_phone?: string;
  contact_email?: string;
  special_instructions?: string;
}

export interface CreateCampaignInput {
  program_id: string;
  campaign_name: string;
  campaign_code: string;
  campaign_type: CampaignType;
  
  campaign_description?: string;
  campaign_banner_url?: string;
  
  bonus_points?: number;
  points_multiplier?: number;
  
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  
  target_all_customers?: boolean;
  target_tier_ids?: string[];
  target_customer_segments?: string[];
  min_tier_level?: number;
  
  min_purchase_amount?: number;
  min_orders_count?: number;
  applicable_categories?: string[];
  
  max_participations_per_customer?: number;
  total_budget_points?: number;
  
  send_notification?: boolean;
  terms_and_conditions?: string;
}

export interface CreateReferralInput {
  referrer_customer_id: string;
  referral_code: string;
  referral_method: ReferralMethod;
  
  referred_email?: string;
  referred_phone?: string;
  referred_name?: string;
  
  min_purchase_required?: number;
  campaign_id?: string;
  referral_source?: string;
}

// ============================================
// FILTER & QUERY TYPES
// ============================================

export interface LoyaltyMemberFilters {
  status?: CustomerLoyaltyStatus[];
  tier_ids?: string[];
  tier_levels?: TierLevel[];
  
  min_points_balance?: number;
  max_points_balance?: number;
  
  min_lifetime_spending?: number;
  max_lifetime_spending?: number;
  
  enrollment_date_from?: string;
  enrollment_date_to?: string;
  
  last_activity_from?: string;
  last_activity_to?: string;
  
  has_pending_redemptions?: boolean;
  has_referrals?: boolean;
  
  search_query?: string; // Search by name, email, loyalty number
}

export interface PointsTransactionFilters {
  transaction_types?: TransactionType[];
  source_types?: SourceType[];
  
  date_from?: string;
  date_to?: string;
  
  min_points?: number;
  max_points?: number;
  
  customer_loyalty_id?: string;
  order_id?: string;
  rule_id?: string;
  
  is_expired?: boolean;
  
  search_query?: string; // Search by transaction number
}

export interface RewardFilters {
  categories?: RewardCategory[];
  
  min_points_required?: number;
  max_points_required?: number;
  
  is_active?: boolean;
  is_unlimited?: boolean;
  featured?: boolean;
  
  min_tier_level?: number;
  eligible_tier_ids?: string[];
  
  in_stock?: boolean; // remaining_quantity > 0
  
  search_query?: string; // Search by name, code
}

export interface RedemptionFilters {
  statuses?: RedemptionStatus[];
  
  date_from?: string;
  date_to?: string;
  
  customer_loyalty_id?: string;
  reward_id?: string;
  
  requires_approval?: boolean;
  is_fulfilled?: boolean;
  
  min_rating?: number;
  has_feedback?: boolean;
  
  search_query?: string; // Search by redemption number
}

export interface CampaignFilters {
  statuses?: CampaignStatus[];
  types?: CampaignType[];
  
  date_from?: string;
  date_to?: string;
  
  is_active_now?: boolean;
  
  target_tier_ids?: string[];
  
  search_query?: string; // Search by name, code
}

// ============================================
// RESPONSE & RESULT TYPES
// ============================================

export interface PointsCalculationResult {
  base_points: number;
  bonus_points: number;
  multiplier_applied: number;
  final_points: number;
  
  rules_applied: Array<{
    rule_id: string;
    rule_name: string;
    points_contributed: number;
  }>;
  
  expiration_date?: string;
}

export interface TierEligibilityResult {
  is_eligible: boolean;
  current_tier: LoyaltyTier;
  next_tier?: LoyaltyTier;
  
  criteria_met: {
    spending: boolean;
    points: boolean;
    orders: boolean;
  };
  
  progress: {
    spending_progress: number; // Percentage
    points_progress: number;
    orders_progress: number;
  };
  
  requirements_remaining: {
    spending_needed: number;
    points_needed: number;
    orders_needed: number;
  };
  
  estimated_achievement_date?: string;
}

export interface RedemptionEligibilityResult {
  is_eligible: boolean;
  reward: RewardsCatalog;
  customer_points_balance: number;
  
  ineligibility_reasons: string[];
  
  can_redeem: boolean;
  points_deficit?: number;
  tier_requirement_met: boolean;
  quantity_available: boolean;
  within_validity_period: boolean;
  cooldown_expired: boolean;
}

export interface ReferralValidationResult {
  is_valid: boolean;
  referral_code: string;
  
  referrer_customer?: {
    id: string;
    name: string;
    loyalty_number: string;
  };
  
  referrer_bonus_points: number;
  referred_bonus_points: number;
  
  validation_errors: string[];
  is_active: boolean;
  is_expired: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
}

export interface DateRangeOption {
  label: string;
  value: string;
  start_date: string;
  end_date: string;
}

export interface TierBadgeProps {
  tier: LoyaltyTier;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
}

export interface PointsDisplayProps {
  points: number;
  showLabel?: boolean;
  highlighted?: boolean;
}
