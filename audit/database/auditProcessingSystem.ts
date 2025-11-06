/**
 * Automated Audit Processing & Cron Jobs
 * Scheduled tasks for audit log analysis, user behavior updates, and compliance reporting
 */

import { createClient } from '@supabase/supabase-js';
import UserBehaviorAnalytics from '../analytics/userBehaviorAnalytics';
import SecurityAlertingSystem from '../alerts/securityAlertingSystem';
import ComplianceReportingSystem from '../reports/complianceReportingSystem';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // cron expression
  function: string; // function name to execute
  enabled: boolean;
  last_run?: Date;
  next_run?: Date;
  status: 'IDLE' | 'RUNNING' | 'FAILED' | 'COMPLETED';
  error_message?: string;
  execution_count: number;
  success_count: number;
}

class AuditProcessingSystem {
  private supabase: any;
  private analyticsEngine: UserBehaviorAnalytics;
  private alertingSystem: SecurityAlertingSystem;
  private reportingSystem: ComplianceReportingSystem;
  private runningTasks: Map<string, boolean> = new Map();

  constructor() {
    this.supabase = supabase;
    this.analyticsEngine = new UserBehaviorAnalytics();
    this.alertingSystem = new SecurityAlertingSystem();
    this.reportingSystem = new ComplianceReportingSystem();
    
    this.startScheduledTasks();
  }

  /**
   * Start all scheduled tasks
   */
  private startScheduledTasks(): void {
    console.log('Starting audit processing system...');
    
    // Initialize default scheduled tasks
    this.initializeDefaultTasks();
    
    // Start the main scheduler loop
    this.runSchedulerLoop();
    
    console.log('Audit processing system started');
  }

  /**
   * Initialize default scheduled tasks
   */
  private async initializeDefaultTasks(): Promise<void> {
    const defaultTasks: Partial<ScheduledTask>[] = [
      {
        name: 'Update User Behavior Analytics',
        description: 'Update user behavior analytics for all active users',
        schedule: '0 */2 * * *', // Every 2 hours
        function: 'updateUserBehaviorAnalytics',
        enabled: true
      },
      {
        name: 'Run Anomaly Detection',
        description: 'Run anomaly detection for all users',
        schedule: '0 */4 * * *', // Every 4 hours
        function: 'runAnomalyDetection',
        enabled: true
      },
      {
        name: 'Clean Old Audit Logs',
        description: 'Archive or delete old audit logs (older than 1 year)',
        schedule: '0 2 * * 0', // Every Sunday at 2 AM
        function: 'cleanOldAuditLogs',
        enabled: true
      },
      {
        name: 'Generate Daily Security Report',
        description: 'Generate daily security summary report',
        schedule: '0 6 * * *', // Every day at 6 AM
        function: 'generateDailySecurityReport',
        enabled: true
      },
      {
        name: 'Check Failed Login Patterns',
        description: 'Check for suspicious failed login patterns',
        schedule: '*/15 * * * *', // Every 15 minutes
        function: 'checkFailedLoginPatterns',
        enabled: true
      },
      {
        name: 'Update Risk Scores',
        description: 'Update risk scores for all users',
        schedule: '0 */6 * * *', // Every 6 hours
        function: 'updateRiskScores',
        enabled: true
      },
      {
        name: 'Generate Weekly Compliance Report',
        description: 'Generate weekly compliance summary',
        schedule: '0 8 * * 1', // Every Monday at 8 AM
        function: 'generateWeeklyComplianceReport',
        enabled: true
      },
      {
        name: 'Health Check',
        description: 'System health check and monitoring',
        schedule: '*/5 * * * *', // Every 5 minutes
        function: 'systemHealthCheck',
        enabled: true
      }
    ];

    for (const task of defaultTasks) {
      try {
        const { data, error } = await this.supabase
          .from('scheduled_tasks')
          .insert(task)
          .select()
          .single();

        if (!error && data) {
          console.log(`Created scheduled task: ${task.name}`);
        }
      } catch (error) {
        console.error(`Failed to create task ${task.name}:`, error);
      }
    }
  }

  /**
   * Main scheduler loop
   */
  private runSchedulerLoop(): void {
    // Check for tasks to run every minute
    setInterval(async () => {
      try {
        await this.checkAndExecuteScheduledTasks();
      } catch (error) {
        console.error('Scheduler loop error:', error);
      }
    }, 60 * 1000); // Every minute

    // Run immediately
    this.checkAndExecuteScheduledTasks();
  }

  /**
   * Check and execute due scheduled tasks
   */
  private async checkAndExecuteScheduledTasks(): Promise<void> {
    const now = new Date();
    
    // Get enabled tasks
    const { data: tasks } = await this.supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('enabled', true);

    if (!tasks) return;

    for (const task of tasks) {
      // Check if task should run now
      if (this.shouldTaskRunNow(task, now)) {
        await this.executeTask(task);
      }
    }
  }

  /**
   * Check if a task should run now based on its schedule
   */
  private shouldTaskRunNow(task: ScheduledTask, now: Date): boolean {
    if (this.runningTasks.get(task.id)) {
      return false; // Task is already running
    }

    // Simple cron parsing (for demonstration - use a proper cron library in production)
    const [minute, hour, day, month, dayOfWeek] = task.schedule.split(' ');
    
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentDayOfWeek = now.getDay();

    return this.matchesCronPattern(minute, currentMinute) &&
           this.matchesCronPattern(hour, currentHour) &&
           this.matchesCronPattern(day, currentDay) &&
           this.matchesCronPattern(month, currentMonth) &&
           this.matchesCronPattern(dayOfWeek, currentDayOfWeek);
  }

  /**
   * Check if a value matches a cron pattern
   */
  private matchesCronPattern(pattern: string, value: number): boolean {
    if (pattern === '*') return true;
    if (pattern.includes(',')) {
      return pattern.split(',').some(p => this.matchesCronPattern(p.trim(), value));
    }
    if (pattern.includes('/')) {
      const [base, interval] = pattern.split('/');
      if (base === '*') {
        return value % parseInt(interval) === 0;
      }
      return value % parseInt(interval) === 0 && value >= parseInt(base);
    }
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-');
      return value >= parseInt(start) && value <= parseInt(end);
    }
    return parseInt(pattern) === value;
  }

  /**
   * Execute a scheduled task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    console.log(`Executing task: ${task.name}`);
    
    // Mark task as running
    this.runningTasks.set(task.id, true);
    await this.updateTaskStatus(task.id, 'RUNNING');

    try {
      const startTime = new Date();
      
      // Execute the task function
      await this.executeTaskFunction(task.function);
      
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      // Update task success
      await this.updateTaskSuccess(task.id, executionTime);
      
      console.log(`Task ${task.name} completed in ${executionTime}ms`);
      
    } catch (error) {
      console.error(`Task ${task.name} failed:`, error);
      
      // Update task failure
      await this.updateTaskFailure(task.id, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      // Mark task as not running
      this.runningTasks.delete(task.id);
      await this.updateTaskStatus(task.id, 'COMPLETED');
    }
  }

  /**
   * Execute a specific task function
   */
  private async executeTaskFunction(functionName: string): Promise<void> {
    switch (functionName) {
      case 'updateUserBehaviorAnalytics':
        await this.updateUserBehaviorAnalytics();
        break;
        
      case 'runAnomalyDetection':
        await this.runAnomalyDetection();
        break;
        
      case 'cleanOldAuditLogs':
        await this.cleanOldAuditLogs();
        break;
        
      case 'generateDailySecurityReport':
        await this.generateDailySecurityReport();
        break;
        
      case 'checkFailedLoginPatterns':
        await this.checkFailedLoginPatterns();
        break;
        
      case 'updateRiskScores':
        await this.updateRiskScores();
        break;
        
      case 'generateWeeklyComplianceReport':
        await this.generateWeeklyComplianceReport();
        break;
        
      case 'systemHealthCheck':
        await this.systemHealthCheck();
        break;
        
      default:
        throw new Error(`Unknown task function: ${functionName}`);
    }
  }

  /**
   * Update user behavior analytics for all users
   */
  private async updateUserBehaviorAnalytics(): Promise<void> {
    console.log('Updating user behavior analytics...');
    
    // Get all users with recent activity
    const { data: users } = await this.supabase
      .from('auth.users')
      .select('id')
      .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!users) return;

    let processed = 0;
    for (const user of users) {
      try {
        await this.analyticsEngine.analyzeUserBehavior(user.id, 1); // Last 24 hours
        processed++;
        
        // Update progress every 10 users
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${users.length} users`);
        }
      } catch (error) {
        console.error(`Failed to update analytics for user ${user.id}:`, error);
      }
    }
    
    console.log(`Updated behavior analytics for ${processed} users`);
  }

  /**
   * Run anomaly detection for all users
   */
  private async runAnomalyDetection(): Promise<void> {
    console.log('Running anomaly detection...');
    
    await this.analyticsEngine.runBatchAnomalyDetection();
    
    console.log('Anomaly detection completed');
  }

  /**
   * Clean old audit logs
   */
  private async cleanOldAuditLogs(): Promise<void> {
    console.log('Cleaning old audit logs...');
    
    const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    
    // Archive logs older than 1 year (in production, you might want to move them to cold storage)
    const { error: deleteError } = await this.supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (deleteError) {
      console.error('Failed to clean old audit logs:', deleteError);
      throw deleteError;
    }
    
    console.log('Old audit logs cleaned successfully');
  }

  /**
   * Generate daily security report
   */
  private async generateDailySecurityReport(): Promise<void> {
    console.log('Generating daily security report...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get security events from yesterday
    const { data: securityEvents } = await this.supabase
      .from('security_events')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    // Get failed login attempts from yesterday
    const { data: failedLogins } = await this.supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    // Generate summary
    const report = {
      date: yesterday.toISOString().split('T')[0],
      security_events: {
        total: securityEvents?.length || 0,
        by_severity: this.groupBy(securityEvents || [], 'severity'),
        unresolved: (securityEvents || []).filter(e => !e.resolved).length
      },
      failed_logins: {
        total: failedLogins?.length || 0,
        blocked_ips: (failedLogins || []).filter(l => l.blocked).length,
        unique_ips: new Set((failedLogins || []).map(l => l.ip_address)).size
      },
      generated_at: new Date().toISOString()
    };

    // Store the report
    await this.supabase
      .from('daily_security_reports')
      .insert({
        report_date: report.date,
        security_events: report.security_events,
        failed_logins: report.failed_logins,
        generated_at: report.generated_at
      });

    console.log('Daily security report generated');
  }

  /**
   * Check failed login patterns
   */
  private async checkFailedLoginPatterns(): Promise<void> {
    console.log('Checking failed login patterns...');
    
    // This would trigger the alerting system to check patterns
    // The alerting system is already running real-time monitoring
    
    // Additional pattern analysis can be added here
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: recentFailedLogins } = await this.supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString());

    if (recentFailedLogins && recentFailedLogins.length > 0) {
      // Analyze patterns
      const ipCounts = this.groupBy(recentFailedLogins, 'ip_address');
      const highActivityIPs = Object.entries(ipCounts).filter(([ip, count]) => count > 5);
      
      if (highActivityIPs.length > 0) {
        console.log(`Found ${highActivityIPs.length} IPs with high failed login activity`);
      }
    }
  }

  /**
   * Update risk scores for all users
   */
  private async updateRiskScores(): Promise<void> {
    console.log('Updating risk scores...');
    
    // This would update the risk scores in the user_behavior_analytics table
    const { data: users } = await this.supabase
      .from('user_behavior_analytics')
      .select('user_id, event_date')
      .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (users) {
      // Recalculate risk scores for users with recent activity
      const uniqueUsers = [...new Set(users.map(u => u.user_id))];
      
      for (const userId of uniqueUsers) {
        try {
          const metrics = await this.analyticsEngine.analyzeUserBehavior(userId, 7);
          
          // Update risk score in analytics table
          await this.supabase
            .from('user_behavior_analytics')
            .update({
              risk_score: metrics.riskScore,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('event_date', metrics.date);
            
        } catch (error) {
          console.error(`Failed to update risk score for user ${userId}:`, error);
        }
      }
    }
    
    console.log('Risk scores updated');
  }

  /**
   * Generate weekly compliance report
   */
  private async generateWeeklyComplianceReport(): Promise<void> {
    console.log('Generating weekly compliance report...');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const endDate = new Date();
    
    try {
      await this.reportingSystem.generateReport(
        'CUSTOM',
        startDate,
        endDate,
        'system', // System-generated report
        {
          customFindings: [
            {
              type: 'INFO',
              category: 'Weekly Summary',
              description: 'Automated weekly compliance summary',
              recommendation: 'Review compliance metrics regularly',
              severity: 'LOW',
              status: 'OPEN'
            }
          ],
          customMetrics: {
            report_period: '7 days',
            automation_level: '100%'
          }
        }
      );
    } catch (error) {
      console.error('Failed to generate weekly compliance report:', error);
    }
  }

  /**
   * System health check
   */
  private async systemHealthCheck(): Promise<void> {
    console.log('Running system health check...');
    
    const healthMetrics = {
      timestamp: new Date().toISOString(),
      database_connection: 'healthy',
      audit_logs_count: 0,
      security_events_count: 0,
      failed_logins_count: 0,
      active_scheduled_tasks: 0,
      system_load: 'normal'
    };

    try {
      // Check database connectivity
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        healthMetrics.database_connection = 'error';
      }

      // Get current counts
      const [auditCount, securityCount, failedLoginCount, taskCount] = await Promise.all([
        this.supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        this.supabase.from('security_events').select('*', { count: 'exact', head: true }),
        this.supabase.from('failed_login_attempts').select('*', { count: 'exact', head: true }),
        this.supabase.from('scheduled_tasks').select('*', { count: 'exact', head: true }).eq('enabled', true)
      ]);

      healthMetrics.audit_logs_count = auditCount.count || 0;
      healthMetrics.security_events_count = securityCount.count || 0;
      healthMetrics.failed_logins_count = failedLoginCount.count || 0;
      healthMetrics.active_scheduled_tasks = taskCount.count || 0;

      // Log health metrics
      await this.supabase
        .from('system_health_logs')
        .insert(healthMetrics);

    } catch (error) {
      console.error('Health check failed:', error);
      healthMetrics.database_connection = 'error';
    }
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(taskId: string, status: ScheduledTask['status']): Promise<void> {
    await this.supabase
      .from('scheduled_tasks')
      .update({ status })
      .eq('id', taskId);
  }

  /**
   * Update task success
   */
  private async updateTaskSuccess(taskId: string, executionTime: number): Promise<void> {
    await this.supabase
      .from('scheduled_tasks')
      .update({
        status: 'COMPLETED',
        last_run: new Date().toISOString(),
        execution_count: this.incrementField('execution_count'),
        success_count: this.incrementField('success_count')
      })
      .eq('id', taskId);
  }

  /**
   * Update task failure
   */
  private async updateTaskFailure(taskId: string, errorMessage: string): Promise<void> {
    await this.supabase
      .from('scheduled_tasks')
      .update({
        status: 'FAILED',
        last_run: new Date().toISOString(),
        error_message: errorMessage,
        execution_count: this.incrementField('execution_count')
      })
      .eq('id', taskId);
  }

  /**
   * Helper to increment a field (simplified for demo)
   */
  private incrementField(field: string): string {
    return `COALESCE(${field}, 0) + 1`;
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics(): Promise<any> {
    const { data: taskStats } = await this.supabase
      .from('scheduled_tasks')
      .select('status, enabled');

    const { data: healthLogs } = await this.supabase
      .from('system_health_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    return {
      scheduled_tasks: {
        total: taskStats?.length || 0,
        enabled: taskStats?.filter(t => t.enabled).length || 0,
        by_status: this.groupBy(taskStats || [], 'status')
      },
      recent_health: healthLogs || [],
      last_check: healthLogs?.[0]?.timestamp
    };
  }
}

export default AuditProcessingSystem;