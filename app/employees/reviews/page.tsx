'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Award, 
  TrendingUp,
  Calendar,
  Users,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Eye,
  FileText,
  BarChart
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  Employee, 
  PerformanceReview,
  PerformanceAnalytics,
  CreatePerformanceReviewInput
} from '@/types/employee';
import { 
  formatEmployeeName, 
  getPerformanceRatingColor,
  getEmployeeStatusColor 
} from '@/types/employee';

interface PerformanceReviewWithEmployee extends PerformanceReview {
  employee: Employee;
  reviewer?: Employee;
}

export default function PerformanceReviewsPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'analytics' | 'schedule'>('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedReviewType, setSelectedReviewType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch performance reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: async (): Promise<PerformanceReviewWithEmployee[]> => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employee:employees(*),
          reviewer:employees!reviewer_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees for dropdowns and analytics
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Performance analytics
  const { data: analytics } = useQuery({
    queryKey: ['performance-analytics'],
    queryFn: async (): Promise<PerformanceAnalytics> => {
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.floor((new Date().getMonth() / 3)) + 1;
      
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employee:employees(*)
        `)
        .gte('review_period_start', `${currentYear}-01-01`)
        .lte('review_period_end', `${currentYear}-12-31`);

      if (error) throw error;

      const totalReviews = data?.length || 0;
      const completedReviews = data?.filter(r => r.status === 'Completed') || [];
      const averageRating = completedReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / (completedReviews.length || 1);
      
      // Sort by performance rating
      const sortedEmployees = completedReviews
        .filter(r => r.overall_rating !== null)
        .sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));

      const topPerformers = sortedEmployees.slice(0, 5).map(r => r.employee);
      const improvementNeeded = sortedEmployees.slice(-3).map(r => r.employee);

      const goalAchievementRate = completedReviews.filter(r => 
        r.goals_achieved && r.goals_achieved.toLowerCase().includes('achieved')
      ).length / (completedReviews.length || 1);

      const trainingRecommendationsCount = completedReviews.filter(r => 
        r.training_recommendations && r.training_recommendations.trim().length > 0
      ).length;

      return {
        period: `Q${currentQuarter} ${currentYear}`,
        total_reviews: totalReviews,
        average_overall_rating: averageRating,
        top_performers: topPerformers,
        improvement_needed: improvementNeeded,
        goal_achievement_rate: goalAchievementRate,
        training_recommendations_count: trainingRecommendationsCount,
      };
    },
  });

  // Filter reviews
  const filteredReviews = reviews?.filter(review => {
    const matchesSearch = !searchTerm || 
      formatEmployeeName(review.employee).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.reviewer && formatEmployeeName(review.reviewer).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !selectedStatus || review.status === selectedStatus;
    const matchesType = !selectedReviewType || review.review_type === selectedReviewType;
    
    let matchesPeriod = true;
    if (selectedPeriod) {
      const reviewDate = new Date(review.review_period_end);
      const now = new Date();
      const months = parseInt(selectedPeriod);
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      matchesPeriod = reviewDate >= cutoffDate;
    }

    return matchesSearch && matchesStatus && matchesType && matchesPeriod;
  }) || [];

  // Stats calculations
  const totalReviews = reviews?.length || 0;
  const pendingReviews = reviews?.filter(r => r.status === 'In Progress' || r.status === 'Draft').length || 0;
  const overDueReviews = reviews?.filter(r => {
    if (r.status === 'Completed') return false;
    return new Date(r.review_period_end) < new Date();
  }).length || 0;
  const averageRating = analytics?.average_overall_rating || 0;

  const statsCards = [
    {
      title: 'Total Reviews',
      value: totalReviews,
      subtitle: 'All time',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Pending Reviews',
      value: pendingReviews,
      subtitle: 'In progress',
      icon: <Clock className="h-6 w-6" />,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Overdue',
      value: overDueReviews,
      subtitle: 'Past due date',
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Avg Rating',
      value: `${averageRating.toFixed(1)}/5`,
      subtitle: 'Organization average',
      icon: <Star className="h-6 w-6" />,
      color: 'text-green-600 bg-green-100'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Draft': return 'text-gray-600 bg-gray-100';
      case 'Approved': return 'text-purple-600 bg-purple-100';
      case 'Archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isOverdue = (review: PerformanceReviewWithEmployee) => {
    if (review.status === 'Completed') return false;
    return new Date(review.review_period_end) < new Date();
  };

  if (reviewsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600 mt-1">Manage employee evaluations and performance tracking</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Review
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'reviews', name: 'Reviews', icon: FileText },
              { id: 'analytics', name: 'Analytics', icon: BarChart },
              { id: 'schedule', name: 'Schedule', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by employee or reviewer name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                  </select>

                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedReviewType}
                    onChange={(e) => setSelectedReviewType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="Annual">Annual</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Mid-year">Mid-year</option>
                    <option value="Probation">Probation</option>
                    <option value="360-degree">360-degree</option>
                  </select>

                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <option value="">All Periods</option>
                    <option value="3">Last 3 months</option>
                    <option value="6">Last 6 months</option>
                    <option value="12">Last 12 months</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                        isOverdue(review) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {review.employee?.first_name?.[0]}{review.employee?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatEmployeeName(review.employee)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {review.employee.position} • {review.review_type} Review
                            </p>
                            <p className="text-xs text-gray-500">
                              Period: {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Status */}
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                              {review.status}
                            </span>
                            {isOverdue(review) && (
                              <p className="text-xs text-red-600 mt-1">Overdue</p>
                            )}
                          </div>

                          {/* Rating */}
                          {review.overall_rating && (
                            <div className="text-center">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceRatingColor(review.overall_rating)}`}>
                                <Star className="h-4 w-4 mr-1" />
                                {review.overall_rating}/5
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/employees/reviews/${review.id}`}
                              className="p-2 text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/employees/reviews/${review.id}/Edit`}
                              className="p-2 text-green-600 hover:text-green-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Review Details */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="block text-gray-500">Technical Skills</span>
                          <span className="font-medium">{review.technical_skills_rating || '-'}/5</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Communication</span>
                          <span className="font-medium">{review.communication_rating || '-'}/5</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Teamwork</span>
                          <span className="font-medium">{review.teamwork_rating || '-'}/5</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Leadership</span>
                          <span className="font-medium">{review.leadership_rating || '-'}/5</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Initiative</span>
                          <span className="font-medium">{review.initiative_rating || '-'}/5</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Reliability</span>
                          <span className="font-medium">{review.reliability_rating || '-'}/5</span>
                        </div>
                      </div>

                      {/* Reviewer and Timeline */}
                      {(review.reviewer || review.submission_date) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                          <div>
                            {review.reviewer && (
                              <span>Reviewer: {formatEmployeeName(review.reviewer)}</span>
                            )}
                          </div>
                          <div>
                            {review.submission_date && (
                              <span>Submitted: {new Date(review.submission_date).toLocaleDateString()}</span>
                            )}
                            {review.approval_date && (
                              <span className="ml-4">Approved: {new Date(review.approval_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || selectedStatus || selectedReviewType || selectedPeriod
                        ? "Try adjusting your search criteria."
                        : "Get started by creating your first performance review."}
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview ({analytics.period})</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <BarChart className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Average Rating</p>
                        <p className="text-2xl font-bold text-blue-700">{analytics.average_overall_rating.toFixed(1)}/5</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Goal Achievement</p>
                        <p className="text-2xl font-bold text-green-700">{(analytics.goal_achievement_rate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Total Reviews</p>
                        <p className="text-2xl font-bold text-purple-700">{analytics.total_reviews}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.top_performers.map((employee, index) => (
                    <div key={employee.id} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{formatEmployeeName(employee)}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Needed */}
              {analytics.improvement_needed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Focus</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.improvement_needed.map((employee) => (
                      <div key={employee.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-yellow-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{formatEmployeeName(employee)}</h4>
                            <p className="text-sm text-gray-600">{employee.position}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Review Scheduling</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Automated review scheduling and reminders coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Performance Review</h3>
            <p className="text-gray-600 mb-4">Modal implementation coming soon...</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}