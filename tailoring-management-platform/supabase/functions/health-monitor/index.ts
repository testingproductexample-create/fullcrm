// Health Monitor Edge Function
// Performs health checks on all active integrations and updates status

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface HealthCheckResult {
  connectionId: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  error?: string;
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

    // Fetch all active connections
    const { data: connections, error: connError } = await supabase
      .from('integration_connections')
      .select(`
        id,
        connection_name,
        configuration,
        integration_providers!inner(provider_name, provider_type),
        api_credentials!inner(credential_type, encrypted_value, credential_key)
      `)
      .eq('status', 'active');

    if (connError) {
      throw new Error('Failed to fetch active connections');
    }

    const healthResults: HealthCheckResult[] = [];

    // Perform health check for each connection
    for (const connection of connections || []) {
      const result = await performHealthCheck(connection);
      healthResults.push(result);

      // Store health check result
      await supabase.from('integration_health').insert({
        connection_id: connection.id,
        check_timestamp: new Date().toISOString(),
        status: result.status,
        response_time_ms: result.responseTime,
        error_message: result.error,
        check_type: 'api_call',
      });

      // Update connection health status
      await supabase
        .from('integration_connections')
        .update({
          health_status: result.status,
          last_health_check: new Date().toISOString(),
          error_message: result.error || null,
        })
        .eq('id', connection.id);
    }

    // Calculate overall health statistics
    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
    const degradedCount = healthResults.filter(r => r.status === 'degraded').length;
    const downCount = healthResults.filter(r => r.status === 'down').length;

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: healthResults.length,
          healthy: healthyCount,
          degraded: degradedCount,
          down: downCount,
        },
        results: healthResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Health Monitor Error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'HEALTH_MONITOR_ERROR',
          message: error.message || 'Failed to perform health checks',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performHealthCheck(connection: any): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const providerName = connection.integration_providers.provider_name;
    let healthEndpoint = '';

    // Determine health check endpoint based on provider
    switch (providerName) {
      case 'Stripe':
        healthEndpoint = 'https://api.stripe.com/v1/charges?limit=1';
        break;
      case 'PayPal':
        healthEndpoint = 'https://api.paypal.com/v1/oauth2/token';
        break;
      case 'Aramex':
        healthEndpoint = 'https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc';
        break;
      case 'DHL Express':
        healthEndpoint = 'https://express.api.dhl.com/mydhlapi/test/rates';
        break;
      case 'Facebook':
        healthEndpoint = 'https://graph.facebook.com/v18.0/me';
        break;
      case 'Instagram':
        healthEndpoint = 'https://graph.instagram.com/me';
        break;
      default:
        // Generic health check
        healthEndpoint = connection.configuration?.api_base_url || '';
    }

    if (!healthEndpoint) {
      return {
        connectionId: connection.id,
        status: 'unknown',
        responseTime: 0,
        error: 'No health check endpoint configured',
      };
    }

    // Prepare authentication headers
    const headers: Record<string, string> = {};
    for (const cred of connection.api_credentials) {
      if (cred.credential_type === 'api_key') {
        headers[cred.credential_key] = cred.encrypted_value;
      } else if (cred.credential_type === 'oauth_token') {
        headers['Authorization'] = `Bearer ${cred.encrypted_value}`;
      }
    }

    // Perform health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    // Determine health status based on response
    let status: 'healthy' | 'degraded' | 'down';
    if (response.ok) {
      status = responseTime < 2000 ? 'healthy' : 'degraded';
    } else if (response.status >= 400 && response.status < 500) {
      status = 'degraded'; // Client errors might be fixable
    } else {
      status = 'down';
    }

    return {
      connectionId: connection.id,
      status,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      connectionId: connection.id,
      status: 'down',
      responseTime,
      error: error.message || 'Health check failed',
    };
  }
}
