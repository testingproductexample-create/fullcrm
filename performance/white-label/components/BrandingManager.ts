/**
 * Branding Management System
 * Handles brand assets, logos, colors, and visual identity management
 */

export interface BrandAsset {
  id: string;
  type: 'logo' | 'favicon' | 'banner' | 'icon' | 'background';
  name: string;
  url: string;
  alt: string;
  variants: {
    light: string;
    dark?: string;
    small?: string;
    large?: string;
  };
  metadata: {
    size: number;
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
    uploadedAt: Date;
    optimized: boolean;
  };
  isActive: boolean;
}

export interface BrandIdentity {
  id: string;
  name: string;
  description: string;
  assets: {
    logo: BrandAsset | null;
    favicon: BrandAsset | null;
    banner: BrandAsset | null;
    icons: BrandAsset[];
    backgrounds: BrandAsset[];
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    bodyFont: string;
  };
  voice: {
    tone: 'professional' | 'friendly' | 'casual' | 'luxury';
    personality: string[];
    messaging: {
      welcome: string;
      tagline: string;
      callToAction: string;
    };
  };
  guidelines: {
    logoUsage: string;
    colorUsage: string;
    typographyRules: string;
    imageryStyle: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandVariation {
  id: string;
  parentBrandId: string;
  name: string;
  description: string;
  modifications: {
    colors?: Partial<BrandIdentity['colors']>;
    typography?: Partial<BrandIdentity['typography']>;
    voice?: Partial<BrandIdentity['voice']>;
    assets?: {
      replace?: string[];
      add?: BrandAsset[];
    };
  };
  isActive: boolean;
  createdAt: Date;
}

export class BrandingManager {
  private brands: Map<string, BrandIdentity> = new Map();
  private variations: Map<string, BrandVariation> = new Map();
  private activeBrand: BrandIdentity | null = null;
  private observers: Set<BrandingChangeObserver> = new Set();

  constructor() {
    this.initializeDefaultBrands();
  }

  /**
   * Register a new brand identity
   */
  registerBrand(brand: BrandIdentity): void {
    this.brands.set(brand.id, brand);
    if (brand.isActive) {
      this.setActiveBrand(brand.id);
    }
  }

  /**
   * Update brand identity
   */
  updateBrand(brandId: string, updates: Partial<BrandIdentity>): void {
    const brand = this.brands.get(brandId);
    if (brand) {
      const updatedBrand = { ...brand, ...updates, updatedAt: new Date() };
      this.brands.set(brandId, updatedBrand);
      
      if (this.activeBrand?.id === brandId) {
        this.setActiveBrand(brandId);
      }
    }
  }

  /**
   * Set active brand
   */
  setActiveBrand(brandId: string): void {
    const brand = this.brands.get(brandId);
    if (brand) {
      this.activeBrand = brand;
      // Deactivate other brands
      this.brands.forEach((b, id) => {
        if (id !== brandId) {
          b.isActive = false;
        } else {
          b.isActive = true;
        }
      });
      this.notifyObservers(brand);
    }
  }

  /**
   * Get active brand
   */
  getActiveBrand(): BrandIdentity | null {
    return this.activeBrand;
  }

  /**
   * Get brand by ID
   */
  getBrand(brandId: string): BrandIdentity | undefined {
    return this.brands.get(brandId);
  }

  /**
   * Get all brands
   */
  getAllBrands(): BrandIdentity[] {
    return Array.from(this.brands.values());
  }

  /**
   * Add brand asset
   */
  addAsset(brandId: string, asset: BrandAsset): void {
    const brand = this.brands.get(brandId);
    if (!brand) return;

    switch (asset.type) {
      case 'logo':
        brand.assets.logo = asset;
        break;
      case 'favicon':
        brand.assets.favicon = asset;
        break;
      case 'banner':
        brand.assets.banner = asset;
        break;
      case 'icon':
        brand.assets.icons.push(asset);
        break;
      case 'background':
        brand.assets.backgrounds.push(asset);
        break;
    }

    this.updateBrand(brandId, { assets: brand.assets });
  }

  /**
   * Remove brand asset
   */
  removeAsset(brandId: string, assetId: string): void {
    const brand = this.brands.get(brandId);
    if (!brand) return;

    // Remove from icons
    brand.assets.icons = brand.assets.icons.filter(asset => asset.id !== assetId);
    
    // Remove from backgrounds
    brand.assets.backgrounds = brand.assets.backgrounds.filter(asset => asset.id !== assetId);

    this.updateBrand(brandId, { assets: brand.assets });
  }

  /**
   * Create brand variation
   */
  createVariation(variation: BrandVariation): void {
    this.variations.set(variation.id, variation);
  }

  /**
   * Get brand variations
   */
  getVariations(parentBrandId: string): BrandVariation[] {
    return Array.from(this.variations.values()).filter(
      variation => variation.parentBrandId === parentBrandId
    );
  }

  /**
   * Apply brand variation
   */
  applyVariation(brandId: string, variationId: string): void {
    const brand = this.brands.get(brandId);
    const variation = this.variations.get(variationId);
    
    if (!brand || !variation) return;

    const modifiedBrand: BrandIdentity = {
      ...brand,
      ...variation.modifications,
      id: `${brandId}-${variationId}`,
      name: `${brand.name} - ${variation.name}`,
      updatedAt: new Date()
    };

    this.registerBrand(modifiedBrand);
  }

  /**
   * Generate brand assets
   */
  async generateAssets(brandId: string): Promise<BrandAsset[]> {
    const brand = this.brands.get(brandId);
    if (!brand || !brand.assets.logo) return [];

    const assets: BrandAsset[] = [];
    
    // Generate favicon from logo
    if (brand.assets.logo) {
      const favicon: BrandAsset = {
        id: `${brandId}-favicon`,
        type: 'favicon',
        name: `${brand.name} Favicon`,
        url: await this.generateFavicon(brand.assets.logo.url),
        alt: `${brand.name} favicon`,
        variants: {
          light: brand.assets.logo.url
        },
        metadata: {
          size: 1024,
          format: 'ico',
          dimensions: { width: 32, height: 32 },
          uploadedAt: new Date(),
          optimized: true
        },
        isActive: true
      };
      assets.push(favicon);
    }

    return assets;
  }

  /**
   * Generate favicon from logo
   */
  private async generateFavicon(logoUrl: string): Promise<string> {
    // Implementation would use canvas or image processing library
    // For now, return the original logo
    return logoUrl;
  }

  /**
   * Validate brand assets
   */
  validateAssets(assets: BrandAsset[]): {
    valid: BrandAsset[];
    invalid: { asset: BrandAsset; reason: string }[];
  } {
    const valid: BrandAsset[] = [];
    const invalid: { asset: BrandAsset; reason: string }[] = [];

    assets.forEach(asset => {
      const validation = this.validateAsset(asset);
      if (validation.isValid) {
        valid.push(asset);
      } else {
        invalid.push({ asset, reason: validation.reason });
      }
    });

    return { valid, invalid };
  }

  /**
   * Validate individual asset
   */
  private validateAsset(asset: BrandAsset): { isValid: boolean; reason?: string } {
    // Check file size (max 5MB)
    if (asset.metadata.size > 5 * 1024 * 1024) {
      return { isValid: false, reason: 'File size exceeds 5MB limit' };
    }

    // Check format
    const allowedFormats = ['png', 'jpg', 'jpeg', 'svg', 'ico', 'webp'];
    if (!allowedFormats.includes(asset.metadata.format)) {
      return { isValid: false, reason: 'Unsupported file format' };
    }

    // Check dimensions for certain asset types
    if (asset.type === 'favicon' && 
        (asset.metadata.dimensions.width > 64 || asset.metadata.dimensions.height > 64)) {
      return { isValid: false, reason: 'Favicon dimensions must be 64x64 or smaller' };
    }

    return { isValid: true };
  }

  /**
   * Optimize brand assets
   */
  async optimizeAssets(brandId: string): Promise<void> {
    const brand = this.brands.get(brandId);
    if (!brand) return;

    const allAssets = [
      brand.assets.logo,
      brand.assets.favicon,
      brand.assets.banner,
      ...brand.assets.icons,
      ...brand.assets.backgrounds
    ].filter(Boolean) as BrandAsset[];

    for (const asset of allAssets) {
      if (!asset.metadata.optimized) {
        asset.metadata.optimized = true;
        // Implementation would include compression and format optimization
      }
    }

    this.updateBrand(brandId, { assets: brand.assets });
  }

  /**
   * Export brand configuration
   */
  exportBrand(brandId: string): string {
    const brand = this.brands.get(brandId);
    if (!brand) {
      throw new Error(`Brand ${brandId} not found`);
    }
    return JSON.stringify(brand, null, 2);
  }

  /**
   * Import brand configuration
   */
  importBrand(brandConfig: string): BrandIdentity {
    try {
      const brand = JSON.parse(brandConfig) as BrandIdentity;
      this.registerBrand(brand);
      return brand;
    } catch (error) {
      throw new Error('Invalid brand configuration format');
    }
  }

  /**
   * Subscribe to branding changes
   */
  subscribe(observer: BrandingChangeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from branding changes
   */
  unsubscribe(observer: BrandingChangeObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify observers of branding changes
   */
  private notifyObservers(brand: BrandIdentity): void {
    this.observers.forEach(observer => observer.onBrandChange(brand));
  }

  /**
   * Initialize default brands
   */
  private initializeDefaultBrands(): void {
    const defaultBrand: BrandIdentity = {
      id: 'default',
      name: 'Default Brand',
      description: 'Default brand identity for the platform',
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
    };

    this.registerBrand(defaultBrand);
  }
}

export interface BrandingChangeObserver {
  onBrandChange(brand: BrandIdentity): void;
}

// Export singleton instance
export const brandingManager = new BrandingManager();