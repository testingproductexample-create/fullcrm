import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Send, 
  Play, 
  Pause, 
  Edit3, 
  Trash2, 
  Copy, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mail, 
  Settings,
  Users,
  FileText,
  Download,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react';
import { useReportStore, ScheduleConfig, ReportTemplate } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import toast from 'react-hot-toast';

interface ScheduleModalProps {
  schedule: ScheduleConfig | null;
  onSave: (schedule: Omit<ScheduleConfig, 'id'>) => void;
  onClose: () => void;
  templates: ReportTemplate[];
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ schedule, onSave, onClose, templates }) => {
  const [reportId, setReportId] = useState(schedule?.reportId || '');
  const [frequency, setFrequency] = useState<ScheduleConfig['frequency']>(schedule?.frequency || 'daily');
  const [recipients, setRecipients] = useState<string[]>(schedule?.recipients || []);
  const [format, setFormat] = useState<ScheduleConfig['format']>(schedule?.format || 'pdf');
  const [subject, setSubject] = useState(schedule?.subject || '');
  const [message, setMessage] = useState(schedule?.message || '');
  const [active, setActive] = useState(schedule?.active ?? true);
  const [newRecipient, setNewRecipient] = useState('');

  const handleSave = () => {
    if (!reportId || recipients.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      reportId,
      frequency,
      recipients,
      format,
      subject: subject || `Scheduled Report - ${format(new Date(), 'PPpp')}`,
      message: message || 'Please find the attached scheduled report.',
      active,
      nextRun: calculateNextRun(frequency),
    });

    onClose();
  };

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {schedule ? 'Edit Schedule' : 'Create New Schedule'}
        </h3>

        <div className="space-y-6">
          {/* Report Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Report</label>
            <select
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a report template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'hourly', label: 'Hourly', icon: Clock },
                { value: 'daily', label: 'Daily', icon: Calendar },
                { value: 'weekly', label: 'Weekly', icon: Calendar },
                { value: 'monthly', label: 'Monthly', icon: Calendar },
                { value: 'quarterly', label: 'Quarterly', icon: Calendar },
                { value: 'yearly', label: 'Yearly', icon: Calendar },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setFrequency(value as ScheduleConfig['frequency'])}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    frequency === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {recipients.map(email => (
                  <div key={email} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-600' },
                { value: 'excel', label: 'Excel', icon: BarChart3, color: 'text-green-600' },
                { value: 'csv', label: 'CSV', icon: FileText, color: 'text-blue-600' },
                { value: 'json', label: 'JSON', icon: FileText, color: 'text-purple-600' },
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value as ScheduleConfig['format'])}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    format === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Automated Report - [Report Name]"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Please find the attached scheduled report. This report is automatically generated and sent to you as per your schedule settings."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Enable this schedule</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {schedule ? 'Update' : 'Create'} Schedule
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ReportSchedule: React.FC = () => {
  const { 
    schedules, 
    reports, 
    addSchedule, 
    updateSchedule, 
    deleteSchedule, 
    toggleSchedule 
  } = useReportStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleConfig | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);

  // Auto-refresh next run times
  useEffect(() => {
    const interval = setInterval(() => {
      // Update next run times
      schedules.forEach(schedule => {
        if (schedule.active && new Date(schedule.nextRun) <= new Date()) {
          // Schedule should have run, update to next time
          const nextRun = calculateNextRun(schedule.frequency);
          updateSchedule(schedule.id, { 
            nextRun, 
            lastRun: new Date() 
          });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedules, updateSchedule]);

  const filteredSchedules = schedules.filter(schedule => {
    const report = reports.find(r => r.id === schedule.reportId);
    if (!report) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.name.toLowerCase().includes(query) ||
        schedule.recipients.some(r => r.toLowerCase().includes(query))
      );
    }

    if (statusFilter === 'active' && !schedule.active) return false;
    if (statusFilter === 'inactive' && schedule.active) return false;

    return true;
  });

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduleConfig) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleSaveSchedule = (scheduleData: Omit<ScheduleConfig, 'id'>) => {
    if (editingSchedule) {
      updateSchedule(editingSchedule.id, scheduleData);
      toast.success('Schedule updated successfully');
    } else {
      addSchedule(scheduleData);
      toast.success('Schedule created successfully');
    }
  };

  const handleToggleSchedule = (scheduleId: string) => {
    toggleSchedule(scheduleId);
    toast.success('Schedule status updated');
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(scheduleId);
      toast.success('Schedule deleted');
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedSchedules.length === 0) {
      toast.error('Please select at least one schedule');
      return;
    }

    selectedSchedules.forEach(scheduleId => {
      switch (action) {
        case 'activate':
        case 'deactivate':
          const schedule = schedules.find(s => s.id === scheduleId);
          if (schedule) {
            updateSchedule(scheduleId, { active: action === 'activate' });
          }
          break;
        case 'delete':
          deleteSchedule(scheduleId);
          break;
      }
    });

    setSelectedSchedules([]);
    toast.success(`Bulk ${action} completed`);
  };

  const getScheduleStatus = (schedule: ScheduleConfig) => {
    const now = new Date();
    const nextRun = new Date(schedule.nextRun);
    const isOverdue = schedule.active && nextRun <= now;

    if (isOverdue) {
      return { 
        status: 'overdue', 
        icon: AlertCircle, 
        color: 'text-red-600', 
        bg: 'bg-red-50',
        text: 'Overdue'
      };
    } else if (schedule.active) {
      return { 
        status: 'active', 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-50',
        text: 'Active'
      };
    } else {
      return { 
        status: 'inactive', 
        icon: XCircle, 
        color: 'text-gray-600', 
        bg: 'bg-gray-50',
        text: 'Inactive'
      };
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduled Reports</h1>
            <p className="text-gray-600 mt-1">
              Automate report generation and distribution with scheduled reporting
            </p>
          </div>
          <button
            onClick={handleCreateSchedule}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {selectedSchedules.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedSchedules.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedules List */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-500 mb-4">
              Create your first scheduled report to automate your reporting workflow
            </p>
            <button
              onClick={handleCreateSchedule}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSchedules(filteredSchedules.map(s => s.id));
                        } else {
                          setSelectedSchedules([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map(schedule => {
                  const report = reports.find(r => r.id === schedule.reportId);
                  const status = getScheduleStatus(schedule);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSchedules.includes(schedule.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSchedules([...selectedSchedules, schedule.id]);
                            } else {
                              setSelectedSchedules(selectedSchedules.filter(id => id !== schedule.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report?.name || 'Unknown Report'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report?.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900 capitalize">{schedule.frequency}</span>
                        </div>
                        <div className="text-xs text-gray-500 uppercase">{schedule.format}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {schedule.recipients.slice(0, 2).map(recipient => (
                            <span
                              key={recipient}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {recipient}
                            </span>
                          ))}
                          {schedule.recipients.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              +{schedule.recipients.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(schedule.nextRun), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(schedule.nextRun), 'HH:mm')}
                        </div>
                        {schedule.lastRun && (
                          <div className="text-xs text-gray-400">
                            Last: {format(new Date(schedule.lastRun), 'MMM dd, HH:mm')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleSchedule(schedule.id)}
                            className={`p-1 rounded ${
                              schedule.active 
                                ? 'text-green-600 hover:text-green-800' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {schedule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* Preview */}}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* Run now */}}
                            className="p-1 text-purple-600 hover:text-purple-800"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ScheduleModal
            schedule={editingSchedule}
            onSave={handleSaveSchedule}
            onClose={() => {
              setIsModalOpen(false);
              setEditingSchedule(null);
            }}
            templates={reports}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to calculate next run time
function calculateNextRun(frequency: ScheduleConfig['frequency']): Date {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return addDays(now, 1);
    case 'weekly':
      return addWeeks(now, 1);
    case 'monthly':
      return addMonths(now, 1);
    case 'quarterly':
      return addQuarters(now, 1);
    case 'yearly':
      return addYears(now, 1);
    default:
      return addDays(now, 1);
  }
}

export default ReportSchedule;