-- Appointment System - Initial Data Seed
-- Run this SQL to populate your appointment system with initial data

-- IMPORTANT: Replace 'YOUR_ORGANIZATION_ID' with your actual organization UUID
-- You can find it by running: SELECT id FROM organizations WHERE name = 'Your Business Name';

-- =====================================================
-- APPOINTMENT TYPES
-- =====================================================

INSERT INTO appointment_types (
  organization_id,
  type_name,
  description,
  duration_minutes,
  color_code,
  icon,
  price,
  deposit_required,
  requires_customer,
  requires_staff,
  requires_resources,
  skill_requirements,
  is_active,
  sort_order
) VALUES
-- Consultation
('YOUR_ORGANIZATION_ID', 'Consultation', 'Initial consultation to discuss design preferences and measurements', 30, '#3B82F6', 'message-square', 50.00, false, true, true, ARRAY['consultation_room'], ARRAY['designer', 'consultant'], true, 1),

-- Fitting
('YOUR_ORGANIZATION_ID', 'Fitting', 'Garment fitting session to ensure perfect fit', 45, '#10B981', 'scissors', 75.00, false, true, true, ARRAY['fitting_room'], ARRAY['tailor', 'fitter'], true, 2),

-- Measurement
('YOUR_ORGANIZATION_ID', 'Measurement', 'Complete body measurements for custom tailoring', 60, '#8B5CF6', 'ruler', 100.00, true, true, true, ARRAY['measurement_area'], ARRAY['tailor', 'measurement_specialist'], true, 3),

-- Alteration
('YOUR_ORGANIZATION_ID', 'Alteration', 'Clothing alteration and adjustment service', 30, '#F59E0B', 'edit', 80.00, false, true, true, ARRAY['fitting_room'], ARRAY['tailor'], true, 4),

-- Delivery
('YOUR_ORGANIZATION_ID', 'Delivery', 'Final garment delivery and quality check', 15, '#EF4444', 'package', 0.00, false, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[], true, 5),

-- Follow-up Fitting
('YOUR_ORGANIZATION_ID', 'Follow-up Fitting', 'Second or follow-up fitting after alterations', 30, '#EC4899', 'repeat', 50.00, false, true, true, ARRAY['fitting_room'], ARRAY['tailor'], true, 6),

-- Design Review
('YOUR_ORGANIZATION_ID', 'Design Review', 'Review fabric samples and design options', 45, '#6366F1', 'palette', 75.00, false, true, true, ARRAY['consultation_room'], ARRAY['designer'], true, 7),

-- Urgent Service
('YOUR_ORGANIZATION_ID', 'Urgent Service', 'Express service for urgent alterations or fittings', 20, '#DC2626', 'zap', 150.00, true, true, true, ARRAY['fitting_room'], ARRAY['tailor', 'senior_tailor'], true, 8)

ON CONFLICT (organization_id, type_name) DO UPDATE
SET 
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  color_code = EXCLUDED.color_code,
  price = EXCLUDED.price;

-- =====================================================
-- APPOINTMENT RESOURCES
-- =====================================================

INSERT INTO appointment_resources (
  organization_id,
  resource_name,
  resource_type,
  description,
  location,
  capacity,
  is_available,
  status,
  booking_priority
) VALUES
-- Fitting Rooms
('YOUR_ORGANIZATION_ID', 'Fitting Room 1', 'fitting_room', 'Private fitting room with mirror and lighting', 'Ground Floor', 1, true, 'available', 1),
('YOUR_ORGANIZATION_ID', 'Fitting Room 2', 'fitting_room', 'Large fitting room suitable for groups', 'Ground Floor', 2, true, 'available', 2),
('YOUR_ORGANIZATION_ID', 'Fitting Room 3', 'fitting_room', 'Premium fitting room with lounge area', 'First Floor', 1, true, 'available', 1),

-- Consultation Rooms
('YOUR_ORGANIZATION_ID', 'Consultation Room', 'consultation_room', 'Meeting room with fabric samples and design catalogs', 'First Floor', 4, true, 'available', 3),
('YOUR_ORGANIZATION_ID', 'VIP Consultation Suite', 'consultation_room', 'Luxury consultation room for VIP clients', 'First Floor', 2, true, 'available', 1),

-- Measurement Areas
('YOUR_ORGANIZATION_ID', 'Measurement Station 1', 'measurement_area', 'Dedicated measurement area with tools', 'Workshop Area', 1, true, 'available', 2),
('YOUR_ORGANIZATION_ID', 'Measurement Station 2', 'measurement_area', 'Secondary measurement station', 'Workshop Area', 1, true, 'available', 3),

-- Machines and Equipment
('YOUR_ORGANIZATION_ID', 'Industrial Sewing Machine 1', 'sewing_machine', 'Heavy-duty industrial sewing machine', 'Workshop Area', 1, true, 'available', 5),
('YOUR_ORGANIZATION_ID', 'Industrial Sewing Machine 2', 'sewing_machine', 'Standard industrial sewing machine', 'Workshop Area', 1, true, 'available', 5),
('YOUR_ORGANIZATION_ID', 'Embroidery Machine', 'embroidery_machine', 'Computerized embroidery machine', 'Workshop Area', 1, true, 'available', 4),
('YOUR_ORGANIZATION_ID', 'Overlock Machine', 'sewing_machine', 'Professional overlock finishing machine', 'Workshop Area', 1, true, 'available', 5),

-- Other Equipment
('YOUR_ORGANIZATION_ID', 'Cutting Table 1', 'cutting_table', 'Large fabric cutting and layout table', 'Workshop Area', 1, true, 'available', 6),
('YOUR_ORGANIZATION_ID', 'Cutting Table 2', 'cutting_table', 'Secondary cutting table', 'Workshop Area', 1, true, 'available', 7),
('YOUR_ORGANIZATION_ID', 'Steam Press Station', 'pressing_equipment', 'Professional steam pressing station', 'Workshop Area', 1, true, 'available', 5),
('YOUR_ORGANIZATION_ID', 'Iron Press', 'pressing_equipment', 'Industrial iron press for finishing', 'Workshop Area', 1, true, 'available', 6)

ON CONFLICT (organization_id, resource_name) DO UPDATE
SET 
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  is_available = EXCLUDED.is_available,
  status = EXCLUDED.status;

-- =====================================================
-- APPOINTMENT SETTINGS (Default Configuration)
-- =====================================================

INSERT INTO appointment_settings (
  organization_id,
  working_days,
  working_hours_start,
  working_hours_end,
  slot_duration_minutes,
  buffer_time_minutes,
  advance_booking_days,
  min_booking_notice_hours,
  max_appointments_per_slot,
  allow_customer_booking,
  require_deposit,
  deposit_percentage,
  cancellation_hours_notice,
  reminder_settings,
  timezone,
  currency
) VALUES
('YOUR_ORGANIZATION_ID', 
 ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], 
 '09:00:00', 
 '20:00:00', 
 60, 
 15, 
 30, 
 24, 
 3, 
 true, 
 false, 
 20.00, 
 24,
 '{
   "sms": {"enabled": true, "hours_before": [24, 2]},
   "email": {"enabled": true, "hours_before": [48, 24, 2]},
   "whatsapp": {"enabled": true, "hours_before": [24, 2]}
 }'::jsonb,
 'Asia/Dubai',
 'AED'
)
ON CONFLICT (organization_id) DO UPDATE
SET 
  working_days = EXCLUDED.working_days,
  working_hours_start = EXCLUDED.working_hours_start,
  working_hours_end = EXCLUDED.working_hours_end,
  slot_duration_minutes = EXCLUDED.slot_duration_minutes,
  buffer_time_minutes = EXCLUDED.buffer_time_minutes;

-- =====================================================
-- AVAILABILITY OVERRIDES (UAE Public Holidays 2025)
-- =====================================================

INSERT INTO appointment_availability_overrides (
  organization_id,
  override_date,
  is_available,
  reason
) VALUES
-- Major UAE Public Holidays 2025
('YOUR_ORGANIZATION_ID', '2025-01-01', false, 'New Year Day'),
('YOUR_ORGANIZATION_ID', '2025-03-29', false, 'Eid Al Fitr Holiday'),
('YOUR_ORGANIZATION_ID', '2025-03-30', false, 'Eid Al Fitr Holiday'),
('YOUR_ORGANIZATION_ID', '2025-03-31', false, 'Eid Al Fitr Holiday'),
('YOUR_ORGANIZATION_ID', '2025-06-06', false, 'Arafat Day'),
('YOUR_ORGANIZATION_ID', '2025-06-07', false, 'Eid Al Adha'),
('YOUR_ORGANIZATION_ID', '2025-06-08', false, 'Eid Al Adha Holiday'),
('YOUR_ORGANIZATION_ID', '2025-06-09', false, 'Eid Al Adha Holiday'),
('YOUR_ORGANIZATION_ID', '2025-06-27', false, 'Islamic New Year'),
('YOUR_ORGANIZATION_ID', '2025-09-05', false, 'Prophet Birthday'),
('YOUR_ORGANIZATION_ID', '2025-12-02', false, 'National Day'),
('YOUR_ORGANIZATION_ID', '2025-12-03', false, 'National Day Holiday')

ON CONFLICT (organization_id, override_date) DO UPDATE
SET 
  is_available = EXCLUDED.is_available,
  reason = EXCLUDED.reason;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check appointment types
-- SELECT type_name, duration_minutes, price FROM appointment_types WHERE organization_id = 'YOUR_ORGANIZATION_ID' ORDER BY sort_order;

-- Check resources
-- SELECT resource_name, resource_type, location, status FROM appointment_resources WHERE organization_id = 'YOUR_ORGANIZATION_ID' ORDER BY resource_type, resource_name;

-- Check settings
-- SELECT working_days, working_hours_start, working_hours_end FROM appointment_settings WHERE organization_id = 'YOUR_ORGANIZATION_ID';

-- Check holidays
-- SELECT override_date, reason FROM appointment_availability_overrides WHERE organization_id = 'YOUR_ORGANIZATION_ID' AND is_available = false ORDER BY override_date;

-- =====================================================
-- NOTES
-- =====================================================

/*
After running this seed data:

1. Update 'YOUR_ORGANIZATION_ID' with your actual organization UUID
2. Verify all data was inserted successfully using the verification queries
3. Adjust working hours and holidays based on your business needs
4. Add or remove appointment types as needed
5. Configure resources based on your actual physical setup
6. Test the appointment booking flow in the UI

To get your organization ID:
SELECT id, name FROM organizations;

To update a specific record:
UPDATE appointment_types 
SET price = 120.00 
WHERE organization_id = 'YOUR_ORGANIZATION_ID' AND type_name = 'Measurement';
*/
