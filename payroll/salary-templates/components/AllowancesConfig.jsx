import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  HomeIcon,
  TruckIcon,
  HeartIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AllowancesConfig = ({ onUpdate }) => {
  const [allowances, setAllowances] = useState([
    {
      id: '1',
      name: 'Housing Allowance',
      type: 'fixed',
      taxable: false,
      mandatory: true,
      description: 'Monthly housing allowance for employees',
      maxAmount: 10000,
      minAmount: 2000,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'flat',
      icon: HomeIcon,
      isActive: true
    },
    {
      id: '2',
      name: 'Transportation Allowance',
      type: 'fixed',
      taxable: true,
      mandatory: true,
      description: 'Monthly transportation allowance',
      maxAmount: 2000,
      minAmount: 500,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'flat',
      icon: TruckIcon,
      isActive: true
    },
    {
      id: '3',
      name: 'Meal Allowance',
      type: 'fixed',
      taxable: true,
      mandatory: false,
      description: 'Daily meal allowance for employees',
      maxAmount: 50,
      minAmount: 20,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'per_day',
      icon: BanknotesIcon,
      isActive: true
    },
    {
      id: '4',
      name: 'Medical Allowance',
      type: 'fixed',
      taxable: false,
      mandatory: true,
      description: 'Annual medical insurance allowance',
      maxAmount: 5000,
      minAmount: 1000,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'annual',
      icon: HeartIcon,
      isActive: true
    },
    {
      id: '5',
      name: 'Communication Allowance',
      type: 'fixed',
      taxable: true,
      mandatory: false,
      description: 'Monthly phone and internet allowance',
      maxAmount: 500,
      minAmount: 100,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'flat',
      icon: DevicePhoneMobileIcon,
      isActive: true
    },
    {
      id: '6',
      name: 'Education Allowance',
      type: 'percentage',
      taxable: false,
      mandatory: false,
      description: 'Annual education allowance for employees and dependents',
      maxAmount: 20000,
      minAmount: 2000,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'percentage_of_base',
      percentage: 10,
      icon: AcademicCapIcon,
      isActive: true
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [newAllowance, setNewAllowance] = useState({
    name: '',
    type: 'fixed',
    taxable: true,
    mandatory: false,
    description: '',
    maxAmount: 0,
    minAmount: 0,
    currency: 'AED',
    applicableRoles: ['All'],
    calculationRule: 'flat',
    percentage: 0,
    icon: CurrencyDollarIcon
  });

  const allowanceTypes = [
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'percentage', label: 'Percentage of Base' },
    { value: 'variable', label: 'Variable Amount' }
  ];

  const calculationRules = [
    { value: 'flat', label: 'Flat Amount' },
    { value: 'per_day', label: 'Per Day' },
    { value: 'per_hour', label: 'Per Hour' },
    { value: 'annual', label: 'Annual' },
    { value: 'percentage_of_base', label: 'Percentage of Base Salary' }
  ];

  const iconOptions = [
    { value: HomeIcon, label: 'Housing', icon: HomeIcon },
    { value: TruckIcon, label: 'Transportation', icon: TruckIcon },
    { value: BanknotesIcon, label: 'Financial', icon: BanknotesIcon },
    { value: HeartIcon, label: 'Medical', icon: HeartIcon },
    { value: DevicePhoneMobileIcon, label: 'Communication', icon: DevicePhoneMobileIcon },
    { value: AcademicCapIcon, label: 'Education', icon: AcademicCapIcon },
    { value: ShieldCheckIcon, label: 'Insurance', icon: ShieldCheckIcon },
    { value: CurrencyDollarIcon, label: 'General', icon: CurrencyDollarIcon }
  ];

  const handleCreateAllowance = () => {
    if (!newAllowance.name) {
      alert('Please provide an allowance name');
      return;
    }

    const allowance = {
      id: Date.now().toString(),
      ...newAllowance,
      isActive: true
    };

    setAllowances([...allowances, allowance]);
    setNewAllowance({
      name: '',
      type: 'fixed',
      taxable: true,
      mandatory: false,
      description: '',
      maxAmount: 0,
      minAmount: 0,
      currency: 'AED',
      applicableRoles: ['All'],
      calculationRule: 'flat',
      percentage: 0,
      icon: CurrencyDollarIcon
    });
    setShowCreateModal(false);
    onUpdate([...allowances, allowance]);
  };

  const handleUpdateAllowance = (id, updates) => {
    const updatedAllowances = allowances.map(allowance =>
      allowance.id === id ? { ...allowance, ...updates } : allowance
    );
    setAllowances(updatedAllowances);
    setEditingAllowance(null);
    onUpdate(updatedAllowances);
  };

  const handleDeleteAllowance = (id) => {
    if (confirm('Are you sure you want to delete this allowance?')) {
      const updatedAllowances = allowances.filter(allowance => allowance.id !== id);
      setAllowances(updatedAllowances);
      onUpdate(updatedAllowances);
    }
  };

  const toggleAllowanceStatus = (id) => {
    const updatedAllowances = allowances.map(allowance =>
      allowance.id === id ? { ...allowance, isActive: !allowance.isActive } : allowance
    );
    setAllowances(updatedAllowances);
    onUpdate(updatedAllowances);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Allowances Configuration</h2>
          <p className="text-gray-600">Configure and manage salary allowances for UAE payroll</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Allowance</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{allowances.filter(a => a.isActive).length}</div>
              <div className="text-sm text-gray-600">Active Allowances</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{allowances.filter(a => a.mandatory).length}</div>
              <div className="text-sm text-gray-600">Mandatory</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{allowances.filter(a => a.taxable).length}</div>
              <div className="text-sm text-gray-600">Taxable</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{allowances.length}</div>
              <div className="text-sm text-gray-600">Total Configured</div>
            </div>
          </div>
        </div>
      </div>

      {/* Allowances Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allowances.map((allowance) => {
            const IconComponent = allowance.icon;
            return (
              <motion.div
                key={allowance.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 p-6 transition-all duration-200 ${
                  allowance.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      allowance.isActive ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${allowance.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{allowance.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{allowance.type} • {allowance.calculationRule.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingAllowance(allowance)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAllowance(allowance.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    allowance.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {allowance.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    allowance.mandatory 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {allowance.mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    allowance.taxable 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {allowance.taxable ? 'Taxable' : 'Non-taxable'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{allowance.description}</p>

                {/* Amount Range */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Min Amount:</span>
                    <span className="font-medium">{formatCurrency(allowance.minAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Max Amount:</span>
                    <span className="font-medium">{formatCurrency(allowance.maxAmount)}</span>
                  </div>
                  {allowance.type === 'percentage' && allowance.percentage && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Percentage:</span>
                      <span className="font-medium">{allowance.percentage}%</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleAllowanceStatus(allowance.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      allowance.isActive
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {allowance.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandatory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allowances.map((allowance) => {
                  const IconComponent = allowance.icon;
                  return (
                    <tr key={allowance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            allowance.isActive ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <IconComponent className={`w-5 h-5 ${allowance.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{allowance.name}</div>
                            <div className="text-sm text-gray-500">{allowance.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{allowance.type}</div>
                        <div className="text-sm text-gray-500">{allowance.calculationRule.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(allowance.minAmount)} - {formatCurrency(allowance.maxAmount)}
                        </div>
                        {allowance.type === 'percentage' && (
                          <div className="text-sm text-gray-500">{allowance.percentage}%</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          allowance.taxable 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {allowance.taxable ? 'Taxable' : 'Non-taxable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          allowance.mandatory 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {allowance.mandatory ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          allowance.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {allowance.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setEditingAllowance(allowance)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleAllowanceStatus(allowance.id)}
                          className={allowance.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        >
                          {allowance.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteAllowance(allowance.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Allowance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Allowance</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={newAllowance.name}
                      onChange={(e) => setNewAllowance({...newAllowance, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Allowance name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newAllowance.type}
                      onChange={(e) => setNewAllowance({...newAllowance, type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {allowanceTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Rule</label>
                    <select
                      value={newAllowance.calculationRule}
                      onChange={(e) => setNewAllowance({...newAllowance, calculationRule: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {calculationRules.map(rule => (
                        <option key={rule.value} value={rule.value}>{rule.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <select
                      value={newAllowance.icon?.name || 'CurrencyDollarIcon'}
                      onChange={(e) => {
                        const selectedIcon = iconOptions.find(icon => icon.value.name === e.target.value);
                        setNewAllowance({...newAllowance, icon: selectedIcon?.value || CurrencyDollarIcon});
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {iconOptions.map(option => (
                        <option key={option.value.name} value={option.value.name}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (AED)</label>
                    <input
                      type="number"
                      value={newAllowance.minAmount}
                      onChange={(e) => setNewAllowance({...newAllowance, minAmount: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (AED)</label>
                    <input
                      type="number"
                      value={newAllowance.maxAmount}
                      onChange={(e) => setNewAllowance({...newAllowance, maxAmount: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {newAllowance.type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Percentage (%)</label>
                      <input
                        type="number"
                        value={newAllowance.percentage}
                        onChange={(e) => setNewAllowance({...newAllowance, percentage: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        max="100"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newAllowance.description}
                    onChange={(e) => setNewAllowance({...newAllowance, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe this allowance"
                  />
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAllowance.taxable}
                      onChange={(e) => setNewAllowance({...newAllowance, taxable: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Taxable</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAllowance.mandatory}
                      onChange={(e) => setNewAllowance({...newAllowance, mandatory: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Mandatory</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAllowance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Allowance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllowancesConfig;