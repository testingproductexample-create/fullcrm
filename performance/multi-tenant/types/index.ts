/**
 * Multi-Tenant System Types and Interfaces
 * UAE Tailoring Business Platform
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  configuration: TenantConfiguration;
  branding: TenantBranding;
  subscription: TenantSubscription;
  limits: TenantLimits;
  security: TenantSecurity;
}

export interface TenantConfiguration {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
  features: Record<string, boolean>;
  customFields: Record<string, any>;
}

export interface TenantBranding {
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'light' | 'dark' | 'auto';
  customCSS?: string;
  emailTemplates: EmailTemplate[];
  pdfTemplates: PDFTemplate[];
}

export interface EmailTemplate {
  type: 'welcome' | 'reset_password' | 'appointment_confirmation' | 'order_update';
  subject: string;
  body: string;
  variables: string[];
}

export interface PDFTemplate {
  type: 'invoice' | 'receipt' | 'measurement_sheet' | 'order_confirmation';
  template: string;
  styling: Record<string, any>;
}

export interface TenantSubscription {
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  startDate: Date;
  endDate: Date;
  monthlyPrice: number;
  features: string[];
  usage: SubscriptionUsage;
}

export interface SubscriptionUsage {
  users: number;
  storage: number; // in GB
  apiCalls: number;
  tenants: number;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorage: number; // in GB
  maxApiCalls: number;
  maxOrders: number;
  maxCustomers: number;
  features: Record<string, number>;
}

export interface TenantSecurity {
  encryption: boolean;
  twoFactorRequired: boolean;
  sessionTimeout: number; // in minutes
  passwordPolicy: PasswordPolicy;
  allowedIPs: string[];
  auditLog: boolean;
  dataRetention: number; // in days
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // number of previous passwords
}

// User and Role Management
export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: Role[];
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // hierarchy level
  isSystem: boolean; // system-generated role
  permissions: Permission[];
  inheritFrom?: string[]; // role IDs to inherit from
  restrictions: RoleRestrictions;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string; // 'orders', 'customers', 'reports', etc.
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: PermissionCondition[];
  metadata: Record<string, any>;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface RoleRestrictions {
  maxDiscount: number; // percentage
  maxOrderValue: number;
  canViewReports: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  timeRestrictions?: {
    allowedHours: { start: string; end: string }[];
    allowedDays: number[];
  };
}

// Context and Request Types
export interface TenantContext {
  tenant: Tenant;
  user?: TenantUser;
  permissions: string[];
  session: TenantSession;
  metadata: Record<string, any>;
}

export interface TenantSession {
  id: string;
  tenantId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  data: Record<string, any>;
  ip: string;
  userAgent: string;
}

// Data Isolation Types
export interface DataIsolationStrategy {
  type: 'database' | 'schema' | 'row_level' | 'column_level';
  configuration: Record<string, any>;
}

export interface TenantData {
  tenantId: string;
  schema: string;
  tables: TenantTable[];
  views: TenantView[];
  procedures: TenantProcedure[];
}

export interface TenantTable {
  name: string;
  columns: TenantColumn[];
  constraints: TenantConstraint[];
  indexes: TenantIndex[];
  triggers: TenantTrigger[];
}

export interface TenantColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isTenantId: boolean;
  isEncrypted: boolean;
  isIndexed: boolean;
}

export interface TenantConstraint {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  definition: string;
}

export interface TenantIndex {
  name: string;
  columns: string[];
  unique: boolean;
  tenantSpecific: boolean;
}

export interface TenantTrigger {
  name: string;
  event: 'insert' | 'update' | 'delete';
  timing: 'before' | 'after' | 'instead_of';
  function: string;
}

export interface TenantView {
  name: string;
  definition: string;
  tenantColumn: string;
  isUpdatable: boolean;
}

export interface TenantProcedure {
  name: string;
  definition: string;
  parameters: ProcedureParameter[];
  tenantValidation: boolean;
}

export interface ProcedureParameter {
  name: string;
  type: string;
  mode: 'in' | 'out' | 'inout';
}

// White Label Types
export interface WhiteLabelConfig {
  enabled: boolean;
  domain?: string;
  sslEnabled: boolean;
  customHeaders: Record<string, string>;
  favicon: string;
  robots: string;
  sitemap: string;
  customDomain: CustomDomain;
  dnsRecords: DNSRecord[];
}

export interface CustomDomain {
  domain: string;
  sslCertificate: string;
  sslPrivateKey: string;
  isVerified: boolean;
  verificationRecord: string;
  status: 'pending' | 'verified' | 'failed';
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'MX' | 'TXT';
  name: string;
  value: string;
  ttl: number;
}

// Onboarding Types
export interface OnboardingFlow {
  id: string;
  name: string;
  steps: OnboardingStep[];
  isActive: boolean;
  targetAudience: 'new_tenants' | 'existing_tenants' | 'all';
  estimatedDuration: number; // in minutes
  required: boolean;
}

export interface OnboardingStep {
  id: string;
  order: number;
  type: 'setup' | 'configuration' | 'integration' | 'training' | 'verification';
  title: string;
  description: string;
  component: string;
  isRequired: boolean;
  canSkip: boolean;
  conditions?: OnboardingCondition[];
  data: Record<string, any>;
}

export interface OnboardingCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'exists';
  value: any;
}

export interface OnboardingProgress {
  tenantId: string;
  flowId: string;
  currentStep: number;
  completedSteps: number[];
  startedAt: Date;
  completedAt?: Date;
  data: Record<string, any>;
}

// API and Routing Types
export interface TenantRoute {
  path: string;
  component: string;
  requiresAuth: boolean;
  requiredPermissions: string[];
  requiredRoles: string[];
  redirectTo?: string;
  layout: string;
  metadata: Record<string, any>;
}

export interface TenantAPIConfig {
  baseUrl: string;
  version: string;
  rateLimit: {
    requests: number;
    window: number; // in seconds
  };
  endpoints: APIEndpoint[];
  authentication: {
    method: 'jwt' | 'oauth' | 'api_key';
    required: boolean;
  };
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth: boolean;
  requiredPermissions: string[];
  rateLimit?: {
    requests: number;
    window: number;
  };
  responseFormat: 'json' | 'xml' | 'file';
}

// Monitoring and Analytics Types
export interface TenantMetrics {
  tenantId: string;
  timestamp: Date;
  metrics: {
    activeUsers: number;
    totalUsers: number;
    storageUsed: number;
    storageLimit: number;
    apiCalls: number;
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
}

export interface TenantAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Record<string, { before: any; after: any }>;
  ip: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Migration and Setup Types
export interface MigrationConfig {
  version: string;
  up: string;
  down: string;
  tenantIsolation: boolean;
  batchSize: number;
  timeout: number;
}

export interface SetupConfig {
  database: DatabaseConfig;
  cache: CacheConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionLimit: number;
}

export interface CacheConfig {
  type: 'redis' | 'memcached';
  host: string;
  port: number;
  ttl: number;
  maxMemory: number;
}

export interface StorageConfig {
  type: 'local' | 's3' | 'azure' | 'gcp';
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  encryption: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  rateLimitWindowMs: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  metricsInterval: number;
  alertThresholds: AlertThreshold[];
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  severity: 'warning' | 'critical';
  action: string;
}

// Response and Error Types
export interface MultiTenantResponse<T = any> {
  success: boolean;
  data?: T;
  error?: MultiTenantError;
  meta?: {
    tenant: string;
    timestamp: Date;
    requestId: string;
  };
}

export interface MultiTenantError {
  code: string;
  message: string;
  details?: Record<string, any>;
  tenantId?: string;
  timestamp: Date;
}

export interface TenantValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
