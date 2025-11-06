'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Smartphone, Download, CheckCircle } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('offline-sync');
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get last sync time from localStorage
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Status Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-8 text-center">
          {/* Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            isOnline ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isOnline ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <WifiOff className="w-10 h-10 text-red-600" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {isOnline ? (
              'Your internet connection has been restored. The app will automatically sync your offline changes.'
            ) : (
              'It looks like you\'re not connected to the internet. Don\'t worry - you can still access cached content and your changes will sync when you\'re back online.'
            )}
          </p>

          {/* Online Status */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {/* Last Sync Info */}
          {lastSyncTime && (
            <p className="text-sm text-gray-500 mb-6">
              Last sync: {lastSyncTime.toLocaleDateString()} at {lastSyncTime.toLocaleTimeString()}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isOnline ? (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            ) : (
              <button
                onClick={handleRetry}
                disabled={retryCount >= 3}
                className={`w-full px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  retryCount >= 3
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${retryCount >= 3 ? '' : 'animate-spin'}`} />
                {retryCount >= 3 ? 'Max Retries Reached' : `Retry Connection (${retryCount}/3)`}
              </button>
            )}

            <button
              onClick={handleGoBack}
              className="w-full px-6 py-3 bg-white/50 text-gray-700 rounded-lg hover:bg-white/70 transition-colors border border-white/30"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Available Offline Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                View cached customer information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Access measurement records
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Create new orders (sync when online)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Take attendance records
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                View appointment schedule
              </li>
            </ul>
          </div>
        )}

        {/* PWA Install Prompt */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Install App for Better Offline Experience
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Install the Tailoring CRM app for faster access and better offline functionality.
          </p>
          <button
            onClick={() => {
              // This will be handled by the PWA install prompt
              if ('beforeinstallprompt' in window) {
                (window as any).beforeinstallprompt?.prompt();
              } else {
                alert('To install this app, use your browser\'s "Add to Home Screen" option.');
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}