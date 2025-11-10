// API Proxy Edge Function
// Routes and manages all third-party API calls with authentication, rate limiting, and logging

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

interface ApiProxyRequest {
  connectionId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
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

    // Get request body
    const requestData: ApiProxyRequest = await req.json();
    const { connectionId, method, endpoint, headers = {}, body, timeout = 30000 } = requestData;

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch connection details
    const { data: connection, error: connError } = await supabase
      .from('integration_connections')
      .select(`
        *,
        integration_providers!inner(provider_name, provider_type, api_version),
        api_credentials!inner(credential_type, encrypted_value, credential_key)
      `)
      .eq('id', connectionId)
      .eq('status', 'active')
      .single();

    if (connError || !connection) {
      throw new Error('Connection not found or inactive');
    }

    // Check rate limits
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('limit_type', 'per_minute')
      .single();

    if (rateLimit && rateLimit.is_exceeded) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          reset_at: rateLimit.reset_at 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare API call headers
    const apiHeaders: Record<string, string> = { ...headers };
    
    // Add authentication headers based on credential type
    for (const cred of connection.api_credentials) {
      if (cred.credential_type === 'api_key') {
        apiHeaders[cred.credential_key] = cred.encrypted_value; // Note: In production, decrypt this
      } else if (cred.credential_type === 'oauth_token') {
        apiHeaders['Authorization'] = `Bearer ${cred.encrypted_value}`;
      }
    }

    // Log the API request
    const startTime = Date.now();
    
    // Make the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: apiHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const responseData = await response.text();
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      // Log the API call
      await supabase.from('integration_logs').insert({
        connection_id: connectionId,
        log_type: 'api_response',
        method,
        endpoint,
        request_headers: apiHeaders,
        request_body: body,
        response_status: response.status,
        response_body: parsedResponse,
        response_time_ms: responseTime,
        user_id: user.id,
      });

      // Update rate limit counter
      if (rateLimit) {
        await supabase
          .from('rate_limits')
          .update({ 
            current_usage: rateLimit.current_usage + 1,
            is_exceeded: rateLimit.current_usage + 1 >= rateLimit.max_requests
          })
          .eq('id', rateLimit.id);
      }

      // Update analytics
      const today = new Date().toISOString().split('T')[0];
      await supabase.rpc('increment_analytics', {
        p_connection_id: connectionId,
        p_date: today,
        p_success: response.ok,
        p_response_time: responseTime
      }).catch(() => {
        // Create analytics record if it doesn't exist
        supabase.from('integration_analytics').upsert({
          connection_id: connectionId,
          date: today,
          total_requests: 1,
          successful_requests: response.ok ? 1 : 0,
          failed_requests: response.ok ? 0 : 1,
          avg_response_time_ms: responseTime,
        });
      });

      return new Response(
        JSON.stringify({
          success: response.ok,
          status: response.status,
          data: parsedResponse,
          response_time_ms: responseTime,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Log the error
      await supabase.from('integration_logs').insert({
        connection_id: connectionId,
        log_type: 'error',
        method,
        endpoint,
        error_message: fetchError.message,
        response_time_ms: responseTime,
        user_id: user.id,
      });

      throw fetchError;
    }

  } catch (error: any) {
    console.error('API Proxy Error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'API_PROXY_ERROR',
          message: error.message || 'Failed to proxy API request',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
