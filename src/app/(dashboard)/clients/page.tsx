'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Clients() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !profile) {
      router.push('/auth/login');
      return;
    }

    // Only admin can access this page
    if (profile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchClients();
  }, [user, profile, authLoading, router]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_companies')
        .select(`
          *,
          projects:projects(id),
          profiles:profiles(id, full_name, email)
        `);

      if (error) throw error;
      
      // Process data to count projects and contacts
      const processedData = data?.map((client: { projects: string | any[]; profiles: string | any[]; }) => ({
        ...client,
        projectCount: client.projects ? client.projects.length : 0,
        contactCount: client.profiles ? client.profiles.length : 0
      }));
      
      setClients(processedData || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    return client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || authLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Clients</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all client companies including their contact information and project count.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/clients/new" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Client
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search clients"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Company</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Contact</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Projects</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Client Since</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                              <span className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                              {client.website && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {client.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {client.contact_name && (
                            <div>
                              <div>{client.contact_name}</div>
                              {client.contact_email && (
                                <a href={`mailto:${client.contact_email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                  {client.contact_email}
                                </a>
                              )}
                              {client.contact_phone && (
                                <div>{client.contact_phone}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <Link href={`/projects?client=${client.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                            {client.projectCount} {client.projectCount === 1 ? 'project' : 'projects'}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(client.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${client.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {client.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View<span className="sr-only">, {client.name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No clients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PlusIcon = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
};