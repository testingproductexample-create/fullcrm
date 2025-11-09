import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Code, 
  Settings, 
  Check, 
  Clock, 
  AlertCircle,
  Printer,
  Mail,
  Share2,
  Cloud,
  HardDrive,
  Zap,
  Filter,
  Calendar,
  Search,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  Loader,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Target,
  Gauge
} from 'lucide-react';
import { useReportStore } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

interface ExportJob {
  id: string;
  reportId: string;
  reportName: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  fileSize?: string;
  downloadUrl?: string;
  error?: string;
  settings: {
    template?: string;
    includeCharts: boolean;
    includeData: boolean;
    pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    colorMode: 'color' | 'grayscale' | 'blackwhite';
    includeMetadata: boolean;
    compression: 'none' | 'medium' | 'maximum';
  };
}

const exportFormats = [
  {
    format: 'pdf',
    name: 'PDF',
    icon: FileText,
    description: 'Portable Document Format - Best for printing and sharing',
    color: 'text-red-600',
    bg: 'bg-red-50',
    maxSize: '50MB',
    features: ['Charts & Graphs', 'Tables', 'Images', 'Multiple Pages', 'Password Protection'],
  },
  {
    format: 'excel',
    name: 'Excel',
    icon: FileSpreadsheet,
    description: 'Microsoft Excel format - Best for data analysis',
    color: 'text-green-600',
    bg: 'bg-green-50',
    maxSize: '25MB',
    features: ['Raw Data', 'Charts', 'Pivot Tables', 'Formulas', 'Multiple Sheets'],
  },
  {
    format: 'csv',
    name: 'CSV',
    icon: File,
    description: 'Comma Separated Values - Best for data import/export',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    maxSize: '10MB',
    features: ['Raw Data', 'UTF-8 Encoding', 'Custom Delimiters', 'Header Row'],
  },
  {
    format: 'json',
    name: 'JSON',
    icon: Code,
    description: 'JavaScript Object Notation - Best for APIs and web services',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    maxSize: '20MB',
    features: ['Structured Data', 'API Ready', 'Nested Objects', 'Unicode Support'],
  },
];

const ExportCenter: React.FC = () => {
  const { reports, templates } = useReportStore();
  
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ExportJob['format']>('pdf');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportJob['settings']>({
    includeCharts: true,
    includeData: true,
    pageSize: 'A4',
    orientation: 'portrait',
    colorMode: 'color',
    includeMetadata: true,
    compression: 'medium',
  });

  // Simulate export job processing
  useEffect(() => {
    const interval = setInterval(() => {
      setExportJobs(prev => prev.map(job => {
        if (job.status === 'processing' && job.progress < 100) {
          const newProgress = Math.min(100, job.progress + Math.random() * 15);
          if (newProgress >= 100) {
            return {
              ...job,
              status: 'completed',
              progress: 100,
              completedAt: new Date(),
              fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
              downloadUrl: `/downloads/${job.id}.${job.format}`,
            };
          }
          return { ...job, progress: newProgress };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      return report.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const filteredJobs = exportJobs.filter(job => {
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report to export');
      return;
    }

    setIsExporting(true);

    for (const reportId of selectedReports) {
      const report = reports.find(r => r.id === reportId);
      if (!report) continue;

      const newJob: ExportJob = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        reportId,
        reportName: report.name,
        format: selectedFormat,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        settings: exportSettings,
      };

      setExportJobs(prev => [newJob, ...prev]);

      // Simulate job processing
      setTimeout(() => {
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: 'processing' as const }
            : job
        ));
      }, 1000);
    }

    setIsExporting(false);
    setSelectedReports([]);
    toast.success(`Export started for ${selectedReports.length} report(s)`);
  };

  const handleCancelJob = (jobId: string) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'cancelled' as const }
        : job
    ));
  };

  const handleRetryJob = (jobId: string) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status: 'pending' as const, 
            progress: 0, 
            error: undefined,
            createdAt: new Date(),
          }
        : job
    ));
  };

  const handleDeleteJob = (jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId));
    toast.success('Export job deleted');
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return Loader;
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'cancelled': return Pause;
      default: return Clock;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const selectedFormatInfo = exportFormats.find(f => f.format === selectedFormat);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
            <p className="text-gray-600 mt-1">
              Export reports in multiple formats with customizable settings and batch processing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {exportJobs.filter(j => j.status === 'processing').length} active jobs
            </div>
            <button
              onClick={() => {/* Refresh jobs */}}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Export Configuration */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Export Configuration</h3>
          
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="space-y-2">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.format}
                    onClick={() => setSelectedFormat(format.format)}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      selectedFormat === format.format
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon className={`w-5 h-5 mr-3 ${format.color}`} />
                        <div>
                          <div className="font-medium text-gray-900">{format.name}</div>
                          <div className="text-xs text-gray-500">{format.maxSize} max</div>
                        </div>
                      </div>
                      {selectedFormat === format.format && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Details */}
          {selectedFormatInfo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{selectedFormatInfo.name} Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {selectedFormatInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-3 h-3 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Export Settings */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Export Settings</h4>
            <div className="space-y-3">
              {selectedFormat === 'pdf' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Page Size</label>
                    <select
                      value={exportSettings.pageSize}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, pageSize: e.target.value as any }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    >
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Orientation</label>
                    <select
                      value={exportSettings.orientation}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, orientation: e.target.value as any }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Color Mode</label>
                    <select
                      value={exportSettings.colorMode}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, colorMode: e.target.value as any }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    >
                      <option value="color">Color</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="blackwhite">Black & White</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeCharts}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Charts & Graphs</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeData}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeData: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Raw Data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeMetadata}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Metadata</span>
                </label>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || selectedReports.length === 0}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {selectedReports.length} Report{selectedReports.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Report Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Reports to Export</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedReports.length} of {filteredReports.length} selected
                </span>
                {selectedReports.length > 0 && (
                  <button
                    onClick={() => setSelectedReports([])}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {filteredReports.map((report) => (
                <label
                  key={report.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReports([...selectedReports, report.id]);
                      } else {
                        setSelectedReports(selectedReports.filter(id => id !== report.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-500">{report.components.length} components</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Jobs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Export Jobs</h3>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="p-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No export jobs</h4>
                  <p className="text-gray-500">Start by selecting reports and choosing an export format</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => {
                    const StatusIcon = getStatusIcon(job.status);
                    const statusColor = getStatusColor(job.status);
                    const formatInfo = exportFormats.find(f => f.format === job.format);
                    const FormatIcon = formatInfo?.icon || File;

                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <FormatIcon className={`w-8 h-8 ${formatInfo?.color || 'text-gray-500'}`} />
                          <div>
                            <div className="font-medium text-gray-900">{job.reportName}</div>
                            <div className="text-sm text-gray-500">
                              {format(job.createdAt, 'MMM dd, yyyy HH:mm')}
                            </div>
                            {job.fileSize && (
                              <div className="text-xs text-gray-400">{job.fileSize}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Progress Bar */}
                          {job.status === 'processing' && (
                            <div className="w-32">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(job.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${job.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Status */}
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusColor}`}>
                              <StatusIcon className={`w-3 h-3 mr-1 ${
                                job.status === 'processing' ? 'animate-spin' : ''
                              }`} />
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {job.status === 'completed' && (
                              <button
                                onClick={() => {
                                  // Simulate download
                                  toast.success('Download started');
                                }}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            {job.status === 'failed' && (
                              <button
                                onClick={() => handleRetryJob(job.id)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Retry"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {(job.status === 'pending' || job.status === 'processing') && (
                              <button
                                onClick={() => handleCancelJob(job.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1 text-gray-600 hover:text-gray-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;