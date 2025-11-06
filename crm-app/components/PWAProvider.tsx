'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  initializePWA, 
  PWAInstaller, 
  OfflineDataManager, 
  NetworkMonitor, 
  isPWAInstalled,
  isMobileDevice,
  getPWACapabilities
} from '@/lib/pwa';

interface PWAContextType {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  showInstallPrompt: () => Promise<boolean>;
  offlineManager: OfflineDataManager | null;
  capabilities: ReturnType<typeof getPWACapabilities>;
  registration: ServiceWorkerRegistration | null;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installer, setInstaller] = useState<PWAInstaller | null>(null);
  const [offlineManager, setOfflineManager] = useState<OfflineDataManager | null>(null);
  const [networkMonitor, setNetworkMonitor] = useState<NetworkMonitor | null>(null);
  const [capabilities, setCapabilities] = useState(getPWACapabilities());
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    async function initPWA() {
      try {
        // Initialize PWA features
        const { 
          registration: reg, 
          installer: inst, 
          offlineManager: offMgr, 
          networkMonitor: netMon 
        } = await initializePWA();

        setRegistration(reg);
        setInstaller(inst);
        setOfflineManager(offMgr);
        setNetworkMonitor(netMon);

        // Set initial states
        setIsInstalled(isPWAInstalled());
        setIsMobile(isMobileDevice());
        setCapabilities(getPWACapabilities());

        // Monitor install status
        if (inst) {
          const checkInstallStatus = () => {
            const status = inst.getInstallStatus();
            setCanInstall(status.canInstall);
            setIsInstalled(status.isInstalled);
          };

          checkInstallStatus();
          
          // Check periodically for install status changes
          const interval = setInterval(checkInstallStatus, 1000);
          setTimeout(() => clearInterval(interval), 10000); // Stop after 10 seconds
        }

        // Monitor network status
        if (netMon) {
          setIsOnline(netMon.isOnline);
          
          netMon.addListener((online) => {
            setIsOnline(online);
            
            if (online) {
              console.log('PWA: Back online - triggering sync');
              // Trigger background sync when coming back online
              if (offMgr) {
                offMgr.attemptBackgroundSync();
              }
            }
          });
        }

        // Show install banner after delay if not installed and can install
        setTimeout(() => {
          if (inst && inst.canInstall() && !isPWAInstalled() && isMobileDevice()) {
            showInstallBanner();
          }
        }, 5000);

      } catch (error) {
        console.error('PWA: Initialization failed', error);
      }
    }

    initPWA();
  }, []);

  const showInstallPrompt = async (): Promise<boolean> => {
    if (!installer) {
      console.log('PWA: Installer not available');
      return false;
    }

    const result = await installer.showInstallPrompt();
    
    if (result) {
      setIsInstalled(true);
      setCanInstall(false);
    }
    
    return result;
  };

  const showInstallBanner = () => {
    if (document.getElementById('pwa-install-banner')) {
      return; // Banner already shown
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      color: white;
      padding: 12px 16px;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            📱
          </div>
          <span><strong>Install Tailoring CRM</strong> for faster access and offline use!</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwa-install-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;">
            Install
          </button>
          <button id="pwa-dismiss-btn" style="background: none; border: none; color: white; padding: 6px 8px; cursor: pointer; opacity: 0.8;">
            ✕
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.style.transform = 'translateY(0)';
    });

    // Handle install button click
    banner.querySelector('#pwa-install-btn')?.addEventListener('click', async () => {
      const installed = await showInstallPrompt();
      if (installed) {
        removeBanner();
      }
    });

    // Handle dismiss button click
    banner.querySelector('#pwa-dismiss-btn')?.addEventListener('click', () => {
      removeBanner();
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      removeBanner();
    }, 30000);

    function removeBanner() {
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
      }, 300);
    }
  };

  const contextValue: PWAContextType = {
    isOnline,
    canInstall,
    isInstalled,
    isMobile,
    showInstallPrompt,
    offlineManager,
    capabilities,
    registration,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50 text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            You're offline. Changes will sync when connection is restored.
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}