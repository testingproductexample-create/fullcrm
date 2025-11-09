CREATE TABLE customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('Birthday',
    'Anniversary',
    'Special Occasion')) NOT NULL,
    event_date DATE NOT NULL,
    recurrence TEXT CHECK (recurrence IN ('Yearly',
    'None')) DEFAULT 'Yearly',
    reminder_days_before INTEGER[] DEFAULT ARRAY[7,
    3,
    1],
    last_reminded DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);