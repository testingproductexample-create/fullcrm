import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Filter,
  Settings,
  Download,
  Share2,
  Maximize2,
  RefreshCw,
  Play,
  Pause,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  Globe,
  Target,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { useReportStore, ChartData } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

interface VisualizationConfig {
  chartType: ChartData['type'];
  dataSource: string;
  xAxis: string;
  yAxis: string[];
  groupBy?: string;
  filters: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
    value: any;
  }[];
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  customDateRange?: { start: Date; end: Date };
  theme: 'light' | 'dark' | 'colorful';
  showLegend: boolean;
  showGrid: boolean;
  animated: boolean;
}

const DataVisualization: React.FC = () => {
  const { reports, addReport } = useReportStore();
  const [activeChart, setActiveChart] = useState<string | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [config, setConfig] = useState<VisualizationConfig>({
    chartType: 'line',
    dataSource: 'sales',
    xAxis: 'date',
    yAxis: ['value'],
    filters: [],
    aggregation: 'sum',
    timeRange: '30d',
    theme: 'light',
    showLegend: true,
    showGrid: true,
    animated: true,
  });

  // Sample data generation
  useEffect(() => {
    generateSampleData();
  }, [timeRange, config.dataSource]);

  const generateSampleData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const sampleData = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const baseValue = config.dataSource === 'sales' ? 1000 : 50;
      const randomFactor = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
      const trend = 1 + (i / days) * 0.2; // Slight upward trend
      
      return {
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue * randomFactor * trend),
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        region: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'][Math.floor(Math.random() * 4)],
        type: config.dataSource,
        metadata: {
          orders: Math.floor(Math.random() * 50) + 10,
          customers: Math.floor(Math.random() * 20) + 5,
          conversion: (Math.random() * 10).toFixed(2),
        }
      };
    });

    setData(sampleData);
  };

  // Real-time data simulation
  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      const newPoint = {
        date: new Date().toISOString().split('T')[0],
        value: Math.round(1000 * (0.5 + Math.random() * 0.5)),
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        region: ['Dubai', 'Abu Dhabi', 'Sharjah'][Math.floor(Math.random() * 3)],
        type: config.dataSource,
        metadata: {
          orders: Math.floor(Math.random() * 50) + 10,
          customers: Math.floor(Math.random() * 20) + 5,
          conversion: (Math.random() * 10).toFixed(2),
        }
      };
      
      setData(prev => [...prev.slice(-29), newPoint]); // Keep last 30 data points
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealTime, config.dataSource]);

  const processedData = useMemo(() => {
    if (!data.length) return null;

    const filteredData = config.filters.reduce((acc, filter) => {
      return acc.filter(item => {
        const value = item[filter.field];
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater':
            return value > filter.value;
          case 'less':
            return value < filter.value;
          case 'between':
            return value >= filter.value[0] && value <= filter.value[1];
          default:
            return true;
        }
      });
    }, data);

    // Group data by x-axis
    const groupedData = filteredData.reduce((acc, item) => {
      const key = item[config.xAxis];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Aggregate data
    const labels = Object.keys(groupedData);
    const datasets = config.yAxis.map((yField, index) => {
      const values = labels.map(label => {
        const group = groupedData[label];
        const fieldValues = group.map(item => item[yField] || item.metadata[yField] || 0);
        
        switch (config.aggregation) {
          case 'sum':
            return fieldValues.reduce((sum, val) => sum + val, 0);
          case 'average':
            return fieldValues.reduce((sum, val) => sum + val, 0) / fieldValues.length;
          case 'count':
            return fieldValues.length;
          case 'min':
            return Math.min(...fieldValues);
          case 'max':
            return Math.max(...fieldValues);
          default:
            return 0;
        }
      });

      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
      ];

      return {
        label: yField,
        data: values,
        backgroundColor: config.chartType === 'line' ? colors[index] + '20' : colors[index],
        borderColor: colors[index],
        borderWidth: 2,
        tension: 0.4,
        fill: config.chartType === 'area',
      };
    });

    return { labels, datasets };
  }, [data, config]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.showLegend,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => format(new Date(context[0].label), 'MMM dd, yyyy'),
        },
      },
    },
    scales: {
      x: {
        display: config.showGrid,
        grid: {
          display: config.showGrid,
        },
      },
      y: {
        display: config.showGrid,
        beginAtZero: true,
        grid: {
          display: config.showGrid,
        },
      },
    },
    animation: config.animated ? {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    } : false,
  };

  const renderChart = () => {
    if (!processedData) return <div>No data available</div>;

    const commonProps = {
      data: processedData,
      options: chartOptions,
    };

    switch (config.chartType) {
      case 'line':
        return <Line {...commonProps} />;
      case 'bar':
        return <Bar {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'radar':
        return <Radar {...commonProps} />;
      case 'polarArea':
        return <PolarArea {...commonProps} />;
      default:
        return <Line {...commonProps} />;
    }
  };

  const handleAddFilter = () => {
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, {
        field: 'category',
        operator: 'equals',
        value: 'A',
      }]
    }));
  };

  const handleRemoveFilter = (index: number) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const handleExportChart = (format: 'png' | 'pdf' | 'svg') => {
    toast.success(`Chart exported as ${format.toUpperCase()}`);
  };

  const addToReport = () => {
    const chartConfig: ChartData = {
      id: Date.now().toString(),
      name: 'Custom Chart',
      type: config.chartType,
      data: data,
      xAxis: config.xAxis,
      yAxis: config.yAxis.join(', '),
      groupBy: config.groupBy,
      filters: config.filters,
      realTime: isRealTime,
    };

    const reportData = {
      name: `Chart Report - ${format(new Date(), 'PPpp')}`,
      description: 'Generated chart report',
      category: 'custom' as const,
      components: [],
      chartConfigs: [chartConfig],
    };

    addReport(reportData);
    toast.success('Chart added to report');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Visualization</h1>
            <p className="text-gray-600 mt-1">
              Create interactive charts and graphs with real-time data
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className={`p-2 rounded-lg transition-colors ${
                isRealTime 
                  ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isRealTime ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={generateSampleData}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Configuration Panel */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Chart Configuration</h3>
          
          {/* Chart Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'line', icon: LineChart, name: 'Line' },
                { type: 'bar', icon: BarChart, name: 'Bar' },
                { type: 'pie', icon: PieChart, name: 'Pie' },
                { type: 'doughnut', icon: PieChart, name: 'Donut' },
                { type: 'radar', icon: Target, name: 'Radar' },
                { type: 'polarArea', icon: Activity, name: 'Polar' },
              ].map(({ type, icon: Icon, name }) => (
                <button
                  key={type}
                  onClick={() => setConfig(prev => ({ ...prev, chartType: type as any }))}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    config.chartType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs">{name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Source */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
            <select
              value={config.dataSource}
              onChange={(e) => setConfig(prev => ({ ...prev, dataSource: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sales">Sales Data</option>
              <option value="customers">Customer Data</option>
              <option value="products">Product Data</option>
              <option value="financial">Financial Data</option>
              <option value="performance">Performance Data</option>
            </select>
          </div>

          {/* X-Axis */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">X-Axis</label>
            <select
              value={config.xAxis}
              onChange={(e) => setConfig(prev => ({ ...prev, xAxis: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="category">Category</option>
              <option value="region">Region</option>
            </select>
          </div>

          {/* Y-Axis */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Y-Axis</label>
            <div className="space-y-2">
              {['value', 'orders', 'customers', 'conversion'].map(field => (
                <label key={field} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.yAxis.includes(field)}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        yAxis: e.target.checked 
                          ? [...prev.yAxis, field]
                          : prev.yAxis.filter(f => f !== field)
                      }));
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Aggregation */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation</label>
            <select
              value={config.aggregation}
              onChange={(e) => setConfig(prev => ({ ...prev, aggregation: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sum">Sum</option>
              <option value="average">Average</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Filters</label>
              <button
                onClick={handleAddFilter}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Filter
              </button>
            </div>
            <div className="space-y-2">
              {config.filters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={filter.field}
                    onChange={(e) => {
                      const newFilters = [...config.filters];
                      newFilters[index].field = e.target.value;
                      setConfig(prev => ({ ...prev, filters: newFilters }));
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="category">Category</option>
                    <option value="region">Region</option>
                  </select>
                  <select
                    value={filter.operator}
                    onChange={(e) => {
                      const newFilters = [...config.filters];
                      newFilters[index].operator = e.target.value as any;
                      setConfig(prev => ({ ...prev, filters: newFilters }));
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater">Greater</option>
                    <option value="less">Less</option>
                  </select>
                  <button
                    onClick={() => handleRemoveFilter(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showLegend}
                  onChange={(e) => setConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Legend</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showGrid}
                  onChange={(e) => setConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Grid</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.animated}
                  onChange={(e) => setConfig(prev => ({ ...prev, animated: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Animated</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={addToReport}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add to Report
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExportChart('png')}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                PNG
              </button>
              <button
                onClick={() => handleExportChart('pdf')}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Chart Display */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Interactive Chart</h2>
              {isRealTime && (
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Live Data
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportChart('png')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="h-full flex items-center justify-center" style={{ minHeight: '400px' }}>
            {isLoading ? (
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={config.chartType + timeRange}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {renderChart()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Chart Stats */}
          {data.length > 0 && (
            <div className="mt-6 grid grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                <div className="text-sm text-gray-500">Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...data.map(item => item.value)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Maximum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.min(...data.map(item => item.value)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Minimum</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;