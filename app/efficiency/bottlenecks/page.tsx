'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, Clock, DollarSign, TrendingDown, Users, Wrench, AlertCircle, 
  Filter, Search, Plus, Edit, CheckCircle, X, Calendar, BarChart3 
} from 'lucide-react';
import { 
  useBottleneckAnalytics, 
  useBottleneckSummary, 
  useCreateBottleneckAnalytic, 
  useUpdateBottleneckStatus 
} from '@/hooks/useEfficiency';
import { cn } from '@/lib/utils';
import type { BottleneckType, SeverityLevel, BottleneckStatus, CreateBottleneckData } from '@/types/efficiency';

// Severity color helper function at module scope
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

export default function BottleneckManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<BottleneckStatus | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBottleneck, setSelectedBottleneck] = useState<any>(null);

  const { data: bottlenecks, isLoading: bottlenecksLoading } = useBottleneckAnalytics({
    severityLevels: selectedSeverity !== 'all' ? [selectedSeverity] : undefined
  });
  const { data: bottleneckSummary } = useBottleneckSummary();
  
  const createMutation = useCreateBottleneckAnalytic();
  const updateStatusMutation = useUpdateBottleneckStatus();

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: BottleneckType) => {
    switch (type) {
      case 'capacity':
        return <BarChart3 className="h-4 w-4" />;
      case 'resource':
        return <Users className="h-4 w-4" />;
      case 'skill':
        return <Users className="h-4 w-4" />;
      case 'system':
        return <Wrench className="h-4 w-4" />;
      case 'workflow':
        return <TrendingDown className="h-4 w-4" />;
      case 'dependency':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: BottleneckStatus) => {
    switch (status) {
      case 'identified':
        return 'destructive';
      case 'analyzing':
        return 'default';
      case 'resolving':
        return 'secondary';
      case 'resolved':
        return 'outline';
      case 'recurring':
        return 'destructive';
    }
  };

  const filteredBottlenecks = bottlenecks?.filter(bottleneck => {
    const matchesSearch = searchTerm === '' || 
      bottleneck.bottleneck_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bottleneck.process_area.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || bottleneck.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || bottleneck.severity_level === selectedSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleCreateBottleneck = (data: CreateBottleneckData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  const handleStatusUpdate = (id: string, newStatus: BottleneckStatus, notes?: string) => {
    updateStatusMutation.mutate({
      id,
      status: newStatus,
      resolution_notes: notes
    });
  };

  const formatDaysOpen = (detectedAt: string) => {
    const days = Math.floor((Date.now() - new Date(detectedAt).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bottleneck Management</h2>
          <p className="text-muted-foreground">
            Identify, analyze, and resolve operational bottlenecks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Report Bottleneck
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Report New Bottleneck</DialogTitle>
                <DialogDescription>
                  Report a new operational bottleneck for analysis and resolution.
                </DialogDescription>
              </DialogHeader>
              <BottleneckForm onSubmit={handleCreateBottleneck} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {bottleneckSummary && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {bottleneckSummary.filter(b => b.severity === 'critical').length}
                </div>
                <p className="text-xs text-muted-foreground">requiring immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {bottleneckSummary.filter(b => b.severity === 'high').length}
                </div>
                <p className="text-xs text-muted-foreground">high impact bottlenecks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Impact</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {bottleneckSummary.reduce((sum, b) => sum + (b.impact || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">estimated daily cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bottleneckSummary.length > 0 
                    ? Math.round(bottleneckSummary.reduce((sum, b) => sum + b.daysOpen, 0) / bottleneckSummary.length)
                    : 0
                  } days
                </div>
                <p className="text-xs text-muted-foreground">average time to resolve</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bottlenecks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as BottleneckStatus | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="identified">Identified</SelectItem>
            <SelectItem value="analyzing">Analyzing</SelectItem>
            <SelectItem value="resolving">Resolving</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
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
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Bottlenecks List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Bottlenecks</CardTitle>
          <CardDescription>
            Current operational bottlenecks and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bottlenecksLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                <span>Loading bottlenecks...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBottlenecks?.map((bottleneck) => (
                <Card key={bottleneck.id} className="border border-muted hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getSeverityIcon(bottleneck.severity_level)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{bottleneck.bottleneck_name}</h3>
                            <Badge variant={getSeverityColor(bottleneck.severity_level) as any}>
                              {bottleneck.severity_level}
                            </Badge>
                            <Badge variant={getStatusColor(bottleneck.status) as any}>
                              {bottleneck.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{bottleneck.process_area}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              {getTypeIcon(bottleneck.bottleneck_type)}
                              <span className="capitalize">{bottleneck.bottleneck_type}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>AED {bottleneck.cost_impact_daily.toLocaleString()}/day</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDaysOpen(bottleneck.first_detected_at)} open</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingDown className="h-3 w-3" />
                              <span>{bottleneck.productivity_loss_percentage}% productivity loss</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="mr-2 h-3 w-3" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <BottleneckDetails 
                              bottleneck={bottleneck} 
                              onStatusUpdate={handleStatusUpdate}
                            />
                          </DialogContent>
                        </Dialog>
                        {bottleneck.status !== 'resolved' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(bottleneck.id, 'resolved', 'Manually resolved')}
                          >
                            <CheckCircle className="mr-2 h-3 w-3" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>

                    {bottleneck.root_causes && bottleneck.root_causes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Root Causes</h4>
                        <div className="space-y-1">
                          {bottleneck.root_causes.slice(0, 2).map((cause, index) => (
                            <p key={index} className="text-xs text-muted-foreground">• {cause}</p>
                          ))}
                          {bottleneck.root_causes.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {bottleneck.root_causes.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {bottleneck.affected_processes && bottleneck.affected_processes.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          Affected processes: {bottleneck.affected_processes.slice(0, 3).join(', ')}
                          {bottleneck.affected_processes.length > 3 && ` +${bottleneck.affected_processes.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {(!filteredBottlenecks || filteredBottlenecks.length === 0) && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || selectedStatus !== 'all' || selectedSeverity !== 'all' 
                      ? 'No bottlenecks match your filters'
                      : 'No active bottlenecks detected'
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
    </div>
  );
}

// Bottleneck Form Component
function BottleneckForm({ onSubmit }: { onSubmit: (data: CreateBottleneckData) => void }) {
  const [formData, setFormData] = useState({
    bottleneck_name: '',
    process_area: '',
    bottleneck_type: 'capacity' as BottleneckType,
    severity_level: 'medium' as SeverityLevel,
    impact_scope: 'department' as any,
    delay_minutes: 0,
    cost_impact_daily: 0,
    productivity_loss_percentage: 0,
    root_causes: [] as string[],
    detection_method: 'manual' as any,
    resolution_priority: 3,
    first_detected_at: new Date().toISOString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      organization_id: '', // This would be filled by the hook
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Bottleneck Name</label>
        <Input
          value={formData.bottleneck_name}
          onChange={(e) => setFormData(prev => ({ ...prev, bottleneck_name: e.target.value }))}
          placeholder="Brief description of the bottleneck"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Process Area</label>
          <Input
            value={formData.process_area}
            onChange={(e) => setFormData(prev => ({ ...prev, process_area: e.target.value }))}
            placeholder="e.g., Manufacturing, Quality Control"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select value={formData.bottleneck_type} onValueChange={(value) => setFormData(prev => ({ ...prev, bottleneck_type: value as BottleneckType }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capacity">Capacity</SelectItem>
              <SelectItem value="resource">Resource</SelectItem>
              <SelectItem value="skill">Skill</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="dependency">Dependency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Severity Level</label>
          <Select value={formData.severity_level} onValueChange={(value) => setFormData(prev => ({ ...prev, severity_level: value as SeverityLevel }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Daily Cost Impact (AED)</label>
          <Input
            type="number"
            value={formData.cost_impact_daily}
            onChange={(e) => setFormData(prev => ({ ...prev, cost_impact_daily: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">Report Bottleneck</Button>
      </DialogFooter>
    </form>
  );
}

// Bottleneck Details Component
function BottleneckDetails({ 
  bottleneck, 
  onStatusUpdate 
}: { 
  bottleneck: any; 
  onStatusUpdate: (id: string, status: BottleneckStatus, notes?: string) => void;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <span>{bottleneck.bottleneck_name}</span>
          <Badge variant={getSeverityColor(bottleneck.severity_level) as any}>
            {bottleneck.severity_level}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Detailed information and resolution options for this bottleneck
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Process Area:</span>
          <p className="font-medium">{bottleneck.process_area}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Type:</span>
          <p className="font-medium capitalize">{bottleneck.bottleneck_type}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Daily Impact:</span>
          <p className="font-medium">AED {bottleneck.cost_impact_daily.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Productivity Loss:</span>
          <p className="font-medium">{bottleneck.productivity_loss_percentage}%</p>
        </div>
      </div>

      {bottleneck.root_causes && (
        <div>
          <h4 className="font-medium mb-2">Root Causes</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {bottleneck.root_causes.map((cause: string, index: number) => (
              <li key={index}>• {cause}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Resolution Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add resolution notes..."
          rows={3}
        />
      </div>

      <DialogFooter className="space-x-2">
        <Button 
          variant="outline" 
          onClick={() => onStatusUpdate(bottleneck.id, 'analyzing', notes)}
        >
          Mark as Analyzing
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onStatusUpdate(bottleneck.id, 'resolving', notes)}
        >
          Mark as Resolving
        </Button>
        <Button 
          onClick={() => onStatusUpdate(bottleneck.id, 'resolved', notes)}
        >
          Mark as Resolved
        </Button>
      </DialogFooter>
    </div>
  );
}