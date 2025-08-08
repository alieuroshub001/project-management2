'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tab } from '@headlessui/react';
import { PencilIcon, TrashIcon, UserPlusIcon, DocumentIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !profile) {
      router.push('/auth/login');
      return;
    }

    fetchProjectData();
  }, [user, profile, authLoading, router, params.id]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client_companies(id, name, contact_name, contact_email)
        `)
        .eq('id', params.id)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error('Project not found');

      // Check if user has access to this project
      if (profile?.role !== 'admin' && profile?.role !== 'hr') {
        if (profile?.role === 'team') {
          // Check if user is a member of this project
          const { data: memberData, error: memberError } = await supabase
            .from('project_members')
            .select('*')
            .eq('project_id', params.id)
            .eq('profile_id', user?.id)
            .single();

          if (memberError || !memberData) {
            router.push('/projects');
            return;
          }
        } else if (profile?.role === 'client') {
          // Check if project belongs to client's company
          if (projectData.client_company_id !== profile.client_company_id) {
            router.push('/projects');
            return;
          }
        }
      }

      setProject(projectData);

      // Fetch project tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles(id, full_name, avatar_url)
        `)
        .eq('project_id', params.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch project members
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles(id, full_name, avatar_url, job_title, role)
        `)
        .eq('project_id', params.id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch project documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select(`
          *,
          profiles(id, full_name)
        `)
        .eq('project_id', params.id)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

      // Fetch time entries
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select(`
          *,
          profiles(id, full_name),
          tasks(id, title)
        `)
        .eq('project_id', params.id)
        .order('date', { ascending: false });

      if (timeError) throw timeError;
      setTimeEntries(timeData || []);

    } catch (error: any) {
      console.error('Error fetching project data:', error);
      setError(error.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      router.push('/projects');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.hours, 0).toFixed(1);
  };

  const calculateTaskCompletion = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
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

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => router.push('/projects')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                >
                  Go back to projects
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            {project.name}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(project.status)}`}>
                {formatStatusLabel(project.status)}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              Client: {project.client_companies?.name || 'N/A'}
            </div>
            {project.deadline && (
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                Deadline: {formatDate(project.deadline)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex lg:mt-0 lg:ml-4">
          {(profile?.role === 'admin') && (
            <>
              <span className="hidden sm:block ml-3">
                <Link
                  href={`/projects/${params.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  Edit
                </Link>
              </span>

              <span className="hidden sm:block ml-3">
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  Delete
                </button>
              </span>
            </>
          )}

          {(profile?.role === 'admin' || profile?.role === 'team') && (
            <span className="sm:ml-3">
              <Link
                href={`/projects/${params.id}/tasks/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Task
              </Link>
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Project Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Details and information about the project.</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">{project.description}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.client_companies?.name || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Client Contact</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {project.client_companies?.contact_name ? (
                  <>
                    {project.client_companies.contact_name}<br />
                    <a href={`mailto:${project.client_companies.contact_email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      {project.client_companies.contact_email}
                    </a>
                  </>
                ) : 'N/A'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.start_date ? formatDate(project.start_date) : 'Not set'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.deadline ? formatDate(project.deadline) : 'No deadline'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${calculateTaskCompletion()}%` }}
                    ></div>
                  </div>
                  <span className="ml-2">{calculateTaskCompletion()}%</span>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-indigo-50 dark:bg-gray-700/50 p-1">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700 dark:text-indigo-200
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'hover:bg-white/[0.12] dark:hover:bg-gray-700 hover:text-indigo-600'}`
              }
            >
              Tasks ({tasks.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700 dark:text-indigo-200
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'hover:bg-white/[0.12] dark:hover:bg-gray-700 hover:text-indigo-600'}`
              }
            >
              Team ({members.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700 dark:text-indigo-200
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'hover:bg-white/[0.12] dark:hover:bg-gray-700 hover:text-indigo-600'}`
              }
            >
              Documents ({documents.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700 dark:text-indigo-200
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'hover:bg-white/[0.12] dark:hover:bg-gray-700 hover:text-indigo-600'}`
              }
            >
              Time ({calculateTotalHours()} hrs)
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tasks</h3>
                {(profile?.role === 'admin' || profile?.role === 'team') && (
                  <Link
                    href={`/projects/${params.id}/tasks/new`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                    Add Task
                  </Link>
                )}
              </div>
              {tasks.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Title</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Assignee</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {task.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {task.profiles?.full_name || 'Unassigned'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(task.status)}`}>
                              {formatStatusLabel(task.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {task.due_date ? formatDate(task.due_date) : 'No due date'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link href={`/projects/${params.id}/tasks/${task.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              View<span className="sr-only">, {task.title}</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new task.</p>
                  {(profile?.role === 'admin' || profile?.role === 'team') && (
                    <div className="mt-6">
                      <Link
                        href={`/projects/${params.id}/tasks/new`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        New Task
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Tab.Panel>

            <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Members</h3>
                {profile?.role === 'admin' && (
                  <Link
                    href={`/projects/${params.id}/members/add`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <UserPlusIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                    Add Member
                  </Link>
                )}
              </div>
              {members.length > 0 ? (
                <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <li key={member.id} className="col-span-1 bg-white dark:bg-gray-700 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-600">
                      <div className="w-full flex items-center justify-between p-6 space-x-6">
                        <div className="flex-1 truncate">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-gray-900 dark:text-white text-sm font-medium truncate">{member.profiles?.full_name}</h3>
                            <span className="flex-shrink-0 inline-block px-2 py-0.5 text-green-800 text-xs font-medium bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-300">
                              {member.profiles?.role}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm truncate">{member.profiles?.job_title}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {member.profiles?.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={member.profiles.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {member.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-600">
                          <div className="w-0 flex-1 flex">
                            <Link
                              href={`/team/${member.profiles?.id}`}
                              className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 dark:text-gray-300 font-medium border border-transparent rounded-bl-lg hover:text-gray-500 dark:hover:text-white"
                            >
                              View Profile
                            </Link>
                          </div>
                          {profile?.role === 'admin' && (
                            <div className="-ml-px w-0 flex-1 flex">
                              <button
                                onClick={() => {
                                  // Handle remove member
                                  if (confirm(`Remove ${member.profiles?.full_name} from this project?`)) {
                                    // Remove logic here
                                  }
                                }}
                                className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-red-700 dark:text-red-400 font-medium border border-transparent rounded-br-lg hover:text-red-500 dark:hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No team members</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a team member to this project.</p>
                  {profile?.role === 'admin' && (
                    <div className="mt-6">
                      <Link
                        href={`/projects/${params.id}/members/add`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Team Member
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Tab.Panel>

            <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Documents</h3>
                {(profile?.role === 'admin' || profile?.role === 'team') && (
                  <Link
                    href={`/projects/${params.id}/documents/upload`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <DocumentIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                    Upload Document
                  </Link>
                )}
              </div>
              {documents.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Uploaded By</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {documents.map((doc) => (
                        <tr key={doc.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {doc.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {doc.file_type}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {doc.profiles?.full_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              Download<span className="sr-only">, {doc.name}</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by uploading a document.</p>
                  {(profile?.role === 'admin' || profile?.role === 'team') && (
                    <div className="mt-6">
                      <Link
                        href={`/projects/${params.id}/documents/upload`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <DocumentIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Upload Document
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Tab.Panel>

            <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Time Entries</h3>
                {(profile?.role === 'admin' || profile?.role === 'team') && (
                  <Link
                    href={`/projects/${params.id}/time/log`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ClockIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                    Log Time
                  </Link>
                )}
              </div>
              {timeEntries.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Date</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Task</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Hours</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {timeEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {formatDate(entry.date)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {entry.profiles?.full_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {entry.tasks?.title || 'General'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {entry.hours}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {entry.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No time entries</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by logging time for this project.</p>
                  {(profile?.role === 'admin' || profile?.role === 'team') && (
                    <div className="mt-6">
                      <Link
                        href={`/projects/${params.id}/time/log`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Log Time
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
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