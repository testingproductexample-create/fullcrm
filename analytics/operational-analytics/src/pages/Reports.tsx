import React from 'react';
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react';
import { useDataStore } from '../store';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';

const Reports: React.FC = () => {
  const { systemAlerts } = useDataStore();

  const reportTypes = [
    {
      id: 'dashboard-summary',
      name: 'Dashboard Summary Report',
      description: 'Comprehensive overview of key performance indicators',
      type: 'PDF',
      lastGenerated: '2024-01-15 10:30:00',
      size: '2.3 MB'
    },
    {
      id: 'employee-performance',
      name: 'Employee Performance Report',
      description: 'Detailed analysis of employee productivity and metrics',
      type: 'PDF',
      lastGenerated: '2024-01-15 09:15:00',
      size: '1.8 MB'
    },
    {
      id: 'order-analysis',
      name: 'Order Analysis Report',
      description: 'Order processing, completion times, and bottleneck analysis',
      type: 'Excel',
      lastGenerated: '2024-01-15 11:45:00',
      size: '3.1 MB'
    },
    {
      id: 'resource-utilization',
      name: 'Resource Utilization Report',
      description: 'Equipment, staff, materials, and facility efficiency',
      type: 'PDF',
      lastGenerated: '2024-01-14 16:20:00',
      size: '2.7 MB'
    },
    {
      id: 'customer-service',
      name: 'Customer Service Report',
      description: 'Support ticket metrics and response time analysis',
      type: 'PDF',
      lastGenerated: '2024-01-14 14:30:00',
      size: '1.9 MB'
    },
    {
      id: 'financial-analysis',
      name: 'Financial Analysis Report',
      description: 'Cost per order and profitability insights',
      type: 'Excel',
      lastGenerated: '2024-01-14 12:00:00',
      size: '4.2 MB'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400 mt-2">Automated efficiency reports and analytics export</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="glass-button px-6 py-2 rounded-lg text-white hover:bg-blue-600">
            Generate New Report
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Report Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Reports"
            value={reportTypes.length}
            change={8.3}
            changeType="increase"
            trend="up"
            icon={<FileText size={20} />}
            description="Available report types"
          />
          <MetricCard
            title="PDF Reports"
            value={reportTypes.filter(r => r.type === 'PDF').length}
            icon={<FileText size={20} />}
            description="PDF format reports"
          />
          <MetricCard
            title="Excel Reports"
            value={reportTypes.filter(r => r.type === 'Excel').length}
            icon={<BarChart3 size={20} />}
            description="Excel format reports"
          />
          <MetricCard
            title="Recent Reports"
            value={reportTypes.filter(r => {
              const lastGen = new Date(r.lastGenerated);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              return lastGen > yesterday;
            }).length}
            change={15.7}
            changeType="increase"
            trend="up"
            icon={<Calendar size={20} />}
            description="Generated today"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Available Reports</h2>
        <DataTable
          data={reportTypes}
          columns={[
            { key: 'name', label: 'Report Name', sortable: true },
            { key: 'description', label: 'Description', sortable: false },
            { key: 'type', label: 'Format', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {value}
              </span>
            )},
            { key: 'lastGenerated', label: 'Last Generated', sortable: true, render: (value) => new Date(value).toLocaleString() },
            { key: 'size', label: 'File Size', sortable: true },
            { key: 'name', label: 'Actions', render: () => (
              <div className="flex items-center space-x-2">
                <button className="glass-button px-3 py-1 rounded text-sm text-blue-400 hover:text-blue-300">
                  <Download size={14} className="mr-1 inline" />
                  Download
                </button>
                <button className="glass-button px-3 py-1 rounded text-sm text-green-400 hover:text-green-300">
                  Generate
                </button>
              </div>
            )},
          ]}
          pageSize={10}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Report Scheduling</h3>
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <h4 className="text-white font-medium mb-2">Daily Reports</h4>
              <p className="text-gray-400 text-sm mb-3">Automated daily summaries</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status</span>
                <span className="text-green-400 text-sm">Active</span>
              </div>
            </div>
            <div className="border-b border-white/10 pb-4">
              <h4 className="text-white font-medium mb-2">Weekly Reports</h4>
              <p className="text-gray-400 text-sm mb-3">Comprehensive weekly analysis</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status</span>
                <span className="text-green-400 text-sm">Active</span>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Monthly Reports</h4>
              <p className="text-gray-400 text-sm mb-3">Detailed monthly overview</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status</span>
                <span className="text-yellow-400 text-sm">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Report Templates</h3>
          <div className="space-y-3">
            {['Executive Summary', 'Operational Dashboard', 'Performance Analytics', 'Financial Overview'].map((template) => (
              <div key={template} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-white">{template}</span>
                <button className="text-blue-400 text-sm hover:text-blue-300">Customize</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;