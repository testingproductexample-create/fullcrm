'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Settings,
  BarChart3,
  Package,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Filter,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { Appointment, AppointmentType, Customer, Employee } from '@/types/database';

interface AppointmentStats {
  totalToday: number;
  confirmedToday: number;
  pendingToday: number;
  completedToday: number;
  cancelledToday: number;
  noShowToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  averageRating: number;
}

interface UpcomingAppointment extends Appointment {
  appointment_types?: AppointmentType;
  customer?: Customer;
  staff_assignment?: {
    employee?: Employee;
  };
}

export default function AppointmentsDashboard() {
  const [stats, setStats] = useState<AppointmentStats>({
    totalToday: 0,
    confirmedToday: 0,
    pendingToday: 0,
    completedToday: 0,
    cancelledToday: 0,
    noShowToday: 0,
    totalThisWeek: 0,
    totalThisMonth: 0,
    averageRating: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      
      // Load today's appointments with related data
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_types:appointment_type_id (
            type_name,
            color_code,
            icon
          ),
          customers:customer_id (
            full_name,
            phone,
            email
          )
        `)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(10);

      if (appointmentsError) throw appointmentsError;

      // Calculate statistics
      const todayAppointments = appointments?.filter(
        apt => apt.appointment_date === today
      ) || [];

      setStats({
        totalToday: todayAppointments.length,
        confirmedToday: todayAppointments.filter(a => a.status === 'confirmed').length,
        pendingToday: todayAppointments.filter(a => a.confirmation_status === 'pending').length,
        completedToday: todayAppointments.filter(a => a.status === 'completed').length,
        cancelledToday: todayAppointments.filter(a => a.status === 'cancelled').length,
        noShowToday: todayAppointments.filter(a => a.status === 'no_show').length,
        totalThisWeek: appointments?.length || 0,
        totalThisMonth: appointments?.length || 0,
        averageRating: 4.5 // TODO: Calculate from actual ratings
      });

      setUpcomingAppointments(appointments || []);
    } catch (error) {
      console.error('Error loading appointments dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-h3 font-bold text-neutral-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-body text-neutral-700 mb-4">{error}</p>
          <button onClick={() => {
            setLoading(true);
            loadDashboardData();
          }} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Today\'s Appointments',
      value: stats.totalToday,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: `${stats.confirmedToday} confirmed`
    },
    {
      title: 'Pending Confirmation',
      value: stats.pendingToday,
      icon: Clock,
      color: stats.pendingToday > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: stats.pendingToday > 0 ? 'bg-orange-50' : 'bg-green-50',
      trend: stats.pendingToday > 0 ? 'Needs attention' : 'All confirmed'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: `${stats.averageRating.toFixed(1)} avg rating`
    },
    {
      title: 'This Week',
      value: stats.totalThisWeek,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: `${stats.totalThisMonth} this month`
    }
  ];

  const quickActions = [
    {
      title: 'New Appointment',
      description: 'Schedule a new customer appointment',
      icon: Plus,
      href: '/dashboard/appointments/new',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Calendar View',
      description: 'View all appointments in calendar',
      icon: Calendar,
      href: '/dashboard/appointments/calendar',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Appointment Types',
      description: 'Manage appointment types and pricing',
      icon: Package,
      href: '/dashboard/appointments/types',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Resources',
      description: 'Manage rooms and equipment',
      icon: Settings,
      href: '/dashboard/appointments/resources',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Analytics',
      description: 'View appointment statistics and reports',
      icon: BarChart3,
      href: '/dashboard/appointments/analytics',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Settings',
      description: 'Configure working hours and reminders',
      icon: Settings,
      href: '/dashboard/appointments/settings',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Appointment Management</h1>
            <p className="text-body text-neutral-700 mt-1">
              Schedule and manage customer appointments, resources, and staff assignments
            </p>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-neutral-700">{stat.title}</p>
                  <p className="text-h3 font-bold text-neutral-900 mt-1">{stat.value}</p>
                  <p className="text-tiny text-neutral-600 mt-1">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Appointments */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900">Upcoming Appointments</h2>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <Link
              href="/dashboard/appointments/calendar"
              className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View Calendar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {upcomingAppointments.slice(0, 8).map((appointment) => (
            <Link
              key={appointment.id}
              href={`/dashboard/appointments/${appointment.id}`}
              className="flex items-center gap-4 p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: appointment.appointment_types?.color_code + '20' }}
              >
                <Calendar 
                  className="w-6 h-6" 
                  style={{ color: appointment.appointment_types?.color_code }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-neutral-900">
                    {appointment.customer?.full_name || appointment.customer_name}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-tiny font-medium ${getStatusBadge(appointment.status)}`}>
                    {appointment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-small text-neutral-700">
                  {appointment.appointment_types?.type_name} - {appointment.duration_minutes} min
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-neutral-900">
                  {new Date(appointment.appointment_date).toLocaleDateString('en-AE', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-small text-neutral-700">
                  {formatTime(appointment.start_time)}
                </p>
              </div>
              {appointment.customer?.phone && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `tel:${appointment.customer?.phone}`;
                    }}
                    className="p-2 rounded-lg hover:bg-glass-light transition-colors"
                    title="Call customer"
                  >
                    <Phone className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `https://wa.me/${appointment.customer?.phone?.replace(/\D/g, '')}`;
                    }}
                    className="p-2 rounded-lg hover:bg-glass-light transition-colors"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
              )}
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </Link>
          ))}
          {upcomingAppointments.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p>No upcoming appointments</p>
              <Link
                href="/dashboard/appointments/new"
                className="text-primary-600 hover:text-primary-700 text-small mt-2 inline-block"
              >
                Schedule your first appointment
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <Icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 group-hover:text-primary-600">
                      {action.title}
                    </h3>
                    <p className="text-small text-neutral-700 mt-1">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
