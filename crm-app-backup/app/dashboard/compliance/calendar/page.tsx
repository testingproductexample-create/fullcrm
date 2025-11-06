'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Calendar,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Bell,
  User,
  Building
} from 'lucide-react';
import type { ComplianceCalendar } from '@/types/database';

interface CalendarStats {
  totalItems: number;
  pendingItems: number;
  overdueItems: number;
  completedThisMonth: number;
  upcomingItems: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  priority: string;
  status: string;
  type: string;
}

export default function ComplianceCalendarPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calendarItems, setCalendarItems] = useState<ComplianceCalendar[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    totalItems: 0,
    pendingItems: 0,
    overdueItems: 0,
    completedThisMonth: 0,
    upcomingItems: 0
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({
    compliance_type: '',
    requirement_name: '',
    due_date: '',
    priority: 'medium',
    description: '',
    assigned_to: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      loadCalendarItems();
    }
  }, [profile]);

  const loadCalendarItems = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      const { data: items, error } = await supabase
        .from('compliance_calendar')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      setCalendarItems(items || []);

      // Calculate statistics
      const today = new Date();
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      
      const pendingCount = items?.filter(item => item.status === 'pending').length || 0;
      const overdueCount = items?.filter(item => 
        item.status === 'pending' && new Date(item.due_date) < today).length || 0;
      const completedThisMonth = items?.filter(item => 
        item.status === 'completed' && 
        new Date(item.updated_at).getMonth() === thisMonth &&
        new Date(item.updated_at).getFullYear() === thisYear).length || 0;
      const upcomingCount = items?.filter(item => {
        const dueDate = new Date(item.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return item.status === 'pending' && daysUntilDue >= 0 && daysUntilDue <= 30;
      }).length || 0;

      setStats({
        totalItems: items?.length || 0,
        pendingItems: pendingCount,
        overdueItems: overdueCount,
        completedThisMonth,
        upcomingItems: upcomingCount
      });

    } catch (error) {
      console.error('Error loading compliance calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCalendarItem = async () => {
    try {
      if (!profile?.organization_id || !newItem.requirement_name) return;

      const { error } = await supabase
        .from('compliance_calendar')
        .insert({
          organization_id: profile.organization_id,
          compliance_type: newItem.compliance_type,
          requirement_name: newItem.requirement_name,
          due_date: newItem.due_date,
          priority: newItem.priority,
          description: newItem.description,
          assigned_to: newItem.assigned_to || null,
          status: 'pending'
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewItem({
        compliance_type: '',
        requirement_name: '',
        due_date: '',
        priority: 'medium',
        description: '',
        assigned_to: ''
      });
      
      await loadCalendarItems();
    } catch (error) {
      console.error('Error creating calendar item:', error);
    }
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('compliance_calendar')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
      await loadCalendarItems();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_calendar')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadCalendarItems();
    } catch (error) {
      console.error('Error deleting calendar item:', error);
    }
  };

  const exportCalendar = () => {
    const csv = [
      ['Type', 'Requirement', 'Due Date', 'Priority', 'Status', 'Description', 'Assigned To'].join(','),
      ...filteredItems.map(item => [
        item.compliance_type,
        item.requirement_name,
        item.due_date,
        item.priority,
        item.status,
        item.description || '',
        item.assigned_to || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-calendar-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      exempted: { color: 'bg-gray-100 text-gray-800', icon: Building }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string }> = {
      critical: { color: 'bg-red-500 text-white' },
      high: { color: 'bg-orange-500 text-white' },
      medium: { color: 'bg-yellow-500 text-white' },
      low: { color: 'bg-green-500 text-white' }
    };
    const badge = badges[priority] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getTypeDisplayName = (type: string) => {
    const types: Record<string, string> = {
      vat: 'VAT Filing',
      corporate_tax: 'Corporate Tax',
      audit: 'Financial Audit',
      aml: 'AML/KYC Compliance',
      central_bank: 'Central Bank Reporting',
      securities: 'Securities Filing',
      economic_substance: 'Economic Substance',
      other: 'Other Compliance'
    };
    return types[type] || type.replace('_', ' ').toUpperCase();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarItems
      .filter(item => item.due_date === dateStr)
      .map(item => ({
        id: item.id,
        title: item.requirement_name,
        date: item.due_date,
        priority: item.priority,
        status: item.status,
        type: item.compliance_type
      }));
  };

  const filteredItems = calendarItems.filter(item => {
    const matchesType = !filterType || item.compliance_type === filterType;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    const matchesSearch = !searchQuery || 
      item.requirement_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesPriority && matchesSearch;
  });

  const calendarDays = generateCalendarGrid();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Compliance Calendar & Deadlines</h1>
            <p className="text-neutral-600">Track UAE regulatory deadlines and compliance requirements</p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 inline mr-2" />
                List
              </button>
            </div>
            <button
              onClick={exportCalendar}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Deadline
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">Total</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.totalItems}</h3>
            <p className="text-xs text-neutral-600">Compliance items</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs text-neutral-500">Pending</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.pendingItems}</h3>
            <p className="text-xs text-neutral-600">Awaiting completion</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-neutral-500">Overdue</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.overdueItems}</h3>
            <p className="text-xs text-neutral-600">Past due date</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">Completed</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.completedThisMonth}</h3>
            <p className="text-xs text-neutral-600">This month</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">Upcoming</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.upcomingItems}</h3>
            <p className="text-xs text-neutral-600">Next 30 days</p>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="glass-card p-6">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-neutral-900">
                {currentDate.toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                →
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary text-sm"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-neutral-600 border-b border-white/20">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const events = getEventsForDate(day);

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-white/10 ${
                    isCurrentMonth ? 'bg-white/5' : 'bg-white/2 text-neutral-400'
                  } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${
                          event.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-neutral-500">+{events.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <>
          {/* Filters and Search */}
          <div className="glass-card p-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Filters:</span>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-glass text-sm"
              >
                <option value="">All Types</option>
                <option value="vat">VAT Filing</option>
                <option value="corporate_tax">Corporate Tax</option>
                <option value="audit">Financial Audit</option>
                <option value="aml">AML/KYC</option>
                <option value="central_bank">Central Bank</option>
                <option value="securities">Securities</option>
                <option value="economic_substance">Economic Substance</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-glass text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="exempted">Exempted</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input-glass text-sm"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass text-sm pl-9 w-full"
                />
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="glass-card p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Requirement</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Type</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-700">Due Date</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-700">Days Left</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-700">Priority</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Assigned To</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const daysLeft = getDaysUntilDue(item.due_date);
                      const isOverdue = daysLeft < 0 && item.status === 'pending';
                      
                      return (
                        <tr key={item.id} className="border-b border-white/10 hover:bg-white/10">
                          <td className="py-3 px-4">
                            <div className="font-medium text-neutral-900">{item.requirement_name}</div>
                            {item.description && (
                              <div className="text-xs text-neutral-500 mt-1">{item.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">{getTypeDisplayName(item.compliance_type)}</td>
                          <td className="py-3 px-4 text-center text-sm">{formatDate(item.due_date)}</td>
                          <td className={`py-3 px-4 text-center text-sm font-medium ${
                            isOverdue ? 'text-red-600' :
                            daysLeft <= 7 ? 'text-orange-600' :
                            daysLeft <= 30 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : 
                             daysLeft === 0 ? 'Due today' :
                             `${daysLeft} days`}
                          </td>
                          <td className="py-3 px-4 text-center">{getPriorityBadge(item.priority)}</td>
                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(isOverdue ? 'overdue' : item.status)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {item.assigned_to ? (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.assigned_to.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-neutral-400">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-1">
                              <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {item.status === 'pending' && (
                                <button 
                                  onClick={() => updateItemStatus(item.id, 'completed')}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded" 
                                  title="Mark Complete"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button className="p-1 text-orange-600 hover:bg-orange-100 rounded" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteItem(item.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded" 
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No compliance items found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Calendar Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 w-full max-w-2xl mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Add Compliance Deadline</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Compliance Type</label>
                <select
                  value={newItem.compliance_type}
                  onChange={(e) => setNewItem({...newItem, compliance_type: e.target.value})}
                  className="input-glass"
                >
                  <option value="">Select type</option>
                  <option value="vat">VAT Filing</option>
                  <option value="corporate_tax">Corporate Tax</option>
                  <option value="audit">Financial Audit</option>
                  <option value="aml">AML/KYC Compliance</option>
                  <option value="central_bank">Central Bank Reporting</option>
                  <option value="securities">Securities Filing</option>
                  <option value="economic_substance">Economic Substance</option>
                  <option value="other">Other Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
                <select
                  value={newItem.priority}
                  onChange={(e) => setNewItem({...newItem, priority: e.target.value})}
                  className="input-glass"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Requirement Name</label>
                <input
                  type="text"
                  placeholder="e.g., Q4 2024 VAT Return Filing"
                  value={newItem.requirement_name}
                  onChange={(e) => setNewItem({...newItem, requirement_name: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newItem.due_date}
                  onChange={(e) => setNewItem({...newItem, due_date: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Assigned To (Optional)</label>
                <input
                  type="text"
                  placeholder="User ID or email"
                  value={newItem.assigned_to}
                  onChange={(e) => setNewItem({...newItem, assigned_to: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Additional details about this compliance requirement..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="input-glass resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createCalendarItem}
                className="btn-primary flex-1"
                disabled={!newItem.compliance_type || !newItem.requirement_name || !newItem.due_date}
              >
                Add Deadline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}