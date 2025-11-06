#!/usr/bin/env python3
"""
Automated Alerting System
Real-time incident notification and escalation management
"""

import json
import smtplib
import requests
import logging
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
import hashlib
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(Enum):
    NEW = "new"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class NotificationChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    SLACK = "slack"
    TEAMS = "teams"
    PAGERDUTY = "pagerduty"
    WEBHOOK = "webhook"

@dataclass
class Alert:
    """Represents a security alert"""
    id: str
    title: str
    description: str
    severity: AlertSeverity
    source: str
    timestamp: datetime
    metadata: Dict[str, Any]
    status: AlertStatus
    escalation_level: int
    assigned_to: Optional[str]
    channels: List[NotificationChannel]
    retry_count: int = 0
    last_attempt: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    incident_id: Optional[str] = None

class AlertManager:
    """Manages alert creation, routing, and escalation"""
    
    def __init__(self, config_path: str = "config/incident-config.json"):
        self.config = self._load_config(config_path)
        self.active_alerts = {}
        self.alert_history = []
        self.notification_handlers = {}
        self.escalation_rules = self._load_escalation_rules()
        self.acknowledgment_callbacks = []
        self.resolution_callbacks = []
        
        # Setup notification handlers
        self._setup_notification_handlers()
        
        # Start alert processing
        self._start_alert_processor()
        
        # Start escalation scheduler
        self._start_escalation_scheduler()
        
        logger.info("Alert Manager initialized")
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "alerting": {
                "email": {
                    "smtp_server": "smtp.gmail.com",
                    "smtp_port": 587,
                    "username": "alerts@company.com",
                    "password": "app_password",
                    "from_address": "alerts@company.com"
                },
                "slack": {
                    "webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
                },
                "sms": {
                    "provider": "twilio",
                    "account_sid": "your_account_sid",
                    "auth_token": "your_auth_token",
                    "from_number": "+1234567890"
                },
                "escalation": {
                    "auto_escalate": True,
                    "escalation_timeout": 900,  # 15 minutes
                    "max_escalation_level": 3
                }
            }
        }
    
    def _load_escalation_rules(self) -> Dict[str, Any]:
        """Load escalation rules from configuration"""
        return {
            "critical": {
                "initial_channels": [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.PAGERDUTY],
                "escalation_timeout": 300,  # 5 minutes
                "escalation_channels": [NotificationChannel.SMS, NotificationChannel.TEAMS],
                "max_level": 3
            },
            "high": {
                "initial_channels": [NotificationChannel.EMAIL, NotificationChannel.SLACK],
                "escalation_timeout": 900,  # 15 minutes
                "escalation_channels": [NotificationChannel.PAGERDUTY],
                "max_level": 2
            },
            "medium": {
                "initial_channels": [NotificationChannel.EMAIL],
                "escalation_timeout": 1800,  # 30 minutes
                "escalation_channels": [NotificationChannel.SLACK],
                "max_level": 1
            },
            "low": {
                "initial_channels": [NotificationChannel.EMAIL],
                "escalation_timeout": 3600,  # 1 hour
                "escalation_channels": [],
                "max_level": 0
            }
        }
    
    def _setup_notification_handlers(self):
        """Setup notification channel handlers"""
        self.notification_handlers = {
            NotificationChannel.EMAIL: self._send_email_alert,
            NotificationChannel.SLACK: self._send_slack_alert,
            NotificationChannel.TEAMS: self._send_teams_alert,
            NotificationChannel.SMS: self._send_sms_alert,
            NotificationChannel.PAGERDUTY: self._send_pagerduty_alert,
            NotificationChannel.WEBHOOK: self._send_webhook_alert
        }
    
    def _start_alert_processor(self):
        """Start background alert processing thread"""
        def process_alerts():
            while True:
                try:
                    # Process pending alerts
                    self._process_pending_alerts()
                    
                    # Retry failed alerts
                    self._retry_failed_alerts()
                    
                    time.sleep(10)  # Process every 10 seconds
                    
                except Exception as e:
                    logger.error(f"Error in alert processor: {e}")
                    time.sleep(30)
        
        thread = threading.Thread(target=process_alerts, daemon=True)
        thread.start()
        logger.info("Alert processor started")
    
    def _start_escalation_scheduler(self):
        """Start escalation scheduler"""
        def check_escalations():
            while True:
                try:
                    current_time = datetime.now()
                    
                    for alert in self.active_alerts.values():
                        if alert.status == AlertStatus.SENT and alert.escalation_level < self.escalation_rules[alert.severity.value]["max_level"]:
                            # Check if escalation timeout has been reached
                            if (current_time - alert.last_attempt).total_seconds() > self.escalation_rules[alert.severity.value]["escalation_timeout"]:
                                self._escalate_alert(alert)
                    
                    time.sleep(60)  # Check every minute
                    
                except Exception as e:
                    logger.error(f"Error in escalation scheduler: {e}")
                    time.sleep(60)
        
        thread = threading.Thread(target=check_escalations, daemon=True)
        thread.start()
        logger.info("Escalation scheduler started")
    
    def create_alert(self, 
                    title: str, 
                    description: str, 
                    severity: AlertSeverity, 
                    source: str,
                    metadata: Optional[Dict[str, Any]] = None,
                    channels: Optional[List[NotificationChannel]] = None,
                    incident_id: Optional[str] = None) -> Alert:
        """Create a new alert"""
        alert_id = f"ALERT-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{hashlib.md5(f'{title}{source}'.encode()).hexdigest()[:8]}"
        
        # Determine channels based on severity if not specified
        if channels is None:
            channels = self.escalation_rules[severity.value]["initial_channels"]
        
        alert = Alert(
            id=alert_id,
            title=title,
            description=description,
            severity=severity,
            source=source,
            timestamp=datetime.now(),
            metadata=metadata or {},
            status=AlertStatus.NEW,
            escalation_level=0,
            assigned_to=None,
            channels=channels,
            incident_id=incident_id
        )
        
        self.active_alerts[alert_id] = alert
        logger.info(f"Alert created: {alert_id} - {title}")
        
        # Start notification process
        self._process_alert(alert)
        
        return alert
    
    def _process_alert(self, alert: Alert):
        """Process an alert through the notification pipeline"""
        try:
            alert.status = AlertStatus.SENT
            alert.last_attempt = datetime.now()
            
            # Send to all configured channels
            success_count = 0
            for channel in alert.channels:
                if channel in self.notification_handlers:
                    try:
                        self.notification_handlers[channel](alert)
                        success_count += 1
                        logger.info(f"Alert {alert.id} sent via {channel.value}")
                    except Exception as e:
                        logger.error(f"Failed to send alert {alert.id} via {channel.value}: {e}")
                        alert.retry_count += 1
            
            if success_count == 0:
                logger.error(f"Failed to send alert {alert.id} to any channel")
                alert.status = AlertStatus.NEW  # Reset status for retry
            
        except Exception as e:
            logger.error(f"Error processing alert {alert.id}: {e}")
            alert.status = AlertStatus.NEW
    
    def _process_pending_alerts(self):
        """Process pending alerts (for retry logic)"""
        current_time = datetime.now()
        
        for alert in self.active_alerts.values():
            if alert.status == AlertStatus.NEW:
                # Retry failed alerts after a delay
                if alert.retry_count > 0 and alert.last_attempt:
                    time_since_last = (current_time - alert.last_attempt).total_seconds()
                    if time_since_last > 300:  # 5 minutes
                        self._process_alert(alert)
    
    def _retry_failed_alerts(self):
        """Retry failed alerts"""
        for alert in list(self.active_alerts.values()):
            if alert.status == AlertStatus.NEW and alert.retry_count < 3:
                # This is handled in _process_pending_alerts
                pass
    
    def _escalate_alert(self, alert: Alert):
        """Escalate an alert to the next level"""
        if alert.escalation_level < self.escalation_rules[alert.severity.value]["max_level"]:
            alert.escalation_level += 1
            alert.status = AlertStatus.ESCALATED
            
            # Add escalation channels
            escalation_channels = self.escalation_rules[alert.severity.value]["escalation_channels"]
            for channel in escalation_channels:
                if channel not in alert.channels:
                    alert.channels.append(channel)
            
            # Send escalated alert
            self._process_alert(alert)
            
            logger.warning(f"Alert {alert.id} escalated to level {alert.escalation_level}")
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.status = AlertStatus.ACKNOWLEDGED
            alert.acknowledged_at = datetime.now()
            alert.assigned_to = acknowledged_by
            
            # Call acknowledgment callbacks
            for callback in self.acknowledgment_callbacks:
                try:
                    callback(alert)
                except Exception as e:
                    logger.error(f"Error in acknowledgment callback: {e}")
            
            logger.info(f"Alert {alert.id} acknowledged by {acknowledged_by}")
            return True
        
        return False
    
    def resolve_alert(self, alert_id: str, resolved_by: str, resolution_notes: Optional[str] = None) -> bool:
        """Resolve an alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.status = AlertStatus.RESOLVED
            alert.resolved_at = datetime.now()
            
            # Add resolution notes to metadata
            if resolution_notes:
                alert.metadata["resolution_notes"] = resolution_notes
            alert.metadata["resolved_by"] = resolved_by
            
            # Move to history
            self.alert_history.append(alert)
            del self.active_alerts[alert_id]
            
            # Call resolution callbacks
            for callback in self.resolution_callbacks:
                try:
                    callback(alert)
                except Exception as e:
                    logger.error(f"Error in resolution callback: {e}")
            
            logger.info(f"Alert {alert.id} resolved by {resolved_by}")
            return True
        
        return False
    
    def _send_email_alert(self, alert: Alert):
        """Send alert via email"""
        config = self.config.get("alerting", {}).get("email", {})
        
        if not config.get("smtp_server"):
            logger.warning("Email configuration not available")
            return
        
        # Create message
        msg = MimeMultipart()
        msg['From'] = config.get("from_address", "alerts@company.com")
        msg['To'] = self._get_recipient_list(alert)
        msg['Subject'] = f"[{alert.severity.value.upper()}] {alert.title}"
        
        # Email body
        body = self._format_email_body(alert)
        msg.attach(MimeText(body, 'html'))
        
        # Send email
        try:
            server = smtplib.SMTP(config.get("smtp_server"), config.get("smtp_port", 587))
            server.starttls()
            server.login(config.get("username"), config.get("password"))
            server.send_message(msg)
            server.quit()
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            raise
    
    def _send_slack_alert(self, alert: Alert):
        """Send alert to Slack"""
        config = self.config.get("alerting", {}).get("slack", {})
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            logger.warning("Slack webhook URL not configured")
            return
        
        payload = {
            "text": f"🚨 Security Alert: {alert.title}",
            "attachments": [
                {
                    "color": self._get_slack_color(alert.severity),
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.severity.value.upper(),
                            "short": True
                        },
                        {
                            "title": "Source",
                            "value": alert.source,
                            "short": True
                        },
                        {
                            "title": "Time",
                            "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                            "short": True
                        }
                    ],
                    "text": alert.description
                }
            ]
        }
        
        try:
            response = requests.post(webhook_url, json=payload, timeout=10)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
            raise
    
    def _send_teams_alert(self, alert: Alert):
        """Send alert to Microsoft Teams"""
        # Teams integration would be similar to Slack
        logger.info(f"Teams alert would be sent: {alert.id}")
    
    def _send_sms_alert(self, alert: Alert):
        """Send alert via SMS"""
        config = self.config.get("alerting", {}).get("sms", {})
        
        if not config.get("account_sid"):
            logger.warning("SMS configuration not available")
            return
        
        # This would integrate with Twilio or other SMS providers
        logger.info(f"SMS alert would be sent: {alert.id}")
    
    def _send_pagerduty_alert(self, alert: Alert):
        """Send alert to PagerDuty"""
        logger.info(f"PagerDuty alert would be sent: {alert.id}")
    
    def _send_webhook_alert(self, alert: Alert):
        """Send alert to custom webhook"""
        logger.info(f"Webhook alert would be sent: {alert.id}")
    
    def _get_recipient_list(self, alert: Alert) -> str:
        """Get list of email recipients based on alert severity"""
        recipients = {
            AlertSeverity.CRITICAL: ["security-team@company.com", "management@company.com"],
            AlertSeverity.HIGH: ["security-team@company.com"],
            AlertSeverity.MEDIUM: ["security-team@company.com"],
            AlertSeverity.LOW: ["security-team@company.com"]
        }
        
        return ", ".join(recipients.get(alert.severity, ["security-team@company.com"]))
    
    def _format_email_body(self, alert: Alert) -> str:
        """Format alert for email"""
        status_emoji = {
            AlertSeverity.CRITICAL: "🔴",
            AlertSeverity.HIGH: "🟠", 
            AlertSeverity.MEDIUM: "🟡",
            AlertSeverity.LOW: "🔵"
        }
        
        emoji = status_emoji.get(alert.severity, "⚪")
        
        return f"""
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d32f2f;">{emoji} Security Alert</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Alert ID:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">{alert.id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Title:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">{alert.title}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Severity:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: {self._get_severity_color(alert.severity)}; font-weight: bold;">{alert.severity.value.upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Source:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">{alert.source}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">{alert.timestamp.strftime("%Y-%m-%d %H:%M:%S")}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">{alert.status.value.upper()}</td>
                    </tr>
                </table>
                
                <h3>Description:</h3>
                <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">{alert.description}</p>
                
                {f'<h3>Additional Information:</h3><pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">{json.dumps(alert.metadata, indent=2, default=str)}</pre>' if alert.metadata else ''}
                
                <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
                    <p><strong>Action Required:</strong> Please investigate this security alert immediately.</p>
                    <p>Dashboard URL: <a href="http://localhost:3000">Incident Response Dashboard</a></p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_severity_color(self, severity: AlertSeverity) -> str:
        """Get color for severity level"""
        colors = {
            AlertSeverity.CRITICAL: "#d32f2f",
            AlertSeverity.HIGH: "#f57c00",
            AlertSeverity.MEDIUM: "#fbc02d",
            AlertSeverity.LOW: "#1976d2"
        }
        return colors.get(severity, "#757575")
    
    def _get_slack_color(self, severity: AlertSeverity) -> str:
        """Get Slack color for severity level"""
        colors = {
            AlertSeverity.CRITICAL: "danger",
            AlertSeverity.HIGH: "warning",
            AlertSeverity.MEDIUM: "good",
            AlertSeverity.LOW: "#439FE0"
        }
        return colors.get(severity, "#E3E4E6")
    
    def register_acknowledgment_callback(self, callback: Callable[[Alert], None]):
        """Register a callback for alert acknowledgment"""
        self.acknowledgment_callbacks.append(callback)
    
    def register_resolution_callback(self, callback: Callable[[Alert], None]):
        """Register a callback for alert resolution"""
        self.resolution_callbacks.append(callback)
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts"""
        return list(self.active_alerts.values())
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """Get alert history from the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [alert for alert in self.alert_history if alert.timestamp >= cutoff_time]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get alert statistics"""
        active = list(self.active_alerts.values())
        history = self.alert_history
        
        return {
            "active_alerts": len(active),
            "total_alerts": len(history),
            "alerts_by_severity": {
                severity.value: len([a for a in history if a.severity == severity]) 
                for severity in AlertSeverity
            },
            "alerts_by_status": {
                status.value: len([a for a in active if a.status == status]) 
                for status in AlertStatus
            },
            "recent_activity": {
                "last_hour": len([a for a in history if (datetime.now() - a.timestamp).total_seconds() < 3600]),
                "last_day": len([a for a in history if (datetime.now() - a.timestamp).total_seconds() < 86400])
            },
            "acknowledged_alerts": len([a for a in history if a.status == AlertStatus.ACKNOWLEDGED]),
            "resolved_alerts": len([a for a in history if a.status == AlertStatus.RESOLVED])
        }

def main():
    """Main function to test the alert system"""
    alert_manager = AlertManager()
    
    # Test alert creation
    test_alert = alert_manager.create_alert(
        title="Suspicious Network Activity Detected",
        description="Multiple failed login attempts from IP 192.168.1.100. Potential brute force attack.",
        severity=AlertSeverity.HIGH,
        source="Threat Detection System",
        metadata={
            "source_ip": "192.168.1.100",
            "failure_count": 15,
            "time_window": "5 minutes"
        }
    )
    
    print(f"Alert created: {test_alert.id}")
    print(f"Active alerts: {len(alert_manager.get_active_alerts())}")
    
    # Register callbacks
    def on_alert_acknowledged(alert: Alert):
        print(f"Alert {alert.id} was acknowledged")
    
    def on_alert_resolved(alert: Alert):
        print(f"Alert {alert.id} was resolved")
    
    alert_manager.register_acknowledgment_callback(on_alert_acknowledged)
    alert_manager.register_resolution_callback(on_alert_resolved)
    
    # Simulate acknowledgment after 10 seconds
    def acknowledge_test():
        time.sleep(10)
        alert_manager.acknowledge_alert(test_alert.id, "Test User")
    
    threading.Thread(target=acknowledge_test, daemon=True).start()
    
    # Print statistics periodically
    try:
        while True:
            stats = alert_manager.get_statistics()
            print(f"\rStats: Active={stats['active_alerts']}, Total={stats['total_alerts']}, Recent={stats['recent_activity']['last_hour']}", end="", flush=True)
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nAlert system stopped")

if __name__ == "__main__":
    main()