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

        const alerts = [];
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Check for expiring certifications
        const certificationsResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_certifications?expiry_date=lte.${thirtyDaysFromNow.toISOString().split('T')[0]}&expiry_date=gte.${today.toISOString().split('T')[0]}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const expiringCerts = await certificationsResponse.json();

        for (const cert of expiringCerts) {
            const daysUntilExpiry = Math.ceil((new Date(cert.expiry_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
            
            alerts.push({
                supplier_id: cert.supplier_id,
                alert_type: 'certification_expiry',
                alert_category: 'compliance',
                severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
                alert_title: `Certification Expiring Soon: ${cert.certification_name}`,
                alert_message: `The certification "${cert.certification_name}" will expire in ${daysUntilExpiry} days on ${cert.expiry_date}. Please arrange for renewal.`,
                due_date: cert.expiry_date,
                auto_generated: true
            });
        }

        // Check for expiring contracts
        const contractsResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_contracts?renewal_date=lte.${thirtyDaysFromNow.toISOString().split('T')[0]}&renewal_date=gte.${today.toISOString().split('T')[0]}&status=eq.active&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const expiringContracts = await contractsResponse.json();

        for (const contract of expiringContracts) {
            const daysUntilRenewal = Math.ceil((new Date(contract.renewal_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
            
            alerts.push({
                supplier_id: contract.supplier_id,
                alert_type: 'contract_renewal',
                alert_category: 'contract',
                severity: daysUntilRenewal <= 14 ? 'high' : 'medium',
                alert_title: `Contract Renewal Due: ${contract.contract_number}`,
                alert_message: `Contract ${contract.contract_number} needs renewal in ${daysUntilRenewal} days. Auto-renewal is ${contract.auto_renewal ? 'enabled' : 'disabled'}.`,
                due_date: contract.renewal_date,
                auto_generated: true
            });
        }

        // Check for overdue compliance audits
        const complianceResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_compliance?next_audit_date=lt.${today.toISOString().split('T')[0]}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const overdueCompliance = await complianceResponse.json();

        for (const compliance of overdueCompliance) {
            const daysOverdue = Math.ceil((today.getTime() - new Date(compliance.next_audit_date).getTime()) / (24 * 60 * 60 * 1000));
            
            alerts.push({
                supplier_id: compliance.supplier_id,
                alert_type: 'compliance_audit_overdue',
                alert_category: 'compliance',
                severity: 'high',
                alert_title: `Compliance Audit Overdue: ${compliance.regulation_name}`,
                alert_message: `Compliance audit for "${compliance.regulation_name}" is overdue by ${daysOverdue} days. Last audit was on ${compliance.last_audit_date}.`,
                due_date: compliance.next_audit_date,
                auto_generated: true
            });
        }

        // Check for poor performance suppliers
        const performanceResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_performance?overall_score=lt.6.0&order=evaluation_date.desc&limit=20&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const poorPerformance = await performanceResponse.json();

        // Group by supplier and get latest only
        const latestPerformance: any = {};
        for (const perf of poorPerformance) {
            if (!latestPerformance[perf.supplier_id] || 
                new Date(perf.evaluation_date) > new Date(latestPerformance[perf.supplier_id].evaluation_date)) {
                latestPerformance[perf.supplier_id] = perf;
            }
        }

        for (const supplierId in latestPerformance) {
            const perf = latestPerformance[supplierId];
            
            alerts.push({
                supplier_id: perf.supplier_id,
                alert_type: 'poor_performance',
                alert_category: 'performance',
                severity: perf.overall_score < 5.0 ? 'high' : 'medium',
                alert_title: `Low Performance Score: ${perf.overall_score}/10`,
                alert_message: `Supplier has a low performance score of ${perf.overall_score}/10. Review required for potential improvement plan.`,
                auto_generated: true
            });
        }

        // Check for delayed deliveries
        const deliveriesResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_deliveries?delivery_status=in.(pending,in_transit)&expected_delivery_date=lt.${today.toISOString().split('T')[0]}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const delayedDeliveries = await deliveriesResponse.json();

        for (const delivery of delayedDeliveries) {
            const daysDelayed = Math.ceil((today.getTime() - new Date(delivery.expected_delivery_date).getTime()) / (24 * 60 * 60 * 1000));
            
            alerts.push({
                supplier_id: delivery.supplier_id,
                alert_type: 'delayed_delivery',
                alert_category: 'delivery',
                severity: daysDelayed > 7 ? 'high' : 'medium',
                alert_title: `Delayed Delivery: ${delivery.delivery_number}`,
                alert_message: `Delivery ${delivery.delivery_number} is delayed by ${daysDelayed} days. Expected: ${delivery.expected_delivery_date}, Status: ${delivery.delivery_status}.`,
                auto_generated: true
            });
        }

        // Insert all new alerts into database
        const insertedAlerts = [];
        for (const alert of alerts) {
            try {
                const insertResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_alerts`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(alert)
                });

                if (insertResponse.ok) {
                    const inserted = await insertResponse.json();
                    insertedAlerts.push(inserted[0]);
                }
            } catch (error) {
                console.error('Failed to insert alert:', error);
            }
        }

        return new Response(JSON.stringify({ 
            data: {
                alertsGenerated: insertedAlerts.length,
                alerts: insertedAlerts,
                summary: {
                    certificationExpiry: expiringCerts.length,
                    contractRenewal: expiringContracts.length,
                    complianceOverdue: overdueCompliance.length,
                    poorPerformance: Object.keys(latestPerformance).length,
                    delayedDeliveries: delayedDeliveries.length
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Alert generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'ALERT_GENERATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
