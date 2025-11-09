Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { supplierId, periodStart, periodEnd } = await req.json();

        if (!supplierId) {
            throw new Error('Supplier ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch supplier deliveries for the period
        let deliveriesUrl = `${supabaseUrl}/rest/v1/supplier_deliveries?supplier_id=eq.${supplierId}&select=*`;
        if (periodStart && periodEnd) {
            deliveriesUrl += `&shipment_date=gte.${periodStart}&shipment_date=lte.${periodEnd}`;
        }

        const deliveriesResponse = await fetch(deliveriesUrl, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const deliveries = await deliveriesResponse.json();

        // Fetch quality assessments for the period
        let qualityUrl = `${supabaseUrl}/rest/v1/supplier_quality?supplier_id=eq.${supplierId}&select=*`;
        if (periodStart && periodEnd) {
            qualityUrl += `&inspection_date=gte.${periodStart}&inspection_date=lte.${periodEnd}`;
        }

        const qualityResponse = await fetch(qualityUrl, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const qualityRecords = await qualityResponse.json();

        // Calculate on-time delivery rate
        const totalDeliveries = deliveries.length;
        const onTimeDeliveries = deliveries.filter((d: any) => d.on_time === true).length;
        const onTimeDeliveryRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

        // Calculate average delay for late deliveries
        const lateDeliveries = deliveries.filter((d: any) => d.delay_days && d.delay_days > 0);
        const avgDelayDays = lateDeliveries.length > 0 
            ? lateDeliveries.reduce((sum: number, d: any) => sum + (d.delay_days || 0), 0) / lateDeliveries.length 
            : 0;

        // Calculate quality rating
        const totalQualityRecords = qualityRecords.length;
        const avgQualityScore = totalQualityRecords > 0 
            ? qualityRecords.reduce((sum: number, q: any) => sum + (q.quality_score || 0), 0) / totalQualityRecords 
            : 0;

        // Calculate defect rate
        const avgDefectRate = totalQualityRecords > 0 
            ? qualityRecords.reduce((sum: number, q: any) => sum + (q.defect_rate || 0), 0) / totalQualityRecords 
            : 0;

        // Calculate pass rate
        const passedInspections = qualityRecords.filter((q: any) => q.passed === true).length;
        const qualityPassRate = totalQualityRecords > 0 ? (passedInspections / totalQualityRecords) * 100 : 0;

        // Calculate order accuracy (mock for now, would need order data)
        const orderAccuracyRate = 95.0; // Placeholder

        // Calculate overall score (weighted average)
        const weights = {
            onTimeDelivery: 0.30,
            quality: 0.35,
            orderAccuracy: 0.20,
            communication: 0.15
        };

        const overallScore = (
            (onTimeDeliveryRate * weights.onTimeDelivery) +
            (avgQualityScore * 20 * weights.quality) + // Convert to percentage
            (orderAccuracyRate * weights.orderAccuracy) +
            (85 * weights.communication) // Placeholder for communication rating
        ) / 100;

        const performanceData = {
            onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
            avgDelayDays: Math.round(avgDelayDays * 10) / 10,
            qualityRating: Math.round(avgQualityScore * 100) / 100,
            avgDefectRate: Math.round(avgDefectRate * 100) / 100,
            qualityPassRate: Math.round(qualityPassRate * 100) / 100,
            orderAccuracyRate: Math.round(orderAccuracyRate * 100) / 100,
            communicationRating: 4.25, // Placeholder
            overallScore: Math.round(overallScore * 100) / 100,
            totalDeliveries,
            totalQualityInspections: totalQualityRecords,
            periodStart: periodStart || 'All time',
            periodEnd: periodEnd || 'Current'
        };

        // Insert performance record
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_performance`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                supplier_id: supplierId,
                evaluation_date: new Date().toISOString().split('T')[0],
                on_time_delivery_rate: performanceData.onTimeDeliveryRate,
                quality_rating: performanceData.qualityRating,
                order_accuracy_rate: performanceData.orderAccuracyRate,
                communication_rating: performanceData.communicationRating,
                defect_rate: performanceData.avgDefectRate,
                overall_score: performanceData.overallScore,
                period_start: periodStart || null,
                period_end: periodEnd || null
            })
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Failed to insert performance record:', errorText);
        }

        return new Response(JSON.stringify({ data: performanceData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Performance evaluation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'EVALUATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
