/**
 * Feature Flag Management System
 * Handles feature toggles, A/B testing, and gradual rollouts
 */

export interface FeatureFlag {
  id: string;
  name: string;
  key: string; // unique identifier for programmatic access
  description?: string;
  type: 'boolean' | 'percentage' | 'user_list' | 'segment' | 'gradual_rollout';
  configuration: FlagConfiguration;
  targeting: TargetingRules;
  environment: EnvironmentConfig;
  metrics: FlagMetrics;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    version: number;
    tags: string[];
  };
  status: 'active' | 'inactive' | 'deprecated' | 'testing';
  dependencies?: string[];
}

export interface FlagConfiguration {
  defaultValue: any;
  variants?: FlagVariant[];
  rollout?: RolloutConfig;
  conditions?: FlagCondition[];
}

export interface FlagVariant {
  id: string;
  name: string;
  value: any;
  weight: number; // percentage weight for percentage-based flags
  conditions?: TargetingRules;
}

export interface RolloutConfig {
  type: 'percentage' | 'time_based' | 'manual';
  schedule?: {
    startDate: Date;
    endDate: Date;
    stages?: RolloutStage[];
  };
  percentage?: number; // 0-100
  users?: string[]; // user IDs for manual rollout
  segments?: string[]; // segment IDs
}

export interface RolloutStage {
  id: string;
  name: string;
  percentage: number;
  conditions?: {
    userProperties?: Record<string, any>;
    environment?: string[];
  };
}

export interface FlagCondition {
  id: string;
  name: string;
  expression: string; // JSON logic or custom expression language
  priority: number; // lower numbers = higher priority
  result: any;
  description?: string;
}

export interface TargetingRules {
  include: {
    users?: string[];
    segments?: string[];
    countries?: string[];
    devices?: string[];
    custom?: Record<string, any>;
  };
  exclude: {
    users?: string[];
    segments?: string[];
    countries?: string[];
    devices?: string[];
    custom?: Record<string, any>;
  };
}

export interface EnvironmentConfig {
  development: boolean;
  staging: boolean;
  production: boolean;
  overrides?: Record<string, any>;
}

export interface FlagMetrics {
  enabled: number;
  disabled: number;
  byVariant?: Record<string, number>;
  bySegment?: Record<string, number>;
  conversion?: {
    enabled: number;
    disabled: number;
  };
  lastCalculated?: Date;
}

export interface UserSegment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentRule {
  property: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  weight?: number; // for complex scoring
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  flags: string[]; // feature flag IDs
  variants: ExperimentVariant[];
  traffic: TrafficAllocation;
  metrics: ExperimentMetrics;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  flagValues: Record<string, any>; // flag key -> value mapping
  traffic: number; // percentage of traffic
}

export interface TrafficAllocation {
  control: number; // percentage of traffic in control group
  variants: {
    variantId: string;
    percentage: number;
  }[];
}

export interface ExperimentMetrics {
  primary: MetricConfig[];
  secondary?: MetricConfig[];
  sampleSize?: number;
  confidence?: number;
  power?: number;
}

export interface MetricConfig {
  name: string;
  type: 'conversion' | 'revenue' | 'retention' | 'engagement' | 'custom';
  event: string;
  properties?: Record<string, any>;
  aggregation: 'sum' | 'count' | 'average' | 'unique';
  window: string; // e.g., '7d', '30d'
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private segments: Map<string, UserSegment> = new Map();
  private experiments: Map<string, Experiment> = new Map();
  private userCache: Map<string, any> = new Map();
  private observers: Set<FeatureFlagObserver> = new Set();

  constructor() {
    this.initializeDefaultFlags();
  }

  /**
   * Register a new feature flag
   */
  registerFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    this.validateFlag(flag);
  }

  /**
   * Update feature flag
   */
  updateFlag(flagId: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      const updatedFlag = {
        ...flag,
        ...updates,
        metadata: {
          ...flag.metadata,
          updatedAt: new Date(),
          version: flag.metadata.version + 1
        }
      };
      this.flags.set(flagId, updatedFlag);
      this.notifyObservers('flag_updated', updatedFlag);
    }
  }

  /**
   * Get feature flag
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return Array.from(this.flags.values()).find(flag => flag.key === flagKey);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get flags by status
   */
  getFlagsByStatus(status: FeatureFlag['status']): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => flag.status === status);
  }

  /**
   * Evaluate feature flag for user
   */
  evaluateFlag(
    flagKey: string, 
    userId: string, 
    userProperties: Record<string, any> = {},
    context: Record<string, any> = {}
  ): any {
    const flag = this.getFlag(flagKey);
    if (!flag) {
      return null;
    }

    // Check if flag is active
    if (flag.status !== 'active') {
      return flag.configuration.defaultValue;
    }

    // Check environment
    if (!this.checkEnvironment(flag, context.environment)) {
      return flag.configuration.defaultValue;
    }

    // Check dependencies
    if (flag.dependencies && !this.checkDependencies(flag.dependencies, userId, userProperties, context)) {
      return flag.configuration.defaultValue;
    }

    // Check conditions
    const conditionResult = this.evaluateConditions(flag.configuration.conditions || [], userProperties, context);
    if (conditionResult !== null) {
      return conditionResult;
    }

    // Check targeting rules
    if (!this.checkTargetingRules(flag.targeting, userId, userProperties, context)) {
      return flag.configuration.defaultValue;
    }

    // Apply flag logic based on type
    return this.applyFlagLogic(flag, userId, userProperties, context);
  }

  /**
   * Apply flag logic based on type
   */
  private applyFlagLogic(
    flag: FeatureFlag,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): any {
    switch (flag.type) {
      case 'boolean':
        return this.evaluateBooleanFlag(flag, userId, userProperties, context);

      case 'percentage':
        return this.evaluatePercentageFlag(flag, userId, userProperties, context);

      case 'user_list':
        return this.evaluateUserListFlag(flag, userId, userProperties, context);

      case 'segment':
        return this.evaluateSegmentFlag(flag, userId, userProperties, context);

      case 'gradual_rollout':
        return this.evaluateGradualRolloutFlag(flag, userId, userProperties, context);

      default:
        return flag.configuration.defaultValue;
    }
  }

  /**
   * Evaluate boolean flag
   */
  private evaluateBooleanFlag(
    flag: FeatureFlag,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    const variant = this.selectVariant(flag, userId);
    return variant ? Boolean(variant.value) : flag.configuration.defaultValue;
  }

  /**
   * Evaluate percentage flag
   */
  private evaluatePercentageFlag(
    flag: FeatureFlag,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): any {
    const hash = this.hashUser(userId, flag.key);
    const percentage = (hash % 10000) / 100; // Convert to 0-100 scale

    if (flag.configuration.rollout?.percentage !== undefined) {
      return percentage < flag.configuration.rollout.percentage;
    }

    // Use variants if available
    const variant = this.selectVariant(flag, userId);
    return variant ? variant.value : flag.configuration.defaultValue;
  }

  /**
   * Evaluate user list flag
   */
  private evaluateUserListFlag(
    flag: FeatureFlag,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): any {
    const userList = flag.configuration.rollout?.users || [];
    return userList.includes(userId);
  }

  /**
   * Evaluate segment flag
   */
  private evaluateSegmentFlag(
    flag: FeatureFlag,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): any {
    const segments = flag.configuration.rollout?.segments || [];
    
    for (const segmentId of segments) {
      const segment = this.segments.get(segmentId);
      if (segment && this.userMatchesSegment(userProperties, segment)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate gradual rollout flag
   */
  private evaluateGradualRolloutFlag(
    flag: FeatureFlag,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): any {
    const schedule = flag.configuration.rollout?.schedule;
    if (!schedule) {
      return flag.configuration.defaultValue;
    }

    const now = new Date();
    if (now < schedule.startDate || now > schedule.endDate) {
      return flag.configuration.defaultValue;
    }

    // Check stages
    if (schedule.stages) {
      for (const stage of schedule.stages) {
        if (this.checkStageConditions(stage, userProperties, context)) {
          const hash = this.hashUser(userId, `${flag.key}_${stage.id}`);
          const percentage = (hash % 10000) / 100;
          return percentage < stage.percentage;
        }
      }
    }

    return false;
  }

  /**
   * Select variant for user
   */
  private selectVariant(flag: FeatureFlag, userId: string): FlagVariant | null {
    const variants = flag.configuration.variants;
    if (!variants || variants.length === 0) {
      return null;
    }

    // Hash user to determine variant
    const hash = this.hashUser(userId, flag.key);
    const bucket = hash % 10000; // 0-9999

    let currentWeight = 0;
    for (const variant of variants) {
      currentWeight += variant.weight * 100; // Convert percentage to absolute
      if (bucket < currentWeight) {
        return variant;
      }
    }

    return variants[0]; // Fallback to first variant
  }

  /**
   * Hash user ID for consistent bucketing
   */
  private hashUser(userId: string, key: string): number {
    const str = `${userId}_${key}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check environment
   */
  private checkEnvironment(flag: FeatureFlag, environment?: string): boolean {
    if (!environment) return true;

    switch (environment) {
      case 'development':
        return flag.environment.development;
      case 'staging':
        return flag.environment.staging;
      case 'production':
        return flag.environment.production;
      default:
        return true;
    }
  }

  /**
   * Check dependencies
   */
  private checkDependencies(
    dependencies: string[],
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    return dependencies.every(dep => {
      const depValue = this.evaluateFlag(dep, userId, userProperties, context);
      return Boolean(depValue);
    });
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: FlagCondition[],
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): any {
    // Sort conditions by priority (lower number = higher priority)
    const sortedConditions = [...conditions].sort((a, b) => a.priority - b.priority);

    for (const condition of sortedConditions) {
      try {
        const result = this.evaluateExpression(condition.expression, userProperties, context);
        if (result) {
          return condition.result;
        }
      } catch (error) {
        console.warn(`Failed to evaluate condition ${condition.id}:`, error);
      }
    }

    return null; // No condition matched
  }

  /**
   * Evaluate expression
   */
  private evaluateExpression(
    expression: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    // Simplified expression evaluation
    // In production, use a proper expression engine like json-logic
    
    try {
      // This is a very basic implementation
      // Replace with a proper expression parser
      const result = eval(expression);
      return Boolean(result);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check targeting rules
   */
  private checkTargetingRules(
    rules: TargetingRules,
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    // Check exclude rules first
    if (this.matchesRules(rules.exclude, userId, userProperties, context)) {
      return false;
    }

    // Check include rules
    if (this.matchesRules(rules.include, userId, userProperties, context)) {
      return true;
    }

    // If no specific include rules, allow by default
    return true;
  }

  /**
   * Check if user matches rules
   */
  private matchesRules(
    rules: TargetingRules['include'],
    userId: string,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    // Check user list
    if (rules.users && rules.users.includes(userId)) {
      return true;
    }

    // Check segments
    if (rules.segments) {
      for (const segmentId of rules.segments) {
        const segment = this.segments.get(segmentId);
        if (segment && this.userMatchesSegment(userProperties, segment)) {
          return true;
        }
      }
    }

    // Check countries
    if (rules.countries && rules.countries.includes(context.country || '')) {
      return true;
    }

    // Check devices
    if (rules.devices && rules.devices.includes(context.device || '')) {
      return true;
    }

    // Check custom properties
    if (rules.custom) {
      for (const [key, value] of Object.entries(rules.custom)) {
        if (userProperties[key] !== value) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Check if user matches segment
   */
  private userMatchesSegment(userProperties: Record<string, any>, segment: UserSegment): boolean {
    for (const rule of segment.rules) {
      const userValue = userProperties[rule.property];
      
      switch (rule.operator) {
        case 'equals':
          if (userValue !== rule.value) return false;
          break;
        case 'not_equals':
          if (userValue === rule.value) return false;
          break;
        case 'contains':
          if (!String(userValue).includes(String(rule.value))) return false;
          break;
        case 'not_contains':
          if (String(userValue).includes(String(rule.value))) return false;
          break;
        case 'greater_than':
          if (Number(userValue) <= Number(rule.value)) return false;
          break;
        case 'less_than':
          if (Number(userValue) >= Number(rule.value)) return false;
          break;
        case 'in':
          if (!rule.value.includes(userValue)) return false;
          break;
        case 'not_in':
          if (rule.value.includes(userValue)) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Check stage conditions
   */
  private checkStageConditions(
    stage: RolloutStage,
    userProperties: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    if (!stage.conditions) return true;

    const { userProperties: stageUserProps, environment: stageEnv } = stage.conditions;

    // Check user properties
    if (stageUserProps) {
      for (const [key, value] of Object.entries(stageUserProps)) {
        if (userProperties[key] !== value) {
          return false;
        }
      }
    }

    // Check environment
    if (stageEnv && !stageEnv.includes(context.environment || '')) {
      return false;
    }

    return true;
  }

  /**
   * Create user segment
   */
  createSegment(segment: UserSegment): void {
    this.segments.set(segment.id, segment);
    this.calculateSegmentSize(segment);
  }

  /**
   * Update user segment
   */
  updateSegment(segmentId: string, updates: Partial<UserSegment>): void {
    const segment = this.segments.get(segmentId);
    if (segment) {
      const updatedSegment = {
        ...segment,
        ...updates,
        updatedAt: new Date()
      };
      this.segments.set(segmentId, updatedSegment);
      this.calculateSegmentSize(updatedSegment);
    }
  }

  /**
   * Calculate segment size (simplified)
   */
  private calculateSegmentSize(segment: UserSegment): void {
    // This would typically involve querying a user database
    // For now, just set a placeholder value
    segment.size = 1000;
  }

  /**
   * Create experiment
   */
  createExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
  }

  /**
   * Get experiment
   */
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(exp => exp.status === 'running');
  }

  /**
   * Track event for metrics
   */
  trackEvent(
    event: string,
    userId: string,
    properties: Record<string, any> = {}
  ): void {
    // Update flag metrics
    this.updateFlagMetrics(event, userId, properties);
    
    // Update experiment metrics
    this.updateExperimentMetrics(event, userId, properties);
    
    this.notifyObservers('event_tracked', { event, userId, properties });
  }

  /**
   * Update flag metrics
   */
  private updateFlagMetrics(event: string, userId: string, properties: Record<string, any>): void {
    // This would typically update metrics in a database
    // For now, just log the event
    console.log(`Flag metrics: ${event}`, { userId, properties });
  }

  /**
   * Update experiment metrics
   */
  private updateExperimentMetrics(event: string, userId: string, properties: Record<string, any>): void {
    // This would typically update experiment metrics in a database
    // For now, just log the event
    console.log(`Experiment metrics: ${event}`, { userId, properties });
  }

  /**
   * Validate flag
   */
  private validateFlag(flag: FeatureFlag): void {
    if (!flag.key || !flag.id) {
      throw new Error('Flag must have both id and key');
    }

    // Check for duplicate keys
    const existing = this.getFlag(flag.key);
    if (existing && existing.id !== flag.id) {
      throw new Error(`Flag key '${flag.key}' already exists`);
    }

    // Validate configuration based on type
    this.validateFlagConfiguration(flag);
  }

  /**
   * Validate flag configuration
   */
  private validateFlagConfiguration(flag: FeatureFlag): void {
    const config = flag.configuration;

    switch (flag.type) {
      case 'boolean':
        // Boolean flags don't need additional validation
        break;

      case 'percentage':
        if (config.variants && config.variants.length > 0) {
          const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
          if (Math.abs(totalWeight - 100) > 0.01) {
            throw new Error('Percentage variant weights must sum to 100%');
          }
        }
        break;

      case 'gradual_rollout':
        if (!config.rollout?.schedule) {
          throw new Error('Gradual rollout flags must have a schedule');
        }
        break;
    }
  }

  /**
   * Subscribe to feature flag events
   */
  subscribe(observer: FeatureFlagObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from feature flag events
   */
  unsubscribe(observer: FeatureFlagObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify observers
   */
  private notifyObservers(event: string, data: any): void {
    this.observers.forEach(observer => observer.onEvent(event, data));
  }

  /**
   * Initialize default flags
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'enable-analytics',
        name: 'Enable Analytics',
        key: 'enable_analytics',
        description: 'Enable analytics tracking',
        type: 'boolean',
        configuration: {
          defaultValue: true
        },
        targeting: {
          include: {},
          exclude: {}
        },
        environment: {
          development: true,
          staging: true,
          production: true
        },
        metrics: {
          enabled: 0,
          disabled: 0
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: 1,
          tags: ['analytics', 'tracking']
        },
        status: 'active'
      }
    ];

    defaultFlags.forEach(flag => this.registerFlag(flag));
  }
}

export interface FeatureFlagObserver {
  onEvent(event: string, data: any): void;
}

// Export singleton instance
export const featureFlagManager = new FeatureFlagManager();