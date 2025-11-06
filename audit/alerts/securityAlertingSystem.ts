/**
 * Security Alerting System
 * Real-time monitoring and alerting for security events
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AlertConfiguration {
  id: string;
  name: string;
  description: string;
  alert_type: string;
  conditions: AlertCondition[];
  severity_threshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  notification_channels: NotificationChannel[];
  cooldown_period: number; // in minutes
  last_triggered_at?: Date;
}

export interface AlertCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
  time_window?: number; // in minutes
  threshold?: number;
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  config: any;
}

export interface AlertEvent {
  alert_id: string;
  event_data: any;
  triggered_at: Date;
  message: string;
  severity: string;
  status: 'sent' | 'failed' | 'pending';
}

class SecurityAlertingSystem {
  private supabase: any;
  private alertCooldowns: Map<string, Date> = new Map();

  constructor() {
    this.supabase = supabase;
    this.startMonitoring();
  }

  /**
   * Start real-time monitoring for security events
   */
  private startMonitoring(): void {
    // Monitor security events table for changes
    this.supabase
      .channel('security-events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events'
        },
        (payload) => {
          this.handleSecurityEvent(payload.new);
        }
      )
      .subscribe();

    // Monitor failed login attempts
    this.supabase
      .channel('failed-logins-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'failed_login_attempts'
        },
        (payload) => {
          this.handleFailedLogin(payload.new);
        }
      )
      .subscribe();

    // Monitor audit logs for high-risk events
    this.supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          this.handleAuditEvent(payload.new);
        }
      )
      .subscribe();

    console.log('Security alerting system started');
  }

  /**
   * Handle security events and trigger appropriate alerts
   */
  private async handleSecurityEvent(event: any): Promise<void> {
    console.log('Processing security event:', event.event_type);

    // Get active alert configurations
    const { data: alertConfigs } = await this.getActiveAlertConfigs();

    for (const config of alertConfigs) {
      if (this.shouldTriggerAlert(config, event, 'security_event')) {
        await this.triggerAlert(config, event);
      }
    }
  }

  /**
   * Handle failed login attempts
   */
  private async handleFailedLogin(attempt: any): Promise<void> {
    console.log('Processing failed login attempt:', attempt.ip_address);

    // Check for brute force attack patterns
    await this.checkBruteForceAttempt(attempt);

    // Check for suspicious login patterns
    await this.checkSuspiciousLoginPatterns(attempt);

    // Get active alert configurations
    const { data: alertConfigs } = await this.getActiveAlertConfigs();

    for (const config of alertConfigs) {
      if (this.shouldTriggerAlert(config, attempt, 'failed_login')) {
        await this.triggerAlert(config, attempt);
      }
    }
  }

  /**
   * Handle audit events and detect anomalies
   */
  private async handleAuditEvent(event: any): Promise<void> {
    // Only process high-risk or unusual events
    if (event.risk_level === 'LOW' && event.status === 'SUCCESS') {
      return;
    }

    console.log('Processing audit event:', event.event_type);

    // Get active alert configurations
    const { data: alertConfigs } = await this.getActiveAlertConfigs();

    for (const config of alertConfigs) {
      if (this.shouldTriggerAlert(config, event, 'audit_event')) {
        await this.triggerAlert(config, event);
      }
    }
  }

  /**
   * Check for brute force attack patterns
   */
  private async checkBruteForceAttempt(attempt: any): Promise<void> {
    const timeWindow = 15; // minutes
    const threshold = 10; // attempts

    // Count failed login attempts from this IP in the last time window
    const { count } = await this.supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', attempt.ip_address)
      .gte('created_at', new Date(Date.now() - timeWindow * 60 * 1000).toISOString());

    if (count && count >= threshold) {
      // Create security event for brute force attack
      const { error } = await this.supabase
        .from('security_events')
        .insert({
          event_id: `brute_force_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          event_type: 'brute_force_attack',
          severity: 'CRITICAL',
          source_ip: attempt.ip_address,
          details: {
            attempts_in_window: count,
            time_window_minutes: timeWindow,
            target_email: attempt.email,
            user_agent: attempt.user_agent
          }
        });

      if (error) {
        console.error('Failed to log brute force security event:', error);
      }

      // Block the IP
      await this.blockIP(attempt.ip_address, 60); // Block for 1 hour
    }
  }

  /**
   * Check for suspicious login patterns
   */
  private async checkSuspiciousLoginPatterns(attempt: any): Promise<void> {
    // Check for multiple IPs accessing the same account
    if (attempt.email) {
      const { data: recentAttempts } = await this.supabase
        .from('failed_login_attempts')
        .select('ip_address')
        .eq('email', attempt.email)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentAttempts && recentAttempts.length > 0) {
        const uniqueIPs = new Set(recentAttempts.map(a => a.ip_address));
        
        if (uniqueIPs.size >= 3) {
          // Create security event for suspicious account access
          await this.supabase
            .from('security_events')
            .insert({
              event_id: `suspicious_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: attempt.user_id,
              event_type: 'suspicious_account_access',
              severity: 'HIGH',
              source_ip: attempt.ip_address,
              details: {
                unique_ips: Array.from(uniqueIPs),
                access_pattern: 'multiple_ips_same_account',
                email: attempt.email
              }
            });
        }
      }
    }

    // Check for rapid fire attempts from same IP
    const rapidAttempts = await this.supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('ip_address', attempt.ip_address)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('created_at', { ascending: false });

    if (rapidAttempts.data && rapidAttempts.data.length >= 5) {
      // Create security event for rapid fire attempts
      await this.supabase
        .from('security_events')
        .insert({
          event_id: `rapid_fire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          event_type: 'rapid_fire_attempts',
          severity: 'HIGH',
          source_ip: attempt.ip_address,
          details: {
            attempts_in_5_minutes: rapidAttempts.data.length,
            emails_targeted: [...new Set(rapidAttempts.data.map(a => a.email))],
            user_agent: attempt.user_agent
          }
        });
    }
  }

  /**
   * Check if an alert should be triggered
   */
  private shouldTriggerAlert(config: AlertConfiguration, event: any, eventType: string): boolean {
    // Check if alert is enabled
    if (!config.enabled) {
      return false;
    }

    // Check cooldown period
    if (config.last_triggered_at) {
      const timeSinceLastTrigger = Date.now() - config.last_triggered_at.getTime();
      const cooldownMs = config.cooldown_period * 60 * 1000;
      
      if (timeSinceLastTrigger < cooldownMs) {
        return false;
      }
    }

    // Check if event type matches alert configuration
    if (config.alert_type !== eventType && config.alert_type !== 'all') {
      return false;
    }

    // Check conditions
    return config.conditions.every(condition => {
      return this.evaluateCondition(condition, event);
    });
  }

  /**
   * Evaluate a single alert condition
   */
  private evaluateCondition(condition: AlertCondition, event: any): boolean {
    const fieldValue = this.getNestedValue(event, condition.field);
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(config: AlertConfiguration, event: any): Promise<void> {
    try {
      console.log(`Triggering alert: ${config.name}`);

      // Update last triggered time
      await this.supabase
        .from('alert_configurations')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', config.id);

      // Store alert event
      const alertEvent: AlertEvent = {
        alert_id: config.id,
        event_data: event,
        triggered_at: new Date(),
        message: this.generateAlertMessage(config, event),
        severity: this.getEventSeverity(event, config.severity_threshold),
        status: 'pending'
      };

      // Send notifications through all configured channels
      const notificationPromises = config.notification_channels.map(channel => 
        this.sendNotification(channel, alertEvent)
      );

      await Promise.allSettled(notificationPromises);

      // Update cooldown
      this.alertCooldowns.set(config.id, new Date());

    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(config: AlertConfiguration, event: any): string {
    let message = `Alert: ${config.name}\n\n`;
    message += `Description: ${config.description}\n`;
    message += `Event Type: ${event.event_type || event.type || 'Unknown'}\n`;
    message += `Severity: ${event.severity || event.risk_level || 'Unknown'}\n`;
    message += `Timestamp: ${new Date().toISOString()}\n\n`;
    message += `Event Details:\n${JSON.stringify(event, null, 2)}`;

    return message;
  }

  /**
   * Get event severity
   */
  private getEventSeverity(event: any, threshold: string): string {
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const eventSeverity = event.severity || event.risk_level || 'LOW';
    
    if (severityLevels.indexOf(eventSeverity) >= severityLevels.indexOf(threshold)) {
      return eventSeverity;
    }
    
    return threshold;
  }

  /**
   * Send notification through a specific channel
   */
  private async sendNotification(channel: NotificationChannel, alertEvent: AlertEvent): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel.config, alertEvent);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel.config, alertEvent);
          break;
        case 'slack':
          await this.sendSlackNotification(channel.config, alertEvent);
          break;
        case 'sms':
          await this.sendSMSNotification(channel.config, alertEvent);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(config: any, alertEvent: AlertEvent): Promise<void> {
    // Implementation would depend on email service (SendGrid, SES, etc.)
    console.log('Sending email notification:', config.to);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(config: any, alertEvent: AlertEvent): Promise<void> {
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          alert: alertEvent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook notification failed:', error);
      throw error;
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(config: any, alertEvent: AlertEvent): Promise<void> {
    try {
      const slackMessage = {
        channel: config.channel,
        text: `🚨 Security Alert: ${alertEvent.message}`,
        attachments: [
          {
            color: this.getSlackColor(alertEvent.severity),
            fields: [
              {
                title: 'Severity',
                value: alertEvent.severity,
                short: true
              },
              {
                title: 'Timestamp',
                value: alertEvent.triggered_at.toISOString(),
                short: true
              }
            ]
          }
        ]
      };

      const response = await fetch('https://hooks.slack.com/services/' + config.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackMessage)
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Slack notification failed:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(config: any, alertEvent: AlertEvent): Promise<void> {
    // Implementation would depend on SMS service (Twilio, etc.)
    console.log('Sending SMS notification to:', config.phoneNumber);
  }

  /**
   * Get Slack color based on severity
   */
  private getSlackColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'low': return 'good';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
      default: return '#439FE0';
    }
  }

  /**
   * Block IP address
   */
  private async blockIP(ipAddress: string, durationMinutes: number): Promise<void> {
    const blockUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    
    // Update all failed login attempts from this IP
    const { error } = await this.supabase
      .from('failed_login_attempts')
      .update({
        blocked: true,
        blocked_until: blockUntil
      })
      .eq('ip_address', ipAddress);

    if (error) {
      console.error('Failed to block IP:', error);
    } else {
      console.log(`Blocked IP ${ipAddress} until ${blockUntil}`);
    }
  }

  /**
   * Get active alert configurations
   */
  private async getActiveAlertConfigs(): Promise<AlertConfiguration[]> {
    const { data, error } = await this.supabase
      .from('alert_configurations')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('Failed to fetch alert configurations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create default alert configurations
   */
  async createDefaultAlerts(): Promise<void> {
    const defaultAlerts = [
      {
        name: 'Critical Security Events',
        description: 'Alerts for critical security events',
        alert_type: 'security_event',
        conditions: [{ field: 'severity', operator: 'eq', value: 'CRITICAL' }],
        severity_threshold: 'CRITICAL',
        enabled: true,
        notification_channels: [
          { type: 'webhook', config: { url: process.env.SECURITY_WEBHOOK_URL } },
          { type: 'email', config: { to: process.env.SECURITY_EMAIL } }
        ],
        cooldown_period: 15
      },
      {
        name: 'Brute Force Attack Detection',
        description: 'Detects brute force attack patterns',
        alert_type: 'failed_login',
        conditions: [{ field: 'event_type', operator: 'eq', value: 'brute_force_attack' }],
        severity_threshold: 'HIGH',
        enabled: true,
        notification_channels: [
          { type: 'webhook', config: { url: process.env.SECURITY_WEBHOOK_URL } },
          { type: 'slack', config: { webhook: process.env.SLACK_WEBHOOK, channel: '#security' } }
        ],
        cooldown_period: 30
      },
      {
        name: 'Multiple Failed Logins',
        description: 'Alerts when user has multiple failed login attempts',
        alert_type: 'failed_login',
        conditions: [
          { field: 'blocked', operator: 'eq', value: true }
        ],
        severity_threshold: 'MEDIUM',
        enabled: true,
        notification_channels: [
          { type: 'email', config: { to: process.env.SECURITY_EMAIL } }
        ],
        cooldown_period: 60
      },
      {
        name: 'High Risk User Activity',
        description: 'Alerts for high risk user behavior',
        alert_type: 'audit_event',
        conditions: [
          { field: 'risk_level', operator: 'in', value: ['HIGH', 'CRITICAL'] }
        ],
        severity_threshold: 'HIGH',
        enabled: true,
        notification_channels: [
          { type: 'webhook', config: { url: process.env.SECURITY_WEBHOOK_URL } }
        ],
        cooldown_period: 45
      }
    ];

    for (const alert of defaultAlerts) {
      const { error } = await this.supabase
        .from('alert_configurations')
        .insert(alert);

      if (error) {
        console.error('Failed to create default alert:', error);
      }
    }

    console.log('Default alert configurations created');
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(timeRange: string = '24h'): Promise<any> {
    const timeFilter = this.getTimeFilter(timeRange);
    
    const { data: recentAlerts } = await this.supabase
      .from('alert_configurations')
      .select('*')
      .gte('last_triggered_at', timeFilter);

    const { data: securityEvents } = await this.supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .gte('created_at', timeFilter);

    const { data: failedLogins } = await this.supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact' })
      .gte('created_at', timeFilter);

    return {
      timeRange,
      totalAlerts: recentAlerts?.length || 0,
      securityEventsCount: securityEvents?.length || 0,
      failedLoginCount: failedLogins?.length || 0,
      activeAlerts: recentAlerts?.filter(a => a.enabled).length || 0
    };
  }

  private getTimeFilter(timeRange: string): string {
    const now = new Date();
    
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }
}

export default SecurityAlertingSystem;