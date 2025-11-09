import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  BarChart3, 
  PieChart, 
  Table, 
  Gauge, 
  TrendingUp,
  Activity,
  Bell,
  Grid3X3,
  Settings,
  Filter
} from 'lucide-react';
import { Widget, WidgetType, VisualizationType } from '../../types';
import { cn } from '../../utils/helpers';
import { WIDGET_CONFIGS } from '../../data/constants';

interface WidgetSelectorProps {
  onAddWidget: (widget: Omit<Widget, 'id' | 'position'>) => void;
  onClose: () => void;
}

interface WidgetTemplate {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  visualization: VisualizationType;
  category: string;
  tags: string[];
  config: {
    dataSource: string;
    defaultSize: { width: number; height: number };
    fields: string[];
    sampleData?: any[];
  };
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'kpi-revenue',
    type: 'kpi',
    name: 'Revenue KPI',
    description: 'Display key revenue metrics with trend indicators',
    icon: TrendingUp,
    visualization: 'metric',
    category: 'Financial',
    tags: ['kpi', 'revenue', 'financial', 'metric'],
    config: {
      dataSource: 'finance',
      defaultSize: { width: 300, height: 150 },
      fields: ['revenue', 'growth', 'target']
    }
  },
  {
    id: 'kpi-orders',
    type: 'kpi',
    name: 'Orders KPI',
    description: 'Track order volume and conversion metrics',
    icon: Activity,
    visualization: 'metric',
    category: 'Sales',
    tags: ['kpi', 'orders', 'sales', 'conversion'],
    config: {
      dataSource: 'orders',
      defaultSize: { width: 300, height: 150 },
      fields: ['total_orders', 'conversion_rate', 'avg_value']
    }
  },
  {
    id: 'kpi-customers',
    type: 'kpi',
    name: 'Customers KPI',
    description: 'Monitor customer acquisition and retention',
    icon: Grid3X3,
    visualization: 'metric',
    category: 'Customer',
    tags: ['kpi', 'customers', 'retention', 'acquisition'],
    config: {
      dataSource: 'customers',
      defaultSize: { width: 300, height: 150 },
      fields: ['total_customers', 'new_customers', 'retention_rate']
    }
  },
  {
    id: 'chart-revenue',
    type: 'chart',
    name: 'Revenue Chart',
    description: 'Visualize revenue trends over time',
    icon: BarChart3,
    visualization: 'line',
    category: 'Financial',
    tags: ['chart', 'revenue', 'trend', 'line'],
    config: {
      dataSource: 'finance',
      defaultSize: { width: 600, height: 400 },
      fields: ['date', 'revenue', 'target']
    }
  },
  {
    id: 'chart-sales-by-category',
    type: 'chart',
    name: 'Sales by Category',
    description: 'Break down sales by product categories',
    icon: PieChart,
    visualization: 'pie',
    category: 'Sales',
    tags: ['chart', 'sales', 'category', 'pie'],
    config: {
      dataSource: 'sales',
      defaultSize: { width: 400, height: 400 },
      fields: ['category', 'sales_amount', 'percentage']
    }
  },
  {
    id: 'chart-performance',
    type: 'chart',
    name: 'Performance Metrics',
    description: 'Track key performance indicators',
    icon: BarChart3,
    visualization: 'bar',
    category: 'Operations',
    tags: ['chart', 'performance', 'bar', 'metrics'],
    config: {
      dataSource: 'performance',
      defaultSize: { width: 600, height: 400 },
      fields: ['metric', 'value', 'target']
    }
  },
  {
    id: 'table-leads',
    type: 'table',
    name: 'Leads Table',
    description: 'Display and manage sales leads',
    icon: Table,
    visualization: 'table',
    category: 'Sales',
    tags: ['table', 'leads', 'sales', 'data'],
    config: {
      dataSource: 'crm',
      defaultSize: { width: 800, height: 400 },
      fields: ['name', 'email', 'status', 'value', 'created_at']
    }
  },
  {
    id: 'table-orders',
    type: 'table',
    name: 'Orders Table',
    description: 'View and manage order data',
    icon: Table,
    visualization: 'table',
    category: 'Operations',
    tags: ['table', 'orders', 'management', 'data'],
    config: {
      dataSource: 'orders',
      defaultSize: { width: 800, height: 400 },
      fields: ['order_id', 'customer', 'amount', 'status', 'date']
    }
  },
  {
    id: 'gauge-performance',
    type: 'gauge',
    name: 'Performance Gauge',
    description: 'Display performance metrics with target indicators',
    icon: Gauge,
    visualization: 'gauge',
    category: 'Operations',
    tags: ['gauge', 'performance', 'target', 'metric'],
    config: {
      dataSource: 'performance',
      defaultSize: { width: 300, height: 300 },
      fields: ['value', 'target', 'min', 'max']
    }
  },
  {
    id: 'gauge-progress',
    type: 'gauge',
    name: 'Progress Gauge',
    description: 'Track project or task completion',
    icon: Gauge,
    visualization: 'gauge',
    category: 'Project',
    tags: ['gauge', 'progress', 'completion', 'project'],
    config: {
      dataSource: 'projects',
      defaultSize: { width: 300, height: 300 },
      fields: ['completed', 'total', 'percentage']
    }
  },
  {
    id: 'progress-tasks',
    type: 'progress',
    name: 'Task Progress',
    description: 'Show task completion and milestones',
    icon: Activity,
    visualization: 'progress',
    category: 'Project',
    tags: ['progress', 'tasks', 'completion', 'milestone'],
    config: {
      dataSource: 'tasks',
      defaultSize: { width: 300, height: 100 },
      fields: ['completed', 'total', 'milestones', 'time_remaining']
    }
  },
  {
    id: 'alerts-panel',
    type: 'alerts',
    name: 'Alerts Panel',
    description: 'Display system alerts and notifications',
    icon: Bell,
    visualization: 'card',
    category: 'System',
    tags: ['alerts', 'notifications', 'system', 'monitoring'],
    config: {
      dataSource: 'alerts',
      defaultSize: { width: 400, height: 300 },
      fields: ['title', 'message', 'severity', 'timestamp', 'status']
    }
  }
];

const CATEGORIES = ['All', 'Financial', 'Sales', 'Customer', 'Operations', 'Project', 'System'];
const VISUALIZATIONS = ['All', 'metric', 'line', 'bar', 'pie', 'table', 'gauge', 'progress', 'card'];

export const WidgetSelector: React.FC<WidgetSelectorProps> = ({
  onAddWidget,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVisualization, setSelectedVisualization] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);

  // Filter templates
  const filteredTemplates = WIDGET_TEMPLATES.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      template.category === selectedCategory;
    
    const matchesVisualization = 
      selectedVisualization === 'All' || 
      template.visualization === selectedVisualization;

    return matchesSearch && matchesCategory && matchesVisualization;
  });

  const handleAddWidget = (template: WidgetTemplate) => {
    const widget: Omit<Widget, 'id' | 'position'> = {
      type: template.type,
      title: template.name,
      description: template.description,
      dataSource: template.config.dataSource,
      query: {
        entity: template.config.dataSource,
        fields: template.config.fields,
        filters: []
      },
      visualization: template.visualization,
      configuration: {
        showLegend: true,
        showGrid: true,
        showLabels: true,
        colors: [],
        animation: true,
        responsive: true,
        customConfig: {
          category: template.category,
          tags: template.tags
        }
      },
      filters: [],
      refreshInterval: 30,
      size: template.config.defaultSize
    };

    onAddWidget(widget);
  };

  const handleQuickAdd = (template: WidgetTemplate) => {
    handleAddWidget(template);
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
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Widget</h2>
              <p className="text-gray-600">Choose a widget template to add to your dashboard</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedVisualization}
              onChange={(e) => setSelectedVisualization(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
            >
              {VISUALIZATIONS.map(vis => (
                <option key={vis} value={vis}>
                  {vis === 'All' ? 'All Types' : vis.charAt(0).toUpperCase() + vis.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No widgets found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredTemplates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        whileHover={{ y: -4 }}
                        className={cn(
                          "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 cursor-pointer",
                          "hover:shadow-lg hover:border-blue-300 transition-all duration-200",
                          "group"
                        )}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            getCategoryColor(template.category)
                          )}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs text-gray-500 bg-white/20 px-2 py-1 rounded">
                            {template.category}
                          </span>
                        </div>

                        <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-gray-500">
                              {template.visualization}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(template);
                            }}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                          >
                            Quick Add
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="text-xs text-gray-500 bg-white/20 px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {filteredTemplates.length > 0 && (
          <div className="p-4 border-t border-white/20 bg-white/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredTemplates.length} widgets available
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <span className="text-sm text-gray-500">
                  Click "Quick Add" or select a widget for more options
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Financial: 'bg-green-500',
    Sales: 'bg-blue-500',
    Customer: 'bg-purple-500',
    Operations: 'bg-orange-500',
    Project: 'bg-indigo-500',
    System: 'bg-red-500'
  };
  return colors[category] || 'bg-gray-500';
}