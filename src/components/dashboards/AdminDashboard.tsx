'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  ClipboardDocumentListIcon, 
  BuildingOfficeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AdminDashboardProps {
  userId: string;
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const supabase = createBrowserClient();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    totalTeamMembers: 0,
    totalClients: 0,
    totalInvoices: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch statistics
        const [projectsResponse, tasksResponse, teamResponse, clientsResponse, invoicesResponse] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact' }),
          supabase.from('tasks').select('id', { count: 'exact' }),
          supabase.from('profiles').select('id').eq('role', 'team'),
          supabase.from('profiles').select('id').eq('role', 'client'),
          supabase.from('invoices').select('id', { count: 'exact' }),
        ]);

        // Fetch recent projects
        const { data: projects } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            profiles(full_name, email)
          `)
          .eq('profiles.id', 'client_id')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            status,
            priority,
            due_date,
            projects(name),
            profiles(full_name, email)
          `)
          .eq('profiles.id', 'assignee_id')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalProjects: projectsResponse.count || 0,
          totalTasks: tasksResponse.count || 0,
          totalTeamMembers: teamResponse.data?.length || 0,
          totalClients: clientsResponse.data?.length || 0,
          totalInvoices: invoicesResponse.count || 0,
        });

        setRecentProjects(projects || []);
        setRecentTasks(tasks || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, userId]);

  // Chart data for project status
  const chartData = {
    labels: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Projects by Status',
        data: [5, 8, 2, 10, 1], // Sample data, replace with actual data
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Project Status Distribution',
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
            <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalProjects}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-3 mr-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalTasks}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalTeamMembers}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <BuildingOfficeIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Clients</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalClients}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
            <CurrencyDollarIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Invoices</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalInvoices}</p>
          </div>
        </div>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Project Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Project Status</h2>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Projects</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{project.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {project.profiles?.full_name || project.profiles?.email || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Tasks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.projects?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        task.status === 'todo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {task.profiles?.full_name || task.profiles?.email || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}