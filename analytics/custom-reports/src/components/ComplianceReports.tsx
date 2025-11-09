import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Download, 
  Upload, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2,
  AlertCircle,
  Calendar,
  Users,
  Building,
  DollarSign,
  Globe,
  Settings,
  Search,
  Filter,
  Plus,
  BarChart3,
  PieChart,
  TrendingUp,
  Target,
  FileCheck,
  Mail,
  Printer
} from 'lucide-react';
import { useReportStore, ComplianceReport } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isAfter, isBefore, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';

// UAE Compliance Templates
const uaeComplianceTemplates = {
  UAE_VAT: {
    name: 'UAE VAT Compliance Report',
    description: 'Comprehensive VAT reporting for UAE Federal Tax Authority',
    requirements: [
      'VAT Registration Certificate',
      'VAT Returns (Quarterly/Monthly)',
      'Tax Invoices',
      'Input Tax Credit Documentation',
      'Zero-rated Export Documentation',
      'Period Summary Reports'
    ],
    dueDate: 'Last day of month following tax period',
    penalty: 'Up to 5% penalty + interest on unpaid VAT',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Total VAT Collected',
        dataSource: 'vat',
        config: { format: 'currency' },
        position: { x: 0, y: 0, w: 4, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Total VAT Paid',
        dataSource: 'vat',
        config: { format: 'currency' },
        position: { x: 4, y: 0, w: 4, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Net VAT Payable/Refundable',
        dataSource: 'vat',
        config: { format: 'currency' },
        position: { x: 8, y: 0, w: 4, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'chart',
        title: 'VAT by Product Category',
        dataSource: 'vat',
        config: { chartType: 'pie' },
        position: { x: 0, y: 2, w: 6, h: 4 },
        visible: true,
        order: 3,
      },
      {
        id: '5',
        type: 'chart',
        title: 'VAT Trend Analysis',
        dataSource: 'vat',
        config: { chartType: 'line' },
        position: { x: 6, y: 2, w: 6, h: 4 },
        visible: true,
        order: 4,
      },
      {
        id: '6',
        type: 'table',
        title: 'Tax Period Details',
        dataSource: 'vat',
        config: { columns: ['period', 'collected', 'paid', 'net', 'due_date', 'status'] },
        position: { x: 0, y: 6, w: 12, h: 4 },
        visible: true,
        order: 5,
      }
    ],
  },
  UAE_CORP: {
    name: 'UAE Corporate Tax Report',
    description: 'Corporate tax compliance for UAE Ministry of Economy',
    requirements: [
      'Tax Registration Certificate',
      'Annual Tax Return',
      'Financial Statements (Audited)',
      'Tax Computation Schedule',
      'Supporting Documentation',
      'Payment Evidence'
    ],
    dueDate: '9 months after financial year end',
    penalty: 'Up to 31.5% penalty on unpaid tax + interest',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Taxable Income',
        dataSource: 'corporate_tax',
        config: { format: 'currency' },
        position: { x: 0, y: 0, w: 6, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Corporate Tax Payable',
        dataSource: 'corporate_tax',
        config: { format: 'currency' },
        position: { x: 6, y: 0, w: 6, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'chart',
        title: 'Revenue vs Expenses',
        dataSource: 'corporate_tax',
        config: { chartType: 'bar' },
        position: { x: 0, y: 2, w: 12, h: 4 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'table',
        title: 'Tax Computation',
        dataSource: 'corporate_tax',
        config: { columns: ['item', 'amount', 'tax_rate', 'tax_amount'] },
        position: { x: 0, y: 6, w: 12, h: 4 },
        visible: true,
        order: 3,
      }
    ],
  },
  UAE_LABOR: {
    name: 'UAE Labor Law Compliance',
    description: 'Wage Protection System (WPS) and labor law compliance',
    requirements: [
      'WPS Salary Certificates',
      'End of Service Calculator',
      'Overtime Records',
      'Working Hours Compliance',
      'Leave Records',
      'Employee Contracts'
    ],
    dueDate: 'Monthly (WPS) + Annual (Contracts)',
    penalty: 'Up to AED 20,000 per employee + imprisonment',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Total Employees',
        dataSource: 'labor',
        config: { format: 'number' },
        position: { x: 0, y: 0, w: 3, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Monthly Payroll',
        dataSource: 'labor',
        config: { format: 'currency' },
        position: { x: 3, y: 0, w: 3, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Compliance Score',
        dataSource: 'labor',
        config: { format: 'percentage' },
        position: { x: 6, y: 0, w: 3, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'metric',
        title: 'Pending Leaves',
        dataSource: 'labor',
        config: { format: 'number' },
        position: { x: 9, y: 0, w: 3, h: 2 },
        visible: true,
        order: 3,
      },
      {
        id: '5',
        type: 'table',
        title: 'Employee Compliance Status',
        dataSource: 'labor',
        config: { columns: ['employee', 'wps_status', 'contract_status', 'leave_balance'] },
        position: { x: 0, y: 2, w: 12, h: 4 },
        visible: true,
        order: 4,
      }
    ],
  },
  UAE_TRADE: {
    name: 'UAE Trade & Customs Compliance',
    description: 'Customs and trade licensing compliance',
    requirements: [
      'Trade License',
      'Import/Export Permits',
      'Customs Declarations',
      'Certificate of Origin',
      'Harmonized System (HS) Codes',
      'Trade Statistics Reports'
    ],
    dueDate: 'Varies by import/export',
    penalty: 'Up to AED 100,000 + customs duty',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Import Value',
        dataSource: 'trade',
        config: { format: 'currency' },
        position: { x: 0, y: 0, w: 4, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Export Value',
        dataSource: 'trade',
        config: { format: 'currency' },
        position: { x: 4, y: 0, w: 4, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Trade Balance',
        dataSource: 'trade',
        config: { format: 'currency' },
        position: { x: 8, y: 0, w: 4, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'table',
        title: 'Recent Transactions',
        dataSource: 'trade',
        config: { columns: ['date', 'type', 'value', 'customs_duty', 'status'] },
        position: { x: 0, y: 2, w: 12, h: 4 },
        visible: true,
        order: 3,
      }
    ],
  },
  UAE_DATA_PROTECTION: {
    name: 'UAE Data Protection Compliance',
    description: 'Personal data protection and privacy compliance',
    requirements: [
      'Data Processing Agreement',
      'Privacy Policy',
      'Consent Records',
      'Data Retention Policy',
      'Breach Notification Procedure',
      'Data Subject Rights Management'
    ],
    dueDate: 'Ongoing (with annual reviews)',
    penalty: 'Up to AED 3 million + 2% of annual revenue',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Data Subjects',
        dataSource: 'data_protection',
        config: { format: 'number' },
        position: { x: 0, y: 0, w: 4, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Active Consents',
        dataSource: 'data_protection',
        config: { format: 'number' },
        position: { x: 4, y: 0, w: 4, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Compliance Score',
        dataSource: 'data_protection',
        config: { format: 'percentage' },
        position: { x: 8, y: 0, w: 4, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'table',
        title: 'Data Processing Activities',
        dataSource: 'data_protection',
        config: { columns: ['activity', 'purpose', 'legal_basis', 'retention_period'] },
        position: { x: 0, y: 2, w: 12, h: 4 },
        visible: true,
        order: 3,
      }
    ],
  }
};

const ComplianceReports: React.FC = () => {
  const { 
    complianceReports, 
    addComplianceReport, 
    updateComplianceReport, 
    deleteComplianceReport 
  } = useReportStore();

  const [selectedType, setSelectedType] = useState<keyof typeof uaeComplianceTemplates>('UAE_VAT');
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReport, setEditingReport] = useState<ComplianceReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review' | 'approved' | 'submitted' | 'overdue'>('all');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  useEffect(() => {
    setReports(complianceReports);
  }, [complianceReports]);

  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.name.toLowerCase().includes(query) ||
        report.type.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const handleCreateReport = (type: keyof typeof uaeComplianceTemplates) => {
    const template = uaeComplianceTemplates[type];
    const newReport: Omit<ComplianceReport, 'id' | 'createdAt' | 'updatedAt'> = {
      type,
      name: template.name,
      requirements: template.requirements,
      dueDate: addDays(new Date(), 30), // Default 30 days from now
      status: 'draft',
      components: template.components,
      recipients: [],
    };

    addComplianceReport(newReport);
    const created = complianceReports[complianceReports.length - 1];
    setEditingReport(created);
    setIsCreating(true);
    toast.success(`${template.name} created`);
  };

  const handleUpdateReport = (id: string, updates: Partial<ComplianceReport>) => {
    updateComplianceReport(id, updates);
    toast.success('Compliance report updated');
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this compliance report?')) {
      deleteComplianceReport(id);
      toast.success('Compliance report deleted');
    }
  };

  const getReportStatus = (report: ComplianceReport) => {
    const now = new Date();
    const dueDate = new Date(report.dueDate);
    const isOverdue = isBefore(dueDate, now) && report.status !== 'submitted';

    const statusConfig = {
      draft: { 
        icon: FileText, 
        color: 'text-gray-600', 
        bg: 'bg-gray-50',
        label: 'Draft'
      },
      review: { 
        icon: Eye, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50',
        label: 'Under Review'
      },
      approved: { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-50',
        label: 'Approved'
      },
      submitted: { 
        icon: CheckCircle, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50',
        label: 'Submitted'
      },
      overdue: { 
        icon: AlertTriangle, 
        color: 'text-red-600', 
        bg: 'bg-red-50',
        label: 'Overdue'
      }
    };

    if (isOverdue) {
      return statusConfig.overdue;
    }

    return statusConfig[report.status] || statusConfig.draft;
  };

  const getUrgencyLevel = (report: ComplianceReport) => {
    const now = new Date();
    const dueDate = new Date(report.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return { level: 'critical', color: 'text-red-600', days: Math.abs(daysUntilDue) };
    if (daysUntilDue <= 7) return { level: 'urgent', color: 'text-orange-600', days: daysUntilDue };
    if (daysUntilDue <= 30) return { level: 'warning', color: 'text-yellow-600', days: daysUntilDue };
    return { level: 'normal', color: 'text-green-600', days: daysUntilDue };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UAE Compliance Reports</h1>
            <p className="text-gray-600 mt-1">
              Generate and manage compliance reports for UAE regulatory requirements
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Next due: {reports
                .filter(r => r.status !== 'submitted' && isAfter(new Date(r.dueDate), new Date()))
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.name || 'None'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Compliance Types Sidebar */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">UAE Compliance Types</h3>
          <div className="space-y-3">
            {Object.entries(uaeComplianceTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => handleCreateReport(key as keyof typeof uaeComplianceTemplates)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="text-xs text-gray-500">
                      Due: {template.dueDate}
                    </div>
                  </div>
                  <div className="ml-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search compliance reports..."
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
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="submitted">Submitted</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              {selectedReports.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedReports.length} selected
                  </span>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                    Export Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance reports found</h3>
                <p className="text-gray-500 mb-4">
                  Create your first compliance report from the left panel
                </p>
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
                              setSelectedReports(filteredReports.map(r => r.id));
                            } else {
                              setSelectedReports([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Urgency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map(report => {
                      const status = getReportStatus(report);
                      const urgency = getUrgencyLevel(report);
                      const StatusIcon = status.icon;

                      return (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
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
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {report.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {report.requirements.length} requirements
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              <Shield className="w-3 h-3 mr-1" />
                              {report.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(new Date(report.dueDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {urgency.days > 0 ? `${urgency.days} days left` : `${Math.abs(urgency.days)} days overdue`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${urgency.color}`}>
                              {urgency.level.charAt(0).toUpperCase() + urgency.level.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingReport(report)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-600 hover:text-gray-800">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:text-green-800">
                                <Download className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-purple-600 hover:text-purple-800">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(report.id)}
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
        </div>
      </div>

      {/* Edit Report Modal */}
      <AnimatePresence>
        {editingReport && (
          <ComplianceReportModal
            report={editingReport}
            onSave={(updates) => handleUpdateReport(editingReport.id, updates)}
            onClose={() => {
              setEditingReport(null);
              setIsCreating(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Compliance Report Modal
interface ComplianceReportModalProps {
  report: ComplianceReport;
  onSave: (updates: Partial<ComplianceReport>) => void;
  onClose: () => void;
}

const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({ report, onSave, onClose }) => {
  const [name, setName] = useState(report.name);
  const [dueDate, setDueDate] = useState(format(new Date(report.dueDate), 'yyyy-MM-dd'));
  const [status, setStatus] = useState(report.status);
  const [recipients, setRecipients] = useState(report.recipients);

  const handleSave = () => {
    onSave({
      name,
      dueDate: new Date(dueDate),
      status,
      recipients,
    });
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
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Compliance Report</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input
              type="text"
              value={report.type}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplianceReport['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <div className="space-y-2">
              {report.requirements.map((req, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {req}
                </div>
              ))}
            </div>
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
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ComplianceReports;