-- Document Management System Seed Data
-- Created: 2025-11-06
-- Purpose: Initial document categories for UAE tailoring business

-- Get the first organization ID for seeding
DO $$
DECLARE
    org_id UUID;
    admin_id UUID;
BEGIN
    -- Get the first organization
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    -- Get the first admin user
    SELECT id INTO admin_id FROM profiles WHERE role IN ('owner', 'admin') LIMIT 1;
    
    IF org_id IS NOT NULL AND admin_id IS NOT NULL THEN
        -- Insert parent categories
        INSERT INTO document_categories (organization_id, category_code, category_name, description, icon, color, sort_order, retention_period_years, is_system_category, created_by) VALUES
        (org_id, 'CUSTOMERS', 'Customer Documents', 'All customer-related documents including contracts, measurements, and preferences', 'UserGroupIcon', '#3B82F6', 1, 7, true, admin_id),
        (org_id, 'ORDERS', 'Order Documents', 'Order contracts, specifications, and delivery documentation', 'ShoppingBagIcon', '#10B981', 2, 7, true, admin_id),
        (org_id, 'EMPLOYEES', 'Employee Documents', 'Employee contracts, certifications, visa documents, and HR records', 'UsersIcon', '#8B5CF6', 3, 10, true, admin_id),
        (org_id, 'FINANCIAL', 'Financial Documents', 'Invoices, receipts, financial reports, and tax documents', 'CurrencyDollarIcon', '#F59E0B', 4, 10, true, admin_id),
        (org_id, 'LEGAL', 'Legal Documents', 'Legal contracts, compliance documents, and regulatory filings', 'ScaleIcon', '#EF4444', 5, 10, true, admin_id),
        (org_id, 'DESIGN', 'Design Documents', 'Design approvals, sketches, and fabric selections', 'SwatchIcon', '#EC4899', 6, 5, true, admin_id),
        (org_id, 'SUPPLIERS', 'Supplier Documents', 'Supplier agreements, purchase orders, and quality certificates', 'TruckIcon', '#14B8A6', 7, 7, true, admin_id),
        (org_id, 'QUALITY', 'Quality Documents', 'Quality control reports, inspection records, and certificates', 'CheckBadgeIcon', '#6366F1', 8, 7, true, admin_id),
        (org_id, 'TRAINING', 'Training Documents', 'Training materials, SOPs, and educational resources', 'AcademicCapIcon', '#06B6D4', 9, 3, true, admin_id),
        (org_id, 'GENERAL', 'General Documents', 'Miscellaneous documents and files', 'DocumentIcon', '#6B7280', 10, 5, true, admin_id);
        
        -- Get category IDs for creating subcategories
        DECLARE
            cat_customers UUID;
            cat_orders UUID;
            cat_employees UUID;
            cat_financial UUID;
            cat_legal UUID;
            cat_design UUID;
            cat_suppliers UUID;
            cat_quality UUID;
        BEGIN
            SELECT id INTO cat_customers FROM document_categories WHERE organization_id = org_id AND category_code = 'CUSTOMERS';
            SELECT id INTO cat_orders FROM document_categories WHERE organization_id = org_id AND category_code = 'ORDERS';
            SELECT id INTO cat_employees FROM document_categories WHERE organization_id = org_id AND category_code = 'EMPLOYEES';
            SELECT id INTO cat_financial FROM document_categories WHERE organization_id = org_id AND category_code = 'FINANCIAL';
            SELECT id INTO cat_legal FROM document_categories WHERE organization_id = org_id AND category_code = 'LEGAL';
            SELECT id INTO cat_design FROM document_categories WHERE organization_id = org_id AND category_code = 'DESIGN';
            SELECT id INTO cat_suppliers FROM document_categories WHERE organization_id = org_id AND category_code = 'SUPPLIERS';
            SELECT id INTO cat_quality FROM document_categories WHERE organization_id = org_id AND category_code = 'QUALITY';
            
            -- Customer subcategories
            INSERT INTO document_categories (organization_id, category_code, category_name, parent_category_id, description, icon, color, sort_order, retention_period_years, is_system_category, created_by) VALUES
            (org_id, 'CUST_ID', 'Customer ID Documents', cat_customers, 'Emirates ID copies and identity verification documents', 'IdentificationIcon', '#3B82F6', 1, 7, true, admin_id),
            (org_id, 'CUST_CONTRACTS', 'Customer Contracts', cat_customers, 'Service agreements and customer contracts', 'DocumentTextIcon', '#3B82F6', 2, 7, true, admin_id),
            (org_id, 'CUST_MEASUREMENTS', 'Measurement Records', cat_customers, 'Customer measurement sheets and body profiles', 'ChartBarIcon', '#3B82F6', 3, 7, true, admin_id),
            (org_id, 'CUST_PREFERENCES', 'Customer Preferences', cat_customers, 'Style preferences and fitting notes', 'HeartIcon', '#3B82F6', 4, 5, true, admin_id),
            
            -- Order subcategories
            (org_id, 'ORDER_CONTRACTS', 'Order Contracts', cat_orders, 'Individual order contracts and agreements', 'ClipboardDocumentCheckIcon', '#10B981', 1, 7, true, admin_id),
            (org_id, 'ORDER_SPECS', 'Order Specifications', cat_orders, 'Detailed order specifications and requirements', 'ListBulletIcon', '#10B981', 2, 7, true, admin_id),
            (org_id, 'ORDER_DELIVERY', 'Delivery Documents', cat_orders, 'Delivery receipts and acknowledgments', 'TruckIcon', '#10B981', 3, 7, true, admin_id),
            (org_id, 'ORDER_MODIFICATIONS', 'Modification Requests', cat_orders, 'Alteration and modification documentation', 'PencilSquareIcon', '#10B981', 4, 7, true, admin_id),
            
            -- Employee subcategories
            (org_id, 'EMP_CONTRACTS', 'Employment Contracts', cat_employees, 'Employee employment contracts', 'DocumentIcon', '#8B5CF6', 1, 10, true, admin_id),
            (org_id, 'EMP_CERTIFICATIONS', 'Certifications', cat_employees, 'Professional certifications and licenses', 'AcademicCapIcon', '#8B5CF6', 2, 10, true, admin_id),
            (org_id, 'EMP_VISA', 'Visa Documents', cat_employees, 'Visa, work permit, and immigration documents', 'GlobeAltIcon', '#8B5CF6', 3, 10, true, admin_id),
            (org_id, 'EMP_PERSONAL', 'Personal Documents', cat_employees, 'Personal documents and emergency contact information', 'UserIcon', '#8B5CF6', 4, 10, true, admin_id),
            (org_id, 'EMP_PERFORMANCE', 'Performance Reviews', cat_employees, 'Performance review documentation', 'ChartBarIcon', '#8B5CF6', 5, 7, true, admin_id),
            
            -- Financial subcategories
            (org_id, 'FIN_INVOICES', 'Invoices', cat_financial, 'Sales invoices and billing documents', 'DocumentTextIcon', '#F59E0B', 1, 10, true, admin_id),
            (org_id, 'FIN_RECEIPTS', 'Payment Receipts', cat_financial, 'Payment receipts and transaction records', 'ReceiptPercentIcon', '#F59E0B', 2, 10, true, admin_id),
            (org_id, 'FIN_REPORTS', 'Financial Reports', cat_financial, 'Financial statements and reports', 'ChartPieIcon', '#F59E0B', 3, 10, true, admin_id),
            (org_id, 'FIN_TAX', 'Tax Documents', cat_financial, 'VAT returns and tax documentation', 'CalculatorIcon', '#F59E0B', 4, 10, true, admin_id),
            
            -- Legal subcategories
            (org_id, 'LEGAL_CONTRACTS', 'Legal Contracts', cat_legal, 'Business contracts and legal agreements', 'DocumentIcon', '#EF4444', 1, 10, true, admin_id),
            (org_id, 'LEGAL_COMPLIANCE', 'Compliance Documents', cat_legal, 'Regulatory compliance and certifications', 'ShieldCheckIcon', '#EF4444', 2, 10, true, admin_id),
            (org_id, 'LEGAL_LICENSES', 'Business Licenses', cat_legal, 'Trade licenses and business permits', 'DocumentCheckIcon', '#EF4444', 3, 10, true, admin_id),
            
            -- Design subcategories
            (org_id, 'DESIGN_APPROVALS', 'Design Approvals', cat_design, 'Customer design approval documentation', 'CheckCircleIcon', '#EC4899', 1, 5, true, admin_id),
            (org_id, 'DESIGN_SKETCHES', 'Design Sketches', cat_design, 'Original design sketches and drawings', 'PaintBrushIcon', '#EC4899', 2, 5, true, admin_id),
            (org_id, 'DESIGN_FABRICS', 'Fabric Selections', cat_design, 'Fabric samples and selection documents', 'SwatchIcon', '#EC4899', 3, 3, true, admin_id),
            
            -- Supplier subcategories
            (org_id, 'SUPP_CONTRACTS', 'Supplier Contracts', cat_suppliers, 'Supplier agreements and contracts', 'DocumentTextIcon', '#14B8A6', 1, 7, true, admin_id),
            (org_id, 'SUPP_PO', 'Purchase Orders', cat_suppliers, 'Purchase order documentation', 'ShoppingCartIcon', '#14B8A6', 2, 7, true, admin_id),
            (org_id, 'SUPP_CERTIFICATES', 'Quality Certificates', cat_suppliers, 'Supplier quality certificates', 'BadgeCheckIcon', '#14B8A6', 3, 5, true, admin_id),
            
            -- Quality subcategories
            (org_id, 'QUALITY_INSPECTIONS', 'Inspection Reports', cat_quality, 'Quality inspection reports', 'ClipboardDocumentListIcon', '#6366F1', 1, 7, true, admin_id),
            (org_id, 'QUALITY_CERTIFICATES', 'Quality Certificates', cat_quality, 'Quality assurance certificates', 'CertificateIcon', '#6366F1', 2, 7, true, admin_id),
            (org_id, 'QUALITY_AUDITS', 'Quality Audits', cat_quality, 'Internal and external quality audit reports', 'DocumentSearchIcon', '#6366F1', 3, 7, true, admin_id);
            
            RAISE NOTICE 'Document categories created successfully for organization %', org_id;
        END;
    ELSE
        RAISE NOTICE 'No organization or admin user found for seeding';
    END IF;
END $$;

-- Create some common document tags
DO $$
DECLARE
    org_id UUID;
    admin_id UUID;
BEGIN
    SELECT id INTO org_id FROM organizations LIMIT 1;
    SELECT id INTO admin_id FROM profiles WHERE role IN ('owner', 'admin') LIMIT 1;
    
    IF org_id IS NOT NULL AND admin_id IS NOT NULL THEN
        INSERT INTO document_tags (organization_id, tag_name, tag_color, tag_description, created_by) VALUES
        (org_id, 'urgent', '#EF4444', 'Requires immediate attention', admin_id),
        (org_id, 'confidential', '#DC2626', 'Confidential document', admin_id),
        (org_id, 'signed', '#10B981', 'Document has been signed', admin_id),
        (org_id, 'pending-signature', '#F59E0B', 'Awaiting signature', admin_id),
        (org_id, 'archived', '#6B7280', 'Archived document', admin_id),
        (org_id, 'template', '#8B5CF6', 'Template document', admin_id),
        (org_id, 'draft', '#3B82F6', 'Draft version', admin_id),
        (org_id, 'final', '#059669', 'Final version', admin_id),
        (org_id, 'uae-compliant', '#14B8A6', 'UAE PDPL compliant', admin_id),
        (org_id, 'reviewed', '#06B6D4', 'Has been reviewed', admin_id);
        
        RAISE NOTICE 'Document tags created successfully';
    END IF;
END $$;
