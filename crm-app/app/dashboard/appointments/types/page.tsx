'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { AppointmentType } from '@/types/database';

export default function AppointmentTypesPage() {
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<Partial<AppointmentType> | null>(null);
  const [isNewType, setIsNewType] = useState(false);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setTypes(data || []);
    } catch (error) {
      console.error('Error loading types:', error);
      setError('Failed to load appointment types');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!editingType) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      if (isNewType) {
        const { error } = await supabase
          .from('appointment_types')
          .insert({
            ...editingType,
            organization_id: profile.organization_id
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointment_types')
          .update(editingType)
          .eq('id', editingType.id);

        if (error) throw error;
      }

      await loadTypes();
      setEditingType(null);
      setIsNewType(false);
    } catch (error: any) {
      console.error('Error saving type:', error);
      setError(error.message || 'Failed to save appointment type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment type?')) return;

    try {
      const { error } = await supabase
        .from('appointment_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      setError('Failed to delete appointment type');
    }
  };

  const handleNew = () => {
    setEditingType({
      type_name: '',
      description: '',
      duration_minutes: 60,
      color_code: '#3B82F6',
      icon: 'calendar',
      price: 0,
      deposit_required: false,
      requires_customer: true,
      requires_staff: true,
      requires_resources: [],
      skill_requirements: [],
      is_active: true,
      sort_order: types.length
    });
    setIsNewType(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/appointments"
              className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-h2 font-bold text-neutral-900">Appointment Types</h1>
              <p className="text-body text-neutral-700 mt-1">
                Manage services, pricing, and durations
              </p>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Type
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 font-bold text-neutral-900">
                {isNewType ? 'New Appointment Type' : 'Edit Appointment Type'}
              </h2>
              <button
                onClick={() => {
                  setEditingType(null);
                  setIsNewType(false);
                }}
                className="p-2 hover:bg-glass-light rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Type Name *
                  </label>
                  <input
                    type="text"
                    value={editingType.type_name || ''}
                    onChange={(e) => setEditingType(prev => ({ ...prev, type_name: e.target.value }))}
                    placeholder="e.g., Consultation"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={editingType.duration_minutes || 60}
                    onChange={(e) => setEditingType(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    min="15"
                    step="15"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Price (AED)
                  </label>
                  <input
                    type="number"
                    value={editingType.price || 0}
                    onChange={(e) => setEditingType(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Color Code
                  </label>
                  <input
                    type="color"
                    value={editingType.color_code || '#3B82F6'}
                    onChange={(e) => setEditingType(prev => ({ ...prev, color_code: e.target.value }))}
                    className="w-full h-10 px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingType.description || ''}
                  onChange={(e) => setEditingType(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of this appointment type"
                  className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingType.is_active || false}
                    onChange={(e) => setEditingType(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-glass-border focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-small text-neutral-700">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deposit_required"
                    checked={editingType.deposit_required || false}
                    onChange={(e) => setEditingType(prev => ({ ...prev, deposit_required: e.target.checked }))}
                    className="rounded border-glass-border focus:ring-primary-500"
                  />
                  <label htmlFor="deposit_required" className="text-small text-neutral-700">
                    Require Deposit
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires_customer"
                    checked={editingType.requires_customer !== false}
                    onChange={(e) => setEditingType(prev => ({ ...prev, requires_customer: e.target.checked }))}
                    className="rounded border-glass-border focus:ring-primary-500"
                  />
                  <label htmlFor="requires_customer" className="text-small text-neutral-700">
                    Requires Customer
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires_staff"
                    checked={editingType.requires_staff !== false}
                    onChange={(e) => setEditingType(prev => ({ ...prev, requires_staff: e.target.checked }))}
                    className="rounded border-glass-border focus:ring-primary-500"
                  />
                  <label htmlFor="requires_staff" className="text-small text-neutral-700">
                    Requires Staff Assignment
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-glass-border">
                <button
                  onClick={() => {
                    setEditingType(null);
                    setIsNewType(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Types List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((type) => (
          <div
            key={type.id}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: type.color_code + '20' }}
              >
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: type.color_code }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingType(type);
                    setIsNewType(false);
                  }}
                  className="p-2 hover:bg-glass-light rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-neutral-600" />
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="p-2 hover:bg-glass-light rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-neutral-900 mb-1">{type.type_name}</h3>
            <p className="text-small text-neutral-600 mb-3 line-clamp-2">{type.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-small">
                <span className="text-neutral-600">Duration:</span>
                <span className="font-medium text-neutral-900">{type.duration_minutes} min</span>
              </div>
              <div className="flex items-center justify-between text-small">
                <span className="text-neutral-600">Price:</span>
                <span className="font-medium text-neutral-900">AED {type.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-small">
                <span className="text-neutral-600">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-tiny font-medium ${
                  type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {types.length === 0 && (
          <div className="col-span-full text-center py-12 text-neutral-500">
            <p>No appointment types yet</p>
            <button
              onClick={handleNew}
              className="text-primary-600 hover:text-primary-700 text-small mt-2"
            >
              Create your first appointment type
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
