'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  ClockIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface HRDashboardProps {
  userId: string;
}

export default function HRDashboard({ userId }: HRDashboardProps) {
  const supabase = createBrowserClient();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    newHires: 0,
    pendingLeaveRequests: 0,
    departments: 0,
    averageAttendance: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch statistics
        const [employeesResponse, departmentsResponse, leaveRequestsResponse] = await Promise.all([
          supabase.from('employee_records').select('id, hire_date', { count: 'exact' }),
          supabase.from('departments').select('id', { count: 'exact' }),
          supabase.from('leave_requests').select('id, status').eq('status', 'pending'),
        ]);

        // Calculate new hires (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newHiresCount = employeesResponse.data?.filter(emp => {
          const hireDate = new Date(emp.hire_date);
          return hireDate >= thirtyDaysAgo;
        }).length || 0;

        // Fetch recent employees
        const { data: employees } = await supabase
          .from('employee_records')
          .select(`
            id,
            employee_id,
            profiles(id, full_name, email, avatar_url),
            department_id,
            departments(name),
            position,
            hire_date,
            status
          `)
          .order('hire_date', { ascending: false })
          .limit(5);

        // Fetch leave requests
        const { data: leaves } = await supabase
          .from('leave_requests')
          .select(`
            id,
            profiles(id, full_name, email, avatar_url),
            leave_type,
            start_date,
            end_date,
            status,
            reason,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalEmployees: employeesResponse.count || 0,
          newHires: newHiresCount,
          pendingLeaveRequests: leaveRequestsResponse.data?.length || 0,
          departments: departmentsResponse.count || 0,
          averageAttendance: 92, // Sample data, replace with actual calculation
        });

        setRecentEmployees(employees || []);
        setLeaveRequests(leaves || []);
      } catch (error) {
        console.error('Error fetching HR dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, userId]);

  // Department distribution chart data
  const departmentChartData = {
    labels: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'],
    datasets: [
      {
        label: 'Employees by Department',
        data: [25, 15, 20, 5, 10, 12], // Sample data, replace with actual data
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Monthly hiring trend chart data
  const hiringTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Hires',
        data: [3, 5, 2, 4, 7, 8, 6, 9, 4, 5, 3, 6], // Sample data, replace with actual data
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Departures',
        data: [1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 2], // Sample data, replace with actual data
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">HR Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
            <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalEmployees}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <UserPlusIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">New Hires (30d)</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.newHires}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-3 mr-4">
            <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Leaves</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.pendingLeaveRequests}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Departments</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.departments}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
            <ClockIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Attendance</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.averageAttendance}%</p>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Department Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-3/4 h-full">
              <Doughnut data={departmentChartData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        {/* Hiring Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Hiring Trends (This Year)</h2>
          <div className="h-64">
            <Line data={hiringTrendData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Recent Employees */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Employees</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hire Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentEmployees.length > 0 ? (
                recentEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {employee.profiles?.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={employee.profiles.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {employee.profiles?.full_name?.charAt(0) || employee.profiles?.email?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.profiles?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.profiles?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.employee_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.departments?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.position || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        employee.status === 'terminated' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {employee.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Leave Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Leave Requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((leave) => (
                  <tr key={leave.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {leave.profiles?.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={leave.profiles.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {leave.profiles?.full_name?.charAt(0) || leave.profiles?.email?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {leave.profiles?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {leave.profiles?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {leave.leave_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {leave.end_date ? new Date(leave.end_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {leave.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                            Approve
                          </button>
                          <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No leave requests found
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