'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UserGroupIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  CogIcon, 
  UserIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

interface SidebarProps {
  userRole: UserRole;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  allowedRoles: UserRole[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, allowedRoles: ['admin', 'hr', 'team', 'client'] },
  { name: 'Projects', href: '/projects', icon: BriefcaseIcon, allowedRoles: ['admin', 'team', 'client'] },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, allowedRoles: ['admin', 'team'] },
  { name: 'Team', href: '/team', icon: UserGroupIcon, allowedRoles: ['admin', 'hr'] },
  { name: 'Clients', href: '/clients', icon: BuildingOfficeIcon, allowedRoles: ['admin', 'hr'] },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon, allowedRoles: ['admin', 'team', 'client'] },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, allowedRoles: ['admin', 'hr', 'team', 'client'] },
  { name: 'Time Tracking', href: '/time-tracking', icon: ClockIcon, allowedRoles: ['admin', 'team'] },
  { name: 'HR', href: '/hr', icon: UserIcon, allowedRoles: ['admin', 'hr'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, allowedRoles: ['admin', 'hr'] },
  { name: 'Invoices', href: '/invoices', icon: CurrencyDollarIcon, allowedRoles: ['admin', 'client'] },
  { name: 'Settings', href: '/settings', icon: CogIcon, allowedRoles: ['admin', 'hr', 'team', 'client'] },
];

export default function Sidebar({ userRole }: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => 
    item.allowedRoles.includes(userRole)
  );

  return (
    <aside 
      className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-width duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto fixed`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} text-xl font-semibold text-gray-800 dark:text-white`}>
          Project Manager
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
          <svg
            className="w-6 h-6 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            )}
          </svg>
        </button>
      </div>

      <nav className="mt-5 px-2 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${isActive
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-150 ease-in-out`}
            >
              <item.icon
                className={`${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'} mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150 ease-in-out`}
                aria-hidden="true"
              />
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} text-sm text-gray-500 dark:text-gray-400`}>
            <span className="font-medium">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span> Access
          </div>
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </aside>
  );
}