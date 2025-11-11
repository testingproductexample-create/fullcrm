// Supabase Edge Functions Type Declarations
// This file provides type definitions to resolve external import issues

declare module 'https://esm.sh/@supabase/supabase-js@2.39.3' {
  import { SupabaseClient, CreateClientOptions } from '@supabase/supabase-js';
  
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: CreateClientOptions
  ): SupabaseClient;
  
  export default createClient;
}

declare module 'https://deno.land/std@0.177.0/crypto/mod.ts' {
  export const crypto: Crypto;
}

// Re-export common Supabase types for edge functions
export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, any>;
      Insert: Record<string, any>;
      Update: Record<string, any>;
    }>;
    Functions: Record<string, any>;
  };
}

export interface SupabaseRequest {
  method: string;
  headers: Record<string, string>;
  url: string;
  body?: any;
}

export interface SupabaseResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

// Common edge function utilities
export const corsHeaders: Record<string, string>;

export function createCorsHeaders(): Record<string, string>;

export function handleCors(req: Request): Response | null;

export function createSuccessResponse(data: any, status?: number): Response;

export function createErrorResponse(error: { code: string; message: string }, status?: number): Response;