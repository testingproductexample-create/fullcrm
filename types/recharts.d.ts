// Recharts v2 Type Declarations
// Fixes "cannot be used as JSX component" errors

import React from 'react';

declare module 'recharts' {
  export const ResponsiveContainer: React.ComponentType<{
    width?: string | number;
    height?: string | number;
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const LineChart: React.ComponentType<{
    data?: any[];
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const AreaChart: React.ComponentType<{
    data?: any[];
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const BarChart: React.ComponentType<{
    data?: any[];
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const PieChart: React.ComponentType<{
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const RadarChart: React.ComponentType<{
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const ComposedChart: React.ComponentType<{
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const ScatterChart: React.ComponentType<{
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const Area: React.ComponentType<{
    type?: string;
    dataKey?: string;
    stackId?: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    strokeWidth?: number;
    [key: string]: any;
  }>;

  export const Bar: React.ComponentType<{
    dataKey?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    radius?: number | number[];
    stackId?: string;
    [key: string]: any;
  }>;

  export const Line: React.ComponentType<{
    type?: string;
    dataKey?: string;
    stroke?: string;
    strokeWidth?: number;
    dot?: any;
    activeDot?: any;
    [key: string]: any;
  }>;

  export const Pie: React.ComponentType<{
    data?: any[];
    cx?: string | number;
    cy?: string | number;
    innerRadius?: number;
    outerRadius?: number;
    fill?: string;
    dataKey?: string;
    nameKey?: string;
    labelLine?: boolean;
    label?: any;
    children?: React.ReactNode;
    onMouseEnter?: (data: any, index: number) => void;
    onMouseLeave?: () => void;
    [key: string]: any;
  }>;

  export const Cell: React.ComponentType<{
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    [key: string]: any;
  }>;

  export const XAxis: React.ComponentType<{
    dataKey?: string;
    type?: 'number' | 'category';
    domain?: any;
    tickLine?: boolean;
    axisLine?: boolean;
    tick?: any;
    stroke?: string;
    fontSize?: number;
    [key: string]: any;
  }>;

  export const YAxis: React.ComponentType<{
    type?: 'number' | 'category';
    domain?: any;
    yAxisId?: string;
    orientation?: 'left' | 'right';
    tickLine?: boolean;
    axisLine?: boolean;
    tick?: any;
    stroke?: string;
    fontSize?: number;
    [key: string]: any;
  }>;

  export const CartesianGrid: React.ComponentType<{
    strokeDasharray?: string;
    stroke?: string;
    [key: string]: any;
  }>;

  export const Tooltip: React.ComponentType<{
    active?: boolean;
    payload?: any[];
    label?: any;
    contentStyle?: React.CSSProperties;
    labelFormatter?: (value: any) => string;
    formatter?: (value: any, name: string) => [any, string];
    [key: string]: any;
  }>;

  export const Legend: React.ComponentType<{
    wrapperStyle?: React.CSSProperties;
    iconSize?: number;
    [key: string]: any;
  }>;

  export const Radar: React.ComponentType<{
    name?: string;
    dataKey?: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    strokeWidth?: number;
    [key: string]: any;
  }>;

  export const PolarGrid: React.ComponentType<{
    [key: string]: any;
  }>;

  export const PolarAngleAxis: React.ComponentType<{
    dataKey?: string;
    tick?: any;
    [key: string]: any;
  }>;

  export const PolarRadiusAxis: React.ComponentType<{
    tick?: any;
    [key: string]: any;
  }>;

  export const Brush: React.ComponentType<{
    dataKey?: string;
    height?: number;
    stroke?: string;
    [key: string]: any;
  }>;

  export const ReferenceLine: React.ComponentType<{
    x?: number | string;
    y?: number | string;
    stroke?: string;
    strokeDasharray?: string;
    [key: string]: any;
  }>;

  export const ReferenceDot: React.ComponentType<{
    x?: number | string;
    y?: number | string;
    r?: number;
    stroke?: string;
    fill?: string;
    [key: string]: any;
  }>;

  export const FunnelChart: React.ComponentType<{
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }>;

  export const Funnel: React.ComponentType<{
    dataKey?: string;
    isAnimationActive?: boolean;
    [key: string]: any;
  }>;

  export const Treemap: React.ComponentType<{
    data?: any[];
    dataKey?: string;
    ratio?: number;
    [key: string]: any;
  }>;

  export const Sankey: React.ComponentType<{
    data?: any[];
    dataKey?: string;
    nodePadding?: number;
    nodeWidth?: number;
    link?: any;
    node?: any;
    [key: string]: any;
  }>;
}