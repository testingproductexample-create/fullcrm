'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, OrderTemplate } from '@/types/database';
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  Search,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Package,
  User,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface OrderItemForm {
  item_type: string;
  item_name: string;
  specifications: Record<string, any>;
  fabric_details: string;
  color: string;
  quantity: number;
  item_amount: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Order form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderType, setOrderType] = useState<'bespoke' | 'casual' | 'alteration' | 'repair' | 'special_occasion'>('bespoke');
  const [priorityLevel, setPriorityLevel] = useState<'normal' | 'rush' | 'low'>('normal');
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([{
    item_type: '',
    item_name: '',
    specifications: {},
    fabric_details: '',
    color: '',
    quantity: 1,
    item_amount: 0
  }]);
  const [designNotes, setDesignNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);

  useEffect(() => {
    fetchCustomers();
    fetchTemplates();
  }, [profile]);

  async function fetchCustomers() {
    if (!profile?.organization_id) return;
    
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'Active')
      .order('full_name');
    
    setCustomers(data || []);
  }

  async function fetchTemplates() {
    if (!profile?.organization_id) return;
    
    const { data } = await supabase
      .from('order_templates')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });
    
    setTemplates(data || []);
  }

  function applyTemplate(template: OrderTemplate) {
    const specs = template.default_specifications || {};
    setOrderType(specs.order_type || 'bespoke');
    setPriorityLevel(specs.priority_level || 'normal');
    if (specs.items && Array.isArray(specs.items)) {
      setOrderItems(specs.items);
    }
    if (specs.design_notes) setDesignNotes(specs.design_notes);
  }

  function addOrderItem() {
    setOrderItems([...orderItems, {
      item_type: '',
      item_name: '',
      specifications: {},
      fabric_details: '',
      color: '',
      quantity: 1,
      item_amount: 0
    }]);
  }

  function removeOrderItem(index: number) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  function updateOrderItem(index: number, field: keyof OrderItemForm, value: any) {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  }

  function calculateTotal() {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.item_amount * item.quantity), 0);
    const vat = subtotal * 0.05;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }

  async function handleSubmit() {
    if (!profile?.organization_id || !selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    if (orderItems.length === 0 || orderItems.some(item => !item.item_type)) {
      alert('Please add at least one order item');
      return;
    }

    setLoading(true);

    try {
      const { subtotal, vat, total } = calculateTotal();
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          organization_id: profile.organization_id,
          customer_id: selectedCustomerId,
          order_number: orderNumber,
          order_type: orderType,
          status: 'new',
          priority_level: priorityLevel,
          garment_details: {},
          design_notes: designNotes,
          special_instructions: specialInstructions,
          estimated_completion: estimatedCompletion || null,
          delivery_date: deliveryDate || null,
          total_amount: subtotal,
          advance_payment: advancePayment,
          vat_amount: vat,
          final_amount: total,
          progress_percentage: 0
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const itemsToInsert = orderItems.map(item => ({
        organization_id: profile.organization_id,
        order_id: orderData.id,
        item_type: item.item_type,
        item_name: item.item_name,
        specifications: item.specifications,
        fabric_details: item.fabric_details,
        color: item.color,
        style_options: {},
        item_amount: item.item_amount,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Create initial status history
      await supabase
        .from('order_status_history')
        .insert({
          organization_id: profile.organization_id,
          order_id: orderData.id,
          status: 'new',
          changed_by: profile.full_name || 'System',
          changed_at: new Date().toISOString(),
          notes: 'Order created',
          percentage_completion: 0
        });

      // Update customer total orders
      await supabase.rpc('increment_customer_orders', {
        customer_id: selectedCustomerId
      }).catch(() => {
        // Fallback if function doesn't exist
        supabase
          .from('customers')
          .update({ 
            total_orders: customers.find(c => c.id === selectedCustomerId)?.total_orders + 1 || 1,
            last_order_date: new Date().toISOString()
          })
          .eq('id', selectedCustomerId);
      });

      router.push(`/dashboard/orders/${orderData.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const { subtotal, vat, total } = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/orders/list"
          className="p-2 hover:bg-glass-light rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-h2 font-bold text-neutral-900">Create New Order</h1>
          <p className="text-body text-neutral-700">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center">
          {[
            { num: 1, label: 'Customer', icon: User },
            { num: 2, label: 'Order Items', icon: Package },
            { num: 3, label: 'Details', icon: FileText },
            { num: 4, label: 'Payment', icon: DollarSign }
          ].map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className={`flex flex-col items-center ${idx < 3 ? 'flex-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step > s.num ? 'bg-green-600 text-white' :
                    step === s.num ? 'bg-primary-600 text-white' :
                    'bg-neutral-200 text-neutral-600'
                  }`}>
                    {step > s.num ? '✓' : <Icon className="w-5 h-5" />}
                  </div>
                  <p className="text-tiny mt-1 text-center">{s.label}</p>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-green-600' : 'bg-neutral-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-card p-6">
        {/* Step 1: Select Customer */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Select Customer</h3>
              
              {/* Templates */}
              {templates.length > 0 && (
                <div className="mb-6">
                  <label className="block text-small font-medium text-neutral-900 mb-2">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Quick Start from Template
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {templates.slice(0, 3).map(template => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="p-3 border border-neutral-300 rounded-md hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                      >
                        <p className="font-medium text-neutral-900">{template.template_name}</p>
                        {template.description && (
                          <p className="text-tiny text-neutral-700 mt-1">{template.description}</p>
                        )}
                        <p className="text-tiny text-primary-600 mt-1">Used {template.usage_count} times</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search customers by name, code, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`p-4 border rounded-md cursor-pointer transition-all ${
                      selectedCustomerId === customer.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-neutral-900">{customer.full_name}</p>
                        <p className="text-small text-neutral-700">Code: {customer.customer_code}</p>
                        {customer.email && (
                          <p className="text-small text-neutral-700">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-small text-neutral-700">{customer.phone}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-tiny font-medium ${
                        customer.classification === 'VIP' ? 'bg-purple-100 text-purple-900' :
                        customer.classification === 'Regular' ? 'bg-blue-100 text-blue-900' :
                        'bg-green-100 text-green-900'
                      }`}>
                        {customer.classification}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Order Items */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-h3 font-semibold text-neutral-900">Order Items</h3>
              <button onClick={addOrderItem} className="btn-secondary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="glass-card p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-neutral-900">Item {index + 1}</h4>
                    {orderItems.length > 1 && (
                      <button
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-small font-medium text-neutral-900 mb-1">
                        Item Type *
                      </label>
                      <select
                        value={item.item_type}
                        onChange={(e) => updateOrderItem(index, 'item_type', e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Jacket">Jacket</option>
                        <option value="Trousers">Trousers</option>
                        <option value="Shirt">Shirt</option>
                        <option value="Waistcoat">Waistcoat</option>
                        <option value="Thobe">Thobe</option>
                        <option value="Kandura">Kandura</option>
                        <option value="Dress">Dress</option>
                        <option value="Alteration">Alteration</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-small font-medium text-neutral-900 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateOrderItem(index, 'item_name', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Navy Blue Suit Jacket"
                      />
                    </div>

                    <div>
                      <label className="block text-small font-medium text-neutral-900 mb-1">
                        Fabric Details
                      </label>
                      <input
                        type="text"
                        value={item.fabric_details}
                        onChange={(e) => updateOrderItem(index, 'fabric_details', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Italian Wool, 100% Cotton"
                      />
                    </div>

                    <div>
                      <label className="block text-small font-medium text-neutral-900 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={item.color}
                        onChange={(e) => updateOrderItem(index, 'color', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Navy Blue, White"
                      />
                    </div>

                    <div>
                      <label className="block text-small font-medium text-neutral-900 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-small font-medium text-neutral-900 mb-1">
                        Amount (AED) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.item_amount}
                        onChange={(e) => updateOrderItem(index, 'item_amount', parseFloat(e.target.value) || 0)}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="glass-card p-4 bg-neutral-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-body text-neutral-700">Subtotal:</span>
                  <span className="text-body font-medium">AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body text-neutral-700">VAT (5%):</span>
                  <span className="text-body font-medium">AED {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-300 pt-2">
                  <span className="text-large font-semibold text-neutral-900">Total:</span>
                  <span className="text-large font-bold text-primary-600">AED {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Order Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-h3 font-semibold text-neutral-900">Order Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Order Type *
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="input-field"
                  required
                >
                  <option value="bespoke">Bespoke Suit</option>
                  <option value="casual">Casual Wear</option>
                  <option value="alteration">Alteration</option>
                  <option value="repair">Repair</option>
                  <option value="special_occasion">Special Occasion</option>
                </select>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Priority Level *
                </label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value as any)}
                  className="input-field"
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="rush">Rush</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Estimated Completion
                </label>
                <input
                  type="date"
                  value={estimatedCompletion}
                  onChange={(e) => setEstimatedCompletion(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-900 mb-1">
                Design Notes
              </label>
              <textarea
                value={designNotes}
                onChange={(e) => setDesignNotes(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Add design preferences, style notes, customer requests..."
              />
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-900 mb-1">
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Add any special handling instructions, rush requirements, delivery notes..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Payment & Review */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-h3 font-semibold text-neutral-900">Payment & Review</h3>

            {/* Payment */}
            <div className="glass-card p-4">
              <h4 className="font-semibold text-neutral-900 mb-4">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-neutral-900 mb-1">
                    Advance Payment (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={total}
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                  <p className="text-tiny text-neutral-700 mt-1">
                    Recommended: {(total * 0.5).toFixed(2)} AED (50%)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-small text-neutral-700">Subtotal:</span>
                    <span className="text-body font-medium">AED {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-small text-neutral-700">VAT (5%):</span>
                    <span className="text-body font-medium">AED {vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-300 pt-2">
                    <span className="text-body font-semibold">Total Amount:</span>
                    <span className="text-body font-bold text-primary-600">AED {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-small text-neutral-700">Advance Payment:</span>
                    <span className="text-body font-medium text-green-700">AED {advancePayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-300 pt-2">
                    <span className="text-body font-semibold">Balance Due:</span>
                    <span className="text-body font-bold text-red-600">AED {(total - advancePayment).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="glass-card p-4">
              <h4 className="font-semibold text-neutral-900 mb-4">Order Summary</h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-small text-neutral-700">Customer</dt>
                  <dd className="text-body font-medium">{selectedCustomer?.full_name}</dd>
                </div>
                <div>
                  <dt className="text-small text-neutral-700">Order Type</dt>
                  <dd className="text-body">{orderType.replace('_', ' ').toUpperCase()}</dd>
                </div>
                <div>
                  <dt className="text-small text-neutral-700">Priority</dt>
                  <dd className="text-body">{priorityLevel.toUpperCase()}</dd>
                </div>
                <div>
                  <dt className="text-small text-neutral-700">Total Items</dt>
                  <dd className="text-body">{orderItems.length} item(s)</dd>
                </div>
                {deliveryDate && (
                  <div>
                    <dt className="text-small text-neutral-700">Delivery Date</dt>
                    <dd className="text-body">{deliveryDate}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>

        {step < 4 ? (
          <button
            onClick={() => {
              if (step === 1 && !selectedCustomerId) {
                alert('Please select a customer');
                return;
              }
              if (step === 2 && (orderItems.length === 0 || orderItems.some(item => !item.item_type || item.item_amount === 0))) {
                alert('Please add at least one complete order item');
                return;
              }
              setStep(step + 1);
            }}
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>Creating Order...</>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Order
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
