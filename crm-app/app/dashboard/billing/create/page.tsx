'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Save, Send, Calendar, User, FileText, DollarSign } from 'lucide-react';
import { Invoice, InvoiceItem, Customer } from '@/types/database';

interface LineItem {
  id: string;
  item_description: string;
  quantity: number;
  unit_price_aed: number;
  discount_amount?: number;
  tax_rate: number;
  total_price_aed: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Due on Receipt');
  const [notes, setNotes] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      item_description: '',
      quantity: 1,
      unit_price_aed: 0,
      tax_rate: 5,
      total_price_aed: 0
    }
  ]);
  
  // Calculation state
  const [subtotal, setSubtotal] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Recalculate totals when line items change
  useEffect(() => {
    calculateTotals();
  }, [lineItems]);

  const fetchCustomers = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', userData.user.id)
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    }
  };

  const calculateTotals = () => {
    let subtotalCalc = 0;
    let vatCalc = 0;

    lineItems.forEach(item => {
      const itemSubtotal = (item.quantity * item.unit_price_aed) - (item.discount_amount || 0);
      const itemVat = itemSubtotal * (item.tax_rate / 100);
      
      subtotalCalc += itemSubtotal;
      vatCalc += itemVat;
    });

    setSubtotal(subtotalCalc);
    setVatAmount(vatCalc);
    setTotalAmount(subtotalCalc + vatCalc);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        item_description: '',
        quantity: 1,
        unit_price_aed: 0,
        tax_rate: 5,
        total_price_aed: 0
      }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate line item total
        const itemSubtotal = (updatedItem.quantity * updatedItem.unit_price_aed) - (updatedItem.discount_amount || 0);
        const itemVat = itemSubtotal * (updatedItem.tax_rate / 100);
        updatedItem.total_price_aed = itemSubtotal + itemVat;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const generateInvoiceNumber = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('organization_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].invoice_number.split('-')[1]);
        return `INV-${String(lastNumber + 1).padStart(4, '0')}`;
      }

      return 'INV-1001';
    } catch (err) {
      console.error('Error generating invoice number:', err);
      return `INV-${Date.now()}`;
    }
  };

  const validateForm = (): boolean => {
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return false;
    }

    if (!issueDate || !dueDate) {
      setError('Please set both issue date and due date');
      return false;
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      setError('Due date cannot be before issue date');
      return false;
    }

    const hasValidItems = lineItems.some(
      item => item.item_description.trim() !== '' && item.quantity > 0 && item.unit_price_aed > 0
    );

    if (!hasValidItems) {
      setError('Please add at least one valid line item');
      return false;
    }

    setError('');
    return true;
  };

  const saveInvoice = async (status: 'draft' | 'sent') => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const invoiceNumber = await generateInvoiceNumber(userData.user.id);

      // Calculate VAT rate (weighted average)
      const totalVatableAmount = lineItems.reduce((sum, item) => {
        return sum + ((item.quantity * item.unit_price_aed) - (item.discount_amount || 0));
      }, 0);
      const avgVatRate = totalVatableAmount > 0 ? (vatAmount / totalVatableAmount) * 100 : 5;

      // Calculate total discount
      const totalDiscount = lineItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          organization_id: userData.user.id,
          invoice_number: invoiceNumber,
          customer_id: selectedCustomerId,
          issue_date: issueDate,
          due_date: dueDate,
          status: status,
          subtotal_aed: subtotal + totalDiscount,
          discount_amount_aed: totalDiscount,
          vat_rate: avgVatRate,
          vat_amount_aed: vatAmount,
          total_amount_aed: totalAmount,
          paid_amount_aed: 0,
          balance_due_aed: totalAmount,
          payment_terms: paymentTerms,
          notes: notes
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = lineItems
        .filter(item => item.item_description.trim() !== '' && item.quantity > 0)
        .map((item, index) => {
          const itemSubtotal = (item.quantity * item.unit_price_aed) - (item.discount_amount || 0);
          const itemTax = itemSubtotal * (item.tax_rate / 100);
          return {
            invoice_id: invoice.id,
            item_type: 'custom',
            item_description: item.item_description,
            quantity: item.quantity,
            unit_price_aed: item.unit_price_aed,
            discount_percentage: 0,
            discount_amount_aed: item.discount_amount || 0,
            subtotal_aed: itemSubtotal,
            tax_rate: item.tax_rate,
            tax_amount_aed: itemTax,
            total_aed: itemSubtotal + itemTax,
            display_order: index + 1
          };
        });

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Create history entry
      await supabase
        .from('invoice_history')
        .insert({
          invoice_id: invoice.id,
          action_type: status === 'draft' ? 'created_draft' : 'created_and_sent',
          previous_status: null,
          new_status: status,
          changed_by: userData.user.id,
          notes: `Invoice ${status === 'draft' ? 'saved as draft' : 'created and sent'}`
        });

      // Redirect to invoice details page
      router.push(`/dashboard/billing/${invoice.id}`);
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Invoice</h1>
            <p className="text-purple-200">Generate a new invoice for your customer</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* Customer & Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Selection */}
            <div>
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id} className="bg-gray-900">
                    {customer.full_name} {customer.phone && `- ${customer.phone}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Due on Receipt" className="bg-gray-900">Due on Receipt</option>
                <option value="Net 7" className="bg-gray-900">Net 7</option>
                <option value="Net 15" className="bg-gray-900">Net 15</option>
                <option value="Net 30" className="bg-gray-900">Net 30</option>
                <option value="Net 60" className="bg-gray-900">Net 60</option>
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Line Items
              </h2>
              <button
                onClick={addLineItem}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4"
                >
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Description */}
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-white/70 text-sm mb-1">Description</label>
                      <input
                        type="text"
                        value={item.item_description}
                        onChange={(e) => updateLineItem(item.id, 'item_description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-white/70 text-sm mb-1">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-white/70 text-sm mb-1">Unit Price (AED)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price_aed}
                        onChange={(e) => updateLineItem(item.id, 'unit_price_aed', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Discount */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-white/70 text-sm mb-1">Discount (AED)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount_amount || 0}
                        onChange={(e) => updateLineItem(item.id, 'discount_amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Total */}
                    <div className="col-span-5 md:col-span-2">
                      <label className="block text-white/70 text-sm mb-1">Total (AED)</label>
                      <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium">
                        {item.total_price_aed.toFixed(2)}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex items-end justify-center">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between text-white">
                <span>Subtotal:</span>
                <span className="font-medium">AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>VAT (5%):</span>
                <span className="font-medium">AED {vatAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/20 pt-3 flex justify-between text-white text-xl font-bold">
                <span>Total:</span>
                <span>AED {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes or terms..."
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => saveInvoice('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => saveInvoice('sent')}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 shadow-lg"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Sending...' : 'Save & Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
