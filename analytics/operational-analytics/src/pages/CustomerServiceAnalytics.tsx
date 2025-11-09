import React from 'react';
import { Headphones, Clock, Star, MessageCircle } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const CustomerServiceAnalytics: React.FC = () => {
  const mockTickets = Array.from({ length: 75 }, (_, i) => ({
    id: `ticket-${i + 1}`,
    ticketId: `TKT${String(i + 1).padStart(4, '0')}`,
    customerEmail: `customer${i + 1}@email.com`,
    issueType: ['Technical', 'Billing', 'Product', 'General'][Math.floor(Math.random() * 4)],
    priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    status: ['open', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 4)],
    firstResponseTime: Math.floor(Math.random() * 240) + 15,
    resolutionTime: Math.floor(Math.random() * 1440) + 60,
    satisfactionRating: Math.floor(Math.random() * 5) + 1,
  }));

  const totalTickets = mockTickets.length;
  const resolvedTickets = mockTickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed').length;
  const openTickets = mockTickets.filter(ticket => ticket.status === 'open').length;
  const avgResponseTime = mockTickets.reduce((sum, ticket) => sum + ticket.firstResponseTime, 0) / totalTickets;
  const avgResolutionTime = mockTickets.reduce((sum, ticket) => sum + ticket.resolutionTime, 0) / totalTickets;
  const avgSatisfaction = mockTickets.reduce((sum, ticket) => sum + ticket.satisfactionRating, 0) / totalTickets;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Customer Service Analytics</h1>
          <p className="text-gray-400 mt-2">Support ticket metrics and response time analysis</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Service Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Tickets"
            value={totalTickets}
            change={12.3}
            changeType="increase"
            trend="up"
            icon={<Headphones size={20} />}
            description="Support requests"
          />
          <MetricCard
            title="Avg Response Time"
            value={Math.round(avgResponseTime)}
            unit="min"
            change={-8.5}
            changeType="decrease"
            trend="down"
            icon={<Clock size={20} />}
            description="First response time"
          />
          <MetricCard
            title="Avg Resolution Time"
            value={Math.round(avgResolutionTime / 60)}
            unit="hr"
            change={-15.2}
            changeType="decrease"
            trend="down"
            icon={<MessageCircle size={20} />}
            description="Time to resolve"
          />
          <MetricCard
            title="Customer Satisfaction"
            value={avgSatisfaction.toFixed(1)}
            unit="/5"
            change={3.7}
            changeType="increase"
            trend="up"
            icon={<Star size={20} />}
            description="Average rating"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Ticket Status Distribution"
          data={{
            labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
            datasets: [{
              label: 'Tickets',
              data: [
                mockTickets.filter(t => t.status === 'open').length,
                mockTickets.filter(t => t.status === 'in_progress').length,
                mockTickets.filter(t => t.status === 'resolved').length,
                mockTickets.filter(t => t.status === 'closed').length,
              ],
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(107, 114, 128, 0.8)',
              ],
            }]
          }}
          type="pie"
          height={300}
        />
        
        <Chart
          title="Issue Type Distribution"
          data={{
            labels: ['Technical', 'Billing', 'Product', 'General'],
            datasets: [{
              label: 'Tickets',
              data: [
                mockTickets.filter(t => t.issueType === 'Technical').length,
                mockTickets.filter(t => t.issueType === 'Billing').length,
                mockTickets.filter(t => t.issueType === 'Product').length,
                mockTickets.filter(t => t.issueType === 'General').length,
              ],
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
        <h2 className="text-xl font-semibold text-white mb-4">Support Ticket Details</h2>
        <DataTable
          data={mockTickets}
          columns={[
            { key: 'ticketId', label: 'Ticket ID', sortable: true },
            { key: 'customerEmail', label: 'Customer', sortable: true },
            { key: 'issueType', label: 'Issue Type', sortable: true },
            { key: 'priority', label: 'Priority', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'critical' ? 'bg-red-100 text-red-800' :
                value === 'high' ? 'bg-orange-100 text-orange-800' :
                value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {value.toUpperCase()}
              </span>
            )},
            { key: 'status', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'resolved' || value === 'closed' ? 'bg-green-100 text-green-800' :
                value === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {value.replace('_', ' ').toUpperCase()}
              </span>
            )},
            { key: 'firstResponseTime', label: 'Response Time', sortable: true, render: (value) => `${value} min` },
            { key: 'resolutionTime', label: 'Resolution Time', sortable: true, render: (value) => `${Math.round(value / 60)}h ${value % 60}m` },
            { key: 'satisfactionRating', label: 'Rating', sortable: true, render: (value) => `${value}/5 ⭐` },
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default CustomerServiceAnalytics;