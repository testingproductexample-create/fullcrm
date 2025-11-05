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
    const { organization_id, customer_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Fetch customer data
    let customerQuery = `${supabaseUrl}/rest/v1/customers?select=*`;
    if (customer_id) {
      customerQuery += `&id=eq.${customer_id}`;
    } else if (organization_id) {
      customerQuery += `&organization_id=eq.${organization_id}`;
    }

    const customersResponse = await fetch(customerQuery, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!customersResponse.ok) {
      throw new Error('Failed to fetch customers');
    }

    const customers = await customersResponse.json();
    const updatedCustomers = [];

    // Update each customer's analytics
    for (const customer of customers) {
      // Calculate loyalty tier based on total spent
      let newTier = 'Bronze';
      const totalSpent = parseFloat(customer.total_spent || 0);
      
      if (totalSpent >= 50000) {
        newTier = 'Platinum';
      } else if (totalSpent >= 20000) {
        newTier = 'Gold';
      } else if (totalSpent >= 5000) {
        newTier = 'Silver';
      }

      // Calculate loyalty points (1 point per AED spent by default)
      const calculatedPoints = Math.floor(totalSpent);

      // Update customer
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/customers?id=eq.${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          loyalty_tier: newTier,
          loyalty_points: customer.loyalty_points || calculatedPoints,
          updated_at: new Date().toISOString()
        })
      });

      if (updateResponse.ok) {
        const updated = await updateResponse.json();
        updatedCustomers.push(updated[0]);
      }
    }

    // Update dynamic segments
    const segmentsResponse = await fetch(`${supabaseUrl}/rest/v1/customer_segmentation?is_dynamic=eq.true&select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (segmentsResponse.ok) {
      const segments = await segmentsResponse.json();

      for (const segment of segments) {
        // Build query based on criteria
        let criteriaQuery = `${supabaseUrl}/rest/v1/customers?select=id,organization_id`;
        
        if (segment.criteria) {
          // Example criteria handling
          if (segment.criteria.classification) {
            criteriaQuery += `&classification=eq.${segment.criteria.classification}`;
          }
          if (segment.criteria.min_total_spent) {
            criteriaQuery += `&total_spent=gte.${segment.criteria.min_total_spent}`;
          }
          if (segment.criteria.loyalty_tier) {
            criteriaQuery += `&loyalty_tier=eq.${segment.criteria.loyalty_tier}`;
          }
        }

        const segmentCustomersResponse = await fetch(criteriaQuery, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });

        if (segmentCustomersResponse.ok) {
          const segmentCustomers = await segmentCustomersResponse.json();

          // Delete existing members
          await fetch(`${supabaseUrl}/rest/v1/customer_segment_members?segment_id=eq.${segment.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            }
          });

          // Insert new members
          if (segmentCustomers.length > 0) {
            const members = segmentCustomers.map(c => ({
              organization_id: c.organization_id,
              segment_id: segment.id,
              customer_id: c.id
            }));

            await fetch(`${supabaseUrl}/rest/v1/customer_segment_members`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(members)
            });

            // Update segment count
            await fetch(`${supabaseUrl}/rest/v1/customer_segmentation?id=eq.${segment.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customer_count: segmentCustomers.length,
                last_calculated: new Date().toISOString()
              })
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      customers_updated: updatedCustomers.length,
      message: 'Customer analytics updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analytics update error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'ANALYTICS_UPDATE_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
