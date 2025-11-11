'use client';

import { useState } from 'react';
import { 
  PlusIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  PresentationChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { 
  useSurveys,
  useSurveyResponses,
  useCreateSurvey
} from '@/hooks/useFeedback';
import type { SatisfactionSurvey, SurveyStatus } from '@/types/feedback';

export default function SurveysPage() {
  const { user } = useAuth();
  const [selectedSurvey, setSelectedSurvey] = useState<SatisfactionSurvey | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'surveys' | 'responses' | 'analytics'>('surveys');

  const { data: surveys, isLoading } = useSurveys();
  const { data: responses } = useSurveyResponses(selectedSurvey?.id || '');
  const createSurvey = useCreateSurvey();

  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SurveyStatus) => {
    switch (status) {
      case 'active': return <PlayIcon className="w-4 h-4" />;
      case 'paused': return <PauseIcon className="w-4 h-4" />;
      case 'completed': return <StopIcon className="w-4 h-4" />;
      default: return <ClipboardDocumentListIcon className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading surveys...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Customer Satisfaction Surveys
              </h1>
              <p className="text-slate-600">
                Create, manage, and analyze customer satisfaction surveys
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Survey
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'surveys', label: 'Surveys', icon: ClipboardDocumentListIcon },
                { id: 'responses', label: 'Responses', icon: UserGroupIcon },
                { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Surveys Tab */}
        {activeTab === 'surveys' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Survey List */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Survey List</h3>
                  <div className="text-sm text-slate-600">
                    {surveys?.length || 0} survey(s)
                  </div>
                </div>
                
                <div className="space-y-4">
                  {surveys?.map((survey) => (
                    <div
                      key={survey.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedSurvey?.id === survey.id
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-slate-900">{survey.title}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(survey.status)}`}>
                              {getStatusIcon(survey.status)}
                              <span className="ml-1">{survey.status}</span>
                            </span>
                          </div>
                          {survey.description && (
                            <p className="text-sm text-slate-600 mb-3">{survey.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <div className="flex items-center">
                              <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                              {survey.questions?.length || 0} questions
                            </div>
                            <div className="flex items-center">
                              <UserGroupIcon className="w-4 h-4 mr-1" />
                              {survey.response_count || 0} responses
                            </div>
                            <div className="flex items-center">
                              <CalendarDaysIcon className="w-4 h-4 mr-1" />
                              {new Date(survey.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Preview survey
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Preview"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit survey
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Delete survey
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!surveys || surveys.length === 0) && (
                    <div className="text-center py-12">
                      <ClipboardDocumentListIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No surveys yet</h3>
                      <p className="text-slate-600 mb-4">
                        Create your first customer satisfaction survey to start collecting feedback.
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create First Survey
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Survey Details */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
              {selectedSurvey ? (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Survey Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Title</label>
                      <p className="text-slate-900">{selectedSurvey.title}</p>
                    </div>
                    
                    {selectedSurvey.description && (
                      <div>
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <p className="text-slate-900">{selectedSurvey.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <p className="text-slate-900 capitalize">{selectedSurvey.survey_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSurvey.status)}`}>
                          {selectedSurvey.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Questions</label>
                        <p className="text-slate-900">{selectedSurvey.questions?.length || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Responses</label>
                        <p className="text-slate-900">{selectedSurvey.response_count || 0}</p>
                      </div>
                    </div>
                    
                    {selectedSurvey.start_date && (
                      <div>
                        <label className="text-sm font-medium text-slate-700">Active Period</label>
                        <p className="text-slate-900">
                          {new Date(selectedSurvey.start_date).toLocaleDateString()} - 
                          {selectedSurvey.end_date ? new Date(selectedSurvey.end_date).toLocaleDateString() : 'Ongoing'}
                        </p>
                      </div>
                    )}
                    
                    {selectedSurvey.response_goal && (
                      <div>
                        <label className="text-sm font-medium text-slate-700">Response Goal</label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(
                                  ((selectedSurvey.response_count || 0) / selectedSurvey.response_goal) * 100,
                                  100
                                )}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-600">
                            {selectedSurvey.response_count || 0}/{selectedSurvey.response_goal}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-3">Questions Preview</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedSurvey.questions?.map((question, index) => (
                          <div key={question.id || index} className="p-3 bg-slate-50/50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <span className="text-xs text-slate-500 font-medium">
                                  Q{index + 1} • {question.question_type}
                                </span>
                                <p className="text-sm text-slate-900 mt-1">
                                  {question.question_text}
                                </p>
                              </div>
                              {question.required && (
                                <span className="text-xs text-red-500 font-medium">Required</span>
                              )}
                            </div>
                          </div>
                        )) || (
                          <p className="text-sm text-slate-500">No questions configured</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Select a survey</h3>
                  <p className="text-slate-600">
                    Choose a survey from the list to view its details and manage responses.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            {selectedSurvey ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Responses for "{selectedSurvey.title}"
                    </h3>
                    <p className="text-slate-600">
                      {responses?.length || 0} response(s) collected
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Export Responses
                  </button>
                </div>
                
                {responses && responses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Respondent
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Satisfaction
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            NPS Score
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Completion
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {responses.map((response) => (
                          <tr key={response.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-slate-900">
                                    {response.customer?.name || (response.is_anonymous ? 'Anonymous' : 'Unknown')}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {response.customer?.email || ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {response.overall_satisfaction ? (
                                <div className="flex items-center">
                                  <span className="text-lg font-bold text-slate-900 mr-2">
                                    {response.overall_satisfaction}/5
                                  </span>
                                  <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <div
                                        key={star}
                                        className={`w-3 h-3 rounded-full ${
                                          star <= response.overall_satisfaction! 
                                            ? 'bg-yellow-400' 
                                            : 'bg-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">Not rated</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {response.nps_score !== null ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  response.nps_score >= 9 
                                    ? 'bg-green-100 text-green-800'
                                    : response.nps_score >= 7
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {response.nps_score}/10
                                </span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{ width: `${response.completion_percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-slate-600">
                                  {response.completion_percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {new Date(response.submitted_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => {/* View response details */}}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No responses yet</h3>
                    <p className="text-slate-600">
                      This survey hasn't received any responses yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a survey</h3>
                <p className="text-slate-600">
                  Choose a survey to view its responses and analytics.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            {selectedSurvey ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Analytics for "{selectedSurvey.title}"
                    </h3>
                    <p className="text-slate-600">
                      Survey performance and response insights
                    </p>
                  </div>
                </div>
                
                {/* Analytics content would go here */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Response Rate</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {selectedSurvey.completion_rate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <PresentationChartBarIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Avg Satisfaction</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {selectedSurvey.average_satisfaction?.toFixed(1) || 0}/5
                        </p>
                      </div>
                      <ChartBarIcon className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">NPS Score</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {selectedSurvey.nps_score || 0}
                        </p>
                      </div>
                      <UserGroupIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-12">
                  <PresentationChartBarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Detailed Analytics Coming Soon</h3>
                  <p className="text-slate-600">
                    Advanced survey analytics and insights will be available here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <PresentationChartBarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a survey</h3>
                <p className="text-slate-600">
                  Choose a survey to view detailed analytics and insights.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}