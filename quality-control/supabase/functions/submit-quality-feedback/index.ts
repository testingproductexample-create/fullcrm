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
            feedback_type,
            source,
            order_id,
            order_number,
            customer_id,
            customer_name,
            employee_id,
            employee_name,
            rating,
            category,
            subject,
            feedback_text,
            quality_aspects,
            improvement_suggestions
        } = await req.json();

        if (!feedback_type || !source || !feedback_text) {
            throw new Error('Missing required fields');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Determine sentiment based on rating
        let sentiment = 'neutral';
        if (rating) {
            if (rating >= 4) sentiment = 'positive';
            else if (rating <= 2) sentiment = 'negative';
        }

        // Determine priority based on sentiment and source
        let priority = 'normal';
        if (sentiment === 'negative' || source === 'complaint') {
            priority = 'high';
        }

        // Create feedback record
        const feedbackResponse = await fetch(`${supabaseUrl}/rest/v1/quality_feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                feedback_type,
                source,
                order_id,
                order_number,
                customer_id,
                customer_name,
                employee_id,
                employee_name,
                rating,
                category,
                subject,
                feedback_text,
                quality_aspects: quality_aspects || null,
                improvement_suggestions,
                sentiment,
                priority,
                status: 'received',
                follow_up_required: priority === 'high'
            })
        });

        if (!feedbackResponse.ok) {
            const errorText = await feedbackResponse.text();
            throw new Error(`Failed to submit feedback: ${errorText}`);
        }

        const feedbackData = await feedbackResponse.json();

        // If negative feedback, create a quality issue
        if (sentiment === 'negative' && customer_id) {
            const timestamp = Date.now();
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
                    title: `Customer Feedback: ${subject || 'Quality Concern'}`,
                    description: feedback_text,
                    issue_type: 'customer_feedback',
                    category: category || 'general',
                    severity: 'major',
                    priority: 'high',
                    source: 'customer_feedback',
                    order_id,
                    order_number,
                    reported_by: customer_id,
                    status: 'open'
                })
            });

            if (!issueResponse.ok) {
                console.error('Failed to create quality issue from negative feedback');
            }
        }

        return new Response(JSON.stringify({
            data: {
                feedback: feedbackData[0],
                message: 'Feedback submitted successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit feedback error:', error);

        const errorResponse = {
            error: {
                code: 'FEEDBACK_SUBMISSION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
