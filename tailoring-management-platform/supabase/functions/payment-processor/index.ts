// Payment Processor Edge Function
// Handles payment processing through Stripe and PayPal

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface PaymentRequest {
  connectionId: string;
  amount: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
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

    const paymentData: PaymentRequest = await req.json();
    const { connectionId, amount, currency, orderId, customerId, description, metadata } = paymentData;

    // Fetch payment provider connection
    const { data: connection, error: connError } = await supabase
      .from('integration_connections')
      .select(`
        *,
        integration_providers!inner(provider_name),
        payment_providers!inner(*),
        api_credentials!inner(credential_type, encrypted_value, credential_key)
      `)
      .eq('id', connectionId)
      .eq('status', 'active')
      .single();

    if (connError || !connection) {
      throw new Error('Payment connection not found or inactive');
    }

    const providerName = connection.integration_providers.provider_name;
    let paymentResult;

    // Process payment based on provider
    if (providerName === 'Stripe') {
      paymentResult = await processStripePayment(connection, paymentData);
    } else if (providerName === 'PayPal') {
      paymentResult = await processPayPalPayment(connection, paymentData);
    } else {
      throw new Error(`Payment provider ${providerName} not supported`);
    }

    // Log the transaction
    await supabase.from('integration_logs').insert({
      connection_id: connectionId,
      log_type: 'api_response',
      method: 'POST',
      endpoint: '/payment',
      request_body: paymentData,
      response_status: paymentResult.success ? 200 : 400,
      response_body: paymentResult,
      user_id: user.id,
    });

    return new Response(
      JSON.stringify(paymentResult),
      {
        status: paymentResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Payment Processor Error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'PAYMENT_PROCESSOR_ERROR',
          message: error.message || 'Failed to process payment',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processStripePayment(connection: any, paymentData: PaymentRequest) {
  try {
    // Get Stripe API key from credentials
    const apiKey = connection.api_credentials.find(
      (c: any) => c.credential_type === 'api_key'
    )?.encrypted_value;

    if (!apiKey) {
      throw new Error('Stripe API key not found');
    }

    // Create payment intent using Stripe API
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: (paymentData.amount * 100).toString(), // Convert to fils
        currency: paymentData.currency.toLowerCase(),
        description: paymentData.description || 'Payment',
        'metadata[order_id]': paymentData.orderId || '',
        'metadata[customer_id]': paymentData.customerId || '',
      }).toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Stripe payment failed');
    }

    return {
      success: true,
      provider: 'Stripe',
      transaction_id: result.id,
      status: result.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      client_secret: result.client_secret,
    };

  } catch (error: any) {
    return {
      success: false,
      provider: 'Stripe',
      error: error.message,
    };
  }
}

async function processPayPalPayment(connection: any, paymentData: PaymentRequest) {
  try {
    // Get PayPal credentials
    const clientId = connection.api_credentials.find(
      (c: any) => c.credential_key === 'client_id'
    )?.encrypted_value;
    
    const clientSecret = connection.api_credentials.find(
      (c: any) => c.credential_type === 'client_secret'
    )?.encrypted_value;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not found');
    }

    // Get PayPal access token
    const authResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create PayPal order
    const orderResponse = await fetch('https://api.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: paymentData.currency,
            value: paymentData.amount.toFixed(2),
          },
          description: paymentData.description || 'Payment',
        }],
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(orderData.message || 'PayPal payment failed');
    }

    return {
      success: true,
      provider: 'PayPal',
      transaction_id: orderData.id,
      status: orderData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      approval_url: orderData.links?.find((l: any) => l.rel === 'approve')?.href,
    };

  } catch (error: any) {
    return {
      success: false,
      provider: 'PayPal',
      error: error.message,
    };
  }
}
