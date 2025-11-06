/**
 * User Behavior Analytics & Anomaly Detection Engine
 * Advanced analytics for detecting suspicious user behavior and system anomalies
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserBehaviorMetrics {
  userId: string;
  date: string;
  sessions: number;
  actions: number;
  uniqueResources: number;
  loginCount: number;
  failedLogins: number;
  avgSessionDuration: number;
  riskScore: number;
  patterns: UserPattern;
}

export interface UserPattern {
  accessTimes: number[]; // Hour of day (0-23)
  accessDays: number[]; // Day of week (0-6)
  resourceTypes: string[];
  accessFrequency: number;
  geoLocations: string[];
  deviceTypes: string[];
}

export interface AnomalyDetectionResult {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  description: string;
  baseline: any;
  current: any;
  deviation: number;
}

export interface SecurityEvent {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  details: any;
  timestamp: Date;
}

class UserBehaviorAnalytics {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Analyze user behavior for a specific user
   */
  async analyzeUserBehavior(userId: string, days: number = 30): Promise<UserBehaviorMetrics> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch user's audit logs
    const { data: auditLogs } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Fetch failed login attempts
    const { data: failedLogins } = await this.supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (!auditLogs) {
      throw new Error('Failed to fetch audit logs');
    }

    // Calculate metrics
    const metrics = this.calculateBehaviorMetrics(auditLogs, failedLogins || []);
    const patterns = this.analyzeUserPatterns(auditLogs);
    const riskScore = this.calculateRiskScore(metrics, patterns);

    return {
      userId,
      date: endDate.toISOString().split('T')[0],
      sessions: metrics.sessions,
      actions: metrics.actions,
      uniqueResources: metrics.uniqueResources,
      loginCount: metrics.loginCount,
      failedLogins: metrics.failedLogins,
      avgSessionDuration: metrics.avgSessionDuration,
      riskScore,
      patterns
    };
  }

  /**
   * Calculate behavior metrics from audit logs
   */
  private calculateBehaviorMetrics(auditLogs: any[], failedLogins: any[]): any {
    const metrics = {
      sessions: 0,
      actions: 0,
      uniqueResources: new Set(),
      loginCount: 0,
      failedLogins: failedLogins.length,
      sessionDurations: [] as number[],
      currentSession: null as any
    };

    // Group logs by session
    const sessionGroups = this.groupBySession(auditLogs);

    metrics.sessions = sessionGroups.length;
    metrics.actions = auditLogs.length;

    sessionGroups.forEach(session => {
      // Calculate session duration
      const sessionStart = new Date(session[0].timestamp);
      const sessionEnd = new Date(session[session.length - 1].timestamp);
      const duration = (sessionEnd.getTime() - sessionStart.getTime()) / 1000 / 60; // minutes
      metrics.sessionDurations.push(duration);

      // Count resources accessed in this session
      session.forEach(log => {
        if (log.resource_type) {
          metrics.uniqueResources.add(log.resource_type);
        }
        if (log.event_type === 'login') {
          metrics.loginCount++;
        }
      });
    });

    metrics.uniqueResources = metrics.uniqueResources.size;
    metrics.avgSessionDuration = metrics.sessionDurations.length > 0 
      ? metrics.sessionDurations.reduce((a, b) => a + b, 0) / metrics.sessionDurations.length 
      : 0;

    return metrics;
  }

  /**
   * Group audit logs by session
   */
  private groupBySession(auditLogs: any[]): any[][] {
    const sessions: any[][] = [];
    const sessionMap = new Map<string, any[]>();

    auditLogs.forEach(log => {
      const sessionId = log.session_id || 'no-session';
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(log);
    });

    sessionMap.forEach(sessionLogs => {
      // Sort by timestamp
      sessionLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      sessions.push(sessionLogs);
    });

    return sessions;
  }

  /**
   * Analyze user access patterns
   */
  private analyzeUserPatterns(auditLogs: any[]): UserPattern {
    const patterns: UserPattern = {
      accessTimes: new Array(24).fill(0),
      accessDays: new Array(7).fill(0),
      resourceTypes: [],
      accessFrequency: 0,
      geoLocations: [],
      deviceTypes: []
    };

    const resourceTypeSet = new Set<string>();
    const geoLocationSet = new Set<string>();
    const deviceTypeSet = new Set<string>();

    auditLogs.forEach(log => {
      const timestamp = new Date(log.timestamp);
      const hour = timestamp.getHours();
      const day = timestamp.getDay();

      patterns.accessTimes[hour]++;
      patterns.accessDays[day]++;

      if (log.resource_type) {
        resourceTypeSet.add(log.resource_type);
      }

      // Extract location from IP or user agent if available
      if (log.ip_address) {
        geoLocationSet.add(log.ip_address);
      }

      if (log.user_agent) {
        const deviceType = this.detectDeviceType(log.user_agent);
        deviceTypeSet.add(deviceType);
      }
    });

    patterns.resourceTypes = Array.from(resourceTypeSet);
    patterns.geoLocations = Array.from(geoLocationSet);
    patterns.deviceTypes = Array.from(deviceTypeSet);
    patterns.accessFrequency = auditLogs.length / (auditLogs.length > 0 ? 1 : 1); // Simplified for now

    return patterns;
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    if (/desktop/i.test(userAgent)) return 'desktop';
    return 'unknown';
  }

  /**
   * Calculate risk score based on metrics and patterns
   */
  private calculateRiskScore(metrics: any, patterns: UserPattern): number {
    let riskScore = 0;

    // Failed login ratio (40% weight)
    const totalLogins = metrics.loginCount + metrics.failedLogins;
    if (totalLogins > 0) {
      const failedRatio = metrics.failedLogins / totalLogins;
      riskScore += failedRatio * 0.4;
    }

    // Unusual access patterns (30% weight)
    const unusualAccessScore = this.calculateUnusualAccessScore(patterns);
    riskScore += unusualAccessScore * 0.3;

    // Session behavior (20% weight)
    const sessionScore = this.calculateSessionScore(metrics);
    riskScore += sessionScore * 0.2;

    // Resource access diversity (10% weight)
    const diversityScore = Math.min(patterns.resourceTypes.length / 10, 1) * 0.1;
    riskScore += diversityScore;

    return Math.min(riskScore, 1.0); // Cap at 1.0
  }

  /**
   * Calculate unusual access pattern score
   */
  private calculateUnusualAccessScore(patterns: UserPattern): number {
    const totalAccess = patterns.accessTimes.reduce((a, b) => a + b, 0);
    if (totalAccess === 0) return 0;

    // Check for off-hours access (outside 8 AM - 6 PM)
    const offHoursAccess = patterns.accessTimes.slice(0, 8).reduce((a, b) => a + b, 0) +
                          patterns.accessTimes.slice(18).reduce((a, b) => a + b, 0);
    
    const offHoursRatio = offHoursAccess / totalAccess;

    // Check for weekend access
    const weekendAccess = patterns.accessDays[0] + patterns.accessDays[6]; // Sunday + Saturday
    const weekendRatio = weekendAccess / totalAccess;

    // Calculate unusualness score
    return Math.min((offHoursRatio * 0.6) + (weekendRatio * 0.4), 1.0);
  }

  /**
   * Calculate session behavior score
   */
  private calculateSessionScore(metrics: any): number {
    if (metrics.sessions === 0) return 0;

    // Very short sessions might indicate automated behavior
    const shortSessions = metrics.sessionDurations.filter((duration: number) => duration < 5);
    const shortSessionRatio = shortSessions.length / metrics.sessionDurations.length;

    // Very long sessions might indicate session hijacking
    const longSessions = metrics.sessionDurations.filter((duration: number) => duration > 120);
    const longSessionRatio = longSessions.length / metrics.sessionDurations.length;

    return Math.min(shortSessionRatio * 0.7 + longSessionRatio * 0.3, 1.0);
  }

  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId: string, historicalDays: number = 30): Promise<AnomalyDetectionResult[]> {
    const currentMetrics = await this.analyzeUserBehavior(userId, 7); // Last 7 days
    const historicalMetrics = await this.analyzeUserBehavior(userId, historicalDays);

    const anomalies: AnomalyDetectionResult[] = [];

    // Detect unusual login patterns
    const loginAnomaly = this.detectLoginAnomaly(currentMetrics, historicalMetrics);
    if (loginAnomaly) anomalies.push(loginAnomaly);

    // Detect unusual access patterns
    const accessAnomaly = this.detectAccessAnomaly(currentMetrics, historicalMetrics);
    if (accessAnomaly) anomalies.push(accessAnomaly);

    // Detect unusual session patterns
    const sessionAnomaly = this.detectSessionAnomaly(currentMetrics, historicalMetrics);
    if (sessionAnomaly) anomalies.push(sessionAnomaly);

    // Detect resource access anomalies
    const resourceAnomaly = this.detectResourceAnomaly(currentMetrics, historicalMetrics);
    if (resourceAnomaly) anomalies.push(resourceAnomaly);

    return anomalies;
  }

  /**
   * Detect login-related anomalies
   */
  private detectLoginAnomaly(current: UserBehaviorMetrics, historical: UserBehaviorMetrics): AnomalyDetectionResult | null {
    const currentLoginRate = current.loginCount / 7; // per day
    const historicalLoginRate = historical.loginCount / 30;

    if (historicalLoginRate === 0 && currentLoginRate > 0) {
      return {
        type: 'UNUSUAL_LOGIN_ACTIVITY',
        severity: 'HIGH',
        confidence: 0.9,
        description: 'User has login activity when historically they had none',
        baseline: { loginRate: historicalLoginRate },
        current: { loginRate: currentLoginRate },
        deviation: 1.0
      };
    }

    const loginRateIncrease = currentLoginRate / historicalLoginRate;
    if (loginRateIncrease > 3) {
      return {
        type: 'EXCESSIVE_LOGIN_ATTEMPTS',
        severity: 'MEDIUM',
        confidence: 0.8,
        description: `Login rate increased by ${(loginRateIncrease * 100).toFixed(0)}%`,
        baseline: { loginRate: historicalLoginRate },
        current: { loginRate: currentLoginRate },
        deviation: (loginRateIncrease - 1) / 3
      };
    }

    // Check failed login ratio
    const currentFailureRate = current.failedLogins / (current.loginCount + current.failedLogins || 1);
    const historicalFailureRate = historical.failedLogins / (historical.loginCount + historical.failedLogins || 1);

    if (currentFailureRate > 0.5 && currentFailureRate > historicalFailureRate * 2) {
      return {
        type: 'HIGH_LOGIN_FAILURE_RATE',
        severity: 'HIGH',
        confidence: 0.85,
        description: 'Login failure rate is significantly higher than historical average',
        baseline: { failureRate: historicalFailureRate },
        current: { failureRate: currentFailureRate },
        deviation: currentFailureRate - historicalFailureRate
      };
    }

    return null;
  }

  /**
   * Detect access pattern anomalies
   */
  private detectAccessAnomaly(current: UserBehaviorMetrics, historical: UserBehaviorMetrics): AnomalyDetectionResult | null {
    const currentAccessTimes = current.patterns.accessTimes;
    const historicalAccessTimes = historical.patterns.accessTimes;

    // Check for unusual access hours
    const unusualAccessScore = this.calculateUnusualAccessScore(current.patterns);
    const historicalUnusualScore = this.calculateUnusualAccessScore(historical.patterns);

    if (unusualAccessScore > 0.3 && unusualAccessScore > historicalUnusualScore * 2) {
      return {
        type: 'UNUSUAL_ACCESS_TIMES',
        severity: 'MEDIUM',
        confidence: 0.75,
        description: 'User is accessing the system during unusual hours',
        baseline: { unusualAccessScore: historicalUnusualScore },
        current: { unusualAccessScore },
        deviation: unusualAccessScore - historicalUnusualScore
      };
    }

    // Check for unusual geographic access
    const currentLocations = current.patterns.geoLocations.length;
    const historicalLocations = historical.patterns.geoLocations.length;

    if (currentLocations > 1 && currentLocations > historicalLocations) {
      return {
        type: 'MULTIPLE_GEOGRAPHIC_LOCATIONS',
        severity: 'HIGH',
        confidence: 0.8,
        description: 'User is accessing from multiple geographic locations',
        baseline: { locations: historicalLocations },
        current: { locations: currentLocations },
        deviation: (currentLocations - historicalLocations) / 5
      };
    }

    return null;
  }

  /**
   * Detect session anomalies
   */
  private detectSessionAnomaly(current: UserBehaviorMetrics, historical: UserBehaviorMetrics): AnomalyDetectionResult | null {
    // Check for excessive session creation
    const currentSessionRate = current.sessions / 7; // per day
    const historicalSessionRate = historical.sessions / 30;

    if (currentSessionRate > historicalSessionRate * 2.5) {
      return {
        type: 'EXCESSIVE_SESSION_CREATION',
        severity: 'MEDIUM',
        confidence: 0.7,
        description: 'User is creating sessions at a rate significantly higher than normal',
        baseline: { sessionRate: historicalSessionRate },
        current: { sessionRate: currentSessionRate },
        deviation: (currentSessionRate - historicalSessionRate) / historicalSessionRate
      };
    }

    return null;
  }

  /**
   * Detect resource access anomalies
   */
  private detectResourceAnomaly(current: UserBehaviorMetrics, historical: UserBehaviorMetrics): AnomalyDetectionResult | null {
    // Check for access to new resource types
    const newResources = current.patterns.resourceTypes.filter(
      resource => !historical.patterns.resourceTypes.includes(resource)
    );

    if (newResources.length > 0 && newResources.length > historical.patterns.resourceTypes.length * 0.5) {
      return {
        type: 'NEW_RESOURCE_ACCESS',
        severity: 'MEDIUM',
        confidence: 0.6,
        description: `User accessed ${newResources.length} new resource types`,
        baseline: { resourceTypes: historical.patterns.resourceTypes },
        current: { newResources, resourceTypes: current.patterns.resourceTypes },
        deviation: newResources.length / current.patterns.resourceTypes.length
      };
    }

    return null;
  }

  /**
   * Run batch anomaly detection for all users
   */
  async runBatchAnomalyDetection(): Promise<void> {
    // Get all users with recent activity
    const { data: users } = await this.supabase
      .from('auth.users')
      .select('id');

    if (!users) return;

    for (const user of users) {
      try {
        const anomalies = await this.detectAnomalies(user.id);
        
        // Log detected anomalies
        for (const anomaly of anomalies) {
          await this.logAnomaly(user.id, anomaly);
        }

        // Update user behavior analytics
        await this.updateUserAnalytics(user.id);
      } catch (error) {
        console.error(`Error analyzing user ${user.id}:`, error);
      }
    }
  }

  /**
   * Log detected anomaly
   */
  private async logAnomaly(userId: string, anomaly: AnomalyDetectionResult): Promise<void> {
    const { error } = await this.supabase
      .from('anomaly_detection')
      .insert({
        event_id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        anomaly_type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        baseline_metrics: anomaly.baseline,
        current_metrics: anomaly.current,
        deviation_score: anomaly.deviation,
        confidence_level: anomaly.confidence,
        status: 'OPEN'
      });

    if (error) {
      console.error('Failed to log anomaly:', error);
    }
  }

  /**
   * Update user behavior analytics
   */
  private async updateUserAnalytics(userId: string): Promise<void> {
    const analytics = await this.analyzeUserBehavior(userId, 1); // Last 24 hours

    const { error } = await this.supabase
      .from('user_behavior_analytics')
      .upsert({
        user_id: userId,
        event_date: analytics.date,
        session_count: analytics.sessions,
        total_actions: analytics.actions,
        unique_resources_accessed: analytics.uniqueResources,
        avg_session_duration: analytics.avgSessionDuration ? `${analytics.avgSessionDuration} minutes` : null,
        login_count: analytics.loginCount,
        failed_login_count: analytics.failedLogins,
        risk_score: analytics.riskScore,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,event_date'
      });

    if (error) {
      console.error('Failed to update user analytics:', error);
    }
  }

  /**
   * Generate user behavior report
   */
  async generateUserReport(userId: string, days: number = 30): Promise<any> {
    const metrics = await this.analyzeUserBehavior(userId, days);
    const anomalies = await this.detectAnomalies(userId, days);
    
    return {
      userId,
      period: `${days} days`,
      metrics,
      anomalies,
      riskLevel: this.getRiskLevel(metrics.riskScore),
      recommendations: this.generateRecommendations(metrics, anomalies)
    };
  }

  /**
   * Get risk level based on score
   */
  private getRiskLevel(score: number): string {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(metrics: UserBehaviorMetrics, anomalies: AnomalyDetectionResult[]): string[] {
    const recommendations: string[] = [];

    if (metrics.riskScore > 0.7) {
      recommendations.push('Consider implementing additional authentication measures');
    }

    if (anomaly => anomalies.some(a => a.type === 'UNUSUAL_ACCESS_TIMES')) {
      recommendations.push('Review access patterns during off-hours');
    }

    if (metrics.failedLogins > 5) {
      recommendations.push('Investigate repeated login failures');
    }

    if (anomalies.length > 3) {
      recommendations.push('Schedule comprehensive security review');
    }

    return recommendations;
  }
}

export default UserBehaviorAnalytics;