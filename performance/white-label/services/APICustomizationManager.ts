/**
 * API Customization Service
 * Handles API configuration, endpoints, authentication, and rate limiting
 */

export interface APICustomization {
  id: string;
  name: string;
  version: string;
  type: 'rest' | 'graphql' | 'webhook' | 'socket';
  configuration: APIConfig;
  endpoints: APIEndpoint[];
  authentication: AuthConfig;
  rateLimiting: RateLimitConfig;
  middleware: MiddlewareConfig[];
  documentation: APIDocumentation;
  monitoring: APIMonitoring;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIConfig {
  basePath: string;
  cors: CORSConfig;
  version: string;
  format: 'json' | 'xml' | 'form';
  compression: boolean;
  validation: {
    enabled: boolean;
    strict: boolean;
    schemas: ValidationSchema[];
  };
  pagination: {
    defaultLimit: number;
    maxLimit: number;
    cursor: boolean;
  };
  filtering: {
    enabled: boolean;
    operators: string[];
    fields: string[];
  };
  sorting: {
    enabled: boolean;
    defaultField: string;
    defaultOrder: 'asc' | 'desc';
  };
  caching: CacheConfig;
  logging: LoggingConfig;
}

export interface CORSConfig {
  enabled: boolean;
  origin: string | string[] | '*';
  methods: string[];
  headers: string[];
  credentials: boolean;
  maxAge: number;
  exposedHeaders?: string[];
}

export interface ValidationSchema {
  name: string;
  type: 'request' | 'response' | 'query' | 'body';
  endpoint: string;
  schema: any; // JSON Schema
  required: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  strategy: 'memory' | 'redis' | 'database';
  keyGenerator: string; // function name
  invalidation: {
    events: string[];
    patterns: string[];
  };
}

export interface LoggingConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'text';
  destinations: LogDestination[];
  sampling: {
    enabled: boolean;
    rate: number; // 0-1
  };
  privacy: {
    maskFields: string[];
    excludeFields: string[];
  };
}

export interface LogDestination {
  type: 'file' | 'database' | 'elasticsearch' | 'cloudwatch' | 'custom';
  config: Record<string, any>;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  description: string;
  category: string;
  handlers: EndpointHandler[];
  parameters: Parameter[];
  request: RequestConfig;
  response: ResponseConfig;
  authentication: EndpointAuth;
  rateLimit: EndpointRateLimit;
  validation: EndpointValidation;
  caching: EndpointCache;
  documentation: EndpointDocumentation;
  isActive: boolean;
}

export interface EndpointHandler {
  type: 'function' | 'middleware' | 'controller' | 'service';
  name: string;
  config: Record<string, any>;
  order: number;
  conditions?: HandlerCondition[];
}

export interface HandlerCondition {
  type: 'header' | 'query' | 'body' | 'user' | 'context';
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists';
  value: any;
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
  location: 'path' | 'query' | 'header' | 'body' | 'form';
  required: boolean;
  description?: string;
  default?: any;
  validation: ParameterValidation;
  examples?: any[];
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  minLength?: number;
  maxLength?: number;
}

export interface RequestConfig {
  body: {
    allowed: boolean;
    maxSize: number; // bytes
    contentTypes: string[];
    required: boolean;
  };
  files: {
    allowed: boolean;
    maxSize: number; // bytes per file
    maxCount: number;
    allowedTypes: string[];
  };
  headers: {
    required: string[];
    optional: string[];
    custom: Record<string, any>;
  };
}

export interface ResponseConfig {
  format: 'json' | 'xml' | 'form' | 'raw';
  statusCodes: Record<number, ResponseConfigDetails>;
  headers: Record<string, string>;
  compression: boolean;
  encoding: 'utf-8' | 'base64' | 'binary';
}

export interface ResponseConfigDetails {
  description: string;
  schema: any;
  example: any;
  headers?: Record<string, string>;
}

export interface EndpointAuth {
  required: boolean;
  types: AuthType[];
  roles?: string[];
  permissions?: string[];
  custom?: CustomAuthConfig;
}

export interface AuthType {
  type: 'bearer' | 'api_key' | 'basic' | 'oauth' | 'jwt' | 'custom';
  config: Record<string, any>;
  required: boolean;
}

export interface CustomAuthConfig {
  provider: string;
  configuration: Record<string, any>;
  rules: AuthRule[];
}

export interface AuthRule {
  condition: string;
  allow: boolean;
  message?: string;
}

export interface EndpointRateLimit {
  enabled: boolean;
  limit: number;
  window: number; // seconds
  strategy: 'sliding' | 'fixed' | 'token_bucket';
  key: string; // rate limit key
  exceptions?: RateLimitException[];
}

export interface RateLimitException {
  type: 'ip' | 'user' | 'role' | 'custom';
  value: string;
  limit?: number;
  window?: number;
}

export interface EndpointValidation {
  request: {
    enabled: boolean;
    schemas: ValidationSchema[];
  };
  response: {
    enabled: boolean;
    schemas: ValidationSchema[];
  };
  custom: CustomValidationRule[];
}

export interface CustomValidationRule {
  name: string;
  type: 'function' | 'expression' | 'custom';
  config: Record<string, any>;
  errorMessage: string;
}

export interface EndpointCache {
  enabled: boolean;
  ttl: number; // seconds
  varyBy: CacheVaryBy[];
  condition?: string;
  key?: string;
}

export interface CacheVaryBy {
  type: 'header' | 'query' | 'cookie' | 'user' | 'context';
  field: string;
}

export interface EndpointDocumentation {
  summary: string;
  description: string;
  tags: string[];
  examples: EndpointExample[];
  responses: DocumentationResponse[];
  deprecated: boolean;
  version: string;
}

export interface EndpointExample {
  name: string;
  description: string;
  request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    query?: Record<string, any>;
    body?: any;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: any;
  };
}

export interface DocumentationResponse {
  status: number;
  description: string;
  schema: any;
  example: any;
  headers?: Record<string, string>;
}

export interface AuthConfig {
  providers: AuthProvider[];
  settings: {
    sessionTimeout: number; // minutes
    refreshToken: boolean;
    passwordPolicy: PasswordPolicy;
    mfa: {
      enabled: boolean;
      methods: string[];
    };
    lockout: {
      enabled: boolean;
      attempts: number;
      duration: number; // minutes
    };
  };
}

export interface AuthProvider {
  id: string;
  type: 'local' | 'oauth' | 'saml' | 'ldap' | 'custom';
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  scopes?: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventReuse: number; // previous passwords
  maxAge: number; // days
}

export interface RateLimitConfig {
  enabled: boolean;
  global: GlobalRateLimit;
  perEndpoint: Record<string, EndpointRateLimit>;
  tiers: RateLimitTier[];
}

export interface GlobalRateLimit {
  enabled: boolean;
  limit: number;
  window: number; // seconds
}

export interface RateLimitTier {
  name: string;
  criteria: TierCriteria;
  limit: number;
  window: number;
}

export interface TierCriteria {
  userRole?: string[];
  userPlan?: string[];
  ipRange?: string;
  custom?: Record<string, any>;
}

export interface MiddlewareConfig {
  id: string;
  name: string;
  type: 'before' | 'after' | 'error' | 'custom';
  order: number;
  enabled: boolean;
  configuration: Record<string, any>;
  conditions?: MiddlewareCondition[];
}

export interface MiddlewareCondition {
  type: 'path' | 'method' | 'header' | 'user' | 'context';
  operator: 'equals' | 'contains' | 'matches' | 'regex';
  value: any;
}

export interface APIDocumentation {
  title: string;
  description: string;
  version: string;
  termsOfService?: string;
  contact: {
    name: string;
    email: string;
    url?: string;
  };
  license: {
    name: string;
    url?: string;
  };
  servers: APIServer[];
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface APIServer {
  url: string;
  description: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum: string[];
  default: string;
  description?: string;
}

export interface APIMonitoring {
  enabled: boolean;
  metrics: MetricConfig[];
  alerts: AlertConfig[];
  dashboards: DashboardConfig[];
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  source: 'request' | 'response' | 'custom';
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  duration: number; // minutes
  action: 'email' | 'webhook' | 'sms' | 'slack';
  recipients: string[];
  enabled: boolean;
}

export interface DashboardConfig {
  name: string;
  panels: DashboardPanel[];
  refreshInterval: number; // seconds
  timeRange: string; // e.g., '1h', '24h', '7d'
}

export interface DashboardPanel {
  title: string;
  type: 'graph' | 'table' | 'stat' | 'log';
  query: string;
  visualization: Record<string, any>;
}

export class APICustomizationManager {
  private apis: Map<string, APICustomization> = new Map();
  private endpoints: Map<string, APIEndpoint> = new Map();
  private observers: Set<APIChangeObserver> = new Set();

  constructor() {
    this.initializeDefaultAPI();
  }

  /**
   * Create new API customization
   */
  createAPI(api: APICustomization): void {
    this.apis.set(api.id, api);
    this.notifyObservers('api_created', api);
  }

  /**
   * Update API customization
   */
  updateAPI(apiId: string, updates: Partial<APICustomization>): void {
    const api = this.apis.get(apiId);
    if (api) {
      const updatedAPI = {
        ...api,
        ...updates,
        updatedAt: new Date()
      };
      this.apis.set(apiId, updatedAPI);
      this.notifyObservers('api_updated', updatedAPI);
    }
  }

  /**
   * Get API by ID
   */
  getAPI(apiId: string): APICustomization | undefined {
    return this.apis.get(apiId);
  }

  /**
   * Get all APIs
   */
  getAllAPIs(): APICustomization[] {
    return Array.from(this.apis.values());
  }

  /**
   * Add endpoint
   */
  addEndpoint(apiId: string, endpoint: APIEndpoint): void {
    const api = this.apis.get(apiId);
    if (api) {
      api.endpoints.push(endpoint);
      this.endpoints.set(endpoint.id, endpoint);
      this.updateAPI(apiId, api);
    }
  }

  /**
   * Update endpoint
   */
  updateEndpoint(endpointId: string, updates: Partial<APIEndpoint>): void {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      const updatedEndpoint = { ...endpoint, ...updates };
      this.endpoints.set(endpointId, updatedEndpoint);
      this.notifyObservers('endpoint_updated', updatedEndpoint);
    }
  }

  /**
   * Get endpoint by ID
   */
  getEndpoint(endpointId: string): APIEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  /**
   * Get endpoint by path and method
   */
  getEndpointByPath(path: string, method: string): APIEndpoint | undefined {
    return Array.from(this.endpoints.values()).find(
      endpoint => endpoint.path === path && endpoint.method === method
    );
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPI(apiId: string): any {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const openapi: any = {
      openapi: '3.0.0',
      info: {
        title: api.documentation.title,
        description: api.documentation.description,
        version: api.version,
        contact: api.documentation.contact,
        license: api.documentation.license
      },
      servers: api.documentation.servers,
      paths: {}
    };

    // Add paths
    api.endpoints.forEach(endpoint => {
      if (!openapi.paths[endpoint.path]) {
        openapi.paths[endpoint.path] = {};
      }

      const pathItem: any = {
        summary: endpoint.documentation.summary,
        description: endpoint.documentation.description,
        tags: endpoint.documentation.tags,
        parameters: this.generateParameters(endpoint.parameters),
        requestBody: this.generateRequestBody(endpoint),
        responses: this.generateResponses(endpoint.documentation.responses),
        security: endpoint.authentication.required ? this.generateSecurity(endpoint.authentication) : []
      };

      openapi.paths[endpoint.path][endpoint.method.toLowerCase()] = pathItem;
    });

    return openapi;
  }

  /**
   * Generate parameters for OpenAPI
   */
  private generateParameters(parameters: Parameter[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      in: param.location,
      required: param.required,
      description: param.description,
      schema: {
        type: param.type,
        default: param.default
      },
      example: param.examples?.[0]
    }));
  }

  /**
   * Generate request body for OpenAPI
   */
  private generateRequestBody(endpoint: APIEndpoint): any {
    if (!endpoint.request.body.allowed) {
      return undefined;
    }

    return {
      required: endpoint.request.body.required,
      content: {
        'application/json': {
          schema: endpoint.response.statusCodes[200]?.schema,
          example: endpoint.documentation.examples[0]?.request.body
        }
      }
    };
  }

  /**
   * Generate responses for OpenAPI
   */
  private generateResponses(responses: DocumentationResponse[]): any {
    const result: any = {};
    
    responses.forEach(response => {
      result[response.status] = {
        description: response.description,
        content: {
          'application/json': {
            schema: response.schema,
            example: response.example,
            headers: response.headers
          }
        }
      };
    });

    return result;
  }

  /**
   * Generate security for OpenAPI
   */
  private generateSecurity(auth: EndpointAuth): any[] {
    const security: any[] = [];
    
    auth.types.forEach(authType => {
      switch (authType.type) {
        case 'bearer':
          security.push({ bearerAuth: [] });
          break;
        case 'api_key':
          security.push({ apiKey: [] });
          break;
        case 'basic':
          security.push({ basicAuth: [] });
          break;
      }
    });

    return security;
  }

  /**
   * Validate request
   */
  validateRequest(endpointId: string, request: any): {
    valid: boolean;
    errors: ValidationError[];
  } {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return { valid: false, errors: [{ field: 'endpoint', message: 'Endpoint not found' }] };
    }

    const errors: ValidationError[] = [];

    // Validate required parameters
    endpoint.parameters.forEach(param => {
      if (param.required) {
        const value = this.getParameterValue(request, param);
        if (value === undefined || value === null) {
          errors.push({
            field: param.name,
            message: `${param.name} is required`
          });
        }
      }
    });

    // Validate parameter values
    endpoint.parameters.forEach(param => {
      const value = this.getParameterValue(request, param);
      if (value !== undefined) {
        const paramErrors = this.validateParameterValue(param, value);
        errors.push(...paramErrors);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get parameter value from request
   */
  private getParameterValue(request: any, param: Parameter): any {
    switch (param.location) {
      case 'path':
        return request.params?.[param.name];
      case 'query':
        return request.query?.[param.name];
      case 'header':
        return request.headers?.[param.name.toLowerCase()];
      case 'body':
        return request.body?.[param.name];
      case 'form':
        return request.body?.[param.name];
      default:
        return undefined;
    }
  }

  /**
   * Validate parameter value
   */
  private validateParameterValue(param: Parameter, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type validation
    switch (param.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({ field: param.name, message: `${param.name} must be a string` });
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          errors.push({ field: param.name, message: `${param.name} must be a number` });
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({ field: param.name, message: `${param.name} must be a boolean` });
        }
        break;
    }

    // Validation rules
    if (param.validation.min !== undefined && value < param.validation.min) {
      errors.push({ field: param.name, message: `${param.name} must be >= ${param.validation.min}` });
    }

    if (param.validation.max !== undefined && value > param.validation.max) {
      errors.push({ field: param.name, message: `${param.name} must be <= ${param.validation.max}` });
    }

    if (param.validation.minLength !== undefined && String(value).length < param.validation.minLength) {
      errors.push({ field: param.name, message: `${param.name} must have at least ${param.validation.minLength} characters` });
    }

    if (param.validation.maxLength !== undefined && String(value).length > param.validation.maxLength) {
      errors.push({ field: param.name, message: `${param.name} must have at most ${param.validation.maxLength} characters` });
    }

    if (param.validation.pattern && !new RegExp(param.validation.pattern).test(String(value))) {
      errors.push({ field: param.name, message: `${param.name} does not match required pattern` });
    }

    if (param.validation.enum && !param.validation.enum.includes(value)) {
      errors.push({ field: param.name, message: `${param.name} must be one of: ${param.validation.enum.join(', ')}` });
    }

    return errors;
  }

  /**
   * Check rate limit
   */
  checkRateLimit(
    apiId: string, 
    endpointId: string, 
    identifier: string
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    limit: number;
  } {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint || !endpoint.rateLimit.enabled) {
      return { allowed: true, remaining: 1000, resetTime: new Date(), limit: 1000 };
    }

    // Simplified rate limiting logic
    const key = `${apiId}:${endpointId}:${identifier}`;
    const now = new Date();
    const resetTime = new Date(now.getTime() + endpoint.rateLimit.window * 1000);

    // In production, use Redis or similar for actual rate limiting
    return {
      allowed: true,
      remaining: endpoint.rateLimit.limit - 1,
      resetTime,
      limit: endpoint.rateLimit.limit
    };
  }

  /**
   * Log API request
   */
  logRequest(request: any, response: any, duration: number): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      duration,
      userId: request.user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.id,
      error: response.error
    };

    console.log('API Request:', logEntry);
  }

  /**
   * Generate API key
   */
  generateAPIKey(apiId: string, config: {
    name: string;
    permissions: string[];
    expiresAt?: Date;
  }): {
    key: string;
    secret: string;
  } {
    // Simplified API key generation
    const key = `ak_${apiId}_${Date.now()}`;
    const secret = `as_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    return { key, secret };
  }

  /**
   * Validate API key
   */
  validateAPIKey(key: string): {
    valid: boolean;
    apiId?: string;
    permissions?: string[];
    expiresAt?: Date;
  } {
    // Simplified validation
    if (!key.startsWith('ak_')) {
      return { valid: false };
    }

    const parts = key.split('_');
    if (parts.length < 3) {
      return { valid: false };
    }

    return {
      valid: true,
      apiId: parts[1],
      permissions: ['read', 'write'],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
  }

  /**
   * Subscribe to API changes
   */
  subscribe(observer: APIChangeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from API changes
   */
  unsubscribe(observer: APIChangeObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify observers
   */
  private notifyObservers(event: string, data: any): void {
    this.observers.forEach(observer => observer.onAPIEvent(event, data));
  }

  /**
   * Initialize default API
   */
  private initializeDefaultAPI(): void {
    const defaultAPI: APICustomization = {
      id: 'default-api',
      name: 'Default API',
      version: '1.0.0',
      type: 'rest',
      configuration: {
        basePath: '/api/v1',
        cors: {
          enabled: true,
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          headers: ['Content-Type', 'Authorization'],
          credentials: false,
          maxAge: 86400
        },
        version: '1.0.0',
        format: 'json',
        compression: true,
        validation: {
          enabled: true,
          strict: false,
          schemas: []
        },
        pagination: {
          defaultLimit: 20,
          maxLimit: 100,
          cursor: false
        },
        filtering: {
          enabled: true,
          operators: ['eq', 'ne', 'gt', 'lt', 'in', 'contains'],
          fields: []
        },
        sorting: {
          enabled: true,
          defaultField: 'createdAt',
          defaultOrder: 'desc'
        },
        caching: {
          enabled: false,
          ttl: 300,
          strategy: 'memory',
          keyGenerator: 'default',
          invalidation: {
            events: [],
            patterns: []
          }
        },
        logging: {
          enabled: true,
          level: 'info',
          format: 'json',
          destinations: [
            {
              type: 'file',
              config: { path: 'api.log' }
            }
          ],
          sampling: {
            enabled: false,
            rate: 1
          },
          privacy: {
            maskFields: ['password', 'token'],
            excludeFields: []
          }
        }
      },
      endpoints: [],
      authentication: {
        providers: [
          {
            id: 'bearer',
            type: 'bearer',
            name: 'Bearer Token',
            enabled: true,
            configuration: {}
          }
        ],
        settings: {
          sessionTimeout: 60,
          refreshToken: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
            preventReuse: 5,
            maxAge: 90
          },
          mfa: {
            enabled: false,
            methods: []
          },
          lockout: {
            enabled: true,
            attempts: 5,
            duration: 15
          }
        }
      },
      rateLimiting: {
        enabled: true,
        global: {
          enabled: true,
          limit: 1000,
          window: 3600
        },
        perEndpoint: {},
        tiers: []
      },
      middleware: [],
      documentation: {
        title: 'Default API',
        description: 'Default API documentation',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        },
        license: {
          name: 'MIT'
        },
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production server'
          }
        ]
      },
      monitoring: {
        enabled: true,
        metrics: [
          {
            name: 'request_count',
            type: 'counter',
            description: 'Number of requests',
            labels: ['method', 'path', 'status'],
            source: 'request',
            aggregation: 'sum'
          }
        ],
        alerts: [],
        dashboards: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.createAPI(defaultAPI);
  }
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface APIChangeObserver {
  onAPIEvent(event: string, data: any): void;
}

// Export singleton instance
export const apiCustomizationManager = new APICustomizationManager();