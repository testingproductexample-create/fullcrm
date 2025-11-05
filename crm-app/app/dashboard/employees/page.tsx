'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Award,
  AlertTriangle,
  TrendingUp,
  Building,
  GraduationCap,
  Star,
  Clock,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { Employee, Department, PerformanceReview, TrainingProgram } from '@/types/database';

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingReviews: number;
  expiringVisas: number;
  activeTraining: number;
  averageRating: number;
  newHires: number;
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    pendingReviews: 0,
    expiringVisas: 0,
    activeTraining: 0,
    averageRating: 0,
    newHires: 0
  });
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [recentReviews, setRecentReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load employee statistics
      const { data: employees } = await supabase
        .from('employees')
        .select('*, departments(department_name)');
      
      const { data: departments } = await supabase
        .from('departments')
        .select('*');

      const { data: reviews } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('review_status', 'Completed')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: visaTracking } = await supabase
        .from('visa_tracking')
        .select('*')
        .lt('expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

      const { data: training } = await supabase
        .from('employee_training')
        .select('*')
        .eq('training_status', 'In Progress');

      // Calculate statistics
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.employment_status === 'Active').length || 0;
      const totalDepartments = departments?.length || 0;
      const expiringVisas = visaTracking?.length || 0;
      const activeTraining = training?.length || 0;
      
      // Calculate average performance rating
      const averageRating = reviews?.length 
        ? reviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviews.length
        : 0;

      // New hires in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newHires = employees?.filter(emp => 
        new Date(emp.hire_date) >= thirtyDaysAgo
      ).length || 0;

      setStats({
        totalEmployees,
        activeEmployees,
        totalDepartments,
        pendingReviews: 0, // Could add pending reviews logic
        expiringVisas,
        activeTraining,
        averageRating,
        newHires
      });

      setRecentEmployees(employees?.slice(0, 5) || []);
      setRecentReviews(reviews || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  const quickActions = [
    {
      title: 'Employee Directory',
      description: 'View and manage all employees',
      icon: Users,
      href: '/dashboard/employees/directory',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Skills Management',
      description: 'Track employee skills and certifications',
      icon: Award,
      href: '/dashboard/employees/skills',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Performance Reviews',
      description: 'Manage performance evaluations',
      icon: Star,
      href: '/dashboard/employees/reviews',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Training Programs',
      description: 'Oversee training and development',
      icon: GraduationCap,
      href: '/dashboard/employees/training',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Department Management',
      description: 'Organize departments and hierarchy',
      icon: Building,
      href: '/dashboard/employees/departments',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const statsCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: `+${stats.newHires} new this month`
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: `${Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}% active`
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: Building,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'Across organization'
    },
    {
      title: 'Avg Performance',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'Out of 5.0'
    }
  ];

  const alerts = [
    ...(stats.expiringVisas > 0 ? [{
      type: 'warning' as const,
      title: 'Visa Renewals Due',
      message: `${stats.expiringVisas} visa(s) expiring within 90 days`,
      action: 'Review visa tracking',
      href: '/dashboard/employees/directory?filter=visa-expiring'
    }] : []),
    ...(stats.activeTraining > 0 ? [{
      type: 'info' as const,
      title: 'Active Training',
      message: `${stats.activeTraining} employee(s) currently in training`,
      action: 'View training progress',
      href: '/dashboard/employees/training'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Employee Management</h1>
            <p className="text-body text-neutral-700 mt-1">
              Comprehensive HR management for your tailoring business
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/employees/directory"
              className="btn-primary flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              View All Employees
            </Link>
          </div>
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

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className={`glass-card p-4 border-l-4 ${
              alert.type === 'warning' ? 'border-orange-500' : 'border-blue-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <h3 className="font-medium text-neutral-900">{alert.title}</h3>
                    <p className="text-small text-neutral-700">{alert.message}</p>
                  </div>
                </div>
                <Link
                  href={alert.href}
                  className="text-small font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {alert.action}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-bold text-neutral-900">Recent Employees</h2>
            <Link
              href="/dashboard/employees/directory"
              className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentEmployees.map((employee) => (
              <Link
                key={employee.id}
                href={`/dashboard/employees/profile/${employee.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-small font-medium text-primary-600">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-small text-neutral-700">{employee.job_title}</p>
                </div>
                <div className="text-right">
                  <p className="text-tiny text-neutral-600">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded-full text-tiny ${
                    employee.employment_status === 'Active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {employee.employment_status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Performance Reviews */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-bold text-neutral-900">Recent Reviews</h2>
            <Link
              href="/dashboard/employees/reviews"
              className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-glass-border"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{review.review_type}</p>
                  <p className="text-small text-neutral-700">
                    {new Date(review.review_period_start).toLocaleDateString()} - 
                    {new Date(review.review_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-orange-500 fill-current" />
                    <span className="font-medium text-neutral-900">
                      {review.overall_rating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <p className="text-tiny text-neutral-600">{review.overall_rating_text}</p>
                </div>
              </div>
            ))}
            {recentReviews.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Star className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p>No reviews completed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}