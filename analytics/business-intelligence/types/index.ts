// Core KPI Types
export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  category: 'revenue' | 'orders' | 'customers' | 'productivity' | 'financial' | 'operational';
  lastUpdated: Date;
  isRealTime: boolean;
  format: 'number' | 'currency' | 'percentage' | 'time';
}

// Dashboard Types
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  userId: string;
  widgets: Widget[];
  layout: WidgetLayout[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  dataSource: string;
  query: DataQuery;
  visualization: VisualizationType;
  configuration: WidgetConfig;
  filters: Filter[];
  refreshInterval?: number;
  size: WidgetSize;
  position: WidgetPosition;
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export type WidgetType = 
  | 'kpi'
  | 'chart'
  | 'table'
  | 'gauge'
  | 'progress'
  | 'metric'
  | 'funnel'
  | 'heatmap'
  | 'treemap'
  | 'scatter'
  | 'barometer'
  | 'alerts'
  | 'calendar'
  | 'list'
  | 'map';

export type VisualizationType =
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'radar'
  | 'polar'
  | 'funnel'
  | 'gauge'
  | 'progress'
  | 'metric'
  | 'card'
  | 'table'
  | 'heatmap'
  | 'treemap';

export interface WidgetConfig {
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  colors: string[];
  animation: boolean;
  responsive: boolean;
  thresholds?: {
    min: number;
    max: number;
    warning: number;
    critical: number;
  };
  customConfig?: Record<string, any>;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

// Data Types
export interface DataQuery {
  entity: string;
  fields: string[];
  filters: QueryFilter[];
  groupBy?: string[];
  orderBy?: OrderBy[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dateRange?: DateRange;
  limit?: number;
  offset?: number;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'between';
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Filter {
  id: string;
  field: string;
  type: 'dropdown' | 'checkbox' | 'date' | 'number' | 'text';
  label: string;
  options?: FilterOption[];
  defaultValue?: any;
  required: boolean;
}

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

// Alert Types
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  type: 'threshold' | 'anomaly' | 'system' | 'custom';
  source: string;
  entity: string;
  entityId?: string;
  threshold?: AlertThreshold;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions: AlertAction[];
  isRecurring: boolean;
  nextOccurrence?: Date;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration?: number; // minutes
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AlertAction {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  config: Record<string, any>;
  enabled: boolean;
}

// User and Role Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export type UserRole = 'admin' | 'executive' | 'manager' | 'analyst' | 'viewer' | 'guest';

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: string;
  value: any;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboardLayout: UserDashboardLayout;
  defaultDateRange: DateRange;
  refreshInterval: number;
  exportFormat: 'pdf' | 'excel' | 'csv';
  glassmorphismIntensity: number;
  animations: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    start: string;
    end: string;
  };
}

export interface UserDashboardLayout {
  widgets: string[];
  layout: WidgetLayout[];
  isCustom: boolean;
}

// Chart and Visualization Types
export interface ChartData {
  labels: string[];
  datasets: Dataset[];
  meta?: Record<string, any>;
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  yAxisID?: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: ChartPlugins;
  scales: ChartScales;
  elements: ChartElements;
  animation: ChartAnimation;
  interaction: ChartInteraction;
}

export interface ChartPlugins {
  legend: ChartLegend;
  tooltip: ChartTooltip;
  title?: ChartTitle;
}

export interface ChartLegend {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  labels: ChartLegendLabels;
}

export interface ChartLegendLabels {
  usePointStyle: boolean;
  padding: number;
  font: ChartFont;
}

export interface ChartFont {
  family: string;
  size: number;
  weight: string;
}

export interface ChartTooltip {
  enabled: boolean;
  backgroundColor: string;
  titleColor: string;
  bodyColor: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
}

export interface ChartTitle {
  display: boolean;
  text: string;
  color: string;
  font: ChartFont;
}

export interface ChartScales {
  x: ChartScale;
  y: ChartScale;
  y1?: ChartScale;
}

export interface ChartScale {
  type: 'linear' | 'category' | 'time' | 'logarithmic';
  position: 'left' | 'right';
  display: boolean;
  title: ChartScaleTitle;
  grid: ChartGrid;
  ticks: ChartTicks;
}

export interface ChartScaleTitle {
  display: boolean;
  text: string;
  color: string;
  font: ChartFont;
}

export interface ChartGrid {
  display: boolean;
  color: string;
  borderDash: number[];
  drawBorder: boolean;
  drawOnChartArea: boolean;
}

export interface ChartTicks {
  color: string;
  font: ChartFont;
  maxRotation: number;
  minRotation: number;
}

export interface ChartElements {
  point: ChartPoint;
  line: ChartLine;
  bar: ChartBar;
}

export interface ChartPoint {
  radius: number;
  hoverRadius: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface ChartLine {
  borderColor: string;
  borderWidth: number;
  tension: number;
  fill: boolean;
}

export interface ChartBar {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface ChartAnimation {
  duration: number;
  easing: string;
  delay: number;
}

export interface ChartInteraction {
  mode: 'index' | 'nearest' | 'point' | 'nearest-x' | 'nearest-y';
  intersect: boolean;
}

// Export Types
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  title: string;
  subtitle?: string;
  includeCharts: boolean;
  includeData: boolean;
  includeTimestamp: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'letter';
  quality?: 'low' | 'medium' | 'high';
  customCSS?: string;
}

export interface ExportRequest {
  dashboardId: string;
  widgets?: string[];
  dateRange: DateRange;
  config: ExportConfig;
  userId: string;
}

// Real-time Types
export interface RealtimeConnection {
  id: string;
  userId: string;
  dashboardId: string;
  socketId: string;
  status: 'connected' | 'disconnected' | 'reconnecting';
  lastPing: Date;
  subscriptions: string[];
}

export interface RealtimeMessage {
  type: 'kpi_update' | 'alert' | 'data_change' | 'user_action';
  payload: any;
  timestamp: Date;
  userId?: string;
  dashboardId?: string;
}

// Integration Types
export interface DataSource {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'api' | 'database' | 'file';
  config: DataSourceConfig;
  isActive: boolean;
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  error?: string;
}

export interface DataSourceConfig {
  connectionString?: string;
  apiUrl?: string;
  apiKey?: string;
  credentials?: Record<string, string>;
  query?: string;
  frequency?: number; // minutes
  batchSize?: number;
  timeout?: number; // seconds
  retryAttempts?: number;
  headers?: Record<string, string>;
}

export interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'erp' | 'finance' | 'inventory' | 'payroll' | 'pos' | 'ecommerce' | 'analytics';
  source: DataSource;
  mappings: FieldMapping[];
  schedule: SyncSchedule;
  isEnabled: boolean;
  lastSync?: Date;
  nextSync?: Date;
  status: 'active' | 'inactive' | 'error';
  error?: string;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: string;
  required: boolean;
}

export interface SyncSchedule {
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cron?: string;
  startTime?: Date;
  endTime?: Date;
  timezone: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  errors: string[];
  meta: ResponseMeta;
  timestamp: Date;
}

export interface ResponseMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  took: number; // milliseconds
  requestId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId: string;
  path: string;
  method: string;
}

// Performance Types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  dataLoadTime: number;
  queryTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkTime: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
}

// Audit Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}