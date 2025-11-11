'use client';

/**
 * A/B Testing Management
 * Create and analyze campaign A/B tests
 */

import { useState } from 'react';
import { useCampaignAbTests, useCreateAbTest, useAbTestWithResults } from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, BarChart3, Eye, MousePointer } from 'lucide-react';

export default function AbTestsPage() {
  const { data: abTests, isLoading } = useCampaignAbTests();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">A/B Testing</h1>
          <p className="text-slate-600 mt-1">Optimize campaigns with split testing</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New A/B Test
        </Button>
      </div>

      <div className="grid gap-6">
        {abTests?.map((test) => (
          <Card key={test.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">{test.test_name}</h3>
                <Badge className={
                  test.test_status === 'running' ? 'bg-blue-100 text-blue-800' :
                  test.test_status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {test.test_status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Variant A</h4>
                <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg">
                  <div><p className="text-xs text-blue-600">Sends</p><p className="font-semibold">{test.variant_a_sends || 0}</p></div>
                  <div><p className="text-xs text-blue-600">Opens</p><p className="font-semibold">{test.variant_a_opens || 0}</p></div>
                  <div><p className="text-xs text-blue-600">Clicks</p><p className="font-semibold">{test.variant_a_clicks || 0}</p></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Variant B</h4>
                <div className="grid grid-cols-3 gap-3 p-3 bg-green-50 rounded-lg">
                  <div><p className="text-xs text-green-600">Sends</p><p className="font-semibold">{test.variant_b_sends || 0}</p></div>
                  <div><p className="text-xs text-green-600">Opens</p><p className="font-semibold">{test.variant_b_opens || 0}</p></div>
                  <div><p className="text-xs text-green-600">Clicks</p><p className="font-semibold">{test.variant_b_clicks || 0}</p></div>
                </div>
              </div>
            </div>
            
            {test.winner_variant && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium text-amber-800">Winner: Variant {test.winner_variant}</p>
                <p className="text-sm text-amber-700">Confidence: {test.statistical_significance}%</p>
              </div>
            )}
          </Card>
        ))}
        
        {(!abTests || abTests.length === 0) && (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No A/B tests found</h3>
            <p className="text-slate-600 mb-6">Create your first A/B test to optimize campaigns.</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />Create A/B Test
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}