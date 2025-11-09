import React, { ReactNode } from 'react';
import { useUIStore, useDataStore } from '../store';
import Sidebar from './Sidebar';
import Header from './Header';
import { clsx } from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className={clsx(
        'flex-1 flex flex-col transition-all duration-300 ease-in-out',
        sidebarOpen ? 'ml-80' : 'ml-16'
      )}>
        {/* Header */}
        <Header />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;