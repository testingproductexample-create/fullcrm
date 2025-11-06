import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommission, SalesData } from '../context/CommissionContext';
import { CheckCircle, XCircle, DollarSign, Filter, Search, Download, Upload, Eye, Edit, Trash2, Clock, Check, Banknote } from 'lucide-react';

const CommissionTracking: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useCommission();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [selectedSale, setSelectedSale] = useState<SalesData | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Enhanced filtering and search
  const filteredSales = useMemo(() => {
    return state.salesData.filter(sale => {
      const employee = state.employees.find(emp => emp.id === sale.employeeId);
      
      // Search filter
      const matchesSearch = !searchTerm || 
        employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.saleAmount.toString().includes(searchTerm);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      
      // Employee filter
      const matchesEmployee = employeeFilter === 'all' || sale.employeeId === employeeFilter;
      
      // Date filter
      const saleDate = new Date(sale.date);
      const now = new Date();
      let matchesDate = true;
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saleDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= quarterAgo;
          break;
      }
      
      return matchesSearch && matchesStatus && matchesEmployee && matchesDate;
    });
  }, [state.salesData, state.employees, searchTerm, statusFilter, employeeFilter, dateFilter]);

  // Pagination
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  // Bulk actions
  const handleBulkApproval = () => {
    const pendingSales = selectedSales.filter(id => {
      const sale = state.salesData.find(s => s.id === id);
      return sale?.status === 'pending';
    });

    pendingSales.forEach(saleId => {
      const sale = state.salesData.find(s => s.id === saleId);
      if (sale) {
        dispatch({
          type: 'UPDATE_SALE',
          payload: {
            ...sale,
            status: 'approved',
            approvedDate: new Date().toISOString().split('T')[0]
          }
        });
      }
    });

    setSelectedSales([]);
    setShowBulkActions(false);
  };

  const handleBulkRejection = () => {
    const pendingSales = selectedSales.filter(id => {
      const sale = state.salesData.find(s => s.id === id);
      return sale?.status === 'pending';
    });

    pendingSales.forEach(saleId => {
      const sale = state.salesData.find(s => s.id === saleId);
      if (sale) {
        dispatch({
          type: 'UPDATE_SALE',
          payload: {
            ...sale,
            status: 'pending'
          }
        });
      }
    });

    setSelectedSales([]);
    setShowBulkActions(false);
  };

  const handleSingleApproval = (sale: SalesData) => {
    dispatch({
      type: 'UPDATE_SALE',
      payload: {
        ...sale,
        status: 'approved',
        approvedDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleSinglePayment = (sale: SalesData) => {
    dispatch({
      type: 'UPDATE_SALE',
      payload: {
        ...sale,
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <Banknote className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
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

  const toggleSaleSelection = (saleId: string) => {
    setSelectedSales(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const toggleAllSales = () => {
    setSelectedSales(prev => 
      prev.length === paginatedSales.length 
        ? [] 
        : paginatedSales.map(sale => sale.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('tracking.title')}</h2>
            <p className="text-gray-600">Track and manage sales commissions with approval workflows</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('tracking.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">{t('tracking.pending')}</option>
            <option value="approved">{t('tracking.approved')}</option>
            <option value="paid">{t('tracking.paid')}</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Employees</option>
            {state.employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
        </div>

        {selectedSales.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedSales.length} sale(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApproval}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Approve All</span>
                </button>
                <button
                  onClick={handleBulkRejection}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Reject All</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sales Data Table */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/30 backdrop-blur-sm">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSales.length === paginatedSales.length && paginatedSales.length > 0}
                    onChange={toggleAllSales}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">{t('tracking.employee')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">{t('tracking.order')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">{t('tracking.amount')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Commission</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">{t('tracking.status')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">{t('tracking.date')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => {
                const employee = state.employees.find(emp => emp.id === sale.employeeId);
                const isSelected = selectedSales.includes(sale.id);
                
                return (
                  <tr key={sale.id} className={`border-t border-white/20 hover:bg-white/20 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSaleSelection(sale.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {employee?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{employee?.name}</p>
                          <p className="text-sm text-gray-600">{employee?.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-mono">{sale.orderId}</td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">{formatCurrency(sale.saleAmount)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-green-600 font-semibold">{formatCurrency(sale.commissionAmount || 0)}</p>
                        <p className="text-xs text-gray-500">
                          {((sale.commissionAmount || 0) / sale.saleAmount * 100).toFixed(1)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sale.status)}`}>
                        {getStatusIcon(sale.status)}
                        <span className="capitalize">{t(`tracking.${sale.status}`)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status === 'pending' && (
                          <button
                            onClick={() => handleSingleApproval(sale)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {sale.status === 'approved' && (
                          <button
                            onClick={() => handleSinglePayment(sale)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Process Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/30 backdrop-blur-sm border-t border-white/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white/50 text-gray-700 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/50 text-gray-700 hover:bg-white/70'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white/50 text-gray-700 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(state.salesData.reduce((sum, sale) => sum + sale.saleAmount, 0))}</p>
              <p className="text-xs text-gray-500 mt-1">{state.salesData.length} transactions</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(state.salesData.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0))}</p>
              <p className="text-xs text-gray-500 mt-1">
                {state.salesData.length > 0 
                  ? ((state.salesData.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0) / 
                      state.salesData.reduce((sum, sale) => sum + sale.saleAmount, 0)) * 100).toFixed(1) + '%'
                  : '0%'} avg rate
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-800">{state.salesData.filter(s => s.status === 'pending').length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(state.salesData.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.commissionAmount || 0), 0))} value
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-800">{state.salesData.filter(s => s.status === 'paid').length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(state.salesData.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.commissionAmount || 0), 0))} paid
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Banknote className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          employee={state.employees.find(emp => emp.id === selectedSale.employeeId)}
          onClose={() => setSelectedSale(null)}
          onApprove={() => handleSingleApproval(selectedSale)}
          onPay={() => handleSinglePayment(selectedSale)}
        />
      )}
    </div>
  );
};

interface SaleDetailModalProps {
  sale: SalesData;
  employee?: any;
  onClose: () => void;
  onApprove?: () => void;
  onPay?: () => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, employee, onClose, onApprove, onPay }) => {
  const { t } = useTranslation();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Sale Details</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-white/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Employee Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-800">{employee?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-800">{employee?.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-800">{employee?.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-800">{employee?.email}</p>
                </div>
              </div>
            </div>

            {/* Sale Details */}
            <div className="bg-white/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Sale Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium text-gray-800 font-mono">{sale.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sale Amount</p>
                  <p className="font-medium text-gray-800">{formatCurrency(sale.saleAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission Amount</p>
                  <p className="font-medium text-green-600">{formatCurrency(sale.commissionAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="font-medium text-gray-800">
                    {((sale.commissionAmount || 0) / sale.saleAmount * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <span>📊</span>
                    <span className="capitalize">{sale.status}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-800">{new Date(sale.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sale Created</p>
                    <p className="text-xs text-gray-600">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                </div>
                {sale.approvedDate && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Commission Approved</p>
                      <p className="text-xs text-gray-600">{new Date(sale.approvedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {sale.paidDate && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Commission Paid</p>
                      <p className="text-xs text-gray-600">{new Date(sale.paidDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {sale.status === 'pending' && onApprove && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Commission
                </button>
              </div>
            )}

            {sale.status === 'approved' && onPay && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onPay}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Process Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionTracking;