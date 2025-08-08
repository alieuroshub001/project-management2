'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Projects() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !profile) {
      router.push('/auth/login');
      return;
    }

    fetchProjects();
  }, [user, profile, authLoading, router]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client_companies(name),
          project_members!inner(profile_id)
        `);

      // Filter by user role
      if (profile?.role === 'admin' || profile?.role === 'hr') {
        // Admins and HR can see all projects
      } else if (profile?.role === 'team') {
        // Team members can only see projects they are members of
        query = query.eq('project_members.profile_id', user?.id);
      } else if (profile?.role === 'client') {
        // Clients can only see projects associated with their company
        query = query.eq('client_company_id', profile?.client_company_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Remove duplicates (due to the join with project_members)
      const uniqueProjects = Array.from(new Set(data.map((p: any) => p.id)))
        .map(id => data.find((p: any) => p.id === id));
        
      setProjects(uniqueProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all projects {profile?.role === 'team' ? 'you are assigned to' : 'in the system'}.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {(profile?.role === 'admin') && (
            <Link href="/projects/new" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Project
            </Link>
          )}
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
            placeholder="Search projects"
          />
        </div>
        <div className="sm:w-64">
          <select
            id="status-filter"
            name="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Client</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Deadline</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {project.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {project.client_companies?.name || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(project.status)}`}>
                            {formatStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View<span className="sr-only">, {project.name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No projects found
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