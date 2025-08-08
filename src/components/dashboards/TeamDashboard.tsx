'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { 
  ClipboardDocumentListIcon, 
  ClockIcon, 
  BriefcaseIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TeamDashboardProps {
  userId: string;
}

export default function TeamDashboard({ userId }: TeamDashboardProps) {
  const supabase = createBrowserClient();
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    activeProjects: 0,
    totalTimeLogged: 0,
    comments: 0,
  });
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [recentTimeEntries, setRecentTimeEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch statistics
        const [tasksResponse, completedTasksResponse, projectsResponse, timeEntriesResponse, commentsResponse] = await Promise.all([
          supabase.from('tasks').select('id').eq('assignee_id', userId),
          supabase.from('tasks').select('id').eq('assignee_id', userId).eq('status', 'completed'),
          supabase.from('project_members').select('project_id').eq('user_id', userId),
          supabase.from('time_entries').select('duration').eq('user_id', userId),
          supabase.from('comments').select('id').eq('user_id', userId),
        ]);

        // Calculate total time logged (in hours)
        const totalTimeInMinutes = timeEntriesResponse.data?.reduce((acc, entry) => acc + (entry.duration || 0), 0) || 0;
        const totalTimeInHours = Math.round((totalTimeInMinutes / 60) * 10) / 10; // Round to 1 decimal place

        // Fetch my tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            due_date,
            project_id,
            projects(name)
          `)
          .eq('assignee_id', userId)
          .order('due_date', { ascending: true })
          .limit(5);

        // Fetch my projects
        const { data: projectMembers } = await supabase
          .from('project_members')
          .select(`
            project_id,
            role,
            projects(id, name, description, status, start_date, end_date)
          `)
          .eq('user_id', userId)
          .limit(5);

        const projects = projectMembers?.map(pm => ({
          ...pm.projects,
          role: pm.role
        })) || [];

        // Fetch recent time entries
        const { data: timeEntries } = await supabase
          .from('time_entries')
          .select(`
            id,
            task_id,
            tasks(title, project_id, projects(name)),
            description,
            start_time,
            end_time,
            duration
          `)
          .eq('user_id', userId)
          .order('start_time', { ascending: false })
          .limit(5);

        setStats({
          assignedTasks: tasksResponse.data?.length || 0,
          completedTasks: completedTasksResponse.data?.length || 0,
          activeProjects: projectsResponse.data?.length || 0,
          totalTimeLogged: totalTimeInHours,
          comments: commentsResponse.data?.length || 0,
        });

        setMyTasks(tasks || []);
        setMyProjects(projects || []);
        setRecentTimeEntries(timeEntries || []);
      } catch (error) {
        console.error('Error fetching team dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, userId]);

  // Task status distribution chart data
  const taskStatusChartData = {
    labels: ['To Do', 'In Progress', 'Review', 'Completed'],
    datasets: [
      {
        label: 'Tasks by Status',
        data: [
          myTasks.filter(task => task.status === 'todo').length,
          myTasks.filter(task => task.status === 'in_progress').length,
          myTasks.filter(task => task.status === 'review').length,
          myTasks.filter(task => task.status === 'completed').length,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Time logged by project chart data
  const timeByProjectChartData = {
    labels: ['Project A', 'Project B', 'Project C', 'Project D', 'Project E'],
    datasets: [
      {
        label: 'Hours Logged',
        data: [12, 8, 5, 7, 3], // Sample data, replace with actual data
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Team Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Tasks</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.assignedTasks}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.completedTasks}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-3 mr-4">
            <BriefcaseIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.activeProjects}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Time Logged</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalTimeLogged}h</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.comments}</p>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">My Tasks by Status</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-3/4 h-full">
              <Pie data={taskStatusChartData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        {/* Time Logged Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Time Logged by Project</h2>
          <div className="h-64">
            <Bar data={timeByProjectChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* My Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">My Tasks</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {myTasks.length > 0 ? (
                myTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.projects?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        task.status === 'review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No tasks assigned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* My Projects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">My Projects</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProjects.length > 0 ? (
            myProjects.map((project) => (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">{project.name}</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Role: {project.role || 'Member'}</span>
                  <span>
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} - 
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              No projects assigned
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Time Entries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Time Entries</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTimeEntries.length > 0 ? (
                recentTimeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {entry.tasks?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.tasks?.projects?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.start_time ? new Date(entry.start_time).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.duration ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m` : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No time entries found
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