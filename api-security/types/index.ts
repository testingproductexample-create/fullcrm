/**
 * API Security System Type Definitions
 * TypeScript definitions for all security system components
 */

// Request/Response Types
export interface SecurityRequest {
  ip: string;
  method: string;
  url: string;
  headers: Record<string, string | undefined>;
  body?: any;
  userId?: string;
  apiKey?: APIKey;
  apiVersion?: string;
  securityContext?: SecurityContext;
}

export interface SecurityResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  responseTime?: number;
}

// API Key Types
export interface APIKey {
  keyId: string;
  userId: string;
  permissions: Permission[];
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date | null;
  usageCount: number;
  isActive: boolean;
  metadata: APIKeyMetadata;
  hashedKey: string;
}

export interface APIKeyMetadata {
  ipWhitelist: string[];
  userAgent?: string;
  description: string;
  tags: string[];
  rotationDate?: Date;
  revokedAt?: Date;
  revocationReason?: string;
}

export interface APIKeyRequest {
  userId: string;
  permissions: Permission[];
  expiresIn?: string;
  metadata?: Partial<APIKeyMetadata>;
}

export interface APIKeyResponse {
  keyId: string;
  key: string;
  permissions: Permission[];
  expiresAt: Date;
  createdAt: Date;
}

export type Permission = 'read' | 'write' | 'admin' | 'webhook' | 'metrics' | 'delete' | 'update';

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export interface SlidingWindowConfig extends RateLimitConfig {
  strategy: 'sliding_window';
  windowSize: number;
}

export interface TokenBucketConfig extends RateLimitConfig {
  strategy: 'token_bucket';
  capacity: number;
  refillRate: number;
}

// Security Alert Types
export interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  source: string;
  timestamp: Date;
  metadata: AlertMetadata;
  status: AlertStatus;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
  notificationSent: boolean;
  notifiedAt?: Date;
  escalationLevel: number;
  category: AlertCategory;
  tags: string[];
}

export type AlertType = 
  | 'authentication_failed'
  | 'rate_limit_exceeded'
  | 'rate_limit_abuse'
  | 'cors_violation'
  | 'webhook_invalid_signature'
  | 'webhook_replay_attack'
  | 'unauthorized_ip'
  | 'api_key_compromised'
  | 'suspicious_activity'
  | 'token_bucket_abuse'
  | 'api_key_generation_failed'
  | 'revoked_key_used'
  | 'expired_key_used';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'resolved' | 'escalated' | 'ignored';

export type AlertCategory = 
  | 'authentication'
  | 'authorization'
  | 'rate_limiting'
  | 'webhook'
  | 'cors'
  | 'network'
  | 'api_keys'
  | 'general';

export interface AlertMetadata {
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  keyId?: string;
  [key: string]: any;
}

export interface AlertStatistics {
  totalCreated: number;
  totalResolved: number;
  recent: {
    lastHour: number;
    lastDay: number;
  };
  bySeverity: Record<AlertSeverity, number>;
  byType: Record<string, number>;
  topTypes: Array<{ type: string; count: number }>;
}

// Security Metrics Types
export interface SecurityMetrics {
  timestamp: string;
  uptime: UptimeMetrics;
  requests: RequestMetrics;
  authentication: AuthMetrics;
  rateLimiting: RateLimitMetrics;
  security: SecurityEventsMetrics;
  webhooks: WebhookMetrics;
  apiKeys: APIKeyMetrics;
}

export interface UptimeMetrics {
  duration: number;
  startTime: Date;
  lastRestart: Date;
  totalRequests: number;
}

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  blocked: number;
  successRate: string;
  avgResponseTime: string;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    avgResponseTime: string;
  }>;
  topIPs: Array<{
    ip: string;
    count: number;
    blocked: number;
  }>;
  byVersion: Record<string, {
    count: number;
    avgResponseTime: string;
  }>;
}

export interface AuthMetrics {
  totalAttempts: number;
  successful: number;
  failed: number;
  successRate: string;
  apiKeyValidations: number;
  apiKeyFailures: number;
  topUsers: Array<{
    userId: string;
    attempts: number;
    successful: number;
    failed: number;
    successRate: string;
  }>;
}

export interface RateLimitMetrics {
  totalBlocks: number;
  byStrategy: Record<string, {
    blocks: number;
    topIPs: string[];
  }>;
  topOffenders: Array<{
    ip: string;
    blocks: number;
    lastBlock: Date | null;
  }>;
}

export interface SecurityEventsMetrics {
  suspiciousActivities: number;
  securityAlerts: number;
  corsViolations: number;
  webhookViolations: number;
  bySeverity: Record<AlertSeverity, number>;
}

export interface WebhookMetrics {
  totalReceived: number;
  validated: number;
  rejected: number;
  successRate: string;
  byProvider: Record<string, {
    total: number;
    validated: number;
    rejected: number;
  }>;
}

export interface APIKeyMetrics {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  revokedKeys: number;
  totalUsers: number;
  keysExpiringSoon: number;
  topUsers: Array<{
    userId: string;
    keyCount: number;
  }>;
}

// CORS Types
export interface CORSPolicy {
  origin: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  optionsSuccessStatus: number;
}

export interface CORSError {
  error: string;
  message: string;
  allowedOrigins: string[];
  timestamp: string;
}

// Webhook Security Types
export interface WebhookConfig {
  secret: string;
  algorithm: 'sha1' | 'sha256' | 'sha512';
  header: string;
  timeout: number;
  requiredFields: string[];
}

export interface WebhookValidationResult {
  validated: boolean;
  signature?: string;
  timestamp?: string;
  error?: string;
}

export interface WebhookEvent {
  provider: string;
  signature: string;
  timestamp: string;
  payload: any;
  headers: Record<string, string>;
  ip: string;
}

// API Versioning Types
export interface VersionConfig {
  supported: boolean;
  deprecated: boolean;
  sunsetDate: Date | null;
  rateLimit: RateLimitConfig;
  features: string[];
}

export interface VersionInfo {
  version: string;
  supported: boolean;
  deprecated: boolean;
  sunsetDate: string | null;
  rateLimit: RateLimitConfig;
  features: string[];
}

export interface MigrationGuide {
  overview: string;
  changes: string[];
  breakingChanges: string[];
  steps: string[];
}

// Security Context Types
export interface SecurityContext {
  requestId: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  userId?: string;
  apiKeyId?: string;
  sessionId?: string;
  riskScore?: number;
}

// Configuration Types
export interface SecurityConfig {
  server: ServerConfig;
  cors: CORSConfig;
  rateLimiting: RateLimitingConfig;
  apiKeys: APIKeyConfig;
  alerts: AlertConfig;
  logging: LoggingConfig;
  webhooks: WebhookConfig;
  monitoring: MonitoringConfig;
}

export interface ServerConfig {
  port: number;
  dashboardPort: number;
  environment: 'development' | 'production' | 'test';
  trustProxy: boolean;
  enableMetrics: boolean;
}

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

export interface RateLimitingConfig {
  defaultWindowMs: number;
  defaultMaxRequests: number;
  strictMaxRequests: number;
  skipSuccessfulRequests: boolean;
  strategies: {
    slidingWindow: SlidingWindowConfig;
    tokenBucket: TokenBucketConfig;
  };
}

export interface APIKeyConfig {
  maxPerUser: number;
  defaultExpiry: string;
  saltRounds: number;
  keyLength: number;
  rotationEnabled: boolean;
}

export interface AlertConfig {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  duplicateThreshold: number;
  cleanupInterval: number;
  channels: {
    console: boolean;
    file: boolean;
    webhook: boolean;
    email: boolean;
  };
}

export interface LoggingConfig {
  level: string;
  directory: string;
  maxSize: string;
  maxFiles: string;
  enableConsole: boolean;
  enableFile: boolean;
}

export interface WebhookConfig {
  providers: Record<string, WebhookConfig>;
  timeout: number;
  ipWhitelist: Record<string, string[]>;
  signatureValidation: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  retentionDays: number;
  realTimeUpdateInterval: number;
  enableWebSocket: boolean;
  enableCharting: boolean;
}

// Dashboard Types
export interface DashboardMetrics {
  requestsPerMinute: number;
  activeAlerts: number;
  apiKeysCount: number;
  uptime: {
    hours: number;
  };
  systemStatus: {
    status: 'healthy' | 'warning' | 'critical';
    services: Record<string, 'running' | 'stopped' | 'error'>;
  };
}

export interface RealTimeUpdate {
  type: 'metrics' | 'alert' | 'system_status';
  data: any;
  timestamp: string;
}

// Error Types
export interface SecurityError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
}

export type SecurityErrorCode = 
  | 'AUTH_INVALID_KEY'
  | 'AUTH_EXPIRED_KEY'
  | 'AUTH_REVOKED_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CORS_VIOLATION'
  | 'WEBHOOK_INVALID_SIGNATURE'
  | 'WEBHOOK_EXPIRED'
  | 'VERSION_NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'REQUEST_TOO_LARGE'
  | 'SUSPICIOUS_ACTIVITY';

// Event Types
export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
  source: string;
}