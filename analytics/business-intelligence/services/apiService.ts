import { 
  KPI, 
  Dashboard, 
  Widget, 
  Alert, 
  User, 
  DataQuery, 
  ChartData,
  ExportRequest,
  ExportConfig,
  RealtimeMessage,
  PerformanceMetrics,
  ApiResponse,
  Integration,
  AuditLog
} from '../types';
import { 
  API_ENDPOINTS, 
  WS_EVENTS, 
  DEFAULT_DASHBOARDS,
  DATE_RANGES 
} from '../data/constants';
import { 
  formatDate, 
  calculateTrend, 
  generateMockData,
  debounce 
} from '../utils/helpers';

// Base API Service
class BaseService {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// KPI Service
class KPIService extends BaseService {
  async getKPIs(): Promise<KPI[]> {
    const response = await this.get<KPI[]>('/kpis');
    return response.data;
  }

  async getKPI(id: string): Promise<KPI> {
    const response = await this.get<KPI>(`/kpis/${id}`);
    return response.data;
  }

  async refreshKPIs(): Promise<KPI[]> {
    // Simulate real-time KPI updates
    const mockKPIs = generateMockKPIs();
    return mockKPIs;
  }

  async getKPIsByCategory(category: string): Promise<KPI[]> {
    const kpis = await this.getKPIs();
    return kpis.filter(kpi => kpi.category === category);
  }

  async getKPIHistory(kpiId: string, dateRange?: { start: Date; end: Date }): Promise<ChartData> {
    // Mock historical data
    const labels = Array.from({ length: 30 }, (_, i) => 
      formatDate(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), 'MMM dd')
    );
    const data = Array.from({ length: 30 }, () => Math.random() * 100000 + 50000);
    
    return {
      labels,
      datasets: [{
        label: 'Revenue',
        data
      }]
    };
  }
}

// Dashboard Service
class DashboardService extends BaseService {
  async getDashboards(): Promise<Dashboard[]> {
    const response = await this.get<Dashboard[]>('/dashboards');
    return response.data;
  }

  async getDashboard(id: string): Promise<Dashboard> {
    const response = await this.get<Dashboard>(`/dashboards/${id}`);
    return response.data;
  }

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const response = await this.post<Dashboard>('/dashboards', dashboard);
    return response.data;
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    const response = await this.put<Dashboard>(`/dashboards/${id}`, updates);
    return response.data;
  }

  async deleteDashboard(id: string): Promise<void> {
    await this.delete(`/dashboards/${id}`);
  }

  async duplicateDashboard(id: string, name: string): Promise<Dashboard> {
    const response = await this.post<Dashboard>(`/dashboards/${id}/duplicate`, { name });
    return response.data;
  }

  async shareDashboard(id: string, isPublic: boolean): Promise<Dashboard> {
    const response = await this.patch<Dashboard>(`/dashboards/${id}/share`, { isPublic });
    return response.data;
  }

  async getSharedDashboards(): Promise<Dashboard[]> {
    const response = await this.get<Dashboard[]>('/dashboards/shared');
    return response.data;
  }
}

// Widget Service
class WidgetService extends BaseService {
  async getWidgets(dashboardId: string): Promise<Widget[]> {
    const response = await this.get<Widget[]>(`/dashboards/${dashboardId}/widgets`);
    return response.data;
  }

  async createWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Promise<Widget> {
    const response = await this.post<Widget>(`/dashboards/${dashboardId}/widgets`, widget);
    return response.data;
  }

  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): Promise<Widget> {
    const response = await this.put<Widget>(
      `/dashboards/${dashboardId}/widgets/${widgetId}`, 
      updates
    );
    return response.data;
  }

  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    await this.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
  }

  async getWidgetData(widget: Widget): Promise<any> {
    // Mock data generation based on widget type
    return generateMockWidgetData(widget);
  }

  async refreshWidget(dashboardId: string, widgetId: string): Promise<any> {
    const response = await this.post<any>(`/dashboards/${dashboardId}/widgets/${widgetId}/refresh`, {});
    return response.data;
  }
}

// Alert Service
class AlertService extends BaseService {
  async getAlerts(): Promise<Alert[]> {
    const response = await this.get<Alert[]>('/alerts');
    return response.data;
  }

  async getAlertsByStatus(status: 'active' | 'acknowledged' | 'resolved'): Promise<Alert[]> {
    const response = await this.get<Alert[]>(`/alerts?status=${status}`);
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    const response = await this.post<Alert>(`/alerts/${alertId}/acknowledge`, {});
    return response.data;
  }

  async resolveAlert(alertId: string): Promise<Alert> {
    const response = await this.post<Alert>(`/alerts/${alertId}/resolve`, {});
    return response.data;
  }

  async dismissAlert(alertId: string): Promise<void> {
    await this.delete(`/alerts/${alertId}`);
  }

  async createAlert(alert: Omit<Alert, 'id' | 'triggeredAt'>): Promise<Alert> {
    const response = await this.post<Alert>('/alerts', alert);
    return response.data;
  }

  async getAlertHistory(limit: number = 100): Promise<Alert[]> {
    const response = await this.get<Alert[]>(`/alerts/history?limit=${limit}`);
    return response.data;
  }

  async getAlertsBySeverity(severity: string): Promise<Alert[]> {
    const response = await this.get<Alert[]>(`/alerts?severity=${severity}`);
    return response.data;
  }
}

// User Service
class UserService extends BaseService {
  async getCurrentUser(): Promise<User> {
    const response = await this.get<User>('/auth/me');
    return response.data;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.put<User>('/auth/profile', updates);
    return response.data;
  }

  async updatePreferences(preferences: any): Promise<void> {
    await this.put('/auth/preferences', preferences);
  }

  async getUsers(): Promise<User[]> {
    const response = await this.get<User[]>('/users');
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.get<User>(`/users/${id}`);
    return response.data;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const response = await this.patch<User>(`/users/${id}/role`, { role });
    return response.data;
  }

  async deactivateUser(id: string): Promise<void> {
    await this.delete(`/users/${id}`);
  }
}

// Export Service
class ExportService extends BaseService {
  async exportDashboard(request: ExportRequest): Promise<Blob> {
    const response = await this.post<Blob>('/export/dashboard', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportData(config: ExportConfig, data: any[]): Promise<Blob> {
    const response = await this.post<Blob>('/export/data', { config, data }, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getExportHistory(): Promise<any[]> {
    const response = await this.get<any[]>('/export/history');
    return response.data;
  }

  async downloadExport(exportId: string): Promise<Blob> {
    const response = await this.get<Blob>(`/export/${exportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async scheduleExport(request: ExportRequest): Promise<void> {
    await this.post('/export/schedule', request);
  }

  async getScheduledExports(): Promise<any[]> {
    const response = await this.get<any[]>('/export/scheduled');
    return response.data;
  }
}

// Real-time Service
class RealTimeService extends BaseService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsURL = this.baseURL.replace('http', 'ws') + '/realtime';
    this.socket = new WebSocket(wsURL);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    };

    this.socket.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});
      this.reconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { error });
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      this.emit('reconnect-failed', {});
    }
  }

  subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Send subscription to server if connected
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        event
      }));
    }
  }

  unsubscribe(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  private handleMessage(message: RealtimeMessage): void {
    this.emit('message', message);
    
    switch (message.type) {
      case 'kpi_update':
        this.emit('kpi_update', message.payload);
        break;
      case 'alert':
        this.emit('alert', message.payload);
        break;
      case 'data_change':
        this.emit('data_change', message.payload);
        break;
      case 'user_action':
        this.emit('user_action', message.payload);
        break;
      default:
        this.emit(message.type, message.payload);
    }
  }

  sendMessage(message: RealtimeMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  }

  ping(): number {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const start = Date.now();
      this.socket.send(JSON.stringify({ type: 'ping', timestamp: start }));
      return start;
    }
    return 0;
  }
}

// Integration Service
class IntegrationService extends BaseService {
  async getIntegrations(): Promise<Integration[]> {
    const response = await this.get<Integration[]>('/integrations');
    return response.data;
  }

  async getIntegration(id: string): Promise<Integration> {
    const response = await this.get<Integration>(`/integrations/${id}`);
    return response.data;
  }

  async createIntegration(integration: Omit<Integration, 'id' | 'lastSync' | 'nextSync' | 'status'>): Promise<Integration> {
    const response = await this.post<Integration>('/integrations', integration);
    return response.data;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const response = await this.put<Integration>(`/integrations/${id}`, updates);
    return response.data;
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.delete(`/integrations/${id}`);
  }

  async syncIntegration(id: string): Promise<void> {
    await this.post(`/integrations/${id}/sync`, {});
  }

  async getSyncHistory(integrationId: string): Promise<any[]> {
    const response = await this.get<any[]>(`/integrations/${integrationId}/sync-history`);
    return response.data;
  }

  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.post(`/integrations/${id}/test`, {});
    return response.data;
  }
}

// Performance Service
class PerformanceService extends BaseService {
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await this.get<PerformanceMetrics>('/performance/metrics');
    return response.data;
  }

  async getPerformanceHistory(): Promise<PerformanceMetrics[]> {
    const response = await this.get<PerformanceMetrics[]>('/performance/history');
    return response.data;
  }

  async recordPerformance(metrics: PerformanceMetrics): Promise<void> {
    await this.post('/performance/record', metrics);
  }

  async optimizeQuery(query: DataQuery): Promise<{ optimizedQuery: DataQuery; suggestions: string[] }> {
    const response = await this.post('/performance/optimize', { query });
    return response.data;
  }
}

// Audit Service
class AuditService extends BaseService {
  async getAuditLogs(filters?: any): Promise<AuditLog[]> {
    const queryParams = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const response = await this.get<AuditLog[]>(`/audit/logs${queryParams}`);
    return response.data;
  }

  async logAction(action: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    await this.post('/audit/log', action);
  }

  async getUserActivity(userId: string): Promise<AuditLog[]> {
    const response = await this.get<AuditLog[]>(`/audit/user/${userId}/activity`);
    return response.data;
  }

  async getResourceActivity(resource: string, resourceId?: string): Promise<AuditLog[]> {
    const endpoint = `/audit/resource/${resource}${resourceId ? `/${resourceId}` : ''}/activity`;
    const response = await this.get<AuditLog[]>(endpoint);
    return response.data;
  }
}

// Service Factory
class DashboardServices {
  kpi: KPIService;
  dashboard: DashboardService;
  widget: WidgetService;
  alert: AlertService;
  user: UserService;
  export: ExportService;
  realtime: RealTimeService;
  integration: IntegrationService;
  performance: PerformanceService;
  audit: AuditService;

  constructor(baseURL?: string) {
    this.kpi = new KPIService(baseURL);
    this.dashboard = new DashboardService(baseURL);
    this.widget = new WidgetService(baseURL);
    this.alert = new AlertService(baseURL);
    this.user = new UserService(baseURL);
    this.export = new ExportService(baseURL);
    this.realtime = new RealTimeService(baseURL);
    this.integration = new IntegrationService(baseURL);
    this.performance = new PerformanceService(baseURL);
    this.audit = new AuditService(baseURL);
  }
}

// Export services instance
export const services = new DashboardServices();

// Mock data generators
function generateMockKPIs(): KPI[] {
  return generateMockData(15, (index) => ({
    id: `kpi-${index + 1}`,
    name: `KPI ${index + 1}`,
    value: Math.random() * 100000,
    previousValue: Math.random() * 100000,
    target: 100000,
    unit: '$',
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendPercentage: Math.random() * 20 - 10,
    category: ['revenue', 'orders', 'customers', 'productivity'][Math.floor(Math.random() * 4)] as any,
    lastUpdated: new Date(),
    isRealTime: true,
    format: 'number' as const
  }));
}

function generateMockWidgetData(widget: Widget): any {
  // Generate mock data based on widget type
  switch (widget.visualization) {
    case 'line':
    case 'bar':
    case 'area':
      const labels = Array.from({ length: 30 }, (_, i) => 
        new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString()
      );
      return {
        labels,
        datasets: [{
          label: 'Data',
          data: Array.from({ length: 30 }, () => Math.random() * 1000),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }]
      };
    
    case 'pie':
    case 'doughnut':
      return {
        labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
        datasets: [{
          data: [30, 25, 20, 25],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ]
        }]
      };
    
    case 'metric':
      return {
        value: Math.random() * 1000,
        change: Math.random() * 100 - 50,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    
    case 'table':
      return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 1000,
        status: ['active', 'pending', 'completed'][Math.floor(Math.random() * 3)]
      }));
    
    default:
      return { message: 'Mock data for ' + widget.type };
  }
}

export { DashboardServices };