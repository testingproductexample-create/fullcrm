import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  RefreshCw, 
  Settings, 
  Download, 
  Maximize2, 
  Filter,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Widget } from '../../types';
import { useWidgetData } from '../../hooks';
import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage,
  getChartColors,
  generateGradient,
  cn
} from '../../utils/helpers';
import { CHART_COLORS, GLASSMORPHISM } from '../../data/constants';

interface ChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  widget,
  isEditMode = false,
  filters = {},
  className
}) => {
  const { data, loading, error, refetch } = useWidgetData(widget);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isLegendVisible, setIsLegendVisible] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Default chart data if none provided
  const chartData = useMemo(() => {
    if (data && data.labels && data.datasets) {
      return data.labels.map((label: string, index: number) => {
        const dataPoint: any = { name: label };
        data.datasets.forEach((dataset: any, datasetIndex: number) => {
          dataPoint[dataset.label || `Series ${datasetIndex + 1}`] = dataset.data[index];
        });
        return dataPoint;
      });
    }

    // Generate mock data based on chart type
    return generateMockChartData(widget.visualization);
  }, [data, widget.visualization]);

  const getChartComponent = () => {
    const colors = getChartColors(chartData.length, 'rainbow');
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (widget.visualization) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(0,0,0,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(0,0,0,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {isLegendVisible && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(0,0,0,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(0,0,0,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {isLegendVisible && <Legend />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fill={generateGradient(colors[0], 1)[0]}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(0,0,0,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(0,0,0,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {isLegendVisible && <Legend />}
            <Bar
              dataKey="value"
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={widget.visualization === 'doughnut' ? 40 : 0}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  stroke={hoveredIndex === index ? '#fff' : 'none'}
                  strokeWidth={hoveredIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {isLegendVisible && <Legend />}
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar
              name="Score"
              dataKey="value"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {isLegendVisible && <Legend />}
          </RadarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {isLegendVisible && <Legend />}
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} />
          </LineChart>
        );
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // Export chart as image
    const canvas = document.querySelector(`[data-widget-id="${widget.id}"] canvas`);
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${widget.title}-chart.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const getDataInsights = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const values = chartData.map((d: any) => d.value).filter((v: any) => typeof v === 'number');
    if (values.length === 0) return null;
    
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const latest = values[values.length - 1];
    const previous = values[values.length - 2] || latest;
    const change = ((latest - previous) / previous) * 100;
    
    return {
      total: sum,
      average: avg,
      max,
      min,
      latest,
      change: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const insights = getDataInsights();

  if (showFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-white/10 backdrop-blur-md"
      >
        <div className="h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{widget.title}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFullscreen(false)}
                className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-4rem)] bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <ResponsiveContainer width="100%" height="100%">
              {getChartComponent()}
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg",
        "hover:shadow-xl transition-all duration-300",
        className
      )}
      data-widget-id={widget.id}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {widget.title}
          </h3>
          {widget.description && (
            <p className="text-sm text-gray-600">{widget.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLegendVisible(!isLegendVisible)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Toggle Legend"
          >
            {isLegendVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          {isEditMode && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleExport}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Export Chart"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowFullscreen(true)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80 mb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-xs text-red-700 hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {getChartComponent()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Data Insights */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {formatNumber(insights.latest)}
            </div>
            <div className="text-xs text-gray-500">Latest</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {formatNumber(insights.average)}
            </div>
            <div className="text-xs text-gray-500">Average</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {formatNumber(insights.max)}
            </div>
            <div className="text-xs text-gray-500">Max</div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-lg font-bold flex items-center justify-center space-x-1",
              insights.trend === 'up' ? 'text-green-600' : 
              insights.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              <TrendingUp className={cn(
                "w-4 h-4",
                insights.trend === 'down' && "transform rotate-180"
              )} />
              <span>{Math.abs(insights.change).toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-500">Change</div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-white/20 space-y-3"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">Chart Type</label>
              <select
                value={widget.visualization}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white/50"
                onChange={(e) => {/* Update chart type */}}
              >
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
                <option value="radar">Radar</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Color Scheme</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg bg-white/50"
                onChange={(e) => {/* Update color scheme */}}
              >
                <option value="rainbow">Rainbow</option>
                <option value="primary">Primary</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Helper function to generate mock chart data
function generateMockChartData(chartType: string) {
  const generateData = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      name: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      subject: `Subject ${i + 1}`,
      fullMark: 100
    }));
  };

  switch (chartType) {
    case 'pie':
    case 'doughnut':
      return Array.from({ length: 6 }, (_, i) => ({
        name: `Category ${i + 1}`,
        value: Math.floor(Math.random() * 500) + 100
      }));
    
    case 'radar':
      return Array.from({ length: 8 }, (_, i) => ({
        subject: `Metric ${i + 1}`,
        value: Math.floor(Math.random() * 100) + 1,
        fullMark: 100
      }));
    
    case 'area':
      return generateData(12).map((item, i) => ({
        ...item,
        name: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' })
      }));
    
    case 'line':
    case 'bar':
      return Array.from({ length: 30 }, (_, i) => ({
        name: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: Math.floor(Math.random() * 1000) + 500
      }));
    
    default:
      return generateData(10);
  }
}