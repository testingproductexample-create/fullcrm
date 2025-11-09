// PWA utility functions for service worker registration, push notifications, and offline handling

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    beforeinstallprompt?: BeforeInstallPromptEvent;
  }
}

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if ('serviceWorker' in navigator) {
    try {
      console.log('PWA: Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Update found
      registration.addEventListener('updatefound', () => {
        console.log('PWA: Service worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              showUpdateNotification();
            }
          });
        }
      });

      // Check for updates
      if (registration.waiting) {
        showUpdateNotification();
      }

      console.log('PWA: Service worker registered successfully', registration);
      return registration;
    } catch (error) {
      console.error('PWA: Service worker registration failed', error);
      return null;
    }
  } else {
    console.log('PWA: Service workers not supported');
    return null;
  }
}

// Show update notification
function showUpdateNotification() {
  if (confirm('New version available! Click OK to update the app.')) {
    window.location.reload();
  }
}

// Push notification subscription
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    console.log('PWA: Subscribing to push notifications...');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
    });

    console.log('PWA: Push notification subscription successful', subscription);
    
    // Send subscription to server
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('PWA: Push notification subscription failed', error);
    return null;
  }
}

// Convert VAPID key
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Send subscription to server
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    console.log('PWA: Subscription sent to server');
  } catch (error) {
    console.error('PWA: Failed to send subscription to server', error);
  }
}

// PWA install prompt
export class PWAInstaller {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      console.log('PWA: Install prompt captured');
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.isInstalled = true;
      this.installPrompt = null;
    });

    // Check for standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('PWA: User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('PWA: Error showing install prompt', error);
      return false;
    }
  }

  public canInstall(): boolean {
    return this.installPrompt !== null && !this.isInstalled;
  }

  public getInstallStatus(): { canInstall: boolean; isInstalled: boolean } {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled,
    };
  }
}

// Offline data management using IndexedDB
export class OfflineDataManager {
  private dbName = 'TailoringCRM';
  private dbVersion = 1;

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for offline data
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
          ordersStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
          customersStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('measurements')) {
          const measurementsStore = db.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
          measurementsStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
          attendanceStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type');
          syncStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async saveOfflineData(storeName: string, data: any): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const offlineData = {
      ...data,
      timestamp: new Date().toISOString(),
      offline: true,
    };

    await store.add(offlineData);
    console.log(`PWA: Offline data saved to ${storeName}`, offlineData);
  }

  async getOfflineData(storeName: string): Promise<any[]> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineData(storeName: string, id: string | number): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await store.delete(id);
    console.log(`PWA: Offline data removed from ${storeName}`, id);
  }

  async clearOfflineData(storeName?: string): Promise<void> {
    const db = await this.openDB();
    
    if (storeName) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
      console.log(`PWA: Cleared offline data from ${storeName}`);
    } else {
      const storeNames = ['orders', 'customers', 'measurements', 'attendance', 'sync_queue'];
      const transaction = db.transaction(storeNames, 'readwrite');
      
      for (const name of storeNames) {
        const store = transaction.objectStore(name);
        await store.clear();
      }
      console.log('PWA: Cleared all offline data');
    }
  }

  async queueForSync(type: string, data: any, action: string = 'create'): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    const syncItem = {
      type,
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    await store.add(syncItem);
    console.log('PWA: Item queued for sync', syncItem);
    
    // Try to sync if online
    if (navigator.onLine) {
      this.attemptBackgroundSync(type);
    }
  }

  async attemptBackgroundSync(type?: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const tag = type ? `${type}-sync` : 'offline-sync';
        await registration.sync.register(tag);
        console.log(`PWA: Background sync registered: ${tag}`);
      } catch (error) {
        console.error('PWA: Background sync registration failed', error);
      }
    }
  }
}

// Network status monitoring
export class NetworkMonitor {
  private listeners: Array<(online: boolean) => void> = [];
  private _isOnline: boolean;

  constructor() {
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  private handleOnline() {
    this._isOnline = true;
    console.log('PWA: Network status: ONLINE');
    this.notifyListeners(true);
    
    // Trigger background sync when coming online
    const offlineManager = new OfflineDataManager();
    offlineManager.attemptBackgroundSync();
  }

  private handleOffline() {
    this._isOnline = false;
    console.log('PWA: Network status: OFFLINE');
    this.notifyListeners(false);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  public get isOnline(): boolean {
    return this._isOnline;
  }

  public addListener(listener: (online: boolean) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (online: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// Initialize PWA features
export async function initializePWA(): Promise<{
  registration: ServiceWorkerRegistration | null;
  installer: PWAInstaller;
  offlineManager: OfflineDataManager;
  networkMonitor: NetworkMonitor;
}> {
  console.log('PWA: Initializing PWA features...');

  const registration = await registerServiceWorker();
  const installer = new PWAInstaller();
  const offlineManager = new OfflineDataManager();
  const networkMonitor = new NetworkMonitor();

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  // Subscribe to push notifications if permission granted
  if (registration && Notification.permission === 'granted') {
    // This would normally use your VAPID public key
    const vapidPublicKey = 'your-vapid-public-key-here';
    // await subscribeToPushNotifications(registration, vapidPublicKey);
  }

  console.log('PWA: Initialization complete');

  return {
    registration,
    installer,
    offlineManager,
    networkMonitor,
  };
}

// Utility function to detect if app is installed
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('utm_source=pwa')
  );
}

// Utility function to detect mobile device
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
}

// Utility function to check PWA capabilities
export function getPWACapabilities(): {
  hasServiceWorker: boolean;
  hasNotifications: boolean;
  hasBackgroundSync: boolean;
  hasIndexedDB: boolean;
  hasGeolocation: boolean;
  hasCamera: boolean;
  hasBiometrics: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      hasServiceWorker: false,
      hasNotifications: false,
      hasBackgroundSync: false,
      hasIndexedDB: false,
      hasGeolocation: false,
      hasCamera: false,
      hasBiometrics: false,
    };
  }

  return {
    hasServiceWorker: 'serviceWorker' in navigator,
    hasNotifications: 'Notification' in window,
    hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    hasIndexedDB: 'indexedDB' in window,
    hasGeolocation: 'geolocation' in navigator,
    hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    hasBiometrics: 'credentials' in navigator && 'PublicKeyCredential' in window,
  };
}