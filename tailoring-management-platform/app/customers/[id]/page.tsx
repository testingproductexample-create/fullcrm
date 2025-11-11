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
  MapPinIcon,
  CalendarIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  StarIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Customer, Order, CustomerNote, CustomerMeasurement, CustomerCommunication } from '@/types/customer';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch customer data
  const { data: customer, isLoading: customerLoading, error: customerError } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async (): Promise<Customer> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch customer orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch customer notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: async (): Promise<CustomerNote[]> => {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch customer measurements
  const { data: measurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ['customer-measurements', customerId],
    queryFn: async (): Promise<CustomerMeasurement[]> => {
      const { data, error } = await supabase
        .from('customer_measurements')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch customer communications
  const { data: communications, isLoading: communicationsLoading } = useQuery({
    queryKey: ['customer-communications', customerId],
    queryFn: async (): Promise<CustomerCommunication[]> => {
      const { data, error } = await supabase
        .from('customer_communications')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      router.push("/customers" as any as any);
    },
    onError: () => {
      toast.error('Failed to delete customer');
    },
  });

  if (customerLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading customer</p>
        <Button variant="outline" onClick={() => router.back() as any}>
          Go Back
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blacklisted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDeleteCustomer = () => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
            <p className="text-gray-600">Customer #{customer.customer_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${`/customers/${customerId}/edit`}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={handleDeleteCustomer}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{customer.total_orders || 0}</p>
              </div>
              <ShoppingBagIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.total_spent || 0)}</p>
              </div>
              <StarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
                <p className="text-2xl font-bold text-purple-600">{customer.loyalty_points || 0}</p>
              </div>
              <StarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {customer.customer_since ? formatDate(customer.customer_since) : 'N/A'}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders?.length || 0})</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes?.length || 0})</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(customer.status || 'active')}>
                        {customer.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Classification</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.classification || 'Regular'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nationality</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.nationality || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {customer.date_of_birth ? formatDate(customer.date_of_birth) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Emirates ID</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.emirates_id || 'N/A'}</p>
                  </div>
                </div>
                
                {customer.loyalty_tier && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Loyalty Tier</label>
                    <div className="mt-1">
                      <Badge className={getLoyaltyTierColor(customer.loyalty_tier)}>
                        {customer.loyalty_tier}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {customer.phone_secondary && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${customer.phone_secondary}`} className="text-blue-600 hover:underline">
                      {customer.phone_secondary} (Secondary)
                    </a>
                  </div>
                )}
                {(customer.address_line1 || customer.city) && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-900">
                      {customer.address_line1 && <div>{customer.address_line1}</div>}
                      {customer.address_line2 && <div>{customer.address_line2}</div>}
                      <div>
                        {[customer.city, customer.emirate, customer.postal_code].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href={`/orders/new?customer=${customerId}`}>
                <Button size="sm" className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  New Order
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{order.order_number}</p>
                            <p className="text-sm text-gray-600">{order.order_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.total_amount || 0)}
                            </p>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {orders.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => setActiveTab('orders')}>
                        View All Orders ({orders.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating their first order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Orders</CardTitle>
              <Link href={`/orders/new?customer=${customerId}`}>
                <Button className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  New Order
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                            <p className="text-sm text-gray-600">{order.order_type}</p>
                            <p className="text-xs text-gray-500">
                              Created {formatDate(order.created_at || '')}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(order.total_amount || 0)}
                            </p>
                            <Badge variant="outline">{order.status}</Badge>
                            {order.progress_percentage && (
                              <p className="text-xs text-gray-500">
                                {order.progress_percentage}% complete
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">This customer hasn't placed any orders yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Measurements</CardTitle>
              <Link href={`/customers/${customerId}/measurements/new`}>
                <Button className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Measurement
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {measurementsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : measurements && measurements.length > 0 ? (
                <div className="space-y-4">
                  {measurements.map((measurement) => (
                    <div key={measurement.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{measurement.garment_type}</h3>
                          <p className="text-sm text-gray-600">
                            Measured {formatDate(measurement.measurement_date || measurement.created_at || '')}
                          </p>
                        </div>
                        {measurement.is_latest && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Latest</Badge>
                        )}
                      </div>
                      {measurement.fitting_notes && (
                        <p className="text-sm text-gray-600 mb-2">{measurement.fitting_notes}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {Object.entries(measurement.measurements as Record<string, any> || {}).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-2 rounded">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No measurements found</h3>
                  <p className="mt-1 text-sm text-gray-500">Add customer measurements to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Notes</CardTitle>
              <Link href={`/customers/${customerId}/notes/new`}>
                <Button className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Note
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {notesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{note.note}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(note.created_at || '')}
                            {note.note_type && ` • ${note.note_type}`}
                          </p>
                        </div>
                        {note.is_pinned && (
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
                  <p className="mt-1 text-sm text-gray-500">Add notes to keep track of important information.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Communications History</CardTitle>
              <Link href={`/customers/${customerId}/communications/new}`}>
                <Button className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Log Communication
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {communicationsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : communications && communications.length > 0 ? (
                <div className="space-y-4">
                  {communications.map((communication) => (
                    <div key={communication.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{communication.channel_type}</Badge>
                          <Badge variant="secondary">{communication.message_type}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(communication.created_at || '')}
                        </p>
                      </div>
                      {communication.subject && (
                        <h4 className="font-medium text-gray-900 mb-2">{communication.subject}</h4>
                      )}
                      <p className="text-sm text-gray-600">{communication.content}</p>
                      {communication.status && (
                        <div className="mt-2">
                          <Badge variant="outline">{communication.status}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleBottomCenterTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No communications found</h3>
                  <p className="mt-1 text-sm text-gray-500">Communication history will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}