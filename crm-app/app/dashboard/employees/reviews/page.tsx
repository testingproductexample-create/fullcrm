'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Star, 
  Plus, 
  Search, 
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Edit,
  FileText,
  Award,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { PerformanceReview, Employee, Department } from '@/types/database';

interface ReviewWithEmployee extends PerformanceReview {
  employees?: {
    first_name: string;
    last_name: string;
    job_title: string;
    departments?: {
      department_name: string;
    };
  };
  reviewer?: {
    first_name: string;
    last_name: string;
  };
}

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState<ReviewWithEmployee[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadReviews();
    loadEmployees();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, selectedPeriod, selectedStatus, activeTab]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employees!performance_reviews_employee_id_fkey(
            first_name,
            last_name,
            job_title,
            departments(department_name)
          ),
          reviewer:employees!performance_reviews_reviewer_id_fkey(
            first_name,
            last_name
          )
        `)
        .order('review_period_end', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title')
        .eq('employment_status', 'Active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    // Tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(review => 
        review.review_status === 'In Progress' || 
        review.review_status === 'Pending' ||
        !review.review_status
      );
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(review => review.review_status === 'Completed');
    } else if (activeTab === 'due') {
      const today = new Date();
      filtered = filtered.filter(review => 
        new Date(review.review_period_end) <= today && 
        review.review_status !== 'Completed'
      );
    }

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        review.employees?.first_name.toLowerCase().includes(term) ||
        review.employees?.last_name.toLowerCase().includes(term) ||
        review.review_type.toLowerCase().includes(term) ||
        review.review_cycle?.toLowerCase().includes(term)
      );
    }

    // Period filter
    if (selectedPeriod) {
      filtered = filtered.filter(review => review.review_cycle === selectedPeriod);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(review => review.review_status === selectedStatus);
    }

    setFilteredReviews(filtered);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateAverageRating = () => {
    const completedReviews = reviews.filter(r => r.overall_rating);
    if (completedReviews.length === 0) return 0;
    const sum = completedReviews.reduce((acc, review) => acc + (review.overall_rating || 0), 0);
    return sum / completedReviews.length;
  };

  const getUpcomingReviews = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return reviews.filter(review => {
      const endDate = new Date(review.review_period_end);
      return endDate >= today && endDate <= thirtyDaysFromNow && review.review_status !== 'Completed';
    }).length;
  };

  // Statistics
  const stats = {
    totalReviews: reviews.length,
    completedReviews: reviews.filter(r => r.review_status === 'Completed').length,
    pendingReviews: reviews.filter(r => r.review_status !== 'Completed').length,
    averageRating: calculateAverageRating(),
    upcomingReviews: getUpcomingReviews()
  };

  const reviewPeriods = [...new Set(reviews.map(r => r.review_cycle).filter(Boolean))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-neutral-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Performance Reviews</h1>
            <p className="text-body text-neutral-700 mt-1">
              Manage employee performance evaluations and track development
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/employees/reviews/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Review
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-small font-medium text-blue-700">Total Reviews</span>
            </div>
            <p className="text-h3 font-bold text-blue-900 mt-1">{stats.totalReviews}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-small font-medium text-green-700">Completed</span>
            </div>
            <p className="text-h3 font-bold text-green-900 mt-1">{stats.completedReviews}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-small font-medium text-yellow-700">Pending</span>
            </div>
            <p className="text-h3 font-bold text-yellow-900 mt-1">{stats.pendingReviews}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="text-small font-medium text-purple-700">Avg Rating</span>
            </div>
            <p className="text-h3 font-bold text-purple-900 mt-1">{stats.averageRating.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-small font-medium text-orange-700">Due Soon</span>
            </div>
            <p className="text-h3 font-bold text-orange-900 mt-1">{stats.upcomingReviews}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-glass-border">
          <nav className="flex space-x-8">
            {[
              { id: 'all', label: 'All Reviews', count: reviews.length },
              { id: 'pending', label: 'Pending', count: stats.pendingReviews },
              { id: 'completed', label: 'Completed', count: stats.completedReviews },
              { id: 'due', label: 'Due Soon', count: stats.upcomingReviews }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-700 hover:text-neutral-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search employees or review types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Periods</option>
              {reviewPeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-h3 font-bold text-neutral-900">
                    {review.employees?.first_name} {review.employees?.last_name}
                  </h3>
                  <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getStatusColor(review.review_status)}`}>
                    {review.review_status || 'Pending'}
                  </div>
                  {review.overall_rating && (
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 fill-current ${getRatingColor(review.overall_rating)}`} />
                      <span className={`font-medium ${getRatingColor(review.overall_rating)}`}>
                        {review.overall_rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-small text-neutral-700 mb-2">
                  <span>{review.review_type}</span>
                  {review.review_cycle && <span>Cycle: {review.review_cycle}</span>}
                  <span>
                    Period: {new Date(review.review_period_start).toLocaleDateString()} - 
                    {new Date(review.review_period_end).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-small text-neutral-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{review.employees?.job_title}</span>
                    {review.employees?.departments && (
                      <>
                        <span className="text-neutral-400">•</span>
                        <span>{review.employees.departments.department_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Reviewer: {review.reviewer?.first_name} {review.reviewer?.last_name}</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                {review.review_status === 'Completed' && (
                  <div className="mt-4 pt-4 border-t border-glass-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {review.quality_rating && (
                        <div className="text-center">
                          <p className="text-tiny text-neutral-600">Quality</p>
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-orange-500 fill-current" />
                            <span className="text-small font-medium">{review.quality_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                      {review.productivity_rating && (
                        <div className="text-center">
                          <p className="text-tiny text-neutral-600">Productivity</p>
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3 text-blue-500" />
                            <span className="text-small font-medium">{review.productivity_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                      {review.teamwork_rating && (
                        <div className="text-center">
                          <p className="text-tiny text-neutral-600">Teamwork</p>
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3 h-3 text-green-500" />
                            <span className="text-small font-medium">{review.teamwork_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                      {review.initiative_rating && (
                        <div className="text-center">
                          <p className="text-tiny text-neutral-600">Initiative</p>
                          <div className="flex items-center justify-center gap-1">
                            <Target className="w-3 h-3 text-purple-500" />
                            <span className="text-small font-medium">{review.initiative_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Goals and Recommendations */}
                {(review.promotion_recommended || review.salary_increase_recommended || review.bonus_recommended) && (
                  <div className="mt-4 pt-4 border-t border-glass-border">
                    <div className="flex items-center gap-4">
                      {review.promotion_recommended && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-tiny">
                          <Award className="w-3 h-3" />
                          Promotion Recommended
                        </div>
                      )}
                      {review.salary_increase_recommended && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-tiny">
                          <TrendingUp className="w-3 h-3" />
                          Salary Increase ({review.salary_increase_percentage}%)
                        </div>
                      )}
                      {review.bonus_recommended && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-tiny">
                          <Star className="w-3 h-3" />
                          Bonus: AED {review.bonus_amount_aed?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/dashboard/employees/reviews/${review.id}`}
                  className="btn-outline p-2"
                  title="View Review"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <Link
                  href={`/dashboard/employees/reviews/${review.id}/edit`}
                  className="btn-outline p-2"
                  title="Edit Review"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <Link
                  href={`/dashboard/employees/profile/${review.employee_id}`}
                  className="btn-secondary btn-sm"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Star className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-h3 font-bold text-neutral-900 mb-2">No reviews found</h3>
            <p className="text-body text-neutral-700 mb-6">
              {searchTerm || selectedPeriod || selectedStatus
                ? 'Try adjusting your search criteria or filters.'
                : activeTab === 'all'
                ? 'Get started by creating your first performance review.'
                : `No reviews found for the ${activeTab} tab.`}
            </p>
            {(!searchTerm && !selectedPeriod && !selectedStatus && activeTab === 'all') && (
              <Link href="/dashboard/employees/reviews/new" className="btn-primary">
                Create First Review
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}