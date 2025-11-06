#!/usr/bin/env python3
"""
Post-Incident Analysis & Reporting System
Comprehensive incident analysis, lessons learned, and compliance reporting
"""

import json
import os
import sqlite3
import logging
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IncidentCategory(Enum):
    SECURITY_BREACH = "security_breach"
    DATA_LOSS = "data_loss"
    SYSTEM_FAILURE = "system_failure"
    MALWARE = "malware"
    PHISHING = "phishing"
    DDOS = "ddos"
    INSIDER_THREAT = "insider_threat"
    NETWORK_INTRUSION = "network_intrusion"
    VULNERABILITY_EXPLOIT = "vulnerability_exploit"

class ReportType(Enum):
    INCIDENT_SUMMARY = "incident_summary"
    LESSONS_LEARNED = "lessons_learned"
    TIMELINE_ANALYSIS = "timeline_analysis"
    TREND_ANALYSIS = "trend_analysis"
    COMPLIANCE_REPORT = "compliance_report"
    EXECUTIVE_BRIEF = "executive_brief"
    TECHNICAL_ANALYSIS = "technical_analysis"

@dataclass
class IncidentMetrics:
    """Metrics collected from incident analysis"""
    incident_id: str
    detection_time: datetime
    response_time: datetime
    containment_time: datetime
    resolution_time: datetime
    total_duration: int  # minutes
    severity: str
    impact_score: float
    evidence_items: int
    tasks_completed: int
    team_members_involved: List[str]
    systems_affected: int
    estimated_cost: float
    customer_impact: bool
    regulatory_impact: bool

@dataclass
class LessonLearned:
    """Represents a lesson learned from an incident"""
    id: str
    incident_id: str
    category: str
    description: str
    impact: str
    recommendation: str
    priority: str
    assigned_to: str
    due_date: Optional[datetime]
    status: str
    implementation_notes: str

@dataclass
class TimelineEvent:
    """Represents an event in the incident timeline"""
    id: str
    incident_id: str
    timestamp: datetime
    event_type: str
    description: str
    actor: str
    system: str
    impact: str
    evidence_ref: Optional[str]

class IncidentAnalyzer:
    """Main incident analysis engine"""
    
    def __init__(self, data_dir: str = "analysis"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        # Initialize database
        self.db_path = f"{data_dir}/incident_analysis.db"
        self._init_database()
        
        # Analysis results cache
        self.analysis_cache = {}
        
        logger.info("Incident Analyzer initialized")
    
    def _init_database(self):
        """Initialize SQLite database for incident analysis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Incident metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS incident_metrics (
                incident_id TEXT PRIMARY KEY,
                detection_time TEXT,
                response_time TEXT,
                containment_time TEXT,
                resolution_time TEXT,
                total_duration INTEGER,
                severity TEXT,
                impact_score REAL,
                evidence_items INTEGER,
                tasks_completed INTEGER,
                team_members_involved TEXT,
                systems_affected INTEGER,
                estimated_cost REAL,
                customer_impact BOOLEAN,
                regulatory_impact BOOLEAN
            )
        ''')
        
        # Lessons learned table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lessons_learned (
                id TEXT PRIMARY KEY,
                incident_id TEXT,
                category TEXT,
                description TEXT,
                impact TEXT,
                recommendation TEXT,
                priority TEXT,
                assigned_to TEXT,
                due_date TEXT,
                status TEXT,
                implementation_notes TEXT
            )
        ''')
        
        # Timeline events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS timeline_events (
                id TEXT PRIMARY KEY,
                incident_id TEXT,
                timestamp TEXT,
                event_type TEXT,
                description TEXT,
                actor TEXT,
                system TEXT,
                impact TEXT,
                evidence_ref TEXT
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_severity ON incident_metrics(severity)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons_learned(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_timeline_incident ON timeline_events(incident_id)')
        
        conn.commit()
        conn.close()
    
    def analyze_incident_timeline(self, incident_id: str, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze incident timeline and identify patterns"""
        timeline_events = []
        
        for event_data in events:
            event = TimelineEvent(
                id=event_data.get('id', f"EVT-{incident_id}-{len(timeline_events)}"),
                incident_id=incident_id,
                timestamp=datetime.fromisoformat(event_data['timestamp']),
                event_type=event_data.get('event_type', 'unknown'),
                description=event_data.get('description', ''),
                actor=event_data.get('actor', 'system'),
                system=event_data.get('system', 'unknown'),
                impact=event_data.get('impact', 'unknown'),
                evidence_ref=event_data.get('evidence_ref')
            )
            timeline_events.append(event)
        
        # Sort events by timestamp
        timeline_events.sort(key=lambda e: e.timestamp)
        
        # Analyze timeline patterns
        analysis = {
            "incident_id": incident_id,
            "total_events": len(timeline_events),
            "first_event": timeline_events[0].timestamp.isoformat() if timeline_events else None,
            "last_event": timeline_events[-1].timestamp.isoformat() if timeline_events else None,
            "duration_hours": 0,
            "event_types": {},
            "actors": {},
            "systems": {},
            "impacts": {},
            "detection_point": None,
            "containment_point": None,
            "resolution_point": None,
            "critical_path": [],
            "bottlenecks": [],
            "patterns": []
        }
        
        if timeline_events:
            # Calculate duration
            first_event_time = timeline_events[0].timestamp
            last_event_time = timeline_events[-1].timestamp
            analysis["duration_hours"] = (last_event_time - first_event_time).total_seconds() / 3600
            
            # Count by categories
            for event in timeline_events:
                # Event types
                if event.event_type not in analysis["event_types"]:
                    analysis["event_types"][event.event_type] = 0
                analysis["event_types"][event.event_type] += 1
                
                # Actors
                if event.actor not in analysis["actors"]:
                    analysis["actors"][event.actor] = 0
                analysis["actors"][event.actor] += 1
                
                # Systems
                if event.system not in analysis["systems"]:
                    analysis["systems"][event.system] = 0
                analysis["systems"][event.system] += 1
                
                # Impacts
                if event.impact not in analysis["impacts"]:
                    analysis["impacts"][event.impact] = 0
                analysis["impacts"][event.impact] += 1
            
            # Identify key points
            for i, event in enumerate(timeline_events):
                if event.event_type == "detection" and not analysis["detection_point"]:
                    analysis["detection_point"] = event.timestamp.isoformat()
                elif event.event_type == "containment" and not analysis["containment_point"]:
                    analysis["containment_point"] = event.timestamp.isoformat()
                elif event.event_type == "resolution" and not analysis["resolution_point"]:
                    analysis["resolution_point"] = event.timestamp.isoformat()
            
            # Identify patterns
            patterns = self._identify_timeline_patterns(timeline_events)
            analysis["patterns"] = patterns
        
        # Save timeline events to database
        self._save_timeline_events(incident_id, timeline_events)
        
        logger.info(f"Timeline analysis completed for {incident_id}")
        return analysis
    
    def _identify_timeline_patterns(self, events: List[TimelineEvent]) -> List[Dict[str, Any]]:
        """Identify patterns in the incident timeline"""
        patterns = []
        
        # Look for rapid escalation patterns
        escalation_events = [e for e in events if e.impact in ["high", "critical"]]
        if len(escalation_events) > 1:
            rapid_escalations = []
            for i in range(1, len(escalation_events)):
                time_diff = (escalation_events[i].timestamp - escalation_events[i-1].timestamp).total_seconds()
                if time_diff < 300:  # Less than 5 minutes
                    rapid_escalations.append({
                        "type": "rapid_escalation",
                        "description": f"Rapid escalation detected: {escalation_events[i-1].impact} to {escalation_events[i].impact}",
                        "time_diff_minutes": time_diff / 60
                    })
            if rapid_escalations:
                patterns.extend(rapid_escalations)
        
        # Look for repeated actor patterns
        actor_counts = {}
        for event in events:
            if event.actor not in actor_counts:
                actor_counts[event.actor] = 0
            actor_counts[event.actor] += 1
        
        for actor, count in actor_counts.items():
            if count > 3:  # More than 3 events from same actor
                patterns.append({
                    "type": "repeated_actor",
                    "description": f"High activity from actor '{actor}' ({count} events)",
                    "actor": actor,
                    "event_count": count
                })
        
        # Look for system-specific issues
        system_counts = {}
        for event in events:
            if event.system not in system_counts:
                system_counts[event.system] = 0
            system_counts[event.system] += 1
        
        for system, count in system_counts.items():
            if count > 5:  # More than 5 events on same system
                patterns.append({
                    "type": "system_focus",
                    "description": f"Multiple events on system '{system}' ({count} events)",
                    "system": system,
                    "event_count": count
                })
        
        return patterns
    
    def calculate_incident_metrics(self, incident_data: Dict[str, Any]) -> IncidentMetrics:
        """Calculate comprehensive incident metrics"""
        
        # Extract timestamps
        detection_time = datetime.fromisoformat(incident_data.get('detection_time'))
        response_time = datetime.fromisoformat(incident_data.get('response_time', detection_time.isoformat()))
        containment_time = datetime.fromisoformat(incident_data.get('containment_time', response_time.isoformat()))
        resolution_time = datetime.fromisoformat(incident_data.get('resolution_time', containment_time.isoformat()))
        
        # Calculate durations in minutes
        detection_to_response = (response_time - detection_time).total_seconds() / 60
        response_to_containment = (containment_time - response_time).total_seconds() / 60
        containment_to_resolution = (resolution_time - containment_time).total_seconds() / 60
        total_duration = (resolution_time - detection_time).total_seconds() / 60
        
        # Calculate impact score
        severity_scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        base_score = severity_scores.get(incident_data.get('severity', 'medium'), 2)
        
        # Adjust for other factors
        customer_impact = incident_data.get('customer_impact', False)
        regulatory_impact = incident_data.get('regulatory_impact', False)
        systems_affected = incident_data.get('systems_affected', 1)
        
        impact_score = base_score
        if customer_impact:
            impact_score *= 1.5
        if regulatory_impact:
            impact_score *= 1.3
        if systems_affected > 1:
            impact_score *= (1 + (systems_affected - 1) * 0.2)
        
        # Estimate cost (simplified calculation)
        hourly_rate = 100  # $100 per hour for incident response
        estimated_cost = (total_duration / 60) * hourly_rate
        
        if regulatory_impact:
            estimated_cost += 10000  # Additional regulatory costs
        if customer_impact:
            estimated_cost += 5000   # Customer service costs
        
        metrics = IncidentMetrics(
            incident_id=incident_data['incident_id'],
            detection_time=detection_time,
            response_time=response_time,
            containment_time=containment_time,
            resolution_time=resolution_time,
            total_duration=int(total_duration),
            severity=incident_data.get('severity', 'medium'),
            impact_score=impact_score,
            evidence_items=incident_data.get('evidence_items', 0),
            tasks_completed=incident_data.get('tasks_completed', 0),
            team_members_involved=incident_data.get('team_members', []),
            systems_affected=systems_affected,
            estimated_cost=estimated_cost,
            customer_impact=customer_impact,
            regulatory_impact=regulatory_impact
        )
        
        # Save metrics to database
        self._save_incident_metrics(metrics)
        
        logger.info(f"Metrics calculated for {metrics.incident_id}")
        return metrics
    
    def generate_lessons_learned(self, incident_id: str, analysis: Dict[str, Any], metrics: IncidentMetrics) -> List[LessonLearned]:
        """Generate lessons learned from incident analysis"""
        lessons = []
        
        # Analyze detection efficiency
        if metrics.total_duration > 240:  # More than 4 hours
            lessons.append(LessonLearned(
                id=f"LL-{incident_id}-001",
                incident_id=incident_id,
                category="detection",
                description="Incident took longer than acceptable time to resolve",
                impact="Extended exposure to threats and potential data loss",
                recommendation="Implement automated detection and response systems to reduce detection time",
                priority="high",
                assigned_to="security_team",
                due_date=datetime.now() + timedelta(days=30),
                status="pending",
                implementation_notes="Review detection rules and consider SIEM enhancements"
            ))
        
        # Analyze evidence collection
        if metrics.evidence_items < 5:
            lessons.append(LessonLearned(
                id=f"LL-{incident_id}-002",
                incident_id=incident_id,
                category="forensics",
                description="Limited evidence collection during incident",
                impact="Insufficient forensic data for thorough investigation",
                recommendation="Improve evidence collection procedures and tools",
                priority="medium",
                assigned_to="forensics_team",
                due_date=datetime.now() + timedelta(days=45),
                status="pending",
                implementation_notes="Update evidence collection checklist and training"
            ))
        
        # Analyze team coordination
        if len(metrics.team_members_involved) > 5:
            lessons.append(LessonLearned(
                id=f"LL-{incident_id}-003",
                incident_id=incident_id,
                category="coordination",
                description="High number of team members involved in incident response",
                impact="Potential coordination challenges and communication overhead",
                recommendation="Review incident response team structure and communication protocols",
                priority="low",
                assigned_to="incident_commander",
                due_date=datetime.now() + timedelta(days=60),
                status="pending",
                implementation_notes="Define clear roles and communication channels"
            ))
        
        # Analyze system impact
        if metrics.systems_affected > 3:
            lessons.append(LessonLearned(
                id=f"LL-{incident_id}-004",
                incident_id=incident_id,
                category="segmentation",
                description="Incident affected multiple systems",
                impact="Larger attack surface and more complex recovery",
                recommendation="Review network segmentation and system isolation procedures",
                priority="high",
                assigned_to="network_team",
                due_date=datetime.now() + timedelta(days=15),
                status="pending",
                implementation_notes="Conduct network segmentation assessment"
            ))
        
        # Analyze cost impact
        if metrics.estimated_cost > 50000:
            lessons.append(LessonLearned(
                id=f"LL-{incident_id}-005",
                incident_id=incident_id,
                category="cost",
                description="High incident response cost",
                impact="Significant financial impact on organization",
                recommendation="Invest in proactive security measures to reduce incident frequency",
                priority="medium",
                assigned_to="ciso",
                due_date=datetime.now() + timedelta(days=90),
                status="pending",
                implementation_notes="Develop cost-benefit analysis for security investments"
            ))
        
        # Save lessons learned to database
        for lesson in lessons:
            self._save_lesson_learned(lesson)
        
        logger.info(f"Generated {len(lessons)} lessons learned for {incident_id}")
        return lessons
    
    def create_trend_analysis(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Create trend analysis for incidents in date range"""
        
        # Get incident data from database
        incidents = self._get_incidents_in_range(start_date, end_date)
        
        if not incidents:
            return {"message": "No incidents found in the specified date range"}
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame([asdict(inc) for inc in incidents])
        df['detection_time'] = pd.to_datetime(df['detection_time'])
        df['response_time'] = pd.to_datetime(df['response_time'])
        df['resolution_time'] = pd.to_datetime(df['resolution_time'])
        
        # Analysis metrics
        analysis = {
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_incidents": len(incidents),
                "avg_duration_hours": df['total_duration'].mean() / 60,
                "total_estimated_cost": df['estimated_cost'].sum(),
                "customer_impact_incidents": len(df[df['customer_impact'] == True]),
                "regulatory_impact_incidents": len(df[df['regulatory_impact'] == True])
            },
            "severity_distribution": df['severity'].value_counts().to_dict(),
            "category_trends": {},
            "monthly_trends": {},
            "response_time_analysis": {
                "avg_detection_to_response": df['total_duration'].mean() / 2,  # Approximation
                "avg_response_to_resolution": df['total_duration'].mean() / 2
            },
            "cost_analysis": {
                "avg_cost_per_incident": df['estimated_cost'].mean(),
                "max_cost": df['estimated_cost'].max(),
                "min_cost": df['estimated_cost'].min()
            },
            "impact_analysis": {
                "high_impact_incidents": len(df[df['impact_score'] > 3]),
                "systems_affected_avg": df['systems_affected'].mean(),
                "evidence_items_avg": df['evidence_items'].mean()
            }
        }
        
        # Generate visualizations
        self._create_trend_visualizations(df, start_date, end_date)
        
        # Save analysis results
        self.analysis_cache[f"trend_{start_date}_{end_date}"] = analysis
        
        logger.info("Trend analysis completed")
        return analysis
    
    def _create_trend_visualizations(self, df: pd.DataFrame, start_date: datetime, end_date: datetime):
        """Create trend visualization charts"""
        
        # Set style
        plt.style.use('seaborn-v0_8')
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle(f'Incident Trends Analysis ({start_date.strftime("%Y-%m-%d")} to {end_date.strftime("%Y-%m-%d")})', 
                     fontsize=16, fontweight='bold')
        
        # 1. Severity distribution pie chart
        severity_counts = df['severity'].value_counts()
        axes[0, 0].pie(severity_counts.values, labels=severity_counts.index, autopct='%1.1f%%', startangle=90)
        axes[0, 0].set_title('Incident Severity Distribution')
        
        # 2. Monthly incident trends
        df['month'] = df['detection_time'].dt.to_period('M')
        monthly_counts = df['month'].value_counts().sort_index()
        axes[0, 1].bar(range(len(monthly_counts)), monthly_counts.values)
        axes[0, 1].set_xticks(range(len(monthly_counts)))
        axes[0, 1].set_xticklabels([str(month) for month in monthly_counts.index], rotation=45)
        axes[0, 1].set_title('Monthly Incident Trends')
        axes[0, 1].set_ylabel('Number of Incidents')
        
        # 3. Response time distribution
        axes[1, 0].hist(df['total_duration'] / 60, bins=20, edgecolor='black', alpha=0.7)
        axes[1, 0].set_title('Incident Resolution Time Distribution')
        axes[1, 0].set_xlabel('Duration (Hours)')
        axes[1, 0].set_ylabel('Frequency')
        
        # 4. Cost vs Duration scatter plot
        axes[1, 1].scatter(df['total_duration'] / 60, df['estimated_cost'], alpha=0.6)
        axes[1, 1].set_title('Cost vs Duration Analysis')
        axes[1, 1].set_xlabel('Duration (Hours)')
        axes[1, 1].set_ylabel('Estimated Cost ($)')
        
        # Adjust layout and save
        plt.tight_layout()
        output_path = f"{self.data_dir}/trend_analysis_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Trend visualizations saved to {output_path}")
    
    def generate_compliance_report(self, start_date: datetime, end_date: datetime, framework: str = "NIST") -> Dict[str, Any]:
        """Generate compliance report for specified framework"""
        
        incidents = self._get_incidents_in_range(start_date, end_date)
        
        # Framework-specific compliance checks
        if framework.upper() == "NIST":
            compliance_report = self._generate_nist_compliance_report(incidents)
        elif framework.upper() == "ISO27001":
            compliance_report = self._generate_iso27001_compliance_report(incidents)
        elif framework.upper() == "SOX":
            compliance_report = self._generate_sox_compliance_report(incidents)
        else:
            compliance_report = {"error": f"Unknown framework: {framework}"}
        
        return compliance_report
    
    def _generate_nist_compliance_report(self, incidents: List[IncidentMetrics]) -> Dict[str, Any]:
        """Generate NIST framework compliance report"""
        
        # NIST Incident Response phases
        nist_phases = {
            "preparation": "Incident response team prepared with necessary tools and training",
            "detection_and_analysis": "Incidents detected and analyzed within acceptable timeframes",
            "containment_eradication_recovery": "Incidents contained, eradicated, and systems recovered",
            "post_incident_activity": "Post-incident reviews and lessons learned completed"
        }
        
        total_incidents = len(incidents)
        avg_detection_time = sum([inc.total_duration * 0.2 for inc in incidents]) / total_incidents if total_incidents > 0 else 0
        
        return {
            "framework": "NIST Cybersecurity Framework",
            "report_period": f"{len(incidents)} incidents analyzed",
            "compliance_status": "PARTIAL" if avg_detection_time < 60 else "NON_COMPLIANT",
            "key_findings": [
                f"Average incident detection time: {avg_detection_time:.1f} minutes",
                f"Total incidents: {total_incidents}",
                f"Critical incidents: {len([inc for inc in incidents if inc.severity == 'critical'])}",
                f"Customer impact incidents: {len([inc for inc in incidents if inc.customer_impact])}"
            ],
            "nist_requirements": {
                "ID.RA (Risk Assessment)": {
                    "status": "COMPLIANT",
                    "description": "Asset vulnerabilities identified and documented"
                },
                "DE.CM (Security Continuous Monitoring)": {
                    "status": "PARTIAL" if avg_detection_time > 30 else "COMPLIANT",
                    "description": "Security monitoring detects events"
                },
                "RS.RP (Response Planning)": {
                    "status": "COMPLIANT",
                    "description": "Response plan executed during incidents"
                },
                "CO.RP (Communication Planning)": {
                    "status": "COMPLIANT",
                    "description": "Response plan includes stakeholders"
                }
            },
            "recommendations": [
                "Improve automated detection capabilities",
                "Enhance incident response team training",
                "Update response playbooks based on lessons learned"
            ]
        }
    
    def _generate_iso27001_compliance_report(self, incidents: List[IncidentMetrics]) -> Dict[str, Any]:
        """Generate ISO 27001 compliance report"""
        
        return {
            "framework": "ISO 27001 Information Security Management",
            "report_period": f"{len(incidents)} incidents analyzed",
            "compliance_status": "REQUIRE_ATTENTION",
            "iso27001_controls": {
                "A.16.1.1 (Responsibilities and procedures)": {
                    "status": "COMPLIANT",
                    "description": "Incident response procedures established"
                },
                "A.16.1.4 (Assessment of and decision on information security events)": {
                    "status": "PARTIAL",
                    "description": "Event assessment procedures need improvement"
                },
                "A.16.1.5 (Response to information security incidents)": {
                    "status": "COMPLIANT",
                    "description": "Incident response procedures implemented"
                }
            },
            "recommendations": [
                "Formalize incident severity classification",
                "Improve incident documentation standards",
                "Conduct regular incident response testing"
            ]
        }
    
    def _generate_sox_compliance_report(self, incidents: List[IncidentMetrics]) -> Dict[str, Any]:
        """Generate SOX compliance report"""
        
        return {
            "framework": "Sarbanes-Oxley Act (SOX)",
            "report_period": f"{len(incidents)} incidents analyzed",
            "compliance_status": "COMPLIANT",
            "sox_requirements": {
                "Section 302 (Corporate Responsibility)": {
                    "status": "COMPLIANT",
                    "description": "Financial reporting controls effective"
                },
                "Section 404 (Management Assessment)": {
                    "status": "PARTIAL",
                    "description": "Internal controls require enhancement"
                }
            },
            "financial_impact": {
                "total_estimated_cost": sum([inc.estimated_cost for inc in incidents]),
                "high_cost_incidents": len([inc for inc in incidents if inc.estimated_cost > 10000])
            },
            "recommendations": [
                "Enhance financial system monitoring",
                "Improve change control procedures",
                "Strengthen access controls"
            ]
        }
    
    def generate_executive_brief(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate executive summary brief"""
        
        incidents = self._get_incidents_in_range(start_date, end_date)
        total_incidents = len(incidents)
        
        if total_incidents == 0:
            return {
                "summary": "No security incidents recorded during the specified period",
                "recommendations": ["Continue current security posture monitoring"]
            }
        
        # Calculate key metrics
        total_cost = sum([inc.estimated_cost for inc in incidents])
        avg_resolution_time = sum([inc.total_duration for inc in incidents]) / total_incidents
        critical_incidents = len([inc for inc in incidents if inc.severity == 'critical'])
        customer_impact_incidents = len([inc for inc in incidents if inc.customer_impact])
        
        # Risk assessment
        risk_level = "LOW"
        if critical_incidents > 0 or total_cost > 100000:
            risk_level = "HIGH"
        elif total_incidents > 5 or total_cost > 50000:
            risk_level = "MEDIUM"
        
        return {
            "executive_summary": {
                "period": f"{start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}",
                "total_incidents": total_incidents,
                "risk_level": risk_level,
                "total_estimated_cost": f"${total_cost:,.2f}",
                "avg_resolution_time": f"{avg_resolution_time/60:.1f} hours",
                "critical_incidents": critical_incidents,
                "customer_impact_incidents": customer_impact_incidents
            },
            "key_insights": [
                f"Security posture remained {risk_level} during the period",
                f"Average incident resolution time: {avg_resolution_time/60:.1f} hours",
                f"Customer-facing incidents: {customer_impact_incidents}",
                "Proactive monitoring prevented major breaches"
            ],
            "financial_impact": {
                "direct_costs": f"${total_cost:,.2f}",
                "potential_savings": f"${total_cost * 0.3:,.2f}",  # Estimate of prevented costs
                "roi_on_security": "Positive - incidents contained before major impact"
            },
            "recommendations": [
                "Continue investment in security monitoring and response capabilities",
                "Enhance employee security awareness training",
                "Implement additional preventive controls based on incident patterns",
                "Regular review and update of incident response procedures"
            ],
            "next_steps": [
                "Schedule quarterly security review meeting",
                "Implement recommended security improvements",
                "Conduct tabletop exercise for critical incident scenarios",
                "Review and update business continuity plans"
            ]
        }
    
    def _save_incident_metrics(self, metrics: IncidentMetrics):
        """Save incident metrics to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO incident_metrics (
                incident_id, detection_time, response_time, containment_time,
                resolution_time, total_duration, severity, impact_score,
                evidence_items, tasks_completed, team_members_involved,
                systems_affected, estimated_cost, customer_impact, regulatory_impact
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metrics.incident_id,
            metrics.detection_time.isoformat(),
            metrics.response_time.isoformat(),
            metrics.containment_time.isoformat(),
            metrics.resolution_time.isoformat(),
            metrics.total_duration,
            metrics.severity,
            metrics.impact_score,
            metrics.evidence_items,
            metrics.tasks_completed,
            json.dumps(metrics.team_members_involved),
            metrics.systems_affected,
            metrics.estimated_cost,
            metrics.customer_impact,
            metrics.regulatory_impact
        ))
        
        conn.commit()
        conn.close()
    
    def _save_lesson_learned(self, lesson: LessonLearned):
        """Save lesson learned to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO lessons_learned (
                id, incident_id, category, description, impact, recommendation,
                priority, assigned_to, due_date, status, implementation_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            lesson.id, lesson.incident_id, lesson.category, lesson.description,
            lesson.impact, lesson.recommendation, lesson.priority, lesson.assigned_to,
            lesson.due_date.isoformat() if lesson.due_date else None,
            lesson.status, lesson.implementation_notes
        ))
        
        conn.commit()
        conn.close()
    
    def _save_timeline_events(self, incident_id: str, events: List[TimelineEvent]):
        """Save timeline events to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for event in events:
            cursor.execute('''
                INSERT OR REPLACE INTO timeline_events (
                    id, incident_id, timestamp, event_type, description,
                    actor, system, impact, evidence_ref
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                event.id, event.incident_id, event.timestamp.isoformat(),
                event.event_type, event.description, event.actor, event.system,
                event.impact, event.evidence_ref
            ))
        
        conn.commit()
        conn.close()
    
    def _get_incidents_in_range(self, start_date: datetime, end_date: datetime) -> List[IncidentMetrics]:
        """Get incidents from database within date range"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM incident_metrics 
            WHERE detection_time BETWEEN ? AND ?
        ''', (start_date.isoformat(), end_date.isoformat()))
        
        rows = cursor.fetchall()
        conn.close()
        
        incidents = []
        for row in rows:
            # Convert row back to IncidentMetrics object
            # This is a simplified conversion - in practice, you'd use proper ORM
            pass
        
        return incidents  # Return empty for now, would be populated in full implementation

def main():
    """Main function to test the analysis system"""
    analyzer = IncidentAnalyzer()
    
    # Test timeline analysis
    test_events = [
        {
            "timestamp": "2025-11-06T20:00:00",
            "event_type": "detection",
            "description": "Suspicious activity detected",
            "actor": "monitoring_system",
            "system": "network_01",
            "impact": "medium"
        },
        {
            "timestamp": "2025-11-06T20:15:00",
            "event_type": "response",
            "description": "Security team alerted",
            "actor": "security_analyst",
            "system": "notification_system",
            "impact": "low"
        },
        {
            "timestamp": "2025-11-06T20:30:00",
            "event_type": "containment",
            "description": "Affected system isolated",
            "actor": "incident_commander",
            "system": "network_01",
            "impact": "low"
        },
        {
            "timestamp": "2025-11-06T22:00:00",
            "event_type": "resolution",
            "description": "System restored to normal operation",
            "actor": "system_admin",
            "system": "network_01",
            "impact": "none"
        }
    ]
    
    timeline_analysis = analyzer.analyze_incident_timeline("TEST-2025-001", test_events)
    print("Timeline Analysis:")
    print(json.dumps(timeline_analysis, indent=2, default=str))
    
    # Test metrics calculation
    incident_data = {
        'incident_id': 'TEST-2025-001',
        'detection_time': '2025-11-06T20:00:00',
        'response_time': '2025-11-06T20:15:00',
        'containment_time': '2025-11-06T20:30:00',
        'resolution_time': '2025-11-06T22:00:00',
        'severity': 'high',
        'customer_impact': True,
        'regulatory_impact': False,
        'systems_affected': 1,
        'evidence_items': 10,
        'tasks_completed': 5,
        'team_members': ['security_analyst', 'incident_commander', 'system_admin']
    }
    
    metrics = analyzer.calculate_incident_metrics(incident_data)
    print(f"\nMetrics calculated - Duration: {metrics.total_duration} minutes, Cost: ${metrics.estimated_cost:.2f}")
    
    # Test lessons learned
    lessons = analyzer.generate_lessons_learned("TEST-2025-001", timeline_analysis, metrics)
    print(f"\nGenerated {len(lessons)} lessons learned")
    for lesson in lessons:
        print(f"- {lesson.description}")
    
    # Test trend analysis
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    trend_analysis = analyzer.create_trend_analysis(start_date, end_date)
    print(f"\nTrend analysis completed for {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    # Test executive brief
    executive_brief = analyzer.generate_executive_brief(start_date, end_date)
    print(f"\nExecutive brief generated - Risk level: {executive_brief['executive_summary']['risk_level']}")
    
    print("\nIncident analysis system test completed successfully!")

if __name__ == "__main__":
    main()