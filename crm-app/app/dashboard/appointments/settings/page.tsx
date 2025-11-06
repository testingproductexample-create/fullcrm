'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Clock, Calendar, Bell, DollarSign, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppointmentSettings } from '@/types/database';

export default function AppointmentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<Partial<AppointmentSettings>>({
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    working_hours_start: '09:00',
    working_hours_end: '20:00',
    slot_duration_minutes: 60,
    buffer_time_minutes: 15,
    advance_booking_days: 30,
    min_booking_notice_hours: 24,
    max_appointments_per_slot: 3,
    allow_customer_booking: true,
    require_deposit: false,
    deposit_percentage: 20,
    cancellation_hours_notice: 24,
    timezone: 'Asia/Dubai',
    currency: 'AED'
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error: upsertError } = await supabase
        .from('appointment_settings')
        .upsert({
          ...settings,
          organization_id: profile.organization_id
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days?.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...(prev.working_days || []), day]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-h2 font-bold text-neutral-900">Appointment Settings</h1>
            <p className="text-body text-neutral-700 mt-1">
              Configure working hours, booking rules, and reminders
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="glass-card p-4 border-l-4 border-green-500 bg-green-50">
          <p className="text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {/* Working Hours */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Working Hours
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    settings.working_days?.includes(day)
                      ? 'bg-primary-600 text-white'
                      : 'bg-glass-light text-neutral-700 hover:bg-glass-border'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={settings.working_hours_start || '09:00'}
                onChange={(e) => setSettings(prev => ({ ...prev, working_hours_start: e.target.value }))}
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={settings.working_hours_end || '20:00'}
                onChange={(e) => setSettings(prev => ({ ...prev, working_hours_end: e.target.value }))}
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Configuration */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Booking Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Slot Duration (minutes)
            </label>
            <input
              type="number"
              value={settings.slot_duration_minutes || 60}
              onChange={(e) => setSettings(prev => ({ ...prev, slot_duration_minutes: parseInt(e.target.value) }))}
              min="15"
              step="15"
              className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Buffer Time (minutes)
            </label>
            <input
              type="number"
              value={settings.buffer_time_minutes || 15}
              onChange={(e) => setSettings(prev => ({ ...prev, buffer_time_minutes: parseInt(e.target.value) }))}
              min="0"
              step="5"
              className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Advance Booking (days)
            </label>
            <input
              type="number"
              value={settings.advance_booking_days || 30}
              onChange={(e) => setSettings(prev => ({ ...prev, advance_booking_days: parseInt(e.target.value) }))}
              min="1"
              className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Min Notice (hours)
            </label>
            <input
              type="number"
              value={settings.min_booking_notice_hours || 24}
              onChange={(e) => setSettings(prev => ({ ...prev, min_booking_notice_hours: parseInt(e.target.value) }))}
              min="1"
              className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Max Appointments Per Slot
            </label>
            <input
              type="number"
              value={settings.max_appointments_per_slot || 3}
              onChange={(e) => setSettings(prev => ({ ...prev, max_appointments_per_slot: parseInt(e.target.value) }))}
              min="1"
              className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-small font-medium text-neutral-700 mb-2">
              Cancellation Notice (hours)
            </label>
            <input
              type="number"
              value={settings.cancellation_hours_notice || 24}
              onChange={(e) => setSettings(prev => ({ ...prev, cancellation_hours_notice: parseInt(e.target.value) }))}
              min="1"
              className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="allow_customer_booking"
            checked={settings.allow_customer_booking || false}
            onChange={(e) => setSettings(prev => ({ ...prev, allow_customer_booking: e.target.checked }))}
            className="rounded border-glass-border focus:ring-primary-500"
          />
          <label htmlFor="allow_customer_booking" className="text-small text-neutral-700">
            Allow customer self-booking (online)
          </label>
        </div>
      </div>

      {/* Deposit Settings */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Deposit Settings
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_deposit"
              checked={settings.require_deposit || false}
              onChange={(e) => setSettings(prev => ({ ...prev, require_deposit: e.target.checked }))}
              className="rounded border-glass-border focus:ring-primary-500"
            />
            <label htmlFor="require_deposit" className="text-small text-neutral-700">
              Require deposit for appointments
            </label>
          </div>

          {settings.require_deposit && (
            <div>
              <label className="block text-small font-medium text-neutral-700 mb-2">
                Deposit Percentage (%)
              </label>
              <input
                type="number"
                value={settings.deposit_percentage || 20}
                onChange={(e) => setSettings(prev => ({ ...prev, deposit_percentage: parseFloat(e.target.value) }))}
                min="0"
                max="100"
                step="5"
                className="w-full px-3 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="glass-card p-6 flex items-center justify-between">
        <Link
          href="/dashboard/appointments"
          className="btn-secondary"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
