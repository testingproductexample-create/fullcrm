'use client';

import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        padding: 16,
        usePointStyle: true,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 13
      },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }
  }
};

// Revenue Chart Component
export function RevenueChart({ data, isLoading, showTarget = true }: { data: any[]; isLoading?: boolean; showTarget?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.month || d.label),
    datasets: [
      {
        label: 'Actual Revenue',
        data: data.map(d => d.revenue || d.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      ...(showTarget ? [{
        label: 'Target',
        data: data.map(d => d.target),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      }] : [])
    ]
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value: any) => `AED ${(value / 1000).toFixed(0)}K`
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}

// Profit Margin Chart Component
export function ProfitMarginChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.month || d.label),
    datasets: [
      {
        label: 'Actual Margin',
        data: data.map(d => d.actual),
        backgroundColor: '#3B82F6',
        borderRadius: 8
      },
      {
        label: 'Target Margin',
        data: data.map(d => d.target),
        backgroundColor: '#10B981',
        borderRadius: 8
      }
    ]
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value: any) => `${value}%`
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Payment Status Chart Component
export function PaymentStatusChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: [
          '#10B981', // Paid - Green
          '#F59E0B', // Pending - Yellow
          '#EF4444'  // Overdue - Red
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: AED ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}

// Order Pipeline Chart Component
export function OrderPipelineChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.stage),
    datasets: [
      {
        label: 'Orders',
        data: data.map(d => d.count),
        backgroundColor: [
          '#3B82F6',
          '#8B5CF6',
          '#EC4899',
          '#F59E0B',
          '#10B981'
        ],
        borderRadius: 8
      }
    ]
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Service Completion Chart Component
export function ServiceCompletionChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.service),
    datasets: [
      {
        label: 'Avg. Completion Time (Days)',
        data: data.map(d => d.days),
        backgroundColor: '#8B5CF6',
        borderRadius: 8
      }
    ]
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value: any) => `${value}d`
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Employee Utilization Chart Component
export function EmployeeUtilizationChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.department),
    datasets: [
      {
        data: data.map(d => d.utilization),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

// Customer Segmentation Chart Component
export function CustomerSegmentationChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.segment),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#8B5CF6'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} customers (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}

// Customer Lifetime Value Chart Component
export function CustomerLifetimeValueChart({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <LoadingChart />;
  }

  const chartData = {
    labels: data.map(d => d.month || d.label),
    datasets: [
      {
        label: 'New Customers',
        data: data.map(d => d.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}

// Loading Chart Skeleton
function LoadingChart() {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-pulse space-y-3 w-full">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="flex justify-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}
