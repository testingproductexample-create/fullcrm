'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserIcon,
  PrinterIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  Order, 
  OrderItem,
  OrderStatusHistory,
  WorkflowMilestone,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PRIORITY_LEVEL_LABELS,
  WORKFLOW_STAGE_LABELS,
  getOrderStatusColor,
  getPriorityColor,
  getMilestoneStatusColor
} from '@/types/order';
import { Customer } from '@/types/customer';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface OrderWithDetails extends Order {
  customers?: Customer;
  order_items?: OrderItem[];
  order_status_history?: OrderStatusHistory[];
  workflow_milestones?: WorkflowMilestone[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch order data with all related information
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async (): Promise<OrderWithDetails> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (*),
          order_items (*),
          order_status_history (*),
          workflow_milestones (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order deleted successfully');
      router.push("/orders" as any as any);
    },
    onError: () => {
      toast.error('Failed to delete order');
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // Add status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: newStatus,
          previous_status: order?.status,
          changed_at: new Date().toISOString(),
          notes: `Status updated to ${newStatus}`,
        });
    },
    onSuccess: () => {
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading order</p>
        <Button variant="outline" onClick={() => router.back() as any}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleDeleteOrder = () => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const calculateTotals = () => {
    const subtotal = order.order_items?.reduce((sum, item) => 
      sum + ((item.item_amount || 0) * (item.quantity || 1)), 0) || 0;
    
    return {
      subtotal,
      vat: order.vat_amount || 0,
      total: order.final_amount || order.total_amount || 0,
      advance: order.advance_payment || 0,
      balance: (order.final_amount || order.total_amount || 0) - (order.advance_payment || 0),
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back() as any}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-gray-600">Order details and workflow tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <Link href={`/orders/${orderId/edit}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={handleDeleteOrder}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Order Status and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Order Status</p>
                <Badge className={getOrderStatusColor(order.status || '')}>
                  {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                </Badge>
              </div>
              <ShoppingBagIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Order Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {ORDER_TYPE_LABELS[order.order_type as keyof typeof ORDER_TYPE_LABELS] || order.order_type}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-purple-600">{order.progress_percentage || 0}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.total)}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {order.progress_percentage !== null && order.progress_percentage !== undefined && (
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Order Progress</span>
              <span>{order.progress_percentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${order.progress_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({order.order_items?.length || 0})</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.customers && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer</label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-semibold text-gray-900">{order.customers.full_name}</p>
                        <Badge variant="outline">{order.customers.customer_code}</Badge>
                      </div>
                    </div>
                    
                    {order.customers.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4" />
                        <a href={`mailto:${order.customers.email}`} className="text-blue-600 hover:underline">
                          {order.customers.email}
                        </a>
                      </div>
                    )}
                    
                    {order.customers.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4" />
                        <a href={`tel:${order.customers.phone}`} className="text-blue-600 hover:underline">
                          {order.customers.phone}
                        </a>
                      </div>
                    )}

                    <Link href={`/customers/${order.customers.id}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Customer Profile
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority Level</label>
                    {order.priority_level && (
                      <div className="mt-1">
                        <Badge className={getPriorityColor(order.priority_level)}>
                          {PRIORITY_LEVEL_LABELS[order.priority_level as keyof typeof PRIORITY_LEVEL_LABELS]}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(order.created_at || '')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estimated Completion</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.estimated_completion ? formatDate(order.estimated_completion) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Delivery Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}
                    </p>
                  </div>
                </div>

                {order.design_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Design Notes</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {order.design_notes}
                    </p>
                  </div>
                )}

                {order.special_instructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {order.special_instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.order_items && order.order_items.length > 0 ? (
                <div className="space-y-4">
                  {order.order_items.map((item, index) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-gray-900">{item.item_name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Type:</span>
                              <span className="ml-1">{item.item_type}</span>
                            </div>
                            <div>
                              <span className="font-medium">Fabric:</span>
                              <span className="ml-1">{item.fabric_details || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium">Color:</span>
                              <span className="ml-1">{item.color || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span>
                              <span className="ml-1">{item.quantity}</span>
                            </div>
                          </div>
                          {item.special_requirements && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Special Requirements:</span>
                              <p className="mt-1 bg-gray-50 p-2 rounded">{item.special_requirements}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency((item.item_amount || 0) * (item.quantity || 1))}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.item_amount || 0)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Workflow Progress</CardTitle>
              <Link href={`/workflow?order=${orderId}`}>
                <Button variant="outline" size="sm">
                  View in Workflow Board
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {order.workflow_milestones && order.workflow_milestones.length > 0 ? (
                <div className="space-y-3">
                  {order.workflow_milestones
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        milestone.status === 'completed' 
                          ? 'bg-green-500' 
                          : milestone.status === 'in_progress'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{milestone.milestone_name}</h4>
                          <Badge className={getMilestoneStatusColor(milestone.status || 'pending')}>
                            {milestone.status}
                          </Badge>
                        </div>
                        {milestone.notes && (
                          <p className="text-sm text-gray-600 mt-1">{milestone.notes}</p>
                        )}
                        {milestone.completed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {formatDate(milestone.completed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No workflow milestones found</p>
                  <p className="text-sm">Workflow will be created when order is confirmed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {order.order_status_history && order.order_status_history.length > 0 ? (
                <div className="space-y-4">
                  {order.order_status_history
                    .sort((a, b) => new Date(b.changed_at || '').getTime() - new Date(a.changed_at || '').getTime())
                    .map((history) => (
                    <div key={history.id} className="flex items-start gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getOrderStatusColor(history.status)}>
                            {ORDER_STATUS_LABELS[history.status as keyof typeof ORDER_STATUS_LABELS] || history.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(history.changed_at || '')}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No status history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">VAT (5%):</span>
                  <span className="font-medium">{formatCurrency(totals.vat)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(totals.total)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Advance Payment:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(totals.advance)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-semibold">Remaining Balance:</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(totals.balance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Payment Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Record Payment</Button>
                <Button variant="outline">Generate Invoice</Button>
                <Button variant="outline">Send Receipt</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}