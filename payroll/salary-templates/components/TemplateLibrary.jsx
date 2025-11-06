import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const TemplateLibrary = ({ templates, onSelectTemplate, selectedTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get unique roles for filtering
  const roles = [...new Set(templates.map(t => t.role))];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || template.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && template.isActive) ||
                         (filterStatus === 'inactive' && !template.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const calculateTotalCompensation = (template) => {
    const allowancesTotal = Object.values(template.allowances).reduce((sum, amount) => sum + amount, 0);
    return template.baseSalary + allowancesTotal;
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
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate?.id === template.id 
                ? 'border-blue-500 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            {/* Template Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600">{template.role} • {template.level}</p>
              </div>
              <div className="flex items-center space-x-2">
                {template.isActive ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  template.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Compensation Breakdown */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Base Salary:</span>
                <span className="font-medium text-gray-900">{formatCurrency(template.baseSalary)}</span>
              </div>
              
              {Object.entries(template.allowances).map(([key, amount]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{key}:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
              ))}
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900">Total Package:</span>
                <span className="text-blue-600">{formatCurrency(calculateTotalCompensation(template))}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Benefits:</p>
              <div className="flex flex-wrap gap-1">
                {template.benefits.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                  >
                    {benefit}
                  </span>
                ))}
                {template.benefits.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{template.benefits.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Template Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>Version {template.version}</span>
              <span>Updated {template.createdAt}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <EyeIcon className="w-4 h-4" />
                <span>View</span>
              </button>
              <button className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              <button className="flex items-center justify-center px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first salary template.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;