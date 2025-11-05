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
      throw new Error('Missing Supabase environment variables');
    }

    // Fetch all active automation rules
    const rulesResponse = await fetch(`${supabaseUrl}/rest/v1/automation_rules?is_active=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!rulesResponse.ok) {
      throw new Error('Failed to fetch automation rules');
    }

    const rules = await rulesResponse.json();
    const processedRules = [];
    const notifications = [];

    for (const rule of rules) {
      // Process time-based rules (delay alerts)
      if (rule.rule_type === 'time_based') {
        const thresholdHours = rule.trigger_conditions?.threshold_hours || 48;
        const cutoffTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();

        // Find orders stuck in statuses for too long
        const statusesResponse = await fetch(
          `${supabaseUrl}/rest/v1/order_workflow_statuses?entered_at=lt.${cutoffTime}&completed_at=is.null&organization_id=eq.${rule.organization_id}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (statusesResponse.ok) {
          const delayedOrders = await statusesResponse.json();
          
          for (const orderStatus of delayedOrders) {
            // Create notification for each delayed order
            const message = rule.rule_configuration.message?.replace('{status}', orderStatus.current_status) || 
                          `Order delayed in ${orderStatus.current_status}`;
            
            notifications.push({
              type: 'delay_alert',
              order_id: orderStatus.order_id,
              status: orderStatus.current_status,
              message: message,
              hours_delayed: Math.floor((Date.now() - new Date(orderStatus.entered_at).getTime()) / (1000 * 60 * 60))
            });
          }
        }
      }

      // Process status change rules (auto notifications on milestone statuses)
      if (rule.rule_type === 'status_change') {
        const milestoneStatuses = rule.trigger_conditions?.statuses || [];
        
        // Find recent status changes (in last 5 minutes) matching milestone statuses
        const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const recentStatusesResponse = await fetch(
          `${supabaseUrl}/rest/v1/order_workflow_statuses?entered_at=gte.${recentTime}&organization_id=eq.${rule.organization_id}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (recentStatusesResponse.ok) {
          const recentStatuses = await recentStatusesResponse.json();
          
          for (const orderStatus of recentStatuses) {
            if (milestoneStatuses.includes(orderStatus.current_status)) {
              notifications.push({
                type: 'milestone_update',
                order_id: orderStatus.order_id,
                status: orderStatus.current_status,
                message: `Order reached milestone: ${orderStatus.current_status}`,
                channels: rule.rule_configuration.channels || ['sms']
              });
            }
          }
        }
      }

      processedRules.push({
        rule_id: rule.id,
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        processed: true
      });
    }

    // Log workflow automation results
    console.log(`Processed ${processedRules.length} automation rules`);
    console.log(`Generated ${notifications.length} notifications`);

    return new Response(JSON.stringify({
      success: true,
      processed_rules: processedRules.length,
      notifications_generated: notifications.length,
      notifications: notifications,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Workflow automation error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'WORKFLOW_AUTOMATION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
