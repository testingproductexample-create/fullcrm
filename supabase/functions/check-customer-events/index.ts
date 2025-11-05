Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch active events that need reminders
    const eventsResponse = await fetch(`${supabaseUrl}/rest/v1/customer_events?is_active=eq.true&select=*,customers(id,full_name,email,phone,organization_id)`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch events');
    }

    const events = await eventsResponse.json();
    const remindersToSend = [];

    // Check each event
    for (const event of events) {
      const eventDate = new Date(event.event_date);
      const lastReminded = event.last_reminded ? new Date(event.last_reminded) : null;
      
      // Calculate days until event
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if we need to send a reminder
      if (event.reminder_days_before && event.reminder_days_before.includes(daysUntil)) {
        // Check if we haven't reminded today
        if (!lastReminded || lastReminded.toISOString().split('T')[0] !== todayStr) {
          remindersToSend.push({
            event_id: event.id,
            customer_id: event.customer_id,
            customer_name: event.customers.full_name,
            customer_email: event.customers.email,
            customer_phone: event.customers.phone,
            organization_id: event.customers.organization_id,
            event_type: event.event_type,
            event_date: event.event_date,
            days_until: daysUntil
          });

          // Update last_reminded date
          await fetch(`${supabaseUrl}/rest/v1/customer_events?id=eq.${event.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              last_reminded: todayStr
            })
          });
        }
      }
    }

    // Log communications for reminders sent
    for (const reminder of remindersToSend) {
      const message = `Reminder: ${reminder.customer_name}'s ${reminder.event_type} is in ${reminder.days_until} day(s) on ${reminder.event_date}`;
      
      await fetch(`${supabaseUrl}/rest/v1/customer_communications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          organization_id: reminder.organization_id,
          customer_id: reminder.customer_id,
          communication_type: 'Email',
          direction: 'Outbound',
          subject: `${reminder.event_type} Reminder`,
          message: message,
          status: 'Sent'
        })
      });
    }

    return new Response(JSON.stringify({
      success: true,
      reminders_sent: remindersToSend.length,
      reminders: remindersToSend
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Event check error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'EVENT_CHECK_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
