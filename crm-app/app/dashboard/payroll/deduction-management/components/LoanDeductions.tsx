'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
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
  Percent
} from 'lucide-react';
import { LoanDeduction } from '../types/deduction.types';

interface LoanDeductionsProps {
  employeeId?: string;
  month: number;
  year: number;
}

export default function LoanDeductions({ employeeId, month, year }: LoanDeductionsProps) {
  const [loans, setLoans] = useState<LoanDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    loan_type: 'personal' as const,
    principal_amount_aed: 0,
    monthly_payment_aed: 0,
    remaining_balance_aed: 0,
    interest_rate: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active' as const
  });

  useEffect(() => {
    loadLoans();
  }, [employeeId, month, year]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('loan_deductions')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .order('start_date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error: loanError } = await query;

      if (loanError) throw loanError;

      setLoans(data || []);
    } catch (error: any) {
      console.error('Error loading loans:', error);
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

  const getLoanTypeInfo = (type: string) => {
    switch (type) {
      case 'personal':
        return { name: 'Personal Loan', color: 'blue', icon: DollarSign };
      case 'housing':
        return { name: 'Housing Loan', color: 'green', icon: FileText };
      case 'car':
        return { name: 'Car Loan', color: 'purple', icon: BarChart3 };
      case 'education':
        return { name: 'Education Loan', color: 'indigo', icon: FileText };
      case 'emergency':
        return { name: 'Emergency Loan', color: 'red', icon: AlertCircle };
      default:
        return { name: 'Other Loan', color: 'gray', icon: CreditCard };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { name: 'Active', color: 'green' };
      case 'completed':
        return { name: 'Completed', color: 'blue' };
      case 'defaulted':
        return { name: 'Defaulted', color: 'red' };
      case 'cancelled':
        return { name: 'Cancelled', color: 'gray' };
      default:
        return { name: 'Unknown', color: 'gray' };
    }
  };

  const calculateRemainingMonths = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const handleSave = async (loan: LoanDeduction) => {
    try {
      const { error } = await supabase
        .from('loan_deductions')
        .update({
          loan_type: loan.loan_type,
          principal_amount_aed: loan.principal_amount_aed,
          monthly_payment_aed: loan.monthly_payment_aed,
          remaining_balance_aed: loan.remaining_balance_aed,
          interest_rate: loan.interest_rate,
          start_date: loan.start_date,
          end_date: loan.end_date,
          status: loan.status
        })
        .eq('id', loan.id);

      if (error) throw error;

      await loadLoans();
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving loan:', error);
      setError(error.message);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('loan_deductions')
        .insert([{
          employee_id: employeeId,
          ...formData
        }]);

      if (error) throw error;

      await loadLoans();
      setShowAddForm(false);
      setFormData({
        loan_type: 'personal',
        principal_amount_aed: 0,
        monthly_payment_aed: 0,
        remaining_balance_aed: 0,
        interest_rate: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      });
    } catch (error: any) {
      console.error('Error adding loan:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-800">Loan & Advance Deductions</h3>
          <p className="text-sm text-gray-600">Employee loans, advances, and repayment tracking</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Loan</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">Add New Loan</h4>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData(prev => ({ ...prev, loan_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="personal">Personal Loan</option>
                <option value="housing">Housing Loan</option>
                <option value="car">Car Loan</option>
                <option value="education">Education Loan</option>
                <option value="emergency">Emergency Loan</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (AED)</label>
              <input
                type="number"
                value={formData.principal_amount_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, principal_amount_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment (AED)</label>
              <input
                type="number"
                value={formData.monthly_payment_aed}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_payment_aed: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Save Loan
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

      {/* Loans List */}
      <div className="space-y-4">
        {loans.length > 0 ? (
          loans.map((loan) => {
            const isEditing = editingId === loan.id;
            const typeInfo = getLoanTypeInfo(loan.loan_type);
            const statusInfo = getStatusInfo(loan.status);
            const Icon = typeInfo.icon;
            const remainingMonths = calculateRemainingMonths(loan.end_date);
            const progressPercentage = loan.principal_amount_aed > 0 
              ? ((loan.principal_amount_aed - loan.remaining_balance_aed) / loan.principal_amount_aed) * 100 
              : 0;

            return (
              <div key={loan.id} className="glass-card p-6 border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 bg-gradient-to-br from-${typeInfo.color}-100 to-purple-100 rounded-lg`}>
                      <Icon className={`h-6 w-6 text-${typeInfo.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {loan.employee?.first_name} {loan.employee?.last_name}
                        </h4>
                        <span className="text-sm text-gray-600">{loan.employee?.job_title}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          {statusInfo.name}
                        </span>
                      </div>
                      
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment (AED)</label>
                            <input
                              type="number"
                              value={loan.monthly_payment_aed}
                              onChange={(e) => setLoans(prev => prev.map(l => 
                                l.id === loan.id 
                                  ? { ...l, monthly_payment_aed: parseFloat(e.target.value) || 0 }
                                  : l
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Balance (AED)</label>
                            <input
                              type="number"
                              value={loan.remaining_balance_aed}
                              onChange={(e) => setLoans(prev => prev.map(l => 
                                l.id === loan.id 
                                  ? { ...l, remaining_balance_aed: parseFloat(e.target.value) || 0 }
                                  : l
                              ))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Principal</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(loan.principal_amount_aed)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Monthly Payment</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(loan.monthly_payment_aed)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Remaining Balance</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(loan.remaining_balance_aed)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Interest Rate</p>
                            <p className="text-lg font-semibold text-gray-900">{loan.interest_rate}%</p>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Repayment Progress</span>
                          <span>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {new Date(loan.start_date).toLocaleDateString('en-AE')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>End: {new Date(loan.end_date).toLocaleDateString('en-AE')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Percent className="h-4 w-4" />
                          <span>{remainingMonths} months remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(loan)}
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
                        onClick={() => setEditingId(loan.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
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
            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No loans found</p>
            <p className="text-sm">Add loans and advances for employees</p>
          </div>
        )}
      </div>
    </div>
  );
}