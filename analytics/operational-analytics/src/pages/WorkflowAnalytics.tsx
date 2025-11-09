import React from 'react';
import { GitBranch, Clock, Zap, BarChart3 } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const WorkflowAnalytics: React.FC = () => {
  const { orders, employees } = useDataStore();
  const { selectedTimeRange } = useAnalyticsStore();

  const workflowSteps = [
    { id: 1, name: 'Order Processing', avgTime: 45, target: 30, efficiency: 67, automation: false },
    { id: 2, name: 'Quality Check', avgTime: 20, target: 15, efficiency: 75, automation: false },
    { id: 3, name: 'Approval', avgTime: 30, target: 20, efficiency: 67, automation: true },
    { id: 4, name: 'Shipping', avgTime: 35, target: 25, efficiency: 71, automation: true },
    { id: 5, name: 'Final Review', avgTime: 15, target: 10, efficiency: 67, automation: false },
  ];

  const bottlenecks = workflowSteps.filter(step => step.efficiency < 75);
  const automatedSteps = workflowSteps.filter(step => step.automation).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflow Analytics</h1>
          <p className="text-gray-400 mt-2">Process optimization and automation opportunities</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Workflow Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Workflow Steps"
            value={workflowSteps.length}
            icon={<GitBranch size={20} />}
            description="Total process steps"
          />
          <MetricCard
            title="Avg Processing Time"
            value={29}
            unit="min"
            change={-12}
            changeType="decrease"
            trend="down"
            icon={<Clock size={20} />}
            description="Average step time"
          />
          <MetricCard
            title="Automation Rate"
            value={(automatedSteps / workflowSteps.length) * 100}
            unit="%"
            change={15}
            changeType="increase"
            trend="up"
            icon={<Zap size={20} />}
            description="Steps automated"
          />
          <MetricCard
            title="Bottlenecks"
            value={bottlenecks.length}
            change={-25}
            changeType="decrease"
            trend="down"
            icon={<BarChart3 size={20} />}
            description="Identified bottlenecks"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Efficiency</h3>
          <div className="space-y-4">
            {workflowSteps.map((step) => (
              <div key={step.id} className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{step.name}</h4>
                  <div className="flex items-center space-x-2">
                    {step.automation && <Zap size={16} className="text-yellow-400" />}
                    <span className="text-white">{step.avgTime}min</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${step.efficiency >= 80 ? 'bg-green-500' : 
                      step.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${step.efficiency}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Target: {step.target}min | Efficiency: {step.efficiency}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <Chart
          title="Process Time Distribution"
          data={{
            labels: workflowSteps.map(s => s.name),
            datasets: [{
              label: 'Average Time (minutes)',
              data: workflowSteps.map(s => s.avgTime),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            }]
          }}
          type="bar"
          height={300}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Automation Recommendations</h2>
        <DataTable
          data={workflowSteps}
          columns={[
            { key: 'name', label: 'Process Step', sortable: true },
            { key: 'avgTime', label: 'Avg Time (min)', sortable: true, align: 'right' },
            { key: 'efficiency', label: 'Efficiency %', sortable: true, align: 'right' },
            { key: 'automation', label: 'Automated', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value ? 'Yes' : 'No'}
              </span>
            )},
            { key: 'efficiency', label: 'Automation Priority', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value < 70 ? 'bg-red-100 text-red-800' : 
                value < 80 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {value < 70 ? 'High' : value < 80 ? 'Medium' : 'Low'}
              </span>
            )},
          ]}
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default WorkflowAnalytics;