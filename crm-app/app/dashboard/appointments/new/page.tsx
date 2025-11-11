'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Clock,
  User,
  FileText,
  DollarSign,
  Plus,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';
import { AppointmentType, Customer, Employee, AppointmentResource } from '@/types/database';

export default function NewAppointment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resources, setResources] = useState<AppointmentResource[]>([]);
  
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    appointment_type_id: '',
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    appointment_date: '',
    start_time: '',
    duration_minutes: 60,
    notes: '',
    internal_notes: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    booking_source: 'staff' as const,
    deposit_amount: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchCustomer.length > 2) {
      searchCustomers();
    }
  }, [searchCustomer]);

  const loadInitialData = async () => {
    try {
      // Load appointment types
      const { data: types, error: typesError } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (typesError) throw typesError;
      setAppointmentTypes(types || []);

      // Load employees
      const { data: emps, error: empsError } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Active')
        .order('first_name');

      if (empsError) throw empsError;
      setEmployees(emps || []);

      // Load resources
      const { data: res, error: resError } = await supabase
        .from('appointment_resources')
        .select('*')
        .eq('is_available', true)
        .order('resource_name');

      if (resError) throw resError;
      setResources(res || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load form data. Please refresh the page.');
    }
  };

  const searchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`full_name.ilike.%${searchCustomer}%,phone.ilike.%${searchCustomer}%,email.ilike.%${searchCustomer}%`)
        .eq('status', 'Active')
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchCustomer(customer.full_name);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.full_name,
      customer_phone: customer.phone || '',
      customer_email: customer.email || ''
    }));
    setShowCustomerDropdown(false);
  };

  const handleTypeChange = (typeId: string) => {
    const type = appointmentTypes.find(t => t.id === typeId);
    if (type) {
      setFormData(prev => ({
        ...prev,
        appointment_type_id: typeId,
        duration_minutes: type.duration_minutes,
        deposit_amount: type.deposit_required ? (type.price * 0.2) : 0
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.appointment_type_id) {
        throw new Error('Please select an appointment type');
      }
      if (!formData.appointment_date) {
        throw new Error('Please select a date');
      }
      if (!formData.start_time) {
        throw new Error('Please select a start time');
      }

      // Calculate end time
      const [hours, minutes] = formData.start_time.split(':');
      const startMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const endMinutes = startMinutes + formData.duration_minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      // Get user profile for created_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Generate appointment number
      const { data: appointmentNumber } = await supabase
        .rpc('generate_appointment_number', { org_id: profile.organization_id });

      // Create appointment
      const { data: appointment, error: createError } = await supabase
        .from('appointments')
        .insert({
          organization_id: profile.organization_id,
          appointment_number: appointmentNumber || `APT-${Date.now()}`,
          appointment_type_id: formData.appointment_type_id,
          customer_id: formData.customer_id || null,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email,
          appointment_date: formData.appointment_date,
          start_time: formData.start_time,
          end_time,
          duration_minutes: formData.duration_minutes,
          status: 'scheduled',
          priority: formData.priority,
          notes: formData.notes,
          internal_notes: formData.internal_notes,
          booking_source: formData.booking_source,
          confirmation_status: 'pending',
          deposit_amount: formData.deposit_amount,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/dashboard/appointments/${appointment.id}` as any);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      setError(error.message || 'Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/appointments"
            className="p-2 hover:bg-glass-light rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">New Appointment</h1>
            <p className="text-body text-neutral-700 mt-1">
              Schedule a new customer appointment
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="glass-card p-6">
          <h2 className="text-h3 font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Information
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Search Customer
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search by name, phone, or email..."
                  className="w-full pl-10 pr-10 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSearchCustomer('');
                      setFormData(prev => ({
                        ...prev,
                        customer_id: '',
                        customer_name: '',
                        customer_phone: '',
                        customer_email: ''
                      }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                  </button>
                )}
              </div>

              {/* Customer dropdown */}
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-2 glass-card max-h-60 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full p-3 text-left hover:bg-glass-light transition-colors border-b border-glass-border last:border-b-0"
                    >
                      <p className="font-medium text-neutral-900">{customer.full_name}</p>
                      <p className="text-small text-neutral-600">
                        {customer.phone} {customer.email && `• ${customer.email}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Walk-in customer fields */}
            {!selectedCustomer && (
              <>
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Customer Name (Walk-in)
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-small font-medium text-neutral-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-small font-medium text-neutral-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="glass-card p-6">
          <h2 className="text-h3 font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Appointment Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Appointment Type *
              </label>
              <select
                value={formData.appointment_type_id}
                onChange={(e) => handleTypeChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select type</option>
                {appointmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name} ({type.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Deposit Amount (AED)
              </label>
              <input
                type="number"
                value={formData.deposit_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: parseFloat(e.target.value) }))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Special requests, preferences, etc."
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Internal Notes (Staff Only)
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                rows={2}
                placeholder="Internal notes not visible to customers"
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-card p-6 flex items-center justify-between">
          <Link
            href="/dashboard/appointments"
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
