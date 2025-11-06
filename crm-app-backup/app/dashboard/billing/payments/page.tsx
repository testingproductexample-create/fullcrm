'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, Filter, Download, CreditCard, DollarSign, 
  CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar
} from 'lucide-react';
import { Payment, Invoice, Customer } from '@/types/database';
import { exportToCSV, exportToExcel, formatCurrency } from '@/lib/exportUtils';

interface PaymentWithRelations extends Payment {
  invoice?: Invoice & { customer?: Customer };
}

export default function PaymentsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Summary stats
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    averagePayment: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [payments]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch payments with invoice and customer data
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            *,
            customer:customers(*)
          )
        `)
        .eq('organization_id', userData.user.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(paymentsData as PaymentWithRelations[] || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalAmount = payments.reduce((sum, p) => sum + p.amount_aed, 0);
    const completedAmount = payments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + p.amount_aed, 0);
    const pendingAmount = payments
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + p.amount_aed, 0);

    setStats({
      totalPayments: payments.length,
      totalAmount,
      completedAmount,
      pendingAmount,
      averagePayment: payments.length > 0 ? totalAmount / payments.length : 0
    });
  };

  const getFilteredPayments = () => {
    return payments.filter(payment => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        payment.invoice?.invoice_number?.toLowerCase().includes(searchLower) ||
        payment.invoice?.customer?.full_name?.toLowerCase().includes(searchLower) ||
        payment.transaction_reference?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;

      // Method filter
      const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;

      // Date filter
      const matchesDate = dateFilter === 'all' || (() => {
        const paymentDate = new Date(payment.payment_date);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today': return daysDiff === 0;
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          case 'quarter': return daysDiff <= 90;
          default: return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      failed: 'bg-red-500/20 text-red-300',
      refunded: 'bg-purple-500/20 text-purple-300',
      cancelled: 'bg-gray-500/20 text-gray-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, React.JSX.Element> = {
      cash: <DollarSign className="w-4 h-4" />,
      card: <CreditCard className="w-4 h-4" />,
      bank_transfer: <TrendingUp className="w-4 h-4" />,
      check: <Calendar className="w-4 h-4" />,
      online: <CreditCard className="w-4 h-4" />
    };
    return icons[method] || <DollarSign className="w-4 h-4" />;
  };

  const exportPayments = (format: 'csv' | 'excel') => {
    const filteredPayments = getFilteredPayments();
    const data = filteredPayments.map(p => ({
      'Payment Date': new Date(p.payment_date).toLocaleDateString(),
      'Invoice Number': p.invoice?.invoice_number || '-',
      'Customer': p.invoice?.customer?.full_name || '-',
      'Amount (AED)': p.amount_aed.toFixed(2),
      'Payment Method': p.payment_method.replace('_', ' ').toUpperCase(),
      'Status': p.payment_status.toUpperCase(),
      'Reference': p.transaction_reference || '-',
      'Notes': p.notes || '-'
    }));

    if (format === 'csv') {
      exportToCSV(data, `payments_${new Date().toISOString().split('T')[0]}`);
    } else {
      exportToExcel(data, `payments_${new Date().toISOString().split('T')[0]}`);
    }
  };

  const filteredPayments = getFilteredPayments();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Tracking</h1>
            <p className="text-purple-200">Monitor all payment transactions and status</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportPayments('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => exportPayments('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-300" />
              </div>
              <span className="text-purple-200 text-sm">Total Payments</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalPayments}</div>
            <div className="text-sm text-purple-300 mt-1">All transactions</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-300" />
              </div>
              <span className="text-purple-200 text-sm">Total Amount</span>
            </div>
            <div className="text-2xl font-bold text-white">AED {stats.totalAmount.toFixed(2)}</div>
            <div className="text-sm text-purple-300 mt-1">Across all payments</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-300" />
              </div>
              <span className="text-purple-200 text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-white">AED {stats.completedAmount.toFixed(2)}</div>
            <div className="text-sm text-green-300 mt-1">
              {stats.totalAmount > 0 ? ((stats.completedAmount / stats.totalAmount) * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-300" />
              </div>
              <span className="text-purple-200 text-sm">Pending</span>
            </div>
            <div className="text-2xl font-bold text-white">AED {stats.pendingAmount.toFixed(2)}</div>
            <div className="text-sm text-yellow-300 mt-1">Awaiting confirmation</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-gray-900">All Status</option>
              <option value="completed" className="bg-gray-900">Completed</option>
              <option value="pending" className="bg-gray-900">Pending</option>
              <option value="failed" className="bg-gray-900">Failed</option>
              <option value="refunded" className="bg-gray-900">Refunded</option>
              <option value="cancelled" className="bg-gray-900">Cancelled</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-gray-900">All Methods</option>
              <option value="cash" className="bg-gray-900">Cash</option>
              <option value="card" className="bg-gray-900">Card</option>
              <option value="bank_transfer" className="bg-gray-900">Bank Transfer</option>
              <option value="check" className="bg-gray-900">Check</option>
              <option value="online" className="bg-gray-900">Online</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-gray-900">All Time</option>
              <option value="today" className="bg-gray-900">Today</option>
              <option value="week" className="bg-gray-900">This Week</option>
              <option value="month" className="bg-gray-900">This Month</option>
              <option value="quarter" className="bg-gray-900">This Quarter</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-purple-200 font-medium px-6 py-4 text-sm">Date</th>
                  <th className="text-left text-purple-200 font-medium px-6 py-4 text-sm">Invoice</th>
                  <th className="text-left text-purple-200 font-medium px-6 py-4 text-sm">Customer</th>
                  <th className="text-left text-purple-200 font-medium px-6 py-4 text-sm">Method</th>
                  <th className="text-right text-purple-200 font-medium px-6 py-4 text-sm">Amount</th>
                  <th className="text-center text-purple-200 font-medium px-6 py-4 text-sm">Status</th>
                  <th className="text-left text-purple-200 font-medium px-6 py-4 text-sm">Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                      <p className="text-purple-200">No payments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr 
                      key={payment.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/billing/${payment.invoice_id}`)}
                    >
                      <td className="px-6 py-4 text-white">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-purple-300 font-medium">
                          {payment.invoice?.invoice_number || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {payment.invoice?.customer?.full_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-purple-200 capitalize">
                          {getMethodIcon(payment.payment_method)}
                          {payment.payment_method.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">
                          AED {payment.amount_aed.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.payment_status)}`}>
                            {payment.payment_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-purple-200 text-sm">
                        {payment.transaction_reference || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination placeholder */}
          {filteredPayments.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-purple-200 text-sm">
                Showing {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
