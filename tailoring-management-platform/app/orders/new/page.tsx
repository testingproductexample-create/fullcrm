'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { formatCurrency, calculateVAT } from '@/lib/utils';
import { 
  OrderFormData, 
  OrderItemFormData,
  ORDER_TYPES,
  ORDER_TYPE_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LEVEL_LABELS,
  ORDER_STATUSES,
  UAE_VAT_RATE
} from '@/types/order';
import { Customer } from '@/types/customer';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preSelectedCustomerId = searchParams.get('customer');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: preSelectedCustomerId || '',
    order_type: '',
    priority_level: 'normal',
    garment_details: {},
    design_notes: '',
    special_instructions: '',
    estimated_completion: '',
    delivery_date: '',
    total_amount: 0,
    advance_payment: 0,
    items: [],
  });

  // Fetch customers for selection
  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, customer_code, email, phone')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Get selected customer details
  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', formData.customer_id],
    queryFn: async (): Promise<Customer | null> => {
      if (!formData.customer_id) return null;
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', formData.customer_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!formData.customer_id,
  });

  // Generate order number
  const generateOrderNumber = () => {
    const prefix = 'ORD';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${random}`;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.item_amount * item.quantity), 0);
    const vatAmount = calculateVAT(subtotal);
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };

  // Add order item
  const addOrderItem = () => {
    const newItem: OrderItemFormData = {
      item_type: formData.order_type || 'custom',
      item_name: '',
      specifications: {},
      fabric_details: '',
      color: '',
      style_options: {},
      special_requirements: '',
      estimated_time_hours: 0,
      item_amount: 0,
      quantity: 1,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update order item
  const updateOrderItem = (index: number, field: keyof OrderItemFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const { subtotal, vatAmount, total } = calculateTotals();
      
      const orderData = {
        customer_id: data.customer_id,
        order_number: generateOrderNumber(),
        order_type: data.order_type,
        status: ORDER_STATUSES.DRAFT,
        priority_level: data.priority_level,
        garment_details: data.garment_details,
        design_notes: data.design_notes,
        special_instructions: data.special_instructions,
        estimated_completion: data.estimated_completion || null,
        delivery_date: data.delivery_date || null,
        total_amount: subtotal,
        advance_payment: data.advance_payment,
        vat_amount: vatAmount,
        final_amount: total,
        progress_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (data.items.length > 0) {
        const orderItems = data.items.map(item => ({
          order_id: order.id,
          item_type: item.item_type,
          item_name: item.item_name,
          specifications: item.specifications,
          fabric_details: item.fabric_details,
          color: item.color,
          style_options: item.style_options,
          special_requirements: item.special_requirements,
          estimated_time_hours: item.estimated_time_hours,
          item_amount: item.item_amount,
          quantity: item.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return order;
    },
    onSuccess: (order) => {
      toast.success('Order created successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.push("/orders/${order.id}" as any as any);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    },
  });

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    
    if (!formData.order_type) {
      toast.error('Please select an order type');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one order item');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  const steps = [
    { id: 1, title: 'Customer & Type', icon: UserIcon },
    { id: 2, title: 'Order Items', icon: ShoppingBagIcon },
    { id: 3, title: 'Details & Dates', icon: CalendarIcon },
    { id: 4, title: 'Review & Submit', icon: CurrencyDollarIcon },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back() as any}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
            <p className="text-gray-600">Create a new customer order with items and specifications</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Step {step.id}
                  </span>
                  <span className="text-xs text-gray-500">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Customer & Type */}
          {currentStep === 1 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Customer & Order Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select 
                    value={formData.customer_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <span>{customer.full_name}</span>
                            <Badge variant="outline">{customer.customer_code}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_type">Order Type *</Label>
                  <Select 
                    value={formData.order_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, order_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ORDER_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority_level">Priority Level</Label>
                  <Select 
                    value={formData.priority_level} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LEVEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Order Items */}
          {currentStep === 2 && (
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Items</CardTitle>
                <Button onClick={addOrderItem} className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No items added yet</p>
                    <p className="text-sm">Click "Add Item" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Item Name</Label>
                            <Input
                              value={item.item_name}
                              onChange={(e) => updateOrderItem(index, 'item_name', e.target.value)}
                              placeholder="Enter item name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Fabric Details</Label>
                            <Input
                              value={item.fabric_details}
                              onChange={(e) => updateOrderItem(index, 'fabric_details', e.target.value)}
                              placeholder="Fabric type, color, etc."
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                              value={item.color}
                              onChange={(e) => updateOrderItem(index, 'color', e.target.value)}
                              placeholder="Enter color"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Item Amount (AED)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.item_amount}
                              onChange={(e) => updateOrderItem(index, 'item_amount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Estimated Time (Hours)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.estimated_time_hours}
                              onChange={(e) => updateOrderItem(index, 'estimated_time_hours', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <Label>Special Requirements</Label>
                          <Textarea
                            value={item.special_requirements}
                            onChange={(e) => updateOrderItem(index, 'special_requirements', e.target.value)}
                            placeholder="Any special requirements for this item"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Details & Dates */}
          {currentStep === 3 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Order Details & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="design_notes">Design Notes</Label>
                  <Textarea
                    id="design_notes"
                    value={formData.design_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, design_notes: e.target.value }))}
                    placeholder="Design specifications and notes"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                    placeholder="Special handling or customer requirements"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_completion">Estimated Completion</Label>
                    <Input
                      id="estimated_completion"
                      type="date"
                      value={formData.estimated_completion}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_completion: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_date">Delivery Date</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advance_payment">Advance Payment (AED)</Label>
                  <Input
                    id="advance_payment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.advance_payment}
                    onChange={(e) => setFormData(prev => ({ ...prev, advance_payment: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter advance payment amount"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Order Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Info */}
                {selectedCustomer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Customer</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedCustomer.full_name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.customer_code}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    </div>
                  </div>
                )}

                {/* Order Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details</h4>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span>Order Type:</span>
                      <span>{ORDER_TYPE_LABELS[formData.order_type as keyof typeof ORDER_TYPE_LABELS]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority:</span>
                      <span>{PRIORITY_LEVEL_LABELS[formData.priority_level as keyof typeof PRIORITY_LEVEL_LABELS]}</span>
                    </div>
                    {formData.estimated_completion && (
                      <div className="flex justify-between">
                        <span>Estimated Completion:</span>
                        <span>{formData.estimated_completion}</span>
                      </div>
                    )}
                    {formData.delivery_date && (
                      <div className="flex justify-between">
                        <span>Delivery Date:</span>
                        <span>{formData.delivery_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-600">
                              {item.fabric_details} • {item.color} • Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="font-medium">{formatCurrency(item.item_amount * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Order Summary & Navigation */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT ({(UAE_VAT_RATE * 100).toFixed(0)}%):</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {formData.advance_payment > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Advance Payment:</span>
                    <span>{formatCurrency(formData.advance_payment)}</span>
                  </div>
                )}
                {formData.advance_payment > 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span>Remaining Balance:</span>
                    <span>{formatCurrency(total - formData.advance_payment)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="w-full"
                  >
                    Previous Step
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={
                      (currentStep === 1 && (!formData.customer_id || !formData.order_type)) ||
                      (currentStep === 2 && formData.items.length === 0)
                    }
                    className="w-full"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || formData.items.length === 0}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        Creating Order...
                      </div>
                    ) : (
                      'Create Order'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}