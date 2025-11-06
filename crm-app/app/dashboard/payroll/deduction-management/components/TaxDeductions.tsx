'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calculator, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
  Plus,
  DollarSign,
  FileText,
  BarChart3
} from 'lucide-react';
import { TaxDeduction } from '../types/deduction.types';

interface TaxDeductionsProps {
  employeeId?: string;
  month: number;
  year: number;
}

export default function TaxDeductions({ employeeId, month, year }: TaxDeductionsProps) {
  const [taxDeductions, setTaxDeductions] = useState<TaxDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    income_tax_rate: 0,
    social_security_aed: 0,
    other_taxes_aed: 0,
    calculation_base: 0,
    effective_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  useEffect(() => {
    loadTaxDeductions();
  }, [employeeId, month, year]);

  const loadTaxDeductions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tax_deductions')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .order('effective_date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error: taxError } = await query;

      if (taxError) throw taxError;

      setTaxDeductions(data || []);
    } catch (error: any) {
      console.error('Error loading tax deductions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUAETaxInfo = (taxRate: number, socialSecurity: number, otherTaxes: number) => {
    // UAE tax information
    const info = [];
    
    if (taxRate === 0) {
      info.push({ text: 'No income tax (UAE resident)', type: 'success' });
    } else {
      info.push({ text: `Income tax rate: ${taxRate}%`, type: 'warning' });
    }

    if (socialSecurity > 0) {
      info.push({ text: 'Social security applicable', type: 'info' });
    }

    if (otherTaxes > 0) {
      info.push({ text: 'Other statutory deductions', type: 'info' });
    }

    return info;
  };

  const handleSave = async (deduction: TaxDeduction) => {
    try {
      const { error } = await supabase
        .from('tax_deductions')
        .update({
          income_tax_rate: deduction.income_tax_rate,
          social_security_aed: deduction.social_security_aed,
          other_taxes_aed: deduction.other_taxes_aed,
          calculation_base: deduction.calculation_base,
          effective_date: deduction.effective_date,
          is_active: deduction.is_active
        })
        .eq('id', deduction.id);

      if (error) throw error;

      await loadTaxDeductions();
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving tax deduction:', error);
      setError(error.message);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('tax_deductions')
        .insert([{
          employee_id: employeeId,
          ...formData
        }]);

      if (error) throw error;

      await loadTaxDeductions();
      setShowAddForm(false);
      setFormData({
        income_tax_rate: 0,
        social_security_aed: 0,
        other_taxes_aed: 0,
        calculation_base: 0,
        effective_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    } catch (error: any) {
      console.error('Error adding tax deduction:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-800">Tax Deductions</h3>
          <p className="text-sm text-gray-600">UAE tax and statutory deductions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tax Rule</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">Add New Tax Deduction</h4>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.income_tax_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, income_tax_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">UAE residents: typically 0%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Security (AED)</label>
              <input
                type="number"
                value={formData.social_security_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, social_security_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Taxes (AED)</label>
              <input
                type="number"
                value={formData.other_taxes_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, other_taxes_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Base (AED)</label>
              <input
                type="number"
                value={formData.calculation_base}
                onChange={(e) => setFormData(prev => ({ ...prev, calculation_base: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
            >
              Save Tax Rule
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

      {/* Tax Deductions List */}
      <div className="space-y-4">
        {taxDeductions.length > 0 ? (
          taxDeductions.map((deduction) => {
            const isEditing = editingId === deduction.id;
            const uaeInfo = getUAETaxInfo(
              deduction.income_tax_rate, 
              deduction.social_security_aed, 
              deduction.other_taxes_aed
            );

            return (
              <div key={deduction.id} className="glass-card p-6 border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                      <Calculator className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {deduction.employee?.first_name} {deduction.employee?.last_name}
                        </h4>
                        <span className="text-sm text-gray-600">{deduction.employee?.job_title}</span>
                        {deduction.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
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
                              value={deduction.income_tax_rate}
                              onChange={(e) => setTaxDeductions(prev => prev.map(d => 
                                d.id === deduction.id 
                                  ? { ...d, income_tax_rate: parseFloat(e.target.value) || 0 }
                                  : d
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Social Security (AED)</label>
                            <input
                              type="number"
                              value={deduction.social_security_aed}
                              onChange={(e) => setTaxDeductions(prev => prev.map(d => 
                                d.id === deduction.id 
                                  ? { ...d, social_security_aed: parseFloat(e.target.value) || 0 }
                                  : d
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-6 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Income Tax Rate</p>
                            <p className="text-lg font-semibold text-gray-900">{deduction.income_tax_rate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Social Security</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(deduction.social_security_aed)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Other Taxes</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(deduction.other_taxes_aed)}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center space-x-2">
                        {uaeInfo.map((info, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              info.type === 'success' ? 'bg-green-100 text-green-800' :
                              info.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {info.text}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 text-sm text-gray-500">
                        <span>Effective: {new Date(deduction.effective_date).toLocaleDateString('en-AE')}</span>
                        <span className="mx-2">•</span>
                        <span>Base: {formatCurrency(deduction.calculation_base)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(deduction)}
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
                      <button
                        onClick={() => setEditingId(deduction.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No tax deductions configured</p>
            <p className="text-sm">Add tax deduction rules for employees</p>
          </div>
        )}
      </div>
    </div>
  );
}