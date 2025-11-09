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
            inspection_id,
            order_id,
            order_number,
            garment_type,
            defect_category,
            defect_type,
            severity,
            description,
            location_on_garment,
            detected_by,
            photos,
            root_cause,
            preventive_action
        } = await req.json();

        if (!defect_category || !defect_type || !severity || !description || !detected_by) {
            throw new Error('Missing required fields');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Generate defect number
        const timestamp = Date.now();
        const defect_number = `DEF-${timestamp}`;

        // Create defect record
        const defectResponse = await fetch(`${supabaseUrl}/rest/v1/defects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                defect_number,
                inspection_id,
                order_id,
                order_number,
                garment_type,
                defect_category,
                defect_type,
                severity,
                description,
                location_on_garment,
                detected_by,
                photos: photos || null,
                root_cause: root_cause || null,
                preventive_action: preventive_action || null,
                status: 'open'
            })
        });

        if (!defectResponse.ok) {
            const errorText = await defectResponse.text();
            throw new Error(`Failed to create defect: ${errorText}`);
        }

        const defectData = await defectResponse.json();

        // If severity is critical, create a quality issue automatically
        if (severity === 'critical') {
            const issueResponse = await fetch(`${supabaseUrl}/rest/v1/quality_issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    issue_number: `ISS-${timestamp}`,
                    title: `Critical Defect: ${defect_type}`,
                    description: description,
                    issue_type: 'defect',
                    category: defect_category,
                    severity: 'critical',
                    priority: 'high',
                    source: 'quality_inspection',
                    order_id,
                    order_number,
                    reported_by: detected_by,
                    status: 'open',
                    photos: photos || null
                })
            });

            if (!issueResponse.ok) {
                console.error('Failed to create quality issue for critical defect');
            }
        }

        return new Response(JSON.stringify({
            data: {
                defect: defectData[0],
                message: 'Defect recorded successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit defect error:', error);

        const errorResponse = {
            error: {
                code: 'DEFECT_SUBMISSION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
