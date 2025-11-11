'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Bell, AlertTriangle, AlertCircle, Clock, CheckCircle, X, Eye, Filter, Search,
  TrendingDown, BarChart3, Target, Settings, RefreshCw, Calendar, Users, Zap
} from 'lucide-react';
import { 
  usePerformanceAlerts, 
  useActiveAlertsCount, 
  useUpdateAlertStatus,
  useBulkUpdateAlertStatus
} from '@/hooks/useEfficiency';
import { cn } from '@/lib/utils';
import type { AlertType, SeverityLevel, AlertStatus, ThresholdType } from '@/types/efficiency';

export default function AlertManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus | 'all'>('active');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AlertType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  const { data: alerts, isLoading: alertsLoading } = usePerformanceAlerts(selectedStatus !== 'all' ? selectedStatus : undefined);
  const { data: activeAlertsCount } = useActiveAlertsCount();
  
  const updateAlertMutation = useUpdateAlertStatus();
  const bulkUpdateMutation = useBulkUpdateAlertStatus();

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'threshold_breach':
        return <Target className="h-4 w-4" />;
      case 'anomaly_detection':
        return <BarChart3 className="h-4 w-4" />;
      case 'trend_alert':
        return <TrendingDown className="h-4 w-4" />;
      case 'sla_violation':
        return <Clock className="h-4 w-4" />;
      case 'bottleneck_detected':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'secondary';
      case 'investigating':
        return 'default';
      case 'resolved':
        return 'outline';
      case 'suppressed':
        return 'secondary';
    }
  };

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = searchTerm === '' || 
      alert.alert_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || alert.alert_type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleAlertAction = (alertId: string, status: AlertStatus, notes?: string) => {
    updateAlertMutation.mutate({
      id: alertId,
      status,
      acknowledged_by: status === 'acknowledged' ? 'current-user-id' : undefined,
      resolved_by: status === 'resolved' ? 'current-user-id' : undefined,
      resolution_notes: notes
    });
  };

  const handleBulkAction = (action: AlertStatus) => {
    if (selectedAlerts.length > 0) {
      bulkUpdateMutation.mutate({
        ids: selectedAlerts,
        status: action,
        acknowledged_by: action === 'acknowledged' ? 'current-user-id' : undefined
      });
      setSelectedAlerts([]);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === (filteredAlerts?.length || 0)) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts?.map(alert => alert.id) || []);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alert Management</h2>
          <p className="text-muted-foreground">
            Monitor and respond to performance alerts and system notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configure Alerts
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlertsCount || 0}</div>
            <p className="text-xs text-muted-foreground">requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts?.filter(a => a.severity === 'critical' && a.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">critical alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts?.filter(a => a.severity === 'high' && a.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">high priority alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const acknowledgedAlerts = alerts?.filter(a => a.acknowledged_at) || [];
                const totalResponseTime = acknowledgedAlerts.reduce((sum, a) => {
                  const triggered = new Date(a.triggered_at).getTime();
                  const acknowledged = new Date(a.acknowledged_at!).getTime();
                  return sum + (acknowledged - triggered);
                }, 0);
                
                return acknowledgedAlerts.length > 0
                  ? Math.round(totalResponseTime / (acknowledgedAlerts.length * 1000 * 60))
                  : 0;
              })()} min
            </div>
            <p className="text-xs text-muted-foreground">average response</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AlertStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as SeverityLevel | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AlertType | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="threshold_breach">Threshold Breach</SelectItem>
              <SelectItem value="anomaly_detection">Anomaly Detection</SelectItem>
              <SelectItem value="trend_alert">Trend Alert</SelectItem>
              <SelectItem value="sla_violation">SLA Violation</SelectItem>
              <SelectItem value="bottleneck_detected">Bottleneck Detected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedAlerts.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedAlerts.length} selected
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction('acknowledged')}
            >
              Acknowledge
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction('resolved')}
            >
              Resolve
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedAlerts([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Alert List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="analytics">Alert Analytics</TabsTrigger>
        </TabsList>

        {/* Alert List Tab */}
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Alerts</CardTitle>
                  <CardDescription>Current system alerts and notifications</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === (filteredAlerts?.length || 0) && (filteredAlerts?.length || 0) > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading alerts...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts?.map((alert) => (
                    <Card key={alert.id} className={cn(
                      "border transition-colors",
                      alert.severity === 'critical' ? 'border-red-200 bg-red-50/50' :
                      alert.severity === 'high' ? 'border-orange-200 bg-orange-50/50' :
                      alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50/50' : '',
                      selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-200' : ''
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedAlerts.includes(alert.id)}
                            onChange={() => toggleAlertSelection(alert.id)}
                            className="mt-1 rounded"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getSeverityIcon(alert.severity)}
                                <div>
                                  <h3 className="font-medium">{alert.alert_name}</h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant={getSeverityColor(alert.severity) as any}>
                                      {alert.severity}
                                    </Badge>
                                    <Badge variant={getStatusColor(alert.status) as any}>
                                      {alert.status}
                                    </Badge>
                                    <Badge variant="outline" className="capitalize">
                                      {alert.alert_type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgo(alert.triggered_at)}
                                </span>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="mr-2 h-3 w-3" />
                                      Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px]">
                                    <AlertDetails 
                                      alert={alert} 
                                      onAction={handleAlertAction}
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                            
                            {alert.threshold_value && alert.actual_value && (
                              <div className="text-xs text-muted-foreground mb-2">
                                Threshold: {alert.threshold_value} | Actual: {alert.actual_value}
                                {alert.variance_percentage && (
                                  <span className="ml-2">
                                    ({alert.variance_percentage > 0 ? '+' : ''}{alert.variance_percentage.toFixed(1)}%)
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                              <div className="text-xs">
                                <span className="font-medium">Recommended actions:</span>
                                <span className="ml-1">{alert.recommended_actions[0]}</span>
                                {alert.recommended_actions.length > 1 && (
                                  <span className="text-muted-foreground"> +{alert.recommended_actions.length - 1} more</span>
                                )}
                              </div>
                            )}
                            
                            {alert.status === 'active' && (
                              <div className="flex items-center space-x-2 mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAlertAction(alert.id, 'acknowledged')}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Acknowledge
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleAlertAction(alert.id, 'investigating')}
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  Investigate
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAlertAction(alert.id, 'suppressed')}
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  Suppress
                                </Button>
                              </div>
                            )}
                            
                            {alert.status === 'investigating' && (
                              <div className="flex items-center space-x-2 mt-3">
                                <Button 
                                  size="sm"
                                  onClick={() => handleAlertAction(alert.id, 'resolved')}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Mark Resolved
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!filteredAlerts || filteredAlerts.length === 0) && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || selectedStatus !== 'active' || selectedSeverity !== 'all' || selectedType !== 'all'
                          ? 'No alerts match your filters'
                          : 'No active alerts'
                        }
                      </p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your search terms or filters
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Timeline</CardTitle>
              <CardDescription>Chronological view of alert events and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts?.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{alert.alert_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.triggered_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                          {alert.severity}
                        </Badge>
                        <Badge variant={getStatusColor(alert.status) as any} className="text-xs">
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Analytics</CardTitle>
              <CardDescription>Alert trends and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Alert analytics charts would be implemented here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyzing {alerts?.length || 0} total alerts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Alert Details Component
function AlertDetails({ 
  alert, 
  onAction 
}: { 
  alert: any; 
  onAction: (id: string, status: AlertStatus, notes?: string) => void;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <span>{alert.alert_name}</span>
          <Badge variant={getSeverityColor(alert.severity) as any}>
            {alert.severity}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Detailed information about this performance alert
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Alert Type:</span>
            <p className="font-medium capitalize">{alert.alert_type.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <p className="font-medium capitalize">{alert.status}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Triggered:</span>
            <p className="font-medium">{new Date(alert.triggered_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Source:</span>
            <p className="font-medium">{alert.metric_source}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Alert Message</h4>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
        </div>

        {alert.detailed_description && (
          <div>
            <h4 className="font-medium mb-2">Details</h4>
            <p className="text-sm text-muted-foreground">{alert.detailed_description}</p>
          </div>
        )}

        {alert.recommended_actions && alert.recommended_actions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recommended Actions</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {alert.recommended_actions.map((action: string, index: number) => (
                <li key={index}>• {action}</li>
              ))}
            </ul>
          </div>
        )}

        {alert.status !== 'resolved' && (
          <div>
            <label className="text-sm font-medium">Resolution Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add resolution notes..."
              rows={3}
            />
          </div>
        )}
      </div>

      <DialogFooter className="space-x-2">
        {alert.status === 'active' && (
          <>
            <Button 
              variant="outline" 
              onClick={() => onAction(alert.id, 'acknowledged', notes)}
            >
              Acknowledge
            </Button>
            <Button 
              onClick={() => onAction(alert.id, 'investigating', notes)}
            >
              Start Investigation
            </Button>
          </>
        )}
        {alert.status === 'investigating' && (
          <Button 
            onClick={() => onAction(alert.id, 'resolved', notes)}
          >
            Mark as Resolved
          </Button>
        )}
        {alert.status === 'acknowledged' && (
          <Button 
            onClick={() => onAction(alert.id, 'investigating', notes)}
          >
            Start Investigation
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}