/**
 * Theme Customization System
 * Handles dynamic theme changes, brand colors, fonts, and visual customization
 */

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ComponentStyles {
  button: {
    borderRadius: string;
    padding: {
      sm: string;
      md: string;
      lg: string;
    };
  };
  card: {
    borderRadius: string;
    shadow: string;
    border: string;
  };
  input: {
    borderRadius: string;
    border: string;
    focus: string;
  };
}

export interface CustomTheme {
  id: string;
  name: string;
  brand: {
    logo: string;
    favicon: string;
    colors: BrandColors;
    typography: Typography;
    components: ComponentStyles;
  };
  cssVariables: Record<string, string>;
  customCSS?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ThemeManager {
  private themes: Map<string, CustomTheme> = new Map();
  private activeTheme: CustomTheme | null = null;
  private observers: Set<ThemeChangeObserver> = new Set();

  constructor() {
    this.initializeDefaultThemes();
  }

  /**
   * Register a new theme
   */
  registerTheme(theme: CustomTheme): void {
    this.themes.set(theme.id, theme);
    this.applyTheme(theme);
  }

  /**
   * Update existing theme
   */
  updateTheme(themeId: string, updates: Partial<CustomTheme>): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      const updatedTheme = { ...theme, ...updates, updatedAt: new Date() };
      this.themes.set(themeId, updatedTheme);
      
      if (this.activeTheme?.id === themeId) {
        this.applyTheme(updatedTheme);
      }
    }
  }

  /**
   * Apply theme by ID
   */
  applyTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.applyTheme(theme);
    }
  }

  /**
   * Apply theme and notify observers
   */
  private applyTheme(theme: CustomTheme): void {
    this.activeTheme = theme;
    this.updateCSSVariables(theme);
    this.updateCustomCSS(theme);
    this.notifyObservers(theme);
  }

  /**
   * Update CSS custom properties
   */
  private updateCSSVariables(theme: CustomTheme): void {
    const root = document.documentElement;
    
    // Update brand colors
    Object.entries(theme.brand.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Update typography
    root.style.setProperty('--font-family', theme.brand.typography.fontFamily);
    Object.entries(theme.brand.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Update component styles
    Object.entries(theme.brand.components.button).forEach(([key, value]) => {
      root.style.setProperty(`--button-${key}`, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    // Apply custom CSS variables
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key.startsWith('--') ? key : `--${key}`, value);
    });
  }

  /**
   * Update custom CSS
   */
  private updateCustomCSS(theme: CustomTheme): void {
    let customStyleElement = document.getElementById('theme-custom-css') as HTMLStyleElement;
    
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'theme-custom-css';
      document.head.appendChild(customStyleElement);
    }

    customStyleElement.textContent = theme.customCSS || '';
  }

  /**
   * Get active theme
   */
  getActiveTheme(): CustomTheme | null {
    return this.activeTheme;
  }

  /**
   * Get all themes
   */
  getAllThemes(): CustomTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId: string): CustomTheme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Delete theme
   */
  deleteTheme(themeId: string): boolean {
    if (this.activeTheme?.id === themeId) {
      console.warn('Cannot delete active theme');
      return false;
    }
    return this.themes.delete(themeId);
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(observer: ThemeChangeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from theme changes
   */
  unsubscribe(observer: ThemeChangeObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify all observers of theme change
   */
  private notifyObservers(theme: CustomTheme): void {
    this.observers.forEach(observer => observer.onThemeChange(theme));
  }

  /**
   * Initialize default themes
   */
  private initializeDefaultThemes(): void {
    const defaultTheme: CustomTheme = {
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
    };

    this.registerTheme(defaultTheme);
  }

  /**
   * Export theme configuration
   */
  exportTheme(themeId: string): string {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme configuration
   */
  importTheme(themeConfig: string): CustomTheme {
    try {
      const theme = JSON.parse(themeConfig) as CustomTheme;
      this.registerTheme(theme);
      return theme;
    } catch (error) {
      throw new Error('Invalid theme configuration format');
    }
  }

  /**
   * Generate CSS from theme
   */
  generateCSS(theme: CustomTheme): string {
    const { brand, cssVariables, customCSS } = theme;
    
    let css = ':root {\n';
    
    // Add brand colors
    Object.entries(brand.colors).forEach(([key, value]) => {
      css += `  --color-${key}: ${value};\n`;
    });
    
    // Add typography
    css += `  --font-family: ${brand.typography.fontFamily};\n`;
    Object.entries(brand.typography.fontSize).forEach(([key, value]) => {
      css += `  --font-size-${key}: ${value};\n`;
    });
    
    // Add custom variables
    Object.entries(cssVariables).forEach(([key, value]) => {
      css += `  ${key.startsWith('--') ? key : '--' + key}: ${value};\n`;
    });
    
    css += '}\n\n';
    
    // Add custom CSS
    if (customCSS) {
      css += customCSS;
    }
    
    return css;
  }
}

export interface ThemeChangeObserver {
  onThemeChange(theme: CustomTheme): void;
}

// Export singleton instance
export const themeManager = new ThemeManager();