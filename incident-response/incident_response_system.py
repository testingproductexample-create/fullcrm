#!/usr/bin/env python3
"""
Incident Response System Integration
Main orchestrator for the complete incident response platform
"""

import json
import os
import sys
import logging
import argparse
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import signal
import queue

# Add component directories to path
sys.path.extend([
    'threat-detection',
    'alerts', 
    'evidence',
    'recovery',
    'reports',
    'assessment',
    'dashboard',
    'config',
    'templates'
])

# Import components
try:
    from threat_detection.threat_detector import ThreatDetector, ThreatLevel, ThreatCategory
    from alerts.alert_manager import AlertManager, AlertSeverity, AlertStatus
    from evidence.evidence_collector import EvidenceCollector
    from recovery.recovery_orchestrator import RecoveryOrchestrator
    from reports.incident_analyzer import IncidentAnalyzer
    from assessment.pentest_toolkit import PentestPreparation
except ImportError as e:
    print(f"Warning: Could not import some components: {e}")
    print("Some functionality may be limited")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('incident_response.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class IncidentResponseOrchestrator:
    """Main orchestrator for the incident response system"""
    
    def __init__(self, config_dir: str = "config"):
        self.config_dir = config_dir
        self.running = False
        self.incidents = {}
        self.system_status = {
            "threat_detection": False,
            "alert_system": False,
            "evidence_collector": False,
            "recovery_system": False,
            "analysis_system": False
        }
        
        # Initialize components
        self._initialize_components()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        logger.info("Incident Response Orchestrator initialized")
    
    def _initialize_components(self):
        """Initialize all system components"""
        try:
            # Initialize threat detection
            try:
                self.threat_detector = ThreatDetector(f"{self.config_dir}/incident-config.json")
                self.system_status["threat_detection"] = True
                logger.info("Threat detection system initialized")
            except Exception as e:
                logger.error(f"Failed to initialize threat detection: {e}")
            
            # Initialize alert manager
            try:
                self.alert_manager = AlertManager(f"{self.config_dir}/incident-config.json")
                self.system_status["alert_system"] = True
                logger.info("Alert management system initialized")
            except Exception as e:
                logger.error(f"Failed to initialize alert manager: {e}")
            
            # Initialize evidence collector
            try:
                self.evidence_collector = EvidenceCollector()
                self.system_status["evidence_collector"] = True
                logger.info("Evidence collection system initialized")
            except Exception as e:
                logger.error(f"Failed to initialize evidence collector: {e}")
            
            # Initialize recovery orchestrator
            try:
                self.recovery_orchestrator = RecoveryOrchestrator(f"{self.config_dir}/incident-config.json")
                self.system_status["recovery_system"] = True
                logger.info("Recovery orchestration system initialized")
            except Exception as e:
                logger.error(f"Failed to initialize recovery system: {e}")
            
            # Initialize incident analyzer
            try:
                self.incident_analyzer = IncidentAnalyzer()
                self.system_status["analysis_system"] = True
                logger.info("Incident analysis system initialized")
            except Exception as e:
                logger.error(f"Failed to initialize analysis system: {e}")
            
            # Initialize penetration testing toolkit
            try:
                self.pentest_toolkit = PentestPreparation()
                self.system_status["pentest_toolkit"] = True
                logger.info("Penetration testing toolkit initialized")
            except Exception as e:
                logger.error(f"Failed to initialize pentest toolkit: {e}")
            
        except Exception as e:
            logger.error(f"Failed to initialize system components: {e}")
            raise
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.shutdown()
    
    def start_monitoring(self):
        """Start the incident response monitoring system"""
        if self.running:
            logger.warning("System is already running")
            return
        
        self.running = True
        logger.info("Starting incident response monitoring system...")
        
        # Start background monitoring threads
        self._start_background_monitoring()
        
        # Start integration monitoring
        self._start_integration_monitoring()
        
        # Start system health monitoring
        self._start_health_monitoring()
        
        logger.info("Incident response system is now running")
    
    def _start_background_monitoring(self):
        """Start background monitoring threads"""
        
        # Threat detection monitoring
        if self.system_status["threat_detection"]:
            def threat_monitoring():
                while self.running:
                    try:
                        # Process threat detection events
                        self._process_threat_events()
                        time.sleep(10)
                    except Exception as e:
                        logger.error(f"Error in threat monitoring: {e}")
                        time.sleep(30)
            
            thread = threading.Thread(target=threat_monitoring, daemon=True)
            thread.start()
        
        # Alert processing
        if self.system_status["alert_system"]:
            def alert_monitoring():
                while self.running:
                    try:
                        # Process alert queue
                        self._process_alert_queue()
                        time.sleep(5)
                    except Exception as e:
                        logger.error(f"Error in alert monitoring: {e}")
                        time.sleep(15)
            
            thread = threading.Thread(target=alert_monitoring, daemon=True)
            thread.start()
    
    def _start_integration_monitoring(self):
        """Start integration between system components"""
        
        def integration_monitoring():
            while self.running:
                try:
                    # Monitor for incidents that need escalation
                    self._check_incident_escalation()
                    
                    # Monitor for evidence collection triggers
                    self._check_evidence_collection_triggers()
                    
                    # Monitor for recovery triggers
                    self._check_recovery_triggers()
                    
                    # Monitor for analysis triggers
                    self._check_analysis_triggers()
                    
                    time.sleep(30)  # Check every 30 seconds
                    
                except Exception as e:
                    logger.error(f"Error in integration monitoring: {e}")
                    time.sleep(60)
        
        thread = threading.Thread(target=integration_monitoring, daemon=True)
        thread.start()
    
    def _start_health_monitoring(self):
        """Start system health monitoring"""
        
        def health_monitoring():
            while self.running:
                try:
                    health_status = self.get_system_health()
                    if not all(health_status.values()):
                        logger.warning(f"System health issues detected: {health_status}")
                    
                    time.sleep(300)  # Check every 5 minutes
                    
                except Exception as e:
                    logger.error(f"Error in health monitoring: {e}")
                    time.sleep(300)
        
        thread = threading.Thread(target=health_monitoring, daemon=True)
        thread.start()
    
    def _process_threat_events(self):
        """Process events from threat detection system"""
        if not self.system_status["threat_detection"]:
            return
        
        try:
            # Get recent security events
            recent_events = self.threat_detector.get_recent_events(hours=1)
            
            for event in recent_events:
                # Check if event requires incident creation
                if event.risk_score >= 0.7 and event.requires_investigation:
                    self._create_incident_from_threat_event(event)
                
        except Exception as e:
            logger.error(f"Error processing threat events: {e}")
    
    def _create_incident_from_threat_event(self, event):
        """Create incident from threat detection event"""
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Create incident record
        incident = {
            "id": incident_id,
            "title": f"Security Event: {event.event_type}",
            "description": event.event_data.get("description", "Automated detection"),
            "type": self._map_event_type_to_incident_type(event.event_type),
            "severity": self._map_risk_score_to_severity(event.risk_score),
            "status": "new",
            "source": "automated_detection",
            "source_event": event,
            "created_at": datetime.now().isoformat(),
            "assigned_to": None,
            "affected_systems": [],
            "evidence_items": [],
            "tasks": [],
            "timeline": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "event": "incident_created",
                    "description": f"Incident created from threat detection event",
                    "actor": "system"
                }
            ]
        }
        
        # Store incident
        self.incidents[incident_id] = incident
        
        # Create alert
        if self.system_status["alert_system"]:
            try:
                alert = self.alert_manager.create_alert(
                    title=f"New Security Incident: {incident['title']}",
                    description=incident['description'],
                    severity=self._map_severity_to_alert_severity(incident['severity']),
                    source="Threat Detection System",
                    metadata={
                        "incident_id": incident_id,
                        "event_id": event.id,
                        "risk_score": event.risk_score
                    }
                )
                incident['initial_alert_id'] = alert.id
            except Exception as e:
                logger.error(f"Failed to create alert for incident {incident_id}: {e}")
        
        logger.info(f"Incident created: {incident_id} from threat event {event.id}")
    
    def _process_alert_queue(self):
        """Process alert queue and manage incident lifecycle"""
        if not self.system_status["alert_system"]:
            return
        
        try:
            # Get active alerts
            active_alerts = self.alert_manager.get_active_alerts()
            
            for alert in active_alerts:
                incident_id = alert.metadata.get("incident_id")
                
                if incident_id and incident_id in self.incidents:
                    incident = self.incidents[incident_id]
                    
                    # Update incident based on alert status
                    if alert.status == AlertStatus.ACKNOWLEDGED:
                        if incident["status"] == "new":
                            incident["status"] = "investigating"
                            incident["assigned_to"] = alert.assigned_to
                            self._add_timeline_event(incident_id, "investigating", "Incident acknowledged by response team", "system")
                    
                    elif alert.status == AlertStatus.RESOLVED:
                        if incident["status"] != "resolved":
                            incident["status"] = "resolved"
                            incident["resolved_at"] = datetime.now().isoformat()
                            self._add_timeline_event(incident_id, "resolved", "Alert resolved, incident under review", "system")
                            
                            # Trigger post-incident analysis
                            self._trigger_post_incident_analysis(incident_id)
        
        except Exception as e:
            logger.error(f"Error processing alert queue: {e}")
    
    def _check_incident_escalation(self):
        """Check for incidents that need escalation"""
        current_time = datetime.now()
        
        for incident_id, incident in self.incidents.items():
            # Check for escalation timeouts
            created_time = datetime.fromisoformat(incident["created_at"])
            time_elapsed = (current_time - created_time).total_seconds()
            
            # Escalate based on severity and time
            escalation_thresholds = {
                "critical": 900,   # 15 minutes
                "high": 3600,      # 1 hour
                "medium": 14400,   # 4 hours
                "low": 86400       # 24 hours
            }
            
            threshold = escalation_thresholds.get(incident["severity"], 86400)
            
            if (time_elapsed > threshold and 
                incident["status"] in ["new", "investigating"] and
                not incident.get("escalated", False)):
                
                self._escalate_incident(incident_id)
    
    def _check_evidence_collection_triggers(self):
        """Check for evidence collection triggers"""
        if not self.system_status["evidence_collector"]:
            return
        
        for incident_id, incident in self.incidents.items():
            # Check if evidence should be collected based on incident type
            if incident["type"] in ["data_breach", "malware", "network_intrusion"]:
                if not incident.get("evidence_collected", False):
                    self._trigger_evidence_collection(incident_id)
    
    def _trigger_evidence_collection(self, incident_id):
        """Trigger evidence collection for incident"""
        incident = self.incidents[incident_id]
        
        try:
            # Collect different types of evidence based on incident type
            if incident["type"] == "malware":
                # Collect system evidence
                evidence = self.evidence_collector.collect_system_evidence(
                    incident_id=incident_id,
                    system_info={"incident_type": "malware"},
                    name="System Information - Malware Incident",
                    description="System information collected during malware incident",
                    collected_by="Automated Collection"
                )
            
            elif incident["type"] == "data_breach":
                # Collect log evidence
                evidence = self.evidence_collector.collect_log_evidence(
                    incident_id=incident_id,
                    log_sources=["/var/log/auth.log", "/var/log/syslog"],
                    name="Log Evidence - Data Breach",
                    description="Log files collected during data breach investigation",
                    collected_by="Automated Collection"
                )
            
            # Mark evidence as collected
            incident["evidence_collected"] = True
            incident["evidence_items"].append(evidence.id)
            
            logger.info(f"Evidence collection triggered for incident {incident_id}")
            
        except Exception as e:
            logger.error(f"Failed to collect evidence for incident {incident_id}: {e}")
    
    def _check_recovery_triggers(self):
        """Check for recovery system triggers"""
        if not self.system_status["recovery_system"]:
            return
        
        for incident_id, incident in self.incidents.items():
            # Trigger recovery for system-affecting incidents
            if (incident["status"] == "contained" and 
                not incident.get("recovery_initiated", False)):
                
                self._trigger_recovery(incident_id)
    
    def _trigger_recovery(self, incident_id):
        """Trigger recovery procedures for incident"""
        incident = self.incidents[incident_id]
        
        try:
            # Determine system type for recovery
            system_type = self._determine_recovery_system_type(incident)
            
            if system_type:
                recovery_id = self.recovery_orchestrator.initiate_recovery(
                    incident_id=incident_id,
                    system_type=system_type
                )
                
                incident["recovery_id"] = recovery_id
                incident["recovery_initiated"] = True
                
                logger.info(f"Recovery initiated for incident {incident_id} - {system_type}")
            
        except Exception as e:
            logger.error(f"Failed to initiate recovery for incident {incident_id}: {e}")
    
    def _check_analysis_triggers(self):
        """Check for post-incident analysis triggers"""
        if not self.system_status["analysis_system"]:
            return
        
        for incident_id, incident in self.incidents.items():
            # Trigger analysis when incident is resolved
            if (incident["status"] == "resolved" and 
                not incident.get("analysis_completed", False)):
                
                self._trigger_post_incident_analysis(incident_id)
    
    def _trigger_post_incident_analysis(self, incident_id):
        """Trigger post-incident analysis"""
        incident = self.incidents[incident_id]
        
        try:
            # Create incident data for analysis
            incident_data = {
                'incident_id': incident_id,
                'detection_time': incident['created_at'],
                'resolution_time': incident.get('resolved_at', datetime.now().isoformat()),
                'severity': incident['severity'],
                'evidence_items': len(incident['evidence_items']),
                'tasks_completed': len([t for t in incident['tasks'] if t.get('completed', False)]),
                'team_members': list(set([t.get('assigned_to') for t in incident['tasks'] if t.get('assigned_to')])),
                'systems_affected': len(incident['affected_systems'])
            }
            
            # Calculate metrics
            metrics = self.incident_analyzer.calculate_incident_metrics(incident_data)
            
            # Generate lessons learned
            lessons = self.incident_analyzer.generate_lessons_learned(incident_id, {}, metrics)
            
            # Mark analysis as completed
            incident["analysis_completed"] = True
            incident["lessons_learned"] = [asdict(lesson) for lesson in lessons]
            
            logger.info(f"Post-incident analysis completed for {incident_id}")
            
        except Exception as e:
            logger.error(f"Failed to complete post-incident analysis for {incident_id}: {e}")
    
    def _escalate_incident(self, incident_id):
        """Escalate incident to management"""
        incident = self.incidents[incident_id]
        
        try:
            # Create escalation alert
            if self.system_status["alert_system"]:
                escalation_alert = self.alert_manager.create_alert(
                    title=f"INCIDENT ESCALATION: {incident['title']}",
                    description=f"Incident {incident_id} has exceeded expected response time",
                    severity=AlertSeverity.CRITICAL if incident['severity'] == 'critical' else AlertSeverity.HIGH,
                    source="Incident Response System",
                    metadata={
                        "incident_id": incident_id,
                        "escalation_reason": "Response time exceeded",
                        "current_status": incident['status'],
                        "time_elapsed": (datetime.now() - datetime.fromisoformat(incident['created_at'])).total_seconds()
                    }
                )
            
            incident["escalated"] = True
            incident["escalated_at"] = datetime.now().isoformat()
            
            self._add_timeline_event(incident_id, "escalated", "Incident escalated to management", "system")
            
            logger.warning(f"Incident {incident_id} escalated to management")
            
        except Exception as e:
            logger.error(f"Failed to escalate incident {incident_id}: {e}")
    
    def _add_timeline_event(self, incident_id, event_type, description, actor):
        """Add event to incident timeline"""
        if incident_id in self.incidents:
            event = {
                "timestamp": datetime.now().isoformat(),
                "event": event_type,
                "description": description,
                "actor": actor
            }
            self.incidents[incident_id]["timeline"].append(event)
    
    def get_system_health(self) -> Dict[str, bool]:
        """Get current system health status"""
        return self.system_status.copy()
    
    def get_incident_summary(self) -> Dict[str, Any]:
        """Get summary of all incidents"""
        total_incidents = len(self.incidents)
        status_counts = {}
        severity_counts = {}
        
        for incident in self.incidents.values():
            # Count by status
            status = incident["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Count by severity
            severity = incident["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total_incidents": total_incidents,
            "incidents_by_status": status_counts,
            "incidents_by_severity": severity_counts,
            "recent_incidents": len([
                inc for inc in self.incidents.values()
                if datetime.fromisoformat(inc["created_at"]) > datetime.now() - timedelta(days=7)
            ])
        }
    
    def generate_comprehensive_report(self, output_file: str):
        """Generate comprehensive incident response report"""
        report = {
            "report_generated": datetime.now().isoformat(),
            "system_status": self.get_system_health(),
            "incident_summary": self.get_incident_summary(),
            "incidents": self.incidents
        }
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Comprehensive report generated: {output_file}")
        return output_file
    
    def shutdown(self):
        """Gracefully shutdown the incident response system"""
        logger.info("Shutting down incident response system...")
        
        self.running = False
        
        # Shutdown components
        if hasattr(self, 'threat_detector'):
            logger.info("Threat detection system stopped")
        
        if hasattr(self, 'alert_manager'):
            logger.info("Alert system stopped")
        
        if hasattr(self, 'evidence_collector'):
            logger.info("Evidence collector stopped")
        
        if hasattr(self, 'recovery_orchestrator'):
            logger.info("Recovery system stopped")
        
        if hasattr(self, 'incident_analyzer'):
            logger.info("Analysis system stopped")
        
        logger.info("Incident response system shutdown complete")
    
    # Helper methods
    def _map_event_type_to_incident_type(self, event_type: str) -> str:
        """Map threat event type to incident type"""
        mapping = {
            "suspicious_process": "malware",
            "failed_login": "phishing",
            "network_scan": "network_intrusion",
            "data_exfiltration": "data_breach"
        }
        return mapping.get(event_type, "security_incident")
    
    def _map_risk_score_to_severity(self, risk_score: float) -> str:
        """Map risk score to incident severity"""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.4:
            return "medium"
        else:
            return "low"
    
    def _map_severity_to_alert_severity(self, severity: str) -> AlertSeverity:
        """Map incident severity to alert severity"""
        mapping = {
            "critical": AlertSeverity.CRITICAL,
            "high": AlertSeverity.HIGH,
            "medium": AlertSeverity.MEDIUM,
            "low": AlertSeverity.LOW
        }
        return mapping.get(severity, AlertSeverity.MEDIUM)
    
    def _determine_recovery_system_type(self, incident: Dict[str, Any]) -> Optional[str]:
        """Determine appropriate recovery system type based on incident"""
        if "database" in incident.get("affected_systems", []):
            return "database"
        elif "web" in incident.get("affected_systems", []):
            return "webapp"
        elif "network" in incident.get("affected_systems", []):
            return "network"
        return None

def main():
    """Main function to run the incident response system"""
    parser = argparse.ArgumentParser(description="Incident Response System")
    parser.add_argument("--start", action="store_true", help="Start the incident response system")
    parser.add_argument("--stop", action="store_true", help="Stop the incident response system")
    parser.add_argument("--status", action="store_true", help="Show system status")
    parser.add_argument("--report", type=str, help="Generate comprehensive report")
    parser.add_argument("--config", type=str, default="config", help="Configuration directory")
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    orchestrator = IncidentResponseOrchestrator(config_dir=args.config)
    
    try:
        if args.start:
            print("Starting Incident Response System...")
            orchestrator.start_monitoring()
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                orchestrator.shutdown()
        
        elif args.stop:
            print("Stopping Incident Response System...")
            orchestrator.shutdown()
        
        elif args.status:
            health = orchestrator.get_system_health()
            summary = orchestrator.get_incident_summary()
            
            print("System Health:")
            for component, status in health.items():
                status_str = "✓ Running" if status else "✗ Not Available"
                print(f"  {component}: {status_str}")
            
            print(f"\nIncident Summary:")
            print(f"  Total Incidents: {summary['total_incidents']}")
            print(f"  Recent Incidents: {summary['recent_incidents']}")
        
        elif args.report:
            print(f"Generating comprehensive report: {args.report}")
            orchestrator.generate_comprehensive_report(args.report)
            print(f"Report generated successfully")
        
        else:
            parser.print_help()
    
    except Exception as e:
        logger.error(f"System error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()