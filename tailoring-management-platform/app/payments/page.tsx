'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  Payment,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  getPaymentStatusColor,
} from '@/types/financial';
import toast from 'react-hot-toast';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface PaymentWithRelations extends Payment {
  invoices?: {
    invoice_number: string;
    total_amount_aed: number;
  };
  customers?: {
    full_name: string;
    customer_code: string;
  };
}

interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averagePaymentAmount: number;
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('30');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch payments with relations
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments', searchQuery, statusFilter, methodFilter, dateFilter],
    queryFn: async (): Promise<PaymentWithRelations[]> => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          invoices (
            invoice_number,
            total_amount_aed
          ),
          customers (
            full_name,
            customer_code
          )
        `);

      // Apply filters
      if (searchQuery) {
        query = query.or(`payment_reference.ilike.%${searchQuery}%,invoices.invoice_number.ilike.%${searchQuery}%,customers.full_name.ilike.%${searchQuery}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (methodFilter && methodFilter !== 'all') {
        query = query.eq('payment_method', methodFilter);
      }

      if (dateFilter && dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('payment_date', startDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Get payment analytics
  const { data: analytics } = useQuery({
    queryKey: ['payment-analytics', dateFilter],
    queryFn: async (): Promise<PaymentAnalytics> => {
      let query = supabase.from('payments').select('*');

      if (dateFilter && dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('payment_date', startDate.toISOString().split('T')[0]);
      }

      const { data } = await query;

      if (!data) {
        return {
          totalPayments: 0,
          totalAmount: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          averagePaymentAmount: 0,
        };
      }

      const totalAmount = data.reduce((sum, payment) => sum + (payment.amount_aed || 0), 0);
      const completedPayments = data.filter(p => p.status === 'completed').length;
      const pendingPayments = data.filter(p => p.status === 'pending').length;
      const failedPayments = data.filter(p => p.status === 'failed').length;

      return {
        totalPayments: data.length,
        totalAmount,
        completedPayments,
        pendingPayments,
        failedPayments,
        averagePaymentAmount: data.length > 0 ? totalAmount / data.length : 0,
      };
    },
    refetchInterval: 60000,
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="h-5 w-5" />;
      case 'card': return <CreditCardIcon className="h-5 w-5" />;
      case 'bank_transfer': return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'cheque': return <DocumentTextIcon className="h-5 w-5" />;
      default: return <CurrencyDollarIcon className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading payments</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was a problem loading the payment data.
        </p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Track and manage all customer payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics?.totalAmount || 0)}
              </div>
              <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics?.totalPayments || 0} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                {analytics?.completedPayments || 0}
              </div>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Successful payments
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics?.pendingPayments || 0}
              </div>
              <ClockIcon className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Processing
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">
                {analytics?.failedPayments || 0}
              </div>
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Failed transactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by payment reference, invoice, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5" />
            Payment History
            {analytics && (
              <Badge variant="secondary" className="text-xs">
                {analytics.totalPayments} payments
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getPaymentStatusColor(payment.status).includes('green') ? 'bg-green-100' : 
                        getPaymentStatusColor(payment.status).includes('yellow') ? 'bg-yellow-100' :
                        getPaymentStatusColor(payment.status).includes('red') ? 'bg-red-100' : 'bg-gray-100'}`}>
                        {getPaymentMethodIcon(payment.payment_method)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{payment.payment_reference}</h3>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS]}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(payment.payment_date)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Method:</span> {PAYMENT_METHOD_LABELS[payment.payment_method as keyof typeof PAYMENT_METHOD_LABELS]}
                          </div>
                          {payment.customers && (
                            <div>
                              <span className="font-medium">Customer:</span> {payment.customers.full_name}
                            </div>
                          )}
                          {payment.invoices && (
                            <div>
                              <span className="font-medium">Invoice:</span> {payment.invoices.invoice_number}
                            </div>
                          )}
                        </div>

                        {payment.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {payment.notes}
                          </div>
                        )}

                        {payment.bank_reference && (
                          <div className="mt-2 text-xs text-gray-500">
                            Bank Ref: {payment.bank_reference}
                          </div>
                        )}

                        {payment.cheque_number && (
                          <div className="mt-2 text-xs text-gray-500">
                            Cheque: {payment.cheque_number}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payment.amount_aed)}
                      </div>
                      {payment.currency && payment.currency !== 'AED' && (
                        <div className="text-sm text-gray-500">
                          {payment.currency}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by recording your first payment.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowAddForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Form Modal Placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Record New Payment</h2>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
            <div className="text-center py-8">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Payment Form</h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete payment recording form will be implemented here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}