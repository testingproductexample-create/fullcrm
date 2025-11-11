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
import { 
  Lightbulb, TrendingUp, DollarSign, Target, Clock, CheckCircle, AlertTriangle, 
  Filter, Search, Plus, Eye, ThumbsUp, ThumbsDown, Calendar, BarChart3, 
  Zap, Wrench, Users, Building2, RefreshCw
} from 'lucide-react';
import { 
  useOptimizationRecommendations, 
  useOptimizationImpact, 
  useUpdateRecommendationStatus,
  useCreateOptimizationRecommendation
} from '@/hooks/useEfficiency';
import { cn } from '@/lib/utils';
import type { 
  OptimizationCategory, 
  PriorityLevel, 
  RecommendationStatus, 
  CreateOptimizationRecommendationData,
  ImplementationComplexity,
  RiskLevel
} from '@/types/efficiency';

export default function OptimizationCenterPage() {
  const [selectedStatus, setSelectedStatus] = useState<RecommendationStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<OptimizationCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("recommendations");

  const { data: recommendations, isLoading: recommendationsLoading } = useOptimizationRecommendations();
  const { data: impactSummary, isLoading: impactLoading } = useOptimizationImpact();
  
  const updateStatusMutation = useUpdateRecommendationStatus();
  const createMutation = useCreateOptimizationRecommendation();

  const getCategoryIcon = (category: OptimizationCategory) => {
    switch (category) {
      case 'process':
        return <Target className="h-4 w-4" />;
      case 'resource':
        return <Users className="h-4 w-4" />;
      case 'technology':
        return <Zap className="h-4 w-4" />;
      case 'workflow':
        return <TrendingUp className="h-4 w-4" />;
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      case 'efficiency':
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
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

  const getStatusColor = (status: RecommendationStatus) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'implementing':
        return 'default';
      case 'completed':
        return 'outline';
      case 'rejected':
        return 'destructive';
      case 'deferred':
        return 'secondary';
    }
  };

  const getComplexityColor = (complexity?: ImplementationComplexity) => {
    switch (complexity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'very_high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredRecommendations = recommendations?.filter(rec => {
    const matchesSearch = searchTerm === '' || 
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || rec.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || rec.priority_level === selectedPriority;
    const matchesCategory = selectedCategory === 'all' || rec.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleStatusUpdate = (id: string, newStatus: RecommendationStatus, approvedBy?: string, assignedTo?: string) => {
    updateStatusMutation.mutate({
      id,
      status: newStatus,
      approved_by: approvedBy,
      assigned_to: assignedTo
    });
  };

  const handleCreateRecommendation = (data: CreateOptimizationRecommendationData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Optimization Center</h2>
          <p className="text-muted-foreground">
            AI-powered optimization recommendations and improvement initiatives
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Recommendation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Recommendation</DialogTitle>
                <DialogDescription>
                  Add a new optimization recommendation for review and implementation.
                </DialogDescription>
              </DialogHeader>
              <RecommendationForm onSubmit={handleCreateRecommendation} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Impact Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">optimization opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {recommendations?.filter(r => r.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              AED {recommendations
                ?.filter(r => r.status === 'pending')
                ?.reduce((sum, r) => sum + (r.estimated_cost_savings || 0), 0)
                ?.toLocaleString() || '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">from pending recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {recommendations?.filter(r => r.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">successfully implemented</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recommendations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as RecommendationStatus | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="implementing">Implementing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as PriorityLevel | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as OptimizationCategory | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="process">Process</SelectItem>
            <SelectItem value="resource">Resource</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="efficiency">Efficiency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
          <TabsTrigger value="trends">Implementation Trends</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {recommendationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading recommendations...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations?.map((rec) => (
                <Card key={rec.id} className="border border-muted hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{rec.title}</h3>
                            <Badge variant={getPriorityColor(rec.priority_level) as any}>
                              {rec.priority_level}
                            </Badge>
                            <Badge variant={getStatusColor(rec.status) as any}>
                              {rec.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {rec.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {rec.description}
                          </p>
                          
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Expected Improvement</span>
                              <p className="font-medium text-green-600">
                                +{rec.expected_improvement_percentage}%
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost Savings</span>
                              <p className="font-medium text-green-600">
                                AED {rec.estimated_cost_savings?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">ROI</span>
                              <p className="font-medium text-blue-600">
                                {rec.roi_percentage}%
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Payback Period</span>
                              <p className="font-medium">
                                {rec.payback_period_months} months
                              </p>
                            </div>
                          </div>

                          {/* Implementation Details */}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Wrench className="h-3 w-3" />
                              <span className={cn("capitalize", getComplexityColor(rec.implementation_complexity))}>
                                {rec.implementation_complexity || 'N/A'} complexity
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{rec.estimated_implementation_days} days</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="capitalize">{rec.risk_level || 'low'} risk</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-3 w-3" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <RecommendationDetails 
                              recommendation={rec} 
                              onStatusUpdate={handleStatusUpdate}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        {rec.status === 'pending' && (
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleStatusUpdate(rec.id, 'approved')}
                            >
                              <ThumbsUp className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleStatusUpdate(rec.id, 'rejected')}
                            >
                              <ThumbsDown className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {rec.status === 'approved' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(rec.id, 'implementing')}
                          >
                            Start Implementation
                          </Button>
                        )}
                        
                        {rec.status === 'implementing' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(rec.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Affected Areas */}
                    {rec.affected_areas && rec.affected_areas.length > 0 && (
                      <div className="pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          Affected areas: {rec.affected_areas.slice(0, 3).join(', ')}
                          {rec.affected_areas.length > 3 && ` +${rec.affected_areas.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {(!filteredRecommendations || filteredRecommendations.length === 0) && (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all'
                      ? 'No recommendations match your filters'
                      : 'No optimization recommendations available'
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
        </TabsContent>

        {/* Impact Analysis Tab */}
        <TabsContent value="impact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Impact Analysis</CardTitle>
              <CardDescription>Impact analysis by category and implementation status</CardDescription>
            </CardHeader>
            <CardContent>
              {impactLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading impact data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {impactSummary?.map((impact) => (
                    <Card key={impact.category} className="border border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(impact.category)}
                            <h3 className="font-medium capitalize">{impact.category}</h3>
                          </div>
                          <Badge variant="outline">
                            {impact.totalRecommendations} recommendations
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Implemented</span>
                            <p className="font-medium text-green-600">{impact.implemented}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estimated Savings</span>
                            <p className="font-medium">AED {impact.estimatedSavings.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actual Savings</span>
                            <p className="font-medium text-green-600">AED {impact.actualSavings.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ROI</span>
                            <p className="font-medium text-blue-600">{impact.roi.toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!impactSummary || impactSummary.length === 0) && (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No impact data available</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Trends</CardTitle>
              <CardDescription>Optimization implementation progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Implementation trend charts would be implemented here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracking {recommendations?.length || 0} total recommendations
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

// Recommendation Form Component
function RecommendationForm({ onSubmit }: { onSubmit: (data: CreateOptimizationRecommendationData) => void }) {
  const [formData, setFormData] = useState<CreateOptimizationRecommendationData>({
    organization_id: '',
    title: '',
    description: '',
    category: 'process',
    priority_level: 'medium',
    expected_improvement_percentage: 0,
    estimated_cost_savings: 0,
    roi_percentage: 0,
    payback_period_months: 12,
    implementation_complexity: 'medium',
    estimated_implementation_days: 30,
    risk_level: 'low'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Brief title for the recommendation"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the optimization recommendation"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as OptimizationCategory }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="process">Process</SelectItem>
              <SelectItem value="resource">Resource</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select 
            value={formData.priority_level} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority_level: value as PriorityLevel }))}
          >
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Expected Improvement (%)</label>
          <Input
            type="number"
            value={formData.expected_improvement_percentage}
            onChange={(e) => setFormData(prev => ({ ...prev, expected_improvement_percentage: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Estimated Savings (AED)</label>
          <Input
            type="number"
            value={formData.estimated_cost_savings}
            onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost_savings: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">Create Recommendation</Button>
      </DialogFooter>
    </form>
  );
}

// Recommendation Details Component
function RecommendationDetails({ 
  recommendation, 
  onStatusUpdate 
}: { 
  recommendation: any; 
  onStatusUpdate: (id: string, status: RecommendationStatus) => void;
}) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{recommendation.title}</DialogTitle>
        <DialogDescription>
          Detailed information about this optimization recommendation
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <p className="text-sm">{recommendation.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Category:</span>
            <p className="font-medium capitalize">{recommendation.category}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Priority:</span>
            <p className="font-medium capitalize">{recommendation.priority_level}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expected Improvement:</span>
            <p className="font-medium text-green-600">+{recommendation.expected_improvement_percentage}%</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cost Savings:</span>
            <p className="font-medium">AED {recommendation.estimated_cost_savings?.toLocaleString()}</p>
          </div>
        </div>

        {recommendation.implementation_risks && (
          <div>
            <h4 className="font-medium mb-2">Implementation Risks</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {recommendation.implementation_risks.map((risk: string, index: number) => (
                <li key={index}>• {risk}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DialogFooter className="space-x-2">
        {recommendation.status === 'pending' && (
          <>
            <Button 
              variant="outline" 
              onClick={() => onStatusUpdate(recommendation.id, 'approved')}
            >
              Approve
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onStatusUpdate(recommendation.id, 'rejected')}
            >
              Reject
            </Button>
          </>
        )}
        {recommendation.status === 'approved' && (
          <Button onClick={() => onStatusUpdate(recommendation.id, 'implementing')}>
            Start Implementation
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}