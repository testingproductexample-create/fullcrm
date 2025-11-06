import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CommissionProvider } from './context/CommissionContext';
import Dashboard from './components/Dashboard';
import CommissionTracking from './components/CommissionTracking';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Templates from './components/Templates';
import Payments from './components/Payments';
import Navigation from './components/Navigation';
import './i18n';

function App() {
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const isRTL = i18n.language === 'ar';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tracking':
        return <CommissionTracking />;
      case 'settings':
        return <Settings />;
      case 'reports':
        return <Reports />;
      case 'templates':
        return <Templates />;
      case 'payments':
        return <Payments />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <CommissionProvider>
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Glassmorphism background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-5 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <header className="backdrop-blur-xl bg-white/20 border-b border-white/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {i18n.t('dashboard.title')}
                    </h1>
                    <p className="text-sm text-gray-600">UAE Payroll Commission Management</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <LanguageSelector />
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">A</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="mt-8">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </CommissionProvider>
  );
}

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
      >
        <span className="text-sm font-medium">
          {i18n.language === 'en' ? 'English' : 'العربية'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg bg-white/90 backdrop-blur-sm border border-white/30 shadow-lg z-50">
          <button
            onClick={toggleLanguage}
            className="w-full text-left px-4 py-2 text-sm hover:bg-white/50 transition-colors"
          >
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
