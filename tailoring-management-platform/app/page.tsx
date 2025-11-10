'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MainDashboard } from '@/components/dashboard/main-dashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Force this page to be dynamic (disable static generation)
export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, loading, error } = useAuth();

  useEffect(() => {
    // Auto-redirect non-authenticated users to auth page
    if (!loading && !user && !error) {
      redirect('/auth/login');
    }
  }, [user, loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
          <p className="text-gray-600">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Redirecting...</h2>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <MainDashboard />
    </DashboardLayout>
  );
}