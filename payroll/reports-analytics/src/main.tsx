import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Create root and render app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Performance monitoring
if (import.meta.env.DEV) {
  // Log React version in development
  console.log('React version:', React.version);
  
  // Add performance observer
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log('Navigation timing:', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            total: entry.loadEventEnd - entry.fetchStart,
          });
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      console.warn('Performance observer not supported');
    }
  }
}

// Service worker registration for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Report to analytics in production
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', 'exception', {
      description: event.error?.message || 'Unknown error',
      fatal: false
    });
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser behavior
  event.preventDefault();
  
  // Report to analytics in production
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', 'exception', {
      description: event.reason?.toString() || 'Unhandled promise rejection',
      fatal: false
    });
  }
});

// Global type declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
  
  interface PerformanceObserver {
    observe(options: { entryTypes: string[] }): void;
  }
}

export {};