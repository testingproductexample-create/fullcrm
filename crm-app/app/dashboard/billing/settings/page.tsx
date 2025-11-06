'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Building, Mail, FileText, CreditCard, Palette, CheckCircle } from 'lucide-react';
import { InvoiceSettings } from '@/types/database';

export default function BillingSettingsPage() {
  const supabase = createClient();
  
  const [settings, setSettings] = useState<Partial<InvoiceSettings>>({
    company_name: '',
    company_name_arabic: '',
    company_address: '',
    company_address_arabic: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    tax_registration_number: '',
    commercial_registration: '',
    license_number: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_iban: '',
    bank_swift_code: '',
    invoice_prefix: 'INV',
    invoice_start_number: 1001,
    default_payment_terms: 'Due on Receipt',
    default_due_days: 30,
    invoice_email_subject: 'Invoice from {company_name} - {invoice_number}',
    invoice_email_body: 'Dear {customer_name},\n\nPlease find attached invoice {invoice_number} for your recent order.\n\nThank you for your business!',
    payment_reminder_enabled: true,
    reminder_days_before_due: 3,
    reminder_days_after_due: 7,
    header_text: '',
    footer_text: 'Thank you for your business!',
    terms_and_conditions: ''
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error: fetchError } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('organization_id', userData.user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('invoice_settings')
        .select('id')
        .eq('organization_id', userData.user.id)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('invoice_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('invoice_settings')
          .insert({
            organization_id: userData.user.id,
            ...settings
          });

        if (insertError) throw insertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InvoiceSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Invoice Settings</h1>
            <p className="text-purple-200">Configure your billing and invoice preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-lg disabled:opacity-50"
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Company Information */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Company Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Company Name</label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Company Name (Arabic)</label>
              <input
                type="text"
                value={settings.company_name_arabic || ''}
                onChange={(e) => updateField('company_name_arabic', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="أدخل اسم الشركة"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Company Address</label>
              <textarea
                value={settings.company_address || ''}
                onChange={(e) => updateField('company_address', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter company address"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Company Address (Arabic)</label>
              <textarea
                value={settings.company_address_arabic || ''}
                onChange={(e) => updateField('company_address_arabic', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="أدخل عنوان الشركة"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={settings.company_phone || ''}
                onChange={(e) => updateField('company_phone', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+971 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={settings.company_email || ''}
                onChange={(e) => updateField('company_email', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="info@company.com"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Website</label>
              <input
                type="url"
                value={settings.company_website || ''}
                onChange={(e) => updateField('company_website', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </div>

        {/* Tax & Registration */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tax & Registration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Tax Registration Number (TRN)</label>
              <input
                type="text"
                value={settings.tax_registration_number || ''}
                onChange={(e) => updateField('tax_registration_number', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter TRN"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Commercial Registration</label>
              <input
                type="text"
                value={settings.commercial_registration || ''}
                onChange={(e) => updateField('commercial_registration', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter CR number"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">License Number</label>
              <input
                type="text"
                value={settings.license_number || ''}
                onChange={(e) => updateField('license_number', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter license number"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Bank Name</label>
              <input
                type="text"
                value={settings.bank_name || ''}
                onChange={(e) => updateField('bank_name', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Account Name</label>
              <input
                type="text"
                value={settings.bank_account_name || ''}
                onChange={(e) => updateField('bank_account_name', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter account name"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Account Number</label>
              <input
                type="text"
                value={settings.bank_account_number || ''}
                onChange={(e) => updateField('bank_account_number', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">IBAN</label>
              <input
                type="text"
                value={settings.bank_iban || ''}
                onChange={(e) => updateField('bank_iban', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="AE07 0331 2345 6789 0123 456"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">SWIFT Code</label>
              <input
                type="text"
                value={settings.bank_swift_code || ''}
                onChange={(e) => updateField('bank_swift_code', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter SWIFT code"
              />
            </div>
          </div>
        </div>

        {/* Invoice Configuration */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Invoice Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoice_prefix || 'INV'}
                onChange={(e) => updateField('invoice_prefix', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="INV"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Starting Invoice Number</label>
              <input
                type="number"
                value={settings.invoice_start_number || 1001}
                onChange={(e) => updateField('invoice_start_number', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1001"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Default Payment Terms</label>
              <select
                value={settings.default_payment_terms || 'Due on Receipt'}
                onChange={(e) => updateField('default_payment_terms', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Due on Receipt" className="bg-gray-900">Due on Receipt</option>
                <option value="Net 7" className="bg-gray-900">Net 7</option>
                <option value="Net 15" className="bg-gray-900">Net 15</option>
                <option value="Net 30" className="bg-gray-900">Net 30</option>
                <option value="Net 60" className="bg-gray-900">Net 60</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Default Due Days</label>
              <input
                type="number"
                value={settings.default_due_days || 30}
                onChange={(e) => updateField('default_due_days', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Email Subject</label>
              <input
                type="text"
                value={settings.invoice_email_subject || ''}
                onChange={(e) => updateField('invoice_email_subject', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Invoice from {company_name} - {invoice_number}"
              />
              <p className="text-purple-300 text-sm mt-1">
                Available variables: {'{company_name}, {invoice_number}, {customer_name}'}
              </p>
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Email Body</label>
              <textarea
                value={settings.invoice_email_body || ''}
                onChange={(e) => updateField('invoice_email_body', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Email message body..."
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="payment_reminders"
                checked={settings.payment_reminder_enabled || false}
                onChange={(e) => updateField('payment_reminder_enabled', e.target.checked)}
                className="w-5 h-5 rounded border-white/20 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="payment_reminders" className="text-white font-medium">
                Enable Payment Reminders
              </label>
            </div>
            {settings.payment_reminder_enabled && (
              <div className="grid grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-white font-medium mb-2">Days Before Due</label>
                  <input
                    type="number"
                    value={settings.reminder_days_before_due || 3}
                    onChange={(e) => updateField('reminder_days_before_due', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Days After Due</label>
                  <input
                    type="number"
                    value={settings.reminder_days_after_due || 7}
                    onChange={(e) => updateField('reminder_days_after_due', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="7"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Text */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Invoice Text</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Header Text</label>
              <textarea
                value={settings.header_text || ''}
                onChange={(e) => updateField('header_text', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Text to appear at the top of invoices"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Footer Text</label>
              <textarea
                value={settings.footer_text || ''}
                onChange={(e) => updateField('footer_text', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Text to appear at the bottom of invoices"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Terms & Conditions</label>
              <textarea
                value={settings.terms_and_conditions || ''}
                onChange={(e) => updateField('terms_and_conditions', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your terms and conditions"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg rounded-lg transition-all shadow-lg disabled:opacity-50"
          >
            {saved ? (
              <>
                <CheckCircle className="w-6 h-6" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                {saving ? 'Saving...' : 'Save All Settings'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
