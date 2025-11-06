'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Shield, 
  Heart,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
  Plus,
  DollarSign,
  FileText,
  BarChart3,
  Calendar,
  User,
  Users,
  Award
} from 'lucide-react';
import { InsuranceDeduction } from '../types/deduction.types';

interface InsuranceDeductionsProps {
  employeeId?: string;
  month: number;
  year: number;
}

export default function InsuranceDeductions({ employeeId, month, year }: InsuranceDeductionsProps) {
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    insurance_type: 'health' as const,
    premium_amount_aed: 0,
    coverage_details: '',
    provider_name: '',
    policy_number: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    employee_contribution_aed: 0,
    employer_contribution_aed: 0,
    is_active: true
  });

  useEffect(() => {
    loadInsurancePolicies();
  }, [employeeId, month, year]);

  const loadInsurancePolicies = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('insurance_deductions')
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

      const { data, error: insuranceError } = await query;

      if (insuranceError) throw insuranceError;

      setInsurancePolicies(data || []);
    } catch (error: any) {
      console.error('Error loading insurance policies:', error);
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

  const getInsuranceTypeInfo = (type: string) => {
    switch (type) {
      case 'health':
        return { name: 'Health Insurance', color: 'green', icon: Heart, description: 'Medical coverage and healthcare' };
      case 'life':
        return { name: 'Life Insurance', color: 'blue', icon: Shield, description: 'Life coverage and dependents protection' };
      case 'disability':
        return { name: 'Disability Insurance', color: 'yellow', icon: User, description: 'Income protection during disability' };
      case 'accident':
        return { name: 'Accident Insurance', color: 'red', icon: AlertCircle, description: 'Accidental death and dismemberment' };
      case 'critical_illness':
        return { name: 'Critical Illness', color: 'purple', icon: Award, description: 'Critical illness coverage' };
      case 'group_medical':
        return { name: 'Group Medical', color: 'indigo', icon: Users, description: 'Employer-sponsored group medical' };
      default:
        return { name: 'Other Insurance', color: 'gray', icon: FileText, description: 'Other insurance coverage' };
    }
  };

  const getCoverageStatus = (effectiveDate: string, expiryDate: string) => {
    const now = new Date();
    const effective = new Date(effectiveDate);
    const expiry = new Date(expiryDate);
    
    if (now < effective) {
      return { status: 'pending', color: 'yellow', text: 'Pending' };
    } else if (now > expiry) {
      return { status: 'expired', color: 'red', text: 'Expired' };
    } else {
      return { status: 'active', color: 'green', text: 'Active' };
    }
  };

  const calculateDaysRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getEmployeeContributionPercentage = (employeeContribution: number, totalPremium: number) => {
    if (totalPremium === 0) return 0;
    return ((employeeContribution / totalPremium) * 100).toFixed(1);
  };

  const handleSave = async (policy: InsuranceDeduction) => {
    try {
      const { error } = await supabase
        .from('insurance_deductions')
        .update({
          insurance_type: policy.insurance_type,
          premium_amount_aed: policy.premium_amount_aed,
          coverage_details: policy.coverage_details,
          provider_name: policy.provider_name,
          policy_number: policy.policy_number,
          effective_date: policy.effective_date,
          expiry_date: policy.expiry_date,
          employee_contribution_aed: policy.employee_contribution_aed,
          employer_contribution_aed: policy.employer_contribution_aed,
          is_active: policy.is_active
        })
        .eq('id', policy.id);

      if (error) throw error;

      await loadInsurancePolicies();
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving insurance policy:', error);
      setError(error.message);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('insurance_deductions')
        .insert([{
          employee_id: employeeId,
          ...formData
        }]);

      if (error) throw error;

      await loadInsurancePolicies();
      setShowAddForm(false);
      setFormData({
        insurance_type: 'health',
        premium_amount_aed: 0,
        coverage_details: '',
        provider_name: '',
        policy_number: '',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        employee_contribution_aed: 0,
        employer_contribution_aed: 0,
        is_active: true
      });
    } catch (error: any) {
      console.error('Error adding insurance policy:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-green-200 to-blue-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gradient-to-r from-green-100 to-blue-100 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-800">Insurance & Benefits Deductions</h3>
          <p className="text-sm text-gray-600">Health, life, and other insurance premium deductions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Insurance</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">Add New Insurance Policy</h4>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Type</label>
              <select
                value={formData.insurance_type}
                onChange={(e) => setFormData(prev => ({ ...prev, insurance_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="health">Health Insurance</option>
                <option value="life">Life Insurance</option>
                <option value="disability">Disability Insurance</option>
                <option value="accident">Accident Insurance</option>
                <option value="critical_illness">Critical Illness</option>
                <option value="group_medical">Group Medical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
              <input
                type="text"
                value={formData.provider_name}
                onChange={(e) => setFormData(prev => ({ ...prev, provider_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Insurance Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
              <input
                type="text"
                value={formData.policy_number}
                onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="POL-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Premium (AED)</label>
              <input
                type="number"
                value={formData.premium_amount_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, premium_amount_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Contribution (AED)</label>
              <input
                type="number"
                value={formData.employee_contribution_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_contribution_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employer Contribution (AED)</label>
              <input
                type="number"
                value={formData.employer_contribution_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, employer_contribution_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Details</label>
            <textarea
              value={formData.coverage_details}
              onChange={(e) => setFormData(prev => ({ ...prev, coverage_details: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="Describe coverage benefits, limits, and conditions"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Save Insurance
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

      {/* Insurance Policies List */}
      <div className="space-y-4">
        {insurancePolicies.length > 0 ? (
          insurancePolicies.map((policy) => {
            const isEditing = editingId === policy.id;
            const typeInfo = getInsuranceTypeInfo(policy.insurance_type);
            const Icon = typeInfo.icon;
            const coverageStatus = getCoverageStatus(policy.effective_date, policy.expiry_date);
            const daysRemaining = calculateDaysRemaining(policy.expiry_date);
            const employeePercentage = getEmployeeContributionPercentage(
              policy.employee_contribution_aed, 
              policy.premium_amount_aed
            );

            return (
              <div key={policy.id} className="glass-card p-6 border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 bg-gradient-to-br from-${typeInfo.color}-100 to-blue-100 rounded-lg`}>
                      <Icon className={`h-6 w-6 text-${typeInfo.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {policy.employee?.first_name} {policy.employee?.last_name}
                        </h4>
                        <span className="text-sm text-gray-600">{policy.employee?.job_title}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${coverageStatus.color}-100 text-${coverageStatus.color}-800`}>
                          {coverageStatus.text}
                        </span>
                        {policy.is_active ? (
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Contribution (AED)</label>
                            <input
                              type="number"
                              value={policy.employee_contribution_aed}
                              onChange={(e) => setInsurancePolicies(prev => prev.map(p => 
                                p.id === policy.id 
                                  ? { ...p, employee_contribution_aed: parseFloat(e.target.value) || 0 }
                                  : p
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employer Contribution (AED)</label>
                            <input
                              type="number"
                              value={policy.employer_contribution_aed}
                              onChange={(e) => setInsurancePolicies(prev => prev.map(p => 
                                p.id === policy.id 
                                  ? { ...p, employer_contribution_aed: parseFloat(e.target.value) || 0 }
                                  : p
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Premium</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(policy.premium_amount_aed)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Employee Share</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(policy.employee_contribution_aed)}</p>
                            <p className="text-xs text-gray-500">{employeePercentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Employer Share</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(policy.employer_contribution_aed)}</p>
                            <p className="text-xs text-gray-500">{100 - parseFloat(employeePercentage)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Provider</p>
                            <p className="text-sm font-medium text-gray-900">{policy.provider_name}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Coverage:</strong> {policy.coverage_details || 'No description provided'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>Policy: {policy.policy_number}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Expires: {daysRemaining} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(policy)}
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
                        onClick={() => setEditingId(policy.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
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
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No insurance policies found</p>
            <p className="text-sm">Add insurance and benefits for employees</p>
          </div>
        )}
      </div>
    </div>
  );
}