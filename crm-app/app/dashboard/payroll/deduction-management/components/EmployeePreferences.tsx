'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  User,
  Save,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2
} from 'lucide-react';
import { EmployeeDeductionPreference } from '../types/deduction.types';

interface EmployeePreferencesProps {
  employeeId?: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  job_title: string;
  status: string;
}

export default function EmployeePreferences({ employeeId }: EmployeePreferencesProps) {
  const [preferences, setPreferences] = useState<EmployeeDeductionPreference[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [formData, setFormData] = useState({
    auto_deductions: true,
    tax_rate_percentage: 0,
    insurance_deductions: true,
    loan_deductions: true,
    other_deductions: true,
    preferred_deduction_day: 25,
    custom_deductions: [] as Array<{
      category: string;
      amount: number;
      description: string;
    }>
  });

  useEffect(() => {
    loadPreferences();
    loadEmployees();
  }, [employeeId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('employee_deduction_preferences')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error: preferencesError } = await query;

      if (preferencesError) throw preferencesError;

      setPreferences(data || []);
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title, employment_status')
        .eq('employment_status', 'active')
        .order('first_name');

      if (error) throw error;

      const employeeOptions = data?.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        job_title: emp.job_title,
        status: emp.employment_status
      })) || [];

      setEmployees(employeeOptions);
    } catch (error: any) {
      console.error('Error loading employees:', error);
    }
  };

  const getEmployeeWithoutPreference = () => {
    const employeesWithPreferences = preferences.map(p => p.employee_id);
    return employees.filter(emp => !employeesWithPreferences.includes(emp.id));
  };

  const handleSave = async (preference: EmployeeDeductionPreference) => {
    try {
      const { error } = await supabase
        .from('employee_deduction_preferences')
        .update({
          auto_deductions: preference.auto_deductions,
          tax_rate_percentage: preference.tax_rate_percentage,
          insurance_deductions: preference.insurance_deductions,
          loan_deductions: preference.loan_deductions,
          other_deductions: preference.other_deductions,
          preferred_deduction_day: preference.preferred_deduction_day,
          custom_deductions: preference.custom_deductions
        })
        .eq('id', preference.id);

      if (error) throw error;

      await loadPreferences();
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving preference:', error);
      setError(error.message);
    }
  };

  const handleAdd = async () => {
    try {
      if (!selectedEmployee) {
        setError('Please select an employee');
        return;
      }

      const { error } = await supabase
        .from('employee_deduction_preferences')
        .insert([{
          employee_id: selectedEmployee,
          ...formData
        }]);

      if (error) throw error;

      await loadPreferences();
      setShowAddForm(false);
      setSelectedEmployee('');
      setFormData({
        auto_deductions: true,
        tax_rate_percentage: 0,
        insurance_deductions: true,
        loan_deductions: true,
        other_deductions: true,
        preferred_deduction_day: 25,
        custom_deductions: []
      });
    } catch (error: any) {
      console.error('Error adding preference:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (preferenceId: string) => {
    if (!confirm('Are you sure you want to delete these preferences?')) return;

    try {
      const { error } = await supabase
        .from('employee_deduction_preferences')
        .delete()
        .eq('id', preferenceId);

      if (error) throw error;

      await loadPreferences();
    } catch (error: any) {
      console.error('Error deleting preference:', error);
      setError(error.message);
    }
  };

  const addCustomDeduction = () => {
    setFormData(prev => ({
      ...prev,
      custom_deductions: [
        ...prev.custom_deductions,
        { category: 'other', amount: 0, description: '' }
      ]
    }));
  };

  const updateCustomDeduction = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_deductions: prev.custom_deductions.map((ded, i) => 
        i === index ? { ...ded, [field]: value } : ded
      )
    }));
  };

  const removeCustomDeduction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_deductions: prev.custom_deductions.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getToggleIcon = (enabled: boolean) => {
    return enabled ? (
      <ToggleRight className="h-5 w-5 text-green-600" />
    ) : (
      <ToggleLeft className="h-5 w-5 text-gray-400" />
    );
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-red-200">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Employee Deduction Preferences</h3>
          <p className="text-sm text-gray-600">Configure automatic deduction preferences for employees</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {getEmployeeWithoutPreference().length} employees without preferences
          </span>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Preferences</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">Add Employee Preferences</h4>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Employee</option>
                {getEmployeeWithoutPreference().map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.job_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Deduction Day</label>
              <select
                value={formData.preferred_deduction_day}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_deduction_day: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_rate_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_rate_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">UAE typically 0%</p>
            </div>
          </div>

          {/* Deduction Type Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Auto Deductions</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, auto_deductions: !prev.auto_deductions }))}
                className="p-1"
              >
                {getToggleIcon(formData.auto_deductions)}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Insurance</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, insurance_deductions: !prev.insurance_deductions }))}
                className="p-1"
              >
                {getToggleIcon(formData.insurance_deductions)}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Loans</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, loan_deductions: !prev.loan_deductions }))}
                className="p-1"
              >
                {getToggleIcon(formData.loan_deductions)}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Other</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, other_deductions: !prev.other_deductions }))}
                className="p-1"
              >
                {getToggleIcon(formData.other_deductions)}
              </button>
            </div>
          </div>

          {/* Custom Deductions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Custom Deductions</label>
              <button
                onClick={addCustomDeduction}
                className="flex items-center space-x-1 px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>
            {formData.custom_deductions.map((deduction, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Category"
                  value={deduction.category}
                  onChange={(e) => updateCustomDeduction(index, 'category', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount (AED)"
                  value={deduction.amount}
                  onChange={(e) => updateCustomDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    placeholder="Description"
                    value={deduction.description}
                    onChange={(e) => updateCustomDeduction(index, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => removeCustomDeduction(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Save Preferences
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preferences List */}
      <div className="space-y-4">
        {preferences.length > 0 ? (
          preferences.map((preference) => {
            const isEditing = editingId === preference.id;
            const employee = preference.employee;

            return (
              <div key={preference.id} className="glass-card p-6 border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {employee?.first_name} {employee?.last_name}
                        </h4>
                        <span className="text-sm text-gray-600">{employee?.job_title}</span>
                        {preference.auto_deductions ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Auto
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Manual
                          </span>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={preference.tax_rate_percentage}
                              onChange={(e) => setPreferences(prev => prev.map(p => 
                                p.id === preference.id 
                                  ? { ...p, tax_rate_percentage: parseFloat(e.target.value) || 0 }
                                  : p
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deduction Day</label>
                            <select
                              value={preference.preferred_deduction_day}
                              onChange={(e) => setPreferences(prev => prev.map(p => 
                                p.id === preference.id 
                                  ? { ...p, preferred_deduction_day: parseInt(e.target.value) }
                                  : p
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-6 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Tax Rate</p>
                            <p className="text-lg font-semibold text-gray-900">{preference.tax_rate_percentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Deduction Day</p>
                            <p className="text-lg font-semibold text-gray-900">{preference.preferred_deduction_day}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Insurance</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {preference.insurance_deductions ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Loans</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {preference.loan_deductions ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Deduction Type Status */}
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                          preference.insurance_deductions ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getToggleIcon(preference.insurance_deductions)}
                          <span className="text-sm font-medium">Insurance</span>
                        </div>
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                          preference.loan_deductions ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getToggleIcon(preference.loan_deductions)}
                          <span className="text-sm font-medium">Loans</span>
                        </div>
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                          preference.other_deductions ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getToggleIcon(preference.other_deductions)}
                          <span className="text-sm font-medium">Other</span>
                        </div>
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                          preference.auto_deductions ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getToggleIcon(preference.auto_deductions)}
                          <span className="text-sm font-medium">Auto</span>
                        </div>
                      </div>

                      {preference.custom_deductions && preference.custom_deductions.length > 0 && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Custom Deductions:</p>
                          <div className="space-y-1">
                            {preference.custom_deductions.map((custom, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 capitalize">{custom.category}:</span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(custom.amount)} - {custom.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-sm text-gray-500">
                        <span>Created: {new Date(preference.created_at).toLocaleDateString('en-AE')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(preference)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(preference.id)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(preference.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No employee preferences configured</p>
            <p className="text-sm">Set up automatic deduction preferences for employees</p>
          </div>
        )}
      </div>
    </div>
  );
}