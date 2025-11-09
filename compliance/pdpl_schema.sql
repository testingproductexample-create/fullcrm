-- UAE PDPL (Personal Data Protection Law) Compliance Schema
-- This schema implements comprehensive data protection and privacy compliance features

-- 1. Consent Management
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- 'marketing', 'analytics', 'processing', 'transfer', etc.
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_expiry TIMESTAMP WITH TIME ZONE,
    consent_version VARCHAR(20) NOT NULL, -- version of consent form/policy
    ip_address INET,
    user_agent TEXT,
    consent_method VARCHAR(50) DEFAULT 'web_form', -- 'web_form', 'email', 'phone', 'written'
    legal_basis VARCHAR(100) NOT NULL, -- 'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    processing_purposes TEXT[] NOT NULL, -- array of processing purposes
    data_categories TEXT[] NOT NULL, -- array of data categories being processed
    third_parties TEXT[], -- array of third parties data is shared with
    international_transfers BOOLEAN DEFAULT false,
    transfer_mechanisms TEXT[], -- 'adequacy_decision', 'standard_contractual_clauses', 'binding_corporate_rules', etc.
    withdrawal_date TIMESTAMP WITH TIME ZONE,
    withdrawal_method VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Data Subject Rights Requests
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection', 'automated_decision_making'
    request_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected', 'partially_completed'
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_data_categories TEXT[] NOT NULL,
    request_details TEXT, -- detailed description of what the user is requesting
    identity_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(50), -- 'email', 'phone', 'document', 'video_call'
    response_date TIMESTAMP WITH TIME ZONE,
    response_method VARCHAR(50) DEFAULT 'email',
    response_details TEXT,
    rejection_reason TEXT,
    processing_deadline DATE NOT NULL, -- 30 days from request date under PDPL
    escalated BOOLEAN DEFAULT false,
    escalation_date TIMESTAMP WITH TIME ZONE,
    assigned_officer UUID REFERENCES auth.users(id),
    legal_basis TEXT,
    data_location TEXT, -- where the data is stored
    third_parties_notified TEXT[], -- list of third parties notified about the request
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Privacy Policies
CREATE TABLE privacy_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(200) NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    policy_content TEXT NOT NULL, -- HTML or markdown content
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    change_summary TEXT, -- summary of changes from previous version
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    legal_review_date TIMESTAMP WITH TIME ZONE,
    next_review_date DATE,
    data_protection_impact_assessment BOOLEAN DEFAULT false,
    dpea_reference VARCHAR(100), -- reference to DPEA if conducted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Data Processing Activities
CREATE TABLE data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(200) NOT NULL,
    activity_description TEXT NOT NULL,
    controller_name VARCHAR(200) NOT NULL, -- organization responsible
    dpo_contact VARCHAR(200), -- Data Protection Officer contact
    legal_basis VARCHAR(100) NOT NULL,
    processing_purposes TEXT[] NOT NULL,
    data_categories TEXT[] NOT NULL,
    data_subjects TEXT[] NOT NULL, -- 'customers', 'employees', 'contractors', etc.
    recipients TEXT[], -- who receives the data
    international_transfers BOOLEAN DEFAULT false,
    transfer_countries TEXT[],
    transfer_mechanisms TEXT[],
    retention_period VARCHAR(100), -- how long data is kept
    security_measures TEXT[], -- technical and organizational measures
    automated_decision_making BOOLEAN DEFAULT false,
    profiling BOOLEAN DEFAULT false,
    special_category_data BOOLEAN DEFAULT false, -- sensitive personal data
    consent_required BOOLEAN DEFAULT true,
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    last_assessment_date DATE,
    next_assessment_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Data Protection Impact Assessments
CREATE TABLE dpea_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_name VARCHAR(200) NOT NULL,
    assessment_date DATE NOT NULL,
    assessment_officer UUID REFERENCES auth.users(id),
    processing_activity_id UUID REFERENCES data_processing_activities(id),
    risk_assessment JSONB NOT NULL, -- detailed risk assessment data
    likelihood_scores JSONB, -- likelihood of risks occurring
    impact_scores JSONB, -- impact scores for each risk
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    mitigation_measures TEXT[],
    residual_risks TEXT[],
    stakeholder_consultation TEXT,
    dpeo_consultation BOOLEAN DEFAULT false,
    supervisory_authority_consulted BOOLEAN DEFAULT false,
    consultation_outcome TEXT,
    approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'requires_modification'
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    implementation_deadline DATE,
    review_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Compliance Incidents
CREATE TABLE compliance_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(100) NOT NULL, -- 'data_breach', 'unauthorized_access', 'consent_violation', 'retention_violation', 'transfer_violation'
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discovery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    severity_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    affected_data_subjects INTEGER DEFAULT 0,
    data_categories_affected TEXT[],
    incident_description TEXT NOT NULL,
    root_cause TEXT,
    immediate_actions TEXT[],
    containment_measures TEXT[],
    investigation_findings TEXT,
    lessons_learned TEXT,
    supervisory_authority_notified BOOLEAN DEFAULT false,
    notification_date TIMESTAMP WITH TIME ZONE,
    data_subjects_notified BOOLEAN DEFAULT false,
    data_subjects_notification_date TIMESTAMP WITH TIME ZONE,
    notification_method VARCHAR(50),
    incident_status VARCHAR(20) DEFAULT 'investigating', -- 'investigating', 'contained', 'resolved', 'closed'
    resolution_date TIMESTAMP WITH TIME ZONE,
    corrective_actions TEXT[],
    preventive_measures TEXT[],
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    reported_by UUID REFERENCES auth.users(id),
    assigned_investigator UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Data Retention Policies
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(200) NOT NULL,
    data_category VARCHAR(100) NOT NULL,
    retention_period VARCHAR(100) NOT NULL, -- e.g., '7 years', '2 years after contract end'
    legal_basis TEXT NOT NULL, -- why this retention period is necessary
    automated_deletion BOOLEAN DEFAULT true,
    deletion_frequency VARCHAR(50) DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    last_execution_date DATE,
    next_execution_date DATE,
    exceptions TEXT[], -- any exceptions to the retention policy
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Third Party Data Processors
CREATE TABLE third_party_processors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processor_name VARCHAR(200) NOT NULL,
    processor_type VARCHAR(100) NOT NULL, -- 'cloud_provider', 'payment_processor', 'analytics_provider', 'marketing_platform'
    contact_person VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    processing_purposes TEXT[] NOT NULL,
    data_categories TEXT[] NOT NULL,
    data_locations TEXT[],
    data_subjects TEXT[],
    processing_agreement_signed BOOLEAN DEFAULT false,
    agreement_date DATE,
    agreement_expiry_date DATE,
    gdpr_adequacy_check BOOLEAN DEFAULT false,
    standard_contractual_clauses BOOLEAN DEFAULT false,
    binding_corporate_rules BOOLEAN DEFAULT false,
    other_transfer_mechanisms TEXT[],
    sub_processors TEXT[],
    security_assessments TEXT[], -- references to security assessment documents
    last_audit_date DATE,
    next_audit_date DATE,
    audit_results TEXT,
    compliance_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'compliant', 'non_compliant', 'under_review'
    risk_level VARCHAR(20) DEFAULT 'medium',
    data_breach_history TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Compliance Reports
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'ad_hoc', 'incident_based'
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_data JSONB NOT NULL, -- comprehensive report data
    key_metrics JSONB, -- key compliance metrics
    risk_summary TEXT,
    compliance_score DECIMAL(5,2), -- overall compliance score 0-100
    recommendations TEXT[],
    action_items TEXT[],
    report_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published'
    generated_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    published_date TIMESTAMP WITH TIME ZONE,
    distribution_list TEXT[], -- who receives this report
    next_report_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Audit Trail
CREATE TABLE privacy_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(100) NOT NULL, -- 'consent_given', 'consent_withdrawn', 'data_accessed', 'data_modified', 'data_deleted', 'data_exported'
    resource_type VARCHAR(100) NOT NULL, -- 'consent_record', 'user_data', 'data_subject_request', etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    legal_basis TEXT,
    processing_purpose TEXT,
    retention_basis TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_active ON consent_records(is_active) WHERE is_active = true;
CREATE INDEX idx_consent_records_expiry ON consent_records(consent_expiry) WHERE consent_expiry IS NOT NULL;

CREATE INDEX idx_data_subject_requests_user_id ON data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(request_status);
CREATE INDEX idx_data_subject_requests_deadline ON data_subject_requests(processing_deadline);

CREATE INDEX idx_privacy_policies_active ON privacy_policies(is_active) WHERE is_active = true;
CREATE INDEX idx_privacy_policies_version ON privacy_policies(policy_version);

CREATE INDEX idx_data_processing_activities_active ON data_processing_activities(is_active) WHERE is_active = true;
CREATE INDEX idx_data_processing_activities_risk ON data_processing_activities(risk_level);

CREATE INDEX idx_dpea_assessments_activity_id ON dpea_assessments(processing_activity_id);
CREATE INDEX idx_dpea_assessments_status ON dpea_assessments(approval_status);

CREATE INDEX idx_compliance_incidents_date ON compliance_incidents(incident_date);
CREATE INDEX idx_compliance_incidents_severity ON compliance_incidents(severity_level);
CREATE INDEX idx_compliance_incidents_status ON compliance_incidents(incident_status);

CREATE INDEX idx_data_retention_policies_category ON data_retention_policies(data_category);
CREATE INDEX idx_data_retention_policies_next_execution ON data_retention_policies(next_execution_date);

CREATE INDEX idx_third_party_processors_compliance ON third_party_processors(compliance_status);
CREATE INDEX idx_third_party_processors_risk ON third_party_processors(risk_level);

CREATE INDEX idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_period ON compliance_reports(report_period_start, report_period_end);

CREATE INDEX idx_privacy_audit_trail_user_id ON privacy_audit_trail(user_id);
CREATE INDEX idx_privacy_audit_trail_action_type ON privacy_audit_trail(action_type);
CREATE INDEX idx_privacy_audit_trail_timestamp ON privacy_audit_trail(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpea_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consent records" ON consent_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own data subject requests" ON data_subject_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Compliance officers can manage privacy policies" ON privacy_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'dpo')
        )
    );

CREATE POLICY "Compliance officers can manage processing activities" ON data_processing_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'dpo')
        )
    );

CREATE POLICY "Compliance officers can manage DPEA assessments" ON dpea_assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'dpo')
        )
    );

CREATE POLICY "Compliance officers can manage incidents" ON compliance_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'dpo')
        )
    );

CREATE POLICY "System can read retention policies" ON data_retention_policies
    FOR SELECT USING (true);

CREATE POLICY "Compliance officers can manage third party processors" ON third_party_processors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'dpo')
        )
    );

CREATE POLICY "Compliance officers can view reports" ON compliance_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'dpo')
        )
    );

CREATE POLICY "System can insert audit trails" ON privacy_audit_trail
    FOR INSERT WITH CHECK (true);

-- Functions for compliance automation
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON consent_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_subject_requests_updated_at BEFORE UPDATE ON data_subject_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_privacy_policies_updated_at BEFORE UPDATE ON privacy_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_processing_activities_updated_at BEFORE UPDATE ON data_processing_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dpea_assessments_updated_at BEFORE UPDATE ON dpea_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_incidents_updated_at BEFORE UPDATE ON compliance_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_third_party_processors_updated_at BEFORE UPDATE ON third_party_processors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON compliance_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if consent has expired
CREATE OR REPLACE FUNCTION check_consent_expiry()
RETURNS TABLE(consent_id UUID, user_id UUID, consent_type VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT cr.id, cr.user_id, cr.consent_type
    FROM consent_records cr
    WHERE cr.is_active = true
    AND cr.consent_expiry IS NOT NULL
    AND cr.consent_expiry < NOW()
    AND cr.withdrawal_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-close data subject requests
CREATE OR REPLACE FUNCTION auto_close_expired_requests()
RETURNS INTEGER AS $$
DECLARE
    closed_count INTEGER := 0;
BEGIN
    UPDATE data_subject_requests
    SET request_status = 'closed', 
        response_details = 'Request automatically closed due to no response from data subject',
        updated_at = NOW()
    WHERE request_status = 'in_progress'
    AND processing_deadline < CURRENT_DATE
    AND (response_date IS NULL OR response_date IS NULL);
    
    GET DIAGNOSTICS closed_count = ROW_COUNT;
    RETURN closed_count;
END;
$$ LANGUAGE plpgsql;