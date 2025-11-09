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
        const { supplierId } = await req.json();

        if (!supplierId) {
            throw new Error('Supplier ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch latest performance data
        const performanceResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_performance?supplier_id=eq.${supplierId}&order=evaluation_date.desc&limit=5&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const performanceRecords = await performanceResponse.json();

        // Calculate average performance metrics
        const avgOnTimeDelivery = performanceRecords.length > 0 
            ? performanceRecords.reduce((sum: number, p: any) => sum + (p.on_time_delivery_rate || 0), 0) / performanceRecords.length 
            : 0;

        const avgQualityRating = performanceRecords.length > 0 
            ? performanceRecords.reduce((sum: number, p: any) => sum + (p.quality_rating || 0), 0) / performanceRecords.length 
            : 0;

        const avgOrderAccuracy = performanceRecords.length > 0 
            ? performanceRecords.reduce((sum: number, p: any) => sum + (p.order_accuracy_rate || 0), 0) / performanceRecords.length 
            : 0;

        const avgCommunication = performanceRecords.length > 0 
            ? performanceRecords.reduce((sum: number, p: any) => sum + (p.communication_rating || 0), 0) / performanceRecords.length 
            : 0;

        // Fetch quality assessment data
        const qualityResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_quality?supplier_id=eq.${supplierId}&order=inspection_date.desc&limit=10&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const qualityRecords = await qualityResponse.json();

        // Calculate quality metrics
        const passedInspections = qualityRecords.filter((q: any) => q.passed === true).length;
        const qualityPassRate = qualityRecords.length > 0 ? (passedInspections / qualityRecords.length) * 100 : 0;

        // Fetch delivery data
        const deliveriesResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_deliveries?supplier_id=eq.${supplierId}&order=shipment_date.desc&limit=20&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const deliveries = await deliveriesResponse.json();

        // Calculate delivery metrics
        const onTimeDeliveries = deliveries.filter((d: any) => d.on_time === true).length;
        const deliveryRate = deliveries.length > 0 ? (onTimeDeliveries / deliveries.length) * 100 : 0;

        // Fetch compliance status
        const complianceResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_compliance?supplier_id=eq.${supplierId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const complianceRecords = await complianceResponse.json();

        // Calculate compliance score
        const compliantRecords = complianceRecords.filter((c: any) => c.compliance_status === 'compliant').length;
        const complianceScore = complianceRecords.length > 0 ? (compliantRecords / complianceRecords.length) * 10 : 5;

        // Calculate overall rating (weighted average)
        const weights = {
            delivery: 0.25,
            quality: 0.30,
            service: 0.20,
            compliance: 0.15,
            performance: 0.10
        };

        const deliveryRating = (deliveryRate / 10); // Convert to 0-10 scale
        const qualityRating = avgQualityRating * 2; // Already 0-5, convert to 0-10
        const serviceRating = avgCommunication * 2; // Already 0-5, convert to 0-10
        const performanceRating = performanceRecords.length > 0 
            ? performanceRecords.reduce((sum: number, p: any) => sum + (p.overall_score || 0), 0) / performanceRecords.length 
            : 5;

        const overallRating = (
            deliveryRating * weights.delivery +
            qualityRating * weights.quality +
            serviceRating * weights.service +
            complianceScore * weights.compliance +
            performanceRating * weights.performance
        );

        // Calculate individual ratings on 0-10 scale
        const calculatedRatings = {
            delivery_rating: Math.round(deliveryRating * 10) / 10,
            quality_rating: Math.round(qualityRating * 10) / 10,
            service_rating: Math.round(serviceRating * 10) / 10,
            overall_rating: Math.round(overallRating * 10) / 10
        };

        // Calculate total successful deliveries
        const totalDeliveries = deliveries.length;
        const successfulDeliveries = onTimeDeliveries;

        // Update supplier record with new ratings
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/suppliers?id=eq.${supplierId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                delivery_rating: calculatedRatings.delivery_rating,
                quality_rating: calculatedRatings.quality_rating,
                service_rating: calculatedRatings.service_rating,
                overall_rating: calculatedRatings.overall_rating,
                total_orders: totalDeliveries,
                successful_deliveries: successfulDeliveries
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update supplier ratings: ${errorText}`);
        }

        const updatedSupplier = await updateResponse.json();

        return new Response(JSON.stringify({ 
            data: {
                supplierId,
                ratings: calculatedRatings,
                metrics: {
                    avgOnTimeDelivery: Math.round(avgOnTimeDelivery * 100) / 100,
                    avgQualityRating: Math.round(avgQualityRating * 100) / 100,
                    qualityPassRate: Math.round(qualityPassRate * 100) / 100,
                    deliveryRate: Math.round(deliveryRate * 100) / 100,
                    complianceScore: Math.round(complianceScore * 100) / 100,
                    totalDeliveries,
                    successfulDeliveries,
                    totalQualityInspections: qualityRecords.length,
                    passedInspections
                },
                updated: true,
                supplier: updatedSupplier[0]
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Rating update error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'RATING_UPDATE_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
