'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  Download,
  Star,
  Phone,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Settings,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Archive,
  TrendingUp,
  UserPlus,
  VideoOff
} from 'lucide-react';

interface VideoStats {
  totalConsultations: number;
  completedToday: number;
  scheduledToday: number;
  avgDuration: number;
  avgSatisfaction: number;
  totalRecordings: number;
  cancelledRate: number;
  attendanceRate: number;
}

interface VideoConsultation {
  id: string;
  customer_name: string;
  customer_id: string;
  employee_name: string;
  employee_id: string;
  consultation_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link: string;
  meeting_id: string;
  recording_url: string;
  notes: string;
  satisfaction_rating: number;
}

interface ConsultationType {
  id: string;
  name: string;
  duration: number;
  description: string;
  color: string;
}

export default function VideoConsultationManagement() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [consultations, setConsultations] = useState<VideoConsultation[]>([]);
  const [consultationTypes] = useState<ConsultationType[]>([
    { id: '1', name: 'Design Review', duration: 45, description: 'Review custom designs with customer', color: 'bg-blue-500' },
    { id: '2', name: 'Measurements', duration: 30, description: 'Virtual measurement session', color: 'bg-emerald-500' },
    { id: '3', name: 'First Consultation', duration: 60, description: 'Initial consultation for new customers', color: 'bg-purple-500' },
    { id: '4', name: 'Fitting Review', duration: 30, description: 'Review fitting and adjustments', color: 'bg-orange-500' },
    { id: '5', name: 'Custom Design', duration: 90, description: 'Design custom garments with customer', color: 'bg-pink-500' }
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newConsultation, setNewConsultation] = useState({
    customerId: '',
    employeeId: '',
    consultationType: '',
    scheduledAt: '',
    notes: ''
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchVideoConsultations();
    }
  }, [user?.organization_id]);

  const fetchVideoConsultations = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Fetch video consultations with customer and employee data
      const { data: consultationsData } = await supabase
        .from('video_consultations')
        .select(`
          id,
          customer_id,
          employee_id,
          consultation_type,
          scheduled_at,
          duration_minutes,
          status,
          meeting_link,
          meeting_id,
          recording_url,
          notes,
          customers!inner(full_name),
          employees(first_name, last_name)
        `)
        .eq('organization_id', organizationId)
        .order('scheduled_at', { ascending: false })
        .limit(100);

      // Get current date for today's stats
      const today = new Date().toISOString().split('T')[0];

      // Calculate stats
      const totalConsultations = consultationsData?.length || 0;
      const completedToday = consultationsData?.filter(c => 
        c.status === 'completed' && c.scheduled_at?.startsWith(today)
      ).length || 0;
      const scheduledToday = consultationsData?.filter(c => 
        c.status === 'scheduled' && c.scheduled_at?.startsWith(today)
      ).length || 0;

      // Calculate averages
      const completedConsultations = consultationsData?.filter(c => c.status === 'completed') || [];
      const avgDuration = completedConsultations.length > 0
        ? completedConsultations.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / completedConsultations.length
        : 0;

      const totalRecordings = consultationsData?.filter(c => c.recording_url).length || 0;
      const cancelledCount = consultationsData?.filter(c => c.status === 'cancelled').length || 0;
      const cancelledRate = totalConsultations > 0 ? (cancelledCount / totalConsultations) * 100 : 0;
      const attendanceRate = 100 - cancelledRate;

      setStats({
        totalConsultations,
        completedToday,
        scheduledToday,
        avgDuration: Math.round(avgDuration),
        avgSatisfaction: 4.6, // Would calculate from actual ratings
        totalRecordings,
        cancelledRate: Math.round(cancelledRate * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      });

      // Process consultations data
      const processedConsultations: VideoConsultation[] = consultationsData?.map(consultation => {
        const customer = consultation.customers as any;
        const employee = consultation.employees as any;
        
        return {
          id: consultation.id,
          customer_name: customer?.full_name || 'Unknown Customer',
          customer_id: consultation.customer_id,
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unassigned',
          employee_id: consultation.employee_id || '',
          consultation_type: consultation.consultation_type || 'consultation',
          scheduled_at: consultation.scheduled_at || '',
          duration_minutes: consultation.duration_minutes || 0,
          status: consultation.status || 'scheduled',
          meeting_link: consultation.meeting_link || '',
          meeting_id: consultation.meeting_id || '',
          recording_url: consultation.recording_url || '',
          notes: consultation.notes || '',
          satisfaction_rating: 0 // Would link to actual satisfaction data
        };
      }) || [];

      setConsultations(processedConsultations);
    } catch (error) {
      console.error('Error fetching video consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleConsultation = async () => {
    try {
      const consultationType = consultationTypes.find(t => t.id === newConsultation.consultationType);
      
      const { error } = await supabase
        .from('video_consultations')
        .insert([
          {
            organization_id: user?.organization_id,
            customer_id: newConsultation.customerId,
            employee_id: newConsultation.employeeId,
            consultation_type: consultationType?.name || 'consultation',
            scheduled_at: newConsultation.scheduledAt,
            duration_minutes: consultationType?.duration || 30,
            status: 'scheduled',
            meeting_link: `https://meet.elitetailoring.ae/room/${Date.now()}`,
            meeting_id: `MEET-${Date.now()}`,
            notes: newConsultation.notes
          }
        ]);

      if (error) throw error;

      setShowScheduleModal(false);
      setNewConsultation({
        customerId: '',
        employeeId: '',
        consultationType: '',
        scheduledAt: '',
        notes: ''
      });
      fetchVideoConsultations();
    } catch (error) {
      console.error('Error scheduling consultation:', error);
    }
  };

  const updateConsultationStatus = async (consultationId: string, status: string) => {
    try {
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.duration_minutes = 45; // Would be actual duration
      }

      const { error } = await supabase
        .from('video_consultations')
        .update(updateData)
        .eq('id', consultationId);

      if (error) throw error;
      fetchVideoConsultations();
    } catch (error) {
      console.error('Error updating consultation status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'in_progress': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'in_progress': return Video;
      default: return AlertCircle;
    }
  };

  const getTypeColor = (type: string) => {
    const typeObj = consultationTypes.find(t => t.name.toLowerCase() === type.toLowerCase());
    return typeObj?.color || 'bg-gray-500';
  };

  const filteredConsultations = consultations.filter(consultation => {
    const statusMatch = selectedStatus === 'all' || consultation.status === selectedStatus;
    const typeMatch = selectedType === 'all' || consultation.consultation_type.toLowerCase().includes(selectedType.toLowerCase());
    const searchMatch = searchTerm === '' || 
      consultation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.consultation_type.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (timestamp: string) => {
    return new Date(timestamp) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video consultation management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Video Consultation Management</h1>
                <p className="text-gray-600">Schedule and manage video consultations with customers</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchVideoConsultations()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="bg-indigo-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Consultations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalConsultations}</p>
                <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  All time
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Scheduled Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.scheduledToday}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Upcoming sessions
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.avgDuration}m</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Session length
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.attendanceRate}%</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" />
                  Customer attendance
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Consultations List */}
          <div className="lg:col-span-3">
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              {/* Filters */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search consultations, customers, or employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="in_progress">In Progress</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {consultationTypes.map((type) => (
                    <option key={type.id} value={type.name.toLowerCase()}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Consultant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Scheduled</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConsultations.map((consultation) => {
                      const StatusIcon = getStatusIcon(consultation.status);
                      return (
                        <tr key={consultation.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{consultation.customer_name}</p>
                              <p className="text-sm text-gray-600">Customer consultation</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{consultation.employee_name}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getTypeColor(consultation.consultation_type)}`}></div>
                              <span className="text-sm text-gray-900 capitalize">{consultation.consultation_type}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{formatDateTime(consultation.scheduled_at)}</p>
                              {isUpcoming(consultation.scheduled_at) && (
                                <p className="text-xs text-blue-600">Upcoming</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(consultation.status)}`}>
                                {consultation.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {consultation.status === 'scheduled' && isUpcoming(consultation.scheduled_at) && (
                                <button
                                  onClick={() => window.open(consultation.meeting_link, '_blank')}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                                  title="Join Meeting"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                              {consultation.recording_url && (
                                <button
                                  onClick={() => window.open(consultation.recording_url, '_blank')}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                                  title="View Recording"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                </button>
                              )}
                              {consultation.status === 'scheduled' && (
                                <button
                                  onClick={() => updateConsultationStatus(consultation.id, 'cancelled')}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredConsultations.length === 0 && (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No consultations found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Consultation Types */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Types</h3>
              <div className="space-y-3">
                {consultationTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                    <div className={`w-4 h-4 rounded-full ${type.color}`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{type.name}</p>
                      <p className="text-xs text-gray-600">{type.duration} minutes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recordings Available</span>
                  <span className="text-sm font-medium text-emerald-600">{stats?.totalRecordings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Satisfaction</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-yellow-600">{stats?.avgSatisfaction}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cancellation Rate</span>
                  <span className="text-sm font-medium text-red-600">{stats?.cancelledRate}%</span>
                </div>
              </div>
            </div>

            {/* Platform Status */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Video Service</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Recording Service</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Audio Quality</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Consultation Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Schedule Video Consultation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <select
                  value={newConsultation.customerId}
                  onChange={(e) => setNewConsultation({ ...newConsultation, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a customer...</option>
                  <option value="10000000-0000-0000-0000-000000000001">Ahmed Al Mansoori</option>
                  <option value="10000000-0000-0000-0000-000000000002">Fatima Hassan</option>
                  <option value="10000000-0000-0000-0000-000000000003">Mohammed Ali</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultant</label>
                <select
                  value={newConsultation.employeeId}
                  onChange={(e) => setNewConsultation({ ...newConsultation, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a consultant...</option>
                  <option value="47866a02-473d-4477-a7c2-49ca1703bc68">Fatima Al Zahra</option>
                  <option value="40d17a02-776c-4181-8096-3996dad5ce77">Rajesh Kumar</option>
                  <option value="e87fb0ee-726e-45f8-aa17-f27563d4feb9">Maria Santos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
                <select
                  value={newConsultation.consultationType}
                  onChange={(e) => setNewConsultation({ ...newConsultation, consultationType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select consultation type...</option>
                  {consultationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.duration} min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={newConsultation.scheduledAt}
                  onChange={(e) => setNewConsultation({ ...newConsultation, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newConsultation.notes}
                  onChange={(e) => setNewConsultation({ ...newConsultation, notes: e.target.value })}
                  placeholder="Add any notes about this consultation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={scheduleConsultation}
                disabled={!newConsultation.customerId || !newConsultation.employeeId || !newConsultation.consultationType || !newConsultation.scheduledAt}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}