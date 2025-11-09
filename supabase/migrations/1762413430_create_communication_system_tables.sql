-- Migration: create_communication_system_tables
-- Created at: 1762413430

-- Multi-Channel Communication System Database Schema
-- Comprehensive customer communication with UAE compliance

-- 1. Communication Channels Table
CREATE TABLE IF NOT EXISTS communication_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    channel_type VARCHAR(20) NOT NULL, -- sms, email, whatsapp, chat, video
    provider_name VARCHAR(100) NOT NULL, -- etisalat, du, twillio, sendgrid, etc.
    api_config JSONB NOT NULL, -- API keys, endpoints, configuration
    is_active BOOLEAN DEFAULT true,
    rate_limits JSONB DEFAULT '{}', -- rate limiting configuration
    compliance_status VARCHAR(20) DEFAULT 'active', -- active, suspended, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- notification, marketing, service, reminder
    language VARCHAR(10) DEFAULT 'en', -- en, ar
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- variable names used in template
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(50), -- appointment, order, payment, general
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customer Communications Table
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    channel_type VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- notification, marketing, support, reminder
    subject VARCHAR(500),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_id VARCHAR(200), -- external provider message ID
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Automated Notifications Table
CREATE TABLE IF NOT EXISTS automated_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- order_created, appointment_scheduled, payment_due, etc.
    trigger_conditions JSONB NOT NULL,
    template_id UUID NOT NULL,
    channel_type VARCHAR(20) NOT NULL,
    schedule_type VARCHAR(20) DEFAULT 'immediate', -- immediate, scheduled, recurring
    schedule_delay INTEGER DEFAULT 0, -- minutes to wait before sending
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    employee_id UUID,
    status VARCHAR(20) DEFAULT 'open', -- open, assigned, closed, escalated
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent
    tags TEXT[], -- support categories
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    satisfaction_rating INTEGER, -- 1-5 rating
    satisfaction_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- customer, employee, system
    sender_id UUID,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    attachment_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_status BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- 7. Video Consultations Table
CREATE TABLE IF NOT EXISTS video_consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    employee_id UUID,
    appointment_id UUID,
    consultation_type VARCHAR(50) NOT NULL, -- fitting, design, measurement, general
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, no_show
    meeting_link TEXT,
    meeting_id VARCHAR(200),
    recording_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Communication Preferences Table
CREATE TABLE IF NOT EXISTS communication_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL UNIQUE,
    preferred_channels JSONB DEFAULT '["email"]', -- array of preferred channels
    notification_settings JSONB DEFAULT '{}', -- detailed notification preferences
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    opt_out_categories TEXT[] DEFAULT '{}', -- categories they've opted out of
    marketing_consent BOOLEAN DEFAULT false,
    sms_consent BOOLEAN DEFAULT false,
    whatsapp_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Bulk Messaging Table
CREATE TABLE IF NOT EXISTS bulk_messaging (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    campaign_name VARCHAR(200) NOT NULL,
    target_criteria JSONB NOT NULL, -- customer segmentation criteria
    message_template_id UUID NOT NULL,
    channel_type VARCHAR(20) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, completed, failed
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    opt_out_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Communication Analytics Table
CREATE TABLE IF NOT EXISTS communication_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    date DATE NOT NULL,
    channel_type VARCHAR(20) NOT NULL,
    message_type VARCHAR(50),
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0,
    average_response_time INTEGER, -- in minutes
    satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, date, channel_type, message_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_channels_org_type ON communication_channels(organization_id, channel_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_org_category ON message_templates(organization_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer ON customer_communications(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customer_communications_org_status ON customer_communications(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_automated_notifications_org_trigger ON automated_notifications(organization_id, trigger_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_org_status ON chat_sessions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer ON chat_sessions(customer_id, started_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_video_consultations_org_scheduled ON video_consultations(organization_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_consultations_customer ON video_consultations(customer_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_communication_preferences_customer ON communication_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_bulk_messaging_org_status ON bulk_messaging(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_org_date ON communication_analytics(organization_id, date, channel_type);

-- Enable RLS on all tables
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_messaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (organization-based isolation)

-- Communication Channels policies
CREATE POLICY "communication_channels_select" ON communication_channels FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "communication_channels_insert" ON communication_channels FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "communication_channels_update" ON communication_channels FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Message Templates policies
CREATE POLICY "message_templates_select" ON message_templates FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "message_templates_insert" ON message_templates FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "message_templates_update" ON message_templates FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "message_templates_delete" ON message_templates FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Customer Communications policies
CREATE POLICY "customer_communications_select" ON customer_communications FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "customer_communications_insert" ON customer_communications FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Automated Notifications policies
CREATE POLICY "automated_notifications_select" ON automated_notifications FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "automated_notifications_insert" ON automated_notifications FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "automated_notifications_update" ON automated_notifications FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "automated_notifications_delete" ON automated_notifications FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Chat Sessions policies
CREATE POLICY "chat_sessions_select" ON chat_sessions FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "chat_sessions_insert" ON chat_sessions FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "chat_sessions_update" ON chat_sessions FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Chat Messages policies (accessible through session)
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
    session_id IN (
        SELECT id FROM chat_sessions 
        WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
);
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM chat_sessions 
        WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
);

-- Video Consultations policies
CREATE POLICY "video_consultations_select" ON video_consultations FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "video_consultations_insert" ON video_consultations FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "video_consultations_update" ON video_consultations FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Communication Preferences policies (accessible through customer relationship)
CREATE POLICY "communication_preferences_select" ON communication_preferences FOR SELECT USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
);
CREATE POLICY "communication_preferences_insert" ON communication_preferences FOR INSERT WITH CHECK (
    customer_id IN (
        SELECT id FROM customers 
        WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
);
CREATE POLICY "communication_preferences_update" ON communication_preferences FOR UPDATE USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
);

-- Bulk Messaging policies
CREATE POLICY "bulk_messaging_select" ON bulk_messaging FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "bulk_messaging_insert" ON bulk_messaging FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "bulk_messaging_update" ON bulk_messaging FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Communication Analytics policies
CREATE POLICY "communication_analytics_select" ON communication_analytics FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "communication_analytics_insert" ON communication_analytics FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "communication_analytics_update" ON communication_analytics FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);;