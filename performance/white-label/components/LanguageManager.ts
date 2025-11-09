/**
 * Multi-Language Support System
 * Handles internationalization, translation management, and regional settings
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region?: string;
  isActive: boolean;
  isDefault: boolean;
  flag?: string;
}

export interface Translation {
  key: string;
  value: string;
  context?: string;
  description?: string;
  pluralForm?: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other?: string;
  };
  metadata: {
    lastModified: Date;
    translator?: string;
    reviewed: boolean;
    confidence: number; // 0-1
  };
}

export interface TranslationNamespace {
  name: string;
  description?: string;
  translations: Map<string, Translation>;
  isActive: boolean;
}

export interface RegionalSettings {
  region: string;
  country: string;
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
    decimals: number;
  };
  dateFormat: string;
  timeFormat: '12h' | '24h';
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  numberFormat: {
    decimal: string;
    thousands: string;
    precision: number;
  };
  address: {
    format: string;
    fields: string[];
  };
  phone: {
    format: string;
    countryCode: string;
  };
  business: {
    taxIdFormat: string;
    businessHoursFormat: string;
  };
}

export interface LocaleConfig {
  language: Language;
  region: RegionalSettings;
  translations: {
    namespaces: Map<string, TranslationNamespace>;
    fallbackLanguage: string;
  };
  formatting: {
    currency: Intl.NumberFormatOptions;
    date: Intl.DateTimeFormatOptions;
    number: Intl.NumberFormatOptions;
  };
}

export class LanguageManager {
  private languages: Map<string, Language> = new Map();
  private locales: Map<string, LocaleConfig> = new Map();
  private activeLocale: LocaleConfig | null = null;
  private translationCache: Map<string, string> = new Map();
  private observers: Set<LanguageChangeObserver> = new Set();

  constructor() {
    this.initializeDefaultLanguages();
  }

  /**
   * Register a new language
   */
  registerLanguage(language: Language): void {
    this.languages.set(language.code, language);
    
    // Create default locale for the language
    const locale: LocaleConfig = {
      language,
      region: this.createDefaultRegion(language.code),
      translations: {
        namespaces: new Map(),
        fallbackLanguage: 'en'
      },
      formatting: this.createFormattingOptions(language.code)
    };
    
    this.locales.set(language.code, locale);
  }

  /**
   * Set active language
   */
  setActiveLanguage(languageCode: string): void {
    const locale = this.locales.get(languageCode);
    if (locale) {
      this.activeLocale = locale;
      this.clearTranslationCache();
      this.notifyObservers(locale);
    }
  }

  /**
   * Get active language
   */
  getActiveLanguage(): Language | null {
    return this.activeLocale?.language || null;
  }

  /**
   * Get active locale
   */
  getActiveLocale(): LocaleConfig | null {
    return this.activeLocale;
  }

  /**
   * Get all supported languages
   */
  getAllLanguages(): Language[] {
    return Array.from(this.languages.values());
  }

  /**
   * Get locale configuration
   */
  getLocale(languageCode: string): LocaleConfig | undefined {
    return this.locales.get(languageCode);
  }

  /**
   * Add translation namespace
   */
  addNamespace(languageCode: string, namespace: TranslationNamespace): void {
    const locale = this.locales.get(languageCode);
    if (locale) {
      locale.translations.namespaces.set(namespace.name, namespace);
    }
  }

  /**
   * Add translation
   */
  addTranslation(
    languageCode: string, 
    namespaceName: string, 
    translation: Translation
  ): void {
    const locale = this.locales.get(languageCode);
    if (!locale) return;

    const namespace = locale.translations.namespaces.get(namespaceName);
    if (namespace) {
      namespace.translations.set(translation.key, translation);
      this.clearTranslationCache();
    }
  }

  /**
   * Get translation
   */
  getTranslation(
    key: string, 
    options?: {
      namespace?: string;
      count?: number;
      fallback?: string;
      replacements?: Record<string, string | number>;
    }
  ): string {
    if (!this.activeLocale) {
      return options?.fallback || key;
    }

    const cacheKey = this.buildCacheKey(key, options);
    
    // Check cache first
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    const { namespace, count, fallback, replacements } = options || {};
    const translation = this.findTranslation(key, namespace, count);

    let result = translation?.value || fallback || key;

    // Handle plural forms
    if (translation?.pluralForm && count !== undefined) {
      result = this.getPluralForm(translation.pluralForm, count);
    }

    // Apply replacements
    if (replacements && Object.keys(replacements).length > 0) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        result = result.replace(new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g'), String(value));
      });
    }

    // Cache the result
    this.translationCache.set(cacheKey, result);
    return result;
  }

  /**
   * Find translation in active locale
   */
  private findTranslation(
    key: string, 
    namespace?: string, 
    count?: number
  ): Translation | null {
    if (!this.activeLocale) return null;

    const namespaces = this.activeLocale.translations.namespaces;

    // Search in specified namespace
    if (namespace && namespaces.has(namespace)) {
      const translations = namespaces.get(namespace)!.translations;
      if (translations.has(key)) {
        return translations.get(key)!;
      }
    }

    // Search in all namespaces
    for (const [_, ns] of namespaces) {
      const translation = ns.translations.get(key);
      if (translation) {
        return translation;
      }
    }

    // Fallback to default language
    return this.getTranslationFromFallback(key, namespace);
  }

  /**
   * Get translation from fallback language
   */
  private getTranslationFromFallback(
    key: string, 
    namespace?: string
  ): Translation | null {
    const fallbackLang = this.activeLocale?.translations.fallbackLanguage;
    if (!fallbackLang) return null;

    const fallbackLocale = this.locales.get(fallbackLang);
    if (!fallbackLocale) return null;

    return this.findTranslationInLocale(fallbackLocale, key, namespace);
  }

  /**
   * Find translation in a specific locale
   */
  private findTranslationInLocale(
    locale: LocaleConfig,
    key: string,
    namespace?: string
  ): Translation | null {
    const namespaces = locale.translations.namespaces;

    // Search in specified namespace
    if (namespace && namespaces.has(namespace)) {
      const translations = namespaces.get(namespace)!.translations;
      if (translations.has(key)) {
        return translations.get(key)!;
      }
    }

    // Search in all namespaces
    for (const [_, ns] of namespaces) {
      const translation = ns.translations.get(key);
      if (translation) {
        return translation;
      }
    }

    return null;
  }

  /**
   * Get plural form based on count
   */
  private getPluralForm(pluralForm: Translation['pluralForm'], count: number): string {
    const rules = this.getPluralRules(this.activeLocale?.language.code || 'en');
    const form = rules(count);
    
    return pluralForm?.[form] || pluralForm?.other || '';
  }

  /**
   * Get plural rules for language
   */
  private getPluralRules(languageCode: string): (count: number) => string {
    // Simplified plural rules - in production, use a proper library like formatjs
    switch (languageCode) {
      case 'en':
        return (count: number) => count === 1 ? 'one' : 'other';
      case 'ar':
        return (count: number) => {
          if (count === 0) return 'zero';
          if (count === 1) return 'one';
          if (count === 2) return 'two';
          if (count % 100 >= 3 && count % 100 <= 10) return 'few';
          if (count % 100 >= 11 && count % 100 <= 99) return 'many';
          return 'other';
        };
      case 'ru':
        return (count: number) => {
          const last = count % 10;
          const lastTwo = count % 100;
          if (last === 1 && lastTwo !== 11) return 'one';
          if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return 'few';
          return 'other';
        };
      default:
        return () => 'other';
    }
  }

  /**
   * Build cache key for translation
   */
  private buildCacheKey(key: string, options?: any): string {
    return JSON.stringify({ key, options });
  }

  /**
   * Clear translation cache
   */
  private clearTranslationCache(): void {
    this.translationCache.clear();
  }

  /**
   * Create default region settings
   */
  private createDefaultRegion(languageCode: string): RegionalSettings {
    const commonRegions: Record<string, RegionalSettings> = {
      'en-US': {
        region: 'North America',
        country: 'United States',
        currency: { code: 'USD', symbol: '$', position: 'before', decimals: 2 },
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        firstDayOfWeek: 0,
        numberFormat: { decimal: '.', thousands: ',', precision: 2 },
        address: {
          format: 'street, city, state zip',
          fields: ['street', 'city', 'state', 'zip', 'country']
        },
        phone: { format: '(xxx) xxx-xxxx', countryCode: '+1' },
        business: { taxIdFormat: 'xx-xxxxxxx', businessHoursFormat: 'h:mm a' }
      },
      'en-GB': {
        region: 'Europe',
        country: 'United Kingdom',
        currency: { code: 'GBP', symbol: '£', position: 'before', decimals: 2 },
        dateFormat: 'dd/MM/yyyy',
        timeFormat: '24h',
        firstDayOfWeek: 1,
        numberFormat: { decimal: '.', thousands: ',', precision: 2 },
        address: {
          format: 'street, city, postcode',
          fields: ['street', 'city', 'postcode', 'country']
        },
        phone: { format: 'xxxx xxxxxx', countryCode: '+44' },
        business: { taxIdFormat: 'xxxxxxxx', businessHoursFormat: 'HH:mm' }
      }
    };

    return commonRegions[languageCode] || commonRegions['en-US'];
  }

  /**
   * Create formatting options
   */
  private createFormattingOptions(languageCode: string): LocaleConfig['formatting'] {
    return {
      currency: {
        style: 'currency',
        currency: this.locales.get(languageCode)?.region.currency.code || 'USD'
      },
      date: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      },
      number: {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      }
    };
  }

  /**
   * Import translations
   */
  importTranslations(languageCode: string, namespace: string, data: Record<string, any>): void {
    const locale = this.locales.get(languageCode);
    if (!locale) return;

    let translationNamespace = locale.translations.namespaces.get(namespace);
    if (!translationNamespace) {
      translationNamespace = {
        name: namespace,
        translations: new Map(),
        isActive: true
      };
      locale.translations.namespaces.set(namespace, translationNamespace);
    }

    Object.entries(data).forEach(([key, value]) => {
      const translation: Translation = {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        metadata: {
          lastModified: new Date(),
          reviewed: false,
          confidence: 1
        }
      };
      translationNamespace!.translations.set(key, translation);
    });

    this.clearTranslationCache();
  }

  /**
   * Export translations
   */
  exportTranslations(languageCode: string, namespace?: string): Record<string, any> {
    const locale = this.locales.get(languageCode);
    if (!locale) return {};

    const result: Record<string, any> = {};

    const namespaces = namespace 
      ? [locale.translations.namespaces.get(namespace)].filter(Boolean) as TranslationNamespace[]
      : Array.from(locale.translations.namespaces.values());

    namespaces.forEach(ns => {
      ns.translations.forEach((translation, key) => {
        result[key] = {
          value: translation.value,
          context: translation.context,
          description: translation.description,
          pluralForm: translation.pluralForm
        };
      });
    });

    return result;
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): string[] {
    return Array.from(this.locales.keys());
  }

  /**
   * Subscribe to language changes
   */
  subscribe(observer: LanguageChangeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from language changes
   */
  unsubscribe(observer: LanguageChangeObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify observers of language changes
   */
  private notifyObservers(locale: LocaleConfig): void {
    this.observers.forEach(observer => observer.onLanguageChange(locale));
  }

  /**
   * Initialize default languages
   */
  private initializeDefaultLanguages(): void {
    const defaultLanguages: Language[] = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        isActive: true,
        isDefault: true,
        flag: '🇺🇸'
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        isActive: true,
        flag: '🇪🇸'
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        isActive: true,
        flag: '🇫🇷'
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        direction: 'ltr',
        isActive: true,
        flag: '🇩🇪'
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
        isActive: true,
        flag: '🇸🇦'
      }
    ];

    defaultLanguages.forEach(lang => this.registerLanguage(lang));
    
    // Set English as active by default
    this.setActiveLanguage('en');
  }
}

export interface LanguageChangeObserver {
  onLanguageChange(locale: LocaleConfig): void;
}

// Export singleton instance
export const languageManager = new LanguageManager();