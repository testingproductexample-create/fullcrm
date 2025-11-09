import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/70 mt-1">Configure system preferences and parameters</p>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Default Currency</label>
            <select className="w-full md:w-1/3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="AED">AED - UAE Dirham</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Date Format</label>
            <select className="w-full md:w-1/3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Language</label>
            <select className="w-full md:w-1/3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Performance Thresholds</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Minimum Quality Rating (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              defaultValue="3.0"
              className="w-full md:w-1/3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Minimum On-Time Delivery Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              defaultValue="85"
              className="w-full md:w-1/3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Maximum Defect Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue="5.0"
              className="w-full md:w-1/3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Notification Settings</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded bg-white/10 border-white/20"
            />
            <span className="text-white">Contract renewal alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded bg-white/10 border-white/20"
            />
            <span className="text-white">Certification expiry alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded bg-white/10 border-white/20"
            />
            <span className="text-white">Poor performance alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded bg-white/10 border-white/20"
            />
            <span className="text-white">Delayed delivery alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded bg-white/10 border-white/20"
            />
            <span className="text-white">Compliance audit reminders</span>
          </label>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Evaluation Criteria Weights</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-sm">Price</label>
              <span className="text-white font-medium">35%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="35"
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-sm">Quality</label>
              <span className="text-white font-medium">30%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="30"
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-sm">Delivery</label>
              <span className="text-white font-medium">25%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="25"
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-sm">Service</label>
              <span className="text-white font-medium">10%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="10"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
        <Save size={20} />
        Save Settings
      </button>
    </div>
  );
}
