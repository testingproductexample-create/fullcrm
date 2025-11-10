'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon,
  MinusIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { 
  InvoiceFormData,
  InvoiceItemFormData,
  calculateVAT,
  calculateTotal,
  calculateLineTotal,
  UAE_VAT_RATE,
} from '@/types/financial';
import toast from 'react-hot-toast';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface Customer {
  id: string;
  full_name: string;
  customer_code: string;
  email?: string;
  phone?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  status: string;
}

export default function CreateInvoicePage() {
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: '',
    order_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    payment_terms: 'Net 30',
    notes: '',
    internal_notes: '',
    items: [{
      item_description: '',
      quantity: 1,
      unit_price_aed: 0,
      discount_percentage: 0,
      notes: '',
    }],
  });

  const [isDraft, setIsDraft] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, customer_code, email, phone')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders for selected customer
  const { data: orders } = useQuery({
    queryKey: ['customer-orders', formData.customer_id],
    queryFn: async (): Promise<Order[]> => {
      if (!formData.customer_id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_id, total_amount, status')
        .eq('customer_id', formData.customer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!formData.customer_id,
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData & { status: string }) => {
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => {
        return sum + calculateLineTotal(item.quantity, item.unit_price_aed, item.discount_percentage);
      }, 0);

      const vatAmount = calculateVAT(subtotal);
      const totalAmount = calculateTotal(subtotal, vatAmount);

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          organization_id: '00000000-0000-0000-0000-000000000001',
          invoice_number: invoiceNumber,
          customer_id: data.customer_id,
          order_id: data.order_id || null,
          issue_date: data.issue_date,
          due_date: data.due_date,
          subtotal_aed: subtotal,
          discount_amount_aed: 0,
          vat_rate: UAE_VAT_RATE,
          vat_amount_aed: vatAmount,
          total_amount_aed: totalAmount,
          paid_amount_aed: 0,
          balance_due_aed: totalAmount,
          status: data.status,
          payment_terms: data.payment_terms,
          notes: data.notes,
          internal_notes: data.internal_notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = data.items.map((item, index) => ({
        invoice_id: invoice.id,
        organization_id: '00000000-0000-0000-0000-000000000001',
        item_description: item.item_description,
        quantity: item.quantity,
        unit_price_aed: item.unit_price_aed,
        line_total_aed: calculateLineTotal(item.quantity, item.unit_price_aed, item.discount_percentage),
        discount_percentage: item.discount_percentage,
        discount_amount_aed: item.discount_percentage ? 
          (item.quantity * item.unit_price_aed * item.discount_percentage / 100) : 0,
        notes: item.notes,
        sort_order: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Invoice ${invoice.invoice_number} ${isDraft ? 'saved as draft' : 'created successfully'}!`);
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    },
  });

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.unit_price_aed, item.discount_percentage);
  }, 0);

  const vatAmount = calculateVAT(subtotal);
  const totalAmount = calculateTotal(subtotal, vatAmount);

  // Handle form submission
  const handleSubmit = (asDraft: boolean = false) => {
    setIsDraft(asDraft);
    createInvoiceMutation.mutate({
      ...formData,
      status: asDraft ? 'draft' : 'sent',
    });
  };

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      order_id: '', // Reset order selection when customer changes
    }));
  };

  // Handle order selection and pre-populate items
  const handleOrderChange = (orderId: string) => {
    const selectedOrder = orders?.find(order => order.id === orderId);
    if (selectedOrder) {
      // Pre-populate with order information
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
        items: [{
          item_description: `Order ${selectedOrder.order_number}`,
          quantity: 1,
          unit_price_aed: selectedOrder.total_amount,
          discount_percentage: 0,
          notes: `Based on order ${selectedOrder.order_number}`,
        }],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
      }));
    }
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        item_description: '',
        quantity: 1,
        unit_price_aed: 0,
        discount_percentage: 0,
        notes: '',
      }],
    }));
  };

  // Remove item
  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItemFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600">Generate a new invoice for customer billing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit(true)}
            disabled={createInvoiceMutation.isPending}
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button 
            onClick={() => handleSubmit(false)}
            disabled={createInvoiceMutation.isPending || !formData.customer_id}
          >
            {createInvoiceMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
            )}
            Create & Send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Order Selection */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Customer & Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer *
                  </label>
                  <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.full_name} ({customer.customer_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Order (Optional)
                  </label>
                  <Select value={formData.order_id || ''} onValueChange={handleOrderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No order</SelectItem>
                      {orders?.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {formatCurrency(order.total_amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <Select value={formData.payment_terms || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Visible to Customer)
                </label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes for the customer..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes (Private)
                </label>
                <Textarea
                  value={formData.internal_notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                  placeholder="Add internal notes for your team..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5" />
                Invoice Items
              </CardTitle>
              <Button onClick={addItem} variant="outline" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button
                        onClick={() => removeItem(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <Input
                        value={item.item_description}
                        onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (AED) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price_aed}
                        onChange={(e) => updateItem(index, 'unit_price_aed', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discount_percentage || 0}
                        onChange={(e) => updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Line Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium">
                        {formatCurrency(calculateLineTotal(item.quantity, item.unit_price_aed, item.discount_percentage))}
                      </div>
                    </div>
                  </div>

                  {item.notes !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Notes
                      </label>
                      <Input
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        placeholder="Optional item notes"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>VAT (5%):</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Invoice will be generated automatically</p>
                  <p>VAT included as per UAE regulations</p>
                  <p>PDF will be available for download</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}