// Webhook Handler Edge Function
// Receives and processes incoming webhooks from third-party services

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface WebhookPayload {
  endpointId: string;
  eventId: string;
  eventType: string;
  payload: any;
  signature?: string;
}

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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

    // Get webhook signature from headers
    const webhookSignature = req.headers.get('x-webhook-signature');
    const rawBody = await req.text();
    const webhookData: WebhookPayload = JSON.parse(rawBody);

    const { endpointId, eventId, eventType, payload, signature } = webhookData;

    // Fetch webhook endpoint configuration
    const { data: endpoint, error: endpointError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', endpointId)
      .eq('is_active', true)
      .single();

    if (endpointError || !endpoint) {
      throw new Error('Webhook endpoint not found or inactive');
    }

    // Verify webhook signature
    const signatureToVerify = webhookSignature || signature;
    if (signatureToVerify && endpoint.webhook_secret) {
      const isValid = await verifyWebhookSignature(
        rawBody,
        signatureToVerify,
        endpoint.webhook_secret
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Check if event already processed (idempotency)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processing_status')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ 
          message: 'Event already processed',
          status: existingEvent.processing_status 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store webhook event
    const { data: webhookEvent, error: eventError } = await supabase
      .from('webhook_events')
      .insert({
        webhook_endpoint_id: endpointId,
        event_id: eventId,
        event_type: eventType,
        payload,
        headers: Object.fromEntries(req.headers.entries()),
        signature: signatureToVerify,
        signature_verified: !!signatureToVerify,
        processing_status: 'pending',
      })
      .select()
      .single();

    if (eventError) {
      throw new Error('Failed to store webhook event');
    }

    // Process webhook based on event type
    let processingStatus = 'completed';
    let errorMessage = null;

    try {
      // Update webhook event status to processing
      await supabase
        .from('webhook_events')
        .update({ processing_status: 'processing' })
        .eq('id', webhookEvent.id);

      // Route to specific handler based on event type
      if (eventType.startsWith('payment.')) {
        await handlePaymentWebhook(supabase, payload, eventType);
      } else if (eventType.startsWith('shipping.')) {
        await handleShippingWebhook(supabase, payload, eventType);
      } else if (eventType.startsWith('social.')) {
        await handleSocialMediaWebhook(supabase, payload, eventType);
      }

      // Update endpoint statistics
      await supabase
        .from('webhook_endpoints')
        .update({
          last_triggered: new Date().toISOString(),
          total_triggers: endpoint.total_triggers + 1,
          success_count: endpoint.success_count + 1,
        })
        .eq('id', endpointId);

    } catch (processingError: any) {
      console.error('Webhook processing error:', processingError);
      processingStatus = 'failed';
      errorMessage = processingError.message;

      // Update failure count
      await supabase
        .from('webhook_endpoints')
        .update({
          last_triggered: new Date().toISOString(),
          total_triggers: endpoint.total_triggers + 1,
          failure_count: endpoint.failure_count + 1,
        })
        .eq('id', endpointId);
    }

    // Update webhook event with final status
    await supabase
      .from('webhook_events')
      .update({
        processing_status: processingStatus,
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhookEvent.id);

    return new Response(
      JSON.stringify({
        success: processingStatus === 'completed',
        event_id: eventId,
        status: processingStatus,
      }),
      {
        status: processingStatus === 'completed' ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Webhook Handler Error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'WEBHOOK_HANDLER_ERROR',
          message: error.message || 'Failed to process webhook',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Webhook event handlers
async function handlePaymentWebhook(supabase: any, payload: any, eventType: string) {
  console.log('Processing payment webhook:', eventType);
  
  // Handle different payment events
  if (eventType === 'payment.succeeded') {
    // Update order/invoice status
    // Send confirmation email
    // Update analytics
  } else if (eventType === 'payment.failed') {
    // Log failure
    // Send notification
  } else if (eventType === 'payment.refunded') {
    // Process refund
    // Update records
  }
}

async function handleShippingWebhook(supabase: any, payload: any, eventType: string) {
  console.log('Processing shipping webhook:', eventType);
  
  // Handle shipping events
  if (eventType === 'shipping.label_created') {
    // Store label URL
  } else if (eventType === 'shipping.in_transit') {
    // Update tracking status
  } else if (eventType === 'shipping.delivered') {
    // Mark as delivered
    // Send confirmation
  }
}

async function handleSocialMediaWebhook(supabase: any, payload: any, eventType: string) {
  console.log('Processing social media webhook:', eventType);
  
  // Handle social media events
  if (eventType === 'social.comment') {
    // Store comment
    // Notify team
  } else if (eventType === 'social.mention') {
    // Track mention
    // Analyze sentiment
  }
}
