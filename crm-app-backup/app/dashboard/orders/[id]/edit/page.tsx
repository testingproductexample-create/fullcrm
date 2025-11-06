'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderItem, Customer } from '@/types/database';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface OrderItemForm {
  id?: string;
  item_type: string;
  item_name: string;
  specifications: Record<string, any>;
  fabric_details: string;
  color: string;
  quantity: number;
  item_amount: number;
}

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Form state
  const [orderType, setOrderType] = useState<'bespoke' | 'casual' | 'alteration' | 'repair' | 'special_occasion'>('bespoke');
  const [priorityLevel, setPriorityLevel] = useState<'normal' | 'rush' | 'low'>('normal');
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [designNotes, setDesignNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);

  useEffect(() => {
    fetchOrderData();
  }, [orderId, profile]);

  async function fetchOrderData() {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        router.push('/dashboard/orders/list');
        return;
      }
      setOrder(orderData);

      // Fetch customer
      if (orderData.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', orderData.customer_id)
          .maybeSingle();
        setCustomer(customerData);
      }

      // Fetch order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      // Populate form with existing data
      setOrderType(orderData.order_type);
      setPriorityLevel(orderData.priority_level);
      setDesignNotes(orderData.design_notes || '');
      setSpecialInstructions(orderData.special_instructions || '');
      setDeliveryDate(orderData.delivery_date ? orderData.delivery_date.split('T')[0] : '');
      setEstimatedCompletion(orderData.estimated_completion ? orderData.estimated_completion.split('T')[0] : '');
      setAdvancePayment(parseFloat(orderData.advance_payment.toString()));

      if (itemsData && itemsData.length > 0) {
        setOrderItems(itemsData.map(item => ({
          id: item.id,
          item_type: item.item_type,
          item_name: item.item_name || '',
          specifications: item.specifications || {},
          fabric_details: item.fabric_details || '',
          color: item.color || '',
          quantity: item.quantity,
          item_amount: parseFloat(item.item_amount.toString())
        })));
      } else {
        setOrderItems([{
          item_type: '',
          item_name: '',
          specifications: {},
          fabric_details: '',
          color: '',
          quantity: 1,
          item_amount: 0
        }]);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to load order data');
    } finally {
      setLoading(false);
    }
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

  async function handleSave() {
    if (!profile?.organization_id || !order) {
      alert('Invalid session');
      return;
    }

    if (orderItems.length === 0 || orderItems.some(item => !item.item_type || item.item_amount === 0)) {
      alert('Please ensure all order items are complete');
      return;
    }

    setSaving(true);
    try {
      const { subtotal, vat, total } = calculateTotal();

      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          order_type: orderType,
          priority_level: priorityLevel,
          design_notes: designNotes,
          special_instructions: specialInstructions,
          estimated_completion: estimatedCompletion || null,
          delivery_date: deliveryDate || null,
          total_amount: subtotal,
          advance_payment: advancePayment,
          vat_amount: vat,
          final_amount: total,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Delete existing items and insert new ones
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      const itemsToInsert = orderItems.map(item => ({
        organization_id: profile.organization_id,
        order_id: orderId,
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

      // Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          organization_id: profile.organization_id,
          order_id: orderId,
          status: order.status,
          changed_by: profile.full_name || 'System',
          changed_at: new Date().toISOString(),
          notes: 'Order updated',
          percentage_completion: order.progress_percentage
        });

      router.push(`/dashboard/orders/${orderId}`);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-body text-neutral-700">Loading order data...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const { subtotal, vat, total } = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/orders/${orderId}`}
          className="p-2 hover:bg-glass-light rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-h2 font-bold text-neutral-900">Edit Order {order.order_number}</h1>
          <p className="text-body text-neutral-700">
            Customer: {customer?.full_name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Alert */}
      <div className="glass-card p-4 bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-small font-medium text-neutral-900">Editing Existing Order</p>
            <p className="text-small text-neutral-700">
              Changes will update the order and create a new history entry. The customer cannot be changed after order creation.
            </p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="glass-card p-6">
        <h3 className="text-h3 font-semibold text-neutral-900 mb-6">Order Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

        <div className="mb-6">
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

      {/* Order Items */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
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
      </div>

      {/* Payment Summary */}
      <div className="glass-card p-6">
        <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Payment Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Action Buttons */}
      <div className="flex justify-between gap-4">
        <Link href={`/dashboard/orders/${orderId}`} className="btn-secondary">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>Saving Changes...</>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
