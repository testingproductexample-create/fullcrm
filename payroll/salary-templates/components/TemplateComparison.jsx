import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ViewColumnsIcon,
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const TemplateComparison = ({ templates, onCompare }) => {
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [compareMode, setCompareMode] = useState('side-by-side'); // 'side-by-side' or 'detailed'
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  const maxComparisons = 3;

  const handleTemplateSelect = (templateId) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter(id => id !== templateId));
    } else if (selectedTemplates.length < maxComparisons) {
      setSelectedTemplates([...selectedTemplates, templateId]);
    }
  };

  const getSelectedTemplates = () => {
    return selectedTemplates.map(id => templates.find(t => t.id === id)).filter(Boolean);
  };

  const calculateTotalCompensation = (template) => {
    if (!template) return 0;
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

  const getDifferences = (templates) => {
    if (!highlightDifferences || templates.length < 2) return {};
    
    const differences = {};
    
    // Compare base salary
    const baseSalaries = templates.map(t => t?.baseSalary);
    if (new Set(baseSalaries).size > 1) {
      differences.baseSalary = baseSalaries;
    }
    
    // Compare total compensation
    const totalComp = templates.map(t => calculateTotalCompensation(t));
    if (new Set(totalComp).size > 1) {
      differences.totalCompensation = totalComp;
    }
    
    // Compare allowances
    const allowanceTypes = ['housing', 'transport', 'meal', 'medical'];
    allowanceTypes.forEach(type => {
      const values = templates.map(t => t?.allowances?.[type] || 0);
      if (new Set(values).size > 1) {
        differences[`allowance_${type}`] = values;
      }
    });
    
    return differences;
  };

  const selectedTemplatesData = getSelectedTemplates();
  const differences = getDifferences(selectedTemplatesData);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Comparison</h2>
          <p className="text-gray-600">Compare salary templates side by side</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Comparison Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCompareMode('side-by-side')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                compareMode === 'side-by-side' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setCompareMode('detailed')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                compareMode === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Detailed
            </button>
          </div>
          
          {/* Highlight Differences Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={highlightDifferences}
              onChange={(e) => setHighlightDifferences(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Highlight Differences</span>
          </label>
          
          {selectedTemplates.length > 0 && (
            <button
              onClick={() => setSelectedTemplates([])}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* Selection Counter */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ViewColumnsIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Selected Templates: {selectedTemplates.length}/{maxComparisons}
              </span>
            </div>
            
            {selectedTemplates.length === 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <InformationCircleIcon className="w-4 h-4" />
                <span>Select templates below to start comparing</span>
              </div>
            )}
            
            {selectedTemplates.length === maxComparisons && (
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Maximum templates selected</span>
              </div>
            )}
          </div>
          
          {selectedTemplates.length >= 2 && (
            <div className="text-sm text-blue-600 font-medium">
              Ready to compare {selectedTemplates.length} templates
            </div>
          )}
        </div>
      </div>

      {/* Template Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {templates.map((template) => {
          const isSelected = selectedTemplates.includes(template.id);
          const canSelect = selectedTemplates.length < maxComparisons || isSelected;
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => canSelect && handleTemplateSelect(template.id)}
              className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 shadow-lg' 
                  : canSelect 
                    ? 'border-gray-200 hover:border-gray-300 hover:shadow-md' 
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600">{template.role} • {template.level}</p>
                </div>
                
                {isSelected && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {!isSelected && !canSelect && (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <XMarkIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Base Salary:</span>
                  <span className="font-medium">{formatCurrency(template.baseSalary)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Package:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(calculateTotalCompensation(template))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {template.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  v{template.version}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Results */}
      {selectedTemplates.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Comparison Results</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Comparing {selectedTemplates.length} templates</span>
              </div>
            </div>
          </div>

          {compareMode === 'side-by-side' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 w-48">
                      Component
                    </th>
                    {selectedTemplatesData.map((template, index) => (
                      <th key={template.id} className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        {template.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Basic Information */}
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Role</td>
                    {selectedTemplatesData.map(template => (
                      <td key={template.id} className="px-6 py-4 text-sm text-gray-900">
                        {template.role}
                      </td>
                    ))}
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Level</td>
                    {selectedTemplatesData.map(template => (
                      <td key={template.id} className="px-6 py-4 text-sm text-gray-900">
                        {template.level}
                      </td>
                    ))}
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Version</td>
                    {selectedTemplatesData.map(template => (
                      <td key={template.id} className="px-6 py-4 text-sm text-gray-900">
                        v{template.version}
                      </td>
                    ))}
                  </tr>

                  {/* Compensation Breakdown */}
                  <tr className="bg-gray-50">
                    <td colSpan={selectedTemplates.length + 1} className="px-6 py-3 font-semibold text-gray-900">
                      Compensation Breakdown
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Base Salary</td>
                    {selectedTemplatesData.map(template => (
                      <td 
                        key={template.id} 
                        className={`px-6 py-4 text-sm font-medium ${
                          differences.baseSalary && highlightDifferences 
                            ? 'bg-yellow-50' 
                            : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(template.baseSalary)}
                      </td>
                    ))}
                  </tr>
                  
                  {Object.keys(selectedTemplatesData[0]?.allowances || {}).map(allowanceType => (
                    <tr key={allowanceType}>
                      <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                        {allowanceType} Allowance
                      </td>
                      {selectedTemplatesData.map(template => (
                        <td 
                          key={template.id}
                          className={`px-6 py-4 text-sm font-medium ${
                            differences[`allowance_${allowanceType}`] && highlightDifferences 
                              ? 'bg-yellow-50' 
                              : 'text-gray-900'
                          }`}
                        >
                          {formatCurrency(template.allowances[allowanceType] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  <tr className="border-t-2 border-gray-300">
                    <td className="px-6 py-4 font-bold text-gray-900">Total Package</td>
                    {selectedTemplatesData.map(template => (
                      <td 
                        key={template.id}
                        className={`px-6 py-4 text-sm font-bold ${
                          differences.totalCompensation && highlightDifferences 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-blue-600'
                        }`}
                      >
                        {formatCurrency(calculateTotalCompensation(template))}
                      </td>
                    ))}
                  </tr>

                  {/* Benefits */}
                  <tr className="bg-gray-50">
                    <td colSpan={selectedTemplates.length + 1} className="px-6 py-3 font-semibold text-gray-900">
                      Benefits
                    </td>
                  </tr>
                  
                  {selectedTemplatesData[0]?.benefits?.map((benefit, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 font-medium text-gray-900">Benefit {index + 1}</td>
                      {selectedTemplatesData.map(template => (
                        <td key={template.id} className="px-6 py-4 text-sm text-gray-900">
                          {template.benefits[index] || 'Not included'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Detailed Comparison */
            <div className="p-6">
              <div className="space-y-6">
                {selectedTemplatesData.map((template, index) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Basic Information</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Role:</span>
                            <span className="font-medium">{template.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Level:</span>
                            <span className="font-medium">{template.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Version:</span>
                            <span className="font-medium">v{template.version}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Compensation</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Base Salary:</span>
                            <span className="font-medium">{formatCurrency(template.baseSalary)}</span>
                          </div>
                          {Object.entries(template.allowances).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{key}:</span>
                              <span className="font-medium">{formatCurrency(value)}</span>
                            </div>
                          ))}
                          <hr className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-900">Total Package:</span>
                            <span className="text-blue-600">{formatCurrency(calculateTotalCompensation(template))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-3">Benefits ({template.benefits?.length || 0})</h5>
                      <div className="flex flex-wrap gap-2">
                        {template.benefits?.map((benefit, benefitIndex) => (
                          <span
                            key={benefitIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {benefit}
                          </span>
                        )) || <span className="text-sm text-gray-500">No benefits defined</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {selectedTemplates.length < 2 && (
        <div className="text-center py-12">
          <ViewColumnsIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Templates to Compare</h3>
          <p className="text-gray-600">
            Choose at least 2 templates from the selection above to start comparing their structures and compensation packages.
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateComparison;