import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartData } from '../types';

interface ChartProps {
  data: ChartData;
  title?: string;
  type?: 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
  onDataPointClick?: (data: any) => void;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

const Chart: React.FC<ChartProps> = ({
  data,
  title,
  type = 'line',
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
  onDataPointClick,
}) => {
  const renderChart = () => {
    const commonProps = {
      data: data.labels.length > 1 ? data.labels.map((label, index) => ({
        name: label,
        ...data.datasets.reduce((acc, dataset, datasetIndex) => {
          acc[`value${datasetIndex}`] = dataset.data[index];
          return acc;
        }, {} as any)
      })) : [],
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="glass-dark-card p-3 rounded-lg border border-white/10">
            <p className="text-white font-medium">{`${label}: `}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {`${entry.dataKey.includes('value') ? '' : ''}${entry.name}: ${entry.value}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
            />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey="value0"
                stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                strokeWidth={dataset.borderWidth || 2}
                fill={dataset.backgroundColor || 'transparent'}
                onClick={() => onDataPointClick?.(dataset)}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
            />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Bar
                key={index}
                dataKey="value0"
                fill={dataset.backgroundColor || COLORS[index % COLORS.length]}
                stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                strokeWidth={dataset.borderWidth || 1}
                onClick={() => onDataPointClick?.(dataset)}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
            />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey="value0"
                stackId="1"
                stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                fill={dataset.backgroundColor || COLORS[index % COLORS.length]}
                fillOpacity={0.6}
                onClick={() => onDataPointClick?.(dataset)}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={data.labels.map((label, index) => ({
                name: label,
                value: data.datasets[0]?.data[index] || 0,
                fill: data.datasets[0]?.backgroundColor?.[index] || COLORS[index % COLORS.length]
              }))}
              cx="50%"
              cy="50%"
              innerRadius={type === 'doughnut' ? 60 : 0}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              onClick={() => onDataPointClick?.(data)}
            >
              {data.labels.map((label, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={data.datasets[0]?.backgroundColor?.[index] || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`glass-card rounded-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px`, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;