#!/usr/bin/env python3
"""
Recovery Procedures System
Business continuity and incident recovery management
"""

import json
import time
import logging
import subprocess
import psutil
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue
import os
from pathlib import Path
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecoveryStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class RecoveryPhase(Enum):
    ASSESSMENT = "assessment"
    CONTAINMENT = "containment"
    ERADICATION = "eradication"
    RECOVERY = "recovery"
    POST_INCIDENT = "post_incident"

class SystemCriticality(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RecoveryPriority(Enum):
    IMMEDIATE = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4

@dataclass
class RecoveryTask:
    """Represents a recovery task"""
    id: str
    name: str
    description: str
    phase: RecoveryPhase
    priority: RecoveryPriority
    estimated_duration: int  # minutes
    dependencies: List[str]
    commands: List[str]
    rollback_commands: List[str]
    status: RecoveryStatus
    assigned_to: str
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    logs: List[str]
    error_logs: List[str]
    metadata: Dict[str, Any]

@dataclass
class SystemRecovery:
    """Represents a system recovery plan"""
    id: str
    system_name: str
    criticality: SystemCriticality
    recovery_tasks: List[RecoveryTask]
    backup_location: Optional[str]
    restoration_procedures: List[str]
    validation_checks: List[str]
    contact_info: Dict[str, str]
    created_at: datetime
    updated_at: datetime

class RecoveryOrchestrator:
    """Orchestrates incident recovery procedures"""
    
    def __init__(self, config_path: str = "config/incident-config.json"):
        self.config = self._load_config(config_path)
        self.recovery_plans = {}
        self.active_recoveries = {}
        self.recovery_queue = queue.PriorityQueue()
        self.completion_callbacks = []
        self.failure_callbacks = []
        
        # Initialize database
        self.db_path = "recovery/recovery.db"
        self._init_database()
        
        # Load predefined recovery plans
        self._load_recovery_plans()
        
        # Start recovery processor
        self._start_recovery_processor()
        
        logger.info("Recovery Orchestrator initialized")
    
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
            "recovery": {
                "max_concurrent_tasks": 5,
                "task_timeout": 3600,  # 1 hour
                "retry_attempts": 3,
                "auto_rollback": True
            }
        }
    
    def _init_database(self):
        """Initialize SQLite database for recovery tracking"""
        os.makedirs("recovery", exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Recovery tasks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recovery_tasks (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                phase TEXT,
                priority INTEGER,
                estimated_duration INTEGER,
                dependencies TEXT,
                commands TEXT,
                rollback_commands TEXT,
                status TEXT,
                assigned_to TEXT,
                created_at TEXT,
                started_at TEXT,
                completed_at TEXT,
                logs TEXT,
                error_logs TEXT,
                metadata TEXT,
                system_recovery_id TEXT
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recovery_status ON recovery_tasks(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recovery_phase ON recovery_tasks(phase)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_recovery_system ON recovery_tasks(system_recovery_id)')
        
        conn.commit()
        conn.close()
    
    def _load_recovery_plans(self):
        """Load predefined recovery plans"""
        
        # Database System Recovery Plan
        database_recovery = SystemRecovery(
            id="RECOVERY-DATABASE-001",
            system_name="Primary Database",
            criticality=SystemCriticality.CRITICAL,
            recovery_tasks=[
                RecoveryTask(
                    id="DB-ASSESS-001",
                    name="Database System Assessment",
                    description="Assess database system status and damage",
                    phase=RecoveryPhase.ASSESSMENT,
                    priority=RecoveryPriority.IMMEDIATE,
                    estimated_duration=15,
                    dependencies=[],
                    commands=[
                        "systemctl status postgresql",
                        "ps aux | grep postgres",
                        "df -h /var/lib/postgresql",
                        "tail -50 /var/log/postgresql/postgresql-*.log"
                    ],
                    rollback_commands=[],
                    status=RecoveryStatus.PENDING,
                    assigned_to="dba_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                ),
                RecoveryTask(
                    id="DB-CONTAIN-001",
                    name="Database Containment",
                    description="Stop database services and isolate affected systems",
                    phase=RecoveryPhase.CONTAINMENT,
                    priority=RecoveryPriority.IMMEDIATE,
                    estimated_duration=5,
                    dependencies=["DB-ASSESS-001"],
                    commands=[
                        "systemctl stop postgresql",
                        "systemctl disable postgresql"
                    ],
                    rollback_commands=[
                        "systemctl enable postgresql",
                        "systemctl start postgresql"
                    ],
                    status=RecoveryStatus.PENDING,
                    assigned_to="dba_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                ),
                RecoveryTask(
                    id="DB-RECOVER-001",
                    name="Database Recovery",
                    description="Restore database from backup",
                    phase=RecoveryPhase.RECOVERY,
                    priority=RecoveryPriority.IMMEDIATE,
                    estimated_duration=120,
                    dependencies=["DB-CONTAIN-001"],
                    commands=[
                        "sudo -u postgres pg_restore -d production /backups/latest_backup.sql",
                        "systemctl start postgresql",
                        "systemctl status postgresql"
                    ],
                    rollback_commands=[
                        "systemctl stop postgresql",
                        "sudo -u postgres dropdb production",
                        "sudo -u postgres createdb production"
                    ],
                    status=RecoveryStatus.PENDING,
                    assigned_to="dba_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                )
            ],
            backup_location="/backups/database",
            restoration_procedures=[
                "Verify backup integrity",
                "Restore to clean environment",
                "Verify data consistency"
            ],
            validation_checks=[
                "Database connections working",
                "Sample data queries execute",
                "Application can connect",
                "Performance metrics normal"
            ],
            contact_info={
                "dba_team": "dba@company.com",
                "emergency_contact": "emergency@company.com"
            },
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Web Application Recovery Plan
        webapp_recovery = SystemRecovery(
            id="RECOVERY-WEBAPP-001",
            system_name="Web Application",
            criticality=SystemCriticality.HIGH,
            recovery_tasks=[
                RecoveryTask(
                    id="WEB-ASSESS-001",
                    name="Web Application Assessment",
                    description="Assess web application status and dependencies",
                    phase=RecoveryPhase.ASSESSMENT,
                    priority=RecoveryPriority.HIGH,
                    estimated_duration=10,
                    dependencies=[],
                    commands=[
                        "systemctl status nginx",
                        "systemctl status application",
                        "netstat -tlnp | grep :80",
                        "df -h /var/www"
                    ],
                    rollback_commands=[],
                    status=RecoveryStatus.PENDING,
                    assigned_to="devops_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                ),
                RecoveryTask(
                    id="WEB-RECOVER-001",
                    name="Web Application Recovery",
                    description="Restart services and verify functionality",
                    phase=RecoveryPhase.RECOVERY,
                    priority=RecoveryPriority.HIGH,
                    estimated_duration=30,
                    dependencies=["WEB-ASSESS-001"],
                    commands=[
                        "systemctl restart nginx",
                        "systemctl restart application",
                        "curl -I http://localhost/health",
                        "systemctl status nginx"
                    ],
                    rollback_commands=[
                        "systemctl stop nginx",
                        "systemctl stop application"
                    ],
                    status=RecoveryStatus.PENDING,
                    assigned_to="devops_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                )
            ],
            backup_location="/backups/webapp",
            restoration_procedures=[
                "Deploy application files",
                "Update configuration",
                "Restart services"
            ],
            validation_checks=[
                "HTTP responses normal",
                "Application endpoints responsive",
                "Database connectivity",
                "SSL certificates valid"
            ],
            contact_info={
                "devops_team": "devops@company.com",
                "development_team": "dev@company.com"
            },
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Network Infrastructure Recovery Plan
        network_recovery = SystemRecovery(
            id="RECOVERY-NETWORK-001",
            system_name="Network Infrastructure",
            criticality=SystemCriticality.CRITICAL,
            recovery_tasks=[
                RecoveryTask(
                    id="NET-ASSESS-001",
                    name="Network Assessment",
                    description="Assess network infrastructure and connectivity",
                    phase=RecoveryPhase.ASSESSMENT,
                    priority=RecoveryPriority.IMMEDIATE,
                    estimated_duration=5,
                    dependencies=[],
                    commands=[
                        "ip route show",
                        "ping -c 3 8.8.8.8",
                        "systemctl status network",
                        "iptables -L"
                    ],
                    rollback_commands=[],
                    status=RecoveryStatus.PENDING,
                    assigned_to="network_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                ),
                RecoveryTask(
                    id="NET-RECOVER-001",
                    name="Network Services Recovery",
                    description="Restart network services and restore connectivity",
                    phase=RecoveryPhase.RECOVERY,
                    priority=RecoveryPriority.IMMEDIATE,
                    estimated_duration=15,
                    dependencies=["NET-ASSESS-001"],
                    commands=[
                        "systemctl restart networking",
                        "ping -c 3 8.8.8.8",
                        "curl -I http://google.com"
                    ],
                    rollback_commands=[],
                    status=RecoveryStatus.PENDING,
                    assigned_to="network_team",
                    created_at=datetime.now(),
                    started_at=None,
                    completed_at=None,
                    logs=[],
                    error_logs=[],
                    metadata={}
                )
            ],
            backup_location="/backups/network",
            restoration_procedures=[
                "Restore network configuration",
                "Restart network services",
                "Verify connectivity"
            ],
            validation_checks=[
                "Internet connectivity",
                "Internal network access",
                "DNS resolution",
                "Firewall rules active"
            ],
            contact_info={
                "network_team": "network@company.com",
                "security_team": "security@company.com"
            },
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.recovery_plans = {
            "database": database_recovery,
            "webapp": webapp_recovery,
            "network": network_recovery
        }
    
    def _start_recovery_processor(self):
        """Start background recovery task processor"""
        def process_recovery_queue():
            while True:
                try:
                    # Process recovery queue
                    if not self.recovery_queue.empty():
                        priority, callback = self.recovery_queue.get()
                        callback()
                    
                    time.sleep(5)  # Check every 5 seconds
                    
                except Exception as e:
                    logger.error(f"Error in recovery processor: {e}")
                    time.sleep(10)
        
        thread = threading.Thread(target=process_recovery_queue, daemon=True)
        thread.start()
        logger.info("Recovery processor started")
    
    def initiate_recovery(self, incident_id: str, system_type: str) -> str:
        """Initiate recovery for a system"""
        if system_type not in self.recovery_plans:
            raise ValueError(f"Unknown system type: {system_type}")
        
        recovery_plan = self.recovery_plans[system_type]
        recovery_id = f"RECOVERY-{incident_id}-{system_type.upper()}-{int(time.time())}"
        
        # Create recovery instance
        recovery_instance = {
            "id": recovery_id,
            "incident_id": incident_id,
            "system_type": system_type,
            "plan": recovery_plan,
            "status": RecoveryStatus.PENDING,
            "started_at": None,
            "completed_at": None,
            "task_status": {}
        }
        
        self.active_recoveries[recovery_id] = recovery_instance
        
        # Initialize task statuses
        for task in recovery_plan.recovery_tasks:
            recovery_instance["task_status"][task.id] = {
                "status": RecoveryStatus.PENDING,
                "started_at": None,
                "completed_at": None
            }
        
        # Start recovery process
        self._start_recovery_sequence(recovery_id)
        
        logger.info(f"Recovery initiated: {recovery_id}")
        return recovery_id
    
    def _start_recovery_sequence(self, recovery_id: str):
        """Start the recovery sequence for a system"""
        recovery = self.active_recoveries[recovery_id]
        recovery["status"] = RecoveryStatus.IN_PROGRESS
        recovery["started_at"] = datetime.now()
        
        # Start the first phase
        self._execute_recovery_phase(recovery_id, RecoveryPhase.ASSESSMENT)
    
    def _execute_recovery_phase(self, recovery_id: str, phase: RecoveryPhase):
        """Execute tasks in a specific recovery phase"""
        recovery = self.active_recoveries[recovery_id]
        plan = recovery["plan"]
        
        # Get tasks for this phase
        phase_tasks = [task for task in plan.recovery_tasks if task.phase == phase]
        
        # Sort by priority
        phase_tasks.sort(key=lambda t: t.priority.value)
        
        for task in phase_tasks:
            # Check dependencies
            if not self._check_dependencies(task, recovery):
                task.status = RecoveryStatus.SKIPPED
                continue
            
            # Execute task
            self._execute_recovery_task(recovery_id, task)
    
    def _check_dependencies(self, task: RecoveryTask, recovery: Dict[str, Any]) -> bool:
        """Check if task dependencies are met"""
        for dep_id in task.dependencies:
            dep_status = recovery["task_status"].get(dep_id, {}).get("status")
            if dep_status != RecoveryStatus.COMPLETED:
                return False
        return True
    
    def _execute_recovery_task(self, recovery_id: str, task: RecoveryTask):
        """Execute a single recovery task"""
        task.status = RecoveryStatus.IN_PROGRESS
        task.started_at = datetime.now()
        
        # Save to database
        self._save_task_to_db(task, recovery_id)
        
        # Execute commands
        success = self._run_task_commands(task)
        
        if success:
            task.status = RecoveryStatus.COMPLETED
            task.completed_at = datetime.now()
            
            # Update recovery status
            recovery = self.active_recoveries[recovery_id]
            recovery["task_status"][task.id] = {
                "status": RecoveryStatus.COMPLETED,
                "started_at": task.started_at,
                "completed_at": task.completed_at
            }
            
            # Call completion callback
            for callback in self.completion_callbacks:
                try:
                    callback(recovery_id, task)
                except Exception as e:
                    logger.error(f"Error in completion callback: {e}")
        else:
            task.status = RecoveryStatus.FAILED
            task.completed_at = datetime.now()
            
            # Call failure callback
            for callback in self.failure_callbacks:
                try:
                    callback(recovery_id, task)
                except Exception as e:
                    logger.error(f"Error in failure callback: {e}")
        
        # Save to database
        self._save_task_to_db(task, recovery_id)
        
        # Check if phase is complete
        self._check_phase_completion(recovery_id, task.phase)
    
    def _run_task_commands(self, task: RecoveryTask) -> bool:
        """Execute commands for a recovery task"""
        all_successful = True
        
        for command in task.commands:
            try:
                logger.info(f"Executing command for task {task.id}: {command}")
                
                # Execute command
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=3600  # 1 hour timeout
                )
                
                # Log output
                if result.stdout:
                    task.logs.append(f"STDOUT: {result.stdout}")
                if result.stderr:
                    task.error_logs.append(f"STDERR: {result.stderr}")
                
                if result.returncode != 0:
                    task.error_logs.append(f"Command failed with exit code {result.returncode}")
                    all_successful = False
                else:
                    task.logs.append(f"Command completed successfully")
                
            except subprocess.TimeoutExpired:
                task.error_logs.append(f"Command timed out: {command}")
                all_successful = False
            except Exception as e:
                task.error_logs.append(f"Command execution error: {e}")
                all_successful = False
        
        return all_successful
    
    def _check_phase_completion(self, recovery_id: str, phase: RecoveryPhase):
        """Check if a recovery phase is complete"""
        recovery = self.active_recoveries[recovery_id]
        plan = recovery["plan"]
        
        # Get all tasks in this phase
        phase_tasks = [task for task in plan.recovery_tasks if task.phase == phase]
        
        # Check if all tasks are completed
        completed_tasks = [task for task in phase_tasks 
                          if recovery["task_status"].get(task.id, {}).get("status") == RecoveryStatus.COMPLETED]
        
        if len(completed_tasks) == len(phase_tasks):
            # Phase complete, move to next phase
            next_phase = self._get_next_phase(phase)
            if next_phase:
                self._execute_recovery_phase(recovery_id, next_phase)
            else:
                # Recovery complete
                recovery["status"] = RecoveryStatus.COMPLETED
                recovery["completed_at"] = datetime.now()
                logger.info(f"Recovery completed: {recovery_id}")
    
    def _get_next_phase(self, current_phase: RecoveryPhase) -> Optional[RecoveryPhase]:
        """Get the next phase in the recovery sequence"""
        phase_order = [
            RecoveryPhase.ASSESSMENT,
            RecoveryPhase.CONTAINMENT,
            RecoveryPhase.ERADICATION,
            RecoveryPhase.RECOVERY,
            RecoveryPhase.POST_INCIDENT
        ]
        
        try:
            current_index = phase_order.index(current_phase)
            if current_index < len(phase_order) - 1:
                return phase_order[current_index + 1]
        except ValueError:
            pass
        
        return None
    
    def rollback_recovery(self, recovery_id: str) -> bool:
        """Rollback a recovery using rollback commands"""
        if recovery_id not in self.active_recoveries:
            return False
        
        recovery = self.active_recoveries[recovery_id]
        plan = recovery["plan"]
        
        all_successful = True
        
        # Execute rollback commands for all completed tasks in reverse order
        completed_tasks = [task for task in plan.recovery_tasks 
                          if recovery["task_status"].get(task.id, {}).get("status") == RecoveryStatus.COMPLETED]
        completed_tasks.sort(key=lambda t: t.created_at, reverse=True)
        
        for task in completed_tasks:
            if task.rollback_commands:
                logger.info(f"Rolling back task {task.id}")
                
                rollback_success = self._run_rollback_commands(task)
                if not rollback_success:
                    all_successful = False
                    logger.error(f"Rollback failed for task {task.id}")
                else:
                    task.status = RecoveryStatus.PENDING
        
        return all_successful
    
    def _run_rollback_commands(self, task: RecoveryTask) -> bool:
        """Execute rollback commands for a task"""
        all_successful = True
        
        for command in task.rollback_commands:
            try:
                logger.info(f"Executing rollback command for task {task.id}: {command}")
                
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=3600
                )
                
                if result.returncode != 0:
                    all_successful = False
                    task.error_logs.append(f"Rollback command failed: {command}")
                else:
                    task.logs.append(f"Rollback command completed: {command}")
                
            except Exception as e:
                all_successful = False
                task.error_logs.append(f"Rollback command error: {e}")
        
        return all_successful
    
    def _save_task_to_db(self, task: RecoveryTask, system_recovery_id: str):
        """Save recovery task to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO recovery_tasks (
                id, name, description, phase, priority, estimated_duration,
                dependencies, commands, rollback_commands, status, assigned_to,
                created_at, started_at, completed_at, logs, error_logs,
                metadata, system_recovery_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            task.id, task.name, task.description, task.phase.value,
            task.priority.value, task.estimated_duration, json.dumps(task.dependencies),
            json.dumps(task.commands), json.dumps(task.rollback_commands),
            task.status.value, task.assigned_to, task.created_at.isoformat(),
            task.started_at.isoformat() if task.started_at else None,
            task.completed_at.isoformat() if task.completed_at else None,
            json.dumps(task.logs), json.dumps(task.error_logs),
            json.dumps(task.metadata), system_recovery_id
        ))
        
        conn.commit()
        conn.close()
    
    def get_recovery_status(self, recovery_id: str) -> Optional[Dict[str, Any]]:
        """Get current recovery status"""
        if recovery_id not in self.active_recoveries:
            return None
        
        recovery = self.active_recoveries[recovery_id]
        plan = recovery["plan"]
        
        # Calculate progress
        total_tasks = len(plan.recovery_tasks)
        completed_tasks = len([task for task in plan.recovery_tasks 
                              if recovery["task_status"].get(task.id, {}).get("status") == RecoveryStatus.COMPLETED])
        failed_tasks = len([task for task in plan.recovery_tasks 
                           if recovery["task_status"].get(task.id, {}).get("status") == RecoveryStatus.FAILED])
        
        progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            "recovery_id": recovery_id,
            "incident_id": recovery["incident_id"],
            "system_type": recovery["system_type"],
            "status": recovery["status"].value,
            "progress_percentage": progress_percentage,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "started_at": recovery["started_at"].isoformat() if recovery["started_at"] else None,
            "completed_at": recovery["completed_at"].isoformat() if recovery["completed_at"] else None,
            "task_details": [
                {
                    "id": task.id,
                    "name": task.name,
                    "phase": task.phase.value,
                    "status": recovery["task_status"].get(task.id, {}).get("status", RecoveryStatus.PENDING).value,
                    "assigned_to": task.assigned_to,
                    "logs_count": len(task.logs),
                    "error_logs_count": len(task.error_logs)
                }
                for task in plan.recovery_tasks
            ]
        }
    
    def register_completion_callback(self, callback: Callable[[str, RecoveryTask], None]):
        """Register callback for task completion"""
        self.completion_callbacks.append(callback)
    
    def register_failure_callback(self, callback: Callable[[str, RecoveryTask], None]):
        """Register callback for task failure"""
        self.failure_callbacks.append(callback)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get recovery statistics"""
        total_recoveries = len(self.active_recoveries)
        completed_recoveries = len([r for r in self.active_recoveries.values() if r["status"] == RecoveryStatus.COMPLETED])
        failed_recoveries = len([r for r in self.active_recoveries.values() if r["status"] == RecoveryStatus.FAILED])
        in_progress_recoveries = len([r for r in self.active_recoveries.values() if r["status"] == RecoveryStatus.IN_PROGRESS])
        
        return {
            "total_recoveries": total_recoveries,
            "completed_recoveries": completed_recoveries,
            "failed_recoveries": failed_recoveries,
            "in_progress_recoveries": in_progress_recoveries,
            "success_rate": (completed_recoveries / total_recoveries * 100) if total_recoveries > 0 else 0,
            "available_plans": len(self.recovery_plans),
            "system_types": list(self.recovery_plans.keys())
        }

def main():
    """Main function to test the recovery system"""
    recovery_orchestrator = RecoveryOrchestrator()
    
    # Test recovery initiation
    try:
        # Start database recovery
        recovery_id = recovery_orchestrator.initiate_recovery(
            incident_id="TEST-INCIDENT-001",
            system_type="database"
        )
        
        print(f"Recovery initiated: {recovery_id}")
        
        # Register callbacks
        def on_task_completed(recovery_id: str, task: RecoveryTask):
            print(f"Task completed: {task.id} - {task.name}")
        
        def on_task_failed(recovery_id: str, task: RecoveryTask):
            print(f"Task failed: {task.id} - {task.name}")
        
        recovery_orchestrator.register_completion_callback(on_task_completed)
        recovery_orchestrator.register_failure_callback(on_task_failed)
        
        # Monitor recovery progress
        for i in range(30):  # Monitor for 2.5 minutes
            status = recovery_orchestrator.get_recovery_status(recovery_id)
            if status:
                print(f"Progress: {status['progress_percentage']:.1f}% - {status['completed_tasks']}/{status['total_tasks']} tasks")
                
                if status['status'] == 'completed':
                    print("Recovery completed successfully!")
                    break
            
            time.sleep(5)
        
        # Get statistics
        stats = recovery_orchestrator.get_statistics()
        print(f"Recovery statistics: {json.dumps(stats, indent=2, default=str)}")
        
        print("Recovery system test completed")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    main()