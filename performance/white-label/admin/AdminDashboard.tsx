/**
 * White-Label Administration Interface
 * Admin dashboard for managing white-label configurations
 */

import React, { useState, useEffect } from 'react';

// Admin Dashboard Component
export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setConfigurations([
      {
        id: '1',
        name: 'Default Configuration',
        status: 'active',
        lastModified: '2023-12-01',
        type: 'full'
      }
    ]);
    setLoading(false);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'branding', name: 'Branding', icon: '🎨' },
    { id: 'themes', name: 'Themes', icon: '🎭' },
    { id: 'languages', name: 'Languages', icon: '🌐' },
    { id: 'regions', name: 'Regions', icon: '🌍' },
    { id: 'templates', name: 'Templates', icon: '📄' },
    { id: 'features', name: 'Feature Flags', icon: '🚩' },
    { id: 'domains', name: 'Domains', icon: '🔗' },
    { id: 'api', name: 'API Config', icon: '🔌' }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>White-Label Administration</h1>
        <div className="header-actions">
          <button className="btn btn-primary">New Configuration</button>
          <button className="btn btn-secondary">Import Config</button>
          <button className="btn btn-secondary">Export All</button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="icon">{tab.icon}</span>
              <span className="name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="main-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'branding' && <BrandingTab />}
          {activeTab === 'themes' && <ThemesTab />}
          {activeTab === 'languages' && <LanguagesTab />}
          {activeTab === 'regions' && <RegionsTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'features' && <FeaturesTab />}
          {activeTab === 'domains' && <DomainsTab />}
          {activeTab === 'api' && <APITab />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC = () => {
  const [stats, setStats] = useState({
    activeConfigurations: 0,
    totalBrands: 0,
    activeDomains: 0,
    apiCalls: 0
  });

  return (
    <div className="tab-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <h3>{stats.activeConfigurations}</h3>
            <p>Active Configurations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-content">
            <h3>{stats.totalBrands}</h3>
            <p>Total Brands</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <h3>{stats.activeDomains}</h3>
            <p>Active Domains</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.apiCalls.toLocaleString()}</h3>
            <p>API Calls (24h)</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">🎨</span>
            <div className="activity-content">
              <p>Brand "Acme Corp" updated</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🔗</span>
            <div className="activity-content">
              <p>Domain "shop.acme.com" verified</p>
              <span className="activity-time">4 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🌐</span>
            <div className="activity-content">
              <p>Language "Spanish" added</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Branding Tab Component
const BrandingTab: React.FC = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Brand Management</h2>
        <button className="btn btn-primary" onClick={() => setEditingBrand({})}>
          Add New Brand
        </button>
      </div>

      <div className="brands-grid">
        {brands.map(brand => (
          <div key={brand.id} className="brand-card">
            <div className="brand-logo">
              {brand.logo ? <img src={brand.logo} alt={brand.name} /> : <div className="placeholder">🎨</div>}
            </div>
            <div className="brand-info">
              <h3>{brand.name}</h3>
              <p>{brand.description}</p>
              <div className="brand-status">
                <span className={`status ${brand.isActive ? 'active' : 'inactive'}`}>
                  {brand.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="brand-actions">
              <button className="btn btn-sm" onClick={() => setEditingBrand(brand)}>Edit</button>
              <button className="btn btn-sm btn-secondary">Preview</button>
              <button className="btn btn-sm btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editingBrand && (
        <BrandEditor
          brand={editingBrand}
          onSave={(brand) => {
            if (brand.id) {
              setBrands(brands.map(b => b.id === brand.id ? brand : b));
            } else {
              setBrands([...brands, { ...brand, id: Date.now().toString() }]);
            }
            setEditingBrand(null);
          }}
          onCancel={() => setEditingBrand(null)}
        />
      )}
    </div>
  );
};

// Themes Tab Component
const ThemesTab: React.FC = () => {
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<any>(null);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Theme Management</h2>
        <button className="btn btn-primary">Create New Theme</button>
      </div>

      <div className="themes-container">
        <div className="themes-list">
          {themes.map(theme => (
            <div
              key={theme.id}
              className={`theme-item ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
              onClick={() => setSelectedTheme(theme)}
            >
              <div className="theme-preview">
                <div className="color-palette">
                  {Object.entries(theme.colors).map(([key, value]) => (
                    <div
                      key={key}
                      className="color-swatch"
                      style={{ backgroundColor: value as string }}
                      title={`${key}: ${value}`}
                    />
                  ))}
                </div>
              </div>
              <div className="theme-info">
                <h4>{theme.name}</h4>
                <p>{theme.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedTheme && (
          <div className="theme-editor">
            <ThemeEditor theme={selectedTheme} />
          </div>
        )}
      </div>
    </div>
  );
};

// Languages Tab Component
const LanguagesTab: React.FC = () => {
  const [languages, setLanguages] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Language & Translation Management</h2>
        <div className="language-actions">
          <button className="btn btn-primary">Add Language</button>
          <button className="btn btn-secondary">Import Translations</button>
          <button className="btn btn-secondary">Export Translations</button>
        </div>
      </div>

      <div className="languages-container">
        <div className="languages-sidebar">
          <h3>Languages</h3>
          <ul className="language-list">
            {languages.map(lang => (
              <li
                key={lang.code}
                className={`language-item ${selectedLanguage === lang.code ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(lang.code)}
              >
                <span className="flag">{lang.flag}</span>
                <span className="name">{lang.nativeName}</span>
                <span className="status">{lang.isActive ? '✓' : '○'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="translations-panel">
          <h3>Translations ({selectedLanguage})</h3>
          <div className="translation-search">
            <input type="text" placeholder="Search translations..." className="form-input" />
            <select className="form-select">
              <option>All Namespaces</option>
              <option>common</option>
              <option>errors</option>
              <option>forms</option>
            </select>
          </div>
          <div className="translations-list">
            {translations.map(translation => (
              <div key={translation.key} className="translation-item">
                <div className="translation-key">{translation.key}</div>
                <input
                  type="text"
                  value={translation.value}
                  className="form-input translation-value"
                  onChange={(e) => {
                    // Update translation logic
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Regions Tab Component
const RegionsTab: React.FC = () => {
  const [regions, setRegions] = useState<any[]>([]);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Regional Settings</h2>
        <button className="btn btn-primary">Add Region</button>
      </div>

      <div className="regions-grid">
        {regions.map(region => (
          <div key={region.regionId} className="region-card">
            <div className="region-header">
              <h3>{region.name}</h3>
              <span className={`status ${region.isActive ? 'active' : 'inactive'}`}>
                {region.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="region-details">
              <div className="detail-item">
                <label>Country:</label>
                <span>{region.country}</span>
              </div>
              <div className="detail-item">
                <label>Currency:</label>
                <span>{region.currency.code} ({region.currency.symbol})</span>
              </div>
              <div className="detail-item">
                <label>Timezone:</label>
                <span>{region.timezone}</span>
              </div>
              <div className="detail-item">
                <label>Tax Rate:</label>
                <span>{region.taxSettings.rate}%</span>
              </div>
            </div>
            <div className="region-actions">
              <button className="btn btn-sm">Edit</button>
              <button className="btn btn-sm btn-secondary">Settings</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Templates Tab Component
const TemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Template Management</h2>
        <div className="template-actions">
          <button className="btn btn-primary">Create Template</button>
          <button className="btn btn-secondary">Import Template</button>
        </div>
      </div>

      <div className="templates-container">
        <div className="templates-sidebar">
          <div className="template-categories">
            <h3>Categories</h3>
            <ul>
              <li className="active">All Templates</li>
              <li>Layouts</li>
              <li>Pages</li>
              <li>Components</li>
              <li>Emails</li>
            </ul>
          </div>
        </div>

        <div className="templates-main">
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-preview">
                  <div className="preview-placeholder">
                    📄
                  </div>
                </div>
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span className="type">{template.type}</span>
                    <span className="version">v{template.version}</span>
                  </div>
                </div>
                <div className="template-actions">
                  <button className="btn btn-sm" onClick={() => setSelectedTemplate(template)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-secondary">Preview</button>
                  <button className="btn btn-sm btn-secondary">Clone</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTemplate && (
          <div className="template-editor">
            <TemplateEditor template={selectedTemplate} />
          </div>
        )}
      </div>
    </div>
  );
};

// Feature Flags Tab Component
const FeaturesTab: React.FC = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Feature Flags & Experiments</h2>
        <div className="flag-actions">
          <button className="btn btn-primary">New Feature Flag</button>
          <button className="btn btn-secondary">New Experiment</button>
        </div>
      </div>

      <div className="flags-section">
        <h3>Feature Flags</h3>
        <div className="flags-list">
          {flags.map(flag => (
            <div key={flag.id} className="flag-item">
              <div className="flag-info">
                <h4>{flag.name}</h4>
                <p>{flag.description}</p>
                <div className="flag-details">
                  <span className="flag-type">{flag.type}</span>
                  <span className={`flag-status ${flag.status}`}>{flag.status}</span>
                </div>
              </div>
              <div className="flag-controls">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={flag.isActive}
                    onChange={(e) => {
                      // Update flag status
                    }}
                  />
                  <span className="slider"></span>
                </div>
                <button className="btn btn-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="experiments-section">
        <h3>A/B Experiments</h3>
        <div className="experiments-list">
          {experiments.map(exp => (
            <div key={exp.id} className="experiment-item">
              <div className="experiment-info">
                <h4>{exp.name}</h4>
                <p>{exp.description}</p>
                <div className="experiment-status">
                  <span className={`status ${exp.status}`}>{exp.status}</span>
                  <span className="traffic">{exp.traffic}% traffic</span>
                </div>
              </div>
              <div className="experiment-actions">
                <button className="btn btn-sm">View Results</button>
                <button className="btn btn-sm btn-secondary">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Domains Tab Component
const DomainsTab: React.FC = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [addingDomain, setAddingDomain] = useState(false);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Custom Domain Management</h2>
        <button className="btn btn-primary" onClick={() => setAddingDomain(true)}>
          Add Domain
        </button>
      </div>

      <div className="domains-list">
        {domains.map(domain => (
          <div key={domain.id} className="domain-item">
            <div className="domain-info">
              <h4>{domain.domain}</h4>
              <div className="domain-details">
                <span className={`status ${domain.status}`}>{domain.status}</span>
                <span className="type">{domain.type}</span>
                <span className="ssl">
                  {domain.ssl?.enabled ? 'SSL Enabled' : 'SSL Disabled'}
                </span>
              </div>
            </div>
            <div className="domain-actions">
              <button className="btn btn-sm">Configure</button>
              <button className="btn btn-sm btn-secondary">SSL Settings</button>
              <button className="btn btn-sm btn-secondary">DNS Settings</button>
            </div>
          </div>
        ))}
      </div>

      {addingDomain && (
        <DomainSetupModal
          onClose={() => setAddingDomain(false)}
          onSave={(domain) => {
            setDomains([...domains, domain]);
            setAddingDomain(false);
          }}
        />
      )}
    </div>
  );
};

// API Tab Component
const APITab: React.FC = () => {
  const [apiConfigs, setApiConfigs] = useState<any[]>([]);
  const [openAPISpec, setOpenAPISpec] = useState<string>('');

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>API Configuration</h2>
        <div className="api-actions">
          <button className="btn btn-primary">New API Config</button>
          <button className="btn btn-secondary">Generate OpenAPI</button>
          <button className="btn btn-secondary">Test Endpoints</button>
        </div>
      </div>

      <div className="api-container">
        <div className="api-sidebar">
          <h3>API Endpoints</h3>
          <div className="endpoints-list">
            {/* Endpoint list will be populated here */}
          </div>
        </div>

        <div className="api-main">
          <div className="api-config">
            <h3>Configuration</h3>
            <form className="config-form">
              <div className="form-group">
                <label>Base Path</label>
                <input type="text" className="form-input" defaultValue="/api/v1" />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input type="text" className="form-input" defaultValue="1.0.0" />
              </div>
              <div className="form-group">
                <label>CORS Origin</label>
                <input type="text" className="form-input" defaultValue="*" />
              </div>
            </form>
          </div>

          <div className="api-documentation">
            <h3>OpenAPI Specification</h3>
            <textarea
              className="form-textarea"
              value={openAPISpec}
              onChange={(e) => setOpenAPISpec(e.target.value)}
              rows={20}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Brand Editor Component
const BrandEditor: React.FC<{
  brand: any;
  onSave: (brand: any) => void;
  onCancel: () => void;
}> = ({ brand, onSave, onCancel }) => {
  const [formData, setFormData] = useState(brand);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{brand.id ? 'Edit Brand' : 'Add New Brand'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <form className="brand-form">
            <div className="form-group">
              <label>Brand Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Logo URL</label>
              <input
                type="text"
                className="form-input"
                value={formData.logo || ''}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>
            <div className="color-section">
              <h4>Brand Colors</h4>
              <div className="color-inputs">
                <div className="form-group">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    className="form-color"
                    value={formData.colors?.primary || '#3B82F6'}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Secondary Color</label>
                  <input
                    type="color"
                    className="form-color"
                    value={formData.colors?.secondary || '#8B5CF6'}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

// Theme Editor Component
const ThemeEditor: React.FC<{ theme: any }> = ({ theme }) => {
  return (
    <div className="theme-editor-panel">
      <h3>Edit Theme: {theme.name}</h3>
      <div className="theme-editor-content">
        <div className="color-editor">
          <h4>Colors</h4>
          <div className="color-grid">
            {Object.entries(theme.colors || {}).map(([key, value]) => (
              <div key={key} className="color-editor-item">
                <label>{key}</label>
                <input
                  type="color"
                  value={value as string}
                  onChange={(e) => {
                    // Update color logic
                  }}
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => {
                    // Update color value
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="typography-editor">
          <h4>Typography</h4>
          <div className="form-group">
            <label>Font Family</label>
            <input
              type="text"
              className="form-input"
              value={theme.typography?.fontFamily || ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Editor Component
const TemplateEditor: React.FC<{ template: any }> = ({ template }) => {
  const [code, setCode] = useState('');

  return (
    <div className="template-editor-panel">
      <h3>Edit Template: {template.name}</h3>
      <div className="template-editor-toolbar">
        <button className="btn btn-sm">Preview</button>
        <button className="btn btn-sm">Save</button>
        <button className="btn btn-sm btn-secondary">Validate</button>
      </div>
      <div className="template-code-editor">
        <textarea
          className="code-editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Template code..."
        />
      </div>
    </div>
  );
};

// Domain Setup Modal Component
const DomainSetupModal: React.FC<{
  onClose: () => void;
  onSave: (domain: any) => void;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    domain: '',
    type: 'CNAME',
    provider: 'cloudflare'
  });

  const handleSave = () => {
    onSave({
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      createdAt: new Date()
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add Custom Domain</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form className="domain-form">
            <div className="form-group">
              <label>Domain Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="example.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Record Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="CNAME">CNAME</option>
                <option value="A">A Record</option>
                <option value="URL">URL Redirect</option>
              </select>
            </div>
            <div className="form-group">
              <label>DNS Provider</label>
              <select
                className="form-select"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              >
                <option value="cloudflare">Cloudflare</option>
                <option value="route53">Route 53</option>
                <option value="godaddy">GoDaddy</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add Domain</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;