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

    // Fetch all workflow statuses
    const statusesResponse = await fetch(`${supabaseUrl}/rest/v1/order_workflow_statuses?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statusesResponse.ok) {
      throw new Error('Failed to fetch workflow statuses');
    }

    const allStatuses = await statusesResponse.json();

    // Group by organization and status to calculate metrics
    const statusMetrics = {};

    for (const status of allStatuses) {
      const key = `${status.organization_id}_${status.current_status}`;
      
      if (!statusMetrics[key]) {
        statusMetrics[key] = {
          organization_id: status.organization_id,
          workflow_id: status.workflow_id,
          status: status.current_status,
          total_orders: 0,
          completed_orders: 0,
          total_duration: 0,
          active_orders: 0
        };
      }

      statusMetrics[key].total_orders++;

      if (status.completed_at) {
        statusMetrics[key].completed_orders++;
        const duration = new Date(status.completed_at).getTime() - new Date(status.entered_at).getTime();
        statusMetrics[key].total_duration += duration;
      } else {
        statusMetrics[key].active_orders++;
      }
    }

    // Calculate analytics and bottleneck scores
    const analyticsUpdates = [];

    for (const key in statusMetrics) {
      const metrics = statusMetrics[key];
      
      // Calculate average completion time in hours
      const avgCompletionTime = metrics.completed_orders > 0 
        ? Math.round(metrics.total_duration / metrics.completed_orders / (1000 * 60 * 60))
        : 0;

      // Calculate bottleneck score (0-100)
      // Higher score = more of a bottleneck
      // Factors: active orders count, average time, completion rate
      const completionRate = metrics.total_orders > 0 ? metrics.completed_orders / metrics.total_orders : 0;
      const activeOrdersWeight = Math.min(metrics.active_orders / 10, 1); // Normalize to 0-1
      const timeWeight = Math.min(avgCompletionTime / 72, 1); // Normalize: 72 hours = max
      const completionWeight = 1 - completionRate;

      const bottleneckScore = Math.round(
        (activeOrdersWeight * 40 + timeWeight * 30 + completionWeight * 30)
      );

      // Calculate efficiency rating (0-100)
      // Higher = more efficient
      const efficiencyRating = Math.max(0, Math.min(100, 
        100 - (timeWeight * 50) - (activeOrdersWeight * 30) - (completionWeight * 20)
      ));

      analyticsUpdates.push({
        organization_id: metrics.organization_id,
        workflow_id: metrics.workflow_id,
        status: metrics.status,
        average_completion_time: avgCompletionTime,
        bottleneck_score: bottleneckScore.toFixed(2),
        efficiency_rating: efficiencyRating.toFixed(2),
        performance_metrics: {
          total_orders: metrics.total_orders,
          completed_orders: metrics.completed_orders,
          active_orders: metrics.active_orders,
          completion_rate: (completionRate * 100).toFixed(2) + '%',
          avg_time_hours: avgCompletionTime
        },
        last_calculated: new Date().toISOString()
      });
    }

    // Delete old analytics
    await fetch(`${supabaseUrl}/rest/v1/workflow_analytics`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    // Insert new analytics
    if (analyticsUpdates.length > 0) {
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/workflow_analytics`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(analyticsUpdates)
      });

      if (!insertResponse.ok) {
        throw new Error('Failed to insert analytics');
      }
    }

    console.log(`Calculated analytics for ${analyticsUpdates.length} workflow statuses`);

    return new Response(JSON.stringify({
      success: true,
      analytics_calculated: analyticsUpdates.length,
      bottlenecks_identified: analyticsUpdates.filter(a => parseFloat(a.bottleneck_score) > 50).length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Workflow analytics error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'WORKFLOW_ANALYTICS_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
