import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Settings,
  Calendar,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { Dashboard, ExportConfig } from '../../types';
import { cn } from '../../utils/helpers';
import { EXPORT_FORMATS } from '../../data/constants';

interface ExportModalProps {
  dashboard: Dashboard;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  dashboard,
  onClose
}) => {
  const [selectedFormat, setSelectedFormat] = useState<keyof typeof EXPORT_FORMATS>('pdf');
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'pdf',
    title: dashboard.name,
    subtitle: dashboard.description || '',
    includeCharts: true,
    includeData: true,
    includeTimestamp: true,
    pageOrientation: 'portrait',
    pageSize: 'A4',
    quality: 'high'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const formatOptions = Object.entries(EXPORT_FORMATS);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // Generate and download file
      await generateAndDownloadFile();
      
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const generateAndDownloadFile = async () => {
    const { format, title } = exportConfig;
    const fileExtension = EXPORT_FORMATS[format].extension;
    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${fileExtension}`;

    // Create mock data for different formats
    let content: string | Blob;
    let mimeType: string;

    switch (format) {
      case 'pdf':
        // In a real implementation, this would use a PDF generation library
        const pdfContent = `PDF Export of ${dashboard.name}\n\nGenerated on: ${new Date().toISOString()}\n\n${dashboard.description || ''}\n\nThis is a mock PDF export.`;
        content = new Blob([pdfContent], { type: 'application/pdf' });
        break;
      
      case 'excel':
        // In a real implementation, this would use a library like xlsx
        const csvContent = `Dashboard,${dashboard.name}\nDescription,${dashboard.description || ''}\nCreated,${dashboard.createdAt.toISOString()}\nWidgets,${dashboard.widgets.length}\n`;
        content = new Blob([csvContent], { type: 'text/csv' });
        break;
      
      case 'csv':
        // Generate CSV data
        const dataRows = dashboard.widgets.map((widget, index) => 
          `${index + 1},${widget.title},${widget.type},${widget.description || ''}`
        ).join('\n');
        content = new Blob([`Widget,Title,Type,Description\n${dataRows}`], { type: 'text/csv' });
        break;
      
      default:
        throw new Error('Unsupported format');
    }

    // Download the file
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setExportConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Export Dashboard</h2>
                <p className="text-gray-600">Download your dashboard data in various formats</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map(([key, format]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedFormat(key as keyof typeof EXPORT_FORMATS);
                    updateConfig({ format: key as any });
                  }}
                  className={cn(
                    "p-4 border-2 rounded-xl transition-all text-left",
                    selectedFormat === key
                      ? "border-blue-500 bg-blue-50/20"
                      : "border-gray-200 hover:border-gray-300 bg-white/5"
                  )}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {key === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                    {key === 'excel' && <FileSpreadsheet className="w-5 h-5 text-green-500" />}
                    {key === 'csv' && <FileText className="w-5 h-5 text-blue-500" />}
                    <span className="font-medium text-gray-800">{format.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{format.mime}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={exportConfig.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                placeholder="Enter report title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={exportConfig.subtitle}
                onChange={(e) => updateConfig({ subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                placeholder="Optional subtitle"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ 
                    ...prev, 
                    start: new Date(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ 
                    ...prev, 
                    end: new Date(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Settings className="w-4 h-4 inline mr-1" />
              Include in Export
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportConfig.includeCharts}
                  onChange={(e) => updateConfig({ includeCharts: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Charts and visualizations</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportConfig.includeData}
                  onChange={(e) => updateConfig({ includeData: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Raw data tables</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportConfig.includeTimestamp}
                  onChange={(e) => updateConfig({ includeTimestamp: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Generation timestamp</span>
              </label>
            </div>
          </div>

          {/* Format-specific options */}
          {selectedFormat === 'pdf' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Size
                </label>
                <select
                  value={exportConfig.pageSize}
                  onChange={(e) => updateConfig({ pageSize: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  value={exportConfig.pageOrientation}
                  onChange={(e) => updateConfig({ pageOrientation: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          )}

          {selectedFormat === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              <select
                value={exportConfig.quality}
                onChange={(e) => updateConfig({ quality: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
              >
                <option value="low">Low (Faster)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Better Quality)</option>
              </select>
            </div>
          )}

          {/* Error Display */}
          {exportError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{exportError}</span>
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Exporting dashboard...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  className="bg-blue-500 h-2 rounded-full"
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {exportProgress}% complete
              </div>
            </div>
          )}

          {/* Dashboard Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Dashboard Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <div className="font-medium text-gray-700">{dashboard.name}</div>
              </div>
              <div>
                <span className="text-gray-500">Widgets:</span>
                <div className="font-medium text-gray-700">{dashboard.widgets.length} widgets</div>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <div className="font-medium text-gray-700">
                  {dashboard.createdAt.toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Modified:</span>
                <div className="font-medium text-gray-700">
                  {dashboard.updatedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Export will include {dashboard.widgets.length} widgets
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};