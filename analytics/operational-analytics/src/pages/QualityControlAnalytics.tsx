import React from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const QualityControlAnalytics: React.FC = () => {
  const mockQualityData = Array.from({ length: 60 }, (_, i) => ({
    id: `qc-${i + 1}`,
    recordId: `QC${String(i + 1).padStart(4, '0')}`,
    inspectionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    inspectorId: `EMP${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`,
    qualityScore: 85 + Math.random() * 15,
    defectsFound: Math.floor(Math.random() * 5),
    defectTypes: ['Minor', 'Major', 'Critical'][Math.floor(Math.random() * 3)],
    defectSeverity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    passed: Math.random() > 0.15,
  }));

  const totalInspections = mockQualityData.length;
  const passedInspections = mockQualityData.filter(qc => qc.passed).length;
  const failedInspections = totalInspections - passedInspections;
  const passRate = (passedInspections / totalInspections) * 100;
  const avgQualityScore = mockQualityData.reduce((sum, qc) => sum + qc.qualityScore, 0) / totalInspections;
  const totalDefects = mockQualityData.reduce((sum, qc) => sum + qc.defectsFound, 0);
  const avgDefectsPerInspection = totalDefects / totalInspections;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Control Analytics</h1>
          <p className="text-gray-400 mt-2">Defect tracking and quality improvement insights</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quality Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Inspections"
            value={totalInspections}
            change={5.2}
            changeType="increase"
            trend="up"
            icon={<Shield size={20} />}
            description="Quality checks performed"
          />
          <MetricCard
            title="Pass Rate"
            value={passRate.toFixed(1)}
            unit="%"
            change={2.8}
            changeType="increase"
            trend="up"
            icon={<CheckCircle size={20} />}
            description="Quality acceptance rate"
          />
          <MetricCard
            title="Avg Quality Score"
            value={avgQualityScore.toFixed(1)}
            change={1.5}
            changeType="increase"
            trend="up"
            icon={<Shield size={20} />}
            description="Average quality rating"
          />
          <MetricCard
            title="Total Defects"
            value={totalDefects}
            change={-12.3}
            changeType="decrease"
            trend="down"
            icon={<XCircle size={20} />}
            description="Defects found"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Quality Pass Rate Trend"
          data={{
            labels: Array.from({ length: 30 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - i));
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
              label: 'Pass Rate %',
              data: Array.from({ length: 30 }, () => 85 + Math.random() * 12),
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2,
              fill: true,
            }]
          }}
          type="line"
          height={300}
        />
        
        <Chart
          title="Defect Distribution"
          data={{
            labels: ['Minor', 'Major', 'Critical'],
            datasets: [{
              label: 'Defects',
              data: [
                mockQualityData.filter(qc => qc.defectTypes === 'Minor').length,
                mockQualityData.filter(qc => qc.defectTypes === 'Major').length,
                mockQualityData.filter(qc => qc.defectTypes === 'Critical').length,
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(249, 115, 22, 0.8)',
                'rgba(239, 68, 68, 0.8)',
              ],
            }]
          }}
          type="pie"
          height={300}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quality Control Records</h2>
        <DataTable
          data={mockQualityData}
          columns={[
            { key: 'recordId', label: 'Record ID', sortable: true },
            { key: 'inspectionDate', label: 'Inspection Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
            { key: 'inspectorId', label: 'Inspector', sortable: true },
            { key: 'qualityScore', label: 'Quality Score', sortable: true, align: 'right', render: (value) => `${value.toFixed(1)}%` },
            { key: 'defectsFound', label: 'Defects Found', sortable: true, align: 'right' },
            { key: 'defectTypes', label: 'Defect Type', sortable: true },
            { key: 'passed', label: 'Result', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value ? 'PASSED' : 'FAILED'}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default QualityControlAnalytics;