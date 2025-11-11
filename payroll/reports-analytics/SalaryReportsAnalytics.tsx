import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Type-safe Recharts component aliases to fix JSX component issues
const SafeBarChart = BarChart as React.ComponentType<any>;
const SafeBar = Bar as React.ComponentType<any>;
const SafeXAxis = XAxis as React.ComponentType<any>;
const SafeYAxis = YAxis as React.ComponentType<any>;
const SafeCartesianGrid = CartesianGrid as React.ComponentType<any>;
const SafeTooltip = Tooltip as React.ComponentType<any>;
const SafeLegend = Legend as React.ComponentType<any>;
const SafeLineChart = LineChart as React.ComponentType<any>;
const SafeLine = Line as React.ComponentType<any>;
const SafePieChart = PieChart as React.ComponentType<any>;
const SafePie = Pie as React.ComponentType<any>;
const SafeCell = Cell as React.ComponentType<any>;
const SafeAreaChart = AreaChart as React.ComponentType<any>;
const SafeArea = Area as React.ComponentType<any>;
const SafeResponsiveContainer = ResponsiveContainer as React.ComponentType<any>;
const SafeRadarChart = RadarChart as React.ComponentType<any>;
const SafePolarGrid = PolarGrid as React.ComponentType<any>;
const SafePolarAngleAxis = PolarAngleAxis as React.ComponentType<any>;
const SafePolarRadiusAxis = PolarRadiusAxis as React.ComponentType<any>;
const SafeRadar = Radar as React.ComponentType<any>;
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  Search,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  CreditCard,
  Briefcase
} from 'lucide-react';

// Glassmorphism component styles
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
};

// Export utilities
const exportToPDF = (data: any[], filename: string) => {
  // Simulated PDF export - in real implementation, use jsPDF
  const element = document.createElement('a');
  const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.json`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const exportToExcel = (data: any[], filename: string) => {
  // Simulated Excel export - in real implementation, use SheetJS
  exportToPDF(data, filename);
};

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n');
  
  const element = document.createElement('a');
  const file = new Blob([csvContent], { type: 'text/csv' });
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Mock data generators
const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    totalPayroll: Math.floor(Math.random() * 500000) + 200000,
    totalEmployees: Math.floor(Math.random() * 50) + 20,
    averageSalary: Math.floor(Math.random() * 20000) + 30000,
    benefits: Math.floor(Math.random() * 50000) + 10000,
    taxes: Math.floor(Math.random() * 100000) + 50000,
  }));
};

const generateQuarterlyData = () => {
  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
  return quarters.map(quarter => ({
    quarter,
    totalCompensation: Math.floor(Math.random() * 2000000) + 1000000,
    baseSalary: Math.floor(Math.random() * 1500000) + 800000,
    bonuses: Math.floor(Math.random() * 300000) + 100000,
    benefits: Math.floor(Math.random() * 200000) + 100000,
  }));
};

const generateDepartmentData = () => {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  return departments.map(dept => ({
    name: dept,
    value: Math.floor(Math.random() * 500000) + 100000,
    employees: Math.floor(Math.random() * 20) + 5,
    avgSalary: Math.floor(Math.random() * 40000) + 40000,
  }));
};

const generateEmployeeData = () => {
  const employees = [
    { id: 1, name: 'John Smith', department: 'Engineering', salary: 85000, position: 'Senior Developer' },
    { id: 2, name: 'Sarah Johnson', department: 'Marketing', salary: 65000, position: 'Marketing Manager' },
    { id: 3, name: 'Mike Wilson', department: 'Sales', salary: 75000, position: 'Sales Director' },
    { id: 4, name: 'Emily Davis', department: 'HR', salary: 55000, position: 'HR Specialist' },
    { id: 5, name: 'David Brown', department: 'Finance', salary: 80000, position: 'Financial Analyst' },
  ];
  return employees;
};

const generateBudgetData = () => {
  const categories = ['Salaries', 'Benefits', 'Bonuses', 'Training', 'Equipment', 'Other'];
  return categories.map(category => ({
    category,
    budgeted: Math.floor(Math.random() * 1000000) + 500000,
    actual: Math.floor(Math.random() * 1000000) + 400000,
    variance: Math.floor(Math.random() * 200000) - 100000,
  }));
};

// Main component
const SalaryReportsAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('12months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Data state
  const [monthlyData, setMonthlyData] = useState(generateMonthlyData());
  const [quarterlyData, setQuarterlyData] = useState(generateQuarterlyData());
  const [departmentData, setDepartmentData] = useState(generateDepartmentData());
  const [employeeData, setEmployeeData] = useState(generateEmployeeData());
  const [budgetData, setBudgetData] = useState(generateBudgetData());

  // Metrics calculations
  const metrics = useMemo(() => {
    const totalPayroll = monthlyData.reduce((sum, month) => sum + month.totalPayroll, 0);
    const totalEmployees = monthlyData[monthlyData.length - 1]?.totalEmployees || 0;
    const avgSalary = totalPayroll / totalEmployees;
    const trend = monthlyData.length > 1 ? 
      ((monthlyData[monthlyData.length - 1].totalPayroll - monthlyData[0].totalPayroll) / monthlyData[0].totalPayroll) * 100 : 0;

    return {
      totalPayroll,
      totalEmployees,
      avgSalary,
      trend,
      totalBudget: budgetData.reduce((sum, item) => sum + item.budgeted, 0),
      actualSpend: budgetData.reduce((sum, item) => sum + item.actual, 0),
      budgetVariance: budgetData.reduce((sum, item) => sum + item.variance, 0),
    };
  }, [monthlyData, budgetData]);

  // Filtered employee data
  const filteredEmployeeData = useMemo(() => {
    return employeeData.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [employeeData, searchTerm, selectedDepartment]);

  // Export handlers
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const data = {
      metrics,
      monthlyData,
      quarterlyData,
      departmentData,
      employeeData: filteredEmployeeData,
      budgetData,
      timestamp: new Date().toISOString(),
    };

    switch (format) {
      case 'pdf':
        exportToPDF(data, `salary-report-${new Date().toISOString().split('T')[0]}`);
        break;
      case 'excel':
        exportToExcel(data, `salary-report-${new Date().toISOString().split('T')[0]}`);
        break;
      case 'csv':
        exportToCSV(filteredEmployeeData, `employee-data-${new Date().toISOString().split('T')[0]}`);
        break;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="min-h-screen p-6" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Salary Reports & Analytics</h1>
          <p className="text-white/80 text-lg">Comprehensive payroll insights and financial analytics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'budget', label: 'Budget Analysis', icon: Target },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-all duration-300"
              style={{
                ...glassStyle,
                background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Total Payroll', 
                  value: `$${metrics.totalPayroll.toLocaleString()}`, 
                  icon: DollarSign, 
                  trend: metrics.trend,
                  color: '#3B82F6'
                },
                { 
                  title: 'Total Employees', 
                  value: metrics.totalEmployees.toString(), 
                  icon: Users, 
                  trend: 5.2,
                  color: '#10B981'
                },
                { 
                  title: 'Average Salary', 
                  value: `$${Math.round(metrics.avgSalary).toLocaleString()}`, 
                  icon: Briefcase, 
                  trend: 3.1,
                  color: '#F59E0B'
                },
                { 
                  title: 'Budget Variance', 
                  value: `$${metrics.budgetVariance.toLocaleString()}`, 
                  icon: CreditCard, 
                  trend: -2.4,
                  color: '#EF4444'
                },
              ].map((metric, index) => (
                <div 
                  key={index}
                  className="p-6 text-white"
                  style={glassStyle}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm font-medium">{metric.title}</p>
                      <p className="text-2xl font-bold mt-1">{metric.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {metric.trend > 0 ? (
                          <TrendingUp size={16} color="#10B981" />
                        ) : (
                          <TrendingDown size={16} color="#EF4444" />
                        )}
                        <span className={`text-sm ${metric.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {Math.abs(metric.trend).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${metric.color}20` }}
                    >
                      <metric.icon size={24} color={metric.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Payroll Trend */}
              <div 
                className="p-6"
                style={glassStyle}
              >
                <h3 className="text-xl font-semibold text-white mb-4">Monthly Payroll Trend</h3>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafeLineChart data={monthlyData}>
                    <SafeCartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <SafeXAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                    <SafeYAxis stroke="rgba(255,255,255,0.7)" />
                    <SafeTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <SafeLine 
                      type="monotone" 
                      dataKey="totalPayroll" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </SafeLineChart>
                </SafeResponsiveContainer>
              </div>

              {/* Department Distribution */}
              <div 
                className="p-6"
                style={glassStyle}
              >
                <h3 className="text-xl font-semibold text-white mb-4">Department Distribution</h3>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafePieChart>
                    <SafePie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentData.map((entry, index) => (
                        <SafeCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </SafePie>
                    <SafeTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                  </SafePieChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* Employee Insights */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Employee Compensation Insights</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="avgSalary" fill="#3B82F6" name="Average Salary" />
                  </BarChart>
                </ResponsiveContainer>
                
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="benefits" 
                      stackId="1"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="taxes" 
                      stackId="1"
                      stroke="#F59E0B" 
                      fill="#F59E0B"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Filters and Search */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-white/70" />
                    <select 
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="px-3 py-2 rounded-lg text-white bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="3months">Last 3 Months</option>
                      <option value="6months">Last 6 Months</option>
                      <option value="12months">Last 12 Months</option>
                      <option value="24months">Last 24 Months</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter size={20} className="text-white/70" />
                    <select 
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-2 rounded-lg text-white bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Departments</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Search size={20} className="text-white/70" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 rounded-lg text-white bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-500/20 hover:bg-red-500/30 transition-colors"
                  >
                    <Download size={16} />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-green-500/20 hover:bg-green-500/30 transition-colors"
                  >
                    <Download size={16} />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                  >
                    <Download size={16} />
                    CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Data Table */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Employee Compensation Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Position</th>
                      <th className="text-left py-3 px-4">Annual Salary</th>
                      <th className="text-left py-3 px-4">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployeeData.map((employee) => (
                      <tr key={employee.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4">{employee.name}</td>
                        <td className="py-3 px-4">{employee.department}</td>
                        <td className="py-3 px-4">{employee.position}</td>
                        <td className="py-3 px-4">${employee.salary.toLocaleString()}</td>
                        <td className="py-3 px-4">${Math.round(employee.salary / 12).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Compensation Analytics */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <h3 className="text-xl font-semibold text-white mb-6">Compensation Analytics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quarterly Comparison */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Quarterly Comparison</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={quarterlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="quarter" stroke="rgba(255,255,255,0.7)" />
                      <YAxis stroke="rgba(255,255,255,0.7)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: 'white'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="baseSalary" fill="#3B82F6" name="Base Salary" />
                      <Bar dataKey="bonuses" fill="#10B981" name="Bonuses" />
                      <Bar dataKey="benefits" fill="#F59E0B" name="Benefits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Cost Analysis Radar */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Cost Analysis</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={departmentData}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: 'white', fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: 'white', fontSize: 10 }} />
                      <Radar
                        name="Total Cost"
                        dataKey="value"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <h3 className="text-xl font-semibold text-white mb-6">Performance & Efficiency Metrics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { metric: 'Cost per Employee', value: '$52,400', change: '+2.3%', positive: true },
                  { metric: 'Salary-to-Revenue Ratio', value: '0.18', change: '-0.5%', positive: true },
                  { metric: 'Turnover Rate', value: '8.2%', change: '+1.1%', positive: false },
                  { metric: 'Average Tenure', value: '3.4 years', change: '+0.2 years', positive: true },
                  { metric: 'Promotion Rate', value: '12.5%', change: '+3.2%', positive: true },
                  { metric: 'Training Investment', value: '$125K', change: '+8.7%', positive: true },
                ].map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/5">
                    <p className="text-white/70 text-sm font-medium">{item.metric}</p>
                    <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {item.positive ? (
                        <TrendingUp size={14} color="#10B981" />
                      ) : (
                        <TrendingDown size={14} color="#EF4444" />
                      )}
                      <span className={`text-sm ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Budget Analysis Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-8">
            {/* Budget Overview */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <h3 className="text-xl font-semibold text-white mb-6">Budget Analysis & Tracking</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Budget vs Actual */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Budget vs Actual Spending</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="category" stroke="rgba(255,255,255,0.7)" />
                      <YAxis stroke="rgba(255,255,255,0.7)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: 'white'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
                      <Bar dataKey="actual" fill="#10B981" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Budget Variance */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Budget Variance Analysis</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={budgetData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="category" stroke="rgba(255,255,255,0.7)" />
                      <YAxis stroke="rgba(255,255,255,0.7)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: 'white'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="variance" 
                        stroke="#F59E0B" 
                        fill="#F59E0B"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Budget Summary */}
            <div 
              className="p-6"
              style={glassStyle}
            >
              <h3 className="text-xl font-semibold text-white mb-6">Budget Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg bg-blue-500/20">
                  <DollarSign className="mx-auto mb-2" size={32} color="#3B82F6" />
                  <p className="text-white/70 text-sm">Total Budget</p>
                  <p className="text-2xl font-bold text-white">${metrics.totalBudget.toLocaleString()}</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-green-500/20">
                  <Activity className="mx-auto mb-2" size={32} color="#10B981" />
                  <p className="text-white/70 text-sm">Actual Spend</p>
                  <p className="text-2xl font-bold text-white">${metrics.actualSpend.toLocaleString()}</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-yellow-500/20">
                  <Target className="mx-auto mb-2" size={32} color="#F59E0B" />
                  <p className="text-white/70 text-sm">Variance</p>
                  <p className={`text-2xl font-bold ${metrics.budgetVariance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${Math.abs(metrics.budgetVariance).toLocaleString()}
                  </p>
                  <p className="text-white/70 text-xs mt-1">
                    {metrics.budgetVariance > 0 ? 'Under Budget' : 'Over Budget'}
                  </p>
                </div>
              </div>

              {/* Budget Table */}
              <div className="mt-8">
                <h4 className="text-lg font-medium text-white mb-4">Detailed Budget Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Budgeted</th>
                        <th className="text-left py-3 px-4">Actual</th>
                        <th className="text-left py-3 px-4">Variance</th>
                        <th className="text-left py-3 px-4">Variance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetData.map((item, index) => (
                        <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-3 px-4">{item.category}</td>
                          <td className="py-3 px-4">${item.budgeted.toLocaleString()}</td>
                          <td className="py-3 px-4">${item.actual.toLocaleString()}</td>
                          <td className={`py-3 px-4 ${item.variance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${Math.abs(item.variance).toLocaleString()}
                          </td>
                          <td className={`py-3 px-4 ${(item.variance / item.budgeted * 100) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {((item.variance / item.budgeted) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryReportsAnalytics;