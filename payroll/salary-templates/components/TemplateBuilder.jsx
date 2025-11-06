import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CurrencyDollarIcon,
  HomeIcon,
  TruckIcon,
  HeartIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const TemplateBuilder = ({ roleFrameworks, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    level: '',
    baseSalary: 0,
    allowances: {
      housing: 0,
      transport: 0,
      meal: 0,
      medical: 0,
      communication: 0,
      education: 0
    },
    benefits: [],
    deductionRules: [],
    overtimeRates: {
      weekday: 1.5,
      weekend: 2.0,
      holiday: 2.5
    }
  });

  const [newBenefit, setNewBenefit] = useState('');
  const [newDeduction, setNewDeduction] = useState({ type: 'percentage', value: 0, description: '' });
  const [currentStep, setCurrentStep] = useState(1);

  const benefitOptions = [
    'Health Insurance',
    'Life Insurance',
    'Annual Leave',
    'Sick Leave',
    'Maternity/Paternity Leave',
    'Professional Development',
    'Training Budget',
    'Stock Options',
    'Performance Bonus',
    'End of Service Gratuity',
    'Airfare Allowance',
    'Housing Allowance Review',
    'Transportation Allowance',
    'Meal Vouchers',
    'Gym Membership'
  ];

  const deductionTypes = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'conditional', label: 'Conditional' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAllowanceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      allowances: {
        ...prev.allowances,
        [key]: Number(value) || 0
      }
    }));
  };

  const addBenefit = () => {
    if (newBenefit && !formData.benefits.includes(newBenefit)) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addDeduction = () => {
    if (newDeduction.description && newDeduction.value > 0) {
      setFormData(prev => ({
        ...prev,
        deductionRules: [...prev.deductionRules, { ...newDeduction }]
      }));
      setNewDeduction({ type: 'percentage', value: 0, description: '' });
    }
  };

  const removeDeduction = (index) => {
    setFormData(prev => ({
      ...prev,
      deductionRules: prev.deductionRules.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Validation
    if (!formData.name || !formData.role || !formData.baseSalary) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  const getTotalCompensation = () => {
    const allowancesTotal = Object.values(formData.allowances).reduce((sum, amount) => sum + amount, 0);
    return formData.baseSalary + allowancesTotal;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Create Salary Template</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Basic Info</span>
              <span>Compensation</span>
              <span>Benefits</span>
              <span>Review</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Software Engineer - Senior"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Role</option>
                      {roleFrameworks.flatMap(framework => framework.roles).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <input
                      type="text"
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      placeholder="e.g., Junior, Mid, Senior, Lead"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value="AED"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    >
                      <option value="AED">AED (UAE Dirham)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Compensation Structure */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Structure</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                      Base Salary (AED) *
                    </label>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => handleInputChange('baseSalary', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Total Package Display */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Package</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(getTotalCompensation())}
                    </div>
                  </div>
                </div>

                {/* Allowances */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Allowances</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(formData.allowances).map(([key, value]) => {
                      const icons = {
                        housing: HomeIcon,
                        transport: TruckIcon,
                        meal: BanknotesIcon,
                        medical: HeartIcon,
                        communication: TruckIcon,
                        education: BanknotesIcon
                      };
                      const Icon = icons[key] || CurrencyDollarIcon;
                      
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Icon className="w-4 h-4 inline mr-1" />
                            {key.charAt(0).toUpperCase() + key.slice(1)} (AED)
                          </label>
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => handleAllowanceChange(key, Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Benefits and Deductions */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits & Deductions</h3>
                
                {/* Benefits */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Benefits</h4>
                  
                  {/* Add Benefit */}
                  <div className="flex gap-2 mb-4">
                    <select
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a benefit</option>
                      {benefitOptions.map(benefit => (
                        <option key={benefit} value={benefit}>{benefit}</option>
                      ))}
                    </select>
                    <button
                      onClick={addBenefit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selected Benefits */}
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {benefit}
                        <button
                          onClick={() => removeBenefit(index)}
                          className="ml-2 hover:text-blue-600"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deduction Rules */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Deduction Rules</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select
                      value={newDeduction.type}
                      onChange={(e) => setNewDeduction({...newDeduction, type: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {deductionTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={newDeduction.value}
                      onChange={(e) => setNewDeduction({...newDeduction, value: Number(e.target.value)})}
                      placeholder="Value"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newDeduction.description}
                      onChange={(e) => setNewDeduction({...newDeduction, description: e.target.value})}
                      placeholder="Description"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={addDeduction}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Add Deduction Rule
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Save</h3>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">{formData.name}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium">{formData.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-medium">{formData.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Salary:</span>
                      <span className="font-medium">{formatCurrency(formData.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Package:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(getTotalCompensation())}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Benefits:</h5>
                    <div className="flex flex-wrap gap-1">
                      {formData.benefits.map((benefit, index) => (
                        <span key={index} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Template
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemplateBuilder;