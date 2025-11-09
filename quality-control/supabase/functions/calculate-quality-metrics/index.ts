Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { start_date, end_date } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const today = new Date().toISOString().split('T')[0];
        const dateFilter = start_date && end_date 
            ? `gte.${start_date}&inspection_date=lte.${end_date}`
            : `eq.${today}`;

        // Fetch inspections data
        const inspectionsResponse = await fetch(
            `${supabaseUrl}/rest/v1/quality_inspections?inspection_date=${dateFilter}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!inspectionsResponse.ok) {
            throw new Error('Failed to fetch inspections');
        }

        const inspections = await inspectionsResponse.json();

        // Fetch defects data
        const defectsResponse = await fetch(
            `${supabaseUrl}/rest/v1/defects?detected_at=${dateFilter}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!defectsResponse.ok) {
            throw new Error('Failed to fetch defects');
        }

        const defects = await defectsResponse.json();

        // Calculate metrics
        const totalInspections = inspections.length;
        const passedInspections = inspections.filter(i => i.passed === true).length;
        const failedInspections = totalInspections - passedInspections;
        
        const firstPassRate = totalInspections > 0 
            ? (passedInspections / totalInspections) * 100 
            : 0;

        const totalDefects = defects.length;
        const criticalDefects = defects.filter(d => d.severity === 'critical').length;
        const majorDefects = defects.filter(d => d.severity === 'major').length;
        const minorDefects = defects.filter(d => d.severity === 'minor').length;

        const defectRate = totalInspections > 0 
            ? (totalDefects / totalInspections) * 100 
            : 0;

        const avgQualityScore = inspections.length > 0
            ? inspections.reduce((sum, i) => sum + (parseFloat(i.total_score) || 0), 0) / inspections.length
            : 0;

        // Calculate defect resolution rate
        const resolvedDefects = defects.filter(d => d.status === 'resolved').length;
        const defectResolutionRate = totalDefects > 0 
            ? (resolvedDefects / totalDefects) * 100 
            : 0;

        // Group defects by category
        const defectsByCategory = {};
        defects.forEach(d => {
            const category = d.defect_category || 'Unknown';
            if (!defectsByCategory[category]) {
                defectsByCategory[category] = 0;
            }
            defectsByCategory[category]++;
        });

        // Insert metrics into database
        const metricsToInsert = [
            {
                metric_date: today,
                metric_type: 'inspection',
                metric_name: 'Total Inspections',
                metric_value: totalInspections,
                metric_unit: 'count',
                category: 'quality',
                status: 'active'
            },
            {
                metric_date: today,
                metric_type: 'inspection',
                metric_name: 'First Pass Rate',
                metric_value: firstPassRate.toFixed(2),
                target_value: 95.00,
                metric_unit: 'percentage',
                category: 'quality',
                trend: firstPassRate >= 95 ? 'positive' : 'negative',
                status: 'active'
            },
            {
                metric_date: today,
                metric_type: 'defect',
                metric_name: 'Total Defects',
                metric_value: totalDefects,
                metric_unit: 'count',
                category: 'quality',
                status: 'active'
            },
            {
                metric_date: today,
                metric_type: 'defect',
                metric_name: 'Defect Rate',
                metric_value: defectRate.toFixed(2),
                target_value: 5.00,
                metric_unit: 'percentage',
                category: 'quality',
                trend: defectRate <= 5 ? 'positive' : 'negative',
                status: 'active'
            },
            {
                metric_date: today,
                metric_type: 'quality',
                metric_name: 'Average Quality Score',
                metric_value: avgQualityScore.toFixed(2),
                target_value: 90.00,
                metric_unit: 'score',
                category: 'quality',
                trend: avgQualityScore >= 90 ? 'positive' : 'negative',
                status: 'active'
            },
            {
                metric_date: today,
                metric_type: 'defect',
                metric_name: 'Defect Resolution Rate',
                metric_value: defectResolutionRate.toFixed(2),
                target_value: 90.00,
                metric_unit: 'percentage',
                category: 'quality',
                trend: defectResolutionRate >= 90 ? 'positive' : 'negative',
                status: 'active'
            }
        ];

        const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/quality_metrics`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(metricsToInsert)
        });

        if (!metricsResponse.ok) {
            const errorText = await metricsResponse.text();
            console.error('Failed to insert metrics:', errorText);
        }

        return new Response(JSON.stringify({
            data: {
                summary: {
                    totalInspections,
                    passedInspections,
                    failedInspections,
                    firstPassRate: firstPassRate.toFixed(2),
                    totalDefects,
                    criticalDefects,
                    majorDefects,
                    minorDefects,
                    defectRate: defectRate.toFixed(2),
                    avgQualityScore: avgQualityScore.toFixed(2),
                    defectResolutionRate: defectResolutionRate.toFixed(2),
                    defectsByCategory
                },
                message: 'Quality metrics calculated successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Calculate metrics error:', error);

        const errorResponse = {
            error: {
                code: 'METRICS_CALCULATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
