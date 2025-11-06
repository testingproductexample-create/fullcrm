import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
}

interface SecurityMetric {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  change: number;
  unit: string;
}

interface UserPermission {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}

interface ComplianceItem {
  id: string;
  standard: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastCheck: Date;
  score: number;
  nextReview: Date;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'access' | 'data' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  source: string;
  status: 'pending' | 'investigating' | 'resolved';
}

interface SecurityContextType {
  alerts: SecurityAlert[];
  metrics: SecurityMetric[];
  users: UserPermission[];
  compliance: ComplianceItem[];
  events: SecurityEvent[];
  isLoading: boolean;
  
  // Actions
  addAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => void;
  resolveAlert: (id: string) => void;
  updateMetric: (name: string, value: number) => void;
  addUser: (user: Omit<UserPermission, 'id'>) => void;
  updateUser: (id: string, user: Partial<UserPermission>) => void;
  suspendUser: (id: string) => void;
  checkCompliance: () => void;
  addEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Multiple Failed Login Attempts',
      message: '5 failed login attempts detected from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      source: 'Authentication System',
      resolved: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Unusual Data Access Pattern',
      message: 'User accessed 50+ files in the last 10 minutes',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      source: 'File System',
      resolved: false
    },
    {
      id: '3',
      type: 'info',
      title: 'Security Scan Completed',
      message: 'Weekly vulnerability scan completed successfully',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      source: 'Vulnerability Scanner',
      resolved: true
    }
  ]);

  const [metrics, setMetrics] = useState<SecurityMetric[]>([
    { name: 'Active Threats', value: 3, status: 'warning', change: -2, unit: '' },
    { name: 'System Health', value: 95, status: 'healthy', change: 2, unit: '%' },
    { name: 'Failed Logins', value: 12, status: 'warning', change: 5, unit: '' },
    { name: 'Data Transfers', value: 2.4, status: 'healthy', change: -0.3, unit: 'GB' },
    { name: 'Active Sessions', value: 247, status: 'healthy', change: 15, unit: '' },
    { name: 'Vulnerabilities', value: 2, status: 'warning', change: -1, unit: '' }
  ]);

  const [users, setUsers] = useState<UserPermission[]>([
    {
      id: '1',
      userId: 'USR001',
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: 'Administrator',
      permissions: ['read', 'write', 'delete', 'admin'],
      lastActive: new Date(Date.now() - 1800000),
      status: 'active'
    },
    {
      id: '2',
      userId: 'USR002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'Security Analyst',
      permissions: ['read', 'write'],
      lastActive: new Date(Date.now() - 3600000),
      status: 'active'
    },
    {
      id: '3',
      userId: 'USR003',
      name: 'Michael Brown',
      email: 'michael.brown@company.com',
      role: 'User',
      permissions: ['read'],
      lastActive: new Date(Date.now() - 86400000), // 1 day ago
      status: 'inactive'
    }
  ]);

  const [compliance, setCompliance] = useState<ComplianceItem[]>([
    {
      id: '1',
      standard: 'SOC 2 Type II',
      requirement: 'Access Control Management',
      status: 'compliant',
      lastCheck: new Date(Date.now() - 86400000),
      score: 98,
      nextReview: new Date(Date.now() + 2592000000) // 30 days from now
    },
    {
      id: '2',
      standard: 'ISO 27001',
      requirement: 'Information Security Policies',
      status: 'partial',
      lastCheck: new Date(Date.now() - 172800000), // 2 days ago
      score: 85,
      nextReview: new Date(Date.now() + 3024000000) // 35 days from now
    },
    {
      id: '3',
      standard: 'GDPR',
      requirement: 'Data Protection',
      status: 'compliant',
      lastCheck: new Date(Date.now() - 604800000), // 7 days ago
      score: 95,
      nextReview: new Date(Date.now() + 2592000000) // 30 days from now
    }
  ]);

  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'login',
      severity: 'high',
      description: 'Failed login attempt from suspicious IP',
      timestamp: new Date(Date.now() - 300000),
      source: '192.168.1.100',
      status: 'investigating'
    },
    {
      id: '2',
      type: 'access',
      severity: 'medium',
      description: 'Unusual file access pattern detected',
      timestamp: new Date(Date.now() - 600000),
      source: 'user_247',
      status: 'pending'
    },
    {
      id: '3',
      type: 'system',
      severity: 'low',
      description: 'System backup completed successfully',
      timestamp: new Date(Date.now() - 1800000),
      source: 'backup_service',
      status: 'resolved'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics with slight changes
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * (metric.value * 0.1))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addAlert = (alertData: Omit<SecurityAlert, 'id' | 'timestamp'>) => {
    const newAlert: SecurityAlert = {
      ...alertData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, resolved: true } : alert
    ));
  };

  const updateMetric = (name: string, value: number) => {
    setMetrics(prev => prev.map(metric => 
      metric.name === name ? { ...metric, value } : metric
    ));
  };

  const addUser = (userData: Omit<UserPermission, 'id'>) => {
    const newUser: UserPermission = {
      ...userData,
      id: Date.now().toString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, userData: Partial<UserPermission>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
  };

  const suspendUser = (id: string) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, status: 'suspended' as const } : user
    ));
  };

  const checkCompliance = () => {
    setIsLoading(true);
    // Simulate compliance check
    setTimeout(() => {
      setCompliance(prev => prev.map(item => ({
        ...item,
        lastCheck: new Date(),
        score: Math.min(100, Math.max(70, item.score + (Math.random() - 0.5) * 10))
      })));
      setIsLoading(false);
    }, 2000);
  };

  const addEvent = (eventData: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEvent = {
      ...eventData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const value: SecurityContextType = {
    alerts,
    metrics,
    users,
    compliance,
    events,
    isLoading,
    addAlert,
    resolveAlert,
    updateMetric,
    addUser,
    updateUser,
    suspendUser,
    checkCompliance,
    addEvent
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};