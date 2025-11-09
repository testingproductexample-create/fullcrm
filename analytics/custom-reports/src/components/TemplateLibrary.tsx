import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileTemplate, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Share2, 
  Download,
  Star,
  Clock,
  User,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Globe,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Building,
  Briefcase,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useReportStore, ReportTemplate } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Predefined templates
const predefinedTemplates: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Sales Performance Report',
    description: 'Comprehensive sales analysis with revenue trends, top products, and regional performance',
    category: 'business',
    components: [
      {
        id: '1',
        type: 'chart',
        title: 'Revenue Trend',
        dataSource: 'sales',
        config: { chartType: 'line' },
        position: { x: 0, y: 0, w: 12, h: 4 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'table',
        title: 'Top Products',
        dataSource: 'products',
        config: { columns: ['name', 'revenue', 'units'], sortBy: 'revenue' },
        position: { x: 0, y: 4, w: 8, h: 6 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Total Revenue',
        dataSource: 'sales',
        config: { format: 'currency' },
        position: { x: 8, y: 4, w: 4, h: 3 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'metric',
        title: 'Growth Rate',
        dataSource: 'sales',
        config: { format: 'percentage' },
        position: { x: 8, y: 7, w: 4, h: 3 },
        visible: true,
        order: 3,
      }
    ],
    shared: false,
  },
  {
    name: 'UAE VAT Compliance Report',
    description: 'Automated VAT compliance report for UAE businesses with tax calculations and submission requirements',
    category: 'compliance',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Total VAT Collected',
        dataSource: 'tax',
        config: { format: 'currency' },
        position: { x: 0, y: 0, w: 4, h: 3 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Total VAT Paid',
        dataSource: 'tax',
        config: { format: 'currency' },
        position: { x: 4, y: 0, w: 4, h: 3 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Net VAT Payable',
        dataSource: 'tax',
        config: { format: 'currency' },
        position: { x: 8, y: 0, w: 4, h: 3 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'chart',
        title: 'VAT by Product Category',
        dataSource: 'tax',
        config: { chartType: 'pie' },
        position: { x: 0, y: 3, w: 6, h: 5 },
        visible: true,
        order: 3,
      },
      {
        id: '5',
        type: 'table',
        title: 'Tax Period Details',
        dataSource: 'tax',
        config: { columns: ['period', 'amount', 'due_date', 'status'] },
        position: { x: 6, y: 3, w: 6, h: 5 },
        visible: true,
        order: 4,
      }
    ],
    shared: false,
    compliance: {
      uae: true,
      standards: ['UAE_VAT', 'FTA_COMPLIANCE', 'TAX_SUBMISSION'],
    },
  },
  {
    name: 'Customer Analytics Dashboard',
    description: 'Customer behavior analysis including acquisition, retention, and lifetime value metrics',
    category: 'business',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Total Customers',
        dataSource: 'customers',
        config: { format: 'number' },
        position: { x: 0, y: 0, w: 3, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'New Customers (30d)',
        dataSource: 'customers',
        config: { format: 'number' },
        position: { x: 3, y: 0, w: 3, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Retention Rate',
        dataSource: 'customers',
        config: { format: 'percentage' },
        position: { x: 6, y: 0, w: 3, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'metric',
        title: 'Avg Customer Value',
        dataSource: 'customers',
        config: { format: 'currency' },
        position: { x: 9, y: 0, w: 3, h: 2 },
        visible: true,
        order: 3,
      },
      {
        id: '5',
        type: 'chart',
        title: 'Customer Acquisition Trend',
        dataSource: 'customers',
        config: { chartType: 'line' },
        position: { x: 0, y: 2, w: 12, h: 4 },
        visible: true,
        order: 4,
      },
      {
        id: '6',
        type: 'chart',
        title: 'Customer Segmentation',
        dataSource: 'customers',
        config: { chartType: 'doughnut' },
        position: { x: 0, y: 6, w: 6, h: 4 },
        visible: true,
        order: 5,
      },
      {
        id: '7',
        type: 'table',
        title: 'Top Customer Segments',
        dataSource: 'customers',
        config: { columns: ['segment', 'count', 'avg_value', 'growth'] },
        position: { x: 6, y: 6, w: 6, h: 4 },
        visible: true,
        order: 6,
      }
    ],
    shared: false,
  },
  {
    name: 'Geographic Sales Report',
    description: 'Multi-location sales analysis with regional performance and geographic heatmaps',
    category: 'geographic',
    components: [
      {
        id: '1',
        type: 'geographic',
        title: 'Sales by Region',
        dataSource: 'sales',
        config: { mapType: 'heatmap' },
        position: { x: 0, y: 0, w: 8, h: 6 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Top Region',
        dataSource: 'sales',
        config: { format: 'text' },
        position: { x: 8, y: 0, w: 4, h: 3 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Regional Growth',
        dataSource: 'sales',
        config: { format: 'percentage' },
        position: { x: 8, y: 3, w: 4, h: 3 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'table',
        title: 'Regional Performance',
        dataSource: 'sales',
        config: { columns: ['region', 'revenue', 'growth', 'market_share'] },
        position: { x: 0, y: 6, w: 12, h: 4 },
        visible: true,
        order: 3,
      }
    ],
    shared: false,
  },
  {
    name: 'Financial Performance Report',
    description: 'Comprehensive financial analysis with P&L, balance sheet, and cash flow metrics',
    category: 'financial',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Total Revenue',
        dataSource: 'financial',
        config: { format: 'currency' },
        position: { x: 0, y: 0, w: 4, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Net Profit',
        dataSource: 'financial',
        config: { format: 'currency' },
        position: { x: 4, y: 0, w: 4, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Profit Margin',
        dataSource: 'financial',
        config: { format: 'percentage' },
        position: { x: 8, y: 0, w: 4, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'chart',
        title: 'Revenue vs Expenses',
        dataSource: 'financial',
        config: { chartType: 'line' },
        position: { x: 0, y: 2, w: 12, h: 4 },
        visible: true,
        order: 3,
      },
      {
        id: '5',
        type: 'table',
        title: 'Monthly P&L',
        dataSource: 'financial',
        config: { columns: ['month', 'revenue', 'expenses', 'profit', 'margin'] },
        position: { x: 0, y: 6, w: 12, h: 4 },
        visible: true,
        order: 4,
      }
    ],
    shared: false,
  },
  {
    name: 'Employee Performance Report',
    description: 'HR analytics including productivity, attendance, and performance metrics',
    category: 'operational',
    components: [
      {
        id: '1',
        type: 'metric',
        title: 'Total Employees',
        dataSource: 'employees',
        config: { format: 'number' },
        position: { x: 0, y: 0, w: 3, h: 2 },
        visible: true,
        order: 0,
      },
      {
        id: '2',
        type: 'metric',
        title: 'Avg Performance Score',
        dataSource: 'employees',
        config: { format: 'number' },
        position: { x: 3, y: 0, w: 3, h: 2 },
        visible: true,
        order: 1,
      },
      {
        id: '3',
        type: 'metric',
        title: 'Attendance Rate',
        dataSource: 'employees',
        config: { format: 'percentage' },
        position: { x: 6, y: 0, w: 3, h: 2 },
        visible: true,
        order: 2,
      },
      {
        id: '4',
        type: 'metric',
        title: 'Productivity Index',
        dataSource: 'employees',
        config: { format: 'number' },
        position: { x: 9, y: 0, w: 3, h: 2 },
        visible: true,
        order: 3,
      },
      {
        id: '5',
        type: 'chart',
        title: 'Performance Distribution',
        dataSource: 'employees',
        config: { chartType: 'bar' },
        position: { x: 0, y: 2, w: 6, h: 4 },
        visible: true,
        order: 4,
      },
      {
        id: '6',
        type: 'chart',
        title: 'Department Performance',
        dataSource: 'employees',
        config: { chartType: 'radar' },
        position: { x: 6, y: 2, w: 6, h: 4 },
        visible: true,
        order: 5,
      },
      {
        id: '7',
        type: 'table',
        title: 'Top Performers',
        dataSource: 'employees',
        config: { columns: ['name', 'department', 'score', 'improvement'] },
        position: { x: 0, y: 6, w: 12, h: 4 },
        visible: true,
        order: 6,
      }
    ],
    shared: false,
  }
];

const TemplateLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { templates, addTemplate, updateTemplate, deleteTemplate, cloneTemplate } = useReportStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created'>('name');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  // Combine predefined templates with user-created templates
  const allTemplates = useMemo(() => {
    const predefined = predefinedTemplates.map(template => ({
      ...template,
      id: `predefined-${template.name}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPredefined: true,
    }));

    const userTemplates = templates.map(template => ({
      ...template,
      isPredefined: false,
    }));

    return [...predefined, ...userTemplates];
  }, [templates]);

  const categories = [
    { id: 'all', name: 'All Templates', icon: FileTemplate, count: allTemplates.length },
    { id: 'business', name: 'Business', icon: Briefcase, count: allTemplates.filter(t => t.category === 'business').length },
    { id: 'financial', name: 'Financial', icon: DollarSign, count: allTemplates.filter(t => t.category === 'financial').length },
    { id: 'operational', name: 'Operational', icon: TrendingUp, count: allTemplates.filter(t => t.category === 'operational').length },
    { id: 'compliance', name: 'Compliance', icon: Shield, count: allTemplates.filter(t => t.category === 'compliance').length },
    { id: 'geographic', name: 'Geographic', icon: Globe, count: allTemplates.filter(t => t.category === 'geographic').length },
    { id: 'custom', name: 'Custom', icon: Star, count: allTemplates.filter(t => t.category === 'custom').length },
  ];

  const filteredTemplates = useMemo(() => {
    return allTemplates
      .filter(template => {
        if (selectedCategory !== 'all' && template.category !== selectedCategory) {
          return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            template.name.toLowerCase().includes(query) ||
            template.description.toLowerCase().includes(query) ||
            template.category.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'category':
            return a.category.localeCompare(b.category);
          case 'created':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [allTemplates, selectedCategory, searchQuery, sortBy]);

  const handleCreateFromTemplate = (template: any) => {
    navigate(`/builder/template/${template.id}`, { 
      state: { template } 
    });
    toast.success('Template loaded in report builder');
  };

  const handleCloneTemplate = (template: any) => {
    cloneTemplate(template.id);
    toast.success('Template cloned successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
      toast.success('Template deleted');
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : FileTemplate;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      business: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      operational: 'bg-purple-100 text-purple-800',
      compliance: 'bg-red-100 text-red-800',
      geographic: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
            <p className="text-gray-600 mt-1">
              Choose from pre-built templates or create custom reports for your business needs
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/builder')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Custom Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Sidebar */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      {category.name}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="created">Date Created</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* View Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Templates Grid/List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileTemplate className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or create a custom template
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleCreateFromTemplate(template)}
                    onClone={() => handleCloneTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map(template => (
                  <TemplateListItem
                    key={template.id}
                    template={template}
                    onUse={() => handleCreateFromTemplate(template)}
                    onClone={() => handleCloneTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: any;
  onUse: () => void;
  onClone: () => void;
  onDelete: () => void;
  getCategoryIcon: (category: string) => React.ComponentType<any>;
  getCategoryColor: (category: string) => string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onUse,
  onClone,
  onDelete,
  getCategoryIcon,
  getCategoryColor,
}) => {
  const CategoryIcon = getCategoryIcon(template.category);
  const isPredefined = template.isPredefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CategoryIcon className="w-5 h-5 text-gray-600" />
          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
          {isPredefined && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Prebuilt
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClone();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <Copy className="w-4 h-4" />
          </button>
          {!isPredefined && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <BarChart3 className="w-4 h-4 mr-1" />
          {template.components.length} components
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {format(new Date(template.createdAt), 'MMM dd, yyyy')}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onUse}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Use Template
        </button>
        <button
          onClick={() => {/* Preview functionality */}}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Template List Item Component
const TemplateListItem: React.FC<TemplateCardProps> = ({
  template,
  onUse,
  onClone,
  onDelete,
  getCategoryIcon,
  getCategoryColor,
}) => {
  const CategoryIcon = getCategoryIcon(template.category);
  const isPredefined = template.isPredefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <CategoryIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
              {template.category}
            </span>
            {isPredefined && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Prebuilt
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">{template.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              {template.components.length} components
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {format(new Date(template.createdAt), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onUse}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Use Template
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClone();
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          {!isPredefined && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TemplateLibrary;