# Appointment & Scheduling System - Database Schema

## Overview
Customer-facing appointment scheduling system integrated with employee management and resource allocation.

## Core Tables

### appointment_settings
Organization-level configuration for appointment scheduling.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- working_days (text[]) - ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
- working_hours_start (time) - 09:00:00
- working_hours_end (time) - 20:00:00
- slot_duration_minutes (integer) - 30, 60, 90
- buffer_time_minutes (integer) - 15
- advance_booking_days (integer) - 30
- min_booking_notice_hours (integer) - 24
- max_appointments_per_slot (integer) - 3
- allow_customer_booking (boolean) - true
- require_deposit (boolean) - false
- deposit_percentage (numeric) - 20.00
- cancellation_hours_notice (integer) - 24
- reminder_settings (jsonb) - {sms: {enabled: true, hours_before: [24, 2]}, email: {...}, whatsapp: {...}}
- timezone (text) - Asia/Dubai
- currency (text) - AED
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

### appointment_types
Different types of appointments offered.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- type_name (text) - Consultation, Fitting, Measurement, Alteration, Delivery, Follow-up
- description (text)
- duration_minutes (integer) - 30, 60, 90, 120
- color_code (text) - #3B82F6
- icon (text) - consultation, fitting, delivery
- price (numeric) - 0.00 or actual price
- deposit_required (boolean) - false
- requires_customer (boolean) - true
- requires_staff (boolean) - true
- requires_resources (text[]) - ['fitting_room', 'sewing_machine']
- skill_requirements (text[]) - ['tailor', 'designer']
- is_active (boolean) - true
- sort_order (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### appointment_resources
Physical resources available for booking (rooms, equipment, machines).

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- resource_name (text) - Fitting Room 1, Sewing Machine 3, Consultation Room
- resource_type (text) - fitting_room, sewing_machine, embroidery_machine, consultation_room, equipment
- description (text)
- location (text) - Floor 1, Workshop Area
- capacity (integer) - 1, 2 (for rooms)
- is_available (boolean) - true
- maintenance_schedule (jsonb) - {start: '2025-11-10', end: '2025-11-11'}
- status (text) - available, in_use, maintenance, out_of_service
- booking_priority (integer) - 1 (highest) to 10 (lowest)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

### appointments
Main appointment records.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- appointment_number (text) - APT-2025-001
- appointment_type_id (uuid, references appointment_types)
- customer_id (uuid, references customers) - nullable for walk-ins
- customer_name (text) - for walk-ins or quick booking
- customer_phone (text)
- customer_email (text)
- appointment_date (date)
- start_time (time)
- end_time (time)
- duration_minutes (integer)
- status (text) - scheduled, confirmed, in_progress, completed, cancelled, no_show, rescheduled
- priority (text) - normal, high, urgent
- notes (text)
- internal_notes (text) - staff only
- related_order_id (uuid) - nullable, links to order if applicable
- related_measurement_id (uuid) - nullable
- booking_source (text) - online, phone, walk_in, staff
- confirmation_status (text) - pending, confirmed, auto_confirmed
- confirmed_at (timestamp)
- confirmed_by (uuid, references users) - nullable
- deposit_amount (numeric) - 0.00
- deposit_paid (boolean) - false
- deposit_payment_method (text) - cash, card, online
- cancellation_reason (text)
- cancelled_at (timestamp)
- cancelled_by (uuid, references users) - nullable
- no_show_reason (text)
- check_in_time (timestamp) - when customer arrives
- check_out_time (timestamp) - when appointment ends
- actual_duration_minutes (integer)
- reminder_sent_count (integer) - 0
- last_reminder_sent (timestamp)
- customer_rating (integer) - 1-5
- customer_feedback (text)
- created_by (uuid, references users)
- created_at (timestamp)
- updated_at (timestamp)
```

### appointment_staff_assignments
Links appointments to staff members.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- appointment_id (uuid, references appointments)
- employee_id (uuid, references employees)
- role (text) - primary, assistant, consultant
- assigned_at (timestamp)
- assigned_by (uuid, references users)
- is_confirmed (boolean) - true
- notes (text)
```

### appointment_resource_bookings
Links appointments to resources.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- appointment_id (uuid, references appointments)
- resource_id (uuid, references appointment_resources)
- start_time (timestamp)
- end_time (timestamp)
- booking_status (text) - reserved, confirmed, in_use, released
- created_at (timestamp)
```

### appointment_reminders
Track reminder notifications sent to customers.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- appointment_id (uuid, references appointments)
- reminder_type (text) - sms, email, whatsapp
- scheduled_time (timestamp)
- sent_at (timestamp)
- status (text) - pending, sent, failed, cancelled
- recipient (text) - phone or email
- message_content (text)
- delivery_status (text) - delivered, failed, read
- error_message (text)
- retry_count (integer) - 0
- created_at (timestamp)
```

### appointment_availability_overrides
Special availability rules for specific dates.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- override_date (date)
- is_available (boolean) - false for holidays
- reason (text) - Public Holiday, Special Event
- custom_hours_start (time) - nullable
- custom_hours_end (time) - nullable
- created_by (uuid, references users)
- created_at (timestamp)
```

### appointment_blackout_periods
Block off times when appointments cannot be scheduled.

```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- start_datetime (timestamp)
- end_datetime (timestamp)
- reason (text) - Team Meeting, Maintenance, Event
- affects_all_staff (boolean) - true
- affected_employee_ids (uuid[]) - specific employees if not all
- created_by (uuid, references users)
- created_at (timestamp)
```

## Indexes for Performance

```sql
-- Critical indexes for appointment queries
CREATE INDEX idx_appointments_org_date ON appointments(organization_id, appointment_date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, start_time);
CREATE INDEX idx_staff_assignments_appointment ON appointment_staff_assignments(appointment_id);
CREATE INDEX idx_staff_assignments_employee ON appointment_staff_assignments(employee_id);
CREATE INDEX idx_resource_bookings_appointment ON appointment_resource_bookings(appointment_id);
CREATE INDEX idx_resource_bookings_resource ON appointment_resource_bookings(resource_id);
CREATE INDEX idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_reminders_status ON appointment_reminders(status, scheduled_time);
```

## RLS Policies

All tables will have RLS enabled with policies:
1. Users can only access data from their own organization
2. Role-based access:
   - Owners/Managers: Full access
   - Staff: View appointments assigned to them + create/update
   - Customers: View only their own appointments (future: customer portal)
3. Service role has full access for edge functions

## Integration Points

### With Existing Systems
- **customers**: Link appointments to customer profiles
- **employees**: Assign staff to appointments based on skills/availability
- **orders**: Link appointments to orders for workflow tracking
- **attendance_records**: Check staff availability from attendance system
- **customer_measurements**: Link measurement appointments to measurement records

### External Services
- SMS API: For appointment reminders
- Email Service: For appointment confirmations
- WhatsApp Business API: For WhatsApp notifications
