// Type definitions for the operational analytics system

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  salary?: number;
  hourlyRate?: number;
  status: 'active' | 'inactive' | 'terminated';
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceMetric {
  id: string;
  employeeId: string;
  metricDate: string;
  tasksCompleted: number;
  qualityScore: number;
  efficiencyRating: number;
  customerSatisfaction: number;
  goalAchievementPercentage: number;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  orderType: string;
  priorityLevel: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletionTime?: number;
  actualCompletionTime?: number;
  totalCost?: number;
  revenue?: number;
  profitMargin?: number;
  assignedEmployeeId?: string;
  workflowStep: number;
  notes?: string;
}

export interface WorkflowStep {
  id: string;
  workflowName: string;
  stepNumber: number;
  stepName: string;
  estimatedDuration?: number;
  requiredResources?: string[];
  automationEnabled: boolean;
  createdAt: string;
}

export interface OrderWorkflow {
  id: string;
  orderNumber: string;
  workflowStepId: string;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedEmployeeId?: string;
  processingTime?: number;
  notes?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'equipment' | 'staff' | 'materials' | 'facility';
  department: string;
  capacity?: number;
  hourlyCost?: number;
  purchaseDate?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'unavailable';
  maintenanceSchedule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceUtilization {
  id: string;
  resourceId: string;
  utilizationDate: string;
  startTime?: string;
  endTime?: string;
  utilizationHours: number;
  efficiencyPercentage: number;
  downtimeHours: number;
  maintenanceHours: number;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  appointmentId: string;
  customerId?: string;
  customerName: string;
  appointmentType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  assignedEmployeeId?: string;
  noShow: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface CustomerServiceTicket {
  id: string;
  ticketId: string;
  customerId?: string;
  customerEmail?: string;
  issueType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedEmployeeId?: string;
  createdAt: string;
  firstResponseTime?: number;
  resolutionTime?: number;
  satisfactionRating?: number;
  resolvedAt?: string;
  notes?: string;
}

export interface QualityControl {
  id: string;
  recordId: string;
  orderNumber?: string;
  inspectionDate: string;
  inspectorId: string;
  qualityScore: number;
  defectsFound: number;
  defectTypes?: string;
  defectSeverity?: 'low' | 'medium' | 'high' | 'critical';
  correctiveActions?: string;
  passed: boolean;
  createdAt: string;
}

export interface Inventory {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost?: number;
  supplier?: string;
  reorderPoint: number;
  reorderQuantity: number;
  location?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  transactionId: string;
  itemId: string;
  transactionType: 'purchase' | 'sale' | 'adjustment' | 'waste';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceNumber?: string;
  transactionDate: string;
  createdBy?: string;
  notes?: string;
}

export interface TimeTracking {
  id: string;
  employeeId: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  totalHours: number;
  overtimeHours: number;
  workDate: string;
  department?: string;
  projectCode?: string;
  notes?: string;
  createdAt: string;
}

export interface PerformanceTarget {
  id: string;
  targetName: string;
  category: 'productivity' | 'quality' | 'efficiency' | 'customer_satisfaction';
  metricType: string;
  targetValue: number;
  unit: string;
  department?: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'achieved' | 'missed';
  createdAt: string;
  updatedAt: string;
}

export interface SystemAlert {
  id: string;
  alertId: string;
  alertType: 'performance' | 'inventory' | 'quality' | 'system' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  sourceTable?: string;
  sourceId?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface DashboardConfig {
  id: string;
  configName: string;
  configType: 'chart' | 'metric' | 'table' | 'gauge';
  department?: string;
  refreshInterval: number;
  chartConfig?: any;
  filtersConfig?: any;
  isDefault: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard and analytics types
export interface DashboardMetrics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageCompletionTime: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: number;
  totalEmployees: number;
  activeEmployees: number;
  averageUtilization: number;
  totalTickets: number;
  openTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  totalInventoryItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  inventoryTurnover: number;
  totalQualityIssues: number;
  qualityPassRate: number;
  systemAlerts: number;
  criticalAlerts: number;
}

export interface PerformanceData {
  date: string;
  value: number;
  target?: number;
  department?: string;
  category?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface KPI {
  name: string;
  value: number;
  unit?: string;
  target?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend: 'up' | 'down' | 'stable';
}

export interface FilterOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  departments?: string[];
  employees?: string[];
  categories?: string[];
  status?: string[];
  priority?: string[];
  location?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  totalCount?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Form types
export interface CreateEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  salary?: number;
  hourlyRate?: number;
}

export interface CreateOrderForm {
  orderType: string;
  priorityLevel: number;
  estimatedCompletionTime?: number;
  assignedEmployeeId?: string;
  notes?: string;
}

export interface CreateAppointmentForm {
  customerName: string;
  appointmentType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  assignedEmployeeId?: string;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}