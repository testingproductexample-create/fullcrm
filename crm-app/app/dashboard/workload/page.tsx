'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  Users, 
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Settings,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { TaskAssignment, EmployeeWorkload, WorkloadAlert, PerformanceMetric } from '@/types/database';

interface WorkloadStats {
  totalActiveTasks: number;
  averageWorkloadPercentage: number;
  overloadedEmployees: number;
  pendingAssignments: number;
  totalEmployees: number;
  averageTaskTime: number;
  completionRate: number;
  alertsCount: number;
}

interface WorkloadAlertWithEmployee extends WorkloadAlert {
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

export default function WorkloadDashboard() {
  const [stats, setStats] = useState<WorkloadStats>({
    totalActiveTasks: 0,
    averageWorkloadPercentage: 0,
    overloadedEmployees: 0,
    pendingAssignments: 0,
    totalEmployees: 0,
    averageTaskTime: 0,
    completionRate: 0,
    alertsCount: 0
  });
  const [alerts, setAlerts] = useState<WorkloadAlertWithEmployee[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Load active tasks count (assigned status)
      const { data: activeTasks, error: activeTasksError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assignment_status', 'assigned');

      if (activeTasksError) throw activeTasksError;

      // Load pending assignments count
      const { data: pendingTasks, error: pendingTasksError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assignment_status', 'pending');

      if (pendingTasksError) throw pendingTasksError;

      // Load employee workloads for average percentage
      const { data: workloads, error: workloadsError } = await supabase
        .from('employee_workloads')
        .select('*');

      if (workloadsError) throw workloadsError;

      // Load active workload alerts (overload type, not resolved)
      const { data: workloadAlerts, error: alertsError } = await supabase
        .from('workload_alerts')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .eq('alert_status', 'active')
        .order('alert_severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Load recent task assignments for activity feed
      const { data: recentTaskAssignments, error: recentTasksError } = await supabase
        .from('task_assignments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentTasksError) throw recentTasksError;

      // Load performance metrics for completion rate
      const { data: performanceMetrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('metric_period', 'weekly')
        .order('period_start_date', { ascending: false })
        .limit(10);

      if (metricsError) throw metricsError;

      // Calculate statistics
      const totalActiveTasks = activeTasks?.length || 0;
      const pendingAssignments = pendingTasks?.length || 0;
      const totalEmployees = workloads?.length || 0;
      
      // Calculate average workload percentage
      const averageWorkloadPercentage = workloads?.length 
        ? workloads.reduce((sum, workload) => {
            const utilization = (workload.current_workload_hours / workload.max_capacity_hours) * 100;
            return sum + Math.min(utilization, 100); // Cap at 100%
          }, 0) / workloads.length
        : 0;

      // Count overloaded employees from alerts
      const overloadedEmployees = workloadAlerts?.filter(alert => 
        alert.alert_type === 'overload'
      ).length || 0;

      // Calculate average task completion time
      const averageTaskTime = activeTasks?.length
        ? activeTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0) / activeTasks.length
        : 0;

      // Calculate completion rate from performance metrics
      const completionRate = performanceMetrics?.length
        ? performanceMetrics.reduce((sum, metric) => sum + metric.completion_rate, 0) / performanceMetrics.length
        : 0;

      setStats({
        totalActiveTasks,
        averageWorkloadPercentage: Math.round(averageWorkloadPercentage),
        overloadedEmployees,
        pendingAssignments,
        totalEmployees,
        averageTaskTime: Math.round(averageTaskTime * 10) / 10,
        completionRate: Math.round(completionRate),
        alertsCount: workloadAlerts?.length || 0
      });

      setAlerts(workloadAlerts || []);
      setRecentTasks(recentTaskAssignments || []);

    } catch (error) {
      console.error('Error loading workload dashboard data:', error);
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-h3 font-bold text-neutral-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-body text-neutral-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadDashboardData();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Assign New Task',
      description: 'Intelligent task assignment with skill matching',
      icon: UserPlus,
      href: '/dashboard/workload/assign',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Balance Workload',
      description: 'Redistribute tasks for optimal efficiency',
      icon: BarChart3,
      href: '/dashboard/workload/balance',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'View Capacity Plan',
      description: 'Resource forecasting and planning',
      icon: Calendar,
      href: '/dashboard/workload/capacity',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Performance Analytics',
      description: 'Track team productivity and metrics',
      icon: TrendingUp,
      href: '/dashboard/workload/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Assignment Rules',
      description: 'Configure automated assignment logic',
      icon: Settings,
      href: '/dashboard/workload/rules',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Team Collaboration',
      description: 'Manage multi-employee tasks',
      icon: Users,
      href: '/dashboard/workload/collaboration',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  const statsCards = [
    {
      title: 'Active Tasks',
      value: stats.totalActiveTasks,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: `${stats.pendingAssignments} pending assignment`
    },
    {
      title: 'Avg Workload',
      value: `${stats.averageWorkloadPercentage}%`,
      icon: Target,
      color: stats.averageWorkloadPercentage > 85 ? 'text-red-600' : stats.averageWorkloadPercentage > 70 ? 'text-orange-600' : 'text-green-600',
      bgColor: stats.averageWorkloadPercentage > 85 ? 'bg-red-50' : stats.averageWorkloadPercentage > 70 ? 'bg-orange-50' : 'bg-green-50',
      trend: `${stats.totalEmployees} employees tracked`
    },
    {
      title: 'Overloaded Staff',
      value: stats.overloadedEmployees,
      icon: AlertTriangle,
      color: stats.overloadedEmployees > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.overloadedEmployees > 0 ? 'bg-red-50' : 'bg-green-50',
      trend: stats.overloadedEmployees > 0 ? 'Needs attention' : 'All within capacity'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: `${stats.averageTaskTime}h avg time`
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'overload':
        return AlertTriangle;
      case 'underutilized':
        return TrendingUp;
      case 'skill_gap':
        return Users;
      case 'deadline_risk':
        return Clock;
      case 'quality_concern':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Workload Management</h1>
            <p className="text-body text-neutral-700 mt-1">
              Intelligent task assignment and workforce optimization
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/workload/assign"
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Assign Task
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

      {/* Workload Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-bold text-neutral-900">Workload Alerts</h2>
            <Link
              href="/dashboard/workload/alerts"
              className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const AlertIcon = getAlertTypeIcon(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    alert.alert_severity === 'critical' ? 'bg-red-100' :
                    alert.alert_severity === 'high' ? 'bg-orange-100' :
                    alert.alert_severity === 'medium' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <AlertIcon className={`w-5 h-5 ${
                      alert.alert_severity === 'critical' ? 'text-red-600' :
                      alert.alert_severity === 'high' ? 'text-orange-600' :
                      alert.alert_severity === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-neutral-900">{alert.alert_title}</h3>
                      <span className={`px-2 py-1 rounded-full text-tiny font-medium border ${getSeverityBadge(alert.alert_severity)}`}>
                        {alert.alert_severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-small text-neutral-700">{alert.alert_message}</p>
                    {alert.employee && (
                      <p className="text-tiny text-neutral-600 mt-1">
                        Employee: {alert.employee.first_name} {alert.employee.last_name} - {alert.employee.job_title}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-tiny text-neutral-600">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                    {alert.capacity_utilization_percentage && (
                      <p className="text-tiny font-medium text-neutral-900">
                        {Math.round(alert.capacity_utilization_percentage)}% capacity
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Recent Task Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900">Recent Task Activity</h2>
          <Link
            href="/dashboard/workload/tasks"
            className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View All Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-glass-border hover:bg-glass-light transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                task.assignment_status === 'completed' ? 'bg-green-100' :
                task.assignment_status === 'in_progress' ? 'bg-blue-100' :
                task.assignment_status === 'assigned' ? 'bg-orange-100' :
                'bg-gray-100'
              }`}>
                <Activity className={`w-5 h-5 ${
                  task.assignment_status === 'completed' ? 'text-green-600' :
                  task.assignment_status === 'in_progress' ? 'text-blue-600' :
                  task.assignment_status === 'assigned' ? 'text-orange-600' :
                  'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{task.task_name}</p>
                <p className="text-small text-neutral-700">{task.task_type}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-2 py-1 rounded-full text-tiny font-medium ${
                  task.assignment_status === 'completed' ? 'bg-green-100 text-green-700' :
                  task.assignment_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  task.assignment_status === 'assigned' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.assignment_status.replace('_', ' ').toUpperCase()}
                </div>
                <p className="text-tiny text-neutral-600 mt-1">
                  {task.priority_level.toUpperCase()} • {task.estimated_hours}h
                </p>
              </div>
            </div>
          ))}
          {recentTasks.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p>No recent task activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}