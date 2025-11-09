import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quality_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
      
      // Initialize local settings
      const initial: Record<string, string> = {};
      data?.forEach(setting => {
        initial[setting.setting_key] = setting.setting_value;
      });
      setLocalSettings(initial);
    } catch (error: any) {
      toast.error('Failed to load settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each setting
      for (const setting of settings) {
        if (localSettings[setting.setting_key] !== setting.setting_value) {
          const { error } = await supabase
            .from('quality_settings')
            .update({ setting_value: localSettings[setting.setting_key] })
            .eq('id', setting.id);

          if (error) throw error;
        }
      }

      toast.success('Settings saved successfully!');
      fetchSettings(); // Refresh
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.setting_type]) {
      acc[setting.setting_type] = [];
    }
    acc[setting.setting_type].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const renderInput = (setting: Setting) => {
    const value = localSettings[setting.setting_key] || '';

    if (setting.setting_key.includes('enabled') || setting.setting_key.includes('required')) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(setting.setting_key, e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (setting.setting_key.includes('threshold') || setting.setting_key.includes('score')) {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(setting.setting_key, e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(setting.setting_key, e.target.value)}
        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Control Settings</h1>
          <p className="text-white/60 mt-2">System configuration and quality thresholds</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Important Notice */}
      <Card className="bg-yellow-500/10 backdrop-blur-xl border-yellow-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">Important</h3>
              <p className="text-white/70 text-sm">
                Changes to quality thresholds and scoring criteria will affect future inspections 
                and may impact compliance reporting. Please review all changes carefully before saving.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="py-12 text-center text-white/60">
            Loading settings...
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([type, settingsInGroup]) => (
            <Card key={type} className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white capitalize">
                  {type.replace(/_/g, ' ')} Settings
                </CardTitle>
                <CardDescription className="text-white/60">
                  Configure {type.replace(/_/g, ' ').toLowerCase()} parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {settingsInGroup.map((setting) => (
                    <div key={setting.id} className="space-y-2">
                      <label className="block text-sm font-medium text-white/80">
                        {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <p className="text-sm text-white/60 mb-2">{setting.description}</p>
                      {renderInput(setting)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* System Information */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/60">Version</p>
              <p className="text-white font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-white/60">Environment</p>
              <p className="text-white font-medium">Production</p>
            </div>
            <div>
              <p className="text-white/60">Database</p>
              <p className="text-white font-medium">Supabase PostgreSQL</p>
            </div>
            <div>
              <p className="text-white/60">Last Updated</p>
              <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
