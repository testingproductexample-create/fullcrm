-- Migration: create_payslip_generation_rls_policies
-- Created at: 1762388512

-- ======================================
-- RLS POLICIES FOR PAYSLIP GENERATION SYSTEM
-- Organization-based data isolation for all 6 tables
-- ======================================

-- Enable RLS on all payslip generation tables
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_archives ENABLE ROW LEVEL SECURITY;

-- ======================================
-- PAYSLIPS TABLE POLICIES
-- ======================================

-- Select policy for payslips
CREATE POLICY "Users can view payslips in their organization" ON payslips
    FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Insert policy for payslips
CREATE POLICY "Users can create payslips in their organization" ON payslips
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Update policy for payslips
CREATE POLICY "Users can update payslips in their organization" ON payslips
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Delete policy for payslips
CREATE POLICY "Users can delete payslips in their organization" ON payslips
    FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- ======================================
-- PAYSLIP_TEMPLATES TABLE POLICIES
-- ======================================

-- Select policy for payslip_templates
CREATE POLICY "Users can view payslip templates in their organization" ON payslip_templates
    FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Insert policy for payslip_templates
CREATE POLICY "Users can create payslip templates in their organization" ON payslip_templates
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Update policy for payslip_templates
CREATE POLICY "Users can update payslip templates in their organization" ON payslip_templates
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Delete policy for payslip_templates
CREATE POLICY "Users can delete payslip templates in their organization" ON payslip_templates
    FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- ======================================
-- DIGITAL_SIGNATURES TABLE POLICIES
-- ======================================

-- Select policy for digital_signatures
CREATE POLICY "Users can view digital signatures in their organization" ON digital_signatures
    FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Insert policy for digital_signatures
CREATE POLICY "Users can create digital signatures in their organization" ON digital_signatures
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Update policy for digital_signatures
CREATE POLICY "Users can update digital signatures in their organization" ON digital_signatures
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Delete policy for digital_signatures
CREATE POLICY "Users can delete digital signatures in their organization" ON digital_signatures
    FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- ======================================
-- PAYSLIP_DISTRIBUTION TABLE POLICIES
-- ======================================

-- Select policy for payslip_distribution
CREATE POLICY "Users can view payslip distribution in their organization" ON payslip_distribution
    FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Insert policy for payslip_distribution
CREATE POLICY "Users can create payslip distribution in their organization" ON payslip_distribution
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Update policy for payslip_distribution
CREATE POLICY "Users can update payslip distribution in their organization" ON payslip_distribution
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Delete policy for payslip_distribution
CREATE POLICY "Users can delete payslip distribution in their organization" ON payslip_distribution
    FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- ======================================
-- EMPLOYEE_ACCESS_LOG TABLE POLICIES
-- ======================================

-- Select policy for employee_access_log
CREATE POLICY "Users can view employee access logs in their organization" ON employee_access_log
    FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Insert policy for employee_access_log
CREATE POLICY "Users can create employee access logs in their organization" ON employee_access_log
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Update policy for employee_access_log
CREATE POLICY "Users can update employee access logs in their organization" ON employee_access_log
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Delete policy for employee_access_log
CREATE POLICY "Users can delete employee access logs in their organization" ON employee_access_log
    FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- ======================================
-- PAYSLIP_ARCHIVES TABLE POLICIES
-- ======================================

-- Select policy for payslip_archives
CREATE POLICY "Users can view payslip archives in their organization" ON payslip_archives
    FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Insert policy for payslip_archives
CREATE POLICY "Users can create payslip archives in their organization" ON payslip_archives
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Update policy for payslip_archives
CREATE POLICY "Users can update payslip archives in their organization" ON payslip_archives
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Delete policy for payslip_archives
CREATE POLICY "Users can delete payslip archives in their organization" ON payslip_archives
    FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- ======================================
-- UPDATE TIMESTAMP TRIGGERS
-- ======================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_payslips_updated_at 
    BEFORE UPDATE ON payslips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslip_templates_updated_at 
    BEFORE UPDATE ON payslip_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_signatures_updated_at 
    BEFORE UPDATE ON digital_signatures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslip_distribution_updated_at 
    BEFORE UPDATE ON payslip_distribution 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslip_archives_updated_at 
    BEFORE UPDATE ON payslip_archives 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- VALIDATION FUNCTIONS
-- ======================================

-- Function to validate UAE Emirates ID format
CREATE OR REPLACE FUNCTION validate_emirates_id(emirates_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- UAE Emirates ID is 15 digits
    RETURN emirates_id ~ '^[0-9]{15}$';
END;
$$ LANGUAGE plpgsql;

-- Function to validate UAE phone number format
CREATE OR REPLACE FUNCTION validate_uae_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- UAE phone numbers start with +971 and have 9 digits after
    RETURN phone_number ~ '^\+971[0-9]{9}$' OR phone_number ~ '^971[0-9]{9}$' OR phone_number ~ '^0[0-9]{9}$';
END;
$$ LANGUAGE plpgsql;

-- Function to generate payslip reference number
CREATE OR REPLACE FUNCTION generate_payslip_reference(org_id UUID, emp_id UUID, pay_period DATE)
RETURNS TEXT AS $$
DECLARE
    org_code TEXT;
    emp_code TEXT;
    period_code TEXT;
    sequence_num INTEGER;
    reference_num TEXT;
BEGIN
    -- Get organization code (first 3 chars of org name or default)
    SELECT COALESCE(UPPER(LEFT(name, 3)), 'ORG') INTO org_code 
    FROM organizations WHERE id = org_id;
    
    -- Get employee code (employee number or last 4 chars of ID)
    SELECT COALESCE(employee_number, RIGHT(id::TEXT, 4)) INTO emp_code 
    FROM employees WHERE id = emp_id;
    
    -- Format period as YYYYMM
    period_code := TO_CHAR(pay_period, 'YYYYMM');
    
    -- Get next sequence number for this period
    SELECT COUNT(*) + 1 INTO sequence_num 
    FROM payslips 
    WHERE organization_id = org_id 
    AND DATE_TRUNC('month', pay_period_start) = DATE_TRUNC('month', pay_period);
    
    -- Construct reference: ORG-EMP-PERIOD-SEQ
    reference_num := org_code || '-' || emp_code || '-' || period_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN reference_num;
END;
$$ LANGUAGE plpgsql;;