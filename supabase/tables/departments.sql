CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_code TEXT UNIQUE NOT NULL,
    department_name TEXT NOT NULL,
    department_name_arabic TEXT,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    location TEXT,
    budget_annual_aed NUMERIC(12,2),
    cost_center_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);