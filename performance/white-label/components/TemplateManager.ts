/**
 * Template Management System
 * Handles dynamic templates, layouts, and component configurations
 */

export interface Template {
  id: string;
  name: string;
  type: 'layout' | 'page' | 'component' | 'email' | 'document' | 'report';
  category: string;
  description?: string;
  version: string;
  template: {
    structure: TemplateStructure;
    styles: TemplateStyles;
    scripts?: string[];
    assets: TemplateAsset[];
  };
  variables: TemplateVariable[];
  customizations: TemplateCustomization[];
  metadata: {
    author: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    compatibility: string[];
  };
  isActive: boolean;
  isDefault: boolean;
  dependencies?: string[];
}

export interface TemplateStructure {
  sections: TemplateSection[];
  layout: LayoutConfig;
  responsive: ResponsiveConfig;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'header' | 'footer' | 'sidebar' | 'content' | 'navigation' | 'banner' | 'custom';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: SectionContent;
  styles: SectionStyles;
  props: Record<string, any>;
  children?: TemplateSection[];
}

export interface SectionContent {
  type: 'static' | 'dynamic' | 'component' | 'template';
  source?: string;
  component?: string;
  template?: string;
  data?: any;
  bindings?: DataBinding[];
}

export interface DataBinding {
  source: 'props' | 'state' | 'api' | 'context';
  path: string;
  transform?: string;
  fallback?: any;
}

export interface SectionStyles {
  css: string;
  classes: string[];
  variables: Record<string, string>;
  animations?: AnimationConfig[];
}

export interface AnimationConfig {
  name: string;
  duration: string;
  easing: string;
  delay?: string;
  trigger: 'load' | 'scroll' | 'click' | 'hover';
}

export interface LayoutConfig {
  type: 'grid' | 'flex' | 'absolute' | 'flow';
  columns?: number;
  rows?: number;
  gap: {
    horizontal: number;
    vertical: number;
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right' | 'justify';
    vertical: 'top' | 'center' | 'bottom' | 'stretch';
  };
}

export interface ResponsiveConfig {
  breakpoints: Record<string, number>;
  layout: {
    [breakpoint: string]: {
      sections: TemplateSection[];
      overrides: SectionStyles;
    };
  };
}

export interface TemplateStyles {
  global: GlobalStyles;
  components: ComponentStyles;
  themes: ThemeStyles[];
}

export interface GlobalStyles {
  css: string;
  variables: Record<string, string>;
  fonts: FontConfig[];
  icons: IconConfig[];
}

export interface FontConfig {
  family: string;
  src: string;
  weight?: string;
  style?: string;
}

export interface IconConfig {
  name: string;
  src: string;
  type: 'svg' | 'font' | 'image';
}

export interface ComponentStyles {
  [componentName: string]: {
    default: ComponentStyleVariant;
    variants: ComponentStyleVariant[];
  };
}

export interface ComponentStyleVariant {
  name: string;
  styles: SectionStyles;
  props: Record<string, any>;
}

export interface ThemeStyles {
  name: string;
  styles: SectionStyles;
  variables: Record<string, string>;
}

export interface TemplateAsset {
  id: string;
  name: string;
  type: 'image' | 'script' | 'style' | 'font' | 'icon';
  url: string;
  path: string;
  metadata: {
    size: number;
    format: string;
    optimized: boolean;
  };
  dependencies?: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  defaultValue: any;
  description?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
  bindings?: DataBinding[];
  customizations?: VariableCustomization[];
}

export interface VariableCustomization {
  type: 'input' | 'select' | 'color' | 'range' | 'toggle' | 'file';
  config: any;
}

export interface TemplateCustomization {
  sectionId?: string;
  variableName?: string;
  type: 'style' | 'content' | 'layout' | 'behavior';
  options: CustomizationOption[];
  preview?: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  value: any;
  preview?: string;
  conditions?: {
    variables: Record<string, any>;
    context?: string;
  };
}

export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private activeTemplate: Template | null = null;
  private templateCache: Map<string, any> = new Map();
  private observers: Set<TemplateChangeObserver> = new Set();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Register a new template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.id, template);
    if (template.isActive) {
      this.setActiveTemplate(template.id);
    }
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<Template>): void {
    const template = this.templates.get(templateId);
    if (template) {
      const updatedTemplate = {
        ...template,
        ...updates,
        metadata: {
          ...template.metadata,
          updatedAt: new Date()
        }
      };
      this.templates.set(templateId, updatedTemplate);
      
      // Clear cache
      this.templateCache.delete(templateId);
      
      if (this.activeTemplate?.id === templateId) {
        this.setActiveTemplate(templateId);
      }
    }
  }

  /**
   * Set active template
   */
  setActiveTemplate(templateId: string): void {
    const template = this.templates.get(templateId);
    if (template) {
      this.activeTemplate = template;
      this.notifyObservers(template);
    }
  }

  /**
   * Get active template
   */
  getActiveTemplate(): Template | null {
    return this.activeTemplate;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: Template['type']): Template[] {
    return Array.from(this.templates.values()).filter(
      template => template.type === type
    );
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Template[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  /**
   * Render template
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, any> = {},
    options: RenderOptions = {}
  ): Promise<RenderedTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Check cache first
    const cacheKey = this.buildCacheKey(templateId, variables, options);
    if (this.templateCache.has(cacheKey) && !options.forceRender) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      // Validate variables
      this.validateVariables(template, variables);

      // Process template structure
      const processedStructure = await this.processTemplateStructure(
        template.template.structure,
        variables,
        options
      );

      // Process styles
      const processedStyles = this.processTemplateStyles(
        template.template.styles,
        variables
      );

      // Process assets
      const processedAssets = await this.processTemplateAssets(
        template.template.assets,
        variables
      );

      const rendered: RenderedTemplate = {
        id: template.id,
        name: template.name,
        type: template.type,
        structure: processedStructure,
        styles: processedStyles,
        assets: processedAssets,
        variables,
        html: await this.generateHTML(template, processedStructure, processedStyles),
        css: processedStyles,
        scripts: template.template.scripts || [],
        metadata: template.metadata
      };

      // Cache the result
      this.templateCache.set(cacheKey, rendered);
      
      return rendered;
    } catch (error) {
      throw new Error(`Failed to render template ${templateId}: ${error}`);
    }
  }

  /**
   * Process template structure
   */
  private async processTemplateStructure(
    structure: TemplateStructure,
    variables: Record<string, any>,
    options: RenderOptions
  ): Promise<TemplateStructure> {
    const processedSections = await Promise.all(
      structure.sections.map(section => this.processSection(section, variables, options))
    );

    return {
      ...structure,
      sections: processedSections
    };
  }

  /**
   * Process individual section
   */
  private async processSection(
    section: TemplateSection,
    variables: Record<string, any>,
    options: RenderOptions
  ): Promise<TemplateSection> {
    // Process content
    const processedContent = await this.processSectionContent(
      section.content,
      variables,
      options
    );

    // Process styles
    const processedStyles = this.processSectionStyles(
      section.styles,
      variables
    );

    // Process children recursively
    const processedChildren = section.children ? 
      await Promise.all(
        section.children.map(child => 
          this.processSection(child, variables, options)
        )
      ) : undefined;

    return {
      ...section,
      content: processedContent,
      styles: processedStyles,
      children: processedChildren
    };
  }

  /**
   * Process section content
   */
  private async processSectionContent(
    content: SectionContent,
    variables: Record<string, any>,
    options: RenderOptions
  ): Promise<SectionContent> {
    switch (content.type) {
      case 'static':
        return content;
      
      case 'dynamic':
        if (content.source) {
          const value = this.resolveBinding(content.source, variables);
          return {
            ...content,
            data: value
          };
        }
        return content;
      
      case 'component':
        if (content.component) {
          // Render component (implementation would depend on component system)
          return {
            ...content,
            data: await this.renderComponent(content.component, content.props, variables)
          };
        }
        return content;
      
      case 'template':
        if (content.template) {
          const rendered = await this.renderTemplate(
            content.template,
            { ...variables, ...content.data },
            options
          );
          return {
            ...content,
            data: rendered
          };
        }
        return content;
      
      default:
        return content;
    }
  }

  /**
   * Process section styles
   */
  private processSectionStyles(
    styles: SectionStyles,
    variables: Record<string, any>
  ): SectionStyles {
    // Replace variable references in CSS
    let processedCSS = styles.css;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedCSS = processedCSS.replace(regex, String(value));
    });

    // Process CSS variables
    const processedVariables = { ...styles.variables };
    Object.entries(variables).forEach(([key, value]) => {
      const varName = `--${key}`;
      if (processedVariables[varName]) {
        processedVariables[varName] = String(value);
      }
    });

    return {
      ...styles,
      css: processedCSS,
      variables: processedVariables
    };
  }

  /**
   * Process template styles
   */
  private processTemplateStyles(
    styles: TemplateStyles,
    variables: Record<string, any>
  ): TemplateStyles {
    // Process global styles
    const processedGlobal = {
      ...styles.global,
      css: this.replaceVariables(styles.global.css, variables),
      variables: this.replaceVariables(styles.global.variables, variables)
    };

    return {
      ...styles,
      global: processedGlobal
    };
  }

  /**
   * Process template assets
   */
  private async processTemplateAssets(
    assets: TemplateAsset[],
    variables: Record<string, any>
  ): Promise<TemplateAsset[]> {
    return assets.map(asset => ({
      ...asset,
      url: this.replaceVariables(asset.url, variables),
      path: this.replaceVariables(asset.path, variables)
    }));
  }

  /**
   * Generate HTML from template
   */
  private async generateHTML(
    template: Template,
    structure: TemplateStructure,
    styles: TemplateStyles
  ): Promise<string> {
    // This is a simplified implementation
    // In production, you would use a proper template engine
    
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    
    // Add meta tags
    html += '<meta charset="utf-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
    
    // Add styles
    html += `<style>${styles.global.css}</style>\n`;
    
    // Add custom styles from structure
    structure.sections.forEach(section => {
      if (section.styles.css) {
        html += `<style>#${section.id} { ${section.styles.css} }</style>\n`;
      }
    });
    
    html += '</head>\n<body>\n';
    
    // Add sections
    structure.sections.forEach(section => {
      html += this.generateSectionHTML(section);
    });
    
    html += '</body>\n</html>';
    
    return html;
  }

  /**
   * Generate HTML for section
   */
  private generateSectionHTML(section: TemplateSection): string {
    let html = `<div id="${section.id}" class="${section.styles.classes.join(' ')}">`;
    
    if (section.content.data) {
      if (typeof section.content.data === 'string') {
        html += section.content.data;
      } else {
        html += JSON.stringify(section.content.data);
      }
    }
    
    if (section.children) {
      section.children.forEach(child => {
        html += this.generateSectionHTML(child);
      });
    }
    
    html += '</div>\n';
    return html;
  }

  /**
   * Render component
   */
  private async renderComponent(
    componentName: string,
    props: Record<string, any>,
    variables: Record<string, any>
  ): Promise<any> {
    // Simplified component rendering
    // In production, this would integrate with your component system
    return {
      component: componentName,
      props: { ...props, ...variables }
    };
  }

  /**
   * Resolve data binding
   */
  private resolveBinding(source: string, variables: Record<string, any>): any {
    const paths = source.split('.');
    let current = variables;
    
    for (const path of paths) {
      if (current && typeof current === 'object' && path in current) {
        current = current[path];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Replace variables in string
   */
  private replaceVariables(str: string, variables: Record<string, any>): string {
    let result = str;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  }

  /**
   * Validate template variables
   */
  private validateVariables(template: Template, variables: Record<string, any>): void {
    template.variables.forEach(variable => {
      if (variable.required && !(variable.name in variables)) {
        throw new Error(`Required variable '${variable.name}' is missing`);
      }
      
      if (variable.name in variables) {
        const value = variables[variable.name];
        this.validateVariableValue(variable, value);
      }
    });
  }

  /**
   * Validate variable value
   */
  private validateVariableValue(variable: TemplateVariable, value: any): void {
    // Type validation
    if (typeof value !== variable.type) {
      // Allow some type coercion for numbers and booleans
      if (variable.type === 'number' && typeof value === 'string') {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Variable '${variable.name}' must be a number`);
        }
      } else if (variable.type === 'boolean' && typeof value === 'string') {
        if (value !== 'true' && value !== 'false') {
          throw new Error(`Variable '${variable.name}' must be a boolean`);
        }
      } else {
        throw new Error(`Variable '${variable.name}' must be of type ${variable.type}`);
      }
    }
    
    // Range validation
    if (variable.validation) {
      if (variable.validation.min !== undefined && value < variable.validation.min) {
        throw new Error(`Variable '${variable.name}' must be >= ${variable.validation.min}`);
      }
      
      if (variable.validation.max !== undefined && value > variable.validation.max) {
        throw new Error(`Variable '${variable.name}' must be <= ${variable.validation.max}`);
      }
      
      if (variable.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(variable.validation.pattern);
        if (!regex.test(value)) {
          throw new Error(`Variable '${variable.name}' does not match required pattern`);
        }
      }
      
      if (variable.validation.options && !variable.validation.options.includes(value)) {
        throw new Error(`Variable '${variable.name}' must be one of: ${variable.validation.options.join(', ')}`);
      }
    }
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    templateId: string,
    variables: Record<string, any>,
    options: RenderOptions
  ): string {
    return JSON.stringify({
      templateId,
      variables,
      options
    });
  }

  /**
   * Clone template
   */
  cloneTemplate(templateId: string, newId: string, changes?: Partial<Template>): Template {
    const original = this.templates.get(templateId);
    if (!original) {
      throw new Error(`Template ${templateId} not found`);
    }

    const cloned: Template = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      ...changes,
      metadata: {
        ...original.metadata,
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    this.registerTemplate(cloned);
    return cloned;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    if (this.activeTemplate?.id === templateId) {
      console.warn('Cannot delete active template');
      return false;
    }
    
    this.templateCache.delete(templateId);
    return this.templates.delete(templateId);
  }

  /**
   * Export template
   */
  exportTemplate(templateId: string): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template
   */
  importTemplate(templateConfig: string): Template {
    try {
      const template = JSON.parse(templateConfig) as Template;
      this.registerTemplate(template);
      return template;
    } catch (error) {
      throw new Error('Invalid template configuration format');
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Subscribe to template changes
   */
  subscribe(observer: TemplateChangeObserver): void {
    this.observers.add(observer);
  }

  /**
   * Unsubscribe from template changes
   */
  unsubscribe(observer: TemplateChangeObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notify observers of template changes
   */
  private notifyObservers(template: Template): void {
    this.observers.forEach(observer => observer.onTemplateChange(template));
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplate: Template = {
      id: 'default-layout',
      name: 'Default Layout',
      type: 'layout',
      category: 'core',
      description: 'Default layout template',
      version: '1.0.0',
      template: {
        structure: {
          sections: [],
          layout: {
            type: 'flex',
            gap: { horizontal: 16, vertical: 16 },
            alignment: { horizontal: 'left', vertical: 'top' }
          },
          responsive: {
            breakpoints: {
              sm: 640,
              md: 768,
              lg: 1024,
              xl: 1280
            },
            layout: {}
          }
        },
        styles: {
          global: {
            css: 'body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }',
            variables: {},
            fonts: [],
            icons: []
          },
          components: {},
          themes: []
        },
        assets: []
      },
      variables: [],
      customizations: [],
      metadata: {
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['default', 'layout'],
        compatibility: ['all']
      },
      isActive: true,
      isDefault: true
    };

    this.registerTemplate(defaultTemplate);
  }
}

export interface RenderOptions {
  forceRender?: boolean;
  optimize?: boolean;
  minify?: boolean;
  includeAssets?: boolean;
  context?: Record<string, any>;
}

export interface RenderedTemplate {
  id: string;
  name: string;
  type: Template['type'];
  structure: TemplateStructure;
  styles: TemplateStyles;
  assets: TemplateAsset[];
  variables: Record<string, any>;
  html: string;
  css: TemplateStyles;
  scripts: string[];
  metadata: Template['metadata'];
}

export interface TemplateChangeObserver {
  onTemplateChange(template: Template): void;
}

// Export singleton instance
export const templateManager = new TemplateManager();