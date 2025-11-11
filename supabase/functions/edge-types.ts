/**
 * Edge Function Type-only Imports
 * This file provides type-only imports to bypass runtime import checks
 * for external dependencies that TypeScript can't resolve at compile time
 */

// Type-only imports for external dependencies
import type { 
  SupabaseClient, 
  PostgrestSingleResponse,
  PostgrestListResponse,
  PostgrestQueryBuilder,
  QueryData,
  QueryError
} from '@supabase/supabase-js';

// Re-export types for use in edge functions
export type {
  SupabaseClient,
  PostgrestSingleResponse,
  PostgrestListResponse,
  PostgrestQueryBuilder,
  QueryData,
  QueryError
};

/**
 * Type definitions for common edge function patterns
 */
export interface EdgeFunctionContext {
  req: Request;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseClient?: SupabaseClient;
  user?: any;
  auth?: any;
}

export interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface EdgeFunctionError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Type helpers for database operations
 */
export type DatabaseRow<T extends string> = any; // Simplified for edge functions
export type DatabaseInsert<T extends string> = any;
export type DatabaseUpdate<T extends string> = any;

/**
 * Common request/response types
 */
export interface ApiRequest {
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string | string[]>;
}

export interface ApiResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  body: {
    success: boolean;
    data?: T;
    error?: EdgeFunctionError;
    timestamp: string;
  };
}

/**
 * Supabase-specific types
 */
export interface SupabaseTable<T = any> {
  select(columns?: string): PostgrestQueryBuilder<T>;
  insert(data: T | T[]): PostgrestQueryBuilder<T>;
  update(data: Partial<T>): PostgrestQueryBuilder<T>;
  delete(): PostgrestQueryBuilder<T>;
}

export interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, any>;
  order?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
}

/**
 * CORS and security types
 */
export interface CorsOptions {
  origin?: string;
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Type-only external module declarations
 * These provide TypeScript support for external imports
 * without actually importing at runtime
 */
export type SupabaseModule = typeof import('@supabase/supabase-js');

export type DenoStdModule = typeof import('https://deno.land/std@0.177.0/crypto/mod.ts');

export type NodeCryptoModule = typeof import('crypto');

/**
 * Environment variable types
 */
export interface EnvVars {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY?: string;
  JWT_SECRET?: string;
  [key: string]: string | undefined;
}

/**
 * Request validation types
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: any;
}

/**
 * Generic type helpers
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility types for common patterns
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ContentType = 'application/json' | 'text/plain' | 'application/octet-stream';

export interface HttpHeaders {
  [key: string]: string;
}

export interface RequestMetadata {
  method: HttpMethod;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: HttpHeaders;
  timestamp: string;
}

/**
 * Type-only utility functions
 * These exist only for TypeScript support, no runtime implementation
 */
export function createSupabaseClient(
  url: string, 
  key: string
): SupabaseClient {
  throw new Error('This function exists only for type checking');
}

export function validateSchema(
  data: any, 
  schema: ValidationSchema
): ValidationResult {
  throw new Error('This function exists only for type checking');
}

export function createResponse<T>(
  data: T, 
  status?: number
): Response {
  throw new Error('This function exists only for type checking');
}

export function createErrorResponse(
  error: EdgeFunctionError, 
  status?: number
): Response {
  throw new Error('This function exists only for type checking');
}