-- Sample Data for Visa & Compliance Management System

-- First, let's get some organization and employee IDs
DO $$
DECLARE
    v_org_id UUID;
    v_emp_ids UUID[];
    v_visa_id UUID;
    v_user_id UUID;
BEGIN
    -- Get first organization
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    -- Get first user
    SELECT id INTO v_user_id FROM profiles LIMIT 1;
    
    -- Get some employee IDs
    SELECT ARRAY_AGG(id) INTO v_emp_ids FROM employees WHERE organization_id = v_org_id LIMIT 5;
    
    -- Insert Compliance Violations
    INSERT INTO compliance_violations (organization_id, employee_id, violation_type, severity, status, description, detected_date, due_date, financial_impact_aed, assigned_to_user_id)
    VALUES
        (v_org_id, v_emp_ids[1], 'visa_expiry', 'high', 'active', 'Employee visa expiring in 15 days - urgent renewal required', NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', 5000, v_user_id),
        (v_org_id, v_emp_ids[2], 'work_authorization', 'critical', 'investigating', 'Emirates ID expired - employee cannot legally work', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 10000, v_user_id),
        (v_org_id, NULL, 'labor_law', 'medium', 'mitigated', 'WPS submission delayed by 2 days - penalty warning received', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 1500, v_user_id),
        (v_org_id, v_emp_ids[3], 'contract_compliance', 'low', 'resolved', 'Employment contract missing signature - now completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days', 0, v_user_id),
        (v_org_id, NULL, 'leave_policy', 'medium', 'active', 'Annual leave not properly tracked for Q3 2025', NOW() - INTERVAL '3 days', NOW() + INTERVAL '20 days', 0, v_user_id);

    -- Insert Government Portal Tracking
    INSERT INTO government_portal_tracking (organization_id, employee_id, portal_name, application_type, application_number, submission_date, expected_completion_date, status, fees_paid_aed, reference_number, submitted_by_user_id)
    VALUES
        (v_org_id, v_emp_ids[1], 'MOHRE', 'work_permit', 'WP-2025-12345', NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', 'under_review', 2500, 'REF-MOHRE-001', v_user_id),
        (v_org_id, v_emp_ids[2], 'GDRFA', 'visa_renewal', 'VR-2025-67890', NOW() - INTERVAL '15 days', NOW() + INTERVAL '5 days', 'approved', 3500, 'REF-GDRFA-002', v_user_id),
        (v_org_id, v_emp_ids[3], 'ICA', 'emirates_id', 'EID-2025-11111', NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', 'submitted', 500, 'REF-ICA-003', v_user_id),
        (v_org_id, NULL, 'MOHRE', 'labor_complaint', 'LC-2025-22222', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 'completed', 0, 'REF-MOHRE-004', v_user_id),
        (v_org_id, v_emp_ids[4], 'GDRFA', 'visa_renewal', 'VR-2025-33333', NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 days', 'draft', 0, NULL, v_user_id);

    -- Insert Regulatory Updates
    INSERT INTO regulatory_updates (organization_id, update_type, authority, title, description, effective_date, announcement_date, impact_level, action_required, action_deadline, compliance_status, created_by_user_id)
    VALUES
        (v_org_id, 'labor_law', 'MOHRE', 'Updated Work Hour Regulations', 'Maximum working hours reduced to 48 hours per week with mandatory overtime compensation at 1.5x rate', '2025-01-01', '2024-11-15', 'high', TRUE, '2025-12-31', 'in_progress', v_user_id),
        (v_org_id, 'visa_regulation', 'GDRFA', 'New Visa Fee Structure', 'Visa renewal fees increased by 10% across all categories effective from Feb 2025', '2025-02-01', '2024-12-01', 'medium', TRUE, '2025-01-31', 'pending', v_user_id),
        (v_org_id, 'insurance_requirement', 'DHA', 'Enhanced Medical Insurance Coverage', 'Minimum coverage increased to AED 150,000 per employee for all emirates', '2025-03-01', '2024-12-15', 'high', TRUE, '2025-02-28', 'pending', v_user_id),
        (v_org_id, 'tax_law', 'FTA', 'Corporate Tax Implementation Phase 2', 'Additional reporting requirements for businesses with revenue above AED 3M', '2025-06-01', '2025-01-10', 'critical', TRUE, '2025-05-31', 'pending', v_user_id),
        (v_org_id, 'work_hours', 'MOHRE', 'Ramadan Working Hours Policy', 'Working hours reduced to 6 hours per day during Ramadan period', '2025-02-28', '2025-02-01', 'low', FALSE, NULL, 'compliant', v_user_id);

    -- Insert Visa Renewal Alerts
    -- First get a visa tracking ID
    SELECT id INTO v_visa_id FROM visa_tracking WHERE organization_id = v_org_id AND employee_id = v_emp_ids[1] LIMIT 1;
    
    IF v_visa_id IS NOT NULL THEN
        INSERT INTO visa_renewal_alerts (organization_id, visa_tracking_id, employee_id, alert_type, alert_date, days_until_expiry, expiry_date, status, notification_channels)
        VALUES
            (v_org_id, v_visa_id, v_emp_ids[1], 'visa_expiry', NOW(), 30, NOW() + INTERVAL '30 days', 'sent', ARRAY['email', 'sms', 'in_app']),
            (v_org_id, v_visa_id, v_emp_ids[1], 'emirates_id_expiry', NOW() + INTERVAL '5 days', 60, NOW() + INTERVAL '60 days', 'pending', ARRAY['email', 'in_app']);
    END IF;

    -- Insert Government Correspondence
    INSERT INTO government_correspondence (organization_id, employee_id, correspondence_type, authority, subject, reference_number, received_date, direction, priority, status, due_date, assigned_to_user_id)
    VALUES
        (v_org_id, NULL, 'notice', 'MOHRE', 'Annual Labor Inspection Schedule for 2025', 'MOHRE-NOTICE-2025-001', NOW() - INTERVAL '7 days', 'incoming', 'high', 'received', NOW() + INTERVAL '30 days', v_user_id),
        (v_org_id, v_emp_ids[2], 'inquiry', 'GDRFA', 'Visa Status Inquiry for Employee #12345', 'INQUIRY-2025-002', NOW() - INTERVAL '3 days', 'outgoing', 'medium', 'sent', NOW() + INTERVAL '10 days', v_user_id),
        (v_org_id, NULL, 'fine', 'MOHRE', 'Late WPS Submission Penalty Notice', 'FINE-2025-003', NOW() - INTERVAL '15 days', 'incoming', 'urgent', 'responded', NOW() - INTERVAL '5 days', v_user_id),
        (v_org_id, v_emp_ids[3], 'application', 'ICA', 'Emirates ID Application for New Employee', 'APP-2025-004', NOW() - INTERVAL '2 days', 'outgoing', 'medium', 'sent', NOW() + INTERVAL '14 days', v_user_id),
        (v_org_id, NULL, 'response', 'FTA', 'VAT Registration Confirmation', 'RESP-2025-005', NOW() - INTERVAL '20 days', 'incoming', 'low', 'closed', NULL, v_user_id);

    -- Insert WPS Compliance Records
    INSERT INTO wps_compliance (organization_id, month, submission_deadline, submission_date, status, total_employees, total_salary_aed, confirmation_number, submitted_by_user_id)
    VALUES
        (v_org_id, '2025-09-01', '2025-10-10', '2025-10-08', 'approved', 25, 175000, 'WPS-CONF-SEP-2025', v_user_id),
        (v_org_id, '2025-10-01', '2025-11-10', '2025-11-09', 'approved', 27, 185000, 'WPS-CONF-OCT-2025', v_user_id),
        (v_org_id, '2025-11-01', '2025-12-10', NULL, 'pending', 28, 192000, NULL, v_user_id);

    -- Insert Audit Logs
    INSERT INTO visa_compliance_audit_logs (organization_id, employee_id, audit_type, action, entity_type, performed_by_user_id, result)
    VALUES
        (v_org_id, v_emp_ids[1], 'visa_check', 'Checked visa expiry status', 'visa_tracking', v_user_id, 'success'),
        (v_org_id, v_emp_ids[2], 'compliance_check', 'Reviewed work authorization status', 'compliance_violation', v_user_id, 'warning'),
        (v_org_id, NULL, 'document_review', 'Reviewed WPS submission documents', 'wps_compliance', v_user_id, 'success'),
        (v_org_id, v_emp_ids[3], 'system_access', 'Accessed employee visa records', 'visa_tracking', v_user_id, 'success');

END $$;
