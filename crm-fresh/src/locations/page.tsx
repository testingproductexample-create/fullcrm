'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { BusinessLocation } from '@/types/database';
import { MapPinIcon, PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function LocationsManagementPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);
  const [formData, setFormData] = useState({
    location_code: '',
    location_name: '',
    location_type: 'branch',
    address_line1: '',
    address_line2: '',
    city: '',
    emirate: '',
    country: 'UAE',
    postal_code: '',
    phone_number: '',
    email: '',
    max_concurrent_appointments: 10,
    amenities: [] as string[],
    specializations: [] as string[],
    parking_available: true,
    wheelchair_accessible: true,
    prayer_breaks_enabled: true,
    prayer_break_duration: 15,
    is_active: true,
    is_primary: false,
    notes: ''
  });

  const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
  const availableAmenities = ['WiFi', 'Waiting Area', 'Refreshments', 'Prayer Room', 'Parking', 'Wheelchair Access'];
  const availableSpecializations = ['Bespoke Tailoring', 'Wedding Attire', 'Traditional Wear', 'Corporate Uniforms', 'Casual Wear', 'Alterations'];

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLocations();
    }
  }, [profile?.organization_id]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('business_locations')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('is_primary', { ascending: false })
        .order('location_name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      showToast('Failed to load locations', 'error');
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('business_locations')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLocation.id);

        if (error) throw error;
        showToast('Location updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('business_locations')
          .insert([{
            ...formData,
            organization_id: profile?.organization_id
          }]);

        if (error) throw error;
        showToast('Location created successfully', 'success');
      }

      resetForm();
      fetchLocations();
    } catch (error: any) {
      showToast(error.message || 'Failed to save location', 'error');
      console.error('Error saving location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const { error } = await supabase
        .from('business_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Location deleted successfully', 'success');
      fetchLocations();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete location', 'error');
      console.error('Error deleting location:', error);
    }
  };

  const handleEdit = (location: BusinessLocation) => {
    setEditingLocation(location);
    setFormData({
      location_code: location.location_code,
      location_name: location.location_name,
      location_type: location.location_type,
      address_line1: location.address_line1 || '',
      address_line2: location.address_line2 || '',
      city: location.city || '',
      emirate: location.emirate || '',
      country: location.country || 'UAE',
      postal_code: location.postal_code || '',
      phone_number: location.phone_number || '',
      email: location.email || '',
      max_concurrent_appointments: location.max_concurrent_appointments,
      amenities: location.amenities || [],
      specializations: location.specializations || [],
      parking_available: location.parking_available,
      wheelchair_accessible: location.wheelchair_accessible,
      prayer_breaks_enabled: location.prayer_breaks_enabled,
      prayer_break_duration: location.prayer_break_duration,
      is_active: location.is_active,
      is_primary: location.is_primary,
      notes: location.notes || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({
      location_code: '',
      location_name: '',
      location_type: 'branch',
      address_line1: '',
      address_line2: '',
      city: '',
      emirate: '',
      country: 'UAE',
      postal_code: '',
      phone_number: '',
      email: '',
      max_concurrent_appointments: 10,
      amenities: [],
      specializations: [],
      parking_available: true,
      wheelchair_accessible: true,
      prayer_breaks_enabled: true,
      prayer_break_duration: 15,
      is_active: true,
      is_primary: false,
      notes: ''
    });
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Locations</h1>
          <p className="text-gray-400 mt-1">Manage your branches across UAE</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Location
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingLocation ? 'Edit Location' : 'Add New Location'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location Code
                </label>
                <input
                  type="text"
                  value={formData.location_code}
                  onChange={(e) => setFormData({ ...formData, location_code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="DXB-01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location Name
                </label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Dubai Main Branch"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Shop 12, Al Barsha Mall"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Al Barsha 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Dubai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emirate
                </label>
                <select
                  value={formData.emirate}
                  onChange={(e) => setFormData({ ...formData, emirate: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Emirate</option>
                  {emirates.map(emirate => (
                    <option key={emirate} value={emirate} className="bg-gray-800">{emirate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="+971-4-123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="location@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Concurrent Appointments
                </label>
                <input
                  type="number"
                  value={formData.max_concurrent_appointments}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_appointments: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prayer Break Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.prayer_break_duration}
                  onChange={(e) => setFormData({ ...formData, prayer_break_duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="10"
                  max="30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {availableAmenities.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      amenities: toggleArrayItem(formData.amenities, amenity)
                    })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      formData.amenities.includes(amenity)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specializations
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSpecializations.map(specialization => (
                  <button
                    key={specialization}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      specializations: toggleArrayItem(formData.specializations, specialization)
                    })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      formData.specializations.includes(specialization)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {specialization}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Primary Location</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.parking_available}
                  onChange={(e) => setFormData({ ...formData, parking_available: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Parking Available</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wheelchair_accessible}
                  onChange={(e) => setFormData({ ...formData, wheelchair_accessible: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Wheelchair Accessible</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.prayer_breaks_enabled}
                  onChange={(e) => setFormData({ ...formData, prayer_breaks_enabled: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Prayer Breaks Enabled</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Additional notes about this location..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(location => (
          <div
            key={location.id}
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{location.location_name}</h3>
                  <p className="text-sm text-gray-400">{location.location_code}</p>
                </div>
              </div>
              {location.is_primary && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
                  Primary
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-300">
                {location.address_line1}
                {location.address_line2 && `, ${location.address_line2}`}
              </p>
              <p className="text-sm text-gray-300">
                {location.city}, {location.emirate}
              </p>
              <p className="text-sm text-gray-400">
                {location.phone_number}
              </p>
              <p className="text-sm text-gray-400">
                {location.email}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                location.is_active
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {location.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                Max {location.max_concurrent_appointments} concurrent
              </span>
            </div>

            {location.amenities && location.amenities.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-1">
                  {location.amenities.slice(0, 3).map(amenity => (
                    <span key={amenity} className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded">
                      {amenity}
                    </span>
                  ))}
                  {location.amenities.length > 3 && (
                    <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded">
                      +{location.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => handleEdit(location)}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              {profile?.role === 'owner' && !location.is_primary && (
                <button
                  onClick={() => handleDelete(location.id)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
          <MapPinIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No locations yet</h3>
          <p className="text-gray-400 mb-4">Add your first business location to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Location
          </button>
        </div>
      )}
    </div>
  );
}
