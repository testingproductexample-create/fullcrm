'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
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
  Invoice,
  InvoiceAnalytics,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  getInvoiceStatusColor,
} from '@/types/financial';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('30');

  // Fetch invoices with customer data
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', searchQuery, statusFilter, dateFilter],
    queryFn: async (): Promise<Invoice[]> => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers!inner (
            full_name,
            customer_code,
            email,
            phone
          ),
          orders (
            order_number,
            status
          )
        `);

      // Apply filters
      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%,customers.full_name.ilike.%${searchQuery}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter && dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('issue_date', startDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('issue_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Get invoice analytics
  const { data: analytics } = useQuery({
    queryKey: ['invoice-analytics', dateFilter],
    queryFn: async (): Promise<InvoiceAnalytics> => {
      let query = supabase.from('invoices').select('*');

      if (dateFilter && dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('issue_date', startDate.toISOString().split('T')[0]);
      }

      const { data } = await query;

      if (!data) {
        return {
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          invoiceCount: 0,
          paidInvoiceCount: 0,
          overdueInvoiceCount: 0,
          averageInvoiceValue: 0,
          averagePaymentDays: 0,
          collectionRate: 0,
          monthlyInvoiceVolume: [],
          topCustomersByRevenue: [],
        };
      }

      const totalInvoiced = data.reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0);
      const totalPaid = data.reduce((sum, inv) => sum + (inv.paid_amount_aed || 0), 0);
      const totalOutstanding = data.reduce((sum, inv) => sum + (inv.balance_due_aed || 0), 0);
      const paidInvoiceCount = data.filter(inv => inv.status === 'paid').length;
      const overdueInvoiceCount = data.filter(inv => 
        inv.status !== 'paid' && new Date(inv.due_date) < new Date()
      ).length;

      return {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        invoiceCount: data.length,
        paidInvoiceCount,
        overdueInvoiceCount,
        averageInvoiceValue: data.length > 0 ? totalInvoiced / data.length : 0,
        averagePaymentDays: 0, // Would need payment dates to calculate
        collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        monthlyInvoiceVolume: [], // Would need to group by month
        topCustomersByRevenue: [], // Would need to group by customer
      };
    },
    refetchInterval: 60000,
  });

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
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading invoices</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was a problem loading the invoice data.
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
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600">Create, manage, and track all customer invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export
          </Button>
          <Link href="/invoices/new">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics?.totalInvoiced || 0)}
              </div>
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics?.invoiceCount || 0} invoices
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics?.totalPaid || 0)}
              </div>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics?.collectionRate.toFixed(1)}% collection rate
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(analytics?.totalOutstanding || 0)}
              </div>
              <ClockIcon className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Pending collection
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">
                {analytics?.overdueInvoiceCount || 0}
              </div>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Require attention
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
                placeholder="Search invoices by number or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
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

      {/* Invoices List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            Invoices
            {analytics && (
              <Badge variant="secondary" className="text-xs">
                {analytics.invoiceCount} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date();
                
                return (
                  <div key={invoice.id} className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center gap-3">
                          <Link href={`/invoices/${invoice.id}`} className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                            {invoice.invoice_number}
                          </Link>
                          <Badge className={getInvoiceStatusColor(invoice.status)}>
                            {INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS] || invoice.status}
                          </Badge>
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              OVERDUE
                            </Badge>
                          )}
                        </div>

                        {/* Customer and Invoice Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Customer</span>
                            <span>{invoice.customers?.full_name}</span>
                            <span className="text-xs text-gray-500">{invoice.customers?.customer_code}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Issue Date</span>
                            <span>{formatDate(invoice.issue_date)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Due Date</span>
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {formatDate(invoice.due_date)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Payment Terms</span>
                            <span>{invoice.payment_terms || 'Net 30'}</span>
                          </div>
                        </div>

                        {/* Order Reference */}
                        {invoice.orders && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Order:</span> {invoice.orders.order_number}
                          </div>
                        )}

                        {/* Notes */}
                        {invoice.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {invoice.notes}
                          </div>
                        )}
                      </div>

                      {/* Amount and Actions Section */}
                      <div className="ml-6 space-y-4">
                        {/* Amount Details */}
                        <div className="text-right space-y-1">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(invoice.total_amount_aed)}
                          </div>
                          {invoice.paid_amount_aed && invoice.paid_amount_aed > 0 && (
                            <div className="text-sm text-green-600">
                              Paid: {formatCurrency(invoice.paid_amount_aed)}
                            </div>
                          )}
                          {invoice.balance_due_aed > 0 && (
                            <div className="text-sm text-red-600">
                              Due: {formatCurrency(invoice.balance_due_aed)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            VAT: {formatCurrency(invoice.vat_amount_aed)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="w-full">
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first invoice.
              </p>
              <div className="mt-6">
                <Link href="/invoices/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}