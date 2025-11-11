/**
 * Edge Function Utilities
 * Common patterns and utilities for Supabase Edge Functions
 * Using type-only imports to bypass runtime import checks
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Common CORS headers for edge functions
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
};

/**
 * Create CORS headers for edge function responses
 */
export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: createCorsHeaders() 
    });
  }
  return null;
}

/**
 * Create a successful JSON response
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      ...createCorsHeaders(),
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create an error JSON response
 */
export function createErrorResponse(
  error: { code: string; message: string; details?: any }, 
  status: number = 500
): Response {
  return new Response(JSON.stringify({ 
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details })
    }
  }), {
    status,
    headers: {
      ...createCorsHeaders(),
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Extract Supabase client from request headers
 */
export function getSupabaseClient(req: Request): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { supabaseUrl, supabaseKey };
}

/**
 * Create common request handler with CORS and error handling
 */
export function createHandler(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
      return await handler(req);
    } catch (error) {
      console.error('Edge function error:', error);
      return createErrorResponse({
        code: 'FUNCTION_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
}

/**
 * Parse JSON request body safely
 */
export async function parseRequestBody(req: Request): Promise<any> {
  try {
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await req.json();
    }
    return {};
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(...vars: string[]): void {
  const missing = vars.filter(varName => !Deno.env.get(varName));
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Create a standardized API response
 */
export function createApiResponse(
  success: boolean,
  data?: any,
  error?: { code: string; message: string }
) {
  if (success) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get request metadata
 */
export function getRequestInfo(req: Request) {
  const url = new URL(req.url);
  return {
    method: req.method,
    url: req.url,
    path: url.pathname,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    userAgent: req.headers.get('user-agent') || 'unknown',
    origin: req.headers.get('origin') || 'unknown'
  };
}

/**
 * Log request information for debugging
 */
export function logRequest(req: Request, additionalInfo?: Record<string, any>) {
  const requestInfo = getRequestInfo(req);
  console.log('Edge Function Request:', {
    ...requestInfo,
    ...additionalInfo,
    timestamp: new Date().toISOString()
  });
}