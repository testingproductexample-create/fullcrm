'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Calendar,
  CreditCard
} from 'lucide-react';

interface DashboardStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customers?: {
    full_name: string;
  };
  issue_date: string;
  due_date: string;
  total_amount_aed: number;
  balance_due_aed: number;
  status: string;
}

export default function BillingDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    invoiceCount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      loadDashboardData();
    }
  }, [profile?.organization_id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load invoices with customer data
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            full_name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount_aed), 0) || 0;
      const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.paid_amount_aed), 0) || 0;
      const totalOutstanding = invoices?.reduce((sum, inv) => sum + Number(inv.balance_due_aed), 0) || 0;
      
      const overdueInvoices = invoices?.filter(inv => 
        inv.status === 'overdue' || 
        (inv.status !== 'paid' && new Date(inv.due_date) < new Date())
      ) || [];
      
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance_due_aed), 0);

      setStats({
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        overdueAmount,
        invoiceCount: invoices?.length || 0,
        paidCount: invoices?.filter(inv => inv.status === 'paid').length || 0,
        pendingCount: invoices?.filter(inv => ['sent', 'viewed'].includes(inv.status)).length || 0,
        overdueCount: overdueInvoices.length
      });

      setRecentInvoices(invoices?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      partial: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      sent: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      viewed: { color: 'bg-purple-100 text-purple-800', icon: Eye },
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { color: 'bg-neutral-100 text-neutral-800', icon: AlertCircle }
    };
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-tiny font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Billing & Invoices</h1>
            <p className="text-body text-neutral-700">
              Manage invoices, track payments, and monitor billing activity
            </p>
          </div>
          <Link href="/dashboard/billing/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Invoiced</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(stats.totalInvoiced)}</p>
          <p className="text-tiny text-neutral-600">{stats.invoiceCount} invoices</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Collected</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-tiny text-neutral-600">{stats.paidCount} paid</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Outstanding</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-h3 font-bold text-yellow-600">{formatCurrency(stats.totalOutstanding)}</p>
          <p className="text-tiny text-neutral-600">{stats.pendingCount} pending</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Overdue</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-h3 font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</p>
          <p className="text-tiny text-neutral-600">{stats.overdueCount} overdue</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/billing/invoices" className="glass-card p-6 hover:bg-glass-light transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">All Invoices</p>
              <p className="text-small text-neutral-600">View and manage invoices</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/billing/payments" className="glass-card p-6 hover:bg-glass-light transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Payments</p>
              <p className="text-small text-neutral-600">Track payment history</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/billing/reports" className="glass-card p-6 hover:bg-glass-light transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Reports</p>
              <p className="text-small text-neutral-600">Billing analytics</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Invoices */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900">Recent Invoices</h2>
          <Link href="/dashboard/billing/invoices" className="text-primary-600 hover:text-primary-700 text-small font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-body">No invoices found</p>
              <Link href="/dashboard/billing/create" className="mt-4 text-primary-600 hover:text-primary-700 inline-block">
                Create your first invoice
              </Link>
            </div>
          ) : (
            recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/dashboard/billing/invoices/${invoice.id}`}
                className="flex items-center justify-between p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-neutral-900">{invoice.invoice_number}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center gap-4 text-tiny text-neutral-600">
                      <span>
                        Customer: {invoice.customers?.full_name || 'N/A'}
                      </span>
                      <span>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(invoice.issue_date)}
                      </span>
                      {invoice.status !== 'paid' && (
                        <span className={`font-medium ${
                          new Date(invoice.due_date) < new Date() ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          Due: {formatDate(invoice.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{formatCurrency(invoice.total_amount_aed)}</p>
                  {invoice.balance_due_aed > 0 && (
                    <p className="text-tiny text-yellow-600">
                      Due: {formatCurrency(invoice.balance_due_aed)}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Collection Rate */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Payment Collection Rate</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-small text-neutral-700">Collection Rate</span>
              <span className="text-small font-bold text-green-600">
                {stats.totalInvoiced > 0 ? ((stats.totalPaid / stats.totalInvoiced) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${stats.totalInvoiced > 0 ? (stats.totalPaid / stats.totalInvoiced) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-glass-border">
            <div>
              <p className="text-tiny text-neutral-600 mb-1">Paid</p>
              <p className="text-small font-semibold text-green-700">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div>
              <p className="text-tiny text-neutral-600 mb-1">Pending</p>
              <p className="text-small font-semibold text-yellow-700">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
            <div>
              <p className="text-tiny text-neutral-600 mb-1">Overdue</p>
              <p className="text-small font-semibold text-red-700">{formatCurrency(stats.overdueAmount)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
