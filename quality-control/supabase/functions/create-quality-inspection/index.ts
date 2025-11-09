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
        const {
            order_id,
            order_number,
            garment_type,
            inspection_stage,
            checklist_id,
            inspector_id,
            inspection_items
        } = await req.json();

        if (!garment_type || !inspection_stage || !checklist_id || !inspector_id) {
            throw new Error('Missing required fields');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Generate inspection number
        const timestamp = Date.now();
        const inspection_number = `INS-${timestamp}`;

        // Calculate total score
        let total_points_earned = 0;
        let total_points_possible = 0;
        let defects_found = 0;
        let critical_defects = 0;

        if (inspection_items && Array.isArray(inspection_items)) {
            inspection_items.forEach(item => {
                total_points_earned += item.points_earned || 0;
                total_points_possible += item.points_possible || 1;
                
                if (item.result === 'fail') {
                    defects_found++;
                    if (item.severity === 'critical') {
                        critical_defects++;
                    }
                }
            });
        }

        const total_score = total_points_possible > 0 
            ? (total_points_earned / total_points_possible) * 100 
            : 0;

        // Determine if passed (based on inspection stage)
        let passing_threshold = 90; // final inspection default
        if (inspection_stage === 'pre-production') {
            passing_threshold = 85;
        } else if (inspection_stage === 'in-process') {
            passing_threshold = 85;
        }

        const passed = total_score >= passing_threshold && critical_defects === 0;

        // Create inspection record
        const inspectionResponse = await fetch(`${supabaseUrl}/rest/v1/quality_inspections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                inspection_number,
                order_id,
                order_number,
                garment_type,
                inspection_stage,
                checklist_id,
                inspector_id,
                total_score: total_score.toFixed(2),
                passed,
                defects_found,
                critical_defects,
                status: passed ? 'passed' : 'failed',
                completed_at: new Date().toISOString()
            })
        });

        if (!inspectionResponse.ok) {
            const errorText = await inspectionResponse.text();
            throw new Error(`Failed to create inspection: ${errorText}`);
        }

        const inspectionData = await inspectionResponse.json();
        const inspection_id = inspectionData[0].id;

        // Insert inspection items if provided
        if (inspection_items && Array.isArray(inspection_items) && inspection_items.length > 0) {
            const itemsToInsert = inspection_items.map(item => ({
                inspection_id,
                checklist_item_id: item.checklist_item_id,
                checkpoint_name: item.checkpoint_name,
                result: item.result,
                points_earned: item.points_earned || 0,
                points_possible: item.points_possible || 1,
                notes: item.notes || '',
                photos: item.photos || null
            }));

            const itemsResponse = await fetch(`${supabaseUrl}/rest/v1/quality_inspection_items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(itemsToInsert)
            });

            if (!itemsResponse.ok) {
                const errorText = await itemsResponse.text();
                console.error('Failed to insert inspection items:', errorText);
            }
        }

        return new Response(JSON.stringify({
            data: {
                inspection: inspectionData[0],
                message: 'Quality inspection created successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create inspection error:', error);

        const errorResponse = {
            error: {
                code: 'INSPECTION_CREATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
