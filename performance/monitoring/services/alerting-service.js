/**
 * Alerting Service
 * Comprehensive alerting system with multiple notification channels, escalation, and management
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

class AlertingService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableEmailAlerts: options.enableEmailAlerts !== false,
      enableWebhookAlerts: options.enableWebhookAlerts !== false,
      enableSlackAlerts: options.enableSlackAlerts || false,
      enableSMSAlerts: options.enableSMSAlerts || false,
      enablePagerDutyAlerts: options.enablePagerDutyAlerts || false,
      enableInAppAlerts: options.enableInAppAlerts !== false,
      defaultNotificationTimeout: options.defaultNotificationTimeout || 30000, // 30 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000, // 5 seconds
      enableEscalation: options.enableEscalation !== false,
      escalationDelay: options.escalationDelay || 300000, // 5 minutes
      enableGrouping: options.enableGrouping !== false,
      groupingWindow: options.groupingWindow || 300000, // 5 minutes
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('AlertingService');
    this.db = null;
    
    // Alert rules and management
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.alertGroupings = new Map();
    
    // Notification channels
    this.emailTransporter = null;
    this.webhookClients = new Map();
    this.slackClients = new Map();
    this.smsClients = new Map();
    this.pagerDutyClient = null;
    
    // Alert statistics
    this.stats = {
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      escalatedAlerts: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      alertsBySeverity: {
        info: 0,
        warning: 0,
        critical: 0
      },
      alertsBySource: new Map(),
      alertResponseTime: 0,
      averageResolutionTime: 0
    };
    
    // Configuration
    this.severityLevels = ['info', 'warning', 'critical'];
    this.alertStates = ['active', 'acknowledged', 'resolved', 'suppressed'];
    this.notificationChannels = ['email', 'webhook', 'slack', 'sms', 'pagerduty', 'inapp'];
    
    // Performance monitoring
    this.counters = {
      alertsTriggered: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      escalationsTriggered: 0,
      acknowledgmentsReceived: 0,
      resolutionsCompleted: 0,
      alertGroupingsCreated: 0
    };
    
    // Alert deduplication
    this.recentAlerts = new Map(); // fingerprint -> last alert time
    this.alertFingerprints = new Map();
    
    // Start time
    this.startTime = Date.now();
  }

  /**
   * Initialize the alerting service
   */
  async initialize() {
    try {
      this.logger.info('Initializing Alerting Service...');
      
      // Initialize database connection
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Initialize notification channels
      await this.initializeNotificationChannels();
      
      // Load alert rules
      await this.loadAlertRules();
      
      // Start background tasks
      this.startBackgroundTasks();
      
      this.logger.info('Alerting Service initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Alerting Service:', error);
      throw error;
    }
  }

  /**
   * Start the alerting service
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Alerting Service is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('Alerting Service started');
      
      // Start alert maintenance interval
      this.maintenanceInterval = setInterval(() => {
        this.performMaintenance();
      }, 60000); // Every minute
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldAlerts();
      }, 3600000); // Every hour
      
      this.emit('started', {
        timestamp: new Date().toISOString(),
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start Alerting Service:', error);
      throw error;
    }
  }

  /**
   * Stop the alerting service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    for (const interval of [this.maintenanceInterval, this.cleanupInterval]) {
      if (interval) clearInterval(interval);
    }
    
    this.logger.info('Alerting Service stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Initialize notification channels
   */
  async initializeNotificationChannels() {
    try {
      // Initialize email
      if (this.options.enableEmailAlerts) {
        await this.initializeEmailChannel();
      }
      
      // Initialize webhook
      if (this.options.enableWebhookAlerts) {
        await this.initializeWebhookChannel();
      }
      
      // Initialize Slack
      if (this.options.enableSlackAlerts) {
        await this.initializeSlackChannel();
      }
      
      // Initialize SMS
      if (this.options.enableSMSAlerts) {
        await this.initializeSMSChannel();
      }
      
      // Initialize PagerDuty
      if (this.options.enablePagerDutyAlerts) {
        await this.initializePagerDutyChannel();
      }
      
    } catch (error) {
      this.logger.error('Failed to initialize notification channels:', error);
    }
  }

  /**
   * Initialize email notification channel
   */
  async initializeEmailChannel() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });
      
      this.logger.info('Email notification channel initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize email channel:', error);
    }
  }

  /**
   * Initialize webhook notification channel
   */
  async initializeWebhookChannel() {
    try {
      // Webhook clients are created per alert
      this.logger.info('Webhook notification channel initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize webhook channel:', error);
    }
  }

  /**
   * Initialize Slack notification channel
   */
  async initializeSlackChannel() {
    try {
      // Slack clients are created per alert
      this.logger.info('Slack notification channel initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize Slack channel:', error);
    }
  }

  /**
   * Initialize SMS notification channel
   */
  async initializeSMSChannel() {
    try {
      // SMS clients are created per alert
      this.logger.info('SMS notification channel initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize SMS channel:', error);
    }
  }

  /**
   * Initialize PagerDuty notification channel
   */
  async initializePagerDutyChannel() {
    try {
      // PagerDuty integration is configured per alert
      this.logger.info('PagerDuty notification channel initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize PagerDuty channel:', error);
    }
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(alertData) {
    try {
      // Create alert fingerprint for deduplication
      const fingerprint = this.generateAlertFingerprint(alertData);
      
      // Check for duplicate alerts
      if (this.shouldDeduplicateAlert(alertData, fingerprint)) {
        this.logger.debug('Alert deduplicated', { fingerprint });
        return;
      }
      
      // Create alert record
      const alert = await this.createAlertRecord(alertData, fingerprint);
      
      // Store alert
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);
      this.recentAlerts.set(fingerprint, Date.now());
      
      // Update statistics
      this.updateAlertStats(alert);
      
      // Group similar alerts
      if (this.options.enableGrouping) {
        await this.groupAlert(alert);
      }
      
      // Send notifications
      await this.sendNotifications(alert);
      
      // Check for escalation
      if (this.options.enableEscalation) {
        this.scheduleEscalation(alert);
      }
      
      this.counters.alertsTriggered++;
      this.emit('alertTriggered', alert);
      
      this.logger.info('Alert triggered', {
        id: alert.id,
        rule: alertData.rule,
        severity: alertData.severity,
        metric: alertData.metric
      });
      
    } catch (error) {
      this.logger.error('Error triggering alert:', error);
    }
  }

  /**
   * Create alert record
   */
  async createAlertRecord(alertData, fingerprint) {
    const alert = {
      id: uuidv4(),
      fingerprint,
      rule: alertData.rule,
      metric: alertData.metric,
      value: alertData.value,
      threshold: alertData.threshold,
      severity: alertData.severity,
      source: alertData.source,
      timestamp: new Date(),
      state: 'active',
      acknowledgment: null,
      resolution: null,
      context: alertData.context || {},
      tags: alertData.tags || {},
      metadata: {
        ...alertData,
        triggeredAt: new Date().toISOString()
      },
      notifications: [],
      escalations: [],
      grouping: null
    };
    
    // Store in database
    if (this.db) {
      await this.storeAlertInDatabase(alert);
    }
    
    return alert;
  }

  /**
   * Send notifications for an alert
   */
  async sendNotifications(alert) {
    const notifications = [];
    
    try {
      // Determine notification channels based on severity and configuration
      const channels = this.determineNotificationChannels(alert);
      
      // Send notifications to each channel
      for (const channel of channels) {
        try {
          const notification = await this.sendNotification(alert, channel);
          notifications.push(notification);
          alert.notifications.push(notification);
          this.counters.notificationsSent++;
        } catch (error) {
          this.logger.error(`Failed to send ${channel} notification:`, error);
          notifications.push({
            channel,
            status: 'failed',
            error: error.message,
            timestamp: new Date()
          });
          this.counters.notificationsFailed++;
        }
      }
      
      // Update alert with notification results
      await this.updateAlertNotifications(alert);
      
    } catch (error) {
      this.logger.error('Error sending notifications:', error);
    }
    
    return notifications;
  }

  /**
   * Send notification to a specific channel
   */
  async sendNotification(alert, channel) {
    const notification = {
      id: uuidv4(),
      channel,
      alertId: alert.id,
      timestamp: new Date(),
      status: 'pending'
    };
    
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert);
          break;
        case 'slack':
          await this.sendSlackNotification(alert);
          break;
        case 'sms':
          await this.sendSMSNotification(alert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(alert);
          break;
        case 'inapp':
          await this.sendInAppNotification(alert);
          break;
        default:
          throw new Error(`Unknown notification channel: ${channel}`);
      }
      
      notification.status = 'sent';
      notification.sentAt = new Date();
      
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      notification.failedAt = new Date();
      throw error;
    }
    
    return notification;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(alert) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not initialized');
    }
    
    const recipients = this.getEmailRecipients(alert);
    const subject = this.formatEmailSubject(alert);
    const html = this.formatEmailBody(alert);
    
    const mailOptions = {
      from: process.env.ALERT_EMAIL_FROM || 'alerts@performance-monitoring.com',
      to: recipients.join(', '),
      subject,
      html
    };
    
    await this.emailTransporter.sendMail(mailOptions);
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(alert) {
    const webhookUrl = this.getWebhookUrl(alert);
    if (!webhookUrl) {
      throw new Error('No webhook URL configured');
    }
    
    const payload = {
      alert: {
        id: alert.id,
        rule: alert.rule,
        metric: alert.metric,
        value: alert.value,
        severity: alert.severity,
        timestamp: alert.timestamp,
        source: alert.source
      },
      context: alert.context,
      metadata: alert.metadata
    };
    
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET || ''}`,
        ...this.getWebhookHeaders(alert)
      },
      timeout: this.options.defaultNotificationTimeout
    };
    
    await axios.post(webhookUrl, payload, config);
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(alert) {
    const slackWebhook = this.getSlackWebhook(alert);
    if (!slackWebhook) {
      throw new Error('No Slack webhook configured');
    }
    
    const payload = {
      text: this.formatSlackMessage(alert),
      attachments: [
        {
          color: this.getSlackColor(alert.severity),
          fields: [
            {
              title: 'Metric',
              value: alert.metric,
              short: true
            },
            {
              title: 'Value',
              value: alert.value.toString(),
              short: true
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true
            },
            {
              title: 'Source',
              value: alert.source,
              short: true
            }
          ],
          footer: 'Performance Monitoring System',
          ts: Math.floor(alert.timestamp.getTime() / 1000)
        }
      ]
    };
    
    await axios.post(slackWebhook, payload, {
      timeout: this.options.defaultNotificationTimeout
    });
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(alert) {
    // This would integrate with an SMS service like Twilio
    // For now, just log the SMS that would be sent
    const recipients = this.getSMSRecipients(alert);
    const message = this.formatSMSMessage(alert);
    
    this.logger.info('SMS notification would be sent', {
      recipients,
      message,
      alertId: alert.id
    });
    
    // In a real implementation, you would call the SMS API here
    // await twilioClient.messages.create({
    //   from: process.env.SMS_FROM_NUMBER,
    //   to: recipient,
    //   body: message
    // });
  }

  /**
   * Send PagerDuty notification
   */
  async sendPagerDutyNotification(alert) {
    const integrationKey = this.getPagerDutyIntegrationKey(alert);
    if (!integrationKey) {
      throw new Error('No PagerDuty integration key configured');
    }
    
    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      dedup_key: alert.fingerprint,
      payload: {
        summary: `${alert.severity.toUpperCase()}: ${alert.rule} - ${alert.metric}`,
        source: alert.source,
        severity: this.mapSeverityToPagerDuty(alert.severity),
        component: 'performance-monitoring',
        group: alert.source,
        class: alert.rule,
        custom_details: {
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          context: alert.context
        }
      }
    };
    
    const response = await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
      timeout: this.options.defaultNotificationTimeout
    });
    
    return response.data;
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(alert) {
    // Emit event for in-app notifications
    this.emit('inAppNotification', {
      alert,
      timestamp: new Date()
    });
  }

  /**
   * Determine notification channels for an alert
   */
  determineNotificationChannels(alert) {
    const channels = [];
    
    // Critical alerts go to all channels
    if (alert.severity === 'critical') {
      if (this.options.enableEmailAlerts) channels.push('email');
      if (this.options.enableWebhookAlerts) channels.push('webhook');
      if (this.options.enableSlackAlerts) channels.push('slack');
      if (this.options.enableSMSAlerts) channels.push('sms');
      if (this.options.enablePagerDutyAlerts) channels.push('pagerduty');
      if (this.options.enableInAppAlerts) channels.push('inapp');
    } 
    // Warning alerts go to primary channels
    else if (alert.severity === 'warning') {
      if (this.options.enableEmailAlerts) channels.push('email');
      if (this.options.enableWebhookAlerts) channels.push('webhook');
      if (this.options.enableSlackAlerts) channels.push('slack');
      if (this.options.enableInAppAlerts) channels.push('inapp');
    }
    // Info alerts go to in-app only
    else {
      if (this.options.enableInAppAlerts) channels.push('inapp');
    }
    
    return channels;
  }

  /**
   * Generate alert fingerprint for deduplication
   */
  generateAlertFingerprint(alertData) {
    const key = `${alertData.rule}|${alertData.metric}|${alertData.source}|${alertData.severity}`;
    const crypto = require('crypto');
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Check if alert should be deduplicated
   */
  shouldDeduplicateAlert(alertData, fingerprint) {
    const lastAlertTime = this.recentAlerts.get(fingerprint);
    const now = Date.now();
    
    // Deduplicate alerts within the grouping window
    if (lastAlertTime && (now - lastAlertTime) < this.options.groupingWindow) {
      return true;
    }
    
    return false;
  }

  /**
   * Group similar alerts
   */
  async groupAlert(alert) {
    // Find existing groups with the same fingerprint
    const existingGroup = Array.from(this.alertGroupings.values())
      .find(group => group.fingerprint === alert.fingerprint && group.state === 'active');
    
    if (existingGroup) {
      // Add alert to existing group
      existingGroup.alerts.push(alert);
      existingGroup.lastUpdated = new Date();
      existingGroup.count++;
      
      this.counters.alertGroupingsCreated++;
      
      this.emit('alertGrouped', {
        group: existingGroup,
        alert
      });
      
    } else {
      // Create new group
      const group = {
        id: uuidv4(),
        fingerprint: alert.fingerprint,
        rule: alert.rule,
        severity: alert.severity,
        source: alert.source,
        state: 'active',
        alerts: [alert],
        firstAlert: alert.timestamp,
        lastUpdated: alert.timestamp,
        count: 1
      };
      
      this.alertGroupings.set(group.id, group);
      alert.grouping = group.id;
      
      this.counters.alertGroupingsCreated++;
      
      this.emit('alertGroupCreated', group);
    }
  }

  /**
   * Schedule alert escalation
   */
  scheduleEscalation(alert) {
    setTimeout(() => {
      this.escalateAlert(alert);
    }, this.options.escalationDelay);
  }

  /**
   * Escalate an alert
   */
  async escalateAlert(alert) {
    if (alert.state !== 'active') {
      return; // Don't escalate non-active alerts
    }
    
    try {
      const escalation = {
        id: uuidv4(),
        alertId: alert.id,
        level: alert.escalations.length + 1,
        timestamp: new Date(),
        reason: 'timeout',
        channels: this.getEscalationChannels(alert)
      };
      
      alert.escalations.push(escalation);
      
      // Send escalation notifications
      for (const channel of escalation.channels) {
        await this.sendEscalationNotification(alert, escalation, channel);
      }
      
      this.counters.escalationsTriggered++;
      this.emit('alertEscalated', {
        alert,
        escalation
      });
      
      this.logger.info('Alert escalated', {
        alertId: alert.id,
        escalationLevel: escalation.level
      });
      
    } catch (error) {
      this.logger.error('Error escalating alert:', error);
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      if (alert.state !== 'active') {
        throw new Error('Only active alerts can be acknowledged');
      }
      
      alert.state = 'acknowledged';
      alert.acknowledgment = {
        timestamp: new Date(),
        acknowledgedBy,
        notes
      };
      
      // Update in database
      if (this.db) {
        await this.updateAlertState(alertId, 'acknowledged', acknowledgedBy, notes);
      }
      
      this.counters.acknowledgmentsReceived++;
      this.emit('alertAcknowledged', {
        alert,
        acknowledgedBy,
        notes
      });
      
      this.logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy,
        notes
      });
      
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId, resolvedBy, notes = '') {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      alert.state = 'resolved';
      alert.resolution = {
        timestamp: new Date(),
        resolvedBy,
        notes
      };
      
      // Calculate resolution time
      alert.resolutionTime = alert.resolution.timestamp.getTime() - alert.timestamp.getTime();
      
      // Update in database
      if (this.db) {
        await this.updateAlertState(alertId, 'resolved', resolvedBy, notes, alert.resolutionTime);
      }
      
      // Remove from active alerts
      this.activeAlerts.delete(alertId);
      this.stats.resolvedAlerts++;
      this.counters.resolutionsCompleted++;
      
      this.emit('alertResolved', {
        alert,
        resolvedBy,
        notes
      });
      
      this.logger.info('Alert resolved', {
        alertId,
        resolvedBy,
        resolutionTime: alert.resolutionTime
      });
      
    } catch (error) {
      this.logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Suppress an alert
   */
  async suppressAlert(alertId, suppressedBy, duration, reason = '') {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      alert.state = 'suppressed';
      alert.suppression = {
        timestamp: new Date(),
        suppressedBy,
        duration,
        reason,
        expiresAt: new Date(Date.now() + duration)
      };
      
      // Update in database
      if (this.db) {
        await this.updateAlertState(alertId, 'suppressed', suppressedBy, reason);
      }
      
      // Schedule unsuppression
      setTimeout(() => {
        this.unsuppressAlert(alertId);
      }, duration);
      
      this.emit('alertSuppressed', {
        alert,
        suppressedBy,
        duration,
        reason
      });
      
      this.logger.info('Alert suppressed', {
        alertId,
        suppressedBy,
        duration,
        reason
      });
      
    } catch (error) {
      this.logger.error('Error suppressing alert:', error);
      throw error;
    }
  }

  /**
   * Unsuppress an alert
   */
  async unsuppressAlert(alertId) {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert || alert.state !== 'suppressed') {
        return;
      }
      
      alert.state = 'active';
      delete alert.suppression;
      
      // Update in database
      if (this.db) {
        await this.updateAlertState(alertId, 'active');
      }
      
      this.emit('alertUnsuppressed', {
        alert
      });
      
      this.logger.info('Alert unsuppressed', {
        alertId
      });
      
    } catch (error) {
      this.logger.error('Error unsuppressing alert:', error);
    }
  }

  /**
   * Store alert in database
   */
  async storeAlertInDatabase(alert) {
    try {
      const client = await this.db.getClient();
      
      await client.query(
        `INSERT INTO alert_events 
         (rule_id, triggered_at, triggered_value, threshold_value, duration_seconds, 
          severity, status, tags, metadata)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          alert.rule,
          alert.timestamp,
          alert.value,
          alert.threshold,
          0, // duration
          alert.severity,
          alert.state,
          JSON.stringify(alert.tags),
          JSON.stringify(alert.metadata)
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store alert in database:', error);
    }
  }

  /**
   * Update alert state in database
   */
  async updateAlertState(alertId, state, userId = null, notes = '', resolutionTime = null) {
    try {
      const client = await this.db.getClient();
      
      let query = 'UPDATE alert_events SET status = $1';
      const params = [state];
      
      if (state === 'acknowledged') {
        query += ', acknowledged_at = NOW(), acknowledged_by = $2';
        params.push(userId);
      } else if (state === 'resolved') {
        query += ', resolved_at = NOW(), resolved_by = $2, resolution_time_seconds = $3';
        params.push(userId, Math.floor(resolutionTime / 1000));
      }
      
      query += ' WHERE triggered_at >= NOW() - INTERVAL \'1 day\' AND status = $' + (params.length + 1);
      params.push('active');
      
      await client.query(query, params);
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to update alert state in database:', error);
    }
  }

  /**
   * Load alert rules from database
   */
  async loadAlertRules() {
    try {
      const client = await this.db.getClient();
      
      const result = await client.query(
        'SELECT * FROM alert_rules WHERE enabled = true'
      );
      
      for (const rule of result.rows) {
        this.alertRules.set(rule.id, {
          ...rule,
          parameters: JSON.parse(rule.parameters || '{}'),
          notification_channels: JSON.parse(rule.notification_channels || '[]'),
          escalation_rules: JSON.parse(rule.escalation_rules || '{}')
        });
      }
      
      await client.release();
      this.logger.info(`Loaded ${this.alertRules.size} alert rules`);
      
    } catch (error) {
      this.logger.error('Failed to load alert rules:', error);
    }
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Check for expired suppressions every minute
    cron.schedule('* * * * *', () => {
      this.checkExpiredSuppresssions();
    });
    
    // Clean up old alerts daily
    cron.schedule('0 0 * * *', () => {
      this.cleanupOldAlerts();
    });
  }

  /**
   * Check for expired suppressions
   */
  checkExpiredSuppresssions() {
    const now = new Date();
    
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.state === 'suppressed' && alert.suppression?.expiresAt <= now) {
        this.unsuppressAlert(alertId);
      }
    }
  }

  /**
   * Perform maintenance tasks
   */
  performMaintenance() {
    try {
      // Clean up old recent alerts map
      const now = Date.now();
      const maxAge = this.options.groupingWindow * 2;
      
      for (const [fingerprint, timestamp] of this.recentAlerts) {
        if (now - timestamp > maxAge) {
          this.recentAlerts.delete(fingerprint);
        }
      }
      
      // Update statistics
      this.stats.activeAlerts = this.activeAlerts.size;
      
    } catch (error) {
      this.logger.error('Error during maintenance:', error);
    }
  }

  /**
   * Clean up old alerts
   */
  cleanupOldAlerts() {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Clean up old alert history
      this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoffDate);
      
      // Clean up old alert groups
      for (const [groupId, group] of this.alertGroupings) {
        if (group.lastUpdated < cutoffDate) {
          this.alertGroupings.delete(groupId);
        }
      }
      
      this.logger.info('Cleaned up old alerts');
      
    } catch (error) {
      this.logger.error('Error cleaning up old alerts:', error);
    }
  }

  /**
   * Update alert statistics
   */
  updateAlertStats(alert) {
    this.stats.totalAlerts++;
    this.stats.alertsBySeverity[alert.severity]++;
    
    const sourceCount = this.stats.alertsBySource.get(alert.source) || 0;
    this.stats.alertsBySource.set(alert.source, sourceCount + 1);
  }

  // Helper methods for formatting and configuration

  getEmailRecipients(alert) {
    // This would get recipients based on alert configuration
    return (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean);
  }

  formatEmailSubject(alert) {
    return `[${alert.severity.toUpperCase()}] ${alert.rule} - ${alert.metric}`;
  }

  formatEmailBody(alert) {
    return `
      <h2>${alert.severity.toUpperCase()} Alert</h2>
      <p><strong>Rule:</strong> ${alert.rule}</p>
      <p><strong>Metric:</strong> ${alert.metric}</p>
      <p><strong>Value:</strong> ${alert.value}</p>
      <p><strong>Threshold:</strong> ${alert.threshold}</p>
      <p><strong>Source:</strong> ${alert.source}</p>
      <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
      ${alert.context ? `<p><strong>Context:</strong> ${JSON.stringify(alert.context)}</p>` : ''}
    `;
  }

  getWebhookUrl(alert) {
    return process.env.WEBHOOK_URL;
  }

  getWebhookHeaders(alert) {
    return {};
  }

  getSlackWebhook(alert) {
    return process.env.SLACK_WEBHOOK_URL;
  }

  formatSlackMessage(alert) {
    return `:warning: *${alert.severity.toUpperCase()} Alert*\n*${alert.rule}*\nMetric: ${alert.metric}\nValue: ${alert.value}\nThreshold: ${alert.threshold}`;
  }

  getSlackColor(severity) {
    switch (severity) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'good';
      default: return '#439FE0';
    }
  }

  getSMSRecipients(alert) {
    return (process.env.SMS_RECIPIENTS || '').split(',').filter(Boolean);
  }

  formatSMSMessage(alert) {
    return `${alert.severity.toUpperCase()}: ${alert.rule} - ${alert.metric}: ${alert.value} (threshold: ${alert.threshold})`;
  }

  getPagerDutyIntegrationKey(alert) {
    return process.env.PAGERDUTY_INTEGRATION_KEY;
  }

  mapSeverityToPagerDuty(severity) {
    switch (severity) {
      case 'critical': return 'critical';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'error';
    }
  }

  getEscalationChannels(alert) {
    // Return additional channels for escalation
    if (alert.severity === 'critical') {
      return ['pagerduty', 'sms', 'email'];
    }
    return ['email', 'slack'];
  }

  async sendEscalationNotification(alert, escalation, channel) {
    // Add escalation context to the alert
    const escalatedAlert = {
      ...alert,
      escalation: escalation,
      isEscalation: true
    };
    
    await this.sendNotification(escalatedAlert, channel);
  }

  updateAlertNotifications(alert) {
    // Update alert notifications in database
    // This would update the notification status in the database
  }

  /**
   * Get current alerting service status
   */
  getAlertingServiceStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      stats: {
        ...this.stats,
        alertsBySource: Object.fromEntries(this.stats.alertsBySource)
      },
      counters: this.counters,
      activeAlerts: this.activeAlerts.size,
      alertRules: this.alertRules.size,
      alertGroupings: this.alertGroupings.size
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId) {
    return this.activeAlerts.get(alertId);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }
}

module.exports = { AlertingService };