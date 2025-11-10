'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface DashboardData {
  executiveMetrics: any;
  financialData: any;
  operationalData: any;
  peopleData: any;
  customerData: any;
  isLoading: boolean;
}

export function useDashboardData(organizationId: string, dateRange: 'week' | 'month' | 'quarter' | 'year'): DashboardData {
  // Calculate date ranges for current and previous periods
  const getDateRanges = () => {
    const now = new Date();
    const currentStart = new Date();
    const previousStart = new Date();
    const previousEnd = new Date();
    
    switch (dateRange) {
      case 'week':
        currentStart.setDate(now.getDate() - 7);
        previousStart.setDate(now.getDate() - 14);
        previousEnd.setDate(now.getDate() - 7);
        break;
      case 'month':
        currentStart.setMonth(now.getMonth() - 1);
        previousStart.setMonth(now.getMonth() - 2);
        previousEnd.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        currentStart.setMonth(now.getMonth() - 3);
        previousStart.setMonth(now.getMonth() - 6);
        previousEnd.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        currentStart.setFullYear(now.getFullYear() - 1);
        previousStart.setFullYear(now.getFullYear() - 2);
        previousEnd.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return {
      currentStart: currentStart.toISOString(),
      currentEnd: now.toISOString(),
      previousStart: previousStart.toISOString(),
      previousEnd: previousEnd.toISOString()
    };
  };

  const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges();

  // Fetch Orders Data
  const { data: currentOrders } = useQuery({
    queryKey: ['dashboard-current-orders', organizationId, currentStart, currentEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', currentStart)
        .lte('created_at', currentEnd);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  const { data: previousOrders } = useQuery({
    queryKey: ['dashboard-previous-orders', organizationId, previousStart, previousEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', previousStart)
        .lte('created_at', previousEnd);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  // Fetch Current Invoices
  const { data: currentInvoices } = useQuery({
    queryKey: ['dashboard-current-invoices', organizationId, currentStart, currentEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('issue_date', currentStart)
        .lte('issue_date', currentEnd);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  // Fetch Previous Invoices
  const { data: previousInvoices } = useQuery({
    queryKey: ['dashboard-previous-invoices', organizationId, previousStart, previousEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('issue_date', previousStart)
        .lte('issue_date', previousEnd);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  // Fetch ALL Customers (for total count)
  const { data: allCustomers } = useQuery({
    queryKey: ['dashboard-all-customers', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  // Fetch Employees
  const { data: employees } = useQuery({
    queryKey: ['dashboard-employees', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  // Fetch Quality Inspections
  const { data: currentInspections } = useQuery({
    queryKey: ['dashboard-inspections', organizationId, currentStart, currentEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_inspections')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('inspection_date', currentStart)
        .lte('inspection_date', currentEnd);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  // Fetch Payments
  const { data: payments } = useQuery({
    queryKey: ['dashboard-payments', organizationId, currentStart, currentEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('payment_date', currentStart)
        .lte('payment_date', currentEnd);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: !!organizationId
  });

  const isLoading = !currentOrders || !currentInvoices || !allCustomers || !employees;

  if (isLoading) {
    return {
      executiveMetrics: {},
      financialData: {},
      operationalData: {},
      peopleData: {},
      customerData: {},
      isLoading: true
    };
  }

  // REAL CALCULATIONS - NO MOCK DATA
  
  // Calculate Revenue
  const currentRevenue = currentInvoices.reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0);
  const previousRevenue = (previousInvoices || []).reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0);
  const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Calculate Orders
  const activeOrders = currentOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const previousActiveOrders = (previousOrders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const ordersGrowth = previousActiveOrders > 0 ? ((activeOrders - previousActiveOrders) / previousActiveOrders) * 100 : 0;

  // Calculate Completion Rate
  const completedOrders = currentOrders.filter(o => o.status === 'completed').length;
  const completionRate = currentOrders.length > 0 ? (completedOrders / currentOrders.length) * 100 : 0;
  const prevCompletedOrders = (previousOrders || []).filter(o => o.status === 'completed').length;
  const prevCompletionRate = (previousOrders || []).length > 0 ? (prevCompletedOrders / (previousOrders || []).length) * 100 : 0;
  const completionRateChange = prevCompletionRate > 0 ? completionRate - prevCompletionRate : 0;

  // Calculate Customer Metrics
  const newCustomersThisPeriod = allCustomers.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= new Date(currentStart) && createdAt <= new Date(currentEnd);
  }).length;
  
  const prevNewCustomers = allCustomers.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= new Date(previousStart) && createdAt <= new Date(previousEnd);
  }).length;
  const customerGrowth = prevNewCustomers > 0 ? ((newCustomersThisPeriod - prevNewCustomers) / prevNewCustomers) * 100 : 0;

  // Calculate Health Score (composite of key metrics)
  const revenueHealth = Math.min(100, (currentRevenue / (previousRevenue || 1)) * 50);
  const orderHealth = Math.min(100, completionRate);
  const customerHealth = Math.min(100, (allCustomers.length / Math.max(1, allCustomers.length * 0.8)) * 50);
  const healthScore = Math.round((revenueHealth + orderHealth + customerHealth) / 3);

  // Calculate Monthly Revenue Data (last 6 months)
  const monthlyRevenueData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i);
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const monthInvoices = currentInvoices.filter(inv => {
      const invDate = new Date(inv.issue_date);
      return invDate >= monthStart && invDate <= monthEnd;
    });

    const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0);
    const targetRevenue = monthRevenue * 1.1; // 10% growth target

    monthlyRevenueData.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthRevenue,
      target: targetRevenue
    });
  }

  // Calculate Payment Status
  const paidAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount_aed || 0), 0);
  const pendingInvoices = currentInvoices.filter(i => i.status === 'sent' || i.status === 'viewed');
  const overdueInvoices = currentInvoices.filter(i => i.status === 'overdue');
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.balance_due_aed || 0), 0);
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.balance_due_aed || 0), 0);

  // Calculate Top Services
  const serviceRevenue: { [key: string]: number } = {};
  currentOrders.forEach(order => {
    const service = order.service_type || 'General Services';
    const revenue = currentInvoices
      .filter(inv => inv.order_id === order.id)
      .reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0);
    serviceRevenue[service] = (serviceRevenue[service] || 0) + revenue;
  });

  const topServices = Object.entries(serviceRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  // Calculate Order Pipeline
  const orderPipeline = [
    { stage: 'Pending', count: currentOrders.filter(o => o.status === 'pending').length },
    { stage: 'In Progress', count: currentOrders.filter(o => o.status === 'in_progress').length },
    { stage: 'Quality Check', count: currentOrders.filter(o => o.status === 'quality_check').length },
    { stage: 'Ready', count: currentOrders.filter(o => o.status === 'ready').length },
    { stage: 'Completed', count: currentOrders.filter(o => o.status === 'completed').length }
  ];

  // Calculate Quality Metrics
  const defectRate = currentInspections.length > 0
    ? (currentInspections.filter(i => i.inspection_result === 'failed').length / currentInspections.length) * 100
    : 0;
  const firstTimeRightRate = currentInspections.length > 0
    ? (currentInspections.filter(i => i.inspection_result === 'passed' && !i.is_rework).length / currentInspections.length) * 100
    : 100;

  // Calculate Employee Metrics
  const totalEmployees = employees.length;

  // Calculate Customer Lifetime Value
  const avgLifetimeValue = allCustomers.length > 0
    ? currentInvoices.reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0) / allCustomers.length
    : 0;

  // Customer Segmentation
  const vipCustomers = allCustomers.filter(c => c.customer_tier === 'vip').length;
  const regularCustomers = allCustomers.filter(c => c.customer_tier === 'regular').length;
  const atRiskCustomers = allCustomers.filter(c => {
    const lastOrder = currentOrders
      .filter(o => o.customer_id === c.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (!lastOrder) return true;
    const daysSinceLastOrder = (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastOrder > 90;
  }).length;

  return {
    executiveMetrics: {
      totalRevenue: currentRevenue,
      revenueGrowth,
      activeOrders,
      ordersGrowth,
      satisfactionScore: 0, // Requires feedback/review data
      satisfactionGrowth: 0,
      completionRate,
      completionRateChange,
      healthScore,
      revenueVsTarget: monthlyRevenueData.length > 0 && monthlyRevenueData[monthlyRevenueData.length - 1].target > 0
        ? (monthlyRevenueData[monthlyRevenueData.length - 1].revenue / monthlyRevenueData[monthlyRevenueData.length - 1].target) * 100
        : 0,
      retentionRate: allCustomers.length > 0 ? ((allCustomers.length - atRiskCustomers) / allCustomers.length) * 100 : 0,
      productivityScore: 0, // Requires employee performance data
      qualityScore: firstTimeRightRate
    },
    financialData: {
      revenueData: monthlyRevenueData,
      profitMarginData: monthlyRevenueData.map(d => ({
        month: d.month,
        actual: 0, // Requires cost data
        target: 35
      })),
      paymentStatusData: [
        { label: 'Paid', value: paidAmount },
        { label: 'Pending', value: pendingAmount },
        { label: 'Overdue', value: overdueAmount }
      ],
      topServices
    },
    operationalData: {
      orderPipeline,
      orderVolumeData: monthlyRevenueData.map(d => ({ month: d.month, value: 0 })),
      completionTimes: [],
      defectRate,
      firstTimeRightRate,
      complaintRate: 0, // Requires complaint data
      onTimeDelivery: completionRate
    },
    peopleData: {
      totalEmployees,
      employeeGrowth: 0, // Requires historical employee data
      avgProductivity: 0, // Requires performance data
      productivityChange: 0,
      trainingProgress: 0, // Requires training data
      trainingChange: 0,
      utilizationData: [],
      topPerformers: []
    },
    customerData: {
      totalCustomers: allCustomers.length,
      customerGrowth,
      newCustomers: newCustomersThisPeriod,
      newCustomersGrowth: customerGrowth,
      retentionRate: allCustomers.length > 0 ? ((allCustomers.length - atRiskCustomers) / allCustomers.length) * 100 : 0,
      retentionChange: 0,
      avgLifetimeValue,
      lifetimeValueChange: 0,
      segmentationData: [
        { segment: 'VIP Customers', count: vipCustomers },
        { segment: 'Regular Customers', count: regularCustomers },
        { segment: 'New Customers', count: newCustomersThisPeriod },
        { segment: 'At-Risk Customers', count: atRiskCustomers }
      ],
      acquisitionData: monthlyRevenueData.map(d => ({ month: d.month, count: 0 }))
    },
    isLoading: false
  };
}
