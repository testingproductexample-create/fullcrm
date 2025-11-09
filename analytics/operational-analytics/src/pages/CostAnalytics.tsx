import React from 'react';
import { DollarSign, TrendingUp, Calculator, PieChart } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const CostAnalytics: React.FC = () => {
  const { orders } = useDataStore();
  const mockCostData = Array.from({ length: 30 }, (_, i) => ({
    orderId: `ORD${String(i + 1).padStart(5, '0')}`,
    orderType: ['Product', 'Service', 'Subscription'][Math.floor(Math.random() * 3)],
    revenue: Math.floor(Math.random() * 2000) + 100,
    cost: Math.floor(Math.random() * 1200) + 50,
    profit: 0,
    profitMargin: 0,
    department: ['Sales', 'Support', 'Operations'][Math.floor(Math.random() * 3)],
  })).map(order => ({ ...order, profit: order.revenue - order.cost, profitMargin: (order.profit / order.revenue) * 100 }));

  const totalRevenue = mockCostData.reduce((sum, order) => sum + order.revenue, 0);
  const totalCost = mockCostData.reduce((sum, order) => sum + order.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgProfitMargin = (totalProfit / totalRevenue) * 100;
  const costPerOrder = totalCost / mockCostData.length;
  const revenuePerOrder = totalRevenue / mockCostData.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cost Analysis</h1>
          <p className="text-gray-400 mt-2">Cost per order and profitability insights</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={Math.round(totalRevenue)}
            unit="$"
            change={8.5}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Total revenue generated"
          />
          <MetricCard
            title="Total Cost"
            value={Math.round(totalCost)}
            unit="$"
            change={-3.2}
            changeType="decrease"
            trend="down"
            icon={<Calculator size={20} />}
            description="Total operational costs"
          />
          <MetricCard
            title="Total Profit"
            value={Math.round(totalProfit)}
            unit="$"
            change={12.7}
            changeType="increase"
            trend="up"
            icon={<DollarSign size={20} />}
            description="Net profit"
          />
          <MetricCard
            title="Profit Margin"
            value={avgProfitMargin.toFixed(1)}
            unit="%"
            change={5.3}
            changeType="increase"
            trend="up"
            icon={<PieChart size={20} />}
            description="Average profit margin"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Revenue vs Cost by Department"
          data={{
            labels: ['Sales', 'Support', 'Operations'],
            datasets: [
              {
                label: 'Revenue',
                data: mockCostData.reduce((acc, order) => {
                  acc[order.department] = (acc[order.department] || 0) + order.revenue;
                  return acc;
                }, {} as Record<string, number>),
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
              },
              {
                label: 'Cost',
                data: mockCostData.reduce((acc, order) => {
                  acc[order.department] = (acc[order.department] || 0) + order.cost;
                  return acc;
                }, {} as Record<string, number>),
                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1,
              }
            ]
          }}
          type="bar"
          height={300}
        />
        
        <Chart
          title="Profit Margin Distribution"
          data={{
            labels: mockCostData.map(order => order.orderType),
            datasets: [{
              label: 'Profit Margin %',
              data: mockCostData.map(order => order.profitMargin),
              backgroundColor: 'rgba(168, 85, 247, 0.6)',
              borderColor: 'rgba(168, 85, 247, 1)',
              borderWidth: 1,
            }]
          }}
          type="bar"
          height={300}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Order Profitability Details</h2>
        <DataTable
          data={mockCostData}
          columns={[
            { key: 'orderId', label: 'Order ID', sortable: true },
            { key: 'orderType', label: 'Type', sortable: true },
            { key: 'department', label: 'Department', sortable: true },
            { key: 'revenue', label: 'Revenue', sortable: true, align: 'right', render: (value) => `$${value.toLocaleString()}` },
            { key: 'cost', label: 'Cost', sortable: true, align: 'right', render: (value) => `$${value.toLocaleString()}` },
            { key: 'profit', label: 'Profit', sortable: true, align: 'right', render: (value) => `$${value.toLocaleString()}` },
            { key: 'profitMargin', label: 'Margin %', sortable: true, align: 'right', render: (value) => `${value.toFixed(1)}%` },
            { key: 'profitMargin', label: 'Profitability', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value >= 20 ? 'bg-green-100 text-green-800' :
                value >= 10 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {value >= 20 ? 'HIGH' : value >= 10 ? 'MEDIUM' : 'LOW'}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default CostAnalytics;