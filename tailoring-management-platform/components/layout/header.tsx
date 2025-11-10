'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" onSubmit={handleSearch}>
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <Input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
            placeholder="Search customers, orders, employees..."
            type="search"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gray-500 hover:text-gray-700"
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
          >
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">View notifications</span>
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="flex items-center gap-x-2">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="hidden lg:flex lg:flex-col">
              <div className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.user_metadata?.role || 'Member'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}