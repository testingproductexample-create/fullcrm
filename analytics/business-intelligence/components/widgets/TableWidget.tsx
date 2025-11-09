import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Settings,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Widget } from '../../types';
import { useWidgetData } from '../../hooks';
import { 
  formatNumber, 
  formatCurrency, 
  formatDate,
  formatRelativeTime,
  cn
} from '../../utils/helpers';
import { GLASSMORPHISM } from '../../data/constants';

interface TableWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

interface TableColumn {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'percentage' | 'status';
  format?: (value: any) => string;
  render?: (value: any, row: any) => React.ReactNode;
}

export const TableWidget: React.FC<TableWidgetProps> = ({
  widget,
  isEditMode = false,
  filters = {},
  className
}) => {
  const { data, loading, error, refetch } = useWidgetData(widget);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Default table data if none provided
  const tableData = useMemo(() => {
    if (data && Array.isArray(data)) {
      return data;
    }

    // Generate mock data
    return Array.from({ length: 50 }, (_, i) => ({
      id: `row-${i + 1}`,
      name: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 10000),
      status: ['active', 'pending', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      category: ['Sales', 'Marketing', 'Support', 'Development'][Math.floor(Math.random() * 4)],
      priority: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
      progress: Math.floor(Math.random() * 100),
      assigned: `User ${Math.floor(Math.random() * 10) + 1}`,
      revenue: Math.floor(Math.random() * 50000) + 1000,
      change: (Math.random() - 0.5) * 20
    }));
  }, [data]);

  // Define columns
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      filterable: true,
      type: 'text',
      width: 200
    },
    {
      key: 'value',
      title: 'Value',
      sortable: true,
      type: 'number',
      format: formatNumber
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      type: 'status',
      render: (value) => {
        const statusStyles = {
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          completed: 'bg-blue-100 text-blue-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        return (
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            statusStyles[value as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
          )}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      type: 'date',
      format: (date) => formatRelativeTime(new Date(date))
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      filterable: true
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      filterable: true,
      type: 'status',
      render: (value) => {
        const priorityStyles = {
          Low: 'bg-gray-100 text-gray-800',
          Medium: 'bg-yellow-100 text-yellow-800',
          High: 'bg-orange-100 text-orange-800',
          Critical: 'bg-red-100 text-red-800'
        };
        return (
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            priorityStyles[value as keyof typeof priorityStyles] || 'bg-gray-100 text-gray-800'
          )}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'progress',
      title: 'Progress',
      sortable: true,
      type: 'percentage',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{value}%</span>
        </div>
      )
    },
    {
      key: 'revenue',
      title: 'Revenue',
      sortable: true,
      type: 'currency',
      format: formatCurrency
    },
    {
      key: 'change',
      title: 'Change',
      sortable: true,
      type: 'percentage',
      render: (value) => {
        const isPositive = value > 0;
        return (
          <div className={cn(
            "flex items-center space-x-1",
            isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
          )}>
            <span>{isPositive ? '↗' : value < 0 ? '↘' : '→'}</span>
            <span>{Math.abs(value).toFixed(1)}%</span>
          </div>
        );
      }
    }
  ], []);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = tableData;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters (if implemented)
    // This would be based on the showFilters state and individual column filters

    return filtered;
  }, [tableData, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handlers
  const handleSort = useCallback((columnKey: string) => {
    setSortConfig(current => {
      if (current?.key === columnKey) {
        return {
          key: columnKey,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: columnKey, direction: 'asc' };
    });
  }, []);

  const handleSelectRow = useCallback((rowId: string) => {
    setSelectedRows(current =>
      current.includes(rowId)
        ? current.filter(id => id !== rowId)
        : [...current, rowId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(row => row.id));
    }
  }, [paginatedData, selectedRows]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      columns.map(col => col.title).join(','),
      ...sortedData.map(row =>
        columns.map(col => {
          const value = row[col.key];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${widget.title}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCellValue = (value: any, column: TableColumn) => {
    if (column.render) {
      return column.render(value, null);
    }
    
    if (column.format) {
      return column.format(value);
    }
    
    switch (column.type) {
      case 'date':
        return formatDate(new Date(value));
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return formatNumber(value);
      default:
        return String(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {widget.title}
            </h3>
            {widget.description && (
              <p className="text-sm text-gray-600">{widget.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {sortedData.length} rows
            </span>
            <button
              onClick={handleExport}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 transition-colors",
                showFilters 
                  ? "text-blue-600 bg-blue-100 rounded" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm w-64"
              />
            </div>
            {selectedRows.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedRows.length} selected
                </span>
                <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded bg-white/50 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/5 border-b border-white/20 p-4"
          >
            <div className="grid grid-cols-4 gap-4">
              {columns.filter(col => col.filterable).map(column => (
                <div key={column.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.title}
                  </label>
                  <input
                    type="text"
                    placeholder={`Filter ${column.title}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white/50 text-sm"
                    onChange={(e) => {
                      // Implement column-specific filtering
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-xs text-red-700 hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/20">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={cn(
                      "p-3 text-left text-sm font-medium text-gray-700",
                      column.sortable && "cursor-pointer hover:bg-white/10"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ArrowUp 
                            className={cn(
                              "w-3 h-3",
                              sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                ? "text-blue-600" 
                                : "text-gray-300"
                            )}
                          />
                          <ArrowDown 
                            className={cn(
                              "w-3 h-3 -mt-1",
                              sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                ? "text-blue-600" 
                                : "text-gray-300"
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-3 text-left">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginatedData.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "border-b border-white/10 hover:bg-white/5 transition-colors",
                      selectedRows.includes(row.id) && "bg-blue-50/20",
                      hoveredRow === row.id && "bg-white/10"
                    )}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    {columns.map(column => (
                      <td key={column.key} className="p-3 text-sm text-gray-700">
                        {formatCellValue(row[column.key], column)}
                      </td>
                    ))}
                    <td className="p-3">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/20 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 text-sm rounded",
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-white/10"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};