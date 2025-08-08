'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { 
  BriefcaseIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface ClientDashboardProps {
  userId: string;
}

export default function ClientDashboard({ userId }: ClientDashboardProps) {
  const supabase = createBrowserClient();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalInvoices: 0,
    totalDocuments: 0,
  });
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get client profile to find client_company_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, client_company_id')
          .eq('id', userId)
          .single();

        const clientCompanyId = profile?.client_company_id;

        if (!clientCompanyId) {
          console.error('Client company ID not found');
          setIsLoading(false);
          return;
        }

        // Fetch statistics
        const [projectsResponse, activeProjectsResponse, completedProjectsResponse, invoicesResponse, documentsResponse] = await Promise.all([
          supabase.from('projects').select('id').eq('client_id', clientCompanyId),
          supabase.from('projects').select('id').eq('client_id', clientCompanyId).eq('status', 'in_progress'),
          supabase.from('projects').select('id').eq('client_id', clientCompanyId).eq('status', 'completed'),
          supabase.from('invoices').select('id').eq('client_id', clientCompanyId),
          supabase.from('documents').select('id').eq('client_id', clientCompanyId),
        ]);

        // Fetch client projects
        const { data: projects } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            budget,
            created_at
          `)
          .eq('client_id', clientCompanyId)
          .order('created_at', { ascending: false });

        // Fetch invoices
        const { data: clientInvoices } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            issue_date,
            due_date,
            total_amount,
            status,
            project_id,
            projects(name)
          `)
          .eq('client_id', clientCompanyId)
          .order('issue_date', { ascending: false })
          .limit(5);

        // Fetch documents
        const { data: clientDocuments } = await supabase
          .from('documents')
          .select(`
            id,
            name,
            file_path,
            file_type,
            file_size,
            project_id,
            projects(name),
            uploaded_at,
            uploaded_by,
            profiles(full_name)
          `)
          .eq('client_id', clientCompanyId)
          .order('uploaded_at', { ascending: false })
          .limit(5);

        setStats({
          totalProjects: projectsResponse.data?.length || 0,
          activeProjects: activeProjectsResponse.data?.length || 0,
          completedProjects: completedProjectsResponse.data?.length || 0,
          totalInvoices: invoicesResponse.data?.length || 0,
          totalDocuments: documentsResponse.data?.length || 0,
        });

        setClientProjects(projects || []);
        setInvoices(clientInvoices || []);
        setDocuments(clientDocuments || []);
      } catch (error) {
        console.error('Error fetching client dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, userId]);

  // Project status chart data
  const projectStatusChartData = {
    labels: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Projects by Status',
        data: [
          clientProjects.filter(project => project.status === 'planning').length,
          clientProjects.filter(project => project.status === 'in_progress').length,
          clientProjects.filter(project => project.status === 'on_hold').length,
          clientProjects.filter(project => project.status === 'completed').length,
          clientProjects.filter(project => project.status === 'cancelled').length,
        ],
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
        position: 'right' as const,
      },
    },
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Client Dashboard</h1>
      
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
            <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.activeProjects}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.completedProjects}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <CurrencyDollarIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Invoices</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalInvoices}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
            <DocumentTextIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalDocuments}</p>
          </div>
        </div>
      </div>
      
      {/* Project Status Chart and Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Project Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Project Status</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-3/4 h-full">
              <Doughnut data={projectStatusChartData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        {/* Projects List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">My Projects</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View All
            </button>
          </div>
          <div className="overflow-y-auto max-h-64">
            {clientProjects.length > 0 ? (
              <div className="space-y-3">
                {clientProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white">{project.name}</h3>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        project.status === 'on_hold' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        project.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} - 
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                      </span>
                      {project.budget && (
                        <span>Budget: {formatCurrency(project.budget)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                No projects found
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Invoices */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Invoices</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {invoice.projects?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(invoice.total_amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Documents</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uploaded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {documents.length > 0 ? (
                documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {document.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.projects?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.file_type || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.file_size ? formatFileSize(document.file_size) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No documents found
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