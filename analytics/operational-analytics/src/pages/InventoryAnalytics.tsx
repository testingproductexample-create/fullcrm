import React from 'react';
import { Warehouse, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const InventoryAnalytics: React.FC = () => {
  const mockInventory = Array.from({ length: 40 }, (_, i) => ({
    id: `inv-${i + 1}`,
    itemId: `ITM${String(i + 1).padStart(3, '0')}`,
    itemName: `Inventory Item ${i + 1}`,
    category: ['Electronics', 'Clothing', 'Food', 'Books', 'Tools'][Math.floor(Math.random() * 5)],
    currentStock: Math.floor(Math.random() * 500) + 10,
    minimumStock: Math.floor(Math.random() * 50) + 10,
    maximumStock: Math.floor(Math.random() * 1000) + 500,
    unitCost: Math.random() * 100 + 5,
    supplier: `Supplier ${Math.floor(Math.random() * 10) + 1}`,
    reorderPoint: Math.floor(Math.random() * 100) + 20,
    reorderQuantity: Math.floor(Math.random() * 200) + 50,
  }));

  const totalItems = mockInventory.length;
  const lowStockItems = mockInventory.filter(item => item.currentStock <= item.reorderPoint).length;
  const outOfStockItems = mockInventory.filter(item => item.currentStock === 0).length;
  const totalInventoryValue = mockInventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const avgInventoryTurnover = 4.2 + Math.random() * 2.8;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Analytics</h1>
          <p className="text-gray-400 mt-2">Stock optimization and reorder alerts</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Inventory Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Items"
            value={totalItems}
            change={3.5}
            changeType="increase"
            trend="up"
            icon={<Package size={20} />}
            description="Inventory items"
          />
          <MetricCard
            title="Low Stock Alerts"
            value={lowStockItems}
            change={-8.2}
            changeType="decrease"
            trend="down"
            icon={<AlertTriangle size={20} />}
            description="Items below reorder point"
          />
          <MetricCard
            title="Out of Stock"
            value={outOfStockItems}
            change={-15.0}
            changeType="decrease"
            trend="down"
            icon={<AlertTriangle size={20} />}
            description="Items with zero stock"
          />
          <MetricCard
            title="Total Value"
            value={Math.round(totalInventoryValue)}
            unit="$"
            change={7.8}
            changeType="increase"
            trend="up"
            icon={<Warehouse size={20} />}
            description="Inventory worth"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Inventory by Category"
          data={{
            labels: ['Electronics', 'Clothing', 'Food', 'Books', 'Tools'],
            datasets: [{
              label: 'Items',
              data: mockInventory.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(249, 115, 22, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(20, 184, 166, 0.8)',
              ],
            }]
          }}
          type="pie"
          height={300}
        />
        
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Stock Level Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Optimal Stock</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div className="w-16 bg-green-500 h-2 rounded-full" />
                </div>
                <span className="text-green-400 text-sm font-medium">64%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Low Stock</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div className="w-6 bg-yellow-500 h-2 rounded-full" />
                </div>
                <span className="text-yellow-400 text-sm font-medium">24%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Out of Stock</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div className="w-2 bg-red-500 h-2 rounded-full" />
                </div>
                <span className="text-red-400 text-sm font-medium">8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overstock</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div className="w-2 bg-blue-500 h-2 rounded-full" />
                </div>
                <span className="text-blue-400 text-sm font-medium">4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Inventory Details</h2>
        <DataTable
          data={mockInventory}
          columns={[
            { key: 'itemName', label: 'Item Name', sortable: true },
            { key: 'category', label: 'Category', sortable: true },
            { key: 'currentStock', label: 'Current Stock', sortable: true, align: 'right' },
            { key: 'minimumStock', label: 'Min Stock', sortable: true, align: 'right' },
            { key: 'maximumStock', label: 'Max Stock', sortable: true, align: 'right' },
            { key: 'unitCost', label: 'Unit Cost', sortable: true, align: 'right', render: (value) => `$${value.toFixed(2)}` },
            { key: 'supplier', label: 'Supplier', sortable: true },
            { key: 'reorderPoint', label: 'Reorder Point', sortable: true, align: 'right' },
            { key: 'currentStock', label: 'Stock Status', sortable: true, render: (value, row) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 0 ? 'bg-red-100 text-red-800' :
                value <= row.reorderPoint ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {value === 0 ? 'OUT OF STOCK' : value <= row.reorderPoint ? 'LOW STOCK' : 'OPTIMAL'}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default InventoryAnalytics;