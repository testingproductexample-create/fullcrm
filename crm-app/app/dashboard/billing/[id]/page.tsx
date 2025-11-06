'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, Edit, Send, Download, Trash2, DollarSign, 
  Calendar, User, FileText, CheckCircle, Clock, AlertCircle,
  CreditCard, Plus
} from 'lucide-react';
import { Invoice, InvoiceItem, Customer, Payment } from '@/types/database';

interface InvoiceWithRelations extends Invoice {
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('User not authenticated');
        return;
      }

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('organization_id', userData.user.id)
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoiceData) {
        setError('Invoice not found');
        return;
      }

      // Fetch customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoiceData.customer_id)
        .single();

      // Fetch invoice items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('display_order', { ascending: true });

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      setInvoice({
        ...invoiceData,
        customer: customerData || undefined,
        items: itemsData || [],
        payments: paymentsData || []
      });
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-300',
      sent: 'bg-blue-500/20 text-blue-300',
      viewed: 'bg-purple-500/20 text-purple-300',
      paid: 'bg-green-500/20 text-green-300',
      partial: 'bg-yellow-500/20 text-yellow-300',
      overdue: 'bg-red-500/20 text-red-300',
      cancelled: 'bg-gray-500/20 text-gray-400',
      void: 'bg-gray-500/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.JSX.Element> = {
      draft: <Edit className="w-4 h-4" />,
      sent: <Send className="w-4 h-4" />,
      paid: <CheckCircle className="w-4 h-4" />,
      partial: <Clock className="w-4 h-4" />,
      overdue: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || <FileText className="w-4 h-4" />;
  };

  const handleAddPayment = async () => {
    if (!invoice || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > invoice.balance_due_aed) {
      setError('Payment amount cannot exceed balance due');
      return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          organization_id: userData.user.id,
          invoice_id: invoiceId,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString().split('T')[0],
          amount_aed: amount,
          payment_status: 'completed',
          notes: paymentNotes
        });

      if (paymentError) throw paymentError;

      // Update invoice
      const newPaidAmount = invoice.paid_amount_aed + amount;
      const newBalanceDue = invoice.total_amount_aed - newPaidAmount;
      const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          paid_amount_aed: newPaidAmount,
          balance_due_aed: newBalanceDue,
          status: newStatus
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Create history entry
      await supabase
        .from('invoice_history')
        .insert({
          invoice_id: invoiceId,
          action_type: 'payment_received',
          previous_status: invoice.status,
          new_status: newStatus,
          payment_amount_aed: amount,
          previous_balance_aed: invoice.balance_due_aed,
          new_balance_aed: newBalanceDue,
          changed_by: userData.user.id,
          notes: `Payment received: AED ${amount.toFixed(2)} via ${paymentMethod}`
        });

      // Refresh invoice data
      await fetchInvoiceDetails();
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Failed to record payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const generatePDF = () => {
    // PDF generation placeholder - would integrate with jspdf
    alert('PDF generation will be implemented with jspdf library');
  };

  const sendInvoiceEmail = async () => {
    if (!invoice?.customer?.email) {
      setError('Customer email not available');
      return;
    }
    alert(`Email functionality will send invoice to: ${invoice.customer.email}`);
  };

  const deleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      router.push('/dashboard/billing/invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading invoice...</div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-red-300 text-xl">{error}</div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Invoice {invoice.invoice_number}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  {invoice.status.toUpperCase()}
                </span>
                <span className="text-purple-200 text-sm">
                  Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={sendInvoiceEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
            <button
              onClick={() => router.push(`/dashboard/billing/create?edit=${invoiceId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={deleteInvoice}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Invoice Info */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Bill To
                  </h3>
                  <div className="text-purple-200 space-y-1">
                    <p className="font-medium text-white">{invoice.customer?.full_name}</p>
                    {invoice.customer?.email && <p className="text-sm">{invoice.customer.email}</p>}
                    {invoice.customer?.phone && <p className="text-sm">{invoice.customer.phone}</p>}
                    {invoice.customer?.address_line1 && (
                      <p className="text-sm">{invoice.customer.address_line1}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Invoice Details
                  </h3>
                  <div className="text-purple-200 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span className="text-white">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span className="text-white">{new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                    {invoice.payment_terms && (
                      <div className="flex justify-between">
                        <span>Terms:</span>
                        <span className="text-white">{invoice.payment_terms}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Line Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-purple-200 font-medium pb-3 text-sm">Description</th>
                      <th className="text-right text-purple-200 font-medium pb-3 text-sm">Qty</th>
                      <th className="text-right text-purple-200 font-medium pb-3 text-sm">Price</th>
                      <th className="text-right text-purple-200 font-medium pb-3 text-sm">Discount</th>
                      <th className="text-right text-purple-200 font-medium pb-3 text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={item.id} className="border-b border-white/5">
                        <td className="py-3 text-white">{item.item_description}</td>
                        <td className="py-3 text-right text-purple-200">{item.quantity}</td>
                        <td className="py-3 text-right text-purple-200">AED {item.unit_price_aed.toFixed(2)}</td>
                        <td className="py-3 text-right text-purple-200">
                          {item.discount_amount_aed > 0 ? `AED ${item.discount_amount_aed.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 text-right text-white font-medium">AED {item.total_aed.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="space-y-2 max-w-md ml-auto">
                  <div className="flex justify-between text-purple-200">
                    <span>Subtotal:</span>
                    <span>AED {(invoice.subtotal_aed).toFixed(2)}</span>
                  </div>
                  {invoice.discount_amount_aed > 0 && (
                    <div className="flex justify-between text-purple-200">
                      <span>Discount:</span>
                      <span>- AED {invoice.discount_amount_aed.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-purple-200">
                    <span>VAT ({invoice.vat_rate}%):</span>
                    <span>AED {invoice.vat_amount_aed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/10">
                    <span>Total:</span>
                    <span>AED {invoice.total_amount_aed.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Notes</h3>
                <p className="text-purple-200 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-purple-200 text-sm mb-1">Total Amount</div>
                  <div className="text-white text-2xl font-bold">AED {invoice.total_amount_aed.toFixed(2)}</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3">
                  <div className="text-green-200 text-sm mb-1">Paid</div>
                  <div className="text-green-300 text-xl font-bold">AED {invoice.paid_amount_aed.toFixed(2)}</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="text-red-200 text-sm mb-1">Balance Due</div>
                  <div className="text-red-300 text-xl font-bold">AED {invoice.balance_due_aed.toFixed(2)}</div>
                </div>
              </div>

              {invoice.balance_due_aed > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Record Payment
                </button>
              )}
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment History
                </h3>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-medium">AED {payment.amount_aed.toFixed(2)}</span>
                        <span className="text-purple-200 text-sm capitalize">{payment.payment_method}</span>
                      </div>
                      <div className="text-purple-200 text-sm">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                      {payment.notes && (
                        <div className="text-purple-300 text-xs mt-2">{payment.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">Record Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Amount (AED)</label>
                <input
                  type="number"
                  min="0"
                  max={invoice.balance_due_aed}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${invoice.balance_due_aed.toFixed(2)}`}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="cash" className="bg-gray-900">Cash</option>
                  <option value="card" className="bg-gray-900">Card</option>
                  <option value="bank_transfer" className="bg-gray-900">Bank Transfer</option>
                  <option value="check" className="bg-gray-900">Check</option>
                  <option value="online" className="bg-gray-900">Online Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  placeholder="Add payment notes..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                  setPaymentNotes('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={processingPayment}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50"
              >
                {processingPayment ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
