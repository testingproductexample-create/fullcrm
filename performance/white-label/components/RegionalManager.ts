/**
 * Regional Settings & Business Configuration System
 * Handles regional preferences, business rules, and compliance settings
 */

export interface RegionalConfig {
  regionId: string;
  name: string;
  country: string;
  timezone: string;
  currency: CurrencyConfig;
  taxSettings: TaxConfig;
  shipping: ShippingConfig;
  payment: PaymentConfig;
  legal: LegalConfig;
  businessRules: BusinessRules;
  formatting: FormattingConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  exchangeRates?: {
    base: string;
    rates: Record<string, number>;
    lastUpdated: Date;
  };
}

export interface TaxConfig {
  enabled: boolean;
  rate: number;
  type: 'vat' | 'gst' | 'sales_tax' | 'none';
  registration: {
    required: boolean;
    format: string;
    validation: string;
  };
  exemptions: {
    customerTypes: string[];
    productCategories: string[];
  };
  reporting: {
    frequency: 'monthly' | 'quarterly' | 'annually';
    format: string;
  };
}

export interface ShippingConfig {
  providers: ShippingProvider[];
  zones: ShippingZone[];
  rules: {
    freeShippingThreshold?: number;
    maxWeight?: number;
    maxDimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
}

export interface ShippingProvider {
  id: string;
  name: string;
  services: ShippingService[];
  isActive: boolean;
}

export interface ShippingService {
  id: string;
  name: string;
  code: string;
  estimatedDays: string;
  basePrice: number;
  pricePerKg?: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions: string[];
  providers: string[]; // Provider IDs
  pricing: ZonePricing;
}

export interface ZonePricing {
  baseRate: number;
  pricePerKg: number;
  freeThreshold?: number;
  expeditedMultiplier: number;
}

export interface PaymentConfig {
  methods: PaymentMethod[];
  processors: PaymentProcessor[];
  settings: {
    currency: string;
    captureMode: 'automatic' | 'manual';
    settlementCurrency: string;
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank_transfer' | 'digital_wallet' | 'cash' | 'other';
  isActive: boolean;
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  limits: {
    minAmount?: number;
    maxAmount?: number;
    dailyLimit?: number;
  };
}

export interface PaymentProcessor {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'square' | 'custom';
  isActive: boolean;
  config: {
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    testMode: boolean;
  };
}

export interface LegalConfig {
  compliance: {
    gdpr: {
      enabled: boolean;
      requirements: string[];
    };
    ccpa: {
      enabled: boolean;
      requirements: string[];
    };
    other: ComplianceRequirement[];
  };
  terms: {
    version: string;
    lastUpdated: Date;
    url: string;
  };
  privacy: {
    version: string;
    lastUpdated: Date;
    url: string;
  };
  returns: {
    days: number;
    conditions: string[];
    restockingFee?: number;
  };
}

export interface ComplianceRequirement {
  name: string;
  description: string;
  requirements: string[];
  deadline?: Date;
}

export interface BusinessRules {
  order: OrderRules;
  inventory: InventoryRules;
  customer: CustomerRules;
  pricing: PricingRules;
}

export interface OrderRules {
  minimumOrder: number;
  maximumOrder?: number;
  autoProcessing: boolean;
  approvalThresholds: {
    credit: number;
    amount: number;
  };
  cancellationPolicy: {
    allowed: boolean;
    windowHours: number;
    fees: number;
  };
}

export interface InventoryRules {
  tracking: boolean;
  lowStockThreshold: number;
  backorders: {
    allowed: boolean;
    maxQuantity?: number;
  };
  overselling: {
    allowed: boolean;
    buffer: number;
  };
}

export interface CustomerRules {
  registration: {
    required: boolean;
    approvalRequired: boolean;
  };
  credit: {
    enabled: boolean;
    limits: {
      default: number;
      max: number;
    };
    terms: string;
  };
  pricing: {
    tiered: boolean;
    bulk: boolean;
  };
}

export interface PricingRules {
  discounts: {
    maximum: number;
    stacking: boolean;
    expiryHandling: 'expire' | 'extend';
  };
  rounding: {
    method: 'nearest' | 'up' | 'down';
    decimals: number;
  };
  currency: {
    base: string;
    display: 'base' | 'customer';
  };
}

export interface FormattingConfig {
  date: DateFormatting;
  time: TimeFormatting;
  number: NumberFormatting;
  address: AddressFormatting;
  phone: PhoneFormatting;
}

export interface DateFormatting {
  format: string;
  timezone: string;
  firstDayOfWeek: 0 | 1; // 0=Sunday, 1=Monday
}

export interface TimeFormatting {
  format: '12h' | '24h';
  timezone: string;
  showSeconds: boolean;
}

export interface NumberFormatting {
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  currencyFormat: string;
}

export interface AddressFormatting {
  format: string;
  requiredFields: string[];
  validation: {
    postalCode: boolean;
    phone: boolean;
    email: boolean;
  };
}

export interface PhoneFormatting {
  format: string;
  countryCode: string;
  mobileFormat: string;
}

export class RegionalManager {
  private regions: Map<string, RegionalConfig> = new Map();
  private activeRegion: RegionalConfig | null = null;
  private observers: Set<RegionalChangeObserver> = new Set();

  constructor() {
    this.initializeDefaultRegions();
  }

  /**
   * Register a new region
   */
  registerRegion(region: RegionalConfig): void {
    this.regions.set(region.regionId, region);
    if (region.isActive) {
      this.setActiveRegion(region.regionId);
    }
  }

  /**
   * Update region configuration
   */
  updateRegion(regionId: string, updates: Partial<RegionalConfig>): void {
    const region = this.regions.get(regionId);
    if (region) {
      const updatedRegion = { 
        ...region, 
        ...updates, 
        updatedAt: new Date() 
      };
      this.regions.set(regionId, updatedRegion);
      
      if (this.activeRegion?.regionId === regionId) {
        this.setActiveRegion(regionId);
      }
    }
  }

  /**
   * Set active region
   */
  setActiveRegion(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      this.activeRegion = region;
      this.regions.forEach((r, id) => {
        r.isActive = id === regionId;
      });
      this.notifyObservers(region);
    }
  }

  /**
   * Get active region
   */
  getActiveRegion(): RegionalConfig | null {
    return this.activeRegion;
  }

  /**
   * Get region by ID
   */
  getRegion(regionId: string): RegionalConfig | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get all regions
   */
  getAllRegions(): RegionalConfig[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get regions by country
   */
  getRegionsByCountry(country: string): RegionalConfig[] {
    return Array.from(this.regions.values()).filter(
      region => region.country === country
    );
  }

  /**
   * Get applicable shipping methods
   */
  getShippingMethods(country: string, weight?: number): ShippingService[] {
    if (!this.activeRegion) return [];

    const applicableZones = this.activeRegion.shipping.zones.filter(zone =>
      zone.countries.includes(country)
    );

    const methods: ShippingService[] = [];
    
    applicableZones.forEach(zone => {
      zone.providers.forEach(providerId => {
        const provider = this.activeRegion!.shipping.providers.find(p => p.id === providerId);
        if (provider && provider.isActive) {
          provider.services.forEach(service => {
            if (this.validateShippingService(service, weight)) {
              methods.push(service);
            }
          });
        }
      });
    });

    return methods.sort((a, b) => a.basePrice - b.basePrice);
  }

  /**
   * Calculate shipping cost
   */
  calculateShipping(
    country: string, 
    weight: number, 
    value: number
  ): {
    service: ShippingService;
    cost: number;
    freeShipping: boolean;
  }[] {
    if (!this.activeRegion) return [];

    const methods = this.getShippingMethods(country, weight);
    
    return methods.map(service => {
      const zone = this.activeRegion!.shipping.zones.find(z =>
        z.countries.includes(country) && z.providers.some(pId => 
          this.activeRegion!.shipping.providers.find(p => p.id === pId)?.services.some(s => s.id === service.id)
        )
      );

      if (!zone) {
        return {
          service,
          cost: service.basePrice,
          freeShipping: false
        };
      }

      let cost = zone.pricing.baseRate + (weight * zone.pricing.pricePerKg);
      const freeShipping = this.activeRegion!.shipping.rules.freeShippingThreshold !== undefined &&
                          value >= this.activeRegion!.shipping.rules.freeShippingThreshold!;

      if (freeShipping) {
        cost = 0;
      }

      return { service, cost, freeShipping };
    });
  }

  /**
   * Calculate tax
   */
  calculateTax(amount: number, customerType?: string, productCategory?: string): {
    tax: number;
    rate: number;
    breakdown: TaxBreakdown[];
  } {
    if (!this.activeRegion || !this.activeRegion.taxSettings.enabled) {
      return { tax: 0, rate: 0, breakdown: [] };
    }

    const tax = this.activeRegion.taxSettings;
    
    // Check for exemptions
    if (customerType && tax.exemptions.customerTypes.includes(customerType)) {
      return { tax: 0, rate: 0, breakdown: [] };
    }

    if (productCategory && tax.exemptions.productCategories.includes(productCategory)) {
      return { tax: 0, rate: 0, breakdown: [] };
    }

    const taxAmount = (amount * tax.rate) / 100;
    
    return {
      tax: taxAmount,
      rate: tax.rate,
      breakdown: [{
        type: tax.type,
        rate: tax.rate,
        amount: taxAmount
      }]
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currencyCode?: string): string {
    const region = this.activeRegion;
    if (!region) return amount.toString();

    const currency = currencyCode ? 
      { ...region.currency, code: currencyCode } : 
      region.currency;

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    }).format(amount);

    return currency.position === 'after' ? 
      formatted.replace(currency.symbol, currency.symbol + ' ') : 
      formatted;
  }

  /**
   * Format address
   */
  formatAddress(address: any): string {
    if (!this.activeRegion) return '';

    const format = this.activeRegion.formatting.address.format;
    let formatted = format;

    // Replace placeholders with actual values
    Object.entries(address).forEach(([key, value]) => {
      formatted = formatted.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), 
        String(value || '')
      );
    });

    return formatted;
  }

  /**
   * Format phone number
   */
  formatPhoneNumber(number: string, countryCode?: string): string {
    if (!this.activeRegion) return number;

    const region = this.activeRegion;
    const code = countryCode || region.formatting.phone.countryCode;
    
    // Simple formatting - in production, use a proper library
    if (number.startsWith(code)) {
      return number; // Already formatted
    }

    return `${code} ${number}`;
  }

  /**
   * Validate business rules
   */
  validateBusinessRule(
    type: keyof BusinessRules, 
    rule: string, 
    value: any
  ): { valid: boolean; message?: string } {
    if (!this.activeRegion) {
      return { valid: true };
    }

    const rules = this.activeRegion.businessRules;

    switch (type) {
      case 'order':
        return this.validateOrderRule(rules.order, rule, value);
      case 'inventory':
        return this.validateInventoryRule(rules.inventory, rule, value);
      case 'customer':
        return this.validateCustomerRule(rules.customer, rule, value);
      case 'pricing':
        return this.validatePricingRule(rules.pricing, rule, value);
      default:
        return { valid: true };
    }
  }

  /**
   * Validate order rule
   */
  private validateOrderRule(rules: OrderRules, rule: string, value: any): { valid: boolean; message?: string } {
    switch (rule) {
      case 'minimum':
        if (value < rules.minimumOrder) {
          return { 
            valid: false, 
            message: `Minimum order value is ${this.formatCurrency(rules.minimumOrder)}` 
          };
        }
        break;
      case 'maximum':
        if (rules.maximumOrder && value > rules.maximumOrder) {
          return { 
            valid: false, 
            message: `Maximum order value is ${this.formatCurrency(rules.maximumOrder)}` 
          };
        }
        break;
    }
    return { valid: true };
  }

  /**
   * Validate inventory rule
   */
  private validateInventoryRule(rules: InventoryRules, rule: string, value: any): { valid: boolean; message?: string } {
    // Implementation for inventory validation
    return { valid: true };
  }

  /**
   * Validate customer rule
   */
  private validateCustomerRule(rules: CustomerRules, rule: string, value: any): { valid: boolean; message?: string } {
    // Implementation for customer validation
    return { valid: true };
  }

  /**
   * Validate pricing rule
   */
  private validatePricingRule(rules: PricingRules, rule: string, value: any): { valid: boolean; message?: string } {
    // Implementation for pricing validation
    return { valid: true };
  }

  /**
   * Validate shipping service
   */
  private validateShippingService(service: ShippingService, weight?: number): boolean {
    if (!this.activeRegion) return true;

    const rules = this.activeRegion.shipping.rules;
    
    if (weight && rules.maxWeight && weight > rules.maxWeight) {
      return false;
    }

    return true;
  }

  /**
   * Export region configuration
   */
  exportRegion(regionId: string): string {
    const region = this.regions.get(regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }
    return JSON.stringify(region, null, 2);
  }

  /**
   * Import region configuration
   */
  importRegion(regionConfig: string): RegionalConfig {
    try {
      const region = JSON.parse(regionConfig) as RegionalConfig;
      this.registerRegion(region);
      return region;
    } catch (error) {
      throw new Error('Invalid region configuration format');
    }
  }

  /**
   * Subscribe to region changes
   */
  subscribe(observer: RegionalChangeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from region changes
   */
  unsubscribe(observer: RegionalChangeObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify observers of region changes
   */
  private notifyObservers(region: RegionalConfig): void {
    this.observers.forEach(observer => observer.onRegionChange(region));
  }

  /**
   * Initialize default regions
   */
  private initializeDefaultRegions(): void {
    const defaultRegion: RegionalConfig = {
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
          customerTypes: [],
          productCategories: []
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
          ccpa: { enabled: true, requirements: [] },
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

    this.registerRegion(defaultRegion);
  }
}

export interface TaxBreakdown {
  type: string;
  rate: number;
  amount: number;
}

export interface RegionalChangeObserver {
  onRegionChange(region: RegionalConfig): void;
}

// Export singleton instance
export const regionalManager = new RegionalManager();