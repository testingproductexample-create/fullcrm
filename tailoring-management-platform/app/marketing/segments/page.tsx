'use client';

/**
 * Customer Segmentation Management
 * Create and manage customer segments for targeted marketing
 */

import { useState } from 'react';
import { 
  useCustomerSegments, 
  useCreateCustomerSegment, 
  useUpdateCustomerSegment,
  useDeleteCustomerSegment,
  useCalculateSegment,
  useCustomerSegmentWithAnalytics 
} from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Users, Target, Filter, TrendingUp, BarChart3, 
  Edit, Trash2, Play, Refresh, Search, Settings
} from 'lucide-react';
import { SegmentCriteriaType } from '@/types/marketing';

export default function CustomerSegmentsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [criteriaTypeFilter, setCriteriaTypeFilter] = useState<SegmentCriteriaType | ''>('');

  const { data: segments, isLoading, refetch } = useCustomerSegments({
    criteria_type: criteriaTypeFilter ? [criteriaTypeFilter] : undefined,
    search_query: searchQuery || undefined
  });
  const createMutation = useCreateCustomerSegment();
  const calculateMutation = useCalculateSegment();
  const deleteMutation = useDeleteCustomerSegment();

  const [newSegment, setNewSegment] = useState({
    segment_name: '',
    segment_code: '',
    segment_description: '',
    criteria_type: 'demographic' as SegmentCriteriaType,
    criteria_rules: {
      demographic: {
        age_min: 18,
        age_max: 65,
        location_countries: ['AE'],
      }
    },
    is_dynamic: true,
  });

  // Criteria type badge
  const CriteriaBadge = ({ type }: { type: SegmentCriteriaType }) => {
    const typeConfig = {
      demographic: { label: 'Demographic', className: 'bg-blue-100 text-blue-800' },
      behavioral: { label: 'Behavioral', className: 'bg-green-100 text-green-800' },
      transactional: { label: 'Transactional', className: 'bg-purple-100 text-purple-800' },
      engagement: { label: 'Engagement', className: 'bg-orange-100 text-orange-800' },
      custom: { label: 'Custom', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = typeConfig[type];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleCreateSegment = async () => {
    try {
      await createMutation.mutateAsync(newSegment);
      setIsCreateModalOpen(false);
      setNewSegment({
        segment_name: '',
        segment_code: '',
        segment_description: '',
        criteria_type: 'demographic',
        criteria_rules: {
          demographic: {
            age_min: 18,
            age_max: 65,
            location_countries: ['AE'],
          }
        },
        is_dynamic: true,
      });
      refetch();
    } catch (error) {
      console.error('Failed to create segment:', error);
    }
  };

  const handleCalculateSegment = async (segmentId: string) => {
    try {
      await calculateMutation.mutateAsync(segmentId);
      refetch();
    } catch (error) {
      console.error('Failed to calculate segment:', error);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (confirm('Are you sure you want to delete this segment?')) {
      try {
        await deleteMutation.mutateAsync(segmentId);
        refetch();
      } catch (error) {
        console.error('Failed to delete segment:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customer Segmentation</h1>
          <p className="text-slate-600 mt-1">Create targeted customer segments for marketing campaigns</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Segment
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Segments</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Search by name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="criteria_type">Criteria Type</Label>
            <Select 
              value={criteriaTypeFilter} 
              onValueChange={(value) => setCriteriaTypeFilter(value as SegmentCriteriaType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="demographic">Demographic</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Segments List */}
      <div className="grid gap-6">
        {segments?.map((segment) => (
          <Card key={segment.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">{segment.segment_name}</h3>
                </div>
                <CriteriaBadge type={segment.criteria_type} />
                {segment.is_dynamic && (
                  <Badge className="bg-emerald-100 text-emerald-800">Dynamic</Badge>
                )}
                {segment.is_active && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCalculateSegment(segment.id)}
                  disabled={calculateMutation.isPending}
                >
                  <Refresh className="h-4 w-4 mr-1" />
                  Recalculate
                </Button>
                
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeleteSegment(segment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Description</p>
                <p className="font-medium text-slate-900 line-clamp-2">
                  {segment.segment_description || 'No description'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">Customer Count</p>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <p className="font-medium text-slate-900">
                    {segment.customer_count?.toLocaleString() || 0} customers
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">Last Updated</p>
                <p className="font-medium text-slate-900">
                  {segment.last_calculated_at 
                    ? new Date(segment.last_calculated_at).toLocaleDateString()
                    : 'Not calculated'
                  }
                </p>
              </div>
            </div>

            {/* Segment Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-slate-600">Engagement Rate</p>
                  <p className="font-semibold">{(segment.engagement_rate || 0).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-slate-600">Conversion Rate</p>
                  <p className="font-semibold">{(segment.conversion_rate || 0).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-xs text-slate-600">Avg. Order Value</p>
                  <p className="font-semibold">{(segment.average_order_value || 0).toFixed(0)} AED</p>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {(!segments || segments.length === 0) && (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No segments found</h3>
            <p className="text-slate-600 mb-6">Create your first customer segment to get started.</p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </Card>
        )}
      </div>

      {/* Create Segment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Create New Segment</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="segment_name">Segment Name</Label>
                    <Input
                      id="segment_name"
                      value={newSegment.segment_name}
                      onChange={(e) => setNewSegment({ ...newSegment, segment_name: e.target.value })}
                      placeholder="VIP Customers"
                    />
                  </div>

                  <div>
                    <Label htmlFor="segment_code">Segment Code</Label>
                    <Input
                      id="segment_code"
                      value={newSegment.segment_code}
                      onChange={(e) => setNewSegment({ ...newSegment, segment_code: e.target.value })}
                      placeholder="VIP_001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="criteria_type">Criteria Type</Label>
                  <Select 
                    value={newSegment.criteria_type} 
                    onValueChange={(value) => setNewSegment({ ...newSegment, criteria_type: value as SegmentCriteriaType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demographic">Demographic</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="segment_description">Description</Label>
                  <Textarea
                    id="segment_description"
                    value={newSegment.segment_description}
                    onChange={(e) => setNewSegment({ ...newSegment, segment_description: e.target.value })}
                    placeholder="Describe this segment..."
                    rows={3}
                  />
                </div>

                {/* Criteria Configuration */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-slate-900 mb-3">Segment Criteria</h3>
                  
                  {newSegment.criteria_type === 'demographic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Age Range</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Min age"
                            defaultValue="18"
                          />
                          <span>to</span>
                          <Input
                            type="number"
                            placeholder="Max age"
                            defaultValue="65"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Location</Label>
                        <Select defaultValue="AE">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AE">United Arab Emirates</SelectItem>
                            <SelectItem value="SA">Saudi Arabia</SelectItem>
                            <SelectItem value="QA">Qatar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {newSegment.criteria_type === 'behavioral' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Minimum Orders</Label>
                        <Input
                          type="number"
                          placeholder="5"
                          defaultValue="5"
                        />
                      </div>
                      
                      <div>
                        <Label>Average Order Value (AED)</Label>
                        <Input
                          type="number"
                          placeholder="500"
                          defaultValue="500"
                        />
                      </div>
                    </div>
                  )}

                  {newSegment.criteria_type === 'transactional' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Total Spent (AED)</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          defaultValue="1000"
                        />
                      </div>
                      
                      <div>
                        <Label>Purchase Frequency</Label>
                        <Select defaultValue="high">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High (>5 orders/month)</SelectItem>
                            <SelectItem value="medium">Medium (2-5 orders/month)</SelectItem>
                            <SelectItem value="low">Low (<2 orders/month)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {newSegment.criteria_type === 'engagement' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email Open Rate (%)</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          defaultValue="50"
                        />
                      </div>
                      
                      <div>
                        <Label>Click Rate (%)</Label>
                        <Input
                          type="number"
                          placeholder="10"
                          defaultValue="10"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is_dynamic"
                    checked={newSegment.is_dynamic}
                    onChange={(e) => setNewSegment({ ...newSegment, is_dynamic: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_dynamic">Dynamic Segment (auto-update based on criteria)</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSegment}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Segment'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}