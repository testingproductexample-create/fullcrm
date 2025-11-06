'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Download, FileText, TrendingUp, TrendingDown, 
  DollarSign, Calendar, PieChart, BarChart3
} from 'lucide-react';
import { exportToCSV, exportToExcel, formatCurrency } from '@/lib/exportUtils';

interface ReportData {
  invoices: any[];
  payments: any[];
  customers: any[];
}

export default function BillingReportsPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ReportData>({ invoices: [], payments: [], customers: [] });
  const [reportType, setReportType] = useState<string>('summary');
  const [periodFilter, setPeriodFilter] = useState<string>('month');

  useEffect(() => {
    fetchReportData();
  }, [periodFilter]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const startDate = getStartDate(periodFilter);
      const endDate = new Date().toISOString().split('T')[0];

      const [invoicesRes, paymentsRes, customersRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('organization_id', userData.user.id)
          .gte('issue_date', startDate)
          .lte('issue_date', endDate),
        supabase
          .from('payments')
          .select('*')
          .eq('organization_id', userData.user.id)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate),
        supabase
          .from('customers')
          .select('*')
          .eq('organization_id', userData.user.id)
      ]);

      setData({
        invoices: invoicesRes.data || [],
        payments: paymentsRes.data || [],
        customers: customersRes.data || []
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
  };

  const calculateSummaryMetrics = () => {
    const totalInvoiced = data.invoices.reduce((sum, inv) => sum + inv.total_amount_aed, 0);
    const totalPaid = data.invoices.reduce((sum, inv) => sum + inv.paid_amount_aed, 0);
    const totalOutstanding = data.invoices.reduce((sum, inv) => sum + inv.balance_due_aed, 0);
    const totalVAT = data.invoices.reduce((sum, inv) => sum + inv.vat_amount_aed, 0);

    const paidInvoices = data.invoices.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = data.invoices.filter(inv => inv.status === 'overdue').length;
    const avgInvoiceValue = data.invoices.length > 0 ? totalInvoiced / data.invoices.length : 0;
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalVAT,
      invoiceCount: data.invoices.length,
      paidInvoices,
      overdueInvoices,
      avgInvoiceValue,
      collectionRate
    };
  };

  const calculateVATReport = () => {
    const vatByRate = data.invoices.reduce((acc, inv) => {
      const rate = inv.vat_rate;
      if (!acc[rate]) {
        acc[rate] = { count: 0, subtotal: 0, vatAmount: 0 };
      }
      acc[rate].count += 1;
      acc[rate].subtotal += inv.subtotal_aed;
      acc[rate].vatAmount += inv.vat_amount_aed;
      return acc;
    }, {} as Record<number, { count: number; subtotal: number; vatAmount: number }>);

    return vatByRate;
  };

  const calculateOutstandingReport = () => {
    const outstanding = data.invoices.filter(inv => inv.balance_due_aed > 0);
    const byStatus = outstanding.reduce((acc, inv) => {
      if (!acc[inv.status]) {
        acc[inv.status] = { count: 0, amount: 0 };
      }
      acc[inv.status].count += 1;
      acc[inv.status].amount += inv.balance_due_aed;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return { outstanding, byStatus };
  };

  const calculatePaymentSummary = () => {
    const byMethod = data.payments.reduce((acc, pay) => {
      if (!acc[pay.payment_method]) {
        acc[pay.payment_method] = { count: 0, amount: 0 };
      }
      acc[pay.payment_method].count += 1;
      acc[pay.payment_method].amount += pay.amount_aed;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const totalPayments = data.payments.reduce((sum, pay) => sum + pay.amount_aed, 0);

    return { byMethod, totalPayments };
  };

  const exportReport = (type: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (type === 'summary') {
      const metrics = calculateSummaryMetrics();
      const data = [
        { Metric: 'Total Invoiced', Value: metrics.totalInvoiced.toFixed(2) },
        { Metric: 'Total Paid', Value: metrics.totalPaid.toFixed(2) },
        { Metric: 'Total Outstanding', Value: metrics.totalOutstanding.toFixed(2) },
        { Metric: 'Total VAT', Value: metrics.totalVAT.toFixed(2) },
        { Metric: 'Invoice Count', Value: metrics.invoiceCount.toString() },
        { Metric: 'Paid Invoices', Value: metrics.paidInvoices.toString() },
        { Metric: 'Overdue Invoices', Value: metrics.overdueInvoices.toString() },
        { Metric: 'Average Invoice Value', Value: metrics.avgInvoiceValue.toFixed(2) },
        { Metric: 'Collection Rate', Value: `${metrics.collectionRate.toFixed(2)}%` }
      ];
      exportToExcel(data, `billing_summary_${timestamp}`);
    } else if (type === 'vat') {
      const vatReport = calculateVATReport();
      const data = Object.entries(vatReport).map(([rate, details]) => ({
        'VAT Rate': `${rate}%`,
        'Invoice Count': (details as { count: number; subtotal: number; vatAmount: number }).count,
        'Subtotal (AED)': (details as { count: number; subtotal: number; vatAmount: number }).subtotal.toFixed(2),
        'VAT Amount (AED)': (details as { count: number; subtotal: number; vatAmount: number }).vatAmount.toFixed(2)
      }));
      exportToExcel(data, `vat_report_${timestamp}`);
    } else if (type === 'outstanding') {
      const { outstanding } = calculateOutstandingReport();
      const data = outstanding.map(inv => ({
        'Invoice Number': inv.invoice_number,
        'Issue Date': new Date(inv.issue_date).toLocaleDateString(),
        'Due Date': new Date(inv.due_date).toLocaleDateString(),
        'Status': inv.status.toUpperCase(),
        'Total Amount (AED)': inv.total_amount_aed.toFixed(2),
        'Paid Amount (AED)': inv.paid_amount_aed.toFixed(2),
        'Balance Due (AED)': inv.balance_due_aed.toFixed(2)
      }));
      exportToExcel(data, `outstanding_invoices_${timestamp}`);
    }
  };

  const metrics = calculateSummaryMetrics();
  const vatReport = calculateVATReport();
  const outstandingReport = calculateOutstandingReport();
  const paymentSummary = calculatePaymentSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Billing Reports</h1>
            <p className="text-purple-200">Financial insights and analytics</p>
          </div>
          <button
            onClick={() => exportReport(reportType)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <div className="flex gap-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="summary" className="bg-gray-900">Summary Report</option>
              <option value="vat" className="bg-gray-900">VAT Report</option>
              <option value="outstanding" className="bg-gray-900">Outstanding Invoices</option>
              <option value="payments" className="bg-gray-900">Payment Summary</option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="week" className="bg-gray-900">This Week</option>
              <option value="month" className="bg-gray-900">This Month</option>
              <option value="quarter" className="bg-gray-900">This Quarter</option>
              <option value="year" className="bg-gray-900">This Year</option>
            </select>
          </div>
        </div>

        {/* Summary Report */}
        {reportType === 'summary' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-purple-200 text-sm">Total Invoiced</span>
                </div>
                <div className="text-2xl font-bold text-white">AED {metrics.totalInvoiced.toFixed(2)}</div>
                <div className="text-sm text-purple-300 mt-1">{metrics.invoiceCount} invoices</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                  </div>
                  <span className="text-purple-200 text-sm">Total Paid</span>
                </div>
                <div className="text-2xl font-bold text-white">AED {metrics.totalPaid.toFixed(2)}</div>
                <div className="text-sm text-green-300 mt-1">{metrics.paidInvoices} paid invoices</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-300" />
                  </div>
                  <span className="text-purple-200 text-sm">Outstanding</span>
                </div>
                <div className="text-2xl font-bold text-white">AED {metrics.totalOutstanding.toFixed(2)}</div>
                <div className="text-sm text-red-300 mt-1">{metrics.overdueInvoices} overdue</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="text-purple-200 text-sm">Collection Rate</span>
                </div>
                <div className="text-2xl font-bold text-white">{metrics.collectionRate.toFixed(1)}%</div>
                <div className="text-sm text-purple-300 mt-1">Avg: AED {metrics.avgInvoiceValue.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Total VAT Collected
              </h3>
              <div className="text-3xl font-bold text-white mb-2">AED {metrics.totalVAT.toFixed(2)}</div>
              <div className="text-purple-200">From {metrics.invoiceCount} invoices</div>
            </div>
          </>
        )}

        {/* VAT Report */}
        {reportType === 'vat' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              VAT Breakdown by Rate
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-purple-200 font-medium py-3">VAT Rate</th>
                    <th className="text-right text-purple-200 font-medium py-3">Invoice Count</th>
                    <th className="text-right text-purple-200 font-medium py-3">Subtotal (AED)</th>
                    <th className="text-right text-purple-200 font-medium py-3">VAT Amount (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(vatReport).map(([rate, details]) => {
                    const vatDetails = details as { count: number; subtotal: number; vatAmount: number };
                    return (
                      <tr key={rate} className="border-b border-white/5">
                        <td className="py-3 text-white font-medium">{rate}%</td>
                        <td className="py-3 text-right text-purple-200">{vatDetails.count}</td>
                        <td className="py-3 text-right text-purple-200">
                          {vatDetails.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-white font-semibold">
                          {vatDetails.vatAmount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20">
                    <td className="py-3 text-white font-bold">Total</td>
                    <td className="py-3 text-right text-white font-bold">{metrics.invoiceCount}</td>
                    <td className="py-3 text-right text-white font-bold">
                      {metrics.totalInvoiced.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-white font-bold">
                      {metrics.totalVAT.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Outstanding Invoices Report */}
        {reportType === 'outstanding' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(outstandingReport.byStatus).map(([status, details]) => {
                const statusDetails = details as { count: number; amount: number };
                return (
                  <div key={status} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                    <h4 className="text-purple-200 text-sm mb-2 capitalize">{status}</h4>
                    <div className="text-2xl font-bold text-white mb-1">AED {statusDetails.amount.toFixed(2)}</div>
                    <div className="text-sm text-purple-300">{statusDetails.count} invoice{statusDetails.count !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-purple-200 font-medium px-6 py-4">Invoice</th>
                      <th className="text-left text-purple-200 font-medium px-6 py-4">Due Date</th>
                      <th className="text-left text-purple-200 font-medium px-6 py-4">Status</th>
                      <th className="text-right text-purple-200 font-medium px-6 py-4">Amount</th>
                      <th className="text-right text-purple-200 font-medium px-6 py-4">Paid</th>
                      <th className="text-right text-purple-200 font-medium px-6 py-4">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingReport.outstanding.map((inv) => (
                      <tr key={inv.id} className="border-b border-white/5">
                        <td className="px-6 py-4 text-white font-medium">{inv.invoice_number}</td>
                        <td className="px-6 py-4 text-purple-200">
                          {new Date(inv.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            inv.status === 'overdue' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-purple-200">
                          AED {inv.total_amount_aed.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-green-300">
                          AED {inv.paid_amount_aed.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-300 font-semibold">
                          AED {inv.balance_due_aed.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Payment Summary */}
        {reportType === 'payments' && (
          <>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Methods
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(paymentSummary.byMethod).map(([method, details]) => {
                  const methodDetails = details as { count: number; amount: number };
                  return (
                    <div key={method} className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-purple-200 text-sm mb-2 capitalize">{method.replace('_', ' ')}</h4>
                      <div className="text-xl font-bold text-white mb-1">AED {methodDetails.amount.toFixed(2)}</div>
                      <div className="text-xs text-purple-300">{methodDetails.count} payment{methodDetails.count !== 1 ? 's' : ''}</div>
                      {paymentSummary.totalPayments > 0 && (
                        <div className="mt-2 text-xs text-purple-400">
                          {((methodDetails.amount / paymentSummary.totalPayments) * 100).toFixed(1)}% of total
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">Total Payments Received</h3>
              <div className="text-3xl font-bold text-white">AED {paymentSummary.totalPayments.toFixed(2)}</div>
              <div className="text-purple-200 mt-2">{data.payments.length} transactions</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
