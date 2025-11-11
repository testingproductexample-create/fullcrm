'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QualityMetric {
  id: string;
  metric_type: string;
  score: number;
  date: string;
}

export function QualityMetrics() {
  const { data: qualityData, isLoading } = useQuery({
    queryKey: ['quality-metrics'],
    queryFn: async (): Promise<QualityMetric[]> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('quality_metrics')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as QualityMetric[];
    },
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  const { data: qualitySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['quality-summary'],
    queryFn: async () => {
      const [
        averageScore,
        passedInspections,
        totalInspections,
        activeDefects,
      ] = await Promise.all([
        supabase.from('quality_metrics').select('score'),
        supabase.from('quality_inspections').select('count', { count: 'exact' }).eq('result', 'passed'),
        supabase.from('quality_inspections').select('count', { count: 'exact' }),
        supabase.from('defects').select('count', { count: 'exact' }).eq('status', 'open'),
      ]);

      const avgScore = averageScore.data?.reduce((sum, item) => sum + (item.score || 0), 0) / (averageScore.data?.length || 1) || 0;
      const passRate = (passedInspections.count || 0) / Math.max(totalInspections.count || 1, 1) * 100;

      return {
        averageScore: Math.round(avgScore),
        passRate: Math.round(passRate),
        totalInspections: totalInspections.count || 0,
        activeDefects: activeDefects.count || 0,
      };
    },
    refetchInterval: 120000,
  });

  if (isLoading || summaryLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return CheckCircleIcon;
    if (score >= 70) return ExclamationCircleIcon;
    return XCircleIcon;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-600 font-medium">Average Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(qualitySummary?.averageScore || 0)}`}>
            {qualitySummary?.averageScore || 0}%
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-green-600 font-medium">Pass Rate</div>
          <div className="text-2xl font-bold text-green-600">
            {qualitySummary?.passRate || 0}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 font-medium">Inspections</div>
          <div className="text-2xl font-bold text-gray-900">
            {qualitySummary?.totalInspections || 0}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-sm text-red-600 font-medium">Active Defects</div>
          <div className="text-2xl font-bold text-red-600">
            {qualitySummary?.activeDefects || 0}
          </div>
        </div>
      </div>

      {/* Recent Quality Metrics */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Quality Metrics</h4>
        <div className="space-y-2">
          {qualityData?.map((metric) => {
            const IconComponent = getScoreIcon(metric.score);
            return (
              <div key={metric.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${getScoreColor(metric.score)}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {metric.metric_type?.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(metric.date).toLocaleDateString('en-AE')}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}%
                </div>
              </div>
            );
          })}
          
          {(!qualityData || qualityData.length === 0) && (
            <div className="text-center text-gray-500 py-4">
              No quality metrics available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}