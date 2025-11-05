# CRM Database Schema Design

## Multi-Tenant Architecture

### Organizations Table
- id (uuid, primary key)
- name (text)
- business_type (text)
- country (text, default 'UAE')
- currency (text, default 'AED')
- primary_language (text, default 'en')
- settings (jsonb) - business settings
- created_at (timestamp)
- updated_at (timestamp)

### Users Table (extends auth.users)
- id (uuid, references auth.users)
- organization_id (uuid, references organizations)
- full_name (text)
- role (text) - owner, manager, tailor, assistant
- phone (text)
- avatar_url (text)
- preferences (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

## Customer Management

### Customers Table
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- customer_code (text, unique per org)
- full_name (text)
- email (text)
- phone (text)
- phone_secondary (text)
- emirates_id (text)
- visa_status (text)
- nationality (text)
- gender (text)
- date_of_birth (date)
- anniversary_date (date)
- profile_photo_url (text)
- address_line1 (text)
- address_line2 (text)
- city (text)
- emirate (text)
- postal_code (text)
- classification (text) - VIP, Regular, New
- status (text) - Active, Inactive, Blocked
- customer_since (date)
- last_order_date (date)
- total_orders (integer, default 0)
- total_spent (numeric, default 0)
- loyalty_points (integer, default 0)
- loyalty_tier (text) - Bronze, Silver, Gold, Platinum
- preferred_communication (text[]) - SMS, Email, WhatsApp
- communication_opt_in (boolean, default true)
- notes (text)
- tags (text[])
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

### Customer Measurements Table
- id (uuid, primary key)
- organization_id (uuid)
- customer_id (uuid, references customers)
- measurement_date (date)
- garment_type (text) - Suit, Shirt, Dress, Pants, etc.
- body_type (text)
- size_standard (text)
- measurements (jsonb) - flexible for different garment types
- fitting_notes (text)
- measured_by (uuid, references users)
- is_latest (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

### Measurement Templates Table
- id (uuid, primary key)
- organization_id (uuid)
- template_name (text)
- garment_type (text)
- measurement_fields (jsonb)
- is_default (boolean)
- created_at (timestamp)

### Customer Communications Table
- id (uuid, primary key)
- organization_id (uuid)
- customer_id (uuid, references customers)
- communication_type (text) - SMS, Email, WhatsApp, Phone, In-Person
- direction (text) - Inbound, Outbound
- subject (text)
- message (text)
- status (text) - Sent, Delivered, Failed, Read
- sent_by (uuid, references users)
- related_order_id (uuid) - nullable
- metadata (jsonb)
- created_at (timestamp)

### Customer Preferences Table
- id (uuid, primary key)
- organization_id (uuid)
- customer_id (uuid, references customers)
- style_preferences (text[])
- fabric_preferences (text[])
- color_preferences (text[])
- pattern_preferences (text[])
- fit_preference (text) - Slim, Regular, Relaxed
- special_requirements (text)
- preferred_appointment_time (text)
- preferred_appointment_day (text[])
- delivery_preference (text)
- delivery_instructions (text)
- created_at (timestamp)
- updated_at (timestamp)

### Customer Notes Table
- id (uuid, primary key)
- organization_id (uuid)
- customer_id (uuid, references customers)
- note_type (text) - General, Complaint, Feedback, Important
- note (text)
- is_pinned (boolean, default false)
- created_by (uuid, references users)
- created_at (timestamp)
- updated_at (timestamp)

### Customer Events Table
- id (uuid, primary key)
- organization_id (uuid)
- customer_id (uuid, references customers)
- event_type (text) - Birthday, Anniversary, Special Occasion
- event_date (date)
- recurrence (text) - Yearly, None
- reminder_days_before (integer[]) - [7, 3, 1]
- last_reminded (date)
- is_active (boolean, default true)
- created_at (timestamp)

### Customer Loyalty Programs Table
- id (uuid, primary key)
- organization_id (uuid)
- program_name (text)
- description (text)
- points_per_aed (numeric)
- tier_thresholds (jsonb) - {bronze: 0, silver: 1000, gold: 5000, platinum: 10000}
- tier_benefits (jsonb)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### Customer Loyalty Transactions Table
- id (uuid, primary key)
- organization_id (uuid)
- customer_id (uuid, references customers)
- transaction_type (text) - Earned, Redeemed, Expired, Adjusted
- points (integer)
- description (text)
- related_order_id (uuid)
- created_by (uuid, references users)
- created_at (timestamp)

### Customer Segmentation Table
- id (uuid, primary key)
- organization_id (uuid)
- segment_name (text)
- description (text)
- criteria (jsonb) - filter conditions
- customer_count (integer, default 0)
- last_calculated (timestamp)
- is_dynamic (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

### Customer Segment Members Table
- id (uuid, primary key)
- organization_id (uuid)
- segment_id (uuid, references customer_segmentation)
- customer_id (uuid, references customers)
- added_at (timestamp)

## Indexes for Performance

### Critical Indexes:
- customers: organization_id, customer_code, email, phone, status, classification
- customer_measurements: customer_id, organization_id, is_latest
- customer_communications: customer_id, organization_id, created_at
- customer_notes: customer_id, is_pinned
- customer_events: event_date, is_active, organization_id
- customer_loyalty_transactions: customer_id, created_at

## RLS Policies

All tables will have RLS enabled with policies:
1. Users can only access data from their own organization
2. Role-based access control (RBAC)
3. Service role has full access for edge functions
