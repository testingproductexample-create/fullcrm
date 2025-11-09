/**
 * White-Label Platform Usage Examples
 * Demonstrates various use cases and configurations
 */

import { 
  WhiteLabelPlatform, 
  WhiteLabelConfig,
  themeManager,
  brandingManager,
  languageManager,
  regionalManager,
  featureFlagManager,
  customDomainManager,
  apiCustomizationManager,
  setupTools
} from './index';

// Example 1: Basic White-Label Instance Creation
async function basicExample() {
  console.log('=== Basic White-Label Instance Example ===');
  
  const platform = WhiteLabelPlatform.getInstance();
  
  // Create a simple white-label instance
  const result = await platform.createInstance({
    name: 'Acme Corp',
    description: 'Acme Corporation branded experience',
    version: '1.0.0',
    instance: {
      name: 'acme',
      subdomain: 'acme',
      type: 'professional',
      environment: 'production',
      timezone: 'America/New_York',
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
    branding: {
      identity: {
        id: 'acme',
        name: 'Acme Corporation',
        description: 'Leading provider of innovative solutions',
        assets: {
          logo: null,
          favicon: null,
          banner: null,
          icons: [],
          backgrounds: []
        },
        colors: {
          primary: '#FF6B35',
          secondary: '#004E89',
          accent: '#F7B801',
          neutral: '#6B7280'
        },
        typography: {
          fontFamily: 'Roboto, sans-serif',
          headingFont: 'Roboto, sans-serif',
          bodyFont: 'Open Sans, sans-serif'
        },
        voice: {
          tone: 'professional',
          personality: ['innovative', 'reliable', 'friendly'],
          messaging: {
            welcome: 'Welcome to Acme Corporation',
            tagline: 'Innovation at its finest',
            callToAction: 'Discover our solutions'
          }
        },
        guidelines: {
          logoUsage: 'Use logo on white or light backgrounds only',
          colorUsage: 'Primary for CTAs, secondary for highlights',
          typographyRules: 'Roboto for headings, Open Sans for body',
          imageryStyle: 'Clean, modern, tech-focused'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      assets: {
        logo: '/assets/acme-logo.png',
        favicon: '/assets/acme-favicon.ico',
        icons: ['/assets/acme-icon-16.png', '/assets/acme-icon-32.png'],
        backgrounds: ['/assets/acme-bg-light.png', '/assets/acme-bg-dark.png']
      },
      colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        accent: '#F7B801',
        background: '#FFFFFF',
        text: '#1A1A1A'
      },
      typography: {
        fontFamily: 'Roboto, sans-serif',
        fontSizes: {
          small: '0.875rem',
          base: '1rem',
          large: '1.125rem',
          xlarge: '1.25rem'
        }
      },
      messaging: {
        welcome: 'Welcome to Acme Corporation',
        tagline: 'Innovation at its finest',
        callToAction: 'Discover our solutions'
      }
    }
  });
  
  if (result.success) {
    console.log(`✅ Instance created successfully: ${result.instanceId}`);
    
    // Export the configuration
    const configData = platform.exportInstance(result.instanceId!, 'json');
    console.log('📦 Configuration exported');
    
    return result.instanceId;
  } else {
    console.error('❌ Failed to create instance:', result.error);
    return null;
  }
}

// Example 2: Advanced Multi-Language Configuration
async function multilingualExample() {
  console.log('\n=== Multi-Language Configuration Example ===');
  
  // Add multiple languages
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
  ];
  
  languages.forEach(lang => {
    languageManager.registerLanguage(lang);
  });
  
  // Add translations
  const translations = {
    welcome: {
      en: 'Welcome to our platform',
      es: 'Bienvenido a nuestra plataforma',
      fr: 'Bienvenue sur notre plateforme',
      de: 'Willkommen auf unserer Plattform'
    },
    login: {
      en: 'Login',
      es: 'Iniciar sesión',
      fr: 'Connexion',
      de: 'Anmelden'
    },
    signup: {
      en: 'Sign Up',
      es: 'Registrarse',
      fr: 'S\'inscrire',
      de: 'Registrieren'
    }
  };
  
  // Import translations
  Object.entries(translations).forEach(([key, translationsByLang]) => {
    Object.entries(translationsByLang).forEach(([langCode, value]) => {
      languageManager.addTranslation(langCode, 'common', {
        key,
        value,
        metadata: {
          lastModified: new Date(),
          reviewed: true,
          confidence: 1
        }
      });
    });
  });
  
  // Set Spanish as active
  languageManager.setActiveLanguage('es');
  
  // Test translation
  const welcomeMessage = languageManager.getTranslation('welcome');
  console.log(`🌍 Welcome message in Spanish: "${welcomeMessage}"`);
  
  // Switch to German
  languageManager.setActiveLanguage('de');
  const loginText = languageManager.getTranslation('login');
  console.log(`🇩🇪 Login text in German: "${loginText}"`);
}

// Example 3: Regional Configuration with Business Rules
async function regionalExample() {
  console.log('\n=== Regional Configuration Example ===');
  
  // Create US East region
  const usEastRegion = {
    regionId: 'us-east',
    name: 'US East',
    country: 'United States',
    timezone: 'America/New_York',
    currency: {
      code: 'USD',
      symbol: '$',
      position: 'before',
      decimalPlaces: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.'
    },
    taxSettings: {
      enabled: true,
      rate: 8.25,
      type: 'sales_tax',
      registration: {
        required: false,
        format: 'xx-xxxxxxx',
        validation: '^[0-9]{2}-?[0-9]{7}$'
      },
      exemptions: {
        customerTypes: ['nonprofit', 'government'],
        productCategories: ['food', 'books']
      },
      reporting: {
        frequency: 'monthly',
        format: 'standard'
      }
    },
    shipping: {
      providers: [],
      zones: [],
      rules: {
        freeShippingThreshold: 50,
        maxWeight: 50
      }
    },
    payment: {
      methods: [],
      processors: [],
      settings: {
        currency: 'USD',
        captureMode: 'automatic',
        settlementCurrency: 'USD'
      }
    },
    legal: {
      compliance: {
        gdpr: { enabled: false, requirements: [] },
        ccpa: { enabled: true, requirements: ['privacy_notice', 'opt_out'] },
        other: []
      },
      terms: {
        version: '1.0',
        lastUpdated: new Date(),
        url: '/terms'
      },
      privacy: {
        version: '1.0',
        lastUpdated: new Date(),
        url: '/privacy'
      },
      returns: {
        days: 30,
        conditions: ['original packaging', 'no signs of use'],
        restockingFee: 0
      }
    },
    businessRules: {
      order: {
        minimumOrder: 25,
        autoProcessing: true,
        approvalThresholds: {
          credit: 1000,
          amount: 5000
        },
        cancellationPolicy: {
          allowed: true,
          windowHours: 24,
          fees: 0
        }
      },
      inventory: {
        tracking: true,
        lowStockThreshold: 10,
        backorders: { allowed: false },
        overselling: { allowed: false, buffer: 0 }
      },
      customer: {
        registration: {
          required: true,
          approvalRequired: false
        },
        credit: {
          enabled: true,
          limits: { default: 500, max: 5000 },
          terms: 'Net 30'
        },
        pricing: {
          tiered: true,
          bulk: true
        }
      },
      pricing: {
        discounts: {
          maximum: 50,
          stacking: false,
          expiryHandling: 'expire'
        },
        rounding: {
          method: 'nearest',
          decimals: 2
        },
        currency: {
          base: 'USD',
          display: 'customer'
        }
      }
    },
    formatting: {
      date: {
        format: 'MM/dd/yyyy',
        timezone: 'America/New_York',
        firstDayOfWeek: 0
      },
      time: {
        format: '12h',
        timezone: 'America/New_York',
        showSeconds: false
      },
      number: {
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        currencyFormat: '$#,##0.00'
      },
      address: {
        format: '{{street}}\n{{city}}, {{state}} {{zip}}\n{{country}}',
        requiredFields: ['street', 'city', 'state', 'zip'],
        validation: {
          postalCode: true,
          phone: true,
          email: true
        }
      },
      phone: {
        format: '(xxx) xxx-xxxx',
        countryCode: '+1',
        mobileFormat: '+1 xxx-xxx-xxxx'
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  regionalManager.registerRegion(usEastRegion);
  regionalManager.setActiveRegion('us-east');
  
  // Test regional functionality
  const formattedPrice = regionalManager.formatCurrency(99.99);
  console.log(`💰 Formatted price: ${formattedPrice}`);
  
  const tax = regionalManager.calculateTax(99.99, 'individual', 'electronics');
  console.log(`🧾 Calculated tax: $${tax.tax.toFixed(2)} (${tax.rate}%)`);
  
  // Format address
  const address = {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'United States'
  };
  
  const formattedAddress = regionalManager.formatAddress(address);
  console.log(`📍 Formatted address:\n${formattedAddress}`);
}

// Example 4: Feature Flags and A/B Testing
async function featureFlagExample() {
  console.log('\n=== Feature Flags & A/B Testing Example ===');
  
  // Create a percentage-based feature flag
  const newCheckoutFlag = {
    id: 'new-checkout',
    name: 'New Checkout Experience',
    key: 'new_checkout',
    description: 'Enable the new checkout flow',
    type: 'percentage',
    configuration: {
      defaultValue: false,
      variants: [
        { id: 'old', name: 'Old Checkout', value: false, weight: 50 },
        { id: 'new', name: 'New Checkout', value: true, weight: 50 }
      ]
    },
    targeting: {
      include: { segments: ['all_users'] },
      exclude: {}
    },
    environment: {
      development: true,
      staging: true,
      production: true
    },
    metrics: { enabled: 0, disabled: 0 },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      version: 1,
      tags: ['checkout', 'conversion']
    },
    status: 'active'
  };
  
  featureFlagManager.registerFlag(newCheckoutFlag);
  
  // Create user segment
  const vipSegment = {
    id: 'vip-customers',
    name: 'VIP Customers',
    description: 'High-value customers',
    rules: [
      { property: 'totalSpent', operator: 'greater_than', value: 1000 },
      { property: 'membership', operator: 'equals', value: 'vip' }
    ],
    size: 150,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  featureFlagManager.createSegment(vipSegment);
  
  // Create A/B test experiment
  const checkoutExperiment = {
    id: 'checkout-color-test',
    name: 'Checkout Button Color Test',
    description: 'Testing blue vs green checkout buttons',
    flags: ['button_color'],
    variants: [
      { id: 'control', name: 'Blue Button', flagValues: { button_color: 'blue' }, traffic: 50 },
      { id: 'treatment', name: 'Green Button', flagValues: { button_color: 'green' }, traffic: 50 }
    ],
    traffic: {
      control: 50,
      variants: [{ variantId: 'treatment', percentage: 50 }]
    },
    metrics: {
      primary: [{ name: 'conversion', type: 'conversion', event: 'purchase', aggregation: 'sum' }]
    },
    status: 'running',
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  featureFlagManager.createExperiment(checkoutExperiment);
  
  // Test feature flag evaluation
  const testUsers = [
    { id: 'user1', properties: { totalSpent: 500, membership: 'regular' } },
    { id: 'user2', properties: { totalSpent: 1500, membership: 'vip' } },
    { id: 'user3', properties: { totalSpent: 200, membership: 'regular' } }
  ];
  
  testUsers.forEach(user => {
    const hasNewCheckout = featureFlagManager.evaluateFlag('new_checkout', user.id, user.properties);
    console.log(`👤 User ${user.id}: ${hasNewCheckout ? '✅ New checkout' : '❌ Old checkout'}`);
  });
}

// Example 5: Custom Domain Setup
async function customDomainExample() {
  console.log('\n=== Custom Domain Configuration Example ===');
  
  // Create a custom domain configuration
  const customDomain = {
    id: 'shop-company-com',
    domain: 'shop.company.com',
    type: 'CNAME',
    status: 'pending',
    configuration: {
      provider: 'cloudflare',
      dnsRecords: [],
      verification: {
        method: 'dns',
        token: 'wl_verification_token_12345',
        status: 'pending'
      },
      redirects: [
        { from: 'www.shop.company.com', to: 'shop.company.com', type: '301', status: 'active' }
      ],
      caching: {
        enabled: true,
        rules: [
          { id: 'static', pattern: '*.css', ttl: 3600 },
          { id: 'images', pattern: '*.jpg,*.png', ttl: 86400 }
        ],
        ttl: { static: 3600, dynamic: 300, api: 60 },
        purge: { automatic: true, frequency: 'daily' }
      },
      security: {
        ssl: {
          enabled: true,
          provider: 'letsencrypt',
          autoRenewal: true,
          hsts: { enabled: true, maxAge: 31536000, includeSubdomains: true }
        },
        ddos: { enabled: true, provider: 'cloudflare' },
        firewall: { enabled: true, mode: 'block' }
      }
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      autoRenewal: true,
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubdomains: true,
        preload: false
      }
    },
    routing: { rules: [], defaultAction: 'serve' },
    analytics: { tracking: { enabled: true, provider: 'google' } },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await customDomainManager.registerDomain(customDomain);
  
  // Get verification instructions
  const verification = await customDomainManager.verifyDomain(customDomain.id, 'dns');
  console.log('🔍 Domain verification instructions:');
  verification.instructions.forEach(instruction => console.log(`  - ${instruction}`));
  
  // Check domain status
  const status = await customDomainManager.checkDomainStatus(customDomain.id);
  console.log('📊 Domain status:', status);
}

// Example 6: Template Management
async function templateExample() {
  console.log('\n=== Template Management Example ===');
  
  // Create a custom page template
  const pageTemplate: Template = {
    id: 'product-page',
    name: 'Product Page',
    type: 'page',
    category: 'ecommerce',
    description: 'Template for product detail pages',
    version: '1.0.0',
    template: {
      structure: {
        sections: [
          {
            id: 'header',
            name: 'Header',
            type: 'header',
            position: { x: 0, y: 0, width: 12, height: 1 },
            content: {
              type: 'component',
              component: 'ProductHeader'
            },
            styles: {
              css: 'background: var(--color-background); padding: 1rem;',
              classes: ['product-header'],
              variables: {}
            },
            props: { showBreadcrumbs: true }
          },
          {
            id: 'main-content',
            name: 'Main Content',
            type: 'content',
            position: { x: 0, y: 1, width: 12, height: 6 },
            content: {
              type: 'template',
              template: 'product-details'
            },
            styles: {
              css: 'display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;',
              classes: ['product-main'],
              variables: {}
            },
            props: { layout: 'split' }
          }
        ],
        layout: {
          type: 'grid',
          columns: 12,
          rows: 8,
          gap: { horizontal: 1, vertical: 1 },
          alignment: { horizontal: 'left', vertical: 'top' }
        },
        responsive: {
          breakpoints: { sm: 640, md: 768, lg: 1024 },
          layout: {}
        }
      },
      styles: {
        global: {
          css: 'body { font-family: var(--font-family); }',
          variables: {},
          fonts: [],
          icons: []
        },
        components: {},
        themes: []
      },
      assets: []
    },
    variables: [
      { name: 'showReviews', type: 'boolean', defaultValue: true, required: false },
      { name: 'layoutStyle', type: 'string', defaultValue: 'grid', required: false }
    ],
    customizations: [],
    metadata: {
      author: 'Template Team',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['product', 'ecommerce'],
      compatibility: ['all']
    },
    isActive: true,
    isDefault: false
  };
  
  templateManager.registerTemplate(pageTemplate);
  
  // Render template with variables
  const rendered = await templateManager.renderTemplate('product-page', {
    showReviews: true,
    layoutStyle: 'grid',
    productId: 'prod-123'
  });
  
  console.log('📄 Template rendered successfully');
  console.log(`HTML length: ${rendered.html.length} characters`);
  console.log(`CSS included: ${rendered.styles.global.css ? 'Yes' : 'No'}`);
}

// Example 7: Complete Setup Workflow
async function completeSetupExample() {
  console.log('\n=== Complete Setup Workflow Example ===');
  
  // Create a comprehensive configuration
  const config = {
    name: 'Enterprise E-commerce Platform',
    description: 'Full-featured e-commerce platform with advanced customization',
    version: '2.0.0',
    instance: {
      name: 'enterprise-ecom',
      subdomain: 'enterprise-ecom',
      type: 'enterprise',
      environment: 'production',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
      settings: {
        maintenanceMode: false,
        debugMode: false,
        analyticsEnabled: true,
        emailNotifications: true,
        backupEnabled: true,
        autoScaling: true,
        customCSS: '.enterprise-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }',
        customJS: 'console.log("Enterprise platform loaded");'
      }
    },
    branding: {
      identity: {
        id: 'enterprise-ecom',
        name: 'Enterprise E-commerce',
        description: 'Professional e-commerce solution',
        assets: { logo: null, favicon: null, banner: null, icons: [], backgrounds: [] },
        colors: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#f093fb',
          neutral: '#6b7280'
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          headingFont: 'Inter, sans-serif',
          bodyFont: 'Inter, sans-serif'
        },
        voice: {
          tone: 'professional',
          personality: ['reliable', 'innovative', 'secure'],
          messaging: {
            welcome: 'Welcome to Enterprise E-commerce',
            tagline: 'Scalable solutions for growing businesses',
            callToAction: 'Start your business journey'
          }
        },
        guidelines: {
          logoUsage: 'Use on light backgrounds with sufficient contrast',
          colorUsage: 'Primary for CTAs, secondary for accents and highlights',
          typographyRules: 'Consistent use of Inter font family',
          imageryStyle: 'Professional, modern, business-focused'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      assets: {
        logo: '/assets/enterprise-logo.png',
        favicon: '/assets/enterprise-favicon.ico',
        icons: ['/assets/enterprise-icon-16.png'],
        backgrounds: []
      },
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
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
        welcome: 'Welcome to Enterprise E-commerce',
        tagline: 'Scalable solutions for growing businesses',
        callToAction: 'Start your business journey'
      }
    }
  };
  
  // Create configuration
  const configId = setupTools.createConfig(config);
  console.log(`📋 Configuration created: ${configId}`);
  
  // Generate setup checklist
  const checklist = setupTools.generateChecklist(configId);
  console.log('📝 Setup checklist generated:');
  checklist.items.forEach(item => {
    console.log(`  - ${item.title}: ${item.description}`);
  });
  
  // Start setup process
  const setupResult = await setupTools.setupInstance(configId, {
    skipTests: false,
    parallel: true
  });
  
  if (setupResult.success) {
    console.log(`🚀 Setup started: Job ${setupResult.jobId}`);
    console.log(`⏱ Estimated duration: ${setupResult.estimatedDuration} minutes`);
    
    // Monitor setup progress
    const monitorSetup = () => {
      const job = setupTools.getJobStatus(setupResult.jobId!);
      if (job) {
        console.log(`Progress: ${job.progress}% (${job.status})`);
        
        if (job.status === 'completed') {
          console.log('✅ Setup completed successfully!');
        } else if (job.status === 'failed') {
          console.error('❌ Setup failed:', job.error);
        } else {
          // Continue monitoring
          setTimeout(monitorSetup, 2000);
        }
      }
    };
    
    monitorSetup();
  } else {
    console.error('❌ Setup failed to start:', setupResult.errors);
  }
}

// Main execution function
async function main() {
  console.log('🎨 White-Label Platform Examples\n');
  
  try {
    // Run examples
    await basicExample();
    await multilingualExample();
    await regionalExample();
    await featureFlagExample();
    await customDomainExample();
    await templateExample();
    await completeSetupExample();
    
    console.log('\n🎉 All examples completed successfully!');
    
    // Display platform information
    const platform = WhiteLabelPlatform.getInstance();
    const info = platform.getPlatformInfo();
    console.log('\n📊 Platform Information:');
    console.log(`Name: ${info.name}`);
    console.log(`Version: ${info.version}`);
    console.log(`Status: ${info.status}`);
    console.log('Components:');
    Object.entries(info.components).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicExample,
  multilingualExample,
  regionalExample,
  featureFlagExample,
  customDomainExample,
  templateExample,
  completeSetupExample,
  main
};