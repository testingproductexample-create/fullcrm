'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Ruler, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface MeasurementField {
  name: string;
  label: string;
  unit: string;
  required: boolean;
  order: number;
  min?: number;
  max?: number;
}

interface MeasurementTemplate {
  id: string;
  garment_type: string;
  template_name: string;
  measurement_fields: {
    fields: MeasurementField[];
  };
}

interface Customer {
  id: string;
  full_name: string;
  customer_code: string;
}

export default function NewMeasurementPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedGarmentType, setSelectedGarmentType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MeasurementTemplate | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [bodyType, setBodyType] = useState('regular');
  const [fitPreference, setFitPreference] = useState('regular');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCustomers();
      fetchTemplates();
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    if (selectedGarmentType && templates.length > 0) {
      const template = templates.find(t => t.garment_type === selectedGarmentType && t.is_default);
      setSelectedTemplate(template || templates.find(t => t.garment_type === selectedGarmentType) || null);
      setMeasurements({});
    }
  }, [selectedGarmentType, templates]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, customer_code')
      .eq('organization_id', profile?.organization_id)
      .eq('status', 'active')
      .order('full_name');

    if (data && !error) {
      setCustomers(data);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('measurement_templates')
      .select('*')
      .eq('organization_id', profile?.organization_id)
      .eq('is_active', true)
      .order('display_order');

    if (data && !error) {
      setTemplates(data);
    }
  };

  const handleMeasurementChange = (fieldName: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === '') {
      setMeasurements(prev => ({
        ...prev,
        [fieldName]: value === '' ? 0 : numValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !selectedGarmentType || !selectedTemplate) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate required measurements
    const requiredFields = selectedTemplate.measurement_fields.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !measurements[f.name] || measurements[f.name] === 0);
    
    if (missingFields.length > 0) {
      addToast(`Please fill in all required measurements: ${missingFields.map(f => f.label).join(', ')}`, 'error');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('customer_measurements')
        .insert({
          organization_id: profile?.organization_id,
          customer_id: selectedCustomer,
          template_id: selectedTemplate.id,
          garment_type: selectedGarmentType,
          measurement_date: new Date().toISOString(),
          measurements: measurements,
          body_type: bodyType,
          fit_preference: fitPreference,
          measured_by: profile?.id,
          notes: notes,
          is_latest: true,
          version_number: 1
        })
        .select()
        .single();

      if (error) throw error;

      addToast('Measurements saved successfully', 'success');
      router.push('/dashboard/measurements');
    } catch (error) {
      console.error('Error saving measurements:', error);
      addToast('Failed to save measurements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const garmentTypes = [
    { value: 'suit', label: 'Suit' },
    { value: 'shirt', label: 'Shirt' },
    { value: 'trouser', label: 'Trouser' },
    { value: 'dress', label: 'Dress' },
    { value: 'thobe', label: 'Thobe/Kandura' },
    { value: 'casual', label: 'Casual Wear' }
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/measurements"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Measurements
        </Link>
        <h1 className="text-3xl font-semibold text-neutral-900 mb-2">New Measurement</h1>
        <p className="text-neutral-600">Record customer measurements for garment creation</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-8 shadow-lg space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a customer</option>
              {filteredCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} ({customer.customer_code})
                </option>
              ))}
            </select>
          </div>

          {/* Garment Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Garment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedGarmentType}
              onChange={(e) => setSelectedGarmentType(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select garment type</option>
              {garmentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Measurements Grid */}
          {selectedTemplate && (
            <>
              <div className="border-t border-neutral-200 pt-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                  <Ruler className="w-5 h-5 mr-2 text-blue-600" />
                  Measurements ({selectedTemplate.template_name})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.measurement_fields.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          {field.label} ({field.unit})
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min={field.min}
                          max={field.max}
                          value={measurements[field.name] || ''}
                          onChange={(e) => handleMeasurementChange(field.name, e.target.value)}
                          required={field.required}
                          placeholder={`${field.min || 0} - ${field.max || 200} ${field.unit}`}
                          className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Body Type & Fit Preference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-200 pt-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Body Type
                  </label>
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="slim">Slim</option>
                    <option value="athletic">Athletic</option>
                    <option value="regular">Regular</option>
                    <option value="plus">Plus Size</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Fit Preference
                  </label>
                  <select
                    value={fitPreference}
                    onChange={(e) => setFitPreference(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="slim">Slim Fit</option>
                    <option value="regular">Regular Fit</option>
                    <option value="relaxed">Relaxed Fit</option>
                    <option value="loose">Loose Fit</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-neutral-200 pt-6">
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Measurement Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any special notes about the measurements, posture, or preferences..."
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 border-t border-neutral-200 pt-6">
            <Link
              href="/dashboard/measurements"
              className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !selectedTemplate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Measurements'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
