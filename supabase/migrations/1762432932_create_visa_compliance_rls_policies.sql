-- Migration: create_visa_compliance_rls_policies
-- Created at: 1762432932

-- Row Level Security Policies for Visa & Compliance Management System

-- Enable RLS on all tables
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_portal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_renewal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wps_compliance ENABLE ROW LEVEL SECURITY;

-- COMPLIANCE_VIOLATIONS POLICIES
CREATE POLICY "Users can view compliance violations in their organization" ON compliance_violations FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create compliance violations in their organization" ON compliance_violations FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update compliance violations in their organization" ON compliance_violations FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete compliance violations in their organization" ON compliance_violations FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- GOVERNMENT_PORTAL_TRACKING POLICIES
CREATE POLICY "Users can view government portal tracking in their organization" ON government_portal_tracking FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create government portal tracking in their organization" ON government_portal_tracking FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update government portal tracking in their organization" ON government_portal_tracking FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete government portal tracking in their organization" ON government_portal_tracking FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- REGULATORY_UPDATES POLICIES
CREATE POLICY "Users can view regulatory updates in their organization" ON regulatory_updates FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create regulatory updates in their organization" ON regulatory_updates FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update regulatory updates in their organization" ON regulatory_updates FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete regulatory updates in their organization" ON regulatory_updates FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- VISA_RENEWAL_ALERTS POLICIES
CREATE POLICY "Users can view visa renewal alerts in their organization" ON visa_renewal_alerts FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create visa renewal alerts in their organization" ON visa_renewal_alerts FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update visa renewal alerts in their organization" ON visa_renewal_alerts FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete visa renewal alerts in their organization" ON visa_renewal_alerts FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- GOVERNMENT_CORRESPONDENCE POLICIES
CREATE POLICY "Users can view government correspondence in their organization" ON government_correspondence FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create government correspondence in their organization" ON government_correspondence FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update government correspondence in their organization" ON government_correspondence FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete government correspondence in their organization" ON government_correspondence FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- VISA_COMPLIANCE_AUDIT_LOGS POLICIES
CREATE POLICY "Users can view visa compliance audit logs in their organization" ON visa_compliance_audit_logs FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create visa compliance audit logs in their organization" ON visa_compliance_audit_logs FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- WPS_COMPLIANCE POLICIES
CREATE POLICY "Users can view WPS compliance in their organization" ON wps_compliance FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create WPS compliance in their organization" ON wps_compliance FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update WPS compliance in their organization" ON wps_compliance FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete WPS compliance in their organization" ON wps_compliance FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));;