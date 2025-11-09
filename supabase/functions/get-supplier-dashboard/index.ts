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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch total suppliers count
        const suppliersResponse = await fetch(`${supabaseUrl}/rest/v1/suppliers?select=count`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        });

        const suppliersCount = suppliersResponse.headers.get('content-range')?.split('/')[1] || '0';

        // Fetch active suppliers
        const activeSuppliersResponse = await fetch(`${supabaseUrl}/rest/v1/suppliers?select=count&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        });

        const activeSuppliersCount = activeSuppliersResponse.headers.get('content-range')?.split('/')[1] || '0';

        // Fetch pending orders count
        const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/procurement_orders?select=count&order_status=eq.pending`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        });

        const pendingOrdersCount = ordersResponse.headers.get('content-range')?.split('/')[1] || '0';

        // Fetch active deliveries count
        const deliveriesResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_deliveries?select=count&delivery_status=in.(pending,in_transit)`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        });

        const activeDeliveriesCount = deliveriesResponse.headers.get('content-range')?.split('/')[1] || '0';

        // Fetch active alerts count
        const alertsResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_alerts?select=count&status=eq.active`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        });

        const activeAlertsCount = alertsResponse.headers.get('content-range')?.split('/')[1] || '0';

        // Fetch recent performance data
        const performanceResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_performance?select=*&order=evaluation_date.desc&limit=10`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const performanceData = await performanceResponse.json();

        // Fetch recent deliveries
        const recentDeliveriesResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_deliveries?select=*&order=created_at.desc&limit=5`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const recentDeliveries = await recentDeliveriesResponse.json();

        // Calculate average performance metrics
        const avgOnTimeDelivery = performanceData.length > 0 
            ? performanceData.reduce((sum: number, p: any) => sum + (p.on_time_delivery_rate || 0), 0) / performanceData.length 
            : 0;

        const avgQualityRating = performanceData.length > 0 
            ? performanceData.reduce((sum: number, p: any) => sum + (p.quality_rating || 0), 0) / performanceData.length 
            : 0;

        const dashboardData = {
            totals: {
                suppliers: parseInt(suppliersCount),
                activeSuppliers: parseInt(activeSuppliersCount),
                pendingOrders: parseInt(pendingOrdersCount),
                activeDeliveries: parseInt(activeDeliveriesCount),
                activeAlerts: parseInt(activeAlertsCount)
            },
            performance: {
                avgOnTimeDelivery: Math.round(avgOnTimeDelivery * 100) / 100,
                avgQualityRating: Math.round(avgQualityRating * 100) / 100,
                recentEvaluations: performanceData
            },
            recentDeliveries
        };

        return new Response(JSON.stringify({ data: dashboardData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Dashboard error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'DASHBOARD_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
