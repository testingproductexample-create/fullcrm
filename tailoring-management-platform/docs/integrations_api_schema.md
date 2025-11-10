# External Integrations & API Management System - Database Schema

## Overview
Comprehensive API management layer for third-party service integrations including payment gateways, shipping providers, social media platforms, and marketing tools.

## Database Tables (12 Tables)

### 1. integration_providers
Master catalog of available third-party service providers.

```sql
- id: UUID PRIMARY KEY
- provider_name: VARCHAR(100) UNIQUE NOT NULL
- provider_type: VARCHAR(50) NOT NULL (payment, shipping, social_media, marketing, communication)
- description: TEXT
- logo_url: TEXT
- documentation_url: TEXT
- api_version: VARCHAR(20)
- is_active: BOOLEAN DEFAULT TRUE
- requires_oauth: BOOLEAN DEFAULT FALSE
- supported_regions: JSONB (list of supported countries/regions)
- pricing_model: VARCHAR(50) (free, freemium, paid, usage_based)
- configuration_schema: JSONB (JSON schema for configuration)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- organization_id: UUID REFERENCES organizations(id)
```

### 2. integration_connections
Active integrations and their configurations for each organization.

```sql
- id: UUID PRIMARY KEY
- organization_id: UUID REFERENCES organizations(id) NOT NULL
- provider_id: UUID REFERENCES integration_providers(id) NOT NULL
- connection_name: VARCHAR(100) NOT NULL
- status: VARCHAR(20) NOT NULL (active, inactive, error, pending, testing)
- environment: VARCHAR(20) DEFAULT 'production' (production, staging, development)
- configuration: JSONB (provider-specific settings)
- is_primary: BOOLEAN DEFAULT FALSE
- last_health_check: TIMESTAMPTZ
- health_status: VARCHAR(20) (healthy, degraded, down, unknown)
- error_message: TEXT
- connected_at: TIMESTAMPTZ
- disconnected_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- created_by: UUID REFERENCES users(id)
```

### 3. api_credentials
Encrypted storage for API keys, tokens, and secrets.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- credential_type: VARCHAR(50) NOT NULL (api_key, oauth_token, client_secret, webhook_secret)
- credential_key: VARCHAR(100) NOT NULL
- encrypted_value: TEXT NOT NULL
- encryption_method: VARCHAR(50) DEFAULT 'AES-256'
- expires_at: TIMESTAMPTZ
- last_rotated: TIMESTAMPTZ
- rotation_policy: VARCHAR(50) (manual, 30days, 90days, yearly)
- is_active: BOOLEAN DEFAULT TRUE
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 4. integration_health
Health check results and monitoring data.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- check_timestamp: TIMESTAMPTZ DEFAULT NOW()
- status: VARCHAR(20) NOT NULL (healthy, degraded, down)
- response_time_ms: INTEGER
- error_message: TEXT
- http_status_code: INTEGER
- endpoint_tested: VARCHAR(255)
- check_type: VARCHAR(50) (ping, authentication, api_call, webhook)
- metadata: JSONB
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

### 5. integration_logs
Comprehensive API call logs for debugging and auditing.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- log_type: VARCHAR(50) NOT NULL (api_request, api_response, error, webhook, system)
- method: VARCHAR(10) (GET, POST, PUT, DELETE, PATCH)
- endpoint: VARCHAR(255)
- request_headers: JSONB
- request_body: JSONB
- response_status: INTEGER
- response_headers: JSONB
- response_body: JSONB
- response_time_ms: INTEGER
- error_message: TEXT
- error_code: VARCHAR(50)
- user_id: UUID REFERENCES users(id)
- ip_address: INET
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

### 6. webhook_endpoints
Webhook configuration and management.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- organization_id: UUID REFERENCES organizations(id) NOT NULL
- webhook_url: TEXT NOT NULL
- webhook_secret: TEXT NOT NULL
- event_types: JSONB NOT NULL (list of subscribed events)
- is_active: BOOLEAN DEFAULT TRUE
- retry_policy: JSONB (max_retries, backoff_strategy)
- last_triggered: TIMESTAMPTZ
- total_triggers: INTEGER DEFAULT 0
- success_count: INTEGER DEFAULT 0
- failure_count: INTEGER DEFAULT 0
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 7. webhook_events
Webhook event history and processing status.

```sql
- id: UUID PRIMARY KEY
- webhook_endpoint_id: UUID REFERENCES webhook_endpoints(id) NOT NULL
- event_id: VARCHAR(100) UNIQUE NOT NULL
- event_type: VARCHAR(100) NOT NULL
- payload: JSONB NOT NULL
- headers: JSONB
- signature: TEXT
- signature_verified: BOOLEAN DEFAULT FALSE
- processing_status: VARCHAR(20) NOT NULL (pending, processing, completed, failed, retrying)
- retry_count: INTEGER DEFAULT 0
- error_message: TEXT
- processed_at: TIMESTAMPTZ
- received_at: TIMESTAMPTZ DEFAULT NOW()
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

### 8. rate_limits
Rate limiting configuration and usage tracking.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- limit_type: VARCHAR(50) NOT NULL (per_minute, per_hour, per_day, per_month)
- max_requests: INTEGER NOT NULL
- current_usage: INTEGER DEFAULT 0
- window_start: TIMESTAMPTZ
- window_end: TIMESTAMPTZ
- is_exceeded: BOOLEAN DEFAULT FALSE
- exceeded_at: TIMESTAMPTZ
- reset_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 9. integration_analytics
Usage metrics and performance tracking.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- date: DATE NOT NULL
- total_requests: INTEGER DEFAULT 0
- successful_requests: INTEGER DEFAULT 0
- failed_requests: INTEGER DEFAULT 0
- avg_response_time_ms: DECIMAL(10,2)
- total_data_transferred_mb: DECIMAL(10,2)
- total_cost_aed: DECIMAL(10,2)
- error_rate_percent: DECIMAL(5,2)
- uptime_percent: DECIMAL(5,2)
- metadata: JSONB
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 10. payment_providers
Payment gateway specific configurations.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- provider_name: VARCHAR(50) NOT NULL (stripe, paypal, network_intl, telr)
- merchant_id: VARCHAR(100)
- account_id: VARCHAR(100)
- supported_currencies: JSONB DEFAULT '["AED"]'
- supported_payment_methods: JSONB (card, wallet, bank_transfer, cod)
- webhook_url: TEXT
- success_url: TEXT
- cancel_url: TEXT
- is_test_mode: BOOLEAN DEFAULT FALSE
- auto_capture: BOOLEAN DEFAULT TRUE
- settlement_schedule: VARCHAR(50) (instant, daily, weekly)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 11. shipping_providers
Shipping service provider settings.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- provider_name: VARCHAR(50) NOT NULL (aramex, dhl, fedex, ups, local_courier)
- account_number: VARCHAR(100)
- service_types: JSONB (standard, express, overnight, international)
- supported_regions: JSONB (uae, gcc, mena, international)
- default_service_type: VARCHAR(50)
- auto_generate_labels: BOOLEAN DEFAULT TRUE
- tracking_enabled: BOOLEAN DEFAULT TRUE
- insurance_enabled: BOOLEAN DEFAULT FALSE
- max_weight_kg: DECIMAL(10,2)
- max_dimensions_cm: JSONB
- pricing_model: VARCHAR(50) (flat_rate, weight_based, zone_based)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### 12. social_media_accounts
Social media platform connections.

```sql
- id: UUID PRIMARY KEY
- connection_id: UUID REFERENCES integration_connections(id) NOT NULL
- platform: VARCHAR(50) NOT NULL (facebook, instagram, twitter, linkedin, tiktok)
- account_name: VARCHAR(100)
- account_id: VARCHAR(100)
- profile_url: TEXT
- access_token: TEXT
- refresh_token: TEXT
- token_expires_at: TIMESTAMPTZ
- permissions: JSONB (post, read, analytics, messaging)
- is_business_account: BOOLEAN DEFAULT FALSE
- follower_count: INTEGER
- last_sync: TIMESTAMPTZ
- auto_post_enabled: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

## Indexes for Performance

```sql
-- Integration Connections
CREATE INDEX idx_integration_connections_org ON integration_connections(organization_id);
CREATE INDEX idx_integration_connections_provider ON integration_connections(provider_id);
CREATE INDEX idx_integration_connections_status ON integration_connections(status);

-- API Credentials
CREATE INDEX idx_api_credentials_connection ON api_credentials(connection_id);
CREATE INDEX idx_api_credentials_type ON api_credentials(credential_type);

-- Integration Health
CREATE INDEX idx_integration_health_connection ON integration_health(connection_id);
CREATE INDEX idx_integration_health_timestamp ON integration_health(check_timestamp);

-- Integration Logs
CREATE INDEX idx_integration_logs_connection ON integration_logs(connection_id);
CREATE INDEX idx_integration_logs_created ON integration_logs(created_at);
CREATE INDEX idx_integration_logs_type ON integration_logs(log_type);

-- Webhook Events
CREATE INDEX idx_webhook_events_endpoint ON webhook_events(webhook_endpoint_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(processing_status);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);

-- Rate Limits
CREATE INDEX idx_rate_limits_connection ON rate_limits(connection_id);
CREATE INDEX idx_rate_limits_exceeded ON rate_limits(is_exceeded);

-- Integration Analytics
CREATE INDEX idx_integration_analytics_connection ON integration_analytics(connection_id);
CREATE INDEX idx_integration_analytics_date ON integration_analytics(date);
```

## Row Level Security (RLS) Policies

All tables will have RLS enabled with policies ensuring:
- Users can only access data for their organization
- Service role has full access for system operations
- Audit logging for all sensitive operations

## UAE Compliance Considerations

- Encrypted storage for all API credentials
- Audit logs retained for 5 years
- Data residency compliance (UAE region)
- PDPL compliance for customer data handling
- Support for local payment methods (COD, bank transfer)
- Arabic language support in configurations
