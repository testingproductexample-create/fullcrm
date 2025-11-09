import { KPI, Alert, DataSource } from '../types';

// Key Performance Indicators Configuration
export const KPIS: KPI[] = [
  // Revenue Metrics
  {
    id: 'revenue-total',
    name: 'Total Revenue',
    value: 0,
    target: 1000000,
    unit: '$',
    trend: 'up',
    trendPercentage: 0,
    category: 'revenue',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'currency'
  },
  {
    id: 'revenue-mrr',
    name: 'Monthly Recurring Revenue',
    value: 0,
    target: 50000,
    unit: '$',
    trend: 'up',
    trendPercentage: 0,
    category: 'revenue',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'currency'
  },
  {
    id: 'revenue-growth',
    name: 'Revenue Growth',
    value: 0,
    unit: '%',
    trend: 'up',
    trendPercentage: 0,
    category: 'revenue',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'percentage'
  },
  {
    id: 'arpu',
    name: 'Average Revenue Per User',
    value: 0,
    target: 100,
    unit: '$',
    trend: 'up',
    trendPercentage: 0,
    category: 'revenue',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'currency'
  },

  // Order Metrics
  {
    id: 'orders-total',
    name: 'Total Orders',
    value: 0,
    target: 1000,
    unit: '',
    trend: 'up',
    trendPercentage: 0,
    category: 'orders',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },
  {
    id: 'orders-avg-value',
    name: 'Average Order Value',
    value: 0,
    target: 150,
    unit: '$',
    trend: 'up',
    trendPercentage: 0,
    category: 'orders',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'currency'
  },
  {
    id: 'orders-conversion',
    name: 'Conversion Rate',
    value: 0,
    target: 5,
    unit: '%',
    trend: 'up',
    trendPercentage: 0,
    category: 'orders',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'percentage'
  },
  {
    id: 'orders-pending',
    name: 'Pending Orders',
    value: 0,
    target: 50,
    unit: '',
    trend: 'down',
    trendPercentage: 0,
    category: 'orders',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },

  // Customer Metrics
  {
    id: 'customers-total',
    name: 'Total Customers',
    value: 0,
    target: 10000,
    unit: '',
    trend: 'up',
    trendPercentage: 0,
    category: 'customers',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },
  {
    id: 'customers-new',
    name: 'New Customers',
    value: 0,
    target: 100,
    unit: '',
    trend: 'up',
    trendPercentage: 0,
    category: 'customers',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },
  {
    id: 'customers-active',
    name: 'Active Customers',
    value: 0,
    target: 5000,
    unit: '',
    trend: 'up',
    trendPercentage: 0,
    category: 'customers',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },
  {
    id: 'customers-retention',
    name: 'Customer Retention',
    value: 0,
    target: 85,
    unit: '%',
    trend: 'up',
    trendPercentage: 0,
    category: 'customers',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'percentage'
  },
  {
    id: 'customers-churn',
    name: 'Churn Rate',
    value: 0,
    target: 5,
    unit: '%',
    trend: 'down',
    trendPercentage: 0,
    category: 'customers',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'percentage'
  },
  {
    id: 'nps',
    name: 'Net Promoter Score',
    value: 0,
    target: 50,
    unit: '',
    trend: 'up',
    trendPercentage: 0,
    category: 'customers',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },

  // Productivity Metrics
  {
    id: 'productivity-revenue-per-employee',
    name: 'Revenue Per Employee',
    value: 0,
    target: 200000,
    unit: '$',
    trend: 'up',
    trendPercentage: 0,
    category: 'productivity',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'currency'
  },
  {
    id: 'productivity-tasks-completed',
    name: 'Tasks Completed',
    value: 0,
    target: 500,
    unit: '',
    trend: 'up',
    trendPercentage: 0,
    category: 'productivity',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number'
  },
  {
    id: 'productivity-efficiency',
    name: 'Efficiency Score',
    value: 0,
    target: 90,
    unit: '%',
    trend: 'up',
    trendPercentage: 0,
    category: 'productivity',
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'percentage'
  }
];

// Color Schemes for Glassmorphism Design
export const COLOR_SCHEMES = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    black: 'rgba(0, 0, 0, 0.1)',
    blue: 'rgba(59, 130, 246, 0.1)',
    green: 'rgba(34, 197, 94, 0.1)',
    red: 'rgba(239, 68, 68, 0.1)',
    yellow: 'rgba(245, 158, 11, 0.1)',
    purple: 'rgba(147, 51, 234, 0.1)',
    pink: 'rgba(236, 72, 153, 0.1)'
  }
};

// Chart Color Palettes
export const CHART_COLORS = {
  primary: [
    '#3b82f6',
    '#1d4ed8',
    '#1e40af',
    '#1e3a8a'
  ],
  success: [
    '#22c55e',
    '#16a34a',
    '#15803d',
    '#14532d'
  ],
  warning: [
    '#f59e0b',
    '#d97706',
    '#b45309',
    '#92400e'
  ],
  error: [
    '#ef4444',
    '#dc2626',
    '#b91c1c',
    '#991b1b'
  ],
  rainbow: [
    '#3b82f6',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#a855f7'
  ]
};

// Default Alert Thresholds
export const ALERT_THRESHOLDS: Record<string, Alert> = {
  lowRevenue: {
    id: 'alert-low-revenue',
    title: 'Low Revenue Alert',
    message: 'Daily revenue is below expected threshold',
    severity: 'warning',
    type: 'threshold',
    source: 'revenue',
    entity: 'revenue',
    threshold: {
      metric: 'revenue-total',
      operator: 'lt',
      value: 10000,
      severity: 'warning'
    },
    triggeredAt: new Date(),
    acknowledged: false,
    actions: [
      {
        id: 'email-action',
        type: 'email',
        config: { recipients: ['manager@company.com'] },
        enabled: true
      }
    ],
    isRecurring: false
  },
  highOrders: {
    id: 'alert-high-orders',
    title: 'High Order Volume',
    message: 'Order volume exceeds normal capacity',
    severity: 'error',
    type: 'threshold',
    source: 'orders',
    entity: 'orders',
    threshold: {
      metric: 'orders-total',
      operator: 'gt',
      value: 200,
      severity: 'error'
    },
    triggeredAt: new Date(),
    acknowledged: false,
    actions: [
      {
        id: 'slack-action',
        type: 'slack',
        config: { channel: '#operations' },
        enabled: true
      }
    ],
    isRecurring: true,
    nextOccurrence: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  customerChurn: {
    id: 'alert-customer-churn',
    title: 'High Customer Churn',
    message: 'Customer churn rate is above acceptable threshold',
    severity: 'error',
    type: 'threshold',
    source: 'customers',
    entity: 'customers',
    threshold: {
      metric: 'customers-churn',
      operator: 'gt',
      value: 10,
      severity: 'error'
    },
    triggeredAt: new Date(),
    acknowledged: false,
    actions: [
      {
        id: 'email-action',
        type: 'email',
        config: { recipients: ['cxo@company.com'] },
        enabled: true
      }
    ],
    isRecurring: false
  }
};

// Data Source Configurations
export const DATA_SOURCES: DataSource[] = [
  {
    id: 'internal-crm',
    name: 'Internal CRM',
    type: 'internal',
    config: {
      connectionString: 'postgresql://localhost:5432/crm',
      query: 'SELECT * FROM customers WHERE updated_at > NOW() - INTERVAL \'1 hour\'',
      frequency: 5
    },
    isActive: true,
    syncStatus: 'idle'
  },
  {
    id: 'internal-orders',
    name: 'Order Management System',
    type: 'internal',
    config: {
      connectionString: 'postgresql://localhost:5432/orders',
      query: 'SELECT * FROM orders WHERE created_at > NOW() - INTERVAL \'1 hour\'',
      frequency: 2
    },
    isActive: true,
    syncStatus: 'idle'
  },
  {
    id: 'internal-finance',
    name: 'Financial System',
    type: 'internal',
    config: {
      connectionString: 'postgresql://localhost:5432/finance',
      query: 'SELECT * FROM transactions WHERE created_at > NOW() - INTERVAL \'1 hour\'',
      frequency: 10
    },
    isActive: true,
    syncStatus: 'idle'
  },
  {
    id: 'internal-inventory',
    name: 'Inventory Management',
    type: 'internal',
    config: {
      connectionString: 'postgresql://localhost:5432/inventory',
      query: 'SELECT * FROM inventory WHERE updated_at > NOW() - INTERVAL \'1 hour\'',
      frequency: 15
    },
    isActive: true,
    syncStatus: 'idle'
  },
  {
    id: 'internal-payroll',
    name: 'Payroll System',
    type: 'internal',
    config: {
      connectionString: 'postgresql://localhost:5432/payroll',
      query: 'SELECT * FROM payroll_records WHERE processed_at > NOW() - INTERVAL \'1 day\'',
      frequency: 1440
    },
    isActive: true,
    syncStatus: 'idle'
  }
];

// Widget Type Configurations
export const WIDGET_CONFIGS = {
  kpi: {
    size: { width: 300, height: 150 },
    minSize: { width: 250, height: 120 },
    maxSize: { width: 400, height: 200 }
  },
  chart: {
    size: { width: 600, height: 400 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 800, height: 600 }
  },
  table: {
    size: { width: 800, height: 400 },
    minSize: { width: 600, height: 300 },
    maxSize: { width: 1200, height: 800 }
  },
  gauge: {
    size: { width: 300, height: 300 },
    minSize: { width: 250, height: 250 },
    maxSize: { width: 400, height: 400 }
  },
  progress: {
    size: { width: 300, height: 100 },
    minSize: { width: 200, height: 80 },
    maxSize: { width: 500, height: 150 }
  },
  alerts: {
    size: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    maxSize: { width: 600, height: 500 }
  }
};

// User Role Permissions
export const ROLE_PERMISSIONS = {
  admin: ['*'],
  executive: [
    'dashboard:view',
    'dashboard:edit',
    'dashboard:share',
    'alerts:view',
    'alerts:manage',
    'export:all',
    'reports:all',
    'users:view',
    'system:config'
  ],
  manager: [
    'dashboard:view',
    'dashboard:edit',
    'dashboard:share',
    'alerts:view',
    'alerts:acknowledge',
    'export:reports',
    'reports:team',
    'users:view'
  ],
  analyst: [
    'dashboard:view',
    'dashboard:edit',
    'alerts:view',
    'export:data',
    'reports:self',
    'data:analyze'
  ],
  viewer: [
    'dashboard:view',
    'alerts:view',
    'export:basic'
  ],
  guest: [
    'dashboard:view'
  ]
};

// Export Format Options
export const EXPORT_FORMATS = {
  pdf: {
    name: 'PDF',
    extension: 'pdf',
    mime: 'application/pdf',
    options: {
      pageSize: ['A4', 'A3', 'Letter'],
      orientation: ['portrait', 'landscape'],
      quality: ['low', 'medium', 'high']
    }
  },
  excel: {
    name: 'Excel',
    extension: 'xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    options: {
      sheetName: 'Dashboard Data'
    }
  },
  csv: {
    name: 'CSV',
    extension: 'csv',
    mime: 'text/csv',
    options: {
      delimiter: ',',
      encoding: 'utf-8'
    }
  }
};

// Default Dashboard Layouts
export const DEFAULT_DASHBOARDS = {
  executive: {
    name: 'Executive Overview',
    description: 'High-level business insights for executives',
    widgets: [
      { type: 'kpi', position: { x: 0, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 1, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 2, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 3, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'chart', position: { x: 0, y: 1 }, size: { width: 800, height: 400 } },
      { type: 'chart', position: { x: 4, y: 1 }, size: { width: 600, height: 400 } }
    ]
  },
  operations: {
    name: 'Operations Dashboard',
    description: 'Detailed operational metrics and KPIs',
    widgets: [
      { type: 'alerts', position: { x: 0, y: 0 }, size: { width: 400, height: 300 } },
      { type: 'kpi', position: { x: 1, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 2, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'chart', position: { x: 0, y: 1 }, size: { width: 600, height: 400 } },
      { type: 'table', position: { x: 3, y: 1 }, size: { width: 800, height: 400 } }
    ]
  },
  sales: {
    name: 'Sales Analytics',
    description: 'Sales performance and customer insights',
    widgets: [
      { type: 'kpi', position: { x: 0, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 1, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 2, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'kpi', position: { x: 3, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'chart', position: { x: 0, y: 1 }, size: { width: 400, height: 400 } },
      { type: 'chart', position: { x: 2, y: 1 }, size: { width: 400, height: 400 } }
    ]
  }
};

// Date Range Presets
export const DATE_RANGES = {
  today: { label: 'Today', days: 1 },
  yesterday: { label: 'Yesterday', days: 1, offset: 1 },
  last7Days: { label: 'Last 7 Days', days: 7 },
  last30Days: { label: 'Last 30 Days', days: 30 },
  last90Days: { label: 'Last 90 Days', days: 90 },
  thisMonth: { label: 'This Month', days: 30 },
  lastMonth: { label: 'Last Month', days: 30, offset: 30 },
  thisQuarter: { label: 'This Quarter', days: 90 },
  lastQuarter: { label: 'Last Quarter', days: 90, offset: 90 },
  thisYear: { label: 'This Year', days: 365 },
  lastYear: { label: 'Last Year', days: 365, offset: 365 }
};

// Chart Animation Durations
export const ANIMATION_DURATIONS = {
  fast: 300,
  normal: 600,
  slow: 1200
};

// Glassmorphism Configuration
export const GLASSMORPHISM = {
  intensity: 0.1,
  borderRadius: 16,
  backdropBlur: 20,
  borderWidth: 1,
  shadows: {
    light: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    medium: '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
    strong: '0 8px 32px 0 rgba(31, 38, 135, 0.7)'
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  kpis: '/api/kpis',
  dashboards: '/api/dashboards',
  widgets: '/api/widgets',
  alerts: '/api/alerts',
  users: '/api/users',
  export: '/api/export',
  realtime: '/api/realtime',
  integrations: '/api/integrations',
  audit: '/api/audit'
};

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  KPI_UPDATE: 'kpi:update',
  ALERT_NEW: 'alert:new',
  ALERT_RESOLVED: 'alert:resolved',
  DASHBOARD_UPDATE: 'dashboard:update',
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave'
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  loadTime: 2000, // 2 seconds
  renderTime: 1000, // 1 second
  dataLoadTime: 500, // 500ms
  cacheHitRate: 0.8, // 80%
  errorRate: 0.01, // 1%
  uptime: 0.999 // 99.9%
};