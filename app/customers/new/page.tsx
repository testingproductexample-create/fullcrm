'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  UserPlusIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase/client';
import { 
  CustomerFormData, 
  CUSTOMER_CLASSIFICATIONS, 
  UAE_EMIRATES,
  COMMUNICATION_CHANNELS 
} from '@/types/customer';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: '',
    email: '',
    phone: '',
    phone_secondary: '',
    emirates_id: '',
    visa_status: '',
    nationality: '',
    gender: '',
    date_of_birth: '',
    anniversary_date: '',
    address_line1: '',
    address_line2: '',
    city: '',
    emirate: '',
    postal_code: '',
    classification: 'regular',
    preferred_communication: [],
    communication_opt_in: true,
    notes: '',
    tags: [],
  });

  // Generate customer code
  const generateCustomerCode = () => {
    const prefix = 'CUST';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = {
        ...data,
        customer_code: generateCustomerCode(),
        status: 'active',
        customer_since: new Date().toISOString().split('T')[0],
        total_orders: 0,
        total_spent: 0,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      return customer;
    },
    onSuccess: (customer) => {
      toast.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push("/customers/${customer.id}" as any as any);
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    },
  });

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommunicationToggle = (channel: string) => {
    const current = formData.preferred_communication || [];
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    
    handleInputChange('preferred_communication', updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
            <p className="text-gray-600">Create a new customer profile</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter customer's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">Classification</Label>
                <Select
                  value={formData.classification}
                  onValueChange={(value) => handleInputChange('classification', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CUSTOMER_CLASSIFICATIONS).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Enter nationality"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anniversary_date">Anniversary Date</Label>
                <Input
                  id="anniversary_date"
                  type="date"
                  value={formData.anniversary_date}
                  onChange={(e) => handleInputChange('anniversary_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emirates_id">Emirates ID</Label>
              <Input
                id="emirates_id"
                value={formData.emirates_id}
                onChange={(e) => handleInputChange('emirates_id', e.target.value)}
                placeholder="000-0000-0000000-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visa_status">Visa Status</Label>
              <Input
                id="visa_status"
                value={formData.visa_status}
                onChange={(e) => handleInputChange('visa_status', e.target.value)}
                placeholder="e.g., Employment Visa, Visit Visa, Resident"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="phone_secondary">Secondary Phone</Label>
                <Input
                  id="phone_secondary"
                  type="tel"
                  value={formData.phone_secondary}
                  onChange={(e) => handleInputChange('phone_secondary', e.target.value)}
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>

            {/* Preferred Communication Channels */}
            <div className="space-y-2">
              <Label>Preferred Communication Channels</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(COMMUNICATION_CHANNELS).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferred_communication?.includes(value) || false}
                      onChange={() => handleCommunicationToggle(value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{value}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="communication_opt_in"
                type="checkbox"
                checked={formData.communication_opt_in || false}
                onChange={(e) => handleInputChange('communication_opt_in', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="communication_opt_in" className="text-sm">
                Customer agrees to receive promotional communications
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                placeholder="Building name, street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                placeholder="Apartment, suite, unit, building (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emirate">Emirate</Label>
                <Select
                  value={formData.emirate}
                  onValueChange={(value) => handleInputChange('emirate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UAE_EMIRATES).map((emirate) => (
                      <SelectItem key={emirate} value={emirate}>
                        {emirate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Enter postal code"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about the customer..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  handleInputChange('tags', tags);
                }}
                placeholder="VIP, Corporate, Frequent, etc. (comma-separated)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back() as any}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.full_name.trim()}
            className="min-w-32"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Creating...
              </div>
            ) : (
              'Create Customer'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}