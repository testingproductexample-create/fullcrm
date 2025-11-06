#!/usr/bin/env python3
"""
Evidence Collection System
Digital forensics and evidence preservation for incident response
"""

import json
import hashlib
import os
import shutil
import sqlite3
import logging
import subprocess
import time
import psutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import re
import tarfile
import gzip
from pathlib import Path
import json
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EvidenceType(Enum):
    FILE = "file"
    LOG = "log"
    MEMORY = "memory"
    NETWORK = "network"
    SYSTEM = "system"
    REGISTRY = "registry"
    PROCESS = "process"
    TIMELINE = "timeline"

class EvidenceStatus(Enum):
    COLLECTED = "collected"
    VERIFIED = "verified"
    ANALYZED = "analyzed"
    ARCHIVED = "archived"
    CHAIN_BROKEN = "chain_broken"

class ChainOfCustodyStatus(Enum):
    IN_CUSTODY = "in_custody"
    TRANSFERRED = "transferred"
    LOGGED = "logged"
    VERIFIED = "verified"

@dataclass
class ChainOfCustody:
    """Chain of custody record for evidence"""
    id: str
    evidence_id: str
    timestamp: datetime
    action: str
    person_responsible: str
    location: str
    notes: str
    digital_signature: str
    previous_hash: Optional[str]
    current_hash: str

@dataclass
class Evidence:
    """Represents a piece of digital evidence"""
    id: str
    incident_id: str
    evidence_type: EvidenceType
    name: str
    description: str
    source_path: Optional[str]
    collected_path: str
    hash_sha256: str
    hash_md5: str
    size_bytes: int
    timestamp_collected: datetime
    collected_by: str
    status: EvidenceStatus
    metadata: Dict[str, Any]
    chain_of_custody: List[ChainOfCustody]
    tags: List[str]

class EvidenceCollector:
    """Main evidence collection engine"""
    
    def __init__(self, evidence_dir: str = "evidence", db_path: str = "evidence/evidence.db"):
        self.evidence_dir = Path(evidence_dir)
        self.evidence_dir.mkdir(exist_ok=True)
        
        self.db_path = db_path
        self.db_lock = threading.Lock()
        
        # Initialize database
        self._init_database()
        
        # Collection statistics
        self.collection_stats = {
            "total_collected": 0,
            "by_type": {},
            "by_incident": {}
        }
        
        logger.info("Evidence Collector initialized")
    
    def _init_database(self):
        """Initialize SQLite database for evidence tracking"""
        with self.db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Evidence table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS evidence (
                    id TEXT PRIMARY KEY,
                    incident_id TEXT,
                    evidence_type TEXT,
                    name TEXT,
                    description TEXT,
                    source_path TEXT,
                    collected_path TEXT,
                    hash_sha256 TEXT,
                    hash_md5 TEXT,
                    size_bytes INTEGER,
                    timestamp_collected TEXT,
                    collected_by TEXT,
                    status TEXT,
                    metadata TEXT,
                    tags TEXT
                )
            ''')
            
            # Chain of custody table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS chain_of_custody (
                    id TEXT PRIMARY KEY,
                    evidence_id TEXT,
                    timestamp TEXT,
                    action TEXT,
                    person_responsible TEXT,
                    location TEXT,
                    notes TEXT,
                    digital_signature TEXT,
                    previous_hash TEXT,
                    current_hash TEXT,
                    FOREIGN KEY (evidence_id) REFERENCES evidence (id)
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence(incident_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(evidence_type)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_evidence_timestamp ON evidence(timestamp_collected)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_custody_evidence ON chain_of_custody(evidence_id)')
            
            conn.commit()
            conn.close()
    
    def collect_file_evidence(self, 
                            incident_id: str,
                            source_path: str,
                            name: str,
                            description: str,
                            collected_by: str,
                            metadata: Optional[Dict[str, Any]] = None) -> Evidence:
        """Collect file evidence"""
        
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Source file not found: {source_path}")
        
        # Generate evidence ID
        evidence_id = f"EVID-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
        
        # Create collection directory
        incident_dir = self.evidence_dir / incident_id
        incident_dir.mkdir(exist_ok=True)
        
        # Generate collected file path
        file_extension = os.path.splitext(source_path)[1]
        collected_path = incident_dir / f"{evidence_id}{file_extension}"
        
        # Calculate hashes
        hash_sha256 = self._calculate_file_hash(source_path, "sha256")
        hash_md5 = self._calculate_file_hash(source_path, "md5")
        
        # Get file size
        size_bytes = os.path.getsize(source_path)
        
        # Copy file to evidence directory
        shutil.copy2(source_path, collected_path)
        
        # Create metadata
        file_metadata = {
            "original_path": source_path,
            "file_permissions": oct(os.stat(source_path).st_mode)[-3:],
            "created_time": datetime.fromtimestamp(os.path.getctime(source_path)).isoformat(),
            "modified_time": datetime.fromtimestamp(os.path.getmtime(source_path)).isoformat()
        }
        if metadata:
            file_metadata.update(metadata)
        
        # Create evidence object
        evidence = Evidence(
            id=evidence_id,
            incident_id=incident_id,
            evidence_type=EvidenceType.FILE,
            name=name,
            description=description,
            source_path=source_path,
            collected_path=str(collected_path),
            hash_sha256=hash_sha256,
            hash_md5=hash_md5,
            size_bytes=size_bytes,
            timestamp_collected=datetime.now(),
            collected_by=collected_by,
            status=EvidenceStatus.COLLECTED,
            metadata=file_metadata,
            chain_of_custody=[],
            tags=[]
        )
        
        # Add initial chain of custody entry
        self._add_chain_of_custody(evidence, "collected", collected_by, str(collected_path), "File evidence collected")
        
        # Save to database
        self._save_evidence(evidence)
        
        # Update statistics
        self._update_stats(evidence)
        
        logger.info(f"File evidence collected: {evidence_id} - {name}")
        return evidence
    
    def collect_log_evidence(self, 
                           incident_id: str,
                           log_sources: List[str],
                           name: str,
                           description: str,
                           collected_by: str,
                           time_range: Optional[Tuple[datetime, datetime]] = None) -> Evidence:
        """Collect log evidence from multiple sources"""
        
        evidence_id = f"EVID-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
        incident_dir = self.evidence_dir / incident_id
        incident_dir.mkdir(exist_ok=True)
        
        collected_path = incident_dir / f"{evidence_id}.log"
        
        # Collect logs from all sources
        collected_data = []
        total_size = 0
        
        for log_source in log_sources:
            if os.path.exists(log_source):
                try:
                    with open(log_source, 'r', encoding='utf-8', errors='ignore') as f:
                        log_data = f.read()
                        
                        # Filter by time range if specified
                        if time_range:
                            log_data = self._filter_logs_by_time(log_data, time_range)
                        
                        collected_data.append(f"# === Source: {log_source} ===\n")
                        collected_data.append(log_data)
                        collected_data.append("\n\n")
                        
                        total_size += len(log_data)
                        
                except Exception as e:
                    logger.error(f"Error collecting log from {log_source}: {e}")
            else:
                logger.warning(f"Log source not found: {log_source}")
        
        # Write collected logs
        with open(collected_path, 'w') as f:
            f.write(''.join(collected_data))
        
        # Calculate hashes
        hash_sha256 = self._calculate_file_hash(str(collected_path), "sha256")
        hash_md5 = self._calculate_file_hash(str(collected_path), "md5")
        
        # Create metadata
        log_metadata = {
            "log_sources": log_sources,
            "time_range": {
                "start": time_range[0].isoformat() if time_range else None,
                "end": time_range[1].isoformat() if time_range else None
            },
            "total_sources": len(log_sources),
            "total_size": total_size
        }
        
        evidence = Evidence(
            id=evidence_id,
            incident_id=incident_id,
            evidence_type=EvidenceType.LOG,
            name=name,
            description=description,
            source_path=None,  # Multiple sources
            collected_path=str(collected_path),
            hash_sha256=hash_sha256,
            hash_md5=hash_md5,
            size_bytes=os.path.getsize(collected_path),
            timestamp_collected=datetime.now(),
            collected_by=collected_by,
            status=EvidenceStatus.COLLECTED,
            metadata=log_metadata,
            chain_of_custody=[],
            tags=[]
        )
        
        # Add chain of custody
        self._add_chain_of_custody(evidence, "collected", collected_by, str(collected_path), "Log evidence collected")
        
        # Save to database
        self._save_evidence(evidence)
        
        # Update statistics
        self._update_stats(evidence)
        
        logger.info(f"Log evidence collected: {evidence_id} - {name}")
        return evidence
    
    def collect_system_evidence(self, 
                              incident_id: str,
                              system_info: Dict[str, Any],
                              name: str,
                              description: str,
                              collected_by: str) -> Evidence:
        """Collect system information evidence"""
        
        evidence_id = f"EVID-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
        incident_dir = self.evidence_dir / incident_id
        incident_dir.mkdir(exist_ok=True)
        
        collected_path = incident_dir / f"{evidence_id}.json"
        
        # Collect system information
        system_data = {
            "timestamp": datetime.now().isoformat(),
            "collected_by": collected_by,
            "system_info": system_info
        }
        
        # Add system-specific information
        system_data.update(self._collect_system_details())
        
        # Write to file
        with open(collected_path, 'w') as f:
            json.dump(system_data, f, indent=2, default=str)
        
        # Calculate hashes
        hash_sha256 = self._calculate_file_hash(str(collected_path), "sha256")
        hash_md5 = self._calculate_file_hash(str(collected_path), "md5")
        
        evidence = Evidence(
            id=evidence_id,
            incident_id=incident_id,
            evidence_type=EvidenceType.SYSTEM,
            name=name,
            description=description,
            source_path=None,
            collected_path=str(collected_path),
            hash_sha256=hash_sha256,
            hash_md5=hash_md5,
            size_bytes=os.path.getsize(collected_path),
            timestamp_collected=datetime.now(),
            collected_by=collected_by,
            status=EvidenceStatus.COLLECTED,
            metadata=system_data,
            chain_of_custody=[],
            tags=[]
        )
        
        # Add chain of custody
        self._add_chain_of_custody(evidence, "collected", collected_by, str(collected_path), "System evidence collected")
        
        # Save to database
        self._save_evidence(evidence)
        
        # Update statistics
        self._update_stats(evidence)
        
        logger.info(f"System evidence collected: {evidence_id} - {name}")
        return evidence
    
    def collect_process_evidence(self, 
                               incident_id: str,
                               process_filter: Optional[str] = None,
                               name: str = "Process Information",
                               description: str = "Running processes at time of incident",
                               collected_by: str = "System") -> Evidence:
        """Collect running process information"""
        
        evidence_id = f"EVID-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
        incident_dir = self.evidence_dir / incident_id
        incident_dir.mkdir(exist_ok=True)
        
        collected_path = incident_dir / f"{evidence_id}.json"
        
        # Collect process information
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'username', 'create_time', 'memory_info', 'cpu_percent']):
            try:
                proc_info = proc.info
                
                # Filter processes if specified
                if process_filter and process_filter.lower() not in proc_info['name'].lower():
                    continue
                
                processes.append(proc_info)
                
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # Create evidence data
        evidence_data = {
            "timestamp": datetime.now().isoformat(),
            "collected_by": collected_by,
            "filter": process_filter,
            "total_processes": len(processes),
            "processes": processes
        }
        
        # Write to file
        with open(collected_path, 'w') as f:
            json.dump(evidence_data, f, indent=2, default=str)
        
        # Calculate hashes
        hash_sha256 = self._calculate_file_hash(str(collected_path), "sha256")
        hash_md5 = self._calculate_file_hash(str(collected_path), "md5")
        
        evidence = Evidence(
            id=evidence_id,
            incident_id=incident_id,
            evidence_type=EvidenceType.PROCESS,
            name=name,
            description=description,
            source_path=None,
            collected_path=str(collected_path),
            hash_sha256=hash_sha256,
            hash_md5=hash_md5,
            size_bytes=os.path.getsize(collected_path),
            timestamp_collected=datetime.now(),
            collected_by=collected_by,
            status=EvidenceStatus.COLLECTED,
            metadata=evidence_data,
            chain_of_custody=[],
            tags=[]
        )
        
        # Add chain of custody
        self._add_chain_of_custody(evidence, "collected", collected_by, str(collected_path), "Process evidence collected")
        
        # Save to database
        self._save_evidence(evidence)
        
        # Update statistics
        self._update_stats(evidence)
        
        logger.info(f"Process evidence collected: {evidence_id}")
        return evidence
    
    def _collect_system_details(self) -> Dict[str, Any]:
        """Collect detailed system information"""
        return {
            "cpu": {
                "count": psutil.cpu_count(),
                "usage": psutil.cpu_percent(interval=1),
                "per_cpu": psutil.cpu_percent(interval=1, percpu=True)
            },
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "used": psutil.disk_usage('/').used,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            },
            "network": {
                "connections": len(psutil.net_connections()),
                "io_counters": psutil.net_io_counters()._asdict() if psutil.net_io_counters() else {}
            },
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            "users": [u._asdict() for u in psutil.users()]
        }
    
    def _calculate_file_hash(self, file_path: str, algorithm: str) -> str:
        """Calculate file hash using specified algorithm"""
        hash_obj = hashlib.new(algorithm)
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_obj.update(chunk)
        
        return hash_obj.hexdigest()
    
    def _filter_logs_by_time(self, log_data: str, time_range: Tuple[datetime, datetime]) -> str:
        """Filter log entries by time range"""
        lines = log_data.split('\n')
        filtered_lines = []
        
        for line in lines:
            # Try to extract timestamp from log line
            timestamp_match = re.search(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', line)
            if timestamp_match:
                try:
                    line_time = datetime.strptime(timestamp_match.group(), '%Y-%m-%d %H:%M:%S')
                    if time_range[0] <= line_time <= time_range[1]:
                        filtered_lines.append(line)
                except ValueError:
                    # If timestamp parsing fails, include the line
                    filtered_lines.append(line)
            else:
                # If no timestamp, include the line
                filtered_lines.append(line)
        
        return '\n'.join(filtered_lines)
    
    def _add_chain_of_custody(self, 
                            evidence: Evidence, 
                            action: str, 
                            person: str, 
                            location: str, 
                            notes: str):
        """Add chain of custody entry"""
        
        custody_id = f"COC-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
        
        # Calculate previous hash
        previous_hash = evidence.chain_of_custody[-1].current_hash if evidence.chain_of_custody else None
        
        # Create custody entry
        custody_entry = ChainOfCustody(
            id=custody_id,
            evidence_id=evidence.id,
            timestamp=datetime.now(),
            action=action,
            person_responsible=person,
            location=location,
            notes=notes,
            digital_signature="",  # Would be calculated using digital signature
            previous_hash=previous_hash,
            current_hash=hashlib.sha256(f"{evidence.id}{action}{person}{location}".encode()).hexdigest()
        )
        
        evidence.chain_of_custody.append(custody_entry)
    
    def _save_evidence(self, evidence: Evidence):
        """Save evidence to database"""
        with self.db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO evidence (
                    id, incident_id, evidence_type, name, description, source_path,
                    collected_path, hash_sha256, hash_md5, size_bytes, timestamp_collected,
                    collected_by, status, metadata, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                evidence.id,
                evidence.incident_id,
                evidence.evidence_type.value,
                evidence.name,
                evidence.description,
                evidence.source_path,
                evidence.collected_path,
                evidence.hash_sha256,
                evidence.hash_md5,
                evidence.size_bytes,
                evidence.timestamp_collected.isoformat(),
                evidence.collected_by,
                evidence.status.value,
                json.dumps(evidence.metadata),
                json.dumps(evidence.tags)
            ))
            
            # Save chain of custody entries
            for custody in evidence.chain_of_custody:
                cursor.execute('''
                    INSERT OR REPLACE INTO chain_of_custody (
                        id, evidence_id, timestamp, action, person_responsible,
                        location, notes, digital_signature, previous_hash, current_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    custody.id,
                    custody.evidence_id,
                    custody.timestamp.isoformat(),
                    custody.action,
                    custody.person_responsible,
                    custody.location,
                    custody.notes,
                    custody.digital_signature,
                    custody.previous_hash,
                    custody.current_hash
                ))
            
            conn.commit()
            conn.close()
    
    def _update_stats(self, evidence: Evidence):
        """Update collection statistics"""
        self.collection_stats["total_collected"] += 1
        
        # Update by type
        type_key = evidence.evidence_type.value
        if type_key not in self.collection_stats["by_type"]:
            self.collection_stats["by_type"][type_key] = 0
        self.collection_stats["by_type"][type_key] += 1
        
        # Update by incident
        if evidence.incident_id not in self.collection_stats["by_incident"]:
            self.collection_stats["by_incident"][evidence.incident_id] = 0
        self.collection_stats["by_incident"][evidence.incident_id] += 1
    
    def get_evidence(self, evidence_id: str) -> Optional[Evidence]:
        """Get evidence by ID"""
        with self.db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM evidence WHERE id = ?', (evidence_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            # Reconstruct evidence object
            evidence = Evidence(
                id=row[0],
                incident_id=row[1],
                evidence_type=EvidenceType(row[2]),
                name=row[3],
                description=row[4],
                source_path=row[5],
                collected_path=row[6],
                hash_sha256=row[7],
                hash_md5=row[8],
                size_bytes=row[9],
                timestamp_collected=datetime.fromisoformat(row[10]),
                collected_by=row[11],
                status=EvidenceStatus(row[12]),
                metadata=json.loads(row[13]),
                chain_of_custody=[],
                tags=json.loads(row[14])
            )
            
            # Load chain of custody
            cursor.execute('SELECT * FROM chain_of_custody WHERE evidence_id = ? ORDER BY timestamp', (evidence_id,))
            custody_rows = cursor.fetchall()
            
            for custody_row in custody_rows:
                custody = ChainOfCustody(
                    id=custody_row[0],
                    evidence_id=custody_row[1],
                    timestamp=datetime.fromisoformat(custody_row[2]),
                    action=custody_row[3],
                    person_responsible=custody_row[4],
                    location=custody_row[5],
                    notes=custody_row[6],
                    digital_signature=custody_row[7],
                    previous_hash=custody_row[8],
                    current_hash=custody_row[9]
                )
                evidence.chain_of_custody.append(custody)
            
            conn.close()
            return evidence
    
    def get_incident_evidence(self, incident_id: str) -> List[Evidence]:
        """Get all evidence for an incident"""
        evidence_list = []
        
        with self.db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT id FROM evidence WHERE incident_id = ? ORDER BY timestamp_collected', (incident_id,))
            rows = cursor.fetchall()
            
            for row in rows:
                evidence = self.get_evidence(row[0])
                if evidence:
                    evidence_list.append(evidence)
            
            conn.close()
        
        return evidence_list
    
    def verify_evidence_integrity(self, evidence_id: str) -> bool:
        """Verify evidence integrity by checking hashes"""
        evidence = self.get_evidence(evidence_id)
        
        if not evidence:
            return False
        
        # Recalculate hashes
        current_sha256 = self._calculate_file_hash(evidence.collected_path, "sha256")
        current_md5 = self._calculate_file_hash(evidence.collected_path, "md5")
        
        # Compare with stored hashes
        sha256_match = current_sha256 == evidence.hash_sha256
        md5_match = current_md5 == evidence.hash_md5
        
        # Update status if verification successful
        if sha256_match and md5_match:
            evidence.status = EvidenceStatus.VERIFIED
            self._save_evidence(evidence)
            logger.info(f"Evidence integrity verified: {evidence_id}")
            return True
        else:
            evidence.status = EvidenceStatus.CHAIN_BROKEN
            self._save_evidence(evidence)
            logger.error(f"Evidence integrity check failed: {evidence_id}")
            return False
    
    def export_evidence_package(self, incident_id: str, output_path: str) -> str:
        """Export all evidence for an incident as a compressed package"""
        evidence_list = self.get_incident_evidence(incident_id)
        
        if not evidence_list:
            raise ValueError(f"No evidence found for incident {incident_id}")
        
        # Create temporary directory
        export_dir = f"/tmp/evidence_export_{incident_id}_{int(time.time())}"
        os.makedirs(export_dir, exist_ok=True)
        
        # Create manifest
        manifest = {
            "incident_id": incident_id,
            "export_timestamp": datetime.now().isoformat(),
            "evidence_count": len(evidence_list),
            "evidence_items": []
        }
        
        # Copy evidence files and create manifest
        for evidence in evidence_list:
            # Copy evidence file
            file_name = os.path.basename(evidence.collected_path)
            dest_path = os.path.join(export_dir, file_name)
            shutil.copy2(evidence.collected_path, dest_path)
            
            # Add to manifest
            manifest_item = {
                "id": evidence.id,
                "name": evidence.name,
                "type": evidence.evidence_type.value,
                "size": evidence.size_bytes,
                "hash_sha256": evidence.hash_sha256,
                "hash_md5": evidence.hash_md5,
                "collected_at": evidence.timestamp_collected.isoformat(),
                "chain_of_custody": [asdict(custody) for custody in evidence.chain_of_custody]
            }
            manifest["evidence_items"].append(manifest_item)
        
        # Save manifest
        manifest_path = os.path.join(export_dir, "manifest.json")
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2, default=str)
        
        # Create compressed archive
        with tarfile.open(output_path, "w:gz") as tar:
            tar.add(export_dir, arcname=os.path.basename(export_dir))
        
        # Clean up temporary directory
        shutil.rmtree(export_dir)
        
        logger.info(f"Evidence package exported: {output_path}")
        return output_path
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get evidence collection statistics"""
        stats = self.collection_stats.copy()
        
        # Add database statistics
        with self.db_lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM evidence')
            stats["total_in_database"] = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM chain_of_custody')
            stats["total_custody_entries"] = cursor.fetchone()[0]
            
            # Evidence by status
            cursor.execute('SELECT status, COUNT(*) FROM evidence GROUP BY status')
            stats["by_status"] = dict(cursor.fetchall())
            
            conn.close()
        
        return stats

def main():
    """Main function to test the evidence collection system"""
    collector = EvidenceCollector()
    
    # Test file evidence collection
    try:
        # Create a test file
        test_file = "test_evidence.txt"
        with open(test_file, 'w') as f:
            f.write("This is test evidence for incident response testing.\n")
            f.write(f"Created at: {datetime.now()}\n")
        
        # Collect file evidence
        evidence = collector.collect_file_evidence(
            incident_id="TEST-2025-001",
            source_path=test_file,
            name="Test File Evidence",
            description="Test file for evidence collection system",
            collected_by="Test System",
            metadata={"test": True, "purpose": "system_test"}
        )
        
        print(f"Evidence collected: {evidence.id}")
        print(f"Hash: {evidence.hash_sha256}")
        
        # Collect system evidence
        system_evidence = collector.collect_system_evidence(
            incident_id="TEST-2025-001",
            system_info={"test_run": True, "purpose": "system_test"},
            name="System Information",
            description="System information at time of test",
            collected_by="Test System"
        )
        
        print(f"System evidence collected: {system_evidence.id}")
        
        # Get statistics
        stats = collector.get_statistics()
        print(f"Collection statistics: {json.dumps(stats, indent=2, default=str)}")
        
        # Test integrity verification
        integrity_check = collector.verify_evidence_integrity(evidence.id)
        print(f"Integrity check passed: {integrity_check}")
        
        # Clean up
        os.remove(test_file)
        print("Test completed successfully")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    main()