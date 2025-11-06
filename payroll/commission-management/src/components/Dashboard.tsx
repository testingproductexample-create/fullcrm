import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommission } from '../context/CommissionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Target, Award, Calendar, Activity, CreditCard } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { state } = useCommission();
  const { employees, salesData, commissionPayments, commissionStructures } = state;

  // Calculate enhanced metrics
  const metrics = useMemo(() => {
    const totalCommissions = salesData.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
    const pendingPayments = salesData.filter(sale => sale.status === 'pending').length;
    const approvedSales = salesData.filter(sale => sale.status === 'approved').length;
    const paidSales = salesData.filter(sale => sale.status === 'paid').length;
    const totalSales = salesData.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const avgCommissionRate = totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0;
    
    return {
      totalCommissions,
      pendingPayments,
      approvedSales,
      paidSales,
      totalSales,
      avgCommissionRate,
      activeStructures: commissionStructures.filter(s => s.isActive).length,
      totalEmployees: employees.length
    };
  }, [salesData, employees, commissionStructures]);

  // Employee performance data
  const employeePerformance = useMemo(() => {
    return employees.map(employee => {
      const employeeSales = salesData.filter(sale => sale.employeeId === employee.id);
      const totalSales = employeeSales.reduce((sum, sale) => sum + sale.saleAmount, 0);
      const totalCommissions = employeeSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
      const achievementRate = employee.baseSalary > 0 ? (totalCommissions / (employee.baseSalary * 0.5)) * 100 : 0;
      
      return {
        ...employee,
        totalSales,
        totalCommissions,
        salesCount: employeeSales.length,
        achievementRate
      };
    }).sort((a, b) => b.totalCommissions - a.totalCommissions);
  }, [employees, salesData]);

  // Chart data
  const chartData = useMemo(() => {
    const monthlyData = salesData.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { month, commissions: 0, sales: 0, count: 0 };
      }
      acc[month].commissions += sale.commissionAmount || 0;
      acc[month].sales += sale.saleAmount;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(monthlyData).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [salesData]);

  const departmentData = useMemo(() => {
    const depts = employees.reduce((acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = { name: emp.department, employees: 0, commissions: 0, sales: 0 };
      }
      acc[emp.department].employees += 1;
      return acc;
    }, {} as Record<string, any>);

    Object.keys(depts).forEach(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      depts[dept].commissions = deptEmployees.reduce((sum, emp) => {
        const empSales = salesData.filter(sale => sale.employeeId === emp.id);
        return sum + empSales.reduce((s, sale) => s + (sale.commissionAmount || 0), 0);
      }, 0);
      depts[dept].sales = deptEmployees.reduce((sum, emp) => {
        const empSales = salesData.filter(sale => sale.employeeId === emp.id);
        return sum + empSales.reduce((s, sale) => s + sale.saleAmount, 0);
      }, 0);
    });

    return Object.values(depts);
  }, [employees, salesData]);

  const statusData = [
    { name: t('tracking.pending'), value: metrics.pendingPayments, color: '#fbbf24' },
    { name: t('tracking.approved'), value: metrics.approvedSales, color: '#10b981' },
    { name: t('tracking.paid'), value: metrics.paidSales, color: '#3b82f6' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-600">Comprehensive sales commission tracking and analytics for UAE Payroll</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('dashboard.totalCommissions')}</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalCommissions)}</p>
              <p className="text-xs text-gray-500 mt-1">{metrics.avgCommissionRate.toFixed(1)}% avg rate</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('dashboard.pendingPayments')}</p>
              <p className="text-2xl font-bold text-gray-800">{metrics.pendingPayments}</p>
              <p className="text-xs text-gray-500 mt-1">AED {((metrics.pendingPayments * 2500)).toLocaleString()} total</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('dashboard.activeStructures')}</p>
              <p className="text-2xl font-bold text-gray-800">{metrics.activeStructures}</p>
              <p className="text-xs text-gray-500 mt-1">of {commissionStructures.length} total</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Sales Volume</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalSales)}</p>
              <p className="text-xs text-gray-500 mt-1">{salesData.length} transactions</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend Chart */}
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            {t('reports.performanceTrend')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
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
              <Line 
                type="monotone" 
                dataKey="commissions" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Commission Status Distribution */}
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Commission Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
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
          <div className="flex justify-center space-x-4 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {t('reports.departmentBreakdown')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentData}>
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
            <Bar dataKey="commissions" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Activity */}
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {t('dashboard.recentActivity')}
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {salesData.slice(0, 8).map((sale) => {
              const employee = employees.find(emp => emp.id === sale.employeeId);
              return (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {employee?.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{employee?.name}</p>
                      <p className="text-sm text-gray-600">{sale.orderId} • {formatCurrency(sale.saleAmount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatCurrency(sale.commissionAmount || 0)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      sale.status === 'approved' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {t(`tracking.${sale.status}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            {t('dashboard.topPerformers')}
          </h3>
          <div className="space-y-4">
            {employeePerformance.slice(0, 5).map((employee, index) => (
              <div key={employee.id} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                    'bg-gradient-to-r from-blue-400 to-purple-500'
                  }`}>
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Commissions</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(employee.totalCommissions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Achievement Rate</p>
                    <p className="text-lg font-bold text-blue-600">{employee.achievementRate.toFixed(0)}%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{employee.salesCount} sales completed</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;