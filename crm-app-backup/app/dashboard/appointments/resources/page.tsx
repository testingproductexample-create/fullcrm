'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, ArrowLeft, Save, X, Package, AlertCircle, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { AppointmentResource } from '@/types/database';

export default function ResourcesPage() {
  const [resources, setResources] = useState<AppointmentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<Partial<AppointmentResource> | null>(null);
  const [isNewResource, setIsNewResource] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const resourceTypes = [
    { value: 'fitting_room', label: 'Fitting Room' },
    { value: 'sewing_machine', label: 'Sewing Machine' },
    { value: 'embroidery_machine', label: 'Embroidery Machine' },
    { value: 'consultation_room', label: 'Consultation Room' },
    { value: 'cutting_table', label: 'Cutting Table' },
    { value: 'pressing_equipment', label: 'Pressing Equipment' },
    { value: 'measurement_area', label: 'Measurement Area' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_resources')
        .select('*')
        .order('resource_type')
        .order('resource_name');

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!editingResource) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      if (isNewResource) {
        const { error } = await supabase
          .from('appointment_resources')
          .insert({
            ...editingResource,
            organization_id: profile.organization_id
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointment_resources')
          .update(editingResource)
          .eq('id', editingResource.id);

        if (error) throw error;
      }

      await loadResources();
      setEditingResource(null);
      setIsNewResource(false);
    } catch (error: any) {
      console.error('Error saving resource:', error);
      setError(error.message || 'Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('appointment_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      setError('Failed to delete resource');
    }
  };

  const handleNew = () => {
    setEditingResource({
      resource_name: '',
      resource_type: 'fitting_room',
      description: '',
      location: '',
      capacity: 1,
      is_available: true,
      status: 'available',
      booking_priority: 5,
      maintenance_schedule: {},
      metadata: {}
    });
    setIsNewResource(true);
  };

  const toggleStatus = async (resource: AppointmentResource) => {
    try {
      const newStatus = resource.is_available ? 'out_of_service' : 'available';
      const { error } = await supabase
        .from('appointment_resources')
        .update({
          is_available: !resource.is_available,
          status: newStatus
        })
        .eq('id', resource.id);

      if (error) throw error;
      await loadResources();
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Failed to update resource status');
    }
  };

  const filteredResources = filterType === 'all' 
    ? resources 
    : resources.filter(r => r.resource_type === filterType);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_use':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'maintenance':
        return <SettingsIcon className="w-5 h-5 text-orange-600" />;
      case 'out_of_service':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'out_of_service':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-h2 font-bold text-neutral-900">Resources</h1>
              <p className="text-body text-neutral-700 mt-1">
                Manage rooms, equipment, and machines
              </p>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Resource
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filter */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-small whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-glass-light text-neutral-700 hover:bg-glass-border'
            }`}
          >
            All ({resources.length})
          </button>
          {resourceTypes.map((type) => {
            const count = resources.filter(r => r.resource_type === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-4 py-2 rounded-lg text-small whitespace-nowrap transition-colors ${
                  filterType === type.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-glass-light text-neutral-700 hover:bg-glass-border'
                }`}
              >
                {type.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 font-bold text-neutral-900">
                {isNewResource ? 'New Resource' : 'Edit Resource'}
              </h2>
              <button
                onClick={() => {
                  setEditingResource(null);
                  setIsNewResource(false);
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
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    value={editingResource.resource_name || ''}
                    onChange={(e) => setEditingResource(prev => ({ ...prev, resource_name: e.target.value }))}
                    placeholder="e.g., Fitting Room 1"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={editingResource.resource_type || 'fitting_room'}
                    onChange={(e) => setEditingResource(prev => ({ ...prev, resource_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {resourceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingResource.location || ''}
                    onChange={(e) => setEditingResource(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Ground Floor"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={editingResource.capacity || 1}
                    onChange={(e) => setEditingResource(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    min="1"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingResource.status || 'available'}
                    onChange={(e) => setEditingResource(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Booking Priority (1-10)
                  </label>
                  <input
                    type="number"
                    value={editingResource.booking_priority || 5}
                    onChange={(e) => setEditingResource(prev => ({ ...prev, booking_priority: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingResource.description || ''}
                  onChange={(e) => setEditingResource(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of this resource"
                  className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={editingResource.is_available !== false}
                  onChange={(e) => setEditingResource(prev => ({ ...prev, is_available: e.target.checked }))}
                  className="rounded border-glass-border focus:ring-primary-500"
                />
                <label htmlFor="is_available" className="text-small text-neutral-700">
                  Available for Booking
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-glass-border">
                <button
                  onClick={() => {
                    setEditingResource(null);
                    setIsNewResource(false);
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

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(resource.status)}
                <div>
                  <h3 className="font-bold text-neutral-900">{resource.resource_name}</h3>
                  <p className="text-tiny text-neutral-600">
                    {resourceTypes.find(t => t.value === resource.resource_type)?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingResource(resource);
                    setIsNewResource(false);
                  }}
                  className="p-2 hover:bg-glass-light rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-neutral-600" />
                </button>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="p-2 hover:bg-glass-light rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {resource.description && (
              <p className="text-small text-neutral-600 mb-3 line-clamp-2">{resource.description}</p>
            )}

            <div className="space-y-2">
              {resource.location && (
                <div className="flex items-center justify-between text-small">
                  <span className="text-neutral-600">Location:</span>
                  <span className="font-medium text-neutral-900">{resource.location}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-small">
                <span className="text-neutral-600">Capacity:</span>
                <span className="font-medium text-neutral-900">{resource.capacity}</span>
              </div>
              <div className="flex items-center justify-between text-small">
                <span className="text-neutral-600">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-tiny font-medium ${getStatusColor(resource.status)}`}>
                  {resource.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-glass-border">
              <button
                onClick={() => toggleStatus(resource)}
                className={`w-full py-2 rounded-lg text-small font-medium transition-colors ${
                  resource.is_available
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {resource.is_available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
          </div>
        ))}

        {filteredResources.length === 0 && (
          <div className="col-span-full text-center py-12 text-neutral-500">
            <p>No resources found</p>
            <button
              onClick={handleNew}
              className="text-primary-600 hover:text-primary-700 text-small mt-2"
            >
              Add your first resource
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
