'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Save,
  RefreshCw,
  Bell,
  Shield,
  Database,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Target,
  BarChart3,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface InventorySettings {
  // Stock Management
  default_reorder_point: number;
  low_stock_threshold: number;
  critical_stock_threshold: number;
  auto_reorder_enabled: boolean;
  
  // Quality Control
  default_quality_standards: string[];
  inspection_frequency_days: number;
  quality_pass_threshold: number;
  mandatory_inspection_types: string[];
  
  // Financial
  default_currency: string;
  tax_rate_percentage: number;
  bulk_discount_threshold: number;
  payment_terms_days: number;
  
  // Notifications
  low_stock_notifications: boolean;
  quality_alert_notifications: boolean;
  purchase_order_notifications: boolean;
  supplier_rating_notifications: boolean;
  
  // System
  data_retention_days: number;
  backup_frequency_hours: number;
  audit_log_enabled: boolean;
  multi_location_enabled: boolean;
}

interface NotificationRule {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'system';
  trigger: string;
  recipients: string[];
  enabled: boolean;
}

interface QualityStandard {
  id: string;
  name: string;
  description: string;
  parameters: string[];
  pass_criteria: string;
  mandatory: boolean;
}

export default function InventorySettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: async () => {
      // In a real app, this would fetch from a settings table
      // For now, return default settings
      return {
        // Stock Management
        default_reorder_point: 100,
        low_stock_threshold: 50,
        critical_stock_threshold: 25,
        auto_reorder_enabled: false,
        
        // Quality Control
        default_quality_standards: ['Fabric Strength', 'Color Fastness', 'Shrinkage Test'],
        inspection_frequency_days: 30,
        quality_pass_threshold: 85,
        mandatory_inspection_types: ['Incoming Inspection'],
        
        // Financial
        default_currency: 'AED',
        tax_rate_percentage: 5,
        bulk_discount_threshold: 10000,
        payment_terms_days: 30,
        
        // Notifications
        low_stock_notifications: true,
        quality_alert_notifications: true,
        purchase_order_notifications: true,
        supplier_rating_notifications: false,
        
        // System
        data_retention_days: 365,
        backup_frequency_hours: 24,
        audit_log_enabled: true,
        multi_location_enabled: true,
      } as InventorySettings;
    }
  });

  const [formData, setFormData] = useState<InventorySettings | null>(null);

  // Initialize form data when settings are loaded
  if (settings && !formData) {
    setFormData(settings);
  }

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: InventorySettings) => {
      // In a real app, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-settings'] });
    }
  });

  const handleSave = async () => {
    if (!formData) return;
    
    setSaving(true);
    try {
      await saveSettingsMutation.mutateAsync(formData);
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof InventorySettings, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'stock', label: 'Stock Management', icon: Package },
    { id: 'quality', label: 'Quality Control', icon: Shield },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database },
  ];

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading inventory settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Inventory Settings
              </h1>
              <p className="text-slate-600 mt-1">
                Configure inventory management system preferences and policies
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 inline mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'text-slate-700 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">General Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Royal Tailoring House"
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Default Currency
                        </label>
                        <select
                          value={formData.default_currency}
                          onChange={(e) => handleInputChange('default_currency', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Business Hours
                        </label>
                        <input
                          type="text"
                          defaultValue="8:00 AM - 6:00 PM"
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Time Zone
                        </label>
                        <select className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                          <option value="Asia/Abu_Dhabi">Asia/Abu Dhabi (UTC+4)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Management Settings */}
              {activeTab === 'stock' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Management</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Default Reorder Point (meters)
                        </label>
                        <input
                          type="number"
                          value={formData.default_reorder_point}
                          onChange={(e) => handleInputChange('default_reorder_point', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Low Stock Threshold (meters)
                        </label>
                        <input
                          type="number"
                          value={formData.low_stock_threshold}
                          onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Critical Stock Threshold (meters)
                        </label>
                        <input
                          type="number"
                          value={formData.critical_stock_threshold}
                          onChange={(e) => handleInputChange('critical_stock_threshold', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="autoReorder"
                          checked={formData.auto_reorder_enabled}
                          onChange={(e) => handleInputChange('auto_reorder_enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="autoReorder" className="text-sm font-medium text-slate-700">
                          Enable Automatic Reordering
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Stock Level Guidelines</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Critical threshold should be lower than low stock threshold. When auto-reordering is enabled, 
                            purchase orders will be automatically created when stock falls below the reorder point.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Control Settings */}
              {activeTab === 'quality' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quality Control</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Inspection Frequency (days)
                        </label>
                        <input
                          type="number"
                          value={formData.inspection_frequency_days}
                          onChange={(e) => handleInputChange('inspection_frequency_days', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Quality Pass Threshold (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.quality_pass_threshold}
                          onChange={(e) => handleInputChange('quality_pass_threshold', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Default Quality Standards
                      </label>
                      <div className="space-y-2">
                        {formData.default_quality_standards.map((standard, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-slate-700">{standard}</span>
                            <button className="ml-auto p-1 text-slate-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Settings */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.tax_rate_percentage}
                          onChange={(e) => handleInputChange('tax_rate_percentage', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bulk Discount Threshold (AED)
                        </label>
                        <input
                          type="number"
                          value={formData.bulk_discount_threshold}
                          onChange={(e) => handleInputChange('bulk_discount_threshold', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Default Payment Terms (days)
                        </label>
                        <input
                          type="number"
                          value={formData.payment_terms_days}
                          onChange={(e) => handleInputChange('payment_terms_days', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Currency Exchange Update
                        </label>
                        <select className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">Low Stock Alerts</p>
                          <p className="text-sm text-slate-600">Get notified when inventory drops below threshold</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.low_stock_notifications}
                          onChange={(e) => handleInputChange('low_stock_notifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">Quality Alerts</p>
                          <p className="text-sm text-slate-600">Get notified about quality inspection failures</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.quality_alert_notifications}
                          onChange={(e) => handleInputChange('quality_alert_notifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">Purchase Order Updates</p>
                          <p className="text-sm text-slate-600">Get notified about PO status changes</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.purchase_order_notifications}
                          onChange={(e) => handleInputChange('purchase_order_notifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">Supplier Rating Changes</p>
                          <p className="text-sm text-slate-600">Get notified about supplier performance updates</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.supplier_rating_notifications}
                          onChange={(e) => handleInputChange('supplier_rating_notifications', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Settings */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">System Configuration</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Data Retention (days)
                        </label>
                        <input
                          type="number"
                          value={formData.data_retention_days}
                          onChange={(e) => handleInputChange('data_retention_days', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Backup Frequency (hours)
                        </label>
                        <input
                          type="number"
                          value={formData.backup_frequency_hours}
                          onChange={(e) => handleInputChange('backup_frequency_hours', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-white/30 bg-white/50 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">Audit Logging</p>
                          <p className="text-sm text-slate-600">Track all system changes and user actions</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.audit_log_enabled}
                          onChange={(e) => handleInputChange('audit_log_enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">Multi-Location Support</p>
                          <p className="text-sm text-slate-600">Enable inventory tracking across multiple locations</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.multi_location_enabled}
                          onChange={(e) => handleInputChange('multi_location_enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}