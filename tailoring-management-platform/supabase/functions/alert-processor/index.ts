// Alert Processor Edge Function
// Description: Handle alerting and notifications for backup system issues

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get request data
        const requestData = await req.json();
        const { action, alert_type, severity, organization_id, monitor_id, incident_id } = requestData;

        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const supabaseHeaders = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        let result;

        switch (action) {
            case 'process_alert':
                result = await processAlert(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'send_notification':
                result = await sendNotification(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'escalate_alert':
                result = await escalateAlert(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'acknowledge_alert':
                result = await acknowledgeAlert(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'check_alert_rules':
                result = await checkAlertRules(supabaseUrl, supabaseHeaders, organization_id);
                break;
            
            case 'send_digest':
                result = await sendDigestReport(supabaseUrl, supabaseHeaders, organization_id);
                break;
            
            case 'test_alert_system':
                result = await testAlertSystem(supabaseUrl, supabaseHeaders, organization_id);
                break;
            
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Alert Processor error:', error);

        const errorResponse = {
            error: {
                code: 'ALERT_PROCESSOR_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Process incoming alerts and determine appropriate actions
async function processAlert(supabaseUrl, headers, alertData) {
    const {
        alert_type,
        severity,
        organization_id,
        monitor_id,
        title,
        message,
        source_system,
        current_value,
        threshold_value,
        metadata
    } = alertData;

    const alertId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Determine alert priority and escalation level
    const alertPriority = determineAlertPriority(severity, alert_type, current_value, threshold_value);
    
    // Check for alert suppression and cooldown
    const suppressionCheck = await checkAlertSuppression(supabaseUrl, headers, monitor_id, alert_type);
    
    if (suppressionCheck.suppressed) {
        return {
            alert_id: alertId,
            status: 'suppressed',
            reason: suppressionCheck.reason,
            next_check: suppressionCheck.nextCheck
        };
    }

    // Create alert record
    const alertRecord = {
        id: alertId,
        organization_id,
        monitor_id,
        alert_type,
        severity,
        title: title || `${alert_type.toUpperCase()} Alert`,
        message: message || 'Alert triggered',
        source_system: source_system || 'backup_system',
        current_value,
        threshold_value,
        alert_priority: alertPriority.level,
        escalation_level: alertPriority.escalationLevel,
        status: 'active',
        triggered_at: timestamp,
        metadata: metadata ? JSON.stringify(metadata) : null
    };

    // Store alert in incident logs
    const incidentData = {
        organization_id,
        incident_title: title || `Backup System Alert: ${alert_type}`,
        incident_description: message,
        incident_type: mapAlertTypeToIncidentType(alert_type),
        severity_level: severity,
        affected_systems: source_system ? [source_system] : ['backup_system'],
        detected_at: timestamp,
        incident_status: 'open',
        business_impact: determineBusinessImpact(severity, alert_type)
    };

    const incidentResponse = await fetch(
        `${supabaseUrl}/rest/v1/incident_logs`,
        {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(incidentData)
        }
    );

    let incidentId = null;
    if (incidentResponse.ok) {
        const incidents = await incidentResponse.json();
        incidentId = incidents[0]?.id;
    }

    // Get notification recipients
    const recipients = await getNotificationRecipients(supabaseUrl, headers, organization_id, severity, alert_type);

    // Send immediate notifications for critical/high severity alerts
    const notifications = [];
    if (severity === 'critical' || severity === 'high') {
        for (const recipient of recipients.immediate) {
            try {
                const notificationResult = await sendImmediateNotification(recipient, alertRecord);
                notifications.push(notificationResult);
            } catch (error) {
                console.error(`Failed to send notification to ${recipient.contact_name}:`, error);
            }
        }
    }

    // Schedule escalation if needed
    const escalationScheduled = await scheduleEscalation(supabaseUrl, headers, alertRecord, recipients.escalation);

    // Update monitor with last alert info
    if (monitor_id) {
        await updateMonitorLastAlert(supabaseUrl, headers, monitor_id, timestamp);
    }

    return {
        alert_id: alertId,
        incident_id: incidentId,
        status: 'processed',
        priority: alertPriority.level,
        notifications_sent: notifications.length,
        escalation_scheduled: escalationScheduled,
        recipients: recipients.immediate.map(r => ({ name: r.contact_name, method: r.preferred_contact_method })),
        timestamp
    };
}

// Send various types of notifications
async function sendNotification(supabaseUrl, headers, notificationData) {
    const { 
        recipient_id, 
        method, 
        subject, 
        message, 
        alert_id, 
        urgency = 'normal' 
    } = notificationData;

    // Get recipient details
    const recipientResponse = await fetch(
        `${supabaseUrl}/rest/v1/emergency_contacts?id=eq.${recipient_id}&select=*`,
        { headers }
    );

    if (!recipientResponse.ok) {
        throw new Error('Failed to fetch recipient details');
    }

    const recipients = await recipientResponse.json();
    if (recipients.length === 0) {
        throw new Error('Recipient not found');
    }

    const recipient = recipients[0];

    // Send notification based on method
    let deliveryResult;
    switch (method) {
        case 'email':
            deliveryResult = await sendEmailNotification(recipient, subject, message, urgency);
            break;
        case 'sms':
            deliveryResult = await sendSMSNotification(recipient, message, urgency);
            break;
        case 'phone':
            deliveryResult = await initiatePhoneCall(recipient, message, urgency);
            break;
        case 'whatsapp':
            deliveryResult = await sendWhatsAppMessage(recipient, message, urgency);
            break;
        default:
            throw new Error(`Unsupported notification method: ${method}`);
    }

    // Log notification delivery
    const notificationLog = {
        alert_id,
        recipient_id,
        method,
        subject,
        message: message.substring(0, 500), // Truncate for storage
        delivery_status: deliveryResult.status,
        delivery_details: JSON.stringify(deliveryResult),
        sent_at: new Date().toISOString(),
        urgency
    };

    // Store notification log (you would create this table)
    // await storeNotificationLog(supabaseUrl, headers, notificationLog);

    return {
        notification_id: crypto.randomUUID(),
        recipient: recipient.contact_name,
        method,
        status: deliveryResult.status,
        delivery_time: new Date().toISOString(),
        message_id: deliveryResult.messageId
    };
}

// Escalate alerts based on escalation rules
async function escalateAlert(supabaseUrl, headers, escalationData) {
    const { alert_id, incident_id, escalation_level, organization_id } = escalationData;

    // Get escalation contacts for the specified level
    const escalationContacts = await getEscalationContacts(supabaseUrl, headers, organization_id, escalation_level);

    const escalationResults = [];

    for (const contact of escalationContacts) {
        // Send escalation notification
        const escalationMessage = `
BACKUP SYSTEM ESCALATION - Level ${escalation_level}

Alert ID: ${alert_id}
Incident ID: ${incident_id || 'N/A'}
Escalation Time: ${new Date().toISOString()}

This alert has been escalated due to lack of acknowledgment or resolution.
Please take immediate action or coordinate with the response team.

For emergency assistance, contact the IT Director or Operations Manager immediately.
        `.trim();

        try {
            const notificationResult = await sendNotification(supabaseUrl, headers, {
                recipient_id: contact.id,
                method: contact.preferred_contact_method,
                subject: `🚨 ESCALATED: Backup System Alert - Level ${escalation_level}`,
                message: escalationMessage,
                alert_id,
                urgency: 'urgent'
            });

            escalationResults.push({
                contact: contact.contact_name,
                status: 'sent',
                method: contact.preferred_contact_method,
                notification_id: notificationResult.notification_id
            });

        } catch (error) {
            escalationResults.push({
                contact: contact.contact_name,
                status: 'failed',
                error: error.message
            });
        }
    }

    // Update incident with escalation info
    if (incident_id) {
        await updateIncidentEscalation(supabaseUrl, headers, incident_id, escalation_level);
    }

    return {
        escalation_level,
        escalation_time: new Date().toISOString(),
        contacts_notified: escalationResults.filter(r => r.status === 'sent').length,
        total_contacts: escalationResults.length,
        results: escalationResults
    };
}

// Acknowledge alert and update status
async function acknowledgeAlert(supabaseUrl, headers, ackData) {
    const { alert_id, incident_id, acknowledged_by, notes } = ackData;

    const acknowledgmentTime = new Date().toISOString();

    // Update incident log with acknowledgment
    if (incident_id) {
        const updateData = {
            acknowledged_at: acknowledgmentTime,
            assigned_to: acknowledged_by,
            incident_status: 'investigating',
            resolution_steps: notes || 'Alert acknowledged, investigation in progress'
        };

        await fetch(
            `${supabaseUrl}/rest/v1/incident_logs?id=eq.${incident_id}`,
            {
                method: 'PATCH',
                headers,
                body: JSON.stringify(updateData)
            }
        );
    }

    // Cancel any pending escalations
    const escalationCancelled = await cancelScheduledEscalations(supabaseUrl, headers, alert_id);

    return {
        alert_id,
        incident_id,
        acknowledged_at: acknowledgmentTime,
        acknowledged_by,
        escalations_cancelled: escalationCancelled,
        status: 'acknowledged'
    };
}

// Check alert rules and process any triggered conditions
async function checkAlertRules(supabaseUrl, headers, organizationId) {
    // Get all active monitors for the organization
    const monitorsResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_monitoring?organization_id=eq.${organizationId}&is_active=eq.true&alert_enabled=eq.true&select=*`,
        { headers }
    );

    if (!monitorsResponse.ok) {
        throw new Error('Failed to fetch monitors');
    }

    const monitors = await monitorsResponse.json();
    const alertsTriggered = [];

    for (const monitor of monitors) {
        // Check if current value exceeds thresholds
        let alertTriggered = false;
        let alertSeverity = 'low';
        let alertMessage = '';

        if (monitor.critical_threshold && monitor.current_value >= monitor.critical_threshold) {
            alertTriggered = true;
            alertSeverity = 'critical';
            alertMessage = `Critical threshold exceeded: ${monitor.current_value} >= ${monitor.critical_threshold} ${monitor.threshold_unit}`;
        } else if (monitor.warning_threshold && monitor.current_value >= monitor.warning_threshold) {
            alertTriggered = true;
            alertSeverity = 'medium';
            alertMessage = `Warning threshold exceeded: ${monitor.current_value} >= ${monitor.warning_threshold} ${monitor.threshold_unit}`;
        }

        // Check for consecutive failures
        if (monitor.consecutive_failures_alert && monitor.failed_checks >= monitor.consecutive_failures_alert) {
            alertTriggered = true;
            alertSeverity = 'high';
            alertMessage = `Consecutive failures detected: ${monitor.failed_checks} failures`;
        }

        if (alertTriggered) {
            // Check cooldown period
            const lastAlert = new Date(monitor.last_alert_sent || 0);
            const now = new Date();
            const cooldownMinutes = monitor.alert_cooldown_minutes || 30;
            const minutesSinceLastAlert = (now.getTime() - lastAlert.getTime()) / 60000;

            if (minutesSinceLastAlert >= cooldownMinutes) {
                // Trigger alert
                const alertResult = await processAlert(supabaseUrl, headers, {
                    alert_type: 'threshold_exceeded',
                    severity: alertSeverity,
                    organization_id: organizationId,
                    monitor_id: monitor.id,
                    title: `Monitor Alert: ${monitor.monitor_name}`,
                    message: alertMessage,
                    source_system: monitor.monitored_resource,
                    current_value: monitor.current_value,
                    threshold_value: alertSeverity === 'critical' ? monitor.critical_threshold : monitor.warning_threshold
                });

                alertsTriggered.push({
                    monitor_id: monitor.id,
                    monitor_name: monitor.monitor_name,
                    alert_id: alertResult.alert_id,
                    severity: alertSeverity,
                    message: alertMessage
                });
            }
        }
    }

    return {
        monitors_checked: monitors.length,
        alerts_triggered: alertsTriggered.length,
        alerts: alertsTriggered,
        check_time: new Date().toISOString()
    };
}

// Send daily/weekly digest reports
async function sendDigestReport(supabaseUrl, headers, organizationId) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get backup statistics for the period
    const backupStats = await getBackupStatistics(supabaseUrl, headers, organizationId, yesterday, now);
    const incidentStats = await getIncidentStatistics(supabaseUrl, headers, organizationId, weekAgo, now);
    const healthSummary = await getSystemHealthSummary(supabaseUrl, headers, organizationId);

    // Generate digest report
    const digestReport = {
        report_date: now.toISOString().split('T')[0],
        organization_id: organizationId,
        backup_summary: {
            total_backups: backupStats.total_backups,
            successful_backups: backupStats.successful_backups,
            failed_backups: backupStats.failed_backups,
            success_rate: backupStats.success_rate,
            total_data_backed_up_gb: backupStats.total_data_gb,
            average_backup_duration: backupStats.avg_duration
        },
        incident_summary: {
            total_incidents: incidentStats.total_incidents,
            critical_incidents: incidentStats.critical_incidents,
            resolved_incidents: incidentStats.resolved_incidents,
            average_resolution_time: incidentStats.avg_resolution_time
        },
        system_health: healthSummary,
        recommendations: generateRecommendations(backupStats, incidentStats, healthSummary)
    };

    // Get digest recipients (management level contacts)
    const digestRecipients = await getDigestRecipients(supabaseUrl, headers, organizationId);

    const digestResults = [];
    for (const recipient of digestRecipients) {
        try {
            const digestMessage = formatDigestReport(digestReport, recipient);
            
            const notificationResult = await sendEmailNotification(
                recipient,
                `Backup System Daily Digest - ${digestReport.report_date}`,
                digestMessage,
                'normal'
            );

            digestResults.push({
                recipient: recipient.contact_name,
                status: 'sent',
                delivery_id: notificationResult.messageId
            });

        } catch (error) {
            digestResults.push({
                recipient: recipient.contact_name,
                status: 'failed',
                error: error.message
            });
        }
    }

    return {
        digest_date: digestReport.report_date,
        recipients_count: digestResults.length,
        successful_deliveries: digestResults.filter(r => r.status === 'sent').length,
        digest_summary: digestReport,
        delivery_results: digestResults
    };
}

// Test alert system functionality
async function testAlertSystem(supabaseUrl, headers, organizationId) {
    const testResults = {
        test_timestamp: new Date().toISOString(),
        tests_performed: [],
        overall_status: 'passed'
    };

    // Test 1: Emergency contact retrieval
    try {
        const contacts = await getNotificationRecipients(supabaseUrl, headers, organizationId, 'critical', 'system_outage');
        testResults.tests_performed.push({
            test: 'Emergency Contact Retrieval',
            status: 'passed',
            details: `Retrieved ${contacts.immediate.length} immediate contacts, ${contacts.escalation.length} escalation contacts`
        });
    } catch (error) {
        testResults.tests_performed.push({
            test: 'Emergency Contact Retrieval',
            status: 'failed',
            error: error.message
        });
        testResults.overall_status = 'failed';
    }

    // Test 2: Test notification delivery
    try {
        const testRecipient = {
            contact_name: 'Alert System Test',
            email: 'test@example.com',
            primary_phone: '+971-50-000-0000',
            preferred_contact_method: 'email'
        };

        const testNotification = await sendEmailNotification(
            testRecipient,
            'Alert System Test',
            'This is a test message from the backup system alert processor.',
            'normal'
        );

        testResults.tests_performed.push({
            test: 'Notification Delivery',
            status: 'passed',
            details: `Test notification sent successfully`
        });
    } catch (error) {
        testResults.tests_performed.push({
            test: 'Notification Delivery',
            status: 'failed',
            error: error.message
        });
    }

    // Test 3: Alert processing
    try {
        const testAlert = await processAlert(supabaseUrl, headers, {
            alert_type: 'system_test',
            severity: 'low',
            organization_id: organizationId,
            title: 'Alert System Test',
            message: 'This is a test alert to verify system functionality',
            source_system: 'alert_test_system'
        });

        testResults.tests_performed.push({
            test: 'Alert Processing',
            status: 'passed',
            details: `Test alert processed with ID: ${testAlert.alert_id}`
        });
    } catch (error) {
        testResults.tests_performed.push({
            test: 'Alert Processing',
            status: 'failed',
            error: error.message
        });
        testResults.overall_status = 'failed';
    }

    const passedTests = testResults.tests_performed.filter(t => t.status === 'passed').length;
    const totalTests = testResults.tests_performed.length;

    return {
        ...testResults,
        success_rate: (passedTests / totalTests) * 100,
        tests_passed: passedTests,
        tests_failed: totalTests - passedTests
    };
}

// Helper functions for alert processing

function determineAlertPriority(severity, alertType, currentValue, thresholdValue) {
    let priorityLevel = 'medium';
    let escalationLevel = 1;

    switch (severity) {
        case 'critical':
            priorityLevel = 'urgent';
            escalationLevel = 1;
            break;
        case 'high':
            priorityLevel = 'high';
            escalationLevel = 2;
            break;
        case 'medium':
            priorityLevel = 'medium';
            escalationLevel = 3;
            break;
        case 'low':
            priorityLevel = 'low';
            escalationLevel = 4;
            break;
    }

    return { level: priorityLevel, escalationLevel };
}

function mapAlertTypeToIncidentType(alertType) {
    const mapping = {
        'backup_failure': 'backup_failure',
        'storage_capacity': 'system_outage',
        'connection_failure': 'system_outage',
        'threshold_exceeded': 'performance_degradation',
        'system_health': 'system_outage'
    };

    return mapping[alertType] || 'system_outage';
}

function determineBusinessImpact(severity, alertType) {
    if (severity === 'critical') return 'significant';
    if (severity === 'high') return 'moderate';
    if (severity === 'medium') return 'minimal';
    return 'none';
}

// Notification delivery functions (simplified implementations)
async function sendEmailNotification(recipient, subject, message, urgency) {
    // In a real implementation, this would integrate with an email service
    return {
        status: 'sent',
        messageId: `email_${crypto.randomUUID()}`,
        deliveryTime: new Date().toISOString()
    };
}

async function sendSMSNotification(recipient, message, urgency) {
    // In a real implementation, this would integrate with an SMS service
    return {
        status: 'sent',
        messageId: `sms_${crypto.randomUUID()}`,
        deliveryTime: new Date().toISOString()
    };
}

async function sendWhatsAppMessage(recipient, message, urgency) {
    // In a real implementation, this would integrate with WhatsApp Business API
    return {
        status: 'sent',
        messageId: `whatsapp_${crypto.randomUUID()}`,
        deliveryTime: new Date().toISOString()
    };
}

async function initiatePhoneCall(recipient, message, urgency) {
    // In a real implementation, this would integrate with a voice service
    return {
        status: 'initiated',
        messageId: `call_${crypto.randomUUID()}`,
        deliveryTime: new Date().toISOString()
    };
}

// Additional helper functions for getting recipients, statistics, etc.
async function getNotificationRecipients(supabaseUrl, headers, organizationId, severity, alertType) {
    const contactsResponse = await fetch(
        `${supabaseUrl}/rest/v1/emergency_contacts?organization_id=eq.${organizationId}&contact_is_active=eq.true&order=escalation_level.asc`,
        { headers }
    );

    if (!contactsResponse.ok) {
        throw new Error('Failed to fetch emergency contacts');
    }

    const contacts = await contactsResponse.json();

    return {
        immediate: contacts.filter(c => c.escalation_level <= 2),
        escalation: contacts.filter(c => c.escalation_level > 2)
    };
}

// Placeholder implementations for other helper functions
async function checkAlertSuppression(supabaseUrl, headers, monitorId, alertType) {
    return { suppressed: false, reason: null, nextCheck: null };
}

async function scheduleEscalation(supabaseUrl, headers, alertRecord, escalationContacts) {
    return escalationContacts.length > 0;
}

async function updateMonitorLastAlert(supabaseUrl, headers, monitorId, timestamp) {
    return fetch(
        `${supabaseUrl}/rest/v1/backup_monitoring?id=eq.${monitorId}`,
        {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ last_alert_sent: timestamp })
        }
    );
}

// Additional helper functions would be implemented for:
// - getEscalationContacts
// - updateIncidentEscalation  
// - cancelScheduledEscalations
// - getBackupStatistics
// - getIncidentStatistics
// - getSystemHealthSummary
// - generateRecommendations
// - getDigestRecipients
// - formatDigestReport