// Service Worker for UAE Tailoring CRM PWA
// Handles offline functionality, caching, background sync, and push notifications

const CACHE_NAME = 'tailoring-crm-v1';
const OFFLINE_PAGE = '/offline';

// Cache strategies for different types of resources
const CACHE_STRATEGIES = {
  // Critical app shell resources - cache first
  APP_SHELL: [
    '/',
    '/dashboard',
    '/offline',
    '/manifest.json',
    '/_next/static/css/',
    '/_next/static/js/',
    '/icons/',
  ],
  
  // API responses - network first, fallback to cache
  API_ROUTES: [
    '/api/',
    '/auth/',
  ],
  
  // Static assets - cache first
  STATIC_ASSETS: [
    '/images/',
    '/icons/',
    '/screenshots/',
    '/_next/static/',
  ],
  
  // Dynamic pages - network first
  DYNAMIC_PAGES: [
    '/dashboard/',
    '/mobile/',
  ]
};

// Install event - pre-cache critical resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Pre-caching app shell');
        return cache.addAll([
          '/',
          '/dashboard',
          '/offline',
          '/manifest.json'
        ]);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API routes - Network first, cache fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - Cache first
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.pathname.startsWith('/dashboard/') || url.pathname.startsWith('/mobile/')) {
    // Dynamic pages - Network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    // Default strategy - Cache first for other resources
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Network first strategy - for dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    
    // Return a basic offline response for other requests
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Cache first strategy - for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Cache and network both failed', error);
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Network first with offline fallback - for pages
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Show offline page for navigation requests
    return caches.match(OFFLINE_PAGE);
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  switch (event.tag) {
    case 'order-sync':
      event.waitUntil(syncOfflineOrders());
      break;
    case 'customer-sync':
      event.waitUntil(syncOfflineCustomers());
      break;
    case 'measurement-sync':
      event.waitUntil(syncOfflineMeasurements());
      break;
    case 'attendance-sync':
      event.waitUntil(syncOfflineAttendance());
      break;
    default:
      event.waitUntil(syncAllOfflineData());
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received', event);
  
  const options = {
    body: 'You have new updates in your Tailoring CRM',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = { ...options.data, ...payload.data };
      
      // Customize notification based on type
      if (payload.type === 'order') {
        options.icon = '/icons/notification-order.png';
        options.body = `New order update: ${payload.body}`;
        options.data.url = `/dashboard/orders/${payload.orderId}`;
      } else if (payload.type === 'appointment') {
        options.icon = '/icons/notification-appointment.png';
        options.body = `Appointment reminder: ${payload.body}`;
        options.data.url = `/dashboard/appointments`;
      } else if (payload.type === 'compliance') {
        options.icon = '/icons/notification-compliance.png';
        options.body = `Compliance alert: ${payload.body}`;
        options.data.url = `/dashboard/visa-compliance`;
      }
    } catch (error) {
      console.error('Service Worker: Error parsing push notification payload', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Tailoring CRM', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  if (event.action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Sync offline data functions
async function syncOfflineOrders() {
  try {
    console.log('Service Worker: Syncing offline orders...');
    
    // Get offline orders from IndexedDB
    const offlineOrders = await getOfflineData('orders');
    
    for (const order of offlineOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          // Remove from offline storage after successful sync
          await removeOfflineData('orders', order.id);
          console.log('Service Worker: Order synced successfully', order.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync order', order.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline orders', error);
  }
}

async function syncOfflineCustomers() {
  try {
    console.log('Service Worker: Syncing offline customers...');
    
    const offlineCustomers = await getOfflineData('customers');
    
    for (const customer of offlineCustomers) {
      try {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customer.data)
        });
        
        if (response.ok) {
          await removeOfflineData('customers', customer.id);
          console.log('Service Worker: Customer synced successfully', customer.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync customer', customer.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline customers', error);
  }
}

async function syncOfflineMeasurements() {
  try {
    console.log('Service Worker: Syncing offline measurements...');
    
    const offlineMeasurements = await getOfflineData('measurements');
    
    for (const measurement of offlineMeasurements) {
      try {
        const response = await fetch('/api/measurements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(measurement.data)
        });
        
        if (response.ok) {
          await removeOfflineData('measurements', measurement.id);
          console.log('Service Worker: Measurement synced successfully', measurement.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync measurement', measurement.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline measurements', error);
  }
}

async function syncOfflineAttendance() {
  try {
    console.log('Service Worker: Syncing offline attendance...');
    
    const offlineAttendance = await getOfflineData('attendance');
    
    for (const record of offlineAttendance) {
      try {
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record.data)
        });
        
        if (response.ok) {
          await removeOfflineData('attendance', record.id);
          console.log('Service Worker: Attendance record synced successfully', record.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync attendance record', record.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline attendance', error);
  }
}

async function syncAllOfflineData() {
  console.log('Service Worker: Syncing all offline data...');
  await Promise.allSettled([
    syncOfflineOrders(),
    syncOfflineCustomers(),
    syncOfflineMeasurements(),
    syncOfflineAttendance()
  ]);
}

// Helper functions for IndexedDB operations
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TailoringCRM', 1);
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TailoringCRM', 1);
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}