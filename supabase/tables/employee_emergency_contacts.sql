CREATE TABLE employee_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_name_arabic TEXT,
    relationship TEXT NOT NULL,
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    is_primary_contact BOOLEAN DEFAULT false,
    authorized_for_medical BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);