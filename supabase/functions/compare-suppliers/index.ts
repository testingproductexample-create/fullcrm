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
        const { supplierIds, criteria, materialType, quantity } = await req.json();

        if (!supplierIds || supplierIds.length === 0) {
            throw new Error('At least one supplier ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const comparisonResults = [];

        // Fetch and compare data for each supplier
        for (const supplierId of supplierIds) {
            // Fetch supplier details
            const supplierResponse = await fetch(`${supabaseUrl}/rest/v1/suppliers?id=eq.${supplierId}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const suppliers = await supplierResponse.json();
            const supplier = suppliers[0];

            if (!supplier) {
                continue;
            }

            // Fetch latest performance
            const performanceResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_performance?supplier_id=eq.${supplierId}&select=*&order=evaluation_date.desc&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const performance = await performanceResponse.json();
            const latestPerformance = performance[0] || {};

            // Fetch pricing for material type if specified
            let pricing = null;
            if (materialType) {
                const pricingResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_pricing?supplier_id=eq.${supplierId}&material_category=eq.${materialType}&select=*&order=created_at.desc&limit=1`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                const pricingData = await pricingResponse.json();
                pricing = pricingData[0] || null;
            }

            // Calculate bulk discount if quantity specified
            let finalPrice = pricing?.unit_price || 0;
            if (pricing && quantity) {
                if (quantity >= (pricing.bulk_discount_tier3_qty || 999999)) {
                    finalPrice = finalPrice * (1 - (pricing.bulk_discount_tier3_pct || 0) / 100);
                } else if (quantity >= (pricing.bulk_discount_tier2_qty || 999999)) {
                    finalPrice = finalPrice * (1 - (pricing.bulk_discount_tier2_pct || 0) / 100);
                } else if (quantity >= (pricing.bulk_discount_tier1_qty || 999999)) {
                    finalPrice = finalPrice * (1 - (pricing.bulk_discount_tier1_pct || 0) / 100);
                }
            }

            // Fetch recent deliveries for delivery rating
            const deliveriesResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_deliveries?supplier_id=eq.${supplierId}&select=*&order=shipment_date.desc&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            const deliveries = await deliveriesResponse.json();
            const onTimeCount = deliveries.filter((d: any) => d.on_time === true).length;
            const deliveryScore = deliveries.length > 0 ? (onTimeCount / deliveries.length) * 10 : 0;

            // Build comparison entry
            comparisonResults.push({
                supplierId: supplier.id,
                supplierName: supplier.supplier_name || supplier.company_name,
                price: {
                    unitPrice: pricing?.unit_price || 0,
                    finalPrice: Math.round(finalPrice * 100) / 100,
                    currency: pricing?.currency || 'AED',
                    discount: pricing ? Math.round((1 - finalPrice / pricing.unit_price) * 100) : 0
                },
                performance: {
                    onTimeDelivery: latestPerformance.on_time_delivery_rate || 0,
                    qualityRating: latestPerformance.quality_rating || 0,
                    overallScore: latestPerformance.overall_score || 0,
                    deliveryScore: Math.round(deliveryScore * 10) / 10
                },
                terms: {
                    paymentTerms: supplier.payment_terms || 'Not specified',
                    leadTimeDays: supplier.lead_time_days || 0,
                    minimumOrder: supplier.minimum_order_value_aed || 0
                },
                certifications: supplier.certifications || [],
                partnership: supplier.partnership_level || 'standard',
                rating: supplier.overall_rating || 0
            });
        }

        // Calculate weighted scores if criteria provided
        if (criteria) {
            const weights = {
                price: criteria.priceWeight || 0.35,
                quality: criteria.qualityWeight || 0.30,
                delivery: criteria.deliveryWeight || 0.25,
                service: criteria.serviceWeight || 0.10
            };

            comparisonResults.forEach((result: any) => {
                // Normalize price (lower is better, invert for scoring)
                const prices = comparisonResults.map((r: any) => r.price.finalPrice).filter((p: number) => p > 0);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceScore = prices.length > 0 && result.price.finalPrice > 0
                    ? ((maxPrice - result.price.finalPrice) / (maxPrice - minPrice || 1)) * 10
                    : 0;

                const weightedScore = (
                    priceScore * weights.price +
                    (result.performance.qualityRating * 2) * weights.quality +
                    result.performance.deliveryScore * weights.delivery +
                    result.rating * weights.service
                );

                result.weightedScore = Math.round(weightedScore * 100) / 100;
            });

            // Sort by weighted score
            comparisonResults.sort((a: any, b: any) => b.weightedScore - a.weightedScore);
        }

        // Save comparison to database
        const comparisonName = `Comparison_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 9)}`;
        const comparisonData = {
            comparison_name: comparisonName,
            comparison_date: new Date().toISOString().split('T')[0],
            material_type: materialType || 'General',
            quantity_required: quantity || 0,
            supplier_ids: supplierIds,
            price_comparison: JSON.stringify(comparisonResults.map((r: any) => ({ id: r.supplierId, price: r.price }))),
            quality_comparison: JSON.stringify(comparisonResults.map((r: any) => ({ id: r.supplierId, performance: r.performance }))),
            delivery_comparison: JSON.stringify(comparisonResults.map((r: any) => ({ id: r.supplierId, terms: r.terms }))),
            overall_scores: JSON.stringify(comparisonResults.map((r: any) => ({ id: r.supplierId, score: r.weightedScore || 0 }))),
            recommended_supplier_id: comparisonResults.length > 0 ? comparisonResults[0].supplierId : null
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/supplier_comparisons`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(comparisonData)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Failed to save comparison:', errorText);
        }

        return new Response(JSON.stringify({ 
            data: {
                comparison: comparisonResults,
                recommended: comparisonResults.length > 0 ? comparisonResults[0] : null
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Comparison error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'COMPARISON_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
