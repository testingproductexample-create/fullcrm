// Create Appointment Reminders Edge Function
// Automatically creates reminder records for upcoming appointments based on settings

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    console.log('Starting reminder creation process...');

    // Get all organizations
    const orgsResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?select=*`, {
      headers
    });

    if (!orgsResponse.ok) {
      throw new Error('Failed to fetch organizations');
    }

    const organizations = await orgsResponse.json();
    let totalRemindersCreated = 0;

    // Process each organization
    for (const org of organizations) {
      try {
        // Get organization's appointment settings
        const settingsResponse = await fetch(
          `${supabaseUrl}/rest/v1/appointment_settings?organization_id=eq.${org.id}&select=*`,
          { headers }
        );

        if (!settingsResponse.ok) {
          console.log(`No settings found for organization ${org.id}, skipping...`);
          continue;
        }

        const settings = await settingsResponse.json();
        if (!settings || settings.length === 0) {
          console.log(`No settings configured for organization ${org.id}`);
          continue;
        }

        const orgSettings = settings[0];
        const reminderSettings = orgSettings.reminder_settings || {};

        // Get upcoming appointments (next 7 days)
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const appointmentsResponse = await fetch(
          `${supabaseUrl}/rest/v1/appointments?organization_id=eq.${org.id}&appointment_date=gte.${today.toISOString().split('T')[0]}&appointment_date=lte.${sevenDaysFromNow.toISOString().split('T')[0]}&status=in.(scheduled,confirmed)&select=*`,
          { headers }
        );

        if (!appointmentsResponse.ok) {
          console.error(`Failed to fetch appointments for org ${org.id}`);
          continue;
        }

        const appointments = await appointmentsResponse.json();
        console.log(`Processing ${appointments.length} appointments for organization ${org.id}`);

        // Process each appointment
        for (const appointment of appointments) {
          try {
            // Skip if no contact information
            if (!appointment.customer_phone && !appointment.customer_email) {
              console.log(`Skipping appointment ${appointment.id}: No contact information`);
              continue;
            }

            // Calculate appointment datetime
            const appointmentDate = new Date(appointment.appointment_date);
            const [hours, minutes] = appointment.start_time.split(':');
            appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const appointmentTime = appointmentDate.getTime();

            // Check existing reminders for this appointment
            const existingRemindersResponse = await fetch(
              `${supabaseUrl}/rest/v1/appointment_reminders?appointment_id=eq.${appointment.id}&select=id,reminder_type,scheduled_time`,
              { headers }
            );

            const existingReminders = existingRemindersResponse.ok 
              ? await existingRemindersResponse.json() 
              : [];

            const existingReminderTypes = new Set(existingReminders.map((r: any) => 
              `${r.reminder_type}-${r.scheduled_time}`
            ));

            const remindersToCreate = [];

            // Create SMS reminders
            if (reminderSettings.sms?.enabled && appointment.customer_phone) {
              const hoursBeforeList = reminderSettings.sms.hours_before || [24, 2];
              
              for (const hoursBefore of hoursBeforeList) {
                const reminderTime = new Date(appointmentTime - (hoursBefore * 60 * 60 * 1000));
                
                // Only create if reminder time is in the future and doesn't exist
                if (reminderTime.getTime() > Date.now()) {
                  const reminderKey = `sms-${reminderTime.toISOString()}`;
                  
                  if (!existingReminderTypes.has(reminderKey)) {
                    remindersToCreate.push({
                      organization_id: org.id,
                      appointment_id: appointment.id,
                      reminder_type: 'sms',
                      scheduled_time: reminderTime.toISOString(),
                      status: 'pending',
                      recipient: appointment.customer_phone,
                      message_content: `Appointment reminder: ${hoursBefore}h before your appointment`,
                      retry_count: 0
                    });
                  }
                }
              }
            }

            // Create Email reminders
            if (reminderSettings.email?.enabled && appointment.customer_email) {
              const hoursBeforeList = reminderSettings.email.hours_before || [48, 24, 2];
              
              for (const hoursBefore of hoursBeforeList) {
                const reminderTime = new Date(appointmentTime - (hoursBefore * 60 * 60 * 1000));
                
                if (reminderTime.getTime() > Date.now()) {
                  const reminderKey = `email-${reminderTime.toISOString()}`;
                  
                  if (!existingReminderTypes.has(reminderKey)) {
                    remindersToCreate.push({
                      organization_id: org.id,
                      appointment_id: appointment.id,
                      reminder_type: 'email',
                      scheduled_time: reminderTime.toISOString(),
                      status: 'pending',
                      recipient: appointment.customer_email,
                      message_content: `Appointment reminder: ${hoursBefore}h before your appointment`,
                      retry_count: 0
                    });
                  }
                }
              }
            }

            // Create WhatsApp reminders
            if (reminderSettings.whatsapp?.enabled && appointment.customer_phone) {
              const hoursBeforeList = reminderSettings.whatsapp.hours_before || [24, 2];
              
              for (const hoursBefore of hoursBeforeList) {
                const reminderTime = new Date(appointmentTime - (hoursBefore * 60 * 60 * 1000));
                
                if (reminderTime.getTime() > Date.now()) {
                  const reminderKey = `whatsapp-${reminderTime.toISOString()}`;
                  
                  if (!existingReminderTypes.has(reminderKey)) {
                    remindersToCreate.push({
                      organization_id: org.id,
                      appointment_id: appointment.id,
                      reminder_type: 'whatsapp',
                      scheduled_time: reminderTime.toISOString(),
                      status: 'pending',
                      recipient: appointment.customer_phone,
                      message_content: `Appointment reminder: ${hoursBefore}h before your appointment`,
                      retry_count: 0
                    });
                  }
                }
              }
            }

            // Batch insert reminders
            if (remindersToCreate.length > 0) {
              const insertResponse = await fetch(
                `${supabaseUrl}/rest/v1/appointment_reminders`,
                {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(remindersToCreate)
                }
              );

              if (insertResponse.ok) {
                totalRemindersCreated += remindersToCreate.length;
                console.log(`Created ${remindersToCreate.length} reminders for appointment ${appointment.appointment_number}`);
              } else {
                console.error(`Failed to create reminders for appointment ${appointment.id}`);
              }
            }

          } catch (error) {
            console.error(`Error processing appointment ${appointment.id}:`, error);
          }
        }

      } catch (error) {
        console.error(`Error processing organization ${org.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${totalRemindersCreated} reminders for ${organizations.length} organizations`,
        reminders_created: totalRemindersCreated
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-appointment-reminders function:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'FUNCTION_ERROR',
          message: error.message || 'Internal server error'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
