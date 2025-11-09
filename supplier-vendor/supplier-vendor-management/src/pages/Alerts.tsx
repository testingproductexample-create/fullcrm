import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_alerts')
        .select(`
          *,
          suppliers (supplier_name)
        `)
        .order('triggered_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="text-red-400" size={20} />;
      case 'medium':
        return <AlertTriangle className="text-yellow-400" size={20} />;
      default:
        return <Info className="text-blue-400" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Alerts & Notifications</h1>
        <p className="text-white/70 mt-1">Monitor supplier alerts and system notifications</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading alerts...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No alerts found</p>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div 
                key={alert.id} 
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border-l-4 ${
                  alert.severity === 'high' ? 'border-l-red-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                } border-r border-t border-b border-white/20`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{alert.alert_title}</h3>
                        <p className="text-white/60 text-sm mt-1">
                          {alert.suppliers?.supplier_name || 'System Alert'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        alert.status === 'active' ? 'bg-yellow-500/20 text-yellow-300' :
                        alert.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    
                    <p className="text-white/80 mt-3">{alert.alert_message}</p>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Category:</span>
                        <span className="text-white ml-2 capitalize">{alert.alert_category || 'General'}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Type:</span>
                        <span className="text-white ml-2 capitalize">{alert.alert_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Date:</span>
                        <span className="text-white ml-2">{new Date(alert.triggered_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {alert.acknowledged && (
                      <div className="mt-3 text-sm text-white/60">
                        Acknowledged by {alert.acknowledged_by} on {new Date(alert.acknowledged_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
