#!/usr/bin/env python3
"""
Automated Threat Detection System
Real-time monitoring and threat analysis for incident response
"""

import json
import time
import logging
import hashlib
import ipaddress
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue
import re
import subprocess
import psutil
import socket
from collections import defaultdict, deque

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/threat_detection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ThreatLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class ThreatCategory(Enum):
    MALWARE = "malware"
    PHISHING = "phishing"
    DATA_BREACH = "data_breach"
    DDOS = "ddos"
    INSIDER_THREAT = "insider_threat"
    NETWORK_INTRUSION = "network_intrusion"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

@dataclass
class ThreatIndicator:
    """Represents a threat indicator with its properties"""
    id: str
    type: str
    value: str
    source: str
    confidence: float
    timestamp: datetime
    metadata: Dict[str, Any]
    severity: ThreatLevel
    category: ThreatCategory

@dataclass
class SecurityEvent:
    """Represents a security event that may indicate a threat"""
    id: str
    event_type: str
    source_ip: Optional[str]
    target_ip: Optional[str]
    timestamp: datetime
    event_data: Dict[str, Any]
    threat_indicators: List[ThreatIndicator]
    risk_score: float
    requires_investigation: bool

class ThreatDetector:
    """Main threat detection engine"""
    
    def __init__(self, config_path: str = "config/incident-config.json"):
        self.config = self._load_config(config_path)
        self.event_queue = queue.Queue()
        self.threat_indicators = {}
        self.detection_rules = self._load_detection_rules()
        self.baseline_data = {}
        self.active_monitors = {}
        self.event_history = deque(maxlen=10000)
        self.detection_callbacks = []
        
        # Start background monitoring
        self._start_monitoring()
        
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
            "threat_detection": {
                "baseline_aggregation_interval": 300,  # 5 minutes
                "anomaly_threshold": 2.5,  # standard deviations
                "monitoring_interval": 10,  # seconds
                "threat_intelligence_feeds": [],
                "custom_indicators": []
            }
        }
    
    def _load_detection_rules(self) -> Dict[str, Any]:
        """Load detection rules from configuration"""
        return {
            "malware_detection": {
                "file_hashes": [
                    # Known malicious file hashes would be loaded from threat intelligence
                ],
                "process_patterns": [
                    r"cmd\.exe",
                    r"powershell\.exe.*-enc",
                    r"regsvr32.*javascript:",
                    r"rundll32.*javascript:"
                ],
                "network_signatures": [
                    r"C2.*beaconing",
                    r"data.*exfiltration"
                ]
            },
            "phishing_detection": {
                "suspicious_domains": [
                    # Suspicious domains from threat intelligence
                ],
                "email_patterns": [
                    r"urgent.*action.*required",
                    r"verify.*account.*immediately",
                    r"password.*expired"
                ],
                "url_patterns": [
                    r"bit\.ly/.*",
                    r"tinyurl\.com/.*",
                    r".*\.tk/.*",
                    r".*\.ml/.*"
                ]
            },
            "network_intrusion": {
                "port_scans": {
                    "threshold": 10,
                    "time_window": 60
                },
                "failed_logins": {
                    "threshold": 5,
                    "time_window": 300
                },
                "privilege_escalation": {
                    "suspicious_processes": [
                        "mimikatz",
                        "mimilib",
                        "procdump"
                    ]
                }
            },
            "ddos_detection": {
                "traffic_thresholds": {
                    "packets_per_second": 10000,
                    "connections_per_second": 1000,
                    "bandwidth_mbps": 100
                },
                "suspicious_patterns": [
                    "syn_flood",
                    "udp_flood",
                    "http_flood"
                ]
            }
        }
    
    def _start_monitoring(self):
        """Start background monitoring threads"""
        # Network monitoring
        network_thread = threading.Thread(target=self._monitor_network, daemon=True)
        network_thread.start()
        
        # System monitoring
        system_thread = threading.Thread(target=self._monitor_system, daemon=True)
        system_thread.start()
        
        # Log file monitoring
        log_thread = threading.Thread(target=self._monitor_logs, daemon=True)
        log_thread.start()
        
        # Threat intelligence feeds
        threat_intel_thread = threading.Thread(target=self._update_threat_intelligence, daemon=True)
        threat_intel_thread.start()
        
        logger.info("Threat detection monitoring started")
    
    def _monitor_network(self):
        """Monitor network traffic for suspicious activity"""
        while True:
            try:
                # Monitor network connections
                connections = psutil.net_connections()
                suspicious_connections = self._analyze_connections(connections)
                
                for connection in suspicious_connections:
                    self._process_security_event(connection)
                
                time.sleep(self.config.get("threat_detection", {}).get("monitoring_interval", 10))
                
            except Exception as e:
                logger.error(f"Error in network monitoring: {e}")
                time.sleep(60)  # Wait longer on error
    
    def _monitor_system(self):
        """Monitor system activity for security threats"""
        while True:
            try:
                # Monitor running processes
                processes = list(psutil.process_iter(['pid', 'name', 'cmdline', 'username']))
                suspicious_processes = self._analyze_processes(processes)
                
                for process in suspicious_processes:
                    self._process_security_event(process)
                
                # Monitor file system changes
                file_events = self._monitor_file_system()
                for event in file_events:
                    self._process_security_event(event)
                
                time.sleep(self.config.get("threat_detection", {}).get("monitoring_interval", 10))
                
            except Exception as e:
                logger.error(f"Error in system monitoring: {e}")
                time.sleep(60)
    
    def _monitor_logs(self):
        """Monitor log files for security events"""
        log_files = [
            "/var/log/auth.log",
            "/var/log/syslog",
            "/var/log/ufw.log",
            "/var/log/apache2/access.log"
        ]
        
        file_positions = {}
        
        for log_file in log_files:
            try:
                with open(log_file, 'r') as f:
                    f.seek(0, 2)  # Go to end
                    file_positions[log_file] = f.tell()
            except FileNotFoundError:
                logger.warning(f"Log file {log_file} not found")
                continue
        
        while True:
            try:
                for log_file, position in file_positions.items():
                    try:
                        with open(log_file, 'r') as f:
                            f.seek(position)
                            new_lines = f.readlines()
                            
                            for line in new_lines:
                                log_event = self._parse_log_line(line, log_file)
                                if log_event:
                                    self._process_security_event(log_event)
                            
                            f.seek(0, 2)  # Go to end
                            file_positions[log_file] = f.tell()
                    except FileNotFoundError:
                        logger.warning(f"Log file {log_file} no longer exists")
                
                time.sleep(30)  # Check logs every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in log monitoring: {e}")
                time.sleep(60)
    
    def _update_threat_intelligence(self):
        """Update threat intelligence feeds"""
        while True:
            try:
                # This would integrate with external threat intelligence feeds
                # For now, we'll simulate threat indicator updates
                self._update_local_threat_indicators()
                
                # Update every hour
                time.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error updating threat intelligence: {e}")
                time.sleep(3600)
    
    def _analyze_connections(self, connections: List) -> List[SecurityEvent]:
        """Analyze network connections for suspicious activity"""
        suspicious_events = []
        ip_stats = defaultdict(int)
        port_stats = defaultdict(int)
        
        # Count connections per IP
        for conn in connections:
            if conn.raddr:
                ip_stats[conn.raddr.ip] += 1
                port_stats[conn.raddr.port] += 1
        
        # Detect potential port scanning
        for ip, count in ip_stats.items():
            if count > 10:  # Threshold for port scanning
                event = SecurityEvent(
                    id=f"port_scan_{ip}_{int(time.time())}",
                    event_type="suspicious_network_activity",
                    source_ip=ip,
                    target_ip=None,
                    timestamp=datetime.now(),
                    event_data={
                        "connection_count": count,
                        "description": f"Potential port scan from {ip}"
                    },
                    threat_indicators=[],
                    risk_score=0.7,
                    requires_investigation=True
                )
                suspicious_events.append(event)
        
        # Detect connections to suspicious ports
        suspicious_ports = [4444, 1337, 31337, 6666, 1234]  # Common backdoor ports
        for port, count in port_stats.items():
            if port in suspicious_ports:
                event = SecurityEvent(
                    id=f"suspicious_port_{port}_{int(time.time())}",
                    event_type="suspicious_network_activity",
                    source_ip=None,
                    target_ip=None,
                    timestamp=datetime.now(),
                    event_data={
                        "port": port,
                        "connection_count": count,
                        "description": f"Connections to suspicious port {port}"
                    },
                    threat_indicators=[],
                    risk_score=0.8,
                    requires_investigation=True
                )
                suspicious_events.append(event)
        
        return suspicious_events
    
    def _analyze_processes(self, processes: List) -> List[SecurityEvent]:
        """Analyze running processes for malicious activity"""
        suspicious_events = []
        
        # Suspicious process patterns
        suspicious_patterns = [
            "mimikatz", "mimilib", "procdump", "wmic", "cscript", "wscript",
            "powershell", "cmd.exe", "bash", "sh", "netcat", "nc"
        ]
        
        for proc in processes:
            try:
                process_name = proc.info['name'].lower()
                
                # Check for suspicious processes
                for pattern in suspicious_patterns:
                    if pattern in process_name:
                        # Check for suspicious command line arguments
                        cmdline = ' '.join(proc.info['cmdline'] or [])
                        
                        if pattern in ["powershell", "cmd.exe"] and ("-enc" in cmdline or "-nop" in cmdline):
                            # Suspicious encoded PowerShell or batch commands
                            event = SecurityEvent(
                                id=f"suspicious_process_{proc.info['pid']}_{int(time.time())}",
                                event_type="suspicious_process",
                                source_ip=None,
                                target_ip=None,
                                timestamp=datetime.now(),
                                event_data={
                                    "pid": proc.info['pid'],
                                    "process_name": proc.info['name'],
                                    "command_line": cmdline,
                                    "username": proc.info['username'],
                                    "description": f"Suspicious {pattern} process detected"
                                },
                                threat_indicators=[],
                                risk_score=0.9,
                                requires_investigation=True
                            )
                            suspicious_events.append(event)
                            break
                        
                        elif pattern in ["mimikatz", "mimilib", "procdump"]:
                            # Potential credential harvesting tools
                            event = SecurityEvent(
                                id=f"credential_tool_{proc.info['pid']}_{int(time.time())}",
                                event_type="potential_credential_harvesting",
                                source_ip=None,
                                target_ip=None,
                                timestamp=datetime.now(),
                                event_data={
                                    "pid": proc.info['pid'],
                                    "process_name": proc.info['name'],
                                    "command_line": cmdline,
                                    "username": proc.info['username'],
                                    "description": f"Potential credential harvesting tool: {pattern}"
                                },
                                threat_indicators=[],
                                risk_score=0.95,
                                requires_investigation=True
                            )
                            suspicious_events.append(event)
                            break
                            
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return suspicious_events
    
    def _monitor_file_system(self) -> List[SecurityEvent]:
        """Monitor file system for security-relevant changes"""
        # This would implement file system monitoring using inotify or similar
        # For now, return empty list
        return []
    
    def _parse_log_line(self, line: str, log_file: str) -> Optional[SecurityEvent]:
        """Parse log line and extract security events"""
        if "Failed password" in line:
            # Failed login attempt
            match = re.search(r"Failed password for (\w+) from ([\d\.]+) port (\d+)", line)
            if match:
                username = match.group(1)
                source_ip = match.group(2)
                
                return SecurityEvent(
                    id=f"failed_login_{source_ip}_{int(time.time())}",
                    event_type="failed_login",
                    source_ip=source_ip,
                    target_ip=None,
                    timestamp=datetime.now(),
                    event_data={
                        "username": username,
                        "log_line": line.strip(),
                        "source_file": log_file
                    },
                    threat_indicators=[],
                    risk_score=0.5,
                    requires_investigation=False
                )
        
        elif "Invalid user" in line:
            # Invalid user login attempt
            match = re.search(r"Invalid user (\w+) from ([\d\.]+)", line)
            if match:
                username = match.group(1)
                source_ip = match.group(2)
                
                return SecurityEvent(
                    id=f"invalid_user_{source_ip}_{int(time.time())}",
                    event_type="invalid_user_login",
                    source_ip=source_ip,
                    target_ip=None,
                    timestamp=datetime.now(),
                    event_data={
                        "username": username,
                        "log_line": line.strip(),
                        "source_file": log_file
                    },
                    threat_indicators=[],
                    risk_score=0.4,
                    requires_investigation=False
                )
        
        elif "UFW BLOCK" in line:
            # Firewall block event
            return SecurityEvent(
                id=f"firewall_block_{int(time.time())}",
                event_type="firewall_block",
                source_ip=None,
                target_ip=None,
                timestamp=datetime.now(),
                event_data={
                    "log_line": line.strip(),
                    "source_file": log_file
                },
                threat_indicators=[],
                risk_score=0.3,
                requires_investigation=False
            )
        
        return None
    
    def _update_local_threat_indicators(self):
        """Update local threat indicators"""
        # This would update threat indicators from local sources
        # For demonstration, we'll add some basic indicators
        current_time = datetime.now()
        
        # Add some example threat indicators
        self.threat_indicators["suspicious_ip_1"] = ThreatIndicator(
            id="suspicious_ip_1",
            type="ip_address",
            value="192.168.1.100",
            source="local_analysis",
            confidence=0.8,
            timestamp=current_time,
            metadata={"reason": "Multiple failed logins"},
            severity=ThreatLevel.MEDIUM,
            category=ThreatCategory.SUSPICIOUS_ACTIVITY
        )
        
        self.threat_indicators["suspicious_domain_1"] = ThreatIndicator(
            id="suspicious_domain_1",
            type="domain",
            value="malicious-site.com",
            source="threat_intelligence",
            confidence=0.9,
            timestamp=current_time,
            metadata={"reason": "Known phishing domain"},
            severity=ThreatLevel.HIGH,
            category=ThreatCategory.PHISHING
        )
        
        logger.info("Threat indicators updated")
    
    def _process_security_event(self, event: SecurityEvent):
        """Process a security event through the detection pipeline"""
        # Add to event history
        self.event_history.append(event)
        
        # Run event through detection rules
        self._apply_detection_rules(event)
        
        # Check against threat indicators
        self._check_threat_indicators(event)
        
        # Calculate final risk score
        self._calculate_risk_score(event)
        
        # Trigger alerts if necessary
        if event.requires_investigation and event.risk_score >= 0.7:
            self._trigger_alert(event)
        
        # Call registered callbacks
        for callback in self.detection_callbacks:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Error in detection callback: {e}")
    
    def _apply_detection_rules(self, event: SecurityEvent):
        """Apply detection rules to the security event"""
        if event.event_type == "suspicious_process":
            # Check against malware detection rules
            process_name = event.event_data.get("process_name", "").lower()
            
            for pattern in self.detection_rules["malware_detection"]["process_patterns"]:
                if re.search(pattern, process_name):
                    indicator = ThreatIndicator(
                        id=f"malware_pattern_{int(time.time())}",
                        type="process_pattern",
                        value=pattern,
                        source="rule_engine",
                        confidence=0.8,
                        timestamp=datetime.now(),
                        metadata={"event_id": event.id, "process_name": process_name},
                        severity=ThreatLevel.HIGH,
                        category=ThreatCategory.MALWARE
                    )
                    event.threat_indicators.append(indicator)
                    event.risk_score = max(event.risk_score, 0.8)
        
        elif event.event_type == "failed_login":
            # Check for brute force patterns
            recent_failures = [
                e for e in self.event_history 
                if e.event_type == "failed_login" 
                and e.source_ip == event.source_ip
                and (datetime.now() - e.timestamp).total_seconds() < 300  # 5 minutes
            ]
            
            if len(recent_failures) >= 5:  # Threshold for brute force
                event.risk_score = 0.7
                event.requires_investigation = True
                
                indicator = ThreatIndicator(
                    id=f"brute_force_{event.source_ip}_{int(time.time())}",
                    type="brute_force_attempt",
                    value=event.source_ip,
                    source="rule_engine",
                    confidence=0.9,
                    timestamp=datetime.now(),
                    metadata={"failure_count": len(recent_failures)},
                    severity=ThreatLevel.HIGH,
                    category=ThreatCategory.NETWORK_INTRUSION
                )
                event.threat_indicators.append(indicator)
    
    def _check_threat_indicators(self, event: SecurityEvent):
        """Check security event against threat indicators"""
        # Check source IP against threat indicators
        if event.source_ip:
            for indicator in self.threat_indicators.values():
                if indicator.type == "ip_address" and indicator.value == event.source_ip:
                    event.threat_indicators.append(indicator)
                    event.risk_score = max(event.risk_score, indicator.confidence)
        
        # Check event data for other indicators
        event_data_str = json.dumps(event.event_data).lower()
        for indicator in self.threat_indicators.values():
            if indicator.type == "domain" and indicator.value.lower() in event_data_str:
                event.threat_indicators.append(indicator)
                event.risk_score = max(event.risk_score, indicator.confidence)
    
    def _calculate_risk_score(self, event: SecurityEvent):
        """Calculate final risk score for the event"""
        base_score = event.risk_score
        
        # Adjust based on threat indicators
        indicator_score = 0
        for indicator in event.threat_indicators:
            indicator_score += indicator.confidence
        
        if event.threat_indicators:
            indicator_score /= len(event.threat_indicators)
        
        # Combine base and indicator scores
        final_score = max(base_score, indicator_score)
        
        # Normalize to 0-1 range
        event.risk_score = min(final_score, 1.0)
        
        # Determine if investigation is required
        if event.risk_score >= 0.7:
            event.requires_investigation = True
        elif event.risk_score >= 0.5:
            event.requires_investigation = event.event_type in ["suspicious_process", "potential_credential_harvesting"]
    
    def _trigger_alert(self, event: SecurityEvent):
        """Trigger alert for high-risk security event"""
        alert_data = {
            "event_id": event.id,
            "event_type": event.event_type,
            "risk_score": event.risk_score,
            "source_ip": event.source_ip,
            "timestamp": event.timestamp.isoformat(),
            "description": event.event_data.get("description", "Security event detected"),
            "threat_indicators": [asdict(indicator) for indicator in event.threat_indicators]
        }
        
        # Log the alert
        logger.warning(f"HIGH RISK SECURITY EVENT: {json.dumps(alert_data, indent=2)}")
        
        # This would integrate with notification systems
        # For now, we'll just log it
        self._send_notification(alert_data)
    
    def _send_notification(self, alert_data: Dict[str, Any]):
        """Send alert notification (placeholder)"""
        # This would integrate with email, Slack, PagerDuty, etc.
        logger.info(f"Alert notification would be sent: {alert_data['event_id']}")
    
    def register_detection_callback(self, callback):
        """Register a callback function to be called when events are detected"""
        self.detection_callbacks.append(callback)
    
    def get_recent_events(self, hours: int = 24) -> List[SecurityEvent]:
        """Get security events from the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [event for event in self.event_history if event.timestamp >= cutoff_time]
    
    def get_threat_indicators(self) -> Dict[str, ThreatIndicator]:
        """Get all current threat indicators"""
        return self.threat_indicators.copy()
    
    def add_threat_indicator(self, indicator: ThreatIndicator):
        """Add a new threat indicator"""
        self.threat_indicators[indicator.id] = indicator
        logger.info(f"Added threat indicator: {indicator.id}")
    
    def remove_threat_indicator(self, indicator_id: str):
        """Remove a threat indicator"""
        if indicator_id in self.threat_indicators:
            del self.threat_indicators[indicator_id]
            logger.info(f"Removed threat indicator: {indicator_id}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get threat detection statistics"""
        events = list(self.event_history)
        
        return {
            "total_events": len(events),
            "events_by_type": defaultdict(int),
            "events_by_risk_level": defaultdict(int),
            "events_requiring_investigation": len([e for e in events if e.requires_investigation]),
            "high_risk_events": len([e for e in events if e.risk_score >= 0.7]),
            "threat_indicators": len(self.threat_indicators),
            "recent_activity": {
                "last_hour": len([e for e in events if (datetime.now() - e.timestamp).total_seconds() < 3600]),
                "last_day": len([e for e in events if (datetime.now() - e.timestamp).total_seconds() < 86400])
            }
        }

def main():
    """Main function to run the threat detection system"""
    detector = ThreatDetector()
    
    # Register a callback for detected events
    def on_threat_detected(event: SecurityEvent):
        print(f"Threat Detected: {event.event_type} - Risk Score: {event.risk_score:.2f}")
        if event.source_ip:
            print(f"Source IP: {event.source_ip}")
        print(f"Description: {event.event_data.get('description', 'N/A')}")
        print("-" * 50)
    
    detector.register_detection_callback(on_threat_detected)
    
    print("Starting Automated Threat Detection System...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            # Print statistics periodically
            stats = detector.get_statistics()
            print(f"\rEvents: {stats['total_events']}, High Risk: {stats['high_risk_events']}, Investigating: {stats['events_requiring_investigation']}", end="", flush=True)
            time.sleep(60)  # Print stats every minute
            
    except KeyboardInterrupt:
        print("\nThreat detection system stopped")

if __name__ == "__main__":
    main()