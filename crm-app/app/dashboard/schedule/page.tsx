'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  TrendingUp,
  MapPin,
  Settings,
  FileText,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Coffee,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { AttendanceRecord, ShiftAssignment, LeaveRequest, OvertimeRecord, WorkShift } from '@/types/database';

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  totalOvertimeHours: number;
  averageAttendanceRate: number;
}

interface TodayAttendance extends AttendanceRecord {
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
  shift?: {
    shift_name: string;
    start_time: string;
    end_time: string;
  };
}

export default function AttendanceDashboard() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    pendingLeaveRequests: 0,
    totalOvertimeHours: 0,
    averageAttendanceRate: 0
  });
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance[]>([]);
  const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Load today's attendance records with employee and shift details
      const { data: todayRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          ),
          shift_assignments!inner (
            shift_id,
            work_shifts (
              shift_name,
              start_time,
              end_time
            )
          )
        `)
        .eq('attendance_date', today)
        .order('check_in_time', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Load all employees count
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('employment_status', 'Active');

      if (employeesError) throw employeesError;

      // Load pending leave requests
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .eq('request_status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(5);

      if (leaveError) throw leaveError;

      // Load recent overtime records
      const { data: overtimeRecords, error: overtimeError } = await supabase
        .from('overtime_records')
        .select('overtime_hours')
        .gte('overtime_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (overtimeError) throw overtimeError;

      // Calculate statistics
      const totalEmployees = employees?.length || 0;
      const presentToday = todayRecords?.filter(record => 
        record.attendance_status === 'present' || record.attendance_status === 'late'
      ).length || 0;
      const absentToday = todayRecords?.filter(record => 
        record.attendance_status === 'absent'
      ).length || 0;
      const lateToday = todayRecords?.filter(record => 
        record.attendance_status === 'late'
      ).length || 0;
      const onLeaveToday = todayRecords?.filter(record => 
        record.attendance_status === 'on_leave'
      ).length || 0;
      
      const totalOvertimeHours = overtimeRecords?.reduce((sum, record) => 
        sum + (record.overtime_hours || 0), 0
      ) || 0;

      const averageAttendanceRate = totalEmployees > 0 
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0;

      setStats({
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        onLeaveToday,
        pendingLeaveRequests: leaveRequests?.length || 0,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        averageAttendanceRate
      });

      setTodayAttendance(todayRecords || []);
      setRecentLeaveRequests(leaveRequests || []);

    } catch (error) {
      console.error('Error loading attendance dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckIn = async () => {
    // This would implement quick check-in functionality
    router.push('/dashboard/schedule/attendance');
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
      title: 'Shift Management',
      description: 'Create and manage work shifts',
      icon: Calendar,
      href: '/dashboard/schedule/shifts',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Attendance Records',
      description: 'View and manage attendance records',
      icon: Clock,
      href: '/dashboard/schedule/attendance',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Leave Management',
      description: 'Process leave requests and balances',
      icon: Coffee,
      href: '/dashboard/schedule/leave',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Overtime Tracking',
      description: 'Monitor overtime hours and approvals',
      icon: Timer,
      href: '/dashboard/schedule/overtime',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Attendance Reports',
      description: 'Generate UAE compliance reports',
      icon: FileText,
      href: '/dashboard/schedule/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Device Management',
      description: 'Manage biometric and GPS devices',
      icon: Settings,
      href: '/dashboard/schedule/devices',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  const statsCards = [
    {
      title: 'Present Today',
      value: stats.presentToday,
      total: stats.totalEmployees,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: `${stats.averageAttendanceRate}% attendance rate`
    },
    {
      title: 'Late Arrivals',
      value: stats.lateToday,
      icon: AlertTriangle,
      color: stats.lateToday > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: stats.lateToday > 0 ? 'bg-orange-50' : 'bg-green-50',
      trend: stats.lateToday > 0 ? 'Needs attention' : 'On time arrivals'
    },
    {
      title: 'On Leave',
      value: stats.onLeaveToday,
      icon: Coffee,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: `${stats.pendingLeaveRequests} pending requests`
    },
    {
      title: 'Overtime (Week)',
      value: `${stats.totalOvertimeHours}h`,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'Within UAE limits'
    }
  ];

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-blue-100 text-blue-800';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-AE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Current Time */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Attendance Management</h1>
            <p className="text-body text-neutral-700 mt-1">
              UAE labor law compliant workforce tracking and scheduling
            </p>
          </div>
          <div className="text-right">
            <div className="text-h3 font-bold text-neutral-900">
              {currentTime.toLocaleTimeString('en-AE', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-small text-neutral-600">
              {currentTime.toLocaleDateString('en-AE', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
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
                  <p className="text-h3 font-bold text-neutral-900 mt-1">
                    {stat.value}
                    {stat.total && <span className="text-small text-neutral-600">/{stat.total}</span>}
                  </p>
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

      {/* Today's Attendance Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900">Today's Attendance</h2>
          <Link
            href="/dashboard/schedule/attendance"
            className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View All Records
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {todayAttendance.slice(0, 8).map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-4 p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-small font-medium text-primary-600">
                  {record.employee?.first_name[0]}{record.employee?.last_name[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">
                  {record.employee?.first_name} {record.employee?.last_name}
                </p>
                <p className="text-small text-neutral-700">{record.employee?.job_title}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-neutral-600" />
                  <span className="text-small font-medium">
                    {record.check_in_time ? formatTime(record.check_in_time) : 'N/A'} - {record.check_out_time ? formatTime(record.check_out_time) : 'N/A'}
                  </span>
                </div>
                <p className="text-tiny text-neutral-600">
                  {record.total_work_hours}h worked
                  {record.overtime_hours > 0 && ` (+${record.overtime_hours}h OT)`}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-2 py-1 rounded-full text-tiny font-medium ${getAttendanceStatusBadge(record.attendance_status)}`}>
                  {record.attendance_status.replace('_', ' ').toUpperCase()}
                </div>
                {record.late_arrival_minutes > 0 && (
                  <p className="text-tiny text-orange-600 mt-1">
                    {record.late_arrival_minutes} min late
                  </p>
                )}
              </div>
            </div>
          ))}
          {todayAttendance.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p>No attendance records for today</p>
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

      {/* Recent Leave Requests */}
      {recentLeaveRequests.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-bold text-neutral-900">Pending Leave Requests</h2>
            <Link
              href="/dashboard/schedule/leave"
              className="text-small text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All Requests
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeaveRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-4 p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  request.leave_type === 'annual' ? 'bg-blue-100' :
                  request.leave_type === 'sick' ? 'bg-red-100' :
                  request.leave_type === 'maternity' ? 'bg-pink-100' :
                  'bg-orange-100'
                }`}>
                  <Coffee className={`w-5 h-5 ${
                    request.leave_type === 'annual' ? 'text-blue-600' :
                    request.leave_type === 'sick' ? 'text-red-600' :
                    request.leave_type === 'maternity' ? 'text-pink-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">
                    {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)} Leave
                  </p>
                  <p className="text-small text-neutral-700">
                    {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-small font-medium text-neutral-900">
                    {request.working_days} days
                  </p>
                  <p className="text-tiny text-neutral-600">
                    Requested {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}