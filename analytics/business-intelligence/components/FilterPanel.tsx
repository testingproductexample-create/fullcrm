import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  X, 
  Calendar, 
  Search, 
  ChevronDown,
  RefreshCw,
  Check,
  Plus
} from 'lucide-react';
import { Filter as FilterType } from '../../types';
import { cn } from '../../utils/helpers';
import { DATE_RANGES } from '../../data/constants';

interface FilterPanelProps {
  filters: FilterType[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (filterId: string, value: any) => {
    const newValues = { ...values, [filterId]: value };
    onChange(newValues);
  };

  const clearAllFilters = () => {
    onChange({});
  };

  const getFilterInput = (filter: FilterType) => {
    const currentValue = values[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={filter.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={filter.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
          />
        );

      case 'dropdown':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(currentValue as any[])?.includes(option.value) || false}
                  onChange={(e) => {
                    const current = (currentValue as any[]) || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: any) => v !== option.value);
                    handleFilterChange(filter.id, updated);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500">({option.count})</span>
                )}
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const activeFilterCount = Object.keys(values).filter(key => values[key] !== undefined && values[key] !== '').length;

  return (
    <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
            </button>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DATE_RANGES).map(([key, range]) => (
              <button
                key={key}
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - range.days);
                  handleFilterChange('dateRange', { start, end });
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded transition-colors"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search filters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
          />
        </div>

        {/* Filters List */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4"
          >
            {filters.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No filters available</p>
                <button
                  onClick={() => {/* Add filter logic */}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Filter</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map(filter => (
                  <div key={filter.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {filter.label}
                      {filter.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {getFilterInput(filter)}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters</span>
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(values)
                .filter(([_, value]) => value !== undefined && value !== '')
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="inline-flex items-center space-x-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    <span>{key}:</span>
                    <span className="font-medium">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                    <button
                      onClick={() => handleFilterChange(key, '')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};