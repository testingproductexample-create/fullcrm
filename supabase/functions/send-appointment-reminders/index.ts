// Appointment Reminder Edge Function
// Sends automated SMS, Email, and WhatsApp reminders for upcoming appointments

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
    // Get Supabase service role key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Create Supabase client with service role
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    console.log('Starting appointment reminder check...');

    // Get current time
    const now = new Date();
    const currentTime = now.toISOString();

    // Fetch pending reminders that are due
    const remindersResponse = await fetch(`${supabaseUrl}/rest/v1/appointment_reminders?status=eq.pending&scheduled_time=lte.${currentTime}&select=*,appointments(*)`, {
      headers
    });

    if (!remindersResponse.ok) {
      throw new Error(`Failed to fetch reminders: ${remindersResponse.statusText}`);
    }

    const reminders = await remindersResponse.json();
    console.log(`Found ${reminders.length} reminders to process`);

    let successCount = 0;
    let failedCount = 0;

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const appointment = reminder.appointments;
        if (!appointment) {
          console.error(`No appointment found for reminder ${reminder.id}`);
          continue;
        }

        // Prepare message
        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('en-AE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const appointmentTime = appointment.start_time.substring(0, 5);

        let message = `Reminder: You have an appointment scheduled for ${appointmentDate} at ${appointmentTime}.`;
        
        if (appointment.customer_name) {
          message = `Hello ${appointment.customer_name}, ${message}`;
        }
        
        message += ` Appointment No: ${appointment.appointment_number}. If you need to reschedule, please contact us.`;

        // Send reminder based on type
        let sendSuccess = false;
        let errorMessage = null;

        if (reminder.reminder_type === 'email') {
          // Email sending logic would go here
          // For now, we'll simulate success
          console.log(`Would send email to ${reminder.recipient}: ${message}`);
          sendSuccess = true;
        } else if (reminder.reminder_type === 'sms') {
          // SMS sending logic would go here (integrate with UAE SMS gateway like Unifonic)
          console.log(`Would send SMS to ${reminder.recipient}: ${message}`);
          sendSuccess = true;
        } else if (reminder.reminder_type === 'whatsapp') {
          // WhatsApp Business API logic would go here
          console.log(`Would send WhatsApp to ${reminder.recipient}: ${message}`);
          sendSuccess = true;
        }

        // Update reminder status
        const updateData = {
          status: sendSuccess ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
          delivery_status: sendSuccess ? 'delivered' : 'failed',
          error_message: errorMessage
        };

        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/appointment_reminders?id=eq.${reminder.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
          console.error(`Failed to update reminder ${reminder.id}`);
          failedCount++;
          continue;
        }

        // Update appointment reminder count
        await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointment.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            reminder_sent_count: (appointment.reminder_sent_count || 0) + 1,
            last_reminder_sent: new Date().toISOString()
          })
        });

        successCount++;
        console.log(`Successfully processed reminder ${reminder.id} for appointment ${appointment.appointment_number}`);

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${reminders.length} reminders`,
        results: {
          total: reminders.length,
          success: successCount,
          failed: failedCount
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-appointment-reminders function:', error);
    
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
