import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommission, CommissionPayment } from '../context/CommissionContext';
import { formatCurrency, formatDate } from '../lib/utils';

interface PaymentSchedule {
  id: string;
  name: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  nextRun: string;
  isActive: boolean;
  selectedEmployees: string[];
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
}

interface PaymentGateway {
  id: string;
  name: string;
  type: 'bank' | 'stripe' | 'paypal' | 'local';
  isConfigured: boolean;
  fees: number;
  processingTime: string;
}

interface ReceiptData {
  paymentId: string;
  employeeName: string;
  amount: number;
  period: string;
  method: string;
  transactionId: string;
  issueDate: string;
  commissionBreakdown: {
    description: string;
    amount: number;
  }[];
}

const Payments: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useCommission();
  const [selectedPayment, setSelectedPayment] = useState<CommissionPayment | null>(null);
  const [showBulkProcess, setShowBulkProcess] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Gateways
  const [paymentGateways] = useState<PaymentGateway[]>([
    {
      id: 'bank-1',
      name: 'Emirates NBD',
      type: 'bank',
      isConfigured: true,
      fees: 0.5,
      processingTime: '1-2 business days'
    },
    {
      id: 'stripe-1',
      name: 'Stripe',
      type: 'stripe',
      isConfigured: false,
      fees: 2.9,
      processingTime: 'Instant'
    },
    {
      id: 'paypal-1',
      name: 'PayPal',
      type: 'paypal',
      isConfigured: false,
      fees: 3.4,
      processingTime: '1-3 business days'
    },
    {
      id: 'local-1',
      name: 'Local Bank Transfer',
      type: 'local',
      isConfigured: true,
      fees: 0.25,
      processingTime: 'Same day'
    }
  ]);

  // Payment Schedules
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([
    {
      id: 'schedule-1',
      name: 'Monthly Commission Run',
      frequency: 'monthly',
      nextRun: '2025-12-01',
      isActive: true,
      selectedEmployees: ['emp-1', 'emp-2'],
      status: 'scheduled'
    },
    {
      id: 'schedule-2',
      name: 'Weekly Performance Bonus',
      frequency: 'weekly',
      nextRun: '2025-11-10',
      isActive: false,
      selectedEmployees: ['emp-3', 'emp-4', 'emp-5'],
      status: 'scheduled'
    }
  ]);

  // Calculate payment metrics
  const totalPending = state.commissionPayments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.totalAmount, 0);
  
  const totalProcessing = state.commissionPayments
    .filter(payment => payment.status === 'processing')
    .reduce((sum, payment) => sum + payment.totalAmount, 0);

  const totalCompleted = state.commissionPayments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.totalAmount, 0);

  const totalScheduled = paymentSchedules.filter(s => s.isActive).length;

  // Filter payments
  const filteredPayments = state.commissionPayments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesPeriod = filterPeriod === 'all' || payment.period === filterPeriod;
    const matchesSearch = payment.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.employee.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesPeriod && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'bank': return '🏦';
      case 'stripe': return '💳';
      case 'paypal': return '💰';
      case 'local': return '🏪';
      default: return '💳';
    }
  };

  const handlePaymentAction = (paymentId: string, action: 'approve' | 'process' | 'complete' | 'fail') => {
    const payment = state.commissionPayments.find(p => p.id === paymentId);
    if (!payment) return;

    let newStatus: 'pending' | 'processing' | 'completed' | 'failed' = payment.status;
    let processedDate: string | undefined;

    switch (action) {
      case 'approve':
        newStatus = 'processing';
        break;
      case 'process':
        newStatus = 'completed';
        processedDate = new Date().toISOString().split('T')[0];
        break;
      case 'fail':
        newStatus = 'failed';
        break;
    }

    const updatedPayment = {
      ...payment,
      status: newStatus,
      processedDate
    };

    dispatch({ type: 'UPDATE_PAYMENT', payload: updatedPayment });
  };

  const handleBulkProcess = () => {
    selectedPayments.forEach(paymentId => {
      const payment = state.commissionPayments.find(p => p.id === paymentId);
      if (payment && payment.status === 'pending') {
        handlePaymentAction(paymentId, 'process');
      }
    });
    setSelectedPayments([]);
    setShowBulkProcess(false);
  };

  const handleBulkApprove = () => {
    selectedPayments.forEach(paymentId => {
      const payment = state.commissionPayments.find(p => p.id === paymentId);
      if (payment && payment.status === 'pending') {
        handlePaymentAction(paymentId, 'approve');
      }
    });
    setSelectedPayments([]);
  };

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const createPaymentSchedule = (schedule: Omit<PaymentSchedule, 'id'>) => {
    const newSchedule: PaymentSchedule = {
      ...schedule,
      id: Date.now().toString()
    };
    setPaymentSchedules(prev => [...prev, newSchedule]);
    setShowSchedule(false);
  };

  const generateReceipt = (payment: CommissionPayment): ReceiptData => {
    return {
      paymentId: payment.id,
      employeeName: payment.employee.name,
      amount: payment.totalAmount,
      period: payment.period,
      method: payment.method,
      transactionId: `TXN-${payment.id.slice(-8)}-${Date.now()}`,
      issueDate: new Date().toISOString().split('T')[0],
      commissionBreakdown: [
        { description: 'Base Commission (5%)', amount: payment.totalAmount * 0.8 },
        { description: 'Performance Bonus (2%)', amount: payment.totalAmount * 0.2 }
      ]
    };
  };

  const downloadReceipt = (payment: CommissionPayment) => {
    const receipt = generateReceipt(payment);
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Commission Receipt - ${receipt.employeeName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .receipt-info { margin-bottom: 20px; }
          .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
          .breakdown { margin-top: 20px; }
          .breakdown-item { display: flex; justify-content: space-between; padding: 5px 0; }
          .total { border-top: 1px solid #ccc; padding-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Commission Payment Receipt</h1>
          <p>Payment ID: ${receipt.paymentId}</p>
        </div>
        <div class="receipt-info">
          <p><strong>Employee:</strong> ${receipt.employeeName}</p>
          <p><strong>Period:</strong> ${receipt.period}</p>
          <p><strong>Payment Method:</strong> ${receipt.method}</p>
          <p><strong>Transaction ID:</strong> ${receipt.transactionId}</p>
          <p><strong>Issue Date:</strong> ${formatDate(receipt.issueDate)}</p>
        </div>
        <div class="breakdown">
          <h3>Commission Breakdown</h3>
          ${receipt.commissionBreakdown.map(item => 
            `<div class="breakdown-item"><span>${item.description}</span><span>${formatCurrency(item.amount)}</span></div>`
          ).join('')}
          <div class="breakdown-item total">
            <span>Total Commission</span>
            <span class="amount">${formatCurrency(receipt.amount)}</span>
          </div>
        </div>
        <div style="margin-top: 40px; text-align: center; color: #666;">
          <p>Thank you for your service!</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.employeeName}-${receipt.period}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowReceipt(false);
  };

  const exportPayments = (format: 'csv' | 'pdf' | 'excel') => {
    // Export functionality
    const exportData = filteredPayments.map(payment => ({
      'Employee': payment.employee.name,
      'Period': payment.period,
      'Amount': payment.totalAmount,
      'Method': payment.method,
      'Status': payment.status,
      'Processed Date': payment.processedDate || 'N/A'
    }));

    if (format === 'csv') {
      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('payments.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">Advanced payment processing and management</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSchedule(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              📅 Schedule
            </button>
            <button
              onClick={() => setShowGateway(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              🏦 Gateways
            </button>
            <button
              onClick={() => setShowBulkProcess(true)}
              disabled={selectedPayments.length === 0}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              ⚡ Bulk Process ({selectedPayments.length})
            </button>
            <button 
              onClick={() => exportPayments('csv')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              📊 Export
            </button>
          </div>
        </div>
      </div>

      {/* Payment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Pending Payments"
          value={formatCurrency(totalPending)}
          icon="⏳"
          count={state.commissionPayments.filter(p => p.status === 'pending').length}
          color="yellow"
        />
        <MetricCard
          title="Processing"
          value={formatCurrency(totalProcessing)}
          icon="🔄"
          count={state.commissionPayments.filter(p => p.status === 'processing').length}
          color="blue"
        />
        <MetricCard
          title="Completed"
          value={formatCurrency(totalCompleted)}
          icon="✅"
          count={state.commissionPayments.filter(p => p.status === 'completed').length}
          color="green"
        />
        <MetricCard
          title="Scheduled"
          value={`${totalScheduled} Active`}
          icon="📅"
          count={totalScheduled}
          color="purple"
        />
      </div>

      {/* Payment Methods Overview */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentGateways.map((gateway) => (
            <div key={gateway.id} className="bg-white/30 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {getGatewayIcon(gateway.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{gateway.name}</p>
                  <p className="text-xs text-gray-600">{gateway.processingTime}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Fees: {gateway.fees}%</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  gateway.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {gateway.isConfigured ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Schedules Overview */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Payment Schedules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentSchedules.filter(s => s.isActive).map((schedule) => (
            <div key={schedule.id} className="bg-white/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800">{schedule.name}</h4>
                <span className="text-xs text-gray-600 capitalize">{schedule.frequency}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Next run: {formatDate(schedule.nextRun)}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{schedule.selectedEmployees.length} employees</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  schedule.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {schedule.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
              placeholder="Search employees..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
            >
              <option value="all">All Periods</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-08">August 2025</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkApprove}
                disabled={selectedPayments.length === 0}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
              >
                Approve
              </button>
              <button className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors">
                Process
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/30 backdrop-blur-sm">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(filteredPayments.map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    className="rounded border-white/30"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Period</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-white/20 hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => togglePaymentSelection(payment.id)}
                      className="rounded border-white/30"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {payment.employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{payment.employee.name}</p>
                        <p className="text-sm text-gray-600">{payment.employee.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-800 font-mono">{payment.period}</td>
                  <td className="px-6 py-4 text-green-600 font-semibold">{formatCurrency(payment.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <span>{getGatewayIcon(payment.method)}</span>
                      <span className="capitalize">{payment.method}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                      <span>{getStatusIcon(payment.status)}</span>
                      <span className="capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'approve')}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {payment.status === 'processing' && (
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'process')}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowReceipt(true);
                        }}
                        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition-colors"
                      >
                        Receipt
                      </button>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Process Modal */}
      {showBulkProcess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Bulk Payment Process</h3>
                <button
                  onClick={() => setShowBulkProcess(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Process {selectedPayments.length} payments?
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Selected payments:</p>
                  {selectedPayments.map(paymentId => {
                    const payment = state.commissionPayments.find(p => p.id === paymentId);
                    return payment ? (
                      <div key={paymentId} className="flex justify-between text-sm">
                        <span>{payment.employee.name}</span>
                        <span>{formatCurrency(payment.totalAmount)}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => setShowBulkProcess(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkProcess}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Process Payments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule Modal */}
      {showSchedule && (
        <PaymentScheduleModal
          onClose={() => setShowSchedule(false)}
          onCreate={createPaymentSchedule}
          employees={state.employees}
        />
      )}

      {/* Payment Gateway Modal */}
      {showGateway && (
        <PaymentGatewayModal
          onClose={() => setShowGateway(false)}
          gateways={paymentGateways}
        />
      )}

      {/* Receipt Preview Modal */}
      {showReceipt && selectedPayment && (
        <ReceiptPreviewModal
          payment={selectedPayment}
          receipt={generateReceipt(selectedPayment)}
          onClose={() => setShowReceipt(false)}
          onDownload={downloadReceipt}
        />
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && !showReceipt && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onAction={handlePaymentAction}
        />
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  count: number;
  color: 'yellow' | 'blue' | 'green' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, count, color }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'yellow': return 'from-yellow-500 to-orange-500';
      case 'blue': return 'from-blue-500 to-indigo-500';
      case 'green': return 'from-green-500 to-emerald-500';
      case 'purple': return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses()} rounded-full flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-gray-800">{count}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{value}</p>
    </div>
  );
};

interface PaymentScheduleModalProps {
  onClose: () => void;
  onCreate: (schedule: Omit<PaymentSchedule, 'id'>) => void;
  employees: any[];
}

const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({ onClose, onCreate, employees }) => {
  const [schedule, setSchedule] = useState({
    name: '',
    frequency: 'monthly' as const,
    nextRun: '',
    isActive: true,
    selectedEmployees: [] as string[],
    status: 'scheduled' as const
  });

  const handleCreate = () => {
    if (schedule.name && schedule.nextRun) {
      onCreate(schedule);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Create Payment Schedule</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
              <input
                type="text"
                value={schedule.name}
                onChange={(e) => setSchedule({ ...schedule, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
                placeholder="e.g., Monthly Commission Run"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={schedule.frequency}
                onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Run Date</label>
              <input
                type="date"
                value={schedule.nextRun}
                onChange={(e) => setSchedule({ ...schedule, nextRun: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Employees</label>
              <div className="max-h-40 overflow-y-auto bg-white/30 rounded-lg p-2">
                {employees.map((employee) => (
                  <label key={employee.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={schedule.selectedEmployees.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSchedule({
                            ...schedule,
                            selectedEmployees: [...schedule.selectedEmployees, employee.id]
                          });
                        } else {
                          setSchedule({
                            ...schedule,
                            selectedEmployees: schedule.selectedEmployees.filter(id => id !== employee.id)
                          });
                        }
                      }}
                      className="rounded border-white/30"
                    />
                    <span className="text-sm">{employee.name} - {employee.position}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PaymentGatewayModalProps {
  onClose: () => void;
  gateways: PaymentGateway[];
}

const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({ onClose, gateways }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Payment Gateways</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {gateways.map((gateway) => (
              <div key={gateway.id} className="bg-white/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      {gateway.type === 'bank' ? '🏦' : gateway.type === 'stripe' ? '💳' : '💰'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{gateway.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{gateway.type} Payment</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    gateway.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {gateway.isConfigured ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <p className="font-medium">{gateway.processingTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction Fees:</span>
                    <p className="font-medium">{gateway.fees}%</p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors">
                    {gateway.isConfigured ? 'Configure' : 'Connect'}
                  </button>
                  <button className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors">
                    Test Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReceiptPreviewModalProps {
  payment: CommissionPayment;
  receipt: ReceiptData;
  onClose: () => void;
  onDownload: (payment: CommissionPayment) => void;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ payment, receipt, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Payment Receipt</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="bg-white/50 rounded-lg p-4 space-y-4">
            <div className="text-center border-b border-white/30 pb-4">
              <h4 className="text-lg font-bold text-gray-800">Commission Payment Receipt</h4>
              <p className="text-sm text-gray-600">Payment ID: {receipt.paymentId}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Employee:</span>
                <span className="font-medium">{receipt.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="font-medium">{receipt.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{receipt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">{formatDate(receipt.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{receipt.method}</span>
              </div>
            </div>

            <div className="border-t border-white/30 pt-4">
              <h5 className="font-semibold text-gray-800 mb-2">Commission Breakdown</h5>
              {receipt.commissionBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.description}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg border-t border-white/30 pt-2 mt-2">
                <span>Total Commission</span>
                <span className="text-green-600">{formatCurrency(receipt.amount)}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => onDownload(payment)}
              className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Download Receipt
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PaymentDetailModalProps {
  payment: CommissionPayment;
  onClose: () => void;
  onAction: (paymentId: string, action: 'approve' | 'process' | 'complete' | 'fail') => void;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({ payment, onClose, onAction }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Payment Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Employee Info */}
          <div className="bg-white/50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Employee Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-800">{payment.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-medium text-gray-800">{payment.employee.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium text-gray-800">{payment.employee.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{payment.employee.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white/50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Payment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Period</p>
                <p className="font-medium text-gray-800">{payment.period}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium text-green-600 text-lg">{formatCurrency(payment.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Method</p>
                <p className="font-medium text-gray-800 capitalize">{payment.method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <span>{payment.status === 'pending' ? '⏳' : payment.status === 'processing' ? '🔄' : payment.status === 'completed' ? '✅' : '❌'}</span>
                  <span className="capitalize">{payment.status}</span>
                </span>
              </div>
              {payment.processedDate && (
                <div>
                  <p className="text-sm text-gray-600">Processed Date</p>
                  <p className="font-medium text-gray-800">{formatDate(payment.processedDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="bg-white/50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Commission Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Commission (5%)</span>
                <span className="font-medium">{formatCurrency(payment.totalAmount * 0.8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Performance Bonus (2%)</span>
                <span className="font-medium">{formatCurrency(payment.totalAmount * 0.2)}</span>
              </div>
              <div className="border-t border-white/30 pt-2 flex justify-between font-semibold text-gray-800">
                <span>Total Commission</span>
                <span>{formatCurrency(payment.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {payment.status === 'pending' && (
              <button
                onClick={() => onAction(payment.id, 'approve')}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Process Payment
              </button>
            )}
            {payment.status === 'processing' && (
              <button
                onClick={() => onAction(payment.id, 'process')}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Mark as Completed
              </button>
            )}
            <button
              onClick={() => onAction(payment.id, 'fail')}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Mark as Failed
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Payments;