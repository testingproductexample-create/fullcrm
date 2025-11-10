// Communication System Types for Tailoring Management Platform
// Multi-channel communication with SMS, Email, WhatsApp support

// ================================
// CORE COMMUNICATION TYPES
// ================================

export interface CommunicationChannel {
  id: string;
  organization_id: string;
  channel_type: 'sms' | 'email' | 'whatsapp' | 'chat' | 'video';
  channel_name: string;
  
  // Configuration
  provider?: string; // Twilio, SendGrid, WhatsApp Business, etc.
  api_endpoint?: string;
  configuration?: Record<string, any>; // API keys, settings (encrypted)
  
  // Status
  is_active: boolean;
  is_default: boolean;
  
  // UAE Compliance
  uae_compliant: boolean;
  telecom_license?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MessageTemplate {
  id: string;
  organization_id: string;
  
  // Template Details
  template_name: string;
  template_code: string; // Unique identifier
  category: string; // order_status, appointment_reminder, payment, marketing
  
  // Content
  subject?: string; // For email templates
  content_arabic: string; // Arabic content with variables
  content_english: string; // English content with variables
  variables: string[]; // Array of variable names
  
  // Channel Support
  supported_channels: ('sms' | 'email' | 'whatsapp')[];
  
  // Settings
  is_active: boolean;
  is_system_template: boolean; // System vs custom templates
  auto_trigger_events?: string[]; // Events that trigger this template
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomerCommunication {
  id: string;
  organization_id: string;
  customer_id: string;
  
  // Communication Details
  channel_type: string;
  channel_id?: string;
  template_id?: string;
  
  // Message Content
  subject?: string;
  content_arabic?: string;
  content_english?: string;
  language_sent: string; // Language actually sent
  
  // Delivery Information
  recipient_phone?: string;
  recipient_email?: string;
  sender_id?: string; // Employee or system sender
  
  // Status Tracking
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';
  delivery_status?: Record<string, any>; // Provider-specific delivery info
  
  // Timing
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  
  // Integration
  related_order_id?: string;
  related_appointment_id?: string;
  related_invoice_id?: string;
  
  // Cost Tracking
  cost_aed: number;
  cost_currency: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: any;
  template?: MessageTemplate;
  channel?: CommunicationChannel;
}

export interface AutomatedNotification {
  id: string;
  organization_id: string;
  
  // Trigger Configuration
  trigger_event: string; // order_status_change, appointment_reminder, etc.
  trigger_conditions?: Record<string, any>; // Conditions for triggering
  
  // Template and Channel
  template_id: string;
  channel_preferences: string[]; // Preferred channels in order
  
  // Timing
  delay_minutes: number; // Delay after trigger event
  advance_hours?: number; // For reminders (send X hours before)
  
  // Targeting
  customer_segments?: Record<string, any>; // Customer targeting criteria
  
  // Settings
  is_active: boolean;
  max_attempts: number;
  retry_interval_minutes: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ChatSession {
  id: string;
  organization_id: string;
  customer_id: string;
  
  // Session Details
  session_id: string; // External session identifier
  channel: string;
  
  // Participants
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  assigned_agent_id?: string;
  
  // Session State
  status: 'waiting' | 'active' | 'on_hold' | 'transferred' | 'closed' | 'abandoned';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Timing
  started_at: string;
  ended_at?: string;
  response_time_seconds?: number;
  resolution_time_minutes?: number;
  
  // Metadata
  initial_message?: string;
  session_tags?: string[];
  satisfaction_rating?: number;
  resolution_status?: string;
  
  // Integration
  related_order_id?: string;
  related_customer_id?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: any;
  assigned_agent?: any;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  organization_id: string;
  chat_session_id: string;
  
  // Message Details
  message_id?: string; // External message identifier
  sender_type: 'customer' | 'agent' | 'system' | 'bot';
  sender_id?: string; // Employee ID for agents
  sender_name?: string;
  
  // Content
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system_message';
  attachments?: any[]; // File attachments
  
  // Status
  is_read: boolean;
  read_at?: string;
  
  // Metadata
  language: string;
  sent_at: string;
  delivered_at?: string;
  
  created_at: string;
}

export interface VideoConsultation {
  id: string;
  organization_id: string;
  customer_id: string;
  
  // Consultation Details
  consultation_id?: string; // External platform ID
  platform: string; // zoom, teams, google_meet
  meeting_url?: string;
  meeting_password?: string;
  
  // Participants
  host_employee_id?: string;
  participants?: any[]; // Additional participants
  
  // Scheduling
  scheduled_start: string;
  scheduled_duration_minutes: number;
  actual_start?: string;
  actual_end?: string;
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Content
  consultation_type?: string; // design_review, fitting, consultation
  agenda?: string;
  notes?: string;
  recording_url?: string;
  
  // Integration
  related_order_id?: string;
  related_appointment_id?: string;
  
  // Follow-up
  follow_up_required: boolean;
  follow_up_notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: any;
  host_employee?: any;
}

export interface CommunicationPreferences {
  id: string;
  organization_id: string;
  customer_id: string;
  
  // Channel Preferences
  preferred_language: string;
  sms_enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  chat_enabled: boolean;
  
  // Contact Information
  preferred_phone?: string;
  preferred_email?: string;
  whatsapp_number?: string;
  
  // Notification Preferences
  order_notifications: boolean;
  appointment_reminders: boolean;
  payment_notifications: boolean;
  marketing_messages: boolean;
  promotional_offers: boolean;
  
  // Timing Preferences
  preferred_contact_hours_start: string;
  preferred_contact_hours_end: string;
  timezone: string;
  
  // Frequency Limits
  max_daily_messages: number;
  max_weekly_marketing: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface BulkMessagingCampaign {
  id: string;
  organization_id: string;
  
  // Campaign Details
  campaign_name: string;
  campaign_type: 'promotional' | 'informational' | 'reminder' | 'survey' | 'announcement';
  
  // Content
  template_id?: string;
  subject?: string;
  content_arabic?: string;
  content_english?: string;
  
  // Channel and Targeting
  channels: string[]; // sms, email, whatsapp
  target_segments?: Record<string, any>; // Customer segmentation criteria
  customer_list?: string[]; // Specific customer IDs
  
  // Scheduling
  scheduled_at?: string;
  timezone: string;
  
  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'cancelled' | 'failed';
  
  // Results
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  
  // Cost
  estimated_cost_aed: number;
  actual_cost_aed: number;
  
  // Metadata
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  template?: MessageTemplate;
}

export interface CommunicationAnalytics {
  id: string;
  organization_id: string;
  
  // Time Period
  date_period: string;
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  
  // Channel Metrics
  channel_type: string;
  
  // Message Metrics
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  messages_read: number;
  
  // Performance Metrics
  delivery_rate: number; // Percentage
  read_rate: number; // Percentage
  response_rate: number; // Percentage
  
  // Timing Metrics
  avg_delivery_time_seconds: number;
  avg_response_time_seconds: number;
  
  // Cost Metrics
  total_cost_aed: number;
  cost_per_message_aed: number;
  
  // Customer Metrics
  unique_recipients: number;
  new_conversations: number;
  resolved_conversations: number;
  
  // Chat Specific
  chat_sessions: number;
  avg_chat_duration_minutes: number;
  customer_satisfaction_avg: number;
  
  // Campaign Metrics (if applicable)
  campaign_id?: string;
  
  created_at: string;
}

// ================================
// COMMUNICATION STATISTICS & METRICS
// ================================

export interface CommunicationStats {
  total_messages_today: number;
  total_messages_week: number;
  total_messages_month: number;
  
  // Channel Breakdown
  sms_messages: number;
  email_messages: number;
  whatsapp_messages: number;
  chat_messages: number;
  
  // Performance
  overall_delivery_rate: number;
  overall_read_rate: number;
  avg_response_time_minutes: number;
  
  // Active Sessions
  active_chat_sessions: number;
  pending_video_consultations: number;
  
  // Cost
  total_cost_today_aed: number;
  total_cost_month_aed: number;
  
  // Customer Engagement
  active_customers: number;
  customer_satisfaction_avg: number;
}

// ================================
// UTILITY FUNCTIONS
// ================================

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai'
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai'
  });
};

export const getChannelIcon = (channelType: string) => {
  switch (channelType) {
    case 'sms': return 'MessageSquare';
    case 'email': return 'Mail';
    case 'whatsapp': return 'MessageCircle';
    case 'chat': return 'MessageSquare';
    case 'video': return 'Video';
    default: return 'MessageSquare';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
    case 'delivered':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    case 'read':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      };
    case 'pending':
    case 'scheduled':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200'
      };
    case 'failed':
    case 'bounced':
    case 'cancelled':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200'
      };
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      };
    case 'high':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800'
      };
    case 'normal':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    case 'low':
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      };
    default:
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
  }
};

export const formatCommunicationCost = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};

export const calculateDeliveryRate = (delivered: number, sent: number): number => {
  if (sent === 0) return 0;
  return Math.round((delivered / sent) * 100);
};

export const calculateReadRate = (read: number, delivered: number): number => {
  if (delivered === 0) return 0;
  return Math.round((read / delivered) * 100);
};

export const formatResponseTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

// Template variable replacement
export const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
};

// Language detection and content selection
export const getLocalizedContent = (
  arabicContent: string,
  englishContent: string,
  preferredLanguage: string = 'en'
): string => {
  return preferredLanguage === 'ar' ? arabicContent : englishContent;
};

// UAE phone number validation
export const validateUAEPhone = (phoneNumber: string): boolean => {
  // UAE phone number pattern: +971-XX-XXX-XXXX or 05X-XXX-XXXX
  const uaePhoneRegex = /^(\+971|00971|971)?(50|51|52|55|56|58|2|3|4|6|7|9)\d{7}$/;
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  return uaePhoneRegex.test(cleanPhone);
};

// Communication compliance check
export const checkUAECompliance = (channel: CommunicationChannel): boolean => {
  return channel.uae_compliant && channel.telecom_license !== null;
};

export const getTimeZoneOffset = (): number => {
  // UAE is UTC+4
  return 4;
};

export const isWithinBusinessHours = (): boolean => {
  const now = new Date();
  const uaeTime = new Date(now.getTime() + (getTimeZoneOffset() * 60 * 60 * 1000));
  const hour = uaeTime.getHours();
  return hour >= 8 && hour < 18; // 8 AM to 6 PM
};