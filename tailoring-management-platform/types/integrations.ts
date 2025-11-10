// External Integrations & API Management Types
// TypeScript interfaces for all integration-related data structures

export interface IntegrationProvider {
  id: string;
  provider_name: string;
  provider_type: 'payment' | 'shipping' | 'social_media' | 'marketing' | 'communication' | 'analytics';
  description?: string;
  logo_url?: string;
  documentation_url?: string;
  api_version?: string;
  is_active: boolean;
  requires_oauth: boolean;
  supported_regions: string[];
  pricing_model?: string;
  configuration_schema: Record<string, any>;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface IntegrationConnection {
  id: string;
  organization_id: string;
  provider_id: string;
  connection_name: string;
  status: 'active' | 'inactive' | 'error' | 'pending' | 'testing';
  environment: 'production' | 'staging' | 'development';
  configuration: Record<string, any>;
  is_primary: boolean;
  last_health_check?: string;
  health_status?: 'healthy' | 'degraded' | 'down' | 'unknown';
  error_message?: string;
  connected_at?: string;
  disconnected_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  integration_providers?: IntegrationProvider;
  api_credentials?: ApiCredential[];
  payment_providers?: PaymentProvider;
  shipping_providers?: ShippingProvider;
  social_media_accounts?: SocialMediaAccount;
}

export interface ApiCredential {
  id: string;
  connection_id: string;
  credential_type: 'api_key' | 'oauth_token' | 'client_secret' | 'webhook_secret' | 'refresh_token';
  credential_key: string;
  encrypted_value: string;
  encryption_method: string;
  expires_at?: string;
  last_rotated: string;
  rotation_policy: 'manual' | '30days' | '90days' | 'yearly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationHealth {
  id: string;
  connection_id: string;
  check_timestamp: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  response_time_ms?: number;
  error_message?: string;
  http_status_code?: number;
  endpoint_tested?: string;
  check_type?: 'ping' | 'authentication' | 'api_call' | 'webhook';
  metadata: Record<string, any>;
  created_at: string;
}

export interface IntegrationLog {
  id: string;
  connection_id: string;
  log_type: 'api_request' | 'api_response' | 'error' | 'webhook' | 'system';
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint?: string;
  request_headers?: Record<string, any>;
  request_body?: any;
  response_status?: number;
  response_headers?: Record<string, any>;
  response_body?: any;
  response_time_ms?: number;
  error_message?: string;
  error_code?: string;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  connection_id: string;
  organization_id: string;
  webhook_url: string;
  webhook_secret: string;
  event_types: string[];
  is_active: boolean;
  retry_policy: {
    max_retries: number;
    backoff_strategy: string;
  };
  last_triggered?: string;
  total_triggers: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  webhook_endpoint_id: string;
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  headers?: Record<string, any>;
  signature?: string;
  signature_verified: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  retry_count: number;
  error_message?: string;
  processed_at?: string;
  received_at: string;
  created_at: string;
}

export interface RateLimit {
  id: string;
  connection_id: string;
  limit_type: 'per_minute' | 'per_hour' | 'per_day' | 'per_month';
  max_requests: number;
  current_usage: number;
  window_start: string;
  window_end: string;
  is_exceeded: boolean;
  exceeded_at?: string;
  reset_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationAnalytics {
  id: string;
  connection_id: string;
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  total_data_transferred_mb: number;
  total_cost_aed: number;
  error_rate_percent: number;
  uptime_percent: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentProvider {
  id: string;
  connection_id: string;
  provider_name: 'stripe' | 'paypal' | 'network_intl' | 'telr' | 'checkout_com';
  merchant_id?: string;
  account_id?: string;
  supported_currencies: string[];
  supported_payment_methods: string[];
  webhook_url?: string;
  success_url?: string;
  cancel_url?: string;
  is_test_mode: boolean;
  auto_capture: boolean;
  settlement_schedule: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingProvider {
  id: string;
  connection_id: string;
  provider_name: 'aramex' | 'dhl' | 'fedex' | 'ups' | 'local_courier' | 'smsa' | 'tcs';
  account_number?: string;
  service_types: string[];
  supported_regions: string[];
  default_service_type: string;
  auto_generate_labels: boolean;
  tracking_enabled: boolean;
  insurance_enabled: boolean;
  max_weight_kg?: number;
  max_dimensions_cm?: Record<string, number>;
  pricing_model: string;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaAccount {
  id: string;
  connection_id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'snapchat';
  account_name?: string;
  account_id?: string;
  profile_url?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  permissions: string[];
  is_business_account: boolean;
  follower_count: number;
  last_sync?: string;
  auto_post_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Form types for creating/updating integrations
export interface CreateConnectionInput {
  provider_id: string;
  connection_name: string;
  environment: 'production' | 'staging' | 'development';
  configuration: Record<string, any>;
  credentials: {
    type: string;
    key: string;
    value: string;
  }[];
}

export interface UpdateConnectionInput {
  connection_name?: string;
  status?: 'active' | 'inactive' | 'error' | 'pending' | 'testing';
  configuration?: Record<string, any>;
}

// Dashboard statistics
export interface IntegrationStats {
  total_connections: number;
  active_connections: number;
  inactive_connections: number;
  error_connections: number;
  health_summary: {
    healthy: number;
    degraded: number;
    down: number;
    unknown: number;
  };
  total_api_calls_today: number;
  total_webhooks_today: number;
  avg_response_time_ms: number;
  error_rate_percent: number;
}

// Provider-specific configuration schemas
export interface StripeConfig {
  api_key: string;
  publishable_key?: string;
  webhook_secret?: string;
  test_mode?: boolean;
}

export interface PayPalConfig {
  client_id: string;
  client_secret: string;
  mode: 'sandbox' | 'live';
  webhook_id?: string;
}

export interface AramexConfig {
  username: string;
  password: string;
  account_number: string;
  account_pin: string;
  account_entity: string;
  account_country_code: string;
}

export interface DHLConfig {
  api_key: string;
  api_secret: string;
  account_number: string;
}

export interface FacebookConfig {
  app_id: string;
  app_secret: string;
  access_token: string;
  page_id?: string;
}

export interface InstagramConfig {
  access_token: string;
  account_id: string;
  business_account_id?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface HealthCheckResponse {
  success: boolean;
  timestamp: string;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  results: {
    connectionId: string;
    status: string;
    responseTime: number;
    error?: string;
  }[];
}

// Utility types
export type IntegrationType = 'payment' | 'shipping' | 'social_media' | 'marketing' | 'communication' | 'analytics';

export type ConnectionStatus = 'active' | 'inactive' | 'error' | 'pending' | 'testing';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export type Environment = 'production' | 'staging' | 'development';

// Export all types
export type {
  IntegrationProvider,
  IntegrationConnection,
  ApiCredential,
  IntegrationHealth,
  IntegrationLog,
  WebhookEndpoint,
  WebhookEvent,
  RateLimit,
  IntegrationAnalytics,
  PaymentProvider,
  ShippingProvider,
  SocialMediaAccount,
  CreateConnectionInput,
  UpdateConnectionInput,
  IntegrationStats,
  ApiResponse,
  HealthCheckResponse,
};
