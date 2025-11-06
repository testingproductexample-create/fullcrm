'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Calendar,
  Mail,
  Phone,
  MessageSquare 
} from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  totalSpent: number;
  avgOrderValue: number;
  upcomingEvents: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    vipCustomers: 0,
    totalSpent: 0,
    avgOrderValue: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!profile?.organization_id) return;

      try {
        // Fetch customer stats
        const { data: customers } = await supabase
          .from('customers')
          .select('status, classification, total_spent, total_orders')
          .eq('organization_id', profile.organization_id);

        if (customers) {
          const totalCustomers = customers.length;
          const activeCustomers = customers.filter(c => c.status === 'Active').length;
          const vipCustomers = customers.filter(c => c.classification === 'VIP').length;
          const totalSpent = customers.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0);
          const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
          const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

          // Fetch upcoming events
          const today = format(new Date(), 'yyyy-MM-dd');
          const { data: events } = await supabase
            .from('customer_events')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true)
            .gte('event_date', today);

          setStats({
            totalCustomers,
            activeCustomers,
            vipCustomers,
            totalSpent,
            avgOrderValue,
            upcomingEvents: events?.length || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [profile]);

  const statCards = [
    { 
      title: 'Total Customers', 
      value: stats.totalCustomers, 
      icon: Users, 
      color: 'text-primary-500',
      bgColor: 'bg-primary-50'
    },
    { 
      title: 'Active Customers', 
      value: stats.activeCustomers, 
      icon: TrendingUp, 
      color: 'text-semantic-success',
      bgColor: 'bg-green-50'
    },
    { 
      title: 'VIP Customers', 
      value: stats.vipCustomers, 
      icon: Award, 
      color: 'text-semantic-warning',
      bgColor: 'bg-yellow-50'
    },
    { 
      title: 'Total Revenue', 
      value: `AED ${stats.totalSpent.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'text-semantic-success',
      bgColor: 'bg-green-50'
    },
    { 
      title: 'Avg Order Value', 
      value: `AED ${stats.avgOrderValue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: TrendingUp, 
      color: 'text-primary-500',
      bgColor: 'bg-primary-50'
    },
    { 
      title: 'Upcoming Events', 
      value: stats.upcomingEvents, 
      icon: Calendar, 
      color: 'text-semantic-info',
      bgColor: 'bg-blue-50'
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-glass-light rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-glass-light rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-neutral-900">Dashboard</h1>
        <p className="text-body text-neutral-700 mt-2">
          Welcome back, {profile?.full_name}! Here's your business overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="glass-card p-6 glass-card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-neutral-700 mb-1">{stat.title}</p>
                  <p className="text-h3 font-bold text-neutral-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn-primary flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            Add Customer
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Event
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Mail className="w-5 h-5" />
            Send Email
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send SMS
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-semibold text-neutral-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-body text-neutral-700">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}
