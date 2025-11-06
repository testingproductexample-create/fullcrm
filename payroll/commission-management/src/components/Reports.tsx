import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommission } from '../context/CommissionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { BarChart3, TrendingUp, Download, Calendar, Filter, Users, DollarSign, Target, Award, FileText, Mail, Printer } from 'lucide-react';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { state } = useCommission();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportType, setReportType] = useState('performance');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Enhanced report data generation
  const reportData = useMemo(() => {
    let filteredSales = state.salesData;

    // Filter by period
    if (selectedPeriod !== 'all') {
      const [year, month] = selectedPeriod.split('-');
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getFullYear() === parseInt(year) && (saleDate.getMonth() + 1) === parseInt(month);
      });
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      const employeeIds = state.employees
        .filter(emp => emp.department === selectedDepartment)
        .map(emp => emp.id);
      filteredSales = filteredSales.filter(sale => employeeIds.includes(sale.employeeId));
    }

    return filteredSales;
  }, [state.salesData, state.employees, selectedPeriod, selectedDepartment, dateRange]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalCommissions = reportData.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
    const totalSales = reportData.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const avgCommissionRate = totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0;
    const totalTransactions = reportData.length;
    const avgCommission = totalTransactions > 0 ? totalCommissions / totalTransactions : 0;
    const pendingCommissions = reportData.filter(sale => sale.status === 'pending').reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
    const approvedCommissions = reportData.filter(sale => sale.status === 'approved').reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
    const paidCommissions = reportData.filter(sale => sale.status === 'paid').reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);

    return {
      totalCommissions,
      totalSales,
      avgCommissionRate,
      totalTransactions,
      avgCommission,
      pendingCommissions,
      approvedCommissions,
      paidCommissions
    };
  }, [reportData]);

  // Performance trend data (last 12 months)
  const performanceTrend = useMemo(() => {
    const monthlyData = state.salesData.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { 
          month, 
          commissions: 0, 
          sales: 0, 
          transactions: 0,
          employees: new Set()
        };
      }
      acc[month].commissions += sale.commissionAmount || 0;
      acc[month].sales += sale.saleAmount;
      acc[month].transactions += 1;
      acc[month].employees.add(sale.employeeId);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData)
      .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((item: any) => ({
        ...item,
        employees: item.employees.size
      }));
  }, [state.salesData]);

  // Department analysis
  const departmentAnalysis = useMemo(() => {
    const departments = state.employees.reduce((acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = {
          name: emp.department,
          employees: [],
          totalCommissions: 0,
          totalSales: 0,
          transactions: 0
        };
      }
      acc[emp.department].employees.push(emp);
      return acc;
    }, {} as Record<string, any>);

    Object.keys(departments).forEach(deptName => {
      const dept = departments[deptName];
      dept.employees.forEach((emp: any) => {
        const empSales = reportData.filter(sale => sale.employeeId === emp.id);
        dept.totalCommissions += empSales.reduce((sum: number, sale: any) => sum + (sale.commissionAmount || 0), 0);
        dept.totalSales += empSales.reduce((sum: number, sale: any) => sum + sale.saleAmount, 0);
        dept.transactions += empSales.length;
      });
    });

    return Object.values(departments);
  }, [state.employees, reportData]);

  // Employee performance analysis
  const employeePerformance = useMemo(() => {
    return state.employees.map(employee => {
      const empSales = reportData.filter(sale => sale.employeeId === employee.id);
      const totalCommissions = empSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
      const totalSales = empSales.reduce((sum, sale) => sum + sale.saleAmount, 0);
      const transactions = empSales.length;
      const avgCommission = transactions > 0 ? totalCommissions / transactions : 0;
      const commissionRate = totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0;
      
      // Calculate achievement vs target (assuming 100k target)
      const achievement = (totalSales / 100000) * 100;
      
      return {
        ...employee,
        totalCommissions,
        totalSales,
        transactions,
        avgCommission,
        commissionRate,
        achievement
      };
    }).sort((a, b) => b.totalCommissions - a.totalCommissions);
  }, [state.employees, reportData]);

  // Status distribution
  const statusDistribution = [
    { name: 'Pending', value: reportData.filter(s => s.status === 'pending').length, color: '#fbbf24' },
    { name: 'Approved', value: reportData.filter(s => s.status === 'approved').length, color: '#10b981' },
    { name: 'Paid', value: reportData.filter(s => s.status === 'paid').length, color: '#3b82f6' }
  ];

  // Sales vs Commission correlation
  const correlationData = useMemo(() => {
    return reportData.map(sale => {
      const employee = state.employees.find(emp => emp.id === sale.employeeId);
      return {
        ...sale,
        employeeName: employee?.name || 'Unknown',
        commissionRate: sale.saleAmount > 0 ? ((sale.commissionAmount || 0) / sale.saleAmount) * 100 : 0
      };
    });
  }, [reportData, state.employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Simulate export functionality
    console.log(`Exporting report in ${format} format`);
    // In a real app, this would generate and download the actual file
  };

  const sendReport = () => {
    // Simulate email functionality
    console.log('Sending report via email');
    // In a real app, this would open an email composition dialog
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('reports.title')}</h2>
            <p className="text-gray-600">Comprehensive commission analytics and performance insights</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => exportReport('pdf')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button 
              onClick={() => exportReport('excel')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button 
              onClick={sendReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email Report</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
            >
              <option value="performance">Performance Report</option>
              <option value="financial">Financial Summary</option>
              <option value="employee">Employee Analysis</option>
              <option value="department">Department Breakdown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="2024-11">November 2024</option>
              <option value="2024-10">October 2024</option>
              <option value="2024-09">September 2024</option>
              <option value="2024-08">August 2024</option>
              <option value="2024-07">July 2024</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Business Development">Business Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">Total</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t('reports.totalGenerated')}</h3>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalCommissions)}</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.totalTransactions} transactions</p>
        </div>

        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">Average</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Average Commission</h3>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.avgCommission)}</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.avgCommissionRate.toFixed(1)}% rate</p>
        </div>

        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded-full">Sales</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Sales Volume</h3>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalSales)}</p>
          <p className="text-xs text-gray-500 mt-1">{state.employees.length} active employees</p>
        </div>

        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">Growth</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Commissions</h3>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.pendingCommissions)}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            {t('reports.performanceTrend')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)'
                }} 
                formatter={(value, name) => {
                  if (name === 'commissions' || name === 'sales') {
                    return [formatCurrency(value as number), name === 'commissions' ? 'Commissions' : 'Sales'];
                  }
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="sales" fill="#8b5cf6" opacity={0.6} />
              <Line yAxisId="right" type="monotone" dataKey="commissions" stroke="#3b82f6" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Commission Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Analysis */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {t('reports.departmentBreakdown')}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={departmentAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '8px',
                backdropFilter: 'blur(8px)'
              }} 
              formatter={(value) => [formatCurrency(value as number), 'Commissions']}
            />
            <Bar dataKey="totalCommissions" fill="url(#departmentGradient)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="departmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Employee Performance Table */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            {t('reports.topPerformers')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/30 backdrop-blur-sm">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Total Commissions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Sales Volume</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Transactions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Commission Rate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Achievement</th>
              </tr>
            </thead>
            <tbody>
              {employeePerformance.map((employee, index) => (
                <tr key={employee.id} className="border-t border-white/20 hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                        'bg-gradient-to-r from-blue-400 to-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{employee.department}</td>
                  <td className="px-6 py-4 text-green-600 font-semibold">
                    {formatCurrency(employee.totalCommissions)}
                  </td>
                  <td className="px-6 py-4 text-gray-800">
                    {formatCurrency(employee.totalSales)}
                  </td>
                  <td className="px-6 py-4 text-gray-800">{employee.transactions}</td>
                  <td className="px-6 py-4 text-gray-800">{employee.commissionRate.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${
                        employee.achievement >= 100 ? 'text-green-600' :
                        employee.achievement >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {employee.achievement.toFixed(0)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${
                            employee.achievement >= 100 ? 'bg-green-500' :
                            employee.achievement >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(employee.achievement, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Actions */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Export</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={sendReport}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Email Report</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;