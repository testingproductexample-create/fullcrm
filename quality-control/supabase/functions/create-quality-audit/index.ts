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
            audit_type,
            audit_scope,
            scheduled_date,
            auditor_id,
            area_audited,
            compliance_standards,
            findings
        } = await req.json();

        if (!audit_type || !audit_scope || !scheduled_date || !auditor_id) {
            throw new Error('Missing required fields');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Generate audit number
        const timestamp = Date.now();
        const audit_number = `AUD-${timestamp}`;

        // Calculate findings counts
        let critical_findings = 0;
        let major_findings = 0;
        let minor_findings = 0;
        let observations = 0;

        if (findings && Array.isArray(findings)) {
            findings.forEach(finding => {
                if (finding.finding_type === 'observation') {
                    observations++;
                } else if (finding.severity === 'critical') {
                    critical_findings++;
                } else if (finding.severity === 'major') {
                    major_findings++;
                } else if (finding.severity === 'minor') {
                    minor_findings++;
                }
            });
        }

        const findings_count = critical_findings + major_findings + minor_findings + observations;

        // Calculate overall score (100 - penalty points)
        const penalty = (critical_findings * 20) + (major_findings * 10) + (minor_findings * 5);
        const overall_score = Math.max(0, 100 - penalty);

        // Create audit record
        const auditResponse = await fetch(`${supabaseUrl}/rest/v1/audits`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                audit_number,
                audit_type,
                audit_scope,
                scheduled_date,
                actual_date: new Date().toISOString().split('T')[0],
                status: 'in-progress',
                auditor_id,
                area_audited,
                compliance_standards: compliance_standards || null,
                overall_score: overall_score.toFixed(2),
                findings_count,
                critical_findings,
                major_findings,
                minor_findings,
                observations
            })
        });

        if (!auditResponse.ok) {
            const errorText = await auditResponse.text();
            throw new Error(`Failed to create audit: ${errorText}`);
        }

        const auditData = await auditResponse.json();
        const audit_id = auditData[0].id;

        // Insert findings if provided
        if (findings && Array.isArray(findings) && findings.length > 0) {
            const findingsToInsert = findings.map((finding, index) => ({
                audit_id,
                finding_number: `${audit_number}-F${index + 1}`,
                finding_type: finding.finding_type || 'non-conformance',
                severity: finding.severity || 'minor',
                area: finding.area || area_audited,
                description: finding.description,
                standard_reference: finding.standard_reference || null,
                evidence: finding.evidence || null,
                photos: finding.photos || null,
                status: 'open'
            }));

            const findingsResponse = await fetch(`${supabaseUrl}/rest/v1/audit_findings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(findingsToInsert)
            });

            if (!findingsResponse.ok) {
                const errorText = await findingsResponse.text();
                console.error('Failed to insert audit findings:', errorText);
            }
        }

        return new Response(JSON.stringify({
            data: {
                audit: auditData[0],
                message: 'Quality audit created successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create audit error:', error);

        const errorResponse = {
            error: {
                code: 'AUDIT_CREATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
