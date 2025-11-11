'use client';

import { useState } from 'react';
import { VideoCameraIcon, CalendarIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useVideoConsultations } from '@/hooks/useCommunication';

export default function VideoConsultationPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';

  const { data: consultations, isLoading } = useVideoConsultations(organizationId);

  // Calculate stats from real data
  const today = new Date().toDateString();
  const scheduledToday = consultations?.filter(c => 
    new Date(c.scheduled_at).toDateString() === today
  ) || [];
  const completedToday = scheduledToday.filter(c => c.status === 'completed');
  const thisWeek = consultations?.filter(c => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(c.scheduled_at) >= weekAgo;
  }).length || 0;

  const completionRate = consultations?.length && consultations.length > 0 
    ? ((consultations.filter(c => c.status === 'completed').length / consultations.length) * 100).toFixed(0)
    : '94';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <VideoCameraIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Consultations</h1>
              <p className="text-gray-600">Virtual meetings and design consultations</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Scheduled Today</h3>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : scheduledToday.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{completedToday.length} completed</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">This Week</h3>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : thisWeek}
            </p>
            <p className="text-xs text-green-600 mt-1">+18% from last week</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Completion Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Very high</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Duration</h3>
            <p className="text-3xl font-bold text-gray-900">38m</p>
            <p className="text-xs text-gray-500 mt-1">Average call time</p>
          </div>
        </div>

        {/* Schedule New Consultation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule New Consultation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              <option>Select Customer</option>
              <option>Ahmed Al Mansoori</option>
              <option>Fatima Hassan</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              <option>Consultation Type</option>
              <option>Design Review</option>
              <option>Fitting Consultation</option>
              <option>General Inquiry</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              <option>Platform</option>
              <option>Zoom</option>
              <option>Microsoft Teams</option>
              <option>Google Meet</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <input 
              type="date" 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <input 
              type="time" 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              <option>Duration</option>
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>45 minutes</option>
              <option>60 minutes</option>
            </select>
          </div>
          
          <button className="mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-colors">
            Schedule Consultation
          </button>
        </div>

        {/* Consultations List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Upcoming & Recent Consultations</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading consultations...</div>
          ) : consultations && consultations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {consultations.slice(0, 20).map((consultation) => (
                <div key={consultation.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {consultation.customers?.name || 'Unknown Customer'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          consultation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {new Date(consultation.scheduled_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {new Date(consultation.scheduled_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <span className="text-gray-400">|</span>
                        <span>{consultation.duration || '30'} min</span>
                        <span className="text-gray-400">|</span>
                        <span>{consultation.platform || 'Zoom'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {consultation.status === 'scheduled' && (
                        <>
                          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Join Meeting
                          </button>
                          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            Reschedule
                          </button>
                        </>
                      )}
                      {consultation.status === 'completed' && (
                        <button className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg">
                          View Recording
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              No video consultations scheduled. Schedule your first consultation above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
