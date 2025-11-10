'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UsersIcon, 
  ShoppingCartIcon, 
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevenueChart } from './charts/revenue-chart';
import { OrdersChart } from './charts/orders-chart';
import { QualityMetrics } from './quality-metrics';
import { RecentOrders } from './recent-orders';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  monthlyRevenue: number;
  pendingOrders: number;
  totalEmployees: number;
  qualityScore: number;
  todayAppointments: number;
  urgentTasks: number;
}

export function MainDashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        customersResult,
        ordersResult,
        revenueResult,
        pendingOrdersResult,
        employeesResult,
        qualityResult,
        appointmentsResult,
        tasksResult,
      ] = await Promise.all([
        supabase.from('customers').select('count', { count: 'exact' }),
        supabase.from('orders').select('count', { count: 'exact' }),
        supabase.from('revenue_tracking').select('amount').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('orders').select('count', { count: 'exact' }).in('status', ['pending', 'in_progress']),
        supabase.from('employees').select('count', { count: 'exact' }),
        supabase.from('quality_metrics').select('score'),
        supabase.from('appointments').select('count', { count: 'exact' }).eq('appointment_date', new Date().toISOString().split('T')[0]),
        supabase.from('task_assignments').select('count', { count: 'exact' }).eq('priority', 'urgent').eq('status', 'assigned'),
      ]);

      const monthlyRevenue = revenueResult.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const averageQuality = qualityResult.data?.reduce((sum, item) => sum + (item.score || 0), 0) / (qualityResult.data?.length || 1) || 85;

      return {
        totalCustomers: customersResult.count || 0,
        totalOrders: ordersResult.count || 0,
        monthlyRevenue,
        pendingOrders: pendingOrdersResult.count || 0,
        totalEmployees: employeesResult.count || 0,
        qualityScore: averageQuality,
        todayAppointments: appointmentsResult.count || 0,
        urgentTasks: tasksResult.count || 0,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const quickActions = [
    { name: 'New Order', href: '/orders/new', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Add Customer', href: '/customers/new', color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Schedule Appointment', href: '/appointments/new', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'View Reports', href: '/reports', color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/customers',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCartIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/orders',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: BanknotesIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: '/finance/revenue',
      isAmount: true,
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: ClockIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/orders?status=pending',
    },
    {
      title: 'Employees',
      value: stats?.totalEmployees || 0,
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/employees',
    },
    {
      title: 'Quality Score',
      value: `${Math.round(stats?.qualityScore || 0)}%`,
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/quality',
    },
    {
      title: 'Today Appointments',
      value: stats?.todayAppointments || 0,
      icon: ClockIcon,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/appointments',
    },
    {
      title: 'Urgent Tasks',
      value: stats?.urgentTasks || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/tasks?priority=urgent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to Tailoring Management Platform
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive business management for your tailoring operations
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-AE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href}>
            <Button 
              className={`w-full h-16 text-white font-semibold ${action.color} transition-all hover:scale-105`}
              size="lg"
            >
              {action.name}
            </Button>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="glass hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart />
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <QualityMetrics />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrders />
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">CRM</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Orders</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Finance</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Quality</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">HR</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Suppliers</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Inventory</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Security</div>
              <div className="text-green-600 font-bold">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}