'use client';

/**
 * Email Automation Workflows Management
 * Create and manage automated email sequences
 */

import { useState } from 'react';
import { useAutomationWorkflows, useCreateAutomationWorkflow, useWorkflowWithSteps } from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Workflow, Play, Pause, Edit, Users, Mail, Clock } from 'lucide-react';

export default function AutomationWorkflowsPage() {
  const { data: workflows, isLoading } = useAutomationWorkflows();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Email Automation</h1>
          <p className="text-slate-600 mt-1">Create and manage automated email workflows</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-6">
        {workflows?.map((workflow) => (
          <Card key={workflow.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Workflow className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">{workflow.workflow_name}</h3>
                <Badge className={workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline"><Play className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div><p className="text-xs text-slate-600">Subscribers</p><p className="font-semibold">{workflow.total_entries || 0}</p></div>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-green-600" />
                <div><p className="text-xs text-slate-600">Completion</p><p className="font-semibold">{(workflow.completion_rate || 0).toFixed(1)}%</p></div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <div><p className="text-xs text-slate-600">Trigger</p><p className="font-semibold capitalize">{workflow.trigger_type}</p></div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{workflow.workflow_code}</Badge>
              </div>
            </div>
          </Card>
        ))}
        
        {(!workflows || workflows.length === 0) && (
          <Card className="p-12 text-center">
            <Workflow className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
            <p className="text-slate-600 mb-6">Create your first automation workflow.</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />Create Workflow
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}