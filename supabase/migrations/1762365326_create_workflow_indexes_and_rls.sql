-- Migration: create_workflow_indexes_and_rls
-- Created at: 1762365326

-- Create indexes for workflow tables
CREATE INDEX IF NOT EXISTS idx_order_workflows_org ON order_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_order_workflows_type ON order_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_order_workflows_active ON order_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_workflow_statuses_org ON order_workflow_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_order ON order_workflow_statuses(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_workflow ON order_workflow_statuses(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_current ON order_workflow_statuses(current_status);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_entered ON order_workflow_statuses(entered_at);

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_org ON workflow_transitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow ON workflow_transitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_from ON workflow_transitions(from_status);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_to ON workflow_transitions(to_status);

CREATE INDEX IF NOT EXISTS idx_workflow_analytics_org ON workflow_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_workflow ON workflow_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_status ON workflow_analytics(status);

CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_workflow_milestones_org ON workflow_milestones(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_milestones_order ON workflow_milestones(order_id);
CREATE INDEX IF NOT EXISTS idx_workflow_milestones_status ON workflow_milestones(status);
CREATE INDEX IF NOT EXISTS idx_workflow_milestones_due ON workflow_milestones(due_date);

-- Enable RLS on all workflow tables
ALTER TABLE order_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_workflow_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_workflows
CREATE POLICY "Users can view their organization workflows"
  ON order_workflows FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization workflows"
  ON order_workflows FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization workflows"
  ON order_workflows FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their organization workflows"
  ON order_workflows FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for order_workflow_statuses
CREATE POLICY "Users can view their organization workflow statuses"
  ON order_workflow_statuses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization workflow statuses"
  ON order_workflow_statuses FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization workflow statuses"
  ON order_workflow_statuses FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for workflow_transitions
CREATE POLICY "Users can view their organization workflow transitions"
  ON workflow_transitions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization workflow transitions"
  ON workflow_transitions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization workflow transitions"
  ON workflow_transitions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for workflow_analytics
CREATE POLICY "Users can view their organization workflow analytics"
  ON workflow_analytics FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization workflow analytics"
  ON workflow_analytics FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization workflow analytics"
  ON workflow_analytics FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for automation_rules
CREATE POLICY "Users can view their organization automation rules"
  ON automation_rules FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization automation rules"
  ON automation_rules FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization automation rules"
  ON automation_rules FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their organization automation rules"
  ON automation_rules FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for workflow_milestones
CREATE POLICY "Users can view their organization workflow milestones"
  ON workflow_milestones FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization workflow milestones"
  ON workflow_milestones FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization workflow milestones"
  ON workflow_milestones FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their organization workflow milestones"
  ON workflow_milestones FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));;