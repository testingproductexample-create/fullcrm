'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { StaffAvailability, BusinessLocation } from '@/types/database';
import { CalendarIcon, PlusIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function StaffAvailabilityPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    location_id: '',
    availability_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    max_concurrent_appointments: 2,
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLocations();
      fetchAvailability();
    }
  }, [profile?.organization_id, selectedDate]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('business_locations')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)
        .order('location_name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_availability')
        .select('*, business_locations(location_name)')
        .eq('organization_id', profile?.organization_id)
        .eq('staff_id', user?.id)
        .gte('availability_date', selectedDate)
        .lte('availability_date', new Date(new Date(selectedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('availability_date')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error: any) {
      showToast('Failed to load availability', 'error');
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('staff_availability')
        .insert([{
          ...formData,
          organization_id: profile?.organization_id,
          staff_id: user?.id,
          status: 'available',
          current_bookings_count: 0
        }]);

      if (error) throw error;
      showToast('Availability added successfully', 'success');
      resetForm();
      fetchAvailability();
    } catch (error: any) {
      showToast(error.message || 'Failed to save availability', 'error');
      console.error('Error saving availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability?')) return;

    try {
      const { error} = await supabase
        .from('staff_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Availability deleted successfully', 'success');
      fetchAvailability();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete availability', 'error');
      console.error('Error deleting availability:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      location_id: '',
      availability_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
      max_concurrent_appointments: 2,
      notes: ''
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateString).getDay()];
  };

  if (loading && availability.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading availability...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Availability</h1>
          <p className="text-gray-400 mt-1">Manage your working hours and appointment capacity</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Availability
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300">Week Starting:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add Availability</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-gray-800">All Locations</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id} className="bg-gray-800">
                      {location.location_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.availability_date}
                  onChange={(e) => setFormData({ ...formData, availability_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
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
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Availability'}
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

      <div className="space-y-4">
        {availability.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No availability set</h3>
            <p className="text-gray-400 mb-4">Add your working hours to start accepting appointments</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Availability
            </button>
          </div>
        ) : (
          availability.map(avail => (
            <div
              key={avail.id}
              className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {getDayOfWeek(avail.availability_date)}, {new Date(avail.availability_date).toLocaleDateString('en-GB')}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        avail.status === 'available'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {avail.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                      {' • '}
                      Max {avail.max_concurrent_appointments} concurrent
                      {' • '}
                      {avail.current_bookings_count} / {avail.max_concurrent_appointments} booked
                    </p>
                    {avail.notes && (
                      <p className="text-sm text-gray-500 mt-1">{avail.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(avail.id)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
