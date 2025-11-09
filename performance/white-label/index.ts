/**
 * White-Label Platform Main Entry Point
 * Exports all components and provides a unified interface
 */

// Core Components
export { ThemeManager, themeManager } from './components/ThemeManager';
export { BrandingManager, brandingManager } from './components/BrandingManager';
export { LanguageManager, languageManager } from './components/LanguageManager';
export { RegionalManager, regionalManager } from './components/RegionalManager';
export { TemplateManager, templateManager } from './components/TemplateManager';
export { FeatureFlagManager, featureFlagManager } from './components/FeatureFlagManager';

// Services
export { CustomDomainManager, customDomainManager } from './services/CustomDomainManager';
export { APICustomizationManager, apiCustomizationManager } from './services/APICustomizationManager';

// Configuration
export { WhiteLabelSetupTools, setupTools } from './config/SetupTools';

// Types
export type {
  CustomTheme,
  BrandColors,
  Typography,
  BrandIdentity,
  BrandAsset,
  Language,
  Translation,
  RegionalConfig,
  Template,
  FeatureFlag,
  CustomDomain,
  APICustomization,
  WhiteLabelConfig,
  InstanceConfig,
  BrandingConfig,
  ThemeConfig,
  LocalizationConfig,
  BusinessConfig,
  FeatureConfig,
  InfrastructureConfig
} from './config/SetupTools';

// Admin Interface
export { default as AdminDashboard } from './admin/AdminDashboard';
export * from './admin/AdminDashboard';

// Main White-Label Platform Class
export class WhiteLabelPlatform {
  private static instance: WhiteLabelPlatform;
  
  private constructor() {
    this.initialize();
  }

  public static getInstance(): WhiteLabelPlatform {
    if (!WhiteLabelPlatform.instance) {
      WhiteLabelPlatform.instance = new WhiteLabelPlatform();
    }
    return WhiteLabelPlatform.instance;
  }

  private initialize(): void {
    console.log('Initializing White-Label Platform...');
    
    // Initialize all managers
    themeManager;
    brandingManager;
    languageManager;
    regionalManager;
    templateManager;
    featureFlagManager;
    customDomainManager;
    apiCustomizationManager;
    setupTools;
    
    console.log('White-Label Platform initialized successfully');
  }

  /**
   * Get platform information
   */
  public getPlatformInfo(): PlatformInfo {
    return {
      version: '1.0.0',
      name: 'White-Label Platform',
      description: 'Comprehensive white-label and customization system',
      components: {
        themes: themeManager.getAllThemes().length,
        brands: brandingManager.getAllBrands().length,
        languages: languageManager.getAllLanguages().length,
        regions: regionalManager.getAllRegions().length,
        templates: templateManager.getAllTemplates().length,
        features: featureFlagManager.getAllFlags().length,
        domains: customDomainManager.getAllDomains().length,
        apis: apiCustomizationManager.getAllAPIs().length
      },
      status: 'ready'
    };
  }

  /**
   * Initialize a new white-label instance
   */
  public async createInstance(config: Partial<WhiteLabelConfig>): Promise<{
    success: boolean;
    instanceId?: string;
    error?: string;
  }> {
    try {
      // Create configuration
      const configId = setupTools.createConfig({
        name: config.name || 'New Instance',
        description: config.description || 'White-label instance',
        version: config.version || '1.0.0',
        instance: config.instance || {
          name: 'default',
          subdomain: 'default',
          type: 'starter',
          environment: 'production',
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          settings: {
            maintenanceMode: false,
            debugMode: false,
            analyticsEnabled: true,
            emailNotifications: true,
            backupEnabled: true,
            autoScaling: false,
            customCSS: '',
            customJS: ''
          }
        },
        branding: config.branding || this.getDefaultBrandingConfig(),
        theming: config.theming || this.getDefaultThemeConfig(),
        localization: config.localization || this.getDefaultLocalizationConfig(),
        business: config.business || this.getDefaultBusinessConfig(),
        features: config.features || this.getDefaultFeatureConfig(),
        infrastructure: config.infrastructure || this.getDefaultInfrastructureConfig(),
        metadata: config.metadata || {
          author: 'System',
          tags: ['white-label', 'platform'],
          category: 'instance',
          complexity: 'simple',
          estimatedSetupTime: 30,
          requirements: [],
          dependencies: []
        }
      });

      // Setup the instance
      const setupResult = await setupTools.setupInstance(configId);
      
      if (setupResult.success) {
        return {
          success: true,
          instanceId: configId
        };
      } else {
        return {
          success: false,
          error: setupResult.errors?.map(e => e.message).join(', ') || 'Setup failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update white-label instance
   */
  public updateInstance(configId: string, updates: Partial<WhiteLabelConfig>): void {
    setupTools.updateConfig(configId, updates);
  }

  /**
   * Get instance configuration
   */
  public getInstance(configId: string): WhiteLabelConfig | undefined {
    return setupTools.getConfig(configId);
  }

  /**
   * Get all instances
   */
  public getAllInstances(): WhiteLabelConfig[] {
    return setupTools.getAllConfigs();
  }

  /**
   * Export instance configuration
   */
  public exportInstance(configId: string, format: 'json' | 'yaml' = 'json'): string {
    return setupTools.exportConfig(configId, format);
  }

  /**
   * Import instance configuration
   */
  public importInstance(configData: string, format: 'json' | 'yaml' = 'json'): string {
    return setupTools.importConfig(configData, format);
  }

  /**
   * Clone instance
   */
  public cloneInstance(configId: string, modifications?: Partial<WhiteLabelConfig>): string {
    return setupTools.cloneConfig(configId, modifications);
  }

  /**
   * Delete instance
   */
  public deleteInstance(configId: string): boolean {
    return setupTools.deleteConfig(configId);
  }

  /**
   * Get default branding configuration
   */
  private getDefaultBrandingConfig() {
    return {
      identity: {
        id: 'default',
        name: 'Default Brand',
        description: 'Default brand identity',
        assets: {
          logo: null,
          favicon: null,
          banner: null,
          icons: [],
          backgrounds: []
        },
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          neutral: '#6B7280'
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          headingFont: 'Inter, sans-serif',
          bodyFont: 'Inter, sans-serif'
        },
        voice: {
          tone: 'professional',
          personality: ['reliable', 'innovative', 'user-focused'],
          messaging: {
            welcome: 'Welcome to our platform',
            tagline: 'Empowering your success',
            callToAction: 'Get started today'
          }
        },
        guidelines: {
          logoUsage: 'Use logo on white or light backgrounds',
          colorUsage: 'Primary color for CTAs, secondary for accents',
          typographyRules: 'Use consistent font weights and sizes',
          imageryStyle: 'Clean, professional, modern'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      assets: {
        logo: '',
        favicon: '',
        icons: [],
        backgrounds: []
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSizes: {
          small: '0.875rem',
          base: '1rem',
          large: '1.125rem',
          xlarge: '1.25rem'
        }
      },
      messaging: {
        welcome: 'Welcome to our platform',
        tagline: 'Empowering your success',
        callToAction: 'Get started today'
      }
    };
  }

  /**
   * Get default theme configuration
   */
  private getDefaultThemeConfig() {
    return {
      theme: {
        id: 'default',
        name: 'Default Theme',
        brand: {
          logo: '/assets/logo-default.png',
          favicon: '/assets/favicon-default.ico',
          colors: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#10B981',
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: '#1F2937',
            textSecondary: '#6B7280',
            border: '#E5E7EB',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444'
          },
          typography: {
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem'
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75
            }
          },
          components: {
            button: {
              borderRadius: '0.5rem',
              padding: {
                sm: '0.5rem 1rem',
                md: '0.75rem 1.5rem',
                lg: '1rem 2rem'
              }
            },
            card: {
              borderRadius: '0.75rem',
              shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            },
            input: {
              borderRadius: '0.5rem',
              border: '1px solid #D1D5DB',
              focus: 'border-blue-500 ring-1 ring-blue-500'
            }
          }
        },
        cssVariables: {
          '--spacing-unit': '0.25rem',
          '--animation-duration': '200ms'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      variants: [],
      customizations: []
    };
  }

  /**
   * Get default localization configuration
   */
  private getDefaultLocalizationConfig() {
    return {
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      regions: [],
      timeZone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
      currency: 'USD',
      translations: []
    };
  }

  /**
   * Get default business configuration
   */
  private getDefaultBusinessConfig() {
    return {
      rules: {
        taxSettings: {
          enabled: false,
          rate: 0,
          type: 'none'
        },
        shippingRules: {
          freeShippingThreshold: 50
        },
        paymentMethods: [],
        orderProcessing: {
          autoProcessing: true
        },
        inventory: {
          tracking: true,
          lowStockThreshold: 10
        }
      },
      compliance: {
        gdpr: false,
        ccpa: false,
        termsOfService: '',
        privacyPolicy: '',
        cookiePolicy: ''
      },
      integrations: {
        analytics: {
          provider: 'google',
          trackingId: '',
          config: {}
        },
        email: {
          provider: 'sendgrid',
          apiKey: '',
          fromEmail: '',
          fromName: '',
          templates: []
        },
        payment: {
          providers: [],
          settings: {
            currency: 'USD',
            captureMode: 'automatic',
            settlementCurrency: 'USD'
          }
        },
        shipping: {
          providers: [],
          rules: {
            freeShippingThreshold: 50,
            zones: []
          }
        }
      }
    };
  }

  /**
   * Get default feature configuration
   */
  private getDefaultFeatureConfig() {
    return {
      flags: [],
      experiments: [],
      modules: [
        {
          name: 'analytics',
          enabled: true,
          config: {}
        },
        {
          name: 'notifications',
          enabled: true,
          config: {}
        }
      ],
      permissions: []
    };
  }

  /**
   * Get default infrastructure configuration
   */
  private getDefaultInfrastructureConfig() {
    return {
      domains: {
        primary: '',
        aliases: [],
        ssl: {
          provider: 'letsencrypt',
          autoRenew: true
        }
      },
      api: {
        basePath: '/api/v1',
        authentication: {},
        rateLimiting: {}
      },
      database: {
        provider: 'postgresql',
        config: {}
      },
      storage: {
        provider: 'aws_s3',
        config: {}
      },
      caching: {
        provider: 'redis',
        config: {}
      }
    };
  }
}

export interface PlatformInfo {
  version: string;
  name: string;
  description: string;
  components: {
    themes: number;
    brands: number;
    languages: number;
    regions: number;
    templates: number;
    features: number;
    domains: number;
    apis: number;
  };
  status: 'ready' | 'initializing' | 'error';
}

// Export the singleton instance
export const whiteLabelPlatform = WhiteLabelPlatform.getInstance();