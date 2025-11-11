'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  Order,
  OrderItem,
  OrderStatusHistory,
  OrderApproval,
  Customer,
  CustomerCommunication,
  OrderWorkflowStatus,
  WorkflowMilestone
} from '@/types/database';
import { 
  ArrowLeft,
  Edit,
  Send,
  Printer,
  Package,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  Ruler,
  CheckSquare,
  GitBranch
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [approvals, setApprovals] = useState<OrderApproval[]>([]);
  const [communications, setCommunications] = useState<CustomerCommunication[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<OrderWorkflowStatus | null>(null);
  const [milestones, setMilestones] = useState<WorkflowMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'history' | 'approvals' | 'communications' | 'workflow'>('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrderData();
    
    // Set up real-time subscription for order changes
    if (orderId && profile?.organization_id) {
      const subscription = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            console.log('Order change detected:', payload);
            toast.info('Order updated');
            fetchOrderData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_workflow_statuses',
            filter: `order_id=eq.${orderId}`
          },
          (payload) => {
            console.log('Workflow status change detected:', payload);
            toast.info('Workflow status updated');
            fetchOrderData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [orderId, profile]);

  async function fetchOrderData() {
    if (!profile?.organization_id) return;

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        router.push('/dashboard/orders/list' as any);
        return;
      }
      setOrder(orderData);

      // Fetch customer
      if (orderData.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', orderData.customer_id)
          .eq('organization_id', profile.organization_id)
          .maybeSingle();
        setCustomer(customerData);
      }

      // Fetch order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      setOrderItems(itemsData || []);

      // Fetch status history
      const { data: historyData } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });
      setStatusHistory(historyData || []);

      // Fetch approvals
      const { data: approvalsData } = await supabase
        .from('order_approvals')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      setApprovals(approvalsData || []);

      // Fetch related communications
      if (orderData.customer_id) {
        const { data: commsData } = await supabase
          .from('customer_communications')
          .select('*')
          .eq('customer_id', orderData.customer_id)
          .eq('related_order_id', orderId)
          .order('created_at', { ascending: false });
        setCommunications(commsData || []);
      }

      // Fetch workflow status
      const { data: workflowStatusData } = await supabase
        .from('order_workflow_statuses')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      setWorkflowStatus(workflowStatusData);

      // Fetch workflow milestones
      const { data: milestonesData } = await supabase
        .from('workflow_milestones')
        .select('*')
        .eq('order_id', orderId)
        .order('order_index', { ascending: true });
      setMilestones(milestonesData || []);

    } catch (error) {
      console.error('Error fetching order data:', error);
      toast.error('Failed to load order data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!profile?.organization_id || !order) return;

    setUpdatingStatus(true);
    try {
      const progressMap: Record<string, number> = {
        'new': 0,
        'confirmed': 20,
        'in_progress': 50,
        'quality_check': 80,
        'ready': 95,
        'delivered': 100,
        'cancelled': 0
      };

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: status,
          progress_percentage: progressMap[status] || order.progress_percentage,
          updated_at: new Date().toISOString(),
          ...(status === 'delivered' && { completed_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add status history
      await supabase
        .from('order_status_history')
        .insert({
          organization_id: profile.organization_id,
          order_id: orderId,
          status: status,
          previous_status: order.status,
          changed_by: profile.full_name || 'System',
          changed_at: new Date().toISOString(),
          notes: statusNotes || `Status changed to ${status}`,
          percentage_completion: progressMap[status] || order.progress_percentage
        });

      setShowStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
      fetchOrderData();
      toast.success(`Order status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSendUpdate() {
    if (!customer || !order) return;

    const message = `Order Update: ${order.order_number}\nStatus: ${order.status.replace('_', ' ').toUpperCase()}\nProgress: ${order.progress_percentage}%\n${order.delivery_date ? `Delivery Date: ${format(new Date(order.delivery_date), 'MMM dd, yyyy')}` : ''}`;

    try {
      await supabase
        .from('customer_communications')
        .insert({
          organization_id: profile?.organization_id,
          customer_id: customer.id,
          communication_type: 'SMS',
          direction: 'Outbound',
          subject: `Order ${order.order_number} Update`,
          message: message,
          status: 'Sent',
          sent_by: profile?.full_name || 'System',
          related_order_id: orderId,
          metadata: {}
        });

      toast.success('Update sent successfully to customer');
      fetchOrderData();
    } catch (error) {
      console.error('Error sending update:', error);
      toast.error('Failed to send update. Please try again.');
    }
  }

  function handlePrint() {
    toast.info('Print functionality will open print dialog');
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="h-96 bg-glass-light rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-900';
      case 'confirmed':
        return 'bg-green-100 text-green-900';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-900';
      case 'quality_check':
        return 'bg-orange-100 text-orange-900';
      case 'ready':
        return 'bg-purple-100 text-purple-900';
      case 'delivered':
        return 'bg-gray-200 text-gray-900';
      case 'cancelled':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rush':
        return 'bg-red-100 text-red-900';
      case 'normal':
        return 'bg-blue-100 text-blue-900';
      case 'low':
        return 'bg-gray-200 text-gray-900';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getOrderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'bespoke': 'Bespoke Suit',
      'casual': 'Casual Wear',
      'alteration': 'Alteration',
      'repair': 'Repair',
      'special_occasion': 'Special Occasion'
    };
    return labels[type] || type;
  };

  // Status timeline configuration
  const statusSteps = [
    { key: 'new', label: 'New', icon: FileText },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'in_progress', label: 'In Progress', icon: Clock },
    { key: 'quality_check', label: 'Quality Check', icon: AlertCircle },
    { key: 'ready', label: 'Ready', icon: Package },
    { key: 'delivered', label: 'Delivered', icon: CheckSquare }
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/orders/list"
          className="p-2 hover:bg-glass-light rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-h2 font-bold text-neutral-900">Order {order.order_number}</h1>
          <p className="text-body text-neutral-700">
            {customer?.full_name || 'Unknown Customer'} • {getOrderTypeLabel(order.order_type)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button onClick={handleSendUpdate} className="btn-secondary flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Update
          </button>
          <button 
            onClick={() => setShowStatusModal(true)} 
            className="btn-secondary flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Change Status
          </button>
          <Link 
            href={`/dashboard/orders/${orderId}/edit`}
            className="btn-primary flex items-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Edit Order
          </Link>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Change Order Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select status...</option>
                  <option value="new">New</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="ready">Ready for Pickup/Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Add notes about this status change..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="btn-secondary flex-1"
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  onClick={() => newStatus && handleStatusChange(newStatus)}
                  className="btn-primary flex-1"
                  disabled={!newStatus || updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Card */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-small text-neutral-700 mb-1">Status</p>
            <span className={`px-3 py-1 rounded-full text-tiny font-medium inline-block ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-tiny font-medium inline-block ml-2 ${getPriorityColor(order.priority_level)}`}>
              {order.priority_level.toUpperCase()}
            </span>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Total Amount</p>
            <p className="text-large font-bold text-primary-600">
              AED {parseFloat(order.final_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-tiny text-neutral-700">
              Advance: AED {parseFloat(order.advance_payment.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Delivery Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-700" />
              <span className="text-body">
                {order.delivery_date ? format(new Date(order.delivery_date), 'MMM dd, yyyy') : 'Not set'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${order.progress_percentage}%` }}
                />
              </div>
              <span className="text-tiny font-medium">{order.progress_percentage}%</span>
            </div>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Created</p>
            <span className="text-body">
              {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="glass-card p-6">
        <h3 className="text-h3 font-semibold text-neutral-900 mb-6">Order Progress</h3>
        <div className="relative">
          <div className="flex justify-between items-center">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isCancelled = order.status === 'cancelled';

              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCancelled ? 'bg-red-100 border-2 border-red-400' :
                      isCurrent ? 'bg-primary-600 border-4 border-primary-200 shadow-lg' :
                      isActive ? 'bg-green-600 border-2 border-green-200' :
                      'bg-neutral-200 border-2 border-neutral-300'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isCancelled ? 'text-red-900' :
                        isCurrent || isActive ? 'text-white' :
                        'text-neutral-600'
                      }`} />
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute top-6 left-12 h-0.5 transition-all ${
                        isCancelled ? 'bg-red-300 w-full' :
                        isActive && index < currentStatusIndex ? 'bg-green-600' : 'bg-neutral-300'
                      }`} style={{ width: 'calc(100% + 2rem)' }} />
                    )}
                  </div>
                  <p className={`text-tiny mt-2 text-center ${
                    isCurrent ? 'font-semibold text-primary-600' :
                    isActive ? 'text-neutral-900' :
                    'text-neutral-600'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-glass-border">
          <div className="flex overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: FileText },
              { key: 'items', label: 'Order Items', icon: Package },
              { key: 'workflow', label: 'Workflow', icon: GitBranch },
              { key: 'history', label: 'Status History', icon: Clock },
              { key: 'approvals', label: 'Approvals', icon: CheckSquare },
              { key: 'communications', label: 'Communications', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary-600" />
                    <h4 className="font-semibold text-neutral-900">Customer Information</h4>
                  </div>
                  {customer ? (
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-small text-neutral-700">Name</dt>
                        <dd className="text-body font-medium">
                          <Link href={`/dashboard/customers/${customer.id}`} className="text-primary-600 hover:underline">
                            {customer.full_name}
                          </Link>
                        </dd>
                      </div>
                      {customer.email && (
                        <div>
                          <dt className="text-small text-neutral-700">Email</dt>
                          <dd className="text-body">{customer.email}</dd>
                        </div>
                      )}
                      {customer.phone && (
                        <div>
                          <dt className="text-small text-neutral-700">Phone</dt>
                          <dd className="text-body">{customer.phone}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-small text-neutral-700">Classification</dt>
                        <dd className="text-body">
                          <span className={`px-2 py-1 rounded text-tiny font-medium ${
                            customer.classification === 'VIP' ? 'bg-purple-100 text-purple-900' :
                            customer.classification === 'Regular' ? 'bg-blue-100 text-blue-900' :
                            'bg-green-100 text-green-900'
                          }`}>
                            {customer.classification}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-small text-neutral-700">Customer information not available</p>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <h4 className="font-semibold text-neutral-900">Payment Summary</h4>
                  </div>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-small text-neutral-700">Subtotal</dt>
                      <dd className="text-body font-medium">
                        AED {parseFloat(order.total_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-small text-neutral-700">VAT (5%)</dt>
                      <dd className="text-body font-medium">
                        AED {parseFloat(order.vat_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-neutral-200 pt-2">
                      <dt className="text-body font-semibold text-neutral-900">Total Amount</dt>
                      <dd className="text-body font-bold text-primary-600">
                        AED {parseFloat(order.final_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-neutral-200 pt-2">
                      <dt className="text-small text-neutral-700">Advance Payment</dt>
                      <dd className="text-body font-medium text-green-700">
                        AED {parseFloat(order.advance_payment.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-body font-semibold text-neutral-900">Balance Due</dt>
                      <dd className="text-body font-bold text-red-600">
                        AED {(parseFloat(order.final_amount.toString()) - parseFloat(order.advance_payment.toString())).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Order Details */}
              <div className="glass-card p-4">
                <h4 className="font-semibold text-neutral-900 mb-4">Order Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-small text-neutral-700">Order Type</dt>
                    <dd className="text-body font-medium">{getOrderTypeLabel(order.order_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-small text-neutral-700">Priority</dt>
                    <dd className="text-body">
                      <span className={`px-2 py-1 rounded text-tiny font-medium ${getPriorityColor(order.priority_level)}`}>
                        {order.priority_level.toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  {order.estimated_completion && (
                    <div>
                      <dt className="text-small text-neutral-700">Estimated Completion</dt>
                      <dd className="text-body">{format(new Date(order.estimated_completion), 'MMM dd, yyyy')}</dd>
                    </div>
                  )}
                  {order.assigned_to && (
                    <div>
                      <dt className="text-small text-neutral-700">Assigned To</dt>
                      <dd className="text-body">{order.assigned_to}</dd>
                    </div>
                  )}
                </div>
                {order.design_notes && (
                  <div className="mt-4">
                    <dt className="text-small text-neutral-700 mb-1">Design Notes</dt>
                    <dd className="text-body bg-neutral-50 p-3 rounded">{order.design_notes}</dd>
                  </div>
                )}
                {order.special_instructions && (
                  <div className="mt-4">
                    <dt className="text-small text-neutral-700 mb-1">Special Instructions</dt>
                    <dd className="text-body bg-yellow-50 p-3 rounded border border-yellow-200">{order.special_instructions}</dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Order Items</h3>
              {orderItems.length === 0 ? (
                <p className="text-body text-neutral-700">No items in this order.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left text-small font-semibold text-neutral-900 pb-3 pr-4">Item</th>
                        <th className="text-left text-small font-semibold text-neutral-900 pb-3 pr-4">Specifications</th>
                        <th className="text-left text-small font-semibold text-neutral-900 pb-3 pr-4">Fabric & Color</th>
                        <th className="text-center text-small font-semibold text-neutral-900 pb-3 pr-4">Qty</th>
                        <th className="text-right text-small font-semibold text-neutral-900 pb-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-b border-neutral-100">
                          <td className="py-4 pr-4">
                            <p className="font-medium text-neutral-900">{item.item_type}</p>
                            {item.item_name && (
                              <p className="text-small text-neutral-700">{item.item_name}</p>
                            )}
                          </td>
                          <td className="py-4 pr-4">
                            <div className="text-small text-neutral-700 space-y-1">
                              {Object.entries(item.specifications || {}).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="text-small">
                              {item.fabric_details && <p className="text-neutral-900">{item.fabric_details}</p>}
                              {item.color && <p className="text-neutral-700">Color: {item.color}</p>}
                            </div>
                          </td>
                          <td className="py-4 text-center pr-4">
                            <span className="text-body font-medium">{item.quantity}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-body font-semibold text-neutral-900">
                              AED {parseFloat(item.item_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Status History</h3>
              {statusHistory.length === 0 ? (
                <p className="text-body text-neutral-700">No status changes recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="glass-card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-tiny font-medium ${getStatusColor(history.status)}`}>
                              {history.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {history.previous_status && (
                              <>
                                <span className="text-neutral-500">from</span>
                                <span className={`px-3 py-1 rounded-full text-tiny font-medium ${getStatusColor(history.previous_status)}`}>
                                  {history.previous_status.replace('_', ' ').toUpperCase()}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-small text-neutral-700 mt-2">
                            {format(new Date(history.changed_at), 'MMM dd, yyyy HH:mm')}
                            {history.changed_by && ` • Changed by ${history.changed_by}`}
                          </p>
                        </div>
                        {history.percentage_completion !== null && history.percentage_completion !== undefined && (
                          <div className="text-right">
                            <p className="text-large font-bold text-primary-600">{history.percentage_completion}%</p>
                            <p className="text-tiny text-neutral-700">Progress</p>
                          </div>
                        )}
                      </div>
                      {history.notes && (
                        <p className="text-small text-neutral-700 mt-2 bg-neutral-50 p-2 rounded">{history.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Customer Approvals</h3>
              {approvals.length === 0 ? (
                <p className="text-body text-neutral-700">No approvals requested yet.</p>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="glass-card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-neutral-900 capitalize">
                            {approval.approval_type.replace('_', ' ')} Approval
                          </p>
                          <p className="text-small text-neutral-700">
                            Requested: {format(new Date(approval.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                          approval.status === 'approved' ? 'bg-green-100 text-green-900' :
                          approval.status === 'rejected' ? 'bg-red-100 text-red-900' :
                          approval.status === 'revision_requested' ? 'bg-yellow-100 text-yellow-900' :
                          'bg-blue-100 text-blue-900'
                        }`}>
                          {approval.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {approval.approved_by && approval.approval_date && (
                        <p className="text-small text-neutral-700 mt-2">
                          {approval.status === 'approved' ? 'Approved' : 'Actioned'} by {approval.approved_by} on {format(new Date(approval.approval_date), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                      {approval.feedback && (
                        <div className="mt-3">
                          <p className="text-small font-medium text-neutral-900 mb-1">Feedback:</p>
                          <p className="text-small text-neutral-700 bg-blue-50 p-2 rounded">{approval.feedback}</p>
                        </div>
                      )}
                      {approval.revision_requests && (
                        <div className="mt-3">
                          <p className="text-small font-medium text-neutral-900 mb-1">Revision Requests:</p>
                          <p className="text-small text-neutral-700 bg-yellow-50 p-2 rounded border border-yellow-200">{approval.revision_requests}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Workflow Progress</h3>
              
              {workflowStatus ? (
                <div className="space-y-6">
                  {/* Current Workflow Status */}
                  <div className="glass-card p-4 bg-primary-50 border border-primary-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-small text-neutral-700 mb-1">Current Stage</p>
                        <p className="text-large font-bold text-neutral-900 capitalize">
                          {workflowStatus.current_status.replace('_', ' ')}
                        </p>
                        {workflowStatus.sub_status && (
                          <p className="text-body text-neutral-700 mt-1 capitalize">
                            Sub-status: {workflowStatus.sub_status.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-small text-neutral-700 mb-1">Progress</p>
                        <p className="text-h3 font-bold text-primary-600">
                          {workflowStatus.progress_percentage}%
                        </p>
                      </div>
                    </div>
                    {workflowStatus.status_notes && (
                      <div className="mt-4 p-3 bg-white rounded border border-primary-200">
                        <p className="text-small font-medium text-neutral-900 mb-1">Notes:</p>
                        <p className="text-small text-neutral-700">{workflowStatus.status_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Workflow Milestones */}
                  {milestones.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-4">Milestones</h4>
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => {
                          const isCompleted = milestone.status === 'completed';
                          const isInProgress = milestone.status === 'in_progress';
                          const isPending = milestone.status === 'pending';

                          return (
                            <div key={milestone.id} className="flex items-start gap-4">
                              {/* Timeline Connector */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-green-600' :
                                  isInProgress ? 'bg-yellow-600' :
                                  'bg-neutral-300'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  ) : isInProgress ? (
                                    <Clock className="w-5 h-5 text-white" />
                                  ) : (
                                    <span className="text-white text-tiny font-bold">{index + 1}</span>
                                  )}
                                </div>
                                {index < milestones.length - 1 && (
                                  <div className={`w-0.5 h-16 ${
                                    isCompleted ? 'bg-green-600' : 'bg-neutral-300'
                                  }`} />
                                )}
                              </div>

                              {/* Milestone Content */}
                              <div className="flex-1 pb-4">
                                <div className="glass-card p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium text-neutral-900">{milestone.milestone_name}</p>
                                      {milestone.milestone_type && (
                                        <p className="text-tiny text-neutral-600 capitalize">
                                          {milestone.milestone_type.replace('_', ' ')}
                                        </p>
                                      )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                                      isCompleted ? 'bg-green-100 text-green-900' :
                                      isInProgress ? 'bg-yellow-100 text-yellow-900' :
                                      'bg-neutral-100 text-neutral-700'
                                    }`}>
                                      {milestone.status}
                                    </span>
                                  </div>

                                  {milestone.completed_at && (
                                    <p className="text-small text-neutral-700 mt-2">
                                      Completed: {format(new Date(milestone.completed_at), 'MMM dd, yyyy HH:mm')}
                                      {milestone.completed_by && ` by ${milestone.completed_by}`}
                                    </p>
                                  )}

                                  {milestone.due_date && !milestone.completed_at && (
                                    <p className="text-small text-neutral-700 mt-2">
                                      Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                                    </p>
                                  )}

                                  {milestone.notes && (
                                    <p className="text-small text-neutral-700 mt-2 bg-neutral-50 p-2 rounded">
                                      {milestone.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Workflow Info */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-small font-medium text-neutral-900 mb-1">Workflow System</p>
                        <p className="text-small text-neutral-700">
                          This order is being tracked through our automated workflow system. 
                          Milestones are automatically updated as the order progresses through each stage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <GitBranch className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-body text-neutral-700 mb-2">No workflow data available</p>
                  <p className="text-small text-neutral-600">
                    This order hasn't been assigned to a workflow yet
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Order Communications</h3>
              {communications.length === 0 ? (
                <p className="text-body text-neutral-700">No communications related to this order.</p>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="glass-card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{comm.subject || comm.communication_type}</p>
                          <p className="text-small text-neutral-700">
                            {format(new Date(comm.created_at), 'MMM dd, yyyy HH:mm')} • {comm.direction}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                            comm.communication_type === 'SMS' ? 'bg-blue-100 text-blue-900' :
                            comm.communication_type === 'Email' ? 'bg-purple-100 text-purple-900' :
                            comm.communication_type === 'WhatsApp' ? 'bg-green-100 text-green-900' :
                            comm.communication_type === 'Phone' ? 'bg-yellow-100 text-yellow-900' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {comm.communication_type}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                            comm.status === 'Sent' ? 'bg-blue-50 text-blue-900' :
                            comm.status === 'Delivered' ? 'bg-green-50 text-green-900' :
                            comm.status === 'Failed' ? 'bg-red-50 text-red-900' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {comm.status}
                          </span>
                        </div>
                      </div>
                      {comm.message && (
                        <p className="text-small text-neutral-700 mt-2 bg-neutral-50 p-3 rounded">{comm.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
