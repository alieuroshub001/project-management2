'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BellIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Database } from '@/types/supabase';
import Image from 'next/image';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface HeaderProps {
  userProfile: Profile;
}

export default function Header({ userProfile }: HeaderProps) {
  const { signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="px-4 py-3 lg:px-6 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)} Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            {isDarkMode ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
            </button>

            {isNotificationsOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">New task assigned</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">You have been assigned a new task</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">5 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Project update</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Project XYZ has been updated</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                    <a href="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                      View all notifications
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {userProfile.avatar_url ? (
                  <Image 
                    src={userProfile.avatar_url} 
                    alt="Profile" 
                    width={32} 
                    height={32} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {userProfile.full_name || userProfile.email}
              </span>
            </button>

            {isProfileMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    Your Profile
                  </a>
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    Settings
                  </a>
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}