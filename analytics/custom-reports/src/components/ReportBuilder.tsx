import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { 
  Plus, 
  Save, 
  Play, 
  Eye, 
  Settings, 
  Copy, 
  Share2, 
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Text,
  Image,
  Globe,
  Trash2,
  RotateCcw,
  Grid3X3,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useReportStore, ReportComponent, ChartData } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ComponentPaletteItem {
  id: string;
  type: ReportComponent['type'];
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'charts' | 'data' | 'content' | 'geographic';
}

const componentPalette: ComponentPaletteItem[] = [
  { id: 'bar-chart', type: 'chart', name: 'Bar Chart', icon: BarChart3, description: 'Bar chart visualization', category: 'charts' },
  { id: 'line-chart', type: 'chart', name: 'Line Chart', icon: LineChart, description: 'Line chart visualization', category: 'charts' },
  { id: 'pie-chart', type: 'chart', name: 'Pie Chart', icon: PieChart, description: 'Pie chart visualization', category: 'charts' },
  { id: 'table', type: 'table', name: 'Data Table', icon: Table, description: 'Tabular data display', category: 'data' },
  { id: 'metric', type: 'metric', name: 'Metric Card', icon: BarChart3, description: 'Key performance indicator', category: 'data' },
  { id: 'text', type: 'text', name: 'Text Block', icon: Text, description: 'Rich text content', category: 'content' },
  { id: 'image', type: 'image', name: 'Image', icon: Image, description: 'Image or logo', category: 'content' },
  { id: 'geographic', type: 'geographic', name: 'Map Visualization', icon: Globe, description: 'Geographic data map', category: 'geographic' },
];

const ReportBuilder: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { 
    templates, 
    currentReport, 
    setCurrentReport,
    addReport, 
    updateReport,
    addTemplate 
  } = useReportStore();

  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState<ReportTemplate['category']>('business');
  const [components, setComponents] = useState<ReportComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);

  // Load existing template if editing
  React.useEffect(() => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setCurrentReport(template);
        setReportName(template.name);
        setReportDescription(template.description);
        setReportCategory(template.category);
        setComponents(template.components);
      }
    } else {
      setCurrentReport(null);
      setReportName('');
      setReportDescription('');
      setReportCategory('business');
      setComponents([]);
    }
  }, [templateId, templates, setCurrentReport]);

  const handleAddComponent = useCallback((paletteItem: ComponentPaletteItem) => {
    const newComponent: ReportComponent = {
      id: Date.now().toString(),
      type: paletteItem.type,
      title: paletteItem.name,
      dataSource: '',
      config: {
        chartType: paletteItem.type === 'chart' ? 'bar' : undefined,
        style: {},
        format: 'default',
      },
      position: {
        x: 0,
        y: components.length * 200,
        w: paletteItem.type === 'metric' ? 3 : 6,
        h: paletteItem.type === 'metric' ? 2 : 4,
      },
      visible: true,
      order: components.length,
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent.id);
    toast.success(`${paletteItem.name} added to report`);
  }, [components.length]);

  const handleUpdateComponent = useCallback((id: string, updates: Partial<ReportComponent>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  }, []);

  const handleDeleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
    toast.success('Component deleted');
  }, [selectedComponent]);

  const handleSaveReport = useCallback(() => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    const reportData = {
      name: reportName,
      description: reportDescription,
      category: reportCategory,
      components: components,
      shared: false,
    };

    if (currentReport) {
      updateReport(currentReport.id, reportData);
      toast.success('Report updated successfully');
    } else {
      addReport(reportData);
      toast.success('Report saved successfully');
    }
  }, [reportName, reportDescription, reportCategory, components, currentReport, addReport, updateReport]);

  const handleExport = useCallback((format: 'pdf' | 'excel' | 'csv' | 'json') => {
    // Export logic will be implemented
    toast.success(`Report exported as ${format.toUpperCase()}`);
  }, []);

  const selectedComponentData = components.find(comp => comp.id === selectedComponent);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'} flex`}>
      {/* Component Palette */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Component Library</h2>
          <div className="grid grid-cols-2 gap-2">
            {componentPalette.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddComponent(item)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-gray-600 mb-1" />
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Properties */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Report Properties</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Enter report description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as ReportTemplate['category'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="business">Business</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="geographic">Geographic</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Component Configuration */}
        {selectedComponentData && (
          <div className="p-4 border-b border-gray-200 flex-1">
            <h3 className="font-medium text-gray-900 mb-3">Component Settings</h3>
            <ComponentConfig
              component={selectedComponentData}
              onUpdate={(updates) => handleUpdateComponent(selectedComponentData.id, updates)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleSaveReport}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPreviewMode 
                  ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4 mr-1 inline" />
              Preview
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 mr-1 inline" /> : <Maximize2 className="w-4 h-4 mr-1 inline" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {reportName || 'Untitled Report'}
              </h1>
              <span className={`px-2 py-1 text-xs rounded-full ${
                reportCategory === 'compliance' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {reportCategory}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('pdf')}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1 inline" />
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1 inline" />
                Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1 inline" />
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1 inline" />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto p-6">
          <DndContext onDragStart={(e) => setDraggedComponent(e.active.id as string)}>
            <SortableContext items={components.map(c => c.id)}>
              <div className="space-y-4 max-w-6xl mx-auto">
                {components.length === 0 ? (
                  <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Report</h3>
                    <p className="text-gray-500 mb-4">
                      Drag components from the left panel or click to add them to your report
                    </p>
                    <button
                      onClick={() => handleAddComponent(componentPalette[0])}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Component
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {components.map(component => (
                      <ComponentCanvas
                        key={component.id}
                        component={component}
                        isSelected={selectedComponent === component.id}
                        isPreview={isPreviewMode}
                        onSelect={() => setSelectedComponent(component.id)}
                        onUpdate={(updates) => handleUpdateComponent(component.id, updates)}
                        onDelete={() => handleDeleteComponent(component.id)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

// Component Canvas Item
interface ComponentCanvasProps {
  component: ReportComponent;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ReportComponent>) => void;
  onDelete: () => void;
}

const ComponentCanvas: React.FC<ComponentCanvasProps> = ({
  component,
  isSelected,
  isPreview,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
      } ${!isPreview ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={!isPreview ? onSelect : undefined}
      style={{ 
        minHeight: '200px',
        position: 'relative',
      }}
    >
      {!isPreview && (
        <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ visible: !component.visible });
            }}
            className="p-1 bg-white border border-gray-300 rounded text-gray-600 hover:text-gray-800"
          >
            {component.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 bg-white border border-gray-300 rounded text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">{component.title}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {component.type}
          </span>
        </div>

        {/* Component Content Preview */}
        <div className="min-h-[120px] bg-gray-50 rounded border p-4">
          <ComponentPreview component={component} />
        </div>
      </div>
    </motion.div>
  );
};

// Component Preview
const ComponentPreview: React.FC<{ component: ReportComponent }> = ({ component }) => {
  switch (component.type) {
    case 'chart':
      return <ChartPreview component={component} />;
    case 'table':
      return <TablePreview component={component} />;
    case 'metric':
      return <MetricPreview component={component} />;
    case 'text':
      return <TextPreview component={component} />;
    case 'geographic':
      return <GeographicPreview component={component} />;
    default:
      return <div className="text-gray-500 text-center">Component preview</div>;
  }
};

// Preview Components (simplified versions)
const ChartPreview: React.FC<{ component: ReportComponent }> = ({ component }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">Chart Preview</p>
      <p className="text-xs text-gray-400">Configure data source to see preview</p>
    </div>
  </div>
);

const TablePreview: React.FC<{ component: ReportComponent }> = ({ component }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <Table className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">Table Preview</p>
      <p className="text-xs text-gray-400">Configure data source to see preview</p>
    </div>
  </div>
);

const MetricPreview: React.FC<{ component: ReportComponent }> = ({ component }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600">--</div>
      <p className="text-sm text-gray-500">Metric Preview</p>
    </div>
  </div>
);

const TextPreview: React.FC<{ component: ReportComponent }> = ({ component }) => (
  <div className="p-4">
    <p className="text-gray-600">Sample text content...</p>
  </div>
);

const GeographicPreview: React.FC<{ component: ReportComponent }> = ({ component }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">Geographic Map</p>
    </div>
  </div>
);

// Component Configuration Panel
const ComponentConfig: React.FC<{
  component: ReportComponent;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}> = ({ component, onUpdate }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
      <input
        type="text"
        value={component.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
      <select
        value={component.dataSource}
        onChange={(e) => onUpdate({ dataSource: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select data source</option>
        <option value="sales">Sales Data</option>
        <option value="customers">Customer Data</option>
        <option value="products">Product Data</option>
        <option value="financial">Financial Data</option>
      </select>
    </div>

    {component.type === 'chart' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
        <select
          value={component.config.chartType || 'bar'}
          onChange={(e) => onUpdate({ 
            config: { ...component.config, chartType: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="doughnut">Doughnut Chart</option>
        </select>
      </div>
    )}

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
        <input
          type="number"
          min="1"
          max="12"
          value={component.position.w}
          onChange={(e) => onUpdate({ 
            position: { ...component.position, w: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
        <input
          type="number"
          min="1"
          max="10"
          value={component.position.h}
          onChange={(e) => onUpdate({ 
            position: { ...component.position, h: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  </div>
);

export default ReportBuilder;