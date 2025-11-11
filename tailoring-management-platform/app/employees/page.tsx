'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Calendar, 
  Award, 
  AlertTriangle,
  BookOpen,
  Building,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Employee, EmployeeStats, DepartmentStats } from '@/types/employee';
import { formatAEDCurrency, getEmployeeStatusColor } from '@/types/employee';

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  href?: string;
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [recentHires, setRecentHires] = useState<Employee[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);

  // Fetch employee statistics
  const { data: employeeStats, isLoading: statsLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async (): Promise<EmployeeStats> => {
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          id,
          employment_status,
          hire_date,
          created_at
        `);

      if (error) throw error;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.employment_status === 'Active').length || 0;
      const employeesOnLeave = employees?.filter(emp => emp.employment_status === 'On Leave').length || 0;

      const newHiresThisMonth = employees?.filter(emp => {
        const hireDate = new Date(emp.hire_date || emp.created_at);
        return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
      }).length || 0;

      const terminationsThisMonth = employees?.filter(emp => {
        if (emp.employment_status !== 'Terminated') return false;
        // You would need termination_date field for accurate calculation
        return false;
      }).length || 0;

      // Calculate average tenure
      const avgTenure = employees?.reduce((sum, emp) => {
        const hireDate = new Date(emp.hire_date || emp.created_at);
        const monthsWorked = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return sum + monthsWorked;
      }, 0) / totalEmployees || 0;

      // Get department count
      const { data: departments } = await supabase
        .from('departments')
        .select('id');

      // Get pending performance reviews
      const { data: reviews } = await supabase
        .from('performance_reviews')
        .select('id')
        .eq('status', 'Pending');

      // Get training completions this month
      const { data: trainings } = await supabase
        .from('employee_training')
        .select('completion_date')
        .eq('status', 'Completed')
        .gte('completion_date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      // Get visa expirations
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      const { data: visas } = await supabase
        .from('visa_tracking')
        .select('id')
        .eq('status', 'Valid')
        .lte('expiry_date', threeMonthsFromNow.toISOString().split('T')[0]);

      return {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        new_hires_this_month: newHiresThisMonth,
        employees_on_leave: employeesOnLeave,
        terminations_this_month: terminationsThisMonth,
        average_tenure_months: Math.round(avgTenure),
        departments_count: departments?.length || 0,
        pending_performance_reviews: reviews?.length || 0,
        training_completions_this_month: trainings?.length || 0,
        visa_expiring_soon: visas?.length || 0,
      };
    },
  });

  // Fetch department statistics
  const { data: deptStats, isLoading: deptLoading } = useQuery({
    queryKey: ['department-stats'],
    queryFn: async (): Promise<DepartmentStats[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          employees:employees(
            id,
            basic_salary,
            housing_allowance,
            transport_allowance,
            performance_reviews(overall_rating)
          )
        `);

      if (error) throw error;

      return data?.map(dept => ({
        department_id: dept.id,
        department_name: dept.name,
        total_employees: dept.employees?.length || 0,
        average_salary: dept.employees?.reduce((sum, emp) => {
          const totalSalary = (emp.basic_salary || 0) + (emp.housing_allowance || 0) + (emp.transport_allowance || 0);
          return sum + totalSalary;
        }, 0) / (dept.employees?.length || 1),
        total_payroll: dept.employees?.reduce((sum, emp) => {
          const totalSalary = (emp.basic_salary || 0) + (emp.housing_allowance || 0) + (emp.transport_allowance || 0);
          return sum + totalSalary;
        }, 0) || 0,
        performance_rating_avg: dept.employees?.reduce((sum, emp) => {
          const latestReview = emp.performance_reviews?.[0];
          return sum + (latestReview?.overall_rating || 0);
        }, 0) / (dept.employees?.length || 1),
        training_hours_completed: 0, // Would need to calculate from training data
        employee_satisfaction: 0, // Would need survey data
      })) || [];
    },
  });

  // Fetch recent hires
  const { data: hires } = useQuery({
    queryKey: ['recent-hires'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          position,
          hire_date,
          employment_status,
          profile_photo_url,
          departments(name)
        `)
        .order('hire_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as any as Employee[];
    },
  });

  // Fetch upcoming reviews
  const { data: reviews } = useQuery({
    queryKey: ['upcoming-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          id,
          review_period_end,
          review_type,
          status,
          employees(
            id,
            first_name,
            last_name,
            position
          )
        `)
        .eq('status', 'In Progress')
        .order('review_period_end', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    setStats(employeeStats || null);
    setDepartmentStats(deptStats || []);
    setRecentHires(hires || []);
    setUpcomingReviews(reviews || []);
  }, [employeeStats, deptStats, hires, reviews]);

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total Employees',
      value: stats?.total_employees || 0,
      subtitle: `${stats?.active_employees || 0} active`,
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600 bg-blue-100',
      href: '/employees/directory'
    },
    {
      title: 'New Hires',
      value: stats?.new_hires_this_month || 0,
      subtitle: 'This month',
      icon: <UserPlus className="h-6 w-6" />,
      color: 'text-green-600 bg-green-100',
      trend: '+12%'
    },
    {
      title: 'On Leave',
      value: stats?.employees_on_leave || 0,
      subtitle: 'Currently',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Avg Tenure',
      value: `${stats?.average_tenure_months || 0}mo`,
      subtitle: 'Company average',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Pending Reviews',
      value: stats?.pending_performance_reviews || 0,
      subtitle: 'Due soon',
      icon: <Award className="h-6 w-6" />,
      color: 'text-orange-600 bg-orange-100',
      href: '/employees/reviews'
    },
    {
      title: 'Visa Alerts',
      value: stats?.visa_expiring_soon || 0,
      subtitle: 'Expiring in 3 months',
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Training Complete',
      value: stats?.training_completions_this_month || 0,
      subtitle: 'This month',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'text-indigo-600 bg-indigo-100',
      href: '/employees/training'
    },
    {
      title: 'Departments',
      value: stats?.departments_count || 0,
      subtitle: 'Active departments',
      icon: <Building className="h-6 w-6" />,
      color: 'text-gray-600 bg-gray-100'
    }
  ];

  if (statsLoading || deptLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive workforce management and analytics</p>
        </div>
        <Link
          href={`/employees/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {card.href ? (
              <Link href={card.href} className="block">
                <CardContent card={card} />
              </Link>
            ) : (
              <CardContent card={card} />
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Hires */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Hires</h2>
            <Link href={`/employees/directory`} className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentHires.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {employee.profile_photo_url ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={employee.profile_photo_url}
                      alt={`${employee.first_name} ${employee.last_name}`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {employee.position} • {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'No hire date'}
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmployeeStatusColor(employee.employment_status || 'Active')}`}>
                    {employee.employment_status || 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Overview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
          <div className="space-y-4">
            {departmentStats.slice(0, 5).map((dept) => (
              <div key={dept.department_id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{dept.department_name}</p>
                  <p className="text-xs text-gray-500">{dept.total_employees} employees</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatAEDCurrency(dept.average_salary)}
                  </p>
                  <p className="text-xs text-gray-500">Avg salary</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Reviews */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Reviews</h2>
            <Link href={`/employees/reviews`} className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {review.employees?.first_name} {review.employees?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.review_type} • Due: {new Date(review.review_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-xs text-gray-500">
                    {Math.ceil((new Date(review.review_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/employees/new`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Add Employee</p>
              <p className="text-xs text-gray-500">Create new employee profile</p>
            </div>
          </Link>
          
          <Link
            href={`/employees/reviews`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Award className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Performance Reviews</p>
              <p className="text-xs text-gray-500">Manage employee evaluations</p>
            </div>
          </Link>
          
          <Link
            href={`/employees/training`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Training Programs</p>
              <p className="text-xs text-gray-500">Enroll in training courses</p>
            </div>
          </Link>
          
          <Link
            href={`/employees/skills`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircle className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Skills Management</p>
              <p className="text-xs text-gray-500">Track employee skills & certifications</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CardContent({ card }: { card: DashboardCard }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${card.color}`}>
          {card.icon}
        </div>
        {card.trend && (
          <span className="text-sm font-medium text-green-600">{card.trend}</span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
        <p className="text-sm text-gray-600">{card.title}</p>
        {card.subtitle && (
          <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
        )}
      </div>
    </>
  );
}