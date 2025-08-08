'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Tasks() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !profile) {
      router.push('/auth/login');
      return;
    }

    fetchTasks();
    fetchProjects();
  }, [user, profile, authLoading, router]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects(id, name),
          profiles(id, full_name, avatar_url)
        `);

      // Filter by user role
      if (profile?.role === 'admin' || profile?.role === 'hr') {
        // Admins and HR can see all tasks
      } else if (profile?.role === 'team') {
        // Team members can only see tasks assigned to them or unassigned tasks in their projects
        query = query.or(`assignee_id.eq.${user?.id},assignee_id.is.null`);
      } else if (profile?.role === 'client') {
        // Clients can only see tasks in their projects
        const { data: clientProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('client_company_id', profile?.client_company_id);
        
        if (clientProjects && clientProjects.length > 0) {
          const projectIds = clientProjects.map(p => p.id);
          query = query.in('project_id', projectIds);
        } else {
          // If client has no projects, return empty array
          setTasks([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      let query = supabase.from('projects').select('id, name');

      // Filter by user role
      if (profile?.role === 'team') {
        // Team members can only see projects they are members of
        const { data: memberProjects } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('profile_id', user?.id);
        
        if (memberProjects && memberProjects.length > 0) {
          const projectIds = memberProjects.map(p => p.project_id);
          query = query.in('id', projectIds);
        }
      } else if (profile?.role === 'client') {
        // Clients can only see their projects
        query = query.eq('client_company_id', profile?.client_company_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesProject = projectFilter === 'all' || task.project_id === parseInt(projectFilter);
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Check if date is in the past
    if (date < today) {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      );
    }
    
    // Check if date is today
    if (date.getTime() === today.getTime()) {
      return (
        <span className="text-orange-600 dark:text-orange-400 font-medium">
          Today
        </span>
      );
    }
    
    // Check if date is tomorrow
    if (date.getTime() === tomorrow.getTime()) {
      return (
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
          Tomorrow
        </span>
      );
    }
    
    // Check if date is within the next week
    if (date < nextWeek) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Otherwise, return the date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {profile?.role === 'team' 
              ? 'A list of all tasks assigned to you or available for assignment.'
              : 'A list of all tasks across projects.'}
          </p>
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
            placeholder="Search tasks"
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
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="sm:w-64">
          <select
            id="project-filter"
            name="project-filter"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
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
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Task</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Project</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Assignee</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Priority</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <tr key={task.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {task.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <Link href={`/projects/${task.project_id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            {task.projects?.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {task.profiles ? (
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0">
                                {task.profiles.avatar_url ? (
                                  <img className="h-8 w-8 rounded-full" src={task.profiles.avatar_url} alt="" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                      {task.profiles.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                {task.profiles.full_name}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(task.status)}`}>
                            {formatStatusLabel(task.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(task.due_date)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/projects/${task.project_id}/tasks/${task.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View<span className="sr-only">, {task.title}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No tasks found
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