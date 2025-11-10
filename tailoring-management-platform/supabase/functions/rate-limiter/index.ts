// Rate Limiter Edge Function
// Manages and enforces API rate limits with automatic reset

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface RateLimitRequest {
  connectionId: string;
  limitType: 'per_minute' | 'per_hour' | 'per_day' | 'per_month';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: RateLimitRequest = await req.json();
    const { connectionId, limitType } = requestData;

    // Fetch rate limit configuration
    const { data: rateLimit, error: limitError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('limit_type', limitType)
      .single();

    if (limitError && limitError.code !== 'PGRST116') {
      throw new Error('Failed to fetch rate limit configuration');
    }

    const now = new Date();

    // If no rate limit exists, allow the request
    if (!rateLimit) {
      return new Response(
        JSON.stringify({
          allowed: true,
          message: 'No rate limit configured',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if we need to reset the rate limit window
    const windowEnd = new Date(rateLimit.window_end);
    if (now > windowEnd) {
      // Reset the rate limit window
      const newWindowStart = now;
      const newWindowEnd = calculateWindowEnd(now, limitType);

      await supabase
        .from('rate_limits')
        .update({
          current_usage: 0,
          window_start: newWindowStart.toISOString(),
          window_end: newWindowEnd.toISOString(),
          is_exceeded: false,
          exceeded_at: null,
          reset_at: newWindowEnd.toISOString(),
        })
        .eq('id', rateLimit.id);

      return new Response(
        JSON.stringify({
          allowed: true,
          current_usage: 0,
          max_requests: rateLimit.max_requests,
          reset_at: newWindowEnd.toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if rate limit is exceeded
    if (rateLimit.is_exceeded) {
      return new Response(
        JSON.stringify({
          allowed: false,
          error: 'Rate limit exceeded',
          current_usage: rateLimit.current_usage,
          max_requests: rateLimit.max_requests,
          reset_at: rateLimit.reset_at,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if incrementing would exceed the limit
    const newUsage = rateLimit.current_usage + 1;
    const willExceed = newUsage >= rateLimit.max_requests;

    // Increment usage counter
    await supabase
      .from('rate_limits')
      .update({
        current_usage: newUsage,
        is_exceeded: willExceed,
        exceeded_at: willExceed ? now.toISOString() : null,
      })
      .eq('id', rateLimit.id);

    return new Response(
      JSON.stringify({
        allowed: !willExceed,
        current_usage: newUsage,
        max_requests: rateLimit.max_requests,
        remaining: Math.max(0, rateLimit.max_requests - newUsage),
        reset_at: rateLimit.reset_at,
      }),
      {
        status: willExceed ? 429 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Rate Limiter Error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMITER_ERROR',
          message: error.message || 'Failed to check rate limit',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateWindowEnd(start: Date, limitType: string): Date {
  const end = new Date(start);

  switch (limitType) {
    case 'per_minute':
      end.setMinutes(end.getMinutes() + 1);
      break;
    case 'per_hour':
      end.setHours(end.getHours() + 1);
      break;
    case 'per_day':
      end.setDate(end.getDate() + 1);
      break;
    case 'per_month':
      end.setMonth(end.getMonth() + 1);
      break;
  }

  return end;
}
